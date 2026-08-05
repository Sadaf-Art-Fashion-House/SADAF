'use client';

/**
 * SADAF | Customer — Real-time Personal Activity Hook
 *
 * Streams the logged-in customer's personal activity (orders placed,
 * designs saved, wishlist updates, offers) in real time.
 *
 * Transport priority:
 *   1. WebSocket (subscription: `personal:user:{userId}`)
 *   2. REST polling (fallback every 15s via /api/dashboard/personal-activity)
 *
 * Events are deduped by id and kept newest-first, mirroring the
 * useRealtimeNotifications pattern.
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import type { PersonalActivityEvent } from '../types';

// ─── Config ──────────────────────────────────────────────────────────────────

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';
const POLL_INTERVAL_MS = 15_000;
const RECONNECT_DELAY_MS = 3_000;
const MAX_FEED_EVENTS = 30;

// ─── Hook ────────────────────────────────────────────────────────────────────

export function usePersonalActivity(userId: string | null) {
    const [events, setEvents] = useState<PersonalActivityEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [wsLive, setWsLive] = useState(false);

    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const wsConnectedRef = useRef(false);
    const seenIdsRef = useRef<Set<string>>(new Set());

    // Dedupe + prepend fresh events (newest first).
    const appendEvents = useCallback((incoming: PersonalActivityEvent[]) => {
        setEvents((prev) => {
            const fresh = incoming.filter((event) => event && !seenIdsRef.current.has(event.id));
            if (fresh.length === 0) return prev;
            fresh.forEach((event) => seenIdsRef.current.add(event.id));
            return [...fresh, ...prev].slice(0, MAX_FEED_EVENTS);
        });
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

                    // Only handle personal activity messages for this user
                    if (msg.type !== `personal:user:${userId}`) return;
                    if (!msg.activity || !msg.activity.id) return;

                    appendEvents([msg.activity as PersonalActivityEvent]);
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
    }, [userId, appendEvents]);

    // ─── REST polling fallback ───────────────────────────────────────────────

    const startPolling = useCallback(() => {
        if (!userId) return;

        const poll = async () => {
            try {
                const res = await fetch(`/api/dashboard/personal-activity?userId=${encodeURIComponent(userId)}`);
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data = await res.json();
                if (Array.isArray(data.events)) {
                    appendEvents(data.events as PersonalActivityEvent[]);
                }
                setError(null);
            } catch (err: unknown) {
                setError(err instanceof Error ? err.message : 'Failed to load personal activity');
            } finally {
                setLoading(false);
            }
        };

        poll();
        pollIntervalRef.current = setInterval(poll, POLL_INTERVAL_MS);
    }, [userId, appendEvents]);

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
                console.log('   ⚠️ WS not connected — starting fallback polling for personal activity');
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

    return { events, loading, error, wsLive };
}
