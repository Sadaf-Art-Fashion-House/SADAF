'use client';

/**
 * SADAF | Shared — SuccessToast
 *
 * The single confirmation toast used across the app (My Activity pattern):
 * fixed corner, slides in/out with AnimatePresence, tone icon, optional rich
 * message content, manual dismiss (X). Consumers own the auto-dismiss timer.
 *
 * Unifies what used to be three separate toasts:
 *   - auth sign-out / login (green, top-right)
 *   - referral converted (green, top-right, rich message)
 *   - admin accept/decline (green or red, top-right, portaled)
 *   - cart cleared (green, bottom-right)
 *
 * `portal` renders through a portal to document.body — needed when the toast
 * sits inside a sticky glass header/ancestor whose backdrop-blur would
 * otherwise become the containing block and misplace/clip the fixed toast.
 */

import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, XCircle, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { useLanguage } from '@/features/i18n/LanguageProvider';

interface SuccessToastProps {
    /** Whether the toast is currently shown. */
    visible: boolean;
    /** Bold title line (e.g. "Signed out", "Referral converted!"). */
    title: string;
    /** Optional body — a plain string or rich content (e.g. referral details). */
    message?: ReactNode;
    /** Manual dismiss (the X). */
    onDismiss: () => void;
    /** Green success (default) or red error/decline accent. */
    tone?: 'success' | 'error';
    /** Render through a portal to document.body (sticky glass ancestors). */
    portal?: boolean;
    /** Corner to anchor the toast to. */
    position?: 'top-right' | 'bottom-right';
    /**
     * Changes the animation key so consecutive toasts re-animate even when
     * `visible` never flips to false (e.g. a new referral while one is open).
     */
    animationKey?: string | number;
}

export default function SuccessToast({
    visible,
    title,
    message,
    onDismiss,
    tone = 'success',
    portal = false,
    position = 'top-right',
    animationKey = 'success-toast',
}: SuccessToastProps) {
    const { t } = useLanguage();
    const isSuccess = tone === 'success';
    const Icon = isSuccess ? CheckCircle2 : XCircle;
    const cornerClass =
        position === 'bottom-right' ? 'fixed bottom-6 right-6' : 'fixed top-24 right-4 md:right-8';

    const toast = (
        <AnimatePresence>
            {visible && (
                <motion.div
                    key={animationKey}
                    initial={{ opacity: 0, y: -12, x: 24 }}
                    animate={{ opacity: 1, y: 0, x: 0 }}
                    exit={{ opacity: 0, y: -12, x: 24 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    role="status"
                    className={`${cornerClass} z-[60] max-w-sm flex items-start gap-3 px-4 py-3 rounded-xl bg-[#0A0F2C]/98 border shadow-2xl shadow-black/60 backdrop-blur-xl ${
                        isSuccess ? 'border-emerald-500/30' : 'border-red-500/30'
                    }`}
                >
                    <span
                        className={`p-2 rounded-lg shrink-0 ${
                            isSuccess ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                        }`}
                    >
                        <Icon size={14} />
                    </span>
                    <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-semibold text-white">{title}</p>
                        {message && (
                            <div className="mt-0.5 text-[10px] text-[#E8E0D5]/60">{message}</div>
                        )}
                    </div>
                    <button
                        onClick={onDismiss}
                        className="p-0.5 rounded text-[#E8E0D5]/40 hover:text-white transition-colors cursor-pointer shrink-0"
                        aria-label={t('common.dismiss')}
                    >
                        <X size={12} />
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    );

    return portal ? createPortal(toast, document.body) : toast;
}
