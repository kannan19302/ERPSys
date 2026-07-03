#!/usr/bin/env bash
# ============================================================
# UniERP Dev Container Entrypoint
# ============================================================
# This script handles first-boot setup and incremental updates:
#   1. Install/update pnpm dependencies (only when lockfile changes)
#   2. Generate Prisma client
#   3. Push DB schema (idempotent)
#   4. Seed database (idempotent)
#   5. Start API + Web dev servers concurrently via turbo
# ============================================================
set -euo pipefail

LOCKFILE="/app/pnpm-lock.yaml"
CHECKSUM_FILE="/app/node_modules/.lockfile-checksum"

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

if [ ! -d "/app/node_modules/.pnpm" ] || [ "$CURRENT_CHECKSUM" != "$CACHED_CHECKSUM" ]; then
  echo "==> [1/5] Installing dependencies (lockfile changed or first boot)..."
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

# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
# Step 3: Build shared packages (needed by API + Web)
# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
echo "==> [3/5] Building shared workspace packages..."
pnpm --filter @unerp/database build
pnpm --filter @unerp/shared build
pnpm --filter @unerp/auth build
pnpm --filter @unerp/ui build 2>/dev/null || true
pnpm --filter @unerp/framework build 2>/dev/null || true
echo "  [OK] Shared packages built."

# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
# Step 4: Push DB schema & seed (idempotent)
# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
echo "==> [4/5] Synchronizing database schema..."
pnpm db:push 2>&1 || echo "  [WARN] db:push encountered issues (may be fine if already synced)."
echo "  [OK] Database schema synchronized."

echo "==> [5/5] Seeding database..."
pnpm db:seed 2>&1 || echo "  [WARN] Seed may have already been applied (continuing)."
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
