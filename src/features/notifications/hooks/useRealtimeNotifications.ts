'use client';

/**
 * SADAF | Real-time Notifications via WebSocket
 *
 * Extends the useNotifications hook with a WebSocket connection that
 * receives real-time notification pushes from the WS server.
 *
 * Transport priority:
 *   1. WebSocket (subscription: `notifications:user:{userId}`)
 *   2. REST polling (fallback every 15s)
 *
 * When a new notification arrives via WS, it is:
 *   - Added to the notification list (via addNotification)
 *   - Pushed as a browser Notification (if permission granted)
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { useNotifications } from './useNotifications';
import type { Notification } from '../types';

// ─── Config ──────────────────────────────────────────────────────────────────

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';
const POLL_INTERVAL_MS = 15_000;
const RECONNECT_DELAY_MS = 3_000;

/** Persisted opt-out for global event pushes (new orders / announcements). */
const GLOBAL_MUTE_STORAGE_KEY = 'sadaf_global_notifications_muted';

function readStoredGlobalMuted(): boolean {
    try {
        return window.localStorage.getItem(GLOBAL_MUTE_STORAGE_KEY) === 'true';
    } catch {
        // Storage may be unavailable (private mode) — default to unmuted.
        return false;
    }
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useRealtimeNotifications(
    userId: string | null,
    initialNotifications: Notification[] = [],
) {
    const {
        notifications,
        allNotifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        addNotification,
        filterType,
        setFilterType,
    } = useNotifications(initialNotifications);

    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const wsConnectedRef = useRef(false);
    const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const [wsLive, setWsLive] = useState(false);

    // Global alerts mute — opt-out, persisted in localStorage (same pattern as
    // useActivityAlerts). When muted, global pushes (new order / announcement)
    // are dropped before they reach the list or the browser Notification.
    const [globalMuted, setGlobalMuted] = useState(false);
    const globalMutedRef = useRef(false);
    // Skips the sync effect's first run (the mount commit): the stored
    // preference is applied by the load effect below, and persisting the
    // default `false` over a stored `true` in that same commit would clobber
    // the user's mute.
    const mutedSyncedRef = useRef(false);

    // Load persisted preference after mount (client-only, avoids SSR mismatch).
    // The ref is seeded here too so no global push slips through before the
    // loaded value reaches state.
    useEffect(() => {
        const stored = readStoredGlobalMuted();
        setGlobalMuted(stored);
        globalMutedRef.current = stored;
    }, []);

    // Keep the ref in sync and persist every change after hydration.
    useEffect(() => {
        if (!mutedSyncedRef.current) {
            mutedSyncedRef.current = true;
            return;
        }
        globalMutedRef.current = globalMuted;
        try {
            window.localStorage.setItem(GLOBAL_MUTE_STORAGE_KEY, String(globalMuted));
        } catch {
            // Storage unavailable — the toggle still works for this session.
        }
    }, [globalMuted]);

    const toggleGlobalMuted = useCallback(() => {
        setGlobalMuted((prev) => !prev);
    }, []);

    // ─── WebSocket connection ────────────────────────────────────────────────

    const connectWS = useCallback(() => {
        if (!userId || wsConnectedRef.current) return;

        try {
            const ws = new WebSocket(WS_URL);
            wsRef.current = ws;

            ws.onopen = () => {
                wsConnectedRef.current = true;
                setWsLive(true);
                // Stop the REST fallback once the socket is live — two sources
                // of truth would double-add the same notifications.
                if (pollIntervalRef.current) {
                    clearInterval(pollIntervalRef.current);
                    pollIntervalRef.current = null;
                }
                // Subscribe to user's notifications endpoint
                const endpointType = `notifications:user:${userId}`;
                ws.send(JSON.stringify({
                    action: 'subscribe',
                    endpoints: [endpointType, 'notifications:global'],
                }));
            };

            ws.onmessage = (event) => {
                try {
                    const msg = JSON.parse(event.data as string);

                    // Only handle notification messages
                    if (msg.type !== 'notification' && !msg.type?.startsWith('notifications:')) return;

                    // Global pushes (new order / announcement) respect the mute
                    // toggle — dropped silently before the list or the browser
                    // Notification when the user muted global alerts.
                    const isGlobal = msg.type === 'notifications:global';
                    if (isGlobal && globalMutedRef.current) return;

                    const incoming: Notification = msg.data || msg.notification;
                    if (!incoming || !incoming.id) return;

                    // Friend-request pushes are handled exclusively by the header
                    // FriendRequestsBadge (WS-primary on the same channel) —
                    // showing them again in the bell would duplicate the same
                    // event in two places.
                    if (incoming.type === 'friend_request') return;

                    // Add to notification list
                    addNotification(incoming);

                    // Browser Notification API (optional push notification)
                    if ('Notification' in window && Notification.permission === 'granted') {
                        new Notification(`SADAF: ${incoming.title}`, {
                            body: incoming.message,
                            icon: '/favicon.ico',
                        });
                    }
                } catch {
                    // Ignore malformed messages
                }
            };

            ws.onclose = () => {
                wsConnectedRef.current = false;
                setWsLive(false);
                // Auto-reconnect
                reconnectTimeoutRef.current = setTimeout(connectWS, RECONNECT_DELAY_MS);
            };

            ws.onerror = () => {
                // onclose fires after onerror
            };
        } catch {
            // WS unavailable — fall back to polling
            setWsLive(false);
            reconnectTimeoutRef.current = setTimeout(connectWS, RECONNECT_DELAY_MS);
        }
    }, [userId, addNotification]);

    // ─── REST polling fallback ──────────────────────────────────────────────

    const startPolling = useCallback(() => {
        if (!userId) return;

        const poll = async () => {
            try {
                const res = await fetch(`/api/notifications?userId=${userId}`);
                if (!res.ok) return;
                const data = await res.json();
                if (Array.isArray(data.notifications)) {
                    // The fallback feeds the same global feed as the WebSocket
                    // path — respect the global mute so muted users stay
                    // silent here too.
                    if (globalMutedRef.current) return;
                    data.notifications.forEach((n: Notification) => addNotification(n));
                }
            } catch {
                // Silently retry
            }
        };

        poll();
        pollIntervalRef.current = setInterval(poll, POLL_INTERVAL_MS);
    }, [userId, addNotification]);

    // ─── Lifecycle ───────────────────────────────────────────────────────────

    useEffect(() => {
        if (!userId) return;

        // Request browser notification permission
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission().catch(() => {});
        }

        connectWS();

        // Fallback: start polling after 5s if WS didn't connect
        const fallbackTimer = setTimeout(() => {
            if (!wsConnectedRef.current) {
                console.log('   ⚠️ WS not connected — starting fallback polling for notifications');
                startPolling();
            }
        }, 5_000);

        return () => {
            clearTimeout(fallbackTimer);
            clearTimeout(reconnectTimeoutRef.current ?? undefined);
            clearInterval(pollIntervalRef.current ?? undefined);
            if (wsRef.current) {
                wsRef.current.onopen = null;
                wsRef.current.onmessage = null;
                wsRef.current.onclose = null;
                wsRef.current.onerror = null;
                wsRef.current.close();
                wsRef.current = null;
            }
            wsConnectedRef.current = false;
            setWsLive(false);
        };
    }, [userId, connectWS, startPolling]);

    return {
        notifications,
        allNotifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        filterType,
        setFilterType,
        wsLive,
        globalMuted,
        toggleGlobalMuted,
    };
}
