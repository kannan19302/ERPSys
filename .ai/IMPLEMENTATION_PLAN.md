# IMPLEMENTATION_PLAN.md — DEV Cycle 31: Finance & Accounting Module Deepening

**Date**: 2026-07-21 | **Agent**: Antigravity | **Flow**: DEV | **Phase**: M — Module Strengthening

---

## 🎯 Goal

Deepen the **Finance & Accounting** focus module (closing market benchmark gaps 34, 35, and 37 from `.ai/MODULE_REGISTRY.md` § Up Next) by introducing three production-grade enterprise services, API endpoints, interactive UI subtabs, and unit tests:

1. **Item 34: Real-time Multi-Jurisdiction Tax Rate Lookup & Special Surtax Engine** (`TaxJurisdictionLookupService`)
   - Composite multi-tier rate calculation (State %, County %, City %, Special District %) by Postal/ZIP code, state, and tax category (SaaS, Digital Services, Physical Goods, Exempt Freight, Professional Services).
   - Rate lookup history audit log and manual rate override capability per tenant jurisdiction.
   - 4 API endpoints (`POST /finance/tax/lookup-rate`, `GET /finance/tax/jurisdictions`, `POST /finance/tax/jurisdictions`, `PUT /finance/tax/jurisdictions/:id`).

2. **Item 35: Automated Nexus Filing Calendar & Reminders Engine** (`TaxFilingCalendarService`)
   - Dynamic return due-date calculator per US state/jurisdiction with variable filing frequencies (Monthly, Quarterly, Semi-Annual, Annual).
   - Automated filing reminder generator with estimated penalty & interest calculators for past-due filings.
   - 4 API endpoints (`GET /finance/tax/filing-calendar`, `POST /finance/tax/filing-calendar/recalculate`, `GET /finance/tax/filing-reminders`, `POST /finance/tax/filing-reminders/:id/acknowledge`).

3. **Item 37: Template-Driven Recurring Journal Entries & Auto-Posting Scheduler** (`RecurringJournalSchedulerService`)
   - Recurring GL journal templates with debit/credit balance validation, flexible recurrence patterns (Daily, Weekly, Monthly, Quarterly, Annual), max run limits, and end dates.
   - Auto-posting engine that posts balanced GL Journal Entries directly to `JournalEntry` and `JournalEntryLine` with transaction isolation and run log records.
   - 5 API endpoints (`GET /finance/recurring-journals/templates`, `POST /finance/recurring-journals/templates`, `PUT /finance/recurring-journals/templates/:id`, `POST /finance/recurring-journals/templates/:id/post-now`, `POST /finance/recurring-journals/process-due`).

---

## 🏗️ Proposed Changes

### Backend Services (`apps/api/src/modules/advanced-finance/services/`)

#### [NEW] [tax-jurisdiction-lookup.service.ts](file:///c:/Users/kanna/OneDrive/Documents/Antigravity/ERPSys/apps/api/src/modules/advanced-finance/services/tax-jurisdiction-lookup.service.ts)

- `TaxJurisdictionLookupService`: multi-tier tax rate determination, ZIP-code matching, taxability category multipliers, jurisdiction CRUD.

#### [NEW] [tax-filing-calendar.service.ts](file:///c:/Users/kanna/OneDrive/Documents/Antigravity/ERPSys/apps/api/src/modules/advanced-finance/services/tax-filing-calendar.service.ts)

- `TaxFilingCalendarService`: filing frequency calendar calculation, due date rules per state, filing reminders generator with penalty/interest estimators.

#### [NEW] [recurring-journal-scheduler.service.ts](file:///c:/Users/kanna/OneDrive/Documents/Antigravity/ERPSys/apps/api/src/modules/advanced-finance/services/recurring-journal-scheduler.service.ts)

- `RecurringJournalSchedulerService`: template CRUD, balanced debit/credit validation, next run date math, automated GL journal posting execution and logging.

#### [MODIFY] [index.ts](file:///c:/Users/kanna/OneDrive/Documents/Antigravity/ERPSys/apps/api/src/modules/advanced-finance/services/index.ts)

- Export new service classes.

#### [MODIFY] [finance-more-deep.controller.ts](file:///c:/Users/kanna/OneDrive/Documents/Antigravity/ERPSys/apps/api/src/modules/advanced-finance/finance-more-deep.controller.ts)

- Add 13 new REST endpoints with Zod validation, `@Permissions()`, `@TrackChanges()`, and `@UseInterceptors(ChangeHistoryInterceptor)`.

#### [MODIFY] [advanced-finance.module.ts](file:///c:/Users/kanna/OneDrive/Documents/Antigravity/ERPSys/apps/api/src/modules/advanced-finance/advanced-finance.module.ts)

- Register `TaxJurisdictionLookupService`, `TaxFilingCalendarService`, and `RecurringJournalSchedulerService` in providers and exports.

### Frontend UI (`apps/web/`)

#### [NEW] [TaxJurisdictionLookupTab.tsx](<file:///c:/Users/kanna/OneDrive/Documents/Antigravity/ERPSys/apps/web/app/(dashboard)/finance/tax/TaxJurisdictionLookupTab.tsx>)

- Tax rate calculator widget with breakdown breakdown breakdown, postal code search, and jurisdiction table.

#### [NEW] [TaxFilingCalendarTab.tsx](<file:///c:/Users/kanna/OneDrive/Documents/Antigravity/ERPSys/apps/web/app/(dashboard)/finance/tax/TaxFilingCalendarTab.tsx>)

- Filing schedule timeline, state due date cards, filing reminders queue, and penalty estimator widget.

#### [NEW] [RecurringJournalsTab.tsx](<file:///c:/Users/kanna/OneDrive/Documents/Antigravity/ERPSys/apps/web/app/(dashboard)/finance/journal-entries/RecurringJournalsTab.tsx>)

- Recurring GL templates list, template creation modal with split line entries, manual trigger "Post Now", and execution log history.

#### [MODIFY] [finance/tax/page.tsx](<file:///c:/Users/kanna/OneDrive/Documents/Antigravity/ERPSys/apps/web/app/(dashboard)/finance/tax/page.tsx>)

- Wire `TaxJurisdictionLookupTab` and `TaxFilingCalendarTab` into subtabs (`?tab=tax&subtab=jurisdictions` and `?tab=tax&subtab=calendar`).

#### [MODIFY] [finance/journal-entries/page.tsx](<file:///c:/Users/kanna/OneDrive/Documents/Antigravity/ERPSys/apps/web/app/(dashboard)/finance/journal-entries/page.tsx>)

- Wire `RecurringJournalsTab` into GL subtab (`?tab=gl&subtab=recurring`).

### Unit Tests (`apps/api/src/modules/advanced-finance/tests/`)

#### [NEW] [tax-journal-deep.service.spec.ts](file:///c:/Users/kanna/OneDrive/Documents/Antigravity/ERPSys/apps/api/src/modules/advanced-finance/tests/tax-journal-deep.service.spec.ts)

- Comprehensive unit tests covering all 3 service classes (jurisdiction lookup math, filing calendar due dates, recurring GL entry creation & posting).

---

## 🧪 Verification Plan

### Automated Tests

- Run unit tests: `pnpm --filter @unerp/api test -- tax-journal-deep.service.spec.ts`
- Run API typechecks: `pnpm --filter @unerp/api typecheck`
- Run Web typechecks: `pnpm --filter @unerp/web typecheck`
- Run architecture check: `pnpm architecture:check`

### Verification Criteria

- Zero TypeScript compile errors across `@unerp/api` and `@unerp/web`.
- 100% passing unit tests on new services.
- `pnpm architecture:check` 100% clean (no direct relative imports across modules, no dependency cycles).
