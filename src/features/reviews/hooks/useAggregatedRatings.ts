'use client';

/**
 * SADAF | Reviews — Aggregated Product Ratings Hook
 *
 * Computes the combined average rating (catalog mock reviews + the signed-in
 * user's own reviews from localStorage) for a list of catalog items and keeps
 * it live: it refreshes the moment a review is written (custom
 * USER_REVIEWS_CHANGED_EVENT in the writing tab, native `storage` event in
 * other tabs) — the same sync pattern as the PDP and /reviews pages. All
 * localStorage/window access happens in the mount effect (hydration-safe).
 *
 * Used by the /store catalog and /search product cards so every product shows
 * the same aggregated score as its product detail page.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { getUserReviews, USER_REVIEWS_CHANGED_EVENT } from '@/features/reviews/utils/userReviewsStorage';
import { averageRatingForProduct } from '@/features/reviews/utils/reviewRatings';
import type { Review } from '@/features/reviews/types';

export interface RatingSummary {
    average: number;
    count: number;
}

/** productId → aggregated rating, or null when the product has no reviews yet. */
export type RatingsByProduct = Record<string, RatingSummary | null>;

/**
 * @param items        Catalog items keyed by id, matched by id OR name.
 * @param mockReviews  Seeded catalog reviews (fetched server-side).
 * @param liveReviews  Community reviews that landed over the reviews:global
 *                     WebSocket channel — merged into the average so scores
 *                     move in real time (pass the output of useLiveRatings).
 */
export function useAggregatedRatings(
    items: { id: string; name: string }[],
    mockReviews: Review[],
    liveReviews: Review[] = [],
): RatingsByProduct {
    const { user } = useAuth();

    // Live reviews live in a ref so `refresh` keeps a stable identity across
    // WS pushes (no endless listener re-subscription); a separate effect
    // below re-runs refresh the moment a new live review lands.
    const liveReviewsRef = useRef(liveReviews);
    liveReviewsRef.current = liveReviews;

    // Stable identities by CONTENT, not reference. Callers commonly map
    // inline (products.map(...) / getMockReviews() on every render), so the
    // arrays arrive as fresh references each render; keying the memo on the
    // reference alone would give refresh a new identity every render and the
    // mount effect below would re-run endlessly — the "Maximum update depth
    // exceeded" loop seen on /store. The serialized signatures below only
    // change when the actual data changes.
    const itemsKey = items
        .map((item) => `${item.id}\u0000${item.name}`)
        .join('\u0001');
    const itemList = useMemo(
        () => items,
        // eslint-disable-next-line react-hooks/exhaustive-deps -- content signature, see above
        [itemsKey],
    );

    const reviewsKey = JSON.stringify(mockReviews);
    const reviews = useMemo(
        () => mockReviews,
        // eslint-disable-next-line react-hooks/exhaustive-deps -- content signature, see above
        [reviewsKey],
    );

    const [ratings, setRatings] = useState<RatingsByProduct>({});

    const refresh = useCallback(() => {
        const userReviews = getUserReviews(user?.id ?? '');
        const combined = [...reviews, ...liveReviewsRef.current, ...userReviews];
        const next: RatingsByProduct = {};
        for (const item of itemList) {
            next[item.id] = averageRatingForProduct(combined, item.id, item.name);
        }
        setRatings(next);
    }, [user?.id, reviews, itemList]);

    useEffect(() => {
        refresh();
        window.addEventListener(USER_REVIEWS_CHANGED_EVENT, refresh);
        window.addEventListener('storage', refresh);
        return () => {
            window.removeEventListener(USER_REVIEWS_CHANGED_EVENT, refresh);
            window.removeEventListener('storage', refresh);
        };
    }, [refresh]);

    // Recompute the averages when a live review lands over WS — no listener
    // churn, just a refresh (refresh reads liveReviews via the ref).
    useEffect(() => {
        refresh();
    }, [refresh, liveReviews]);

    return ratings;
}
