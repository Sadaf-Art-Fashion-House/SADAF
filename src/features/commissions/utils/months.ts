/**
 * SADAF | Commissions — Month Helpers
 *
 * Shared by the API routes (stat aggregation) and the view (filter
 * dropdown) so the month keys always match — one source of truth.
 */

/** "2026-08" from an ISO timestamp — the stable key for the month filter. */
export function monthKeyFor(iso: string): string {
    return iso.slice(0, 7);
}

/** "August 2026" from a "2026-08" key — localized when a language is given. */
export function monthLabel(key: string, language?: string): string {
    const [year, month] = key.split('-').map(Number);
    const locale = language === 'ar' ? 'ar-EG' : 'en-US';
    const name = new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString(locale, {
        month: 'long',
    });
    return `${name} ${year}`;
}

/** Distinct months across records, newest first — the filter options. */
export function collectMonthKeys(records: readonly { creditedAt: string }[]): string[] {
    return Array.from(new Set(records.map((record) => monthKeyFor(record.creditedAt)))).sort(
        (a, b) => b.localeCompare(a),
    );
}
