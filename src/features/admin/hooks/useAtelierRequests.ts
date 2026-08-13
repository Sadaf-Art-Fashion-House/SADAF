'use client';

/**
 * SADAF | Admin — Atelier Requests Hook (WebSocket-primary)
 *
 * Streams the designer submissions queue for the admin atelier review tab
 * (inside AdminDashboardView).
 *
 * Transport priority (same pattern as useDesignerData / useConnections):
 *   1. WebSocket — subscribes to the `designer:global` channel; the WS
 *      server pushes the submissions every 10s (fetched from the real
 *      /api/dashboard/designer route).
 *   2. REST fallback — fetches /api/dashboard/designer on mount and polls
 *      every 30s only while the socket is unavailable.
 *
 * `reviewSubmission` moves a submission through the pipeline via PATCH and
 * applies the returned payload immediately; the next WS push confirms it —
 * and the designer's own dashboard sees the new status too.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { DesignerDashboardData, DesignStatus, DesignSubmission } from '@/features/designer/types';

// ─── Config ──────────────────────────────────────────────────────────────────

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';
const POLL_INTERVAL_MS = 30_000;
const RECONNECT_DELAY_MS = 3_000;
/** Upper bound for remembered submission ids — the demo pushes one every 22s. */
const MAX_KNOWN_IDS = 400;

export function useAtelierRequests() {
    const [data, setData] = useState<DesignerDashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [wsLive, setWsLive] = useState(false);
    const [reviewing, setReviewing] = useState(false);
    // Most recent live arrival (a freshly submitted design pushed over WS) —
    // consumed by the AtelierRequestToast.
    const [latestArrival, setLatestArrival] = useState<DesignSubmission | null>(null);

    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const abortRef = useRef<AbortController | null>(null);
    const wsConnectedRef = useRef(false);
    // Submission ids already surfaced — the initial REST/WS seed is treated
    // as historical (silent), only genuinely new ids fire the toast.
    const knownIdsRef = useRef<Set<string>>(new Set());

    // ─── Apply incoming payload ───────────────────────────────────────────

    const applyData = useCallback((payload: DesignerDashboardData) => {
        if (!payload || !Array.isArray(payload.submissions)) return;
        setData(payload);
        setError(null);
        setLoading(false);
        // Seed the seen-ids set from the first payload(s) so the initial
        // queue is historical and never fires a toast.
        payload.submissions.forEach((s) => knownIdsRef.current.add(s.id));
        if (knownIdsRef.current.size > MAX_KNOWN_IDS) {
            let overflow = knownIdsRef.current.size - MAX_KNOWN_IDS;
            for (const id of knownIdsRef.current) {
                if (overflow <= 0) break;
                knownIdsRef.current.delete(id);
                overflow -= 1;
            }
        }
    }, []);

    /** Merge a live WS submission into the queue + raise the toast event. */
    const acceptLiveDesign = useCallback((design: DesignSubmission) => {
        if (!design || !design.id) return;
        if (knownIdsRef.current.has(design.id)) return;
        knownIdsRef.current.add(design.id);
        setData((prev) => {
            if (!prev) return prev;
            const submissions = [design, ...prev.submissions];
            return {
                ...prev,
                submissions,
                stats: prev.stats
                    ? {
                          ...prev.stats,
                          total: prev.stats.total + 1,
                          underReview: prev.stats.underReview + 1,
                      }
                    : prev.stats,
            };
        });
        setLatestArrival(design);
    }, []);

    // ─── Review a submission (approve / reject / move to production) ───────

    const reviewSubmission = useCallback(
        async (
            id: string,
            status: DesignStatus,
            adminNote?: string,
        ): Promise<{ ok: boolean; error?: string }> => {
            setReviewing(true);
            try {
                const res = await fetch('/api/dashboard/designer', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id, status, adminNote }),
                });
                if (!res.ok) {
                    const json = (await res.json().catch(() => null)) as { error?: string } | null;
                    throw new Error(json?.error ?? `HTTP ${res.status}`);
                }
                const json = (await res.json()) as DesignerDashboardData;
                applyData(json);
                setError(null);
                return { ok: true };
            } catch (err: unknown) {
                // Surfaced via the inline status message in the tab — the
                // admin can retry the same action.
                const message =
                    err instanceof Error ? err.message : 'Failed to update the submission';
                setError(message);
                return { ok: false, error: message };
            } finally {
                setReviewing(false);
            }
        },
        [applyData],
    );

    // ─── WebSocket connection ──────────────────────────────────────────────

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
                    endpoints: ['designer:global'],
                }));
            };

            ws.onmessage = (event) => {
                try {
                    const msg = JSON.parse(event.data as string);
                    if (msg.type !== 'designer:global') return;
                    // Live new-design event (demo pusher) — only the admin
                    // atelier tab handles it; the designer dashboard ignores
                    // it because there is no `data` payload.
                    if (msg.liveDesign) {
                        acceptLiveDesign(msg.liveDesign as DesignSubmission);
                        return;
                    }
                    if (!msg.data) return;
                    applyData(msg.data as DesignerDashboardData);
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
    }, [applyData, acceptLiveDesign]);

    // ─── REST polling fallback ─────────────────────────────────────────────

    const fetchData = useCallback(async () => {
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        try {
            const res = await fetch('/api/dashboard/designer', { signal: controller.signal });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const json = (await res.json()) as DesignerDashboardData;
            applyData(json);
        } catch (err: unknown) {
            if (err instanceof DOMException && err.name === 'AbortError') return;
            setError(err instanceof Error ? err.message : 'Failed to load atelier requests');
        } finally {
            setLoading(false);
        }
    }, [applyData]);

    const startPolling = useCallback(() => {
        fetchData();
        pollIntervalRef.current = setInterval(fetchData, POLL_INTERVAL_MS);
    }, [fetchData]);

    // ─── Lifecycle ─────────────────────────────────────────────────────────

    useEffect(() => {
        connectWS();

        // Fallback: start polling after 5s if WS didn't connect
        const fallbackTimer = setTimeout(() => {
            if (!wsConnectedRef.current) {
                console.log('   ⚠️ WS not connected — starting fallback polling for atelier requests');
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

    const dismissLatestArrival = useCallback(() => setLatestArrival(null), []);

    return {
        data,
        loading,
        error,
        wsLive,
        refetch: fetchData,
        reviewSubmission,
        reviewing,
        latestArrival,
        dismissLatestArrival,
    };
}
