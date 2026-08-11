#!/usr/bin/env bash
#
# SADAF redeploy script — deploy any version to its Vercel project.
#
# Usage:
#   ./redeploy.sh <v1|v2|v3|0.1.0|0.2.0|0.3.0>
#
# Version map (see DEPLOYMENT.md):
#   v1 = vite-original     -> project sadaf-v1  -> sadaf-v1.vercel.app
#   v2 = release/0.2.0     -> project sadaf-v2  -> sadaf-v2.vercel.app
#   v3 = main              -> project sadaf     -> sadaf-nu.vercel.app
#
# Notes:
#   - Requires the Vercel CLI to be installed and logged in (`vercel whoami`).
#   - Deploys are file-based (the repo is private and the Vercel GitHub App
#     lacks access), so this script manages a throwaway git worktree per
#     version under ${SADAF_WORKTREE_BASE:-/tmp/sadaf-deploy}.
#   - Run from anywhere; the script resolves the repo root from its own path.
#
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKTREE_BASE="${SADAF_WORKTREE_BASE:-/tmp/sadaf-deploy}"

declare -A BRANCH=([v1]="vite-original" [v2]="release/0.2.0" [v3]="main")
declare -A PROJECT=([v1]="sadaf-v1" [v2]="sadaf-v2" [v3]="sadaf")

VER="${1:-}"
case "$VER" in
  0.1.0) VER=v1 ;;
  0.2.0) VER=v2 ;;
  0.3.0) VER=v3 ;;
esac

if [[ -z "${BRANCH[$VER]:-}" ]]; then
  echo "Usage: $0 <v1|v2|v3|0.1.0|0.2.0|0.3.0>" >&2
  exit 1
fi

if ! command -v vercel >/dev/null 2>&1; then
  echo "Error: vercel CLI not found. Install with: npm i -g vercel" >&2
  exit 1
fi
if ! vercel whoami >/dev/null 2>&1; then
  echo "Error: not logged in to Vercel. Run: vercel login" >&2
  exit 1
fi

TARGET_BRANCH="${BRANCH[$VER]}"
TARGET_PROJECT="${PROJECT[$VER]}"
WORKTREE="$WORKTREE_BASE/$VER"

echo "→ Deploying $VER ($TARGET_BRANCH) to project $TARGET_PROJECT"

cd "$REPO_DIR"
git fetch origin --quiet

if [[ -d "$WORKTREE/.git" ]]; then
  echo "→ Refreshing worktree $WORKTREE"
  git -C "$WORKTREE" fetch origin --quiet
  git -C "$WORKTREE" reset --hard --quiet "origin/$TARGET_BRANCH"
else
  echo "→ Creating worktree $WORKTREE"
  git worktree add --detach "$WORKTREE" "origin/$TARGET_BRANCH"
fi

cd "$WORKTREE"

# Link only when not already linked to the right project.
if [[ ! -f .vercel/project.json ]] || ! grep -q "\"$TARGET_PROJECT\"" .vercel/project.json 2>/dev/null; then
  echo "→ Linking to project $TARGET_PROJECT"
  vercel link --yes --project "$TARGET_PROJECT" >/dev/null
fi

echo "→ Running vercel deploy --prod"
vercel deploy --prod --yes

echo "✓ $VER deployed (${TARGET_BRANCH})"
