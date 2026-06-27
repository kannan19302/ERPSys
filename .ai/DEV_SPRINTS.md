# UniERP Development Sprints

> **Strategy**: Complete each module FULLY (features + fixes + UI + tests) before moving to next.
> **Last updated**: 2026-06-27

---

## Sprint 1: Admin Module (Wave 1, App #1) — COMPLETED
**Status**: DONE | **Commits**: `2989079`
**Dates**: 2026-06-27

### Deliverables
- [x] Admin Dashboard overhaul — KPI cards, activity feed, system health sidebar, sparklines, donut chart
- [x] User Management — DataTable, Modal invite, Drawer details, ConfirmDialog suspend
- [x] Access Control (3 pages) — Roles with permission progress bars, Permission Matrix with tooltips, Access Packages with DataTable
- [x] Security Hub — KPI overview, linked sub-page cards, alert DataTable
- [x] SSO Config — Tabs OIDC/SAML, TextField/FormField
- [x] MFA Settings — Status banner, toggle options, method selector
- [x] Audit Trail — DataTable with severity badges, search + filter, Pagination
- [x] General Settings — SettingsSection cards, Tabs, autosave badges
- [x] Workflows — KPI cards, DataTable workflows/approvals, sub-page grid
- [x] System Health — Status banner, Sparkline charts, service status cards
- [x] Data Import — Stepper wizard, drag-drop upload, column mapping, validation
- [x] API Keys — DataTable, Modal create, scope checkboxes, ConfirmDialog
- [x] Module Manager — Toggle switches, icon grid, search filter

### Metrics
- 18 pages overhauled
- -842 net lines (cleaner code using design system)

---

## Sprint 2: Finance Module (Wave 1, App #2) — COMPLETED
**Status**: DONE | **Commits**: `2989079`, `eaeac95`, `0d6d264`
**Dates**: 2026-06-27

### Deliverables

#### UI Overhaul (3 pages)
- [x] Finance Dashboard — DataTable invoices, Modal create/payment, status filters, advanced links grid
- [x] Chart of Accounts — Tree view with KPI summary, type filters, expand/collapse
- [x] Advanced Finance hub — Fix duplicate CSS property, remove Coming Soon badges

#### New Feature Implementation (11 pages)
- [x] Recurring Invoices — Schedule management, frequency config, generate button + backend CRUD
- [x] Revenue Recognition — Deferred revenue schedules, progress tracking
- [x] Bank Reconciliation — Statement import, auto-match, match/unmatch UI
- [x] Expense Management — Employee expense reports, approval workflow
- [x] Cash Position — Real-time bank balance aggregation, daily cash flow chart
- [x] Cash Flow Forecast — 6-month rolling projections, inflow/outflow breakdown, warning alerts
- [x] Finance Audit Trail — Entity-level change tracking with diff view
- [x] Account Reconciliation — GL vs sub-ledger matching, variance detection
- [x] Multi-Currency / Exchange Rates — Rate management with API integration
- [x] Financial Ratios — 10 key ratios with benchmarks and trend charts
- [x] Consolidation — Multi-entity P&L, quarterly trend, entity overview

#### Sidebar Navigation
- [x] Add all 11 new pages to sidebar
- [x] Remove all "Coming Soon" badges
- [x] Zero 404 links

#### Bug Fixes
- [x] Fix exchange-rates runtime error (rate string → Number conversion)

### Metrics
- 25 total Finance pages (was 14)
- 0 Coming Soon stubs remaining (was 11)
- 0 404 risks

---

## Sprint 3: HR Module (Wave 1, App #3) — IN PROGRESS
**Status**: STARTING | **Target**: Next session
**Dates**: 2026-06-27+

### Scope
1. Audit current HR pages — identify all pages, stubs, missing features, bugs
2. UI overhaul of existing pages with design system components
3. Implement missing features:
   - Org chart visualization
   - Leave calendar (drag to apply)
   - Attendance heatmap
   - Employee onboarding wizard
   - Self-service portal
   - Payroll processing improvements
   - Shift scheduling UI
   - Training & development tracking
4. Wire any backend endpoints missing frontend
5. Add new pages to sidebar navigation
6. Fix all type errors and runtime bugs
7. Verify end-to-end with live data

### Pre-requisites
- Finance module complete (payroll integration)

---

## Sprint 4: CRM Module (Wave 2, App #4) — PLANNED
**Status**: PLANNED

### Scope
- Pipeline kanban with drag-drop stages
- Contact timeline
- Email sequence builder
- Territory map
- Forecast charts
- Full UI overhaul

---

## Sprint 5: Inventory Module (Wave 2, App #5) — PLANNED
**Status**: PLANNED

### Scope
- Warehouse floor plan view
- Stock level gauges
- Barcode scanner UI
- Batch/serial tracking panels
- Reorder point alerts

---

## Sprint 6: Sales Module (Wave 2, App #6) — PLANNED
**Status**: PLANNED

### Scope
- Quote builder with line-item editor
- Order lifecycle tracker
- Delivery scheduling calendar
- Return wizard

---

## Sprint 7: Procurement Module (Wave 2, App #7) — PLANNED
**Status**: PLANNED

### Scope
- Vendor comparison matrix
- PO approval workflow UI
- Goods receipt with photo capture
- RFQ response tracker

---

## Sprint 8-11: Operations (Wave 3) — PLANNED
**Status**: PLANNED

- Sprint 8: Manufacturing — BOM tree editor, production Gantt, work order kanban
- Sprint 9: Supply Chain — Shipment tracking map, carrier rates, demand forecast
- Sprint 10: Projects — Gantt with dependencies, resource heatmap, timesheet grid
- Sprint 11: POS — Touch terminal UI, product grid, split payment, receipt designer

---

## Sprint 12-18: Verticals & Platform (Wave 4) — PLANNED
**Status**: PLANNED

- Sprint 12: Education — Student dashboard, course catalog, timetable, grade book, LMS
- Sprint 13: Healthcare — Patient timeline, appointments, clinical forms, prescriptions
- Sprint 14: Real Estate — Property gallery, lease timeline, construction tracker
- Sprint 15: Field Service — Dispatch board, technician calendar, mobile work orders
- Sprint 16: Connect — Chat UI, channels, video calls, notifications
- Sprint 17: Analytics — Dashboard builder, report designer, scheduled reports
- Sprint 18: Builder/Marketplace — Form builder, template gallery, app publishing

---

## Architecture Notes

### UI Pattern Checklist (apply to every module)
1. **List views** — DataTable with column toggling, bulk actions, saved views
2. **Detail views** — Tabbed layout, activity timeline, related records sidebar
3. **Create/Edit** — Multi-step wizard for complex entities, inline validation, autosave
4. **Dashboards** — KPI cards with drill-down, configurable charts, date range picker
5. **Empty states** — Illustrated empty states with quick-action CTAs
6. **Modals** — Use `Modal` from @unerp/ui, not hand-rolled overlays
7. **Forms** — Use `TextField`/`FormField`/`Select` from @unerp/ui
8. **Navigation** — Use `Tabs` for sub-page navigation, `Pagination` for lists

### Design System Components Available
- `DataTable`, `Modal`, `ConfirmDialog`, `Drawer`
- `TextField`, `FormField`, `Input`, `Textarea`, `Select`
- `Tabs`, `Pagination`, `Stepper`, `ViewSwitcher`
- `KPICard`, `DashboardKPICard`, `DashboardChart`
- `Sparkline`, `MiniBarChart`, `MiniDonutChart`
- `Badge`, `StatusBadge`, `EmptyState`
- `Card`, `PageHeader`, `Spinner`, `Skeleton`
- `KanbanBoard`, `DrillDownModal`, `ChartTypePicker`

### Services Stack
- **Infra**: Postgres (5432), Redis (6379), MinIO (9000) via Docker
- **API**: NestJS on port 3001
- **Web**: Next.js 15 on port 3000
- **Launch config**: `.claude/launch.json` (infra, api, web)
