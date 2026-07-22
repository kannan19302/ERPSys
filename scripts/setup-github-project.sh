#!/usr/bin/env bash
# One-time setup: creates the GitHub Projects v2 board that .ai/COMPETITIVE_ROADMAP.md
# § 6 describes, adds its custom fields, and attaches every Epic/Story issue already
# created (#42-92) to it. Run once, by a human with `gh` CLI authenticated
# (`gh auth login` with the `project` scope: `gh auth refresh -s project`).
#
# Why this can't be done by the agent itself: GitHub's Projects v2 board-creation
# and add-item mutations are not exposed by the GitHub MCP tool surface available
# to this session (only classic REST issue/label/PR operations are). This script
# is the fastest path for a human to finish the one step the agent could not.
#
# Usage:
#   gh auth refresh -s project   # one-time, if you haven't granted the project scope
#   ./scripts/setup-github-project.sh

set -euo pipefail

OWNER="kannan19302"
OWNER_FLAG="@me"
REPO="erpsys"
TITLE="UniERP Roadmap"

echo "==> Creating project '$TITLE' for $OWNER..."
PROJECT_JSON=$(gh project create --owner "$OWNER_FLAG" --title "$TITLE" --format json)
PROJECT_NUMBER=$(echo "$PROJECT_JSON" | grep -o '"number":[0-9]*' | head -1 | grep -o '[0-9]*')
PROJECT_ID=$(echo "$PROJECT_JSON" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "    Project #$PROJECT_NUMBER created (id=$PROJECT_ID)."

echo "==> Adding custom fields (per COMPETITIVE_ROADMAP.md § 6)..."
gh project field-create "$PROJECT_NUMBER" --owner "$OWNER_FLAG" --name "Epic" --data-type TEXT
gh project field-create "$PROJECT_NUMBER" --owner "$OWNER_FLAG" --name "Sprint" --data-type NUMBER
gh project field-create "$PROJECT_NUMBER" --owner "$OWNER_FLAG" --name "Story Points" --data-type NUMBER
gh project field-create "$PROJECT_NUMBER" --owner "$OWNER_FLAG" --name "Status" --data-type SINGLE_SELECT \
  --single-select-options "Backlog,Ready,In Progress,In Review,Done"
gh project field-create "$PROJECT_NUMBER" --owner "$OWNER_FLAG" --name "Phase" --data-type SINGLE_SELECT \
  --single-select-options "F-Foundation,M-Strengthening,X-Expansion"
gh project field-create "$PROJECT_NUMBER" --owner "$OWNER_FLAG" --name "Module" --data-type SINGLE_SELECT \
  --single-select-options "$(printf '%s,' finance advanced-finance crm sales hr advanced-hr procurement supply-chain inventory manufacturing projects communication builder saas admin saas-portal pos marketplace ecommerce auth analytics reporting documents storage drive workflow notifications ai blockchain fixed-assets people subscriptions api-platform localization devops ext-gateway pwa saved-views outbox search healthcare education real-estate field-service | sed 's/,$//')"

echo "==> Attaching issues #42-92 (Epics + PI-1 Finance stories)..."
for n in $(seq 42 92); do
  url="https://github.com/${OWNER}/${REPO}/issues/${n}"
  gh project item-add "$PROJECT_NUMBER" --owner "$OWNER_FLAG" --url "$url" >/dev/null 2>&1 \
    && echo "    added #$n" \
    || echo "    skipped #$n (already added or not found)"
done

echo "==> Done. View it at: https://github.com/users/${OWNER}/projects/${PROJECT_NUMBER}"
echo "    From now on, the sprint-sync skill will populate the Epic/Sprint/Status/Module"
echo "    fields on every issue it creates or updates going forward."
