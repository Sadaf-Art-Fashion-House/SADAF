"use client";

import StoreView from "./StoreView";
import { useCartStore } from "@/features/cart/store/useCartStore";
import { useWishlistStore } from "@/features/wishlist/store/useWishlistStore";
import { useAggregatedRatings } from "@/features/reviews/hooks/useAggregatedRatings";
import type { FashionProduct } from "@/shared/types";
import type { Review } from "@/features/reviews/types";

interface MarketplacePageClientProps {
    products: FashionProduct[];
    mockReviews: Review[];
}

export default function MarketplacePageClient({ products, mockReviews }: MarketplacePageClientProps) {
    const cartItems = useCartStore((state) => state.items);
    const addFashionToCart = useCartStore((state) => state.addFashionToCart);
    const removeFromCart = useCartStore((state) => state.removeFromCart);
    const clearCart = useCartStore((state) => state.clearCart);

    const isWishlisted = useWishlistStore((state) => state.isWishlisted);
    const toggleWishlist = useWishlistStore((state) => state.toggleWishlist);

    // Aggregated card ratings (mock catalog reviews + the user's own), live-synced.
    const ratingsByProduct = useAggregatedRatings(
        products.map((product) => ({ id: product.id, name: product.name })),
        mockReviews,
    );

    const handleAddToCart = (product: FashionProduct, size: string, color: string) => {
        addFashionToCart(product, size, color);
    };

    const handleRemoveFromCart = (cartLineId: string) => {
        removeFromCart(cartLineId);
    };

    const handleToggleWishlist = (product: FashionProduct) => {
        toggleWishlist(product);
    };

    // TODO: Replace with a real checkout flow (Checkout feature — not yet
    // migrated) once it exists. For now this confirms the order and empties
    // the cart, matching the Vite prototype's behavior.
    const handleCheckout = (total: number, couponCode: string) => {
        console.log(`Checkout confirmed for $${total.toLocaleString()}`, { couponCode });
        clearCart();
    };

    return (
        <StoreView
            products={products}
            cartItems={cartItems}
            ratingsByProduct={ratingsByProduct}
            isWishlisted={isWishlisted}
            onAddToCart={handleAddToCart}
            onRemoveFromCart={handleRemoveFromCart}
            onToggleWishlist={handleToggleWishlist}
            onCheckout={handleCheckout}
        />
    );
}
