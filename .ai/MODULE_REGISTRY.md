# Module Registry — Universal ERP System

> This file tracks every ERP module, its status, dependencies, and responsible team/agent.
> AI agents MUST update this file when creating or modifying modules.

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
| 1 | **Admin** | `apps/api/src/modules/admin` | 🟢 ACTIVE | 0 | auth, database | Tenant, User, Role, Permission, Setting, Workflows, Localization, Sync, DevOps, Super Admin. P0-1 (dead fine-grained RBAC decorator-stacking bug) fixed. P0-2 (automation rules) now has a real trigger→condition→action runtime: `AutomationRuleEngineService` listens for real domain events (`sales.order.confirmed`, `sales.delivery.created`, `sales.return.*`, `procurement.receipt.created`, `procurement.return.created`, `finance.invoice.*`, `finance.payment.received`, `hr.employee.onboarded`), loads ACTIVE rules per tenant, evaluates conditions (shared logic extracted from `testRule`), and executes `notify`/`email` actions for real (`notification.send` event + real BullMQ `email` queue job), recording `SUCCESS`/`SKIPPED`/`FAILED` execution rows — DRAFT rules stay inert. P1-1 partially closed: backups remain simulated but are now honestly labeled `source: 'SIMULATED'` in the API response (real `pg_dump` needs devops sign-off, deferred); backup create/read endpoints moved behind a new Super-Admin-only `system.operations.backup` permission (`@SkipTenantScope()`); `BackgroundJob` rows are now correlated with real BullMQ jobs via `bullJobId` (see `job-tracking.util.ts`), `EmailProcessor`/`ExportProcessor` sync job status on real worker lifecycle events, and `OperationsService.retryJobs` re-enqueues into the real BullMQ queue by `queueName` instead of only flipping a DB flag; see `.ai/ADMIN_MODULE_COMPLETION_REQUIREMENTS.md`. UAT PASSED 2026-07-02 (see `.ai/ADMIN_UAT_SIGNOFF.md`): RBAC regression sweep, seed wildcard non-breaking, automation engine edge-case fix, and honest backups labeling all independently verified. |
| 2 | **Finance & Accounting** | `apps/api/src/modules/finance` | 🟢 ENHANCED | 1 | admin, database | Invoice, Payment (paginated, bulk ops, send/void, events, stats, KPI) |
| 3 | **Human Resources** | `apps/api/src/modules/hr` | 🟢 ENHANCED | 1 | admin, finance | Employee (paginated, detail, update, bulk ops, events, stats, KPI), Department management |
| 4 | **CRM & Sales** | `apps/api/src/modules/crm` | 🟢 ENHANCED | 1 | admin | Contact, Lead, Opportunity, Activity, Pipeline, LineItem, PriceBook, ContactTag, SalesTarget, SavedReport, WorkflowRule, EmailSequence, Territory, Commission, WebForm, Document, CustomField, RecordType, ApprovalProcess, QuotationTemplate, QuotationSignature, Comment, Note, Follower, Playbook, Battlecard, Dashboard |
| 5 | **Inventory & Warehouse** | `apps/api/src/modules/inventory` | 🟢 ENHANCED | 1 | admin | Product (paginated, detail, update, bulk ops), Warehouse (full CRUD), Stock Levels, Inventory Stats |
| 6 | **Procurement** | `apps/api/src/modules/procurement` | 🟢 ENHANCED | 2 | admin, finance, inventory, crm | Vendor, PurchaseOrder, PurchaseReceipt, RFQ, GoodsReceipt, PurchaseRequisition, BlanketPurchaseAgreement |
| 7 | **Sales & Orders** | `apps/api/src/modules/sales` | 🟢 ACTIVE | 2 | admin, finance, inventory, crm | Quotation, SalesOrder, DeliveryNote, Return, SalesPipeline |
| 8 | **Supply Chain** | `apps/api/src/modules/supply-chain` | 🟢 ACTIVE | 2 | inventory, procurement, sales | Shipment, Carrier, Route, DemandForecast |

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
| 16 | **Advanced Finance** | `apps/api/src/modules/finance` (ext) | 🟢 ACTIVE | 6 | finance, sales, procurement | ChartOfAccounts, GeneralLedger, BankRecon, Budget, TaxReturn |
| 17 | **Advanced HR** | `apps/api/src/modules/hr` (ext) | 🟢 ACTIVE | 7 | hr, finance | PayrollRun, LeavePolicy, ShiftSchedule, Appraisal, Training |
| 18 | **Workflow Engine** | `apps/api/src/modules/admin` (ext) | 🟢 ACTIVE | 8 | all modules | Workflow, WorkflowStep, ApprovalChain, Delegation, SLA (consolidated into Admin app) |
| 19 | **Notifications** | `apps/api/src/modules/notifications` | 🟢 ACTIVE | 9 | communication, workflow | NotificationChannel, Preference, Digest, WebSocketEvent |
| 20 | **File Storage** | `apps/api/src/modules/documents` (ext) | 🟢 ACTIVE | 10 | drive | File, Bucket, DocumentTemplate, GeneratedDocument (consolidated into Drive app) |
| 21 | **Advanced Reporting** | `apps/api/src/modules/reporting` | 🟢 ACTIVE | 11 | analytics, finance | DashboardLayout, Widget, SavedView, ScheduledReport |

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
| 27 | **i18n & Localization** | `packages/i18n` | 🟢 ACTIVE | 17 | all UI modules | Translations, RTL, Date/Currency formats |
| 28 | **Mobile & PWA** | `apps/web` (enhancement) | 🟢 ACTIVE | 18 | all UI, i18n | Responsive, PWA, Offline mode |
| 29 | **DevOps & Monitoring** | `infra/` | 🟢 ACTIVE | 19 | all modules | CI/CD, Docker, K8s, Logging, APM |
| 30 | **SaaS Platform** | `apps/api/src/modules/saas` | 🟢 ACTIVE | 20 | all modules | Billing, Metering, Marketplace |

---

## Cross-Cutting Modules

| # | Module | Package Path | Status | Phase | Dependencies | Key Features |
|:--|:---|:---|:---|:---|:---|:---|
| 31 | **Studio** | `apps/api/src/modules/builder` | 🟢 ENHANCED | 0–10 | admin, database | Zero-code form/page/dashboard/workflow builder, Page Registry, Schema Registry, Custom Records, dynamic rendering, deploy-to-app wizard, field-level RBAC, server-side webhooks & scripts, app overview dashboard, publish scopes, sandbox simulator test platform, **app releases (immutable snapshots) + semantic versioning + rollback, App Marketplace with provision-on-install (built apps published to App Store), `AppRelease` model, Web Studio CMS Collections (dynamic content types: products/projects/team/testimonials/blog), public content + form-submission API, `WebCollection`/`WebCollectionItem`/`WebFormSubmission` models** |


---

## Shared Packages

| Package | Path | Status | Description |
|:---|:---|:---|:---|
| **@unerp/database** | `packages/database` | 🟢 ACTIVE | Prisma schema, client, migrations |
| **@unerp/shared** | `packages/shared` | 🟢 ACTIVE | Types, validators, constants, utilities |
| **@unerp/ui** | `packages/ui` | 🟢 ACTIVE | Design system, components, tokens |
| **@unerp/auth** | `packages/auth` | 🟢 ACTIVE | Authentication providers, RBAC, guards |
| **@unerp/config** | `packages/config` | 🟢 ACTIVE | ESLint, TypeScript, Prettier configs |

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

