'use client';

import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Trophy, Wallet } from 'lucide-react';
import { formatCurrency } from '@/utils/formatCurrency';
import { useLanguage } from '@/features/i18n/LanguageProvider';
import type { CustomerSpendingPoint } from '@/features/customer/types';

interface MonthlyPerformanceChartProps {
    /** Monthly spending series (12 months), newest last. */
    data: CustomerSpendingPoint[] | null;
    loading: boolean;
    error: string | null;
}

/**
 * Monthly Performance — the customer's 12-month spending chart shown on the
 * dashboard home. Same visual language as the Analysis page charts (dark
 * panel, gold bars, mono tooltip). Pulls its data from the customer-analysis
 * API (already the source of truth for the Analysis page KPIs).
 */
export default function MonthlyPerformanceChart({ data, loading, error }: MonthlyPerformanceChartProps) {
    const { t } = useLanguage();

    const stats = useMemo(() => {
        if (!data || data.length === 0) return null;
        const total = data.reduce((sum, point) => sum + point.value, 0);
        const best = data.reduce((max, point) => (point.value > max.value ? point : max), data[0]);
        return { total, best, average: total / data.length };
    }, [data]);

    if (loading) {
        return (
            <div className="p-6 rounded-2xl bg-[#05081A]/90 border border-[#C9A84C]/10 flex items-center justify-center">
                <div className="flex items-center gap-3 text-[10px] font-mono text-[#E8E0D5]/50">
                    <span className="w-4 h-4 rounded-full border-2 border-[#C9A84C] border-t-transparent animate-spin" />
                    {t('perf.loading')}
                </div>
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="p-6 rounded-2xl bg-[#05081A]/90 border border-[#C9A84C]/10 text-center">
                <Wallet size={24} className="mx-auto text-[#E8E0D5]/20 mb-2" />
                <p className="text-xs text-[#E8E0D5]/60">
                    {error ? `${error} — ${t('perf.empty')}` : t('perf.empty')}
                </p>
            </div>
        );
    }

    return (
        <div className="p-5 rounded-2xl bg-[#05081A]/90 border border-[#C9A84C]/10">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <TrendingUp size={14} className="text-[#C9A84C]" />
                    <h3 className="text-[10px] font-mono uppercase tracking-widest text-[#C9A84C] font-bold">
                        {t('perf.title')}
                    </h3>
                </div>
                <span className="text-[9px] font-mono text-[#E8E0D5]/40">
                    {t('perf.last12Months')}
                </span>
            </div>

            {/* Mini KPIs */}
            {stats && (
                <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="p-3 rounded-xl bg-[#0A0F2C]/60 border border-white/[0.05]">
                        <span className="text-[8px] font-mono uppercase tracking-widest text-[#E8E0D5]/40 block mb-1">
                            {t('perf.total')}
                        </span>
                        <span className="text-sm font-serif text-white font-bold">
                            {formatCurrency(stats.total)}
                        </span>
                    </div>
                    <div className="p-3 rounded-xl bg-[#0A0F2C]/60 border border-white/[0.05]">
                        <span className="text-[8px] font-mono uppercase tracking-widest text-[#E8E0D5]/40 block mb-1 flex items-center gap-1">
                            <Trophy size={8} className="text-[#C9A84C]" />
                            {t('perf.bestMonth')}
                        </span>
                        <span className="text-sm font-serif text-[#C9A84C] font-bold">
                            {stats.best.month}
                        </span>
                    </div>
                    <div className="p-3 rounded-xl bg-[#0A0F2C]/60 border border-white/[0.05]">
                        <span className="text-[8px] font-mono uppercase tracking-widest text-[#E8E0D5]/40 block mb-1">
                            {t('perf.average')}
                        </span>
                        <span className="text-sm font-serif text-white font-bold">
                            {formatCurrency(stats.average)}
                        </span>
                    </div>
                </div>
            )}

            {/* Chart */}
            <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} barCategoryGap="25%">
                        <CartesianGrid strokeDasharray="3 3" stroke="#1B2A6B" strokeOpacity={0.3} />
                        <XAxis
                            dataKey="month"
                            tick={{ fill: '#E8E0D5', fontSize: 10, fontFamily: 'monospace' }}
                            axisLine={{ stroke: '#1B2A6B' }}
                            tickLine={false}
                        />
                        <YAxis
                            tick={{ fill: '#E8E0D5', fontSize: 10, fontFamily: 'monospace' }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(v: number) => `$${v}`}
                        />
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
                        <Bar dataKey="value" name="Spending" fill="#C9A84C" radius={[4, 4, 0, 0]} animationDuration={800} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
