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
    /** Resized preview image (data URL) when the designer uploaded one. */
    imageUrl?: string;
    /** Current pipeline status. */
    status: DesignStatus;
    /** ISO timestamp of when the designer submitted it. */
    submittedAt: string;
    /** Retail price in USD. */
    price: number;
    /** Atelier feedback — set when rejected (and optionally on approval). */
    adminNote?: string;
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
