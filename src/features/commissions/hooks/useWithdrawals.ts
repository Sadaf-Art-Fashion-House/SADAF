'use client';

/**
 * SADAF | Commissions — Withdrawals Hook
 *
 * Manages payout requests against the pending (earned) commission balance.
 * Sandbox storage: `sadaf_withdrawals:{kind}` in localStorage — swap for a
 * POST /withdraw endpoint once the finance ledger is wired.
 *
 * - `requestWithdrawal` appends a request (validated against the available
 *   balance) and persists it.
 * - An interval settles requested entries to `completed` after the simulated
 *   processing window, so the flow stays visible end-to-end.
 * - `availableBalance(totalPending)` = pending − sum of still-requested
 *   amounts (completed payouts no longer hold the balance).
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { CommissionKind, WithdrawalMethod, WithdrawalRequest } from '../types';
import { WITHDRAWAL_PROCESSING_MS } from '../types';
import { createLocalStorageSync } from '@/shared/utils/localStorageSync';

const storageKey = (kind: CommissionKind): string => `sadaf_withdrawals:${kind}`;

const storageEventName = (kind: CommissionKind): string => `sadaf:withdrawals-${kind}-changed`;

/**
 * Per-kind persistence + cross-tab sync (custom window event + native
 * storage event) so a withdrawal requested in one tab appears in the
 * partner's panel in another tab instantly.
 */
const syncFor = (kind: CommissionKind) =>
    createLocalStorageSync<WithdrawalRequest[]>(storageKey(kind), storageEventName(kind));

function readStored(kind: CommissionKind): WithdrawalRequest[] {
    const parsed = syncFor(kind).load();
    return Array.isArray(parsed) ? parsed : [];
}

export function useWithdrawals(kind: CommissionKind) {
    const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
    // Set when a request finishes processing — the panel shows a toast.
    const [completionNotice, setCompletionNotice] = useState<WithdrawalRequest | null>(null);
    const loadedRef = useRef(false);

    // Hydration-safe initial read — localStorage is only touched on mount.
    useEffect(() => {
        setWithdrawals(readStored(kind));
        loadedRef.current = true;
    }, [kind]);

    const persist = useCallback((next: WithdrawalRequest[]) => {
        setWithdrawals(next);
        syncFor(kind).save(next);
    }, [kind]);

    /** Create a payout request; returns ok:false with a code when invalid. */
    const requestWithdrawal = useCallback(
        (amount: number, method: WithdrawalMethod, totalPending: number): { ok: boolean; code?: 'invalid' | 'exceeds' } => {
            const available = Math.max(0, totalPending - withdrawals.reduce((sum, w) => sum + w.amount, 0));

            if (!Number.isFinite(amount) || amount <= 0) {
                return { ok: false, code: 'invalid' };
            }
            if (amount > available) {
                return { ok: false, code: 'exceeds' };
            }

            const request: WithdrawalRequest = {
                id: `wd-${Date.now()}`,
                amount: Math.round(amount * 100) / 100,
                method,
                status: 'requested',
                requestedAt: new Date().toISOString(),
            };
            persist([request, ...withdrawals]);
            return { ok: true };
        },
        [withdrawals, persist],
    );

    // Settle requests whose processing window has elapsed.
    useEffect(() => {
        const settle = () => {
            setWithdrawals((prev) => {
                const now = Date.now();
                let changed = false;
                const next = prev.map((w) => {
                    if (w.status === 'requested' && now - new Date(w.requestedAt).getTime() >= WITHDRAWAL_PROCESSING_MS) {
                        changed = true;
                        return { ...w, status: 'completed' as const, completedAt: new Date().toISOString() };
                    }
                    return w;
                });
                if (changed) {
                    syncFor(kind).save(next);
                    const completed = next.find(
                        (w, i) => prev[i]?.status === 'requested' && w.status === 'completed',
                    );
                    if (completed) setCompletionNotice(completed);
                }
                return next;
            });
        };
        const timer = setInterval(settle, 2_000);
        return () => clearInterval(timer);
    }, [kind]);

    const dismissCompletionNotice = useCallback(() => setCompletionNotice(null), []);

    /**
     * Balance still available to withdraw given the current pending total.
     * Every withdrawal — requested or already completed — leaves the
     * available pool, so paid-out amounts never become withdrawable again.
     */
    const availableBalance = useCallback(
        (totalPending: number): number =>
            Math.max(0, totalPending - withdrawals.reduce((sum, w) => sum + w.amount, 0)),
        [withdrawals],
    );

    return {
        withdrawals,
        completionNotice,
        dismissCompletionNotice,
        requestWithdrawal,
        availableBalance,
        loaded: loadedRef.current,
    };
}
