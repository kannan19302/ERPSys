---
name: start
description: Run one full DEV-flow cycle for UniERP. Use when the user says "Start", "/start", "continue", or "next" with no other requirements — self-select the next work item and ship it end-to-end (DB → API → UI → tests) onto main.
---

# Start — the DEV flow

Execute the **DEV flow** of `.ai/AUTOPILOT.md` exactly and end-to-end. That file is
the single source of truth; this is the operating summary:

1. **Bootstrap** — read `AGENTS.md` Critical Rules and `.ai/AUTOPILOT.md`;
   `git pull`; read `.ai/MODULE_REGISTRY.md` § Collab Board and recent
   `.ai/CHANGELOG.md`; `node scripts/claim.mjs list`. Never touch work you didn't
   create this session (uncommitted files, other branches, held locks).
2. **Focus question (the ONE question, interactive runs only)** — regenerate
   `node scripts/feature-ledger.mjs`, then `AskUserQuestion` for the focus module,
   showing each module's feature count and any holder from `claim.mjs list`. If the
   pick is held by an active collaborator, say who holds it and ask for another.
   Zero further questions after the answer. Unattended runs skip the question and
   pick the weakest unclaimed module.
3. **Select ONE item**: P0 broken build/tests → P1 open `security`/critical/high
   GitHub issues → P2 unfinished work / Collab Board Up Next → P3 module deepening
   vs the top ERP suites → P4 new capability.
4. **Claim** the sub-domain lock (`claim.mjs acquire`), add the Collab Board row.
5. **Plan inline** (PM hat — no subagent): duplicate-check the ledger + registry,
   stories, acceptance criteria, Definition of Done.
6. **Build end-to-end** under the architecture policies (binding — AUTOPILOT
   § Shared bindings #1): schema → one migration (`pnpm db:deploy`, never
   `db:push`) → services/controllers with tenant scoping + RBAC + Zod + tests →
   UI via `@unerp/framework` and `@unerp/ui-*` tokens. Run
   `pnpm architecture:check` for API changes, `pnpm migration:discipline` for DB
   changes.
7. **Verify** at the right tier (AUTOPILOT § Gate tiers): FAST scoped
   typecheck/vitest by default; MILESTONE (full turbo typecheck + API suite +
   Playwright smoke) on risky surfaces or every ~4 cycles.
8. **Record + Ship**: CHANGELOG entry + MODULE_REGISTRY update in the SAME commit
   as the code; release the lock; land on `main` (rebase → merge → push). Never
   leave work on a branch; never force-push; never merge red.
9. **Report**: what shipped, why selected, gate results, top 3 next items.

Guardrails: one batch per cycle; no stubs or padding; no destructive ops; do the
work yourself — subagents only for large genuinely-parallel chunks (security-auditor
on auth/tenancy/RBAC surfaces is the standing exception).
