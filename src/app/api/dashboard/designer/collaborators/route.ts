/**
 * SADAF | API Route — Add Design Collaborator
 *
 * POST /api/dashboard/designer/collaborators
 *
 * Appends a collaborator to a design submission (credits model — add-only,
 * no remove). The owner is resolved from the body and checked against the
 * submission's immutable `ownerId`, so only the submitting designer can
 * credit new people. Solo projects become team projects on first addition.
 * Returns the updated dashboard payload so the designer's UI can apply it
 * optimistically (the 10s WS push then confirms it).
 *
 * Swap the in-memory store for Prisma/database queries in production.
 */

import { NextResponse } from 'next/server';
import { addDesignerCollaborator, getDesignerSubmissions } from '../designerStore';
import type { DesignCollaborator } from '@/features/designer/types';

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

export async function POST(request: Request) {
    let body: { id?: string; ownerId?: string; collaborator?: DesignCollaborator };
    try {
        body = (await request.json()) as {
            id?: string;
            ownerId?: string;
            collaborator?: DesignCollaborator;
        };
    } catch {
        return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
    }

    const id = typeof body.id === 'string' ? body.id : '';
    const ownerId = typeof body.ownerId === 'string' ? body.ownerId : '';
    const collaborator = body.collaborator;

    if (!id) {
        return NextResponse.json({ error: 'Submission id is required.' }, { status: 400 });
    }
    if (!ownerId) {
        return NextResponse.json({ error: 'Owner id is required.' }, { status: 400 });
    }
    if (!collaborator || !collaborator.name?.trim() || !collaborator.role?.trim()) {
        return NextResponse.json(
            { error: 'A collaborator name and role are required.' },
            { status: 400 },
        );
    }

    const updated = addDesignerCollaborator(id, ownerId, collaborator);

    if (!updated) {
        return NextResponse.json(
            { error: 'Submission not found or you are not its owner.' },
            { status: 404 },
        );
    }

    return NextResponse.json({ submission: updated, ...buildDashboardPayload() }, { status: 201 });
}
