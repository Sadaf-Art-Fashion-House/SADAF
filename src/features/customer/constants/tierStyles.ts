/**
 * SADAF | Customer — Tier & Rank Visual Styles
 *
 * Shared badge colors for membership tiers and medal colors for the top
 * leaderboard ranks. Used by both the compact RewardsPanel leaderboard
 * (analysis page) and the full LeaderboardView (/dashboard/leaderboard).
 */

import type { LoyaltyTier } from '../types';

/** Badge styling per membership tier. */
export const TIER_COLORS: Record<LoyaltyTier, string> = {
    Bronze: 'text-orange-300 bg-orange-400/10 border-orange-400/30',
    Silver: 'text-slate-300 bg-slate-400/10 border-slate-400/30',
    Gold: 'text-[#C9A84C] bg-[#C9A84C]/10 border-[#C9A84C]/40',
    Heritage: 'text-emerald-300 bg-emerald-400/10 border-emerald-400/30',
    Platinum: 'text-purple-300 bg-purple-400/10 border-purple-400/30',
};

/** Icon colors for ranks 1–3 (gold / silver / bronze). */
export const RANK_MEDALS = ['text-[#C9A84C]', 'text-slate-300', 'text-orange-300'];
