import { create } from "zustand";
import type { AIClothingDesign, ArtPiece, CartItem, FashionProduct } from "@/shared/types";

/** Base custom-design price offset until AI Studio pricing is wired to a real quote engine. */
const DEFAULT_CUSTOM_DESIGN_PRICE = 680;

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

export const useCartStore = create<CartState>((set, get) => ({
    items: [],

    addFashionToCart: (product, size, color) =>
        set((state) => {
            const existingIndex = state.items.findIndex(
                (item) =>
                    item.itemType === "product" &&
                    item.product?.id === product.id &&
                    item.selectedSize === size &&
                    item.selectedColor === color
            );

            if (existingIndex > -1) {
                const items = [...state.items];
                const existing = items[existingIndex];
                items[existingIndex] = {
                    ...existing,
                    quantity: existing.quantity + 1,
                    totalPrice: existing.totalPrice + product.price,
                };
                return { items };
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
            return { items: [...state.items, newLine] };
        }),

    addArtToCart: (art) => {
        const alreadyInCart = get().items.some(
            (item) => item.itemType === "art" && item.artPiece?.id === art.id
        );
        if (alreadyInCart) return "already-in-cart";

        set((state) => {
            const newLine: CartItem = {
                id: `cart-${Date.now()}`,
                itemType: "art",
                artPiece: art,
                quantity: 1,
                selectedSize: "Original Framing",
                totalPrice: art.price,
            };
            return { items: [...state.items, newLine] };
        });
        return "added";
    },

    addCustomDesignToCart: (design, size) =>
        set((state) => {
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
            return { items: [...state.items, newLine] };
        }),

    removeFromCart: (cartLineId) =>
        set((state) => ({
            items: state.items.filter((item) => item.id !== cartLineId),
        })),

    updateQuantity: (cartLineId, quantity) =>
        set((state) => ({
            items: state.items.map((item) => {
                if (item.id !== cartLineId) return item;
                const safeQuantity = Math.max(1, quantity);
                const unitPrice = item.totalPrice / item.quantity;
                return { ...item, quantity: safeQuantity, totalPrice: unitPrice * safeQuantity };
            }),
        })),

    clearCart: () => set({ items: [] }),

    getTotalItems: () => get().items.reduce((sum, item) => sum + item.quantity, 0),

    getSubtotal: () => get().items.reduce((sum, item) => sum + item.totalPrice, 0),
}));
