/**
 * SADAF | Sales Partner — Feature-Specific Types
 *
 * SalesPartnerOverview models the partner's referral program: their unique
 * shareable link, commission KPIs, and the list of people they referred
 * (each either still pending or converted into a paid order).
 */

/** Lifecycle of a referred lead. */
export type ReferralStatus = 'pending' | 'converted';

/** One person the partner brought to the brand. */
export interface ReferralRecord {
    id: string;
    name: string;
    city: string;
    /** Whether they signed up + placed a paying order yet. */
    status: ReferralStatus;
    /** ISO timestamp of when they joined. */
    joinedAt: string;
    /** Order value in USD — set once the referral converts. */
    orderValue?: number;
    /** Commission earned in USD — computed when converted. */
    commission?: number;
}

/** Aggregated dashboard payload returned by /api/dashboard/sales-partner. */
export interface SalesPartnerOverview {
    referralCode: string;
    stats: {
        totalReferrals: number;
        converted: number;
        pending: number;
        totalCommission: number;
        thisMonthCommission: number;
    };
    referrals: ReferralRecord[];
}
