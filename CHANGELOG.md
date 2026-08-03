# Changelog

All notable changes to **SADAF — Art & Fashion House** are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] — 2026-08-03

**First tagged release.** Full migration from Vite + React to Next.js 15 App Router.

### Added

#### Core & Architecture
- Full migration to Next.js 15 App Router: Server Components (`page.tsx`) + Client wrappers (`FeaturePageClient`) + View components
- Route groups (`marketing`, `auth`, `customer`, `admin`, `founder`, `public`) with role-based layouts and sidebars
- Central `ROUTES` constants, custom 404 and 500 error pages, `ErrorBoundary` + shared `ErrorFallback`
- Role-aware `ErrorGuidance` banner across export, auth, checkout, and dashboard error surfaces

#### Auth & Roles
- Email/password signup & login with Google OAuth
- Role-based registration with validation gates: **customer** (individual / family / friends — referral code or valid username required), **designer**, **company/brand** (website or social page required), **sales partner**, **admin** (sales / media / sales+media / software / super), **founder**
- Profile pages: profile photo, personal info, orders, wishlist

#### Storefront
- Catalogs: Fashion, Gallery, Artworks, Marketplace (`/store`)
- Cart + Wishlist (Zustand stores), Checkout with shipping validation and payment methods (Visa / PayPal / bank transfer)
- Atelier page

#### AI & Experience
- AI Studio: design generation, save designs, admin publishing pipeline to products/arts/fashions/collections
- Virtual Exhibition: voice tuning (Web Speech API), multi-language TTS (EN / AR / FR / DE), bilingual curatorial stories, RTL transcripts, voice preview

#### Community & Analytics
- Community network: family & friends connections and networking
- Analytics dashboard: sales, popular products, user growth (Recharts) with per-chart PNG/PDF export and full-dashboard PDF report
- Watermark settings: text or transparent logo, multiple logos, position control (tiled / center / corners), custom labels used as export filenames
- Real-time WebSocket dashboard data with polling fallback + live notifications

#### Tooling
- Error Logging system: client + server API, Error Logs dashboards, JSON export, email notification via nodemailer / SMTP
- Export history panel (last 10 exports), smart retry banner with accessibility support

### Fixed
- Turbopack CSS panic by relocating the project off a path with spaces
- html2canvas crash on `oklab()` colors — shared color-normalization fix for exports
- Arabic voice selection in Exhibition TTS with browser approximation fallback
- Missing `nodemailer` dependency that blocked the full site build
- AI Studio 404 navigation, dashboard links, and role-redirect coverage

---

## How to tag a new release

```bash
git tag -a v0.2.0 -m "SADAF v0.2.0 — <short summary>"   # annotated tag (best practice)
git push origin v0.2.0                                   # push the tag
```

Then create the release from the tag in GitHub UI (**Tags → v0.2.0 → Create release**) and paste the new section from this changelog.
