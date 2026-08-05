'use client';

/**
 * SADAF | Orders — Real-time Order Status Hook
 *
 * Streams the logged-in customer's live order transitions (Pending →
 * Tailoring → Shipped → Delivered) in real time.
 *
 * Transport priority:
 *   1. WebSocket (subscription: `personal:user:{userId}` — `orderStatus` payload)
 *   2. REST polling (fallback every 15s via /api/dashboard/order-status)
 *
 * Maintains a per-order latest-status map (statuses) and the transition
 * event list (events, newest first, deduped by id). Mirrors
 * usePersonalActivity / useRealtimeNotifications.
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import type { OrderStatus, OrderStatusEvent } from '../types';

// ─── Config ──────────────────────────────────────────────────────────────────

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';
const POLL_INTERVAL_MS = 15_000;
const RECONNECT_DELAY_MS = 3_000;
const MAX_EVENTS = 30;

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useOrderStatus(userId: string | null) {
    const [statuses, setStatuses] = useState<Record<string, OrderStatus>>({});
    const [events, setEvents] = useState<OrderStatusEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [wsLive, setWsLive] = useState(false);

    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const wsConnectedRef = useRef(false);
    const seenIdsRef = useRef<Set<string>>(new Set());

    // Apply a transition: update the order's status map + prepend the event.
    const applyEvent = useCallback((event: OrderStatusEvent) => {
        if (!event || !event.id || seenIdsRef.current.has(event.id)) return;
        seenIdsRef.current.add(event.id);

        setStatuses((prev) => ({ ...prev, [event.orderId]: event.status }));
        setEvents((prev) => [event, ...prev].slice(0, MAX_EVENTS));
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
                setLoading(false);
                ws.send(JSON.stringify({
                    action: 'subscribe',
                    endpoints: [`personal:user:${userId}`],
                }));
            };

            ws.onmessage = (event) => {
                try {
                    const msg = JSON.parse(event.data as string);

                    // Only handle order-status payloads for this user
                    if (msg.type !== `personal:user:${userId}`) return;
                    if (!msg.orderStatus || !msg.orderStatus.id) return;

                    applyEvent(msg.orderStatus as OrderStatusEvent);
                } catch {
                    // Ignore malformed messages
                }
            };

            ws.onclose = () => {
                wsConnectedRef.current = false;
                setWsLive(false);
                reconnectTimeoutRef.current = setTimeout(connectWS, RECONNECT_DELAY_MS);
            };

            ws.onerror = () => {
                // onclose fires after onerror
            };
        } catch {
            setWsLive(false);
            reconnectTimeoutRef.current = setTimeout(connectWS, RECONNECT_DELAY_MS);
        }
    }, [userId, applyEvent]);

    // ─── REST polling fallback ───────────────────────────────────────────────

    const startPolling = useCallback(() => {
        if (!userId) return;

        const poll = async () => {
            try {
                const res = await fetch(`/api/dashboard/order-status?userId=${encodeURIComponent(userId)}`);
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data = await res.json();
                if (Array.isArray(data.events)) {
                    data.events.forEach((event: OrderStatusEvent) => applyEvent(event));
                }
                setError(null);
            } catch (err: unknown) {
                setError(err instanceof Error ? err.message : 'Failed to load order status');
            } finally {
                setLoading(false);
            }
        };

        poll();
        pollIntervalRef.current = setInterval(poll, POLL_INTERVAL_MS);
    }, [userId, applyEvent]);

    // ─── Lifecycle ───────────────────────────────────────────────────────────

    useEffect(() => {
        if (!userId) {
            setLoading(false);
            return;
        }

        connectWS();

        // Fallback: start polling after 5s if WS didn't connect
        const fallbackTimer = setTimeout(() => {
            if (!wsConnectedRef.current) {
                console.log('   ⚠️ WS not connected — starting fallback polling for order status');
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

    return { statuses, events, loading, error, wsLive };
}
