/**
 * SADAF | API Route — Full Leaderboard
 *
 * GET /api/dashboard/leaderboard?userId=<id>&size=100&kind=points
 *
 * Returns a wide leaderboard of top members ranked by the requested metric
 * kind (loyalty points for customers, sales volume for sales partners,
 * designs published for designers), with the current user inserted at their
 * true rank. This powers the full /dashboard/leaderboard page and the
 * admin/founder leaderboard variants (search + tier filter are applied
 * client-side over the returned pool).
 *
 * Each member's metric is jittered slightly per request so the table moves
 * between WebSocket pushes (leaderboard:global) — ranks visibly shift as
 * if members are actively shopping.
 *
 * Currently deterministic mock generation; swap generateMemberPool for
 * real members ranked by the chosen metric once the database is wired.
 */

import { NextResponse } from 'next/server';
import type { LeaderboardData, LeaderboardKind } from '@/features/customer/types';
import { generateMemberPool, buildLeaderboard, LEADERBOARD_KIND_LABELS } from '@/features/customer/utils/leaderboard';

/**
 * Never cache: points and ranks change as members shop.
 */
export const dynamic = 'force-dynamic';

const DEFAULT_SIZE = 100;
const MAX_SIZE = 500;
const VALID_KINDS: LeaderboardKind[] = ['points', 'sales', 'designs'];
/** ±% per member per request — enough for live movement, not chaotic. */
const JITTER_PCT = 0.04;

/** Resolve a metric for the current user based on the ranking kind (mock). */
function currentUserMetricFor(kind: LeaderboardKind): number {
    switch (kind) {
        case 'sales':
            return Math.round(96_500 + (Math.random() * 8_000 - 4_000));
        case 'designs':
            return Math.round(34 + (Math.random() * 10 - 5));
        case 'points':
        default:
            // Lifetime spend base matching the personal analysis page (~$13.4k),
            // with slight jitter so the leaderboard feels live.
            return Math.round(13_437 + (Math.random() * 600 - 300));
    }
}

/** Jitter a metric by ±JITTER_PCT (never negative). */
function jitterMetric(value: number): number {
    const delta = value * (Math.random() * 2 - 1) * JITTER_PCT;
    return Math.max(0, Math.round(value + delta));
}

export async function GET(request: Request) {
    try {
        const url = new URL(request.url);
        const userId = url.searchParams.get('userId');

        // Optional size override, clamped to a sane maximum.
        const requested = Number(url.searchParams.get('size') ?? DEFAULT_SIZE);
        const size = Number.isFinite(requested) ? Math.min(MAX_SIZE, Math.max(10, Math.round(requested))) : DEFAULT_SIZE;

        // Optional ranking kind — falls back to loyalty points.
        const rawKind = url.searchParams.get('kind');
        const kind: LeaderboardKind = VALID_KINDS.includes(rawKind as LeaderboardKind)
            ? (rawKind as LeaderboardKind)
            : 'points';

        // Jitter each member's metric so the table moves between WS pushes.
        const pool = generateMemberPool(size, kind).map((member) => ({
            name: member.name,
            points: jitterMetric(member.points),
        }));
        const { entries, myRank } = buildLeaderboard(pool, currentUserMetricFor(kind));

        const data: LeaderboardData = {
            kind,
            metricLabel: LEADERBOARD_KIND_LABELS[kind],
            entries,
            myRank,
            totalMembers: entries.length,
            timestamp: new Date().toISOString(),
        };

        return NextResponse.json({
            ...data,
            userId,
        });
    } catch (error) {
        console.error('Leaderboard data error:', error);
        return NextResponse.json(
            { error: 'Failed to load leaderboard' },
            { status: 500 }
        );
    }
}
