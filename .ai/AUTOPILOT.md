# AUTOPILOT.md — Autonomous Development Protocol

> **Trigger**: When a user (or scheduler) gives an AI agent the single instruction **"Start"**
> (or "start", "/start", "continue", "next") with no other requirements, the agent MUST execute
> this protocol end-to-end. No further human input is required or expected.
>
> This file is **tool-agnostic**. It works for Claude Code, Antigravity, Cursor, Copilot,
> Aider, or any future agent. It is a *protocol*, not state — all state lives in the
> 3-file system (`MODULE_REGISTRY.md`, `CHANGELOG.md`, `HANDBOOK.md`) per
> [AGENTS.md § Mandatory Tracking Convention](../AGENTS.md).

---

## The Autonomous Cycle (one full loop per "Start")

```
Start
  └─▶ 0. BOOTSTRAP   → read context, sync git, verify environment
  └─▶ 1. SELECT      → pick exactly ONE work item via the priority ladder
  └─▶ 2. CLAIM       → register the claim on the Collab Board
  └─▶ 3. PLAN        → scope it like a product manager (stories, acceptance criteria)
  └─▶ 4. BUILD       → implement end-to-end (DB → API → UI → tests)
  └─▶ 5. VERIFY      → reality gates: typecheck + full test suite must pass
  └─▶ 6. REVIEW      → self/agent code review + security pass if sensitive
  └─▶ 7. RECORD      → update the 3 tracking files + Growth Tracker
  └─▶ 8. SHIP        → commit + push (small, coherent commits)
  └─▶ 9. REFILL & DISCOVER → benchmark ONE module vs. market leaders, inject new
  │                          requirements, keep Up Next ≥ 5 groomed items
  └─▶ 10. REPORT     → summarize what was done, why it was chosen, what's next
```

An agent that can loop (scheduler, `/loop`, cron) repeats from step 0. An agent that
cannot loop stops after step 10 — the next "Start" from any agent resumes seamlessly
because all state is in the repo.

---

## Step 0 — BOOTSTRAP

1. Read, in order: `AGENTS.md`, `.ai/prompts/MASTER_PROMPT.md`, this file.
2. `git status` + `git pull` — never work on a stale tree.
3. Read `.ai/MODULE_REGISTRY.md` § Collab Board (Active Claims, Up Next, Conflict Log).
4. Read `.ai/SCORECARD.md` (heuristic scores + Reality Gates), `.ai/CHANGELOG.md`
   (last ~10 entries), `.ai/MODULE_FOCUS.md` (**the Current Focus Module** — P3–P7 work
   must belong to it), and `.ai/MARKET_BENCHMARK.md` (open competitive gaps).
5. Regenerate reality feedback: `node scripts/feedback-scan.mjs` → `.ai/FEEDBACK.md`
   (unresolved runtime errors from `error_logs`, open admin alerts, TODO/FIXME debt).
   If the dev stack is down, start it (`.\scripts\docker-start.ps1`) — the E2E gate in
   Step 5 needs it anyway.
5. If the working tree has uncommitted changes **you did not make**, do not touch those
   files; treat them as another agent's in-flight work (Collab Board rules apply).

## Step 1 — SELECT (the priority ladder)

**Focus-module constraint (binding)**: read [`MODULE_FOCUS.md`](MODULE_FOCUS.md) § 1
first. Items from rungs P3–P7 MUST belong to the **Current Focus Module** — the engine
drives one module to 500+ distinct working features before advancing (core modules
first, Studio locked until last). Only P0 (broken build), P1 (observed failures), and
P2 (conflicts) may touch other modules. If the focus module meets the exit criteria
(`MODULE_FOCUS.md` § 5), advancing the focus — publishing integration contracts and
drafting the next module's — IS the work item for that cycle.

Walk this ladder top-down; take the **first** rung that yields a concrete item, and take
exactly **one** item per cycle. Never skip a higher rung because a lower one is more fun.

| Priority | Source | Rule |
|:--|:--|:--|
| **P0 — Broken build/tests** | Run `pnpm turbo typecheck` and the API test suite (or read Reality Gates in `SCORECARD.md` and re-verify). | If either fails, fixing it IS the work item. Nothing else ships on a red build. |
| **P1 — Observed failures & unfinished work** | `.ai/FEEDBACK.md` (regenerated in Step 0): unresolved runtime errors and open admin alerts **outrank everything below** — real users hitting real errors beats any backlog feature. Also: `.ai/CHANGELOG.md` follow-ups, half-wired features (API without UI, UI without API). | Fix the highest-frequency unresolved error first; mark it resolved via the error-reports API when done. Finish or explicitly de-scope unfinished work with a note. |
| **P2 — Conflict Log** | Collab Board §4. | Resolve any logged conflict before new work. |
| **P3 — Up Next queue** | Collab Board §2 — pick from the top, skipping items overlapping Active Claims. | This is the primary steady-state source of work. |
| **P4 — Quality gaps** | `SCORECARD.md` modules/dimensions below 10 (e.g. auth D4/D5, admin D1); `MODULE_REGISTRY.md` § Production Readiness & Hardening open phases; RBAC decorator-stacking defect notes. | Pick the lowest-scoring dimension of the lowest-scoring module. |
| **P5 — Competitive gaps** | `.ai/MARKET_BENCHMARK.md` § Gap Backlog — highest-value open gap (H value first, then smallest size). | This is where market-leader parity work comes from; prefer gaps already promoted to Up Next with the `[benchmark]` prefix. |
| **P6 — Module deepening** | `MODULE_REGISTRY.md` § Module-Specific Completion Notes; run an ad-hoc discovery pass (§ Step 9) on the weakest module to find its gaps. | Deepen one module completely before starting another (module-completion strategy). |
| **P7 — New capability** | Nothing above applies (rare). Act as product manager: propose a new module/app/integration consistent with the Phase roadmap and the 1M-LOC genuine-capability north star; write it into Up Next, then build the first slice. | Must pass the "does this already exist?" check against `MODULE_REGISTRY.md`. |

**Batch-throughput rule (binding)**: one cycle = one coherent **batch of 10–20+
distinct features** (per `MODULE_FOCUS.md` § 2 definition) in the focus module — more
is welcome; fewer only if a single feature is genuinely L-sized (log why). Compose the
batch around one sub-domain so it shares a schema migration and UI surface (e.g.
"Finance/AR: dunning levels + reminder templates + escalation schedule + pause-on-dispute
+ aging buckets + statement generation + …" ≈ 15 features, one migration, two pages).
Every batch MUST span all three layers: **DB (Prisma) + API (NestJS) + UI (Next.js)** —
API-only or UI-only cycles don't count toward the ledger. If the top queue item is too
big, split it; if too small, pull the next items from the same sub-domain until the
batch reaches 10+.

## Step 2 — CLAIM

Acquire the atomic lock FIRST — `node scripts/claim.mjs acquire <sub-domain-slug>
--agent <name+session> --scope "<desc>"` — and commit+push the lock file. Exit 1
(`HELD`) means another session owns it: pick a different sub-domain, never proceed.
Then add the human-readable row to Collab Board §1. Run the same-functionality
double-check (§ Parallel Agents rule 1b) before writing any code. Full mechanics:
§ Parallel Agents rules 1/1b.

## Step 3 — PLAN

Act as the product manager (Claude Code: invoke the `product-manager` subagent):
- Confirm the item doesn't already exist — search `.ai/FEATURE_LEDGER.md` (the
  generated single-file inventory of every functionality in the system) and
  `MODULE_REGISTRY.md`. Mandatory.
- Enumerate the batch as a numbered feature list (10–20+ items, per the batch-throughput
  rule) grouped under one sub-domain, then write user stories with acceptance criteria
  and an explicit **Definition of Done**:
  schema + API + UI + tests + docs + nav/breadcrumbs + RBAC — the full E2E rule.
- **Competitor-parity depth rule** (for `[benchmark]` items and any feature a market
  leader also ships): acceptance criteria must quote the *actual capability* of the
  reference competitor from `MARKET_BENCHMARK.md` (e.g. "NetSuite dunning: N escalation
  levels, per-customer schedules, pause-on-dispute") and the Definition of Done is a
  **parity checklist** against that description. A thin checkbox version of a leader's
  feature does not count as closing the gap — either build to parity or split the gap
  into slices and leave the remainder logged in the Gap Backlog as `PARTIAL`.
- Pick the task template from `MASTER_PROMPT.md` § Task Templates (New Module / New
  Entity / New API Endpoint / New UI Page / Bugfix) and follow it exactly.

## Step 4 — BUILD

Implement the full vertical slice per the template and every AGENTS.md Critical Rule
(tenant_id, `@Permissions`, `@TrackChanges`, Zod validation, `@unerp/ui` + `.frappe-*`
classes, DataTable policy, breadcrumbs, no cross-module imports, no `any`, no
`console.log`). New module UI goes through `@unerp/framework` where applicable.
Write unit tests alongside code, not after.

**Batch-efficient build order** (pay each fixed cost ONCE per cycle, not per feature):
1. **DB first, once**: design ALL Prisma models/fields for the whole batch → one
   `pnpm db:migrate` → one `prisma generate` (stop `dev:api` first, per known gotcha).
2. **API next, in bulk**: all services + controllers + DTOs + permission registrations
   for the batch. Compile-check with the *scoped* filter as you go
   (`pnpm --filter @unerp/api typecheck`), not the whole turbo graph.
3. **UI last, in bulk**: pages/actions wired to the new endpoints; the dev server's HMR
   verifies renders as you write — no rebuilds needed.
4. Unit tests for the batch's services in ONE spec pass at the end of the API stage.

**Time discipline — building is the point**: target ≥ 70% of the cycle on writing
schema/API/UI code. DO NOT run the full test suite, full typecheck, or E2E after every
feature — those are Step 5 gates, paid **once per cycle**. During Step 4 use only the
fast feedback loops: scoped `--filter` typecheck, the single module's vitest file
(`npx vitest run src/modules/<module>`), and HMR in the already-running dev stack
(never restart docker; never re-seed unless schema demands it).

## Step 5 — VERIFY (reality gates — binding)

Run this step **exactly once per cycle**, after the whole batch is built (Step 4) — not
per feature. All must pass before anything is recorded or shipped:
1. `pnpm turbo typecheck` (or `pnpm --filter ... tsc --noEmit`) — zero errors.
2. Full API unit test suite — zero failures (no `skip`/`only`).
3. **E2E smoke gate (binding)**: with the dev stack up, run
   `pnpm --filter @unerp/web test:e2e` — `e2e/smoke.spec.ts` logs in as the seeded
   admin and walks every core module surface, failing on error boundaries and 5xx
   responses. "Works" means observed behavior in a running app, not passing mocks.
   If your change added a page/module, **add its route to `SMOKE_ROUTES`** in
   `smoke.spec.ts` — that list is the binding definition of "the app boots".
   If the stack genuinely cannot be started in your environment, you may ship on gates
   1–2 only, but MUST log `[e2e-unverified] <scope>` at the top of Up Next so the next
   agent with a stack runs the gate first.
   To keep this fast, run only the smoke project (`npx playwright test smoke`) — the
   full e2e suite is for CI, not the inner loop.
4. Manually exercise the batch's **primary workflow** end-to-end in the running app
   (create → read → update, empty/error states, console clean) — one representative
   pass over the batch, not a per-feature ritual; the smoke suite covers page health.
5. Regenerate the scorecard if substantial: `node scripts/scorecard.mjs`; regenerate
   feedback: `node scripts/feedback-scan.mjs` (your fix should remove its error rows).

If a gate fails, fix it in this cycle. Never commit a red build; never weaken a test to
make it pass.

## Step 6 — REVIEW

Run the Code Review checklist from `MASTER_PROMPT.md` § Code Review against your own
diff (`git diff`). Claude Code: use the `code-reviewer` subagent; touches to auth,
tenancy, permissions, file upload, or payments additionally require the
`security-auditor` pass. Fix all Blockers and Warnings before shipping.

## Step 7 — RECORD

Per the Mandatory Tracking Convention — no exceptions:
- Append a `CHANGELOG.md` entry (what + why + any follow-ups spawned).
- **Regenerate the system-wide Functionality Ledger (mandatory whenever any code
  shipped)**: `node scripts/feature-ledger.mjs` → `.ai/FEATURE_LEDGER.md` — the single
  file listing every functionality in the entire ERP (method + route + summary +
  permission, scanned from the code), existing and newly shipped alike. Commit it with
  your change. This file is also the duplicate-check source in Step 3: search it before
  building anything.
- **Regenerate the daily sprint tracker**: `node scripts/sprint-tracker.mjs` →
  `.ai/SPRINT_TRACKER.md` — per-day LOC delivered (+/−/net, code files only), commits,
  features shipped (new endpoints), and modules touched, mined from git history. Commit
  it with your change; quote today's row in the Step 10 report.
- If the cycle advanced the focus module: append a progress row in
  `MODULE_FOCUS.md` § 6 (take the module's count from the regenerated
  `FEATURE_LEDGER.md`) and update any integration-contract statuses in § 7.
- Update `MODULE_REGISTRY.md` (module row/status, Growth Tracker row if substantial,
  move your Collab Board claim §1 → §3 Recently Completed with commit hash).
- Update `HANDBOOK.md` only if a convention/architecture actually changed.

## Step 8 — SHIP

Commit in small coherent units with conventional messages (`feat(module): ...`,
`fix(module): ...`) and **push**. Stage only files within your claimed scope — never
sweep in another agent's uncommitted work with `git add -A`.

**A cycle ends with the changes on `origin/main` — always.** If you worked on an
`autopilot/*` branch (parallel mode), Step 8 includes merging it into `main`, pushing,
and deleting the branch (see § Parallel Agents rule 2). Leaving shipped work stranded
on a branch violates the protocol.

## Step 9 — REFILL & DISCOVER (mandatory every cycle — this generates NEW requirements)

The system must never merely consume its backlog; every cycle must also **create**
requirements by looking outward at the market. Two mandatory sub-steps:

**9a. Market discovery (one module per cycle).** Run the Discovery Protocol in
[`.ai/MARKET_BENCHMARK.md`](MARKET_BENCHMARK.md) § 2:
- **While a focus module is active** (`MODULE_FOCUS.md`), benchmark the *focus module*
  every cycle — its Gap Backlog is the primary source of the next 500-feature push;
  go deeper each pass (sub-domains: e.g. Finance → AR, AP, GL, tax, banking, close,
  reporting). Fall back to the most-overdue Rotation Tracker module only when the focus
  module's gaps are all logged and groomed ahead ≥ 10 open items.
- Benchmark it against its 3–5 reference competitors from the top-20 set (SAP, NetSuite,
  Dynamics 365, Odoo, ERPNext, Workday, Salesforce, Shopify, …) — via `WebSearch`/
  `WebFetch` when available, otherwise offline product knowledge (mark it as such).
- Log concrete gaps (feature | who has it | MISSING/PARTIAL/WEAK-UX | value | size) in
  the Gap Backlog, promote the top 1–3 into Up Next prefixed `[benchmark]`, and update
  the Rotation Tracker. Improvements to existing features count equally with new ones.

**9b. Queue refill with business-value scoring.** Ensure Collab Board §2 (Up Next) has
**at least 5 groomed items** and **at least 2 `[benchmark]`-sourced** — from 9a output,
`.ai/FEEDBACK.md` signals, follow-ups, scorecard gaps, hardening phases, roadmap items.

Each item carries a lightweight **RICE score** so selection is business-driven, not just
engineering-driven: `RICE = (Reach × Impact × Confidence) / Effort` where Reach = % of
tenants/users affected (0.1–1), Impact = 3 massive / 2 high / 1 medium / 0.5 low,
Confidence = 1 / 0.8 / 0.5, Effort = person-days-equivalent (S=1, M=3, L=8). Format:
`RICE 2.4 (R.8 × I2 × C1 / E0.67)`. Keep §2 sorted by RICE descending **within** each
priority class — P0–P2 emergencies always outrank RICE.

## Step 10 — REPORT

End with a short human-readable summary: item chosen + why (which priority rung),
what shipped (commits), gate results, **today's delivery line from
`SPRINT_TRACKER.md`** (features + net LOC so far today), the focus module's progress
toward 500 (from `MODULE_FOCUS.md` § 6), and the top 3 Up Next items.

---

## Parallel Agents (multi-agent concurrency — binding when >1 agent runs at once)

Multiple agents (Claude Code sessions, Antigravity, unattended loop, CI) may execute
this protocol simultaneously. The Collab Board is the lock table; these rules make
parallel cycles collision-free:

**1. Claim = atomic lock file, acquired BEFORE anything else.**
The Collab Board alone cannot prevent duplicate work: it's only visible after
commit→push→pull, so **multiple sessions in the same checkout** (several Antigravity
windows, several Claude Code sessions, IDE + terminal) race straight past it. The
binding mutex is the lock registry in `.ai/locks/`:

```
node scripts/claim.mjs acquire <sub-domain-slug> --agent <name+session> --scope "<files/desc>"
```

- Atomic (O_EXCL): if another session — same machine or not — holds the slug, you get
  exit 1 (`HELD`) instantly. **Pick a different sub-domain; never proceed on HELD.**
- On `ACQUIRED`: commit + push the lock file immediately (cross-machine visibility),
  THEN add your Collab Board §1 row (the board stays the human-readable view; the lock
  is the mutex). If the lock-file push is rejected, `pull --rebase` — if someone else's
  lock for your slug arrives, you lost the race: release yours, pick another.
- **Heartbeat** each protocol step (`claim.mjs heartbeat <slug>`); a lock with no
  heartbeat for **2h is stale** and `acquire` auto-takes it over (log in §4).
- **Release** in Step 8 (`claim.mjs release <slug>`) and commit the deletion.
- `claim.mjs list` shows every active session's claim — run it during Step 0 bootstrap.

Sub-domains must be **disjoint** (Finance/AR-dunning vs Finance/tax vs Finance/leases),
each listing the module sub-path and pages it covers. Agent names must include a
session discriminator (e.g. `antigravity-win2`, `claude-code-cli-a`) so `list` shows
who is who.

**1b. Same-functionality double-check (mandatory, both ends of the cycle).**
Locks prevent *scope* collisions; this prevents *semantic* duplicates (two sessions
building the same feature under different slugs): (a) at claim time, grep
`FEATURE_LEDGER.md` for your batch's intended routes/nouns AND run
`git log --all --oneline --since="2 days ago"` + `claim.mjs list` looking for the same
feature under another name — if found, shrink or re-target your batch; (b) right
before Step 8's merge, after rebasing onto `origin/main`, re-grep `FEATURE_LEDGER.md`
for your routes — if another session shipped overlapping features while you built,
keep the better implementation, drop the duplicate, and log the collision in §4 so the
sub-domain split gets refined.

**2. Branch policy — everything ends on `main`, every cycle.**
`main` is the single source of truth; work not on `main` is invisible to every other
agent and to the user. Solo agent → commit directly to `main`. Parallel agents → work
on a **short-lived** `autopilot/<sub-domain>` branch, but the cycle is NOT complete
until that branch is **merged into `main`, pushed, and deleted** — merging is part of
Step 8 (SHIP), not an optional afterthought. Sequence: gates pass → `git fetch` +
rebase onto `origin/main` → re-run scoped typecheck → merge to `main` → push → delete
the branch. Never force-push, never merge a red branch, and **never end a cycle with
unmerged branch commits** — if the merge is blocked (conflict needing the other agent),
log it in §4 Conflict Log and resolve it as the immediate next action, not "later".
Small doc/tracking edits may go straight to `main` from any agent.

**3. Shared-hotspot files** — `schema.prisma`, `packages/shared/src/permissions/registry.ts`,
`moduleNav.tsx`, navigation `registry.tsx`/`SEGMENT_NAMES`, `SMOKE_ROUTES`:
append your entries in your module's own section (not at a common tail), keep the edit
minimal, and `git pull --rebase` immediately before pushing. These files merge cleanly
when everyone appends locally-scoped blocks.

**4. Migration serialization (the one true mutex).**
Prisma migrations must be created one-at-a-time: before `pnpm db:migrate`, pull and
check for migrations newer than yours; if another agent's migration landed after you
branched, rebase, re-run `prisma migrate dev`/`deploy` so yours applies on top, and
re-generate the client. Never rename/reorder another agent's migration; never hand-edit
`prisma/migrations/`. If two unapplied migrations genuinely conflict, the later claimer
recreates theirs (log it in §4 Conflict Log).

**5. Generated trackers never hand-merged.**
On any rebase/merge conflict in `FEATURE_LEDGER.md`, `SPRINT_TRACKER.md`,
`FEEDBACK.md`, or `SCORECARD.md`: take either side, then **re-run the generating
script** and commit the regenerated file. Hand-merging generated content is forbidden.
Append-only files (`CHANGELOG.md`, Collab Board rows, `MODULE_FOCUS.md` § 6): keep both
sides on conflict — entries are independent rows.

**6. Shared dev stack etiquette.**
The docker stack and dev DB are shared. Reading, HMR, and running the smoke suite are
always safe in parallel. **Never** reset/re-seed the DB, restart containers, or run
`prisma migrate reset` while another agent's claim is active — if a destructive reset
is unavoidable, treat it like a migration: announce via a Collab Board row first.

**7. Don't duplicate work.**
Before claiming, check §1 Active Claims AND `git log --all --since="1 day ago"
--oneline` (another agent's branch may already contain your target). After rebasing,
grep `FEATURE_LEDGER.md` for your batch's routes — if half your features just landed
from someone else's merge, shrink your batch to the remainder rather than re-shipping.

## Token & Context Efficiency (binding — less reading/re-doing, more building)

Tokens spent re-deriving context are tokens not spent shipping features. Rules:

**Read less, target better**
1. Never read a whole large file to find one thing — `grep` for the symbol, then read
   only the matching range (offset+limit). Controllers/services here run 1,000+ lines.
2. Use the generated indexes as your map, not code archaeology: `FEATURE_LEDGER.md`
   answers "does X exist / what routes does module Y have"; `MODULE_REGISTRY.md`
   answers status; `SCORECARD.md` answers quality. Do NOT dump these entire files
   into context either — grep them for the module/row you need.
3. Read a file at most once per cycle; do not re-read after your own edit to "verify"
   (the edit tool already errors on failure). Never `cat` generated files
   (FEATURE_LEDGER, SPRINT_TRACKER, FEEDBACK) — the scripts print a one-line summary;
   trust it.
4. Cap tool output: `--reporter=line`/`--reporter=dot` for tests, `| tail -n 20` for
   long commands, `git diff --stat` before deciding whether any full diff is needed.

**Copy patterns, don't rediscover them**
5. Each layer has a reference implementation — clone its shape instead of exploring:
   controller/service/DTO → the focus module's newest sub-service; list page →
   `apps/web/app/(dashboard)/customers` (DataTable pattern); detail/form pages → any
   recent `[benchmark]` batch. Read the reference ONCE, then write every batch file
   from that template without re-reading it.
6. Prefer schema-driven UI via `@unerp/framework` wherever it fits — one schema
   definition replaces hundreds of hand-written JSX lines per page ("less use, build
   more" applies to the code itself, not just the context).
7. Write each new file in ONE complete Write call — no skeleton-then-fill iterations,
   no rewriting a file three times. Plan the batch (Step 3) precisely enough that
   files are written once, correct.

**Don't multiply context**
8. Avoid spawning subagents that must re-read AGENTS/HANDBOOK from scratch for small
   tasks — a subagent is worth its boot cost only for a large parallelizable chunk
   (e.g. the whole UI stage of a batch). Pass them the exact file list + pattern
   reference in the prompt so they don't re-explore.
9. Keep Step 10 reports tight: counts, gate results, ledger row — never paste code,
   diffs, or file contents into the report.
10. When a gate fails, read only the failing test/error lines (grep the output),
    not the entire suite log.

## Guardrails (absolute)

- **One coherent batch (10–20+ features) per cycle.** Finish it completely (DB+API+UI)
  or split and log the remainder — never leave half-wired layers.
- **Never** force-push, rewrite history, delete migrations, drop/reset databases, or
  modify another agent's claimed scope or uncommitted files.
- **Never** ship stubs, mocks, dead scaffolding, or padded code — the LOC north star
  counts genuine capability only.
- **Never** disable lint rules, skip tests, weaken RBAC/tenancy, or commit secrets.
- Destructive or irreversible operations (data deletion, dependency major-bumps,
  infra changes) are out of autonomous scope — log them in Up Next tagged
  `[needs-human]` instead.
- If blocked (missing credential, ambiguous business decision, environment broken beyond
  repair), record the blocker in Up Next tagged `[blocked]`, release your claim, and
  report — do not thrash.

---

## Agent-specific bindings

| Agent | How "Start" reaches this protocol |
|:--|:--|
| **Claude Code** | Root `CLAUDE.md` instructs it; `/start` skill in `.claude/skills/start/` invokes it; role subagents (`product-manager`, `fullstack-developer`, `qa-tester`, `code-reviewer`, `security-auditor`, `tech-writer`) map to steps 3–7. |
| **Cursor / Copilot / Windsurf / Aider / Antigravity** | Their rule files point to `AGENTS.md`, which points here (§ Autonomous Mode). |
| **Schedulers / CI** | Any runner that can invoke an agent with the prompt "Start" gets one full cycle; run it on an interval for continuous evolution. |

## Continuous (unattended) operation

Three ways to run the loop without a human:

1. **Local loop**: `.\scripts\autopilot-loop.ps1 -Cycles 10 -PauseMinutes 5` — invokes
   `claude -p "Start"` headless per cycle, logs to `var\autopilot\`. `-Cycles 0` = forever.
2. **CI nightly**: `.github/workflows/autopilot.yml` — manual `workflow_dispatch` now;
   uncomment the cron (and set the `ANTHROPIC_API_KEY` repo secret) for nightly
   self-evolution.
3. **Interactive pacing**: in a Claude Code session, `/loop /start` self-paces cycles.

Concurrency is already handled by the Collab Board claim protocol — an unattended loop
and a human-driven session can run simultaneously without clobbering each other.
