/**
 * SADAF | Shared — Plural-Aware Count Word
 *
 * Arabic has four plural forms (one / two / few / many) where English has two
 * (singular / plural), so a review counter like "· 1 تقييم" cannot be built
 * from a single translated word ("تقييمات"). This helper picks the correct
 * Arabic form from the four dictionary keys for a given count:
 *
 *   1   → one   (تقييم / مراجعة)
 *   2   → two   (تقييمان / مراجعتان)
 *   3–10 → few   (تقييمات / مراجعات)
 *   11+ → many  (تقييماً / مراجعةً)
 *
 * English dictionaries map two/few/many to the same word ("reviews"), so the
 * same helper produces the correct English plural automatically.
 */

import type { TranslationKey } from '@/features/i18n/dictionaries';

export type TranslateFn = (key: TranslationKey, vars?: Record<string, string | number>) => string;

/** Pick the Arabic plural form (one/two/few/many) for a count. */
export function pluralWord(count: number, one: string, two: string, few: string, many: string): string {
    if (count === 1) return one;
    if (count === 2) return two;
    if (count >= 3 && count <= 10) return few;
    return many;
}

/** Review word used on product cards ("تقييم" family in AR). */
export function reviewCountWord(t: TranslateFn, count: number): string {
    return pluralWord(
        count,
        t('store.reviewOne'),
        t('store.reviewTwo'),
        t('store.reviewFew'),
        t('store.reviewMany')
    );
}

/** Review word used on the product detail page ("مراجعة" family in AR). */
export function pdpReviewCountWord(t: TranslateFn, count: number): string {
    return pluralWord(
        count,
        t('pdp.reviewWordOne'),
        t('pdp.reviewWordTwo'),
        t('pdp.reviewWordFew'),
        t('pdp.reviewWordMany')
    );
}
