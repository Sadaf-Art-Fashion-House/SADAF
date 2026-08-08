/**
 * SADAF | Reviews — User-Submitted Review Storage (localStorage)
 *
 * Reviews written from the orders page are persisted per signed-in user so
 * they survive reloads, stay private to their author, and appear merged into
 * the /reviews page (which reads them via the same helpers). Swap for a real
 * API/DB write once the backend is wired — the callers keep working because
 * they read the same list.
 *
 * Sync between open tabs:
 *   - The tab that saves dispatches a custom window event
 *     (USER_REVIEWS_CHANGED_EVENT) so same-tab listeners refresh the moment
 *     a review is written.
 *   - Other tabs pick the change up via the native `storage` event the
 *     browser fires automatically when localStorage changes.
 */

import type { Review } from '../types';

const USER_REVIEWS_KEY_PREFIX = 'sadaf_user_reviews';
/** Legacy global key (pre user-scoping) — migrated once on first read. */
const LEGACY_USER_REVIEWS_KEY = 'sadaf_user_reviews';

/**
 * Custom window event fired right after a review is persisted. The /reviews
 * page listens for it and re-reads localStorage, so a review written in one
 * tab shows up immediately in any open /reviews page.
 */
export const USER_REVIEWS_CHANGED_EVENT = 'sadaf:user-reviews-changed';

function userReviewsKey(userId: string): string {
    return `${USER_REVIEWS_KEY_PREFIX}:${userId}`;
}

/**
 * One-time migration of reviews stored under the old global key into the
 * current user's key (sandbox data written before per-user scoping). Safe to
 * call on every read — it no-ops once the legacy key is gone.
 */
function migrateLegacyReviews(userId: string): void {
    try {
        const legacy = window.localStorage.getItem(LEGACY_USER_REVIEWS_KEY);
        if (!legacy) return;
        const parsed = JSON.parse(legacy) as Review[];
        if (Array.isArray(parsed) && parsed.length > 0) {
            window.localStorage.setItem(userReviewsKey(userId), JSON.stringify(parsed));
        }
        window.localStorage.removeItem(LEGACY_USER_REVIEWS_KEY);
    } catch {
        // Best-effort migration of demo data — never breaks the read.
    }
}

/** All reviews written by the given user, newest first. Guests get []. */
export function getUserReviews(userId: string): Review[] {
    if (!userId) return [];
    try {
        migrateLegacyReviews(userId);
        const stored = window.localStorage.getItem(userReviewsKey(userId));
        if (!stored) return [];
        const parsed = JSON.parse(stored) as Review[];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

/** Whether the user already reviewed the given order id. */
export function hasReviewForOrder(orderId: string, userId: string): boolean {
    return getUserReviews(userId).some((review) => review.orderId === orderId);
}

/**
 * Persist a new user review (prepended) and notify listeners via the custom
 * window event. Requires a signed-in user — reviews are never saved for
 * guests (errors are surfaced to the caller, never swallowed).
 */
export function saveUserReview(review: Review, userId: string): void {
    if (!userId) {
        throw new Error('Sign in to save a review.');
    }
    const reviews = getUserReviews(userId);
    window.localStorage.setItem(userReviewsKey(userId), JSON.stringify([review, ...reviews]));
    window.dispatchEvent(new CustomEvent(USER_REVIEWS_CHANGED_EVENT));
}
