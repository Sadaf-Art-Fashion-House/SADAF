'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { RewardsData } from '../types';

// ─── Config ──────────────────────────────────────────────────────────────────

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';
const POLL_INTERVAL_MS = 30_000;
const RECONNECT_DELAY_MS = 3_000;

/**
 * useRewards — real-time loyalty rewards for the logged-in customer
 * (points, tier, benefits ladder, leaderboard rank).
 *
 * Transport priority:
 *   1. WebSocket (subscription: `personal:user:{userId}` — the WS server
 *      pushes a `rewards` payload whenever points/tier/rank change)
 *   2. REST polling (fallback every 30s via /api/dashboard/rewards)
 *
 * The WS server fetches the same /api/dashboard/rewards route, so the tier
 * math lives in exactly one place and the two transports stay in sync.
 */
export function useRewards(userId: string | null) {
    const [data, setData] = useState<RewardsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [wsLive, setWsLive] = useState(false);

    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const abortRef = useRef<AbortController | null>(null);
    const wsConnectedRef = useRef(false);

    // ─── Apply incoming rewards payload ─────────────────────────────────────

    const applyRewards = useCallback((rewards: RewardsData) => {
        if (!rewards || typeof rewards.points !== 'number') return;
        setData(rewards);
        setError(null);
        setLoading(false);
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

                    // Only handle rewards messages for this user
                    if (msg.type !== `personal:user:${userId}`) return;
                    if (!msg.rewards) return;

                    applyRewards(msg.rewards as RewardsData);
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
    }, [userId, applyRewards]);

    // ─── REST polling fallback ───────────────────────────────────────────────

    const fetchData = useCallback(async () => {
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        try {
            const query = userId ? `?userId=${encodeURIComponent(userId)}` : '';
            const res = await fetch(`/api/dashboard/rewards${query}`, {
                signal: controller.signal,
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const json = await res.json();
            applyRewards(json as RewardsData);
        } catch (err: unknown) {
            if (err instanceof DOMException && err.name === 'AbortError') return;
            setError(err instanceof Error ? err.message : 'Failed to load rewards');
        } finally {
            setLoading(false);
        }
    }, [userId, applyRewards]);

    const startPolling = useCallback(() => {
        if (!userId) return;
        fetchData();
        pollIntervalRef.current = setInterval(fetchData, POLL_INTERVAL_MS);
    }, [userId, fetchData]);

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
                console.log('   ⚠️ WS not connected — starting fallback polling for rewards');
                startPolling();
            }
        }, 5_000);

        return () => {
            clearTimeout(fallbackTimer);
            clearTimeout(reconnectTimeoutRef.current ?? undefined);
            clearInterval(pollIntervalRef.current ?? undefined);
            abortRef.current?.abort();
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

    return { data, loading, error, wsLive, refetch: fetchData };
}
