'use client';

import SearchView from './SearchView';
import type { SearchResult } from '../types';

interface SearchPageClientProps {
    allResults: SearchResult[];
}

export default function SearchPageClient({ allResults }: SearchPageClientProps) {
    // All search state and filtering lives inside the hook used by SearchView.
    // No cart/wishlist mutations needed here — search is discovery-only.
    return <SearchView allResults={allResults} />;
}
