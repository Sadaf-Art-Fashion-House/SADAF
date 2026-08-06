/**
 * SADAF | API Route — Rewards & Loyalty
 *
 * GET /api/dashboard/rewards?userId=<id>
 *
 * Returns the customer's loyalty rewards: points balance (1 point per $1
 * spent), membership tier derived from lifetime spend, the tiered-discount
 * benefits ladder, and a compact top-10 leaderboard. The full top-100
 * leaderboard lives at /api/dashboard/leaderboard and both share the same
 * tier math + member pool via src/features/customer/utils/leaderboard.
 *
 * Currently serves generated demo data scoped per-user. Swap the mock base
 * for Prisma/database queries in production (aggregate orders by userId,
 * read the member's tier from the profile, and rank real customers).
 */

import { NextResponse } from 'next/server';
import type { TierBenefit, RewardsData } from '@/features/customer/types';
import { MOCK_ORDERS, sumDeliveredSpend } from '@/features/orders/data/mockOrders';
import {
    TIER_THRESHOLDS,
    tierForSpend,
    nextTierFor,
    generateMemberPool,
    buildLeaderboard,
} from '@/features/customer/utils/leaderboard';

/**
 * Never cache: points and ranks change as members shop.
 */
export const dynamic = 'force-dynamic';

/** Compact leaderboard size shown in the RewardsPanel. */
const COMPACT_LEADERBOARD_SIZE = 10;

const BENEFITS: TierBenefit[] = [
    { tier: 'Bronze', spendThreshold: 0, discountPercent: 2, pointsPerDollar: 1, perks: ['Member pricing', 'Birthday offer', 'Order updates'] },
    { tier: 'Silver', spendThreshold: 3_000, discountPercent: 5, pointsPerDollar: 1.25, perks: ['5% off everything', 'Free shipping over $1,000', 'Early access to sales'] },
    { tier: 'Gold', spendThreshold: 7_000, discountPercent: 8, pointsPerDollar: 1.5, perks: ['8% off everything', 'Free express shipping', 'Early access to collections', 'Priority support'] },
    { tier: 'Heritage', spendThreshold: 12_000, discountPercent: 12, pointsPerDollar: 1.75, perks: ['12% off everything', 'Complimentary tailoring consult', 'Invites to atelier events', 'Private collection previews'] },
    { tier: 'Platinum', spendThreshold: 25_000, discountPercent: 18, pointsPerDollar: 2, perks: ['18% off everything', 'Dedicated stylist', 'First dibs on limited editions', 'Founder conversations'] },
];

export async function GET(request: Request) {
    try {
        // userId accepted for API parity; demo data is global for now.
        const userId = new URL(request.url).searchParams.get('userId');

        // Lifetime spend = the sum of Delivered orders (1 point per $1). The
        // tier derives automatically from that spend via tierForSpend — no
        // random jitter, so points/rank stay stable between pushes.
        const lifetimeSpend = sumDeliveredSpend(MOCK_ORDERS);
        const tier = tierForSpend(lifetimeSpend);
        const nextTier = nextTierFor(tier);

        const points = lifetimeSpend; // 1 point per $1 spent on delivered orders
        const benefit = BENEFITS.find((b) => b.tier === tier) ?? BENEFITS[0];

        let tierProgressPercent = 100;
        let pointsToNextTier = 0;
        if (nextTier) {
            const currentThreshold = TIER_THRESHOLDS[tier];
            const nextThreshold = TIER_THRESHOLDS[nextTier];
            pointsToNextTier = nextThreshold - lifetimeSpend;
            tierProgressPercent = Math.min(
                100,
                Math.round(((lifetimeSpend - currentThreshold) / (nextThreshold - currentThreshold)) * 100)
            );
        }

        // Compact top-10 leaderboard — same pool + ranking as the full page.
        const pool = generateMemberPool(COMPACT_LEADERBOARD_SIZE);
        const { entries, myRank } = buildLeaderboard(pool, points);

        const data: RewardsData = {
            points,
            tier,
            discountPercent: benefit.discountPercent,
            pointsPerDollar: benefit.pointsPerDollar,
            nextTier,
            pointsToNextTier: Math.max(0, pointsToNextTier),
            tierProgressPercent,
            benefits: BENEFITS,
            leaderboard: entries,
            myRank,
            totalMembers: entries.length,
            timestamp: new Date().toISOString(),
        };

        return NextResponse.json({
            ...data,
            userId,
        });
    } catch (error) {
        console.error('Rewards data error:', error);
        return NextResponse.json(
            { error: 'Failed to load rewards' },
            { status: 500 }
        );
    }
}
