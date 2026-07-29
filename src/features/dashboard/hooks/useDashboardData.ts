'use client';

/**
 * SADAF | Dashboard Data Hooks
 *
 * Polling hooks (useAdminDashboardData, etc.) and WebSocket hooks
 * (useWSAdminDashboardData, etc.) for real-time dashboard data.
 *
 * WebSocket is preferred for real-time (<3s latency).
 * Polling falls back when the WebSocket server is unavailable.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface AdminKpi {
    label: string;
    value: string;
    growth: string;
    icon: string;
    color: string;
}

export interface AdminDashboardData {
    kpis: AdminKpi[];
    products: unknown[];
    arts: unknown[];
    orders: unknown[];
    customers: unknown[];
    aiGenerationLogs: unknown[];
    moderationRules: unknown[];
    weeklyRevenue: number[];
    totalRevenue: number;
    timestamp: string;
}

export interface FounderKpi {
    label: string;
    val: string;
    pct: string;
    color: string;
}

export interface FounderDashboardData {
    kpis: FounderKpi[];
    transactions: unknown[];
    team: unknown[];
    cashFlow: number;
    grossRevenue: number;
    aiShapeCount: number;
    timestamp: string;
}

export interface CustomerDashboardData {
    stats: {
        totalProducts: number;
        totalArts: number;
        totalCatalogItems: number;
        featuredItems: number;
    };
    recentProducts: unknown[];
    recentArts: unknown[];
    timestamp: string;
}

// ─── Polling Hook (Fallback) ────────────────────────────────────────────────

interface PolledFetchResult<T> {
    data: T | null;
    loading: boolean;
    error: string | null;
    refetch: () => void;
}

function usePolledFetch<T>(
    url: string,
    intervalMs = 15_000,
    enabled = true,
): PolledFetchResult<T> {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const abortRef = useRef<AbortController | null>(null);

    const fetchData = useCallback(async () => {
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        try {
            const res = await fetch(url, { signal: controller.signal });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const json = await res.json();
            setData(json as T);
            setError(null);
        } catch (err: unknown) {
            if (err instanceof DOMException && err.name === 'AbortError') return;
            setError(err instanceof Error ? err.message : 'Failed to fetch');
        } finally {
            setLoading(false);
        }
    }, [url]);

    useEffect(() => {
        if (!enabled) return;
        fetchData();
        const interval = setInterval(fetchData, intervalMs);
        return () => {
            clearInterval(interval);
            abortRef.current?.abort();
        };
    }, [fetchData, intervalMs, enabled]);

    return { data, loading, error, refetch: fetchData };
}

// ─── Polling Dashboard Hooks ────────────────────────────────────────────────

/**
 * Fetches admin dashboard KPIs every 15 seconds via REST.
 * Prefer useWSAdminDashboardData for WebSocket real-time updates.
 */
export function useAdminDashboardData(enabled = true) {
    return usePolledFetch<AdminDashboardData>('/api/dashboard/admin', 15_000, enabled);
}

/**
 * Fetches founder dashboard KPIs every 15 seconds via REST.
 * Prefer useWSFounderDashboardData for WebSocket real-time updates.
 */
export function useFounderDashboardData(enabled = true) {
    return usePolledFetch<FounderDashboardData>('/api/dashboard/founder', 15_000, enabled);
}

/**
 * Fetches customer dashboard stats every 30 seconds via REST.
 */
export function useCustomerDashboardData(enabled = true) {
    return usePolledFetch<CustomerDashboardData>('/api/dashboard/customer', 30_000, enabled);
}

// ─── Re-export WebSocket Hooks ──────────────────────────────────────────────

/**
 * Real-time dashboard data via WebSocket (preferred).
 * Falls back to 15s REST polling when the WS server is unavailable.
 *
 * @example
 * ```tsx
 * const { data, loading, wsState } = useWSAdminDashboardData();
 * const isLive = wsState.status === 'connected';
 * ```
 */
export {
    useWebSocketData,
    useWSAdminDashboardData,
    useWSFounderDashboardData,
    useWSCustomerDashboardData,
} from './useWebSocketData';

export type { WebSocketState, UseWebSocketResult } from './useWebSocketData';
