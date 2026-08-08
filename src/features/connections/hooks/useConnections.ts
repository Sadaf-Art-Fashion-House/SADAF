'use client';

/**
 * SADAF | Connections — Hub Hook (WebSocket-primary)
 *
 * Streams the Designer ↔ Company partnership payload (requests + directories)
 * for the /dashboard/designer/connections and /dashboard/company/connections
 * pages.
 *
 * Transport priority (same pattern as useDesignerData / useCommunityOverview):
 *   1. WebSocket — subscribes to the `connections:global` channel; the WS
 *      server pushes the payload every 10s (fetched from the real
 *      /api/dashboard/connections route, so the store lives in one place).
 *   2. REST fallback — fetches /api/dashboard/connections on mount and polls
 *      every 30s only while the socket is unavailable.
 *
 * `sendRequest` (company side) and `respond` (designer side) mutate the
 * store via POST/PATCH and apply the returned payload immediately; the next
 * WS push then confirms it.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type {
    ConnectionsData,
    ConnectionResponse,
    NewConnectionRequest,
} from '../types';

// ─── Config ──────────────────────────────────────────────────────────────────

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';
const POLL_INTERVAL_MS = 30_000;
const RECONNECT_DELAY_MS = 3_000;

export function useConnections() {
    const [data, setData] = useState<ConnectionsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [wsLive, setWsLive] = useState(false);
    const [mutating, setMutating] = useState(false);

    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const abortRef = useRef<AbortController | null>(null);
    const wsConnectedRef = useRef(false);

    // ─── Apply incoming payload ───────────────────────────────────────────

    const applyData = useCallback((payload: ConnectionsData) => {
        if (!payload || !Array.isArray(payload.connections)) return;
        setData(payload);
        setError(null);
        setLoading(false);
    }, []);

    // ─── Send a new request (company side) ─────────────────────────────────
    //
    // POSTs to /api/dashboard/connections; on success the returned payload is
    // applied immediately so the request appears without waiting for the 10s
    // WS push.

    const sendRequest = useCallback(
        async (input: NewConnectionRequest): Promise<{ ok: boolean; error?: string }> => {
            setMutating(true);
            try {
                const res = await fetch('/api/dashboard/connections', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(input),
                });
                if (!res.ok) {
                    const json = (await res.json().catch(() => null)) as { error?: string } | null;
                    throw new Error(json?.error ?? `HTTP ${res.status}`);
                }
                const json = (await res.json()) as ConnectionsData;
                applyData(json);
                return { ok: true };
            } catch (err: unknown) {
                // Surfaced via the inline status message in the view — the
                // request form stays filled so the company can retry.
                const message = err instanceof Error ? err.message : 'Failed to send the request';
                setError(message);
                return { ok: false, error: message };
            } finally {
                setMutating(false);
            }
        },
        [applyData],
    );

    // ─── Respond to a request (designer side) ──────────────────────────────

    const respond = useCallback(
        async (
            id: string,
            response: ConnectionResponse,
        ): Promise<{ ok: boolean; error?: string }> => {
            setMutating(true);
            try {
                const res = await fetch('/api/dashboard/connections', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id, action: response }),
                });
                if (!res.ok) {
                    const json = (await res.json().catch(() => null)) as { error?: string } | null;
                    throw new Error(json?.error ?? `HTTP ${res.status}`);
                }
                const json = (await res.json()) as ConnectionsData;
                applyData(json);
                return { ok: true };
            } catch (err: unknown) {
                const message =
                    err instanceof Error ? err.message : 'Failed to update the request';
                setError(message);
                return { ok: false, error: message };
            } finally {
                setMutating(false);
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
                    endpoints: ['connections:global'],
                }));
            };

            ws.onmessage = (event) => {
                try {
                    const msg = JSON.parse(event.data as string);
                    if (msg.type !== 'connections:global') return;
                    if (!msg.data) return;
                    applyData(msg.data as ConnectionsData);
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

    // ─── REST polling fallback ─────────────────────────────────────────────

    const fetchData = useCallback(async () => {
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        try {
            const res = await fetch('/api/dashboard/connections', { signal: controller.signal });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const json = (await res.json()) as ConnectionsData;
            applyData(json);
        } catch (err: unknown) {
            if (err instanceof DOMException && err.name === 'AbortError') return;
            setError(err instanceof Error ? err.message : 'Failed to load connections');
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
                console.log('   ⚠️ WS not connected — starting fallback polling for connections hub');
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

    return { data, loading, error, wsLive, refetch: fetchData, sendRequest, respond, mutating };
}
