/**
 * Wishlist-specific types for the SADAF wishlist feature.
 *
 * The core wishlist store (useWishlistStore) works with FashionProduct
 * from @/shared/types. This file holds types that are ONLY used within
 * the Wishlist page itself.
 */

/** Sorting options for the wishlist grid. */
export type WishlistSortOption = 'newest' | 'price-low' | 'price-high' | 'name';
