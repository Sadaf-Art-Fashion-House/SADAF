'use client';

import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import {
    Bell,
    BellRing,
    BellOff,
    CheckCheck,
    ChevronRight,
    Globe,
} from 'lucide-react';
import { DirectionalIcon } from '@/shared/ui/DirectionalIcon';
import type { Notification } from '../types';
import {
    TYPE_ICONS,
    TYPE_COLORS,
    TYPE_LABELS,
    NOTIFICATION_TYPES,
} from '../constants/notificationStyles';
import { formatRelativeTime } from '../utils/formatRelativeTime';
import { useLanguage } from '@/features/i18n/LanguageProvider';

// ─── Types ───────────────────────────────────────────────────────────────────

interface NotificationsViewProps {
    notifications: Notification[];
    unreadCount: number;
    onMarkAsRead: (id: string) => void;
    onMarkAllAsRead: () => void;
    filterType: string;
    onFilterChange: (type: string) => void;
    /** Whether global event pushes (new orders / announcements) are muted. */
    globalMuted?: boolean;
    /** Toggles the persisted global alerts mute (same toggle as the header bell). */
    onToggleGlobalMuted?: () => void;
}

// ─── Constants ───────────────────────────────────────────────────────────────
// TYPE_ICONS / TYPE_COLORS / TYPE_LABELS / NOTIFICATION_TYPES live in
// ../constants/notificationStyles — reused by the header NotificationBell.

// ─── Component ───────────────────────────────────────────────────────────────

export default function NotificationsView({
    notifications,
    unreadCount,
    onMarkAsRead,
    onMarkAllAsRead,
    filterType,
    onFilterChange,
    globalMuted = false,
    onToggleGlobalMuted,
}: NotificationsViewProps) {
    const { t, tc } = useLanguage();
    return (
        <div className="relative w-full min-h-screen pb-20">
            {/* Notifications Page Header */}
            <section className="relative py-12 px-4 md:px-8 border-b border-[#C9A84C]/10 bg-gradient-to-b from-[#0A0F2C] to-[#12193E] overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-[#4FC3F7]/5 blur-[120px] pointer-events-none" />

                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-serif text-white uppercase tracking-tight flex items-center gap-3">
                                <Bell size={24} className="text-[#C9A84C]" />
                                {t('notifications.title')}
                                {unreadCount > 0 && (
                                    <span className="text-xs font-mono bg-[#C9A84C] text-[#0A0F2C] px-2.5 py-0.5 rounded-full font-bold animate-pulse">
                                        {t('notifications.new', { count: unreadCount })}
                                    </span>
                                )}
                            </h1>
                            <p className="text-xs text-slate-400 mt-1 font-sans">
                                {t('notifications.pageSubtitle')}{' '}
                                <span className="text-[#4FC3F7]/60 text-[9px] font-mono">
                                    {t('notifications.realtime')}
                                </span>
                            </p>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                            {/* Global alerts toggle — same persisted mute as the header bell */}
                            {onToggleGlobalMuted && (
                                <button
                                    onClick={onToggleGlobalMuted}
                                    aria-pressed={!globalMuted}
                                    aria-label={globalMuted ? t('notifications.enableGlobal') : t('notifications.muteGlobal')}
                                    title={globalMuted
                                        ? t('notifications.globalMutedHint')
                                        : t('notifications.globalOnHint')}
                                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg border text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${
                                        globalMuted
                                            ? 'border-white/10 bg-white/5 text-slate-400 hover:text-white hover:border-white/20'
                                            : 'border-[#4FC3F7]/30 bg-[#4FC3F7]/10 text-[#4FC3F7] hover:border-[#4FC3F7]/60'
                                    }`}
                                >
                                    <Globe size={12} />
                                    {globalMuted ? <BellOff size={12} /> : <BellRing size={12} />}
                                    {globalMuted ? t('notifications.globalMuted') : t('notifications.globalOn')}
                                </button>
                            )}

                            {unreadCount > 0 && (
                                <button
                                    onClick={onMarkAllAsRead}
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-xs text-slate-300 hover:text-white hover:border-[#4FC3F7]/40 transition-all cursor-pointer font-mono uppercase tracking-wider"
                                >
                                    <CheckCheck size={12} />
                                    {t('notifications.markAllRead')}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex flex-wrap gap-2 mt-8">
                        {NOTIFICATION_TYPES.map((tab) => {
                            const isActive = filterType === tab;
                            return (
                                <button
                                    key={tab}
                                    onClick={() => onFilterChange(tab)}
                                    className={`px-4 py-2 rounded-full text-[10px] font-mono uppercase tracking-wider transition-all duration-300 cursor-pointer active:scale-95 ${
                                        isActive
                                            ? 'bg-[#C9A84C] text-[#0A0F2C] font-semibold'
                                            : 'bg-white/5 text-slate-400 hover:text-white border border-white/10 hover:border-[#4FC3F7]/30'
                                    }`}
                                >
                                    {tc(`notifications.tab.${tab}`, TYPE_LABELS[tab])}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Notifications List */}
            <div className="max-w-4xl mx-auto px-4 md:px-8 py-8">
                {notifications.length === 0 ? (
                    <div className="py-16 text-center">
                        <div className="inline-flex p-4 rounded-full bg-white/5 border border-white/10 mb-4">
                            <Bell size={24} className="text-slate-500" />
                        </div>
                        <h3 className="text-sm font-serif text-white mb-1">{t('notifications.noNotifications')}</h3>
                        <p className="text-xs text-slate-400 font-sans">
                            {filterType !== 'all'
                                ? t('notifications.noneType', {
                                    type: tc(`notifications.type.${filterType}`, TYPE_LABELS[filterType]).toLowerCase(),
                                })
                                : t('notifications.allCaughtUp')}
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        <AnimatePresence mode="popLayout">
                            {notifications.map((notification) => (
                                <NotificationItem
                                    key={notification.id}
                                    notification={notification}
                                    onMarkRead={onMarkAsRead}
                                />
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Notification Item ───────────────────────────────────────────────────────

function NotificationItem({
    notification,
    onMarkRead,
}: {
    notification: Notification;
    onMarkRead: (id: string) => void;
}) {
    const { language, t, tc } = useLanguage();
    const IconComponent = TYPE_ICONS[notification.type] || Bell;
    const colorClass = TYPE_COLORS[notification.type] || TYPE_COLORS.system;

    // Localized copy — Arabic templates when available; names/IDs embedded in
    // the message stay in their original language (Facebook-style).
    const title = language === 'ar' && notification.titleAr ? notification.titleAr : notification.title;
    const message = language === 'ar' && notification.messageAr ? notification.messageAr : notification.message;

    const content = (
        <motion.div
            layout
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => !notification.read && onMarkRead(notification.id)}
            className={`relative flex items-start gap-4 p-4 rounded-xl border transition-all duration-300 cursor-pointer group ${
                notification.read
                    ? 'bg-[#0A0F2C]/60 border-white/5 opacity-70'
                    : 'bg-[#0A0F2C]/90 border-[#C9A84C]/15 hover:border-[#C9A84C]/30'
            }`}
        >
            {/* Unread Dot */}
            {!notification.read && (
                <span className="absolute top-4 left-4 w-2 h-2 rounded-full bg-[#C9A84C] animate-pulse" />
            )}

            {/* Icon */}
            <div className={`p-2.5 rounded-lg shrink-0 ${colorClass} ${notification.read ? 'opacity-60' : ''}`}>
                <IconComponent size={14} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                    <h4 className={`text-xs font-semibold ${notification.read ? 'text-slate-500' : 'text-white'}`}>
                        {title}
                    </h4>
                    <span className="text-[9px] text-slate-600 font-mono shrink-0 whitespace-nowrap">
                        {formatRelativeTime(notification.createdAt, language)}
                    </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed line-clamp-2">
                    {message}
                </p>

                {/* Bottom actions */}
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                    <span className="text-[8px] font-mono uppercase tracking-wider text-slate-600">
                        {tc(`notifications.type.${notification.type}`, notification.type)}
                    </span>
                    {notification.href && (
                        <span className="flex items-center gap-1 text-[9px] text-[#4FC3F7]/70 group-hover:text-[#4FC3F7] transition-colors font-mono uppercase tracking-wider">
                            {t('notifications.viewDetails')} <DirectionalIcon icon={ChevronRight} size={10} />
                        </span>
                    )}
                </div>
            </div>
        </motion.div>
    );

    if (notification.href) {
        return (
            <Link href={notification.href} className="block">
                {content}
            </Link>
        );
    }

    return content;
}
