'use client';

import { useMemo, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Search, Users, Medal, Crown, Filter, X, Wifi, WifiOff, MapPin, ChevronDown, TrendingDown, Swords, Volume2, VolumeX } from 'lucide-react';
import type { LeaderboardEntry, LeaderboardKind, LoyaltyTier, OvertakeEvent } from '../types';
import { TIER_COLORS, RANK_MEDALS } from '../constants/tierStyles';
import { formatPoints } from '../utils/formatPoints';
import { formatCurrency } from '@/utils/formatCurrency';
import { LEADERBOARD_KIND_LABELS, TIER_ORDER, tierMemberCounts } from '../utils/leaderboard';
import { useOvertakeAlerts } from '../hooks/useOvertakeAlerts';
import { playSoftChime } from '@/shared/utils/playSoftChime';

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
    /** Latest "someone overtook you" event (null when nothing new). */
    overtake?: OvertakeEvent | null;
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
    overtake = null,
}: LeaderboardViewProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [tierFilter, setTierFilter] = useState<LoyaltyTier | 'All'>('All');
    const [cityFilter, setCityFilter] = useState<string>('All');

    // Overtake alerts — toast + row flash (on by default) + optional chime,
    // persisted in localStorage by useOvertakeAlerts (same pattern as the
    // My Activity alerts).
    const { preferences: overtakePrefs, toggleEnabled: toggleOvertakeAlerts, toggleSound: toggleOvertakeSound } = useOvertakeAlerts();
    const [activeToast, setActiveToast] = useState<OvertakeEvent | null>(null);
    const [flashUserRow, setFlashUserRow] = useState(false);
    const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // React to a fresh overtake: toast + flash on your row + optional chime.
    // When alerts are disabled, dismiss any toast/flash still showing (the
    // previous effect run may have been mid-display) instead of leaving it
    // stuck — its auto-dismiss timers were cleared by the cleanup.
    useEffect(() => {
        if (!overtakePrefs.enabled) {
            setActiveToast(null);
            setFlashUserRow(false);
            return;
        }
        if (!overtake) return;
        setActiveToast(overtake);
        setFlashUserRow(true);
        if (overtakePrefs.sound) playSoftChime();
        toastTimerRef.current = setTimeout(() => setActiveToast(null), 5_000);
        flashTimerRef.current = setTimeout(() => setFlashUserRow(false), 1_600);
        return () => {
            clearTimeout(toastTimerRef.current ?? undefined);
            clearTimeout(flashTimerRef.current ?? undefined);
        };
    }, [overtake, overtakePrefs.enabled, overtakePrefs.sound]);

    const metricLabel = LEADERBOARD_KIND_LABELS[kind];
    const copy = KIND_COPY[kind];
    const showTier = kind === 'points';

    /** Format the metric value per kind — sales is currency, others are counts. */
    const formatMetric = (value: number) =>
        kind === 'sales' ? formatCurrency(value) : formatPoints(value);

    /** Members matching the search + city filters only (tier excluded) — the
     * base pool the faceted tier counters come from, so the per-tier counts
     * stay meaningful while a tier is selected. */
    const tierBasePool = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        return entries.filter((entry) => {
            // Match against both the raw name and the rendered name so the
            // current user (displayed as "memberName (You)") is searchable
            // by their real name.
            const renderedName = entry.isCurrentUser ? `${memberName} (You)` : entry.name;
            const matchesSearch = !query ||
                entry.name.toLowerCase().includes(query) ||
                renderedName.toLowerCase().includes(query);
            const matchesCity = cityFilter === 'All' || entry.city === cityFilter;
            return matchesSearch && matchesCity;
        });
    }, [entries, searchQuery, cityFilter, memberName]);

    const filteredEntries = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        return entries.filter((entry) => {
            const matchesTier = !showTier || tierFilter === 'All' || entry.tier === tierFilter;
            const renderedName = entry.isCurrentUser ? `${memberName} (You)` : entry.name;
            const matchesSearch = !query ||
                entry.name.toLowerCase().includes(query) ||
                renderedName.toLowerCase().includes(query);
            const matchesCity = cityFilter === 'All' || entry.city === cityFilter;
            return matchesTier && matchesSearch && matchesCity;
        });
    }, [entries, searchQuery, tierFilter, cityFilter, memberName, showTier]);

    // totalMembers includes the current user's row, so the member pool
    // (excluding "You") is totalMembers - 1.
    const poolSize = Math.max(0, totalMembers - 1);
    const filterCount = showTier ? entries.length - filteredEntries.length : 0;

    /** City options derived from the pool — each with its member count. */
    const cityOptions = useMemo(() => {
        const counts = new Map<string, number>();
        for (const entry of entries) {
            counts.set(entry.city, (counts.get(entry.city) ?? 0) + 1);
        }
        return [...counts.entries()]
            .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
            .map(([city, count]) => ({ city, count }));
    }, [entries]);

    /** Members per tier over the search+city base pool (faceted counts). */
    const tierCounts = useMemo(
        () => (showTier ? tierMemberCounts(tierBasePool) : null),
        [tierBasePool, showTier],
    );
    const totalBase = tierBasePool.length;

    // 3 tracks on mobile everywhere; 4 tracks on md+ only when the Tier
    // column is visible (points kind), otherwise 3.
    const rowGrid = showTier
        ? 'grid-cols-[3.5rem_1fr_6rem] md:grid-cols-[4.5rem_1fr_9rem_8rem]'
        : 'grid-cols-[3.5rem_1fr_6rem] md:grid-cols-[4.5rem_1fr_8rem]';

    return (
        <div className="relative w-full min-h-screen pb-16">
            {/* Overtake toast — "someone overtook you" */}
            <AnimatePresence>
                {activeToast && (
                    <motion.div
                        initial={{ opacity: 0, y: -12, x: 24 }}
                        animate={{ opacity: 1, y: 0, x: 0 }}
                        exit={{ opacity: 0, y: -12, x: 24 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                        role="status"
                        className="fixed top-24 right-4 md:right-8 z-50 max-w-sm flex items-start gap-3 px-4 py-3 rounded-xl bg-[#1A1030]/95 border border-red-400/30 shadow-2xl shadow-black/60 backdrop-blur-xl"
                    >
                        <span className="p-2 rounded-lg bg-red-400/10 text-red-300 shrink-0">
                            <TrendingDown size={14} />
                        </span>
                        <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-semibold text-white">
                                {activeToast.overtakenBy} overtook you
                            </p>
                            <p className="text-[10px] text-[#E8E0D5]/60 mt-0.5 font-mono">
                                Your rank dropped from #{activeToast.previousRank} to #{activeToast.newRank}
                            </p>
                        </div>
                        <button
                            onClick={() => setActiveToast(null)}
                            className="p-0.5 rounded text-[#E8E0D5]/40 hover:text-white transition-colors cursor-pointer shrink-0"
                            aria-label="Dismiss"
                        >
                            <X size={12} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

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

                            {/* Overtake alert toggles — same pattern as the My Activity alerts */}
                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={toggleOvertakeAlerts}
                                    aria-pressed={overtakePrefs.enabled}
                                    aria-label={overtakePrefs.enabled ? 'Disable overtake alerts' : 'Enable overtake alerts'}
                                    title={overtakePrefs.enabled
                                        ? 'Overtake alerts ON — toast + flash when someone passes you'
                                        : 'Overtake alerts OFF — click to get toast + flash when someone passes you'}
                                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[9px] font-mono uppercase tracking-wider border transition-all cursor-pointer ${
                                        overtakePrefs.enabled
                                            ? 'text-[#4FC3F7] border-[#4FC3F7]/30 bg-[#4FC3F7]/10 hover:border-[#4FC3F7]/60'
                                            : 'text-[#E8E0D5]/40 border-white/10 hover:text-white hover:border-white/25'
                                    }`}
                                >
                                    <Swords size={10} />
                                    {overtakePrefs.enabled ? 'Alerts' : 'Alerts off'}
                                </button>
                                <button
                                    onClick={toggleOvertakeSound}
                                    aria-pressed={overtakePrefs.sound}
                                    aria-label={overtakePrefs.sound ? 'Mute overtake sound' : 'Enable overtake sound'}
                                    title={overtakePrefs.sound
                                        ? 'Sound ON — plays a soft chime when someone passes you'
                                        : 'Sound OFF — click to play a soft chime when someone passes you'}
                                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[9px] font-mono uppercase tracking-wider border transition-all cursor-pointer ${
                                        overtakePrefs.sound
                                            ? 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10 hover:border-emerald-400/60'
                                            : 'text-[#E8E0D5]/40 border-white/10 hover:text-emerald-400/80 hover:border-emerald-400/30'
                                    }`}
                                >
                                    {overtakePrefs.sound ? <Volume2 size={10} /> : <VolumeX size={10} />}
                                    {overtakePrefs.sound ? 'Sound' : 'Muted'}
                                </button>
                            </div>
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

                    {/* City filter dropdown */}
                    <div className="relative w-full lg:w-60 shrink-0">
                        <MapPin size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#C9A84C]/50 pointer-events-none" />
                        <select
                            value={cityFilter}
                            onChange={(e) => setCityFilter(e.target.value)}
                            aria-label="Filter by city"
                            className="w-full appearance-none bg-[#0A0F2C]/60 border border-white/[0.08] text-xs text-white rounded-xl pl-9 pr-8 py-2.5 outline-none focus:border-[#C9A84C]/50 transition cursor-pointer"
                        >
                            <option value="All" className="bg-[#0A0F2C]">All cities &middot; {entries.length}</option>
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
                                aria-label="Clear city filter"
                            >
                                <X size={12} />
                            </button>
                        ) : (
                            <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#E8E0D5]/30 pointer-events-none" />
                        )}
                    </div>

                    {/* Tier filter chips — only for the loyalty-points ranking */}
                    {showTier && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <Filter size={12} className="text-[#E8E0D5]/30 shrink-0" />
                            {TIER_FILTERS.map((tier) => (
                                <FilterChip
                                    key={tier}
                                    label={tier === 'All' ? `All · ${totalBase}` : `${tier} · ${tierCounts?.[tier] ?? 0}`}
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
                            Try a different name, city, or {showTier ? 'tier' : 'metric'}
                        </p>
                    </div>
                ) : (
                    <motion.div layout className="bg-[#05081A]/90 border border-[#C9A84C]/10 rounded-2xl overflow-hidden">
                        {/* Tier distribution — member counter per tier, in the
                            same table (points ranking only). Clicking a segment
                            toggles the tier filter, synced with the chips. */}
                        {showTier && tierCounts && (
                            <div className="grid grid-cols-5 gap-px bg-white/[0.04]">
                                {TIER_ORDER.map((tier) => {
                                    const count = tierCounts[tier];
                                    const share = totalBase > 0 ? Math.round((count / totalBase) * 100) : 0;
                                    const isActive = tierFilter === tier;
                                    return (
                                        <button
                                            key={tier}
                                            onClick={() => setTierFilter(isActive ? 'All' : tier)}
                                            aria-pressed={isActive}
                                            title={`${count} member${count === 1 ? '' : 's'} in ${tier}`}
                                            className={`flex flex-col items-center gap-1 px-2 py-2.5 bg-[#05081A] transition-colors cursor-pointer ${
                                                isActive ? 'bg-[#C9A84C]/10' : 'hover:bg-[#0A0F2C]'
                                            }`}
                                        >
                                            <span className="flex items-center gap-1.5">
                                                <span className={`w-1.5 h-1.5 rounded-full ${TIER_COLORS[tier].split(' ')[0]}`} />
                                                <span className={`text-[8px] font-mono uppercase tracking-widest ${isActive ? 'text-white' : 'text-[#E8E0D5]/45'}`}>
                                                    {tier}
                                                </span>
                                            </span>
                                            <span className={`text-[11px] font-mono font-bold ${isActive ? 'text-[#C9A84C]' : 'text-[#E8E0D5]/80'}`}>
                                                {count}
                                            </span>
                                            <span className="w-full h-1 rounded-full bg-white/[0.06] overflow-hidden">
                                                <span
                                                    className="block h-full rounded-full bg-gradient-to-r from-[#C9A84C]/40 to-[#C9A84C] transition-all duration-500"
                                                    style={{ width: `${share}%` }}
                                                />
                                            </span>
                                            <span className="text-[7px] font-mono text-[#E8E0D5]/25">{share}%</span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}

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
                                            isCurrentUser && flashUserRow
                                                ? 'bg-red-500/15 border-red-400/50 animate-pulse'
                                                : isCurrentUser
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
                                        <span className={`flex items-center gap-2.5 text-xs font-medium min-w-0 ${
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
                                            <span className="flex flex-col min-w-0">
                                                <span className="truncate">
                                                    {isCurrentUser ? `${memberName} (You)` : entry.name}
                                                </span>
                                                <span className="flex items-center gap-1 text-[8px] font-mono text-[#E8E0D5]/35 mt-0.5">
                                                    <MapPin size={8} className="shrink-0 text-[#C9A84C]/60" />
                                                    {entry.city}
                                                </span>
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
                                Showing {filteredEntries.length.toLocaleString()} of {entries.length.toLocaleString()} members{cityFilter !== 'All' ? ` · ${cityFilter}` : ''}
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
