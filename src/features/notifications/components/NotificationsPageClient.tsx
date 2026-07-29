'use client';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { useRealtimeNotifications } from '../hooks/useRealtimeNotifications';
import NotificationsView from './NotificationsView';
import type { Notification } from '../types';

interface NotificationsPageClientProps {
    notifications: Notification[];
}

export default function NotificationsPageClient({ notifications }: NotificationsPageClientProps) {
    const { user } = useAuth();

    const {
        notifications: displayNotifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        filterType,
        setFilterType,
    } = useRealtimeNotifications(user?.id ?? null, notifications);

    return (
        <NotificationsView
            notifications={displayNotifications}
            unreadCount={unreadCount}
            onMarkAsRead={markAsRead}
            onMarkAllAsRead={markAllAsRead}
            filterType={filterType}
            onFilterChange={setFilterType}
        />
    );
}
