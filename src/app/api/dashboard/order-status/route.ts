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

/** Demo orders that receive live transitions — cycles so every tracked order animates. */
const DEMO_ORDER_IDS = ['SDF-2026-9041', 'SDF-2026-4412', 'SDF-2026-2287', 'SDF-2026-1053'];

const PLACED_MESSAGE = 'Your new order has been placed — our artisans will begin tailoring it soon.';

function buildDemoTransition(userId: string): OrderStatusEvent {
    orderStatusCounter += 1;
    // Every fourth update a brand-new order enters tracking (kind: 'placed').
    if (orderStatusCounter % 4 === 0) {
        return {
            id: `os-api-${Date.now()}-${orderStatusCounter}`,
            orderId: `SDF-2026-${9100 + orderStatusCounter}`,
            kind: 'placed',
            previousStatus: 'Pending',
            status: 'Pending',
            message: PLACED_MESSAGE,
            timestamp: new Date().toISOString(),
            userId,
        };
    }
    const template = TRANSITION_TEMPLATES[orderStatusCounter % TRANSITION_TEMPLATES.length];
    return {
        id: `os-api-${Date.now()}-${orderStatusCounter}`,
        orderId: DEMO_ORDER_IDS[orderStatusCounter % DEMO_ORDER_IDS.length],
        kind: 'transition',
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
