'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { LeaderboardData, LeaderboardEntry, LeaderboardKind, OvertakeEvent } from '../types';
import { tierForSpend, CURRENT_USER_CITY } from '../utils/leaderboard';

/** Minimum gap between two overtake alerts (jitter can re-trigger quickly). */
const OVERTAKE_COOLDOWN_MS = 45_000;
/** No re-alert for the same overtaker within this window. */
const OVERTAKER_DEDUPE_MS = 5 * 60_000;

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
    // The logged-in user's own metric (points/sales/designs) and home city,
    // captured from the user-scoped REST fetch. Used to re-derive their live
    // rank and keep their row's city stable across WS merges.
    const userMetricRef = useRef<number | null>(null);
    const userCityRef = useRef<string>('');
    // Last rank the user held, for overtake detection. Null until the first
    // ranking is observed (that one only seeds the baseline, never alerts).
    const lastRankRef = useRef<number | null>(null);
    // Overtake spam guard: the demo pool re-jitters every push (~12s), so
    // members hovering right below the user's threshold can flip across it
    // repeatedly and re-trigger the alert. Cooldown between overtake alerts
    // + no re-alerting the same overtaker within a longer dedupe window.
    const lastOvertakeAtRef = useRef(0);
    const lastOvertakerRef = useRef<string | null>(null);
    const [overtake, setOvertake] = useState<OvertakeEvent | null>(null);

    kindRef.current = kind;

    /**
     * Compare a fresh rank with the last known one. When the user moved DOWN,
     * build the overtake event — the member sitting directly above "You" in
     * the new ranking is the overtaker. The first observation only seeds the
     * baseline and never fires.
     */
    const detectOvertake = useCallback((newRank: number, rankedEntries: LeaderboardEntry[]): OvertakeEvent | null => {
        const previousRank = lastRankRef.current;
        lastRankRef.current = newRank;
        if (previousRank === null || newRank <= previousRank) return null;
        const overtaker = rankedEntries[newRank - 2]; // entry directly above "You"
        if (!overtaker) return null;
        const now = Date.now();
        // Spam guard: within the cooldown, or the same overtaker as the last
        // alert within the dedupe window — skip (see refs above).
        if (now - lastOvertakeAtRef.current < OVERTAKE_COOLDOWN_MS) return null;
        if (lastOvertakerRef.current === overtaker.name && now - lastOvertakeAtRef.current < OVERTAKER_DEDUPE_MS) return null;
        lastOvertakeAtRef.current = now;
        lastOvertakerRef.current = overtaker.name;
        return {
            id: `overtake-${now}-${newRank}`,
            previousRank,
            newRank,
            overtakenBy: overtaker.name,
            timestamp: new Date().toISOString(),
        };
    }, []);

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
            if (ownRow) {
                userMetricRef.current = ownRow.points;
                userCityRef.current = ownRow.city;
            }
            setData(json);
            setError(null);

            // Overtakes are detected on any fresh ranking — the REST fallback
            // included. The first observation only seeds the baseline.
            const freshOvertake = detectOvertake(json.myRank, json.entries);
            if (freshOvertake) setOvertake(freshOvertake);
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

                    const incoming = msg.leaderboard as LeaderboardData;
                    const poolWithoutUser = incoming.entries.filter((entry) => !entry.isCurrentUser);
                    const ownMetric = userMetricRef.current;

                    // Before the user's own metric is known, show the pool
                    // without a "You" row (and skip overtake detection).
                    if (ownMetric === null) {
                        setData((prev) => ({
                            ...(prev ?? incoming),
                            kind: kindRef.current,
                            entries: poolWithoutUser,
                            totalMembers: incoming.totalMembers ?? prev?.totalMembers ?? poolWithoutUser.length,
                            timestamp: incoming.timestamp,
                        }));
                        return;
                    }

                    // Re-derive the user's own row + rank from their metric
                    // so an overtake moves the rank live.
                    const ownRank = 1 + poolWithoutUser.filter((entry) => entry.points > ownMetric).length;
                    const ownEntry: LeaderboardEntry = {
                        rank: ownRank,
                        name: 'You',
                        points: ownMetric,
                        tier: tierForSpend(ownMetric),
                        city: userCityRef.current || CURRENT_USER_CITY,
                        isCurrentUser: true,
                    };
                    const entries: LeaderboardEntry[] = [
                        ...poolWithoutUser.slice(0, ownRank - 1),
                        ownEntry,
                        ...poolWithoutUser.slice(ownRank - 1),
                    ].map((entry, index) => ({ ...entry, rank: index + 1 }));

                    setData((prev) => ({
                        ...(prev ?? incoming),
                        kind: kindRef.current,
                        entries,
                        totalMembers: incoming.totalMembers ?? prev?.totalMembers ?? entries.length,
                        myRank: ownRank,
                        timestamp: incoming.timestamp,
                    }));

                    const freshOvertake = detectOvertake(ownRank, entries);
                    if (freshOvertake) setOvertake(freshOvertake);
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
    // The overtake baseline is reset so the new kind's first observation
    // (a totally different ranking) never fires a false alert.
    useEffect(() => {
        if (!userId) return;
        lastRankRef.current = null;
        fetchData();
    }, [userId, kind, fetchData]);

    return { data, loading, error, wsLive, refetch: fetchData, overtake };
}
