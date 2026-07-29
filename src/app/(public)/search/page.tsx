import type { Metadata } from 'next';
import SearchPageClient from '@/features/search/components/SearchPageClient';
import type { SearchResult } from '@/features/search/types';

export const metadata: Metadata = {
    title: 'Search | SADAF Atelier',
    description: 'Search across fashion, artworks, and collections at SADAF.',
};

// TODO: Replace with real Supabase/Prisma search query
async function getAllSearchResults(): Promise<SearchResult[]> {
    return [];
}

export default async function SearchPage() {
    const allResults = await getAllSearchResults();
    return <SearchPageClient allResults={allResults} />;
}
