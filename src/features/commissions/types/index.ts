/**
 * SADAF | Commissions — Shared Feature Types
 *
 * One history model for both earning roles:
 *   - Designer commissions: 10% pools on approved / in-production designs
 *     (pending until the piece sells) plus settled payouts from completed
 *     pieces (paid).
 *   - Sales partner commissions: COMMISSION_RATE of each converted referral
 *     order (paid when settled, pending while awaiting the monthly payout).
 *
 * Both /dashboard/designer/commissions and /dashboard/sales-partner/commissions
 * consume the same types, hook and view — only the API route differs.
 */

import type { KycLevel } from '@/shared/types';

/** Which earning role is viewing the history. */
export type CommissionKind = 'designer' | 'sales-partner';

/** Settlement state of a single commission entry. */
export type CommissionStatus = 'paid' | 'pending';

/** One row in the commission history table. */
export interface CommissionRecord {
    id: string;
    /** What earned the commission — a design title or a referred customer. */
    source: string;
    /** Human category, e.g. "Design commission" or "Referral commission". */
    category: string;
    /** Amount in USD. */
    amount: number;
    status: CommissionStatus;
    /** ISO timestamp of when the commission was earned. */
    creditedAt: string;
    /** ISO timestamp of the payout — present only when status is 'paid'. */
    paidAt?: string;
}

/** Aggregated payload returned by the commissions API routes. */
export interface CommissionHistory {
    /** Role this history belongs to — lets the view label itself. */
    kind: CommissionKind;
    records: CommissionRecord[];
    stats: {
        totalPaid: number;
        totalPending: number;
        /** Number of distinct months present in the records (filter dropdown). */
        monthCount: number;
    };
}

// ─── Withdrawals ─────────────────────────────────────────────────────────────

/** Lifecycle of a payout request. */
export type WithdrawalStatus = 'requested' | 'approved' | 'rejected' | 'paid';

/** Payout destination the earner picks when requesting a withdrawal. */
export type WithdrawalMethod = 'bank' | 'paypal';

/**
 * A payout request against the pending (earned) commission balance.
 * Sandbox note: stored in localStorage per role (`sadaf_withdrawals:{kind}`)
 * until the backend wires a real finance ledger — approved entries move to
 * paid once the transfer executes (after the simulated processing window).
 */
export interface WithdrawalRequest {
    id: string;
    /** USD amount requested (must not exceed the available balance). */
    amount: number;
    method: WithdrawalMethod;
    status: WithdrawalStatus;
    /** ISO timestamp of when the request was created. */
    requestedAt: string;
    /** ISO timestamp of the admin review — present when approved or rejected. */
    reviewedAt?: string;
    /** Who reviewed the request ('admin', or 'auto-kyc' for the fast path). */
    reviewedBy?: string;
    /** Required admin note explaining why the request was rejected — shown to the earner. */
    rejectionReason?: string;
    /** Account verification (KYC) snapshot at request time — 'full' unlocks the fast path. Optional for legacy sandbox rows. */
    kycStatus?: KycLevel;
    /** ISO timestamp of when the transfer was executed — present only when paid. */
    paidAt?: string;
}

/** Simulated transfer-execution window: approved requests become paid after this delay. */
export const WITHDRAWAL_PROCESSING_MS = 20_000;

/** Hybrid rule: only fully KYC-verified requests at or below this amount are auto-approved. */
export const WITHDRAWAL_AUTO_LIMIT = 100;

/** Fast-path settle window for auto-approved (KYC + under-limit) requests. */
export const WITHDRAWAL_FAST_PATH_MS = 5_000;
