/**
 * SADAF | Reviews Feature — Type Definitions
 */

export interface Review {
    id: string;
    productId: string;
    productName: string;
    productImage: string;
    productHref: string;
    userName: string;
    /** Arabic reviewer display name — falls back to `userName` when absent. */
    userNameAr?: string;
    userAvatar?: string;
    rating: number; // 1–5
    title: string;
    /** Arabic review title — falls back to `title` when absent. */
    titleAr?: string;
    comment: string;
    /** Arabic review comment — falls back to `comment` when absent (user-written reviews have none). */
    commentAr?: string;
    createdAt: string;
    verified: boolean;
    /**
     * Set for reviews written from an order — used to keep one review per
     * delivered order and to mark the order as reviewed in the UI.
     */
    orderId?: string;
    /**
     * True for the signed-in user's own reviews — the /reviews page marks
     * them with a "YOU" badge so the author can find them instantly.
     */
    isMine?: boolean;
    /**
     * Set when the author edits their review — lets the UI show an
     * "Edited" marker instead of the original creation date.
     */
    editedAt?: string;
    /**
     * True for reviews that landed over the reviews:global WebSocket channel
     * during this session (live community reviews) — lets the UI mark them
     * with a "LIVE" chip in the latest-reviews list.
     */
    isLive?: boolean;
}

export type ReviewSortOption = 'newest' | 'highest' | 'lowest';

/** Minimum-star filter for the reviews list — All, 4★ & up, or 3★ & up. */
export type ReviewRatingFilter = 'all' | 'fourPlus' | 'threePlus';

/** Minimum rating per rating filter option. */
export const RATING_FILTER_MIN: Record<ReviewRatingFilter, number> = {
    all: 1,
    fourPlus: 4,
    threePlus: 3,
};
