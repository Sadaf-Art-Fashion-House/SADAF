/**
 * SADAF | Reviews — Rating Aggregation
 *
 * Shared helper that computes a product's average rating + review count from
 * a list of reviews. Used by the product detail page to merge catalog
 * (mock) reviews with the signed-in user's own reviews so the PDP shows one
 * consistent score.
 */

import type { Review } from '../types';

/** Normalized product name used for fuzzy matching (user reviews may store
 * the order-item name instead of the catalog id). */
function normalizeProductName(name: string): string {
    return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Reviews matching the product — by id OR name (order-written reviews carry
 * the order-item name). Shared so the average, the star distribution and the
 * recent-reviews list all match the exact same set.
 */
export function reviewsForProduct(
    reviews: Review[],
    productId: string,
    productName: string,
): Review[] {
    const normalizedName = normalizeProductName(productName);
    return reviews.filter(
        (review) =>
            review.productId === productId ||
            normalizeProductName(review.productName) === normalizedName,
    );
}

/**
 * Average rating + count for a product, aggregated from the given reviews.
 * A review matches the product when its productId equals the product id OR
 * its product name equals the product name (order-written reviews carry the
 * order-item name). Returns null when no reviews match.
 */
export function averageRatingForProduct(
    reviews: Review[],
    productId: string,
    productName: string,
): { average: number; count: number } | null {
    const matches = reviewsForProduct(reviews, productId, productName);

    if (matches.length === 0) return null;

    const total = matches.reduce((sum, review) => sum + review.rating, 0);
    return { average: total / matches.length, count: matches.length };
}
