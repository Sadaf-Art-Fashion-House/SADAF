'use client';

/**
 * SADAF | Designer — Dashboard View (pure presentation)
 *
 * Renders the designer's atelier workspace: KPI stats, a submit-new-design
 * form (title, category, price, description, optional preview image), and
 * the portfolio grid with live pipeline status chips. All state/handlers
 * come from DesignerDashboardPageClient via props.
 */

import { useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import {
    Palette,
    Upload,
    X,
    CheckCircle2,
    AlertTriangle,
    Clock,
    Info,
    PackageCheck,
    Sparkles,
    Layers,
    Wifi,
    WifiOff,
    Users,
    User,
} from 'lucide-react';
import type { DesignerDashboardData, NewDesignSubmission, DesignCategory, DesignCollaboration, DesignStatus } from '../types';
import type { TranslationKey } from '@/features/i18n/dictionaries';
import { DESIGN_CATEGORIES, DESIGN_STATUS_STYLES } from '../constants';
import { COMMISSION_POOL_RATE, participantsFor } from '../utils/commissionSplit';
import { formatRelativeTime } from '@/features/notifications/utils/formatRelativeTime';
import { useLanguage } from '@/features/i18n/LanguageProvider';

/** Translation key per pipeline status (same map as the admin atelier tab). */
const STATUS_KEYS: Record<DesignStatus, TranslationKey> = {
    draft: 'atelierAdmin.status.draft',
    under_review: 'atelierAdmin.status.underReview',
    approved: 'atelierAdmin.status.approved',
    in_production: 'atelierAdmin.status.inProduction',
    rejected: 'atelierAdmin.status.rejected',
};
import { fileToResizedDataUrl } from '@/shared/utils/fileToResizedDataUrl';
import { ROUTES } from '@/config/routes';

// ─── Props ───────────────────────────────────────────────────────────────────

interface DesignerDashboardViewProps {
    data: DesignerDashboardData | null;
    loading: boolean;
    error: string | null;
    wsLive: boolean;
    submitting: boolean;
    onSubmit: (input: NewDesignSubmission) => Promise<{ ok: boolean; error?: string }>;
    onRetry: () => void;
}

// ─── KPI card ────────────────────────────────────────────────────────────────

function KpiCard({
    label,
    value,
    icon: Icon,
    accent,
    hoverDetail,
    hoverHint,
}: {
    label: string;
    value: number | string;
    icon: typeof Layers;
    accent: string;
    hoverDetail?: ReactNode;
    hoverHint?: string;
}) {
    const { t } = useLanguage();
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
                {hoverDetail && (
                    <span
                        title={hoverHint ?? t('designer.commissionBreakdownHint')}
                        className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#C9A84C]/15 text-[#C9A84C] shrink-0"
                    >
                        <Info size={9} />
                    </span>
                )}
            </p>
            {hoverDetail && (
                <div className="absolute z-30 right-0 bottom-full mb-2 w-64 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none">
                    <div className="rounded-xl bg-[#141B4D] border border-[#A78BFA]/30 shadow-2xl shadow-black/50 p-3">
                        {hoverDetail}
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Portfolio card ──────────────────────────────────────────────────────────

function PortfolioCard({
    id,
    title,
    category,
    description,
    imageUrl,
    status,
    submittedAt,
    price,
    adminNote,
    collaboration,
}: {
    id: string;
    title: string;
    category: string;
    description: string;
    imageUrl?: string;
    status: keyof typeof DESIGN_STATUS_STYLES;
    submittedAt: string;
    price: number;
    adminNote?: string;
    collaboration?: DesignCollaboration;
}) {
    const style = DESIGN_STATUS_STYLES[status];
    const { t, language } = useLanguage();
    const isTeam = collaboration?.type === 'team';
    // Credits model: the owner is always a participant, so the count matches
    // the detail page (owner + collaborators, deduped by id).
    const participantCount = collaboration
        ? new Set([collaboration.ownerId, ...collaboration.members.map((m) => m.id)]).size
        : 0;
    return (
        <Link
            href={`${ROUTES.DASHBOARD_DESIGNER_PORTFOLIO}/${id}`}
            className="group rounded-2xl bg-[#0A0F2C]/80 border border-white/5 hover:border-[#A78BFA]/40 hover:shadow-[0_0_24px_rgba(167,139,250,0.08)] transition-all duration-300 overflow-hidden flex flex-col cursor-pointer"
        >
            <div className="relative h-40 bg-gradient-to-br from-[#141B4D] to-[#0A0F2C] flex items-center justify-center overflow-hidden">
                {imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- data-URL previews can't use next/image
                    <img
                        src={imageUrl}
                        alt={title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                ) : (
                    <span className="font-serif text-5xl text-[#A78BFA]/30 group-hover:scale-110 transition-transform duration-500">
                        {title.charAt(0)}
                    </span>
                )}
                <span className={`absolute top-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded-full border text-[8px] font-mono uppercase tracking-wider ${style.chip}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                    {t(STATUS_KEYS[status])}
                </span>
            </div>
            <div className="p-4 flex flex-col gap-2 flex-1">
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                        <h3 className="font-serif text-white text-sm leading-snug group-hover:text-[#A78BFA] transition-colors">
                            {title}
                        </h3>
                        <p className="text-[9px] font-mono uppercase tracking-wider text-[#A78BFA]/70 mt-0.5">
                            {category} · {formatRelativeTime(submittedAt, language)}
                        </p>
                    </div>
                    <span className="text-[11px] font-mono text-[#C9A84C] font-semibold shrink-0">
                        ${price.toLocaleString()}
                    </span>
                </div>
                <p className="text-[10px] text-[#E8E0D5]/50 leading-relaxed line-clamp-2 flex-1">
                    {description}
                </p>
                {adminNote && (
                    <p className="text-[9px] text-[#E8E0D5]/40 border-t border-white/5 pt-2 italic leading-relaxed">
                        {t('designer.portfolio.atelierNote', { note: adminNote })}
                    </p>
                )}
                <div className="flex items-center justify-between pt-2 border-t border-white/5 mt-auto">
                    <span className="flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-wider text-[#A78BFA]/60">
                        {isTeam ? <Users size={10} /> : <User size={10} />}
                        {isTeam
                            ? t('designer.portfolio.collaborators', { count: participantCount })
                            : t('designer.portfolio.solo')}
                    </span>
                    <span className="text-[9px] font-mono uppercase tracking-wider text-[#E8E0D5]/40 group-hover:text-[#A78BFA] transition-colors">
                        {t('designer.portfolio.viewProject')}
                    </span>
                </div>
            </div>
        </Link>
    );
}

// ─── Main view ───────────────────────────────────────────────────────────────

export default function DesignerDashboardView({
    data,
    loading,
    error,
    wsLive,
    submitting,
    onSubmit,
    onRetry,
}: DesignerDashboardViewProps) {
    const { t, language } = useLanguage();

    // ── Submit form state (presentation-only) ──
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState<DesignCategory>('Abaya');
    const [price, setPrice] = useState('');
    const [description, setDescription] = useState('');
    const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
    const [statusMessage, setStatusMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
    const [isResizingImage, setIsResizingImage] = useState(false);

    const stats = data?.stats;

    // Total projected commission across committed designs (approved + in
    // production) — the sum of the 10% pools, same shared math as the admin
    // atelier report and the designer detail page (no duplicated logic).
    const expectedCommission = useMemo(() => {
        const list = data?.submissions ?? [];
        return list.reduce((sum, submission) => {
            const isCommitted =
                submission.status === 'approved' || submission.status === 'in_production';
            if (!isCommitted || participantsFor(submission.collaboration).length === 0) return sum;
            return sum + submission.price * COMMISSION_POOL_RATE;
        }, 0);
    }, [data]);

    // Per-design pool breakdown for the Expected Commission KPI tooltip — one
    // row per committed design (approved / in production), same shared math as
    // the total above and the admin atelier report (no duplicated logic).
    const commissionBreakdown = useMemo(() => {
        const list = data?.submissions ?? [];
        return list
            .filter((submission) => {
                const isCommitted =
                    submission.status === 'approved' || submission.status === 'in_production';
                return isCommitted && participantsFor(submission.collaboration).length > 0;
            })
            .map((submission) => ({
                id: submission.id,
                title: submission.title,
                price: submission.price,
                pool: submission.price * COMMISSION_POOL_RATE,
                participants: participantsFor(submission.collaboration).length,
                status: submission.status,
            }));
    }, [data]);

    const handleImageChange = async (file: File | undefined) => {
        if (!file) return;
        setIsResizingImage(true);
        try {
            const resized = await fileToResizedDataUrl(file);
            setImageUrl(resized);
        } catch (err: unknown) {
            setStatusMessage({
                kind: 'error',
                text: err instanceof Error ? err.message : t('designer.submit.err.readImage'),
            });
        } finally {
            setIsResizingImage(false);
        }
    };

    const handleSubmit = async () => {
        const parsedPrice = Number(price);
        if (!title.trim()) {
            setStatusMessage({ kind: 'error', text: t('designer.submit.err.title') });
            return;
        }
        if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
            setStatusMessage({ kind: 'error', text: t('designer.submit.err.price') });
            return;
        }

        const result = await onSubmit({
            title: title.trim(),
            category,
            description: description.trim(),
            price: parsedPrice,
            imageUrl,
        });

        if (result.ok) {
            setTitle('');
            setPrice('');
            setDescription('');
            setImageUrl(undefined);
            setCategory('Abaya');
            setStatusMessage({
                kind: 'success',
                text: t('designer.submit.ok'),
            });
        } else {
            setStatusMessage({ kind: 'error', text: result.error ?? t('designer.submit.err.failed') });
        }
    };

    return (
        <div className="relative w-full min-h-screen pb-20">
            {/* Header */}
            <section className="px-6 md:px-10 py-10 border-b border-[#A78BFA]/10 bg-gradient-to-b from-[#0A0F2C] to-[#12103A]">
                <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#A78BFA]">
                        {t('designer.workspace')}
                    </span>
                    <span
                        className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[8px] font-mono uppercase tracking-wider ${
                            wsLive
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        }`}
                    >
                        {wsLive ? <Wifi size={9} /> : <WifiOff size={9} />}
                        {wsLive ? t('designer.live') : t('designer.polling')}
                    </span>
                </div>
                <h1 className="text-3xl md:text-4xl font-serif text-white uppercase tracking-tight">
                    {t('designer.title')} <span className="text-[#A78BFA] italic">{t('designer.titleAccent')}</span>
                </h1>
                <p className="text-xs md:text-sm text-slate-400 max-w-2xl mt-2 leading-relaxed">
                    {t('designer.subtitle')}
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
                            {t('designer.retry')}
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
                {stats && (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <KpiCard label={t('designer.kpi.total')} value={stats.total} icon={Layers} accent="text-[#A78BFA]" />
                        <KpiCard label={t('designer.kpi.underReview')} value={stats.underReview} icon={Clock} accent="text-[#4FC3F7]" />
                        <KpiCard label={t('designer.kpi.approved')} value={stats.approved} icon={CheckCircle2} accent="text-emerald-400" />
                        <KpiCard label={t('designer.kpi.inProduction')} value={stats.inProduction} icon={PackageCheck} accent="text-[#C9A84C]" />
                        <KpiCard
                            label={t('designer.kpi.expected')}
                            value={`$${Math.round(expectedCommission).toLocaleString()}`}
                            icon={Sparkles}
                            accent="text-[#C9A84C]"
                            hoverDetail={
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[8px] font-mono uppercase tracking-widest text-[#C9A84C] font-bold">
                                            {t('designer.pools.title')}
                                        </span>
                                        <Sparkles size={10} className="text-[#C9A84C]" />
                                    </div>
                                    {commissionBreakdown.length === 0 ? (
                                        <p className="text-[10px] text-[#E8E0D5]/50 italic">
                                            {t('designer.pools.empty')}
                                        </p>
                                    ) : (
                                        <ul className="flex flex-col gap-2 max-h-44 overflow-y-auto pr-1">
                                            {commissionBreakdown.map((item) => (
                                                <li key={item.id} className="flex flex-col gap-0.5">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span
                                                            className="text-[10px] text-[#E8E0D5]/80 truncate min-w-0"
                                                            title={item.title}
                                                        >
                                                            {item.title}
                                                        </span>
                                                        <span className="text-[10px] font-mono text-[#C9A84C] font-semibold shrink-0">
                                                            $
                                                            {item.pool.toLocaleString(undefined, {
                                                                maximumFractionDigits: 2,
                                                            })}
                                                        </span>
                                                    </div>
                                                    <span className="text-[8px] font-mono uppercase tracking-wider text-[#E8E0D5]/40">
                                                        {t('designer.pools.row', {
                                                            status:
                                                                item.status === 'in_production'
                                                                    ? t('atelierAdmin.status.inProduction')
                                                                    : t('atelierAdmin.status.approved'),
                                                            pct: COMMISSION_POOL_RATE * 100,
                                                            price: item.price.toLocaleString(),
                                                            count: item.participants,
                                                            s: item.participants === 1 ? '' : 's',
                                                        })}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                    <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                                        <span className="text-[8px] font-mono uppercase tracking-wider text-[#E8E0D5]/40">
                                            {t('designer.pools.total')}
                                        </span>
                                        <span className="text-[11px] font-mono text-[#C9A84C] font-bold">
                                            $
                                            {Math.round(expectedCommission).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            }
                        />
                    </div>
                )}

                {/* Submit new design */}
                <section className="rounded-2xl bg-[#0A0F2C]/80 border border-[#A78BFA]/15 p-6">
                    <div className="flex items-center gap-2 mb-5">
                        <div className="p-1.5 rounded-lg bg-[#A78BFA]/10 text-[#A78BFA]">
                            <Upload size={14} />
                        </div>
                        <h2 className="text-[10px] font-mono uppercase tracking-widest text-[#A78BFA] font-bold">
                            {t('designer.submit.title')}
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="flex flex-col gap-4">
                            <div>
                                <label className="text-[9px] uppercase tracking-wider text-slate-400 block mb-1.5">
                                    {t('designer.submit.titleLabel')}
                                </label>
                                <input
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder={t('designer.submit.titlePlaceholder')}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none focus:border-[#A78BFA] transition"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[9px] uppercase tracking-wider text-slate-400 block mb-1.5">
                                        {t('designer.submit.categoryLabel')}
                                    </label>
                                    <select
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value as DesignCategory)}
                                        className="w-full bg-[#0A0F2C] border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none focus:border-[#A78BFA] transition"
                                    >
                                        {DESIGN_CATEGORIES.map((c) => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[9px] uppercase tracking-wider text-slate-400 block mb-1.5">
                                        {t('designer.submit.priceLabel')}
                                    </label>
                                    <input
                                        type="number"
                                        min={1}
                                        value={price}
                                        onChange={(e) => setPrice(e.target.value)}
                                        placeholder="1450"
                                        className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none focus:border-[#A78BFA] transition"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-[9px] uppercase tracking-wider text-slate-400 block mb-1.5">
                                    {t('designer.submit.descLabel')}
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={3}
                                    placeholder={t('designer.submit.descPlaceholder')}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none focus:border-[#A78BFA] transition resize-none"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-4">
                            <div>
                                <label className="text-[9px] uppercase tracking-wider text-slate-400 block mb-1.5">
                                    {t('designer.submit.previewLabel')}
                                </label>
                                <label className="flex flex-col items-center justify-center h-40 bg-[#E8E0D5]/5 border border-dashed border-[#A78BFA]/25 rounded-xl hover:bg-[#A78BFA]/5 hover:border-[#A78BFA]/50 transition-all duration-300 cursor-pointer">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => handleImageChange(e.target.files?.[0])}
                                    />
                                    {isResizingImage ? (
                                        <span className="text-[10px] text-[#A78BFA] font-mono uppercase tracking-wider">
                                            {t('designer.submit.processing')}
                                        </span>
                                    ) : imageUrl ? (
                                        <div className="relative w-full h-full">
                                            {/* eslint-disable-next-line @next/next/no-img-element -- data-URL previews can't use next/image */}
                                            <img src={imageUrl} alt={t('designer.submit.previewLabel')} className="w-full h-full object-cover rounded-xl" />
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    setImageUrl(undefined);
                                                }}
                                                className="absolute top-2 right-2 p-1 rounded-full bg-black/70 text-white hover:bg-red-500/80 transition-colors cursor-pointer"
                                                aria-label={t('designer.submit.removePreview')}
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="text-center flex flex-col items-center px-4">
                                            <Sparkles size={18} className="text-[#A78BFA] mb-2" />
                                            <span className="text-[10px] text-slate-400 tracking-wider">
                                                {t('designer.submit.uploadHint')}
                                            </span>
                                        </div>
                                    )}
                                </label>
                            </div>

                            {statusMessage && (
                                <div
                                    role="status"
                                    className={`flex items-center gap-2 p-3 rounded-xl border text-[11px] ${
                                        statusMessage.kind === 'success'
                                            ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
                                            : 'bg-red-950/30 border-red-500/30 text-red-300'
                                    }`}
                                >
                                    {statusMessage.kind === 'success' ? (
                                        <CheckCircle2 size={13} className="shrink-0" />
                                    ) : (
                                        <AlertTriangle size={13} className="shrink-0" />
                                    )}
                                    {statusMessage.text}
                                </div>
                            )}

                            <button
                                onClick={handleSubmit}
                                disabled={submitting}
                                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#A78BFA] to-[#4FC3F7] text-[#0A0F2C] text-xs font-mono font-bold uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-wait flex items-center justify-center gap-2 shadow-lg shadow-[#A78BFA]/10"
                            >
                                <Palette size={13} />
                                {submitting ? t('designer.submit.submitting') : t('designer.submit.submit')}
                            </button>
                        </div>
                    </div>
                </section>

                {/* Portfolio */}
                <section>
                    <div className="flex items-center gap-2 mb-5">
                        <div className="p-1.5 rounded-lg bg-[#A78BFA]/10 text-[#A78BFA]">
                            <Layers size={14} />
                        </div>
                        <h2 className="text-[10px] font-mono uppercase tracking-widest text-[#A78BFA] font-bold">
                            {t('designer.portfolio', { count: stats?.total ?? 0 })}
                        </h2>
                    </div>

                    {data && data.submissions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 rounded-2xl bg-[#0A0F2C]/40 border border-dashed border-white/10 text-center">
                            <Palette size={28} className="text-[#A78BFA]/40 mb-3" />
                            <p className="text-sm font-serif text-white">{t('designer.portfolio.empty')}</p>
                            <p className="text-[11px] text-slate-500 mt-1 max-w-sm">
                                {t('designer.portfolio.emptyHint')}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            {data?.submissions.map((submission) => (
                                <PortfolioCard
                                    key={submission.id}
                                    id={submission.id}
                                    title={submission.title}
                                    category={submission.category}
                                    description={submission.description}
                                    imageUrl={submission.imageUrl}
                                    status={submission.status}
                                    submittedAt={submission.submittedAt}
                                    price={submission.price}
                                    adminNote={submission.adminNote}
                                    collaboration={submission.collaboration}
                                />
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
