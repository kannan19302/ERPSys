---
name: sprint-sync
description: Sync the current DEV/QA cycle's work to GitHub Issues (Epics/Sprints/Stories) per .ai/COMPETITIVE_ROADMAP.md. Not a third ADP flow — invoked as a step inside the existing /start and /harden flows' Record+Ship stage, or manually to backfill/regenerate the GitHub-side tracking. Use when the user says "sync sprint", "sprint-sync", "update the roadmap board", or "track this cycle on GitHub".
---

# Sprint-sync — GitHub tracking for the ADP

This skill is the bridge between the ADP's file-based state of record
(`MODULE_REGISTRY.md`, `CHANGELOG.md`, `.ai/IMPLEMENTATION_PLAN.md`) and
GitHub Issues, per `.ai/COMPETITIVE_ROADMAP.md`. It does not replace the
3-file tracking convention (AGENTS.md) — it mirrors a slice of it onto
GitHub so progress is visible outside the repo's own docs. It is invoked
from AUTOPILOT.md § Shared bindings #19 (Record+Ship, both flows), and can
also be run standalone to catch up tracking that drifted.

The ADP still has **exactly two flows** (DEV, QA) — this skill adds no
third trigger to that state machine; it is a bookkeeping step those two
flows call, same as `cycle-report.mjs` or `module-health.mjs`.

## When invoked from a DEV cycle (Record+Ship step)

1. Read the cycle's `.ai/IMPLEMENTATION_PLAN.md` (this cycle's scope) and the
   CHANGELOG entry just written for this cycle.
2. Find or create the module's **Epic issue** (`type:epic`, `module:<name>`
   label) — search open/closed issues for an existing one before creating;
   never duplicate. Epic body tracks: current feature count, target (1500),
   gap, and a running PI/Sprint checklist.
3. Update the Epic issue body: tick off the sprint/layer just completed,
   update the feature-count line from the fresh `feature-ledger.mjs` output.
4. For each distinct feature/endpoint slice shipped this cycle, either close
   an existing **Story issue** (`type:story`, `module:<name>`,
   `sprint:<n>` labels) that matches it, or — if none was pre-filed — create
   one already closed (`state: closed`, `state_reason: completed`) with a
   body noting it shipped as part of this cycle's commit, so the backlog
   stays an accurate historical record even for work planned and shipped in
   the same cycle.
5. If the cycle's Epic hit its 5 completion criteria (MODULE_REGISTRY § 0)
   and rotated per binding #18, close the Epic issue
   (`state_reason: completed`) and open the next module's Epic issue if one
   doesn't already exist (§ 3 backlog table in COMPETITIVE_ROADMAP.md has the
   target/gap numbers to seed the body).
6. If a GitHub Projects v2 board has since been created for this repo (check
   `list_issue_fields`) and its fields match COMPETITIVE_ROADMAP.md § 6, set
   them via `issue_write`'s `issue_fields` on every issue touched this cycle.
   If no board/fields exist yet, skip silently — labels still carry Sprint/
   Module/Type; don't block the cycle on the manual board-creation step.
7. If sprint milestones exist (repo admin created them per COMPETITIVE_ROADMAP
   § 6), attach the `milestone` number instead of relying only on the
   `sprint:<n>` label; otherwise the label is sufficient.

## When invoked from a QA/harden cycle

Same as DEV, except: findings become Story-shaped issues already tagged
`type:story`, `area:<module>` (existing harden convention) plus `sprint:qa`
— hardening cycles are a standing "QA sprint", not numbered like feature
sprints. Do not open Epic issues from a harden cycle; only DEV cycles own
Epic lifecycle.

## When invoked standalone ("sprint-sync", backfill)

Walk the last N un-synced CHANGELOG entries (since the last commit that
touched this skill's bookkeeping, or since a date the user gives) and run
steps 2-4 above for each, oldest first, so GitHub catches up to the file-based
record without re-deriving plans that already shipped.

## Guardrails

- Never invent a feature/story that isn't backed by a CHANGELOG entry or an
  open MODULE_REGISTRY item — this mirrors real state, it doesn't pad it.
- Never let this step block a cycle's push to `main` — GitHub API calls are
  best-effort bookkeeping; if they fail (rate limit, auth), log it and
  continue, do not fail the cycle.
- Keep issue bodies short (counts + links), never paste code or full diffs.
