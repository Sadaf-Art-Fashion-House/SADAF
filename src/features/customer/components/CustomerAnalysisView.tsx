'use client';

import { motion } from 'motion/react';
import Link from 'next/link';
import {
    Wallet,
    ShoppingBag,
    Heart,
    Cpu,
    ArrowUpRight,
    ArrowDownRight,
    ArrowLeft,
    Activity,
    Compass,
    Calendar,
    WifiOff,
} from 'lucide-react';
import { DirectionalIcon } from '@/shared/ui/DirectionalIcon';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart as RePieChart,
    Pie,
    Cell,
    Legend,
} from 'recharts';
import { formatCurrency } from '@/utils/formatCurrency';
import type { CustomerAnalysisData, PersonalActivityEvent, RewardsData } from '../types';
import { ErrorBanner } from '@/shared/ui/ErrorGuidance';
import PersonalActivityFeed from './PersonalActivityFeed';
import SmartRecommendations from './SmartRecommendations';
import RewardsPanel from './RewardsPanel';
import { ErrorBoundary } from '@/shared/ui/ErrorBoundary';
import { useLanguage } from '@/features/i18n/LanguageProvider';

interface CustomerAnalysisViewProps {
    data: CustomerAnalysisData | null;
    loading: boolean;
    error: string | null;
    memberName: string;
    /** Real-time personal activity events (orders, saved designs). */
    personalEvents: PersonalActivityEvent[];
    /** Whether the personal activity WebSocket is connected (LIVE badge). */
    isPersonalLive: boolean;
    /** Degradation message from the personal activity transport, if any. */
    personalActivityError: string | null;
    /** True while the first batch of personal events is loading. */
    personalActivityLoading: boolean;
    /** Loyalty rewards + leaderboard data. */
    rewardsData: RewardsData | null;
    rewardsLoading: boolean;
    rewardsError: string | null;
    /** Whether the rewards WebSocket is connected (LIVE badge). */
    isRewardsLive: boolean;
}

const KPI_ICONS: Record<string, typeof Wallet> = {
    Wallet,
    ShoppingBag,
    Heart,
    Cpu,
};

const STATUS_COLORS: Record<string, string> = {
    Pending: 'text-yellow-400 bg-yellow-950/40 border-yellow-500/20',
    Tailoring: 'text-blue-400 bg-blue-950/40 border-[#4FC3F7]/20',
    Shipped: 'text-purple-400 bg-purple-950/40 border-purple-500/20',
    Delivered: 'text-green-400 bg-green-950/40 border-green-500/20',
};

/** Maps the API KPI labels to translation keys (unknown labels fall back to the raw value). */
const KPI_LABEL_KEYS: Record<string, string> = {
    'Total Spent': 'analysis.kpi.totalSpent',
    Orders: 'analysis.kpi.orders',
    'Wishlist Value': 'analysis.kpi.wishlistValue',
    'AI Designs': 'analysis.kpi.aiDesigns',
};

function formatDate(dateStr: string, language: 'en' | 'ar'): string {
    return new Date(dateStr).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function CustomerAnalysisView({
    data,
    loading,
    error,
    memberName,
    personalEvents,
    isPersonalLive,
    personalActivityError,
    personalActivityLoading,
    rewardsData,
    rewardsLoading,
    rewardsError,
    isRewardsLive,
}: CustomerAnalysisViewProps) {
    const { t, tc, language } = useLanguage();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="text-center">
                    <div className="w-8 h-8 rounded-full border-2 border-[#C9A84C] border-t-transparent animate-spin mx-auto mb-3" />
                    <p className="text-xs font-mono text-[#E8E0D5]/50">{t('analysis.loading')}</p>
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="text-center">
                    <Activity size={32} className="mx-auto text-[#E8E0D5]/20 mb-3" />
                    <p className="text-sm text-[#E8E0D5]/60">{t('analysis.emptyTitle')}</p>
                    <p className="text-[10px] text-[#E8E0D5]/40 mt-1">{t('analysis.emptyHint')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative w-full min-h-screen pb-20">
            {/* Background */}
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#C9A84C]/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-1/4 left-1/4 w-72 h-72 bg-[#4FC3F7]/5 rounded-full blur-[120px] pointer-events-none" />

            {/* Header */}
            <section className="relative pt-12 pb-8 px-4 md:px-8 border-b border-[#C9A84C]/10">
                <div className="max-w-6xl mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                        <div>
                            <span className="text-[10px] font-mono uppercase tracking-widest text-[#C9A84C] font-bold flex items-center gap-1.5 mb-1">
                                <Compass size={12} />
                                PERSONAL INSIGHTS &bull; تحليلك الشخصي
                            </span>
                            <h1 className="text-3xl md:text-4xl font-serif text-white uppercase tracking-tight">
                                {t('analysis.title')}
                            </h1>
                            <p className="text-xs text-slate-400 mt-1">
                                {t('analysis.subtitle', { name: memberName })}
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <span className="px-3 py-1.5 rounded-full text-[9px] font-mono uppercase tracking-wider border border-[#C9A84C]/30 text-[#C9A84C] bg-[#C9A84C]/5">
                                {data.tier}
                            </span>
                            <Link
                                href="/dashboard/profile"
                                className="px-4 py-2 bg-black/40 hover:bg-white text-[10px] font-mono uppercase tracking-widest font-bold text-gray-300 hover:text-[#0A0F2C] border border-white/10 transition rounded-xl cursor-pointer flex items-center gap-1.5"
                            >
                                <DirectionalIcon icon={ArrowLeft} size={11} />
                                {t('analysis.profile')}
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            <div className="max-w-6xl mx-auto px-4 md:px-8 py-8">
                {/* Degradation banner */}
                {error && (
                    <ErrorBanner
                        tone="yellow"
                        icon={Activity}
                        message={t('analysis.degraded', { error })}
                    />
                )}

                {/* Real-time personal activity feed */}
                <ErrorBoundary label="analysis:activity">
                    <PersonalActivityFeed
                        events={personalEvents}
                        isLive={isPersonalLive}
                        loading={personalActivityLoading}
                    />
                </ErrorBoundary>

                {/* Personal activity transport degradation notice */}
                {personalActivityError && !isPersonalLive && (
                    <div className="mb-6 flex items-center gap-2 px-3 py-2 rounded-xl text-[9px] font-mono text-amber-400/80 bg-amber-500/5 border border-amber-500/15">
                        <WifiOff size={10} className="shrink-0" />
                        <span>
                            {t('analysis.activityDegraded', { error: personalActivityError })}
                        </span>
                    </div>
                )}

                {/* KPI Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                    {data.kpis.map((kpi) => {
                        const Icon = KPI_ICONS[kpi.icon] || Wallet;
                        return (
                            <motion.div
                                key={kpi.label}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="group relative p-4 bg-[#0A0F2C]/60 border border-white/[0.05] hover:border-[#C9A84C]/20 rounded-2xl transition-all duration-300"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[7px] font-mono uppercase tracking-widest text-[#E8E0D5]/40 font-semibold">
                                        {tc(KPI_LABEL_KEYS[kpi.label] ?? '', kpi.label)}
                                    </span>
                                    <Icon size={13} className="text-[#C9A84C]/50 group-hover:text-[#C9A84C] transition-colors" />
                                </div>
                                <p className="text-lg font-serif text-white font-bold tracking-tight">{kpi.value}</p>
                                <div className={`flex items-center gap-0.5 mt-1 text-[10px] font-mono ${kpi.isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {kpi.isPositive ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                                    <span>{kpi.change}</span>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Rewards & Leaderboard */}
                <ErrorBoundary label="analysis:rewards">
                    <RewardsPanel
                        data={rewardsData}
                        loading={rewardsLoading}
                        error={rewardsError}
                        memberName={memberName}
                        isLive={isRewardsLive}
                    />
                </ErrorBoundary>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
                    {/* Monthly spending */}
                    <div className="lg:col-span-3 p-5 bg-[#05081A]/90 border border-[#C9A84C]/10 rounded-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Wallet size={14} className="text-[#C9A84C]" />
                                <h3 className="text-[10px] font-mono uppercase tracking-widest text-[#C9A84C] font-bold">
                                    {t('analysis.monthlySpending')}
                                </h3>
                            </div>
                            <span className="text-[9px] font-mono text-[#E8E0D5]/40">
                                {t('analysis.last12Months')}
                            </span>
                        </div>
                        <div className="h-56">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.monthlySpending} barCategoryGap="25%">
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1B2A6B" strokeOpacity={0.3} />
                                    <XAxis dataKey="month" tick={{ fill: '#E8E0D5', fontSize: 10, fontFamily: 'monospace' }} axisLine={{ stroke: '#1B2A6B' }} tickLine={false} />
                                    <YAxis tick={{ fill: '#E8E0D5', fontSize: 10, fontFamily: 'monospace' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                                    <Tooltip
                                        cursor={{ fill: '#C9A84C', opacity: 0.08 }}
                                        content={({ active, payload, label }) => {
                                            if (!active || !payload?.length) return null;
                                            return (
                                                <div className="bg-[#0A0F2C]/95 border border-[#C9A84C]/20 rounded-xl px-3 py-2 shadow-xl backdrop-blur-sm">
                                                    <p className="text-[10px] font-mono text-[#E8E0D5]/60 mb-1">{label}</p>
                                                    <p className="text-xs font-mono font-semibold text-[#C9A84C]">
                                                        {formatCurrency(payload[0].value as number)}
                                                    </p>
                                                </div>
                                            );
                                        }}
                                    />
                                    <Bar dataKey="value" name={t('analysis.spending')} fill="#C9A84C" radius={[4, 4, 0, 0]} animationDuration={800} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Category split */}
                    <div className="lg:col-span-2 p-5 bg-[#05081A]/90 border border-[#C9A84C]/10 rounded-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Heart size={14} className="text-[#C9A84C]" />
                                <h3 className="text-[10px] font-mono uppercase tracking-widest text-[#C9A84C] font-bold">
                                    {t('analysis.spendingByCategory')}
                                </h3>
                            </div>
                        </div>
                        <div className="h-56 flex items-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <RePieChart>
                                    <Pie
                                        data={data.categorySpend}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={80}
                                        paddingAngle={3}
                                        dataKey="value"
                                        nameKey="category"
                                        animationDuration={800}
                                    >
                                        {data.categorySpend.map((entry) => (
                                            <Cell key={entry.category} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        content={({ active, payload }) => {
                                            if (!active || !payload?.length) return null;
                                            const d = payload[0]?.payload ?? {};
                                            return (
                                                <div className="bg-[#0A0F2C]/95 border border-[#C9A84C]/20 rounded-xl px-3 py-2 shadow-xl backdrop-blur-sm">
                                                    <p className="text-xs font-mono font-semibold text-white">{d.category}</p>
                                                    <p className="text-[10px] font-mono text-[#E8E0D5]/60">{formatCurrency(d.value)}</p>
                                                </div>
                                            );
                                        }}
                                    />
                                    <Legend wrapperStyle={{ fontSize: '8px', fontFamily: 'monospace', color: '#E8E0D5' }} />
                                </RePieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Smart recommendations matched to spending categories */}
                <ErrorBoundary label="analysis:recommendations">
                    <SmartRecommendations recommendations={data.recommendations} />
                </ErrorBoundary>

                {/* Orders table */}
                <div className="p-5 bg-[#05081A]/90 border border-[#C9A84C]/10 rounded-2xl">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <ShoppingBag size={14} className="text-[#C9A84C]" />
                            <h3 className="text-[10px] font-mono uppercase tracking-widest text-[#C9A84C] font-bold">
                                {t('analysis.orderHistory')}
                            </h3>
                        </div>
                        <div className="flex items-center gap-3 text-[9px] font-mono text-[#E8E0D5]/40">
                            <span className="flex items-center gap-1">
                                <Calendar size={10} />
                                {t('analysis.avgOrder')} <strong className="text-[#C9A84C]">{formatCurrency(data.averageOrderValue)}</strong>
                            </span>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-[8px] font-mono uppercase tracking-widest text-[#E8E0D5]/40 border-b border-white/[0.05]">
                                    <th className="py-2 pr-2">{t('analysis.colOrder')}</th>
                                    <th className="py-2 pr-2">{t('analysis.colDate')}</th>
                                    <th className="py-2 pr-2">{t('analysis.colItems')}</th>
                                    <th className="py-2 pr-2">{t('analysis.colStatus')}</th>
                                    <th className="py-2 text-right">{t('analysis.colTotal')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.orders.map((order) => (
                                    <tr key={order.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition">
                                        <td className="py-2.5 pr-2 text-[10px] font-mono text-[#C9A84C]">{order.id}</td>
                                        <td className="py-2.5 pr-2 text-[10px] text-[#E8E0D5]/60">{formatDate(order.date, language)}</td>
                                        <td className="py-2.5 pr-2 text-[10px] font-mono text-[#E8E0D5]/50">{order.items}</td>
                                        <td className="py-2.5 pr-2">
                                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-mono border font-bold ${STATUS_COLORS[order.status] || STATUS_COLORS.Pending}`}>
                                                {tc(`analysis.status.${order.status}`, order.status)}
                                            </span>
                                        </td>
                                        <td className="py-2.5 text-[10px] font-mono text-white text-right">
                                            {formatCurrency(order.total)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
