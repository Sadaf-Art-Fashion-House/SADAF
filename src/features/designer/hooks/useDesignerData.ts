'use client';

/**
 * SADAF | Designer — Dashboard Hook (WebSocket-primary)
 *
 * Streams the designer's portfolio (submissions + KPI stats) for the
 * /dashboard/designer page.
 *
 * Transport priority (same pattern as useCommunityOverview / useRewards):
 *   1. WebSocket — subscribes to the `designer:global` channel; the WS
 *      server pushes the portfolio every 10s (fetched from the real
 *      /api/dashboard/designer route, so the aggregation math lives in one
 *      place).
 *   2. REST fallback — fetches /api/dashboard/designer on mount and polls
 *      every 30s only while the socket is unavailable.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { DesignerDashboardData, NewDesignSubmission } from '../types';

// ─── Config ──────────────────────────────────────────────────────────────────

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';
const POLL_INTERVAL_MS = 30_000;
const RECONNECT_DELAY_MS = 3_000;

export function useDesignerData() {
    const [data, setData] = useState<DesignerDashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [wsLive, setWsLive] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const abortRef = useRef<AbortController | null>(null);
    const wsConnectedRef = useRef(false);

    // ─── Apply incoming dashboard payload ─────────────────────────────────────

    const applyData = useCallback((payload: DesignerDashboardData) => {
        if (!payload || !Array.isArray(payload.submissions)) return;
        setData(payload);
        setError(null);
        setLoading(false);
    }, []);

    // ─── Submit a new design ──────────────────────────────────────────────────
    //
    // POSTs to /api/dashboard/designer; on success the returned payload is
    // applied immediately so the portfolio updates without waiting for the
    // 10s WS push (which then confirms with the full payload).

    const submitDesign = useCallback(
        async (input: NewDesignSubmission): Promise<{ ok: boolean; error?: string }> => {
            setSubmitting(true);
            try {
                const res = await fetch('/api/dashboard/designer', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(input),
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
                // Surfaced via the inline form status message in the view —
                // the form stays filled so the designer can retry.
                const message =
                    err instanceof Error ? err.message : 'Failed to submit your design';
                setError(message);
                return { ok: false, error: message };
            } finally {
                setSubmitting(false);
            }
        },
        [applyData],
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
                    endpoints: ['designer:global'],
                }));
            };

            ws.onmessage = (event) => {
                try {
                    const msg = JSON.parse(event.data as string);
                    if (msg.type !== 'designer:global') return;
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
    }, [applyData]);

    // ─── REST polling fallback ───────────────────────────────────────────────

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
            setError(err instanceof Error ? err.message : 'Failed to load your designs');
        } finally {
            setLoading(false);
        }
    }, [applyData]);

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
                console.log('   ⚠️ WS not connected — starting fallback polling for designer dashboard');
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

    return { data, loading, error, wsLive, refetch: fetchData, submitDesign, submitting };
}
