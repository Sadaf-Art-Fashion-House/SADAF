# Changelog

All notable changes to **SADAF — Art & Fashion House** are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] — 2026-08-11

**Third release.** Real-time collaboration layer, role dashboards, full Arabic (RTL) support, and monetization (commissions + withdrawals).

### Added

#### Real-time & Live
- Real-time notifications bell on WebSocket (`notifications:user:{id}` + `notifications:global`): unread badge, mute toggle, browser notification permission, translated toast for friend requests
- Real-time leaderboard (customer/admin/founder) with kind switcher (points/sales/designs), live WS `leaderboard:global` + REST fallback
- Live friend requests over WebSocket: badge, request list, quick-action toast with Accept/Decline
- Personal activity feed + rewards panel + live order status on `personal:user:{id}`
- Overtake alerts: toast + row flash when someone passes you on the leaderboard
- Admin/Founder Community Overview: KPIs, top referrers with per-referrer network peek, network growth, pending-request management, live `community:admin` channel

#### Roles & Dashboards
- Designer Dashboard: portfolio, atelier submissions, expected-commission KPI with per-design breakdown
- Sales Partner Dashboard: referral link + copy/share, commission counter, successful referrals table, live referral-converted toast
- Company workspace with Designer–Company connections hub
- Customer Analysis: KPIs, smart recommendations, my activity, rewards, live order status
- Monthly performance chart (12-month spend + KPIs) on the customer dashboard
- Commission history pages (designer + sales partner) with month filtering

#### Storefront & Reviews
- Standalone product detail page `/store/[id]` with deep-linking from store/wishlist/search, multi-image gallery, star distribution, latest reviews, write/delete your review
- Review system: write from delivered orders, YOU badge, Edited tags, interactive star filter, aggregated ratings (catalog + user) across store/search/orders/PDP, cross-tab localStorage sync
- Product catalog ratings + order cards show aggregate rating and review count

#### Monetization
- Commission withdrawal requests: validation, processing lifecycle, double-withdraw protection, translated toasts (designer + sales partner)
- Referral share links: WhatsApp / Facebook / X / Telegram / Email + native Web Share API
- Order-based loyalty points (1 pt per $1 on Delivered) with auto tier computation

#### i18n & Settings
- Full Arabic (RTL) support: language provider, bilingual dictionaries, language switcher
- Settings pages: language / theme / UX preferences, browser notification permission, watermark
- Bilingual catalog data (`nameAr` / `descriptionAr` / `fabricAr` / `detailsAr`) with safe English fallback; localized order item names via `productId`
- RTL fixes for header popovers using logical `end-0`/`start-0` properties

#### Platform
- Middleware route guards: protected `/dashboard`, `/dashboard/admin`, `/dashboard/founder`; signed-in redirect for `/auth`; `?redirect=` return param
- Profile avatar upload (local storage) + avatar display across leaderboard/community/reviews
- Unified SuccessToast component + role badges across sidebars/profile/leaderboard/community
- Dashboard error boundaries + shared `DashboardErrorPage`
- CONTRIBUTING.md (git protocol) + CHANGELOG-FEATURES.md (feature → commit map)

### Changed
- Leaderboard city filter dropdown lists all cities (including 0-member ones) with a dedicated empty state; RewardsPanel shares the filter with `?city=` deep-link
- Sign-in / sign-out / referral-conversion toasts unified into the shared SuccessToast
- Analytics export scaling adapts to report width (dynamic scale) while keeping full capture

### Fixed
- "Maximum update depth exceeded" loop — content-signature memoization in rating/notification/city/marketplace/search hooks
- Analytics export cut off at the bottom — capture-safe padding + deterministic clone layout
- Analytics export slowness (~13× faster: ignore-marking + dynamic scale)
- html2canvas `oklab()` crash on exports
- Notification panel clipped off-screen on the left in RTL
- "INVITE CONNECTIONS" buttons dead — now deep-link to the invite modal
- Friend-request toast text translated while member names stay as sent

### Removed
- 40 dead/stub files and 27 unused imports (cleanup pass)
- Orphaned `UserDashboardView` / `UserDashboardPageClient`

---

## [0.2.0] — 2026-08-03

**Next.js migration release.** Full migration from Vite + React to Next.js 15 App Router.

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

## [0.1.0] — 2026-05-28

**Vite legacy app (original).** The pre-Next.js version of the site — the first
iteration, used as the baseline for the migration.

- Preserved under tag `v0.1.0` (alias `v1`) and branch `vite-original`
- Codebase: React + Vite (`Sadaf-Frontend-Vite/` — frozen, do not touch)

---

## How to tag a new release

> **Note:** the GitHub Actions workflow (`release.yml`) does this automatically
> whenever `package.json` is bumped on `main` — it creates the `vX.Y.Z` tag and
> publishes the GitHub Release from the matching `## [X.Y.Z]` changelog section.

```bash
git tag -a v0.3.0 -m "SADAF v0.3.0 — <short summary>"   # annotated tag (best practice)
git push origin v0.3.0                                   # push the tag
```

Then create the release from the tag in GitHub UI (**Tags → v0.3.0 → Create release**) and paste the new section from this changelog.
