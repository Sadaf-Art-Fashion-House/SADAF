'use client';

import SearchView from './SearchView';
import { useAggregatedRatings } from '@/features/reviews/hooks/useAggregatedRatings';
import type { SearchResult } from '../types';
import type { Review } from '@/features/reviews/types';

interface SearchPageClientProps {
    allResults: SearchResult[];
    mockReviews: Review[];
}

export default function SearchPageClient({ allResults, mockReviews }: SearchPageClientProps) {
    // Aggregated card ratings (mock catalog reviews + the user's own) for
    // product-type results — artworks and collections have no reviews.
    // All search state and filtering lives inside the hook used by SearchView.
    // No cart/wishlist mutations needed here — search is discovery-only.
    const ratingsByProduct = useAggregatedRatings(
        allResults
            .filter((result) => result.type === 'product')
            .map((result) => ({ id: result.id, name: result.title })),
        mockReviews,
    );

    return <SearchView allResults={allResults} ratingsByProduct={ratingsByProduct} />;
}
