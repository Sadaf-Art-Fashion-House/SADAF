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
import { useUnreadCountStore } from '../store/useUnreadCountStore';
import { usePreferencesStore, isGlobalAlertsMuted, syncLegacyGlobalMute } from '@/features/settings/store/usePreferencesStore';
import type { Notification } from '../types';

// ─── Config ──────────────────────────────────────────────────────────────────

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';
const POLL_INTERVAL_MS = 15_000;
const RECONNECT_DELAY_MS = 3_000;

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

    // Publish the live unread count to the shared store so other surfaces
    // (sidebar menu badge) mirror the bell without a second WS connection.
    const setUnreadCount = useUnreadCountStore((state) => state.setUnreadCount);
    useEffect(() => {
        setUnreadCount(unreadCount);
    }, [unreadCount, setUnreadCount]);

    // Global alerts mute — SINGLE SOURCE OF TRUTH is the preferences store
    // (set from the Settings hub). The bell toggle mirrors into the store;
    // the legacy localStorage key is honored once at mount for users who
    // muted before the settings hub existed. When muted, global pushes (new
    // order / announcement) are dropped before they reach the list.
    const globalAlertsPref = usePreferencesStore((state) => state.preferences.globalAlerts);
    const setPreference = usePreferencesStore((state) => state.setPreference);

    const [globalMuted, setGlobalMuted] = useState(() => !globalAlertsPref);
    const globalMutedRef = useRef(globalMuted);

    // Hydrate once: preferences store first, legacy bell key as fallback.
    useEffect(() => {
        const muted = isGlobalAlertsMuted();
        setGlobalMuted(muted);
        globalMutedRef.current = muted;
        // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only hydration
    }, []);

    // React to settings-hub changes (same tab + other tabs via the store).
    useEffect(() => {
        setGlobalMuted(!globalAlertsPref);
        globalMutedRef.current = !globalAlertsPref;
    }, [globalAlertsPref]);

    // Keep the ref in sync and mirror to the legacy key so any external
    // reader (older code) sees the same state.
    useEffect(() => {
        globalMutedRef.current = globalMuted;
        syncLegacyGlobalMute(globalMuted);
    }, [globalMuted]);

    const toggleGlobalMuted = useCallback(() => {
        setGlobalMuted((prev) => {
            const next = !prev;
            // Mirror the toggle into the preferences store (source of truth).
            setPreference('globalAlerts', !next);
            return next;
        });
    }, [setPreference]);

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

                    // Add to notification list. OS-level browser notifications
                    // are raised by the global BrowserNotificationsBridge (the
                    // single sink, mounted on every page) — not here, so a
                    // push is never shown twice.
                    addNotification(incoming);
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

        connectWS();

        // Hydrate real atelier team events (owner + collaborators) on mount.
        // The WS push is fire-and-forget to currently-subscribed clients, so
        // an event created while this page was closed would otherwise be
        // missed. The REST API merges those events; we only take the
        // `atelier-event-` items and addNotification dedupes by id, so the
        // demo global feed never gets duplicated.
        const hydrateAtelierEvents = async () => {
            try {
                const res = await fetch(`/api/notifications?userId=${userId}`);
                if (!res.ok) return;
                const data = await res.json();
                if (!Array.isArray(data.notifications)) return;
                data.notifications
                    .filter((n: Notification) => n.id?.startsWith('atelier-event-'))
                    .forEach((n: Notification) => addNotification(n));
            } catch {
                // Silent — the WS path or the fallback poll covers it.
            }
        };
        hydrateAtelierEvents();

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
