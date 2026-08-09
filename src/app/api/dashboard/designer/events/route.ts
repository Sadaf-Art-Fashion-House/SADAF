/**
 * SADAF | API Route — Designer Status Events
 *
 * GET /api/dashboard/designer/events?since=<cursor>
 *
 * Returns atelier pipeline changes (approve / reject / start production)
 * that happened after the given cursor. The WebSocket server polls this on
 * the same cadence as the designer payload and pushes one notification per
 * recipient (owner + collaborators) on notifications:user:{id}, so team
 * members learn about atelier decisions in real time.
 *
 * Swap the in-memory store for a database table in production.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDesignerStatusEvents } from '../designerStore';

/** Never cache: the events list is a moving cursor over time. */
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const since = Number(request.nextUrl.searchParams.get('since') ?? '0');

    try {
        return NextResponse.json({
            events: getDesignerStatusEvents(Number.isFinite(since) ? since : 0),
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Designer events data error:', error);
        return NextResponse.json({ error: 'Failed to load designer events' }, { status: 500 });
    }
}
