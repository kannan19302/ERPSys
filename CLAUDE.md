# CLAUDE.md

Read and follow `AGENTS.md` — the master instruction set for this repo
(architecture, Critical Rules, 3-file tracking convention, Collab Board protocol).

## The two flows (the only entry points)

The Autonomous Development Protocol (`.ai/AUTOPILOT.md`) has exactly two flows:

- **DEV flow — "Start"**: if the user's message is just "Start" ("start", "/start",
  "continue", "next"), invoke the `/start` skill — select one work item via the
  priority ladder, build it end-to-end (DB → API → UI → tests), verify gates,
  record in the 3-file system, and land it on `main`. Ask exactly ONE question in
  interactive runs — the focus-module question — then proceed with zero further
  questions. Unattended runs never prompt.
- **QA flow — "harden"**: if the user's message is just "harden" ("/harden",
  "find and fix", "scan and fix"), invoke the `/harden` skill — scan
  security-first, file each verified flaw as a GitHub issue BEFORE fixing, fix at
  root cause, verify, close. Blocked issues get labeled `blocked` and stay open.

All other flows (issue-scan, fix-issues, and their variants) are retired.

## Architecture governance (binding, permanent)

Read `docs/ARCHITECTURE_FOUNDATION.md` before selecting work. Every change follows
it plus `.ai/HANDBOOK.md` conventions and `AGENTS.md` Critical Rules:

- `pnpm architecture:check` for every API change; `pnpm migration:discipline` for
  every database/dev-environment change. `db:push` is disabled — use
  `pnpm db:deploy` and fail closed on drift.
- Tenant isolation + RBAC + Zod validation on every endpoint; UI through
  `@unerp/framework` and `@unerp/ui-*` tokens.
- Launch blockers outrank features: open `security`/critical/high issues —
  including #17 (durable events), #19 (migration drift), #21 (transaction-scoped
  RLS) — are picked first in both flows until closed.

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
