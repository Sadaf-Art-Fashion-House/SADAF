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

import { useEffect, useRef, useCallback } from 'react';
import { useNotifications } from './useNotifications';
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

    // ─── WebSocket connection ────────────────────────────────────────────────

    const connectWS = useCallback(() => {
        if (!userId || wsConnectedRef.current) return;

        try {
            const ws = new WebSocket(WS_URL);
            wsRef.current = ws;

            ws.onopen = () => {
                wsConnectedRef.current = true;
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

                    const incoming: Notification = msg.data || msg.notification;
                    if (!incoming || !incoming.id) return;

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
                // Auto-reconnect
                reconnectTimeoutRef.current = setTimeout(connectWS, RECONNECT_DELAY_MS);
            };

            ws.onerror = () => {
                // onclose fires after onerror
            };
        } catch {
            // WS unavailable — fall back to polling
            reconnectTimeoutRef.current = setTimeout(connectWS, RECONNECT_DELAY_MS);
        }
    }, [userId, addNotification]);

    // ─── REST polling fallback ──────────────────────────────────────────────

    const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const startPolling = useCallback(() => {
        if (!userId) return;

        const poll = async () => {
            try {
                const res = await fetch(`/api/notifications?userId=${userId}`);
                if (!res.ok) return;
                const data = await res.json();
                if (Array.isArray(data.notifications)) {
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
    };
}
