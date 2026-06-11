#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="${SCRIPT_DIR}/.."
WEB_APP_DIR="${REPO_ROOT}/apps/web"

if ! command -v pnpm >/dev/null 2>&1; then
  echo "Error: pnpm is not installed. Install pnpm and try again."
  exit 1
fi

cd "${WEB_APP_DIR}"

PORT="${1:-3000}"
export PORT

echo "Starting @unerp/web frontend in ${WEB_APP_DIR} on http://localhost:${PORT}"
pnpm dev -- --port "${PORT}"
