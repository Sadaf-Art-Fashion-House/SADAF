'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, BellRing, BellOff, CheckCheck, ChevronRight, Globe, Wifi, WifiOff } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useLanguage } from '@/features/i18n/LanguageProvider';
import { useRealtimeNotifications } from '../hooks/useRealtimeNotifications';
import { TYPE_ICONS, TYPE_COLORS } from '../constants/notificationStyles';
import { formatRelativeTime } from '../utils/formatRelativeTime';
import type { Notification } from '../types';

/**
 * Header notification bell — real-time via WebSocket.
 *
 * Shows the unread count as a badge, a LIVE indicator when the WebSocket
 * feed is connected, and a dropdown with the latest notifications.
 * Clicking a notification marks it read; "Mark All Read" clears the badge.
 *
 * Requires an authenticated user (userId) — guests see the bell without
 * a connection.
 */
export default function NotificationBell() {
    const { user } = useAuth();
    const { language, t } = useLanguage();
    const userId = user?.id ?? null;

    const {
        allNotifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        wsLive,
        globalMuted,
        toggleGlobalMuted,
    } = useRealtimeNotifications(userId);

    const [isOpen, setIsOpen] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);

    // Close dropdown on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div ref={panelRef} className="relative">
            {/* Bell button with badge */}
            <button
                onClick={() => setIsOpen((prev) => !prev)}
                className="p-2 text-slate-300 hover:text-[#C9A84C] relative transition-colors duration-300 cursor-pointer"
                title={unreadCount > 0 ? t('notifications.bell.unread', { count: unreadCount }) : t('notifications.title')}
                aria-label={`${t('notifications.title')}${unreadCount > 0 ? ` (${unreadCount})` : ''}`}
                aria-expanded={isOpen}
            >
                <Bell size={16} />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-red-400 text-white font-mono text-[8px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center border border-[#0A0F2C] animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.96 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        className="absolute top-full end-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-[#0A0F2C]/98 border border-[#C9A84C]/15 rounded-xl shadow-2xl shadow-black/60 backdrop-blur-xl overflow-hidden z-50"
                    >
                        {/* Panel header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold uppercase tracking-wider text-white">
                                    {t('notifications.title')}
                                </span>
                                {/* Live indicator — only meaningful for signed-in users */}
                                {userId ? (
                                    wsLive ? (
                                        <span className="flex items-center gap-1 text-[8px] font-mono uppercase tracking-wider text-green-400">
                                            <Wifi size={9} />
                                            {t('notifications.live')}
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1 text-[8px] font-mono uppercase tracking-wider text-amber-400/80">
                                            <WifiOff size={9} />
                                            {t('notifications.polling')}
                                        </span>
                                    )
                                ) : (
                                    <span className="text-[8px] font-mono uppercase tracking-wider text-slate-500">
                                        {t('notifications.signInAlerts')}
                                    </span>
                                )}
                            </div>
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="flex items-center gap-1 text-[9px] text-[#4FC3F7]/70 hover:text-[#4FC3F7] transition-colors font-mono uppercase tracking-wider cursor-pointer"
                                >
                                    <CheckCheck size={10} />
                                    {t('notifications.markAllRead')}
                                </button>
                            )}
                        </div>

                        {/* Global alerts toggle — mutes global pushes (new
                            orders, announcements) while leaving user-scoped
                            alerts untouched. Persisted in localStorage. */}
                        <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5">
                            <span className="flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-wider text-[#E8E0D5]/50">
                                <Globe size={10} className="text-[#C9A84C]/60" />
                                {t('notifications.globalAlerts')}
                            </span>
                            <button
                                onClick={toggleGlobalMuted}
                                aria-pressed={!globalMuted}
                                aria-label={globalMuted ? t('notifications.enableGlobal') : t('notifications.muteGlobal')}
                                title={globalMuted
                                    ? t('notifications.globalMutedHint')
                                    : t('notifications.globalOnHint')}
                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[8px] font-mono uppercase tracking-wider border transition-all cursor-pointer ${
                                    globalMuted
                                        ? 'text-[#E8E0D5]/40 border-white/10 hover:text-white hover:border-white/25'
                                        : 'text-[#4FC3F7] border-[#4FC3F7]/30 bg-[#4FC3F7]/10 hover:border-[#4FC3F7]/60'
                                }`}
                            >
                                {globalMuted ? <BellOff size={9} /> : <BellRing size={9} />}
                                {globalMuted ? t('notifications.muted') : t('notifications.on')}
                            </button>
                        </div>

                        {/* Notification list */}
                        <div className="max-h-80 overflow-y-auto">
                            {allNotifications.length === 0 ? (
                                <div className="px-4 py-8 text-center">
                                    <Bell size={18} className="mx-auto text-slate-600 mb-2" />
                                    <p className="text-[11px] text-slate-500">
                                        {userId
                                            ? t('notifications.empty')
                                            : t('notifications.emptyGuest')}
                                    </p>
                                </div>
                            ) : (
                                <ul className="flex flex-col">
                                    {allNotifications.slice(0, 6).map((notification) => (
                                        <BellItem
                                            key={notification.id}
                                            notification={notification}
                                            onMarkRead={markAsRead}
                                        />
                                    ))}
                                </ul>
                            )}
                        </div>

                        {/* Panel footer */}
                        <Link
                            href="/dashboard/notifications"
                            onClick={() => setIsOpen(false)}
                            className="flex items-center justify-center gap-1.5 px-4 py-3 border-t border-white/5 text-[10px] font-mono uppercase tracking-wider text-[#C9A84C]/80 hover:text-[#C9A84C] hover:bg-white/5 transition-all"
                        >
                            {t('notifications.viewAll')} <ChevronRight size={10} />
                        </Link>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ─── Single notification row ────────────────────────────────────────────────

function BellItem({
    notification,
    onMarkRead,
}: {
    notification: Notification;
    onMarkRead: (id: string) => void;
}) {
    const { language } = useLanguage();
    const IconComponent = TYPE_ICONS[notification.type] || Bell;
    const colorClass = TYPE_COLORS[notification.type] || TYPE_COLORS.system;

    // Localized copy — Arabic template when available, embedded names/IDs stay
    // in their original language (Facebook-style).
    const title = language === 'ar' && notification.titleAr ? notification.titleAr : notification.title;
    const message = language === 'ar' && notification.messageAr ? notification.messageAr : notification.message;

    // Rendered as a div (not a button) so it can safely wrap inside a Link —
    // a <button> nested in an <a> is invalid HTML and breaks hydration.
    const content = (
        <div
            onClick={() => !notification.read && onMarkRead(notification.id)}
            className={`w-full text-left flex items-start gap-3 px-4 py-3 transition-all duration-200 group cursor-pointer ${
                notification.read ? 'bg-transparent opacity-60' : 'bg-white/[0.02] hover:bg-white/[0.06]'
            }`}
        >
            <div className={`p-2 rounded-lg shrink-0 ${colorClass}`}>
                <IconComponent size={12} />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                    <h5 className={`text-[11px] font-semibold ${notification.read ? 'text-slate-500' : 'text-white'}`}>
                        {title}
                    </h5>
                    <span className="text-[8px] text-slate-600 font-mono shrink-0 whitespace-nowrap">
                        {formatRelativeTime(notification.createdAt, language)}
                    </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed line-clamp-2">
                    {message}
                </p>
            </div>
            {!notification.read && (
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#C9A84C] shrink-0 animate-pulse" />
            )}
        </div>
    );

    if (notification.href) {
        return (
            <li className="border-b border-white/5 last:border-0">
                <Link href={notification.href} className="block">
                    {content}
                </Link>
            </li>
        );
    }

    return <li className="border-b border-white/5 last:border-0">{content}</li>;
}
