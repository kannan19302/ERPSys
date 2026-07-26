# Implementation Plan — Cycle 46

## Phase & Scope

- **Phase**: M (Module strengthening)
- **Scope**: Fix all identified gaps across 5 core modules (Finance, CRM, HR, Inventory, Procurement) from the full Cycle 46 audit
- **Why**: Ensure end-to-end functionality — all backend services have matching frontend pages, all nav routes resolve, no dead schema models
- **Gate tier**: FAST

## Work Items

### Gap 1 (HR — Critical): Employee detail page at `/hr/employees/[id]/page.tsx`

- HR dashboard (`/hr/page.tsx`) calls `router.push('/hr/employees/' + row.id)` on row click
- Route `/hr/employees/[id]` does NOT exist → users cannot view individual employees
- **Fix**: Create detail page using `@unerp/framework` `FormView` + `useApiClient` pattern

### Gap 2 (Finance — High): Invoice detail page at `/finance/invoices/[id]/page.tsx`

- Finance dashboard (`/finance/page.tsx` line 769) calls `router.push('/finance/invoices/' + row.id)`
- Route `/finance/invoices/[id]` does NOT exist
- **Fix**: Create detail page showing invoice data, line items, payments, 3-way match, change history

### Gap 3 (Procurement — Medium): Approvals page at `/procurement/approvals/page.tsx`

- Tab already exists in `PROCUREMENT_TABS` but no page file exists
- Backend has `ProcurementApprovalsService` with ~12 endpoints (pending, history, stats, approve/reject, delegation, policy)
- **Fix**: Create approvals management page with pending queue, history, stats, policy settings, delegation

### Gap 4 (CRM — Medium): Fill ~30 empty CRM page directories

- ~30 sub-route directories under `/crm/` exist but have no `page.tsx` files
- These are: opportunities, cases, campaigns, products, price-books, ai-drafting, ai-intelligence, automation, coaching, coaching-deep, gamification, communication-deep, competitor-intelligence, forecasting, forecast-governance, intelligence, journey, partner-deep, partner-management, pipeline-deep, playbooks, reporting-deep, approvals, battlecards, commissions, documents, email-templates, forms, help-center, integrations, marketing-deep, marketing-outreach, portal-settings, activity-capture, account-hierarchy, account-plans
- **Fix**: Create minimal page.tsx in each with proper tab layout, resource integration, and permission guards

### Gap 5 (Procurement — Minor): Add missing nav tabs

- Contracts, Sourcing, Intelligence pages exist but have NO tab entries in `PROCUREMENT_TABS`
- **Fix**: Add tab entries in `ProcurementTabLayout.tsx`

## Duplicate-Check

- All 5 modules already at 1500+ features — this cycle fills UI gaps in existing modules
- No new Prisma models or backend endpoints needed

## Rollback Note

- All changes in source files only (pages + nav config); no schema/migration changes
- Rollback = revert commits

## Build Order

1. Create HR employee detail page
2. Create Finance invoice detail page
3. Create Procurement approvals page
4. Fill CRM empty page directories
5. Add missing Procurement nav tabs
6. Verify with `pnpm typecheck` api + web
