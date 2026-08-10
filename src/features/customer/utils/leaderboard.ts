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

/** Count leaderboard members per loyalty tier (every tier key present, 0 allowed). */
export function tierMemberCounts(entries: LeaderboardEntry[]): Record<LoyaltyTier, number> {
    const counts: Record<LoyaltyTier, number> = {
        Bronze: 0,
        Silver: 0,
        Gold: 0,
        Heritage: 0,
        Platinum: 0,
    };
    for (const entry of entries) {
        counts[entry.tier] = (counts[entry.tier] ?? 0) + 1;
    }
    return counts;
}

// ─── Member cities ──────────────────────────────────────────────────────────
// Home cities across the SADAF member base — every Egyptian governorate
// capital & major city, the Arab capitals, and the European capitals,
// grouped below for readability. No duplicates across the groups.

export const CITIES = [
    // ── Gulf & MENA fashion hubs (established member base) ──
    'Dubai',
    'Sharjah',
    'Jeddah',

    // ── Egypt — all governorate capitals & major cities ──
    'Cairo',
    'Alexandria',
    'Giza',
    'Shubra El Kheima',
    'Port Said',
    'Suez',
    'Luxor',
    'Aswan',
    'Mansoura',
    'Tanta',
    'Mahalla El Kubra',
    'Zagazig',
    'Ismailia',
    'Damietta',
    'Minya',
    'Asyut',
    'Sohag',
    'Qena',
    'Hurghada',
    'Sharm El Sheikh',
    'Damanhur',
    'Banha',
    'Kafr El Sheikh',
    'Fayoum',
    'Beni Suef',
    'Arish',
    'Marsa Matruh',
    '6th of October City',
    'New Cairo',
    'Shibin El Kom',
    'Dahab',
    'El Alamein',
    'Marsa Alam',
    'Safaga',
    'Ras El Bar',
    'Kharga',
    'Edfu',
    'Kom Ombo',
    'Akhmim',
    'Kafr El Dawwar',

    // ── Arab capitals ──
    'Riyadh',
    'Abu Dhabi',
    'Kuwait City',
    'Doha',
    'Manama',
    'Muscat',
    'Beirut',
    'Amman',
    'Baghdad',
    'Damascus',
    'Sanaa',
    'Khartoum',
    'Tripoli',
    'Rabat',
    'Algiers',
    'Tunis',
    'Nouakchott',
    'Mogadishu',
    'Djibouti',
    'Moroni',
    'Ramallah',
    'Jerusalem',

    // ── European capitals ──
    'London',
    'Paris',
    'Berlin',
    'Madrid',
    'Rome',
    'Lisbon',
    'Vienna',
    'Brussels',
    'Amsterdam',
    'Copenhagen',
    'Stockholm',
    'Oslo',
    'Helsinki',
    'Dublin',
    'Athens',
    'Warsaw',
    'Prague',
    'Budapest',
    'Bucharest',
    'Sofia',
    'Belgrade',
    'Zagreb',
    'Bratislava',
    'Tallinn',
    'Riga',
    'Vilnius',
    'Kyiv',
    'Minsk',
    'Chisinau',
    'Ankara',
    'Istanbul',
    'Bern',
    'Luxembourg',
    'Valletta',
    'Nicosia',
    'Reykjavik',
    'Sarajevo',
    'Skopje',
    'Tirana',
    'Podgorica',
    'Tbilisi',
    'Yerevan',
    'Baku',
    'Andorra la Vella',
] as const;

/** Home city of the logged-in user's mock row (the sandbox profile). */
export const CURRENT_USER_CITY = 'Dubai';

// ─── Deterministic member pool (mock) ───────────────────────────────────────

/** The established top members — seeded so the top of the leaderboard looks stable. */
const TOP_MEMBERS: { name: string; points: number; city: string; role: string }[] = [
    { name: 'Noura Al-Saadi', points: 28_400, city: 'Dubai', role: 'customer_individual' },
    { name: 'Fatima Al-Zahrani', points: 24_150, city: 'Riyadh', role: 'customer_family' },
    { name: 'Layla Haddad', points: 19_820, city: 'Beirut', role: 'customer_individual' },
    { name: 'Mariam Khalil', points: 16_430, city: 'Jeddah', role: 'customer_friend' },
    { name: 'Aisha Rahman', points: 12_760, city: 'Doha', role: 'customer_family' },
    { name: 'Salma Obaid', points: 9_540, city: 'Abu Dhabi', role: 'customer_individual' },
    { name: 'Huda Mansour', points: 6_880, city: 'Cairo', role: 'customer_friend' },
    { name: 'Rania Farid', points: 4_210, city: 'Kuwait City', role: 'customer_individual' },
    { name: 'Dina Saleh', points: 2_980, city: 'Manama', role: 'customer_family' },
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

/**
 * Membership sub-types for the pool — rotated deterministically so the same
 * member always gets the same badge across requests.
 */
const POOL_ROLES = ['customer_individual', 'customer_family', 'customer_friend'] as const;

/** Generate a full leaderboard pool of members ranked by the kind's metric (mock). */
export function generateMemberPool(
    size: number,
    kind: LeaderboardKind = 'points',
): { name: string; points: number; city: string; role: string }[] {
    // Different seed per kind so the three leaderboards look distinct.
    const seed = kind === 'sales' ? 1337 : kind === 'designs' ? 777 : 42;
    const random = seededRandom(seed);
    const pool: { name: string; points: number; city: string; role: string }[] = [...TOP_MEMBERS];

    for (let i = 0; i < Math.max(0, size - TOP_MEMBERS.length); i++) {
        const firstName = EXTRA_FIRST_NAMES[Math.floor(random() * EXTRA_FIRST_NAMES.length)];
        const lastName = EXTRA_LAST_NAMES[Math.floor(random() * EXTRA_LAST_NAMES.length)];
        pool.push({
            name: `${firstName} ${lastName}`,
            points: metricForKind(random, kind),
            city: CITIES[Math.floor(random() * CITIES.length)],
            role: POOL_ROLES[i % POOL_ROLES.length],
        });
    }

    return pool;
}

/**
 * Rank a member pool by its metric and insert the current user.
 * Returns entries (1-based ranks) plus the current user's rank.
 */
export function buildLeaderboard(
    pool: { name: string; points: number; city: string; role: string }[],
    currentUserMetric: number,
    currentUserCity: string = CURRENT_USER_CITY,
    currentUserRole: string = 'customer_individual',
): { entries: LeaderboardEntry[]; myRank: number } {
    const members: { name: string; points: number; city: string; role: string; isCurrentUser?: boolean }[] = [
        ...pool.map((member) => ({ ...member, isCurrentUser: false })),
        {
            name: 'You',
            points: currentUserMetric,
            city: currentUserCity,
            role: currentUserRole,
            isCurrentUser: true,
        },
    ];

    const ranked = [...members].sort((a, b) => b.points - a.points);

    const entries: LeaderboardEntry[] = ranked.map((member, index) => ({
        rank: index + 1,
        name: member.name,
        points: member.points,
        tier: tierForSpend(member.points),
        city: member.city,
        role: member.role,
        isCurrentUser: member.isCurrentUser,
    }));

    const myRank = entries.find((entry) => entry.isCurrentUser)?.rank ?? 1;
    return { entries, myRank };
}
