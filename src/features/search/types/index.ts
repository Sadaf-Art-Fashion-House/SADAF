/**
 * SADAF | Search Feature — Type Definitions
 */

export interface SearchResult {
    id: string;
    type: 'product' | 'artwork' | 'collection';
    title: string;
    subtitle: string;
    image: string;
    price: number;
    href: string;
    category: string;
}

export type SearchCategory = 'All' | 'Products' | 'Artworks' | 'Collections';

export interface SearchState {
    query: string;
    category: SearchCategory;
    results: SearchResult[];
    isSearching: boolean;
    recentSearches: string[];
}
