'use client';

import SearchView from './SearchView';
import { useAggregatedRatings } from '@/features/reviews/hooks/useAggregatedRatings';
import { useLiveRatings } from '@/features/reviews/hooks/useLiveRatings';
import type { SearchResult } from '../types';
import type { Review } from '@/features/reviews/types';

interface SearchPageClientProps {
    allResults: SearchResult[];
    mockReviews: Review[];
}

export default function SearchPageClient({ allResults, mockReviews }: SearchPageClientProps) {
    // Aggregated card ratings (mock catalog reviews + the user's own) for
    // product-type results — artworks and collections have no reviews.
    // Live community reviews over reviews:global are merged in so scores
    // move in real time.
    // All search state and filtering lives inside the hook used by SearchView.
    // No cart/wishlist mutations needed here — search is discovery-only.
    const { liveReviews, wsLive, lastLive } = useLiveRatings();
    const ratingsByProduct = useAggregatedRatings(
        allResults
            .filter((result) => result.type === 'product')
            .map((result) => ({ id: result.id, name: result.title })),
        mockReviews,
        liveReviews,
    );

    return (
        <SearchView
            allResults={allResults}
            ratingsByProduct={ratingsByProduct}
            wsLive={wsLive}
            lastLiveProductId={lastLive?.review.productId ?? null}
            lastLiveAt={lastLive?.at ?? null}
        />
    );
}
