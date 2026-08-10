/**
 * SADAF | Notifications — Relative Time Formatting
 *
 * Formats an ISO date string as a compact relative time ("Just now",
 * "12m ago", "3h ago"), falling back to a short date for anything older
 * than a week. Shared by NotificationsView and NotificationBell.
 *
 * Accepts the active site language so Arabic users get localized labels
 * ("الآن", "منذ 5 د").
 */

export function formatRelativeTime(dateStr: string, language: 'en' | 'ar' = 'en'): string {
    const now = Date.now();
    const date = new Date(dateStr).getTime();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60_000);
    const diffHours = Math.floor(diffMs / 3_600_000);
    const diffDays = Math.floor(diffMs / 86_400_000);

    const isArabic = language === 'ar';

    if (diffMins < 1) return isArabic ? 'الآن' : 'Just now';
    if (diffMins < 60) return isArabic ? `منذ ${diffMins} د` : `${diffMins}m ago`;
    if (diffHours < 24) return isArabic ? `منذ ${diffHours} س` : `${diffHours}h ago`;
    if (diffDays < 7) return isArabic ? `منذ ${diffDays} ي` : `${diffDays}d ago`;
    return new Date(dateStr).toLocaleDateString(isArabic ? 'ar-EG' : 'en-US', {
        month: 'short',
        day: 'numeric',
    });
}
