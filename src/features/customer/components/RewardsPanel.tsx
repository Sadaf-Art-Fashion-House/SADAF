'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import {
    Award,
    Coins,
    Crown,
    TrendingUp,
    Gift,
    Users,
    Sparkles,
    Medal,
    ArrowRight,
    Wifi,
    WifiOff,
    MapPin,
    X,
    ChevronDown,
    ArrowLeft,
} from 'lucide-react';
import { SmartClamp } from '@/shared/ui/SmartClamp';
import { DirectionalIcon } from '@/shared/ui/DirectionalIcon';
import type { RewardsData } from '../types';
import { TIER_COLORS, RANK_MEDALS } from '../constants/tierStyles';
import { formatPoints } from '../utils/formatPoints';
import { useCityFilter } from '../hooks/useCityFilter';
import { ROUTES } from '@/config/routes';
import { useLanguage } from '@/features/i18n/LanguageProvider';

interface RewardsPanelProps {
    /** Loyalty + leaderboard data for the logged-in user. */
    data: RewardsData | null;
    loading: boolean;
    error: string | null;
    /** First name of the logged-in user (for the leaderboard highlight). */
    memberName: string;
    /** Whether the rewards WebSocket is connected (LIVE badge). */
    isLive?: boolean;
}

/**
 * Rewards Panel — the customer's loyalty program summary: points balance,
 * current tier with discount, progress to the next tier, the full benefits
 * ladder, and a compact leaderboard of top members ranked by points.
 *
 * Data streams in real time over the `personal:user:{userId}` WebSocket
 * channel (points/tier/rank push every 12s); a REST poll is the fallback.
 * The compact leaderboard is a condensed preview of the full top-100
 * leaderboard at /dashboard/leaderboard (same tier math + member pool).
 */
export default function RewardsPanel({ data, loading, error, memberName, isLive = false }: RewardsPanelProps) {
    // City filter shared with the full LeaderboardView — same dropdown,
    // counts, and empty-state detection. Called unconditionally (before the
    // early returns) per the Rules of Hooks; the empty-array fallback during
    // loading is harmless because the memos recompute once data arrives.
    const { t } = useLanguage();
    const { cityFilter, setCityFilter, cityOptions, filteredEntries, selectedCityHasNoMembers } =
        useCityFilter(data?.leaderboard ?? []);

    if (loading && !data) {
        return (
            <div className="p-6 bg-[#05081A]/90 border border-[#C9A84C]/10 rounded-2xl flex items-center justify-center">
                <div className="w-6 h-6 rounded-full border-2 border-[#C9A84C] border-t-transparent animate-spin" />
                <p className="ml-3 text-[10px] font-mono text-[#E8E0D5]/50">{t('rewards.loading')}</p>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="p-6 bg-[#05081A]/90 border border-[#C9A84C]/10 rounded-2xl text-center">
                <p className="text-xs text-[#E8E0D5]/60">{t('rewards.empty')}</p>
            </div>
        );
    }

    const currentTierIndex = data.benefits.findIndex((b) => b.tier === data.tier);
    const currentTierStyle = TIER_COLORS[data.tier] ?? TIER_COLORS.Gold;

    return (
        <div className="mb-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-[#C9A84C]/10 text-[#C9A84C]">
                        <Award size={14} />
                    </div>
                    <h3 className="text-[10px] font-mono uppercase tracking-widest text-[#C9A84C] font-bold">
                        {t('rewards.title')}
                    </h3>
                    {/* Live indicator — real-time pushes over personal:user:{userId} */}
                    <span className={`inline-flex items-center gap-1 text-[8px] font-mono uppercase tracking-widest ${
                        isLive ? 'text-green-400' : 'text-amber-400/80'
                    }`}>
                        {isLive ? <Wifi size={9} /> : <WifiOff size={9} />}
                        {isLive ? t('lb.live') : t('lb.polling')}
                    </span>
                </div>
                {error && (
                    <span className="text-[8px] font-mono text-amber-400/70">
                        {error} {t('lb.showingLastValues')}
                    </span>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                {/* Left: points + tier + progress */}
                <div className="lg:col-span-2 p-5 bg-[#05081A]/90 border border-[#C9A84C]/10 rounded-2xl flex flex-col gap-4">
                    {/* Points balance */}
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-1.5 text-[8px] font-mono uppercase tracking-widest text-[#E8E0D5]/40 mb-1">
                                <Coins size={10} className="text-[#C9A84C]" />
                                {t('rewards.pointsBalance')}
                            </div>
                            <p className="text-3xl font-serif text-white font-bold tracking-tight">
                                {formatPoints(data.points)}
                            </p>
                            <p className="text-[9px] font-mono text-[#E8E0D5]/40 mt-0.5">
                                {t('rewards.pointsPerDollar', { multiplier: data.pointsPerDollar, percent: data.discountPercent })}
                            </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border ${currentTierStyle}`}>
                            {data.tier}
                        </span>
                    </div>

                    {/* Tier progress */}
                    <div className="p-3 rounded-xl bg-[#0A0F2C]/60 border border-white/[0.05]">
                        <div className="flex items-center justify-between mb-2">
                            <span className="flex items-center gap-1.5 text-[9px] font-mono text-[#E8E0D5]/60">
                                <TrendingUp size={10} className="text-[#C9A84C]" />
                                {data.nextTier
                                    ? t('rewards.progressTo', { tier: data.nextTier })
                                    : t('rewards.atTopTier')}
                            </span>
                            <span className="text-[9px] font-mono text-[#C9A84C]">
                                {data.nextTier ? `${data.tierProgressPercent}%` : '100%'}
                            </span>
                        </div>
                        <div className="h-2 rounded-full bg-[#0A0F2C] border border-white/[0.05] overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${data.tierProgressPercent}%` }}
                                transition={{ duration: 0.8, ease: 'easeOut' }}
                                className="h-full rounded-full bg-gradient-to-r from-[#C9A84C]/60 to-[#C9A84C]"
                            />
                        </div>
                        <p className="text-[8px] font-mono text-[#E8E0D5]/40 mt-2">
                            {data.nextTier
                                ? t('rewards.pointsToUnlock', { points: formatPoints(data.pointsToNextTier), tier: data.nextTier })
                                : t('rewards.enjoyBenefits')}
                        </p>
                    </div>

                    {/* Benefits ladder */}
                    <div className="flex flex-col gap-2">
                        {data.benefits.map((benefit, index) => {
                            const isCurrent = index === currentTierIndex;
                            const isUnlocked = index <= currentTierIndex;
                            return (
                                <div
                                    key={benefit.tier}
                                    className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-colors ${
                                        isCurrent
                                            ? 'bg-[#C9A84C]/10 border border-[#C9A84C]/30'
                                            : 'bg-[#0A0F2C]/40 border border-white/[0.04]'
                                    }`}
                                >
                                    <span className={`w-4 text-center text-[10px] ${isUnlocked ? 'text-[#C9A84C]' : 'text-[#E8E0D5]/25'}`}>
                                        {isUnlocked ? '✓' : '•'}
                                    </span>
                                    <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${isCurrent ? 'text-white' : 'text-[#E8E0D5]/50'}`}>
                                        {benefit.tier}
                                    </span>
                                    <span className={`text-[9px] font-mono ${isCurrent ? 'text-[#C9A84C]' : 'text-[#E8E0D5]/35'}`}>
                                        {t('rewards.off', { percent: benefit.discountPercent })}
                                    </span>
                                    {isCurrent && (
                                        <span className="ml-auto text-[8px] font-mono uppercase tracking-widest text-[#C9A84C]">
                                            {t('rewards.you')}
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Right: compact leaderboard */}
                <div className="lg:col-span-3 p-5 bg-[#05081A]/90 border border-[#C9A84C]/10 rounded-2xl">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <Users size={14} className="text-[#C9A84C]" />
                            <h4 className="text-[10px] font-mono uppercase tracking-widest text-[#C9A84C] font-bold">
                                {t('rewards.leaderboard')}
                            </h4>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-[9px] font-mono text-[#C9A84C] bg-[#C9A84C]/10 border border-[#C9A84C]/25">
                            {t('rewards.yourRankOf', { rank: data.myRank, total: data.totalMembers })}
                        </span>
                    </div>

                    {/* City filter — same CITIES dropdown as the full leaderboard */}
                    <div className="relative mb-3">
                        <MapPin size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#C9A84C]/50 pointer-events-none" />
                        <select
                            value={cityFilter}
                            onChange={(e) => setCityFilter(e.target.value)}
                            aria-label={t('lb.filterByCity')}
                            className="w-full appearance-none bg-[#0A0F2C]/60 border border-white/[0.08] text-xs text-white rounded-xl pl-9 pr-8 py-2 outline-none focus:border-[#C9A84C]/50 transition cursor-pointer"
                        >
                            <option value="All" className="bg-[#0A0F2C]">{t('lb.allCities', { count: data.leaderboard.length })}</option>
                            {cityOptions.map(({ city, count }) => (
                                <option key={city} value={city} className="bg-[#0A0F2C]">
                                    {city} &middot; {count}
                                </option>
                            ))}
                        </select>
                        {cityFilter !== 'All' ? (
                            <button
                                onClick={() => setCityFilter('All')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-[#E8E0D5]/40 hover:text-white transition-all cursor-pointer"
                                aria-label={t('lb.clearCity')}
                            >
                                <X size={12} />
                            </button>
                        ) : (
                            <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#E8E0D5]/30 pointer-events-none" />
                        )}
                    </div>

                    <div className="flex flex-col gap-1.5 max-h-80 overflow-y-auto pr-1">
                        {selectedCityHasNoMembers ? (
                            /* A 0-count city selected — invite the visitor
                               to be the first member (same as LeaderboardView). */
                            <div className="py-12 text-center">
                                <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-[#C9A84C]/10 border border-[#C9A84C]/20 flex items-center justify-center">
                                    <MapPin size={20} className="text-[#C9A84C]/70" />
                                </div>
                                <p className="text-xs text-[#E8E0D5]/70">{t('lb.noMembersInCity', { city: cityFilter })}</p>
                                <p className="text-[9px] text-[#E8E0D5]/40 mt-1">
                                    {t('lb.beFirstInCity', { city: cityFilter })}
                                </p>
                                <button
                                    onClick={() => setCityFilter('All')}
                                    aria-label={t('lb.resetCityFilter')}
                                    className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#C9A84C]/15 border border-[#C9A84C]/30 text-[#C9A84C] text-[9px] font-mono uppercase tracking-wider hover:bg-[#C9A84C]/25 transition-all cursor-pointer"
                                >
                                    <DirectionalIcon icon={ArrowLeft} size={11} />
                                    {t('lb.showAllCities')}
                                </button>
                            </div>
                        ) : (
                            filteredEntries.map((entry, index) => {
                            const medal = index < 3 ? RANK_MEDALS[index] : null;
                            const isCurrentUser = entry.isCurrentUser;
                            return (
                                <motion.div
                                    key={`${entry.rank}-${entry.name}`}
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3, delay: index * 0.04 }}
                                    className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-colors ${
                                        isCurrentUser
                                            ? 'bg-[#C9A84C]/10 border border-[#C9A84C]/40'
                                            : 'bg-[#0A0F2C]/40 border border-white/[0.04] hover:bg-[#0A0F2C]/70'
                                    }`}
                                >
                                    <span className="w-6 text-center text-[10px] font-mono font-bold">
                                        {medal ? (
                                            <Medal size={12} className={`inline ${medal}`} />
                                        ) : (
                                            <span className="text-[#E8E0D5]/40">{entry.rank}</span>
                                        )}
                                    </span>
                                    <SmartClamp
                                        as="span"
                                        maxLines={1}
                                        className={`flex-1 text-[11px] font-medium ${isCurrentUser ? 'text-[#C9A84C] font-bold' : 'text-[#E8E0D5]/80'}`}
                                        text={isCurrentUser ? `${memberName} ${t('lb.you')}` : entry.name}
                                    />
                                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-mono uppercase border ${TIER_COLORS[entry.tier]}`}>
                                        {entry.tier}
                                    </span>
                                    <span className="text-[10px] font-mono text-[#E8E0D5]/60 w-16 text-right">
                                        {formatPoints(entry.points)}
                                    </span>
                                </motion.div>
                            );
                        })
                        )}
                    </div>

                    {/* Bottom hints + full leaderboard link */}
                    <div className="flex items-center justify-between mt-4 px-1">
                        <span className="flex items-center gap-1.5 text-[8px] font-mono text-[#E8E0D5]/35">
                            <Gift size={9} className="text-[#C9A84C]/60" />
                            {t('rewards.earnHint')}
                        </span>
                        <span className="flex items-center gap-1.5 text-[8px] font-mono text-[#E8E0D5]/35">
                            <Sparkles size={9} className="text-[#C9A84C]/60" />
                            <Crown size={9} className="text-[#C9A84C]/60" />
                            {t('rewards.perksHint')}
                        </span>
                    </div>

                    <Link
                        href={
                            cityFilter !== 'All'
                                ? `${ROUTES.DASHBOARD_LEADERBOARD}?city=${encodeURIComponent(cityFilter)}`
                                : ROUTES.DASHBOARD_LEADERBOARD
                        }
                        className="mt-4 flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl bg-[#C9A84C]/10 border border-[#C9A84C]/25 text-[#C9A84C] text-[9px] font-mono uppercase tracking-widest hover:bg-[#C9A84C]/20 hover:border-[#C9A84C]/40 transition-all duration-300 group"
                    >
                        {t('rewards.viewFull')}
                        <DirectionalIcon icon={ArrowRight} size={10} className="group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                </div>
            </div>
        </div>
    );
}
