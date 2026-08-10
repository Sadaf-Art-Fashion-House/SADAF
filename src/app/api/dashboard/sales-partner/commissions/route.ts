/**
 * SADAF | API Route — Sales Partner Commission History
 *
 * GET /api/dashboard/sales-partner/commissions — the partner's commission
 * ledger for /dashboard/sales-partner/commissions.
 *
 * Built from the SAME live referral state as the dashboard (exported by the
 * overview route — one source of truth): every converted referral becomes a
 * commission record.
 *
 *   - Paid (مدفوع): conversions older than the settlement window (7 days) —
 *     the commission has been paid out.
 *   - Pending (مستحق): conversions inside the window, awaiting the monthly
 *     payout cycle.
 *
 * Consumed by useCommissionHistory (REST — a ledger is not real-time data).
 */

import { NextResponse } from 'next/server';
import type { CommissionHistory, CommissionRecord, CommissionStatus } from '@/features/commissions/types';
import { collectMonthKeys } from '@/features/commissions/utils/months';
import type { ReferralRecord } from '@/features/sales-partner/types';
import { commissionFor, getReferralRecords } from '@/features/sales-partner/data/referralStore';

/** Never cache: conversions update the ledger live. */
export const dynamic = 'force-dynamic';

const DAY_MS = 86_400_000;
/** New conversions stay pending until the payout cycle settles them. */
const SETTLEMENT_WINDOW_DAYS = 7;

/** Round to cents — same precision as the commission math everywhere. */
function roundCents(value: number): number {
    return Math.round(value * 100) / 100;
}

export async function GET(): Promise<NextResponse<CommissionHistory>> {
    const now = Date.now();
    const records: CommissionRecord[] = getReferralRecords()
        // Converted referrals always carry an order value in the store; the
        // commission itself is computed at read time (same shared math as the
        // dashboard overview) so it can never drift.
        .filter(
            (referral): referral is ReferralRecord & { orderValue: number } =>
                referral.status === 'converted' && referral.orderValue !== undefined,
        )
        .map((referral) => {
            const ageMs = now - new Date(referral.joinedAt).getTime();
            const pending = ageMs < SETTLEMENT_WINDOW_DAYS * DAY_MS;
            const status: CommissionStatus = pending ? 'pending' : 'paid';
            return {
                id: `comm-${referral.id}`,
                source: referral.name,
                category: 'Referral commission',
                amount: roundCents(commissionFor(referral.orderValue)),
                status,
                creditedAt: referral.joinedAt,
                ...(status === 'paid' ? { paidAt: new Date(referral.joinedAt).toISOString() } : {}),
            };
        })
        .sort((a, b) => b.creditedAt.localeCompare(a.creditedAt));

    const totalPaid = roundCents(
        records.filter((record) => record.status === 'paid').reduce((sum, record) => sum + record.amount, 0),
    );
    const totalPending = roundCents(
        records.filter((record) => record.status === 'pending').reduce((sum, record) => sum + record.amount, 0),
    );

    return NextResponse.json({
        kind: 'sales-partner',
        records,
        stats: {
            totalPaid,
            totalPending,
            monthCount: collectMonthKeys(records).length,
        },
    } satisfies CommissionHistory);
}
