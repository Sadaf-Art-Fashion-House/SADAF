/**
 * SADAF | API — Designer Submissions Store (in-memory)
 *
 * Mutable source of truth for the Designer Dashboard portfolio. The GET
 * route reads it; the POST route (submit) appends to it, so a new
 * submission appears immediately and the 10s WS push (designer:global)
 * keeps every connected designer client in sync.
 *
 * Seeded with designs in every pipeline state so the status chips and the
 * KPI counters are meaningful during development. Swap for a Prisma/database
 * table in production (state resets on server restart, like the other demo
 * stores).
 */

import type { DesignSubmission, NewDesignSubmission } from '@/features/designer/types';

const DAY_MS = 86_400_000;

const SEEDED_SUBMISSIONS: DesignSubmission[] = [
    {
        id: 'ds-1',
        title: 'Empress Diwani Abaya Cape',
        category: 'Abaya',
        description: 'Diwani calligraphy flowing across a structured cape silhouette with gold-thread embroidery.',
        status: 'under_review',
        submittedAt: new Date(Date.now() - 2 * DAY_MS).toISOString(),
        price: 2100,
    },
    {
        id: 'ds-2',
        title: 'Fatimid Star Silk Slip Dress',
        category: 'Dress',
        description: 'Fatimid octagonal stars woven into bias-cut royal silk with a liquid-metal sheen.',
        status: 'approved',
        submittedAt: new Date(Date.now() - 5 * DAY_MS).toISOString(),
        price: 1450,
        adminNote: 'Approved for the Autumn Heritage collection — atelier begins sampling.',
    },
    {
        id: 'ds-3',
        title: 'Geometric Damascus Jacket',
        category: 'Jacket',
        description: 'Damascus geometric meshes in structured wool-blend with gunmetal hardware.',
        status: 'under_review',
        submittedAt: new Date(Date.now() - 6 * DAY_MS).toISOString(),
        price: 1680,
    },
    {
        id: 'ds-4',
        title: 'Gilded Caliph Streetwear Hoodie',
        category: 'Hoodie',
        description: 'Gold-leaf caliph crest on heavyweight streetwear fleece with tonal branding.',
        status: 'in_production',
        submittedAt: new Date(Date.now() - 12 * DAY_MS).toISOString(),
        price: 890,
    },
    {
        id: 'ds-5',
        title: 'Sands of Al-Muizz Kaftan',
        category: 'Kaftan',
        description: 'Desert-gradient kaftan with hand-piped seams and mother-of-pearl buttons.',
        status: 'rejected',
        submittedAt: new Date(Date.now() - 20 * DAY_MS).toISOString(),
        price: 1200,
        adminNote: 'Refine the cuff embroidery density and resubmit — the collar drapes beautifully.',
    },
    {
        id: 'ds-6',
        title: 'Nile Delta Editorial Gown',
        category: 'Editorial',
        description: 'Concept editorial gown exploring delta light through layered organza and silk tulle.',
        status: 'draft',
        submittedAt: new Date(Date.now() - 1 * DAY_MS).toISOString(),
        price: 3200,
    },
];

let submissions: DesignSubmission[] = SEEDED_SUBMISSIONS;

/** Snapshot of the current submissions for the designer portfolio. */
export function getDesignerSubmissions(): DesignSubmission[] {
    return submissions;
}

/**
 * Append a newly submitted design and return it. Starts as `draft` — the
 * atelier moves it into `under_review` once reviewed.
 */
export function addDesignerSubmission(input: NewDesignSubmission): DesignSubmission {
    const submission: DesignSubmission = {
        id: `ds-${Date.now()}`,
        title: input.title.trim(),
        category: input.category,
        description: input.description.trim(),
        imageUrl: input.imageUrl,
        status: 'draft',
        submittedAt: new Date().toISOString(),
        price: input.price,
    };
    submissions = [submission, ...submissions];
    return submission;
}

/**
 * Move a submission through the pipeline (admin atelier review). Returns
 * the updated submission, or null when the id is unknown. `adminNote` is
 * stored for the designer — the atelier uses it when approving or rejecting.
 */
export function updateDesignerSubmissionStatus(
    id: string,
    status: DesignSubmission['status'],
    adminNote?: string,
): DesignSubmission | null {
    const submission = submissions.find((s) => s.id === id);
    if (!submission) return null;

    submission.status = status;
    if (adminNote !== undefined) {
        submission.adminNote = adminNote.trim() || undefined;
    }
    return submission;
}
