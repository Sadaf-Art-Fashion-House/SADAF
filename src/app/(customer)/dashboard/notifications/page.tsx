import type { Metadata } from 'next';
import NotificationsPageClient from '@/features/notifications/components/NotificationsPageClient';
import type { Notification } from '@/features/notifications/types';

export const metadata: Metadata = {
    title: 'Notifications | SADAF Atelier',
    description: 'View your notifications for orders, wishlist, and atelier updates.',
};

// Static demo feed — carries both English and Arabic copy. Embedded user data
// (product names, order IDs, tracking codes, reviewer names) stays in its
// original language, like Facebook/Instagram keep names untranslated.
function getMockNotifications(): Notification[] {
    return [
        {
            id: 'notif-1', type: 'order', title: 'Order #SADAF-1001 Confirmed',
            titleAr: 'تم تأكيد الطلب #SADAF-1001',
            message: 'Your Empress Diwani Abaya Cape order has been confirmed and is being prepared.',
            messageAr: 'تم تأكيد طلب عباية الإمبراطورة ديواني وهو قيد التجهيز.',
            href: '/orders', createdAt: new Date(Date.now() - 600_000).toISOString(), read: false,
        },
        {
            id: 'notif-2', type: 'wishlist', title: 'Price Drop on Wishlist Item',
            titleAr: 'انخفاض سعر في المفضلة',
            message: 'The Sadaf Inlaid Peak Tuxedo is now 15% off — $2,040 instead of $2,400.',
            messageAr: 'Sadaf Inlaid Peak Tuxedo أصبح بخصم 15% — 2,040$ بدلًا من 2,400$.',
            href: '/wishlist', createdAt: new Date(Date.now() - 3_600_000).toISOString(), read: false,
        },
        {
            id: 'notif-3', type: 'review', title: 'New Review Posted',
            titleAr: 'تم نشر مراجعة جديدة',
            message: 'Layla M. left a 5-star review on Empress Diwani Abaya Cape.',
            messageAr: 'تركت Layla M. تقييمًا بخمس نجوم على عباية الإمبراطورة ديواني.',
            href: '/reviews', createdAt: new Date(Date.now() - 86_400_000).toISOString(), read: false,
        },
        {
            id: 'notif-4', type: 'system', title: 'Platform Update v2.4.1',
            titleAr: 'تحديث المنصة v2.4.1',
            message: 'SADAF platform has been updated with new features, including real-time notifications via WebSocket.',
            messageAr: 'تم تحديث منصة SADAF بميزات جديدة، بما في ذلك الإشعارات اللحظية عبر WebSocket.',
            href: '/dashboard', createdAt: new Date(Date.now() - 172_800_000).toISOString(), read: false,
        },
        {
            id: 'notif-5', type: 'promotion', title: 'Weekend Flash Sale',
            titleAr: 'تخفيضات نهاية الأسبوع',
            message: 'Get 20% off all Traditional Fusion pieces this weekend. Use code: FUSION20 at checkout.',
            messageAr: 'احصل على خصم 20% على كل قطع الدمج التقليدي هذا الأسبوع. استخدم الكود FUSION20 عند الدفع.',
            href: '/store', createdAt: new Date(Date.now() - 259_200_000).toISOString(), read: false,
        },
        {
            id: 'notif-6', type: 'order', title: 'Order #SADAF-0998 Shipped',
            titleAr: 'تم شحن الطلب #SADAF-0998',
            message: 'Your Gilded Caliph Streetwear Hoodie has been shipped. Tracking: SADAF-TRK-8842.',
            messageAr: 'تم شحن Gilded Caliph Streetwear Hoodie. رقم التتبع: SADAF-TRK-8842.',
            href: '/orders', createdAt: new Date(Date.now() - 345_600_000).toISOString(), read: true,
        },
        {
            id: 'notif-7', type: 'wishlist', title: 'Back in Stock',
            titleAr: 'عودة إلى المخزون',
            message: 'Fatimid Star Silk Slip Dress (Size M, Royal Navy) is back in stock.',
            messageAr: 'Fatimid Star Silk Slip Dress (مقاس M، Royal Navy) عاد إلى المخزون.',
            href: '/store', createdAt: new Date(Date.now() - 432_000_000).toISOString(), read: true,
        },
        {
            id: 'notif-8', type: 'system', title: 'Profile Updated',
            titleAr: 'تم تحديث الملف الشخصي',
            message: 'Your profile information has been successfully updated.',
            messageAr: 'تم تحديث معلومات ملفك الشخصي بنجاح.',
            href: '/dashboard/profile', createdAt: new Date(Date.now() - 518_400_000).toISOString(), read: true,
        },
        {
            id: 'notif-9', type: 'promotion', title: 'New Collection Alert',
            titleAr: 'تنبيه مجموعة جديدة',
            message: 'The Sands of Al-Muizz Collection has dropped. Explore the latest couture pieces.',
            messageAr: 'أُطلقت مجموعة رمال المعز. استكشف أحدث قطع الأزياء الراقية.',
            href: '/fashion', createdAt: new Date(Date.now() - 604_800_000).toISOString(), read: true,
        },
        {
            id: 'notif-10', type: 'order', title: 'Order #SADAF-0985 Delivered',
            titleAr: 'تم توصيل الطلب #SADAF-0985',
            message: 'Your Royal Heir Linen Set has been delivered. We hope you love it!',
            messageAr: 'تم توصيل Royal Heir Linen Set. نتمنى أن يعجبك!',
            href: '/orders', createdAt: new Date(Date.now() - 691_200_000).toISOString(), read: true,
        },
    ];
}

export default async function NotificationsPage() {
    const notifications = getMockNotifications();
    return <NotificationsPageClient notifications={notifications} />;
}
