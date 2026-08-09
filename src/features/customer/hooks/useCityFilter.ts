'use client';

import { useMemo, useState } from 'react';
import { CITIES } from '../utils/leaderboard';

/**
 * useCityFilter — shared city-filtering for any list with a `city` field.
 *
 * Used by the leaderboard lists (full LeaderboardView + compact RewardsPanel)
 * and the admin/founder Community Overview pending requests so the dropdown,
 * counts, and empty-state detection stay identical across surfaces. Every
 * CITIES city is selectable — including 0-count ones — and populated cities
 * float to the top.
 */

/** Minimal shape any list needs to be city-filterable. */
export interface CityFilterable {
    city: string;
}

export function useCityFilter<T extends CityFilterable>(entries: T[], initialCity: string = 'All') {
    // Initial city may arrive from the URL (?city=...) so the RewardsPanel's
    // "View Full Leaderboard" deep-link opens pre-filtered. Garbage input
    // (an unknown city) degrades gracefully to 'All' instead of leaving the
    // select with a value that matches no option.
    const safeInitialCity =
        initialCity === 'All' || (CITIES as readonly string[]).includes(initialCity) ? initialCity : 'All';
    const [cityFilter, setCityFilter] = useState<string>(safeInitialCity);

    // Stable identity by CONTENT, not reference. Callers commonly pass
    // `data?.entries ?? []`, and the `?? []` fallback is a fresh reference on
    // every render while the data is loading; keying the memos below on the
    // reference alone would recompute them every render. The serialized city
    // signature only changes when the actual entries change.
    const entriesKey = entries.map((entry) => entry.city).join('\u0001');
    const stableEntries = useMemo(
        () => entries,
        // eslint-disable-next-line react-hooks/exhaustive-deps -- content signature, see above
        [entriesKey],
    );

    /** City options from the full CITIES list, each with its member count
     * (0 allowed); populated cities first, then alphabetical. */
    const cityOptions = useMemo(() => {
        const counts = new Map<string, number>();
        for (const city of CITIES) counts.set(city, 0);
        for (const entry of stableEntries) {
            counts.set(entry.city, (counts.get(entry.city) ?? 0) + 1);
        }
        return [...counts.entries()]
            .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
            .map(([city, count]) => ({ city, count }));
    }, [stableEntries]);

    /** Entries restricted to the selected city (no-op for 'All'). */
    const filteredEntries = useMemo(
        () => (cityFilter === 'All' ? stableEntries : stableEntries.filter((entry) => entry.city === cityFilter)),
        [stableEntries, cityFilter],
    );

    /** True when the selected city has no entries at all (a 0-count city). */
    const selectedCityHasNoMembers =
        cityFilter !== 'All' && !stableEntries.some((entry) => entry.city === cityFilter);

    return {
        cityFilter,
        setCityFilter,
        cityOptions,
        filteredEntries,
        selectedCityHasNoMembers,
    };
}
