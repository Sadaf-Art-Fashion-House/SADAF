'use client';

/**
 * SADAF | Reviews — Page Client
 *
 * Merges the server-provided catalog reviews with the signed-in user's own
 * reviews (written from the orders page and persisted in localStorage) so
 * they appear at the top of /reviews.
 *
 * The list refreshes the moment a review is written — not just on mount:
 *   - Same tab: the writer dispatches the custom USER_REVIEWS_CHANGED_EVENT.
 *   - Other tabs: the browser fires the native `storage` event automatically.
 * Both listeners re-read localStorage, so a review written in any tab shows
 * up in every open /reviews page instantly. All window access lives in the
 * mount effect — hydration-safe, no window during render.
 */

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import RoleDashboardGuard from '@/shared/components/RoleDashboardGuard';
import ReviewsView from './ReviewsView';
import { getUserReviews, USER_REVIEWS_CHANGED_EVENT } from '../utils/userReviewsStorage';
import type { Review } from '../types';

interface ReviewsPageClientProps {
    reviews: Review[];
}

export default function ReviewsPageClient({ reviews }: ReviewsPageClientProps) {
    const { user } = useAuth();
    const [userReviews, setUserReviews] = useState<Review[]>([]);

    const refreshUserReviews = useCallback(() => {
        setUserReviews(getUserReviews(user?.id ?? ''));
    }, [user?.id]);

    useEffect(() => {
        refreshUserReviews();
        window.addEventListener(USER_REVIEWS_CHANGED_EVENT, refreshUserReviews);
        window.addEventListener('storage', refreshUserReviews);
        return () => {
            window.removeEventListener(USER_REVIEWS_CHANGED_EVENT, refreshUserReviews);
            window.removeEventListener('storage', refreshUserReviews);
        };
    }, [refreshUserReviews]);

    // User-written reviews first (newest), then the catalog reviews. The
    // user's own reviews are flagged so the view can badge them "YOU".
    const mergedReviews = [
        ...userReviews.map((review) => ({ ...review, isMine: true })),
        ...reviews,
    ];

    return (
        <RoleDashboardGuard required="any">
            <ReviewsView reviews={mergedReviews} />
        </RoleDashboardGuard>
    );
}
