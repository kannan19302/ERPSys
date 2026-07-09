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

1. Feature count ≥ 500 (§ 3 proxy) with no padding.
2. All `MARKET_BENCHMARK.md` gaps for the module closed (`✅ SHIPPED`) or explicitly
   deferred with a written reason (kept `PARTIAL` with a note).
3. Scorecard: module at 10/10 on all seven dimensions; module pages in the E2E
   smoke suite (`SMOKE_ROUTES`) and green.
4. Zero unresolved `FEEDBACK.md` runtime errors sourced from the module.
5. **Integration contracts published** (§ 7) for every planned cross-module touchpoint,
   and the *next* focus module's inbound contract drafted before the switch.
6. UAT pass: `business-analyst-uat`-style walkthrough of the module's top 10 business
   workflows in the running app, recorded in CHANGELOG.

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
| 2026-07-09 | Finance | 284 | +13 | Finance Unified Spend Management / real-time card controls (closes [benchmark] RICE 85.75 gap): CardSpendLimit/CardCategoryLimit/CardLimitAuditLog/CardLimitIncreaseRequest models, atomic pre-authorization check (race-safe conditional UPDATE), employee/department scope enforcement, 80%/100% threshold alerts, breach auto-freeze, period auto-reset, 13 API endpoints, corporate-card detail page (limits CRUD, utilization widget, freeze toggle, increase-request, audit trail), 7 permissions, 13 unit tests. |

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
