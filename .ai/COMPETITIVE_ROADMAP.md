# COMPETITIVE_ROADMAP.md — Agile Program to Market-Leading ERP

> **Purpose**: turn AUTOPILOT.md's mission ("out-feature SAP S/4HANA, NetSuite,
> Dynamics 365, Odoo, ERPNext, Workday, Salesforce, Infor, Acumatica, Epicor")
> into a tracked agile program — Epics, Program Increments (PI), Sprints,
> Stories — mirrored into GitHub Issues so progress is visible outside the
> `.ai/` files. This document is the program-management layer; it does not
> replace `.ai/MODULE_REGISTRY.md` (state of record for module status) or
> `.ai/MARKET_BENCHMARK.md` (cached competitor research) — it schedules and
> tracks the work those files already define.
>
> Maintained by: the `sprint-sync` skill, invoked at the end of every DEV/QA
> cycle (see AUTOPILOT.md § Shared bindings #19). Regenerate the dashboard
> section below whenever `module-health.mjs` / `feature-ledger.mjs` run.

---

## 1. Where the program stands today (2026-07-22)

Baseline pulled from `MODULE_REGISTRY.md` § System Progress Dashboard and
§ Cycle Ledger, and `MARKET_BENCHMARK.md`:

- **6,675 / 60,000 target features** shipped (11.1%) across 39 tracked
  modules + 4 externalized industry apps (healthcare, education, real-estate,
  field-service run as separate marketplace microservices).
- **1 of 39 modules at "Complete" tier (1500+)**: advanced-finance (1,248,
  closing). **0 modules at "Deep" tier.** Target: 40 modules Deep.
- **36 DEV cycles + several QA/harden cycles completed in 7 calendar days**
  (2026-07-16 → 2026-07-22), ~91,150 net LOC added, current total ≈726,700 LOC
  (~632,400 TypeScript). This is the observed velocity baseline — it reflects
  multiple parallel AI coding sessions (Collab Board protocol), not one agent.
- **Foundation SEALED v1.0** (2026-07-18) — architecture, tenancy/RLS,
  transactional outbox, migration discipline are permanent sealed contracts.
  Currently in **Phase M** (module strengthening), fixed focus order:
  Finance → CRM → HR → Procurement → Supply Chain → Manufacturing → Projects
  → Connect/Collaboration → Builder/Platform → industry apps → weakest-health
  remainder.
- **Caveat (read before trusting the feature count)**: "features" is an
  internal ledger metric (`scripts/feature-ledger.mjs`) counting distinct
  endpoints/capabilities, not an independently verified measure of
  real-world value or of matching a named competitor feature 1:1. Treat the
  60,000 target as a *proxy* for breadth, not proof of parity. Genuinely
  displacing SAP/Oracle/Workday also requires things no AI coding tool
  produces on its own: SOC2/ISO27001/industry certifications, real customer
  references, a partner/implementation ecosystem, 24/7 support operations,
  data-migration tooling for legacy systems, and enterprise sales capacity.
  This roadmap tracks the buildable, AI-IDE-executable part of the mission;
  § 5 separates that from the parts it can't shortcut.

---

## 2. Agile structure adopted

| Level | Unit | Cadence | GitHub mapping |
|---|---|---|---|
| **Program** | Whole mission (Phase M → Phase X) | Ongoing | This doc + `MODULE_REGISTRY.md` |
| **Epic** | One ERP module reaching Deep tier (1500+ features, parity/superiority vs top 10) | Multi-PI | One GitHub issue, `type:epic` + `module:<name>` labels |
| **Program Increment (PI)** | A focus-module rotation slice, ~6 sprints | ~12 weeks equivalent-effort (compressed to calendar days at current AI velocity — see § 4) | Epic issue's PI checklist (issue body, updated each cycle) |
| **Sprint** | One AUTOPILOT DEV cycle's batch, or a bundle of 2-3 same-day cycles | 1 "sprint" = 1 horizontal-layer batch (§ Horizontal build order) | `sprint:<n>` label + a milestone once one exists (see § 6 — Projects board not yet created) |
| **Story** | One feature/endpoint/UI-slice inside a sprint | Hours (AI-IDE build time) | GitHub issue, `type:story` + `sprint:<n>` + `module:<name>` labels, closed by the shipping commit |

**Definition of Ready (Story)**: named in `.ai/MARKET_BENCHMARK.md` or the
Epic's backlog, RICE-scored, DB/API/UI slice identified, no duplicate in
`FEATURE_LEDGER.md`.

**Definition of Done (Story)**: DB migration (if any) + API + UI + tests
shipped; `pnpm architecture:check` / `migration:discipline` clean; scoped
typecheck green; CHANGELOG + MODULE_REGISTRY updated in the same commit;
GitHub story issue closed by the commit that ships it.

**Definition of Done (Epic)**: module hits 1500+ weighted features, 80%+ test
coverage, full CRUD w/ pagination/sorting, and feature parity/superiority vs
top 10 leaders per `MARKET_BENCHMARK.md` — the same 5 criteria already
binding in `MODULE_REGISTRY.md` § 0.

---

## 3. Backlog: one Epic per module

All 39 registry modules get an Epic issue (see § 6 for what's actually
creatable given current tool access). Target/gap, condensed from
`MODULE_REGISTRY.md`:

| Epic (module) | Current | Target (Deep) | Gap | PI focus order |
|---|---:|---:|---:|:---|
| Finance & Accounting (core) | 256 | 1500 | 1244 | PI-1 (current) |
| Advanced Finance | 1248 | 1500 | 252 | PI-1 (current) |
| CRM | 786 | 1500 | 714 | PI-2 |
| HR (core) | 8 | 1500 | 1492 | PI-3 |
| Advanced HR | 710 | 1500 | 790 | PI-3 |
| Procurement | 708 | 1500 | 792 | PI-4 |
| Supply Chain | 89 | 1500 | 1411 | PI-5 |
| Manufacturing | 43 | 1500 | 1457 | PI-6 |
| Projects | 25 | 1500 | 1475 | PI-7 |
| Communication | 102 | 1500 | 1398 | PI-8 |
| Builder (low-code) | 177 | 1500 | 1323 | PI-9 |
| Sales | 709 | 1500 | 791 | rides with CRM (PI-2) |
| Inventory | 746 | 1500 | 754 | rides with Supply Chain (PI-5) |
| SaaS / multi-tenant | 499 | 1500 | 1001 | PI-9 |
| Admin | 123 | 1500 | 1377 | PI-9 |
| POS | 73 | 1500 | 1427 | PI-10 (industry-adjacent) |
| Marketplace | 51 | 1500 | 1449 | PI-10 |
| Ecommerce | 24 | 1500 | 1476 | PI-10 |
| Auth | 40 | 1500 | 1460 | cross-cutting, drips in every PI |
| SaaS Portal | 108 | 1500 | 1392 | PI-9 |
| Analytics / Reporting | 12 / 12 | 1500 / 1500 | 1488 / 1488 | PI-11 (cross-cutting BI) |
| Documents / Storage / Drive | 21 / 6 / 0 | 1500 each | ~1490 avg | PI-11 |
| Workflow / Notifications | 8 / 6 | 1500 each | ~1490 avg | PI-11 |
| AI | 13 | 1500 | 1487 | PI-11 |
| Blockchain | 11 | 1500 | 1489 | PI-12 (lowest health, 21/100) |
| Fixed Assets / People / Subscriptions | 9 / 10 / 14 | 1500 each | ~1489 avg | PI-12 |
| Localization / DevOps / ext-gateway / pwa / saved-views / outbox / search | 1–4 each | 1500 each | ~1497 avg | PI-13 (skeleton sweep) |
| Healthcare / Education / Real Estate / Field Service (externalized apps) | narrative-tracked | full vertical parity | — | PI-14+ (Phase X candidates) |

PI numbering above assumes ~1 PI per module-or-module-pair, sequenced by the
existing binding focus order (AUTOPILOT § Phase M focus order) — it does not
change that order, just puts sprint/PI numbers on it.

---

## 4. Time & cost projection

Three scenarios, all measured in **AI-IDE build cycles**, not human-sprint
weeks (a "cycle" here = one AUTOPILOT DEV cycle, historically produced in
hours, not the traditional 2-week human sprint):

| Scenario | Features/cycle assumed | Cycles needed (53,325 remaining) | Cycles/day (parallel Claude Code / Codex / Antigravity sessions via Collab Board) | Calendar time | AI-tool cost/month | Total AI-tool cost |
|---|---:|---:|---:|---:|---:|---:|
| **Aggressive** (matches best observed cycles, e.g. cycle 28's 486-feature jump, sustained) | ~185 (36-cycle historical average) | ~290 | 4–6 (3–4 parallel seats) | **10–14 weeks** | $600–1,000 (3–5× Claude Max/Codex/Antigravity seats @ ~$150–200 ea.) | **$1,800–4,000** |
| **Base** (excludes one-off outlier jumps; sustained deepening pace) | ~100 | ~535 | 2–3 (1–2 parallel seats + mandatory harden overhead) | **7–10 months** | $300–600 | **$3,000–6,500** |
| **Conservative** (binding floor only, plus real hardening/UAT/security time, not just feature count) | 40 (floor) | ~1,333 | 1–2 | **14–20 months** | $200–400 | **$3,500–8,500** |

Notes:
- All scenarios use **subscription-based** AI-IDE pricing (Claude Max /
  Claude Code Pro, GitHub Copilot Enterprise, Codex, Antigravity — roughly
  $20–200/seat/month depending on tier) rather than metered API billing,
  since that's how the ADP is actually being run (parallel human-directed
  agent sessions, not a raw API pipeline). Metered-API cost for the same
  volume of work (~530k-1M+ tokens/cycle across sub-agents) would land in a
  comparable $2,000–10,000 total range at current Sonnet/Opus-class pricing.
- **These figures cover raw feature/LOC throughput only.** They do NOT
  include: third-party certifications (SOC2 Type II ~$20-50k, ISO27001,
  industry compliance), legal/GTM cost of actually selling against SAP/
  Oracle, cloud infra at enterprise scale, or human QA/product review time —
  none of which an AI IDE can shortcut. If genuine market displacement
  (not just feature-count parity) is the goal, budget those as a separate,
  much larger, non-AI-tool line item.
- The historical 36-cycles/7-days pace is real but was partly foundation
  work (Phase F, exempt from the feature floor) and heavy UI-migration
  batches (large LOC, not proportional feature count) — treat "Aggressive"
  as an upper bound, not the planning default.

**Recommended planning number: Base scenario — ~7-10 months, ~$3,000–6,500
in AI-IDE subscription spend**, reviewed every PI (~every 6 sprints) against
actual `cycle-report.mjs` velocity and re-forecast in this document.

---

## 5. What "no limits" actually means here

Per AUTOPILOT.md the ADP already runs continuously and uncapped in feature
count per cycle above the floor — there is no artificial ceiling to lift.
"Unlimited" in practice means:
- No Epic is ever marked done below its 5-criteria Definition of Done (§ 2)
  — scope is not capped, but neither is it allowed to be padding (AUTOPILOT
  guardrail: "no stubs or padding to inflate counts").
- New Epics can be added anytime the PM hat + `MARKET_BENCHMARK.md` surface
  a genuine competitor gap — the backlog in § 3 is not a fixed final list;
  Phase X (after all modules Complete) explicitly opens new apps/modules.
- The constraint that actually exists is calendar time and parallel-agent
  capacity, not a policy limit — § 4's scenarios are throughput projections,
  not caps.

---

## 6. GitHub tracking — current capability and the manual step

**What's automatable right now** (via the `sprint-sync` skill, no manual
step): GitHub Issues (Epics + Stories) with labels `type:epic` / `type:story`
/ `module:<name>` / `sprint:<n>` / `priority:P0`-`P3`, auto-created/updated by
the DEV/QA flows' Record+Ship step, closed by the commit that ships the work.

**What needs one manual step** (no GitHub Projects-v2-board-creation API is
exposed to the agent tooling used here): create a Projects v2 board once,
named e.g. **"UniERP Roadmap"**, and add these custom fields so agents can
populate them per-issue going forward:

| Field name | Type | Options (if single-select) |
|---|---|---|
| Epic | Text | — |
| Sprint | Number | — |
| Story Points | Number | — |
| Status | Single select | Backlog, Ready, In Progress, In Review, Done |
| Phase | Single select | F-Foundation, M-Strengthening, X-Expansion |
| Module | Single select | one option per row in § 3 |

Once created, link it to the repo and the `sprint-sync` skill will set these
fields on every issue it creates/updates via `issue_write`'s `issue_fields`
parameter — no further manual steps after that.

Milestones-as-Sprints are the other gap: the agent tooling here can create
issues and labels but not milestones, so `sprint:<n>` is a **label**, not a
GitHub Milestone, until someone with repo-admin access creates the six PI-1
milestones (`Sprint 1` … `Sprint 6`) — after which `sprint-sync` will attach
issues to the matching milestone number instead of only labeling them.

---

## 7. Program Increment 1 (current) — Finance to Deep tier

Focus module per `MODULE_REGISTRY.md` § 0: **Finance & Accounting** (core +
advanced-finance combined, 1504 → 3000 combined target across the two
registry entries as they eventually merge). Six sprints, each one DEV cycle's
horizontal-layer batch:

| Sprint | Layer | Target slice |
|---|---|---|
| 1 | DB | Remaining schema for consolidations, intercompany elimination v2, statutory reporting packs |
| 2 | API | Services/controllers for Sprint 1's schema + Zod validation + domain events |
| 3 | UI | Tab pages for Sprint 2's endpoints (FinanceTabLayout, § UI navigation discipline) |
| 4 | DB | Treasury/cash management, advanced tax-engine schema |
| 5 | API | Services/controllers for Sprint 4's schema |
| 6 | UI | Tab pages for Sprint 5's endpoints + PI-1 close: verify Finance Epic's 5 completion criteria, rotate to CRM (PI-2) |

Concrete Sprint 1-3 story issues are created now (§ 8 tracking) as the
worked example; Sprints 4-6 and all of PI-2 onward get their story issues
generated by `sprint-sync` at the start of the DEV cycle that works them
(mirroring the existing `.ai/IMPLEMENTATION_PLAN.md` per-cycle plan, now also
opened as GitHub issues instead of staying only in that file).
