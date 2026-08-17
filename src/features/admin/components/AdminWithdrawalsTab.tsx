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
 *   requested → (admin approve) → approved → (processing window) → completed
 *   requested → (admin reject)  → rejected
 */

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    Wallet,
    CheckCircle2,
    XCircle,
    Clock,
} from 'lucide-react';
import { useLanguage } from '@/features/i18n/LanguageProvider';
import type { TranslationKey } from '@/features/i18n/dictionaries';
import { useAdminWithdrawals } from '@/features/commissions/hooks/useAdminWithdrawals';
import type { AdminWithdrawalEntry } from '@/features/commissions/hooks/useAdminWithdrawals';
import type { WithdrawalStatus } from '@/features/commissions/types';
import { ErrorBoundary } from '@/shared/ui/ErrorBoundary';

const STATUS_STYLES: Record<WithdrawalStatus, { chip: string; icon: typeof Clock }> = {
    requested: { chip: 'text-amber-400 border-amber-500/30 bg-amber-500/10', icon: Clock },
    approved: { chip: 'text-[#4FC3F7] border-[#4FC3F7]/30 bg-[#4FC3F7]/10', icon: CheckCircle2 },
    rejected: { chip: 'text-red-400 border-red-500/30 bg-red-500/10', icon: XCircle },
    completed: { chip: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10', icon: CheckCircle2 },
};

const STATUS_KEYS: Record<WithdrawalStatus, TranslationKey> = {
    requested: 'admin.withdrawals.status.requested',
    approved: 'admin.withdrawals.status.approved',
    rejected: 'admin.withdrawals.status.rejected',
    completed: 'admin.withdrawals.status.completed',
};

const KIND_KEYS: Record<AdminWithdrawalEntry['kind'], TranslationKey> = {
    designer: 'admin.withdrawals.kind.designer',
    'sales-partner': 'admin.withdrawals.kind.salesPartner',
};

export default function AdminWithdrawalsTab() {
    const { t } = useLanguage();
    const { entries, loading, approve, reject } = useAdminWithdrawals();

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
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 shrink-0">
                                                <span className={`px-2.5 py-1 rounded-full text-[9px] font-mono uppercase tracking-wider border font-bold ${style.chip}`}>
                                                    {t(STATUS_KEYS[request.status])}
                                                </span>
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
                                                            onClick={() => reject(kind, request.id)}
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
        </ErrorBoundary>
    );
}
