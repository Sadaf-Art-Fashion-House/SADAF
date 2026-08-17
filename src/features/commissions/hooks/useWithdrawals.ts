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
import { readWithdrawals, persistWithdrawals, withdrawalSync } from '../utils/withdrawalStorage';

export function useWithdrawals(kind: CommissionKind) {
    const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
    // Set when a request finishes processing — the panel shows a toast.
    const [completionNotice, setCompletionNotice] = useState<WithdrawalRequest | null>(null);
    const loadedRef = useRef(false);

    // Hydration-safe initial read — localStorage is only touched on mount.
    useEffect(() => {
        setWithdrawals(readWithdrawals(kind));
        loadedRef.current = true;
    }, [kind]);

    const persist = useCallback((next: WithdrawalRequest[]) => {
        setWithdrawals(next);
        persistWithdrawals(kind, next);
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

    // Settle APPROVED requests whose processing window has elapsed. A
    // request never completes on its own — it waits for the admin's
    // approval (useAdminWithdrawals) before the payout can finish.
    useEffect(() => {
        const settle = () => {
            setWithdrawals((prev) => {
                const now = Date.now();
                let changed = false;
                const next = prev.map((w) => {
                    if (w.status === 'approved' && now - new Date(w.reviewedAt ?? w.requestedAt).getTime() >= WITHDRAWAL_PROCESSING_MS) {
                        changed = true;
                        return { ...w, status: 'completed' as const, completedAt: new Date().toISOString() };
                    }
                    return w;
                });
                if (changed) {
                    persistWithdrawals(kind, next);
                    const completed = next.find(
                        (w, i) => prev[i]?.status === 'approved' && w.status === 'completed',
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
     * Every withdrawal — requested, approved, rejected or completed — leaves
     * the available pool, so paid-out amounts never become withdrawable
     * again. (Rejected requests are kept in history for the admin audit but
     * the earner can still re-request the same funds.)
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
