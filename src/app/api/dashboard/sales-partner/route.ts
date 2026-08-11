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
import type { SalesPartnerOverview } from '@/features/sales-partner/types';
import { COMMISSION_RATE } from '@/features/sales-partner/constants';
import { commissionFor, getReferralRecords } from '@/features/sales-partner/data/referralStore';

/** Never cache: the overview is polled over WS and carries a timestamp. */
export const dynamic = 'force-dynamic';

/**
 * Build the full overview from the current referral state. Shared by GET
 * (dashboard load / WS poll) and POST /convert so both always return the
 * exact same shape — the commission math lives here, in one place.
 */
function buildOverview(): SalesPartnerOverview {
    const referrals = getReferralRecords().map((r) =>
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

    // Expected Commission projection: if each pending lead converts at the
    // partner's average converted order value, they earn COMMISSION_RATE of
    // it. All math stays here (one source of truth — the view only displays).
    const pending = referrals.length - converted.length;
    const avgOrderValue =
        converted.length > 0
            ? converted.reduce((sum, r) => sum + (r.orderValue ?? 0), 0) / converted.length
            : 0;
    const expectedCommission =
        pending > 0 ? Math.round(avgOrderValue * COMMISSION_RATE * pending * 100) / 100 : 0;

    return {
        referralCode: 'SADAF-SALEH-D6N',
        stats: {
            totalReferrals: referrals.length,
            converted: converted.length,
            pending,
            totalCommission: Math.round(totalCommission * 100) / 100,
            thisMonthCommission: Math.round(thisMonthCommission * 100) / 100,
            avgOrderValue: Math.round(avgOrderValue * 100) / 100,
            expectedCommission,
        },
        referrals,
    };
}

export async function GET(): Promise<NextResponse<SalesPartnerOverview>> {
    return NextResponse.json(buildOverview());
}

/**
 * POST /api/dashboard/sales-partner — simulate a referred customer placing
 * a paying order: the oldest pending referral becomes converted with a
 * realistic order value and its commission (COMMISSION_RATE × value). The
 * WS server picks the change up on its next poll and the open dashboard
 * shows the conversion toast. In production this endpoint would be called by
 * the order service when a referral-coded order is paid.
 */
export async function POST(): Promise<NextResponse> {
    const pendingReferral = getReferralRecords().find((r) => r.status === 'pending');
    if (!pendingReferral) {
        return NextResponse.json(
            { error: 'No pending referrals left to convert.' },
            { status: 409 },
        );
    }

    // Realistic order value in $100 steps between $800 and $3,200.
    const orderValue = 800 + Math.round(Math.random() * 24) * 100;
    pendingReferral.status = 'converted';
    pendingReferral.orderValue = orderValue;
    pendingReferral.commission = commissionFor(orderValue);

    return NextResponse.json(buildOverview());
}
