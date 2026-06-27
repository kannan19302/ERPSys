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

## Sprint 3: HR Module (Wave 1, App #3) — COMPLETED (already built)
**Status**: DONE (pre-existing) | **Verified**: 2026-06-27

### Audit Result
HR module was already fully complete:
- 25 pages, all functional with real API integration
- 90+ backend endpoints across hr + advanced-hr controllers
- 27 Prisma models covering full employee lifecycle
- All pages use @unerp/ui design system components
- All sidebar links active, zero 404s, zero stubs
- No "Coming Soon" badges

### Key Features Verified
- Employee directory with search/filtering and KPI drill-down
- Recruitment pipeline, onboarding/offboarding checklists
- Payroll with salary registry, tax brackets, payroll runs
- Leave management with policy configuration
- Performance (goals, appraisals, 360° feedback, succession)
- Attendance, shifts, training, benefits, skills matrix
- HR helpdesk, engagement surveys, compliance tracking

---

## Sprint 4: CRM Module (Wave 2, App #4) — COMPLETED
**Status**: DONE | **Commits**: 2026-06-27
**Dates**: 2026-06-27

### Audit Result
CRM was already mostly complete (33 pages, 100+ endpoints). Enhanced 4 stub pages:

### Deliverables
- [x] Quotations: full DataTable, KPI cards, status filters, create Modal with line items, detail view
- [x] Sales Orders: DataTable, KPI cards, status filters, detail Modal
- [x] Vendors: DataTable, KPI cards, Modal create with proper FormField/Select
- [x] Email Templates: DataTable, preview Modal, create Modal with variable reference, category badges

### Metrics
- 33 total CRM pages (4 enhanced from stubs)
- 100+ backend endpoints (all wired)
- Zero 404s, zero type errors

---

## Sprint 5: Inventory Module (Wave 2, App #5) — COMPLETED (already built)
**Status**: DONE (pre-existing) | **Verified**: 2026-06-27

### Audit Result
14 pages, all functional (147-658 lines each), no stubs, no Coming Soon.
Full sidebar with Material Transactions, Quality & Control, Storage & Audit sections.
KPI cards, charts, product detail pages, stock entries, cycle counts, QA inspections.

---

## Sprint 6: Sales Module — COMPLETED (already built)
**Status**: DONE (pre-existing) | **Verified**: 2026-06-27
5 pages, full sidebar, KPI cards. Quotations, Sales Orders, Delivery Notes, Returns.

---

## Sprint 7: Procurement Module — COMPLETED (already built)
**Status**: DONE (pre-existing) | **Verified**: 2026-06-27
11 pages, KPI cards, List/Chart/Kanban views. Requisitions, POs, GRN, RFQs, Supplier Bids.

---

## Sprint 8: Manufacturing Module — COMPLETED (already built)
**Status**: DONE (pre-existing) | **Verified**: 2026-06-27
7 pages. BOM, work orders, production plans, routings, quality.

## Sprint 9: Projects Module — COMPLETED (already built)
**Status**: DONE (pre-existing) | **Verified**: 2026-06-27
5 pages. Projects, tasks, timesheets, Gantt, budgets.

## Sprint 10: POS Module — COMPLETED (already built)
**Status**: DONE (pre-existing) | **Verified**: 2026-06-27
10 pages. Terminals, registers, shifts, sales, cash management.

---

## Sprint 11: Supply Chain Module — NEEDS WORK
**Status**: IN PROGRESS
1 page only. Needs: shipment tracking, carrier management, demand forecast, route optimization.

## Sprint 12-18: Verticals & Platform (Wave 4) — NEEDS WORK
**Status**: PLANNED — These modules have 0-2 pages each and need full implementation.

- Sprint 12: Education (1 page) — Student dashboard, course catalog, timetable, grade book, LMS
- Sprint 13: Healthcare (0 pages) — Patient timeline, appointments, clinical forms, prescriptions
- Sprint 14: Real Estate (1 page) — Property gallery, lease timeline, construction tracker
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
