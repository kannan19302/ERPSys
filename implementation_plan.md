# Implementation Plan — Tier 1: Core Financial Reporting & Aging Reports

## Overview
Replace 5 stub/placeholder financial reports with real computations from actual ledger data and build a Trial Balance + AR/AP Aging Reports, then update the frontend with a unified financial reporting dashboard.

## Types
Add new TypeScript interfaces for all 5 report response shapes in `packages/shared/src/types/index.ts`.

**Types to add:**
- `ProfitAndLossReport` — revenue, cogs, grossProfit, expenses (list), netProfit, period
- `BalanceSheetReport` — assets (current + non-current), liabilities (current + non-current), equity, asOfDate
- `CashFlowReport` — operatingActivities (list), investingActivities (list), financingActivities (list), netIncrease
- `TrialBalanceReport` — accounts (code, name, type, debitTotal, creditTotal, balance), totalDebits, totalCredits
- `AgingReportItem` — customerName, invoiceNumber, totalAmount, dueDate, daysOverdue, ageBucket, outstanding
- `AgingSummaryReport` — buckets (0-30, 31-60, 61-90, 90+), totals, items

## Files
Modified files only — no new files needed.

### Backend (API)
1. **`apps/api/src/modules/advanced-finance/advanced-finance.service.ts`** — Replace 5 stub methods with real SQL/queries
2. **`apps/api/src/modules/advanced-finance/advanced-finance.controller.ts`** — Add 2 new endpoints (trial-balance, aging-reports) + update permissions

### Frontend
3. **`apps/web/app/(dashboard)/finance/advanced/reports/page.tsx`** — Completely rebuild with all 5 reports, proper UI, and better data visualization

### Tests
4. **`apps/api/src/modules/advanced-finance/tests/advanced-finance.service.spec.ts`** — Add unit tests for all 5 new real report methods

## Functions

### AdvancedFinanceService (modified)
| Function | Change |
|:---|:---|
| `getProfitAndLoss()` | **Replace stub**: Query JournalEntry joined with Account for REVENUE/EXPENSE types in date range. Group by account. Compute gross profit = revenue - COGS, net profit = revenue - total expenses. |
| `getBalanceSheet()` | **Replace stub**: Query Account where type IN (ASSET, LIABILITY, EQUITY) and return balances. Separate current vs non-current. |
| `getCashFlow()` | **Replace stub**: Classify journal entries by account type into operating/investing/financing sections. |
| `getTrialBalance()` | **New**: Fetch all active accounts with their debit/credit totals from JournalEntry, compute running balances, return trial balance report. |
| `getAgingReport(type)` | **New**: Query Invoices/PurchaseOrders grouped by overdue days into aging buckets (0-30, 31-60, 61-90, 90+). Accept `'AR'` or `'AP'` parameter. |

### AdvancedFinanceController (modified)
| Endpoint | Change |
|:---|:---|
| `GET reports/trial-balance` | **New**: Accept `?asOfDate=`. Returns trial balance. |
| `GET reports/aging` | **New**: Accept `?type=AR|AP&asOfDate=`. Returns aging report. |
| `GET reports/pnl` | Update permission to `finance.report.read` |
| `GET reports/balance-sheet` | Update permission to `finance.report.read` |
| `GET reports/cash-flow` | Update permission to `finance.report.read` |

### Frontend Reports Page (rewrite)
- Replace current 3-report selector with 5-report selector (P&L, Balance Sheet, Cash Flow, Trial Balance, Aging Reports)
- Add date range pickers for all reports
- Add Aging type selector (AR/AP) for aging report
- Display report data in structured tables with proper formatting
- Add loading states, error states, and empty states
- Add export buttons (CSV/PDF placeholders wired up)

## Classes
No new classes needed. Only modifications to existing `AdvancedFinanceService` and `AdvancedFinanceController`.

## Dependencies
No new npm packages. The existing Prisma ORM, Decimal, and NestJS infrastructure suffices.

## Testing

### AdvancedFinanceService Tests (modified)
Add 5 new test suites:
- `getProfitAndLoss()` — creates journal entries for revenue and expense accounts, verifies P&L computation
- `getBalanceSheet()` — creates ASSET, LIABILITY, EQUITY accounts with balances, verifies balance sheet
- `getCashFlow()` — creates entries across all 3 activity types, verifies cash flow classification
- `getTrialBalance()` — creates debits and credits, verifies trial balance totals balance
- `getAgingReport()` — creates invoices with varying due dates, verifies aging buckets

### Validation
- Run `pnpm test:api` to verify all tests pass
- Start dev servers and manually verify each endpoint returns real data

## Implementation Order
1. Update `advanced-finance.service.ts` — implement `getProfitAndLoss()`, `getBalanceSheet()`, `getCashFlow()` real computations
2. Add `getTrialBalance()` and `getAgingReport()` methods to service
3. Add new endpoints to `advanced-finance.controller.ts`
4. Rebuild the frontend reports page with all 5 reports
5. Write/update unit tests for all 5 reports
6. Start dev servers and validate end-to-end
7. Run test suite