'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import {
    Users,
    RefreshCw,
    Medal,
    Gift,
    TrendingUp,
    Clock,
    Wifi,
    WifiOff,
    Heart,
    MapPin,
    Calendar,
    Check,
    X,
    Inbox,
    ChevronRight,
} from 'lucide-react';
import { DirectionalIcon } from '@/shared/ui/DirectionalIcon';
import type { CommunityOverviewData, PlatformPendingRequest, ReferredMember } from '../types';
import { useCityFilter } from '@/features/customer/hooks/useCityFilter';
import { useLanguage } from '@/features/i18n/LanguageProvider';
import type { TranslationKey } from '@/features/i18n/dictionaries';
import AdminActionToast, { type AdminActionToastData } from './AdminActionToast';

/**
 * SADAF | Community Overview (Admin / Founder) — pure presentation.
 *
 * Platform-wide view of the referral community: KPI cards, top referrers,
 * monthly referral-driven growth, pending connection requests, and member
 * role distribution. Data streams from useCommunityOverview (WebSocket
 * `community:admin`, REST fallback). Pending requests can be resolved here
 * (Accept / Decline) and filtered by city & date.
 */

interface CommunityOverviewViewProps {
    data: CommunityOverviewData | null;
    loading: boolean;
    error: string | null;
    /** Whether the WebSocket transport is connected (LIVE badge). */
    isLive?: boolean;
    onRefresh: () => void;
    /** Resolve a pending request (Accept / Decline) — resolves to the outcome. */
    onResolve: (id: string, action: 'accept' | 'decline') => Promise<{ ok: boolean; error?: string }>;
    /** Id of the request currently being resolved (spinner on its row). */
    resolvingId?: string | null;
    /** Deep-link: ?referrer=<id> — auto-opens that referrer's network snapshot. */
    initialReferrer?: string;
}

const DATE_FILTERS: Array<{ value: string; labelKey: 'communityOverview.date.all' | 'communityOverview.date.today' | 'communityOverview.date.7d' | 'communityOverview.date.30d' }> = [
    { value: 'all', labelKey: 'communityOverview.date.all' },
    { value: 'today', labelKey: 'communityOverview.date.today' },
    { value: '7d', labelKey: 'communityOverview.date.7d' },
    { value: '30d', labelKey: 'communityOverview.date.30d' },
];

const RANK_MEDALS = ['text-[#FFD700]', 'text-slate-300', 'text-amber-600'];

const REFERRER_PERIODS = [
    { value: 'all', labelKey: 'communityOverview.periodAll' as const },
    { value: '90d', labelKey: 'communityOverview.period90d' as const },
    { value: '30d', labelKey: 'communityOverview.period30d' as const },
] as const;

type ReferrerPeriod = (typeof REFERRER_PERIODS)[number]['value'];

/** Compact "5d ago / 3w ago / 4mo ago" label for a member join date. */
function daysAgoLabel(iso: string, t: (key: TranslationKey, vars?: Record<string, string | number>) => string, _language: string): string {
    const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
    if (days <= 0) return t('communityOverview.today');
    if (days === 1) return t('communityOverview.oneDayAgo');
    if (days < 30) return t('communityOverview.daysAgo', { count: days });
    if (days < 60) return t('communityOverview.weeksAgo', { count: Math.floor(days / 7) });
    return t('communityOverview.monthsAgo', { count: Math.floor(days / 30) });
}

export default function CommunityOverviewView({
    data,
    loading,
    error,
    isLive = false,
    onRefresh,
    onResolve,
    resolvingId = null,
    initialReferrer,
}: CommunityOverviewViewProps) {
    const { t, language } = useLanguage();
    const router = useRouter();
    const pathname = usePathname();
    const maxGrowth = useMemo(
        () => (data ? Math.max(...data.growthByMonth.map((point) => point.members), 1) : 1),
        [data],
    );
    const totalReferralShare = useMemo(() => {
        if (!data) return 0;
        const total = data.growthByMonth.reduce((sum, point) => sum + point.members, 0);
        const via = data.growthByMonth.reduce((sum, point) => sum + point.viaReferrals, 0);
        return total > 0 ? Math.round((via / total) * 100) : 0;
    }, [data]);
    const roleTotal = useMemo(
        () => (data ? data.roleDistribution.reduce((sum, entry) => sum + entry.count, 0) : 0),
        [data],
    );

    // ─── Pending-request filters (city + date) ──────────────────────────────
    // City dropdown reuses the shared useCityFilter (full CITIES list, counts,
    // empty-city detection) so the admin panel behaves exactly like the
    // customer leaderboard filters.
    const { cityFilter, setCityFilter, cityOptions, selectedCityHasNoMembers } = useCityFilter(
        data?.pendingRequests ?? [],
    );
    const [dateFilter, setDateFilter] = useState<string>('all');

    const DAY_MS = 86_400_000;
    const filteredRequests = useMemo(() => {
        if (!data) return [];
        const now = Date.now();
        return data.pendingRequests.filter((request) => {
            if (cityFilter !== 'All' && request.city !== cityFilter) return false;
            const ageMs = now - new Date(request.createdAt).getTime();
            if (dateFilter === 'today') return ageMs <= DAY_MS;
            if (dateFilter === '7d') return ageMs <= 7 * DAY_MS;
            if (dateFilter === '30d') return ageMs <= 30 * DAY_MS;
            return true;
        });
    }, [data, cityFilter, dateFilter]);

    const clearPendingFilters = () => {
        setCityFilter('All');
        setDateFilter('all');
    };

    // ─── Action confirmation toast ──────────────────────────────────────────
    // Quick green/red feedback (My Activity style) after Accept / Decline.
    const [toast, setToast] = useState<AdminActionToastData | null>(null);
    const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const dismissToast = useCallback(() => {
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        setToast(null);
    }, []);

    const showToast = useCallback((kind: 'success' | 'decline' | 'error', title: string, message: string) => {
        setToast({ id: Date.now(), kind, title, message });
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        toastTimerRef.current = setTimeout(() => setToast(null), 3_500);
    }, []);

    // Clear any pending auto-dismiss timer when the page unmounts.
    useEffect(() => () => {
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    }, []);

    const handleResolve = useCallback(
        async (request: PlatformPendingRequest, action: 'accept' | 'decline') => {
            const outcome = await onResolve(request.id, action);
            if (outcome?.ok) {
                showToast(
                    action === 'accept' ? 'success' : 'decline',
                    action === 'accept' ? t('communityOverview.requestAccepted') : t('communityOverview.requestDeclined'),
                    action === 'accept'
                        ? t('communityOverview.requestAdded', { name: request.name })
                        : t('communityOverview.requestRemoved', { name: request.name }),
                );
            } else {
                showToast('error', t('communityOverview.couldNotResolve'), outcome?.error ?? t('communityOverview.unknownError'));
            }
        },
        [onResolve, showToast],
    );

    // ─── Referrer network snapshot (deep-link) ─────────────────────────────
    // Clicking a referrer row opens a modal with who they brought (and their
    // cities) and updates the URL to ?referrer=<id> so the view is shareable.
    const [selectedReferrerId, setSelectedReferrerId] = useState<string | null>(
        initialReferrer ?? null,
    );
    const selectedReferrer = useMemo(
        () => data?.topReferrers.find((referrer) => referrer.id === selectedReferrerId) ?? null,
        [data, selectedReferrerId],
    );

    const openReferrer = useCallback(
        (id: string) => {
            setSelectedReferrerId(id);
            router.replace(`${pathname}?referrer=${encodeURIComponent(id)}`, { scroll: false });
        },
        [router, pathname],
    );

    const closeReferrer = useCallback(() => {
        setSelectedReferrerId(null);
        router.replace(pathname, { scroll: false });
    }, [router, pathname]);

    const referrerUniqueCities = useMemo(() => {
        if (!selectedReferrer) return 0;
        return new Set(selectedReferrer.recentReferrals.map((member) => member.city)).size;
    }, [selectedReferrer]);

    // ─── Top Referrers period filter ────────────────────────────────────────
    // Restricts each referrer's recent-referrals detail to the selected
    // period (the all-time referred / rewards numbers stay untouched).
    const [referrerPeriod, setReferrerPeriod] = useState<ReferrerPeriod>('all');
    const recentReferralsByReferrer = useMemo(() => {
        const map = new Map<string, ReferredMember[]>();
        if (!data) return map;
        const cutoffDays = referrerPeriod === '30d' ? 30 : referrerPeriod === '90d' ? 90 : Infinity;
        const cutoff = Date.now() - cutoffDays * DAY_MS;
        for (const referrer of data.topReferrers) {
            const recent = referrer.recentReferrals
                .filter((member) => referrerPeriod === 'all' || new Date(member.joinedAt).getTime() >= cutoff)
                .slice(0, 3);
            map.set(referrer.id, recent);
        }
        return map;
    }, [data, referrerPeriod]);

    return (
        <div className="relative w-full min-h-screen pb-16">
            {/* Background glows */}
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#C9A84C]/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-1/4 left-1/4 w-72 h-72 bg-[#4FC3F7]/5 rounded-full blur-[120px] pointer-events-none" />

            {/* ── Hero / Header ── */}
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
                                <Users size={20} />
                            </div>
                            <div>
                                <h1 className="text-xl md:text-2xl font-serif text-white font-bold tracking-tight">
                                    {t('communityOverview.title')}
                                </h1>
                                <p className="text-xs text-[#E8E0D5]/60 mt-0.5">
                                    {t('communityOverview.subtitle')}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2.5">
                            {/* Live transport indicator — WebSocket pushes the
                                overview every 10s; polling is the fallback. */}
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-mono uppercase tracking-widest border ${
                                isLive
                                    ? 'text-green-400 border-green-400/25 bg-green-400/5'
                                    : 'text-amber-400/80 border-amber-400/20 bg-amber-400/5'
                            }`}>
                                {isLive ? <Wifi size={10} /> : <WifiOff size={10} />}
                                {isLive ? t('communityOverview.live') : t('communityOverview.polling')}
                            </span>
                            <button
                                onClick={onRefresh}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-mono uppercase tracking-widest border border-[#C9A84C]/30 text-[#C9A84C] hover:bg-[#C9A84C]/10 transition-all cursor-pointer"
                            >
                                <RefreshCw size={10} className={loading ? 'animate-spin' : ''} />
                                {t('communityOverview.refresh')}
                            </button>
                        </div>
                    </motion.div>
                </div>
            </section>

            <section className="py-6 px-4 md:px-8 max-w-7xl mx-auto">
                {error && (
                    <div className="mb-4 px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[10px] font-mono text-amber-400">
                        {error}{t('communityOverview.errorSuffix')}
                    </div>
                )}

                {loading && !data ? (
                    <div className="py-16 flex items-center justify-center">
                        <div className="w-6 h-6 rounded-full border-2 border-[#C9A84C] border-t-transparent animate-spin" />
                        <p className="ml-3 text-[10px] font-mono text-[#E8E0D5]/50">{t('communityOverview.loading')}</p>
                    </div>
                ) : !data ? (
                    <div className="py-16 text-center">
                        <Users size={32} className="mx-auto text-[#E8E0D5]/20 mb-3" />
                        <p className="text-sm text-[#E8E0D5]/60">{t('communityOverview.notAvailable')}</p>
                    </div>
                ) : (
                    <>
                        {/* ── KPI Cards ── */}
                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
                            {data.kpis.map((kpi, index) => (
                                <motion.div
                                    key={kpi.label}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.35, delay: index * 0.05 }}
                                    className="group flex flex-col items-center p-4 bg-[#0A0F2C]/60 border border-white/[0.05] hover:border-[#C9A84C]/20 rounded-2xl transition-all duration-300"
                                >
                                    <p className={`text-lg font-serif text-white font-bold ${kpi.color}`}>
                                        {kpi.value}
                                    </p>
                                    <p className="mt-1 text-[8px] font-mono uppercase tracking-[0.15em] text-[#E8E0D5]/40 font-semibold text-center leading-relaxed">
                                        {kpi.label}
                                    </p>
                                    <p className="mt-1 text-[8px] font-mono text-[#E8E0D5]/30">
                                        {kpi.growth}
                                    </p>
                                </motion.div>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
                            {/* ── Left: Top Referrers + Role Distribution ── */}
                            <div className="lg:col-span-5 space-y-6">
                                <div className="p-5 bg-[#05081A]/90 border border-[#C9A84C]/10 rounded-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-[10px] font-mono uppercase tracking-widest text-[#C9A84C] font-bold flex items-center gap-2">
                                            <Gift size={12} /> {t('communityOverview.topReferrers')}
                                        </h3>
                                        {/* Period filter — narrows the recent-referrals detail under each row */}
                                        <div className="flex items-center gap-1">
                                            {REFERRER_PERIODS.map((period) => (
                                                <button
                                                    key={period.value}
                                                    onClick={() => setReferrerPeriod(period.value)}
                                                    aria-pressed={referrerPeriod === period.value}
                                                    className={`px-2 py-1 rounded-full text-[8px] font-mono uppercase tracking-widest border transition-all cursor-pointer ${
                                                        referrerPeriod === period.value
                                                            ? 'text-[#C9A84C] border-[#C9A84C]/50 bg-[#C9A84C]/10'
                                                            : 'text-[#E8E0D5]/40 border-white/[0.08] hover:text-white'
                                                    }`}
                                                >
                                                    {t(period.labelKey)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        {data.topReferrers.map((referrer, index) => {
                                            const recentMembers = recentReferralsByReferrer.get(referrer.id) ?? [];
                                            return (
                                                <div
                                                    key={referrer.id}
                                                    onClick={() => openReferrer(referrer.id)}
                                                    role="button"
                                                    tabIndex={0}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' || e.key === ' ') {
                                                            e.preventDefault();
                                                            openReferrer(referrer.id);
                                                        }
                                                    }}
                                                    aria-label={t('communityOverview.viewSnapshotOf', { name: referrer.name })}
                                                    title={t('communityOverview.viewSnapshot')}
                                                    className="group/referrer p-3 bg-[#0A0F2C]/40 border border-white/[0.05] rounded-xl transition-all cursor-pointer hover:border-[#C9A84C]/40 hover:bg-[#0A0F2C]/60"
                                                >
                                                    {/* Header row: rank + avatar + name/code + all-time totals */}
                                                    <div className="flex items-center gap-3">
                                                        <span className="w-8 shrink-0 flex justify-center">
                                                            {index < 3 ? (
                                                                <Medal size={16} className={RANK_MEDALS[index]} />
                                                            ) : (
                                                                <span className="text-[11px] font-mono text-[#E8E0D5]/45">
                                                                    {index + 1}
                                                                </span>
                                                            )}
                                                        </span>
                                                        <div className="w-8 h-8 shrink-0 rounded-full bg-gradient-to-br from-[#4FC3F7] to-[#1B2A6B] flex items-center justify-center text-[10px] font-bold text-white">
                                                            {referrer.name.charAt(0)}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs text-white font-medium truncate">
                                                                {referrer.name}
                                                            </p>
                                                            <p className="text-[8px] font-mono text-[#C9A84C]/70 truncate">
                                                                {referrer.referralCode}
                                                            </p>
                                                        </div>
                                                        <div className="text-right shrink-0">
                                                            <p className="text-[11px] font-mono font-bold text-white">
                                                                {referrer.referred}
                                                            </p>
                                                            <p className="text-[8px] font-mono text-[#E8E0D5]/40">
                                                                ${referrer.rewards.toLocaleString()}
                                                            </p>
                                                        </div>
                                                        <DirectionalIcon
                                                            icon={ChevronRight}
                                                            size={12}
                                                            className="shrink-0 text-[#E8E0D5]/20 group-hover/referrer:text-[#C9A84C] transition-colors"
                                                        />
                                                    </div>
                                                    {/* Recent referrals within the selected period (up to 3) */}
                                                    {recentMembers.length > 0 ? (
                                                        <div className="mt-2.5 pt-2.5 border-t border-white/[0.05] space-y-1.5">
                                                            {recentMembers.map((member) => (
                                                                <div key={member.id} className="flex items-center gap-2 pl-11">
                                                                    <span className="w-4 h-4 shrink-0 rounded-full bg-[#C9A84C]/15 text-[#C9A84C] flex items-center justify-center text-[7px] font-bold">
                                                                        {member.name.charAt(0)}
                                                                    </span>
                                                                    <span className="flex-1 min-w-0 text-[9px] text-[#E8E0D5]/70 truncate">
                                                                        {member.name}
                                                                    </span>
                                                                    <span className="shrink-0 inline-flex items-center gap-0.5 text-[8px] font-mono text-[#E8E0D5]/40">
                                                                        <MapPin size={7} /> {member.city}
                                                                    </span>
                                                                    <span className="shrink-0 w-14 text-right text-[8px] font-mono text-[#E8E0D5]/35">                                        {daysAgoLabel(member.joinedAt, t, language)}
                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p className="mt-2 pt-2 border-t border-white/[0.05] pl-11 text-[8px] font-mono text-[#E8E0D5]/30">
                                                            {referrerPeriod === 'all' ? t('communityOverview.noReferralsPeriod') : t('communityOverview.noReferralsLast', { period: referrerPeriod })}
                                                        </p>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="p-5 bg-[#05081A]/90 border border-[#C9A84C]/10 rounded-2xl">
                                    <h3 className="text-[10px] font-mono uppercase tracking-widest text-[#C9A84C] font-bold flex items-center gap-2 mb-4">
                                        <Users size={12} /> {t('communityOverview.memberRoles')}
                                    </h3>
                                    <div className="space-y-2.5">
                                        {data.roleDistribution.map((entry) => {
                                            const share = roleTotal > 0 ? Math.round((entry.count / roleTotal) * 100) : 0;
                                            return (
                                                <div key={entry.role} className="flex items-center gap-3">
                                                    <span className="w-24 shrink-0 text-[9px] font-mono uppercase tracking-wider text-[#E8E0D5]/50">
                                                        {entry.role}
                                                    </span>
                                                    <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${share}%` }}
                                                            transition={{ duration: 0.6, delay: 0.2 }}
                                                            className="h-full rounded-full bg-gradient-to-r from-[#C9A84C]/40 to-[#C9A84C]"
                                                        />
                                                    </div>
                                                    <span className="w-10 shrink-0 text-right text-[10px] font-mono text-[#E8E0D5]/70">
                                                        {entry.count}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* ── Right: Growth + Pending Requests ── */}
                            <div className="lg:col-span-7 space-y-6">
                                <div className="p-5 bg-[#05081A]/90 border border-[#C9A84C]/10 rounded-2xl">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-[10px] font-mono uppercase tracking-widest text-[#C9A84C] font-bold flex items-center gap-2">
                                            <TrendingUp size={12} /> {t('communityOverview.networkGrowth')}
                                        </h3>
                                        <span className="text-[8px] font-mono text-[#E8E0D5]/35">
                                            {t('communityOverview.viaReferrals', { share: totalReferralShare })}
                                        </span>
                                    </div>
                                    <div className="flex items-end gap-2 h-36">
                                        {data.growthByMonth.map((point) => (
                                            <div
                                                key={point.month}
                                                className="flex-1 h-full flex flex-col items-center gap-1.5 group"
                                            >
                                                {/* Definite-height bar area — % heights resolve against
                                                    this flex-1 box, not a zero-height wrapper. */}
                                                <div className="relative w-full flex-1 min-h-0">
                                                    {/* All members (slate, behind) */}
                                                    <div
                                                        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2.5 rounded-t bg-[#E8E0D5]/15 transition-all duration-500"
                                                        style={{ height: `${(point.members / maxGrowth) * 100}%` }}
                                                    />
                                                    {/* Via referrals (gold, in front) */}
                                                    <div
                                                        className="absolute bottom-0 left-1/2 -translate-x-1/2 z-10 w-2.5 rounded-t bg-gradient-to-t from-[#8B6914] to-[#C9A84C] transition-all duration-500"
                                                        style={{ height: `${(point.viaReferrals / maxGrowth) * 100}%` }}
                                                    />
                                                    <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[8px] font-mono text-[#E8E0D5]/0 group-hover:text-[#E8E0D5]/70 transition-all">
                                                        {point.members}
                                                    </span>
                                                </div>
                                                <span className="text-[8px] font-mono text-[#E8E0D5]/40">
                                                    {point.month}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/[0.05]">
                                        <span className="flex items-center gap-1.5 text-[8px] font-mono uppercase tracking-wider text-[#E8E0D5]/40">
                                            <span className="w-2 h-2 rounded-sm bg-[#E8E0D5]/15" /> {t('communityOverview.allMembers')}
                                        </span>
                                        <span className="flex items-center gap-1.5 text-[8px] font-mono uppercase tracking-wider text-[#E8E0D5]/40">
                                            <span className="w-2 h-2 rounded-sm bg-[#C9A84C]" /> {t('communityOverview.viaReferralsShort')}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-5 bg-[#05081A]/90 border border-orange-500/20 rounded-2xl">
                                    <h3 className="text-[10px] font-mono uppercase tracking-widest text-orange-400 font-bold flex items-center gap-2 mb-3">
                                        <Clock size={12} /> {t('communityOverview.pendingRequests', { count: filteredRequests.length })}
                                    </h3>

                                    {/* Filters — city dropdown (full CITIES list) + date range */}
                                    <div className="flex flex-col sm:flex-row gap-2 mb-3">
                                        <div className="relative flex-1 min-w-0">
                                            <MapPin size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-400/50 pointer-events-none" />
                                            <select
                                                value={cityFilter}
                                                onChange={(e) => setCityFilter(e.target.value)}
                                                aria-label={t('communityOverview.filterByCity')}
                                                className="w-full appearance-none bg-[#0A0F2C]/60 border border-white/[0.08] text-[10px] text-white rounded-lg pl-8 pr-7 py-2 outline-none focus:border-orange-500/40 transition cursor-pointer"
                                            >
                                                <option value="All" className="bg-[#0A0F2C]">{t('communityOverview.allCities', { count: data.pendingRequests.length })}</option>
                                                {cityOptions.map(({ city, count }) => (
                                                    <option key={city} value={city} className="bg-[#0A0F2C]">
                                                        {city} · {count}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="relative flex-1 min-w-0">
                                            <Calendar size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-400/50 pointer-events-none" />
                                            <select
                                                value={dateFilter}
                                                onChange={(e) => setDateFilter(e.target.value)}
                                                aria-label={t('communityOverview.filterByDate')}
                                                className="w-full appearance-none bg-[#0A0F2C]/60 border border-white/[0.08] text-[10px] text-white rounded-lg pl-8 pr-7 py-2 outline-none focus:border-orange-500/40 transition cursor-pointer"
                                            >
                                                {DATE_FILTERS.map((option) => (
                                                    <option key={option.value} value={option.value} className="bg-[#0A0F2C]">
                                                        {t(option.labelKey)}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        {(cityFilter !== 'All' || dateFilter !== 'all') && (
                                            <button
                                                onClick={clearPendingFilters}
                                                className="shrink-0 inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-[9px] font-mono uppercase tracking-widest border border-white/[0.08] text-[#E8E0D5]/60 hover:text-white hover:border-orange-500/30 transition-all cursor-pointer"
                                            >
                                                <X size={10} /> {t('communityOverview.clear')}
                                            </button>
                                        )}
                                    </div>

                                    {filteredRequests.length === 0 ? (
                                        <div className="py-10 text-center">
                                            <Inbox size={24} className="mx-auto text-[#E8E0D5]/20 mb-2" />
                                            <p className="text-xs text-[#E8E0D5]/60">
                                                {selectedCityHasNoMembers
                                                    ? t('communityOverview.noMembersCity', { city: cityFilter })
                                                    : t('communityOverview.noPendingMatch')}
                                            </p>
                                            {(cityFilter !== 'All' || dateFilter !== 'all') && (
                                                <button
                                                    onClick={clearPendingFilters}
                                                    className="mt-3 text-[9px] font-mono uppercase tracking-widest text-orange-400 hover:text-white transition-colors cursor-pointer"
                                                >
                                                    {t('communityOverview.showAllCities')}
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {filteredRequests.map((request) => {
                                                const isResolving = resolvingId === request.id;
                                                return (
                                                    <div
                                                        key={request.id}
                                                        className="flex items-center gap-3 p-3 bg-[#0A0F2C]/40 border border-white/[0.05] rounded-xl transition-all hover:border-orange-500/20"
                                                    >
                                                        <div className="w-9 h-9 shrink-0 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-[10px] font-bold text-[#0A0F2C]">
                                                            {request.name.charAt(0)}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs text-white font-medium truncate">
                                                                {request.name}
                                                            </p>
                                                            <p className="text-[9px] font-mono text-[#E8E0D5]/50 truncate">
                                                                {request.email}
                                                            </p>
                                                        </div>
                                                        <div className="text-right shrink-0">
                                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-mono uppercase tracking-wider border ${
                                                                request.type === 'family'
                                                                    ? 'text-emerald-400 border-emerald-500/25 bg-emerald-500/5'
                                                                    : 'text-amber-400 border-amber-500/25 bg-amber-500/5'
                                                            }`}>
                                                                <Heart size={8} />
                                                                {request.type}
                                                            </span>
                                                            <p className="text-[8px] font-mono text-[#E8E0D5]/35 mt-1 truncate">
                                                                <MapPin size={8} className="inline mr-0.5" />
                                                                {request.city} · via {request.invitedBy} · {new Date(request.createdAt).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                        <div className="flex flex-col gap-1.5 shrink-0">
                                                            <button
                                                                onClick={() => handleResolve(request, 'accept')}
                                                                disabled={isResolving}
                                                                className="inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-lg text-[8px] font-mono font-bold uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                                                            >
                                                                {isResolving ? (
                                                                    <span className="w-2.5 h-2.5 rounded-full border border-emerald-400 border-t-transparent animate-spin" />
                                                                ) : (
                                                                    <Check size={9} />
                                                                )}
                                                                {t('communityOverview.accept')}
                                                            </button>
                                                            <button
                                                                onClick={() => handleResolve(request, 'decline')}
                                                                disabled={isResolving}
                                                                className="inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-lg text-[8px] font-mono font-bold uppercase tracking-wider bg-red-500/10 border border-red-500/25 text-red-400 hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                                                            >
                                                                <X size={9} />
                                                                {t('communityOverview.decline')}
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </section>

            {/* Action confirmation toast — portal to body, top-right */}
            <AdminActionToast toast={toast} onDismiss={dismissToast} />

            {/* ── Referrer Network Snapshot Modal ── */}
            <AnimatePresence>
                {selectedReferrer && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                            onClick={closeReferrer}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 260 }}
                            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md p-6 bg-[#0A0F2C]/98 border border-[#C9A84C]/20 rounded-2xl shadow-xl shadow-[#C9A84C]/10 backdrop-blur-xl"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#4FC3F7] to-[#1B2A6B] flex items-center justify-center text-[11px] font-bold text-white">
                                        {selectedReferrer.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h2 className="text-sm font-serif text-white font-semibold">
                                            {selectedReferrer.name}
                                        </h2>
                                        <p className="text-[9px] font-mono text-[#C9A84C]/70">
                                            {selectedReferrer.referralCode}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={closeReferrer}
                                    className="p-1.5 rounded-lg text-[#E8E0D5]/40 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
                                    aria-label={t('communityOverview.closeSnapshot')}
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            {/* Totals */}
                            <div className="grid grid-cols-3 gap-2 mb-4">
                                <div className="p-2.5 rounded-xl bg-[#0A0F2C]/50 border border-white/[0.05] text-center">
                                    <p className="text-sm font-mono font-bold text-white">{selectedReferrer.referred}</p>
                                    <p className="mt-0.5 text-[7px] font-mono uppercase tracking-widest text-[#E8E0D5]/40">{t('communityOverview.referred')}</p>
                                </div>
                                <div className="p-2.5 rounded-xl bg-[#0A0F2C]/50 border border-white/[0.05] text-center">
                                    <p className="text-sm font-mono font-bold text-[#C9A84C]">${selectedReferrer.rewards.toLocaleString()}</p>
                                    <p className="mt-0.5 text-[7px] font-mono uppercase tracking-widest text-[#E8E0D5]/40">{t('communityOverview.rewards')}</p>
                                </div>
                                <div className="p-2.5 rounded-xl bg-[#0A0F2C]/50 border border-white/[0.05] text-center">
                                    <p className="text-sm font-mono font-bold text-[#4FC3F7]">{referrerUniqueCities}</p>
                                    <p className="mt-0.5 text-[7px] font-mono uppercase tracking-widest text-[#E8E0D5]/40">{t('communityOverview.cities')}</p>
                                </div>
                            </div>

                            {/* Who they brought + their cities */}
                            <h3 className="text-[9px] font-mono uppercase tracking-widest text-[#E8E0D5]/50 font-bold mb-2">
                                {t('communityOverview.membersBrought', { count: selectedReferrer.recentReferrals.length })}
                            </h3>
                            <div className="max-h-72 overflow-y-auto pr-1 space-y-1.5">
                                {selectedReferrer.recentReferrals.map((member) => (
                                    <div
                                        key={member.id}
                                        className="flex items-center gap-2.5 p-2.5 bg-[#0A0F2C]/40 border border-white/[0.05] rounded-xl"
                                    >
                                        <span className="w-6 h-6 shrink-0 rounded-full bg-[#C9A84C]/15 text-[#C9A84C] flex items-center justify-center text-[8px] font-bold">
                                            {member.name.charAt(0)}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[11px] text-white font-medium truncate">{member.name}</p>
                                            <p className="text-[8px] font-mono text-[#E8E0D5]/40">
                                                {daysAgoLabel(member.joinedAt, t, language)}
                                            </p>
                                        </div>
                                        <span className="shrink-0 inline-flex items-center gap-1 text-[9px] font-mono text-[#E8E0D5]/60">
                                            <MapPin size={9} className="text-[#C9A84C]/70" />
                                            {member.city}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
