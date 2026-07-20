import type { FashionCategory } from "@/shared/types";

/**
 * All available marketplace filter categories, including the "All" sentinel.
 * Used by StoreView to render the category filter sidebar.
 * Keep in sync with the FashionCategory union in @/shared/types.
 */
export const MARKETPLACE_CATEGORIES: (FashionCategory | "All")[] = [
    "All",
    "Women",
    "Men",
    "Kids",
    "Traditional Fusion",
    "Limited Edition",
];

/** VIP promotional coupon code accepted at checkout. */
export const VIP_COUPON_CODE = "SADAF2026";
export const VIP_COUPON_DISCOUNT_PERCENT = 15;

/** Orders above this subtotal ship free; otherwise the flat fee applies. */
export const FREE_SHIPPING_THRESHOLD = 1000;
export const STANDARD_SHIPPING_FEE = 75;
