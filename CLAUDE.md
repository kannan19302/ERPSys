# CLAUDE.md

Read and follow `AGENTS.md` — the master instruction set for this repo
(architecture, Critical Rules, 3-file tracking convention, Collab Board protocol).

## The two flows (the only entry points)

The Autonomous Development Protocol (`.ai/AUTOPILOT.md`) has exactly two flows:

- **DEV flow — "Start"**: if the user's message is just "Start" ("start", "/start",
  "continue", "next"), invoke the `/start` skill. It is **phase-gated** (AUTOPILOT
  § The Program Ladder): first the mandatory-harden checkpoint (every 10th
  completed DEV cycle auto-runs a full QA cycle — tracked in `MODULE_REGISTRY.md`
  § Cycle Ledger), then the phase gate: while `.ai/FOUNDATION_HARDENING_ROADMAP.md`
  § 12's lift gate is unmet, cycles work ONLY foundation tracks in dependency
  order (Phase F); once the foundation is SEALED, cycles strengthen every module
  to Complete (1500+ weighted features), in AUTOPILOT's § Phase M focus order,
  under the binding throughput floor of ≥ 5,000 net LOC OR ≥ 40 features per
  cycle (Phase M); when all modules are
  Complete, new apps/modules (Phase X). Every cycle writes
  `.ai/IMPLEMENTATION_PLAN.md` before building (mandatory plan, zero approvals,
  one overwrite per cycle), then builds end-to-end (DB → API → UI → tests),
  verifies gates, records in the 3-file system + Cycle Ledger, and lands on
  `main`. Ask exactly ONE question in interactive Phase M/X runs — the
  focus-module question; Phase F and unattended runs never prompt.
- **QA flow — "harden"**: if the user's message is just "harden" ("/harden",
  "find and fix", "scan and fix"), invoke the `/harden` skill — scan
  security-first, file each verified flaw as a GitHub issue BEFORE fixing, fix at
  root cause, verify, close. Blocked issues get labeled `blocked` and stay open.
  Also auto-invoked by "Start" as the mandatory every-10-cycles checkpoint.

All other flows (issue-scan, fix-issues, integrate, and their variants) are retired.

## Architecture governance (binding, permanent)

Read `.ai/ARCHITECTURE_FOUNDATION.md` before selecting work (foundation SEALED
v1.0 on 2026-07-18 — its 8 rules are permanent sealed contracts). Every change
follows it plus `.ai/HANDBOOK.md` conventions and `AGENTS.md` Critical Rules:

- `pnpm architecture:check` for every API change; `pnpm migration:discipline` for
  every database/dev-environment change. `db:push` is disabled — use
  `pnpm db:deploy` and fail closed on drift.
- Tenant isolation + RBAC + Zod validation on every endpoint; UI through
  `@unerp/framework` and `@unerp/ui-*` tokens.
- Launch blockers outrank features: open `security`/critical/high issues are
  picked first in both flows until closed. (Historical blockers #17/#19/#21
  closed at the 2026-07-18 seal — their designs are now binding contracts.)

## Always land work on `main` (binding, every prompt)

No task is complete while its changes sit only on a sub-branch. Before reporting
done: gates green → `git fetch origin main` → rebase/merge onto latest
`origin/main` → re-run the scoped typecheck if code moved → merge to `main`
(`--no-ff`) → `git push origin main`. Never force-push; a red build is never
merged. Exceptions only when the user explicitly asks for a branch/PR.

## Multi-collaborator rule

At bootstrap run `node scripts/claim.mjs list`. If other sessions hold active
claims and a user is present, ask which module to focus on; if their choice is
held, say who holds it and ask them to choose another. Unattended sessions never
prompt — they auto-pick unclaimed scope. Locks live in `.ai/locks/` (gitignored).
