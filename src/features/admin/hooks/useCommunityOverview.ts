'use client';

/**
 * SADAF | Admin — Community Overview Hook (WebSocket-primary)
 *
 * Streams the platform-wide community overview (KPIs, top referrers, growth,
 * pending requests, role distribution) for the admin & founder community
 * pages.
 *
 * Transport priority (same pattern as useRewards / useLeaderboard):
 *   1. WebSocket — subscribes to the `community:admin` channel; the WS
 *      server pushes the overview every 10s (fetched from the real
 *      /api/dashboard/community route, so the aggregation math lives in one
 *      place).
 *   2. REST fallback — fetches /api/dashboard/community on mount and polls
 *      every 30s only while the socket is unavailable.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { CommunityOverviewData, PlatformPendingRequest } from '../types';

// ─── Config ──────────────────────────────────────────────────────────────────

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';
const POLL_INTERVAL_MS = 30_000;
const RECONNECT_DELAY_MS = 3_000;

export function useCommunityOverview() {
    const [data, setData] = useState<CommunityOverviewData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [wsLive, setWsLive] = useState(false);
    const [resolvingId, setResolvingId] = useState<string | null>(null);

    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const abortRef = useRef<AbortController | null>(null);
    const wsConnectedRef = useRef(false);

    // ─── Apply incoming overview payload ─────────────────────────────────────

    const applyOverview = useCallback((payload: CommunityOverviewData) => {
        if (!payload || !Array.isArray(payload.kpis)) return;
        setData(payload);
        setError(null);
        setLoading(false);
    }, []);

    // ─── Resolve a pending request (Accept / Decline) ─────────────────────────
    //
    // POSTs to /api/dashboard/community/pending; on success the returned list
    // is applied to the current overview immediately so the UI reacts without
    // waiting for the 10s WS push (which then confirms with the full payload).

    const resolveRequest = useCallback(
        async (id: string, action: 'accept' | 'decline'): Promise<{ ok: boolean; error?: string }> => {
            setResolvingId(id);
            try {
                const res = await fetch('/api/dashboard/community/pending', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id, action }),
                });
                if (!res.ok) {
                    const json = (await res.json().catch(() => null)) as { error?: string } | null;
                    throw new Error(json?.error ?? `HTTP ${res.status}`);
                }
                const json = (await res.json()) as { pendingRequests: PlatformPendingRequest[] };
                setData((current) =>
                    current ? { ...current, pendingRequests: json.pendingRequests } : current,
                );
                setError(null);
                return { ok: true };
            } catch (err: unknown) {
                // Surfaced via the error banner + the action toast in the view
                // — the row stays interactive so the admin can retry.
                const message =
                    err instanceof Error ? err.message : 'Failed to resolve pending request';
                setError(message);
                return { ok: false, error: message };
            } finally {
                setResolvingId(null);
            }
        },
        [],
    );

    // ─── WebSocket connection ────────────────────────────────────────────────

    const connectWS = useCallback(() => {
        if (wsConnectedRef.current) return;

        try {
            const ws = new WebSocket(WS_URL);
            wsRef.current = ws;

            ws.onopen = () => {
                wsConnectedRef.current = true;
                setWsLive(true);
                setLoading(false);
                // Stop the REST fallback once the socket is live — two sources
                // of truth would just overwrite the same data.
                if (pollIntervalRef.current) {
                    clearInterval(pollIntervalRef.current);
                    pollIntervalRef.current = null;
                }
                ws.send(JSON.stringify({
                    action: 'subscribe',
                    endpoints: ['community:admin'],
                }));
            };

            ws.onmessage = (event) => {
                try {
                    const msg = JSON.parse(event.data as string);
                    if (msg.type !== 'community:admin') return;
                    if (!msg.data) return;
                    applyOverview(msg.data as CommunityOverviewData);
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
    }, [applyOverview]);

    // ─── REST polling fallback ───────────────────────────────────────────────

    const fetchData = useCallback(async () => {
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        try {
            const res = await fetch('/api/dashboard/community', { signal: controller.signal });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const json = (await res.json()) as CommunityOverviewData;
            applyOverview(json);
        } catch (err: unknown) {
            if (err instanceof DOMException && err.name === 'AbortError') return;
            setError(err instanceof Error ? err.message : 'Failed to load community overview');
        } finally {
            setLoading(false);
        }
    }, [applyOverview]);

    const startPolling = useCallback(() => {
        fetchData();
        pollIntervalRef.current = setInterval(fetchData, POLL_INTERVAL_MS);
    }, [fetchData]);

    // ─── Lifecycle ───────────────────────────────────────────────────────────

    useEffect(() => {
        connectWS();

        // Fallback: start polling after 5s if WS didn't connect
        const fallbackTimer = setTimeout(() => {
            if (!wsConnectedRef.current) {
                console.log('   ⚠️ WS not connected — starting fallback polling for community overview');
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
    }, [connectWS, startPolling]);

    return { data, loading, error, wsLive, refetch: fetchData, resolveRequest, resolvingId };
}
