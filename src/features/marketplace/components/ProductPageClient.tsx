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

import { useCallback, useEffect, useState } from 'react';
import { useCartStore } from '@/features/cart/store/useCartStore';
import { useWishlistStore } from '@/features/wishlist/store/useWishlistStore';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { getUserReviews, USER_REVIEWS_CHANGED_EVENT } from '@/features/reviews/utils/userReviewsStorage';
import { averageRatingForProduct } from '@/features/reviews/utils/reviewRatings';
import ProductView from './ProductView';
import type { FashionProduct } from '@/shared/types';
import type { Review } from '@/features/reviews/types';

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

    // ── Rating summary: catalog reviews + the user's own, live-synced ──
    const [ratingSummary, setRatingSummary] = useState<{ average: number; count: number } | null>(null);

    const refreshRating = useCallback(() => {
        const userReviews = getUserReviews(user?.id ?? '');
        const combined = [...mockReviews, ...userReviews];
        setRatingSummary(averageRatingForProduct(combined, product.id, product.name));
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

    const handleAddToCart = useCallback(
        (size: string, color: string) => {
            addFashionToCart(product, size, color);
        },
        [addFashionToCart, product],
    );

    const handleToggleWishlist = useCallback(() => {
        toggleWishlist(product);
    }, [toggleWishlist, product]);

    return (
        <ProductView
            product={product}
            relatedProducts={relatedProducts}
            ratingSummary={ratingSummary}
            isWishlisted={isWishlisted(product.id)}
            onAddToCart={handleAddToCart}
            onToggleWishlist={handleToggleWishlist}
        />
    );
}
