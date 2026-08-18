'use client';

/**
 * SADAF | Admin — Withdrawals Review Queue
 *
 * Lets an admin review payout requests from BOTH earning roles (designer +
 * sales-partner) in one queue and approve or reject them. Reads/writes the
 * same per-kind localStorage ledger the partner panels use, so a decision
 * here is reflected in the earner's open panel instantly (shared storage +
 * window events from withdrawalStorage.ts).
 *
 * Approval lifecycle (sandbox):
 *   requested → (admin approve) → approved → (transfer executes) → paid
 *   requested → (admin reject)  → rejected
 */

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    AlertTriangle,
    Wallet,
    CheckCircle2,
    XCircle,
    Clock,
    ShieldCheck,
    ShieldAlert,
    Zap,
    X,
} from 'lucide-react';
import { useLanguage } from '@/features/i18n/LanguageProvider';
import type { TranslationKey } from '@/features/i18n/dictionaries';
import { useAdminWithdrawals } from '@/features/commissions/hooks/useAdminWithdrawals';
import type { AdminWithdrawalEntry } from '@/features/commissions/hooks/useAdminWithdrawals';
import type { WithdrawalStatus } from '@/features/commissions/types';
import type { KycLevel } from '@/shared/types';
import { ErrorBoundary } from '@/shared/ui/ErrorBoundary';

const STATUS_STYLES: Record<WithdrawalStatus, { chip: string; icon: typeof Clock }> = {
    requested: { chip: 'text-amber-400 border-amber-500/30 bg-amber-500/10', icon: Clock },
    approved: { chip: 'text-[#4FC3F7] border-[#4FC3F7]/30 bg-[#4FC3F7]/10', icon: CheckCircle2 },
    rejected: { chip: 'text-red-400 border-red-500/30 bg-red-500/10', icon: XCircle },
    paid: { chip: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10', icon: CheckCircle2 },
};

const STATUS_KEYS: Record<WithdrawalStatus, TranslationKey> = {
    requested: 'admin.withdrawals.status.requested',
    approved: 'admin.withdrawals.status.approved',
    rejected: 'admin.withdrawals.status.rejected',
    paid: 'admin.withdrawals.status.paid',
};

const KIND_KEYS: Record<AdminWithdrawalEntry['kind'], TranslationKey> = {
    designer: 'admin.withdrawals.kind.designer',
    'sales-partner': 'admin.withdrawals.kind.salesPartner',
};

/** KYC badge labels per verification level (legacy rows default to 'none'). */
const KYC_KEYS: Record<KycLevel, TranslationKey> = {
    none: 'withdraw.kyc.level.none',
    basic: 'withdraw.kyc.level.basic',
    full: 'withdraw.kyc.level.full',
};

const KYC_CHIPS: Record<KycLevel, string> = {
    none: 'text-slate-400 border-white/10 bg-white/5',
    basic: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
    full: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
};

export default function AdminWithdrawalsTab() {
    const { t } = useLanguage();
    const { entries, loading, approve, reject } = useAdminWithdrawals();

    /** The request the admin is about to reject — drives the mandatory-reason modal. */
    const [rejectTarget, setRejectTarget] = useState<{ kind: AdminWithdrawalEntry['kind']; id: string; amount: number } | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [rejectError, setRejectError] = useState<string | null>(null);

    const pending = useMemo(() => entries.filter((entry) => entry.request.status === 'requested'), [entries]);
    const pendingTotal = useMemo(
        () => pending.reduce((sum, entry) => sum + entry.request.amount, 0),
        [pending],
    );

    return (
        <ErrorBoundary label="admin:withdrawals">
            <div className="space-y-6">
                {/* Header + pending summary */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-[#C9A84C]/10 text-[#C9A84C]">
                            <Wallet size={18} />
                        </div>
                        <div>
                            <h3 className="font-serif text-[#C9A84C] text-lg font-semibold uppercase tracking-wider">
                                {t('admin.withdrawals.title')}
                            </h3>
                            <p className="text-xs text-slate-400 mt-0.5">{t('admin.withdrawals.subtitle')}</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <div className="px-4 py-2.5 rounded-xl bg-black/35 border border-white/5">
                            <span className="text-[9px] font-mono uppercase tracking-widest text-slate-400 block">
                                {t('admin.withdrawals.pendingCount')}
                            </span>
                            <span className="text-lg font-serif font-bold text-amber-400">{pending.length}</span>
                        </div>
                        <div className="px-4 py-2.5 rounded-xl bg-black/35 border border-white/5">
                            <span className="text-[9px] font-mono uppercase tracking-widest text-slate-400 block">
                                {t('admin.withdrawals.pendingAmount')}
                            </span>
                            <span className="text-lg font-serif font-bold text-[#C9A84C]">
                                ${pendingTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                            </span>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center gap-2 text-xs text-slate-400 py-8">
                        <span className="w-3.5 h-3.5 rounded-full border-2 border-[#C9A84C] border-t-transparent animate-spin" />
                        {t('admin.withdrawals.loading')}
                    </div>
                ) : entries.length === 0 ? (
                    <div className="py-12 text-center text-xs text-slate-500 font-mono border border-dashed border-white/10 rounded-2xl">
                        {t('admin.withdrawals.empty')}
                    </div>
                ) : (
                    <div className="space-y-3">
                        <AnimatePresence initial={false}>
                            {entries.map(({ kind, request }) => {
                                const style = STATUS_STYLES[request.status];
                                const StatusIcon = style.icon;
                                return (
                                    <motion.div
                                        key={`${kind}-${request.id}`}
                                        layout
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        transition={{ duration: 0.25, ease: 'easeOut' }}
                                        className={`p-4 rounded-2xl border transition-colors ${
                                            request.status === 'requested'
                                                ? 'bg-amber-500/[0.04] border-amber-500/20'
                                                : 'bg-black/35 border-white/5'
                                        }`}
                                    >
                                        <div className="flex flex-col md:flex-row md:items-center gap-4">
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                <span className={`p-2 rounded-lg shrink-0 ${style.chip}`}>
                                                    <StatusIcon size={14} />
                                                </span>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-mono font-bold text-white truncate">
                                                        {request.id}
                                                        <span className="ml-2 text-[9px] font-mono uppercase tracking-wider text-slate-500">
                                                            {t(KIND_KEYS[kind])}
                                                        </span>
                                                    </p>
                                                    <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                                                        {request.method === 'bank'
                                                            ? t('withdraw.method.bank')
                                                            : t('withdraw.method.paypal')}
                                                        {' · '}
                                                        {new Date(request.requestedAt).toLocaleDateString(undefined, {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            year: 'numeric',
                                                        })}
                                                        {request.reviewedAt
                                                            ? ` · ${t('admin.withdrawals.reviewed', {
                                                                  date: new Date(request.reviewedAt).toLocaleDateString(
                                                                      undefined,
                                                                      { month: 'short', day: 'numeric' },
                                                                  ),
                                                              })}`
                                                            : ''}
                                                    </p>
                                                    {request.status === 'rejected' && request.rejectionReason && (
                                                        <p className="text-[9px] text-red-400/90 mt-1 flex items-center gap-1">
                                                            <AlertTriangle size={9} className="shrink-0" />
                                                            <span>{request.rejectionReason}</span>
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 shrink-0">
                                                <span className={`px-2.5 py-1 rounded-full text-[9px] font-mono uppercase tracking-wider border font-bold ${style.chip}`}>
                                                    {t(STATUS_KEYS[request.status])}
                                                </span>
                                                <span
                                                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[8px] font-mono uppercase tracking-wider border ${KYC_CHIPS[request.kycStatus ?? 'none']}`}
                                                    title={t(KYC_KEYS[request.kycStatus ?? 'none'])}
                                                >
                                                    {request.kycStatus === 'full' ? (
                                                        <ShieldCheck size={9} />
                                                    ) : request.kycStatus === 'basic' ? (
                                                        <ShieldCheck size={9} className="opacity-70" />
                                                    ) : (
                                                        <ShieldAlert size={9} />
                                                    )}
                                                    {t(KYC_KEYS[request.kycStatus ?? 'none'])}
                                                </span>
                                                {request.reviewedBy === 'auto-kyc' && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[8px] font-mono uppercase tracking-wider border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                                                        <Zap size={9} />
                                                        {t('admin.withdrawals.autoApproved')}
                                                    </span>
                                                )}
                                                <span className="text-sm font-mono font-bold text-[#C9A84C]">
                                                    ${request.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                                </span>
                                                {request.status === 'requested' && (
                                                    <div className="flex gap-2 ml-1">
                                                        <button
                                                            onClick={() => approve(kind, request.id)}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[9px] font-mono font-bold uppercase tracking-wider hover:bg-emerald-500/25 transition cursor-pointer"
                                                            aria-label={t('admin.withdrawals.approve')}
                                                        >
                                                            <CheckCircle2 size={11} />
                                                            {t('admin.withdrawals.approve')}
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setRejectTarget({ kind, id: request.id, amount: request.amount });
                                                                setRejectReason('');
                                                                setRejectError(null);
                                                            }}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/15 text-red-400 border border-red-500/30 text-[9px] font-mono font-bold uppercase tracking-wider hover:bg-red-500/25 transition cursor-pointer"
                                                            aria-label={t('admin.withdrawals.reject')}
                                                        >
                                                            <XCircle size={11} />
                                                            {t('admin.withdrawals.reject')}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* Rejection reason modal — reason is mandatory before rejecting */}
            <AnimatePresence>
                {rejectTarget && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                            onClick={() => setRejectTarget(null)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 260 }}
                            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md p-6 bg-[#0A0F2C]/98 border border-red-500/25 rounded-2xl shadow-xl backdrop-blur-xl"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 rounded-lg bg-red-500/10 text-red-400">
                                        <AlertTriangle size={16} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-serif text-white font-semibold">
                                            {t('admin.withdrawals.rejectReason')}
                                        </h3>
                                        <p className="text-[10px] text-[#E8E0D5]/50 font-mono">
                                            {rejectTarget.id} · ${rejectTarget.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setRejectTarget(null)}
                                    className="p-1.5 rounded-lg text-[#E8E0D5]/40 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
                                    aria-label={t('withdraw.cancel')}
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            <textarea
                                value={rejectReason}
                                onChange={(e) => {
                                    setRejectReason(e.target.value);
                                    if (rejectError) setRejectError(null);
                                }}
                                rows={3}
                                placeholder={t('admin.withdrawals.rejectReasonPlaceholder')}
                                className="w-full bg-black/40 border border-white/10 text-xs text-white rounded-xl p-3 outline-none focus:border-red-400 transition placeholder:text-slate-600 resize-none"
                            />
                            {rejectError && (
                                <p role="alert" className="text-[10px] font-mono text-red-400 bg-red-950/30 border border-red-500/20 rounded-lg px-3 py-2 mt-2">
                                    {rejectError}
                                </p>
                            )}

                            <div className="flex gap-2 mt-4">
                                <button
                                    onClick={() => setRejectTarget(null)}
                                    className="flex-1 py-2.5 rounded-xl text-[10px] font-mono uppercase tracking-wider text-[#E8E0D5]/60 border border-white/10 hover:text-white hover:border-white/25 transition-all cursor-pointer"
                                >
                                    {t('withdraw.cancel')}
                                </button>
                                <button
                                    onClick={() => {
                                        const reason = rejectReason.trim();
                                        if (!reason) {
                                            setRejectError(t('admin.withdrawals.rejectReasonRequired'));
                                            return;
                                        }
                                        reject(rejectTarget.kind, rejectTarget.id, reason);
                                        setRejectTarget(null);
                                        setRejectReason('');
                                    }}
                                    className="flex-1 py-2.5 rounded-xl bg-red-500/15 text-red-400 border border-red-500/30 text-[10px] font-mono font-bold uppercase tracking-wider hover:bg-red-500/25 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                                >
                                    <XCircle size={13} />
                                    {t('admin.withdrawals.rejectConfirm')}
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </ErrorBoundary>
    );
}
