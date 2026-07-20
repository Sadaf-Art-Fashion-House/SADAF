import { create } from "zustand";
import type { FashionProduct } from "@/shared/types";

/**
 * The shared wishlist store — separate from useCartStore on purpose.
 * A wishlist is "things the shopper wants to save for later"; a cart is
 * "things the shopper is about to buy". Keeping them as two stores means
 * toggling a favourite never touches cart contents or checkout totals.
 */
interface WishlistState {
    items: FashionProduct[];
    isWishlisted: (productId: string) => boolean;
    toggleWishlist: (product: FashionProduct) => void;
    clearWishlist: () => void;
}

export const useWishlistStore = create<WishlistState>((set, get) => ({
    items: [],

    isWishlisted: (productId) => get().items.some((item) => item.id === productId),

    toggleWishlist: (product) =>
        set((state) => {
            const alreadyWishlisted = state.items.some((item) => item.id === product.id);
            return {
                items: alreadyWishlisted
                    ? state.items.filter((item) => item.id !== product.id)
                    : [...state.items, product],
            };
        }),

    clearWishlist: () => set({ items: [] }),
}));
