# ADR-0001 — Multilingual data layer (bilingual mock data) instead of display-layer-only translation

- **Status:** Accepted (POC on product `f-1`)
- **Date:** 2026-08-17

## ملخص (Arabic summary)

القرار: **نقل الترجمة إلى طبقة البيانات نفسها** — كل منتج يحمل كتلة `i18n` مكتملة
(العربي إلزامي داخل الكتلة) بدل الحقول المسطحة الاختيارية (`nameAr`…) المتناثرة
وخرائط الترجمة في طبقة العرض. الإنجليزي يبقى الحقل الأساسي (canonical) للتوافق،
والعربي يعيش مع البيانات. طبّقناه كتجربة على منتج واحد (`f-1`) لإثبات النمط قبل
التعميم.

## Context

SADAF is a bilingual app (EN/AR, 1854 translation keys). Today three parallel
translation mechanisms coexist:

1. **Optional flat `*Ar` fields** on data entities (`nameAr`, `descriptionAr`,
   `fabricAr`, `detailsAr`, `colors[].nameAr`). They are *optional*, so a
   product can silently ship with no Arabic (English fallback).
2. **Display-layer lookup maps** inside views (`productCategoryLabel`,
   `artistLabel`, `kpiLabel`…) and helper files (`COLOR_LABELS_AR`,
   `KPI_VALUE_TOKENS_AR`).
3. **A shared i18n dictionary** (`dictionaries.ts`, `t()` keys) for UI chrome.

The `*Ar`-field approach has three problems:

- **No completeness guarantee** — Arabic is optional at the type level, so
  "bilingual" is aspirational, not enforced.
- **Bespoke accessors** — every new user-facing field needs a new
  `localizedXxx` helper wired into every view.
- **No single home for content** — translations for one product are spread
  between the data row and two helper files.

## Decision

**Move user-facing text into a typed, complete `i18n` block on each data
entity. English stays the canonical flat field; the `i18n` block carries the
full Arabic text (all fields required inside the block when it is present).**

```ts
// Canonical (machine-readable, back-compat):
{ name, description, fabric, details, … }

// New — complete Arabic block, bilingual data layer:
i18n: {
  name: 'عباية الإمبراطورة ديواني',
  description: 'ثوب مذهل …',
  fabric: 'مخمل إيطالي وحرير مصري خام',
  details: ['…', '…', '…'],
}
```

Rules:

1. **One accessor pattern** — the existing `localizedXxx` helpers are upgraded
   to read `i18n` first, then the legacy `*Ar` fields, then English. Every
   view keeps working with zero changes.
2. **Completeness is enforced at the type level** — `ProductLocalizedText`
   requires every field; no partial Arabic blocks.
3. **English remains canonical** in the flat fields — machine-readable,
   stable for code that reads raw data (metadata, alts, URLs).
4. **Display-layer maps are reserved for dynamic runtime data only** — WS
   payloads, computed strings (`KPI_VALUE_TOKENS_AR`, `COLOR_LABELS_AR`) that
   cannot live in static data. They are not used for catalog content.
5. **Migration is product-by-product** — each product's flat `*Ar` fields move
   into its `i18n` block and are deleted; the type keeps `*Ar` as deprecated
   fallback until the migration finishes.

## Consequences

- ✅ Arabic completeness becomes checkable (type + a lint-style data audit).
- ✅ One place to edit a product's translations (the data row).
- ✅ Zero view changes — helpers are the compatibility layer.
- ✅ Gradual, low-risk rollout — one product at a time.
- ⚠️ Two shapes coexist during migration (helpers handle both).
- ⚠️ English flat fields + `i18n` block is a canonical-locale + translations
  map (the standard i18n database pattern), not symmetric `{en, ar}` pairs —
  chosen deliberately to avoid breaking the 40+ consumers of `product.name`.

## Applied to

POC: product `f-1` ("Empress Diwani Abaya Cape") in `src/data.ts` — its
`nameAr`/`descriptionAr`/`fabricAr`/`detailsAr` were replaced by one `i18n`
block. Helpers `localizedProductName/Description/Fabric/Details` now prefer
`i18n`. Remaining products migrate the same way as a follow-up.
