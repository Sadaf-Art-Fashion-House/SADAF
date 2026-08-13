'use client';

/**
 * SADAF | Marketplace — Product Detail Page Client
 *
 * Wires the shared cart + wishlist stores and the rating summary to the
 * presentational ProductView. The rating merges the catalog (mock) reviews
 * with the signed-in user's own reviews from localStorage and refreshes the
 * moment a review is written (custom USER_REVIEWS_CHANGED_EVENT in the
 * writing tab, native `storage` event in other tabs) — same sync pattern as
 * the /reviews page. All window access lives in the mount effect.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useCartStore } from '@/features/cart/store/useCartStore';
import { useWishlistStore } from '@/features/wishlist/store/useWishlistStore';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useLiveRatings } from '@/features/reviews/hooks/useLiveRatings';
import {
    getUserReviews,
    saveUserReview,
    hasReviewForProduct,
    findUserReviewForProduct,
    updateUserReview,
    deleteUserReview,
    USER_REVIEWS_CHANGED_EVENT,
} from '@/features/reviews/utils/userReviewsStorage';
import { averageRatingForProduct, reviewsForProduct } from '@/features/reviews/utils/reviewRatings';
import { titleForRating } from '@/features/reviews/utils/titleForRating';
import { useAggregatedRatings } from '@/features/reviews/hooks/useAggregatedRatings';
import ProductView from './ProductView';
import type { FashionProduct } from '@/shared/types';
import type { Review } from '@/features/reviews/types';
import { ROUTES } from '@/config/routes';

/** Star-level counts (index 0 = 1★ … index 4 = 5★) for the distribution bars. */
export type RatingCounts = [number, number, number, number, number];

interface ProductPageClientProps {
    product: FashionProduct;
    relatedProducts: FashionProduct[];
    mockReviews: Review[];
}

export default function ProductPageClient({
    product,
    relatedProducts,
    mockReviews,
}: ProductPageClientProps) {
    const { user } = useAuth();
    const addFashionToCart = useCartStore((state) => state.addFashionToCart);
    const isWishlisted = useWishlistStore((state) => state.isWishlisted);
    const toggleWishlist = useWishlistStore((state) => state.toggleWishlist);

    // Community reviews landing over the reviews:global WebSocket channel —
    // merged into the rating below so the average, count and latest-reviews
    // list move in real time (see liveReviewsRef usage in refreshRating).
    const { liveReviews, wsLive, lastLive } = useLiveRatings();
    const liveReviewsRef = useRef(liveReviews);
    liveReviewsRef.current = liveReviews;

    // Aggregated ratings for the related-product cards (mock + user reviews),
    // live-synced — same pattern as the /store and /search cards.
    const relatedRatings = useAggregatedRatings(
        relatedProducts.map((related) => ({ id: related.id, name: related.name })),
        mockReviews,
    );

    // ── Rating: summary + star distribution + latest reviews, live-synced ──
    const [ratingSummary, setRatingSummary] = useState<{ average: number; count: number } | null>(null);
    const [ratingCounts, setRatingCounts] = useState<RatingCounts>([0, 0, 0, 0, 0]);
    // Full newest-first review list for this product (mock + user) — the
    // view slices it for the collapsed card and can expand to show all.
    const [reviews, setReviews] = useState<Review[]>([]);
    const [hasReviewedProduct, setHasReviewedProduct] = useState(false);
    const [myReview, setMyReview] = useState<Review | null>(null);

    const refreshRating = useCallback(() => {
        const userReviews = getUserReviews(user?.id ?? '');
        const combined = [...mockReviews, ...liveReviewsRef.current, ...userReviews];
        const matches = reviewsForProduct(combined, product.id, product.name);

        setRatingSummary(averageRatingForProduct(combined, product.id, product.name));

        const counts: RatingCounts = [0, 0, 0, 0, 0];
        for (const review of matches) {
            counts[review.rating - 1]++;
        }
        setRatingCounts(counts);

        const newestFirst = [...matches].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        setReviews(newestFirst);

        // One review per product per user — flip the UI to the "already
        // reviewed" state the moment their review exists (same-tab submit
        // or another tab's storage sync).
        setHasReviewedProduct(hasReviewForProduct(product.id, product.name, user?.id ?? ''));
        setMyReview(findUserReviewForProduct(product.id, product.name, user?.id ?? ''));
    }, [user?.id, mockReviews, product.id, product.name]);

    useEffect(() => {
        refreshRating();
        window.addEventListener(USER_REVIEWS_CHANGED_EVENT, refreshRating);
        window.addEventListener('storage', refreshRating);
        return () => {
            window.removeEventListener(USER_REVIEWS_CHANGED_EVENT, refreshRating);
            window.removeEventListener('storage', refreshRating);
        };
    }, [refreshRating]);

    // Recompute the rating the moment a live review lands over WS — no
    // listener churn (refreshRating reads liveReviews via the ref).
    useEffect(() => {
        refreshRating();
    }, [refreshRating, liveReviews]);

    const handleAddToCart = useCallback(
        (size: string, color: string) => {
            addFashionToCart(product, size, color);
        },
        [addFashionToCart, product],
    );

    const handleToggleWishlist = useCallback(() => {
        toggleWishlist(product);
    }, [toggleWishlist, product]);

    // ── Write a review straight from the PDP ──
    // Persists via the shared per-user storage (same as the orders page);
    // the save dispatches USER_REVIEWS_CHANGED_EVENT, so the rating summary
    // and the latest-reviews list above refresh the moment it lands.
    const handleReviewSubmit = useCallback(
        async (rating: number, comment: string): Promise<{ ok: boolean; error?: string }> => {
            try {
                if (!user) {
                    return { ok: false, error: 'Sign in to write a review.' };
                }

                const review: Review = {
                    id: `user-review-${Date.now()}`,
                    productId: product.id,
                    productName: product.name,
                    productImage: product.image,
                    productHref: `${ROUTES.STORE}/${product.id}`,
                    userName: user.fullName ?? 'SADAF Client',
                    userAvatar: user.avatarUrl,
                    rating,
                    title: titleForRating(rating),
                    comment,
                    createdAt: new Date().toISOString(),
                    verified: false,
                };

                saveUserReview(review, user.id);
                return { ok: true };
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : 'Could not save your review';
                return { ok: false, error: message };
            }
        },
        [user, product.id, product.name, product.image],
    );

    // ── Edit the user's own review straight from the PDP ──
    // Finds the author's existing review for this product, stamps the edits
    // on top of it (id/createdAt preserved), and dispatches the same change
    // event — so the rating summary, the review card and /reviews all
    // refresh the moment the update lands.
    // ── Delete the user's own review straight from the PDP ──
    // Removes their review for this product by id and dispatches the same
    // change event — the rating summary, the review card and /reviews all
    // refresh the moment it lands, and the "You reviewed this piece" state
    // flips back to the "Write a Review" button.
    const handleReviewDelete = useCallback(
        async (reviewId: string): Promise<{ ok: boolean; error?: string }> => {
            try {
                if (!user) {
                    return { ok: false, error: 'Sign in to delete a review.' };
                }
                deleteUserReview(reviewId, user.id);
                return { ok: true };
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : 'Could not delete your review';
                return { ok: false, error: message };
            }
        },
        [user],
    );

    const handleReviewUpdate = useCallback(
        async (rating: number, comment: string): Promise<{ ok: boolean; error?: string }> => {
            try {
                if (!user) {
                    return { ok: false, error: 'Sign in to edit a review.' };
                }

                const existing = findUserReviewForProduct(product.id, product.name, user.id);
                if (!existing) {
                    return { ok: false, error: 'Could not find your review for this piece.' };
                }

                updateUserReview(
                    {
                        ...existing,
                        rating,
                        title: titleForRating(rating),
                        comment,
                    },
                    user.id,
                );
                return { ok: true };
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : 'Could not update your review';
                return { ok: false, error: message };
            }
        },
        [user, product.id, product.name],
    );

    return (
        <ProductView
            product={product}
            relatedProducts={relatedProducts}
            relatedRatings={relatedRatings}
            ratingSummary={ratingSummary}
            ratingCounts={ratingCounts}
            reviews={reviews}
            wsLive={wsLive}
            lastLiveProductId={lastLive?.review.productId ?? null}
            lastLiveAt={lastLive?.at ?? null}
            hasReviewedProduct={hasReviewedProduct}
            myReview={myReview}
            isWishlisted={isWishlisted(product.id)}
            onAddToCart={handleAddToCart}
            onToggleWishlist={handleToggleWishlist}
            onSubmitReview={handleReviewSubmit}
            onUpdateReview={handleReviewUpdate}
            onDeleteReview={handleReviewDelete}
        />
    );
}
