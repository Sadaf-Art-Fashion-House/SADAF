'use client';

import { useWishlistStore } from '@/features/wishlist/store/useWishlistStore';
import { useCartStore } from '@/features/cart/store/useCartStore';
import { useAggregatedRatings } from '@/features/reviews/hooks/useAggregatedRatings';
import { useLiveRatings } from '@/features/reviews/hooks/useLiveRatings';
import WishlistView from './WishlistView';
import type { FashionProduct } from '@/shared/types';
import type { Review } from '@/features/reviews/types';

interface WishlistPageClientProps {
    /** Catalog (mock) reviews — merged with the user's own client-side. */
    mockReviews: Review[];
}

export default function WishlistPageClient({ mockReviews }: WishlistPageClientProps) {
    const items = useWishlistStore((state) => state.items);
    const toggleWishlist = useWishlistStore((state) => state.toggleWishlist);

    const cartItems = useCartStore((state) => state.items);
    const addFashionToCart = useCartStore((state) => state.addFashionToCart);

    // Aggregated card ratings (mock catalog reviews + the user's own),
    // live-synced and merged with community reviews landing over the
    // reviews:global WebSocket channel — same pattern as /store and /search.
    const { liveReviews, wsLive, lastLive } = useLiveRatings();
    const ratingsByProduct = useAggregatedRatings(
        items.map((item) => ({ id: item.id, name: item.name })),
        mockReviews,
        liveReviews,
    );

    const isInCart = (productId: string) =>
        cartItems.some(
            (item) => item.itemType === 'product' && item.product?.id === productId
        );

    const handleToggleWishlist = (product: FashionProduct) => {
        toggleWishlist(product);
    };

    const handleAddToCart = (product: FashionProduct) => {
        // Add with default size and color (first available)
        const size = product.sizes[0] || 'M';
        const color = product.colors[0]?.name || 'Default';
        addFashionToCart(product, size, color);
    };

    return (
        <WishlistView
            items={items}
            ratingsByProduct={ratingsByProduct}
            wsLive={wsLive}
            lastLiveProductId={lastLive?.review.productId ?? null}
            lastLiveAt={lastLive?.at ?? null}
            isInCart={isInCart}
            onToggleWishlist={handleToggleWishlist}
            onAddToCart={handleAddToCart}
        />
    );
}
