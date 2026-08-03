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

/**
 * Never cache: the notification list is expected to change over time.
 */
export const dynamic = 'force-dynamic';

// ─── In-memory demo store ────────────────────────────────────────────────────
// Mirrors the demo generator in ws-server.mjs so both transports agree.

let demoCounter = 0;

const NOTIFICATION_TEMPLATES = [
    {
        type: 'order' as const,
        title: 'New Order Received',
        message: 'Order #SADAF-1001 has been placed successfully and is being prepared.',
        href: '/dashboard/orders',
    },
    {
        type: 'wishlist' as const,
        title: 'Wishlist Price Drop',
        message: 'An item in your wishlist is now 15% off — limited time only.',
        href: '/wishlist',
    },
    {
        type: 'review' as const,
        title: 'New Review Posted',
        message: 'A customer left a 5-star review on one of your products.',
        href: '/reviews',
    },
    {
        type: 'system' as const,
        title: 'System Update',
        message: 'SADAF platform v2.4.1 deployed with new features and improvements.',
        href: '/dashboard',
    },
    {
        type: 'promotion' as const,
        title: 'Limited Offer',
        message: 'Get 20% off on all Traditional Fusion pieces this weekend.',
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
            message: template.message,
            href: template.href,
            createdAt: new Date(Date.now() - index * 900_000).toISOString(),
            read: false,
        };
    });
}

export async function GET(request: NextRequest) {
    // userId is accepted for API parity; demo data is global for now.
    const userId = request.nextUrl.searchParams.get('userId');

    try {
        return NextResponse.json({
            notifications: buildDemoNotifications(),
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
