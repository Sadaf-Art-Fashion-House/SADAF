/**
 * SADAF | Customer — Leaderboard Utilities
 *
 * Shared by the compact RewardsPanel leaderboard (analysis page), the full
 * /dashboard/leaderboard page, and the admin/founder leaderboard variants
 * so every view stays consistent: same member pool, same ranking logic.
 *
 * A leaderboard is ranked by a "kind" metric:
 *   - points  → loyalty points (customers) — the default
 *   - sales   → sales volume (sales partners / staff)
 *   - designs → designs & collections published (designers)
 *
 * Currently deterministic mock generation; swap the pool generator for
 * real members ranked by the chosen metric once the database is wired.
 */

import type { LeaderboardEntry, LeaderboardKind, LoyaltyTier } from '../types';

// ─── Kind metadata ───────────────────────────────────────────────────────────

/** Human label for each leaderboard ranking metric. */
export const LEADERBOARD_KIND_LABELS: Record<LeaderboardKind, string> = {
    points: 'Points',
    sales: 'Sales',
    designs: 'Designs',
};

// ─── Tier definitions ────────────────────────────────────────────────────────
// Ordered from lowest to highest spend requirement. Only meaningful for the
// 'points' kind, but computed for every kind so entries always carry a tier.

export const TIER_ORDER: LoyaltyTier[] = ['Bronze', 'Silver', 'Gold', 'Heritage', 'Platinum'];

export const TIER_THRESHOLDS: Record<LoyaltyTier, number> = {
    Bronze: 0,
    Silver: 3_000,
    Gold: 7_000,
    Heritage: 12_000,
    Platinum: 25_000,
};

/** Resolve the tier a given lifetime spend unlocks. */
export function tierForSpend(spend: number): LoyaltyTier {
    let tier: LoyaltyTier = 'Bronze';
    for (const candidate of TIER_ORDER) {
        if (spend >= TIER_THRESHOLDS[candidate]) tier = candidate;
    }
    return tier;
}

/** Next tier above the current one, or null at the top tier. */
export function nextTierFor(tier: LoyaltyTier): LoyaltyTier | null {
    const index = TIER_ORDER.indexOf(tier);
    return index >= 0 && index < TIER_ORDER.length - 1 ? TIER_ORDER[index + 1] : null;
}

// ─── Deterministic member pool (mock) ───────────────────────────────────────

/** The established top members — seeded so the top of the leaderboard looks stable. */
const TOP_MEMBERS: { name: string; points: number }[] = [
    { name: 'Noura Al-Saadi', points: 28_400 },
    { name: 'Fatima Al-Zahrani', points: 24_150 },
    { name: 'Layla Haddad', points: 19_820 },
    { name: 'Mariam Khalil', points: 16_430 },
    { name: 'Aisha Rahman', points: 12_760 },
    { name: 'Salma Obaid', points: 9_540 },
    { name: 'Huda Mansour', points: 6_880 },
    { name: 'Rania Farid', points: 4_210 },
    { name: 'Dina Saleh', points: 2_980 },
];

const EXTRA_FIRST_NAMES = [
    'Zeina', 'Amira', 'Yasmin', 'Nour', 'Rania', 'Salma', 'Mona', 'Laila', 'Heba', 'Dalia',
    'Sara', 'Nadia', 'Farah', 'Lina', 'Maha', 'Rana', 'Hala', 'Sama', 'Rasha', 'Tala',
    'Omar', 'Karim', 'Tariq', 'Ahmed', 'Hassan', 'Youssef', 'Adam', 'Ziad', 'Fadi', 'Nabil',
    'Ola', 'Mariam', 'Soha', 'Dina', 'Reem', 'Nermin', 'Gihan', 'Shaimaa', 'Eman', 'Hend',
];

const EXTRA_LAST_NAMES = [
    'Mostafa', 'Ibrahim', 'El-Sayed', 'Hassan', 'Mahmoud', 'Abdullah', 'Sharif', 'Nasser',
    'Fouad', 'Gamal', 'Rashid', 'Salem', 'Farouk', 'Aziz', 'Bakr', 'Fadel', 'Hamza', 'Kamel',
    'Lotfy', 'Mansour', 'Othman', 'Qadri', 'Samy', 'Tawfik', 'Walid', 'Yassin', 'Zaki', 'Ezzat',
];

/** Deterministic pseudo-random so the pool is stable across requests. */
function seededRandom(seed: number): () => number {
    let state = seed;
    return () => {
        state = (state * 9301 + 49297) % 233280;
        return state / 233280;
    };
}

/** Scale a 0–1 random value into the plausible metric range for a kind. */
function metricForKind(random: () => number, kind: LeaderboardKind): number {
    switch (kind) {
        case 'sales':
            // Sales volume in USD: mostly mid, some high performers.
            return Math.round(random() * random() * 320_000 + random() * 25_000);
        case 'designs':
            // Published designs & collections count.
            return Math.round(random() * random() * 220 + random() * 6);
        case 'points':
        default:
            // Loyalty points spread across tiers: some bronze/silver, fewer gold+.
            return Math.round(random() * random() * 26_000 + random() * 2_000);
    }
}

/** Generate a full leaderboard pool of members ranked by the kind's metric (mock). */
export function generateMemberPool(size: number, kind: LeaderboardKind = 'points'): { name: string; points: number }[] {
    // Different seed per kind so the three leaderboards look distinct.
    const seed = kind === 'sales' ? 1337 : kind === 'designs' ? 777 : 42;
    const random = seededRandom(seed);
    const pool = [...TOP_MEMBERS];

    for (let i = 0; i < Math.max(0, size - TOP_MEMBERS.length); i++) {
        const firstName = EXTRA_FIRST_NAMES[Math.floor(random() * EXTRA_FIRST_NAMES.length)];
        const lastName = EXTRA_LAST_NAMES[Math.floor(random() * EXTRA_LAST_NAMES.length)];
        pool.push({ name: `${firstName} ${lastName}`, points: metricForKind(random, kind) });
    }

    return pool;
}

/**
 * Rank a member pool by its metric and insert the current user.
 * Returns entries (1-based ranks) plus the current user's rank.
 */
export function buildLeaderboard(
    pool: { name: string; points: number }[],
    currentUserMetric: number,
): { entries: LeaderboardEntry[]; myRank: number } {
    const members: { name: string; points: number; isCurrentUser?: boolean }[] = [
        ...pool.map((member) => ({ ...member, isCurrentUser: false })),
        { name: 'You', points: currentUserMetric, isCurrentUser: true },
    ];

    const ranked = [...members].sort((a, b) => b.points - a.points);

    const entries: LeaderboardEntry[] = ranked.map((member, index) => ({
        rank: index + 1,
        name: member.name,
        points: member.points,
        tier: tierForSpend(member.points),
        isCurrentUser: member.isCurrentUser,
    }));

    const myRank = entries.find((entry) => entry.isCurrentUser)?.rank ?? 1;
    return { entries, myRank };
}
