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
| 33 | **E-Commerce Storefront** | `apps/api/src/modules/ecommerce` | 🟢 ACTIVE (full stack) | new | inventory, sales, finance, crm | StorefrontConfig, StorefrontCategory, ProductListing, Cart, CartItem, StorefrontOrderPayment. Public-facing catalog/cart/checkout on top of existing Product/SalesOrder/Invoice — see `.ai/ECOMMERCE_MODULE_REQUIREMENTS.md` for full MVP spec. **Backend API complete** (backend-developer, 2026-07-03): data layer from the prior session unchanged. Two controllers: `EcommerceAdminController` (`/ecommerce/*`, JWT+RBAC-gated, new `ecommerce.storefront.{read,manage}` / `ecommerce.category.*` / `ecommerce.listing.*` / `ecommerce.order.read` permissions registered in `packages/shared/src/permissions/registry.ts`) covers StorefrontConfig upsert, StorefrontCategory CRUD, and ProductListing CRUD (validates `productId` belongs to the tenant's own `Product` before linking; joins Product+Category for the admin list view) — all mutation endpoints carry `@TrackChanges`+`ChangeHistoryInterceptor`. `EcommercePublicController` (`store/:tenantSlug/*`) is **intentionally unauthenticated** — no `@Permissions()`, guarded only by the new `PublicTenantResolverGuard` (`apps/api/src/modules/ecommerce/guards/public-tenant-resolver.guard.ts`), which resolves `:tenantSlug` → `StorefrontConfig.storeSlug` (404 if missing/disabled) and stamps a synthetic `request.user = { tenantId, userId: 'storefront-guest' }` so the existing global `TenantInterceptor`/`AsyncLocalStorage` tenant-scoping mechanism (`packages/database/src/tenant-context.ts`) activates exactly as it does for JWT-authenticated requests — no parallel scoping mechanism was built. Covers config/categories/products (published-listings-only, paginated, category filter)/cart CRUD (server-persisted `Cart`/`CartItem`, price-snapshotted at add-time, quantity merge on repeat add)/checkout. Checkout (`EcommerceCheckoutService`) validates the cart, finds-or-creates a guest `Customer` by tenant+email, calls the new `PaymentGatewayAdapter` interface (`apps/api/src/modules/ecommerce/payments/payment-gateway.interface.ts`) — implemented by `MockPaymentGatewayService` (unmistakably labeled MOCK in class name/logs/`provider: 'mock_gateway'` field, supports a `simulateDecline` test lever) — then calls the **new** `SalesService.createConfirmedOnlineOrder()` (added to `apps/api/src/modules/sales/sales.service.ts`, reusing the extracted `persistSalesOrderTransaction` helper shared with `createSalesOrder`) to create a real `SalesOrder`+`SalesOrderItem`s (`salesChannel = 'ONLINE'`, `status = 'CONFIRMED'`, `paymentStatus = 'PAID'`) and synchronously emit `sales.order.confirmed` — a gap in the existing order-creation path where auto-confirmed orders never fired that event was fixed for this entry point only, not touching `createSalesOrder`'s behavior. On success, records a `StorefrontOrderPayment` (status `SUCCEEDED`) and marks the `Cart` `CONVERTED`; on decline, no `SalesOrder`/`StorefrontOrderPayment` row is created (the FK from `StorefrontOrderPayment.salesOrderId` to `SalesOrder` is required/non-null, so a failed pre-order attempt can't be persisted as an orphaned payment row — logged instead, a documented deviation from a literal "record a FAILED payment row" reading) and the cart stays `ACTIVE` for retry. Coverage specs (`apps/api/src/modules/ecommerce/tests/*.coverage.spec.ts`, 30 tests) cover admin CRUD + tenant-isolation, public catalog/cart, checkout happy/decline/empty-cart paths, the guard's 404 behavior, and a metadata-level proof the public controller carries neither `JwtAuthGuard`/`RbacGuard` nor `@Permissions()`. `pnpm --filter @unerp/api typecheck` and the full ecommerce+sales test suites pass. **Frontend complete** (frontend-developer, 2026-07-03): admin pages `apps/web/app/(dashboard)/ecommerce/{page.tsx,categories/page.tsx,listings/page.tsx}` (config with an empty-state "Get started" flow, DataTable+Modal Categories CRUD, Listings screen with a debounced searchable Inventory-product picker/category assign/publish toggle/price override, every action gated by `<ProtectedComponent permission="ecommerce.*.*">`); public storefront `apps/web/app/(storefront)/store/[tenantSlug]/{page.tsx,products/[listingId]/page.tsx,cart/page.tsx,checkout/page.tsx}` plus `apps/web/app/(storefront)/layout.tsx` (plain wrapper, no nested html/body, no dashboard chrome) and `apps/web/app/(storefront)/lib/{storefront-api.ts,cart-session.ts}` (unauthenticated fetch helper + localStorage `sessionToken` persistence per `storefront_cart_{tenantSlug}`, transparent re-create on a 404'd/expired cart). Fixed a pre-existing bug where the admin config/categories pages destructured `useToast()` as `{ showToast }` and passed `variant: 'danger'` — neither exists on the real `useToast()` API (`{ toast, success, error, warning, info, dismiss }`, variants `'success'|'error'|'warning'|'info'`); switched both to `toast.success(...)`/`toast.error(...)`. **Also fixed a real backend bug found during verification**, in a shared cross-cutting file outside the ecommerce/sales/database boundary: `apps/api/src/common/middleware/csrf.middleware.ts`'s global CSRF check 403'd every `/store/:tenantSlug/*` write (cart create/add-item/checkout) because its skip-list only exempted `/auth/login`, `/auth/register`, and `/public/` paths, never the storefront's documented unauthenticated routes; added a matching bypass for `/store/` paths. Verified end-to-end in the browser: enabled the storefront (slug `system`), browsed two published listings on `/store/system` with correct currency formatting and category filtering, added to cart, edited quantity, checked out with a valid shipping address (`201`, real `orderNumber` e.g. `ONL-1783089914253-869`, cart token cleared from localStorage), and confirmed the decline path (`simulateDecline: true` via direct API call) returns `400` with the spec's exact message, creates no `SalesOrder`, and leaves the cart `ACTIVE` for retry. `pnpm --filter web typecheck` and `pnpm --filter @unerp/api typecheck` both clean. **Not yet built**: real payment gateway (Stripe), Sales Orders list channel filter UI (Flow D), decline-simulation UI toggle (optional bonus per spec — verified via direct API call instead). |
| 32 | **AI** | `apps/api/src/modules/ai` | 🟢 ACTIVE | 4 | reporting | No DB models — stateless service layer (uses generic `Setting` for the one persisted config field, see below). `AiService` calls a **self-hosted Ollama server** (`OLLAMA_BASE_URL`, default `http://localhost:11434`; `OLLAMA_MODEL`, default `llama3.2:3b`) via plain `fetch()` against `POST /api/chat` — no paid LLM API, zero per-token cost. `isConfigured()` always returns `true` (self-hosted, no API key concept); unreachable-server/model errors surface as a friendly `BadRequestException` at request time, not a startup crash. Exposes `chat`/`summarize`/`classify`/`extractFields` (unchanged signatures) plus `rawChat()`/`getBaseUrl()`/`getDefaultModel()` for lower-level tool-calling access. `AiCopilotService` holds fixed-mode business logic: `askData` (NL→structured report query→real `ReportingEngineService.executeQuery`→narrated answer, never hallucinated), `summarizeRecord`, `draftEmail`, `generateFormFromPrompt`, `generateWorkflowFromPrompt`, `processInvoiceDocument` (extraction + optional draft PO creation). `AiAgentService` is the general-purpose agent behind the global floating "AI Copilot" widget rendered on every dashboard page (`apps/web/app/(dashboard)/layout.tsx`): runs an Ollama function-calling tool loop (`POST /ai/converse`, capped at 6 iterations, OpenAI-style `tools`/`message.tool_calls` — not Anthropic content blocks) exposing `query_erp_data`, `summarize_record`, `draft_email`, `generate_form`, `generate_workflow`, `process_invoice_text` as tools that delegate 1:1 to the existing tenant-scoped `AiCopilotService` methods — no intent keyword-matching, no bypass of tenant scoping. `OllamaProcessService` starts/stops/status-checks the local `ollama serve` process (same-host deployment assumption). `AiConfigService` is the new tenant-scoped kill switch: reads/writes a single `Setting` row (`key = 'ai.config'`, same generic-JSON pattern as `PlatformService`'s feature flags) holding `{ enabled: boolean }`; `model`/`baseUrl` in its response are always live-read from `AiService`, never persisted (no per-tenant model override yet). All `ai.controller.ts` endpoints sit behind `JwtAuthGuard` + `RbacGuard` + `TenantInterceptor` with `ai.read`/`ai.create` permissions, and every AI-invoking handler (all but `status`) now calls `AiConfigService.isEnabled()` first, throwing a 503 `ServiceUnavailableException` if the tenant admin disabled AI; `GET /ai/status` additionally returns `enabled` so the floating widget (any authenticated user) can hide itself without needing admin permission. **New dedicated admin console**: `AiAdminController` (`admin/ai/*`, gated by the new admin-only `ai.admin.manage` permission on every route) exposes `GET/POST admin/ai/config` (kill switch) and `GET admin/ai/engine/{status,start,stop}` (relocated from `OperationsController`'s `admin/operations/ai-engine/*`, which no longer has these routes or an `OllamaProcessService` dependency). Frontend: `apps/web/app/(dashboard)/admin/ai/page.tsx` is the new AI admin page (kill switch card, read-only model info card, relocated engine start/stop card); `apps/web/app/(dashboard)/admin/page.tsx`'s sidebar AI Engine card was replaced with an "AI Assistant" link-out card and a matching `quickLinks` entry. **Known gap (out of scope for this Ollama swap, flagged separately):** `workflow-engine.service.ts` and `builder/web-studio.service.ts` still call `https://api.anthropic.com/v1/messages` directly via raw `fetch`, bypassing `AiService` entirely — untouched by this change, still incurring Anthropic API cost. |


---

## Shared Packages

| Package | Path | Status | Description |
|:---|:---|:---|:---|
| **@unerp/database** | `packages/database` | 🟢 ACTIVE | Prisma schema, client, migrations |
| **@unerp/shared** | `packages/shared` | 🟢 ACTIVE | Types, validators, constants, utilities |
| **@unerp/ui** | `packages/ui` | 🟢 ACTIVE | Design system, components, tokens |
| **@unerp/auth** | `packages/auth` | 🟢 ACTIVE | Authentication providers, RBAC, guards |
| **@unerp/config** | `packages/config` | 🟢 ACTIVE | ESLint, TypeScript, Prettier configs |
| **@unerp/framework** (Frontend Framework) | `packages/framework` | 🟡 IN_PROGRESS | Unified metadata/schema-driven frontend framework for ALL apps/modules (replaces ERPNext/Frappe-inspired patterns). Layers ABOVE `@unerp/ui`: module registration API, schema-driven List/Detail/Form views, data layer (typed API client + caching), forms engine (validation, conditional fields), permissions-aware navigation/menus (RBAC `module.resource.action`), tenant-scoped by construction, i18n-aware. Consumed by `apps/web`; complements (does not duplicate) Studio's dynamic rendering — Studio-built pages become a consumer of this runtime. |

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

