'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { CustomerAnalysisData } from '../types';

/**
 * useCustomerAnalysis — fetches personal analysis data for the logged-in
 * customer. Polls every 15s so spending/order stats stay fresh while the
 * page is open. Swap the polling loop for a WebSocket subscription once
 * the WS server exposes a per-user analysis endpoint.
 */
export function useCustomerAnalysis(userId: string | null) {
    const [data, setData] = useState<CustomerAnalysisData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const abortRef = useRef<AbortController | null>(null);

    const fetchData = useCallback(async () => {
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        try {
            const query = userId ? `?userId=${encodeURIComponent(userId)}` : '';
            const res = await fetch(`/api/dashboard/customer-analysis${query}`, {
                signal: controller.signal,
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const json = await res.json();
            setData(json as CustomerAnalysisData);
            setError(null);
        } catch (err: unknown) {
            if (err instanceof DOMException && err.name === 'AbortError') return;
            setError(err instanceof Error ? err.message : 'Failed to load analysis');
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        if (!userId) {
            setLoading(false);
            return;
        }
        fetchData();
        const interval = setInterval(fetchData, 15_000);
        return () => {
            clearInterval(interval);
            abortRef.current?.abort();
        };
    }, [userId, fetchData]);

    return { data, loading, error, refetch: fetchData };
}
