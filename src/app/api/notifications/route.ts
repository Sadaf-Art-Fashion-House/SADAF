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

/** Human-readable copy per pipeline status, shared by the bell and the page. */
function statusEventTitle(event: DesignStatusEvent): string {
    if (event.kind === 'collaborator_added') {
        return 'Added as a collaborator';
    }
    switch (event.status) {
        case 'approved':
            return 'Design approved by the atelier';
        case 'rejected':
            return 'Design rejected by the atelier';
        case 'in_production':
            return 'Design entered production';
        case 'under_review':
            return 'Design is under review';
        default:
            return 'Atelier decision';
    }
}

function statusEventMessage(event: DesignStatusEvent): string {
    if (event.kind === 'collaborator_added') {
        return `You were added as a collaborator to “${event.title}” — role: ${event.collaboratorRole ?? 'Collaborator'}.`;
    }
    const base = `“${event.title}”`;
    switch (event.status) {
        case 'approved':
            return `${base} was approved — the atelier begins sampling.`;
        case 'rejected':
            return event.adminNote
                ? `${base} was rejected. Atelier note: “${event.adminNote}”`
                : `${base} was rejected — check the atelier feedback.`;
        case 'in_production':
            return `${base} is now in production in the atelier.`;
        case 'under_review':
            return `${base} is being reviewed by the atelier.`;
        default:
            return `The atelier updated “${event.title}”.`;
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
        .map((event) => ({
            id: `atelier-event-${event.id}`,
            type: 'system' as const,
            title: statusEventTitle(event),
            message: statusEventMessage(event),
            href: `/dashboard/designer/portfolio/${event.submissionId}`,
            createdAt: event.createdAt,
            read: false,
        }));
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
