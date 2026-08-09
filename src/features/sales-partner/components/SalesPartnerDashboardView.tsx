'use client';

/**
 * SADAF | Sales Partner — Dashboard View (pure presentation)
 *
 * Renders the partner's referral workspace: their unique shareable link
 * with a copy button, commission KPIs, and the referrals table with a
 * status filter. All state/handlers come from SalesPartnerDashboardPageClient
 * via props; the origin for the shareable link is read in a mount effect
 * (hydration-safe — no window access during render).
 */

import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
    Link2,
    Copy,
    Check,
    Users,
    UserCheck,
    Clock,
    Wallet,
    TrendingUp,
    Wifi,
    WifiOff,
    AlertTriangle,
    Info,
} from 'lucide-react';
import type { SalesPartnerOverview, ReferralStatus } from '../types';
import { COMMISSION_RATE, REFERRAL_STATUS_STYLES } from '../constants';
import { formatRelativeTime } from '@/features/notifications/utils/formatRelativeTime';

// ─── Props ───────────────────────────────────────────────────────────────────

interface SalesPartnerDashboardViewProps {
    data: SalesPartnerOverview | null;
    loading: boolean;
    error: string | null;
    wsLive: boolean;
    onRetry: () => void;
}

// ─── KPI card ────────────────────────────────────────────────────────────────

function KpiCard({
    label,
    value,
    suffix,
    icon: Icon,
    accent,
    hoverDetail,
}: {
    label: string;
    value: string;
    suffix?: string;
    icon: typeof Users;
    accent: string;
    hoverDetail?: ReactNode;
}) {
    return (
        <div className="relative group p-4 bg-[#0A0F2C]/60 border border-white/5 rounded-2xl">
            <div className="flex items-center justify-between mb-2">
                <span className="text-[8px] font-mono uppercase tracking-widest text-[#E8E0D5]/40 font-semibold">
                    {label}
                </span>
                <Icon size={13} className={accent} />
            </div>
            <p className="text-2xl font-serif text-white font-bold tracking-tight flex items-center gap-2">
                {value}
                {suffix && <span className="text-sm text-[#E8E0D5]/50 ml-1">{suffix}</span>}
                {hoverDetail && (
                    <span
                        title="Per-referral projection breakdown"
                        className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#C9A84C]/15 text-[#C9A84C] shrink-0"
                    >
                        <Info size={9} />
                    </span>
                )}
            </p>
            {hoverDetail && (
                <div className="absolute z-30 right-0 bottom-full mb-2 w-64 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none">
                    <div className="rounded-xl bg-[#141B4D] border border-emerald-500/30 shadow-2xl shadow-black/50 p-3">
                        {hoverDetail}
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Referral link panel ─────────────────────────────────────────────────────

function ReferralLinkPanel({ referralCode }: { referralCode: string }) {
    const [origin, setOrigin] = useState('');
    const [copied, setCopied] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Read the origin in a mount effect only — window is unavailable during
    // SSR, so accessing it in render would break hydration.
    useEffect(() => {
        setOrigin(window.location.origin);
    }, []);

    const link = `${origin}/auth/signup?ref=${referralCode}`;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(link);
            setCopied(true);
            setTimeout(() => setCopied(false), 2_000);
        } catch {
            // Clipboard can be blocked (permissions / non-secure context) —
            // surface it explicitly instead of failing silently: select the
            // link text so the user can copy it with Ctrl/Cmd+C.
            setCopied(false);
            inputRef.current?.select();
        }
    };

    return (
        <section className="rounded-2xl bg-[#0A0F2C]/80 border border-emerald-500/15 p-6">
            <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                    <Link2 size={14} />
                </div>
                <h2 className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold">
                    Your Referral Link
                </h2>
            </div>

            <div className="flex flex-col md:flex-row gap-3">
                <input
                    ref={inputRef}
                    readOnly
                    value={link}
                    aria-label="Referral link"
                    className="flex-1 bg-black/40 border border-white/10 rounded-lg p-3 text-[11px] font-mono text-emerald-300/90 outline-none focus:border-emerald-500/40 transition truncate"
                />
                <button
                    onClick={handleCopy}
                    className={`flex items-center justify-center gap-2 px-5 py-3 rounded-lg text-[10px] font-mono font-bold uppercase tracking-widest transition-all duration-300 cursor-pointer ${
                        copied
                            ? 'bg-emerald-500 text-[#0A0F2C]'
                            : 'bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/20'
                    }`}
                >
                    {copied ? <Check size={13} /> : <Copy size={13} />}
                    {copied ? 'Copied!' : 'Copy Link'}
                </button>
            </div>

            <p className="text-[10px] text-[#E8E0D5]/40 mt-3 leading-relaxed">
                Share this link with new customers — when they sign up and place a paying order,
                you earn commission on the order value. Code: <strong className="text-emerald-400">{referralCode}</strong>
            </p>
        </section>
    );
}

// ─── Referrals table ─────────────────────────────────────────────────────────

type StatusFilter = 'all' | ReferralStatus;

function ReferralsTable({ referrals }: { referrals: SalesPartnerOverview['referrals'] }) {
    const [filter, setFilter] = useState<StatusFilter>('all');

    const filtered =
        filter === 'all' ? referrals : referrals.filter((r) => r.status === filter);

    const filters: { id: StatusFilter; label: string }[] = [
        { id: 'all', label: 'All' },
        { id: 'converted', label: 'Converted' },
        { id: 'pending', label: 'Pending' },
    ];

    return (
        <section className="rounded-2xl bg-[#0A0F2C]/80 border border-white/5 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                        <Users size={14} />
                    </div>
                    <h2 className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold">
                        Referrals ({referrals.length})
                    </h2>
                </div>
                <div className="flex gap-1.5">
                    {filters.map((f) => (
                        <button
                            key={f.id}
                            onClick={() => setFilter(f.id)}
                            aria-pressed={filter === f.id}
                            className={`px-3 py-1.5 rounded-full text-[9px] font-mono uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                                filter === f.id
                                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/40'
                                    : 'bg-white/5 text-[#E8E0D5]/40 border border-white/5 hover:text-white'
                            }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 text-center">
                    <Clock size={24} className="text-emerald-500/30 mb-3" />
                    <p className="text-sm font-serif text-white">No {filter !== 'all' ? filter : ''} referrals yet</p>
                    <p className="text-[11px] text-slate-500 mt-1">
                        {filter === 'pending'
                            ? 'No pending leads right now — share your link to bring new customers.'
                            : 'No converted referrals in this view yet.'}
                    </p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-[8px] font-mono uppercase tracking-widest text-[#E8E0D5]/30 border-b border-white/5">
                                <th className="px-6 py-3 font-medium">Customer</th>
                                <th className="px-4 py-3 font-medium">City</th>
                                <th className="px-4 py-3 font-medium">Joined</th>
                                <th className="px-4 py-3 font-medium">Status</th>
                                <th className="px-4 py-3 font-medium text-right">Order</th>
                                <th className="px-6 py-3 font-medium text-right">Commission</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((r) => {
                                const style = REFERRAL_STATUS_STYLES[r.status];
                                return (
                                    <tr
                                        key={r.id}
                                        className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors"
                                    >
                                        <td className="px-6 py-3.5">
                                            <span className="text-xs text-white font-medium">{r.name}</span>
                                        </td>
                                        <td className="px-4 py-3.5 text-[11px] text-[#E8E0D5]/50">{r.city}</td>
                                        <td className="px-4 py-3.5 text-[11px] text-[#E8E0D5]/50">
                                            {formatRelativeTime(r.joinedAt)}
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full border text-[8px] font-mono uppercase tracking-wider ${style.chip}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                                                {style.label}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3.5 text-right text-[11px] font-mono text-[#E8E0D5]/70">
                                            {r.orderValue !== undefined ? `$${r.orderValue.toLocaleString()}` : '—'}
                                        </td>
                                        <td className="px-6 py-3.5 text-right">
                                            {r.commission !== undefined ? (
                                                <span className="text-[11px] font-mono font-semibold text-emerald-400">
                                                    ${r.commission.toLocaleString()}
                                                </span>
                                            ) : (
                                                <span className="text-[11px] text-[#E8E0D5]/30">—</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
}

// ─── Main view ───────────────────────────────────────────────────────────────

export default function SalesPartnerDashboardView({
    data,
    loading,
    error,
    wsLive,
    onRetry,
}: SalesPartnerDashboardViewProps) {
    const stats = data?.stats;

    return (
        <div className="relative w-full min-h-screen pb-20">
            {/* Header */}
            <section className="px-6 md:px-10 py-10 border-b border-emerald-500/10 bg-gradient-to-b from-[#0A0F2C] to-[#0A2A1F]">
                <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-emerald-400">
                        Sales Partner Workspace
                    </span>
                    <span
                        className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[8px] font-mono uppercase tracking-wider ${
                            wsLive
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        }`}
                    >
                        {wsLive ? <Wifi size={9} /> : <WifiOff size={9} />}
                        {wsLive ? 'Live' : 'Polling'}
                    </span>
                </div>
                <h1 className="text-3xl md:text-4xl font-serif text-white uppercase tracking-tight">
                    Sales <span className="text-emerald-400 italic">Partnership</span>
                </h1>
                <p className="text-xs md:text-sm text-slate-400 max-w-2xl mt-2 leading-relaxed">
                    Grow the SADAF family with your referral link and earn commission on every
                    converted customer.
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
                            Retry
                        </button>
                    </div>
                )}

                {/* Loading skeleton */}
                {loading && !data && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[0, 1, 2, 3].map((i) => (
                            <div key={i} className="h-24 rounded-2xl bg-white/5 animate-pulse" />
                        ))}
                    </div>
                )}

                {/* Referral link */}
                {data && <ReferralLinkPanel referralCode={data.referralCode} />}

                {/* KPI stats */}
                {stats && (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <KpiCard label="Total Referrals" value={String(stats.totalReferrals)} icon={Users} accent="text-emerald-400" />
                        <KpiCard label="Converted" value={String(stats.converted)} icon={UserCheck} accent="text-[#4FC3F7]" />
                        <KpiCard label="Pending" value={String(stats.pending)} icon={Clock} accent="text-amber-400" />
                        <KpiCard label="Total Commission" value={`$${stats.totalCommission.toLocaleString()}`} icon={Wallet} accent="text-[#C9A84C]" />
                        <KpiCard
                            label="Expected Commission"
                            value={`$${stats.expectedCommission.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                            icon={TrendingUp}
                            accent="text-emerald-400"
                            hoverDetail={
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[8px] font-mono uppercase tracking-widest text-emerald-400 font-bold">
                                            Projected Commission
                                        </span>
                                        <TrendingUp size={10} className="text-emerald-400" />
                                    </div>
                                    {stats.pending === 0 ? (
                                        <p className="text-[10px] text-[#E8E0D5]/50 italic">
                                            No pending referrals yet — share your link to start projecting.
                                        </p>
                                    ) : (
                                        <ul className="flex flex-col gap-2 max-h-44 overflow-y-auto pr-1">
                                            {data?.referrals
                                                .filter((r) => r.status === 'pending')
                                                .map((r) => {
                                                    const estimate = stats.expectedCommission / stats.pending;
                                                    return (
                                                        <li key={r.id} className="flex flex-col gap-0.5">
                                                            <div className="flex items-center justify-between gap-2">
                                                                <span
                                                                    className="text-[10px] text-[#E8E0D5]/80 truncate min-w-0"
                                                                    title={r.name}
                                                                >
                                                                    {r.name}
                                                                </span>
                                                                <span className="text-[10px] font-mono text-emerald-400 font-semibold shrink-0">
                                                                    est. $
                                                                    {estimate.toLocaleString(undefined, {
                                                                        maximumFractionDigits: 2,
                                                                    })}
                                                                </span>
                                                            </div>
                                                            <span className="text-[8px] font-mono uppercase tracking-wider text-[#E8E0D5]/40">
                                                                {r.city} · Pending lead
                                                            </span>
                                                        </li>
                                                    );
                                                })}
                                        </ul>
                                    )}
                                    <div className="pt-2 border-t border-white/10 flex flex-col gap-1">
                                        <span className="text-[8px] font-mono uppercase tracking-wider text-[#E8E0D5]/40">
                                            {COMMISSION_RATE * 100}% of avg order ${stats.avgOrderValue.toLocaleString()} · {stats.pending} pending{' '}
                                            {stats.pending === 1 ? 'lead' : 'leads'}
                                        </span>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[8px] font-mono uppercase tracking-wider text-[#E8E0D5]/40">
                                                Total projected
                                            </span>
                                            <span className="text-[11px] font-mono text-emerald-400 font-bold">
                                                $
                                                {stats.expectedCommission.toLocaleString(undefined, {
                                                    maximumFractionDigits: 2,
                                                })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            }
                        />
                    </div>
                )}

                {/* This-month commission strip */}
                {stats && stats.thisMonthCommission > 0 && (
                    <div className="flex items-center gap-3 px-5 py-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                        <TrendingUp size={14} className="text-emerald-400 shrink-0" />
                        <p className="text-[11px] text-[#E8E0D5]/70">
                            You earned{' '}
                            <strong className="text-emerald-400 font-mono">
                                ${stats.thisMonthCommission.toLocaleString()}
                            </strong>{' '}
                            in commission this month.
                        </p>
                    </div>
                )}

                {/* Referrals table */}
                {data && <ReferralsTable referrals={data.referrals} />}
            </div>
        </div>
    );
}
