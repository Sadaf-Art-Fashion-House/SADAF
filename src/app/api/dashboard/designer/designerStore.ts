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

import type {
    DesignCollaborator,
    DesignStatusEvent,
    DesignSubmission,
    NewDesignSubmission,
} from '@/features/designer/types';

const DAY_MS = 86_400_000;

/** The designer whose portfolio these seeds belong to (sandbox user). */
const OWNER_ID = 'usr-4';
const OWNER_NAME = 'Designer Karim';
const OWNER_AVATAR =
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80';

/** Attribution date for a collaborator credited a few days after submission. */
function daysAfter(iso: string, days: number): string {
    return new Date(new Date(iso).getTime() + days * DAY_MS).toISOString();
}

const SEEDED_SUBMISSIONS: DesignSubmission[] = [
    {
        id: 'ds-1',
        title: 'Empress Diwani Abaya Cape',
        category: 'Abaya',
        description: 'Diwani calligraphy flowing across a structured cape silhouette with gold-thread embroidery.',
        imageUrl: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=82',
        galleryImages: [
            { url: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=800&q=82', label: 'Hover Detail' },
            { url: 'https://images.unsplash.com/photo-1561214115-f2f134cc4912?auto=format&fit=crop&w=800&q=82', label: 'Concept Sketch 1' },
            { url: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=800&q=82', label: 'Concept Sketch 2' },
        ],
        status: 'under_review',
        submittedAt: new Date(Date.now() - 2 * DAY_MS).toISOString(),
        price: 2100,
        collaboration: { type: 'solo', ownerId: OWNER_ID, ownerName: OWNER_NAME, ownerAvatarUrl: OWNER_AVATAR, ownerCreditedAt: new Date(Date.now() - 2 * DAY_MS).toISOString(), members: [] },
    },
    {
        id: 'ds-2',
        title: 'Fatimid Star Silk Slip Dress',
        category: 'Dress',
        description: 'Fatimid octagonal stars woven into bias-cut royal silk with a liquid-metal sheen.',
        imageUrl: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=800&q=82',
        galleryImages: [
            { url: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=800&q=82', label: 'Hover Detail' },
            { url: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=82', label: 'Concept Sketch 1' },
        ],
        status: 'approved',
        submittedAt: new Date(Date.now() - 5 * DAY_MS).toISOString(),
        price: 1450,
        adminNote: 'Approved for the Autumn Heritage collection — atelier begins sampling.',
        collaboration: {
            type: 'team',
            ownerId: OWNER_ID,
            ownerName: OWNER_NAME,
            ownerAvatarUrl: OWNER_AVATAR,
            ownerCreditedAt: new Date(Date.now() - 5 * DAY_MS).toISOString(),
            members: [
                { id: 'usr-2', name: 'Karim A.', role: 'Design Lead', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80', creditedAt: new Date(Date.now() - 4 * DAY_MS).toISOString() },
                { id: 'usr-7', name: 'Nadia H.', role: 'Silk & Print Specialist', avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&q=80', creditedAt: new Date(Date.now() - 3 * DAY_MS).toISOString() },
            ],
        },
    },
    {
        id: 'ds-3',
        title: 'Geometric Damascus Jacket',
        category: 'Jacket',
        description: 'Damascus geometric meshes in structured wool-blend with gunmetal hardware.',
        imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=82',
        galleryImages: [
            { url: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=800&q=82', label: 'Hover Detail' },
            { url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=82', label: 'Concept Sketch 1' },
        ],
        status: 'under_review',
        submittedAt: new Date(Date.now() - 6 * DAY_MS).toISOString(),
        price: 1680,
        collaboration: { type: 'solo', ownerId: OWNER_ID, ownerName: OWNER_NAME, ownerAvatarUrl: OWNER_AVATAR, ownerCreditedAt: new Date(Date.now() - 6 * DAY_MS).toISOString(), members: [] },

    },
    {
        id: 'ds-4',
        title: 'Gilded Caliph Streetwear Hoodie',
        category: 'Hoodie',
        description: 'Gold-leaf caliph crest on heavyweight streetwear fleece with tonal branding.',
        imageUrl: 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=800&q=82',
        galleryImages: [
            { url: 'https://images.unsplash.com/photo-1547887538-e3a2f32cb1cc?auto=format&fit=crop&w=800&q=82', label: 'Hover Detail' },
            { url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=82', label: 'Concept Sketch 1' },
            { url: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=800&q=82', label: 'Concept Sketch 2' },
        ],
        status: 'in_production',
        submittedAt: new Date(Date.now() - 12 * DAY_MS).toISOString(),
        price: 890,
        collaboration: {
            type: 'team',
            ownerId: OWNER_ID,
            ownerName: OWNER_NAME,
            ownerAvatarUrl: OWNER_AVATAR,
            ownerCreditedAt: new Date(Date.now() - 12 * DAY_MS).toISOString(),
            members: [
                { id: 'usr-3', name: 'Omar S.', role: 'Streetwear Concept', avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=100&q=80', creditedAt: new Date(Date.now() - 10 * DAY_MS).toISOString() },
                { id: 'usr-8', name: 'Hana Z.', role: 'Graphic & Crest Artist', avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&q=80', creditedAt: new Date(Date.now() - 9 * DAY_MS).toISOString() },
                { id: 'usr-9', name: 'Youssef B.', role: 'Pattern Engineering', avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80', creditedAt: new Date(Date.now() - 8 * DAY_MS).toISOString() },
            ],
        },
    },
    {
        id: 'ds-5',
        title: 'Sands of Al-Muizz Kaftan',
        category: 'Kaftan',
        description: 'Desert-gradient kaftan with hand-piped seams and mother-of-pearl buttons.',
        imageUrl: 'https://images.unsplash.com/photo-1519457431-44ccd64a579b?auto=format&fit=crop&w=800&q=82',
        galleryImages: [
            { url: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=800&q=82', label: 'Hover Detail' },
            { url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=82', label: 'Concept Sketch 1' },
        ],
        status: 'rejected',
        submittedAt: new Date(Date.now() - 20 * DAY_MS).toISOString(),
        price: 1200,
        adminNote: 'Refine the cuff embroidery density and resubmit — the collar drapes beautifully.',
        collaboration: { type: 'solo', ownerId: OWNER_ID, ownerName: OWNER_NAME, ownerAvatarUrl: OWNER_AVATAR, ownerCreditedAt: new Date(Date.now() - 20 * DAY_MS).toISOString(), members: [] },
    },
    {
        id: 'ds-6',
        title: 'Nile Delta Editorial Gown',
        category: 'Editorial',
        description: 'Concept editorial gown exploring delta light through layered organza and silk tulle.',
        imageUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=82',
        galleryImages: [
            { url: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=800&q=82', label: 'Hover Detail' },
            { url: 'https://images.unsplash.com/photo-1561214115-f2f134cc4912?auto=format&fit=crop&w=800&q=82', label: 'Concept Sketch 1' },
            { url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=82', label: 'Concept Sketch 2' },
        ],
        status: 'draft',
        submittedAt: new Date(Date.now() - 1 * DAY_MS).toISOString(),
        price: 3200,
        collaboration: {
            type: 'team',
            ownerId: OWNER_ID,
            ownerName: OWNER_NAME,
            ownerAvatarUrl: OWNER_AVATAR,
            ownerCreditedAt: new Date(Date.now() - 1 * DAY_MS).toISOString(),
            members: [
                { id: 'usr-1', name: 'Layla M.', role: 'Creative Director', avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80', creditedAt: new Date(Date.now() - 1 * DAY_MS).toISOString() },
                { id: 'usr-6', name: 'Dr. Farida H.', role: 'Textile Research', avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80', creditedAt: new Date(Date.now() - 1 * DAY_MS).toISOString() },
                { id: 'usr-10', name: 'Nour E.', role: 'Draping Assistant', avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80', creditedAt: new Date(Date.now() - 1 * DAY_MS).toISOString() },
            ],
        },
    },
];

// ─── Global singleton ───────────────────────────────────────────────────────
// Next.js bundles every route handler separately, so module-level state is
// duplicated per route (the PATCH route would mutate one copy while
// /api/notifications reads another). Hanging the store on globalThis gives
// all route bundles one shared instance inside the same server process.
interface DesignerStoreState {
    submissions: DesignSubmission[];
    statusEvents: DesignStatusEvent[];
    statusEventCounter: number;
}

const globalStore = globalThis as unknown as {
    __sadafDesignerStore?: DesignerStoreState;
};

const store: DesignerStoreState = (globalStore.__sadafDesignerStore ??= {
    submissions: SEEDED_SUBMISSIONS,
    statusEvents: [],
    statusEventCounter: 0,
});

/** Snapshot of the current submissions for the designer portfolio. */
export function getDesignerSubmissions(): DesignSubmission[] {
    return store.submissions;
}

/**
 * Append a newly submitted design and return it. Starts as `draft` — the
 * atelier moves it into `under_review` once reviewed.
 */
export function addDesignerSubmission(input: NewDesignSubmission): DesignSubmission {
    const now = new Date().toISOString();
    const submission: DesignSubmission = {
        id: `ds-${Date.now()}`,
        title: input.title.trim(),
        category: input.category,
        description: input.description.trim(),
        imageUrl: input.imageUrl,
        status: 'draft',
        submittedAt: now,
        price: input.price,
        // The owner is credited from the moment the design is submitted.
        collaboration: {
            type: 'solo',
            ownerId: OWNER_ID,
            ownerName: OWNER_NAME,
            ownerAvatarUrl: OWNER_AVATAR,
            ownerCreditedAt: now,
            members: [],
        },
    };
    store.submissions = [submission, ...store.submissions];
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
    const submission = store.submissions.find((s) => s.id === id);
    if (!submission) return null;

    submission.status = status;
    if (adminNote !== undefined) {
        submission.adminNote = adminNote.trim() || undefined;
    }

    // Team designs notify everyone who worked on the piece (owner +
    // collaborators) when the atelier moves them — recorded here so the WS
    // server can push `notifications:user:{id}` and the REST fallback can
    // merge them into /api/notifications.
    recordStatusEvent(submission, status, adminNote);
    return submission;
}

// ─── Add-only collaborator management (credits model) ───────────────────────
// The collaborator list is an attribution record: the owner adds people who
// worked on the piece and there is deliberately no remove path — removing a
// collaborator would rewrite history. Disputes are resolved by the atelier.

/**
 * Append a collaborator to a submission owned by the given user. Solo
 * projects become team projects when their first collaborator is added.
 * Returns the updated submission, or null when the id is unknown or the
 * caller is not the owner.
 */
export function addDesignerCollaborator(
    id: string,
    ownerId: string,
    collaborator: DesignCollaborator,
): DesignSubmission | null {
    const submission = store.submissions.find((s) => s.id === id);
    if (!submission) return null;
    if (submission.collaboration?.ownerId !== ownerId) return null;
    if (!collaborator.name.trim()) return null;

    // Idempotent by collaborator id — adding the same person twice is a no-op.
    const alreadyListed = submission.collaboration?.members.some(
        (m) => m.id === collaborator.id,
    );
    if (alreadyListed) return submission;

    submission.collaboration = {
        type: 'team',
        ownerId,
        ownerName: submission.collaboration?.ownerName,
        ownerAvatarUrl: submission.collaboration?.ownerAvatarUrl,
        ownerCreditedAt: submission.collaboration?.ownerCreditedAt,
        members: [
            ...(submission.collaboration?.members ?? []),
            // Stamp the attribution date — the credits record is immutable.
            { ...collaborator, creditedAt: new Date().toISOString() },
        ],
    };

    // Tell the new collaborator they were credited — same event stream as
    // the atelier decisions, so the WS server pushes notifications:user:{id}
    // and the REST fallback merges it.
    recordCollaboratorAddedEvent(submission, collaborator.id, collaborator.role);
    return submission;
}

// ─── Status events for team notifications ───────────────────────────────────

function recordStatusEvent(
    submission: DesignSubmission,
    status: DesignSubmission['status'],
    adminNote?: string,
): void {
    const members = submission.collaboration?.members ?? [];
    if (members.length === 0) return;

    const ownerId = submission.collaboration?.ownerId;
    const recipientIds = [
        ...(ownerId ? [ownerId] : []),
        ...members.map((m) => m.id),
    ];
    // Dedupe (the owner may also be listed as a member) while keeping order.
    const unique = Array.from(new Set(recipientIds));

    store.    statusEventCounter += 1;
    store.statusEvents.push({
        id: store.statusEventCounter,
        kind: 'status',
        submissionId: submission.id,
        title: submission.title,
        status,
        adminNote,
        createdAt: new Date().toISOString(),
        recipientIds: unique,
    });
}

/**
 * Record that a person was credited on a design — the recipient is the new
 * collaborator themselves, so they learn they were added.
 */
function recordCollaboratorAddedEvent(
    submission: DesignSubmission,
    collaboratorId: string,
    collaboratorRole: string,
): void {
    store.statusEventCounter += 1;
    store.statusEvents.push({
        id: store.statusEventCounter,
        kind: 'collaborator_added',
        submissionId: submission.id,
        title: submission.title,
        status: submission.status,
        collaboratorRole,
        createdAt: new Date().toISOString(),
        recipientIds: [collaboratorId],
    });
}

/**
 * Events newer than the given cursor — the WS server polls this to push
 * per-recipient notifications in real time.
 */
export function getDesignerStatusEvents(since = 0): DesignStatusEvent[] {
    return store.statusEvents.filter((event) => event.id > since);
}

/**
 * Events that concern the given user, mapped to notification payloads for
 * /api/notifications — the REST fallback shows the same team updates the WS
 * pushes. The map is additive (a user id can appear in many events).
 */
export function getStatusEventsForUser(userId: string): DesignStatusEvent[] {
    return store.statusEvents.filter((event) => event.recipientIds.includes(userId));
}
