'use client';

/**
 * SADAF | Commissions — Withdraw Panel
 *
 * Lets designers and sales partners request a payout of their earned
 * (pending) commission balance: an available-balance card, a withdrawal
 * modal (amount + payout method with validation), and the request history
 * with its approval → paid lifecycle. Sandbox-only — requests live
 * in localStorage via useWithdrawals until the finance ledger is wired.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    AlertTriangle,
    Wallet,
    Landmark,
    CreditCard,
    Clock,
    CheckCircle2,
    X,
    ArrowUpRight,
    PartyPopper,
    ShieldCheck,
    ShieldAlert,
} from 'lucide-react';
import { useLanguage } from '@/features/i18n/LanguageProvider';
import type { TranslationKey } from '@/features/i18n/dictionaries';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useWithdrawals } from '../hooks/useWithdrawals';
import type { CommissionKind, WithdrawalMethod } from '../types';
import { WITHDRAWAL_AUTO_LIMIT } from '../types';
import type { KycLevel } from '@/shared/types';

interface WithdrawPanelProps {
    /** Pending commission total — the source of the withdrawable balance. */
    totalPending: number;
    kind: CommissionKind;
}

const METHOD_OPTIONS: { id: WithdrawalMethod; icon: typeof Landmark }[] = [
    { id: 'bank', icon: Landmark },
    { id: 'paypal', icon: CreditCard },
];

/** Badge styles + labels per KYC level (used on the panel and request rows). */
const KYC_STYLES: Record<KycLevel, { chip: string; labelKey: TranslationKey; icon: typeof ShieldCheck }> = {
    none: { chip: 'text-slate-400 border-white/10 bg-white/5', labelKey: 'withdraw.kyc.level.none', icon: ShieldAlert },
    basic: { chip: 'text-amber-400 border-amber-500/30 bg-amber-500/10', labelKey: 'withdraw.kyc.level.basic', icon: ShieldCheck },
    full: { chip: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10', labelKey: 'withdraw.kyc.level.full', icon: ShieldCheck },
};

export default function WithdrawPanel({ totalPending, kind }: WithdrawPanelProps) {
    const { t } = useLanguage();
    const { user, updateProfile } = useAuth();
    const {
        withdrawals,
        paymentNotice,
        dismissPaymentNotice,
        requestWithdrawal,
        availableBalance,
    } = useWithdrawals(kind);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [amountInput, setAmountInput] = useState('');
    const [method, setMethod] = useState<WithdrawalMethod>('bank');
    const [formError, setFormError] = useState<string | null>(null);
    const [isKycModalOpen, setIsKycModalOpen] = useState(false);
    const [kycLegalName, setKycLegalName] = useState('');
    const [kycCountry, setKycCountry] = useState('');
    const [kycSuccess, setKycSuccess] = useState(false);

    const available = availableBalance(totalPending);
    const requestedCount = withdrawals.filter((w) => w.status === 'requested').length;
    const kycLevel: KycLevel = user?.kycLevel ?? 'none';
    const kycStyle = KYC_STYLES[kycLevel];
    const KycIcon = kycStyle.icon;
    const parsedAmountInput = parseFloat(amountInput);

    /** Live payout-path hint for the amount being typed in the modal. */
    const pathHint =
        Number.isFinite(parsedAmountInput) && parsedAmountInput > 0
            ? kycLevel === 'full' && parsedAmountInput <= WITHDRAWAL_AUTO_LIMIT
                ? { tone: 'auto' as const, text: t('withdraw.pathAuto') }
                : parsedAmountInput > WITHDRAWAL_AUTO_LIMIT
                  ? { tone: 'manual' as const, text: t('withdraw.pathAboveLimit', { limit: `${WITHDRAWAL_AUTO_LIMIT}` }) }
                  : { tone: 'manual' as const, text: t('withdraw.pathKycRequired') }
            : null;

    const openModal = () => {
        setAmountInput(String(available > 0 ? available : ''));
        setMethod('bank');
        setFormError(null);
        setIsModalOpen(true);
    };

    const handleSubmit = () => {
        const parsed = parseFloat(amountInput);
        const result = requestWithdrawal(parsed, method, totalPending, kycLevel);
        if (!result.ok) {
            setFormError(
                result.code === 'exceeds'
                    ? t('withdraw.error.exceeds', { amount: `$${available.toLocaleString(undefined, { maximumFractionDigits: 2 })}` })
                    : t('withdraw.error.invalid'),
            );
            return;
        }
        setIsModalOpen(false);
        setAmountInput('');
        setFormError(null);
    };

    return (
        <>
            {/* Available balance + Withdraw CTA */}
            <section className="rounded-2xl bg-gradient-to-br from-[#0A0F2C] to-[#1A1228] border border-[#C9A84C]/20 p-6 md:p-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-[#C9A84C]/10 text-[#C9A84C]">
                            <Wallet size={22} />
                        </div>
                        <div>
                            <span className="text-[9px] font-mono uppercase tracking-[0.25em] text-[#E8E0D5]/40 block mb-1">
                                {t('withdraw.available')}
                            </span>
                            <p className="text-3xl md:text-4xl font-serif text-white font-bold tracking-tight">
                                ${available.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                            </p>
                            <p className="text-[10px] font-mono text-[#E8E0D5]/40 mt-1">
                                {requestedCount > 0
                                    ? t('withdraw.pendingReviewCount', { count: requestedCount, requestPlural: requestedCount === 1 ? '' : 's' })
                                    : t('withdraw.balanceHint')}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={openModal}
                        disabled={available <= 0}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#C9A84C] to-[#E8E0D5]/80 text-[#0A0F2C] text-[10px] font-mono font-bold uppercase tracking-widest transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed cursor-pointer"
                    >
                        <ArrowUpRight size={13} />
                        {t('withdraw.withdraw')}
                    </button>
                </div>

                {/* Requests list */}
                {withdrawals.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-white/[0.06]">
                        <h3 className="text-[9px] font-mono uppercase tracking-[0.25em] text-[#C9A84C] mb-3">
                            {t('withdraw.requests')} ({withdrawals.length})
                        </h3>
                        <div className="flex flex-col gap-2">
                            {withdrawals.map((request) => {
                                const isPending = request.status === 'requested';
                                const isRejected = request.status === 'rejected';
                                const isApproved = request.status === 'approved';
                                return (
                                    <div
                                        key={request.id}
                                        className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#0A0F2C]/60 border border-white/[0.05]"
                                    >
                                        <span className={`p-2 rounded-lg shrink-0 ${isRejected ? 'bg-red-500/10 text-red-400' : isPending ? 'bg-amber-500/10 text-amber-400' : isApproved ? 'bg-[#4FC3F7]/10 text-[#4FC3F7]' : 'bg-emerald-500/10 text-emerald-400'}`}>
                                            {isRejected ? <X size={13} /> : isPending ? <Clock size={13} /> : isApproved ? <CheckCircle2 size={13} /> : <CheckCircle2 size={13} />}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs text-white font-medium">
                                                {request.id} · {request.method === 'bank' ? t('withdraw.method.bank') : t('withdraw.method.paypal')}
                                            </p>
                                            <p className="text-[9px] font-mono text-[#E8E0D5]/40">
                                                {new Date(request.requestedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                {request.paidAt ? ` · ${t('withdraw.paidAt', { date: new Date(request.paidAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) })}` : ''}
                                            </p>
                                            {isRejected && request.rejectionReason && (
                                                <p className="text-[9px] text-red-400/90 mt-1 flex items-center gap-1">
                                                    <AlertTriangle size={9} className="shrink-0" />
                                                    <span>{t('withdraw.rejectionReason')}: {request.rejectionReason}</span>
                                                </p>
                                            )}
                                        </div>
                                        <span className={`px-2.5 py-1 rounded-full text-[8px] font-mono uppercase tracking-wider border ${isRejected ? 'text-red-400 border-red-500/30 bg-red-500/10' : isPending ? 'text-amber-400 border-amber-500/30 bg-amber-500/10' : isApproved ? 'text-[#4FC3F7] border-[#4FC3F7]/30 bg-[#4FC3F7]/10' : 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'}`}>
                                            {isRejected ? t('withdraw.rejected') : isPending ? t('withdraw.pendingApproval') : isApproved ? t('withdraw.approved') : t('withdraw.paid')}
                                        </span>
                                        <span className={`px-2.5 py-1 rounded-full text-[8px] font-mono uppercase tracking-wider border ${KYC_STYLES[request.kycStatus ?? 'none'].chip}`}>
                                            {t(KYC_STYLES[request.kycStatus ?? 'none'].labelKey)}
                                        </span>
                                        <span className="text-[12px] font-mono font-bold text-[#C9A84C]">
                                            ${request.amount.toLocaleString()}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </section>

            {/* KYC verification card */}
            <section className="rounded-2xl bg-[#0A0F2C]/60 border border-white/5 p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-2xl ${kycLevel === 'full' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-[#C9A84C]/10 text-[#C9A84C]'}`}>
                            <KycIcon size={20} />
                        </div>
                        <div>
                            <span className="text-[9px] font-mono uppercase tracking-[0.25em] text-[#E8E0D5]/40 block mb-1">
                                {t('withdraw.kyc.title')}
                            </span>
                            <div className="flex flex-wrap items-center gap-2">
                                <span className={`px-2.5 py-1 rounded-full text-[9px] font-mono uppercase tracking-wider border font-bold ${kycStyle.chip}`}>
                                    {t(kycStyle.labelKey)}
                                </span>
                                {kycLevel === 'full' && (
                                    <span className="text-[10px] font-mono text-emerald-400/80">
                                        ⚡ {t('withdraw.kyc.fastPath', { limit: `${WITHDRAWAL_AUTO_LIMIT}` })}
                                    </span>
                                )}
                            </div>
                            <p className="text-[10px] font-mono text-[#E8E0D5]/40 mt-1.5">
                                {kycLevel === 'full' ? t('withdraw.kyc.subtitle') : t('withdraw.kyc.hint')}
                            </p>
                            {kycSuccess && (
                                <p className="text-[10px] font-mono text-emerald-400 mt-1" role="status">
                                    {t('withdraw.kyc.success')}
                                </p>
                            )}
                        </div>
                    </div>

                    {kycLevel !== 'full' && (
                        <button
                            onClick={() => {
                                setKycSuccess(false);
                                setIsKycModalOpen(true);
                            }}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#C9A84C]/15 text-[#C9A84C] border border-[#C9A84C]/30 text-[10px] font-mono font-bold uppercase tracking-widest hover:bg-[#C9A84C]/25 transition-all cursor-pointer shrink-0"
                        >
                            <ShieldCheck size={13} />
                            {t('withdraw.kyc.verify')}
                        </button>
                    )}
                </div>
            </section>

            {/* Payment toast */}
            <AnimatePresence>
                {paymentNotice && (
                    <motion.div
                        initial={{ opacity: 0, y: -12, x: 24 }}
                        animate={{ opacity: 1, y: 0, x: 0 }}
                        exit={{ opacity: 0, y: -12, x: 24 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                        role="status"
                        className="fixed top-24 right-4 md:right-8 z-50 max-w-sm flex items-start gap-3 px-4 py-3 rounded-xl bg-[#1A1030]/95 border border-emerald-400/30 shadow-2xl shadow-black/60 backdrop-blur-xl"
                    >
                        <span className="p-2 rounded-lg bg-emerald-400/10 text-emerald-400 shrink-0">
                            <PartyPopper size={14} />
                        </span>
                        <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-semibold text-white">
                                {t('withdraw.paidToast', { amount: `${paymentNotice.amount.toLocaleString()}` })}
                            </p>
                            <p className="text-[10px] text-[#E8E0D5]/60 mt-0.5 font-mono">
                                {paymentNotice.id} · {paymentNotice.method === 'bank' ? t('withdraw.method.bank') : t('withdraw.method.paypal')}
                            </p>
                        </div>
                        <button
                            onClick={dismissPaymentNotice}
                            className="p-0.5 rounded text-[#E8E0D5]/40 hover:text-white transition-colors cursor-pointer shrink-0"
                            aria-label={t('withdraw.dismiss')}
                        >
                            <X size={12} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* KYC verification modal (sandbox — no real documents are uploaded) */}
            <AnimatePresence>
                {isKycModalOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                            onClick={() => setIsKycModalOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 260 }}
                            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md p-6 bg-[#0A0F2C]/98 border border-emerald-500/20 rounded-2xl shadow-xl backdrop-blur-xl"
                        >
                            <div className="flex items-center justify-between mb-5">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                                        <ShieldCheck size={16} />
                                    </div>
                                    <div>
                                        <h2 className="text-sm font-serif text-white font-semibold">{t('withdraw.kyc.form.title')}</h2>
                                        <p className="text-[10px] text-[#E8E0D5]/50">{t('withdraw.kyc.form.subtitle')}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsKycModalOpen(false)}
                                    className="p-1.5 rounded-lg text-[#E8E0D5]/40 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
                                    aria-label={t('withdraw.cancel')}
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[9px] font-mono uppercase tracking-widest text-[#E8E0D5]/50 mb-1.5">
                                        {t('withdraw.kyc.form.name')}
                                    </label>
                                    <input
                                        type="text"
                                        value={kycLegalName}
                                        onChange={(e) => setKycLegalName(e.target.value)}
                                        placeholder="e.g. Layla Mahmoud"
                                        className="w-full bg-black/40 border border-white/10 text-xs text-white rounded-xl p-3 outline-none focus:border-emerald-400 transition placeholder:text-slate-600"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[9px] font-mono uppercase tracking-widest text-[#E8E0D5]/50 mb-1.5">
                                        {t('withdraw.kyc.form.country')}
                                    </label>
                                    <input
                                        type="text"
                                        value={kycCountry}
                                        onChange={(e) => setKycCountry(e.target.value)}
                                        placeholder="e.g. Egypt"
                                        className="w-full bg-black/40 border border-white/10 text-xs text-white rounded-xl p-3 outline-none focus:border-emerald-400 transition placeholder:text-slate-600"
                                    />
                                </div>

                                <button
                                    type="button"
                                    onClick={() => {
                                        updateProfile({ kycLevel: 'full' });
                                        setIsKycModalOpen(false);
                                        setKycSuccess(true);
                                    }}
                                    disabled={!kycLegalName.trim() || !kycCountry.trim()}
                                    className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-400 text-[#0A0F2C] text-[10px] font-mono font-bold uppercase tracking-wider rounded-xl transition-all duration-300 hover:scale-[1.02] active:scale-95 disabled:opacity-40 disabled:hover:scale-100 flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    <ShieldCheck size={13} />
                                    {t('withdraw.kyc.form.submit')}
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Withdrawal modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                            onClick={() => setIsModalOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 260 }}
                            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md p-6 bg-[#0A0F2C]/98 border border-[#C9A84C]/20 rounded-2xl shadow-xl shadow-[#C9A84C]/10 backdrop-blur-xl"
                        >
                            <div className="flex items-center justify-between mb-5">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 rounded-lg bg-[#C9A84C]/10 text-[#C9A84C]">
                                        <Wallet size={16} />
                                    </div>
                                    <div>
                                        <h2 className="text-sm font-serif text-white font-semibold">{t('withdraw.title')}</h2>
                                        <p className="text-[10px] text-[#E8E0D5]/50">{t('withdraw.subtitle')}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="p-1.5 rounded-lg text-[#E8E0D5]/40 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
                                    aria-label={t('withdraw.cancel')}
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[9px] font-mono uppercase tracking-widest text-[#E8E0D5]/50 mb-1.5">
                                        {t('withdraw.amount')}
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-mono text-[#C9A84C]">$</span>
                                        <input
                                            type="number"
                                            min="1"
                                            step="0.01"
                                            value={amountInput}
                                            onChange={(e) => setAmountInput(e.target.value)}
                                            placeholder="0.00"
                                            className="flex-1 bg-black/40 border border-white/10 text-xs text-white rounded-xl p-3 outline-none focus:border-[#C9A84C] transition placeholder:text-slate-600"
                                        />
                                    </div>
                                    <p className="text-[9px] font-mono text-[#E8E0D5]/40 mt-1">
                                        {t('withdraw.availableLabel', { amount: `${available.toLocaleString(undefined, { maximumFractionDigits: 2 })}` })}
                                    </p>
                                    {pathHint && (
                                        <p
                                            role="status"
                                            className={`text-[9px] font-mono mt-1.5 px-2.5 py-1.5 rounded-lg border ${
                                                pathHint.tone === 'auto'
                                                    ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
                                                    : 'text-amber-400 border-amber-500/30 bg-amber-500/10'
                                            }`}
                                        >
                                            {pathHint.text}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-[9px] font-mono uppercase tracking-widest text-[#E8E0D5]/50 mb-1.5">
                                        {t('withdraw.method')}
                                    </label>
                                    <div className="flex gap-2">
                                        {METHOD_OPTIONS.map((option) => {
                                            const Icon = option.icon;
                                            return (
                                                <button
                                                    key={option.id}
                                                    type="button"
                                                    onClick={() => setMethod(option.id)}
                                                    className={`flex-1 py-2.5 rounded-xl text-[10px] font-mono uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                                                        method === option.id
                                                            ? 'bg-[#C9A84C]/20 text-[#C9A84C] border border-[#C9A84C]/30'
                                                            : 'bg-black/20 text-[#E8E0D5]/40 border border-white/5 hover:border-white/20'
                                                    }`}
                                                >
                                                    <Icon size={13} />
                                                    {option.id === 'bank' ? t('withdraw.method.bank') : t('withdraw.method.paypal')}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {formError && (
                                    <p role="alert" className="text-[10px] font-mono text-red-400 bg-red-950/30 border border-red-500/20 rounded-lg px-3 py-2">
                                        {formError}
                                    </p>
                                )}

                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    disabled={!amountInput || parseFloat(amountInput) <= 0}
                                    className="w-full py-3 bg-gradient-to-r from-[#C9A84C] to-[#E8E0D5]/80 text-[#0A0F2C] text-[10px] font-mono font-bold uppercase tracking-wider rounded-xl transition-all duration-300 hover:scale-[1.02] active:scale-95 disabled:opacity-40 disabled:hover:scale-100 flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    <ArrowUpRight size={13} />
                                    {t('withdraw.confirm')}
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
