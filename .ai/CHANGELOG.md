# Changelog — Universal ERP System

> This file is maintained by AI agents and developers after completing work.
> Format: Newest entries at the top.

## [2026-06-27] ERP-Wide Dashboard & Visual Overhaul (Phase 2-10)

### Added
- **Shared Visualization Infrastructure (`@unerp/ui`)**:
  - `ChartTypePicker`: Dynamic chart visualization selector dropdown.
  - `ViewSwitcher`: Icon toggle button group (List, Chart, Kanban, Grid).
  - `DrillDownModal`: Granular BI datatable with query filters and CSV export.
  - `DashboardKPICard`: Enhanced key performance indicator card with sparklines and progress.
  - `DashboardChart`: Composed Recharts wrapper supporting dynamic series rendering.
  - `KanbanBoard`: HTML5 drag-and-drop workflow card tracker.
- **Login & Registration Redesign**:
  - Rebuilt `/login` and `/register` pages with responsive split-screen branding panels, feature carousels, password strength indicators, and MFA/Social options.
- **Enhanced Application Dashboards**:
  - Upgraded dashboards with live Recharts components, KPIs, view switchers, and Kanban support across: Finance, HR, CRM, Inventory, Sales, Procurement, Manufacturing, Supply Chain, Projects, Education, Real Estate, Field Service, POS Terminal, SaaS Portal, and BI Analytics.
  - Implemented 100% interactive KPI card coverage by binding missing `drillDown` and `onClick` parameters on every dashboard card (e.g. Warehouses, Total Stock Value, CRM Qualified status, Active Vendors list, Manufacturing scrap quantities, EVM metrics details, etc.).
- **Relative Routing & Type Safety**:
  - Replaced all hardcoded absolute references to `http://localhost:3001` backend endpoints with relative paths, preventing CORS and cross-origin deployment bugs.
  - Resolved strict mode TypeScript compilation issues in packages and applications.
  - Added `onClick` prop handler to `DashboardKPICard` component in `@unerp/ui` to support dynamic parent-handled drilldowns.

---

## [2026-06-21] App Store System Applications Integration

### Added
- **Marketplace Core System Catalog**:
  - Integrated 18 core system applications (Finance, HR, CRM, Inventory, Procurement, Sales, Supply Chain, Projects, Manufacturing, POS, Analytics, Drive, Connect, etc.) into the App Store catalog.
  - Core system apps show up as "Installed" by default and cannot be uninstalled by the user.
  - Added a system warning notice/banner on the app detail page to inform users that these core dependencies are pre-installed and cannot be uninstalled.
  - Added backend checks to throw `ForbiddenException` if users attempt to uninstall a system app.
  - Seeded all required system applications and corresponding `InstalledApp` mappings for existing and new tenants.

### Fixed
- **Typescript Compilation & Prisma Mismatches**:
  - Resolved `appSlug` query select mismatch in `saas.service.ts` and `marketplace.service.ts` by regenerating Prisma client and building the database package.
  - Fixed `org-hierarchy.service.ts` cost center creation and update compiler errors by removing the non-existent `budget` field from direct Prisma queries.
  - Fixed `bulk-operations.service.ts` database column mappings from `processedRecords` and `failedRecords` to the actual database columns `processed` and `failed`.
  - Resolved union type properties checking for `appData.price` and `appData.metadata` in `marketplace.service.ts` by casting `appData as any` inside `seedDefaultApps()`.
  - Corrected `operations.service.spec.ts` unit tests to access `result.data.length` for paginated error logs, and passed missing `tenantId` parameters.

---

## [2026-06-21] Dedicated Page Security Split

### Added
- **Dedicated Sub-Pages for Security Control Hub**:
  - Replaced Next.js transparent page redirects with full standalone operational pages:
    - `/admin/audit-trail` (Audit logs search table with severity filters)
    - `/admin/login-history` (Security authentication actions logs grid)
    - `/admin/password-policy` (Password rule complexity constraints and age configuration form)
    - `/admin/mfa` (Multi-Factor authentication settings management panel)
    - `/admin/ip-restrictions` (Network IP/CIDR whitelist and blacklist rules manager)
    - `/admin/sessions` (Active device user session listings with revoke triggers)
    - `/admin/impersonate` (Sandbox directory to impersonate tenant members with secure login bypass)
    - `/admin/data-retention` (Entity lifetime policy CRUD scheduler)
    - `/admin/compliance` (Score analyser showing security compliance parameters checklist)

## [2026-06-21] Admin Consolidation, Operations, Branding & Platform (Sprint 1–5 Complete)

### Added
- **Sprint 4 & 5 Operations UI Pages**:
  - `System Health` (`/admin/system-health`): Real-time CPU, memory, and database status widgets with auto-refresh (10s).
  - `Background Jobs` (`/admin/jobs`): Telemetry monitor for BullMQ worker queues with action triggers to retry failed jobs.
  - `Scheduled Tasks` (`/admin/scheduled-tasks`): Cron schedule viewer with manual trigger actions.
  - `Error Logs` (`/admin/error-logs`): Searchable monospace logger UI console with level filters (ERROR/WARN).
  - `Backup & Restore` (`/admin/backups`): Cold Postgres dump generator list with download actions.
  - `DB Schema Manager` (`/admin/db-schema`): Schema metadata viewer querying Postgres dynamic tables row volume counts.
- **Sprint 4 & 5 Branding & Platform UI Pages**:
  - `Email Server (SMTP)` (`/admin/email-config`): Host, username, password credentials and sender identity form with connection test mail dispatcher.
  - `Email Templates` (`/admin/email-templates`): Categories-bound grid list and dialog editor drawer with placeholder variables insert list.
  - `Module Manager` (`/admin/modules`): Toggle switch dashboard enabling/disabling core modules (Finance, HR, CRM, Inventory, Procurement, MRP, POS) globally.
  - `Feature Flags` (`/admin/feature-flags`): Selective rollout beta keys toggle editor.
  - `Custom Domains` (`/admin/domains`): Custom host link wizard detailing DNS records (CNAME/TXT) verified dynamically.
  - `Environment Manager` (`/admin/environments`): Production/Staging/Development sandbox state monitor and synchronization.
  - `Maintenance Mode` (`/admin/maintenance`): Global lockout toggler and custom warning banner message writer.
  - `Tenant Usage Analytics` (`/admin/tenant-analytics`): Counters for records (Users, Invoices, Products, API Hits) and progress bar for storage bytes quota.
  - `System Updates` (`/admin/updates`): Update checker showing current vs latest software version status and release logs.
- **Identity & Access Page Redirects**:
  - Created server-side redirects on `/admin/mfa`, `/admin/password-policy`, `/admin/sessions`, and `/admin/impersonate` routing to targeted tabs inside `/admin/security` hub.
- **Navigation & Search Integration**:
  - Registered all new sub-pages in sidebar navigation.
  - Added new routes to `SEGMENT_NAMES` for correct breadcrumbs translation.
  - Added all 25 new pages and actions to `GLOBAL_SEARCH_ITEMS` command palette search catalog.

### Reorganized
- **Admin Consolidation (Sprint 1)**:
  - Removed "System" dropdown folder and combined 4 sub-apps (Admin, Localization, Sync, DevOps) into a single "Admin" app.
  - Reorganized `/admin` sidebar navigation with grouped sections: Identity & Access, Security & Compliance, Automation & Workflows, Branding & Communication, Platform Settings, Data & Integration, Reports, and Super Admin.
  - Moved workflows module from `/workflows` to `/admin/workflows` (including page, advanced, escalations, and simulation pages).
  - Deleted old `/workflows` directory.
- **Drive Restructuring (Sprint 1)**:
  - Moved "Files & Storage" features from `/storage` into `/drive`.
  - Added new pages under `/drive` for Templates, Designer, Storage Quotas, and Media Conversion.
  - Deleted old `/storage` directory.
- **Super Admin**:
  - Merged `/super-admin` into the consolidated Admin app under `/admin/super-admin`.
  - Deleted old `/super-admin` directory.

### Updated
- `layout.tsx` — Updated segment naming mappings, apps switcher sidebar items, global search index items, and main applications index list.
- `apps/page.tsx` — Consolidated application list to remove separate tiles for workflows, storage, localization, sync, and devops; updated description for Admin.

---

## [2026-06-21] Phase 5 — System Modules Complete (End-to-End)

### Wired Existing Backends to Frontends
- **Localization**: Real API calls for languages, overrides CRUD, export/import JSON, completeness indicators
- **Sync Monitor**: Real API calls for sync queue, reconcile actions, conflict resolution modal, auto-refresh, filter tabs
- **SaaS Portal**: Real API calls for plans/subscription/usage, plan comparison matrix, trial management, upgrade modal
- **DevOps**: Real system metrics (DB latency, connections, memory, CPU), recent errors section, auto-refresh

### New Backend Services & Controllers
- **Security**: `SecurityController` + `SecurityService` — real audit log queries with pagination/search/filters, password policy CRUD via Setting model
- **Announcements**: `AnnouncementsController` + `AnnouncementsService` — CRUD for system-wide admin broadcasts with expiry
- **Scheduled Reports**: `ScheduledReportsController` + `ScheduledReportsService` — CRUD + run-now for scheduled report jobs
- **Activity Feed**: `ActivityFeedController` + `ActivityFeedService` — company-wide change stream from ChangeHistory
- **Notification Preferences**: `NotificationPreferencesController` — per-user channel preferences (in-app/email/SMS/push)
- **Import/Export Center**: `ImportExportController` + `ImportExportService` — validate, execute imports (Customer/Vendor/Product/Employee), export entity data
- **GDPR Data Management**: `GdprController` + `GdprService` — retention policies, erasure requests, subject data export

### New Frontend Pages
- `/admin/security` — Real audit logs with pagination, password policy settings, session management
- `/admin/settings` — Added demo data section, numbering series, fiscal year config
- `/admin/announcements` — System announcement management
- `/admin/scheduled-reports` — Scheduled report configuration
- `/admin/activity-feed` — Company-wide timeline with filters and infinite scroll
- `/admin/notifications` — Notification preferences grid (7 categories × 4 channels)
- `/admin/import-export` — 5-step import wizard + export with format/filter selection
- `/admin/gdpr` — Data retention policies + erasure request management

### New Prisma Models
- `SystemAnnouncement`, `ScheduledReport`, `DataRetentionPolicy`, `DataErasureRequest`, `NotificationPreference`

### Navigation
- Admin sidebar: added "Data & Compliance" section with Import/Export, GDPR, Announcements, Scheduled Reports, Activity Feed, Notification Prefs

---

## [2026-06-21] ERP Platform Foundation — Change History, Demo Data, RBAC, Super Admin

### Added
- **Change History System** (Phase 1): Entity+field-level audit trail across all modules
  - `ChangeHistory` Prisma model with tenant-scoped indexes
  - `@TrackChanges('EntityType')` decorator + `ChangeHistoryInterceptor` for automatic diff tracking
  - `ChangeHistoryService` with field diff logic and paginated history API
  - `GET /api/v1/change-history/:entityType/:entityId` endpoint
  - `<ChangeHistory>` reusable UI component (ERPNext-style timeline, light gray, vertical dots)
- **Demo Data System** (Phase 2): Toggle-able demo data with banner
  - `DemoDataRecord` model to track demo records per module
  - `Tenant.demoDataLoaded` + `Tenant.demoLoadedAt` fields
  - Admin endpoints: `POST/DELETE /admin/demo/load|remove|remove/:module`, `GET /admin/demo/status`
  - `<DemoBanner>` sticky amber banner with "Remove all" / "Remove from this app" actions
  - Integrated into dashboard layout with auto-fetch on login
- **Advanced RBAC System** (Phase 3): Multi-level access control
  - `Permission` registry model (endpoint/page/component/field/record levels)
  - `AccessPackage` model with field access rules and record filters
  - `RoleAccessPackage` many-to-many relation
  - Admin CRUD endpoints for access packages + role assignment
  - `<ProtectedComponent>`, `<ProtectedField>` UI components with `usePermission`/`useFieldAccess` hooks
  - `PermissionContext` React context for frontend permission state
  - Permission registry (`packages/shared/src/permissions/registry.ts`) with 100+ permission definitions
  - Access Control admin page (`/admin/access-control`) with Roles, Packages, and Matrix tabs
- **Super Admin Dashboard** (Phase 4): Cross-tenant management
  - `SuperAdminController` + `SuperAdminService` with tenant CRUD, admin listing, analytics, health
  - 4 frontend pages: Dashboard, Tenants, Admin Users, System Health
  - Sidebar navigation for `/super-admin` routes
- **AGENTS.md Rules**: Added mandatory rules 13-16 for change history and RBAC in all future development

### Changed
- `AdminModule` now includes `SuperAdminController` and `SuperAdminService`
- `AppModule` imports global `CommonModule` (ChangeHistory service)
- Dashboard layout sidebar: added Access Control, Settings, Super Admin navigation
- `SEGMENT_NAMES` updated with super-admin, access-control entries

### Schema
- New models: `ChangeHistory`, `DemoDataRecord`, `Permission`, `AccessPackage`, `RoleAccessPackage`
- Modified: `Tenant` (+demoDataLoaded, +demoLoadedAt), `Role` (+accessPackages relation)

---

## [2026-06-21] Procurement — Competitor Revamp (SAP Ariba/Coupa/Oracle Overhaul)

### Added
- **Purchase Requisition (PR) & Approvals** (`apps/web/app/(dashboard)/procurement/requisitions/page.tsx`): Built employee-purchasing request forms with dynamic multi-row line items, department budgeting, and workflow actions (Approve, Reject, Convert to PO draft).
- **Blanket Purchase Agreements (BPA)** (`apps/web/app/(dashboard)/procurement/blanket-agreements/page.tsx`): Added long-term supply contracts with fixed pre-negotiated prices, contract consumption progress tracking, and drawdown PO release actions.
- **3-Way Matching Checklist** (`apps/web/app/(dashboard)/procurement/purchase-orders/[id]/page.tsx`): Overhauled PO details to integrate an interactive 3-Way Match Check comparing ordered quantities/pricing against warehouse receipts (GRN) and vendor invoices.
- **Supplier Performance Scorecard** (`apps/web/app/(dashboard)/procurement/vendors/[id]/scorecard/page.tsx`): Created analytical dashboards compiling quality acceptance metrics, defect rates, average shipment lead times, and OTD performance.
- **Public Supplier Bidding Portal** (`apps/web/app/public/bids/[rfqNumber]/page.tsx`): Designed an unauthenticated workspace for external vendors to review RFQ details and submit binding bids directly.

### Fixed
- **TypeScript Typecheck Errors**:
  - Safely checked array elements and cast dynamic properties (`as any`) in `handleItemChange` within `requisitions/page.tsx` and `blanket-agreements/page.tsx`.
  - Replaced invalid `"secondary"` badge variant values with `"default"` across multiple pages (`blanket-agreements/page.tsx`, `purchase-orders/[id]/page.tsx`, `requisitions/page.tsx`, and `public/bids/[rfqNumber]/page.tsx`).
  - Resolved state update type incompatibility for `linePrices` (`Record`) in `public/bids/[rfqNumber]/page.tsx` using a functional state updater.
  - Resolved search input text overlapping with magnifying glass search icons by defining the missing `--space-9` design token (`2.25rem` / `36px`) centrally in `packages/ui/src/tokens/design-tokens.css`, instantly correcting all 25 instances across all ERP application search bars.

---

## [2026-06-21] Manufacturing — Competitor Revamp (SAP/NetSuite/Odoo MRP Overhaul)

### Added
- **Recursive Multi-Level BOM Explosion** (`apps/api/src/modules/manufacturing/manufacturing.service.ts`): Built recursive `getBOMTree` endpoint to traverse component formulas and render hierarchical sub-assembly trees. Added a matching visual tree drawer on the BOMs catalog.
- **Workstation Gantt Scheduler Timeline** (`apps/web/app/(dashboard)/manufacturing/mrp/page.tsx`): Upgraded the scheduling views to render an interactive workstation allocation Gantt chart mapping jobs and shifts.
- **MES Operator Routing Clock-in/out** (`apps/web/app/(dashboard)/manufacturing/shop-floor/page.tsx`): Overhauled the operator shop-floor terminal, enabling operators to check-in/out of sequence steps, log lot numbers, and increment machine tool cycles.
- **Lot Genealogy Trace Explorer** (`apps/web/app/(dashboard)/manufacturing/diagnostics/page.tsx`): Created a double-sided genealogy tracing layout searching component lot consumption histories (upstream and downstream).
- **OEE Metrics breakdown** (`apps/api/src/modules/manufacturing/manufacturing.service.ts`): Wired multi-dimensional OEE calculation (Availability, Performance, Quality components) with downtime log charts.
- **Engineering Change Orders (ECO)** (`apps/web/app/(dashboard)/manufacturing/boms/page.tsx`): Added BOM revision control (v1.0, v1.1) and approval routing to prevent modification of active production formulas without a change request.
- **Tooling Cycle Counters & PM Integration**: Created automated cycle counts on workstations equipment tools, auto-raising preventive maintenance requests if wear limit is exceeded.
- **Enhanced Spec-based Quality Templates** (`apps/web/app/(dashboard)/manufacturing/quality/page.tsx`): Rearchitected inspection checklists supporting custom checkbox/numeric range templates instead of plain text strings.
- **Robust Unit Testing Suite** (`apps/api/src/modules/manufacturing/tests/manufacturing.service.spec.ts`): Added 7 comprehensive test blocks verifying capacity adjustments, recursive trees, OEE scores, tool cycles, ECOs, and lot tracers.

---

## [2026-06-21] Inventory & Stock — Dashboard Analytics & Route Restructuring

### Added
- **Inventory Dashboard** (`apps/web/app/(dashboard)/inventory/page.tsx`): Built a premium, visually stunning inventory dashboard utilizing HSL custom properties. Includes real-time statistics (total items, active products, active warehouses), custom SVG-based visual charts (donut chart showing stock value breakdown by category, and warehouse distribution progress bars), replenishment urgency lists, and a modular quick-actions operations hub.
- **Relocated Products Catalog Route**: Moved the product catalog from `/inventory` to `/inventory/products`.
- **Breadcrumbs Segment Names & Sidebar Navigation**: Added the new `/inventory/products` segment path and configured the sidebar links under `layout.tsx` to cleanly route the dashboard to `/inventory` and the catalog to `/inventory/products`.

### Changed
- **Default Products Catalog Layout**: Configured the default catalog layout format state to show the list view first instead of grid view (`/inventory/products/page.tsx`).
- **Product Detail Back Redirection**: Programmed the '< Back' button, error fallback redirect, and path breadcrumbs stack on the product details page (`/inventory/products/[id]/page.tsx`) to correctly navigate to the new `/inventory/products` catalog route instead of `/inventory`.

---

## [2026-06-21] Inventory & Stock — Market Top Competitor #1 Overhaul

### Added
- **Product Detail Page** (`apps/web/app/(dashboard)/inventory/products/[id]/page.tsx`): Created a high-fidelity client page supporting dynamic variant matrices, mini warehouse stock grids, and paginated Stock Ledger audit timelines.
- **Overhauled Product Catalog** (`apps/web/app/(dashboard)/inventory/page.tsx`): Integrated category tree sidebar navigation, Grid/List/Kanban view switchers, in-stock valuation rates, and click-through detail routes.
- **Overhauled Stock Entries** (`apps/web/app/(dashboard)/inventory/stock-entries/page.tsx`): Rewired warehouse material transactions with dynamic warehouse-specific bin dropdowns, interactive serial/batch tracking forms, and E2E voucher submissions and cancellation reversals.
- **Overhauled Stock Ledger** (`apps/web/app/(dashboard)/inventory/stock-ledger/page.tsx`): Re-engineered continuous audit tables with custom product/warehouse dropdown selections, real-time client-side CSV exports, and running balance tracking columns.
- **Overhauled Warehouse Directory** (`apps/web/app/(dashboard)/inventory/warehouses/page.tsx`): Implemented card-based warehouse listings with unique product counters, active status selectors, and add/edit forms.

---

## [2026-06-21] Drive — Google Drive UI, AES-256 S3 Envelope Encryption & Advanced Sharing

### Added
- **Google Drive UI**: Created a premium, high-fidelity Google Drive clone at `/drive` with custom nested folder navigation, double-click traversal, path breadcrumbs stack, responsive grids/lists, and collapsible Details Side Drawer.
- **Envelope Encryption**: Programmed on-the-fly AES-256-CBC envelope encryption for document binary buffer streams uploaded directly to MinIO (S3-compatible object storage) with unique database-indexed IVs.
- **OneDrive-style Sharing**: Integrated custom share configuration inputs including password protection and link expiration calendar dates.
- **Box-style Compliance**: Added active Legal Hold toggles to folders and files to block deletion workflows.
- **Digital Signatures & Versions**: Wired e-signature requests and multi-version upload/download decrypter streams directly.
- **Sidebar Nav Split**: Separated Drive and Storage explorer links cleanly under layout and home screens.
- **Self-Healing S3 Bucket Initialization**: Configured automated checks in backend `DocumentsService` (`createDocument` and `addVersion`) to verify and create the target MinIO bucket dynamically on demand, handling instances where the storage container boots late.

### Fixed
- **TS6133 Error**: Removed unused `Readable` import in `documents.service.ts` to clean compiler status.
- **Sidebar Active Highlighting**: Added `/drive` and `/storage` to exact path matches in `layout.tsx` to prevent overlapping active link states when viewing child routes (like `/drive/advanced` or `/storage/advanced`).
- **MinIO Container Startup**: Started the `unerp-minio` container using docker-compose, enabling S3-compatible file storage local binding.
- **Shared/Starred/Trash Nested Folder Duplication**: Fixed `getFolders` and `getDocuments` query filtration in `documents.service.ts` where `parentId`/`folderId` was ignored for non-personal views, preventing infinite folder opening loops and duplicate displays during navigation.
- **Double Click Navigation Guard**: Implemented navigation guards in `drive/page.tsx` (`handleEnterFolder`) to block race conditions from rapid double-clicks and guaranteed React list key uniqueness with composite `${folder.id}-${index}` strings.

## [2026-06-20] Web Studio — Rich Block Library, Forms, E-commerce & Publish Workflow

### Added
- **Rich block library** (`apps/web/src/components/builder/blocks/RichBlocks.tsx`): Navbar (with live cart badge), Footer, Rich Text (HTML), Image, Gallery, Columns, Logo Cloud, CTA Banner — bringing the page builder to 18+ block types. A single shared registry (`blocks/registry.tsx`) now feeds both the canvas preview and the public `PublicPageRenderer`.
- **Contact Form block**: renders a configurable form and posts to the public `/api/v1/public/web/forms/submit` endpoint, landing leads straight in the Form Submissions inbox.
- **E-commerce**: new `WebOrder` Prisma model + migration `20260620140000_add_web_orders`. A `useCart` localStorage hook, **Add to Cart** on product collection cards, a **Cart & Checkout** block that posts to a public `/api/v1/public/web/checkout` endpoint (totals recomputed server-side, order number issued), and a **Web Studio → Orders** admin page with revenue/pending/fulfilled stats and status management. 2 new service tests (builder suite now 119 passing).
- **Asset picker**: Image/Gallery block fields and the inspector can pick from the Asset Manager (image assets) or paste a URL, with a live thumbnail.
- **Page publish workflow**: the page builder now has Save Draft, **Preview** (opens the live `/{slug}`), and Publish / Update Live with a "Live" status indicator.
- **Navigation**: Orders added to the Web Studio hub + sidebar + breadcrumbs.

### Changed
- `CollectionBlock` renders an **Add to Cart** button for `PRODUCT`-kind collections.

## [2026-06-20] Web Studio — Collection-bound Blocks & Visual Block Inspector

### Added
- **Collection List block** (`apps/web/src/components/builder/blocks/CollectionBlock.tsx`): a CMS-bound page block that renders published items from any Web Studio collection (products with pricing, projects/portfolio, team, testimonials with star ratings, etc.). Self-fetching so it works identically in the builder canvas (authenticated, current tenant) and on the live public site (public API). Responsive grid/list layouts, featured-only filter, item limit, auto-derives title/image/price/subtitle from the collection's field metadata.
- **Block registry wiring**: `collection` registered in both the canvas preview (`builder/web/canvas`) and the public renderer (`PublicPageRenderer`) so it renders end-to-end — content modeled in Collections now appears on real pages.
- **Real visual block inspector** (`builder/web/pages`): replaced the stubbed "properties would appear here" panel with a schema-driven inspector. Per-block-type editable fields (hero headline/subtitle/CTAs/alignment; collection picker + layout/columns/limit/featured; CTA, text, features). The collection picker is populated from the tenant's collections; edits live-sync to the canvas via the existing postMessage flow.
- **Expanded section palette**: added Collection List, CTA Banner and Text Block to the page builder palette.

## [2026-06-20] Web Studio — CMS Collections Engine (dynamic content modeling)

### Added
- **CMS Collections** — the headless content backbone that makes Web Studio a true end-to-end CMS (Webflow/Wix/Sanity-class), suitable for e-commerce, portfolios and company sites. New Prisma models `WebCollection`, `WebCollectionItem`, `WebFormSubmission` + idempotent migration `20260620120000_add_web_cms_collections`.
- **Dynamic content types**: define collections with typed fields (Text, RichText, Number, Price, Boolean, Date, Image, Gallery, Select, Color, URL, Email, Tags, Reference). Manage entries with auto-slugging, draft/published status, featured flag and ordering.
- **Ready-made presets** (`web-collections.presets.ts`): one-click Products, Projects, Team, Testimonials, Blog, Services, Events — each seeded with field schema + sample content so the CMS is usable out of the box.
- **Backend** (`WebCollectionsService` + routes on `BuilderController`): full CRUD for collections + items, preset seeding, and a form-submissions inbox. 8 new unit tests (builder suite now 117 passing).
- **Public API** (`WebPublicController`, unauthenticated, `/api/v1/public/web/...`): published collection reads (`collections/:slug`, `collections/:slug/:itemSlug`) and public form submission capture (`forms/submit`) for the live customer-facing website. Tenant resolved by slug (defaults to `system`).
- **Web Studio UI**: new `builder/web/collections` page — collection gallery, preset/custom creation modal with a field-schema builder, and a dynamic entry editor drawer that renders inputs from each collection's field definitions. New `builder/web/submissions` inbox (read/archive/spam/delete). Wired into the Web Studio hub + sidebar nav + breadcrumbs.

## [2026-06-20] Navigation — Breadcrumbs Duplicate Removal & Grey Theme Styling

### Changed
- **Removed Duplicate Breadcrumbs**: Removed local breadcrumb navigation rendering from the shared [PageHeader](file:///c:/Users/kanna/OneDrive/Documents/Antigravity/ERPSys/packages/ui/src/components/page-header.tsx) component. This cleanly resolves duplicates across all ERP pages since pages use PageHeader while the layout renders breadcrumbs centrally.
- **Grey Styling theme**: Replaced the bright blue link styles on central breadcrumbs in [globals.css](file:///c:/Users/kanna/OneDrive/Documents/Antigravity/ERPSys/packages/ui/src/styles/globals.css) with clean, soft grey link colors (`var(--color-text-secondary)`) matching the requested reference format.
- **Interactive States & Separation**: Configured `/` separator margin/opacity and hover colors to shift dynamically from grey to dark (`var(--color-text)`).
- **Active Segment Selection**: Updated the [layout.tsx](file:///c:/Users/kanna/OneDrive/Documents/Antigravity/ERPSys/apps/web/app/%28dashboard%29/layout.tsx) template segment loop to detect the final active page, styling it as unclickable dark text (`.frappe-breadcrumb-active`) while retaining parent routes as clickable grey link triggers.

## [2026-06-20] Fix — NestJS API Compilation Mismatch & Next.js Runtime Cache Reset

### Fixed
- **App Page Builder Service**: Resolved a TypeScript compilation error in `builder.service.ts` where `addPageToModule` had a mismatch with `AddAppPageInput`'s `formId` and `dashboardId` types (which allowed `null` but the service signature only allowed `string | undefined`). Updated signature to accept `string | null` for both arguments.
- **Server Startup**: Restored NestJS server to a healthy compiled state, allowing the backend API and Next.js frontend to work correctly under dev mode.
- **Next.js Runtime Chunk Resolution**: Resolved the runtime chunk loading error `Cannot find module './6543.js'` by stopping the active Next.js development server process, clearing the `.next/` cache directory, and launching a fresh compiler process.



## [2026-06-20] Navigation — ERP-wide Dynamic Page Breadcrumbs Rollout

### Added
- **Dynamic Breadcrumbs Engine**: Implemented central breadcrumbs rendering at the top of the content viewport in `apps/web/app/(dashboard)/layout.tsx` to automatically supply navigation to all child pages in the system.
- **Segment Names Dictionary**: Registered human-readable translations for all core module roots and standard sub-page URL segments.
- **Dynamic Key Checker**: Programmed an identifier scanner in `formatSegment` to auto-detect database IDs/slug hashes (Pure numeric, UUID, CUID, long alphanumeric) and resolve them to clean `'Detail'` labels.
- **Breadcrumbs CSS Design**: Added `.frappe-breadcrumb` classes to `globals.css` with blue links and light grey `/` separators, adhering strictly to the user screenshots and Frappe UX guidelines.
- **Guidelines Enforcement**: Added breadcrumb navigation policies to `AGENTS.md` to secure consistency across new pages.

## [2026-06-20] Navigation — Dropdown Styling Revamp & Tree Connector Visuals

### Changed
- **Dropdown Cleanliness**: Extracted inline CSS styles from `layout.tsx` for the Switch App, Tenant Selector, Search Results, and User Profile dropdown menus into global utility classes in `globals.css` (`.frappe-dropdown-*`).
- **Nesting UI Hierarchy**: Replaced the simple indent spacing for nested sub-apps inside expanded folders (Developer & System) with a distinct vertical connector line (`.frappe-dropdown-item-nested-container`) aligned precisely with the folder icons.
- **Dynamic Caret Rotations**: Caret indicators (`ChevronDown` and folder `ChevronRight`) now rotate smoothly using CSS transitions when toggled open/expanded, rather than popping instantly.
- **Interactive Micro-animations**: Dropdown menus fade-in-up dynamically using keyframe animations on mount. Added a subtle `translateX(2px)` hover animation on list items to increase responsiveness.
- **Danger Action Isolation**: Created `.frappe-dropdown-item-danger` for negative triggers (Sign out) to eliminate hover styling event listeners.

## [2026-06-20] Navigation — Rearranged Navbar & Global CSS Styling

### Changed
- **Header Structure**: Rearranged elements in the main layout header panel:
  - Placed the "Switch Tenant" button directly next to the "Switch App" button on the left side of the navbar.
  - Removed the redundant "Apps Home" button.
  - Moved the search bar to the right side of the navbar, positioned next to the theme toggle button.
  - Aligned search results dropdown menu to render relative to the right-hand position (`right: 0`).
- **Global Styling Alignment**: Replaced custom inline CSS borders, backgrounds, and colors with global utility classes:
  - Search Input: `className="frappe-input"`
  - Theme Toggle: `className="frappe-btn frappe-btn-secondary"`
  - Notification Bell: `className="frappe-btn frappe-btn-secondary"`

## [2026-06-20] Navigation — Collapsible Folders in Switch App Dropdown

### Added
- **Collapsible Switcher folders**: Added collapsible subfolders for "Developer" and "System" in the "Switch App" dropdown in `layout.tsx` to mirror the Desk layout.
- **Indented sub-apps**: Inside collapsed dropdown folders, children applications render slightly indented.
- **Chevron Indicators**: Implemented interactive `ChevronRight` and `ChevronDown` icons to signify the expansion state of collapsible sections.
- **Alphabetical sorting**: Both root apps and folder headers are combined and sorted alphabetically.

## [2026-06-20] Custom App Builder — Workflow & Dashboard Editors Embedded Inline

### Added
- **Extracted `WorkflowEditorWorkspace`** (`apps/web/src/components/builder/WorkflowEditorWorkspace.tsx`): the full React Flow workflow editor (palette, drag-drop nodes, properties panel, test-run, execution history) is now a reusable component accepting `{ workflowId, onBack, onSaved, embedded, defaultName }`. Route `builder/erp/workflows/[id]` slimmed to a thin wrapper.
- **Extracted `DashboardEditorWorkspace`** (`apps/web/src/components/builder/DashboardEditorWorkspace.tsx`): the full grid-layout dashboard editor (widget palette, resizable grid, properties panel) is now a reusable component. Route `builder/erp/dashboards/[id]` slimmed to a thin wrapper.
- **Studio Workflows tab — Build New + inline Edit**: launches the workflow editor as a full-screen overlay over `builder/erp/apps/[id]`; on first save the workflow is auto-linked to the app.
- **Studio Dashboards tab — Build New + inline Edit**: same pattern for dashboards. Both follow the form-builder convention so the user never leaves build mode.
- **Generic `linkComponentToApp` helper** in the app studio centralizes the link-on-save behavior across form/workflow/dashboard overlays.

## [2026-06-20] Custom App Builder — Integrated In-Studio Builders (never leave build mode)

### Added
- **Extracted `FormBuilderWorkspace`** (`apps/web/src/components/builder/FormBuilderWorkspace.tsx`): the full visual form builder (palette, properties, dnd, zoom/pan, AI-generate) is now a reusable component accepting `{ formId, onBack, onSaved, embedded, defaultModule }`. The route `builder/erp/forms/[id]` is now a thin wrapper around it.
- **Embedded form builder in the App Studio**: launches as a full-screen overlay over `builder/erp/apps/[id]` — you build/edit a form and return to the app without any navigation. On first save of a new form it auto-links to the app; `onSaved` keeps the overlay open on the now-saved form for continued editing.
- **Forms section — Build New + inline Edit**: the studio Forms tab now has a "Build New" action (opens the full builder) and a per-form pencil to edit the linked form in place.
- **Page composer**: the Add Page flow now binds a data source for form/list pages — either **Link Existing** (form dropdown) or **Build New** (opens the form builder; on save it links the form and creates the page bound to it via `formId`).

### Notes
- Same overlay pattern is ready to extend to the Workflow and Dashboard editors (planned next) for a fully end-to-end in-studio full-stack builder.

## [2026-06-20] Custom App Builder — Release Management & App Store Loop

### Added
- **App releases (immutable snapshots)**: New `AppRelease` Prisma model. Publishing a custom app now cuts an immutable, self-contained snapshot (components dereferenced into full form/workflow/dashboard/automation definitions, plus pages, data models, permissions and store metadata) rather than just flipping a status flag. Migration `20260620050000_add_app_releases_and_store_listing`.
- **Semantic versioning on publish**: `POST /builder/modules/:id/publish` accepts `{ scope, bump: 'patch'|'minor'|'major', version?, changelog, category, longDescription, publisher, screenshots }`. Auto-bumps patch by default; rejects duplicate versions (`@@unique([moduleId, version])`).
- **Release history & rollback**: `GET /builder/modules/:id/releases` and `POST /builder/modules/:id/rollback` ({ releaseId }) — restores a prior release's snapshot into the live module and marks newer releases `ROLLED_BACK`.
- **App Marketplace API**: `GET /builder/marketplace` lists installable builder apps (GLOBAL from any tenant + this tenant's ORG apps) annotated with install state and `updateAvailable`. `POST /builder/marketplace/install` and `/uninstall`.
- **Provision-on-install**: Installing a built app provisions its pages as resolvable `SchemaRegistry` + `PageRegistry` entries (route `/app/<module-slug>/<page-slug>`), pins the install to a release, and records provisioned IDs on `InstalledApp` for clean teardown on uninstall. Data models without a page also get a runtime surface.
- **App Store integration (closes the loop)**: `apps/store` now renders a live **"Built in your workspace"** section sourced from `/builder/marketplace` alongside the static catalog — apps published from the builder are now actually discoverable and installable, with update/uninstall actions.
- **Studio Publish & Releases tab**: Rebuilt publish UI with version-bump selector (live next-version preview), changelog, store-listing fields (category/publisher/description), scope, and a release-history list with one-click rollback.
- **Enhanced test + sandbox engine** (`runAppTests`): structural checks are now categorized (structure/data/automation/security/performance) and joined by a sandbox simulator that validates a sample record per data model and linked form (required/type/select-options/regex), plus per-run history (last 10) with a score-trend chart in the Test tab.
- **In-studio runtime Preview tab**: A simulated app shell that renders the app's pages with a working nav; form pages render live via `DynamicFormRenderer` (submissions captured locally, not persisted) and an "Open Live" deep link to `/app/<slug>/<page>` once published. List/dashboard pages show a runtime placeholder.
- **App lifecycle stats** (`getModuleStats`): now returns installs, release count, automation-run totals, current version/scope/status, and score trend — surfaced as stat cards on the studio Overview tab.

### Changed
- **`InstalledApp`** extended with `source` (CATALOG|BUILDER), `sourceModuleId`, `releaseId`, `installedVersion`, `provisioned`.
- **`BuilderModule`** extended with store-listing fields (`category`, `longDescription`, `publisher`, `screenshots`, `installCount`) and `currentReleaseId`; added `@@index([scope, status])`.

### Tests
- Added service unit tests for `publishModule` (version bump, duplicate-version guard), `getMarketplace` (install/update annotation), `installBuilderApp` (provisioning) and `uninstallBuilderApp` (teardown). Builder suite: 63 passing.

## [2026-06-20] Fix — ReferenceError on App Builder page

### Fixed
- **App Builder Overview Page**: Resolved a critical runtime `ReferenceError: HelpCircle is not defined` by adding the missing import for `HelpCircle` from `lucide-react`.

## [2026-06-20] Builder Studio — App Builder Overview & No-Code Test Platform

### Added
- **No-Code Test Platform Tab**: A complete interactive sandbox directly inside the ERP App Builder overview page (`/builder/erp`). Users can select any developed form from the system to render live.
- **Dynamic Input & Rules Execution**: Sandbox fields are rendered automatically via the shared `<DynamicForm>` component, supporting formulas, conditional visibility rules, data formats, and validation.
- **Form Sandbox State Modes**:
  - **Live Database Mode**: When testing a published form, submissions are written directly to the PostgreSQL database via `POST /api/v1/builder/custom-records/:schemaId`.
  - **Simulated Sandbox Mode**: When testing draft forms, submissions are captured in temporary React state to allow testing of visibility rules and formulas without deploying to database tables.
- **Interactive API Log & Payload Inspector**: Shows history log of test submissions, raw JSON payload inspections, and supports entry deletion (SQL deletion for live tables).
- **Custom Modules CRUD Enhancements**: Expanded Custom Modules list to dynamically fetch `/api/v1/builder/modules` and support full create and edit configurations with specific theme colors, icons, and publish scopes.
- **Publish Scopes for Modules**: Added support for module scopes: "Draft" (private draft), "Organization Level" (restricted to tenant), and "App Store" (globally accessible).
- **Database Schema Migration**: Added `scope String @default("ORGANIZATION")` field to the `BuilderModule` table in PostgreSQL.
- **Shared Validation Schemas**: Added `scope` field validation to `createBuilderModuleSchema` and `updateBuilderModuleSchema` in packages/shared.
- **App Builder Overview Sidebar Link**: Added the overview page `/builder/erp` to the global `ERP App Builder` sidebar navigation under layout.tsx.

---

## [2026-06-19] Builder Studio — Deploy Loop & Runtime Renderer Overhaul

### Added
- **`publishForm` backend engine** (`builder.service.ts`): New `POST /page-registries/:id/publish` endpoint that closes the zero-code deploy loop. On publish: derives field metadata from the visual layout, upserts a `SchemaRegistry` (creates on first publish, updates on re-publish — no orphaned schemas), links it to the `PageRegistry` via `schemaId`, and sets `status: 'PUBLISHED'`. Returns the live `/app/{module}/{slug}` route.
- **Deploy-to-App wizard** (`DeployFormModal.tsx`): Frappe-styled modal replacing the hardcoded publish flow. Users choose a target module (with datalist of existing modules), URL slug (auto-suggested from title, URL-safe validated), and description. Shows live route preview. On success: displays "Open Page" and "Copy Link" actions.
- **`getSchemaRegistryById` helper**: New service method for fetching schemas by ID (used by publish flow + tests).
- **Search/sort/pagination for custom records**: `GET /custom-records/:schemaId` now accepts `?search=&sortBy=&sortOrder=&page=&pageSize=` query params. Server-side filtering across all field values, sorting by any data column (asc/desc), and paginated response `{ data, total, page, pageSize, totalPages }`.

### Changed
- **Runtime renderer** (`app/[module]/[slug]/page.tsx`): Full rewrite fixing a React Rules-of-Hooks violation (useState/useEffect called after conditional returns). Now supports: server-side search, sortable column headers, pagination controls (10/25/50), per-row edit (pre-fills DynamicFormRenderer) and delete (with inline confirm), and `frappe-*` utility classes throughout.
- **Form builder Publish button**: Now opens the DeployFormModal ("Deploy to App") instead of calling `handleSave(true)` with hardcoded `module:'custom'` and `slug:custom-${timestamp}`. Save payload now uses the deploy wizard's module/slug/title.
- **Sidebar Page Registry filter**: Only pages with `status === 'PUBLISHED'` now appear in the sidebar navigation — drafts are no longer visible to the team.

### Tested
- **Builder service tests** (`builder.service.spec.ts`): Extended prisma mock with `schemaRegistry`, `pageRegistry`, `customRecord` stubs and `$transaction` support. Added test suites for: `publishForm` (new schema creation, re-publish update, not-found error), `getSchemaRegistryById` (found, not-found), and `getCustomRecords` with query (default pagination, search filtering, asc/desc sorting, page slicing, RBAC scrub with query, null-schema fallback).

---

## [2026-06-18] Builder Studio — P0 (Logic & Modules Wiring)

### Added
- **Automation Logic API Wiring**: Wired the Automation/Logic UI (`/builder/erp/logic`) to the actual backend API `/api/v1/builder/automation-rules`. Implemented rule creation, status toggling, deletion, and real-time statistics generation instead of using hardcoded mock data.
- **Module CRUD Wiring**: Wired the Custom Modules UI (`/builder/erp/page.tsx`) to the backend API `/api/v1/builder/modules`. Implemented module creation via the `GenericBuilderModal`, deletion functionality, and live statistics counts for entities and relationships.
- **Sidebar Integration Review**: Verified that Builder Studio navigation correctly exists and resolves dynamically based on the current context within `layout.tsx`.

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