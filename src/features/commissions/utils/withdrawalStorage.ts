'use client';

/**
 * SADAF | Commissions — Shared Withdrawal Storage
 *
 * Single access layer for the per-kind withdrawal ledger in localStorage
 * (`sadaf_withdrawals:{kind}`). Both consumers use it:
 *   - useWithdrawals        → the designer / sales-partner withdraw panel
 *   - useAdminWithdrawals   → the admin review tab (reads BOTH kinds)
 *
 * Same-tab + cross-tab sync via createLocalStorageSync (custom window event
 * + native storage event), so an admin decision in one tab refreshes the
 * partner's open panel instantly. Swap for real finance-ledger queries once
 * the backend is wired.
 */

import type { CommissionKind, WithdrawalRequest } from '../types';
import { createLocalStorageSync } from '@/shared/utils/localStorageSync';

export const withdrawalStorageKey = (kind: CommissionKind): string => `sadaf_withdrawals:${kind}`;

export const withdrawalStorageEventName = (kind: CommissionKind): string => `sadaf:withdrawals-${kind}-changed`;

/** The two roles whose payout requests the admin reviews. */
export const WITHDRAWAL_ROLE_KINDS: CommissionKind[] = ['designer', 'sales-partner'];

export const withdrawalSync = (kind: CommissionKind) =>
    createLocalStorageSync<WithdrawalRequest[]>(withdrawalStorageKey(kind), withdrawalStorageEventName(kind));

/** A stored row before the legacy `completed` state is migrated to `paid`. */
type LegacyWithdrawalRow = Omit<WithdrawalRequest, 'status' | 'paidAt'> & {
    status?: string;
    paidAt?: string;
    completedAt?: string;
};

/**
 * Reads the ledger, migrating legacy sandbox rows: the terminal state used
 * to be `completed` — it is now `paid` (transfer executed) with `paidAt`.
 */
export function readWithdrawals(kind: CommissionKind): WithdrawalRequest[] {
    const parsed = withdrawalSync(kind).load();
    const rows: LegacyWithdrawalRow[] = Array.isArray(parsed) ? parsed : [];
    return rows.map((row): WithdrawalRequest =>
        row.status === 'completed'
            ? { ...row, status: 'paid', paidAt: row.paidAt ?? row.completedAt }
            : (row as WithdrawalRequest),
    );
}

export function persistWithdrawals(kind: CommissionKind, next: WithdrawalRequest[]): void {
    withdrawalSync(kind).save(next);
}
