'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { LeaderboardData, LeaderboardEntry, LeaderboardKind } from '../types';
import { tierForSpend } from '../utils/leaderboard';

/**
 * useLeaderboard — streams the full leaderboard (top members ranked by the
 * requested metric kind, including the current user's rank) in real time.
 *
 * Transport priority:
 *   1. WebSocket (global channel `leaderboard:global`) — the server pushes
 *      fresh leaderboards per kind whenever someone shops, so ranks move
 *      without a refresh.
 *   2. REST polling (fallback every 30s via /api/dashboard/leaderboard).
 *
 * The global WS payload carries a generic "You" row (no userId), so this
 * hook re-derives the logged-in user's own row + rank from their points
 * (captured by the user-scoped REST fetch) — overtakes move your rank live,
 * and the highlight row always points at the real user.
 */
export function useLeaderboard(userId: string | null, size = 100, kind: LeaderboardKind = 'points') {
    const [data, setData] = useState<LeaderboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [wsLive, setWsLive] = useState(false);

    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const wsConnectedRef = useRef(false);
    const pollStartedRef = useRef(false);
    const abortRef = useRef<AbortController | null>(null);
    // Active kind, read inside the WS handler so switching kinds does not
    // tear down the socket — the server already pushes all kinds globally.
    const kindRef = useRef<LeaderboardKind>(kind);
    // The logged-in user's own metric (points/sales/designs), captured from
    // the user-scoped REST fetch. Used to re-derive their live rank.
    const userMetricRef = useRef<number | null>(null);

    kindRef.current = kind;

    // ─── REST polling (user-scoped — source of truth for the user's metric) ──

    const fetchData = useCallback(async () => {
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        try {
            const params = new URLSearchParams({ size: String(size), kind: kindRef.current });
            if (userId) params.set('userId', userId);
            const res = await fetch(`/api/dashboard/leaderboard?${params.toString()}`, {
                signal: controller.signal,
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const json = await res.json() as LeaderboardData;
            const ownRow = json.entries.find((entry) => entry.isCurrentUser);
            if (ownRow) userMetricRef.current = ownRow.points;
            setData(json);
            setError(null);
        } catch (err: unknown) {
            if (err instanceof DOMException && err.name === 'AbortError') return;
            setError(err instanceof Error ? err.message : 'Failed to load leaderboard');
        } finally {
            setLoading(false);
        }
    }, [userId, size]);

    const startPolling = useCallback(() => {
        if (!userId || pollStartedRef.current) return;
        pollStartedRef.current = true;
        fetchData();
        pollIntervalRef.current = setInterval(fetchData, 30_000);
    }, [userId, fetchData]);

    // ─── WebSocket connection (leaderboard:global) ───────────────────────────

    const connectWS = useCallback(() => {
        if (!userId || wsConnectedRef.current) return;

        try {
            const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';
            const ws = new WebSocket(wsUrl);
            wsRef.current = ws;

            ws.onopen = () => {
                wsConnectedRef.current = true;
                setWsLive(true);
                setLoading(false);
                // Once the socket is live, stop the REST fallback to avoid
                // two sources of truth racing.
                if (pollIntervalRef.current) {
                    clearInterval(pollIntervalRef.current);
                    pollIntervalRef.current = null;
                }
                pollStartedRef.current = false;
                ws.send(JSON.stringify({
                    action: 'subscribe',
                    endpoints: ['leaderboard:global'],
                }));
            };

            ws.onmessage = (event) => {
                try {
                    const msg = JSON.parse(event.data as string);

                    // Only handle leaderboard payloads for this page's kind.
                    if (msg.type !== 'leaderboard:global') return;
                    if (msg.kind !== kindRef.current) return;
                    if (!msg.leaderboard || !Array.isArray(msg.leaderboard.entries)) return;

                    setData((prev) => {
                        const incoming = msg.leaderboard as LeaderboardData;
                        if (!prev) return incoming;

                        const poolWithoutUser = incoming.entries.filter((entry) => !entry.isCurrentUser);
                        const ownMetric = userMetricRef.current;

                        // Re-derive the user's own row + rank from their metric
                        // so an overtake moves the rank live.
                        if (ownMetric === null) {
                            return {
                                ...prev,
                                kind: kindRef.current,
                                entries: poolWithoutUser,
                                totalMembers: incoming.totalMembers ?? prev.totalMembers,
                                timestamp: incoming.timestamp,
                            };
                        }

                        const ownRank = 1 + poolWithoutUser.filter((entry) => entry.points > ownMetric).length;
                        const ownEntry: LeaderboardEntry = {
                            rank: ownRank,
                            name: 'You',
                            points: ownMetric,
                            tier: tierForSpend(ownMetric),
                            isCurrentUser: true,
                        };
                        const entries: LeaderboardEntry[] = [
                            ...poolWithoutUser.slice(0, ownRank - 1),
                            ownEntry,
                            ...poolWithoutUser.slice(ownRank - 1),
                        ].map((entry, index) => ({ ...entry, rank: index + 1 }));

                        return {
                            ...prev,
                            kind: kindRef.current,
                            entries,
                            totalMembers: incoming.totalMembers ?? prev.totalMembers,
                            myRank: ownRank,
                            timestamp: incoming.timestamp,
                        };
                    });
                    setError(null);
                } catch {
                    // Ignore malformed messages
                }
            };

            ws.onclose = () => {
                wsConnectedRef.current = false;
                setWsLive(false);
                // Fall back to REST polling while the socket is down so the
                // table keeps moving instead of going stale.
                startPolling();
                reconnectTimeoutRef.current = setTimeout(connectWS, 3_000);
            };

            ws.onerror = () => {
                // onclose fires after onerror
            };
        } catch {
            setWsLive(false);
            reconnectTimeoutRef.current = setTimeout(connectWS, 3_000);
        }
    }, [userId, startPolling]);

    // ─── Lifecycle ───────────────────────────────────────────────────────────

    useEffect(() => {
        if (!userId) {
            setLoading(false);
            return;
        }

        connectWS();

        // Initial fallback: start REST polling after 5s if WS never connected.
        fallbackTimerRef.current = setTimeout(() => {
            if (!wsConnectedRef.current) {
                startPolling();
            }
        }, 5_000);

        return () => {
            clearTimeout(fallbackTimerRef.current ?? undefined);
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
            pollStartedRef.current = false;
            setWsLive(false);
        };
    }, [userId, connectWS, startPolling]);

    // Switching kind on the switcher (admin/founder) — refetch the user-scoped
    // data immediately instead of waiting for the next WS push / poll tick.
    useEffect(() => {
        if (userId) fetchData();
    }, [userId, kind, fetchData]);

    return { data, loading, error, wsLive, refetch: fetchData };
}
