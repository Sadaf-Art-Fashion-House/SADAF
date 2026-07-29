'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import type { SearchResult, SearchCategory } from '../types';

const MAX_RECENT_SEARCHES = 5;
const STORAGE_KEY = 'sadaf_recent_searches';

/**
 * Hook managing search input, category filtering, and recent-search history.
 * Results come from the provided data set (server-fetched) so this hook
 * remains purely a UI-state manager — no API calls.
 */
export function useSearch(
    allResults: SearchResult[],
    initialCategory: SearchCategory = 'All',
) {
    const [query, setQuery] = useState('');
    const [category, setCategory] = useState<SearchCategory>(initialCategory);
    const [isSearching, setIsSearching] = useState(false);
    const [recentSearches, setRecentSearches] = useState<string[]>([]);

    // Load recent searches from sessionStorage on mount
    useEffect(() => {
        try {
            const stored = sessionStorage.getItem(STORAGE_KEY);
            if (stored) {
                setRecentSearches(JSON.parse(stored));
            }
        } catch {
            // sessionStorage unavailable — silently ignore
        }
    }, []);

    // Simulate a brief searching state for UX feedback
    useEffect(() => {
        if (!query.trim()) {
            setIsSearching(false);
            return;
        }
        setIsSearching(true);
        const timer = setTimeout(() => setIsSearching(false), 300);
        return () => clearTimeout(timer);
    }, [query]);

    const filteredResults = useMemo(() => {
        if (!query.trim()) return [];

        const normalized = query.toLowerCase().trim();
        let results = allResults.filter(
            (r) =>
                r.title.toLowerCase().includes(normalized) ||
                r.subtitle.toLowerCase().includes(normalized) ||
                r.category.toLowerCase().includes(normalized),
        );

        if (category !== 'All') {
            const typeMap: Record<SearchCategory, string | undefined> = {
                All: undefined,
                Products: 'product',
                Artworks: 'artwork',
                Collections: 'collection',
            };
            const targetType = typeMap[category];
            if (targetType) {
                results = results.filter((r) => r.type === targetType);
            }
        }

        return results;
    }, [query, category, allResults]);

    const saveRecentSearch = useCallback(
        (searchQuery: string) => {
            const trimmed = searchQuery.trim();
            if (!trimmed) return;

            setRecentSearches((prev) => {
                const updated = [trimmed, ...prev.filter((s) => s !== trimmed)].slice(
                    0,
                    MAX_RECENT_SEARCHES,
                );
                try {
                    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
                } catch {
                    // ignore storage errors
                }
                return updated;
            });
        },
        [],
    );

    const clearRecentSearches = useCallback(() => {
        setRecentSearches([]);
        try {
            sessionStorage.removeItem(STORAGE_KEY);
        } catch {
            // ignore
        }
    }, []);

    const handleSearch = useCallback(
        (searchQuery: string) => {
            setQuery(searchQuery);
            saveRecentSearch(searchQuery);
        },
        [saveRecentSearch],
    );

    return {
        query,
        setQuery,
        category,
        setCategory,
        isSearching,
        recentSearches,
        clearRecentSearches,
        filteredResults,
        handleSearch,
    };
}
