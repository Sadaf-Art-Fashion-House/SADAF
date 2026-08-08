/**
 * SADAF | Notifications Feature — Type Definitions
 */

export type NotificationType = 'order' | 'wishlist' | 'review' | 'system' | 'promotion' | 'friend_request';

export interface Notification {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    href?: string;
    createdAt: string;
    read: boolean;
    icon?: string;
}

export interface NotificationState {
    notifications: Notification[];
    unreadCount: number;
}
