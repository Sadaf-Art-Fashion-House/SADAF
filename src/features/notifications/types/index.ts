/**
 * SADAF | Notifications Feature — Type Definitions
 */

export type NotificationType = 'order' | 'wishlist' | 'review' | 'system' | 'promotion' | 'friend_request';

export interface Notification {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    /** Arabic title — rendered when the app language is Arabic (falls back to `title`). */
    titleAr?: string;
    /** Arabic message — same fallback semantics as `titleAr`. */
    messageAr?: string;
    href?: string;
    createdAt: string;
    read: boolean;
    icon?: string;
}

export interface NotificationState {
    notifications: Notification[];
    unreadCount: number;
}
