'use client';

import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, XCircle, X } from 'lucide-react';

/**
 * SADAF | Admin — Action Confirmation Toast
 *
 * Quick visual feedback for admin actions on the Community Overview page
 * (Accept / Decline a pending request), mirroring the My Activity alert
 * style used across the app. Green (CheckCircle) for Accept, red (XCircle)
 * for Decline and failures. Rendered through a portal to document.body so
 * the fixed position is never trapped by a backdrop-blur containing block.
 * Auto-dismisses after ~3.5s; the caller owns the timer.
 */

export interface AdminActionToastData {
    /** Unique id — a fresh toast remounts even for identical content. */
    id: number;
    kind: 'success' | 'decline' | 'error';
    title: string;
    message: string;
}

interface AdminActionToastProps {
    toast: AdminActionToastData | null;
    onDismiss: () => void;
}

export default function AdminActionToast({ toast, onDismiss }: AdminActionToastProps) {
    // Decline is a deliberate removal, so it shares the red tone with errors
    // (the title/message still distinguish "declined" from "failed").
    const isSuccess = toast?.kind === 'success';
    const Icon = isSuccess ? CheckCircle2 : XCircle;

    return createPortal(
        <AnimatePresence>
            {toast && (
                <motion.div
                    key={toast.id}
                    initial={{ opacity: 0, y: -12, x: 24 }}
                    animate={{ opacity: 1, y: 0, x: 0 }}
                    exit={{ opacity: 0, y: -12, x: 24 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    role="status"
                    className={`fixed top-24 right-4 md:right-8 z-[60] max-w-sm flex items-start gap-3 px-4 py-3 rounded-xl bg-[#0A0F2C]/98 border shadow-2xl shadow-black/60 backdrop-blur-xl ${
                        isSuccess ? 'border-emerald-500/30' : 'border-red-500/30'
                    }`}
                >
                    <span
                        className={`p-2 rounded-lg shrink-0 ${
                            isSuccess
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : 'bg-red-500/10 text-red-400'
                        }`}
                    >
                        <Icon size={14} />
                    </span>

                    <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-semibold text-white">{toast.title}</p>
                        <p className="text-[10px] text-[#E8E0D5]/60 mt-0.5">{toast.message}</p>
                    </div>

                    <button
                        onClick={onDismiss}
                        className="p-0.5 rounded text-[#E8E0D5]/40 hover:text-white transition-colors cursor-pointer shrink-0"
                        aria-label="Dismiss"
                    >
                        <X size={12} />
                    </button>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body,
    );
}
