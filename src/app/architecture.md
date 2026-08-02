# SADAF Frontend Architecture

This project now follows a production-oriented structure for the SADAF platform while preserving the existing Next.js app router setup.

## Top-level architecture

- app/: Route groups and application entry points.
- components/: Cross-cutting UI components.
- features/: Feature-based business domains.
- shared/: Reusable design system and platform primitives.
- hooks/: Shared application hooks.
- lib/: Infrastructure and framework integrations.
- services/: Cross-cutting services.
- public/: Static assets.

## Feature folders

Each feature folder contains its own components, hooks, services, api, types, utils, validation, constants, store, and schemas directories when needed.

## Principles

- Feature-based organization
- Clean separation of concerns
- Scalable route groups
- Reusable shared primitives
- Future-ready for server and client components

## Exporting DOM elements (html2canvas + Tailwind v4 oklab)

Tailwind CSS v4 generates its palette in the modern `oklch()`/`oklab()` color space. html2canvas (v1.4.1) only understands hex, named colors and classic rgb()/hsl() functions — it throws `Attempting to parse an unsupported color function` on any oklab color, silently breaking PNG/PDF exports.

**Always capture DOM elements through `src/shared/utils/captureElementWithOklabFix.ts` — never call html2canvas directly.** It wires html2canvas' `onclone` hook to `normalizeUnsupportedColorFunctions` (`src/shared/utils/normalizeColors.ts`), which rewrites every oklch/oklab/lab/lch/color() value in the cloned snapshot to an `#rrggbb` / `#rrggbbaa` hex equivalent before rasterization.

Current consumers:

- `src/features/analytics/hooks/useExportChart.ts` — all Analytics Dashboard exports (per-chart PNG/PDF, KPI cards, tab reports, full-dashboard PDF) via `captureElementWithWatermark`.
- `src/features/watermark/components/WatermarkSettings.tsx` — the preview export renders directly to Canvas 2D (bypasses html2canvas), and falls back to `captureElementWithOklabFix` when the preview container is missing from the DOM.

If a new feature needs DOM capture, import `captureElementWithOklabFix` from `@/shared/utils/captureElementWithOklabFix` instead of adding a raw html2canvas call.
