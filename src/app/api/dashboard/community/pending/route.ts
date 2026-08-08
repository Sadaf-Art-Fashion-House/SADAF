/**
 * SADAF | API Route — Resolve Pending Request (Admin / Founder)
 *
 * POST /api/dashboard/community/pending
 * Body: { id: string, action: 'accept' | 'decline' }
 *
 * Resolves a platform-level pending connection request from the admin /
 * founder Community Overview page. Accept and decline both remove the
 * request from the in-memory store (the underlying customer network owns
 * the actual connection); the GET route + the 10s WS push pick up the
 * change so every client stays in sync.
 *
 * Swap the store for a Prisma/database write in production.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
    getAdminPendingRequests,
    resolveAdminPendingRequest,
} from '../pendingStore';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const body = (await request.json()) as { id?: unknown; action?: unknown };
        const { id, action } = body;

        if (typeof id !== 'string' || (action !== 'accept' && action !== 'decline')) {
            return NextResponse.json(
                { error: 'Invalid payload — expected { id: string, action: "accept" | "decline" }' },
                { status: 400 }
            );
        }

        const resolved = resolveAdminPendingRequest(id, action);
        if (!resolved) {
            return NextResponse.json(
                { error: 'Pending request not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            pendingRequests: getAdminPendingRequests(),
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Resolve pending request error:', error);
        return NextResponse.json(
            { error: 'Failed to resolve pending request' },
            { status: 500 }
        );
    }
}
