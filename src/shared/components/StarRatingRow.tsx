'use client';

/**
 * SADAF | Shared — StarRatingRow
 *
 * The mini 5-star row shown next to the numeric average on product cards
 * (Store / Wishlist / related products), replacing the single "★" mark.
 * Stars fill up to the rounded average — the same convention the PDP and
 * /reviews use — with dim slate for the remaining empty stars.
 */

import { Star } from 'lucide-react';

interface StarRatingRowProps {
    /** Average rating, 0–5. */
    rating: number;
    /** Star size in px (cards use 9–11). */
    size?: number;
    /** Accessible label; defaults to "<rating> / 5". */
    label?: string;
}

export default function StarRatingRow({ rating, size = 9, label }: StarRatingRowProps) {
    const filledStars = Math.round(rating);
    return (
        <span
            className="inline-flex items-center gap-px"
            role="img"
            aria-label={label ?? `${rating.toFixed(1)} / 5`}
        >
            {[1, 2, 3, 4, 5].map((star) => (
                <Star
                    key={star}
                    size={size}
                    fill={star <= filledStars ? 'currentColor' : 'none'}
                    className={star <= filledStars ? 'text-[#C9A84C]' : 'text-slate-600'}
                />
            ))}
        </span>
    );
}
