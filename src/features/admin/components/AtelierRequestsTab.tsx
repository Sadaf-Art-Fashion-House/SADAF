'use client';

/**
 * SADAF | Admin — Atelier Requests Tab
 *
 * The atelier review queue: every design a designer submitted appears here
 * so the admin can move it through the pipeline (start review → approve /
 * reject with feedback → start production). Rejecting requires an adminNote
 * so the designer always learns why; approving/production are one-click.
 *
 * Data comes from useAtelierRequests (WS-primary on `designer:global` with
 * REST fallback) — when the admin reviews here, the designer's own dashboard
 * reflects the new status within the next WS push.
 */

import { useMemo, useRef, useState } from 'react';
import {
    Layers,
    Clock,
    CheckCircle2,
    PackageCheck,
    XCircle,
    AlertTriangle,
    Wifi,
    WifiOff,
    Hammer,
    MessageSquare,
    Send,
    FileImage,
    FileText,
    X,
} from 'lucide-react';
import type { DesignCollaboration, DesignStatus } from '@/features/designer/types';
import { DESIGN_STATUS_STYLES } from '@/features/designer/constants';
import { COMMISSION_POOL_RATE, computeCommissionSplit, participantsFor } from '@/features/designer/utils/commissionSplit';
import { useAtelierRequests } from '../hooks/useAtelierRequests';
import { useExportChart } from '@/features/analytics/hooks/useExportChart';
import { formatRelativeTime } from '@/features/notifications/utils/formatRelativeTime';

// ─── Status filter options ───────────────────────────────────────────────────

const FILTERS: Array<{ id: DesignStatus | 'all'; label: string }> = [
    { id: 'all', label: 'All' },
    { id: 'draft', label: 'Draft' },
    { id: 'under_review', label: 'Under Review' },
    { id: 'approved', label: 'Approved' },
    { id: 'in_production', label: 'In Production' },
    { id: 'rejected', label: 'Rejected' },
];

// ─── Small pieces ────────────────────────────────────────────────────────────

function KpiCard({
    label,
    value,
    icon: Icon,
    accent,
}: {
    label: string;
    value: number;
    icon: typeof Layers;
    accent: string;
}) {
    return (
        <div className="p-4 bg-[#090D2A]/80 border border-white/5 rounded-xl">
            <div className="flex items-center justify-between mb-2">
                <span className="text-[8px] font-mono uppercase tracking-widest text-gray-500 font-semibold">
                    {label}
                </span>
                <Icon size={13} className={accent} />
            </div>
            <p className="text-2xl font-serif text-white font-bold tracking-tight">{value}</p>
        </div>
    );
}

function StatusChip({ status }: { status: DesignStatus }) {
    const style = DESIGN_STATUS_STYLES[status];
    return (
        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full border text-[8px] font-mono uppercase tracking-wider ${style.chip}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
            {style.label}
        </span>
    );
}

// ─── Submission card ─────────────────────────────────────────────────────────

function SubmissionCard({
    id,
    title,
    category,
    description,
    price,
    status,
    submittedAt,
    adminNote,
    collaboration,
    reviewing,
    onReview,
    onFeedback,
}: {
    id: string;
    title: string;
    category: string;
    description: string;
    price: number;
    status: DesignStatus;
    submittedAt: string;
    adminNote?: string;
    collaboration?: DesignCollaboration;
    reviewing: boolean;
    onReview: (id: string, status: DesignStatus, adminNote?: string) => Promise<{ ok: boolean; error?: string }>;
    onFeedback: (message: { kind: 'success' | 'error'; text: string }) => void;
}) {
    const [rejecting, setRejecting] = useState(false);
    const [note, setNote] = useState('');

    // Projected commission split — shown once the atelier commits to
    // producing the piece (approved / in production). Same math and
    // participant list as the designer's detail page (shared helpers).
    const commissionData = useMemo(() => {
        if (status !== 'approved' && status !== 'in_production') return null;
        if (!collaboration) return null;
        const participants = participantsFor(collaboration);
        if (participants.length === 0) return null;
        return {
            participants,
            shares: computeCommissionSplit(participants, price),
            pool: Math.round(price * COMMISSION_POOL_RATE * 100) / 100,
        };
    }, [status, collaboration, price]);

    const handleReview = async (nextStatus: DesignStatus, requireNote = false) => {
        const trimmedNote = note.trim();
        if (requireNote && !trimmedNote) {
            onFeedback({ kind: 'error', text: 'Add a note so the designer understands the decision.' });
            return;
        }
        const result = await onReview(id, nextStatus, trimmedNote || undefined);
        if (result.ok) {
            setRejecting(false);
            setNote('');
            onFeedback({
                kind: 'success',
                text:
                    nextStatus === 'approved'
                        ? `“${title}” approved — moving to the atelier.`
                        : nextStatus === 'rejected'
                            ? `“${title}” rejected with feedback.`
                            : `“${title}” moved to ${nextStatus === 'in_production' ? 'production' : 'review'}.`,
            });
        } else {
            onFeedback({ kind: 'error', text: result.error ?? 'Failed to update the submission.' });
        }
    };

    return (
        <div className="rounded-2xl bg-[#090D2A]/80 border border-white/5 hover:border-[#C9A84C]/30 transition-all duration-300 p-5 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <h4 className="font-serif text-white text-sm leading-snug">{title}</h4>
                    <p className="text-[9px] font-mono uppercase tracking-wider text-[#C9A84C]/70 mt-1">
                        {category} · {formatRelativeTime(submittedAt)}
                    </p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className="text-[11px] font-mono text-[#C9A84C] font-semibold">
                        ${price.toLocaleString()}
                    </span>
                    <StatusChip status={status} />
                </div>
            </div>

            <p className="text-[10px] text-[#E8E0D5]/50 leading-relaxed line-clamp-2">
                {description}
            </p>

            {adminNote && (
                <p className="text-[9px] text-[#E8E0D5]/40 border-t border-white/5 pt-2 italic leading-relaxed">
                    Atelier note: “{adminNote}”
                </p>
            )}

            {/* Projected commission split for committed designs */}
            {commissionData && (
                <div className="p-3 rounded-xl bg-[#C9A84C]/5 border border-[#C9A84C]/15">
                    <p className="text-[8px] font-mono uppercase tracking-widest text-[#C9A84C] font-bold mb-1">
                        Projected Commission Split
                    </p>
                    <p className="text-[8px] text-slate-500 mb-1.5">
                        Pool: {Math.round(COMMISSION_POOL_RATE * 100)}% of ${price.toLocaleString()} =
                        ${commissionData.pool.toLocaleString()} · {commissionData.participants.length} participants
                    </p>
                    <div className="flex flex-col gap-1">
                        {commissionData.shares.map((share) => {
                            const member = commissionData.participants.find((m) => m.id === share.memberId);
                            if (!member) return null;
                            return (
                                <div
                                    key={share.memberId}
                                    className="flex items-center justify-between text-[9px]"
                                >
                                    <span className="text-slate-300 truncate">
                                        {member.name}
                                        {member.id === collaboration?.ownerId && (
                                            <span className="ml-1 text-[7px] font-mono uppercase text-[#C9A84C]/70">
                                                (owner)
                                            </span>
                                        )}
                                    </span>
                                    <span className="font-mono text-[#C9A84C] shrink-0 ml-2">
                                        {share.percent}% · ${share.amount.toLocaleString()}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Actions by pipeline state */}
            {status === 'draft' && (
                <button
                    onClick={() => handleReview('under_review')}
                    disabled={reviewing}
                    className="self-start py-2 px-4 rounded-lg border border-[#4FC3F7]/40 text-[#4FC3F7] text-[9px] font-mono font-bold uppercase tracking-widest hover:bg-[#4FC3F7]/10 transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-wait"
                >
                    Start Review
                </button>
            )}

            {status === 'under_review' && (
                <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleReview('approved')}
                            disabled={reviewing}
                            className="flex-1 py-2 rounded-lg bg-emerald-500 text-[#090D2A] text-[9px] font-mono font-bold uppercase tracking-widest hover:bg-emerald-400 transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-wait flex items-center justify-center gap-1.5"
                        >
                            <CheckCircle2 size={11} /> Approve
                        </button>
                        <button
                            onClick={() => {
                                setRejecting(true);
                                setNote('');
                            }}
                            disabled={reviewing}
                            className="flex-1 py-2 rounded-lg border border-red-500/40 text-red-400 text-[9px] font-mono font-bold uppercase tracking-widest hover:bg-red-500/10 transition-all duration-300 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                        >
                            <XCircle size={11} /> Reject
                        </button>
                    </div>
                    {rejecting && (
                        <div className="flex flex-col gap-2 p-3 bg-red-950/20 border border-red-500/20 rounded-lg">
                            <label className="flex items-center gap-1.5 text-[8px] font-mono uppercase tracking-wider text-red-300">
                                <MessageSquare size={9} /> Feedback for the designer *
                            </label>
                            <textarea
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                rows={2}
                                placeholder="e.g. Refine the cuff embroidery density and resubmit…"
                                className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-[11px] text-white outline-none focus:border-red-500/50 transition resize-none"
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleReview('rejected', true)}
                                    disabled={reviewing}
                                    className="flex-1 py-1.5 rounded-lg bg-red-500 text-white text-[9px] font-mono font-bold uppercase tracking-widest hover:bg-red-400 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-wait flex items-center justify-center gap-1.5"
                                >
                                    <Send size={10} /> Confirm Reject
                                </button>
                                <button
                                    onClick={() => setRejecting(false)}
                                    className="px-3 py-1.5 rounded-lg border border-white/10 text-[9px] font-mono uppercase tracking-widest text-slate-400 hover:text-white transition-all cursor-pointer"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {status === 'approved' && (
                <button
                    onClick={() => handleReview('in_production')}
                    disabled={reviewing}
                    className="self-start py-2 px-4 rounded-lg bg-[#C9A84C] text-[#090D2A] text-[9px] font-mono font-bold uppercase tracking-widest hover:bg-[#D9BC63] transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-wait flex items-center justify-center gap-1.5"
                >
                    <Hammer size={11} /> Start Production
                </button>
            )}

            {(status === 'in_production' || status === 'rejected') && (
                <p className="text-[9px] font-mono uppercase tracking-wider text-slate-500">
                    {status === 'in_production' ? 'In the atelier — no further action' : 'Closed — feedback sent to the designer'}
                </p>
            )}
        </div>
    );
}

// ─── Main tab ────────────────────────────────────────────────────────────────

export default function AtelierRequestsTab() {
    const { data, loading, error, wsLive, refetch, reviewSubmission, reviewing } = useAtelierRequests();
    const [filter, setFilter] = useState<DesignStatus | 'all'>('all');
    const [feedback, setFeedback] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

    // Exportable atelier report — the table below is captured as PNG/PDF with
    // the shared useExportChart (same watermark + error reporting as the
    // Analytics dashboard).
    const reportRef = useRef<HTMLDivElement>(null);
    const {
        exportAsPNG,
        exportAsPDF,
        isExportingPNG,
        isExportingPDF,
        exportError,
        clearError,
    } = useExportChart(reportRef, 'atelier_report', 'report');

    const stats = data?.stats;
    const submissions = useMemo(() => {
        const list = data?.submissions ?? [];
        return filter === 'all' ? list : list.filter((s) => s.status === filter);
    }, [data, filter]);

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap justify-between items-start gap-3">
                <div>
                    <h3 className="font-serif text-[#C9A84C] text-lg font-semibold uppercase tracking-wider">
                        Atelier Requests
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                        Review designs submitted by SADAF designers — approve, reject with feedback, or send them to production.
                    </p>
                </div>
                <span className={`inline-flex items-center gap-1 text-[8px] font-mono uppercase tracking-widest ${
                    wsLive ? 'text-green-400' : 'text-yellow-500'
                }`}>
                    {wsLive ? <Wifi size={10} /> : <WifiOff size={10} />}
                    {wsLive ? 'LIVE via WebSocket' : 'Polling 30s'}
                </span>
            </div>

            {/* Error */}
            {error && (
                <div role="alert" className="flex items-center gap-3 p-4 bg-red-950/30 border border-red-500/30 rounded-xl">
                    <AlertTriangle size={16} className="text-red-400 shrink-0" />
                    <p className="text-xs text-red-200 flex-1">{error}</p>
                    <button
                        onClick={refetch}
                        className="text-[9px] font-mono uppercase tracking-wider text-[#C9A84C] border border-[#C9A84C]/30 rounded px-2 py-1 hover:bg-[#C9A84C]/10 transition-all cursor-pointer"
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* Loading */}
            {loading && !data && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[0, 1, 2, 3].map((i) => (
                        <div key={i} className="h-20 rounded-xl bg-white/5 animate-pulse" />
                    ))}
                </div>
            )}

            {/* KPIs */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <KpiCard label="Total" value={stats.total} icon={Layers} accent="text-[#C9A84C]" />
                    <KpiCard label="Under Review" value={stats.underReview} icon={Clock} accent="text-[#4FC3F7]" />
                    <KpiCard label="Approved" value={stats.approved} icon={CheckCircle2} accent="text-emerald-400" />
                    <KpiCard label="In Production" value={stats.inProduction} icon={PackageCheck} accent="text-[#C9A84C]" />
                    <KpiCard label="Rejected" value={stats.rejected} icon={XCircle} accent="text-red-400" />
                </div>
            )}

            {/* Atelier report — exportable PNG/PDF table */}
            {data && (
                <div
                    ref={reportRef}
                    className="rounded-2xl bg-[#090D2A]/80 border border-white/5 p-5"
                >
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                        <div>
                            <h4 className="font-serif text-[#C9A84C] text-sm font-semibold uppercase tracking-wider">
                                Atelier Report
                            </h4>
                            <p className="text-[10px] text-slate-500 mt-0.5">
                                Expected commission per committed design — exportable as PNG or PDF.
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            {exportError && (
                                <span className="flex items-center gap-1.5 text-[9px] font-mono text-red-400">
                                    <AlertTriangle size={11} />
                                    {exportError}
                                    <button
                                        onClick={clearError}
                                        className="hover:text-white transition-colors cursor-pointer"
                                        aria-label="Dismiss export error"
                                    >
                                        <X size={10} />
                                    </button>
                                </span>
                            )}
                            <button
                                onClick={exportAsPNG}
                                disabled={isExportingPNG || isExportingPDF}
                                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#4FC3F7]/10 text-[#4FC3F7] border border-[#4FC3F7]/30 text-[9px] font-mono uppercase tracking-wider hover:bg-[#4FC3F7]/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-wait"
                                title="Export report as PNG"
                            >
                                {isExportingPNG ? (
                                    <span className="block w-3 h-3 rounded-full border-2 border-[#4FC3F7] border-t-transparent animate-spin" />
                                ) : (
                                    <FileImage size={11} />
                                )}
                                PNG
                            </button>
                            <button
                                onClick={exportAsPDF}
                                disabled={isExportingPNG || isExportingPDF}
                                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#C9A84C]/10 text-[#C9A84C] border border-[#C9A84C]/30 text-[9px] font-mono uppercase tracking-wider hover:bg-[#C9A84C]/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-wait"
                                title="Export report as PDF"
                            >
                                {isExportingPDF ? (
                                    <span className="block w-3 h-3 rounded-full border-2 border-[#C9A84C] border-t-transparent animate-spin" />
                                ) : (
                                    <FileText size={11} />
                                )}
                                PDF
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[640px]">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="py-2 pr-3 text-[8px] font-mono uppercase tracking-widest text-slate-500 font-semibold">Design</th>
                                    <th className="py-2 pr-3 text-[8px] font-mono uppercase tracking-widest text-slate-500 font-semibold">Category</th>
                                    <th className="py-2 pr-3 text-[8px] font-mono uppercase tracking-widest text-slate-500 font-semibold">Status</th>
                                    <th className="py-2 pr-3 text-[8px] font-mono uppercase tracking-widest text-slate-500 font-semibold">Price</th>
                                    <th className="py-2 text-[8px] font-mono uppercase tracking-widest text-[#C9A84C] font-semibold">
                                        Expected Commission
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {submissions.map((s) => {
                                    const participants = participantsFor(s.collaboration);
                                    const isCommitted =
                                        (s.status === 'approved' || s.status === 'in_production') &&
                                        participants.length > 0;
                                    const commission = isCommitted
                                        ? {
                                              pool: Math.round(s.price * COMMISSION_POOL_RATE * 100) / 100,
                                              shares: computeCommissionSplit(participants, s.price),
                                          }
                                        : null;
                                    return (
                                        <tr key={s.id} className="border-b border-white/5 last:border-b-0 align-top">
                                            <td className="py-2.5 pr-3">
                                                <p className="text-[11px] font-medium text-white">{s.title}</p>
                                            </td>
                                            <td className="py-2.5 pr-3">
                                                <span className="text-[9px] font-mono uppercase tracking-wider text-[#C9A84C]/70">
                                                    {s.category}
                                                </span>
                                            </td>
                                            <td className="py-2.5 pr-3">
                                                <StatusChip status={s.status} />
                                            </td>
                                            <td className="py-2.5 pr-3 text-[11px] font-mono text-[#E8E0D5]/80">
                                                ${s.price.toLocaleString()}
                                            </td>
                                            <td className="py-2.5">
                                                {commission ? (
                                                    <div className="flex flex-col gap-1">
                                                        <p className="text-[9px] font-mono text-[#C9A84C]">
                                                            Pool: ${commission.pool.toLocaleString()} · {participants.length} participants
                                                        </p>
                                                        {commission.shares.map((share) => {
                                                            const member = participants.find((m) => m.id === share.memberId);
                                                            if (!member) return null;
                                                            return (
                                                                <p
                                                                    key={share.memberId}
                                                                    className="text-[9px] text-slate-400"
                                                                >
                                                                    {member.name}
                                                                    {member.id === s.collaboration?.ownerId && (
                                                                        <span className="ml-1 text-[7px] font-mono uppercase text-[#C9A84C]/60">
                                                                            (owner)
                                                                        </span>
                                                                    )}
                                                                    : {share.percent}% · ${share.amount.toLocaleString()}
                                                                </p>
                                                            );
                                                        })}
                                                    </div>
                                                ) : (
                                                    <span className="text-[9px] font-mono text-slate-600">
                                                        —
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Feedback */}
            {feedback && (
                <div
                    role="status"
                    className={`flex items-center gap-2 p-3 rounded-xl border text-[11px] ${
                        feedback.kind === 'success'
                            ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
                            : 'bg-red-950/30 border-red-500/30 text-red-300'
                    }`}
                >
                    {feedback.kind === 'success' ? (
                        <CheckCircle2 size={13} className="shrink-0" />
                    ) : (
                        <AlertTriangle size={13} className="shrink-0" />
                    )}
                    <p className="flex-1">{feedback.text}</p>
                    <button
                        onClick={() => setFeedback(null)}
                        className="text-current/60 hover:text-current transition-colors cursor-pointer"
                        aria-label="Dismiss message"
                    >
                        <X size={13} />
                    </button>
                </div>
            )}

            {/* Filter chips */}
            <div className="flex flex-wrap gap-2">
                {FILTERS.map((f) => (
                    <button
                        key={f.id}
                        onClick={() => setFilter(f.id)}
                        className={`px-3 py-1.5 rounded-lg text-[9px] font-mono uppercase tracking-wider transition-all cursor-pointer border ${
                            filter === f.id
                                ? 'bg-[#C9A84C] text-[#090D2A] border-[#C9A84C] font-bold'
                                : 'bg-black/40 border-white/10 text-slate-400 hover:text-white hover:border-white/25'
                        }`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Queue */}
            {data && submissions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 rounded-2xl bg-[#090D2A]/40 border border-dashed border-white/10 text-center">
                    <Layers size={28} className="text-[#C9A84C]/40 mb-3" />
                    <p className="text-sm font-serif text-white">No submissions here</p>
                    <p className="text-[11px] text-slate-500 mt-1 max-w-sm">
                        {filter === 'all'
                            ? 'Designer submissions will appear here as soon as they are sent to the atelier.'
                            : 'No submissions match this status filter.'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {submissions.map((s) => (
                        <SubmissionCard
                            key={s.id}
                            id={s.id}
                            title={s.title}
                            category={s.category}
                            description={s.description}
                            price={s.price}
                            status={s.status}
                            submittedAt={s.submittedAt}
                            adminNote={s.adminNote}
                            collaboration={s.collaboration}
                            reviewing={reviewing}
                            onReview={reviewSubmission}
                            onFeedback={setFeedback}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
