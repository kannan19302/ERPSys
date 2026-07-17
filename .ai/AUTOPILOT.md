# AUTOPILOT.md — Autonomous Development Protocol (ADP)

> **Mission**: make UniERP the #1 ERP platform — a composable, multi-tenant,
> industry-agnostic system that out-features SAP S/4HANA, NetSuite, Dynamics 365,
> Odoo, and ERPNext while staying simpler to run and extend.
>
> The ADP has exactly **two flows**. Everything else was retired on 2026-07-17.
>
> | Trigger | Flow | Purpose |
> |:---|:---|:---|
> | "Start" / "/start" / "continue" / "next" | **DEV flow** | Build one new feature batch end-to-end (DB → API → UI → tests) |
> | "harden" / "/harden" / "find and fix" | **QA flow** | Find flaws, file them as GitHub issues, fix at root cause, verify, close |

---

## Shared bindings (both flows, every run)

1. **Architecture governance (permanent).** Every change follows
   [docs/ARCHITECTURE_FOUNDATION.md](../docs/ARCHITECTURE_FOUNDATION.md) and the
   conventions in [HANDBOOK.md](HANDBOOK.md) + `AGENTS.md` Critical Rules:
   - `pnpm architecture:check` for every API change; `pnpm migration:discipline`
     for every database/dev-environment change.
   - `db:push` is forbidden — schema changes ship as migrations via `pnpm db:deploy`;
     fail closed on drift.
   - No direct cross-module imports; module boundaries via events/contracts only.
   - Tenant isolation (`tenantId` scoping + RLS), RBAC guards, and Zod validation
     on every new endpoint — no exceptions.
   - Frontend goes through `@unerp/framework` (schema-driven) and `@unerp/ui-*`
     design tokens — no hand-rolled styling or ad-hoc fetch layers.
2. **Launch blockers first.** Open GitHub issues labeled `security` or
   critical/high — currently including the three architecture-foundation issues
   (**#17** durable event delivery, **#19** migration-drift reconciliation,
   **#21** transaction-scoped RLS) — outrank all feature work. The QA flow drains
   them first; the DEV flow must pick them at P0/P1 before building anything new.
3. **3-file tracking (documentation gate).** State of record is exactly:
   [MODULE_REGISTRY.md](MODULE_REGISTRY.md) (module status + Collab Board),
   [CHANGELOG.md](CHANGELOG.md) (append-only history, newest first),
   [HANDBOOK.md](HANDBOOK.md) (how we build). Update REGISTRY + CHANGELOG in the
   **same commit** as the code — committing without them is forbidden.
4. **Always land on `main`.** Gates green → fetch/rebase onto `origin/main` →
   re-run scoped typecheck if code moved → merge (`--no-ff` from branches) →
   `git push origin main`. Never end a run with shipped work stranded on a branch.
   Never force-push. A red build is never merged.
5. **Multi-collaborator claims.** Before selecting scope: `node scripts/claim.mjs list`.
   Acquire an atomic lock for your sub-domain (`claim.mjs acquire <slug> --agent
   <name+session> --scope "<desc>"`), heartbeat it, release on ship. Never touch
   another session's claimed scope; locks live in `.ai/locks/` (gitignored).
   If a user is present and another session holds the module they pick, say who
   holds it and ask them to choose another. Unattended runs auto-pick unclaimed scope.
6. **Do the work yourself.** Roles (PM, reviewer, security) are checklists applied
   inline in the main thread. Spawn a subagent only for a large genuinely-parallel
   chunk or on explicit user request — one hop max. Standing exception: the
   security-auditor pass on auth/tenancy/RBAC/payment changes may run as a subagent.
7. **Duplicate check before building.** Regenerate the feature inventory
   (`node scripts/feature-ledger.mjs`, output gitignored) and grep it + MODULE_REGISTRY
   for your routes/entities before planning, and again after the pre-merge rebase.
8. **Token efficiency.** Grep + ranged reads, never whole-file dumps; clone the
   newest reference pattern instead of exploring; one complete Write per file;
   reports contain counts and results, never pasted code.

---

## Gate tiers (both flows)

- **FAST (default, per batch/fix):** scoped typecheck (`pnpm --filter @unerp/api
  typecheck` + `--filter @unerp/web typecheck`) and vitest for the touched modules,
  plus the change's own reproduction/smoke. No full suite per feature.
- **MILESTONE (every ~4 fast cycles, module completion, or any risky surface —
  data migrations, auth, tenancy, RBAC, payments):** `pnpm turbo typecheck`, full
  API test suite, Playwright smoke (`npx playwright test smoke`). A red milestone
  gate is P0 in the same run.

---

## DEV flow — "Start" (one full cycle)

0. **Bootstrap**: read `AGENTS.md` Critical Rules + this file; `git pull`; read
   MODULE_REGISTRY § Collab Board and recent CHANGELOG; `claim.mjs list`; start the
   dev stack if needed. Leave any work you didn't create alone (uncommitted files,
   other branches) — log it on the Collab Board, never commit over it.
1. **Focus question (interactive runs only — the ONE question)**: regenerate the
   feature ledger, then `AskUserQuestion` for the focus module, showing each
   module's feature count and who holds it if claimed. After the answer, zero
   further questions. Unattended runs skip and pick the weakest unclaimed module.
2. **Select ONE item** by the ladder: P0 broken build/tests → P1 open `security`/
   critical/high issues (incl. #17/#19/#21) → P2 unfinished shipped work / Collab
   Board Up Next → P3 module deepening vs market leaders → P4 new capability.
   Benchmark against the top ERP suites when picking P3/P4 — build what closes a
   real competitive gap, not filler.
3. **Claim** the sub-domain lock, add the Collab Board row.
4. **Plan inline (PM hat)**: duplicate-check, user stories, acceptance criteria,
   Definition of Done, and the DB→API→UI slice list.
5. **Build the batch end-to-end**: all schema changes → one migration → services/
   controllers (guards + validation + tests) → UI pages via `@unerp/framework` →
   one test pass. Spend the cycle writing code; use scoped checks while building.
6. **Verify** at the tier the batch demands (see Gate tiers).
7. **Review inline**: diff vs Critical Rules; security checklist on sensitive surfaces.
8. **Record + Ship**: CHANGELOG entry + MODULE_REGISTRY update + regenerated ledger
   in the same commit as the code; release the lock; land on `main` (binding #4).
   Report: what shipped, why selected, gate results, top 3 next items.

## QA flow — "harden" (closed find→file→fix→close loop)

1. **Scan security-first** across the chosen scope: broken build/tests → security
   (authz bypass, tenant leakage, injection, secrets, unsafe input) → reliability
   (crashes, unhandled rejections, race conditions) → functional QA against the
   running app → UAT walkthroughs of primary workflows → UX/performance debt.
   Static findings need file:line evidence; runtime findings need observed evidence.
2. **Per finding (severity order)**:
   1. Dedup against open GitHub issues — adopt instead of duplicating.
   2. **File the issue first** (labels: severity + area; `security` when applicable)
      so an interrupted run never loses a finding.
   3. Claim `issue-<n>`, **fix inline at root cause** (never weaken a test, never
      skip, never suppress the check that caught it).
   4. Verify FAST-tier + the finding's own reproduction.
   5. Commit `fix(<module>): <summary> (fixes #<n>)`; after it reaches `main`,
      confirm the issue closed — close it explicitly if not.
   6. Genuinely blocked (needs credentials / business decision / large refactor)?
      Label `blocked`, comment why, leave open, move on. Never close a blocked issue.
3. **Settle once**: MILESTONE gates if ≥5 fixes or any risky surface touched; one
   CHANGELOG entry (found N / fixed M / blocked K); ship to `main`; re-query every
   fixed issue and close stragglers.
4. **Report**: table found → fixed+closed → blocked (why), security first; gate
   results; remaining open `security`/critical count (the launch gate).

**Guardrails (absolute)**: defensive security only; no red build ships; no stubs or
padding to inflate counts; no destructive ops without explicit user instruction
(tag `[needs-human]`); file-before-fix; never leave a fixed issue open.

---

## Agent roster (when a subagent IS justified)

| Need | Agent |
|:---|:---|
| Scope/stories for a large new capability | `product-manager` (always check MODULE_REGISTRY first) |
| Parallel API chunk | `backend-developer` |
| Parallel UI chunk | `frontend-developer` / `uiux-designer` |
| Whole vertical slice in parallel | `fullstack-developer` |
| Schema/migration/RLS design | `data-architect` |
| Auth/tenancy/RBAC/payments audit | `security-auditor` (the standing exception) |
| Pre-merge review of a large diff | `code-reviewer` |
| CI/build/docker/env issues | `devops-engineer` |
| UAT sign-off scripts | `business-analyst-uat` |
| Docs drift after a big change | `tech-writer` |

Every agent obeys this file, `AGENTS.md`, and `docs/ARCHITECTURE_FOUNDATION.md`.

---

## Continuous operation

Unattended runs (scheduler/CI) never prompt: DEV flow picks the weakest unclaimed
module; QA flow scans the whole repo security-first. Both end with everything
committed, pushed, and reflected on `origin/main` — the next run bootstraps from a
clean state.
