"use client";

import FashionView from "./FashionView";
import { useCartStore } from "@/features/cart/store/useCartStore";
import { useWishlistStore } from "@/features/wishlist/store/useWishlistStore";
import type { FashionProduct, LookbookItem } from "@/shared/types";

interface FashionPageClientProps {
    products: FashionProduct[];
    lookbookItems: LookbookItem[];
    /** Optional category from the ?category= URL param (e.g. Smart Offers "View Offer" links). */
    initialCategory?: string;
}

export default function FashionPageClient({ products, lookbookItems, initialCategory }: FashionPageClientProps) {
    const addFashionToCart = useCartStore((state) => state.addFashionToCart);
    const isWishlisted = useWishlistStore((state) => state.isWishlisted);
    const toggleWishlist = useWishlistStore((state) => state.toggleWishlist);

    const handleAddToCart = (product: FashionProduct, size: string, color: string) => {
        addFashionToCart(product, size, color);
    };

    const handleAddToWishlist = (product: FashionProduct) => {
        toggleWishlist(product);
    };

    return (
        <FashionView
            products={products}
            lookbookItems={lookbookItems}
            initialCategory={initialCategory}
            isWishlisted={isWishlisted}
            onAddToCart={handleAddToCart}
            onAddToWishlist={handleAddToWishlist}
        />
    );
}
