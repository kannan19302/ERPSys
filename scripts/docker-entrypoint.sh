#!/usr/bin/env bash
# ============================================================
# UniERP Dev Container Entrypoint
# ============================================================
# This script handles first-boot setup and incremental updates:
#   1. Install/update pnpm dependencies (only when lockfile changes)
#   2. Generate Prisma client
#   3. Apply recorded DB migrations (fail closed on history drift)
#   4. Seed database (idempotent)
#   5. Start API + Web dev servers concurrently via turbo
# ============================================================
set -euo pipefail

LOCKFILE="/app/pnpm-lock.yaml"
CHECKSUM_FILE="/app/node_modules/.lockfile-checksum"
WORKSPACE_LINKS=(
  "/app/packages/auth/node_modules/@unerp/shared"
  "/app/packages/auth/node_modules/@unerp/database"
  "/app/apps/api/node_modules/@unerp/shared"
  "/app/apps/api/node_modules/@unerp/auth"
  "/app/apps/web/node_modules/@unerp/ui"
)

echo ""
echo "============================================"
echo "  UniERP Dev Container â€” Starting Up..."
echo "============================================"
echo ""

# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
# Step 1: Install dependencies (only if needed)
# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
# Step 2: Generate Prisma client
# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
pnpm --filter "@unerp/ui-*" build 2>/dev/null || true
pnpm --filter @unerp/ui build 2>/dev/null || true
pnpm --filter @unerp/framework build 2>/dev/null || true
echo "  [OK] Shared packages built."

# ─────────────────────────────────────────────────
# Step 4: Apply migration history & seed (idempotent)
# Use DATABASE_OWNER_URL for migrations (superuser role),
# then the app runtime uses DATABASE_URL (unerp_api role).
# ─────────────────────────────────────────────────
echo "==> [4/5] Applying recorded database migrations..."
DATABASE_URL="$DATABASE_OWNER_URL" pnpm db:deploy
echo "  [OK] Database migrations applied."

echo "==> [5/5] Seeding database..."
DATABASE_URL="$DATABASE_OWNER_URL" pnpm db:seed
echo "  [OK] Database seeded."

# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
# Start dev servers
# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
echo ""
echo "============================================"
echo "  UniERP Dev Servers Starting..."
echo "============================================"
echo ""
echo "  API Backend:   http://localhost:3001/api/v1"
echo "  Web Frontend:  http://localhost:3000"
echo "  Swagger Docs:  http://localhost:3001/swagger"
echo ""
echo "  Code changes on the host are live-reloaded."
echo "  Press Ctrl+C to stop."
echo ""

# Run both dev servers concurrently.
# turbo run dev runs both @unerp/api (nest --watch) and @unerp/web (next dev) in parallel.
# We use exec so tini can properly manage the process tree.
exec pnpm dev
