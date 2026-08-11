# SADAF — Deployment Map

A living reference for building and deploying every SADAF version. Read this
before any deploy-related work. Facts marked with a date were verified on
that day; update this file whenever the deploy state changes.

## Version map (git)

| Version | Tag(s) | Branch | Commit | What it is |
|---|---|---|---|---|
| **v0.3.0** (current) | `v0.3.0` | `main` | `057cf66` | Next.js app: real-time layer, role dashboards, Arabic i18n, commissions/withdrawals, share links |
| **v0.2.0** | `v0.2.0` | `release/0.2.0` | `1dfe78e` | Next.js 15 migration (3-layer, storefront, AI Studio, exhibition TTS, analytics, error logging) |
| **v0.1.0** | `v0.1.0`, `v1` (alias) | `vite-original` | `ccc9946` | Vite legacy app (pre-Next.js) — baseline archive |

Other refs: `nextjs-clean` (locked/archived at `0d7a585`), `archive/nextjs-clean`,
`archive/pre-split-1195b98` (read-only).

## Link status (verified 2026-08-11)

| Link | Version | Status | Content |
|---|---|---|---|
| `https://sadaf-nu.vercel.app/` | v0.3.0 (production) | ✅ HTTP 200 | SADAF Next.js app (from `main`) |
| `https://sadaf-v1.vercel.app/` | v0.1.0 (archive) | ✅ HTTP 200 | SADAF Vite legacy app |
| `https://sadaf-v2.vercel.app/` | v0.2.0 (archive) | ✅ HTTP 200 | SADAF Next.js migration app |

### Vercel state (verified 2026-08-11)
- Vercel CLI **58.9.1** installed; logged in as `muhammedayoubabdllah997`.
- Projects: `sadaf` (production, alias sadaf-nu), `sadaf-v1`, `sadaf-v2` —
  all with **framework = `nextjs`** (v1 deploys the Vite app via the project's
  build config) and **deployment protection OFF**.
- Deploys are **file-based** — Git auto-deploy is NOT connected because the
  repo is private and the Vercel GitHub App lacks access. **To redeploy any
  version: `./redeploy.sh <v1|v2|v3>`** (the script manages its own throwaway
  worktree under `/tmp/sadaf-deploy`, links the project, and deploys). To
  enable auto-deploy, grant the Vercel GitHub App access to the repo in the
  GitHub org settings.

## How to deploy each version

### Recommended: Vercel dashboard (reliable, no CLI needed)
For each archive project: **Add New → Project → import the SADAF repo →
set the production branch → name the project → Deploy**.

| Project | Production branch | Link |
|---|---|---|
| `sadaf-nu` (existing — FIX) | `main` | `sadaf-nu.vercel.app` → v0.3.0 |
| `sadaf-v2` (new) | `release/0.2.0` | `sadaf-v2.vercel.app` → v0.2.0 |
| `sadaf-v1` (new) | `vite-original` | `sadaf-v1.vercel.app` → v0.1.0 |

**Fix the main link first**: open the `sadaf-nu` project → Settings → Git →
make sure the repository is `Sadaf-Art-Fashion-House/SADAF` and the
Production Branch is `main`. Any push to `main` then auto-deploys v0.3.0.

> Keep the production link (`sadaf-nu.vercel.app`) pointing at the latest
> version at all times. Archive links (`sadaf-v1/v2`) are static demos of
> old versions — they exist so the site's evolution stays reachable.

### CLI (after `vercel login` succeeds)
```bash
# in a folder checked out to the target branch:
vercel link --yes --project sadaf-v1
vercel deploy --prod
# set which branch is "production" for the project:
vercel api PATCH /v9/projects/sadaf-v1 -d '{"git":{"productionBranch":"vite-original"}}'
```
(Exact project-creation flags may vary by CLI version — the dashboard flow
above is the documented, stable path.)

## Build & run locally

| Version | Commands (from a checkout of the branch) |
|---|---|
| v0.3.0 (`main`) | `npm i` → `npm run dev:all` (Next :3000 + WS :3001) · typecheck: `npx tsc --noEmit --ignoreDeprecations 5.0` |
| v0.2.0 (`release/0.2.0`) | `npm i` → `npm run dev` (Next :3000) |
| v0.1.0 (`vite-original`) | `npm i` → `npm run dev` (`tsx server.ts` — Vite app, uses `@google/genai`) |

## Release process (new version)

1. Bump `package.json` version + add a `## [X.Y.Z]` section to `CHANGELOG.md`
   (Keep a Changelog format, newest on top).
2. Land via the git protocol (`CONTRIBUTING.md`): `feature/<name>` branch →
   merge into `main` → push.
3. The GitHub Actions workflow (`release.yml`) auto-creates the `vX.Y.Z`
   annotated tag and a GitHub Release with the matching CHANGELOG notes.
4. Vercel auto-deploys `main` → `sadaf-nu.vercel.app` (once the project is
   connected).

## Backend strategy (when wiring `sadaf-backend/`)

- `sadaf-backend/` (NestJS + Prisma) is **one codebase** that serves the
  live frontend — there is no per-version backend.
- v0.1.0 (Vite) and v0.2.0 (migration) are **mock-data archives** — they
  never had a real backend and never will; they are static archives.
- Wiring the backend is a **significant change → cut a new release**
  (`v0.4.0`), do not silently "add" it to v0.3.0. Give the backend its own
  semver (`sadaf-backend` 0.1.0) alongside the frontend release it first
  ships with.
- Small fixes to a released version → patch bump (`v0.3.1`).
