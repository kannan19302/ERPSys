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
   (last ~10 entries), and `.ai/MARKET_BENCHMARK.md` (open competitive gaps + which
   module is overdue for a discovery pass).
5. Regenerate reality feedback: `node scripts/feedback-scan.mjs` → `.ai/FEEDBACK.md`
   (unresolved runtime errors from `error_logs`, open admin alerts, TODO/FIXME debt).
   If the dev stack is down, start it (`.\scripts\docker-start.ps1`) — the E2E gate in
   Step 5 needs it anyway.
5. If the working tree has uncommitted changes **you did not make**, do not touch those
   files; treat them as another agent's in-flight work (Collab Board rules apply).

## Step 1 — SELECT (the priority ladder)

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

**Sizing rule**: an item must be completable end-to-end in one session. If the top item
is too big, split it — put the remainder back into Up Next as groomed sub-items and take
the first slice.

## Step 2 — CLAIM

Add a row to Collab Board §1 (agent name, timestamp, scope = module/file list) and
commit that small edit early so parallel agents see it. Never start on a scope that
overlaps an existing Active Claim.

## Step 3 — PLAN

Act as the product manager (Claude Code: invoke the `product-manager` subagent):
- Confirm the item doesn't already exist (`MODULE_REGISTRY.md` check — mandatory).
- Write 2–5 user stories with acceptance criteria and an explicit **Definition of Done**:
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

## Step 5 — VERIFY (reality gates — binding)

All must pass before anything is recorded or shipped:
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
4. Manually exercise the changed feature end-to-end in the running app (create → read →
   update flow, empty/loading/error states, console clean).
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
- Update `MODULE_REGISTRY.md` (module row/status, Growth Tracker row if substantial,
  move your Collab Board claim §1 → §3 Recently Completed with commit hash).
- Update `HANDBOOK.md` only if a convention/architecture actually changed.

## Step 8 — SHIP

Commit in small coherent units with conventional messages (`feat(module): ...`,
`fix(module): ...`) and **push**. Stage only files within your claimed scope — never
sweep in another agent's uncommitted work with `git add -A`.

## Step 9 — REFILL & DISCOVER (mandatory every cycle — this generates NEW requirements)

The system must never merely consume its backlog; every cycle must also **create**
requirements by looking outward at the market. Two mandatory sub-steps:

**9a. Market discovery (one module per cycle).** Run the Discovery Protocol in
[`.ai/MARKET_BENCHMARK.md`](MARKET_BENCHMARK.md) § 2:
- Pick the most-overdue module from its Rotation Tracker (staleness > 45 days = due;
  ties broken by lowest scorecard score).
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
what shipped (commits), gate results, and the top 3 Up Next items.

---

## Guardrails (absolute)

- **One item per cycle.** Depth over breadth; finish completely (E2E) or split and log the remainder.
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
