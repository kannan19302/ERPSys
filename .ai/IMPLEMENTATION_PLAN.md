# Implementation Plan — Cycle 45

## Phase & Scope

- **Phase**: M (Module strengthening)
- **Cycle**: 45
- **Focus**: 5 Core Modules — UI type error remediation & backend registration fixes
- **Why**: All 5 core modules (Finance, CRM, HR, Inventory, Procurement) already have 1500+ features per feature ledger. However, the frontend UI pages (especially CRM) have ~200+ TypeScript compilation errors due to API mismatches with the `@unerp/ui` library. These must be fixed to achieve zero-stub, fully-wired UI across all modules. Additionally, minor backend registration issues need fixing.

## Scope (Work Items)

### Backend Fixes

1. **Inventory**: Remove duplicate `DemandForecastingController`/`DemandForecastingService` from `inventory.module.ts` (already registered in `demand-forecasting.module.ts`)
2. **Procurement**: Register `ProcurementSettingsController` from `settings.controller.ts` in `procurement.module.ts`

### Frontend Type Error Categories (CRM UI pages)

1. **Column<T>** — Add missing type argument to all `Column` usages
2. **DataTable props** — Remove `pageSize`, `page`, `totalPages` (not DataTable props); use proper pagination
3. **PageHeader** — Replace `subtitle` → `description`, `breadcrumb` → `breadcrumbs`
4. **Badge** — Replace `"muted"` → `"default"`, `"error"` → `"danger"`, `"secondary"` → `"default"`
5. **Card** — Replace `hoverable` → `hover`
6. **Modal** — Add `open` prop where missing
7. **ToastApi** — Replace `addToast()` → `toast.success()`, `toast.error()`, etc.
8. **KPICard/DashboardKPICard** — Fix `trend` from `{value, isPositive}` → `number[]`
9. **ProtectedComponent** — Remove `module` prop
10. **api import** — Fix `@unerp/shared` `api` import → use correct source
11. **apiDelete** — Fix import path
12. **Column render** — Use `key`+`header`+`render(row, index)`, not `accessor`
13. **Cell renderers** — Fix from `(value, row)` to `(row, index)` signature
14. **Switch** — Replace with styled checkbox or `ViewSwitcher` as appropriate

### Duplicate-Check against Feature Ledger

- All 5 modules already at 1500+ (Finance 1634, CRM 1508, HR 1818, Inventory 1588, Procurement 1530)
- No new features being added — this cycle is about fixing compilation errors in existing UI pages

## Gate Tier

- **FAST** — No risky surfaces (all changes are in frontend TypeScript files and minor backend registrations)

## Rollback Note

- All changes are in source files only; no schema/migration changes. Rollback = revert commits.

## Build Order

1. Fix backend registration issues (Inventory + Procurement)
2. Fix CRM UI type errors (category by category)
3. Verify with `pnpm typecheck` across all packages
