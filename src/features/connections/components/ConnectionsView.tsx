'use client';

/**
 * SADAF | Connections — Hub View (pure presentation)
 *
 * Shared by the designer and company sides of the partnership hub:
 *   - Company: KPI stats, a "Discover Designers" grid with an inline
 *     connect form, and a "My Requests" table with status chips.
 *   - Designer: KPI stats, "Incoming Requests" cards with Accept/Decline,
 *     and the list of active company partnerships.
 *
 * All state/handlers come from ConnectionsPageClient via props; the view
 * only filters the shared payload by the current user's role + id.
 */

import { useMemo, useState } from 'react';
import {
    Users,
    UserPlus,
    Handshake,
    Send,
    CheckCircle2,
    XCircle,
    X,
    MapPin,
    Star,
    Wifi,
    WifiOff,
    AlertTriangle,
    Building2,
    Inbox,
} from 'lucide-react';
import type { ConnectionsData, ConnectionResponse } from '../types';
import { CONNECTION_STATUS_STYLES } from '../constants';
import { formatRelativeTime } from '@/features/notifications/utils/formatRelativeTime';
import { useLanguage } from '@/features/i18n/LanguageProvider';

// ─── Props ───────────────────────────────────────────────────────────────────

export type ConnectionsRole = 'company' | 'designer';

interface ConnectionsViewProps {
    role: ConnectionsRole;
    /** Current user id — used to pick the requests belonging to this side. */
    userId: string;
    data: ConnectionsData | null;
    loading: boolean;
    error: string | null;
    wsLive: boolean;
    mutating: boolean;
    onSend: (designerId: string, message: string) => Promise<{ ok: boolean; error?: string }>;
    onRespond: (id: string, response: ConnectionResponse) => Promise<{ ok: boolean; error?: string }>;
    onRetry: () => void;
}

// ─── Shared bits ─────────────────────────────────────────────────────────────

function StatusChip({ status }: { status: keyof typeof CONNECTION_STATUS_STYLES }) {
    const { t } = useLanguage();
    const style = CONNECTION_STATUS_STYLES[status];
    return (
        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full border text-[8px] font-mono uppercase tracking-wider ${style.chip}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
            {t(style.labelKey)}
        </span>
    );
}

function KpiCard({
    label,
    value,
    icon: Icon,
    accent,
}: {
    label: string;
    value: number;
    icon: typeof Users;
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

function FeedbackBanner({
    message,
    onDismiss,
}: {
    message: { kind: 'success' | 'error'; text: string };
    onDismiss: () => void;
}) {
    const { t } = useLanguage();

    return (
        <div
            role="status"
            className={`flex items-center gap-2 p-3 rounded-xl border text-[11px] ${
                message.kind === 'success'
                    ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
                    : 'bg-red-950/30 border-red-500/30 text-red-300'
            }`}
        >
            {message.kind === 'success' ? (
                <CheckCircle2 size={13} className="shrink-0" />
            ) : (
                <AlertTriangle size={13} className="shrink-0" />
            )}
            <p className="flex-1">{message.text}</p>
            <button
                onClick={onDismiss}
                className="text-current/60 hover:text-current transition-colors cursor-pointer"
                aria-label={t('connections.dismissMessage')}
            >
                <X size={13} />
            </button>
        </div>
    );
}

// ─── Company side ────────────────────────────────────────────────────────────

function CompanySide({
    data,
    userId,
    mutating,
    onSend,
    onFeedback,
}: {
    data: ConnectionsData;
    userId: string;
    mutating: boolean;
    onSend: (designerId: string, message: string) => Promise<{ ok: boolean; error?: string }>;
    onFeedback: (message: { kind: 'success' | 'error'; text: string }) => void;
}) {
    const { t, language } = useLanguage();
    const [composingFor, setComposingFor] = useState<string | null>(null);
    const [message, setMessage] = useState('');

    const myRequests = useMemo(
        () => data.connections.filter((c) => c.companyId === userId),
        [data.connections, userId],
    );

    const requestForDesigner = (designerId: string) =>
        myRequests.find((c) => c.designerId === designerId);

    const handleSend = async (designerId: string) => {
        const trimmed = message.trim();
        if (!trimmed) {
            onFeedback({ kind: 'error', text: t('connections.sendErrorNote') });
            return;
        }
        const result = await onSend(designerId, trimmed);
        if (result.ok) {
            setComposingFor(null);
            setMessage('');
            onFeedback({ kind: 'success', text: t('connections.sentSuccess') });
        } else {
            onFeedback({ kind: 'error', text: result.error ?? t('connections.sendFailed') });
        }
    };

    return (
        <div className="flex flex-col gap-8">
            {/* Discover designers */}
            <section>
                <div className="flex items-center gap-2 mb-5">
                    <div className="p-1.5 rounded-lg bg-[#C9A84C]/10 text-[#C9A84C]">
                        <UserPlus size={14} />
                    </div>
                    <h2 className="text-[10px] font-mono uppercase tracking-widest text-[#C9A84C] font-bold">
                        {t('connections.discoverDesigners', { count: data.designers.length })}
                    </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-5">
                    {data.designers.map((designer) => {
                        const request = requestForDesigner(designer.id);
                        return (
                            <div
                                key={designer.id}
                                className="rounded-2xl bg-[#0A0F2C]/80 border border-white/5 hover:border-[#C9A84C]/30 transition-all duration-300 p-5 flex flex-col gap-3"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <h3 className="font-serif text-white text-sm leading-snug">{designer.name}</h3>
                                        <p className="flex items-center gap-1 text-[9px] font-mono uppercase tracking-wider text-[#C9A84C]/70 mt-1">
                                            <MapPin size={9} /> {designer.city} · {designer.specialty}
                                        </p>
                                    </div>
                                    {request && <StatusChip status={request.status} />}
                                </div>

                                <div className="flex items-center gap-4 text-[10px] text-[#E8E0D5]/50">
                                    <span>{t('connections.portfolioPieces', { count: designer.portfolioCount })}</span>
                                    <span className="flex items-center gap-1">
                                        <Star size={9} className="text-[#C9A84C]" /> {designer.rating.toFixed(1)}
                                    </span>
                                    <span>{t('connections.approved', { count: designer.approvedCount })}</span>
                                </div>

                                {designer.topPiece && (
                                    <p className="text-[9px] text-[#E8E0D5]/40 italic leading-relaxed">
                                        {t('connections.signature', { piece: designer.topPiece })}
                                    </p>
                                )}

                                {!request || request.status === 'declined' ? (
                                    composingFor === designer.id ? (
                                        <div className="flex flex-col gap-2 mt-1">
                                            <textarea
                                                value={message}
                                                onChange={(e) => setMessage(e.target.value)}
                                                rows={2}
                                                placeholder={t('connections.partnerNotePlaceholder')}
                                                className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-[11px] text-white outline-none focus:border-[#C9A84C] transition resize-none"
                                            />
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleSend(designer.id)}
                                                    disabled={mutating}
                                                    className="flex-1 py-2 rounded-lg bg-[#C9A84C] text-[#0A0F2C] text-[9px] font-mono font-bold uppercase tracking-widest hover:bg-[#D9BC63] transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-wait flex items-center justify-center gap-1.5"
                                                >
                                                    <Send size={11} />
                                                    {mutating ? t('connections.sending') : t('connections.sendRequest')}
                                                </button>
                                                <button
                                                    onClick={() => setComposingFor(null)}
                                                    className="px-3 py-2 rounded-lg border border-white/10 text-[9px] font-mono uppercase tracking-widest text-[#E8E0D5]/50 hover:text-white transition-all cursor-pointer"
                                                >
                                                    {t('common.cancel')}
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => {
                                                setComposingFor(designer.id);
                                                setMessage('');
                                            }}
                                            disabled={mutating}
                                            className="mt-1 self-start py-2 px-4 rounded-lg border border-[#C9A84C]/40 text-[#C9A84C] text-[9px] font-mono font-bold uppercase tracking-widest hover:bg-[#C9A84C]/10 transition-all duration-300 cursor-pointer disabled:opacity-50"
                                        >
                                            {t('connections.connect')}
                                        </button>
                                    )
                                ) : (
                                    <p className="mt-1 text-[9px] font-mono uppercase tracking-wider text-[#E8E0D5]/40">
                                        {request.status === 'pending'
                                            ? t('connections.awaitingResponseShort')
                                            : t('connections.partnershipActive')}
                                    </p>
                                )}
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* My requests */}
            <section>
                <div className="flex items-center gap-2 mb-5">
                    <div className="p-1.5 rounded-lg bg-[#C9A84C]/10 text-[#C9A84C]">
                        <Handshake size={14} />
                    </div>
                    <h2 className="text-[10px] font-mono uppercase tracking-widest text-[#C9A84C] font-bold">
                        {t('connections.myRequests', { count: myRequests.length })}
                    </h2>
                </div>

                {myRequests.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-14 rounded-2xl bg-[#0A0F2C]/40 border border-dashed border-white/10 text-center">
                        <Inbox size={26} className="text-[#C9A84C]/40 mb-3" />
                        <p className="text-sm font-serif text-white">{t('connections.noRequestsYet')}</p>
                        <p className="text-[11px] text-slate-500 mt-1 max-w-sm">
                            {t('connections.noRequestsHint')}
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {myRequests.map((request) => (
                            <div
                                key={request.id}
                                className="rounded-2xl bg-[#0A0F2C]/60 border border-white/5 p-4 flex flex-col sm:flex-row sm:items-center gap-3"
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h3 className="font-serif text-white text-sm">{request.designerName}</h3>
                                        <span className="flex items-center gap-1 text-[9px] font-mono uppercase tracking-wider text-[#E8E0D5]/40">
                                            <MapPin size={9} /> {request.designerCity}
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-[#E8E0D5]/50 mt-1 line-clamp-2">
                                        “{request.message}”
                                    </p>
                                    <p className="text-[9px] font-mono uppercase tracking-wider text-[#E8E0D5]/30 mt-1">
                                        {formatRelativeTime(request.createdAt, language)}
                                        {request.respondedAt && t('connections.respondedAt', { time: formatRelativeTime(request.respondedAt, language) })}
                                    </p>
                                </div>
                                <StatusChip status={request.status} />
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}

// ─── Designer side ───────────────────────────────────────────────────────────

function DesignerSide({
    data,
    userId,
    mutating,
    onRespond,
    onFeedback,
}: {
    data: ConnectionsData;
    userId: string;
    mutating: boolean;
    onRespond: (id: string, response: ConnectionResponse) => Promise<{ ok: boolean; error?: string }>;
    onFeedback: (message: { kind: 'success' | 'error'; text: string }) => void;
}) {
    const { t, language } = useLanguage();
    const myRequests = useMemo(
        () => data.connections.filter((c) => c.designerId === userId),
        [data.connections, userId],
    );
    const pending = myRequests.filter((c) => c.status === 'pending');
    const active = myRequests.filter((c) => c.status === 'accepted');

    const handleRespond = async (id: string, response: ConnectionResponse) => {
        const result = await onRespond(id, response);
        if (result.ok) {
            onFeedback({
                kind: 'success',
                text: response === 'accept' ? t('connections.acceptedSuccess') : t('connections.declinedSuccess'),
            });
        } else {
            onFeedback({ kind: 'error', text: result.error ?? t('connections.updateFailed') });
        }
    };

    return (
        <div className="flex flex-col gap-8">
            {/* Incoming requests */}
            <section>
                <div className="flex items-center gap-2 mb-5">
                    <div className="p-1.5 rounded-lg bg-[#A78BFA]/10 text-[#A78BFA]">
                        <Inbox size={14} />
                    </div>
                    <h2 className="text-[10px] font-mono uppercase tracking-widest text-[#A78BFA] font-bold">
                        {t('connections.incomingRequests', { count: pending.length })}
                    </h2>
                </div>

                {pending.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-14 rounded-2xl bg-[#0A0F2C]/40 border border-dashed border-white/10 text-center">
                        <Inbox size={26} className="text-[#A78BFA]/40 mb-3" />
                        <p className="text-sm font-serif text-white">{t('connections.noIncoming')}</p>
                        <p className="text-[11px] text-slate-500 mt-1 max-w-sm">
                            {t('connections.noIncomingHint')}
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {pending.map((request) => (
                            <div
                                key={request.id}
                                className="rounded-2xl bg-[#0A0F2C]/80 border border-[#A78BFA]/15 p-5 flex flex-col gap-3"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <Building2 size={13} className="text-[#A78BFA]" />
                                            <h3 className="font-serif text-white text-sm">{request.companyName}</h3>
                                            <span className="flex items-center gap-1 text-[9px] font-mono uppercase tracking-wider text-[#E8E0D5]/40">
                                                <MapPin size={9} /> {request.companyCity} · {request.companyFocus}
                                            </span>
                                        </div>
                                        <p className="text-[10px] font-mono uppercase tracking-wider text-[#E8E0D5]/30 mt-1">
                                            {formatRelativeTime(request.createdAt, language)}
                                        </p>
                                    </div>
                                    <StatusChip status={request.status} />
                                </div>
                                <p className="text-[11px] text-[#E8E0D5]/60 leading-relaxed">
                                    “{request.message}”
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleRespond(request.id, 'accept')}
                                        disabled={mutating}
                                        className="flex-1 py-2.5 rounded-lg bg-emerald-500 text-[#0A0F2C] text-[9px] font-mono font-bold uppercase tracking-widest hover:bg-emerald-400 transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-wait flex items-center justify-center gap-1.5"
                                    >
                                        <CheckCircle2 size={11} />
                                        {t('connections.accept')}
                                    </button>
                                    <button
                                        onClick={() => handleRespond(request.id, 'decline')}
                                        disabled={mutating}
                                        className="flex-1 py-2.5 rounded-lg border border-red-500/40 text-red-400 text-[9px] font-mono font-bold uppercase tracking-widest hover:bg-red-500/10 transition-all duration-300 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                                    >
                                        <XCircle size={11} />
                                        {t('connections.decline')}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Active partnerships */}
            <section>
                <div className="flex items-center gap-2 mb-5">
                    <div className="p-1.5 rounded-lg bg-[#A78BFA]/10 text-[#A78BFA]">
                        <Handshake size={14} />
                    </div>
                    <h2 className="text-[10px] font-mono uppercase tracking-widest text-[#A78BFA] font-bold">
                        {t('connections.activePartnershipsTitle', { count: active.length })}
                    </h2>
                </div>

                {active.length === 0 ? (
                    <p className="text-[11px] text-slate-500">
                        {t('connections.noActivePartnerships')}
                    </p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {active.map((request) => (
                            <div
                                key={request.id}
                                className="rounded-2xl bg-[#0A0F2C]/60 border border-emerald-500/15 p-4 flex flex-col gap-2"
                            >
                                <div className="flex items-center gap-2 flex-wrap">
                                    <Building2 size={12} className="text-emerald-400" />
                                    <h3 className="font-serif text-white text-sm">{request.companyName}</h3>
                                </div>
                                <p className="text-[9px] font-mono uppercase tracking-wider text-[#E8E0D5]/40">
                                    <MapPin size={9} className="inline mr-1" />
                                    {request.companyCity} · {request.companyFocus}
                                </p>
                                {request.respondedAt && (
                                    <p className="text-[9px] font-mono uppercase tracking-wider text-[#E8E0D5]/30">
                                        {t('connections.partnered', { time: formatRelativeTime(request.respondedAt, language) })}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}

// ─── Main view ───────────────────────────────────────────────────────────────

export default function ConnectionsView({
    role,
    userId,
    data,
    loading,
    error,
    wsLive,
    mutating,
    onSend,
    onRespond,
    onRetry,
}: ConnectionsViewProps) {
    const { t } = useLanguage();
    const [feedback, setFeedback] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

    const myConnections = useMemo(
        () =>
            (data?.connections ?? []).filter((c) =>
                role === 'company' ? c.companyId === userId : c.designerId === userId,
            ),
        [data, role, userId],
    );
    const pendingCount = myConnections.filter((c) => c.status === 'pending').length;
    const activeCount = myConnections.filter((c) => c.status === 'accepted').length;

    return (
        <div className="relative w-full min-h-screen pb-20">
            {/* Header */}
            <section className="px-6 md:px-10 py-10 border-b border-[#C9A84C]/10 bg-gradient-to-b from-[#0A0F2C] to-[#12103A]">
                <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#C9A84C]">
                        {t('connections.kicker')}
                    </span>
                    <span
                        className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[8px] font-mono uppercase tracking-wider ${
                            wsLive
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        }`}
                    >
                        {wsLive ? <Wifi size={9} /> : <WifiOff size={9} />}
                        {wsLive ? t('connections.live') : t('connections.polling')}
                    </span>
                </div>
                <h1 className="text-3xl md:text-4xl font-serif text-white uppercase tracking-tight">
                    {role === 'company' ? (
                        <>
                            {t('connections.title.companyPre')} <span className="text-[#C9A84C] italic">{t('connections.title.companyHighlight')}</span>
                        </>
                    ) : (
                        <>
                            {t('connections.title.designerPre')} <span className="text-[#A78BFA] italic">{t('connections.title.designerHighlight')}</span>
                        </>
                    )}
                </h1>
                <p className="text-xs md:text-sm text-slate-400 max-w-2xl mt-2 leading-relaxed">
                    {role === 'company' ? t('connections.subtitle.company') : t('connections.subtitle.designer')}
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
                            {t('connections.retry')}
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

                {/* KPI stats */}
                {data && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <KpiCard
                            label={role === 'company' ? t('connections.kpi.requestsSent') : t('connections.kpi.incoming')}
                            value={myConnections.length}
                            icon={Users}
                            accent="text-[#C9A84C]"
                        />
                        <KpiCard
                            label={t('connections.kpi.awaitingResponse')}
                            value={pendingCount}
                            icon={Inbox}
                            accent="text-amber-400"
                        />
                        <KpiCard
                            label={t('connections.kpi.activePartnerships')}
                            value={activeCount}
                            icon={Handshake}
                            accent="text-emerald-400"
                        />
                        <KpiCard
                            label={role === 'company' ? t('connections.kpi.designersAvailable') : t('connections.kpi.companiesOnPlatform')}
                            value={role === 'company' ? data.designers.length : data.companies.length}
                            icon={UserPlus}
                            accent="text-[#A78BFA]"
                        />
                    </div>
                )}

                {/* Feedback */}
                {feedback && (
                    <FeedbackBanner message={feedback} onDismiss={() => setFeedback(null)} />
                )}

                {/* Role-specific content */}
                {data &&
                    (role === 'company' ? (
                        <CompanySide
                            data={data}
                            userId={userId}
                            mutating={mutating}
                            onSend={onSend}
                            onFeedback={setFeedback}
                        />
                    ) : (
                        <DesignerSide
                            data={data}
                            userId={userId}
                            mutating={mutating}
                            onRespond={onRespond}
                            onFeedback={setFeedback}
                        />
                    ))}
            </div>
        </div>
    );
}
