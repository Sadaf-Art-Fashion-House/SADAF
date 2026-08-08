/**
 * SADAF | API Route — Sales Partner Overview
 *
 * GET /api/dashboard/sales-partner — the partner's unique referral link
 * (via their code), commission KPIs, and the referrals table. Consumed by
 * /dashboard/sales-partner via useSalesPartnerData (WS-primary on
 * `sales-partner:global` with REST fallback).
 *
 * The referral link is assembled client-side from the code + origin; the
 * commission math lives here (COMMISSION_RATE × order value) so it stays
 * in exactly one place. Swap for Prisma/database queries in production.
 */

import { NextResponse } from 'next/server';
import type { ReferralRecord, SalesPartnerOverview } from '@/features/sales-partner/types';
import { COMMISSION_RATE } from '@/features/sales-partner/constants';

/** Never cache: the overview is polled over WS and carries a timestamp. */
export const dynamic = 'force-dynamic';

const DAY_MS = 86_400_000;
const HOUR_MS = 3_600_000;

/** Commission for a converted referral: rate × order value, rounded to cents. */
function commissionFor(orderValue: number): number {
    return Math.round(orderValue * COMMISSION_RATE * 100) / 100;
}

// ─── Seed ────────────────────────────────────────────────────────────────────
// Four converted referrals (with real order values) plus two pending leads
// so the status filter and KPIs are meaningful. The two most recent
// conversions fall inside the current month so the "this month" commission
// counter reads non-zero.

const SEEDED_REFERRALS: ReferralRecord[] = [
    { id: 'sr-1', name: 'Mariam Khaled', city: 'Cairo', status: 'converted', joinedAt: new Date(Date.now() - 2 * DAY_MS).toISOString(), orderValue: 2400 },
    { id: 'sr-2', name: 'Omar Nabil', city: 'Alexandria', status: 'converted', joinedAt: new Date(Date.now() - 5 * DAY_MS).toISOString(), orderValue: 1450 },
    { id: 'sr-3', name: 'Salma Tarek', city: 'Giza', status: 'pending', joinedAt: new Date(Date.now() - 1 * DAY_MS).toISOString() },
    { id: 'sr-4', name: 'Hossam Adel', city: 'Doha', status: 'converted', joinedAt: new Date(Date.now() - 20 * DAY_MS).toISOString(), orderValue: 890 },
    { id: 'sr-5', name: 'Farida Nasser', city: 'Riyadh', status: 'pending', joinedAt: new Date(Date.now() - 6 * HOUR_MS).toISOString() },
    { id: 'sr-6', name: 'Karim Samy', city: 'Sharjah', status: 'converted', joinedAt: new Date(Date.now() - 45 * DAY_MS).toISOString(), orderValue: 3200 },
];

export async function GET(): Promise<NextResponse<SalesPartnerOverview>> {
    const referrals = SEEDED_REFERRALS.map((r) =>
        r.status === 'converted' && r.orderValue !== undefined
            ? { ...r, commission: commissionFor(r.orderValue) }
            : r,
    );
    const converted = referrals.filter((r) => r.status === 'converted');
    const totalCommission = converted.reduce((sum, r) => sum + (r.commission ?? 0), 0);

    const now = new Date();
    const thisMonthCommission = converted
        .filter((r) => {
            const joined = new Date(r.joinedAt);
            return joined.getMonth() === now.getMonth() && joined.getFullYear() === now.getFullYear();
        })
        .reduce((sum, r) => sum + (r.commission ?? 0), 0);

    const overview: SalesPartnerOverview = {
        referralCode: 'SADAF-SALEH-D6N',
        stats: {
            totalReferrals: referrals.length,
            converted: converted.length,
            pending: referrals.length - converted.length,
            totalCommission: Math.round(totalCommission * 100) / 100,
            thisMonthCommission: Math.round(thisMonthCommission * 100) / 100,
        },
        referrals,
    };

    return NextResponse.json(overview);
}
