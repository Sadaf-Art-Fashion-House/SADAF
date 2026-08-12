'use client';

import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { UserPlus, Check, X } from 'lucide-react';
import { useLanguage } from '@/features/i18n/LanguageProvider';
import type { ConnectionRequest } from '../types';

/**
 * SADAF | Community — Incoming Friend Request Toast
 *
 * Slides in from the top-right when a new connection request arrives over
 * the WebSocket (notifications:user:{id}). Mirrors the Leaderboard overtake
 * toast style. Shows the sender name + relationship type and offers quick
 * Accept / Decline actions that resolve the request straight from storage —
 * no navigation needed. Auto-dismisses after 8s.
 */

interface FriendRequestToastProps {
    /** The incoming request to display (null hides the toast). */
    request: ConnectionRequest | null;
    /** Quick Accept — resolves the request and adds the connection. */
    onAccept: (request: ConnectionRequest) => void;
    /** Quick Decline — removes the request from the pending list. */
    onDecline: (requestId: string) => void;
    /** Dismiss the toast without acting on the request. */
    onDismiss: () => void;
}

export default function FriendRequestToast({
    request,
    onAccept,
    onDecline,
    onDismiss,
}: FriendRequestToastProps) {
    const { t, language } = useLanguage();

    // Rendered through a portal to document.body: the badge lives inside the
    // sticky glass header (backdrop-blur), which would otherwise become the
    // containing block for this fixed toast and misplace/clip it.
    return createPortal(
        <AnimatePresence>
            {request && (
                <motion.div
                    initial={{ opacity: 0, y: -12, x: 24 }}
                    animate={{ opacity: 1, y: 0, x: 0 }}
                    exit={{ opacity: 0, y: -12, x: 24 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    role="status"
                    className="fixed top-24 right-4 md:right-8 z-[60] max-w-sm flex items-start gap-3 px-4 py-3 rounded-xl bg-[#0A0F2C]/98 border border-[#4FC3F7]/30 shadow-2xl shadow-black/60 backdrop-blur-xl"
                >
                    <span className="p-2 rounded-lg bg-[#4FC3F7]/10 text-[#4FC3F7] shrink-0">
                        <UserPlus size={14} />
                    </span>

                    <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-semibold text-white">
                            {t('friendRequest.new')}
                        </p>
                        <p className="text-[10px] text-[#E8E0D5]/60 mt-0.5">
                            <span className="font-medium text-[#4FC3F7]">{request.name}</span>{' '}
                            {t('friendRequest.wantsToJoin')}
                            <span className="ml-1 text-[8px] font-mono uppercase tracking-wider text-[#E8E0D5]/35">
                                {request.type === 'family'
                                    ? `· ${t('community.family')}`
                                    : `· ${t('community.friend')}`}
                            </span>
                        </p>
                        {/* The raw WS message is English-only; in Arabic it would
                            duplicate the translated line above (name + wantsToJoin
                            + relationship), so it is shown for English only. */}
                        {language === 'en' && request.message && (
                            <p className="text-[9px] text-[#E8E0D5]/45 mt-0.5 italic line-clamp-1">
                                “{request.message}”
                            </p>
                        )}

                        <div className="flex items-center gap-1.5 mt-2">
                            <button
                                onClick={() => onAccept(request)}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[9px] font-mono uppercase tracking-wider hover:bg-emerald-500/20 transition-all cursor-pointer"
                            >
                                <Check size={10} /> {t('community.accept')}
                            </button>
                            <button
                                onClick={() => onDecline(request.id)}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-[9px] font-mono uppercase tracking-wider hover:bg-red-500/20 transition-all cursor-pointer"
                            >
                                <X size={10} /> {t('community.decline')}
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
