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

import { useMemo, useState } from 'react';
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
    X,
} from 'lucide-react';
import type { DesignStatus } from '@/features/designer/types';
import { DESIGN_STATUS_STYLES } from '@/features/designer/constants';
import { useAtelierRequests } from '../hooks/useAtelierRequests';
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
    reviewing: boolean;
    onReview: (id: string, status: DesignStatus, adminNote?: string) => Promise<{ ok: boolean; error?: string }>;
    onFeedback: (message: { kind: 'success' | 'error'; text: string }) => void;
}) {
    const [rejecting, setRejecting] = useState(false);
    const [note, setNote] = useState('');

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
