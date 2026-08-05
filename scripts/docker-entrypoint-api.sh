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
# Step 2: Generate the Prisma client
# ─────────────────────────────────────────────────
# The database package is the published @unerp/database now, not a workspace
# member, so `pnpm --filter @unerp/database` matches nothing and printed
# "No projects matched the filters in /app" — a no-op that looked like a step.
# Generate from the installed package instead.
echo "==> [2/5] Generating Prisma client..."
DB_PKG=/app/node_modules/@unerp/database
if [ -d "$DB_PKG/prisma" ]; then
  # TWO clients, not one. @unerp/database's entrypoint imports
  # './idp-client/index.js', which is produced by generating the separate IdP
  # schema — § 5.2 gives each plane its own identity realm, so the IdP has its
  # own datasource. Generating only the main schema compiled cleanly and then
  # crashed at runtime with `Cannot find module './idp-client/index.js'`, which
  # is the worst kind of failure: invisible to the type checker.
  (cd "$DB_PKG" && npx prisma generate --schema prisma/schema)
  if [ -f "$DB_PKG/prisma/idp-schema.prisma" ]; then
    (cd "$DB_PKG" && npx prisma generate --schema prisma/idp-schema.prisma)
    # The generator writes to src/idp-client, but dist/index.js requires
    # './idp-client/index.js' relative to ITSELF. In the monorepo a build script
    # (copy-generated-client.mjs) bridged that gap; the published package has no
    # build step, so the copy happens here or the API dies at import time with
    # `Cannot find module './idp-client/index.js'` — after compiling cleanly.
    if [ -d "$DB_PKG/src/idp-client" ] && [ -d "$DB_PKG/dist" ]; then
      rm -rf "$DB_PKG/dist/idp-client"
      cp -r "$DB_PKG/src/idp-client" "$DB_PKG/dist/idp-client"
    fi
  fi
  echo "  [OK] Prisma clients generated from @unerp/database (main + IdP)."
else
  echo "  [FAIL] @unerp/database is not installed, or ships no prisma/ directory."
  echo "         The package must include prisma/ in its files allowlist."
  exit 1
fi

# ─────────────────────────────────────────────────
# Step 3: Shared packages
# ─────────────────────────────────────────────────
# Nothing to build. Every @unerp/* package arrives from the registry already
# built — that is the point of publishing them.
#
# This step used to build @unerp/ui-tokens, ui-theme, ui-components and ten more
# siblings. Those were collapsed into a single @unerp/ui with subpath exports,
# so every one of those filters had been matching nothing — silently, because
# each ended in `2>/dev/null || true`. A build step that cannot fail is a build
# step that is not running.
echo "==> [3/5] Shared packages come prebuilt from the registry — nothing to build."

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
