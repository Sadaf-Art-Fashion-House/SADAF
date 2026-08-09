import { create } from "zustand";
import type { AIClothingDesign, ArtPiece, CartItem, FashionProduct } from "@/shared/types";
import { createLocalStorageSync } from "@/shared/utils/localStorageSync";

/** Base custom-design price offset until AI Studio pricing is wired to a real quote engine. */
const DEFAULT_CUSTOM_DESIGN_PRICE = 680;

export const CART_STORAGE_KEY = "sadaf_cart";
export const CART_CHANGED_EVENT = "sadaf:cart-changed";

/** Persistence + cross-tab sync (custom window event + native storage event). */
const cartSync = createLocalStorageSync<CartItem[]>(CART_STORAGE_KEY, CART_CHANGED_EVENT);

interface CartState {
    items: CartItem[];

    /**
     * Adds (or increments an existing) fashion product line.
     * Two lines are considered the same product only if id, size, and color
     * all match — matching how the storefront lets a shopper hold the same
     * garment in multiple sizes/colors as separate lines.
     */
    addFashionToCart: (product: FashionProduct, size: string, color: string) => void;

    /**
     * Adds a fine-art piece. Art pieces are one-of-a-kind, so a piece already
     * in the cart cannot be added again — the caller should surface that to
     * the shopper (see MarketplacePageClient / ArtworksPageClient).
     */
    addArtToCart: (art: ArtPiece) => "added" | "already-in-cart";

    /** Adds an AI Studio custom design as its own cart line. */
    addCustomDesignToCart: (design: AIClothingDesign, size: string) => void;

    removeFromCart: (cartLineId: string) => void;
    updateQuantity: (cartLineId: string, quantity: number) => void;
    clearCart: () => void;

    getTotalItems: () => number;
    getSubtotal: () => number;
}

export const useCartStore = create<CartState>((set, get) => {
    /** Set state + persist in one place so every mutation stays in sync. */
    const commitItems = (items: CartItem[]) => {
        set({ items });
        cartSync.save(items);
    };

    return {
        items: [],

        addFashionToCart: (product, size, color) => {
            const current = get().items;
            const existingIndex = current.findIndex(
                (item) =>
                    item.itemType === "product" &&
                    item.product?.id === product.id &&
                    item.selectedSize === size &&
                    item.selectedColor === color
            );

            if (existingIndex > -1) {
                const items = [...current];
                const existing = items[existingIndex];
                items[existingIndex] = {
                    ...existing,
                    quantity: existing.quantity + 1,
                    totalPrice: existing.totalPrice + product.price,
                };
                commitItems(items);
                return;
            }

            const newLine: CartItem = {
                id: `cart-${Date.now()}`,
                itemType: "product",
                product,
                quantity: 1,
                selectedSize: size,
                selectedColor: color,
                totalPrice: product.price,
            };
            commitItems([...current, newLine]);
        },

        addArtToCart: (art) => {
            const alreadyInCart = get().items.some(
                (item) => item.itemType === "art" && item.artPiece?.id === art.id
            );
            if (alreadyInCart) return "already-in-cart";

            const newLine: CartItem = {
                id: `cart-${Date.now()}`,
                itemType: "art",
                artPiece: art,
                quantity: 1,
                selectedSize: "Original Framing",
                totalPrice: art.price,
            };
            commitItems([...get().items, newLine]);
            return "added";
        },

        addCustomDesignToCart: (design, size) => {
            const newLine: CartItem = {
                id: `cart-${Date.now()}`,
                itemType: "aiCustomDesign",
                aiCustomDesign: design,
                quantity: 1,
                selectedSize: size,
                selectedColor: "Custom Layer Gradient",
                selectedFabric: design.fabrics[0],
                selectedPrinting: design.printingOption,
                totalPrice: DEFAULT_CUSTOM_DESIGN_PRICE,
            };
            commitItems([...get().items, newLine]);
        },

        removeFromCart: (cartLineId) => {
            commitItems(get().items.filter((item) => item.id !== cartLineId));
        },

        updateQuantity: (cartLineId, quantity) => {
            const safeQuantity = Math.max(1, quantity);
            const items = get().items.map((item) => {
                if (item.id !== cartLineId) return item;
                const unitPrice = item.totalPrice / item.quantity;
                return { ...item, quantity: safeQuantity, totalPrice: unitPrice * safeQuantity };
            });
            commitItems(items);
        },

        clearCart: () => commitItems([]),

        getTotalItems: () => get().items.reduce((sum, item) => sum + item.quantity, 0),

        getSubtotal: () => get().items.reduce((sum, item) => sum + item.totalPrice, 0),
    };
});

// ── Sync + deferred initial hydration (client only) ──────────────────────────
if (typeof window !== "undefined") {
    const refreshFromStorage = () => {
        const stored = cartSync.load();
        if (stored) useCartStore.setState({ items: stored });
    };

    // Same-tab (custom event) + cross-tab (native storage event).
    cartSync.subscribe(refreshFromStorage);

    // Hydrate after the first paint so the client's initial render matches the
    // server HTML (no hydration mismatch) — same deferred strategy as the
    // Zustand persist middleware.
    window.setTimeout(refreshFromStorage, 0);
}
