# Module Registry — Universal ERP System

> This file tracks every ERP module, its status, dependencies, and responsible team/agent.
> AI agents MUST update this file when creating or modifying modules.

---

## Codebase Growth Tracker

> Protocol lives in [`.ai/prompts/MASTER_PROMPT.md` § 3](prompts/MASTER_PROMPT.md#3-codebase-growth-tracker-protocol).
> North star: 1,000,000+ lines of genuine, production-ready, non-padded enterprise
> functionality. Add a new dated row after any substantial unit of work — append-only,
> never edit/delete prior rows.

| Date | Total LOC | Delta | Notable modules/features added that session |
|:---|:---|:---|:-|
| 2026-07-08 | 430,285 | +1,060 | Finance Intercompany AP/AR Netting & Elimination Batch (Prisma model, auto match rules, manual linkings, netting clearing GL journal postings, stats counters, 2 Next.js pages, unit tests). |
| 2026-07-08 | 429,225 | +950 | Finance Cash Flow Forecasting Batch (rolling 13-week projections, overrides, custom scenarios CRUD, scenario multipliers, dashboard, csv exporter, unit tests). |
| 2026-07-08 | 428,275 | +1,410 | Finance Automated Bank Feeds Batch (direct sync, smart auto-matching, manual linking, connections/reconciliations pages, schema models, unit tests). |
| 2026-07-08 | 426,865 | +1,765 | Finance Advanced Reporting & Settings Batch: added PaymentTermTemplate Prisma schema, PaymentTermsService CRUD, 12 new financial-reporting endpoints for analytics, bad debt write-off, proforma, late fees, forecasting, budgets monthly spread, GL drilldown, customer/vendor payment analysis, tax filing summary. Built 3 Next.js pages: payment-terms config, revenue analytics dashboard, and tax summary dashboard. 207 unit tests passed clean; web and api typechecks completely green. |
| 2026-07-05 | 425,100 | +600 | Completed and verified CRM B2B Sales Expansion Batch 1 (Forecasting & Account Management): database models, CRUD services, secured controller endpoints, navigation, segment mapping, interactive forecasting, and strategic account plans. All Vitest tests (2,026/2,026) and frontend typecheck clean. |
| 2026-07-05 | 424,500 | +450 | Hardened and compiled all 10 new backend service layers & controllers for CRM/Sales expansion (Forecasting, CPQ, support queues, commissions). Resolved 20+ typecheck errors and added 10 unit tests (`crm-expansion.spec.ts`, 433/433 tests green). |
| 2026-07-05 | 424,050 | +150 | Codified the DataTable sort/pagination/Actions convention as a formal global policy (`AGENTS.md` §16a-16c). Added real Leads deepening features: `reactivateLead()` (win-back for DISQUALIFIED leads, dedicated `POST /crm/leads/:id/reactivate` endpoint, only sanctioned path back to NEW) and `getStalledLeads()` (`GET /crm/leads/stalled`, leads with no activity in N days, surfaced via a Reactivate action on the Leads list). 6 new unit tests (421/421 CRM+Sales suite passing). |
| 2026-07-05 | 423,900 | +1,258 | Global sortable-table + Actions-column convention (`.dt-sort-th`/`.dt-sort-arrow` CSS + `DataTable` sortBy/sortOrder/onSortChange props) rolled out across all CRM & Sales list pages: customers, contacts, leads, opportunities, quotations, sales-orders, price-books, vendors, contracts, cases, products, territories, documents, commissions, approvals. Fixed a stale sales-order test mock (`preferredVendorId` lives on `ReorderRule`, not `Product`) and one web typecheck error in contacts detail page. Full CRM/Sales backend suite verified 415/415 passing; `apps/web` and `apps/api` typecheck both clean. |
| 2026-07-04 | 422,642 | +845 | CRM B2B Account Management Deepening: credit holds, risk rating calculation, compliance checklists, SLA scorecards, contact buying roles & activity velocity, contract billing milestones, and automated invoice triggers |
| 2026-07-04 | 421,797 | +855 | CRM & Sales Contract Lifecycle Upgrade: contract revisions cloning, sales order conversion, CSV product bulk imports, predefined currency select, product approval holds, and contact profile details editing/deleting |
| 2026-07-04 | 420,942 | +1,052 | CRM & Sales advanced status overhaul: visual approvals timeline, contract products line items calculation, invite e-signatures, contacts engagement score index, lead conversion wizard, products lifecycle status controls |
| 2026-07-04 | 419,890 | +883 | CRM real inbound email/calendar integration: `MailboxConnection` model + migration, Google/Microsoft OAuth connect/callback service+controller, Gmail API/Microsoft Graph polling sync writing matched Activity records, email-integration settings page |
| 2026-07-04 | 419,007 | +1,892 | Advanced Vendor Management CRUD backend, 360° summary aggregations, list page checklists/filters/export, and visual vendor detail page |
| 2026-07-04 | 417,115 | +210 | CRM "Create Customer" payload cleanup, Zod email validation resolution, and complete backend unit tests fixes (242 tests passing) |
| 2026-07-04 | 416,905 | +1,280 | CRM Frontend pagination/sort list updates, stub buttons integration, and 5 interactive CRM Intelligence dashboards |
| 2026-07-04 | 415,625 | +880 | CRM Customers advanced features (pagination, filters, search, sorting, customer 360 summary stats endpoint, list page refactor, details dashboard page, unit tests) |
| 2026-07-04 | 414,745 | +21 | Frontend compilation and typecheck fixes for Advanced Finance pages (added fmtBalance helper to budgeting/journal entries, fixed Badge component style prop in chart-of-accounts) |
| 2026-07-04 | 414,724 | +2,437 | Advanced Finance module refactoring and hardening (decoupled god-class into 10 services, corrected revaluation & P&L algorithms, fixed mock leaks and spec bugs) |
| 2026-07-04 | 412,287 | +555 | Stripe E-Commerce Payment Gateway Integration (Stripe service, webhook signature validation, admin channel filter) |
| 2026-07-04 | 411,732 | +2,790 | Fixed Asset Management vertical slice (Prisma models, GL mappings, transfers, maintenance, automated SLM/WDV depreciation postings, UI pages) |
| 2026-07-04 | 408,942 | +642 | Type hardening, baseline compilation fixes, and dev container volumes resolution |
| 2026-07-04 | 408,300 | baseline | Pre-tracking-convention baseline measurement |

---

## Collab Board — Multi-Agent Sync

> **Purpose:** UniERP is built by more than one agent tool in the same working copy —
> Claude Code (this CLI) and Antigravity (Google's agentic IDE), plus whichever
> other tool a session names. There is no shared runtime between them — no shared
> memory, no message bus — so **this section + git is the only synchronization
> mechanism.** Read it before you start; update it before you stop.
>
> Full protocol lives in [AGENTS.md § Multi-Agent Collaboration Protocol](../AGENTS.md).
> This section is the *live state*; AGENTS.md is the *rulebook*.
 
### 1. Active Claims

> One row per agent session currently touching the repo. Add your row when you
> start; remove it (move to §3) when you commit+push and stop. If you see a
> claim whose `Files/Scope` overlaps what you're about to touch, **do not start**
> — either pick something else off §2 or coordinate with the user first.

| Agent | Session started | Scope (module/files) | Branch | Status |
|:---|:---|:---|:---|:---|
| antigravity-ide | 2026-07-08 21:48 | Finance: Period-End FX Revaluation Engine (relational runs and details models, unrealized gains/losses math, auto-generating GL entries, Next.js page) | main | In Progress |
| claude-code | 2026-07-04 14:52 | Implementing full CRM enhancement plan: Section 1 (pagination/search/sort) complete for all 8 entity endpoints (vendors, contacts, leads, opportunities, products, price-books, customers, cases); continuing with button stubs and intelligence layer | main | In Progress |
| claude-code | 2026-07-04 (session) | CRM Leads/Deals deepening: lead scoring decay, source ROI, territory assignment, nurture sequences, disqualify/reactivate, conversion audit, SLA timer; Deal health scoring, competitor tracking, win/loss taxonomy, deal team/split-credit, contract renewal linkage, quote linkage, discount approval workflow (`crm-leads.service.ts`, `crm-deals.service.ts`, new `crm-approvals.service.ts` + related controllers/migrations) — explicitly avoiding leads/opportunities list-table page.tsx JSX (another agent migrating those to shared DataTable) | main | In Progress |

### 2. Up Next (unclaimed work, pick from the top)

> Pulled from this file's § Production Readiness & Hardening, § Studio Backlog, and
> "not yet built" notes in the module tables. Whoever picks an item: move it
> to §1 with your claim, and when done move it to §3 with a one-line result +
> link to the commit.
>
> **Focus filter (binding, per `.ai/MODULE_FOCUS.md`)**: feature items are only
> pickable if they belong to the **Current Focus Module** (now: **Finance &
> Accounting** — drive it to 500+ distinct working features). Non-focus feature items
> (e.g. `[benchmark]` CRM items below) stay queued for their module's turn. P0/P1/P2
> items (broken build, runtime failures, conflicts, cross-cutting hardening) are exempt.

1. **God-class decomposition (Enterprise Hardening Phase 1, in progress)** — `builder.service.ts` (2,905 LOC), `inventory.service.ts` (1,792 LOC), `advanced-finance`/`procurement`/`manufacturing` services (>1,200 LOC each). Strangler-fig pattern per the completed CRM decomposition — see § Production Readiness & Hardening below.
2. **`dependency-cruiser`/ESLint module-boundary lint** — enforce "no cross-module deep imports, no business logic in controllers" in CI (Enterprise Hardening Phase 1 exit criteria).
3. **CI test-suite scope decision** — `test:coverage` still excludes `*.coverage.spec.ts`; decide whether to run the full suite in CI now that it's stable (Enterprise Hardening Phase 0 follow-up).
4. **Studio Phase 2 — Business Logic visual rule/flow editor** (Form/Page/Workflow canvas editors are already built and confirmed — `FormBuilderWorkspace.tsx` uses `@dnd-kit`, `WorkflowEditorWorkspace.tsx` uses `reactflow`, `PageBuilderWorkspace.tsx` is a grid canvas; only the Business Logic editor, to replace form-driven automation rules, remains open) — see § Studio Backlog below.
5. **Commit the pending Admin error-reporting work** — `error-reports.controller.ts`/`.service.ts`, Next.js `error.tsx`/`not-found.tsx`/`global-error.tsx`, `ErrorFallback.tsx` are implemented (per row 1) but sit **uncommitted** in the working tree as of 2026-07-04. Whoever picks this up: verify tests pass, then commit.

Add new items here as they're identified (PM scoping, bug reports, user asks, and the mandatory per-cycle market-discovery pass in `.ai/AUTOPILOT.md` Step 9a → `.ai/MARKET_BENCHMARK.md`). Don't let this list go stale — prune completed/obsolete entries.

6. **[benchmark] Finance: automated bank feeds (Plaid/Yodlee-style)** — real-time bank transaction sync instead of manual statement import; leaders: NetSuite, Intacct, Odoo, Dynamics. Value H, Size M. Sub-tasks: Bank Connection model (bank name, account #, OAuth token), `/bank-feeds/connect`, `/bank-feeds/sync` (pull transactions → create unmatched BankTransaction rows), `/bank-feeds/list` + UI page with connection status + last-sync. RICE: Reach 80 · Impact 9 · Confidence 80% · Effort 3 = **192**.
7. **[benchmark] Finance: cash-flow forecasting (rolling 13-week, AI-assisted)** — project inflows (AR) + outflows (AP + payroll) on a week-by-week basis; leaders: Dynamics 365, NetSuite. Value H, Size M. Sub-tasks: `ForecastWeek` schema row (week_start, projected_inflow, projected_outflow, net), service that aggregates due invoices + payment schedules + estimated payroll runs, `/cash-flow/forecast` GET + weekly-override PATCH, chart UI page. RICE: Reach 70 · Impact 9 · Confidence 75% · Effort 3 = **158**.
8. **[benchmark] Finance: intercompany AP/AR netting & elimination** — for multi-entity: auto-match IC receivable to IC payable and generate elimination entries; leaders: Intacct, NetSuite, SAP. Value H, Size M. Sub-tasks: `IntercompanyTransaction` model, `/intercompany/match` (suggest matches), `/intercompany/net` (generate journal pair), consolidation page shows IC eliminations. RICE: Reach 40 · Impact 10 · Confidence 85% · Effort 3 = **113**.
9. **[benchmark] CRM: customer self-service portal** — customer login to view quotes/orders/invoices/tickets; leaders: Odoo, Zoho, Dynamics (see `.ai/MARKET_BENCHMARK.md` § CRM). Value H, Size L — defer to CRM focus turn.

### 3. Recently Completed (rolling log, last ~15 — older entries live in `.ai/CHANGELOG.md`)

| Date | Agent | What | Commit/ref |
|:---|:---|:---|:---|
| 2026-07-08 | antigravity-ide | Finance Intercompany AP/AR Netting & Elimination Batch (10+ features, DB+API+UI): Prisma model, auto match rules, manual linkings, netting clearing GL journal postings, stats counters, 2 Next.js pages, unit tests. | see CHANGELOG 2026-07-08 |
| 2026-07-08 | antigravity-ide | Finance Cash Flow Forecasting Batch (10+ features, DB+API+UI): rolling 13-week projections, overrides, custom scenarios CRUD, scenario multipliers, dashboard, csv exporter, unit tests. | see CHANGELOG 2026-07-08 |
| 2026-07-08 | antigravity-ide | Finance Automated Bank Feeds Batch (15+ features, DB+API+UI): direct bank sync connections, automated transaction matching, manual overrides, ignore filters, schema updates, 2 new pages (bank-feeds, bank-recon), unit tests, and segment formatting. | see CHANGELOG 2026-07-08 |
| 2026-07-08 | antigravity-ide | Finance Advanced Reporting & Settings Batch (25+ features, DB+API+UI): Payment Terms CRUD, Invoice Analytics dashboard, AP Aging Report, Cash Flow Forecast, Bad Debt Write-Off, budget monthly spread, GL account drilldown, customer/vendor payment analysis, tax filing summary, controller endpoints, unit tests, Next.js templates/trends/tax pages. | see CHANGELOG 2026-07-08 |
| 2026-07-08 | antigravity-ide | Finance AR Batch (19 features, DB+API+UI): dunning levels CRUD + stats + pause/resume, AR aging report (5 buckets + visual bar), customer statement (ledger+CSV), credit risk management (limit/hold/rating edits), cash application (payment→invoice), 15 new controller endpoints, 5 new permissions; overhauled ar-automation page, 3 new Next.js pages, Advanced Finance nav updated; both API+Web tsc clean. | see CHANGELOG 2026-07-08 |
| 2026-07-08 | antigravity-ide | God-class decomposition of BuilderService: extracted Forms, Workflows, Stats, Dashboards, DevOps, and WebContent logic into dedicated sub-services, redirected builder.controller.ts, cleaned up builder.service.ts, updated module, and verified 109 unit tests pass. | see CHANGELOG 2026-07-08 |
| 2026-07-08 | antigravity-ide | God-class decomposition of inventory service: extracted Warehouse sub-domain operations (`getWarehouses`, `getWarehouseById`, `createWarehouse`, `updateWarehouse`, `deleteWarehouse`) into dedicated `InventoryWarehousesService`, resolved unused tsc errors, and added vitest coverage spec (4/4 tests passed). | see CHANGELOG 2026-07-08 |
| 2026-07-08 | claude-code | System-Wide Functionality Ledger: `scripts/feature-ledger.mjs` → generated `.ai/FEATURE_LEDGER.md` (1,521 features / 35 modules, one row per endpoint with summary+permission); mandated in AUTOPILOT Step 7 on every shipped change and as the Step-3 duplicate-check source; MODULE_FOCUS counts now come from it. | see CHANGELOG 2026-07-08 |
| 2026-07-08 | claude-code | Batch Throughput + Verify-Once: AUTOPILOT now mandates 10–20+ features per cycle (one sub-domain batch, DB+API+UI required), batch-efficient build order (one migration, bulk API, bulk UI, one test pass), ≥70% time on code, and full gates (typecheck/suite/smoke) run exactly once per cycle. | see CHANGELOG 2026-07-08 |
| 2026-07-08 | claude-code | Module-Focus Discipline: added `.ai/MODULE_FOCUS.md` (Current Focus = Finance, baseline 121 → target 500+ features; focus order with Studio locked last; exit criteria; feature ledger; pre-planned cross-module integration contracts) and wired the binding focus filter into AUTOPILOT P3–P7 selection, discovery, and this board's Up Next. | see CHANGELOG 2026-07-08 |
| 2026-07-08 | claude-code | Autonomy Engine 10/10: binding E2E smoke gate (`apps/web/e2e/smoke.spec.ts`, 13/13 green vs live stack), reality-feedback loop (`scripts/feedback-scan.mjs` → generated `.ai/FEEDBACK.md`, error_logs/alerts/TODO feeding P1), unattended runners (`scripts/autopilot-loop.ps1`, `.github/workflows/autopilot.yml`), competitor-parity depth rule + RICE scoring in AUTOPILOT. | see CHANGELOG 2026-07-08 |
| 2026-07-08 | claude-code | Market Discovery Engine: added `.ai/MARKET_BENCHMARK.md` (top-20 competitor set, Discovery Protocol, ~40-gap seeded backlog, rotation tracker); AUTOPILOT Step 9 → mandatory per-cycle REFILL & DISCOVER; priority ladder gained P5 Competitive gaps; seeded first two `[benchmark]` Up Next items. | see CHANGELOG 2026-07-08 |
| 2026-07-08 | antigravity-ide | AI Module Hardening: refactored `workflow-engine.service.ts` and `builder/web-studio.service.ts` to route through `AiService`, eliminating paid Anthropic API dependency | see CHANGELOG 2026-07-08 |
| 2026-07-08 | claude-code | Autonomous Development Protocol: added `.ai/AUTOPILOT.md` ("Start" → self-selected end-to-end dev cycle with priority ladder, reality gates, guardrails, queue-refill rule), wired via AGENTS.md § Autonomous Mode, root `CLAUDE.md`, `.claude/skills/start/`, and MASTER_PROMPT pointer. | see CHANGELOG 2026-07-08 |
| 2026-07-05 | antigravity-ide | CRM & Sales Expansion (Batch 1: Forecasting & Account Management): added new relational database models, CRUD service operations, secured controller endpoints with @Permissions, registered moduleNav.tsx / registry.tsx paths, built interactive forecasting and account plan views, and fixed crm-expansion.spec.ts unit tests and apiPost / apiPut wrapper helpers. | (local verification) |
| 2026-07-05 | antigravity-ide | CRM & Sales 500+ Feature Hardening: completed and verified compilation of all 10 new backend service layers & controllers for Forecasting, CPQ, order fulfillment, support queues, and RevOps commissions. Resolved 20+ typecheck errors and added 10 unit tests in `crm-expansion.spec.ts` (all green). | (local verification) |expansion.spec.ts` (all green). | (local verification) |
| 2026-07-04 | claude-code | CRM & Sales DataTable sortable-header migration: `crm/contacts`, `crm/leads`, `crm/vendors`, `crm/contracts`, `crm/products`, `crm/sales-orders`, `crm/opportunities`, `crm/cases`, `crm/price-books`, `crm/quotations` all migrated to the shared `DataTable` component (sortable headers, Actions column with View/Edit/Delete + confirm, consistent empty/loading states) per the `customers` page reference pattern. Real server-side pagination/sort for 8 pages (backend already supported it); client-side sort/pagination for `sales-orders`/`quotations` (confirmed backend gap — `GET /sales/orders` and `GET /sales/quotations` don't accept page/limit/sortBy/sortOrder/search yet). Delete wired for contacts/leads/vendors/contracts/products/opportunities/price-books; omitted for cases (no delete route — cases resolve/close, not delete) and sales-orders/quotations (no delete route on `SalesController`). `apps/web` full typecheck 0 errors, ESLint clean on all 10 files. See `.ai/CHANGELOG.md` for full detail. | (uncommitted) |
| 2026-07-04 | claude-code | CRM & Sales typecheck/test stabilization pass over in-flight concurrent-agent work: `apps/api` typecheck clean throughout; `apps/web` typecheck found+fixed 1 real error (`crm/contacts/[id]/page.tsx:496`, TS18049 null-narrowing in a closure — detail page, not one of the in-flight list pages, safe to touch); `prisma validate` clean, no migration needed (existing migrations already cover the uncommitted schema.prisma diff); fixed 1 genuine test/schema-drift bug in `sales.service.spec.ts` (`convertToPurchaseOrders` — test mocked `product.preferredVendorId` but the field actually lives on `ReorderRule`, not `Product`) — Sales suite went 49/50 → 50/50, CRM suite steady at 367/367 throughout. Final state: `@unerp/api` typecheck, `@unerp/web` typecheck, and CRM+Sales vitest suites all green. | (uncommitted) |
| 2026-07-04 | antigravity-ide | CRM & Sales B2B Account Management Deepening: risk engine, credit holds, compliance checklists, SLA scorecards, contact buying roles & activity velocity, contract billing milestones, and automated invoice triggers | (local verification) |
| 2026-07-04 | antigravity-ide | CRM & Sales B2B Contract lifecycle deepen (revisions, conversions, bulk CSV loader, currencies, product approvals, contacts profile details editing/deleting) | (local verification) |
| 2026-07-04 | antigravity-ide | Complete upgrade of CRM & Sales module to Advanced status (262 features, 1,999 unit tests passing): implemented visual approvals progress timeline, contract products line-items table, value dynamic calculator, invite/sign e-signature flows, secondary contacts info/engagement index, lead conversion transaction wizard, and products lifecycle status CRUD/stats. | (uncommitted) |
| 2026-07-04 | claude-code | Real CRM inbound email/calendar integration (confirmed gap — `EmailSequence`/`CrmIntegrationsService` were outbound-only stubs with `fetchGmailMessages`/`fetchOutlookMessages`/etc. all hardcoded to return `[]`, no OAuth, no token storage): new `MailboxConnection` Prisma model (`crm_mailbox_connections`, tokens encrypted at rest via existing `encryptField`/`decryptField` from `@unerp/database`) + migration `20260704200000_crm_mailbox_connections`; `crm-mailbox.service.ts`/`.controller.ts` at `/crm/mailbox-connections` — real Google OAuth (`accounts.google.com`/`oauth2.googleapis.com`) and Microsoft OAuth (`login.microsoftonline.com`) authorization-code flow (`connect` builds consent URL, `callback` exchanges code for tokens), manual `POST /:id/sync` pulling Gmail API / Microsoft Graph messages + calendar events, matching sender/recipient/attendee addresses against Contact/Lead/Customer and writing deduped `Activity` rows (EMAIL/MEETING) onto their existing timelines. New settings page `/crm/settings/email-integration` (connect/disconnect, sync-now, status/last-sync display) + nav/breadcrumb registration. Simplified/deferred (documented in code): polling sync only (no Gmail watch()/Graph webhook push subscriptions, no background scheduler — `syncNow` is designed to be safely called on an interval later); lazy token refresh only on next sync call. 10 new focused unit tests, full CRM suite 355/355 passing, `@unerp/api` and `@unerp/web` typecheck clean for all touched/new files (pre-existing unrelated type errors in `crm-customers.service.ts`/`crm.controller.ts`/`crm.service.ts` from a prior concurrent session confirmed out of scope). | (uncommitted) |
| 2026-07-04 | claude-code | New CRM Contract/Renewal feature (confirmed gap — no Contract entity existed): `Contract` Prisma model + migration `20260704180000_crm_add_contract` (customer/vendor optional-one-of, self-relation for renewal lineage), `crm-contracts.service.ts`/`crm-contracts.controller.ts` (CRUD, status-transition guard, `POST /:id/renew` creating a follow-on contract row by default), 4 new `crm.contracts.*` permissions, list+detail frontend pages, nav+breadcrumb registration. 15 new tests, full CRM suite 345/345 passing. | (uncommitted) |
| 2026-07-04 | claude-code | CRM Forecasting page hardening: fixed field-shape mismatches between `/crm/analytics/forecast` (added `pipelineDeals`), `/crm/analytics/rep-performance` (added `id`/`name`/`revenue` resolved from `User`), and `/crm/analytics/conversion-funnel` (changed to the `{label,value,percentage}[]` array shape the UI actually consumes — previously would have thrown on render); made `SalesTarget.achieved` a live computed quota-attainment value from closed-won `Opportunity` amounts within the target's period/rep instead of a static stored number; added new `GET /crm/analytics/forecast-by-rep` (pipeline-weighted forecast = open Opportunity amount × probability, grouped by rep) + UI panel; migrated forecasting page off raw `fetch` onto the `_components/api.ts` `apiGet` convention used elsewhere in CRM. No schema changes. | (uncommitted) |
| 2026-07-04 | claude-code | Lead/Opportunity/Case 360-summary endpoints (`getLeadSummary`, `getOpportunitySummary`, `getCaseSummary` merging SLA rollup) + status-transition guards on `updateLeadStatus`/`updateCase` (blocks illegal transitions, adds explicit `reopenCase()` for CLOSED cases) — 314/314 CRM tests passing | (uncommitted) |
| 2026-07-04 | antigravity-ide | Advanced Vendor Management CRUD backend, 360° summary aggregations, list page checklists/filters/export, and visual vendor detail page | (local verification) |
| 2026-07-04 | antigravity-ide | Resolved "Create Customer" button not working (payload cleanup and Zod validation bugfix), and fixed all CRM module backend unit tests (242 tests passing) | (local verification) |
| 2026-07-04 | antigravity-ide | Built CRM list refactoring, button integrations, and 5 CRM Intelligence dashboard pages (Attribution/Journey, Sentiment/Health, CLV, Partners, Campaigns), and resolved typecheck builds | (local verification) |
| 2026-07-04 | antigravity-ide | CRM Customers advanced features (pagination, filters, search, sorting, customer 360 summary stats endpoint, list page refactor, details dashboard page, unit tests) | (local verification) |
| 2026-07-04 | antigravity-ide | Fixed Next.js compilation errors in budgeting, journal-entries, and chart-of-accounts pages (missing fmtBalance, style prop on Badge) | (local verification) |
| 2026-07-04 | antigravity-ide | Decomposed Advanced Finance god-class (1,716 LOC) into 10 services, resolved all 194 service and controller test failures, isolated mocks using manual beforeEach reset loop | (local verification) |
| 2026-07-04 | antigravity-ide | Stripe E-Commerce Payment Gateway Integration (Stripe service, webhook signature validation, admin channel filter) | (local verification) |
| 2026-07-04 | antigravity-ide | Fixed Asset Management vertical slice (Prisma DB, NestJS API, Vitest tests, Next.js UI) | (local verification) |
| 2026-07-04 | claude-code | CRM advanced features: lead scoring, duplicate detection/merge, configurable pipeline stages, customer segmentation, SLA policies (schema + RLS + 5 services/controllers + settings UI) | (uncommitted) |
| 2026-07-04 | claude-code | CRM backend contract-drift fix: renamed permissions (`crm.pipelines.*`, `crm.segments.*`, `crm.duplicates.merge`) to match frontend `ProtectedComponent` strings, registered them, removed a colliding legacy `/crm/contacts/merge` route, wrapped lead-scoring/duplicates/pipelines responses in `{ data }`, added `@TrackChanges` to pipeline create | (uncommitted) |
| 2026-07-04 | antigravity-ide | Resolved baseline compilation, strict type errors, and dev container volumes | (local verification) |
| 2026-07-03 | backend-developer + frontend-developer | E-commerce storefront module (backend + admin/public frontend) | `33ba17b` |
| 2026-07-03 | — | Ollama swap for AI module (removed paid Anthropic calls from `AiService`) | `24222e7` |
| 2026-07-01 | — | CRM god-class decomposition (2,330 LOC → 322 LOC facade + 10 domain services) | `9a1f347` |
| 2026-07-01 | — | Central tenant-isolation enforcement (global `TenantInterceptor`, Prisma extension) | see § Production Readiness & Hardening (Phase 2) |
| 2026-07-01 | — | Reality Gates in `scripts/scorecard.mjs`; fixed unbounded slug-uniqueness DoS loops; full suite 121/121 files green in parallel | see § Production Readiness & Hardening (Phase 0) |

### 4. Conflict Log (only if two agents collided)

> If you discover another agent's uncommitted/unpushed work conflicts with
> yours, log it here instead of silently overwriting. Note what happened and
> how it was resolved (merge, rebase, one side deferred).

_(none yet)_

---

## Module Status Legend

| Status | Meaning |
|:---|:---|
| 🟢 `ACTIVE` | Fully implemented, tested, and deployed |
| 🟡 `IN_PROGRESS` | Currently being developed |
| 🔵 `PLANNED` | Designed but not yet started |
| ⚪ `BACKLOG` | Identified but not yet designed |
| 🔴 `DEPRECATED` | Scheduled for removal |

---

## Core Modules (Phase 0–2)

| # | Module | Package Path | Status | Phase | Dependencies | Key Entities |
|:--|:---|:---|:---|:---|:---|:---|
| 1 | **Admin** | `apps/api/src/modules/admin` | 🟢 ACTIVE | 0 | auth, database | Tenant, User, Role, Permission, Setting, Workflows, Localization, Sync, DevOps, Super Admin. P0-1 (dead fine-grained RBAC decorator-stacking bug) fixed. P0-2 (automation rules) now has a real trigger→condition→action runtime: `AutomationRuleEngineService` listens for real domain events (`sales.order.confirmed`, `sales.delivery.created`, `sales.return.*`, `procurement.receipt.created`, `procurement.return.created`, `finance.invoice.*`, `finance.payment.received`, `hr.employee.onboarded`), loads ACTIVE rules per tenant, evaluates conditions (shared logic extracted from `testRule`), and executes `notify`/`email` actions for real (`notification.send` event + real BullMQ `email` queue job), recording `SUCCESS`/`SKIPPED`/`FAILED` execution rows — DRAFT rules stay inert. P1-1 partially closed: backups remain simulated but are now honestly labeled `source: 'SIMULATED'` in the API response (real `pg_dump` needs devops sign-off, deferred); backup create/read endpoints moved behind a new Super-Admin-only `system.operations.backup` permission (`@SkipTenantScope()`); `BackgroundJob` rows are now correlated with real BullMQ jobs via `bullJobId` (see `job-tracking.util.ts`), `EmailProcessor`/`ExportProcessor` sync job status on real worker lifecycle events, and `OperationsService.retryJobs` re-enqueues into the real BullMQ queue by `queueName` instead of only flipping a DB flag; see `.ai/ADMIN_MODULE_COMPLETION_REQUIREMENTS.md`. UAT PASSED 2026-07-02 (see `.ai/ADMIN_UAT_SIGNOFF.md`): RBAC regression sweep, seed wildcard non-breaking, automation engine edge-case fix, and honest backups labeling all independently verified. Also implemented public error reporting API (`/public/error-reports`) creating `ErrorLog` and `AdminAlert` rows, and integrated Next.js fallback pages (`error.tsx`, `not-found.tsx`, `global-error.tsx`, and dashboard `error.tsx`) utilizing a unified contact support form and debug logs UI. |
| 2 | **Finance & Accounting** | `apps/api/src/modules/finance` | 🟢 ENHANCED | 1 | admin, database | Invoice, Payment (paginated, bulk ops, send/void, events, stats, KPI) |
| 3 | **Human Resources** | `apps/api/src/modules/hr` | 🟢 ENHANCED | 1 | admin, finance | Employee (paginated, detail, update, bulk ops, events, stats, KPI), Department management |
| 4 | **CRM & Sales** | `apps/api/src/modules/crm` | 🟢 ENHANCED | 1 | admin | Contact, Lead, Opportunity, Activity, Pipeline, LineItem, PriceBook, ContactTag, SalesTarget, SavedReport, WorkflowRule, EmailSequence, Territory, Commission, WebForm, Document, CustomField, RecordType, ApprovalProcess, QuotationTemplate, QuotationSignature, Comment, Note, Follower, Playbook, Battlecard, Dashboard, LeadScoringRule, DuplicateRule, PipelineStage, Segment, SegmentMember, SlaPolicy, SlaBreach, Contract, MailboxConnection. **Real inbound email/calendar integration** (new): `MailboxConnection` model (encrypted OAuth tokens), `crm-mailbox.service.ts`/`.controller.ts` at `/crm/mailbox-connections` (Google/Microsoft OAuth connect+callback, manual `POST /:id/sync` pulling Gmail API/Microsoft Graph and writing matched Contact/Lead/Customer `Activity` rows), settings page `/crm/settings/email-integration`. Polling-based (no background daemon) by design — see Recently Completed log for details. **Contract/Renewal management**: `Contract` model (customer/vendor optional-one-of, self-relation renewal lineage via `renewedFromId`/`renewals`), `crm-contracts.service.ts`/`.controller.ts` at `/crm/contracts` (CRUD + `GET /stats` KPI rollup + `PATCH /:id/status` transition guard + `POST /:id/renew` creating a follow-on contract), list (`/crm/contracts`) and detail (`/crm/contracts/[id]`) pages, nav entry + breadcrumb segment registered. Frontend list screens refactored with server-side pagination, search debounce, and sorting. Dialogue button stubs (convert lead/quotation, approve credit, record payment, log activity) fully integrated with backend APIs. 5 new CRM Intelligence Dashboards (Attribution & Journey, Sentiment & Health, CLV Analytics, Partners Console, and Campaigns Analytics) fully built and verified end-to-end. **360/summary views for Lead, Opportunity, and Case** (`getLeadSummary`/`getOpportunitySummary`/`getCaseSummary`, mirroring the Customer/Vendor 360 pattern) — `GET /crm/leads/:id/summary` (activities, converted opportunities, score trend, conversion-likelihood bucket), `GET /crm/opportunities/:id/summary` (line items, activities, days-in-stage, weighted pipeline value, aging bucket), `GET /crm/cases/:id/summary` (merges what were separate `getCaseById`+`getSlaStatus` calls: customer/contact + comments + first-response/resolution SLA rollup). **Status-transition guards** added for Lead (`updateLeadStatus`, blocks `DISQUALIFIED`/`CONVERTED` terminal states and forces `CONVERTED` only via the existing `/leads/:id/convert` flow) and Case (`updateCase`, blocks silent `CLOSED -> *`; new explicit `POST /crm/cases/:id/reopen` action clears `resolvedAt`) — Opportunity already had `validateStageAdvance()`. |
| 5 | **Inventory & Warehouse** | `apps/api/src/modules/inventory` | 🟢 ENHANCED | 1 | admin | Product (paginated, detail, update, bulk ops), Warehouse (full CRUD), Stock Levels, Inventory Stats |
| 6 | **Procurement** | `apps/api/src/modules/procurement` | 🟢 ENHANCED | 2 | admin, finance, inventory, crm | Vendor, PurchaseOrder, PurchaseReceipt, RFQ, GoodsReceipt, PurchaseRequisition, BlanketPurchaseAgreement |
| 7 | **Sales & Orders** | `apps/api/src/modules/sales` | 🟢 ACTIVE | 2 | admin, finance, inventory, crm | Quotation, SalesOrder, DeliveryNote, Return, SalesPipeline |
| 8 | **Supply Chain** | `apps/api/src/modules/supply-chain` | 🟢 ACTIVE | 2 | inventory, procurement, sales | Shipment, Carrier, Route, DemandForecast |
| — | **Auth** (distinct from `packages/auth`, see Shared Packages) | `apps/api/src/modules/auth` | 🟢 ACTIVE | 0 | database | `AuthController`/`AuthService` (769 LOC) — register/login/logout with httpOnly cookie session, JWT profile (`GET/PATCH auth/me`), password reset (`forgot-password`/`reset-password`), demo-role login bypass (`login-demo`), TOTP MFA setup/verify (`mfa/setup`, `mfa/verify`, `mfa/verify-login`), WebAuthn passkey register/login. `SsoController`/`SsoService` (OIDC/SAML tenant SSO config check). This is the actual runtime auth surface (NestJS controllers/services + Prisma `User`/`Tenant`); `packages/auth` is the separate shared package (Auth.js providers/RBAC helpers) consumed elsewhere — the two were previously conflated into a single Shared Packages row, which undocumented this entire backend module. |

---

## Enterprise Modules (Phase 3–11)

| # | Module | Package Path | Status | Phase | Dependencies | Key Entities |
|:--|:---|:---|:---|:---|:---|:---|
| 9 | **Project Management** | `apps/api/src/modules/projects` | 🟢 ACTIVE | 3 | admin, hr, finance | Project, Task, Timesheet, Milestone, Budget, ProjectPortfolio, ProjectRisk, ChangeRequest |
| 10 | **Manufacturing (MRP)** | `apps/api/src/modules/manufacturing` | 🟢 ENHANCED | 3 | inventory, procurement, sales | BOM, WorkOrder, ProductionPlan, Routing, ScrapEntry, WorkOrderOperation, WorkstationShift, SubcontractingMaterial, EquipmentTool, EngineeringChangeOrder, WorkOrderComponentConsumption |
| 11 | **Business Intelligence** | `apps/api/src/modules/analytics` | 🟢 ACTIVE | 4 | all core modules | Dashboard, Report, KPI, Widget, ScheduledReport |
| 12 | **Drive** | `apps/api/src/modules/documents` | 🟢 ACTIVE | 4 | admin | Document, Folder, Version, Template, Signature, FolderShare, DocumentShare, GeneratedDocument, TemplateDesigner, StorageQuotas, MediaConversion (Google Drive UI, AES-256 S3 envelope encryption, legal holds, password protected and expiring share links, PDF templates, quotas, conversion) |
| 13 | **Connect** (Communication) | `apps/api/src/modules/communication` | 🟢 ACTIVE | 4 | admin, documents (Drive), notifications | Message, Channel, Notification, EmailTemplate, Presence, Meeting — Teams & Google Chat feature parity completed. **Features**: real file attachments (25MB cap, Drive storage), WebSocket real-time gateway broadcasts (live chat/presence), channel management (OWNER/ADMIN rename/archive/members drawer), notification-level settings, search popover, consolidated emoji picker, seen-by read receipts (groups <= 8), DND-aware notification suppression, server-side OpenGraph link preview unfurling, workspace directory search modal (filtered by department/designation), and Saved Messages view. |
| 14 | **POS & Retail** | `apps/api/src/modules/pos` | 🟢 ACTIVE | 5 | inventory, sales, finance | POSTerminal, Register, Receipt, Shift, CashEntry |
| 15 | **Advanced Inventory** | `apps/api/src/modules/inventory` (ext) | 🟢 ACTIVE | 5 | inventory | SerialNumber, Batch, BinLocation, CycleCount, Valuation |
| 16 | **Advanced Finance** | `apps/api/src/modules/advanced-finance` | 🟢 ENHANCED | 6 | finance, sales, procurement | ChartOfAccounts, GeneralLedger, BankRecon, Budget, TaxReturn |
| 17 | **Advanced HR** | `apps/api/src/modules/hr` (ext) | 🟢 ACTIVE | 7 | hr, finance | PayrollRun, LeavePolicy, ShiftSchedule, Appraisal, Training |
| 18 | **Workflow Engine** | `apps/api/src/modules/workflow` (registered directly in `app.module.ts`, NOT consolidated into Admin — prior doc was stale) | 🟢 ACTIVE | 8 | admin, database | `WorkflowController` (`/workflows`) — CRUD workflows, approval-chain listing/action submission, SLA-breach check, workflow simulation. `WorkflowEngineController` (`/workflows/engine`) + `WorkflowEngineService` (227 LOC) — real execute/event-trigger runtime (`executeWorkflow`, `processEventTrigger`), tenant-scoped via `TenantInterceptor`. Distinct from the Admin app's own frontend Workflow Builder UI hub (`settings/workflow-builder`) and the `AutomationRuleEngineService` in the Admin module (row 1) — three related-but-separate systems, not one consolidated engine; do not assume this directory is dead. **Known gap** (see AI module row 32 and CHANGELOG 2026-07-02): `workflow-engine.service.ts` calls `https://api.anthropic.com/v1/messages` directly via raw `fetch`, bypassing the self-hosted-Ollama `AiService` — still incurring Anthropic API cost. |
| 19 | **Notifications** | `apps/api/src/modules/notifications` | 🟢 ACTIVE | 9 | communication, workflow | NotificationChannel, Preference, Digest, WebSocketEvent |
| 20 | **File Storage** | `apps/api/src/modules/storage` (registered directly in `app.module.ts`; the prior "consolidated into Drive app" note was stale/inaccurate — this is a separate, smaller, still-active module alongside Drive, not superseded by it) | 🟢 ACTIVE | 10 | documents (drive) | `StorageController`/`StorageService` (83 LOC) — `/storage/files` (list/register file metadata records), `/storage/generated` (generated-document listing), `/storage/generate` (template-based document generation), `/storage/presigned` (presigned URL generation), `/storage/lifecycle` (glacier/purge lifecycle policy). Reuses `documents.document.*` permissions rather than declaring its own — a lightweight metadata/lifecycle layer distinct from Drive's own upload/versioning/encryption stack (row 12). The frontend UI for this was folded into `/drive` per the 2026-06-21 "Admin Consolidation" CHANGELOG entry (old `/storage` page directory deleted), but the **backend module itself was never removed** and is still live — frontend consolidation and backend module retirement are two different things that got conflated in the prior doc. |
| 21 | **Advanced Reporting** | `apps/api/src/modules/reporting` | 🟢 ACTIVE | 11 | analytics, finance | DashboardLayout, Widget, SavedView, ScheduledReport |
| 35 | **Fixed Asset Management** | `apps/api/src/modules/fixed-assets` | 🟢 ACTIVE | 6 (ext) | finance, inventory, hr | FixedAssetCategory, FixedAsset, AssetDepreciation, AssetTransferLog, AssetMaintenanceLog. Category setups, GL account mappings, automatic Straight Line (SLM) & Written Down Value (WDV) depreciation runs with auto-posting of double-entry ledger journals, location custody transfers, and maintenance logs. |

---

## Industry Extension Modules (Phase 12–15)

| # | Module | Package Path | Status | Phase | Dependencies | Target Industries |
|:--|:---|:---|:---|:---|:---|:---|
| 22 | **Healthcare** | `apps/api/src/modules/healthcare` | 🟢 ACTIVE | 12 | hr, inventory, finance | Hospitals, Clinics, Pharma |
| 23 | **Education** | `apps/api/src/modules/education` | 🟢 ACTIVE | 13 | hr, finance, communication | Schools, Universities |
| 24 | **Real Estate** | `apps/api/src/modules/real-estate` | 🟢 ACTIVE | 14 | finance, crm, projects | Property, Construction |
| 25 | **Field Service** | `apps/api/src/modules/field-service` | 🟢 ACTIVE | 15 | hr, inventory, projects | Maintenance, Utilities |

---

## Platform Modules (Phase 16–20)

| # | Module | Package Path | Status | Phase | Dependencies | Key Features |
|:--|:---|:---|:---|:---|:---|:---|
| 26 | **API Platform** | `apps/api/src/modules/api-platform` | 🟢 ACTIVE | 16 | all core modules | OpenAPI, Webhooks, API Keys, OAuth |
| 27 | **i18n & Localization** | `packages/i18n` (frontend translation/RTL/date-format layer) **+** `apps/api/src/modules/localization` (backend admin API, previously undocumented) | 🟢 ACTIVE | 17 | all UI modules, database | `packages/i18n`: Translations, RTL, Date/Currency formats. `LocalizationController`/`LocalizationService` (backend, `admin/localization/*`, 57+61 LOC): `GET languages` (supported language list), `GET/POST/DELETE admin/localization/overrides` — tenant-scoped UI-text translation override CRUD (the backing store for AGENTS.md Phase 17.4's "UI-based translation editor in admin modules"). |
| 28 | **Mobile & PWA** | `apps/web` (enhancement, manifest/service-worker/offline UI) **+** `apps/api/src/modules/pwa` (backend offline-sync API, previously undocumented) | 🟢 ACTIVE | 18 | all UI, i18n, database | `apps/web`: Responsive, PWA manifest/icons, service worker, offline mode. `PwaController`/`PwaService` (backend, `admin/pwa-sync/*`, 54+55 LOC) — NOT push-subscription/service-worker-config as originally guessed; it's the server side of Phase 18.4's "Offline data synchronization queue": `GET admin/pwa-sync/queue` (per-tenant sync queue), `POST admin/pwa-sync/push` (client pushes queued offline operations — `{operation, entityType, payload}[]` — keyed by `clientId`), `PUT admin/pwa-sync/reconcile/:id` (mark a queued op `RECONCILED` or `CONFLICT`). |
| 29 | **DevOps & Monitoring** | `infra/` | 🟢 ACTIVE | 19 | all modules | CI/CD, Docker, K8s, Logging, APM |
| 30 | **SaaS Platform** | `apps/api/src/modules/saas` | 🟢 ACTIVE | 20 | all modules | Billing, Metering, Marketplace |

---

## Cross-Cutting Modules

| # | Module | Package Path | Status | Phase | Dependencies | Key Features |
|:--|:---|:---|:---|:---|:---|:---|
| 31 | **Studio** | `apps/api/src/modules/builder` | 🟢 ENHANCED | 0–10 | admin, database | Zero-code form/page/dashboard/workflow builder, Page Registry, Schema Registry, Custom Records, dynamic rendering, deploy-to-app wizard, field-level RBAC, server-side webhooks & scripts, app overview dashboard, publish scopes, sandbox simulator test platform, **app releases (immutable snapshots) + semantic versioning + rollback, App Marketplace with provision-on-install (built apps published to App Store), `AppRelease` model, Web Studio CMS Collections (dynamic content types: products/projects/team/testimonials/blog), public content + form-submission API, `WebCollection`/`WebCollectionItem`/`WebFormSubmission` models**. Note: this row's "App Marketplace" (`builder.service.ts`'s `getMarketplace`/`installBuilderApp`/`uninstallBuilderApp`) is a **different system** from row 34's standalone `apps/api/src/modules/marketplace` module — this one is specifically for Studio-built custom apps (GLOBAL/ORG scope, provision-on-install of Studio pages); row 34 is the general third-party app-store/vendor/bundle system. Don't conflate the two when working on either. |
| 33 | **E-Commerce Storefront** | `apps/api/src/modules/ecommerce` | 🟢 ACTIVE (full stack) | new | inventory, sales, finance, crm | StorefrontConfig, StorefrontCategory, ProductListing, Cart, CartItem, StorefrontOrderPayment. Public-facing catalog/cart/checkout on top of existing Product/SalesOrder/Invoice — see `.ai/ECOMMERCE_MODULE_REQUIREMENTS.md` for full MVP spec. **Backend API complete** (backend-developer, 2026-07-03): data layer from the prior session unchanged. Two controllers: `EcommerceAdminController` (`/ecommerce/*`, JWT+RBAC-gated, new `ecommerce.storefront.{read,manage}` / `ecommerce.category.*` / `ecommerce.listing.*` / `ecommerce.order.read` permissions registered in `packages/shared/src/permissions/registry.ts`) covers StorefrontConfig upsert, StorefrontCategory CRUD, and ProductListing CRUD (validates `productId` belongs to the tenant's own `Product` before linking; joins Product+Category for the admin list view) — all mutation endpoints carry `@TrackChanges`+`ChangeHistoryInterceptor`. `EcommercePublicController` (`store/:tenantSlug/*`) is **intentionally unauthenticated** — no `@Permissions()`, guarded only by the new `PublicTenantResolverGuard` (`apps/api/src/modules/ecommerce/guards/public-tenant-resolver.guard.ts`), which resolves `:tenantSlug` → `StorefrontConfig.storeSlug` (404 if missing/disabled) and stamps a synthetic `request.user = { tenantId, userId: 'storefront-guest' }` so the existing global `TenantInterceptor`/`AsyncLocalStorage` tenant-scoping mechanism (`packages/database/src/tenant-context.ts`) activates exactly as it does for JWT-authenticated requests — no parallel scoping mechanism was built. Covers config/categories/products (published-listings-only, paginated, category filter)/cart CRUD (server-persisted `Cart`/`CartItem`, price-snapshotted at add-time, quantity merge on repeat add)/checkout. Checkout (`EcommerceCheckoutService`) validates the cart, finds-or-creates a guest `Customer` by tenant+email, calls the new `PaymentGatewayAdapter` interface (`apps/api/src/modules/ecommerce/payments/payment-gateway.interface.ts`) — implemented by `MockPaymentGatewayService` (unmistakably labeled MOCK in class name/logs/`provider: 'mock_gateway'` field, supports a `simulateDecline` test lever) — then calls the **new** `SalesService.createConfirmedOnlineOrder()` (added to `apps/api/src/modules/sales/sales.service.ts`, reusing the extracted `persistSalesOrderTransaction` helper shared with `createSalesOrder`) to create a real `SalesOrder`+`SalesOrderItem`s (`salesChannel = 'ONLINE'`, `status = 'CONFIRMED'`, `paymentStatus = 'PAID'`) and synchronously emit `sales.order.confirmed` — a gap in the existing order-creation path where auto-confirmed orders never fired that event was fixed for this entry point only, not touching `createSalesOrder`'s behavior. On success, records a `StorefrontOrderPayment` (status `SUCCEEDED`) and marks the `Cart` `CONVERTED`; on decline, no `SalesOrder`/`StorefrontOrderPayment` row is created (the FK from `StorefrontOrderPayment.salesOrderId` to `SalesOrder` is required/non-null, so a failed pre-order attempt can't be persisted as an orphaned payment row — logged instead, a documented deviation from a literal "record a FAILED payment row" reading) and the cart stays `ACTIVE` for retry. Coverage specs (`apps/api/src/modules/ecommerce/tests/*.coverage.spec.ts`, 30 tests) cover admin CRUD + tenant-isolation, public catalog/cart, checkout happy/decline/empty-cart paths, the guard's 404 behavior, and a metadata-level proof the public controller carries neither `JwtAuthGuard`/`RbacGuard` nor `@Permissions()`. `pnpm --filter @unerp/api typecheck` and the full ecommerce+sales test suites pass. **Frontend complete** (frontend-developer, 2026-07-03): admin pages `apps/web/app/(dashboard)/ecommerce/{page.tsx,categories/page.tsx,listings/page.tsx}` (config with an empty-state "Get started" flow, DataTable+Modal Categories CRUD, Listings screen with a debounced searchable Inventory-product picker/category assign/publish toggle/price override, every action gated by `<ProtectedComponent permission="ecommerce.*.*">`); public storefront `apps/web/app/(storefront)/store/[tenantSlug]/{page.tsx,products/[listingId]/page.tsx,cart/page.tsx,checkout/page.tsx}` plus `apps/web/app/(storefront)/layout.tsx` (plain wrapper, no nested html/body, no dashboard chrome) and `apps/web/app/(storefront)/lib/{storefront-api.ts,cart-session.ts}` (unauthenticated fetch helper + localStorage `sessionToken` persistence per `storefront_cart_{tenantSlug}`, transparent re-create on a 404'd/expired cart). Fixed a pre-existing bug where the admin config/categories pages destructured `useToast()` as `{ showToast }` and passed `variant: 'danger'` — neither exists on the real `useToast()` API (`{ toast, success, error, warning, info, dismiss }`, variants `'success'|'error'|'warning'|'info'`); switched both to `toast.success(...)`/`toast.error(...)`. **Also fixed a real backend bug found during verification**, in a shared cross-cutting file outside the ecommerce/sales/database boundary: `apps/api/src/common/middleware/csrf.middleware.ts`'s global CSRF check 403'd every `/store/:tenantSlug/*` write (cart create/add-item/checkout) because its skip-list only exempted `/auth/login`, `/auth/register`, and `/public/` paths, never the storefront's documented unauthenticated routes; added a matching bypass for `/store/` paths. Verified end-to-end in the browser: enabled the storefront (slug `system`), browsed two published listings on `/store/system` with correct currency formatting and category filtering, added to cart, edited quantity, checked out with a valid shipping address (`201`, real `orderNumber` e.g. `ONL-1783089914253-869`, cart token cleared from localStorage), and confirmed the decline path (`simulateDecline: true` via direct API call) returns `400` with the spec's exact message, creates no `SalesOrder`, and leaves the cart `ACTIVE` for retry. `pnpm --filter web typecheck` and `pnpm --filter @unerp/api typecheck` both clean. **Enhancement complete**: Integrated real Stripe card processing pipeline (zero-dependency `StripePaymentGatewayService` via fetch APIs, dynamic `'PAYMENT_GATEWAY'` factory fallback, raw webhook payload signature HMAC SHA-256 constant-time check, e-commerce guest checkout mapping, and admin Sales Orders channel filter UI tab). |
| 34 | **Marketplace** (App Store / vendor & bundle system, previously undocumented — was only mentioned narratively as part of Studio row 31, but is a structurally separate, substantial module) | `apps/api/src/modules/marketplace` | 🟢 ACTIVE | new | admin, database | No dedicated `MarketplaceModule` file — its services/controllers (`BundleStoreService`, `AppProvisioningService`, `VendorService`, `StorefrontService`, `StorefrontController`, `DeveloperController`) are registered directly as providers/controllers inside `AdminModule` (`apps/api/src/modules/admin/admin.module.ts`). Real app-store architecture per prior data-architect work: `AppVendor`/`AppPackage`/`AppBundle` models, file-based install/uninstall of tenant apps under `var/tenant-apps` (`AppProvisioningService`, 152 LOC), a storefront read/browse layer (`StorefrontService`/`StorefrontController`, 188+73 LOC), a developer-facing portal (`DeveloperController`, 108 LOC, for vendors publishing packages), and a pre-built `healthcare-bundles.ts` (481 LOC) catalog of packaged healthcare-industry app bundles. This is a **different system from Studio's own "App Marketplace"** (row 31 — Studio-built custom-app provision-on-install); this one is the general third-party/vendor app-store. ~1,588 total LOC across 8 files. |
| 32 | **AI** | `apps/api/src/modules/ai` | 🟢 ACTIVE | 4 | reporting | No DB models — stateless service layer (uses generic `Setting` for the one persisted config field, see below). `AiService` calls a **self-hosted Ollama server** (`OLLAMA_BASE_URL`, default `http://localhost:11434`; `OLLAMA_MODEL`, default `llama3.2:3b`) via plain `fetch()` against `POST /api/chat` — no paid LLM API, zero per-token cost. `isConfigured()` always returns `true` (self-hosted, no API key concept); unreachable-server/model errors surface as a friendly `BadRequestException` at request time, not a startup crash. Exposes `chat`/`summarize`/`classify`/`extractFields` (unchanged signatures) plus `rawChat()`/`getBaseUrl()`/`getDefaultModel()` for lower-level tool-calling access. `AiCopilotService` holds fixed-mode business logic: `askData` (NL→structured report query→real `ReportingEngineService.executeQuery`→narrated answer, never hallucinated), `summarizeRecord`, `draftEmail`, `generateFormFromPrompt`, `generateWorkflowFromPrompt`, `processInvoiceDocument` (extraction + optional draft PO creation). `AiAgentService` is the general-purpose agent behind the global floating "AI Copilot" widget rendered on every dashboard page (`apps/web/app/(dashboard)/layout.tsx`): runs an Ollama function-calling tool loop (`POST /ai/converse`, capped at 6 iterations, OpenAI-style `tools`/`message.tool_calls` — not Anthropic content blocks) exposing `query_erp_data`, `summarize_record`, `draft_email`, `generate_form`, `generate_workflow`, `process_invoice_text` as tools that delegate 1:1 to the existing tenant-scoped `AiCopilotService` methods — no intent keyword-matching, no bypass of tenant scoping. `OllamaProcessService` starts/stops/status-checks the local `ollama serve` process (same-host deployment assumption). `AiConfigService` is the new tenant-scoped kill switch: reads/writes a single `Setting` row (`key = 'ai.config'`, same generic-JSON pattern as `PlatformService`'s feature flags) holding `{ enabled: boolean }`; `model`/`baseUrl` in its response are always live-read from `AiService`, never persisted (no per-tenant model override yet). All `ai.controller.ts` endpoints sit behind `JwtAuthGuard` + `RbacGuard` + `TenantInterceptor` with `ai.read`/`ai.create` permissions, and every AI-invoking handler (all but `status`) now calls `AiConfigService.isEnabled()` first, throwing a 503 `ServiceUnavailableException` if the tenant admin disabled AI; `GET /ai/status` additionally returns `enabled` so the floating widget (any authenticated user) can hide itself without needing admin permission. **New dedicated admin console**: `AiAdminController` (`admin/ai/*`, gated by the new admin-only `ai.admin.manage` permission on every route) exposes `GET/POST admin/ai/config` (kill switch) and `GET admin/ai/engine/{status,start,stop}` (relocated from `OperationsController`'s `admin/operations/ai-engine/*`, which no longer has these routes or an `OllamaProcessService` dependency). Frontend: `apps/web/app/(dashboard)/admin/ai/page.tsx` is the new AI admin page (kill switch card, read-only model info card, relocated engine start/stop card); `apps/web/app/(dashboard)/admin/page.tsx`'s sidebar AI Engine card was replaced with an "AI Assistant" link-out card and a matching `quickLinks` entry. **Known gap (out of scope for this Ollama swap, flagged separately):** `workflow-engine.service.ts` and `builder/web-studio.service.ts` still call `https://api.anthropic.com/v1/messages` directly via raw `fetch`, bypassing `AiService` entirely — untouched by this change, still incurring Anthropic API cost. |


---

## Shared Packages

| Package | Path | Status | Description |
|:---|:---|:---|:---|
| **@unerp/database** | `packages/database` | 🟢 ACTIVE | Prisma schema, client, migrations |
| **@unerp/shared** | `packages/shared` | 🟢 ACTIVE | Types, validators, constants, utilities |
| **@unerp/ui** | `packages/ui` | 🟢 ACTIVE | Design system, components, tokens |
| **@unerp/auth** | `packages/auth` | 🟢 ACTIVE | Authentication providers, RBAC, guards |
| **@unerp/config** | `packages/config` | 🟢 ACTIVE | ESLint, TypeScript, Prettier configs |
| **@unerp/framework** (Frontend Framework) | `packages/framework` | 🟡 IN_PROGRESS | Unified metadata/schema-driven frontend framework for ALL apps/modules (replaces ERPNext/Frappe-inspired patterns). Layers ABOVE `@unerp/ui`: module registration API, schema-driven List/Detail/Form views, data layer (typed API client + caching), forms engine (validation, conditional fields), permissions-aware navigation/menus (RBAC `module.resource.action`), tenant-scoped by construction, i18n-aware. Consumed by `apps/web`; complements (does not duplicate) Studio's dynamic rendering — Studio-built pages become a consumer of this runtime. |

---

## Module Interaction Map

```
Administration ◄─── (all modules depend on admin for auth/tenant context)
       │
       ├──► Finance ◄──────────── HR (payroll)
       │       │                    │
       │       │                    ├──► Projects (timesheets)
       │       │                    │
       │       ├──► Sales ◄────── CRM (lead conversion)
       │       │       │
       │       │       ├──► Inventory ◄── Procurement
       │       │       │       │
       │       │       │       ├──► Supply Chain
       │       │       │       │
       │       │       │       └──► Manufacturing
       │       │       │
       │       │       └──► POS & Retail
       │       │
       │       └──► Healthcare / Education / Real Estate
       │
       ├──► Documents (used by all modules)
       ├──► Communication (used by all modules)
       ├──► Workflow (orchestrates all modules)
       ├──► Notifications (triggered by all modules)
       └──► Analytics (reads from all modules)
```

---

## Adding a New Module

When adding a new module:

1. Add an entry to the appropriate table above
2. Set status to `🟡 IN_PROGRESS`
3. List all dependencies
4. List key entities
5. Follow the module development workflow in [AGENTS.md](../AGENTS.md)
6. Update status to `🟢 ACTIVE` when complete

---

## Production Readiness & Hardening

> Consolidated from the former `.ai/SCORECARD.md` (generated by `scripts/scorecard.mjs`) and
> `.ai/ENTERPRISE_HARDENING_PLAN.md` (8-phase roadmap), both now retired as standalone files. This
> section is the authoritative status; regenerate the heuristic score with `node scripts/scorecard.mjs`
> and re-summarize here rather than restoring the old file.

### Heuristic scorecard (last generated 2026-07-01)
- **System score: 10/10** (33 modules, presence-based heuristic — checks for `@Permissions`,
  `@ApiOperation`, zod validation pipes, etc.). **This is not proof of correctness** — see Reality
  Gates below, which is the binding signal. All 33 modules + all 4 platform dimensions (CI/CD,
  Observability, Security, Deployment) scored 10/10 on the last run.
- **Reality Gates (binding, last verified 2026-07-01)**: `tsc --noEmit` across all packages — PASS
  (6s); full API test suite — PASS (32s, 121 files / 1694 tests green in parallel).
- Regenerate via `node scripts/scorecard.mjs --gates` periodically; a red gate voids the heuristic
  headline per the tool's own design.

### Enterprise Hardening Plan — phase status (owner: Architecture, started 2026-07-01)
Goal: move from "heuristic 10/10" to genuine enterprise-grade readiness (SAP/Oracle/Dynamics/NetSuite-class).

- **Phase 0 — Restore honest quality gates: COMPLETE.** Removed `ignoreBuildErrors`/`ignoreDuringBuilds`
  from `next.config`; fixed the test runner (root cause was two unbounded `while(true)` slug-uniqueness
  loops causing OOM, not a "Node memory leak" — fixed via `common/utils/slug.util.ts`'s bounded
  `resolveUniqueSlug`); replaced `run-tests-sequential.ps1` with plain `vitest run` (full suite now
  121/121 files, 1694/1694 tests green in parallel, ~30s); added Reality Gates (binding `--gates` mode)
  to `scripts/scorecard.mjs`. **Open follow-up**: `test:coverage` (the CI gate) still excludes
  `*.coverage.spec.ts` — decide whether to run the full suite in CI now that it's stable.
- **Phase 1 — Architecture guardrails & god-class decomposition: IN PROGRESS.** CRM god-class **DONE**
  (`crm.service.ts` 2,330 → 322 LOC facade + 10 domain services, strangler-fig pattern, gates green).
  `builder.service.ts` **DONE** (decomposed 2,906 LOC into 6 services + facade facade, redirected controller, all tests green).
  `inventory.service.ts` **IN PROGRESS** (warehouses decomposed, others open).
  Follow-up: `crm.service.coverage.spec.ts` needs repointing to exercise the moved domain logic for
  real (currently instantiates `CrmService` with no sub-services). **Next god-classes still open**:
  remaining inventory domain services, advanced-finance/procurement/manufacturing services (>1,200 LOC each).
  `dependency-cruiser`/ESLint module-boundary lint (no cross-module deep imports, no business logic in controllers) not yet added to CI.
- **Phase 2 — Data & tenant integrity: substantially COMPLETE.** Central tenant-isolation enforcement
  closed 2026-07-01: `TenantInterceptor` now registered globally (`APP_INTERCEPTOR`), fixed an
  args-mutation bug where `findMany()`-style calls with no options silently skipped scoping, added
  `@SkipTenantScope()` decorator for the one legitimate cross-tenant surface (`SuperAdminController`).
  Added `packages/database/src/tenant-isolation.test.ts` (22 cases) — `packages/database` previously
  had zero test infrastructure. Remaining schema-wide audit for missing `tenantId` filters is now
  defense-in-depth verification, not the last line of defense.
- **Phase 3 — Security hardening (OWASP): PARTIALLY ADDRESSED via a separate finding, not the
  original phase plan.** See "RBAC decorator-stacking defect" below — a systemic issue discovered
  mid-stream that is larger in scope than originally planned for this phase.
- **Phase 4 (Observability), Phase 5 (Testing depth), Phase 6 (Frontend architecture), Phase 7
  (Delivery & DR): NOT STARTED** as dedicated passes — some incidental progress (e.g. a stray
  `console.error` in `builder.service.ts` fixed during Phase 0) but no phase-level work done yet.

### Critical cross-cutting finding: RBAC decorator-stacking defect (project-wide)
Discovered while scoping Admin module work (2026-07-02), confirmed by `security-auditor` to be
**systemic, not admin-specific**: NestJS's `@Permissions(...)` decorator calls `SetMetadata`, which
is last-write-wins on the same metadata key — stacking two `@Permissions(...)` calls on one handler
(a common copy-paste pattern in this codebase) silently discards the physically-lower (usually more
specific) permission; only the coarse one the guard ever sees. **1,024 endpoint methods across 55 of
71 controller files (77%)** have this pattern — CRM (177 methods), Builder Studio (123), Advanced HR
(90), POS (73), Inventory (69), Manufacturing (41), and 20+ other modules including `SuperAdminController`
itself (meaning `system.tenant.read` was dead and any `admin.read`-holder could enumerate all tenants
via `GET /super-admin/tenants` — a tenant-isolation-adjacent Critical finding, not just lost granularity).
- **Fixed for Admin only** (P0-1 in the former Admin completion requirements doc): all 19 admin
  controllers de-duplicated to a single `@Permissions(fine-grained)` call each, ~30 fine-grained
  `admin.*` codes registered in `packages/shared/src/permissions/registry.ts`, seed data confirmed
  non-breaking (seeded `ADMIN` role uses a `admin.*` wildcard, not an enumerated list, so it
  automatically retains access to all newly-live codes). UAT PASSED 2026-07-02.
- **NOT fixed project-wide** — this is the single largest open item from the hardening effort.
  Recommended fix: a project-wide static check (ESLint rule or build-time test parsing every
  `*.controller.ts` for methods with more than one `@Permissions(...)` call) in CI, followed by a
  mechanical codemod across the other 54 affected controller files, paired with a seed-data
  re-alignment pass (any role relying on coarse `module.read/create/update/delete` needs fine-grained
  grants added, or it silently loses access once fixed — same risk pattern as the Admin fix required).
- **RBAC boundary recommendation adopted for backups**: a dedicated `system.operations.backup`
  permission (Super-Admin-only, `@SkipTenantScope()`) was created rather than reusing tenant-scoped
  `admin.operations.*`, since a full Postgres backup/restore is instance-wide, not per-tenant — this
  pattern (system.* namespace, distinct from tenant-scoped admin.*) is the template for any future
  cross-tenant/platform-operator permission.

---

## Module-Specific Completion Notes

> Condensed from former standalone spec/audit/sign-off files (`ADMIN_MODULE_COMPLETION_REQUIREMENTS.md`,
> `ADMIN_SECURITY_AUDIT.md`, `ADMIN_UAT_SIGNOFF.md`, `ADMIN_UI_ACCESS_CONTROL_SPEC.md`,
> `CONNECT_MODULE_REQUIREMENTS.md`, `CONNECT_QA_REPORT.md`, `CONNECT_UAT_SIGNOFF.md`,
> `CONNECT_UI_DESIGN_SPEC.md`, `ECOMMERCE_MODULE_REQUIREMENTS.md`, `BUILDER_STUDIO_MASTER_PLAN.md`),
> all now retired. Grouped by module; status detail beyond this belongs in module row prose above.

### Admin (row 1)
Closed gaps (P0-1 RBAC decorator fix + registry fill, P0-2 real automation-rule execution engine,
P1-1 honest backup labeling + BullMQ↔BackgroundJob wiring) — all UAT PASSED 2026-07-02, evidence
walked in a dedicated regression sweep (`rbac-regression-sweep.spec.ts`) using a real `Reflector`
against real controller metadata.

**Still open (P2 backlog, explicitly deferred, non-blocking):**
- Automation rule execution idempotency — no dedupe guard against duplicate domain-event delivery
  double-executing a rule's actions (acceptable under today's synchronous at-most-once emitter).
- Scheduled Tasks → real handler dispatch (`triggerTask` creates a `BackgroundJob` row but no
  processor switches on arbitrary `handler` strings yet).
- **Access Control UI restructuring** (uiux-designer spec ready, not yet built): the Access Control
  matrix (`/admin/access-control/matrix`) and Roles page currently group permissions by `module` only
  — once ~30 fine-grained `admin.*` codes are live, Admin's column/card becomes an unreadable flat
  list (47+ checkboxes in one column). Spec calls for a `category?: string` field added to
  `PermissionDefinition`, a two-level Module→Category hierarchy, a drill-in `Drawer` for the matrix's
  admin column, and nested category groups replacing flat checkbox stacks on the Roles page. Not yet
  implemented — flagged as open frontend work.
- The project-wide RBAC decorator-stacking defect (see Production Readiness section above) was
  *discovered* via Admin work but is out of Admin's own UAT scope — tracked at the platform level.

### Connect (Communication) module (row 13)
Teams/GChat parity pass — Phases A/B/C plus later D-phase additions, UAT **ACCEPTED** 2026-07-02.
Real file sharing (Drive-backed, no more blob URLs), WebSocket real-time wiring (existing
`notifications.gateway.ts` was built but unused — now wired for live messages/typing/presence),
message search, channel management + roles (`ChannelMember.role` OWNER/ADMIN/MEMBER), seen-by read
receipts (≤8-member bound), link preview unfurling, per-channel notification levels, message
forwarding (client-side marker, no new endpoint), upgraded categorized/searchable emoji picker,
directory search by department/designation, Saved Messages view.

**Two P0 bugs found and closed during QA** (both re-verified live): (1) channel creator was never
seeded as `ChannelMember` with role `OWNER` — made archive/rename/member-management permanently
unreachable for every newly created channel; fixed by mirroring the existing `getOrCreateDM`/
`createGroup` member-seeding pattern. (2) `PermissionContext.Provider` was never mounted anywhere in
`apps/web` — every `ProtectedComponent`-gated control in the entire app (not just Connect) was
invisible to 100% of users regardless of permission; fixed via new `PermissionProvider.tsx` wrapping
the dashboard layout tree. This was app-wide infra debt surfaced by Connect's QA pass, not a
Connect-specific defect.

**Known open items** (documented, non-blocking per UAT):
- Connect's `@mention` notification flow calls `prisma.notification.create` directly instead of
  emitting `notification.send` — so `NotificationDeliveryService`'s DND-suppression logic (correct,
  unit-tested in isolation) never actually runs for chat mentions. Low practical harm (nothing is
  being wrongly delivered, there's just nothing to suppress) but the acceptance criterion as written
  isn't literally true. Route to backend-developer.
- `link-preview` endpoint performs a server-side fetch of a fully user-supplied URL with **no SSRF
  guard** (no private-IP/localhost denylist) — flagged to security-auditor as a required follow-up
  before this endpoint is exposed to untrusted input.
- Real-time video/audio calling remains a **non-functional client-side mock** (no WebRTC, no media
  server) — explicitly out of scope for the parity pass, would need a separate infra/vendor decision
  (LiveKit/mediasoup/managed provider).
- Deliberately deferred to backlog: slash commands/bot framework, external/guest cross-tenant access
  (needs its own security-reviewed spec), calendar recurrence expansion.
- Directory designation/department enrichment cannot be demonstrated with real data in the seeded dev
  DB (zero `Employee` rows link to a `User.id`) — a seed-data gap, not a code defect.

### E-Commerce Storefront (row 33)
See row 33 prose for full implementation detail (backend + admin/public frontend, both shipped
2026-07-03). Original MVP spec's explicit non-goals for this pass, still open: real payment gateway
(Stripe, replacing `MockPaymentGatewayService`), Sales Orders list channel-filter UI (Flow D),
multi-vendor marketplace, subscriptions, discount/coupon engine, customer accounts/order history
portal, product variants, shipping-rate calculation, nested category trees, abandoned-cart recovery.

### Studio / Builder (row 31)
The former 40-phase "Builder Studio Master Plan" was an aspirational competitive-strategy document
(vs. Salesforce/Odoo/Retool/Bubble/Frappe) — most of its content described planned phases, not shipped
work; that context now lives only in this note since the aspirational roadmap itself added no
verifiable status beyond what's already tracked in the Studio Backlog section below and the module's
row-31 prose (which documents what's actually built: visual canvas editors, releases/versioning,
Marketplace with provision-on-install, Web Studio CMS). Treat any phase from the old master-plan
document (e.g. Phase 31 real-time multiplayer collaboration, Phase 39 AI-assisted schema generation
beyond what's already in `builder-ai.service.ts`, Phase 33 custom component CLI) as **BACKLOG/PLANNED,
not in progress**, unless it also appears in the Studio Backlog section below.

---

## Studio Backlog

> Consolidated from the former `.ai/DEV_SPRINTS.md`. Scope: only the **Studio** module (`/builder`).
> Phase 1 (UI restructure foundation) is done. Full original plan reference:
> `~/.claude/plans/complete-ui-restructure-for-compiled-cosmos.md` (competitive gap analysis, 5-phase
> roadmap). Last re-verified 2026-07-04 against `apps/api/src/modules/builder/` and
> `apps/web/src/components/builder/`.

**Convention reminder**: `.frappe-*` utility classes are mandated (AGENTS.md), not legacy. The bar =
`frappe-*` utilities + `@unerp/ui` components together (PageHeader/breadcrumbs/DataTable/Modal/KPICard).

**Still open, from Phase 1 carryover:**
- Authenticated preview verification — capture screenshots of Studio Home, the 4 pillar hubs,
  auto-breadcrumbs, and the Cmd-K palette (needs `infra`+`api` running).

**Still open, from Phase 2 (Parity Gap-Fill):**
- Business Logic → visual rule/flow editor (to replace form-driven automation rules) — the only
  remaining open item; Form/Page/Workflow canvas editors are already built and confirmed
  (`FormBuilderWorkspace.tsx` uses `@dnd-kit`, `WorkflowEditorWorkspace.tsx` uses `reactflow`,
  `PageBuilderWorkspace.tsx` is a grid canvas).

**Still open, from Phase 3 (AI Layer):**
- Wire the Home "Start with AI" box to real generation end-to-end — not independently re-verified.
- AI site builder for Web Studio (prompt→site + section regeneration) — not re-verified.
- (Prompt→artifact generation, in-editor copilot in ≥2 editors are confirmed built —
  `builder-ai.service.ts`'s `generateAppModule()`, now routed through the self-hosted-Ollama-backed
  `AiService`, not a direct Claude call as originally scoped.)

**Still open, from Phase 4 (Governance & Enterprise):**
- Audit trail + approval gates depth in `builder-governance.service.ts` — not independently
  re-verified this pass.
- (Environments/promotion pipeline and connector/integration catalog are confirmed built.)

**Still open, from Phase 5 (Ecosystem & Web Advanced) — the largest remaining cluster:**
- Theme/template marketplace — `/builder/manage/marketplace/page.tsx` exists but not confirmed to
  cover theme/template distribution vs. the existing App Marketplace (provision-on-install, already
  documented in row 31).
- Custom-domain DNS/SSL automation — confirmed still **verify-only** (`WebDomain` model has only
  `host`/`verified`/`isPrimary`, no automation fields). Genuinely open.
- DAM upgrade for assets (folders, transforms, CDN) — not re-verified.
- A/B testing + personalization for Web Studio — not re-verified.
- Mobile runtime polish — `/builder/manage/mobile-export/page.tsx` covers some surface (native build
  queue) but "runtime polish" as originally scoped is broader; open pending closer review.

**Key files**: Nav/IA `apps/web/src/navigation/{moduleNav.tsx, registry.tsx, useResolvedNav.ts}`;
Studio shell `apps/web/app/(dashboard)/builder/{layout.tsx, page.tsx}`,
`src/components/builder/{StudioCommandPalette,StudioBreadcrumb}.tsx`; Editors
`apps/web/src/components/builder/{FormBuilderWorkspace,PageBuilderWorkspace,WorkflowEditorWorkspace,DashboardEditorWorkspace}.tsx`;
Manage pages `apps/web/app/(dashboard)/builder/manage/{releases,environments,logs,access}/page.tsx`;
Backend `apps/api/src/modules/builder/{builder.service.ts, builder.controller.ts,
builder-governance.service.ts, builder-ai.service.ts}`; Data/UI
`apps/web/src/lib/{api.ts, hooks/useModuleData.ts, queryKeys.ts}`, `@unerp/ui`
(`packages/ui/src/index.ts`).

---

## UI Consolidation Status

> Condensed from the former `.ai/UI_CONSOLIDATION_PLAN.md`. Tracks the multi-phase effort to merge
> fragmented single-purpose Settings/module pages into tabbed hubs (reduces sidebar nav sprawl).

- **Phase 1 (SHIPPED 2026-07-04)**: Identity & Access Hub (`settings/identity-access`) — merged
  Users/Groups & Teams/Roles/Access Packages (4→1). Permissions Matrix, SSO, MFA, Password Policy,
  Sessions, Impersonation, Delegations deliberately kept separate (dense grid or distinct
  actor/audited flow).
- **Phase 2 (SHIPPED 2026-07-04)**: all remaining Settings groups — 9 hubs built (Security Policies,
  Compliance & Data Governance, Approval Operations, Workflow Builder, Branding & Communication,
  System Operations, General & Branding, API Platform, Import/Export), ~45 legacy redirects in place,
  nav updated, typecheck clean, verified via curl.
- **Phase 3a (SHIPPED 2026-07-04)**: cross-module rollout — CRM Marketing & Outreach hub (4→1), CRM
  Sales Enablement hub (2→1), HR Operations & Service hub (5→1), Supply Chain Operations hub (4→1),
  15 legacy redirects, nav updated.
- **Phase 3b (DEFERRED, lower priority)**: POS & Retail "Retail Tools" hub (Held Orders/Promotions/
  Layaway, 3→1) — small win, not urgent. Drive module marginal candidate, revisit only if page count
  grows.
- **Phase 3c (DEFERRED, revisit alongside future backend work)**: Real Estate, Field Service,
  Healthcare, Education — currently thin/mocked placeholder pages; consolidating now risks being
  thrown away once real backend work lands. Consolidate as part of each module's real API-wiring
  effort, not before.
- **Rejected outright / explicit no-go** (do not re-propose): HR onboarding/offboarding, all Finance
  module clusters, Studio Manage pages, Analytics/BI (every page is a distinct canvas/builder),
  Manufacturing, Projects, E-Commerce (already lean), Connect (already unified), CRM Settings
  (`crm/settings/*` — wait until the org-wide Settings hub pattern proves out further), Settings
  Reports group (4 pages, no shared actor/mental model).
- **Flagged, not a consolidation task**: top-level `/workflows` nav entries point at routes with no
  backing page files under `apps/web/app/(dashboard)/workflows/` — needs a frontend-developer
  investigation pass (likely dead/stale nav, or should redirect into the Settings Workflow
  Builder/Approval Operations hubs), separate from this plan's scope.

