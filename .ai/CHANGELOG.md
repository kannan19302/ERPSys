# Changelog — Universal ERP System

> This file is maintained by AI agents and developers after completing work.
> Format: Newest entries at the top.

---

## [2026-06-18] Builder Studio — Phase 2 Complete (Data Import, Conditional Logic, Website CMS)

### Added
- **Conditional Logic Visual Builder**: Field inspector now has a 3-step visual condition editor — select field → select operator (equals/not/contains/greater/less) → enter value. Generates `visibilityRule` syntax automatically. Shows live preview of the generated rule.
- **Data Import Wizard** (`/builder/erp/data`): Full 3-step modal wizard (Select File → Map Columns → Confirm), KPI summary cards, import jobs table with status badges (COMPLETED/FAILED/IMPORTING/VALIDATING/PENDING), row counts, connected to live `/api/v1/builder/data-imports` API.
- **Forms List Connected to Live API**: Forms page now fetches from `/api/v1/builder/forms` and `/api/v1/builder/page-registries` instead of static mock data. Auto-refreshes on publish events.
- **Backend Pagination for Builder Forms**: `getForms()` now supports page/limit/search with standardized `{ data, meta }` paginated response format.

### Builder Properties Panel Structure (Final)
- General (label, name, description, placeholder, default, checkboxes)
- Layout & Appearance (column span, height, CSS class)
- Static Options / Content (for Select/Radio/Link/HTML/Table)
- Validation (min/max length, regex pattern)
- Conditional Logic (3-step visual builder with field/operator/value selectors)
- Computed Formula (auto-calculated expressions like `{qty} * {rate}`)
- Security / RBAC (read roles, write roles)
- Data Source (for dynamic Select/Radio/Link fields)
- Form-level: Webhooks (event-based HTTP callbacks) + JS Automations (Node VM sandbox scripts)

## [2026-06-18] Builder Studio — Comprehensive Enhancement (Forms, Workflows, Dashboards, Dynamic Rendering)

### Added
- **Dynamic Form Rendering Engine**: Created `DynamicForm.tsx` — runtime component that reads PageRegistry JSON layouts and renders live forms. Supports 17 field types, computed formulas (`{qty} * {rate}`), visibility rules (`eval:{status}==Open`), validation (required/min/max/regex), and 12-column responsive grid.
- **Builder Store — Undo/Redo + Duplicate**: Enhanced Zustand store with full history tracking (20 versions), `undo()`, `redo()`, `canUndo()`, `canRedo()`, `duplicateField()` methods. All mutations auto-push to history.
- **Backend Pagination for Builder Forms**: `getForms()` now supports page/limit/search with paginated response `{ data, meta }`.
- **Forms List Connected to Live API**: Forms page now fetches from `/api/v1/builder/forms` and `/api/v1/builder/page-registries` instead of hardcoded mock data.
- **Workflow List Page** (`/builder/erp/workflows`): Full page with CRUD, search, status toggle (ACTIVE/PAUSED), trigger badges, step counts, summary KPI cards. Connected to live API.
- **Dashboard List Page** (`/builder/erp/dashboards`): Full page with CRUD, search, widget counts, refresh rate display, status badges, summary KPI cards. Connected to live API.

## [2026-06-18] Phase 11–20 Advanced Features — Comprehensive Backend Enhancement

### Added
- **Shared Validators Expansion (Phase 1)**:
  - Added `bulkActionSchema`, `bulkActionResultSchema`, `exportSchema` for cross-module bulk operations and data export
  - Added `paginationSchema`, `paginatedResponseSchema`, `dateRangeSchema` for standardized paginated queries
  - Added `updateInvoiceSchema`, `updatePurchaseOrderSchema`, `updatePurchaseReturnSchema`, `updateOrganizationSchema`, `updateCustomerSchema` — previously missing update DTOs
  - Added `createWarehouseSchema`, `updateWarehouseSchema`, `createDepartmentSchema`, `updateDepartmentSchema`, `createRoleSchema`, `updateRoleSchema` — previously missing entity DTOs
  - Added `updateEmployeeSchema`, `updateVendorSchema`, `updateContactSchema`, `updateProjectSchema`, `updateTaskSchema` — enabling partial updates
  - Added status enums: `invoiceStatusEnum`, `purchaseOrderStatusEnum`, `salesOrderStatusEnum`, `projectStatusEnum`, `employeeStatusEnum`
  - Enhanced `createPurchaseReturnSchema` with `unitPrice`, `taxRate`, `purchaseReceiptId`, `reason` fields
  - Added `createPurchaseOrderSchema` with `shippingAddress` field support
  - Total: ~250 lines of new validation schemas added

- **Common Backend Utilities (Phase 1b)**:
  - Created `apps/api/src/common/utils/pagination.util.ts` with `buildPaginationValues()`, `buildOrderBy()`, `paginatedResult()`, `resolveOrgId()` helpers
  - All pagination utilities support page/limit/sort/search/filter parameters
  - Standardized paginated response format: `{ data: [...], meta: { page, limit, total, totalPages } }`

- **Finance Module Enhancement (Phase 2)**:
  - Added `getInvoiceById()` — single invoice detail with customer info, line items, payments
  - Added `updateInvoice()` — edit DRAFT invoices with line item replacement logic
  - Added `deleteInvoice()` — soft delete with status validation (can't delete PAID)
  - Added `sendInvoice()` — status transition DRAFT→SENT with sentAt timestamp
  - Added `voidInvoice()` — status transition with validation
  - Added `bulkAction()` — batch delete/send/void/update-status operations
  - Added `getPayments()` — payment history for specific invoice
  - Added `getInvoiceStats()` — KPI data (total, paid, overdue, revenue, payment rate)
  - Enhanced `getInvoices()` with pagination, sorting, search, status/customer filtering
  - Enhanced `createPayment()` with status validation (can't pay void/cancelled)
  - Added event emission: `finance.invoice.created`, `finance.invoice.sent`, `finance.payment.received`
  - Controller: 13 new endpoints, standardized pagination query params

- **HR Module Enhancement (Phase 3)**:
  - Added `getEmployeeById()` — single employee detail with department
  - Added `updateEmployee()` — partial update with all employee fields
  - Added `deleteEmployee()` — soft delete with TERMINATED status
  - Added `bulkAction()` — batch delete/update-status operations
  - Added `getDepartments()` — department list with employee counts
  - Added `getEmployeeStats()` — KPI data (total, active, on leave, terminated, active rate)
  - Enhanced `getEmployees()` with pagination, sorting, search, status/department filtering
  - Added event emission: `hr.employee.onboarded`
  - Controller: 8 new endpoints

- **Inventory Module Enhancement (Phase 4)**:
  - Added `getProductById()` — product detail with warehouse stock and usage counts
  - Added `updateProduct()` — partial update with all product fields
  - Added `deleteProduct()` — soft delete with isActive=false
  - Added full Warehouse CRUD: `getWarehouses()`, `getWarehouseById()`, `createWarehouse()`, `updateWarehouse()`, `deleteWarehouse()` — all with pagination
  - Added `getStockLevels()` — warehouse stock with pagination and product/warehouse filtering
  - Added `bulkAction()` — batch delete operations
  - Added `getInventoryStats()` — KPI data (total/active products, warehouses, low stock alerts)
  - Enhanced `getProducts()` with pagination, sorting, search, type/category filtering
  - Controller: 15 new endpoints

- **Procurement Module Enhancement (Phase 5)**:
  - Enhanced `getPurchaseOrders()` with pagination, sorting, search, status/vendor filtering
  - Added `createPurchaseReturn()` with debit note auto-creation (previously referenced but incomplete)
  - Added event emission: `procurement.receipt.created`, `procurement.return.created`
  - Added `auto-reorder event listener` (`procurement.order.reorder`) — automatically creates POs when stock is low
  - Controller: all appropriate endpoint signatures updated

### Updated Documentation
- Updated `.ai/MODULE_REGISTRY.md` to reflect enhanced module capabilities
- `.ai/CHANGELOG.md` updated with this entry

### Technical Details
- All modules use the common `PaginationParams`, `PaginatedResult` interfaces and utilities
- All paginated endpoints return `{ data: [...], meta: { page, limit, total, totalPages } }` format
- Domain events follow `module.entity.action` naming convention (e.g., `hr.employee.onboarded`)
- Bulk operations support `{ action, ids, data? }` format per API standards
- TypeScript strict mode maintained throughout — no `any` types in exposed interfaces

---

## [2026-06-14] Modules 3–13 Gap Features & Sidebar Navigation Rollout

### Added
- **Sidebar Integration**: Registered 11 advanced feature routes in the global navigation menu (`layout.tsx`):
  - Predictive Analytics (`/analytics/predictive`) and Advanced BI (`/analytics/advanced`)
  - Advanced Document Mgmt (`/documents/advanced`)
  - Storage & Templates Pro (`/storage/advanced`)
  - Advanced Messaging & Threading (`/communication/advanced`)
  - Advanced POS Features (`/pos/advanced`)
  - Advanced Workflow Engine (`/workflows/advanced`)
  - Security Control Hub (`/admin/security`)
  - App Marketplace (`/admin/marketplace`)
  - API Integration Hub (`/admin/api-platform`)
- **Walkthrough & Tasks**: Generated comprehensive Walkthrough documentation and updated Task lists.

### Fixed
- **ESLint & Unused Imports**: Resolved unused-import warnings in numerous pages
- **TypeScript Type Safety**: Resolved strict type errors across analytics, storage, and other modules
- **Production Build Success**: Successfully compiled and bundled the Next.js frontend without ESLint or TS warnings

---

## [2026-06-14] Module 2: Project Management Gaps Implementation

### Added
- **Database Models & Schema**: `ProjectPortfolio`, `ProjectRisk`, `ChangeRequest` models
- **Backend NestJS APIs**: Portfolio Management, Risk Register, Change Request tracking, EVM Calculator, auto-billing
- **Next.js Frontend Pages**: Strategic Portfolio Hub, Stakeholder Portal, tabbed Projects view, Resource Workloads

---

## [2026-06-14] Module 1: Human Resources (HR) Gaps Implementation

### Added
- **Database Models**: `OfferLetter`, `BenefitScheme`, `EmployeeBenefit`, `SkillRequirement`, `Position`, `ComplianceCheck`, `TaxTable`, `HolidayCalendar`
- **Backend APIs**: Biometric/RFID, overtime calc, compliance scanner, tax brackets, offer letters
- **Frontend Pages**: Self-Service Portal, Benefits Admin, Labor Compliance, Positions, Skills Matrix, Holidays, enhanced Leave/Payroll/Recruitment

---

## [2026-06-14] Cross-Module Advanced Features & MES Rollout

### Added
- **Database Tables**: `Campaign`, `SalesReturn`, `PurchaseReturn`, extended fields for projects, manufacturing, POS
- **Shared Layer**: Zod validators for Campaigns, Returns, POS receipts, API platforms
- **Backend APIs**: Marketing Campaigns, Lead Scoring, Returns with Credit/Debit notes, OEE logging, CPM, SLA engine, receipt templates, presigned S3 URLs
- **Frontend Pages**: Manufacturing diagnostics, Project CPM, POS receipt designer, Visual Query Builder, Workflow editor, API Keys console, Campaigns, Returns

---

## [2026-06-13] Sales & Orders Module Implementation

### Added
- **Database**: Sales channels, payment methods/status fields
- **Backend**: B2B credit limit validation, quotation-to-order conversion
- **Frontend**: Sales dashboard, Quotations workspace, Sales Orders hub, Delivery Notes

---

## [2026-06-13] Advanced Inventory & Stock Control

### Added
- **Database**: `StockLedgerEntry`, `StockEntry`, `QualityInspection`
- **Backend**: Material slip transaction logic, moving average costing, quality inspections
- **Frontend**: 8 tabbed views (Stock Entries, Ledger, Valuations, QA, Serial Numbers, etc.)

---

## [2026-06-13] CRM Advanced Features

### Added
- **Database**: 7 new models (Contact, LeadSource, Lead, SalesPipeline, Opportunity, Activity, EmailTemplate)
- **Backend**: ~50 new endpoints across CRM controller
- **Frontend**: 14 pages including Kanban boards (Leads, Opportunities), detail pages, advanced CRM hub

---

## [2026-06-10] Phase 0 — Foundation Completion

### Added
- **Monorepo Scaffold**: Turborepo + pnpm, shared packages, NestJS backend, Next.js frontend
- **Multi-Tenancy**: PostgreSQL RLS, Prisma middleware, tenant context
- **Authentication**: JWT, RBAC guards, login/register flows
- **Administration**: User/role management, settings, navigation
- **Unit Testing**: Vitest setup, service mocks

---