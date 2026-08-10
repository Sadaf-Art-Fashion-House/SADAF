'use client';

/**
 * SADAF | Sales Partner — Dashboard Hook (WebSocket-primary)
 *
 * Streams the partner's referral overview (unique link code, commission
 * KPIs, referrals table) for the /dashboard/sales-partner page.
 *
 * Transport priority (same pattern as useDesignerData / useCommunityOverview):
 *   1. WebSocket — subscribes to the `sales-partner:global` channel; the WS
 *      server pushes the overview every 10s (fetched from the real
 *      /api/dashboard/sales-partner route, so the commission math lives in
 *      one place).
 *   2. REST fallback — fetches /api/dashboard/sales-partner on mount and
 *      polls every 30s only while the socket is unavailable.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReferralRecord, ReferralStatus, SalesPartnerOverview } from '../types';

// ─── Config ──────────────────────────────────────────────────────────────────

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';
const POLL_INTERVAL_MS = 30_000;
const RECONNECT_DELAY_MS = 3_000;

export function useSalesPartnerData() {
    const [data, setData] = useState<SalesPartnerOverview | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [wsLive, setWsLive] = useState(false);

    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const abortRef = useRef<AbortController | null>(null);
    const wsConnectedRef = useRef(false);
    // Last known status per referral id — the diff baseline for conversion
    // detection. Seeded by the first payload, so the initial load never fires
    // a toast for referrals that were already converted.
    const previousStatusesRef = useRef<Map<string, ReferralStatus>>(new Map());
    // Most recent pending → converted transition (a referred customer placed
    // a paying order) — consumed by the dashboard toast. Works on both
    // transports: WS pushes and the REST fallback poll.
    const [latestConvertedReferral, setLatestConvertedReferral] = useState<ReferralRecord | null>(null);

    // ─── Apply incoming overview payload ──────────────────────────────────────

    const applyData = useCallback((payload: SalesPartnerOverview) => {
        if (!payload || !Array.isArray(payload.referrals)) return;
        // Diff against the last snapshot: a referral that was 'pending' and is
        // now 'converted' is a real conversion event → surface it once.
        for (const referral of payload.referrals) {
            const previous = previousStatusesRef.current.get(referral.id);
            if (previous === 'pending' && referral.status === 'converted') {
                setLatestConvertedReferral(referral);
            }
            previousStatusesRef.current.set(referral.id, referral.status);
        }
        setData(payload);
        setError(null);
        setLoading(false);
    }, []);

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
                    endpoints: ['sales-partner:global'],
                }));
            };

            ws.onmessage = (event) => {
                try {
                    const msg = JSON.parse(event.data as string);
                    if (msg.type !== 'sales-partner:global') return;
                    if (!msg.data) return;
                    applyData(msg.data as SalesPartnerOverview);
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
            const res = await fetch('/api/dashboard/sales-partner', { signal: controller.signal });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const json = (await res.json()) as SalesPartnerOverview;
            applyData(json);
        } catch (err: unknown) {
            if (err instanceof DOMException && err.name === 'AbortError') return;
            setError(err instanceof Error ? err.message : 'Failed to load your referral overview');
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
                console.log('   ⚠️ WS not connected — starting fallback polling for sales partner dashboard');
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

    return { data, loading, error, wsLive, refetch: fetchData, latestConvertedReferral };
}
