/**
 * SADAF | Shared — Event Time Formatting
 *
 * Formats an ISO date string as a compact relative time for live event feeds
 * ("now", "18s ago", "5m ago", "3h ago"), falling back to a short clock time
 * for anything older than a day. Shared by LiveEventsFeed (analytics) and
 * PersonalActivityFeed (customer).
 */

export function formatEventTime(iso: string): string {
    const diffMs = Date.now() - new Date(iso).getTime();
    const seconds = Math.floor(diffMs / 1000);
    if (seconds < 10) return 'now';
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}
