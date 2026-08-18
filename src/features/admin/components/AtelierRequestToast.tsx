'use client';

import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Layers, X } from 'lucide-react';
import { SmartClamp } from '@/shared/ui/SmartClamp';
import { useLanguage } from '@/features/i18n/LanguageProvider';
import type { DesignSubmission } from '@/features/designer/types';

/**
 * SADAF | Admin — New Atelier Design Toast
 *
 * Slides in from the top-right when a designer submits a new piece to the
 * atelier queue over the WebSocket (designer:global). Mirrors the friend
 * request / overtake toast style: shows the design title + category + price
 * with a quick "Review" action that scrolls the atelier tab to the queue.
 * Auto-dismisses after 8s.
 */

interface AtelierRequestToastProps {
    /** The incoming design to display (null hides the toast). */
    design: DesignSubmission | null;
    /** Quick Review — dismisses and focuses the atelier queue. */
    onReview: () => void;
    /** Dismiss the toast without acting. */
    onDismiss: () => void;
}

export default function AtelierRequestToast({
    design,
    onReview,
    onDismiss,
}: AtelierRequestToastProps) {
    const { t } = useLanguage();

    // Rendered through a portal to document.body — the same reason as the
    // friend request toast: fixed positioning inside a blurred ancestor
    // would be misplaced/clipped.
    return createPortal(
        <AnimatePresence>
            {design && (
                <motion.div
                    initial={{ opacity: 0, y: -12, x: 24 }}
                    animate={{ opacity: 1, y: 0, x: 0 }}
                    exit={{ opacity: 0, y: -12, x: 24 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    role="status"
                    className="fixed top-24 right-4 md:right-8 z-[60] max-w-sm flex items-start gap-3 px-4 py-3 rounded-xl bg-[#0A0F2C]/98 border border-[#C9A84C]/40 shadow-2xl shadow-black/60 backdrop-blur-xl"
                >
                    <span className="p-2 rounded-lg bg-[#C9A84C]/10 text-[#C9A84C] shrink-0">
                        <Layers size={14} />
                    </span>

                    <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-semibold text-white">
                            {t('atelierAdmin.toast.newDesign')}
                        </p>
                        <p className="text-[10px] text-[#E8E0D5]/60 mt-0.5">
                            <SmartClamp
                                as="span"
                                maxLines={2}
                                className="font-medium text-[#C9A84C]"
                                text={design.title}
                            />
                        </p>
                        <p className="text-[9px] font-mono uppercase tracking-wider text-[#E8E0D5]/35 mt-0.5">
                            {design.category} · ${design.price.toLocaleString()}
                        </p>

                        <div className="flex items-center gap-1.5 mt-2">
                            <button
                                onClick={onReview}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#C9A84C]/15 border border-[#C9A84C]/40 text-[#C9A84C] text-[9px] font-mono uppercase tracking-wider hover:bg-[#C9A84C]/25 transition-all cursor-pointer"
                            >
                                <Layers size={10} /> {t('atelierAdmin.toast.review')}
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={onDismiss}
                        className="p-0.5 rounded text-[#E8E0D5]/40 hover:text-white transition-colors cursor-pointer shrink-0"
                        aria-label={t('common.close')}
                    >
                        <X size={12} />
                    </button>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body,
    );
}
