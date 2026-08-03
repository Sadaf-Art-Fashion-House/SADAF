/**
 * SADAF | Shared — Currency Formatting
 *
 * Formats a number as USD with no decimals (e.g. 148500 → "$148,500").
 * Shared across dashboards, analytics, and personal analysis views so
 * every monetary figure renders consistently.
 */
export function formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
}
