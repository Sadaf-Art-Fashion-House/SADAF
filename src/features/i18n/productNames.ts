'use client';

/**
 * SADAF | i18n — bilingual catalog names
 *
 * Product data stays English-first (the catalog is data, not UI strings);
 * `nameAr` is an optional Arabic display name on each FashionProduct. This
 * helper picks the right name for the active language, falling back to the
 * English name whenever the Arabic field is missing.
 *
 * Kept as a plain function (no hook) so any view can call it inline with
 * the language value it already holds from `useLanguage()`.
 */

import type { AIClothingDesign, ArtPiece, FashionProduct, LookbookItem } from '@/shared/types';
import type { SiteLanguage } from '@/features/settings/store/usePreferencesStore';
import { artDatabase, fashionDatabase, fabricsList, printingMethods } from '@/data';
import type { OrderItem } from '@/features/orders/types';

/** The display name of a product for the active language. */
export function localizedProductName(product: FashionProduct, language: SiteLanguage): string {
    return language === 'ar' && product.nameAr ? product.nameAr : product.name;
}

/** The display description of a product for the active language. */
export function localizedProductDescription(product: FashionProduct, language: SiteLanguage): string {
    return language === 'ar' && product.descriptionAr ? product.descriptionAr : product.description;
}

/** The fabric label of a product for the active language. */
export function localizedProductFabric(product: FashionProduct, language: SiteLanguage): string {
    return language === 'ar' && product.fabricAr ? product.fabricAr : product.fabric;
}

/** The bullet-point details of a product for the active language. */
export function localizedProductDetails(product: FashionProduct, language: SiteLanguage): string[] {
    return language === 'ar' && product.detailsAr ? product.detailsAr : product.details;
}

/** The display title of an artwork for the active language (artDatabase pieces). */
export function localizedArtTitle(art: ArtPiece, language: SiteLanguage): string {
    return language === 'ar' && art.titleAr ? art.titleAr : art.title;
}

/** The display name of an AI Studio design for the active language. */
export function localizedDesignName(design: AIClothingDesign, language: SiteLanguage): string {
    return language === 'ar' && design.patternNameAr ? design.patternNameAr : design.patternName;
}

/** The display title of a lookbook item for the active language. */
export function localizedLookbookTitle(item: LookbookItem, language: SiteLanguage): string {
    return language === 'ar' && item.titleAr ? item.titleAr : item.title;
}

/** The display subtitle of a lookbook item for the active language. */
export function localizedLookbookSubtitle(item: LookbookItem, language: SiteLanguage): string {
    return language === 'ar' && item.subtitleAr ? item.subtitleAr : item.subtitle;
}

/** The display description of a lookbook item for the active language. */
export function localizedLookbookDescription(item: LookbookItem, language: SiteLanguage): string {
    return language === 'ar' && item.descriptionAr ? item.descriptionAr : item.description;
}

/**
 * The display name of a fabric option for the active language. Falls back to
 * the stored English name when the value is not a known catalog fabric (e.g.
 * an AI-suggested fabric returned by the model).
 */
export function localizedFabricName(fabric: string, language: SiteLanguage): string {
    if (language !== 'ar') return fabric;
    const match = fabricsList.find((f) => f.name === fabric);
    return match?.nameAr ?? fabric;
}

/** The fabric description for the active language (falls back to English). */
export function localizedFabricDescription(fabric: string, language: SiteLanguage): string {
    if (language !== 'ar') return fabric;
    const match = fabricsList.find((f) => f.name === fabric);
    return match?.descriptionAr ?? fabric;
}

/**
 * The display name of a printing method for the active language. Falls back
 * to the stored English name when the value is not a known method.
 */
export function localizedPrintingName(printing: string, language: SiteLanguage): string {
    if (language !== 'ar') return printing;
    const match = printingMethods.find((p) => p.name === printing);
    return match?.nameAr ?? printing;
}

/** The printing description for the active language (falls back to English). */
export function localizedPrintingDescription(printing: string, language: SiteLanguage): string {
    if (language !== 'ar') return printing;
    const match = printingMethods.find((p) => p.name === printing);
    return match?.descriptionAr ?? printing;
}

/**
 * Arabic labels for the AI clothing types. Single source of truth — the AI
 * Studio buttons, the generated atelier copy and any other consumer all
 * resolve through `localizedClothingType` below.
 */
const CLOTHING_TYPE_AR: Record<string, string> = {
    Abaya: 'عباية',
    Hoodie: 'هودي',
    'T-Shirt': 'تي شيرت',
    Jacket: 'جاكيت',
    Streetwear: 'ستريت وير',
};

/** The clothing-type label for the active language (falls back to English). */
export function localizedClothingType(type: string, language: SiteLanguage): string {
    if (language !== 'ar') return type;
    return CLOTHING_TYPE_AR[type] ?? type;
}

/** Human-readable name for an AI custom item in cart/checkout lists. */
export function localizedAiItemName(clothingType: string, language: SiteLanguage): string {
    const suffix = language === 'ar' ? 'تصميم ذكاء اصطناعي' : 'AI Custom';
    return `${localizedClothingType(clothingType, language)} — ${suffix}`;
}

/**
 * Display name for an order line item. Old (mock) orders only stored the
 * English name captured at order time — when the item carries a catalog
 * `productId` we resolve the live product and localize it, falling back to
 * the saved name when the id is missing (e.g. AI custom designs) or the
 * product is no longer in the catalog.
 */
export function localizedOrderItemName(item: OrderItem, language: SiteLanguage): string {
    if (item.productId) {
        const product = fashionDatabase.find((p) => p.id === item.productId);
        if (product) return localizedProductName(product, language);
        const art = artDatabase.find((a) => a.id === item.productId);
        if (art) return localizedArtTitle(art, language);
    }
    return item.name;
}
