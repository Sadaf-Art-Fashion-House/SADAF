'use client';

/**
 * SADAF | Dashboard — KPI display localization
 *
 * KPI payloads from the WebSocket / API routes ship English-only labels and
 * values (the data layer stays canonical English). Labels are mapped to
 * translation keys inside each dashboard view; this helper localizes the
 * *values* — dynamic strings that embed English tokens like "1,294 runs",
 * "Stable", "+14% MoM", "Gold VIP members", or "+14 fashion, 9 art".
 *
 * Plain function (no hook) so views can call it inline with the language
 * value they already hold from useLanguage() — same pattern as the
 * localizedXxx helpers in features/i18n/productNames.ts.
 */

import type { SiteLanguage } from '@/features/settings/store/usePreferencesStore';

/** English tokens that appear inside KPI value / growth / pct strings → Arabic. */
const KPI_VALUE_TOKENS_AR: Record<string, string> = {
    runs: 'توليدًا',
    pieces: 'قطعة',
    profiles: 'ملفًا',
    fashion: 'أزياء',
    art: 'فنون',
    Stable: 'مستقر',
    MoM: 'شهريًا',
    'Active stencils': 'قوالب نشطة',
    'Gold VIP members': 'أعضاء VIP الذهبيون',
    'Products & Art': 'منتجات وفنون',
};

// Multi-word tokens first so they win at their starting position; the rest
// are distinct prefixes so alternation order is safe.
const KPI_TOKEN_PATTERN =
    /\b(Products & Art|Gold VIP members|Active stencils|runs|pieces|profiles|fashion|art|Stable|MoM)\b/g;

/** The display value of a KPI for the active language (embedded tokens translated). */
export function localizedKpiValue(value: string, language: SiteLanguage): string {
    if (language !== 'ar') return value;
    return value.replace(KPI_TOKEN_PATTERN, (match) => KPI_VALUE_TOKENS_AR[match] ?? match);
}
