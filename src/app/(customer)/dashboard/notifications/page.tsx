import type { Metadata } from 'next';
import NotificationsPageClient from '@/features/notifications/components/NotificationsPageClient';
import type { Notification } from '@/features/notifications/types';

export const metadata: Metadata = {
    title: 'Notifications | SADAF Atelier',
    description: 'View your notifications for orders, wishlist, and atelier updates.',
};

// TODO: Replace with real Supabase/Prisma query
async function getNotifications(): Promise<Notification[]> {
    return [];
}

export default async function NotificationsPage() {
    const notifications = await getNotifications();
    return <NotificationsPageClient notifications={notifications} />;
}
