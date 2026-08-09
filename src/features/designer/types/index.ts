/**
 * SADAF | Designer — Feature-Specific Types
 *
 * DesignSubmission models a design the designer submitted to the atelier
 * for review/production. The status lifecycle is:
 *   draft → under_review → approved → in_production
 *                     ↘ rejected (with adminNote feedback)
 */

/** Where a submitted design sits in the atelier review pipeline. */
export type DesignStatus = 'draft' | 'under_review' | 'approved' | 'in_production' | 'rejected';

/** Product families a designer can submit work for. */
export type DesignCategory = 'Abaya' | 'Hoodie' | 'Jacket' | 'Dress' | 'Kaftan' | 'Editorial';

/** A collaborator on a team design project. */
export interface DesignCollaborator {
    id: string;
    name: string;
    role: string;
    avatarUrl?: string;
    /** When this person was credited on the piece (attribution record). */
    creditedAt?: string;
}

/**
 * Solo vs team — team projects list their collaborators.
 *
 * The collaboration list is an ATTRIBUTION record (credits model), not an
 * access list: members are people who worked on the piece. That is why it
 * is add-only — `ownerId` (the submitting designer) is immutable and there
 * is deliberately no remove path; the atelier resolves disputes via review.
 */
export interface DesignCollaboration {
    type: 'solo' | 'team';
    /** The submitting designer — fixed at creation, never changes. */
    ownerId: string;
    /** Owner display name/avatar — the owner is always a credited participant. */
    ownerName?: string;
    ownerAvatarUrl?: string;
    /** When the owner was credited — the submission date (they create the
     * attribution record when the design is submitted). */
    ownerCreditedAt?: string;
    members: DesignCollaborator[];
}

/** One extra labeled view of a design (hover/alternate + concept sketches). */
export interface DesignGalleryImage {
    url: string;
    /** Shown under the thumbnail, e.g. 'Hover Detail' or 'Concept Sketch 2'. */
    label: string;
}

/** A single design submission shown in the designer portfolio. */
export interface DesignSubmission {
    /** Unique submission id (auto-generated). */
    id: string;
    /** Designer-facing title of the piece. */
    title: string;
    /** Product family this design targets. */
    category: DesignCategory;
    /** Short description of the design concept. */
    description: string;
    /** Preview image (uploaded data URL or a catalog image for seeded pieces). */
    imageUrl?: string;
    /** Extra labeled views shown in the project detail gallery. */
    galleryImages?: DesignGalleryImage[];
    /** Current pipeline status. */
    status: DesignStatus;
    /** ISO timestamp of when the designer submitted it. */
    submittedAt: string;
    /** Retail price in USD. */
    price: number;
    /** Atelier feedback — set when rejected (and optionally on approval). */
    adminNote?: string;
    /** Solo or team project — team projects show their collaborators. */
    collaboration?: DesignCollaboration;
}

/** What kind of atelier/team event was recorded. */
export type DesignerEventKind = 'status' | 'collaborator_added';

/**
 * An atelier or team event recorded for notification — the WS server polls
 * these and pushes one notification per recipient, and /api/notifications
 * merges them into the REST fallback.
 */
export interface DesignStatusEvent {
    /** Monotonically increasing cursor — clients poll with `since` this id. */
    id: number;
    /** 'status' = pipeline change (owner + collaborators);
     *  'collaborator_added' = a new person was credited (that person only). */
    kind: DesignerEventKind;
    submissionId: string;
    title: string;
    status: DesignStatus;
    /** Collaborator role for 'collaborator_added' events. */
    collaboratorRole?: string;
    adminNote?: string;
    createdAt: string;
    /** Everyone who should be told. */
    recipientIds: string[];
}

/** Aggregated dashboard payload returned by /api/dashboard/designer. */
export interface DesignerDashboardData {
    submissions: DesignSubmission[];
    stats: {
        total: number;
        underReview: number;
        approved: number;
        inProduction: number;
        rejected: number;
    };
}

/** Payload for submitting a new design (title + category are required). */
export interface NewDesignSubmission {
    title: string;
    category: DesignCategory;
    description: string;
    price: number;
    imageUrl?: string;
}
