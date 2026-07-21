'use client';

import { useWishlistStore } from '@/features/wishlist/store/useWishlistStore';
import { useCartStore } from '@/features/cart/store/useCartStore';
import WishlistView from './WishlistView';
import type { FashionProduct } from '@/shared/types';

export default function WishlistPageClient() {
    const items = useWishlistStore((state) => state.items);
    const toggleWishlist = useWishlistStore((state) => state.toggleWishlist);

    const cartItems = useCartStore((state) => state.items);
    const addFashionToCart = useCartStore((state) => state.addFashionToCart);

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
            isInCart={isInCart}
            onToggleWishlist={handleToggleWishlist}
            onAddToCart={handleAddToCart}
        />
    );
}
