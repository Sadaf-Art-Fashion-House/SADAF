/**
 * Cart-specific types for the SADAF shopping cart feature.
 *
 * The core CartItem type lives in @/shared/types since it is shared
 * across Cart, Checkout, Marketplace, Artworks, and AI Studio features.
 * This file holds types that are ONLY used within the Cart page itself.
 */

/** Checkout summary displayed at the bottom of the cart view. */
export interface CartSummary {
    subtotal: number;
    itemCount: number;
}
