"use client";

import StoreView from "./StoreView";
import { useCartStore } from "@/features/cart/store/useCartStore";
import { useWishlistStore } from "@/features/wishlist/store/useWishlistStore";
import type { FashionProduct } from "@/shared/types";

interface MarketplacePageClientProps {
    products: FashionProduct[];
}

export default function MarketplacePageClient({ products }: MarketplacePageClientProps) {
    const cartItems = useCartStore((state) => state.items);
    const addFashionToCart = useCartStore((state) => state.addFashionToCart);
    const removeFromCart = useCartStore((state) => state.removeFromCart);
    const clearCart = useCartStore((state) => state.clearCart);

    const isWishlisted = useWishlistStore((state) => state.isWishlisted);
    const toggleWishlist = useWishlistStore((state) => state.toggleWishlist);

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
            isWishlisted={isWishlisted}
            onAddToCart={handleAddToCart}
            onRemoveFromCart={handleRemoveFromCart}
            onToggleWishlist={handleToggleWishlist}
            onCheckout={handleCheckout}
        />
    );
}
