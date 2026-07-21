/**
 * SADAF | AI Studio — Feature-Specific Types
 *
 * DesignDraft bridges the gap between ephemeral AI Studio designs and
 * published catalog entities (FashionProduct, ArtPiece, Collection).
 *
 * @see AIClothingDesign in @/shared/types — the raw AI output this draft wraps.
 */

import type { AIClothingDesign, FashionProduct, ArtPiece, Collection } from '@/shared/types';

/** Where a DesignDraft is in its lifecycle. */
export type DraftStatus = 'draft' | 'published' | 'archived';

/** Which catalog entity the admin chose to publish a draft as. */
export type PublishTargetType = 'fashion' | 'art' | 'collection';

/**
 * A saved AI Studio design that can later be published as one or more
 * catalog entities. Immutable once saved — publish creates separate records.
 */
export interface DesignDraft {
    /** Unique draft id (auto-generated). */
    id: string;
    /** The original AI output that the user configured. */
    design: AIClothingDesign;
    /** Selected fabric name at time of saving. */
    selectedFabric: string;
    /** Selected printing method at time of saving. */
    selectedPrinting: string;
    /** Timestamp of when the draft was saved. */
    savedAt: string;
    /** Current lifecycle status. */
    status: DraftStatus;
    /** Optional label the admin can assign for organisation. */
    label?: string;
    /** IDs of the published entities created from this draft. */
    publishedEntityIds?: string[];
}

/**
 * Result returned by DesignPublisher after a successful publish.
 */
export interface PublishResult {
    draftId: string;
    targetType: PublishTargetType;
    entityId: string;
    entityName: string;
}

/**
 * Summary view of a draft for the review/publish panel.
 */
export interface DraftSummary {
    id: string;
    patternName: string;
    clothingType: string;
    savedAt: string;
    status: DraftStatus;
    label?: string;
}
