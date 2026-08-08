/**
 * SADAF | Admin Feature — Type Definitions
 *
 * Shared between the /api/dashboard/community route, the useCommunityOverview
 * hook, and the CommunityOverviewView so the platform-wide community
 * overview keeps one data contract.
 */

/** A platform-level KPI card. */
export interface CommunityKpi {
    label: string;
    value: string;
    /** Short trend text, e.g. "+12.4%" or "Stable". */
    growth: string;
    /** Tailwind text-color class for the icon/accent. */
    color: string;
}

/** A member referred by a top referrer (the recent-referrals detail). */
export interface ReferredMember {
    id: string;
    name: string;
    city: string;
    /** ISO date the member joined via the referral code. */
    joinedAt: string;
}

/** A member ranked by how many people they referred. */
export interface TopReferrer {
    id: string;
    name: string;
    referralCode: string;
    referred: number;
    /** Rewards earned in USD from referrals. */
    rewards: number;
    /** Last few referred members (with join dates) — shown under the row. */
    recentReferrals: ReferredMember[];
}

/** One month of community growth (members joining via referrals). */
export interface CommunityGrowthPoint {
    month: string;
    /** Members who joined that month. */
    members: number;
    /** Of those, how many arrived via a referral code. */
    viaReferrals: number;
}

/** A pending connection request visible at platform level. */
export interface PlatformPendingRequest {
    id: string;
    name: string;
    email: string;
    type: 'family' | 'friend';
    /** Inviter (the member whose network this lands in). */
    invitedBy: string;
    /** Member's city — used by the admin city filter. */
    city: string;
    createdAt: string;
}

/** Role distribution across the community. */
export interface RoleDistributionEntry {
    role: string;
    count: number;
}

/** Full platform community overview payload. */
export interface CommunityOverviewData {
    kpis: CommunityKpi[];
    topReferrers: TopReferrer[];
    growthByMonth: CommunityGrowthPoint[];
    pendingRequests: PlatformPendingRequest[];
    roleDistribution: RoleDistributionEntry[];
    timestamp: string;
}
