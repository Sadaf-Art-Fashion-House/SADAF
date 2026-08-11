/**
 * SADAF | API Route — Notifications Data
 *
 * GET /api/notifications?userId=<id>
 *
 * Returns the current notification list. This is the REST fallback used by
 * useRealtimeNotifications when the WebSocket server is unavailable (polls
 * every 15s). The primary real-time path is the WebSocket server pushing
 * `notification` messages directly.
 *
 * Currently returns generated demo notifications so the fallback degrades
 * gracefully during development. Swap for Prisma/database queries in
 * production (filter by userId).
 */

import { NextRequest, NextResponse } from 'next/server';
import { getStatusEventsForUser } from '@/app/api/dashboard/designer/designerStore';
import type { Notification } from '@/features/notifications/types';
import type { DesignStatusEvent } from '@/features/designer/types';

/**
 * Never cache: the notification list is expected to change over time.
 */
export const dynamic = 'force-dynamic';

// ─── In-memory demo store ────────────────────────────────────────────────────
// Mirrors the demo generator in ws-server.mjs so both transports agree.

let demoCounter = 0;

// Templates carry both English and Arabic copy. User-generated values that
// get interpolated into messages (order IDs, design titles, admin notes, role
// names) stay in their original language — like Facebook/Instagram, only the
// surrounding template text is translated.
const NOTIFICATION_TEMPLATES = [
    {
        type: 'order' as const,
        title: 'New Order Received',
        titleAr: 'تم استلام طلب جديد',
        message: 'Order #SADAF-1001 has been placed successfully and is being prepared.',
        messageAr: 'تم تقديم الطلب #SADAF-1001 بنجاح وهو قيد التجهيز.',
        href: '/dashboard/orders',
    },
    {
        type: 'wishlist' as const,
        title: 'Wishlist Price Drop',
        titleAr: 'انخفاض سعر في المفضلة',
        message: 'An item in your wishlist is now 15% off — limited time only.',
        messageAr: 'أحد العناصر في مفضلتك أصبح بخصم 15% — لفترة محدودة فقط.',
        href: '/wishlist',
    },
    {
        type: 'review' as const,
        title: 'New Review Posted',
        titleAr: 'تم نشر مراجعة جديدة',
        message: 'A customer left a 5-star review on one of your products.',
        messageAr: 'ترك أحد العملاء تقييمًا بخمس نجوم على أحد منتجاتك.',
        href: '/reviews',
    },
    {
        type: 'system' as const,
        title: 'System Update',
        titleAr: 'تحديث النظام',
        message: 'SADAF platform v2.4.1 deployed with new features and improvements.',
        messageAr: 'تم نشر منصة SADAF v2.4.1 بميزات وتحسينات جديدة.',
        href: '/dashboard',
    },
    {
        type: 'promotion' as const,
        title: 'Limited Offer',
        titleAr: 'عرض محدود',
        message: 'Get 20% off on all Traditional Fusion pieces this weekend.',
        messageAr: 'احصل على خصم 20% على كل قطع الدمج التقليدي هذا الأسبوع.',
        href: '/store',
    },
] as const;

function buildDemoNotifications(count = 5) {
    return Array.from({ length: count }, (_, index) => {
        demoCounter += 1;
        const template = NOTIFICATION_TEMPLATES[demoCounter % NOTIFICATION_TEMPLATES.length];
        return {
            id: `api-demo-${Date.now()}-${demoCounter}`,
            type: template.type,
            title: template.title,
            titleAr: template.titleAr,
            message: template.message,
            messageAr: template.messageAr,
            href: template.href,
            createdAt: new Date(Date.now() - index * 900_000).toISOString(),
            read: false,
        };
    });
}

/** Human-readable copy per pipeline status — English + Arabic pairs, with the
 *  design title / admin note / role interpolated as-is (user data stays in its
 *  original language, like Facebook keeps names untranslated). */
function statusEventTitle(event: DesignStatusEvent): { en: string; ar: string } {
    if (event.kind === 'collaborator_added') {
        return { en: 'Added as a collaborator', ar: 'أُضفت كمتعاون' };
    }
    switch (event.status) {
        case 'approved':
            return { en: 'Design approved by the atelier', ar: 'تمت الموافقة على التصميم من الأتيليه' };
        case 'rejected':
            return { en: 'Design rejected by the atelier', ar: 'تم رفض التصميم من الأتيليه' };
        case 'in_production':
            return { en: 'Design entered production', ar: 'دخل التصميم مرحلة الإنتاج' };
        case 'under_review':
            return { en: 'Design is under review', ar: 'التصميم قيد المراجعة' };
        default:
            return { en: 'Atelier decision', ar: 'قرار الأتيليه' };
    }
}

function statusEventMessage(event: DesignStatusEvent): { en: string; ar: string } {
    if (event.kind === 'collaborator_added') {
        return {
            en: `You were added as a collaborator to “${event.title}” — role: ${event.collaboratorRole ?? 'Collaborator'}.`,
            ar: `تمت إضافتك كمتعاون في “${event.title}” — الدور: ${event.collaboratorRole ?? 'Collaborator'}.`,
        };
    }
    const base = `“${event.title}”`;
    switch (event.status) {
        case 'approved':
            return {
                en: `${base} was approved — the atelier begins sampling.`,
                ar: `تمت الموافقة على “${event.title}” — يبدأ الأتيليه في تجهيز العينات.`,
            };
        case 'rejected':
            return event.adminNote
                ? {
                    en: `${base} was rejected. Atelier note: “${event.adminNote}”`,
                    ar: `تم رفض “${event.title}”. ملاحظة الأتيليه: “${event.adminNote}”`,
                }
                : {
                    en: `${base} was rejected — check the atelier feedback.`,
                    ar: `تم رفض “${event.title}” — راجع ملاحظات الأتيليه.`,
                };
        case 'in_production':
            return {
                en: `${base} is now in production in the atelier.`,
                ar: `“${event.title}” الآن في مرحلة الإنتاج داخل الأتيليه.`,
            };
        case 'under_review':
            return {
                en: `${base} is being reviewed by the atelier.`,
                ar: `“${event.title}” قيد المراجعة من الأتيليه.`,
            };
        default:
            return {
                en: `The atelier updated “${event.title}”.`,
                ar: `حدّث الأتيليه “${event.title}”.`,
            };
    }
}

/**
 * Real atelier events concerning this user (owner + collaborators), newest
 * first, shaped like a bell notification so the REST fallback agrees with
 * the WS push.
 */
function buildTeamEventNotifications(userId: string): Notification[] {
    return getStatusEventsForUser(userId)
        .slice()
        .reverse()
        .map((event) => {
            const title = statusEventTitle(event);
            const message = statusEventMessage(event);
            return {
                id: `atelier-event-${event.id}`,
                type: 'system' as const,
                title: title.en,
                titleAr: title.ar,
                message: message.en,
                messageAr: message.ar,
                href: `/dashboard/designer/portfolio/${event.submissionId}`,
                createdAt: event.createdAt,
                read: false,
            };
        });
}

export async function GET(request: NextRequest) {
    // userId is accepted for API parity; demo data is global for now.
    const userId = request.nextUrl.searchParams.get('userId');

    try {
        // Real atelier team events for this user go first, then the demo
        // feed — the WS server pushes the same events in real time.
        const teamEvents = userId ? buildTeamEventNotifications(userId) : [];
        return NextResponse.json({
            notifications: [...teamEvents, ...buildDemoNotifications()],
            userId,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Notifications data error:', error);
        return NextResponse.json(
            { error: 'Failed to load notifications' },
            { status: 500 }
        );
    }
}
