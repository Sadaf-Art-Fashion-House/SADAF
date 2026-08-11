# CHANGELOG-FEATURES — Feature → Commit Map

A permanent reference linking every SADAF feature to the commit(s) that
introduced it. Each commit in the map is on `main`; use the 7-char hashes
with `git show <hash>` or `git log -p <hash>` to inspect it.

> **Note on history:** the mega-commit `1195b98` (2026-08-11, 118 files) was
> split into 6 logical commits. References below point to the split commits,
> which are the canonical record. The original is preserved under the tag
> `archive/pre-split-1195b98`.

## Core features (22+)

| # | Feature | What it does | Commit(s) |
|---|---|---|---|
| 1 | **Home** | Landing page with hero + featured sections | `d3330d4`, `fc74258` |
| 2 | **Artworks** | Art pieces gallery with categories | `d3330d4`, `fc74258` |
| 3 | **Fashion** | Collection view with `?category=` deep-link | `d3330d4`, `fc74258` |
| 4 | **Gallery** | Virtual showcase wall | `d3330d4`, `fc74258` |
| 5 | **Store** | Catalog with filters + aggregated ratings | `d3330d4`, `828daf9`, `4613e76`, `fc74258` |
| 6 | **Auth** | Email/password + Google OAuth, Supabase + sandbox fallback; role-based validation (company website/social, family/friends referral) | `d3330d4`, `ea52122`, `06e3ae4` |
| 7 | **Cart** | Zustand store, persistence + cross-tab sync | `fadb416`, `ba5d3ea`, `4613e76`, `fc74258` |
| 8 | **Wishlist** | Zustand store, persistence + cross-tab sync | `fadb416`, `ba5d3ea`, `4613e76`, `fc74258` |
| 9 | **Checkout** | PayPal / bank transfer with payment fields | `fadb416`, `fc74258` |
| 10 | **Atelier** | Digital atelier; designer submissions + admin approve/reject tab | `e1d4046`, `06e3ae4`, `4613e76`, `fc74258` |
| 11 | **AI Studio** | AI design generation + publish pipeline + saved designs | `d3330d4`, `e1d4046`, `fc74258` |
| 12 | **Exhibition** | Virtual room with multi-language TTS (EN/AR/FR/DE), voice tuning (speed/pitch), RTL transcript | `fadb416`, `44ddaab`, `64c9373`, `db1bcaa`, `fc2809a`, `fc74258` |
| 13 | **Search** | Global search across catalog/art | `d50c5ab`, `17ba9ee`, `fc74258` |
| 14 | **Reviews** | Write from delivered orders; YOU badge, Edited tags, interactive star filter, delete, aggregated ratings, PDP review card | `d50c5ab`, `17ba9ee`, `828daf9`, `4613e76`, `fc74258` |
| 15 | **Notifications** | Bell + WebSocket (global + user channels), unread badge, mute toggle, browser permission | `d50c5ab`, `01d65af`, `4e648dd`, `982c1a1`, `933a5ce` |
| 16 | **Customer Dashboard** | Sidebar + profile + orders + settings | `06e3ae4`, `ba5d3ea`, `01d65af`, `933a5ce` |
| 17 | **Customer Analysis** | KPIs + smart recommendations + my activity + rewards + live order status | `01d65af`, `8ae42df`, `ac57d24` |
| 18 | **Community** | Network graph + friend requests (live via WS, badge, toast with Accept/Decline) + invite modal | `17ba9ee`, `686790b`, `c869da2`, `fc74258` |
| 19 | **Leaderboard** | Customer/Admin/Founder + kind switcher (points/sales/designs) + live WS + city filter + tier counters + overtake alerts | `8ae42df`, `4e648dd`, `f2e5cc0`, `fc74258` |
| 20 | **Admin Dashboard** | Sidebars + analytics + error logs + email settings + leaderboard + atelier tab | `d8de3d4`, `17ba9ee`, `01d65af`, `828daf9`, `8c40480`, `933a5ce` |
| 21 | **Founder Dashboard** | Same admin suite for the founder role | `828daf9`, `8c40480`, `933a5ce` |
| 22 | **Analytics** | Charts + export PNG/PDF + watermark + live events feed + export perf/cropping fixes | `17ba9ee`, `01d65af`, `b7c000a`, `c4425a6`, `af78ebe`, `4613e76`, `933a5ce` |
| 23 | **Error Logging** | Export JSON + email + shared ErrorBanner + 404/500 pages + error boundaries | `d8de3d4`, `2d3be5b`, `e63e8a3`, `933a5ce` |

## Phase 2 — roles, monetization & platform

| Feature | What it does | Commit(s) |
|---|---|---|
| **PDP `/store/[id]`** | Standalone product page, deep-linked from store/wishlist/search; multi-image gallery; star distribution | `828daf9`, `4613e76`, `fc74258` |
| **Designer Dashboard** | Portfolio + atelier submissions + expected commission KPI breakdown | `828daf9`, `4613e76` |
| **Sales Partner Dashboard** | Referral link + commission counter + successful referrals table | `828daf9`, `4613e76`, `60557cb` |
| **Company workspace + Connections** | Designer–company connection hub | `828daf9` |
| **Community Overview (Admin/Founder)** | KPIs + top referrers + network growth + pending requests, live `community:admin` channel | `8c40480` |
| **Loyalty points from orders** | 1 pt per $1 on Delivered + auto tier (replaces mock jitter) | `4e648dd` |
| **Commission withdrawals** | Request + validation + processing lifecycle + history | `4613e76`, `56555a0` |
| **Share links** | WhatsApp/Facebook/X/Telegram/Email + native share | `60557cb` |
| **Monthly performance chart** | 12-month spend bars + KPIs on the customer dashboard | `ac57d24` |
| **Arabic i18n (bilingual)** | Language provider + dictionaries + bilingual catalog data (nameAr/descriptionAr/…) + RTL fixes | `982c1a1`, `fc74258`, `933a5ce` |
| **Middleware route guards** | Protect `/dashboard/admin`, `/dashboard/founder`, `/dashboard`; `/auth` redirect for signed-in; `?redirect=` param | `0b38a47` |
| **Avatar upload** | Profile photo upload (local storage) + display across leaderboard/community/reviews | `0b38a47`, `4613e76` |
| **Unified toasts + role badges** | SuccessToast + role badges in sidebars/profile/leaderboard/community | `933a5ce` |

## Platform & infrastructure

| Item | What it does | Commit(s) |
|---|---|---|
| **Next.js migration** | Vite → Next.js 15 App Router, route groups, Turbopack fixes | `d3330d4`, `6b508e3` |
| **ROUTES constants** | Central navigation config (`src/config/routes.ts`) | `d8de3d4` |
| **WebSocket server** | `ws-server.mjs` on :3001 — `dashboard:*`, `analytics:admin`, `notifications:user:{id}`, `notifications:global`, `personal:user:{id}`, `leaderboard:global`, `community:admin` | `d50c5ab`, `01d65af`, `8ae42df`, `686790b`, `8c40480`, `982c1a1` |
| **Auto-release workflow** | GitHub Actions version bump + release | `f7abd66` |
| **Cleanup passes** | Shared ErrorBanner, dead-code removal (40 files / 27 imports), orphaned files | `2d3be5b`, `f7a8d53`, `933a5ce` |

## Timeline

```
2026-07-05  c78323a  Initial commit (create-next-app)
2026-07-20  d3330d4  Migration to Next.js — features, auth, AI Studio
2026-07-20  ea52122  Signup page, header, assets
2026-07-21  fadb416  Cart, Wishlist, Checkout, Exhibition
2026-07-21  e1d4046  AI Studio publishing, dashboard details, Exhibition audio
2026-07-21 44ddaab  Exhibition voice tuning (voice/speed/pitch)
2026-07-22  64c9373  Arabic TTS + bilingual curatorial stories
2026-07-22  db1bcaa  FR/DE TTS, persistence, responsive
2026-07-22  fc2809a  Arabic voice selection fix
2026-07-26  6b508e3  Route groups restructure, Turbopack fix
2026-07-27  d8de3d4  Atelier, 404/500, ROUTES, Error Logging + email
2026-07-27  06e3ae4  Profile migration, Atelier restore
2026-07-27  ba5d3ea  Profile/Orders/Wishlist pages + Orders store
2026-07-29  d50c5ab  Search/Reviews/Notifications + WS
2026-07-29  17ba9ee  Analytics, Community, Watermark, mock data
2026-08-02  e63e8a3  ErrorGuidance + unified export handling
2026-08-02  b7c000a  html2canvas oklab export fix
2026-08-03  1dfe78e  CHANGELOG v0.1.0
2026-08-03  2d3be5b  Shared ErrorBanner extraction
2026-08-03  f7abd66  Auto-release workflow
2026-08-03  01d65af  Real-time notifications bell, analytics live events, analysis
2026-08-05  8ae42df  Real-time leaderboard, activity alerts, rewards, friend requests
2026-08-05  c869da2  INVITE CONNECTIONS fix
2026-08-05  c4425a6  Export cropping fix
2026-08-05  af78ebe  Export perf ~13x
2026-08-06  4e648dd  City filter, tier counters, loyalty points, mute, overtake alerts
2026-08-06  f2e5cc0  RewardsPanel city filter + ?city= deep-link
2026-08-08  686790b  Live friend requests over WS
2026-08-08  8c40480  Admin/Founder Community Overview
2026-08-08  0b38a47  Middleware guards, avatar upload
2026-08-08  f7a8d53  Dead-code cleanup
2026-08-08  828daf9  Role dashboards, PDP, live reviews/connections
2026-08-09  4613e76  Commission breakdowns, review lifecycle, live-data hardening
2026-08-11  982c1a1  i18n core (split of 1195b98)
2026-08-11  fc74258  Arabic translations (split of 1195b98)
2026-08-11  60557cb  Referral share links (split of 1195b98)
2026-08-11  56555a0  Commission withdrawals (split of 1195b98)
2026-08-11  ac57d24  Monthly performance chart (split of 1195b98)
2026-08-11  933a5ce  Toasts, role badges, RTL fixes, error boundaries (split of 1195b98)
2026-08-11  ed070e4  CONTRIBUTING.md (git protocol)
2026-08-11  28dfd9e  Merge feature/docs-contributing
```

## How to use this map

```bash
# Inspect the changes that introduced a feature (e.g. Analytics)
git show af78ebe

# List every commit touching a feature folder (e.g. reviews)
git log --oneline -- src/features/reviews

# Diff a feature between two points
git diff 17ba9ee..933a5ce -- src/features/analytics
```
