# AUTOPILOT.md — Autonomous Development Protocol (ADP)

> **Mission**: make UniERP the **#1 ERP platform** — a composable, multi-tenant,
> industry-agnostic system that out-features SAP S/4HANA, NetSuite, Dynamics 365,
> Odoo, ERPNext, Workday, Salesforce, Infor, Acumatica, and Epicor while staying
> simpler to run and extend.
>
> **⚡ [instructions.md](instructions.md) is the supreme governance document**
> (architecture flows, coding standards, policies, velocity targets, repo
> hygiene). It is standing policy — consult sections on demand rather than
> re-reading it every cycle (see § DEV flow step 0, slim bootstrap). This
> file defines the two operational flows.
>
> The ADP has exactly **two flows**. Everything else was retired on 2026-07-17;
> the separate INTEGRATION flow was folded into the DEV flow on 2026-07-18
> (cross-module workflow batches are now ordinary DEV work — see § DEV flow).
>
> | Trigger                                  | Flow         | Purpose                                                      | Velocity Target                                                                                                                            |
> | :--------------------------------------- | :----------- | :----------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------- |
> | "Start" / "/start" / "continue" / "next" | **DEV flow** | Phase-gated: foundation first, then features end-to-end      | **Throughput floor (binding): ship ≥ 5,000 net LOC OR ≥ 40 distinct features per cycle** (Phase M/X; Phase F = track items — floor exempt) |
> | "harden" / "/harden" / "find and fix"    | **QA flow**  | Find flaws, file as issues, fix at root cause, verify, close | **10+ fixes + 10+ feature suggestions per cycle**                                                                                          |
>
> The QA flow runs two ways: **explicitly** (user types "harden") or
> **automatically** — after every **10 completed DEV cycles**, the next "Start"
> MUST execute one full QA cycle before any new DEV work (see § Cycle cadence).

---

## The Program Ladder — what "Start" works on (phase state machine, binding)

Every "Start" cycle begins by determining the current **program phase**. The
phases are strictly ordered; a later phase is unreachable while an earlier one
is incomplete. This is the very first check of every DEV cycle, before the
priority ladder, before the focus question, before anything.

| Phase | Name                 | Entry condition                                                | What DEV cycles do                                                                                                                                                                                                                                                                                                                                                                                                        | Exit condition                                                                 |
| :---- | :------------------- | :------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :----------------------------------------------------------------------------- |
| **F** | Foundation           | `.ai/FOUNDATION_HARDENING_ROADMAP.md` lift gate (§ 12) NOT met | Work foundation tracks in dependency order: 0 → A (#19) → B (#17) ∥ C (#21) → D (#22) → E (blockchain re-platform) → F/G/H/I. Velocity = **track items closed with their exit-gate proofs**, not feature count. The 40-feature target does NOT apply; the feature freeze DOES.                                                                                                                                            | All roadmap tracks closed, lift gate green, foundation **SEALED v1.0** (§ 12b) |
| **M** | Module strengthening | Foundation SEALED                                              | Drive **every module to Complete (1500+ weighted features)**, in the fixed **focus order** below (not the old core→industry sort). Each module is built **horizontally** (§ Horizontal build order), not as independent vertical slices. Cross-module workflow batches (the old INTEGRATION flow) count as feature work here. Throughput floor applies: ≥ 5,000 net LOC OR ≥ 40 features per cycle (§ DEV flow velocity). | Every registered module at 1500+ with completion criteria met                  |
| **X** | Expansion            | All modules Complete                                           | Plan and build **new apps/modules** (PM-scoped, market-benchmarked, through the sealed kernel contracts only).                                                                                                                                                                                                                                                                                                            | Open-ended                                                                     |

Phase determination is mechanical, not judgment: read
`.ai/FOUNDATION_HARDENING_ROADMAP.md` § 12 (lift gate) — if any bullet is
unmet, the phase is **F**. In Phase F the DEV flow's P2.5/P3/P4 rungs are
suspended (they are feature work); the cycle's "batch" is the next unblocked
roadmap track item(s). P0 (broken build) and P1 (security issues) remain
first in every phase.

> **Module Completion Goal**: A module is COMPLETE when it has **1500+
> weighted feature points** (verified by `node scripts/feature-ledger.mjs`),
> full CRUD with pagination/sorting, 80%+ test coverage, and feature parity
> or superiority vs. top 10 ERP market leaders.
>
> **Module Maturity Tiers**: Skeleton (< 10) → MVM (10–50) → Functional (50–200)
> → Competitive (200–500) → Advanced (500–1000) → Complete (1000–1500) →
> Deep (1500+). All modules MUST reach MVM (50) before any module above 200
> gets more features. See [instructions.md § 8](instructions.md#8-adp-performance-targets).

### Phase M focus order (binding — supersedes "core → industry")

Phase M drives modules to Complete in this fixed sequence. A module only
rotates to the next once ALL five completion criteria (§ 0 in
MODULE_REGISTRY.md) hold, per binding #18:

**Finance → CRM → HR → Procurement → Supply Chain → Manufacturing →
Projects → Connect/Collaboration → Builder/Platform → industry-specific
apps (healthcare, etc.) → remaining modules by weakest-health.**

If Finance or CRM already carries feature count from before this policy
(pre-1500 completion bar), it is NOT re-opened as a full rebuild — its gap to
1500 is closed with the same horizontal method (§ below) before rotating to
the next module in the order.

### Horizontal build order (binding, replaces per-feature vertical slicing)

Prior cycles built **vertically**: pick a feature, ship its DB+API+UI+tests
together, repeat 40 times. This is now **retired for Phase M**. Instead,
each focus module is driven to 1500+ by building **horizontally, in three
layers, in this order**:

1. **DB layer first.** For the module's full target feature set (planned up
   front in `.ai/IMPLEMENTATION_PLAN.md`, not discovered feature-by-feature),
   design and land ALL required Prisma models/fields/relations/indexes/RLS
   policies as one coherent set of migrations before writing any service
   code. Batch related entities into the same migration where they belong
   together; never one migration per tiny field.
2. **API layer second.** Once the module's schema is in place, build out
   services + controllers + guards + Zod validation + domain events for the
   planned feature set, module-wide, before starting UI work. Services stay
   under the file-size ceiling (§ File-size discipline) — decompose by
   sub-domain as you go, never accumulate a god-service and split it later.
3. **UI layer third.** Once the API surface for the module (or a coherent
   sub-slice of it) exists, wire the frontend: tab-based pages per
   § UI navigation discipline, calling the already-built endpoints.

This still happens across multiple cycles — a single cycle does not have to
finish an entire layer for the whole module. But **within a cycle, do not
mix layers for the same not-yet-built feature**: don't hand-roll one
feature's DB+API+UI together while its siblings sit undesigned. Plan the
module's schema breadth first, then work layer by layer. Small, immediately-
needed UI fixes to already-shipped API surface are not "mixing layers" — this
rule targets net-new feature work.

### File-size discipline (binding — no god files)

Do NOT let any file grow into a god-file. Guidelines, not hard blockers, but
must be actively watched every cycle:

- **Services**: target under ~400 LOC; split past ~600 LOC by sub-domain
  (e.g. `inventory-warehouses.service.ts`, `inventory-catalog.service.ts`)
  rather than one `inventory.service.ts` mega-file. Prior god-services
  (`advanced-finance`/`procurement`/`manufacturing`, >1,200 LOC) are the
  cautionary example — see MODULE_REGISTRY §2 item 1, still owed cleanup.
- **Controllers**: split by resource/sub-domain, not by module; a controller
  with 20+ endpoints across unrelated resources is a smell.
- **UI pages**: a tab's content component should be self-contained; shared
  logic goes into hooks/utilities, not copy-pasted per tab.
- New code must not add to an existing god-file — extend by creating the
  right sub-domain file, or decompose the file you're touching if it's
  already over the ceiling.

### UI navigation discipline (binding — tab-based, ≤15 sidebar items)

- **Sidebar**: keep top-level sidebar entries at **15 or fewer** across the
  whole app. New modules/sub-areas do NOT get their own sidebar row — they
  become tabs.
- **Multi-level tabs (ServiceNow-style)**: each module lands on a hub page
  with a top tab bar (module's major areas) and, where a tab itself has
  breadth, a **nested second-level tab bar inside that tab** (tab-inside-tab)
  rather than spawning new sidebar items or new routes. Follow the pattern
  already built for Finance (`FinanceTabLayout`, `ModuleTabLayout`/
  `SubTabBar` in `@unerp/ui-layout` — see MODULE_REGISTRY Collab Board
  2026-07-20 "Finance Tab-Based Navigation Redesign" entry) for every module.
- 1500+ features per module MUST fit under this tab hierarchy — plan the
  tab/sub-tab taxonomy as part of the module's UI-layer work (§ Horizontal
  build order step 3), not ad hoc per feature.

---

## Shared bindings (both flows, every run)

0. **Supreme governance.** [instructions.md](instructions.md) is the supreme
   policy document (architecture flows, coding standards, UI/backend/DB
   policies, security governance, velocity targets, repo hygiene). It is
   standing policy — do NOT re-read it in full every cycle; consult the
   relevant section on demand when a decision needs it (slim bootstrap,
   § DEV flow step 0).
1. **Architecture governance (permanent).** Every change follows
   [.ai/ARCHITECTURE_FOUNDATION.md](ARCHITECTURE_FOUNDATION.md) and the
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
   critical/high outrank all feature work. The QA flow drains them first; the
   DEV flow must pick them at P0/P1 before building anything new. (The three
   historical architecture-foundation blockers — #17 durable events, #19
   migration drift, #21 transaction-scoped RLS — were closed when the
   foundation was SEALED v1.0 on 2026-07-18; their contracts are now binding
   sealed rules in `.ai/ARCHITECTURE_FOUNDATION.md`.)
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
7. **Duplicate check before building.** Grep the existing feature inventory
   (`.ai/FEATURE_LEDGER.md`, gitignored) + MODULE_REGISTRY for your
   routes/entities before planning, and again after the pre-merge rebase.
   Regenerate the ledger only if it is missing or stale — the full regen
   happens once per cycle, at Record (binding #11).
8. **Token efficiency.** Grep + ranged reads, never whole-file dumps; clone the
   newest reference pattern instead of exploring; one complete Write per file;
   reports contain counts and results, never pasted code.
9. **PM market research.** Before scoping features, check
   `.ai/MARKET_BENCHMARK.md` first (cached research, regenerated monthly). If the
   cache for the target module is > 30 days old, do fresh research on the top 10 ERP
   market leaders (SAP, NetSuite, Dynamics 365, Workday, Salesforce, Odoo, ERPNext,
   Infor, Acumatica, Epicor). Score candidates using RICE. Append new findings to
   the benchmark cache. See [instructions.md § 12](instructions.md#12-pm-agent-market-research-protocol).
10. **Temp file cleanup.** At cycle end, delete ALL temporary scripts, debug helpers,
    scratch files, and one-off data files. Verify no stray files at repo root or
    `scripts/`. The repo must always be production-grade and clean.
11. **Feature ledger accuracy.** Regenerate ONCE per cycle, at Record (step 8) —
    not at both start and end. Cross-check totals with MODULE_REGISTRY. Verify
    module counts grew by the expected delta. At cycle start, grep the existing
    ledger for duplicate checks (binding #7); regenerate early only if the file
    is missing or clearly stale. See [instructions.md § 9](instructions.md#9-feature-ledger-accuracy).
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
16. **Mandatory written plan (`.ai/IMPLEMENTATION_PLAN.md`), every DEV cycle.**
    Planning is a mandated phase but needs NO approval — write the plan, then
    execute immediately. At the start of each DEV cycle (after selection/claim,
    before any code), **overwrite** `.ai/IMPLEMENTATION_PLAN.md` with this
    cycle's plan: cycle number + phase (F/M/X), selected scope + why (priority-
    ladder rung), the ordered slice list (Phase F: track items + exit-gate
    proofs; Phase M/X: as many features as the layer's scope covers, run
    uncapped as DB→API→UI→test slices), duplicate-check
    result, acceptance criteria, gate tier, and rollback note. Rules:
    **exactly one overwrite per cycle** — never overwrite mid-cycle (the plan
    is the cycle's contract; scope changes are appended as dated addendum
    lines, not rewrites); the file is committed with the cycle's first commit
    so other agents can see in-flight intent; it is a working artifact, NOT a
    file of record — CHANGELOG/REGISTRY remain the documentation gate.
17. **Cycle cadence & mandatory harden (binding).** MODULE_REGISTRY § Cycle
    Ledger holds the durable counters. At the end of every completed DEV cycle,
    increment `DEV cycles completed` (same commit as the code). When the
    counter reaches a multiple of 10, set `Next run` to `HARDEN (mandatory)`.
    The next "Start" invocation MUST then execute one full QA-flow cycle
    (§ QA flow) instead of DEV work — it does not increment the DEV counter;
    on its completion, log it in the Cycle Ledger, reset `Next run` to `DEV`,
    and subsequent "Start" runs resume DEV cycles. An explicitly user-invoked
    "harden" also logs to the ledger but does NOT reset the 10-cycle clock
    (the mandatory checkpoint still happens on schedule).
18. **Focus module (binding, per [MODULE_REGISTRY.md § 0 Current Focus
    Module](MODULE_REGISTRY.md)).** The ADP locks onto exactly one module at
    a time for P2.5/P3/P4 work and drives it to completion before rotating —
    it does not spread feature effort across the weakest module every cycle.
    Read MODULE_REGISTRY § 0 at bootstrap. P2.5/P3/P4 feature selection MUST
    stay inside that module; non-focus feature items stay queued. P0/P1
    (broken build, security/critical/high issues) are always exempt and
    picked regardless of focus. At cycle end, check the module against § 0's
    Completion criteria — if ALL five hold, mark it COMPLETE (with evidence),
    pick the next-weakest unclaimed module via `module-health.mjs`, and
    update § 0's Current focus + Rotation history in the same commit
    as the code that closed it out. Never rotate mid-cycle and never rotate
    without all five criteria met.
19. **GitHub tracking sync (binding, added for the agile/Projects program —
    see [.ai/COMPETITIVE_ROADMAP.md](COMPETITIVE_ROADMAP.md)).** At Record+
    Ship (DEV step 8, QA step 4), run the `sprint-sync` skill to mirror this
    cycle's work onto GitHub Issues: update/close the focus module's Epic
    issue, close or file-as-shipped the Story issues for features delivered
    this cycle. This is bookkeeping, not a new flow — it does NOT add a third
    trigger to the two-flow model in this file's header, and a failure to
    reach GitHub (auth/rate-limit) must never block the push to `main`.
    COMPETITIVE_ROADMAP.md § 6 tracks the one manual one-time step (creating
    a Projects v2 board + sprint milestones) still outstanding on the GitHub
    side; until that's done, sprint-sync uses labels only.

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

> **Velocity target (binding throughput floor)**: every Phase M/X DEV cycle
> must ship **≥ 5,000 net LOC OR ≥ 40 distinct features** before it may Record
>
> - Ship. Net LOC = adds + modifies from `git diff --numstat <cycle-start-sha>..HEAD`,
>   excluding lockfiles, generated Prisma client, and `*.map` (use
>   `node scripts/cycle-report.mjs` — it computes this). If under BOTH floors at
>   the point you would normally ship, do not ship yet: select the next item on
>   the priority ladder (same focus module) and continue the same cycle. Only a
>   genuine hard stop (budget exhaustion mid-build, red gate needing human input)
>   excuses shipping under-floor — say so explicitly in the report. Phase F
>   cycles and harden cycles are exempt (their velocity = track items / fixes).
>   In Phase M each feature still ends up as DB schema + API endpoint + UI page
> - tests, but a given cycle builds one horizontal layer (§ Horizontal build
>   order) across as many features as the floor and remaining budget require.
>
> **System-wide QA phase**: once every module in the § Phase M focus order
> has reached 1500+ features, Phase M's remaining cycles pivot from feature
> building to systematic testing and bug identification/fixing across the
> whole platform (still executed through the QA flow's find→file→fix→close
> loop — see § QA flow — just run continuously instead of only at the
> 10-cycle checkpoint) before Phase X (new apps) opens up.
>
> **Parallel DEV cycles**: When bringing Skeleton modules (< 10 features) to
> MVM, you may claim **up to 3 modules** in a single cycle. Each gets 15+
> features (basic CRUD + list + detail + tests) — uncapped beyond that if
> budget remains. Use `node scripts/scaffold-entity.mjs` for boilerplate.
> Deep modules (200+) remain single-focus.

0. **Bootstrap (slim — read sections, not whole documents)**: read this file
   (flow authority); from MODULE_REGISTRY read ONLY **§ Cycle Ledger**, **§ 0
   Current Focus**, and **§ Collab Board** (ranged reads — never the whole
   file); read the last ~5 CHANGELOG entries. Do NOT re-read `instructions.md`
   or `AGENTS.md` in full each cycle — they are standing policy loaded via
   CLAUDE.md pointers; consult specific sections on demand when a decision
   needs them. Then: `git pull`; `claim.mjs gc` (prune stale claims);
   `claim.mjs list`; `node scripts/module-health.mjs` (see weakest modules);
   record the cycle-start SHA (`git rev-parse HEAD`) for the net-LOC
   measurement at Record; start the dev stack if needed. Leave any work you
   didn't create alone (uncommitted files, other branches) — log it on the
   Collab Board, never commit over it.
   0a. **Harden checkpoint (mandatory, binding #17)**: if MODULE_REGISTRY § Cycle
   Ledger says `Next run: HARDEN (mandatory)`, execute one full QA-flow cycle
   now instead of DEV work, log it, reset `Next run: DEV`, and end the run.
   0b. **Phase gate (mandatory — § The Program Ladder)**: read
   `.ai/FOUNDATION_HARDENING_ROADMAP.md` § 12. Lift gate unmet → **Phase F**:
   this cycle's scope is the next unblocked foundation track item(s) in
   dependency order (0 → A → B∥C → D → E → F/G/H/I); the feature freeze holds
   and P2.5/P3/P4 are suspended. Lift gate met → **Phase M** (drive every
   module to Complete (1500+), in the § Phase M focus order) until all modules
   are Complete, then **Phase X** (new apps/modules). State the detected phase
   in the report.
1. **Focus question (interactive runs only — the ONE question; Phase M/X only —
   Phase F cycles never ask, their scope is the roadmap's dependency order)**: read
   MODULE_REGISTRY § 0's Current focus. If it's still IN FOCUS (completion
   criteria not all met), state it and proceed with zero questions — do not
   ask again each run. Only `AskUserQuestion` when either (a) there is no
   current focus (first run, or the prior focus just rotated to COMPLETE) or
   (b) the user's message explicitly asks to change focus — show each
   candidate module's feature count, health score, and claim holder. After the
   answer, zero further questions. Unattended runs never ask: they continue
   the current focus, or if it just completed, auto-pick the weakest
   unclaimed module and record it in `MODULE_REGISTRY.md` § 0.
2. **Select by the priority ladder** (Phase F: only P0/P1/P-F apply; Phase M/X:
   P2.5/P3/P4 constrained to `MODULE_REGISTRY.md` § 0's Current focus module —
   binding #18):
   - **P0**: Broken build/tests
   - **P1**: Open `security`/critical/high issues
   - **P-F** _(Phase F only, replaces all lower rungs)_: next unblocked
     foundation roadmap track item(s) in dependency order
   - **P2**: Unfinished shipped work / Collab Board Up Next
   - **P2.5**: Focus module below MVM threshold (50 features) — MUST be
     addressed before deepening it further. (Parallel DEV across up to 3
     skeleton modules is permitted only when no module currently holds focus —
     see binding #18 rotation.)
   - **P3**: Focus module deepening vs market leaders (check `.ai/MARKET_BENCHMARK.md`)
   - **P4**: New capability, still inside the focus module
     Benchmark against the top 10 ERP suites (see [instructions.md § 12](instructions.md#12-pm-agent-market-research-protocol))
     when picking P3/P4 — build what closes a real competitive gap, not filler.
3. **Claim** the sub-domain lock(s), add the Collab Board row(s).
4. **Plan (mandatory phase, binding #16 — write `.ai/IMPLEMENTATION_PLAN.md`,
   no approval needed, then execute)**: check `.ai/MARKET_BENCHMARK.md` for
   cached research (Phase M/X); deep-research top 10 competitors only if the
   cache for the target module is > 30 days old; duplicate-check; ordered
   slice list (Phase F: track items + exit-gate proofs; Phase M/X: DB→API→UI
   slices sized to clear the throughput floor). **Plan depth is
   phase-scaled**: Phase M deepening cycles keep the plan lean — scope + why,
   feature/endpoint/model list, gate tier, rollback note; skip RICE scoring,
   user stories, and per-feature acceptance criteria (the benchmark cache and
   completion criteria already justify the work). Full PM treatment (RICE,
   user stories, acceptance criteria, Definition of Done) is required only
   for Phase X new modules/apps. **Overwrite `.ai/IMPLEMENTATION_PLAN.md`
   with this plan — once, now, and not again until the next cycle**
   (mid-cycle scope changes = dated addendum lines). Commit it with the
   cycle's first commit. Append new findings to `.ai/MARKET_BENCHMARK.md`.
5. **Build the batch, horizontally (§ Horizontal build order)**: within the
   focus module, work the layer that's next for this cycle's planned slice —
   DB (schema + migrations for the planned feature set) OR API (services/
   controllers/guards/validation/events for schema already landed) OR UI
   (tab-based pages for API surface already built) — not a scramble of all
   three per feature. Respect § File-size discipline as you go; respect
   § UI navigation discipline when in the UI layer. Use scoped checks while
   building. Keep building in whichever layer(s) this cycle covers until the
   throughput floor (≥ 5,000 net LOC OR ≥ 40 features) is met — then continue
   as budget allows; never stop short of the floor without a hard stop.
   **Micro-harden checkpoint**: At every 20th feature (20, 40, 60), run scoped
   typecheck + vitest on the touched module. Fix any failures inline before
   continuing. This is NOT a full QA cycle — just a 2-minute sanity check.
6. **Verify** at the tier the batch demands (see Gate tiers).
7. **Review inline**: diff vs Critical Rules; security checklist on sensitive surfaces.
8. **Record + Ship**: FIRST verify the throughput floor — compute net LOC for
   the cycle (`node scripts/cycle-report.mjs`, which diffs the cycle-start SHA
   and excludes lockfiles/generated files); if net LOC < 5,000 AND features
   < 40 and no hard stop occurred, return to step 5 and keep building. Then:
   CHANGELOG entry + MODULE_REGISTRY update + regenerated ledger
   in the same commit as the code; release the lock; run `node scripts/pre-push-gate.mjs`;
   run `node scripts/module-health.mjs`; check the focus module against
   MODULE_REGISTRY § 0's Completion criteria and rotate if ALL five hold
   (binding #18); **update MODULE_REGISTRY § Cycle Ledger** (binding #17):
   increment `DEV cycles completed`, append the cycle row **including its Net
   LOC column value**, and if the counter is now a multiple of 10 set
   `Next run: HARDEN (mandatory)`; push to `main`
   (binding #4). Delete all temp files/scripts created during the cycle.
   Report: detected phase (F/M/X), items/features shipped (count + delta +
   maturity levels), **net LOC vs the 5K floor**, why selected, gate results,
   health score change, cycle counter (+ cycles until mandatory harden),
   top 3 next items, competitor gap assessment.
9. **Phase-F extra**: when a cycle closes a foundation track, mark it ✅ in
   `.ai/FOUNDATION_HARDENING_ROADMAP.md` with the closing evidence + commit
   (roadmap § 13). When the LAST track closes and the lift gate is green,
   declare **foundation SEALED v1.0** per roadmap § 12b in that cycle's
   report — the next cycle enters Phase M.

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

## Cross-module workflow batches (folded into the DEV flow, 2026-07-18)

> The separate "integrate" trigger is **retired** — there are exactly two flows.
> Cross-module workflows are now an ordinary **DEV-flow batch type** available in
> Phase M/X: when the priority ladder or focus module calls for it, a DEV cycle
> may dedicate its batch to wiring **2+ cross-module workflows** (each spanning
> 3+ modules), counted toward the cycle's feature target. In Phase F, workflow
> wiring that requires durable events waits for Track B (#17) — the outbox IS the
> integration substrate.

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
and `.ai/ARCHITECTURE_FOUNDATION.md`. **Subagent context brief (binding)**:
the invoking thread passes each subagent a distilled brief — current phase,
focus module, the specific conventions that apply, and exact file paths —
instead of the subagent re-reading MODULE_REGISTRY/HANDBOOK/CHANGELOG in
full. Subagents read governance docs only when the brief is insufficient.

---

## ADP Tooling (scripts/)

| Script                | Purpose                                 | When to Run               |
| :-------------------- | :-------------------------------------- | :------------------------ |
| `feature-ledger.mjs`  | Regenerate `.ai/FEATURE_LEDGER.md`      | Once per cycle, at Record |
| `module-health.mjs`   | Compute per-module health score (0–100) | Bootstrap + cycle end     |
| `pre-push-gate.mjs`   | Automated checklist before `git push`   | Before every push         |
| `cycle-report.mjs`    | JSON cycle report + net-LOC floor check | Record step (cycle end)   |
| `scaffold-entity.mjs` | Boilerplate generator for new entities  | MVM-level work            |
| `claim.mjs`           | Atomic work-claim locks                 | Before + after work       |
| `claim.mjs gc`        | Garbage-collect stale claims (48h TTL)  | Bootstrap                 |

---

## Continuous operation

Unattended runs (scheduler/CI) never prompt: the DEV flow first honors the
§ Cycle Ledger harden checkpoint and the Program-Ladder phase gate (Phase F =
foundation tracks in dependency order, no questions ever), then in Phase M/X
stays on `MODULE_REGISTRY.md` § 0's Current focus module until its completion
criteria are met (binding #18), only auto-picking a new weakest-unclaimed module
the run after one completes; QA flow scans the whole repo security-first (not
focus-filtered — bugs anywhere are P0/P1). All end with everything
committed, pushed to `origin/main` (never a branch), temp files cleaned, feature
ledger regenerated, health scores computed, cycle report generated, and CHANGELOG +
MODULE_REGISTRY updated — the next run bootstraps from a clean, production-grade state.

**Production-grade mandate**: The repo MUST be deployable to real customers at all
times. No temp files, no dead code, no placeholder stubs, no broken builds. See
[instructions.md § 14](instructions.md#14-production-grade-mandate).
