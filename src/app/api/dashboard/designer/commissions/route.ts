/**
 * SADAF | API Route — Designer Commission History
 *
 * GET /api/dashboard/designer/commissions — the designer's commission
 * ledger for /dashboard/designer/commissions.
 *
 *   - Pending (مستحق): the live 10% pool of every approved / in-production
 *     submission — exactly the same shared math as the Expected Commission
 *     KPI and the admin atelier report, so the totals always match.
 *   - Paid (مدفوع): settled payouts from completed designs. Those finished
 *     pieces are not in the live pipeline store, so they are seeded here as
 *     history (dates relative to now so the month filter always has data).
 *
 * Consumed by useCommissionHistory (REST — a ledger is not real-time data).
 */

import { NextResponse } from 'next/server';
import type { CommissionHistory, CommissionRecord } from '@/features/commissions/types';
import { collectMonthKeys } from '@/features/commissions/utils/months';
import { COMMISSION_POOL_RATE, participantsFor } from '@/features/designer/utils/commissionSplit';
import { getDesignerSubmissions } from '../designerStore';

/** Never cache: the pending side reflects live pipeline decisions. */
export const dynamic = 'force-dynamic';

const DAY_MS = 86_400_000;

/** Round to cents — same precision as the commission math everywhere. */
function roundCents(value: number): number {
    return Math.round(value * 100) / 100;
}

/**
 * Settled payouts from designs that already completed production and sold —
 * historical ledger entries, deliberately absent from the live pipeline
 * store (which only holds current work).
 */
const PAID_HISTORY: Omit<CommissionRecord, 'id' | 'creditedAt' | 'paidAt'>[] = [
    { source: 'Cairo Nights Editorial Gown', category: 'Design commission', amount: 380, status: 'paid' },
    { source: 'Dune Weaver Cape', category: 'Design commission', amount: 300, status: 'paid' },
    { source: 'Fatimid Lattice Blazer', category: 'Design commission', amount: 250, status: 'paid' },
    { source: 'Nile Rose Chiffon Gown', category: 'Design commission', amount: 415, status: 'paid' },
    { source: 'Al-Muizz Golden Kaftan', category: 'Design commission', amount: 320, status: 'paid' },
];

export async function GET(): Promise<NextResponse<CommissionHistory>> {
    // Pending — live from the designer store, same math as the KPI:
    // 10% of the price for every committed (approved / in-production) design.
    const pending: CommissionRecord[] = getDesignerSubmissions()
        .filter(
            (submission) =>
                (submission.status === 'approved' || submission.status === 'in_production') &&
                participantsFor(submission.collaboration).length > 0,
        )
        .map((submission) => ({
            id: `pend-${submission.id}`,
            source: submission.title,
            category: 'Design commission',
            amount: roundCents(submission.price * COMMISSION_POOL_RATE),
            status: 'pending',
            creditedAt: submission.collaboration?.ownerCreditedAt ?? submission.submittedAt,
        }));

    // Paid — historical payouts spread across the last ~4 months.
    const paidAgesDays = [12, 35, 62, 95, 128];
    const paid: CommissionRecord[] = PAID_HISTORY.map((seed, index) => {
        const credited = new Date(Date.now() - paidAgesDays[index] * DAY_MS).toISOString();
        return {
            ...seed,
            id: `paid-${index + 1}`,
            // Settled ~10 days after the commission was credited.
            creditedAt: credited,
            paidAt: new Date(Date.now() - (paidAgesDays[index] - 10) * DAY_MS).toISOString(),
        };
    });

    const records = [...paid, ...pending].sort((a, b) =>
        b.creditedAt.localeCompare(a.creditedAt),
    );
    const totalPaid = roundCents(paid.reduce((sum, record) => sum + record.amount, 0));
    const totalPending = roundCents(pending.reduce((sum, record) => sum + record.amount, 0));

    return NextResponse.json({
        kind: 'designer',
        records,
        stats: {
            totalPaid,
            totalPending,
            monthCount: collectMonthKeys(records).length,
        },
    } satisfies CommissionHistory);
}
