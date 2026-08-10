/**
 * SADAF | Customer Feature — Type Definitions
 */

/** A single order entry in the personal analysis. */
export interface CustomerOrder {
    id: string;
    date: string;
    total: number;
    status: 'Pending' | 'Tailoring' | 'Shipped' | 'Delivered';
    items: number;
}

/** Monthly spending point for the trend chart. */
export interface CustomerSpendingPoint {
    month: string;
    value: number;
}

/** Spending by product category (pie chart). */
export interface CustomerCategorySpend {
    category: string;
    value: number;
    color: string;
}

/** A single per-user personal activity event (orders, saved designs, offers). */
export interface PersonalActivityEvent {
    /** Unique id — consumers dedupe by this when appending. */
    id: string;
    /** Event category, drives the icon and color. */
    type: 'order' | 'design' | 'wishlist' | 'promotion';
    /** Short headline (e.g. "Order Placed"). */
    title: string;
    /** One-line detail (e.g. order number, design name). */
    message: string;
    /** ISO timestamp of when the event occurred. */
    timestamp: string;
    /** The user this activity belongs to. */
    userId: string;
}

/** A smart product recommendation derived from the customer's spending habits. */
export interface ProductRecommendation {
    /** Unique id for the recommendation card. */
    id: string;
    /** Product category — matches the customer's top spending categories. */
    category: string;
    /** Product name (e.g. "Heritage Fusion Abaya"). */
    title: string;
    /** One-line product detail. */
    description: string;
    /** Current (discounted) price. */
    price: number;
    /** Original price before the offer. */
    originalPrice: number;
    /** Discount percentage shown on the badge. */
    discountPercent: number;
    /** Why this was recommended (drives the "reason" chip). */
    reason: string;
    /** Link to view the product in the catalog. */
    href: string;
}

// ─── Rewards & Loyalty ──────────────────────────────────────────────────────

/** Membership tiers, ordered from lowest to highest spend requirement. */
export type LoyaltyTier = 'Bronze' | 'Silver' | 'Gold' | 'Heritage' | 'Platinum';

/** A membership tier with its discount, points rate, and perks. */
export interface TierBenefit {
    tier: LoyaltyTier;
    /** Minimum lifetime spend to unlock this tier. */
    spendThreshold: number;
    /** Discount applied at checkout. */
    discountPercent: number;
    /** Loyalty points earned per $1 spent. */
    pointsPerDollar: number;
    /** Short perk list shown to the customer. */
    perks: string[];
}

/** Which metric a leaderboard is ranked by. */
export type LeaderboardKind = 'points' | 'sales' | 'designs';

/** A ranked member on the leaderboard. */
export interface LeaderboardEntry {
    rank: number;
    /** Display name — "You" marks the logged-in user. */
    name: string;
    /** Ranking value: loyalty points, sales volume, or designs count (per kind). */
    points: number;
    /** Loyalty tier — only meaningful when kind === 'points'. */
    tier: LoyaltyTier;
    /** Home city — drives the city filter on the leaderboard page. */
    city: string;
    /** Membership sub-type (individual/family/friend) — shown as a role badge. */
    role: string;
    /** True for the logged-in user's own row. */
    isCurrentUser?: boolean;
}

/** A live "you were overtaken" event fired when someone passes you on the leaderboard. */
export interface OvertakeEvent {
    /** Unique id — consumers key their toast/flash off this. */
    id: string;
    /** Rank before the push that moved you down. */
    previousRank: number;
    /** Rank after the push. */
    newRank: number;
    /** Display name of the member who passed you (the entry directly above). */
    overtakenBy: string;
    /** ISO timestamp of when the overtake was detected. */
    timestamp: string;
}

/** Full leaderboard dataset returned by /api/dashboard/leaderboard. */
export interface LeaderboardData {
    /** Which metric the leaderboard is ranked by. */
    kind: LeaderboardKind;
    /** Human label for the ranking metric (e.g. "Points", "Sales", "Designs"). */
    metricLabel: string;
    /** Ranked members (includes the current user). */
    entries: LeaderboardEntry[];
    /** Current user's rank (1-based). */
    myRank: number;
    /** Total number of leaderboard members. */
    totalMembers: number;
    timestamp: string;
}

/** Loyalty + leaderboard dataset returned by /api/dashboard/rewards. */
export interface RewardsData {
    /** Total loyalty points balance. */
    points: number;
    /** Current tier (derived from lifetime spend). */
    tier: LoyaltyTier;
    /** Discount percent for the current tier. */
    discountPercent: number;
    /** Points earned per dollar at the current tier. */
    pointsPerDollar: number;
    /** Next tier, or null when the customer is at the top tier. */
    nextTier: LoyaltyTier | null;
    /** Points still needed to reach the next tier. */
    pointsToNextTier: number;
    /** 0–100 progress toward the next tier threshold. */
    tierProgressPercent: number;
    /** All tier definitions (used to render the benefits ladder). */
    benefits: TierBenefit[];
    /** Ranked leaderboard (includes the current user). */
    leaderboard: LeaderboardEntry[];
    /** Current user's rank (1-based). */
    myRank: number;
    /** Total number of leaderboard members. */
    totalMembers: number;
    timestamp: string;
}

/** Personal analysis dataset returned by /api/dashboard/customer-analysis. */
export interface CustomerAnalysisData {
    /** Summary KPIs (total spent, order count, wishlist size, AI designs). */
    kpis: {
        label: string;
        value: string;
        change: string;
        isPositive: boolean;
        icon: string;
    }[];
    /** Order history for the orders table. */
    orders: CustomerOrder[];
    /** Monthly spending series (12 months). */
    monthlySpending: CustomerSpendingPoint[];
    /** Spending split by product category. */
    categorySpend: CustomerCategorySpend[];
    /** Smart product offers matched to the customer's top spending categories. */
    recommendations: ProductRecommendation[];
    /** Average order value. */
    averageOrderValue: number;
    /** Membership tier label. */
    tier: string;
    /** Total wishlist value. */
    wishlistValue: number;
    timestamp: string;
}
