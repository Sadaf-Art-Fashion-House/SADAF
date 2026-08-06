'use client';

import { useMemo, useState } from 'react';
import type { LeaderboardEntry } from '../types';
import { CITIES } from '../utils/leaderboard';

/**
 * useCityFilter — shared city-filtering for the leaderboard lists.
 *
 * Used by both the full LeaderboardView (search/tier filters applied on top)
 * and the compact RewardsPanel so the dropdown, counts, and empty-state
 * detection stay identical across the two surfaces. Every CITIES city is
 * selectable — including 0-count ones — and populated cities float to the top.
 */
export function useCityFilter(entries: LeaderboardEntry[], initialCity: string = 'All') {
    // Initial city may arrive from the URL (?city=...) so the RewardsPanel's
    // "View Full Leaderboard" deep-link opens pre-filtered. Garbage input
    // (an unknown city) degrades gracefully to 'All' instead of leaving the
    // select with a value that matches no option.
    const safeInitialCity =
        initialCity === 'All' || (CITIES as readonly string[]).includes(initialCity) ? initialCity : 'All';
    const [cityFilter, setCityFilter] = useState<string>(safeInitialCity);

    /** City options from the full CITIES list, each with its member count
     * (0 allowed); populated cities first, then alphabetical. */
    const cityOptions = useMemo(() => {
        const counts = new Map<string, number>();
        for (const city of CITIES) counts.set(city, 0);
        for (const entry of entries) {
            counts.set(entry.city, (counts.get(entry.city) ?? 0) + 1);
        }
        return [...counts.entries()]
            .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
            .map(([city, count]) => ({ city, count }));
    }, [entries]);

    /** Entries restricted to the selected city (no-op for 'All'). */
    const filteredEntries = useMemo(
        () => (cityFilter === 'All' ? entries : entries.filter((entry) => entry.city === cityFilter)),
        [entries, cityFilter],
    );

    /** True when the selected city has no members at all (a 0-count city). */
    const selectedCityHasNoMembers =
        cityFilter !== 'All' && !entries.some((entry) => entry.city === cityFilter);

    return {
        cityFilter,
        setCityFilter,
        cityOptions,
        filteredEntries,
        selectedCityHasNoMembers,
    };
}
