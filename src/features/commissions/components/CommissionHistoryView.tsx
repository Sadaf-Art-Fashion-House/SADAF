'use client';

/**
 * SADAF | Commissions — History View (pure presentation)
 *
 * Renders the commission ledger for the current earning role: Paid /
 * Pending KPI cards, a month filter dropdown, a status chip filter, and the
 * records table. All state lives here (presentation-only); data comes from
 * CommissionHistoryPageClient via props.
 */

import { useMemo, useState } from 'react';
import {
    Wallet,
    Clock,
    BadgeCheck,
    CalendarRange,
    AlertTriangle,
    Sparkles,
} from 'lucide-react';
import type { CommissionHistory, CommissionKind, CommissionStatus } from '../types';
import { useLanguage } from '@/features/i18n/LanguageProvider';
import { collectMonthKeys, monthKeyFor, monthLabel } from '../utils/months';
import WithdrawPanel from './WithdrawPanel';

// ─── Props ───────────────────────────────────────────────────────────────────

interface CommissionHistoryViewProps {
    kind: CommissionKind;
    data: CommissionHistory | null;
    loading: boolean;
    error: string | null;
    onRetry: () => void;
}

// ─── Status chips ────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<CommissionStatus, { label: string; chip: string; dot: string }> = {
    paid: { label: 'Paid', chip: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', dot: 'bg-emerald-400' },
    pending: { label: 'Pending', chip: 'bg-amber-500/10 text-amber-400 border-amber-500/30', dot: 'bg-amber-400' },
};

// ─── KPI card ────────────────────────────────────────────────────────────────

function KpiCard({
    label,
    value,
    icon: Icon,
    accent,
}: {
    label: string;
    value: string;
    icon: typeof Wallet;
    accent: string;
}) {
    return (
        <div className="p-4 bg-[#0A0F2C]/60 border border-white/5 rounded-2xl">
            <div className="flex items-center justify-between mb-2">
                <span className="text-[8px] font-mono uppercase tracking-widest text-[#E8E0D5]/40 font-semibold">
                    {label}
                </span>
                <Icon size={13} className={accent} />
            </div>
            <p className="text-2xl font-serif text-white font-bold tracking-tight">{value}</p>
        </div>
    );
}

// ─── Main view ───────────────────────────────────────────────────────────────

export default function CommissionHistoryView({
    kind,
    data,
    loading,
    error,
    onRetry,
}: CommissionHistoryViewProps) {
    const { t, language } = useLanguage();
    const locale = language === 'ar' ? 'ar-EG' : 'en-US';
    const [monthFilter, setMonthFilter] = useState<'all' | string>('all');
    const [statusFilter, setStatusFilter] = useState<'all' | CommissionStatus>('all');

    // Month options derived from the records (newest first) — kept in a memo
    // so the dropdown never recomputes on every keystroke/render.
    const monthOptions = useMemo(() => (data ? collectMonthKeys(data.records) : []), [data]);

    const filtered = useMemo(() => {
        if (!data) return [];
        return data.records.filter((record) => {
            if (statusFilter !== 'all' && record.status !== statusFilter) return false;
            if (monthFilter !== 'all' && monthKeyFor(record.creditedAt) !== monthFilter) return false;
            return true;
        });
    }, [data, statusFilter, monthFilter]);

    const statusFilters: { id: 'all' | CommissionStatus; label: string }[] = [
        { id: 'all', label: t('commissionHistory.status.all') },
        { id: 'paid', label: t('commissionHistory.status.paid') },
        { id: 'pending', label: t('commissionHistory.status.pending') },
    ];

    const title =
        kind === 'designer'
            ? t('commissionHistory.titleDesigner')
            : t('commissionHistory.titleReferral');
    const subtitle =
        kind === 'designer'
            ? t('commissionHistory.subtitleDesigner')
            : t('commissionHistory.subtitleReferral');

    return (
        <div className="relative w-full min-h-screen pb-20">
            {/* Header */}
            <section className="px-6 md:px-10 py-10 border-b border-[#C9A84C]/10 bg-gradient-to-b from-[#0A0F2C] to-[#1A1228]">
                <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#C9A84C]">
                        {kind === 'designer'
                            ? t('commissionHistory.eyebrowDesigner')
                            : t('commissionHistory.eyebrowReferral')}
                    </span>
                </div>
                <h1 className="text-3xl md:text-4xl font-serif text-white uppercase tracking-tight">
                    {t('commissionHistory.title')} <span className="text-[#C9A84C] italic">{t('commissionHistory.titleAccent')}</span>
                </h1>
                <p className="text-xs md:text-sm text-slate-400 max-w-2xl mt-2 leading-relaxed">
                    {subtitle}
                </p>
            </section>

            <div className="px-6 md:px-10 py-8 max-w-7xl mx-auto flex flex-col gap-8">
                {/* Error banner */}
                {error && (
                    <div role="alert" className="flex items-center gap-3 p-4 bg-red-950/30 border border-red-500/30 rounded-xl">
                        <AlertTriangle size={16} className="text-red-400 shrink-0" />
                        <p className="text-xs text-red-200 flex-1">{error}</p>
                        <button
                            onClick={onRetry}
                            className="text-[9px] font-mono uppercase tracking-wider text-[#C9A84C] border border-[#C9A84C]/30 rounded px-2 py-1 hover:bg-[#C9A84C]/10 transition-all cursor-pointer"
                        >
                            {t('commissionHistory.retry')}
                        </button>
                    </div>
                )}

                {/* Loading skeleton */}
                {loading && !data && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {[0, 1, 2].map((i) => (
                            <div key={i} className="h-24 rounded-2xl bg-white/5 animate-pulse" />
                        ))}
                    </div>
                )}

                {/* KPIs */}
                {data && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <KpiCard label={t('commissionHistory.kpi.totalPaid')} value={`$${data.stats.totalPaid.toLocaleString()}`} icon={BadgeCheck} accent="text-emerald-400" />
                        <KpiCard label={t('commissionHistory.kpi.pending')} value={`$${data.stats.totalPending.toLocaleString()}`} icon={Clock} accent="text-amber-400" />
                        <KpiCard label={t('commissionHistory.kpi.months')} value={String(data.stats.monthCount)} icon={CalendarRange} accent="text-[#C9A84C]" />
                    </div>
                )}

                {/* Withdrawals — request a payout of the pending balance */}
                {data && (
                    <WithdrawPanel totalPending={data.stats.totalPending} kind={kind} />
                )}

                {/* Ledger table */}
                {data && (
                    <section className="rounded-2xl bg-[#0A0F2C]/80 border border-white/5 overflow-hidden">
                        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-white/5">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-lg bg-[#C9A84C]/10 text-[#C9A84C]">
                                    <Wallet size={14} />
                                </div>
                                <h2 className="text-[10px] font-mono uppercase tracking-widest text-[#C9A84C] font-bold">
                                    {title} ({data.records.length})
                                </h2>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                {/* Month filter */}
                                <div className="flex items-center gap-1.5">
                                    <CalendarRange size={12} className="text-[#E8E0D5]/40" />
                                    <select
                                        value={monthFilter}
                                        onChange={(e) => setMonthFilter(e.target.value)}
                                        aria-label={t('commissionHistory.filterMonth')}
                                        className="bg-[#0A0F2C] border border-white/10 rounded-lg px-2.5 py-1.5 text-[9px] font-mono uppercase tracking-wider text-[#E8E0D5]/70 outline-none focus:border-[#C9A84C]/50 transition cursor-pointer"
                                    >
                                        <option value="all">{t('commissionHistory.allMonths')}</option>
                                        {monthOptions.map((key) => (
                                            <option key={key} value={key}>
                                                {monthLabel(key, language)}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Status filter */}
                                <div className="flex gap-1.5">
                                    {statusFilters.map((f) => (
                                        <button
                                            key={f.id}
                                            onClick={() => setStatusFilter(f.id)}
                                            aria-pressed={statusFilter === f.id}
                                            className={`px-3 py-1.5 rounded-full text-[9px] font-mono uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                                                statusFilter === f.id
                                                    ? 'bg-[#C9A84C]/15 text-[#C9A84C] border border-[#C9A84C]/40'
                                                    : 'bg-white/5 text-[#E8E0D5]/40 border border-white/5 hover:text-white'
                                            }`}
                                        >
                                            {f.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {filtered.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-14 text-center">
                                <Sparkles size={24} className="text-[#C9A84C]/30 mb-3" />
                                <p className="text-sm font-serif text-white">{t('commissionHistory.empty')}</p>
                                <p className="text-[11px] text-slate-500 mt-1">
                                    {monthFilter !== 'all'
                                        ? t('commissionHistory.emptyMonth', {
                                              status:
                                                  statusFilter === 'all'
                                                      ? ''
                                                      : `${t(`commissionHistory.status.${statusFilter}`)} `,
                                              month: monthLabel(monthFilter, language),
                                          })
                                        : t('commissionHistory.emptyNone')}
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="text-[8px] font-mono uppercase tracking-widest text-[#E8E0D5]/30 border-b border-white/5">
                                            <th className="px-6 py-3 font-medium">{t('commissionHistory.table.source')}</th>
                                            <th className="px-4 py-3 font-medium">{t('commissionHistory.table.type')}</th>
                                            <th className="px-4 py-3 font-medium">{t('commissionHistory.table.credited')}</th>
                                            <th className="px-4 py-3 font-medium">{t('commissionHistory.table.status')}</th>
                                            <th className="px-6 py-3 font-medium text-right">{t('commissionHistory.table.amount')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filtered.map((record) => {
                                            const style = STATUS_STYLES[record.status];
                                            return (
                                                <tr
                                                    key={record.id}
                                                    className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors"
                                                >
                                                    <td className="px-6 py-3.5">
                                                        <span className="text-xs text-white font-medium">
                                                            {record.source}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3.5 text-[11px] text-[#E8E0D5]/50">
                                                        {record.category}
                                                    </td>
                                                    <td className="px-4 py-3.5 text-[11px] text-[#E8E0D5]/50">
                                                        {new Date(record.creditedAt).toLocaleDateString(locale, {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            year: 'numeric',
                                                        })}
                                                    </td>
                                                    <td className="px-4 py-3.5">
                                                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full border text-[8px] font-mono uppercase tracking-wider ${style.chip}`}>
                                                            <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                                                            {t(`commissionHistory.status.${record.status}`)}
                                                            {record.paidAt && (
                                                                <span className="text-[#E8E0D5]/35">
                                                                    · {new Date(record.paidAt).toLocaleDateString(locale, { month: 'short', day: 'numeric' })}
                                                                </span>
                                                            )}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-3.5 text-right">
                                                        <span className="text-[11px] font-mono font-semibold text-[#C9A84C]">
                                                            ${record.amount.toLocaleString()}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>
                )}
            </div>
        </div>
    );
}
