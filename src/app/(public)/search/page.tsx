import type { Metadata } from 'next';
import SearchPageClient from '@/features/search/components/SearchPageClient';
import { getMockReviews } from '@/features/reviews/data/mockReviews';
import type { Review } from '@/features/reviews/types';
import { getCatalogSearchResults } from '@/lib/api/catalog';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
    title: 'Search | SADAF Atelier',
    description: 'Search across fashion, artworks, and collections at SADAF.',
};

export default async function SearchPage() {
    const allResults = await getCatalogSearchResults();
    // Catalog reviews feed the aggregated rating shown on product cards
    // (merged with the user's own reviews client-side).
    const mockReviews: Review[] = getMockReviews();
    return <SearchPageClient allResults={allResults} mockReviews={mockReviews} />;
}
