/**
 * SADAF | Shared — Event Time Formatting
 *
 * Formats an ISO date string as a compact relative time for live event feeds
 * ("now", "18s ago", "5m ago", "3h ago"), falling back to a short clock time
 * for anything older than a day. Shared by LiveEventsFeed (analytics) and
 * PersonalActivityFeed (customer).
 *
 * Pass `language: 'ar'` to render Arabic relative labels (الآن / منذ 5 د),
 * matching the notifications relative-time formatting.
 */

export function formatEventTime(iso: string, language: 'en' | 'ar' = 'en'): string {
    const diffMs = Date.now() - new Date(iso).getTime();
    const seconds = Math.floor(diffMs / 1000);
    if (seconds < 10) return language === 'ar' ? 'الآن' : 'now';
    if (seconds < 60) return language === 'ar' ? `منذ ${seconds} ث` : `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return language === 'ar' ? `منذ ${minutes} د` : `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return language === 'ar' ? `منذ ${hours} س` : `${hours}h ago`;
    return new Date(iso).toLocaleTimeString(language === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' });
}
