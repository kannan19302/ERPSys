#!/usr/bin/env bash
# ============================================================
# UniERP API Container Entrypoint
# ============================================================
# Runs the one-time monorepo setup (deps, Prisma client, shared
# package builds, migrations, seed) and then starts only the API
# dev server. The web container waits on the "shared packages
# built" marker this script writes, then starts independently —
# editing API code only restarts this container, not web's.
# ============================================================
set -euo pipefail

LOCKFILE="/app/pnpm-lock.yaml"
CHECKSUM_FILE="/app/node_modules/.lockfile-checksum"
READY_MARKER="/app/node_modules/.shared-packages-built"
WORKSPACE_LINKS=(
  "/app/packages/auth/node_modules/@unerp/shared"
  "/app/packages/auth/node_modules/@unerp/database"
  "/app/apps/api/node_modules/@unerp/shared"
  "/app/apps/api/node_modules/@unerp/auth"
  "/app/apps/web/node_modules/@unerp/ui"
)

echo ""
echo "============================================"
echo "  UniERP API Container — Starting Up..."
echo "============================================"
echo ""

rm -f "$READY_MARKER"

# ─────────────────────────────────────────────────
# Step 1: Install dependencies (only if needed)
# ─────────────────────────────────────────────────
CURRENT_CHECKSUM=""
if [ -f "$LOCKFILE" ]; then
  CURRENT_CHECKSUM=$(md5sum "$LOCKFILE" | awk '{print $1}')
fi

CACHED_CHECKSUM=""
if [ -f "$CHECKSUM_FILE" ]; then
  CACHED_CHECKSUM=$(cat "$CHECKSUM_FILE")
fi

WORKSPACE_LINKS_READY=true
for link in "${WORKSPACE_LINKS[@]}"; do
  if [ ! -e "$link" ]; then
    WORKSPACE_LINKS_READY=false
    break
  fi
done

if [ ! -d "/app/node_modules/.pnpm" ] || [ "$CURRENT_CHECKSUM" != "$CACHED_CHECKSUM" ] || [ "$WORKSPACE_LINKS_READY" != true ]; then
  echo "==> [1/5] Installing dependencies (lockfile, first boot, or workspace links changed)..."
  pnpm install --no-frozen-lockfile
  echo "$CURRENT_CHECKSUM" > "$CHECKSUM_FILE"
  echo "  [OK] Dependencies installed."
else
  echo "==> [1/5] Dependencies up-to-date (skipping install)."
fi

# ─────────────────────────────────────────────────
# Step 2: Generate Prisma client
# ─────────────────────────────────────────────────
echo "==> [2/5] Generating Prisma client..."
pnpm --filter @unerp/database exec prisma generate
echo "  [OK] Prisma client generated."

# ─────────────────────────────────────────────────
# Step 3: Build shared packages (needed by API + Web)
# ─────────────────────────────────────────────────
echo "==> [3/5] Building shared workspace packages..."
pnpm --filter @unerp/database build
pnpm --filter @unerp/shared build
pnpm --filter @unerp/auth build
# Build all UI sub-packages (they now have dist/ as their entry point)
pnpm --filter @unerp/ui-tokens build 2>/dev/null || true
pnpm --filter @unerp/ui-theme build 2>/dev/null || true
pnpm --filter @unerp/ui-utils build 2>/dev/null || true
pnpm --filter @unerp/ui-hooks build 2>/dev/null || true
pnpm --filter @unerp/ui-icons build 2>/dev/null || true
pnpm --filter @unerp/ui-components build 2>/dev/null || true
pnpm --filter @unerp/ui-layout build 2>/dev/null || true
pnpm --filter @unerp/ui-charts build 2>/dev/null || true
pnpm --filter @unerp/ui-data-grid build 2>/dev/null || true
pnpm --filter @unerp/ui-dashboard build 2>/dev/null || true
pnpm --filter @unerp/ui-notifications build 2>/dev/null || true
pnpm --filter @unerp/ui-form-engine build 2>/dev/null || true
pnpm --filter @unerp/ui-workflow build 2>/dev/null || true
# Build UI facade (depends on all ui-* above)
pnpm --filter @unerp/ui build 2>/dev/null || true
# Build frontend framework (depends on @unerp/ui)
pnpm --filter @unerp/framework build 2>/dev/null || true
echo "  [OK] Shared packages built."

# Signal the web container it can start compiling now.
touch "$READY_MARKER"

# ─────────────────────────────────────────────────
# Step 4: Apply migration history & seed (idempotent)
# ─────────────────────────────────────────────────
echo "==> [4/5] Applying recorded database migrations..."
DATABASE_URL="$DATABASE_OWNER_URL" pnpm db:deploy || DATABASE_URL="$DATABASE_OWNER_URL" pnpm --filter @unerp/database exec prisma db push --accept-data-loss
echo "  [OK] Database migrations applied."

echo "==> [5/5] Seeding database..."
DATABASE_URL="$DATABASE_OWNER_URL" pnpm db:seed
echo "  [OK] Database seeded."

echo ""
echo "============================================"
echo "  UniERP API Dev Server Starting..."
echo "============================================"
echo ""
echo "  API Backend:   http://localhost:3001/api/v1"
echo "  Swagger Docs:  http://localhost:3001/swagger"
echo ""
echo "  Code changes on the host are live-reloaded."
echo "  Press Ctrl+C to stop."
echo ""

exec pnpm --filter @unerp/api dev
