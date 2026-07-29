'use client';

/**
 * SADAF | WebSocket & SSE Data Hook — v2
 *
 * Transport priority:
 *   1. WebSocket (subscribe-based, with heartbeat detection)
 *   2. SSE (EventSource, auto-reconnect)
 *   3. REST polling (fallback)
 *
 * Each transport auto-degrades to the next if unavailable.
 */

import { useState, useEffect, useRef, useCallback } from 'react';

// ─── Types ──────────────────────────────────────────────────────────────────

export type TransportStatus = 'connecting' | 'connected' | 'degraded' | 'disconnected' | 'sse' | 'fallback-polling';

export interface WebSocketState {
    status: TransportStatus;
    reconnectAttempt: number;
    apiHealthy: boolean;
}

export interface UseWebSocketResult<T> {
    data: T | null;
    loading: boolean;
    error: string | null;
    wsState: WebSocketState;
    transport: 'websocket' | 'sse' | 'polling';
    refetch: () => void;
}

// ─── Config ─────────────────────────────────────────────────────────────────

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';
const MAX_RECONNECT_ATTEMPTS = 5;
const BASE_RECONNECT_DELAY_MS = 1_000;
/** If no matching data message arrives within this time after WS connect, mark degraded */
const DATA_RECEIVED_TIMEOUT_MS = 10_000;
const HEARTBEAT_TIMEOUT_MS = 15_000; // If no heartbeat in 15s, consider stale
const FALLBACK_POLL_INTERVAL_MS = 15_000;

/** Map endpointType → SSE query param */
const SSE_TYPE_MAP: Record<string, string> = {
    'dashboard:admin': 'admin',
    'dashboard:founder': 'founder',
    'dashboard:customer': 'customer',
};

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useWebSocketData<T>(
    endpointType: string,
    fallbackUrl: string,
    enabled = true,
): UseWebSocketResult<T> {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [wsState, setWsState] = useState<WebSocketState>({
        status: 'connecting',
        reconnectAttempt: 0,
        apiHealthy: true,
    });
    const [transport, setTransport] = useState<'websocket' | 'sse' | 'polling'>('websocket');

    // Refs
    const wsRef = useRef<WebSocket | null>(null);
    const sseRef = useRef<EventSource | null>(null);
    const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const dataTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const heartbeatTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const reconnectAttemptRef = useRef(0);
    const enabledRef = useRef(enabled);
    const isDegradedRef = useRef(false);

    enabledRef.current = enabled;

    // ─── Cleanup ────────────────────────────────────────────────────────────

    const cleanupAll = useCallback(() => {
        // WS cleanup
        if (wsRef.current) {
            wsRef.current.onopen = null;
            wsRef.current.onmessage = null;
            wsRef.current.onclose = null;
            wsRef.current.onerror = null;
            wsRef.current.close();
            wsRef.current = null;
        }
        // SSE cleanup
        if (sseRef.current) {
            sseRef.current.close();
            sseRef.current = null;
        }
        // Timeouts & intervals
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }
        if (dataTimeoutRef.current) {
            clearTimeout(dataTimeoutRef.current);
            dataTimeoutRef.current = null;
        }
        if (heartbeatTimeoutRef.current) {
            clearTimeout(heartbeatTimeoutRef.current);
            heartbeatTimeoutRef.current = null;
        }
        if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
        }
    }, []);

    // ─── REST polling (last resort) ─────────────────────────────────────────

    const startPolling = useCallback(() => {
        if (!enabledRef.current) return;

        setTransport('polling');
        isDegradedRef.current = true;
        setWsState({
            status: 'fallback-polling',
            reconnectAttempt: reconnectAttemptRef.current,
            apiHealthy: true,
        });
        setError(`WebSocket & SSE unavailable — polling every ${FALLBACK_POLL_INTERVAL_MS / 1000}s`);

        const poll = async () => {
            if (!enabledRef.current) return;
            try {
                const res = await fetch(fallbackUrl);
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const json = await res.json();
                setData(json as T);
                setError(null);
            } catch (err: unknown) {
                setError(err instanceof Error ? err.message : 'Polling failed');
            } finally {
                setLoading(false);
            }
        };

        poll();
        pollIntervalRef.current = setInterval(poll, FALLBACK_POLL_INTERVAL_MS);
    }, [fallbackUrl]);

    // ─── SSE fallback ───────────────────────────────────────────────────────

    const startSSE = useCallback(() => {
        if (!enabledRef.current) return;

        cleanupAll();

        const sseType = SSE_TYPE_MAP[endpointType];
        if (!sseType) {
            startPolling();
            return;
        }

        setTransport('sse');
        setWsState({ status: 'sse', reconnectAttempt: 0, apiHealthy: true });
        setError('WebSocket unavailable — fallback to SSE (5s push)');

        try {
            const es = new EventSource(`/api/dashboard/sse?type=${sseType}`);
            sseRef.current = es;

            es.addEventListener('connected', () => {
                setLoading(false);
                setWsState((prev) => ({ ...prev, status: 'sse' }));
                setError(null);
            });

            es.addEventListener('dashboard', (event) => {
                try {
                    const msg = JSON.parse(event.data);
                    setData(msg.data as T);
                    setError(null);
                    setWsState((prev) => ({ ...prev, status: 'sse', apiHealthy: true }));
                } catch {
                    // Ignore malformed
                }
            });

            es.addEventListener('error', () => {
                // EventSource auto-reconnects; if we get repeated errors, fall back to polling
                setWsState((prev) => ({ ...prev, apiHealthy: false }));
            });

            es.onerror = () => {
                // If EventSource closes permanently, fall back to polling
                if (es.readyState === EventSource.CLOSED) {
                    es.close();
                    startPolling();
                }
            };
        } catch {
            startPolling();
        }
    }, [endpointType, cleanupAll, startPolling]);

    // ─── WebSocket connection (primary) ──────────────────────────────────────

    const connect = useCallback(() => {
        if (!enabledRef.current) return;
        if (isDegradedRef.current) return;

        cleanupAll();
        reconnectAttemptRef.current += 1;

        if (reconnectAttemptRef.current > MAX_RECONNECT_ATTEMPTS) {
            startSSE(); // Degrade to SSE
            return;
        }

        setTransport('websocket');
        setWsState({
            status: 'connecting',
            reconnectAttempt: reconnectAttemptRef.current,
            apiHealthy: true,
        });

        try {
            const ws = new WebSocket(WS_URL);
            wsRef.current = ws;

            // ── Data-received timeout ──
            // If we don't receive a matching data msg within 10s, degrade
            dataTimeoutRef.current = setTimeout(() => {
                if (wsRef.current && !isDegradedRef.current) {
                    console.log(`   ⚠️ No data from WS in ${DATA_RECEIVED_TIMEOUT_MS / 1000}s — degrading`);
                    isDegradedRef.current = true;
                    cleanupAll();
                    startSSE();
                }
            }, DATA_RECEIVED_TIMEOUT_MS);

            ws.onopen = () => {
                reconnectAttemptRef.current = 0;
                setLoading(false);
                setError(null);
                setWsState({ status: 'connected', reconnectAttempt: 0, apiHealthy: true });

                // ── Subscribe to endpoint ──
                ws.send(JSON.stringify({
                    action: 'subscribe',
                    endpoints: [endpointType],
                }));
            };

            ws.onmessage = (event) => {
                try {
                    const msg = JSON.parse(event.data as string);

                    // Handle subscription confirmation
                    if (msg.type === 'subscribed') return;

                    // Handle heartbeat — reset timeout, update API health
                    if (msg.type === 'heartbeat') {
                        if (heartbeatTimeoutRef.current) {
                            clearTimeout(heartbeatTimeoutRef.current);
                        }
                        // If no heartbeat in HEARTBEAT_TIMEOUT_MS, mark stale
                        heartbeatTimeoutRef.current = setTimeout(() => {
                            setWsState((prev) => ({ ...prev, apiHealthy: false }));
                        }, HEARTBEAT_TIMEOUT_MS);

                        setWsState((prev) => ({ ...prev, apiHealthy: msg.apiHealthy !== false }));
                        return;
                    }

                    // Handle pong
                    if (msg.type === 'pong') return;

                    // Handle connection msg
                    if (msg.type === 'connection') return;

                    // Filter by endpoint type
                    if (msg.type !== endpointType) return;

                    // 🟢 Data received — cancel data-received timeout
                    if (dataTimeoutRef.current) {
                        clearTimeout(dataTimeoutRef.current);
                        dataTimeoutRef.current = null;
                    }

                    setData(msg.data as T);
                    setError(null);
                    setWsState((prev) => ({ ...prev, status: 'connected', apiHealthy: true }));
                } catch {
                    // Ignore malformed messages
                }
            };

            ws.onclose = () => {
                if (!isDegradedRef.current) {
                    // Next connect() will increment to reconnectAttemptRef.current + 1
                    setWsState((prev) => ({
                        status: 'disconnected',
                        reconnectAttempt: reconnectAttemptRef.current + 1,
                        apiHealthy: prev.apiHealthy,
                    }));

                    // Schedule reconnect with exponential backoff
                    const delay = Math.min(
                        BASE_RECONNECT_DELAY_MS * Math.pow(2, reconnectAttemptRef.current),
                        10_000,
                    );
                    reconnectTimeoutRef.current = setTimeout(connect, delay);
                }
            };

            ws.onerror = () => {
                // onclose fires after onerror
            };
        } catch {
            // reconnectAttemptRef already incremented at the top of connect()
            // No need to increment again here
            const delay = Math.min(
                BASE_RECONNECT_DELAY_MS * Math.pow(2, reconnectAttemptRef.current),
                10_000,
            );
            reconnectTimeoutRef.current = setTimeout(connect, delay);
        }
    }, [endpointType, cleanupAll, startSSE]);

    // ─── Lifecycle ─────────────────────────────────────────────────────────

    useEffect(() => {
        if (!enabled) return;

        connect();

        return () => {
            cleanupAll();
            reconnectAttemptRef.current = 0;
            isDegradedRef.current = false;
        };
    }, [enabled, endpointType, connect, cleanupAll]);

    // ─── Manual refetch ────────────────────────────────────────────────────

    const refetch = useCallback(() => {
        if (transport === 'polling') {
            fetch(fallbackUrl)
                .then((res) => res.json())
                .then((json) => setData(json as T))
                .catch(() => {});
        }
    }, [transport, fallbackUrl]);

    return { data, loading, error, wsState, transport, refetch };
}

// ─── Typed Hooks ────────────────────────────────────────────────────────────

type AdminAPIData = import('./useDashboardData').AdminDashboardData;
type FounderAPIData = import('./useDashboardData').FounderDashboardData;
type CustomerAPIData = import('./useDashboardData').CustomerDashboardData;

/**
 * Real-time admin dashboard data — WS → SSE → Polling.
 */
export function useWSAdminDashboardData(enabled = true) {
    return useWebSocketData<AdminAPIData>('dashboard:admin', '/api/dashboard/admin', enabled);
}

/**
 * Real-time founder dashboard data — WS → SSE → Polling.
 */
export function useWSFounderDashboardData(enabled = true) {
    return useWebSocketData<FounderAPIData>('dashboard:founder', '/api/dashboard/founder', enabled);
}

/**
 * Real-time customer dashboard data — WS → SSE → Polling.
 */
export function useWSCustomerDashboardData(enabled = true) {
    return useWebSocketData<CustomerAPIData>('dashboard:customer', '/api/dashboard/customer', enabled);
}
