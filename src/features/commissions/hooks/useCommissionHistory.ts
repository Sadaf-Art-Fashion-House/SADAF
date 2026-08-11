'use client';

/**
 * SADAF | Commissions — History Hook
 *
 * Fetches the commission ledger for the current earning role from
 * /api/dashboard/{kind}/commissions. A ledger is not real-time data (unlike
 * the live dashboards), so this is a plain REST fetch with an explicit
 * retry — no WebSocket subscription needed.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { CommissionHistory, CommissionKind } from '../types';

export function useCommissionHistory(kind: CommissionKind) {
    const [data, setData] = useState<CommissionHistory | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const abortRef = useRef<AbortController | null>(null);

    const fetchHistory = useCallback(async () => {
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        try {
            const res = await fetch(`/api/dashboard/${kind}/commissions`, {
                signal: controller.signal,
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const json = (await res.json()) as CommissionHistory;
            setData(json);
            setError(null);
        } catch (err: unknown) {
            if (err instanceof DOMException && err.name === 'AbortError') return;
            setError(err instanceof Error ? err.message : 'Failed to load your commission history');
        } finally {
            setLoading(false);
        }
    }, [kind]);

    useEffect(() => {
        fetchHistory();
        return () => abortRef.current?.abort();
    }, [fetchHistory]);

    return { data, loading, error, refetch: fetchHistory };
}
