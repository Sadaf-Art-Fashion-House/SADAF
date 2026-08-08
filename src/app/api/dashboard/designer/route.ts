/**
 * SADAF | API Route — Designer Dashboard
 *
 * GET  /api/dashboard/designer — the designer's submissions + aggregated
 *      KPI stats. Consumed by /dashboard/designer via useDesignerData
 *      (WS-primary on `designer:global` with REST fallback).
 * POST /api/dashboard/designer — submit a new design to the atelier.
 *      Validates required fields (title, category, price) and returns the
 *      updated dashboard payload so the client can apply it optimistically.
 * PATCH /api/dashboard/designer — admin atelier review: move a submission
 *      through the pipeline (approve/reject/start production) with an
 *      optional adminNote. Returns the updated payload so both the admin
 *      tab and the designer dashboard stay in sync (the 10s WS push then
 *      confirms it to the designer).
 *
 * Swap the in-memory store for Prisma/database queries in production.
 */

import { NextResponse } from 'next/server';
import type { DesignStatus, NewDesignSubmission } from '@/features/designer/types';
import { DESIGN_CATEGORIES, DESIGN_STATUSES } from '@/features/designer/constants';
import {
    getDesignerSubmissions,
    addDesignerSubmission,
    updateDesignerSubmissionStatus,
} from './designerStore';

/** Never cache: the dashboard is polled over WS and carries a timestamp. */
export const dynamic = 'force-dynamic';

function buildDashboardPayload() {
    const submissions = getDesignerSubmissions();
    const stats = {
        total: submissions.length,
        underReview: submissions.filter((s) => s.status === 'under_review').length,
        approved: submissions.filter((s) => s.status === 'approved').length,
        inProduction: submissions.filter((s) => s.status === 'in_production').length,
        rejected: submissions.filter((s) => s.status === 'rejected').length,
    };
    return { submissions, stats };
}

export async function GET() {
    return NextResponse.json(buildDashboardPayload());
}

export async function POST(request: Request) {
    let body: Partial<NewDesignSubmission>;
    try {
        body = (await request.json()) as Partial<NewDesignSubmission>;
    } catch {
        return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
    }

    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const category = body.category as NewDesignSubmission['category'];
    const price = Number(body.price);

    if (!title) {
        return NextResponse.json({ error: 'Title is required.' }, { status: 400 });
    }
    if (!category || !DESIGN_CATEGORIES.includes(category)) {
        return NextResponse.json({ error: 'A valid category is required.' }, { status: 400 });
    }
    if (!Number.isFinite(price) || price <= 0) {
        return NextResponse.json({ error: 'A positive price is required.' }, { status: 400 });
    }

    const submission = addDesignerSubmission({
        title,
        category,
        description: typeof body.description === 'string' ? body.description : '',
        price,
        imageUrl: typeof body.imageUrl === 'string' ? body.imageUrl : undefined,
    });

    return NextResponse.json({ submission, ...buildDashboardPayload() }, { status: 201 });
}

export async function PATCH(request: Request) {
    let body: { id?: string; status?: DesignStatus; adminNote?: string };
    try {
        body = (await request.json()) as { id?: string; status?: DesignStatus; adminNote?: string };
    } catch {
        return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
    }

    const id = typeof body.id === 'string' ? body.id : '';
    const status = body.status;

    if (!id) {
        return NextResponse.json({ error: 'Submission id is required.' }, { status: 400 });
    }
    if (!status || !DESIGN_STATUSES.includes(status)) {
        return NextResponse.json({ error: 'A valid status is required.' }, { status: 400 });
    }

    const adminNote = typeof body.adminNote === 'string' ? body.adminNote : undefined;
    const updated = updateDesignerSubmissionStatus(id, status, adminNote);

    if (!updated) {
        return NextResponse.json({ error: 'Submission not found.' }, { status: 404 });
    }

    return NextResponse.json({ submission: updated, ...buildDashboardPayload() });
}
