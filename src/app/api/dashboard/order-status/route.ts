/**
 * SADAF | API Route — Per-User Live Order Status
 *
 * GET /api/dashboard/order-status?userId=<id>
 *
 * Returns the customer's current order statuses plus recent status
 * transitions (Pending → Tailoring → Shipped → Delivered) newest-first.
 * This is the REST fallback used by useOrderStatus when the WebSocket
 * server is unavailable (polls every 15s). The primary real-time path is
 * the WebSocket server pushing `personal:user:{userId}` messages with an
 * `orderStatus` payload.
 *
 * Currently returns generated demo transitions so the fallback degrades
 * gracefully during development. Swap for Prisma/database queries in
 * production (filter orders by userId).
 */

import { NextRequest, NextResponse } from 'next/server';
import type { OrderStatus, OrderStatusEvent } from '@/features/orders/types';

/**
 * Never cache: order statuses change as pieces move through the atelier.
 */
export const dynamic = 'force-dynamic';

// ─── In-memory per-user demo store ──────────────────────────────────────────
// Mirrors the demo generator in ws-server.mjs so both transports agree.

const MAX_EVENTS_PER_USER = 20;
const orderStatusStore = new Map<string, OrderStatusEvent[]>();
let orderStatusCounter = 0;

const TRANSITION_TEMPLATES: ReadonlyArray<{ previousStatus: OrderStatus; status: OrderStatus; message: string }> = [
    { previousStatus: 'Pending', status: 'Tailoring', message: 'Your piece has entered the atelier — our artisans are sewing it by hand.' },
    { previousStatus: 'Tailoring', status: 'Shipped', message: 'Your order has shipped from the atelier and is on its way.' },
    { previousStatus: 'Shipped', status: 'Delivered', message: 'Delivered! We hope your piece brings you joy.' },
];

/** The demo order tracked by the WS generator. */
const DEMO_ORDER_ID = 'SDF-2026-9041';

function buildDemoTransition(userId: string): OrderStatusEvent {
    const template = TRANSITION_TEMPLATES[orderStatusCounter % TRANSITION_TEMPLATES.length];
    orderStatusCounter += 1;
    return {
        id: `os-api-${Date.now()}-${orderStatusCounter}`,
        orderId: DEMO_ORDER_ID,
        previousStatus: template.previousStatus,
        status: template.status,
        message: template.message,
        timestamp: new Date().toISOString(),
        userId,
    };
}

export async function GET(request: NextRequest) {
    const userId = request.nextUrl.searchParams.get('userId') || 'demo';

    try {
        // Seed the user's ring buffer on first request, then append one
        // fresh transition per poll so the fallback feed feels alive.
        const existing = orderStatusStore.get(userId) ?? [];
        const events = [...existing, buildDemoTransition(userId)].slice(-MAX_EVENTS_PER_USER);
        orderStatusStore.set(userId, events);

        // Derive the latest status per order from the most recent transition.
        const latestByOrder = new Map<string, OrderStatus>();
        for (const event of events) {
            latestByOrder.set(event.orderId, event.status);
        }

        return NextResponse.json({
            events: [...events].reverse(),
            orders: Array.from(latestByOrder, ([orderId, status]) => ({ orderId, status })),
            userId,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Order status data error:', error);
        return NextResponse.json(
            { error: 'Failed to load order status' },
            { status: 500 }
        );
    }
}
