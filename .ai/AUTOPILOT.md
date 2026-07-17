# AUTOPILOT.md — Autonomous Development Protocol (ADP)

> **Mission**: make UniERP the **#1 ERP platform** — a composable, multi-tenant,
> industry-agnostic system that out-features SAP S/4HANA, NetSuite, Dynamics 365,
> Odoo, ERPNext, Workday, Salesforce, Infor, Acumatica, and Epicor while staying
> simpler to run and extend.
>
> **⚡ Read [instructions.md](instructions.md) FIRST** — it is the supreme governance
> document covering all architecture flows, coding standards, policies, velocity
> targets, and repo hygiene rules. This file defines the two operational flows.
>
> The ADP has exactly **two flows**. Everything else was retired on 2026-07-17.
>
> | Trigger                                  | Flow                 | Purpose                                                      | Velocity Target                                   |
> | :--------------------------------------- | :------------------- | :----------------------------------------------------------- | :------------------------------------------------ |
> | "Start" / "/start" / "continue" / "next" | **DEV flow**         | Build feature batches end-to-end (DB → API → UI → tests)     | **40+ distinct features per cycle**               |
> | "harden" / "/harden" / "find and fix"    | **QA flow**          | Find flaws, file as issues, fix at root cause, verify, close | **10+ fixes + 10+ feature suggestions per cycle** |
> | "integrate" / "/integrate"               | **INTEGRATION flow** | Wire 3+ modules into end-to-end business workflows           | **2+ cross-module workflows per cycle**           |
>
> **Module Completion Goal**: A module is COMPLETE when it has **500+ weighted
> feature points** (verified by `node scripts/feature-ledger.mjs`), full CRUD
> with pagination/sorting, 80%+ test coverage, and feature parity or superiority
> vs. top 10 ERP market leaders.
>
> **Module Maturity Tiers**: Skeleton (< 10) → MVM (10–50) → Functional (50–200)
> → Competitive (200–500) → Complete (500+). All modules MUST reach MVM (50)
> before any module above 200 gets more features. See [instructions.md § 8](instructions.md#8-adp-performance-targets).

---

## Shared bindings (both flows, every run)

0. **Supreme governance.** Read [instructions.md](instructions.md) before any work.
   It contains all architecture flows, coding standards, UI/backend/DB policies,
   security governance, velocity targets, and repo hygiene rules.
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
4. **Always push directly to `main`.** Do NOT create feature branches. Gates
   green → `git pull --rebase origin main` → re-run scoped typecheck if code
   moved → `git push origin main`. Never end a run with shipped work stranded
   on a branch. Never force-push. A red build is never pushed.
5. **Multi-collaborator claims.** Before selecting scope: `node scripts/claim.mjs list`.
   Acquire an atomic lock for your sub-domain (`claim.mjs acquire <slug> --agent
<name+session> --scope "<desc>"`), heartbeat it, release on ship. Never touch
   another session's claimed scope; locks live in `.ai/locks/` (gitignored).
   If a user is present and another session holds the module they pick, say who
   holds it and ask them to choose another. Unattended runs auto-pick unclaimed scope.
   **Stale claim auto-expiry**: Claims older than 48 hours without a heartbeat commit
   are EXPIRED — `claim.mjs gc` moves them to the Conflict Log. Run `claim.mjs gc`
   during bootstrap to prune abandoned claims.
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
9. **PM market research (every cycle).** Before scoping features, check
   `.ai/MARKET_BENCHMARK.md` first (cached research, regenerated weekly). If the
   cache for the target module is > 7 days old, do fresh research on the top 10 ERP
   market leaders (SAP, NetSuite, Dynamics 365, Workday, Salesforce, Odoo, ERPNext,
   Infor, Acumatica, Epicor). Score candidates using RICE. Append new findings to
   the benchmark cache. See [instructions.md § 12](instructions.md#12-pm-agent-market-research-protocol).
10. **Temp file cleanup.** At cycle end, delete ALL temporary scripts, debug helpers,
    scratch files, and one-off data files. Verify no stray files at repo root or
    `scripts/`. The repo must always be production-grade and clean.
11. **Feature ledger accuracy.** Regenerate at BOTH start and end of every cycle.
    Cross-check totals with MODULE_REGISTRY. Verify module counts grew by the
    expected delta. See [instructions.md § 9](instructions.md#9-feature-ledger-accuracy).
12. **Module health scoring.** Run `node scripts/module-health.mjs` at cycle end to
    compute per-module health scores (0–100). Use this to verify the weakest module
    is being targeted and that no module falls below the MVM threshold (50 features).
13. **Pre-push gate.** Run `node scripts/pre-push-gate.mjs` before every push. It
    verifies CHANGELOG/REGISTRY updated, no console.log, no `any` types, no temp
    files, scoped typecheck passes, and feature ledger freshness. Push is blocked
    until all checks pass.
14. **Cycle intelligence report.** At cycle end, generate a structured JSON report
    via `node scripts/cycle-report.mjs` — tracks velocity trends, feature deltas,
    agent productivity, and competitor gap assessments across sessions.
15. **Entity scaffolding.** For MVM-level work (basic CRUD + list + detail + tests),
    use `node scripts/scaffold-entity.mjs` to generate boilerplate. Customize the
    generated code for business logic. See script `--help` for usage.

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

> **Velocity target**: Ship **40+ distinct business features** per cycle.
> Each feature = DB schema + API endpoint + UI page + tests.
>
> **Parallel DEV cycles**: When bringing Skeleton modules (< 10 features) to MVM,
> you may claim **up to 3 modules** in a single cycle. Each gets 15+ features
> (basic CRUD + list + detail + tests). Combined target remains 40+ features.
> Use `node scripts/scaffold-entity.mjs` for boilerplate. Deep modules (200+)
> remain single-focus.

0. **Bootstrap**: read [instructions.md](instructions.md) + `AGENTS.md` Critical
   Rules + this file; `git pull`; `claim.mjs gc` (prune stale claims); read
   MODULE_REGISTRY § Collab Board + System Progress Dashboard + recent CHANGELOG;
   `claim.mjs list`; `node scripts/module-health.mjs` (see weakest modules);
   start the dev stack if needed. Leave any work you didn't create alone
   (uncommitted files, other branches) — log it on the Collab Board, never
   commit over it.
1. **Focus question (interactive runs only — the ONE question)**: regenerate the
   feature ledger, then `AskUserQuestion` for the focus module, showing each
   module's feature count, health score, and who holds it if claimed. After the
   answer, zero further questions. Unattended runs skip and pick the weakest
   unclaimed module (lowest health score).
2. **Select by the priority ladder**:
   - **P0**: Broken build/tests
   - **P1**: Open `security`/critical/high issues (incl. #17/#19/#21)
   - **P2**: Unfinished shipped work / Collab Board Up Next
   - **P2.5**: Any module below MVM threshold (50 features) — MUST be addressed
     before adding features to any module above 200. Use parallel DEV if multiple
     skeleton modules exist.
   - **P3**: Module deepening vs market leaders (check `.ai/MARKET_BENCHMARK.md`)
   - **P4**: New capability
     Benchmark against the top 10 ERP suites (see [instructions.md § 12](instructions.md#12-pm-agent-market-research-protocol))
     when picking P3/P4 — build what closes a real competitive gap, not filler.
3. **Claim** the sub-domain lock(s), add the Collab Board row(s).
4. **Plan inline (PM hat)**: check `.ai/MARKET_BENCHMARK.md` for cached research;
   deep-research top 10 competitors if cache > 7 days old; duplicate-check;
   user stories; acceptance criteria; Definition of Done;
   DB→API→UI slice list targeting 40+ features. Score candidates with RICE.
   Append new findings to `.ai/MARKET_BENCHMARK.md`.
5. **Build the batch end-to-end**: all schema changes → one migration → services/
   controllers (guards + validation + tests) → UI pages via `@unerp/framework` →
   one test pass. Spend the cycle writing code; use scoped checks while building.
   Target 40+ distinct features — each with full vertical slice.
   **Micro-harden checkpoint**: At every 10th feature (10, 20, 30), run scoped
   typecheck + vitest on the touched module. Fix any failures inline before
   continuing. This is NOT a full QA cycle — just a 2-minute sanity check.
6. **Verify** at the tier the batch demands (see Gate tiers).
7. **Review inline**: diff vs Critical Rules; security checklist on sensitive surfaces.
8. **Record + Ship**: CHANGELOG entry + MODULE_REGISTRY update + regenerated ledger
   in the same commit as the code; release the lock; run `node scripts/pre-push-gate.mjs`;
   run `node scripts/module-health.mjs`; push to `main` (binding #4).
   Delete all temp files/scripts created during the cycle.
   Generate cycle report: `node scripts/cycle-report.mjs`.
   Report: features shipped (with count + delta + maturity levels), why selected,
   gate results, health score change, top 3 next items, competitor gap assessment.

## QA flow — "harden" (closed find→file→fix→close loop)

> **Velocity target**: Fix **10+ verified bugs** AND log **10+ new feature
> suggestions** to the Collab Board Up Next queue per cycle.

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
   5. Commit `fix(<module>): <summary> (fixes #<n>)`; push to `main` directly;
      confirm the issue closed — close it explicitly if not.
   6. Genuinely blocked (needs credentials / business decision / large refactor)?
      Label `blocked`, comment why, leave open, move on. Never close a blocked issue.
3. **Feature improvement discovery**: While scanning, identify **10+ feature
   improvement suggestions** by comparing current capabilities against top 10
   ERP market leaders. Log each to MODULE_REGISTRY § Collab Board §2 (Up Next)
   with a brief description, competitor reference, and RICE score estimate.
4. **Settle once**: MILESTONE gates if ≥5 fixes or any risky surface touched; one
   CHANGELOG entry (found N / fixed M / blocked K + N feature suggestions logged);
   push to `main`; re-query every fixed issue and close stragglers.
   Delete all temp files/scripts created during the cycle.
5. **Report**: table found → fixed+closed → blocked (why), security first; gate
   results; remaining open `security`/critical count (the launch gate);
   feature suggestions logged (count + top 3 highlights).

**Guardrails (absolute)**: defensive security only; no red build ships; no stubs or
padding to inflate counts; no destructive ops without explicit user instruction
(tag `[needs-human]`); file-before-fix; never leave a fixed issue open.

---

## INTEGRATION flow — "integrate" (cross-module business workflows)

> **Velocity target**: Wire **2+ cross-module workflows** per cycle.
> Each workflow spans 3+ modules end-to-end.

The DEV and QA flows are module-scoped. The highest-value ERP capabilities are
_cross-module workflows_ (procure-to-pay, order-to-cash, hire-to-retire). This
flow wires them together.

1. **Pick a business process** from the canonical list:
   - Order-to-Cash: Sales → Inventory (pick/pack) → Shipping → Finance (invoice → payment → GL)
   - Procure-to-Pay: Procurement (RFQ → PO) → Inventory (receipt) → Finance (AP → payment → GL)
   - Hire-to-Retire: HR (recruit → onboard) → Payroll → Finance (salary GL posting)
   - Plan-to-Produce: Manufacturing (MRP → work order) → Inventory (consumption + output) → Finance (job costing)
   - Quote-to-Cash: CRM (opportunity → quote) → Sales (order) → Inventory → Finance
   - Record-to-Report: Finance (GL → trial balance → financial statements → close → consolidation)
   - Issue-to-Resolution: CRM (case) → Projects (task) → Communication (notification)
2. **Map the event chain** across modules — identify every domain event producer
   and consumer that must fire for the workflow to complete.
3. **Build/fix event producers + consumers** — wire missing `@OnEvent` handlers,
   ensure idempotency, verify tenant isolation in every handler.
4. **Create an integration test** that walks the full workflow end-to-end
   (service-level, not E2E browser — test the event chain programmatically).
5. **Create a cross-module dashboard page** showing the workflow status/pipeline.
6. **Ship with Playwright E2E test** covering the primary happy path.
7. **Record + Ship**: same cycle-end checklist as DEV flow.

---

## Agent roster (when a subagent IS justified)

| Need                                     | Agent                                                  |
| :--------------------------------------- | :----------------------------------------------------- |
| Scope/stories for a large new capability | `product-manager` (always check MODULE_REGISTRY first) |
| Parallel API chunk                       | `backend-developer`                                    |
| Parallel UI chunk                        | `frontend-developer` / `uiux-designer`                 |
| Whole vertical slice in parallel         | `fullstack-developer`                                  |
| Schema/migration/RLS design              | `data-architect`                                       |
| Auth/tenancy/RBAC/payments audit         | `security-auditor` (the standing exception)            |
| Pre-merge review of a large diff         | `code-reviewer`                                        |
| CI/build/docker/env issues               | `devops-engineer`                                      |
| UAT sign-off scripts                     | `business-analyst-uat`                                 |
| Docs drift after a big change            | `tech-writer`                                          |

Every agent obeys [instructions.md](instructions.md), this file, `AGENTS.md`,
and `docs/ARCHITECTURE_FOUNDATION.md`.

---

## ADP Tooling (scripts/)

| Script                | Purpose                                 | When to Run                |
| :-------------------- | :-------------------------------------- | :------------------------- |
| `feature-ledger.mjs`  | Regenerate `.ai/FEATURE_LEDGER.md`      | Start + end of every cycle |
| `module-health.mjs`   | Compute per-module health score (0–100) | Bootstrap + cycle end      |
| `pre-push-gate.mjs`   | Automated checklist before `git push`   | Before every push          |
| `cycle-report.mjs`    | Generate structured JSON cycle report   | Cycle end                  |
| `scaffold-entity.mjs` | Boilerplate generator for new entities  | MVM-level work             |
| `claim.mjs`           | Atomic work-claim locks                 | Before + after work        |
| `claim.mjs gc`        | Garbage-collect stale claims (48h TTL)  | Bootstrap                  |

---

## Continuous operation

Unattended runs (scheduler/CI) never prompt: DEV flow picks the weakest unclaimed
module (lowest health score); QA flow scans the whole repo security-first;
INTEGRATION flow picks the weakest cross-module workflow. All end with everything
committed, pushed to `origin/main` (never a branch), temp files cleaned, feature
ledger regenerated, health scores computed, cycle report generated, and CHANGELOG +
MODULE_REGISTRY updated — the next run bootstraps from a clean, production-grade state.

**Production-grade mandate**: The repo MUST be deployable to real customers at all
times. No temp files, no dead code, no placeholder stubs, no broken builds. See
[instructions.md § 14](instructions.md#14-production-grade-mandate).
