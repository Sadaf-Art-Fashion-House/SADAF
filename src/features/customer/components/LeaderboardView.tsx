'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Search, Users, Medal, Crown, Filter, X, Wifi, WifiOff } from 'lucide-react';
import type { LeaderboardEntry, LeaderboardKind, LoyaltyTier } from '../types';
import { TIER_COLORS, RANK_MEDALS } from '../constants/tierStyles';
import { formatPoints } from '../utils/formatPoints';
import { formatCurrency } from '@/utils/formatCurrency';
import { LEADERBOARD_KIND_LABELS } from '../utils/leaderboard';

interface LeaderboardViewProps {
    /** Full ranked member list (includes the current user). */
    entries: LeaderboardEntry[];
    /** Current user's rank (1-based). */
    myRank: number;
    /** Total number of leaderboard members. */
    totalMembers: number;
    loading: boolean;
    error: string | null;
    /** First name of the logged-in user (for the highlight row). */
    memberName: string;
    /** Which metric the leaderboard is ranked by. */
    kind?: LeaderboardKind;
    /** Optional kinds to show as a switcher (admin/founder variants). */
    kinds?: LeaderboardKind[];
    /** Currently selected kind (when a switcher is shown). */
    activeKind?: LeaderboardKind;
    /** Called when the user picks another kind from the switcher. */
    onKindChange?: (kind: LeaderboardKind) => void;
    /** Whether the WebSocket transport is connected (LIVE badge). */
    isLive?: boolean;
}

const TIER_FILTERS: (LoyaltyTier | 'All')[] = ['All', 'Bronze', 'Silver', 'Gold', 'Heritage', 'Platinum'];

/** Copy per ranking kind for the header + table footer. */
const KIND_COPY: Record<LeaderboardKind, { rankBy: string; footnote: string }> = {
    points: { rankBy: 'loyalty points', footnote: '1 point per $1 spent' },
    sales: { rankBy: 'sales volume', footnote: 'Total sales volume (USD)' },
    designs: { rankBy: 'designs published', footnote: 'Designs & collections published' },
};

/**
 * Full Leaderboard — a wide, searchable, tier-filterable table of the top
 * members. Ranked by loyalty points (customer page) or by sales volume /
 * designs published (admin & founder variants via the kind switcher). The
 * compact RewardsPanel leaderboard on the analysis page is a condensed view
 * of the same data.
 *
 * Column layout (points): Rank / Member / Tier / Metric on md+, Rank /
 * Member / Metric on mobile (the Tier column is hidden there — the mobile
 * grid has only 3 tracks so no dead gap is left behind). For sales/designs
 * kinds the Tier column is hidden on every breakpoint.
 *
 * Live updates stream over the `leaderboard:global` WebSocket channel (the
 * LIVE badge shows the transport state); REST polling is the fallback.
 */
export default function LeaderboardView({
    entries,
    myRank,
    totalMembers,
    loading,
    error,
    memberName,
    kind = 'points',
    kinds,
    activeKind,
    onKindChange,
    isLive = false,
}: LeaderboardViewProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [tierFilter, setTierFilter] = useState<LoyaltyTier | 'All'>('All');

    const metricLabel = LEADERBOARD_KIND_LABELS[kind];
    const copy = KIND_COPY[kind];
    const showTier = kind === 'points';

    /** Format the metric value per kind — sales is currency, others are counts. */
    const formatMetric = (value: number) =>
        kind === 'sales' ? formatCurrency(value) : formatPoints(value);

    const filteredEntries = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        return entries.filter((entry) => {
            const matchesTier = !showTier || tierFilter === 'All' || entry.tier === tierFilter;
            // Match against both the raw name and the rendered name so the
            // current user (displayed as "memberName (You)") is searchable
            // by their real name.
            const renderedName = entry.isCurrentUser ? `${memberName} (You)` : entry.name;
            const matchesSearch = !query ||
                entry.name.toLowerCase().includes(query) ||
                renderedName.toLowerCase().includes(query);
            return matchesTier && matchesSearch;
        });
    }, [entries, searchQuery, tierFilter, memberName, showTier]);

    // totalMembers includes the current user's row, so the member pool
    // (excluding "You") is totalMembers - 1.
    const poolSize = Math.max(0, totalMembers - 1);
    const filterCount = showTier ? entries.length - filteredEntries.length : 0;

    // 3 tracks on mobile everywhere; 4 tracks on md+ only when the Tier
    // column is visible (points kind), otherwise 3.
    const rowGrid = showTier
        ? 'grid-cols-[3.5rem_1fr_6rem] md:grid-cols-[4.5rem_1fr_9rem_8rem]'
        : 'grid-cols-[3.5rem_1fr_6rem] md:grid-cols-[4.5rem_1fr_8rem]';

    return (
        <div className="relative w-full min-h-screen pb-16">
            {/* Background glows */}
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#C9A84C]/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-1/4 left-1/4 w-72 h-72 bg-[#4FC3F7]/5 rounded-full blur-[120px] pointer-events-none" />

            {/* ── Header ── */}
            <section className="relative pt-14 pb-8 px-4 md:px-8 border-b border-[#C9A84C]/10">
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-[#C9A84C]/10 text-[#C9A84C]">
                                <Trophy size={20} />
                            </div>
                            <div>
                                <h1 className="text-xl md:text-2xl font-serif text-white font-bold tracking-tight">
                                    Leaderboard
                                </h1>
                                <p className="text-xs text-[#E8E0D5]/60 mt-0.5">
                                    Top {poolSize.toLocaleString()} members ranked by {copy.rankBy}, plus you
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {/* Live transport indicator */}
                            <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[9px] font-mono uppercase tracking-widest border ${
                                isLive
                                    ? 'text-green-400 border-green-400/25 bg-green-400/5'
                                    : 'text-amber-400/80 border-amber-400/20 bg-amber-400/5'
                            }`}>
                                {isLive ? <Wifi size={10} /> : <WifiOff size={10} />}
                                {isLive ? 'Live' : 'Polling'}
                            </span>
                            <span className="px-3 py-1.5 rounded-full text-[10px] font-mono text-[#C9A84C] bg-[#C9A84C]/10 border border-[#C9A84C]/25">
                                Your rank: #{myRank}
                            </span>
                            <span className="px-3 py-1.5 rounded-full text-[10px] font-mono text-[#E8E0D5]/60 bg-[#0A0F2C]/60 border border-white/10">
                                <Users size={11} className="inline mr-1" />
                                {totalMembers.toLocaleString()} members
                            </span>
                        </div>
                    </motion.div>

                    {/* Kind switcher — shown only when multiple kinds are offered */}
                    {kinds && kinds.length > 1 && (
                        <div className="flex items-center gap-1.5 mt-5 flex-wrap">
                            <Filter size={12} className="text-[#E8E0D5]/30 shrink-0" />
                            {kinds.map((candidate) => (
                                <FilterChip
                                    key={candidate}
                                    label={LEADERBOARD_KIND_LABELS[candidate]}
                                    active={activeKind === candidate}
                                    onClick={() => {
                                        // Reset the loyalty tier filter when switching kinds —
                                        // it is meaningless outside the points ranking.
                                        setTierFilter('All');
                                        onKindChange?.(candidate);
                                    }}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* ── Search + Tier Filter ── */}
            <section className="sticky top-20 z-20 py-4 px-4 md:px-8 bg-[#0A0F2C]/80 backdrop-blur-xl border-b border-white/[0.04]">
                <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
                    {/* Search */}
                    <div className="relative flex-1 max-w-md">
                        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#E8E0D5]/30" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search members by name..."
                            className="w-full bg-[#0A0F2C]/60 border border-white/[0.08] text-xs text-white rounded-xl pl-9 pr-8 py-2.5 outline-none focus:border-[#C9A84C]/50 transition placeholder:text-[#E8E0D5]/20"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-[#E8E0D5]/40 hover:text-white transition-all cursor-pointer"
                                aria-label="Clear search"
                            >
                                <X size={12} />
                            </button>
                        )}
                    </div>

                    {/* Tier filter chips — only for the loyalty-points ranking */}
                    {showTier && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <Filter size={12} className="text-[#E8E0D5]/30 shrink-0" />
                            {TIER_FILTERS.map((tier) => (
                                <FilterChip
                                    key={tier}
                                    label={tier}
                                    active={tierFilter === tier}
                                    onClick={() => setTierFilter(tier)}
                                />
                            ))}
                            {filterCount > 0 && (
                                <span className="text-[9px] font-mono text-[#E8E0D5]/30 ml-1">
                                    {filterCount} hidden
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </section>

            {/* ── Table ── */}
            <section className="py-6 px-4 md:px-8 max-w-7xl mx-auto">
                {error && (
                    <div className="mb-4 px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[10px] font-mono text-amber-400">
                        {error} — showing last values
                    </div>
                )}

                {loading && !entries.length ? (
                    <div className="py-16 flex items-center justify-center">
                        <div className="w-6 h-6 rounded-full border-2 border-[#C9A84C] border-t-transparent animate-spin" />
                        <p className="ml-3 text-[10px] font-mono text-[#E8E0D5]/50">Loading leaderboard…</p>
                    </div>
                ) : filteredEntries.length === 0 ? (
                    <div className="py-16 text-center">
                        <Users size={32} className="mx-auto text-[#E8E0D5]/20 mb-3" />
                        <p className="text-sm text-[#E8E0D5]/60">No members match your filters</p>
                        <p className="text-[10px] text-[#E8E0D5]/40 mt-1">
                            Try a different name or {showTier ? 'tier' : 'metric'}
                        </p>
                    </div>
                ) : (
                    <motion.div layout className="bg-[#05081A]/90 border border-[#C9A84C]/10 rounded-2xl overflow-hidden">
                        {/* Table header */}
                        <div className={`grid ${rowGrid} items-center px-4 md:px-6 py-3 border-b border-white/[0.06] text-[9px] font-mono uppercase tracking-widest text-[#E8E0D5]/40`}>
                            <span>Rank</span>
                            <span>Member</span>
                            {showTier && <span className="hidden md:block">Tier</span>}
                            <span className="text-right">{metricLabel}</span>
                        </div>

                        {/* Rows */}
                        <AnimatePresence initial={false}>
                            {filteredEntries.map((entry, index) => {
                                const medal = index < 3 ? RANK_MEDALS[index] : null;
                                const isCurrentUser = entry.isCurrentUser;
                                return (
                                    <motion.div
                                        key={`${kind}-${entry.rank}-${entry.name}`}
                                        layout
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.98 }}
                                        transition={{ duration: 0.25, delay: Math.min(index * 0.03, 0.6) }}
                                        className={`grid ${rowGrid} items-center px-4 md:px-6 py-3 border-b border-white/[0.03] transition-colors ${
                                            isCurrentUser
                                                ? 'bg-[#C9A84C]/10 border-[#C9A84C]/30'
                                                : 'bg-transparent hover:bg-white/[0.03]'
                                        }`}
                                    >
                                        {/* Rank */}
                                        <span className="w-7 text-center text-[11px] font-mono font-bold">
                                            {medal ? (
                                                <Medal size={14} className={`inline ${medal}`} />
                                            ) : (
                                                <span className="text-[#E8E0D5]/45">{entry.rank}</span>
                                            )}
                                        </span>

                                        {/* Member */}
                                        <span className={`flex items-center gap-2.5 text-xs font-medium truncate ${
                                            isCurrentUser ? 'text-[#C9A84C] font-bold' : 'text-[#E8E0D5]/85'
                                        }`}>
                                            <span className={`w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-[9px] font-bold text-white ${
                                                isCurrentUser
                                                    ? 'bg-gradient-to-br from-[#C9A84C] to-[#8B6914]'
                                                    : index < 3
                                                        ? 'bg-gradient-to-br from-[#1B2A6B] to-[#4FC3F7]/60'
                                                        : 'bg-[#0A0F2C] border border-white/10'
                                            }`}>
                                                {(isCurrentUser ? memberName.charAt(0) : entry.name.charAt(0)).toUpperCase()}
                                            </span>
                                            <span className="truncate">
                                                {isCurrentUser ? `${memberName} (You)` : entry.name}
                                            </span>
                                        </span>

                                        {/* Tier — only for the points ranking */}
                                        {showTier && (
                                            <span className="hidden md:block">
                                                <span className={`inline-block px-2 py-0.5 rounded-full text-[8px] font-mono uppercase border ${TIER_COLORS[entry.tier]}`}>
                                                    {entry.tier}
                                                </span>
                                            </span>
                                        )}

                                        {/* Metric value */}
                                        <span className="text-right text-[11px] font-mono text-[#E8E0D5]/70">
                                            {formatMetric(entry.points)}
                                        </span>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>

                        {/* Footer */}
                        <div className="flex items-center justify-between px-4 md:px-6 py-3 text-[9px] font-mono text-[#E8E0D5]/35">
                            <span className="flex items-center gap-1.5">
                                <Crown size={10} className="text-[#C9A84C]/60" />
                                Showing {filteredEntries.length.toLocaleString()} of {entries.length.toLocaleString()} members
                            </span>
                            <span>{copy.footnote}</span>
                        </div>
                    </motion.div>
                )}
            </section>
        </div>
    );
}

// ─── Small filter chip shared by the kind switcher and tier filters ─────────

function FilterChip({
    label,
    active,
    onClick,
}: {
    label: string;
    active: boolean;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className={`px-3 py-1.5 rounded-lg text-[9px] font-mono uppercase tracking-wider transition-all cursor-pointer ${
                active
                    ? 'bg-[#C9A84C]/20 text-[#C9A84C] border border-[#C9A84C]/30'
                    : 'text-[#E8E0D5]/40 hover:text-white border border-transparent hover:border-white/10'
            }`}
        >
            {label}
        </button>
    );
}
