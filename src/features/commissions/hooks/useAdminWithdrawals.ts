'use client';

/**
 * SADAF | Commissions — Admin Withdrawals Hook
 *
 * Lets an admin review payout requests from BOTH earning roles (designer +
 * sales-partner) in one queue and approve or reject them. Reads/writes the
 * same per-kind localStorage ledger the partner panels use, so a decision
 * here is reflected in the earner's open panel instantly (shared storage +
 * window events from withdrawalStorage.ts).
 *
 * Approval lifecycle (sandbox):
 *   requested → (admin approve) → approved → (processing window) → completed
 *   requested → (admin reject)  → rejected
 *
 * In production the approve/reject calls become finance-ledger mutations
 * (e.g. POST /api/admin/withdrawals/:id/decision) — the queue UI keeps
 * working because it reads the same list shape.
 */

import { useCallback, useEffect, useState } from 'react';
import type { CommissionKind, WithdrawalRequest, WithdrawalStatus } from '../types';
import {
    WITHDRAWAL_ROLE_KINDS,
    readWithdrawals,
    persistWithdrawals,
    withdrawalSync,
} from '../utils/withdrawalStorage';

/** A withdrawal request tagged with the role it belongs to. */
export interface AdminWithdrawalEntry {
    kind: CommissionKind;
    request: WithdrawalRequest;
}

/** How the queue orders requests: pending review first, newest first. */
const STATUS_ORDER: Record<WithdrawalStatus, number> = {
    requested: 0,
    approved: 1,
    rejected: 2,
    completed: 3,
};

export function useAdminWithdrawals() {
    const [entries, setEntries] = useState<AdminWithdrawalEntry[]>([]);
    const [loading, setLoading] = useState(true);

    const reload = useCallback(() => {
        const collected: AdminWithdrawalEntry[] = [];
        for (const kind of WITHDRAWAL_ROLE_KINDS) {
            for (const request of readWithdrawals(kind)) {
                collected.push({ kind, request });
            }
        }
        collected.sort((a, b) => {
            const byStatus = STATUS_ORDER[a.request.status] - STATUS_ORDER[b.request.status];
            if (byStatus !== 0) return byStatus;
            return new Date(b.request.requestedAt).getTime() - new Date(a.request.requestedAt).getTime();
        });
        setEntries(collected);
        setLoading(false);
    }, []);

    // Initial load + live refresh when either role's ledger changes
    // (from the admin's own actions or from new partner requests).
    useEffect(() => {
        reload();
        const unsubscribes = WITHDRAWAL_ROLE_KINDS.map((kind) => withdrawalSync(kind).subscribe(reload));
        return () => unsubscribes.forEach((unsubscribe) => unsubscribe());
    }, [reload]);

    /** Approve or reject a single request. Returns false when it's no longer pending. */
    const review = useCallback(
        (kind: CommissionKind, requestId: string, decision: 'approved' | 'rejected'): boolean => {
            const current = readWithdrawals(kind);
            const target = current.find((request) => request.id === requestId);
            if (!target || target.status !== 'requested') return false;

            const updated = current.map((request) =>
                request.id === requestId
                    ? {
                          ...request,
                          status: decision,
                          reviewedAt: new Date().toISOString(),
                          reviewedBy: 'admin',
                      }
                    : request,
            );
            persistWithdrawals(kind, updated);
            reload();
            return true;
        },
        [reload],
    );

    const approve = useCallback((kind: CommissionKind, requestId: string) => review(kind, requestId, 'approved'), [review]);
    const reject = useCallback((kind: CommissionKind, requestId: string) => review(kind, requestId, 'rejected'), [review]);

    return {
        entries,
        loading,
        reload,
        approve,
        reject,
    };
}
