#!/usr/bin/env bash
# ============================================================
# UniERP Web Container Entrypoint
# ============================================================
# Does NOT install deps, generate Prisma, build shared packages,
# or run migrations/seed — the API container's entrypoint does
# all of that once (deps/dist land on the same bind mount +
# shared node_modules volumes). This just waits for that "shared
# packages built" marker, then starts only the Next.js dev
# server — editing web code never restarts the API container.
# ============================================================
set -euo pipefail

READY_MARKER="/app/node_modules/.shared-packages-built"

echo ""
echo "============================================"
echo "  UniERP Web Container — Starting Up..."
echo "============================================"
echo ""
echo "==> Waiting for API container to finish installing deps"
echo "    and building shared workspace packages..."

until [ -f "$READY_MARKER" ]; do
  sleep 2
done

echo "  [OK] Shared packages ready."
echo ""
echo "============================================"
echo "  UniERP Web Dev Server Starting..."
echo "============================================"
echo ""
echo "  Web Frontend:  http://localhost:3000"
echo ""
echo "  Code changes on the host are live-reloaded."
echo "  Press Ctrl+C to stop."
echo ""

exec pnpm --filter @unerp/web dev
