'use client';

import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import {
    Bell,
    ShoppingBag,
    Heart,
    MessageSquare,
    Info,
    Tag,
    CheckCheck,
    ChevronRight,
    Wifi,
    WifiOff,
} from 'lucide-react';
import type { Notification, NotificationType } from '../types';

// ─── Types ───────────────────────────────────────────────────────────────────

interface NotificationsViewProps {
    notifications: Notification[];
    unreadCount: number;
    onMarkAsRead: (id: string) => void;
    onMarkAllAsRead: () => void;
    filterType: string;
    onFilterChange: (type: string) => void;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const TYPE_ICONS: Record<NotificationType, typeof Bell> = {
    order: ShoppingBag,
    wishlist: Heart,
    review: MessageSquare,
    system: Info,
    promotion: Tag,
};

const TYPE_COLORS: Record<NotificationType, string> = {
    order: 'text-[#4FC3F7] bg-[#4FC3F7]/10',
    wishlist: 'text-red-400 bg-red-400/10',
    review: 'text-[#C9A84C] bg-[#C9A84C]/10',
    system: 'text-purple-400 bg-purple-400/10',
    promotion: 'text-green-400 bg-green-400/10',
};

const TYPE_LABELS: Record<string, string> = {
    all: 'All Notifications',
    order: 'Orders',
    wishlist: 'Wishlist',
    review: 'Reviews',
    system: 'System',
    promotion: 'Promotions',
};

const FILTER_TABS = ['all', 'order', 'wishlist', 'review', 'system', 'promotion'] as const;

// ─── Component ───────────────────────────────────────────────────────────────

export default function NotificationsView({
    notifications,
    unreadCount,
    onMarkAsRead,
    onMarkAllAsRead,
    filterType,
    onFilterChange,
}: NotificationsViewProps) {
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
                                Notifications
                                {unreadCount > 0 && (
                                    <span className="text-xs font-mono bg-[#C9A84C] text-[#0A0F2C] px-2.5 py-0.5 rounded-full font-bold animate-pulse">
                                        {unreadCount} new
                                    </span>
                                )}
                            </h1>
                            <p className="text-xs text-slate-400 mt-1 font-sans">
                                Stay updated on orders, wishlist items, and atelier news.{' '}
                                <span className="text-[#4FC3F7]/60 text-[9px] font-mono">
                                    (Real-time via WebSocket)
                                </span>
                            </p>
                        </div>

                        {unreadCount > 0 && (
                            <button
                                onClick={onMarkAllAsRead}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-xs text-slate-300 hover:text-white hover:border-[#4FC3F7]/40 transition-all cursor-pointer font-mono uppercase tracking-wider"
                            >
                                <CheckCheck size={12} />
                                Mark All Read
                            </button>
                        )}
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex flex-wrap gap-2 mt-8">
                        {FILTER_TABS.map((tab) => {
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
                                    {TYPE_LABELS[tab]}
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
                        <h3 className="text-sm font-serif text-white mb-1">No Notifications</h3>
                        <p className="text-xs text-slate-400 font-sans">
                            {filterType !== 'all'
                                ? `No ${TYPE_LABELS[filterType].toLowerCase()} notifications yet.`
                                : 'You\'re all caught up! No new notifications.'}
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
    const IconComponent = TYPE_ICONS[notification.type] || Info;
    const colorClass = TYPE_COLORS[notification.type] || TYPE_COLORS.system;

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
                        {notification.title}
                    </h4>
                    <span className="text-[9px] text-slate-600 font-mono shrink-0 whitespace-nowrap">
                        {formatRelativeTime(notification.createdAt)}
                    </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed line-clamp-2">
                    {notification.message}
                </p>

                {/* Bottom actions */}
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                    <span className="text-[8px] font-mono uppercase tracking-wider text-slate-600">
                        {notification.type}
                    </span>
                    {notification.href && (
                        <span className="flex items-center gap-1 text-[9px] text-[#4FC3F7]/70 group-hover:text-[#4FC3F7] transition-colors font-mono uppercase tracking-wider">
                            View Details <ChevronRight size={10} />
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRelativeTime(dateStr: string): string {
    const now = Date.now();
    const date = new Date(dateStr).getTime();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60_000);
    const diffHours = Math.floor(diffMs / 3_600_000);
    const diffDays = Math.floor(diffMs / 86_400_000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
