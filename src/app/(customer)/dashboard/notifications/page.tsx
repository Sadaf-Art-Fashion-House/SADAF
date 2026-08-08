import type { Metadata } from 'next';
import NotificationsPageClient from '@/features/notifications/components/NotificationsPageClient';
import type { Notification } from '@/features/notifications/types';

export const metadata: Metadata = {
    title: 'Notifications | SADAF Atelier',
    description: 'View your notifications for orders, wishlist, and atelier updates.',
};

function getMockNotifications(): Notification[] {
    return [
        {
            id: 'notif-1', type: 'order', title: 'Order #SADAF-1001 Confirmed',
            message: 'Your Empress Diwani Abaya Cape order has been confirmed and is being prepared.',
            href: '/orders', createdAt: new Date(Date.now() - 600_000).toISOString(), read: false,
        },
        {
            id: 'notif-2', type: 'wishlist', title: 'Price Drop on Wishlist Item',
            message: 'The Sadaf Inlaid Peak Tuxedo is now 15% off — $2,040 instead of $2,400.',
            href: '/wishlist', createdAt: new Date(Date.now() - 3_600_000).toISOString(), read: false,
        },
        {
            id: 'notif-3', type: 'review', title: 'New Review Posted',
            message: 'Layla M. left a 5-star review on Empress Diwani Abaya Cape.',
            href: '/reviews', createdAt: new Date(Date.now() - 86_400_000).toISOString(), read: false,
        },
        {
            id: 'notif-4', type: 'system', title: 'Platform Update v2.4.1',
            message: 'SADAF platform has been updated with new features, including real-time notifications via WebSocket.',
            href: '/dashboard', createdAt: new Date(Date.now() - 172_800_000).toISOString(), read: false,
        },
        {
            id: 'notif-5', type: 'promotion', title: 'Weekend Flash Sale',
            message: 'Get 20% off all Traditional Fusion pieces this weekend. Use code: FUSION20 at checkout.',
            href: '/store', createdAt: new Date(Date.now() - 259_200_000).toISOString(), read: false,
        },
        {
            id: 'notif-6', type: 'order', title: 'Order #SADAF-0998 Shipped',
            message: 'Your Gilded Caliph Streetwear Hoodie has been shipped. Tracking: SADAF-TRK-8842.',
            href: '/orders', createdAt: new Date(Date.now() - 345_600_000).toISOString(), read: true,
        },
        {
            id: 'notif-7', type: 'wishlist', title: 'Back in Stock',
            message: 'Fatimid Star Silk Slip Dress (Size M, Royal Navy) is back in stock.',
            href: '/store', createdAt: new Date(Date.now() - 432_000_000).toISOString(), read: true,
        },
        {
            id: 'notif-8', type: 'system', title: 'Profile Updated',
            message: 'Your profile information has been successfully updated.',
            href: '/dashboard/profile', createdAt: new Date(Date.now() - 518_400_000).toISOString(), read: true,
        },
        {
            id: 'notif-9', type: 'promotion', title: 'New Collection Alert',
            message: 'The Sands of Al-Muizz Collection has dropped. Explore the latest couture pieces.',
            href: '/fashion', createdAt: new Date(Date.now() - 604_800_000).toISOString(), read: true,
        },
        {
            id: 'notif-10', type: 'order', title: 'Order #SADAF-0985 Delivered',
            message: 'Your Royal Heir Linen Set has been delivered. We hope you love it!',
            href: '/orders', createdAt: new Date(Date.now() - 691_200_000).toISOString(), read: true,
        },
    ];
}

export default async function NotificationsPage() {
    const notifications = getMockNotifications();
    return <NotificationsPageClient notifications={notifications} />;
}
