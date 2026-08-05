/**
 * SADAF | API Route — Per-User Personal Activity
 *
 * GET /api/dashboard/personal-activity?userId=<id>
 *
 * Returns the logged-in customer's personal activity (orders placed,
 * designs saved, wishlist updates, offers) newest-first. This is the REST
 * fallback used by usePersonalActivity when the WebSocket server is
 * unavailable (polls every 15s). The primary real-time path is the
 * WebSocket server pushing `personal:user:{userId}` messages directly.
 *
 * Currently returns generated demo activity so the fallback degrades
 * gracefully during development. Swap for Prisma/database queries in
 * production (filter by userId).
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * Never cache: the personal activity feed is expected to change over time.
 */
export const dynamic = 'force-dynamic';

// ─── Types ──────────────────────────────────────────────────────────────────

export type PersonalActivityType = 'order' | 'design' | 'wishlist' | 'promotion';

export interface PersonalActivityEvent {
    /** Unique id — consumers dedupe by this when appending. */
    id: string;
    /** Event category, drives the icon and color. */
    type: PersonalActivityType;
    /** Short headline (e.g. "Order Placed"). */
    title: string;
    /** One-line detail (e.g. order number, design name). */
    message: string;
    /** ISO timestamp of when the event occurred. */
    timestamp: string;
    /** The user this activity belongs to. */
    userId: string;
}

// ─── In-memory per-user demo store ──────────────────────────────────────────
// Mirrors the demo generator in ws-server.mjs so both transports agree.
// Production: replace with Prisma queries scoped by userId.

const MAX_EVENTS_PER_USER = 20;
const personalActivityStore = new Map<string, PersonalActivityEvent[]>();
let personalActivityCounter = 0;

const ACTIVITY_TEMPLATES: ReadonlyArray<Omit<PersonalActivityEvent, 'id' | 'timestamp' | 'userId'>> = [
    {
        type: 'order',
        title: 'Order Placed',
        message: 'Order #SADAF-5001 has been placed and is being prepared in the atelier.',
    },
    {
        type: 'design',
        title: 'Design Saved',
        message: 'Your design "Heritage Fusion 07" was saved to your atelier.',
    },
    {
        type: 'wishlist',
        title: 'Wishlist Update',
        message: 'An item in your wishlist is now 15% off — limited time.',
    },
    {
        type: 'promotion',
        title: 'Personal Offer',
        message: 'You earned a 10% member discount on your next order.',
    },
];

function buildDemoActivity(userId: string): PersonalActivityEvent {
    personalActivityCounter += 1;
    const template = ACTIVITY_TEMPLATES[personalActivityCounter % ACTIVITY_TEMPLATES.length];
    return {
        id: `pa-api-${Date.now()}-${personalActivityCounter}`,
        ...template,
        timestamp: new Date().toISOString(),
        userId,
    };
}

export async function GET(request: NextRequest) {
    const userId = request.nextUrl.searchParams.get('userId') || 'demo';

    try {
        // Seed the user's ring buffer on first request, then append one
        // fresh event per poll so the fallback feed feels alive.
        const existing = personalActivityStore.get(userId) ?? [];
        const events = [...existing, buildDemoActivity(userId)].slice(-MAX_EVENTS_PER_USER);
        personalActivityStore.set(userId, events);

        return NextResponse.json({
            events: [...events].reverse(),
            userId,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Personal activity data error:', error);
        return NextResponse.json(
            { error: 'Failed to load personal activity' },
            { status: 500 }
        );
    }
}
