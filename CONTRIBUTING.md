# Contributing — SADAF Frontend

This document is the **single source of truth** for how changes land in this
repository. It replaces the old workflow of "commit + push the same tree to
`main` and `nextjs-clean`" — that workflow caused the two branches to drift
apart (30 commits × 34 diverged) and made every batch double work.

## Source of truth & branch policy

- **`main` is the only branch that receives work.** All feature work is
  developed on short-lived `feature/*` branches and merged into `main`.
  Never push directly to `main`, and never maintain parallel copies of a
  change on other branches.
- **`nextjs-clean` is LOCKED (archived).** It is frozen at commit `0d7a585`
  (tag `archive/nextjs-clean`, pushed 2026-08-11). It is read-only — no new
  commits, no merges into it, ever. It exists only so the pre-archive tree
  can still be inspected. Do not delete it; do not update it.
- **`archive/pre-split-1195b98`** preserves the original mega-commit
  (118 files) that was split into 6 logical commits on 2026-08-11. Use it
  for reference/diffing — it is also read-only.

## Standard workflow (GitHub Flow)

1. Start from an up-to-date `main`:
   ```bash
   git checkout main
   git pull
   git checkout -b feature/<short-name>
   ```
2. Implement the feature in **small, focused commits** (see conventions
   below). Commit early and often; each commit should be one logical change.
3. Push the branch:
   ```bash
   git push -u origin feature/<short-name>
   ```
4. Merge into `main` (review via PR, or merge locally after verification).
5. Delete the branch after the merge:
   ```bash
   git branch -d feature/<short-name>
   git push origin --delete feature/<short-name>
   ```

Branch naming: `feature/<short-name>` (e.g. `feature/arabic-i18n`).
Branches are temporary — at any moment there should only be 1–3 active
branches, and the total branch count stays roughly constant.

## Commit conventions

- **One logical change per commit.** If a session produces a batch that
  spans several features, split it into several commits instead of one giant
  commit. Each commit should leave the tree in a working state where
  practical.
- **Imperative, descriptive subject line**: "Add …", "Fix …", "Remove …",
  "Translate …". No generic subjects like "update" or "fix".
- **Bullet body** explaining what changed and why.
- **Footer** on every commit:

  ```
  🤖 Generated with Codebuff
  Co-Authored-By: Codebuff <noreply@codebuff.com>
  ```

Example:

```
Add commission withdrawals with validation and processing lifecycle

- WithdrawalRequest types + useWithdrawals hook (localStorage sandbox,
  auto-complete after processing window, double-withdraw protection)
- WithdrawPanel: available balance, modal (amount + bank/PayPal), request
  history, translated error/complete toasts
- Commission history pages for designer and sales-partner routes + APIs

🤖 Generated with Codebuff
Co-Authored-By: Codebuff <noreply@codebuff.com>
```

## What NOT to do

| ❌ Don't | ✅ Instead |
|---|---|
| Commit + push the same tree to `main` and `nextjs-clean` | Put the change on a `feature/*` branch and merge into `main` only |
| Push directly to `main` | Merge a feature branch into `main` |
| Merge anything into `nextjs-clean` | Leave it frozen at `0d7a585` |
| Force-push `main` | Only with explicit user approval — history rewrites are a last resort |
| Bundle unrelated features into one commit | One logical commit per feature |

## Local development

```bash
npm run dev:all        # Next.js on :3000 + WebSocket server on :3001
npx tsc --noEmit --ignoreDeprecations 5.0   # typecheck (exit 0 = clean)
```

- After editing `ws-server.mjs`, **restart the WebSocket server** (kill the
  process on :3001 and run `npm run dev:all` again).
- **`.next` cache gotcha**: if typecheck reports errors only inside
  `.next/dev/types/*` (generated files), the cache is stale/corrupt — delete
  `.next` and re-run the typecheck before touching any source code.
- The checkout runs on **mock/sandbox data** (localStorage + API mocks). The
  NestJS backend (`sadaf-backend/`) is not connected yet.

## Project conventions (quick reference)

- **3-layer pattern** per page: `page.tsx` (Server Component — fetches data
  only) → `<Feature>PageClient.tsx` (`'use client'` — auth gate + hooks +
  handlers) → `<Feature>View.tsx` (`'use client'` — pure presentation).
- **Navigation**: `next/link` + `ROUTES` constants from
  `src/config/routes.ts`. No hardcoded paths, no `onNavigate`.
- **Server/Client boundaries**: no hooks/state in `page.tsx`; pass function
  props through the `PageClient`.
- **Types**: shared types in `src/shared/types/index.ts`, feature types in
  `src/features/<feature>/types/index.ts` — extend, don't duplicate.
- **i18n**: all UI strings go through `t()` from the language dictionaries
  (`src/features/i18n/dictionaries.ts`); product/art data is bilingual
  (`nameAr`/`descriptionAr`/…) with safe English fallback.
- **WebSocket** (`ws-server.mjs`, port 3001): channels `dashboard:*`,
  `analytics:admin`, `notifications:user:{id}`, `notifications:global`,
  `personal:user:{id}`, `leaderboard:global`, `community:admin`. Hook
  pattern: WS-primary + REST fallback + auto-reconnect + `wsLive` badge.
- **Clean code**: single responsibility per file; no dead code, no unused
  imports, no `any` without a documented reason; no silent failures; all
  hooks before any early return; `window`/`localStorage` access only inside
  mount effects (hydration safety).
