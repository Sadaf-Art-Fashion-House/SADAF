/**
 * SADAF | API Route — Designer ↔ Company Connections
 *
 * GET   /api/dashboard/connections — the full connections payload: every
 *       partnership request plus the designer & company directories. The
 *       client filters by its own role/id (company sees what it sent, the
 *       designer sees what it received). Consumed by /dashboard/designer/
 *       connections and /dashboard/company/connections via useConnections
 *       (WS-primary on `connections:global` with REST fallback).
 * POST  /api/dashboard/connections — a company opens a request to a
 *       designer. Validates the designer exists and rejects duplicate
 *       pending requests (400 with an explicit message).
 * PATCH /api/dashboard/connections — a designer accepts or declines an
 *       incoming request. Returns the updated request.
 *
 * Swap the in-memory store for Prisma/database queries in production.
 */

import { NextResponse } from 'next/server';
import type { NewConnectionRequest, ConnectionResponse } from '@/features/connections/types';
import {
    getConnectionsData,
    addConnectionRequest,
    respondToConnectionRequest,
} from './connectionsStore';

/** Never cache: the hub is polled over WS and carries a timestamp. */
export const dynamic = 'force-dynamic';

export async function GET() {
    return NextResponse.json(getConnectionsData());
}

export async function POST(request: Request) {
    let body: Partial<NewConnectionRequest>;
    try {
        body = (await request.json()) as Partial<NewConnectionRequest>;
    } catch {
        return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
    }

    const companyId = typeof body.companyId === 'string' ? body.companyId.trim() : '';
    const companyName = typeof body.companyName === 'string' ? body.companyName.trim() : '';
    const companyCity = typeof body.companyCity === 'string' ? body.companyCity.trim() : '';
    const companyFocus = typeof body.companyFocus === 'string' ? body.companyFocus.trim() : '';
    const designerId = typeof body.designerId === 'string' ? body.designerId.trim() : '';
    const message = typeof body.message === 'string' ? body.message.trim() : '';

    if (!companyId || !companyName) {
        return NextResponse.json({ error: 'Company identity is required.' }, { status: 400 });
    }
    if (!designerId) {
        return NextResponse.json({ error: 'Choose a designer to connect with.' }, { status: 400 });
    }

    const created = addConnectionRequest({
        companyId,
        companyName,
        companyCity,
        companyFocus,
        designerId,
        message,
    });

    if (!created) {
        return NextResponse.json(
            { error: 'A pending request to this designer already exists.' },
            { status: 409 },
        );
    }

    return NextResponse.json({ connection: created, ...getConnectionsData() }, { status: 201 });
}

export async function PATCH(request: Request) {
    let body: { id?: string; action?: ConnectionResponse };
    try {
        body = (await request.json()) as { id?: string; action?: ConnectionResponse };
    } catch {
        return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
    }

    const id = typeof body.id === 'string' ? body.id : '';
    const action = body.action;

    if (!id) {
        return NextResponse.json({ error: 'Request id is required.' }, { status: 400 });
    }
    if (action !== 'accept' && action !== 'decline') {
        return NextResponse.json(
            { error: 'Action must be accept or decline.' },
            { status: 400 },
        );
    }

    const updated = respondToConnectionRequest(id, action);
    if (!updated) {
        return NextResponse.json(
            { error: 'Request not found or already resolved.' },
            { status: 404 },
        );
    }

    return NextResponse.json({ connection: updated, ...getConnectionsData() });
}
