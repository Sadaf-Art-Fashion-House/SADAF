import { create } from "zustand";
import type { FashionProduct } from "@/shared/types";
import { createLocalStorageSync } from "@/shared/utils/localStorageSync";

/**
 * The shared wishlist store — separate from useCartStore on purpose.
 * A wishlist is "things the shopper wants to save for later"; a cart is
 * "things the shopper is about to buy". Keeping them as two stores means
 * toggling a favourite never touches cart contents or checkout totals.
 *
 * Persisted to localStorage and kept in sync across tabs via the shared
 * localStorage sync utility (custom window event + native storage event).
 */
export const WISHLIST_STORAGE_KEY = "sadaf_wishlist";
export const WISHLIST_CHANGED_EVENT = "sadaf:wishlist-changed";

const wishlistSync = createLocalStorageSync<FashionProduct[]>(
    WISHLIST_STORAGE_KEY,
    WISHLIST_CHANGED_EVENT
);

interface WishlistState {
    items: FashionProduct[];
    isWishlisted: (productId: string) => boolean;
    toggleWishlist: (product: FashionProduct) => void;
    clearWishlist: () => void;
}

export const useWishlistStore = create<WishlistState>((set, get) => {
    /** Set state + persist in one place so every mutation stays in sync. */
    const commitItems = (items: FashionProduct[]) => {
        set({ items });
        wishlistSync.save(items);
    };

    return {
        items: [],

        isWishlisted: (productId) => get().items.some((item) => item.id === productId),

        toggleWishlist: (product) => {
            const alreadyWishlisted = get().items.some((item) => item.id === product.id);
            commitItems(
                alreadyWishlisted
                    ? get().items.filter((item) => item.id !== product.id)
                    : [...get().items, product]
            );
        },

        clearWishlist: () => commitItems([]),
    };
});

// ── Sync + deferred initial hydration (client only) ──────────────────────────
if (typeof window !== "undefined") {
    const refreshFromStorage = () => {
        const stored = wishlistSync.load();
        if (stored) useWishlistStore.setState({ items: stored });
    };

    // Same-tab (custom event) + cross-tab (native storage event).
    wishlistSync.subscribe(refreshFromStorage);

    // Hydrate after the first paint so the client's initial render matches the
    // server HTML (no hydration mismatch).
    window.setTimeout(refreshFromStorage, 0);
}
