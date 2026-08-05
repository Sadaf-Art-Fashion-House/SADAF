/**
 * SADAF | Customer — Number Formatting
 *
 * Shared formatter for loyalty points / currency-less numbers shown in the
 * rewards panel and leaderboard, so the two views format identically.
 */

/** Format a points balance or ranking value with thousands separators. */
export function formatPoints(points: number): string {
    return points.toLocaleString('en-US');
}
