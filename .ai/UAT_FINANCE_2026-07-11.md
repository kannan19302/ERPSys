# Finance & Accounting — Live UAT / E2E Sign-off

**Date**: 2026-07-11
**Environment**: local sandbox, live stack (Postgres 16 via Docker, NestJS API dist build on :3001, Next.js dev server on :3000), seeded via `pnpm --filter @unerp/database db:seed`.
**Tester**: autonomous cycle (claude-code-cli-autopilot), acting as a business user via curl against the live API + live Playwright browser automation.

## 1. Stack verification

| Check | Result |
|:--|:--|
| Docker daemon | Was down at cycle start (`Cannot connect to the Docker daemon`); manually restarted via `sudo dockerd` — came up clean. |
| Postgres 16 (`unerp-postgres` container) | Up, `pg_isready` OK. |
| Migrations | `npx prisma migrate deploy` — all migrations applied cleanly, including the two newest (`20260711041855_finance_1099_vendor_tax_reporting`, `20260711044719_finance_economic_nexus_monitoring`). |
| API build + boot | `pnpm --filter @unerp/api build` clean; `node apps/api/dist/main.js` started, all routes mapped, listening on `:3001`. |
| Web dev server | `pnpm --filter @unerp/web dev` — Next.js 15.5.19 ready on `:3000`. |
| Seed | `db:seed` completed — tenant, roles, admin user, CRM/Finance/HR/etc. sample data all seeded. |
| Admin login | `POST /api/v1/auth/login` with `admin@unerp.dev` / `admin123` → **200**, real signed JWT + tenant + Super Admin role returned. |

## 2. Live Playwright E2E smoke (`e2e/smoke.spec.ts`, all 66 Finance/advanced-finance routes + 4 other-module control routes)

Command: `npx playwright test e2e/smoke.spec.ts --reporter=list --workers=2` (browsers resolved via `PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers`).

**Result: 69/70 passed.**

- All 66 Finance + advanced-finance routes: **PASS** — login, dashboard, invoices, all `/finance/advanced/*` pages (expense reports/policies, allocations, accounting-books, corporate cards, 1099-reporting, tax-nexus, AP automation/matching, AR aging/automation, bank feeds/recon, budgeting/budget-scenarios, cash-flow-forecast/cash-position, chart-of-accounts, close-tasks, consolidation, credit-risk, currency/fx-revaluation, customer-statement, e-invoicing, exception-queue, exchange-rates, financial-periods/ratios, fixed-assets (+ new-asset form), forecast-scenarios, intercompany eliminations/netting, invoice-analytics/capture, journal-entries, leases (+ new-lease form), payment-batches/terms, reconciliations, recurring, reports, revenue-schedules, scenario-comparison, subscriptions (+ new-subscription form), tax-engine/filing/filing-summary, treasury) — no 5xx responses, no Next.js error-boundary renders.
- Other-module control routes (crm/contacts, crm/leads, inventory/products, hr/employees, procurement/purchase-orders, sales/orders, projects, manufacturing/work-orders, admin/users): **PASS**.
- **1 FAIL**: `/reporting` — 500 response. This route belongs to the **Reporting/BI platform module** (Focus Order §4 row 9), not Finance/advanced-finance — it is not one of the 66 Finance routes and is out of scope for this UAT cycle's pass/fail gate. Logged as a real bug to be fixed when that module comes into focus (see Up Next).

## 3. Manual business-workflow UAT (live API, real JWT + CSRF token, real Postgres data)

| # | Workflow | Steps | Result |
|:--|:--|:--|:--|
| 1 | **Create invoice → mark paid** | `POST /finance/invoices` (customer=Stark Industries, 1 line @ $500) → `id` returned, `status=DRAFT`, `totalAmount=500`. `POST /finance/invoices/:id/send` → `{success:true}`. `POST /finance/payments` (amount=500, BANK_TRANSFER) → payment record created. `GET /finance/invoices/:id` → `status=PAID`, `paidAmount=500`, `sentAt`/`paidAt` populated. | **PASS** — full lifecycle DRAFT→SENT→PAID confirmed with real DB state. |
| 2 | **Post a journal entry** | `POST /advanced-finance/journals` (balanced 2-line entry: Depreciation Expense debit $100 / Cash Account credit $100) → `status=DRAFT`. `.../submit` → `SUBMITTED`. `.../approve` → `APPROVED`. `.../post` → `POSTED`. Re-fetched Chart of Accounts: Cash Account balance moved from `5000` → `4900` (exactly the posted credit). | **PASS** — full DRAFT→SUBMITTED→APPROVED→POSTED lifecycle and real GL balance impact confirmed. |
| 3 | **View 1099 report** | `GET /advanced-finance/1099/summary` → `200`, `{taxYear:2026, totalForms:0, totalAmount:0, ...}`. `GET /advanced-finance/1099/threshold-report` → `200`, `{threshold:600, eligibleCount:0, ...}`. Zero results is correct/expected for a freshly-seeded tenant with no vendor payments exceeding the $600 IRS threshold yet — not an error. UI page `/finance/advanced/1099-reporting` also passed in the Playwright smoke run. | **PASS** — endpoints live, correctly shaped, legitimately empty on fresh data. |
| 4 | **View tax-nexus dashboard** | `GET /advanced-finance/tax/nexus/dashboard` → `200`, `{totalStatesMonitored:0, exceededCount:0, ...}`. `GET /advanced-finance/tax/nexus/thresholds` → `200`, `[]` (defaults not yet seeded for this tenant — expected, there's a `seed-defaults` action for that). UI page `/finance/advanced/tax-nexus` also passed in the Playwright smoke run. | **PASS** — endpoints live and correctly shaped. |

## 4. Verdict

**UAT PASSED.** All 4 core business workflows work end-to-end against the live stack with real Postgres state changes (not mocks, not stubs). The E2E smoke sweep covers all 66 Finance/advanced-finance routes with zero failures; the one observed failure is in an out-of-scope module (Reporting/BI, not yet in focus) and does not block Finance's exit criteria.

This closes **MODULE_FOCUS.md §5 criterion 6** — the sole remaining blocker to declaring Finance & Accounting COMPLETE.
