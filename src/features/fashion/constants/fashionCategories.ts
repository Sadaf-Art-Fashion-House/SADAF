import type { FashionCategory } from "@/shared/types";

/**
 * All available fashion filter categories, including the "All" sentinel.
 * Used by FashionView to render the category tab bar.
 * Keep in sync with the FashionCategory union in @/shared/types.
 */
export const FASHION_CATEGORIES: (FashionCategory | "All")[] = [
    "All",
    "Women",
    "Men",
    "Kids",
    "Traditional Fusion",
    "Limited Edition",
];
