/**
 * SADAF | Notifications — Shared UI Styles
 *
 * Single source of truth for notification type icons, colors, and labels.
 * Used by NotificationsView (full page) and NotificationBell (header dropdown)
 * so the two surfaces stay visually consistent.
 */

import {
    ShoppingBag,
    Heart,
    MessageSquare,
    Info,
    Tag,
    Bell,
} from 'lucide-react';
import type { NotificationType } from '../types';

/** Icon shown for each notification type. */
export const TYPE_ICONS: Record<NotificationType, typeof Bell> = {
    order: ShoppingBag,
    wishlist: Heart,
    review: MessageSquare,
    system: Info,
    promotion: Tag,
};

/** Color classes (icon + icon background) for each notification type. */
export const TYPE_COLORS: Record<NotificationType, string> = {
    order: 'text-[#4FC3F7] bg-[#4FC3F7]/10',
    wishlist: 'text-red-400 bg-red-400/10',
    review: 'text-[#C9A84C] bg-[#C9A84C]/10',
    system: 'text-purple-400 bg-purple-400/10',
    promotion: 'text-green-400 bg-green-400/10',
};

/** Human labels used for filter tabs. */
export const TYPE_LABELS: Record<string, string> = {
    all: 'All Notifications',
    order: 'Orders',
    wishlist: 'Wishlist',
    review: 'Reviews',
    system: 'System',
    promotion: 'Promotions',
};

/** All filterable types, in display order (tab list). */
export const NOTIFICATION_TYPES = ['all', 'order', 'wishlist', 'review', 'system', 'promotion'] as const;
