/**
 * SADAF | API Route — Pending Friend Requests (REST fallback)
 *
 * GET /api/friend-requests/pending?userId=<id>
 *
 * Returns the received connection requests awaiting the user's response.
 * This is the REST fallback used by usePendingFriendRequests when the
 * WebSocket server is unavailable (polls every 15s). The primary real-time
 * path is ws-server.mjs pushing `friend_request` notifications on the
 * `notifications:user:{id}` channel.
 *
 * Currently mirrors MOCK_PENDING_REQUESTS so the fallback degrades
 * gracefully during development. Swap for Prisma/database queries in
 * production (filter by userId).
 */

import { NextRequest, NextResponse } from 'next/server';
import { MOCK_PENDING_REQUESTS } from '@/features/community/constants/communityData';

/**
 * Never cache: the pending list is expected to change over time.
 */
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    // userId is accepted for API parity; demo data is global for now.
    const userId = request.nextUrl.searchParams.get('userId');

    try {
        const received = MOCK_PENDING_REQUESTS.filter((request) => request.direction === 'received');
        return NextResponse.json({
            count: received.length,
            requests: received,
            userId,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Pending friend requests data error:', error);
        return NextResponse.json(
            { error: 'Failed to load pending friend requests' },
            { status: 500 }
        );
    }
}
