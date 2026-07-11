# MODULE_FOCUS.md — One Module at a Time, 500+ Features Deep

> **Owner directive (2026-07-08)**: the autonomous cycle focuses on **exactly ONE module
> at a time** and drives it to **500+ distinct, working, real-usage features** before
> moving to the next. Core modules first. Cross-module integrations are **pre-planned as
> contracts** before a module starts. **Studio is last** — only after every functional
> module is complete does the engine turn to Studio, to customize existing functionality
> and build new apps on top of a finished platform.
>
> Consumed by [`AUTOPILOT.md`](AUTOPILOT.md): P3–P7 work items MUST belong to the
> Current Focus Module. Only P0 (broken build), P1 (observed runtime failures), and
> P2 (conflicts) may touch other modules.

---

## 1. Current Focus

| | |
|:--|:--|
| **Focus module** | **Finance & Accounting** (`finance` + `advanced-finance`) |
| Started | 2026-07-08 |
| Feature count at start | 121 (endpoint proxy — see § 3 measurement) |
| Target | **500+** distinct working features |
| Reference competitors | NetSuite, Sage Intacct, SAP S/4HANA, Dynamics 365 F&O, Odoo Accounting |

## 2. What counts as ONE "distinct working feature"

A user-facing capability that is ALL of:
1. Reachable from the UI (page, action, report, or automation a business user can trigger),
2. Backed by a real API endpoint + service logic + Prisma data (no stubs),
3. RBAC-guarded, Zod-validated, unit-tested,
4. Exercised at least once in the running app (E2E smoke or manual verification).

Rules of thumb: each meaningful endpoint ≈ 1 feature (CRUD on an entity = 4–5);
a report/dashboard widget = 1; an automation/domain-event reaction = 1; a bulk
action = 1. Padding (splitting one capability into artificial endpoints) violates
the genuine-capability north star and doesn't count.

## 3. Measurement (run each cycle, log in § 6)

Run `node scripts/feature-ledger.mjs` and read the module's count from the regenerated
`.ai/FEATURE_LEDGER.md` (the single-file inventory of every functionality in the system
— method + route + summary + permission per row). That count is the **binding number**;
it over-counts trivial getters and under-counts UI-only features, so sanity-check
against § 2 judgment. The quality bar is enforced by the existing gates (tests, E2E,
parity checklists).

## 4. Focus Order (work top-down; a module is DONE when § 5 exit criteria pass)

| # | Module(s) | Baseline (2026-07-08) | Status |
|:--|:--|:--|:--|
| 1 | **Finance & Accounting** (`finance`, `advanced-finance`) | 121 | 🎯 **CURRENT** |
| 2 | CRM & Sales (`crm`, `sales`) | 367 | queued |
| 3 | Inventory & Supply Chain (`inventory`, `supply-chain`) | 73+ | queued |
| 4 | HR (`hr`, `advanced-hr`) | 98 | queued |
| 5 | Procurement | — | queued |
| 6 | Manufacturing (MRP) | — | queued |
| 7 | Projects / PSA | — | queued |
| 8 | POS & E-Commerce | — | queued |
| 9 | Workflow, Notifications, Documents, Reporting/BI (platform depth) | — | queued |
| 10 | Industry verticals (Healthcare, Education, Real Estate, Field Service) | — | queued |
| 11 | Platform (API hub, i18n, PWA, SaaS/marketplace) | — | queued |
| 12 | **Studio / Builder — LAST** | — | 🔒 locked until 1–11 done |

**Studio-last rule**: no new Studio/Builder feature work until every row above is DONE.
(P0/P1 fixes to Studio remain allowed.) Rationale: Studio customizes and extends
existing functionality — it multiplies value only once the functionality is complete.

## 5. Module Exit Criteria (all required before advancing to the next row)

**Status as of 2026-07-11 (scorecard hardening cycle):**

1. ✅ **MET** — Feature count ≥ 500 (§ 3 proxy) with no padding. (527, ledger row 2026-07-11.)
2. ✅ **MET** — All `MARKET_BENCHMARK.md` gaps for the module closed (`✅ SHIPPED`) or
   explicitly deferred with a written reason (kept `PARTIAL` with a note).
3. 🟡 **PARTIAL** — Scorecard: module at 10/10 on all seven dimensions; module pages in
   the E2E smoke suite (`SMOKE_ROUTES`) and green. `finance` module is now **10/10**.
   `advanced-finance` is 9.4/10 — the one open point (D1 Functionality = 6) is a
   confirmed heuristic false positive (`scripts/scorecard.mjs`'s stub-marker regex
   matching the word "placeholders" in a `cash-flow-forecast.service.ts` code comment
   that describes legitimate dynamic-calculation logic, not an actual stub/TODO) — not
   a genuine functionality gap, but the automated gate will not read 10/10 until the
   comment wording is changed or the heuristic is refined. E2E smoke: only the
   1099-reporting and tax-nexus pages have been added to `SMOKE_ROUTES` and verified;
   a full sweep of every Finance/advanced-finance page has NOT yet been run — **still open**.
4. ⬜ **NOT RE-VERIFIED** — Zero unresolved `FEEDBACK.md` runtime errors sourced from
   the module. Not re-scanned this cycle; carried from prior state.
5. ⬜ **OPEN** — Integration contracts published (§ 7) for every planned cross-module
   touchpoint. The § 7 table below still lists all Finance-emitted/consumed events as
   "planned" or "partially wired" — none have been implemented-and-verified as
   published contracts yet.
6. ⬜ **OPEN** — UAT pass: `business-analyst-uat`-style walkthrough of the module's top
   10 business workflows in the running app, recorded in CHANGELOG. Not run yet.

**Finance is NOT yet fully DONE.** The feature-count and benchmark-gap criteria are
met; the remaining blockers to advancing focus to CRM & Sales are: (a) a full E2E
smoke sweep across all Finance/advanced-finance pages, (b) publishing the § 7
integration contracts, and (c) a UAT pass. These are the top-priority items for the
next Finance cycle before any further new-feature work.

On exit: update § 1 and § 4, append the final § 6 ledger row, note the handover in
CHANGELOG, and re-benchmark the completed module one last time in MARKET_BENCHMARK.

## 6. Feature Ledger (append one row per cycle that touches the focus module)

| Date | Module | Proxy count | Delta | What was added |
|:--|:--|:--|:--|:--|
| 2026-07-08 | Finance | 121 | — | Baseline (11 core + 110 advanced-finance endpoints) |
| 2026-07-08 | Finance | 140 | +19 | Finance AR Automation & Dunning (dunning escalations, aging reports, risk holds, customer ledger). |
| 2026-07-08 | Finance | 148 | +8 | Finance Advanced Reporting (Analytics, payment terms, tax filing summaries, aging charts). |
| 2026-07-08 | Finance | 156 | +8 | Finance Automated Bank Feeds (Plaid oauth connections, bank feeds sync, auto transaction matching). |
| 2026-07-08 | Finance | 163 | +7 | Finance Cash Flow Forecasting (rolling 13-week cash projections, override variables, custom scenarios CRUD). |
| 2026-07-08 | Finance | 168 | +5 | Finance Intercompany Netting & Elimination (Prisma transaction model, auto matching buyer/seller, netting clearing GL journals). |
| 2026-07-08 | Finance | 196 | +28 | Finance Expense Management Deepening (closes [benchmark] OCR gap): simulated OCR receipt capture, category policy engine with per-item limits + receipt-required thresholds, mileage rate CRUD + auto-computed mileage expenses, per-diem rate CRUD + auto-computed per-diem expenses, item-level CRUD, multi-level approval routing (second approval >$2000), GL reimbursement journal posting, corporate card registration + transaction import + matching/ignoring, expense analytics (spend by category/status, violations); 6 new Prisma models, 20 new API endpoints, 2 Next.js pages (expense-reports rewired off mocks, new expense-policies), 16 new unit tests. |
| 2026-07-08 | Finance | 216 | +20 | Finance Lease Accounting (closes [benchmark] ASC 842/IFRS 16 gap, RICE 112.5): 17 API endpoints (list/summary/upcoming-payments/expiring-soon/analytics/CRUD/schedule/GL-post/bulk-post/terminate/renew/status), effective-interest amortization engine, GL journal posting via Journal+JournalEntry, 3 Next.js pages (list+create+detail with per-row Post button), 5 permissions, 23 unit tests, both typecheck clean. |
| 2026-07-09 | Finance | 231 | +15 | Finance Subscription Billing & MRR/ARR (closes [benchmark] RICE 94.5): Subscription/SubscriptionLine/SubscriptionInvoice/SubscriptionUsage models, billing-run job, MRR/ARR/churn calc, 15 endpoints, 3 Next.js pages, 14 unit tests. |
| 2026-07-09 | Finance | 249 | +18 | Finance AP Three-Way Matching + Batch Payment Runs + Report Drill-Through (closes 3 [benchmark] gaps): APMatchRule CRUD, three-way match engine, exception queue, payment batches (NACHA/SEPA/CSV export), GL posting, report drill-through, payables stats, 4 permissions, 3 Next.js pages, 25 unit tests. |
| 2026-07-09 | Finance | 251 | +2 | Finance Month-End Continuous Close Automation, Budget Scenarios & Driver-Based FP&A (closes 2 [benchmark] gaps): CloseTask/VarianceFlag/BudgetScenario/BudgetScenarioLine models, close checklist CRUD, templates autogen, PoP variance engine, budget scenario CRUD, cloning, locking, driver computations, actuals vs scenario comparisons, 3 Next.js pages, 13 unit tests. |
| 2026-07-09 | Finance | 262 | +11 | Finance AI-Powered Invoice Capture OCR & Auto-Coding (closes [benchmark] RICE 169 gap): APInvoiceCapture/APInvoiceCaptureLine models, OCR regex extractor, PO matching, auto coding based on vendor history, Accrued Liabilities/Expenses GL postings, 11 API endpoints, Next.js review page, 11 unit tests. |
| 2026-07-09 | Finance | 284 | +22 | Two batches shipped together (found cleanly co-located in the same shared hotspot files, see MODULE_REGISTRY.md §4 Conflict Log): (a) claude-code-cli-c — Unified Spend Management / real-time card controls (closes [benchmark] RICE 85.75 gap): CardSpendLimit/CardCategoryLimit/CardLimitAuditLog/CardLimitIncreaseRequest models, atomic pre-authorization check (race-safe conditional UPDATE), employee/department scope enforcement, 80%/100% threshold alerts, breach auto-freeze, period auto-reset, 13 API endpoints, corporate-card detail page, 7 permissions, 13 unit tests (+13). (b) concurrent unclaimed session — Dynamic Allocation Engine (closes [benchmark] RICE 115.2 gap): AllocationRule/AllocationRun models, static-% and dynamic-stat allocation, execution + posting endpoints, allocations page, 3 permissions, 6 unit tests (+9, not built or reviewed by claude-code-cli-c). |
| 2026-07-09 | Finance | 295 | +11 | Finance: Multi-Book / Multi-GAAP Accounting (closes [benchmark] RICE 90 gap): AccountingBookRule DB model & migration, GlAccountingService rules engine, auto-posting of parallel journal entries on post, optional bookId filtering for P&L, Balance Sheet, and Cash Flow statement endpoints and Next.js page selectors, 4 new unit tests. |
| 2026-07-09 | Finance | 330 | +35 | Finance: Project-Based Accounting WIP, Job Costing & POC (closes [benchmark] RICE 84 gap): estimatedCost/contractValue fields, ProjectCostEntry schema + CRUD endpoints, WIP calculation (labor/material/overhead breakdown + POC % + over/under-billing WIP status), WIP summary endpoint, new /projects detail tab and form, new /projects/wip-reports dashboard. |
| 2026-07-09 | Finance | 303 | +18 | Finance: Active Budget Control, Spread Methods, and Reallocations (DB+API+UI): BudgetControlConfig enforcement config (ALLOW/WARN/BLOCK), monthly BudgetPeriodAmounts (EVEN/HISTORICAL_PROPORTIONAL spreads), BudgetReallocations draft/submit/approve/reject workflow, 6 tests, spec fixes (note: baseline adjusted down due to externalization of industry modules). |
| 2026-07-09 | Finance | 502 | +36 | Finance: Hardening & Milestones (Batches 9-12): Intercompany loans, cash pooling sweeps/funding runs, asset revaluations/disposals GL postings, and multi-currency consolidation translation. Added 9 models, 36 endpoints, 10 unit tests, compiler/typecheck clean. |
| 2026-07-11 | Finance | 515 | +13 | Finance: 1099 / Vendor Tax Reporting (closes [benchmark] gap, module deepening — P0-P3 ladder had no open Finance item so this cycle fell to P6): Vendor1099Profile/Form1099/Form1099Batch models, 27 API endpoints (eligibility+threshold report, TIN match, backup withholding, W-9 checklist, form generate/edit/mark-ready/file/void/correct, e-file batches, dashboard summary, state filing reference data), `/finance/advanced/1099-reporting` UI, 21 unit tests. **Feature count crosses the 500-target exit criterion (§5) for the first time** — other exit criteria (scorecard 10/10, E2E smoke, UAT) still need confirmation before advancing focus. |
| 2026-07-11 | Finance | 527 | +12 | Finance: Economic Nexus Monitoring (closes [benchmark] RICE-72 gap) + 1099 E2E closeout: EconomicNexusThreshold/NexusMonitoringSnapshot/NexusRegistration models, 12 API endpoints (threshold CRUD + 20-state reference seed, trailing-12-month monitoring recompute + dashboard + per-state history, registration lifecycle CRUD), `/finance/advanced/tax-nexus` UI, 18 unit tests incl. tenant-isolation. `/finance/advanced/1099-reporting` E2E-verified (added to `SMOKE_ROUTES`, 20/20 Playwright smoke passing on a live stack). **Batch intentionally under the new 100+/15,000+ LOC per-cycle floor** — sized to genuine, fully-verified DB+API+UI+test work achievable in one session without padding; remainder queued as Up Next items 28-31 for subsequent cycles. Exit criteria (§5) still open: scorecard 10/10, full E2E smoke across all Finance pages, integration contracts, UAT pass. |
| 2026-07-11 | Finance | 527 | 0 | Finance: Scorecard hardening cycle (no new features — closing §5 exit-criterion 3 gaps directly, per user instruction to prioritize this over further feature growth once the module is feature-complete). `advanced-finance` D2 Validation 6→10 (81 endpoints in `advanced-finance.controller.ts` converted from raw `@Body() Record<string,unknown>`/loosely-typed params to real field-typed `@ZodBody(...)` Zod schemas), D5 Observability 4→10 (removed the module's one stray `console.warn`, now uses structured `Logger`); `finance` D6 Docs/API 4→10 (missing `@ApiOperation` added to `leases.controller.ts`). Re-ran `scripts/scorecard.mjs`: `advanced-finance` 8→9.4/10 (D1 Functionality still 6/10 — confirmed a heuristic false positive on the word "placeholders" in a `cash-flow-forecast.service.ts` code comment describing legitimate logic, not a real stub), `finance` → **10/10**. System score 9.8→9.9/10. Gates: `pnpm --filter @unerp/api typecheck` clean, advanced-finance 412/412 + finance 464/464 + auth 8/8 tests passing. Still open: full E2E smoke sweep of all Finance/advanced-finance pages, §7 integration contracts published, UAT pass — see updated §5 below. |



## 7. Cross-Module Integration Contracts (pre-planned BEFORE building)

Before deep work starts on a focus module, define the domain-event contracts it will
need with modules that come later — so later modules build against stable interfaces
and nothing gets rebuilt. Contracts are **event name + payload shape + direction**;
implementation lands when the emitting/consuming module is in focus.

### Finance (current focus) — planned contracts
| Event | Direction | Payload (key fields) | Counterparty | Status |
|:--|:--|:--|:--|:--|
| `finance.invoice.posted` | emits | invoiceId, customerId, total, currency, dueDate | CRM (health/CLV), Reporting | planned |
| `finance.payment.received` | emits | paymentId, invoiceId, amount, method | CRM, POS, E-Commerce | planned |
| `finance.invoice.overdue` | emits | invoiceId, daysOverdue, escalationLevel | CRM (dunning → activity), Notifications | planned |
| `sales.order.confirmed` | consumes | orderId, customerId, lines[], total | Sales → auto-invoice | partially wired (verify) |
| `purchase.received` | consumes | receiptId, poId, lines[] | Procurement → AP invoice matching | partially wired (verify) |
| `hr.payroll.run.completed` | consumes | runId, period, glLines[] | HR payroll → GL journal | planned |
| `inventory.valuation.changed` | consumes | productId, method, delta | Inventory costing → GL | planned |
| `pos.session.closed` | consumes | sessionId, totals, tenders[] | POS → daily journal | planned |

> When a new focus module starts, add its contract table here FIRST (that is the
> "pre-plan" step), reviewing which existing events it consumes and which future
> modules will consume from it.

---

*Maintained by the autonomous cycle. Update § 1/§ 4/§ 6 every cycle that advances the
focus module; never skip the ledger row.*
