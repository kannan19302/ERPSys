# Implementation Plan — Cycle 32 (Phase M)

## Cycle Info

- **Cycle**: 32
- **Phase**: M (Module strengthening)
- **Date**: 2026-07-21

## Selected Scope

**Finance & Accounting** (Current Focus Module) — P3 deepening vs market leaders.

**Why**: Finance is at 1190 combined features (174 core + 1016 advanced). Need 1500+ to close completion criteria #1. Gap: ~310 features. This cycle builds 4 new real-service verticals (80+ new feature endpoints) to close ~25% of the gap.

## Duplicate Check

- `pnpm architecture:check` baseline: clean (already verified from Cycle 31)
- Grep confirms no existing routes under planned `/finance/ar-deep/*`, `/finance/ap-deep/*`, `/finance/close/*`, `/finance/project-accounting/*`

## Ordered Slice List (API layer)

### Slice 1: AR Deep Operations (20+ endpoints)

**Service**: `ArDeepService` — `apps/api/src/modules/finance/services/ar-deep.service.ts`
**Controller**: `ArDeepController` — `@Controller('finance/ar-deep')`

- Receipt batch posting with multi-invoice allocation
- Collections queue with scoring and action plans
- Customer credit management (limits, holds, reviews, releases)
- Automated payment allocation intelligence (reference-based auto-match)
- Promise-to-pay tracking

### Slice 2: AP Deep Operations (20+ endpoints)

**Service**: `ApDeepService` — `apps/api/src/modules/finance/services/ap-deep.service.ts`
**Controller**: `ApDeepController` — `@Controller('finance/ap-deep')`

- Invoice matching with tolerance rules (3-way match: PO x Receipt x Invoice)
- AP approval routing (configurable approval chains by amount/vendor/category)
- Vendor statement reconciliation (auto-match with AP transactions)
- Automated payment scheduling with cash position awareness

### Slice 3: Close Operations & SOX Compliance (18+ endpoints)

**Service**: `CloseOpsService` — `apps/api/src/modules/finance/services/close-ops.service.ts`
**Controller**: `CloseOpsController` — `@Controller('finance/close')`

- Close task templates and automation
- Close sign-off workflow with evidence
- Close status dashboard
- Fiscal year management with period breakdowns
- SOX control definition, testing, and documentation
- Journal entry approval workflow enhancement

### Slice 4: Project Accounting (15+ endpoints)

**Service**: `ProjectAccountingService` — `apps/api/src/modules/finance/services/project-accounting.service.ts`
**Controller**: `ProjectAccountingController` — `@Controller('finance/project-accounting')`

- Project budget setup and tracking
- Resource cost allocation to projects
- Project profitability reporting
- WIP (Work in Progress) reporting
- Project billing milestone tracking

### Slice 5: Prisma Schema Updates (if needed)

- Add `CloseTask` model (task templates for period close)
- Add `CloseTaskAssignment` model (task assignments with sign-off)
- Add `SoxControl` model (SOX control definitions)
- Add `SoxControlTest` model (SOX control test results)
- Add `FiscalYear` model (fiscal year with period breakdowns)
- Add `ProjectBudget` model (project-specific budget tracking)
- (Only if schema doesn't exist — check first)

### Slice 6: Register controllers in FinanceModule

- Wire all new controllers and services into `finance.module.ts`

### Slice 7: Unit Tests

- Test files for each new service
- Target: 3+ tests per service = 12+ total

### Slice 8: Frontend UI Tabs (if time permits)

- AR Deep tab for Finance tab layout
- AP Deep tab for Finance tab layout
- Close Ops tab for Finance tab layout (settings area)

## Acceptance Criteria

1. All new endpoints return real data (no stubs)
2. Zod validation on all POST/PATCH/PUT endpoints
3. `@Permissions()` decorator on all guarded endpoints
4. `@TrackChanges()` on mutation endpoints
5. Typecheck clean (`@unerp/api`, `@unerp/web`)
6. `pnpm architecture:check` clean
7. Unit tests passing
8. Feature ledger reflects new feature count

## Gate Tier

FAST (no data migrations, no auth/tenancy changes)
