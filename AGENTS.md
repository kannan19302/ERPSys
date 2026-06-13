# AGENTS.md — Universal ERP System

> **This file is the master instruction set for all AI coding agents working on this project.**
> Every AI agent (Claude, Gemini, GPT, Copilot, Cursor, Aider, or any future tool) MUST read this file
> and follow its rules throughout the entire development lifecycle.

---

## 🏢 Project Identity

- **Name**: Universal ERP System (UniERP)
- **Mission**: A fully-packed, composable, industry-agnostic Enterprise Resource Planning system
- **Architecture**: Monorepo (Turborepo + pnpm) with composable modules
- **Current Phase**: Phase 2 — Procurement, Sales & Supply Chain
- **Methodology**: AI-Agent Driven Development (AADD)

---

## 📐 Architecture Summary

This is a **composable, multi-tenant ERP** built on a TypeScript monorepo. The system is organized into:

- **`apps/web`** — Next.js 15 frontend (App Router, Server Components)
- **`apps/api`** — NestJS backend (modular, domain-driven)
- **`packages/database`** — Prisma ORM, PostgreSQL, migrations
- **`packages/ui`** — Shared design system (Radix UI primitives + custom CSS)
- **`packages/shared`** — Shared types, validators (Zod), constants, utilities
- **`packages/auth`** — Authentication (Auth.js) + RBAC
- **`packages/config`** — Shared ESLint, TypeScript, Prettier configs

> 📖 **Full details**: Read [.ai/ARCHITECTURE.md](.ai/ARCHITECTURE.md)

---

## 🛠️ Tech Stack Quick Reference

| Layer | Technology |
|:---|:---|
| Monorepo | Turborepo + pnpm |
| Frontend | Next.js 15 (App Router) |
| Backend | NestJS (TypeScript) |
| Database | PostgreSQL 16 + Prisma ORM |
| Cache/Queue | Redis + BullMQ |
| Auth | Auth.js (NextAuth) |
| Validation | Zod (shared between frontend & backend) |
| UI Primitives | Radix UI + custom CSS design system |
| Testing | Vitest + Playwright |
| Language | TypeScript (strict mode everywhere) |

> 📖 **Full details & rationale**: Read [.ai/TECH_STACK.md](.ai/TECH_STACK.md)

---

## 🚨 Critical Rules (NEVER VIOLATE)

### Code Quality
1. **TypeScript strict mode is mandatory.** Never use `any` type. Use `unknown` + type guards when type is uncertain.
2. **Never bypass ESLint rules.** Fix the code, don't disable the rule. If a rule is genuinely wrong, discuss it first.
3. **Never commit `console.log` statements.** Use the structured logger (`@unerp/shared/logger`).
4. **All business logic MUST have unit tests.** No exceptions. Target 80%+ coverage.

### UI/UX Aesthetics
5. **Always follow the Frappe/ERPNext UI aesthetic** outlined in Section 8 of `.ai/CONVENTIONS.md`. Apply psychological HCI principles (Hick's Law, Fitts's Law) by removing unnecessary icons, keeping borders soft, and avoiding hardcoded pixels or hex colors.
   - Use `design-tokens.css` strictly for spacing, colors, and typography.
   - For all layouts, use the global UI utility classes defined in `globals.css` (e.g., `.frappe-card`, `.frappe-form-group`, `.frappe-input`, `.frappe-btn`, `.frappe-grid-3`).
   - Do NOT use inline styles for forms or layout. Always use the predefined `.frappe-*` utility classes to achieve 90+ UX consistently across all modules.

### Architecture
6. **Never import directly between ERP modules.** Modules communicate via domain events only. Read [.ai/ARCHITECTURE.md](.ai/ARCHITECTURE.md) Section 4 (Event-Driven Communication).
7. **Never modify `packages/database/prisma/migrations/` manually.** Always use `pnpm db:migrate` to generate migrations from schema changes.
8. **Every database table MUST include `tenant_id`.** Multi-tenancy is enforced at the data layer via Row-Level Security. Read [.ai/SECURITY.md](.ai/SECURITY.md).
9. **Follow the Module Structure Template exactly.** Every new module must match the pattern in [.ai/ARCHITECTURE.md](.ai/ARCHITECTURE.md) Section 3.

### Dependencies & Security
10. **Never add npm dependencies without documenting rationale** in the commit message and updating [.ai/TECH_STACK.md](.ai/TECH_STACK.md).
11. **Never store secrets in code.** Use environment variables. Reference `.env.example` for the required variables.
12. **Never disable CORS, rate limiting, or security headers** without explicit approval.

### Process
13. **Always update [.ai/MODULE_REGISTRY.md](.ai/MODULE_REGISTRY.md)** when creating or modifying ERP modules.
14. **Always update [.ai/CHANGELOG.md](.ai/CHANGELOG.md)** after completing a unit of work.
15. **Always read the relevant `.ai/prompts/` template** before starting a common task (new module, new entity, new endpoint, new page).
16. **Always develop End-to-End.** When requested to "develop" or "build" a page or feature, AI agents MUST provide a completely end-to-end working implementation. This includes the database schema (Prisma), backend API (NestJS Controllers/Services), and the frontend (Next.js) hooked up to the API. Do not just build frontend mocks unless explicitly requested.

### Dev Environment Startup (MANDATORY BEFORE ANY DEV WORK)
16. **Always start the dev environment before making changes.** This allows the user to manually test each new feature in the browser in parallel.
    - **One-command start**: `.\scripts\dev-start.ps1` (from the project root in PowerShell)
    - This script automatically: starts Docker, runs Postgres + Redis, applies migrations, seeds data, and opens the API + Web dev servers.
    - **Manual steps** (if the script cannot be run):
      1. Start Docker Desktop
      2. `cd docker && docker compose up -d postgres redis`
      3. `pnpm db:migrate` (from project root)
      4. `pnpm db:seed` (from project root)
      5. `pnpm dev:api` (opens NestJS on port 3001)
      6. `pnpm dev:web` (opens Next.js on port 3000)
    - **Default test credentials** (after seeding):
      - URL: `http://localhost:3000`
      - Email: `admin@unerp.dev`
      - Password: `admin123`
17. **Always verify both servers are running** before asking the user to test. Confirm port 3001 (API) and 3000 (Web) are listening.

---


## 📁 Navigation Guide

```
ERPSys/
├── AGENTS.md                    ← YOU ARE HERE
├── .ai/                         ← Extended AI context (architecture, conventions, etc.)
│   ├── ARCHITECTURE.md          ← System design, module patterns, data flow
│   ├── CONVENTIONS.md           ← Naming, file structure, code style rules
│   ├── TECH_STACK.md            ← Technology choices & rationale
│   ├── MODULE_REGISTRY.md       ← Status of every ERP module
│   ├── DATA_MODEL.md            ← Entity relationships & schema design
│   ├── API_STANDARDS.md         ← REST API conventions & endpoint design
│   ├── SECURITY.md              ← Security patterns & multi-tenancy
│   ├── TESTING.md               ← Testing strategy & patterns
│   ├── GLOSSARY.md              ← Domain terminology
│   ├── CHANGELOG.md             ← Agent-maintained change log
│   └── prompts/                 ← Pre-built task templates
├── apps/
│   ├── web/                     ← Next.js 15 frontend
│   └── api/                     ← NestJS backend
├── packages/
│   ├── ui/                      ← Design system
│   ├── database/                ← Prisma schema & migrations
│   ├── shared/                  ← Shared types & validators
│   ├── auth/                    ← Authentication & RBAC
│   └── config/                  ← Shared tool configs
├── tools/                       ← Generators & scripts
└── docker/                      ← Docker configs
```

---

## 🔄 Module Development Workflow

When building a new ERP module, follow these steps in order:

### Step 1: Prepare
1. Read [.ai/prompts/new-module.md](.ai/prompts/new-module.md) for the full template
2. Read [.ai/ARCHITECTURE.md](.ai/ARCHITECTURE.md) Section 3 (Module Structure)
3. Check [.ai/MODULE_REGISTRY.md](.ai/MODULE_REGISTRY.md) for existing modules and dependencies

### Step 2: Database Layer
4. Define Prisma models in `packages/database/prisma/schema.prisma`
5. Follow [.ai/DATA_MODEL.md](.ai/DATA_MODEL.md) for entity design rules
6. Generate migration: `pnpm db:migrate --name <module>_initial`
7. Add seed data in `packages/database/prisma/seed.ts`

### Step 3: Backend (NestJS)
8. Create module directory: `apps/api/src/modules/<module-name>/`
9. Follow the exact structure: `module.ts`, `controller.ts`, `service.ts`, `dto/`, `entities/`, `events/`, `tests/`
10. Implement DTOs with Zod validation (shared via `packages/shared`)
11. Follow [.ai/API_STANDARDS.md](.ai/API_STANDARDS.md) for endpoint design

### Step 4: Frontend (Next.js)
12. Create pages: `apps/web/app/(dashboard)/<module-name>/`
13. Use components from `packages/ui` — never create ad-hoc UI components
14. Follow [.ai/prompts/new-ui-page.md](.ai/prompts/new-ui-page.md) for page templates

### Step 5: Testing
15. Write unit tests for all services: `*.service.spec.ts`
16. Write controller tests: `*.controller.spec.ts`
17. Write E2E tests for critical flows
18. Follow [.ai/TESTING.md](.ai/TESTING.md) for patterns

### Step 6: Register
19. Update [.ai/MODULE_REGISTRY.md](.ai/MODULE_REGISTRY.md) with the new module
20. Update [.ai/CHANGELOG.md](.ai/CHANGELOG.md) with what was built
21. Update navigation menus in `apps/web`

---

## 🎯 Current Sprint Context

**Phase**: 11-20 — Advanced Roadmap & UI/UX Overhaul
**Goal**: Plan and implement advanced reporting, industry modules, integration API hub, PWA, and SaaS portal
**Status**: Planning & Designing

### Completed
- ✅ Phase 0 — Foundation (Monorepo, Auth, Admin, multi-tenancy, design system)
- ✅ Phase 1 — Core Business Modules (Finance, HR, CRM, Inventory)
- ✅ Phase 2 — Procurement, Sales & Supply Chain
- ✅ Phase 3 — Project Management & Manufacturing (MRP)
- ✅ Phase 4 — BI, Documents & Communication
- ✅ Phase 5 — POS & Advanced Inventory
- ✅ Phase 6 — Advanced Finance
- ✅ Phase 7 — Advanced HR
- ✅ Phase 8 — Workflow Engine & Approvals
- ✅ Phase 9 — Notifications & Real-Time Events
- ✅ Phase 10 — File Storage & Document Templates
- ✅ Phase 2–10 full compilation check and unit test suite verification

### In Progress
- 🔄 Phase 11–20 Advanced roadmaps mapping and 5-phase breakdown
- 🔄 UI/UX revamp specification design (Odoo & ERPNext/Frappe style layout docs)

### Next
- ⬜ Phase 11 — Advanced Reporting & Dashboards
- ⬜ Phase 12 — Healthcare Industry Module
- ⬜ Phase 13 — Education Industry Module
- ⬜ Phase 14 — Real Estate Industry Module
- ⬜ Phase 15 — Field Service Industry Module
- ⬜ Phase 16 — API Platform & Integration Hub
- ⬜ Phase 17 — Multi-Language (i18n) & Localization
- ⬜ Phase 18 — Mobile Responsive & PWA
- ⬜ Phase 19 — DevOps, CI/CD & Monitoring
- ⬜ Phase 20 — Enterprise SaaS Platform

---

## 📋 Full Phase Roadmap (Phase 0–20)

> Each phase builds on the previous ones. Dependencies are noted per phase.

### Phase 0 — Foundation ✅
**Goal**: Monorepo, auth, admin, design system, multi-tenancy
- Turborepo + pnpm monorepo scaffold
- Next.js 15 App Router frontend shell
- NestJS modular backend with DI, guards, pipes
- PostgreSQL + Prisma ORM with tenant isolation (RLS)
- JWT/RBAC authentication and authorization
- Admin module (users, roles, settings)
- Design system with theme tokens, CSS custom properties
- Vitest unit testing framework

### Phase 1 — Core Business Modules ✅
**Goal**: Finance, HR, CRM, Inventory — the four pillars of any ERP
- **Finance & Accounting**: Invoices, payments, line items, payment tracking
- **Human Resources**: Employee directory, departments, onboarding
- **CRM**: Customer/vendor registry, account management, contact details
- **Inventory & Warehouse**: Products (SKU), warehouses, stock levels, reorder points
- Seed data for all modules, full unit test suite

### Phase 2 — Procurement, Sales & Supply Chain 🔄
**Goal**: Complete the order-to-cash and procure-to-pay cycles
**Depends on**: Phase 1 (Finance, Inventory, CRM)
- **Procurement**: Vendor management, Request for Quotation (RFQ), Purchase Orders, Purchase Receipts, Goods Receipt Notes
- **Sales & Orders**: Quotations, Sales Orders, Delivery Notes, Returns/Credit Notes, Sales pipelines
- **Supply Chain**: Shipment tracking, carrier management, demand forecasting, reorder automation
- **Domain Events**: `order.confirmed → inventory.reserve`, `purchase.received → inventory.increase`, `invoice.auto-create`
- Cross-module event wiring between Sales ↔ Inventory ↔ Finance

### Phase 3 — Project Management & Manufacturing
**Goal**: Time-based and production-based workflows
**Depends on**: Phase 2 (Sales, Inventory, Procurement)
- **Project Management**: Projects, tasks, milestones, Gantt charts, timesheets, project budgets
- **Manufacturing (MRP)**: Bill of Materials (BOM), work orders, production planning, routing, scrap tracking
- **Integration**: Projects → HR (timesheets), Manufacturing → Inventory (raw materials → finished goods)

### Phase 4 — BI, Documents & Communication
**Goal**: Analytics, document lifecycle, and internal messaging
**Depends on**: Phase 1–3 (reads from all modules)
- **Business Intelligence**: Custom dashboards, report builder, KPI widgets, scheduled reports, data export (CSV/PDF)
- **Document Management**: Document upload/storage, folder hierarchy, version control, templates, e-signatures (placeholder)
- **Communication**: Internal messaging, channels/groups, notification center, email template builder

### Phase 5 — POS & Advanced Inventory
**Goal**: Retail operations and advanced warehouse management
**Depends on**: Phase 2 (Sales, Inventory)
- **POS & Retail**: Point-of-sale terminal UI, barcode scanning, receipt printing, cash register, shift management
- **Advanced Inventory**: Serial number tracking, batch/lot tracking, FIFO/LIFO/weighted average costing, bin/location management, cycle counting, inventory valuation reports

### Phase 6 — Advanced Finance
**Goal**: Full-featured accounting engine
**Depends on**: Phase 1 (Finance), Phase 2 (Sales, Procurement)
- Multi-currency with exchange rate management
- Chart of Accounts (full double-entry bookkeeping)
- General Ledger, Trial Balance, Balance Sheet, Profit & Loss
- Budget management (budgets vs. actuals)
- Bank reconciliation (import bank statements, auto-match)
- Tax management (multiple tax rates, GST/VAT, tax returns)
- Accounts Payable / Accounts Receivable aging reports
- Financial year close, opening balances

### Phase 7 — Advanced HR
**Goal**: Full HRMS with payroll, leave, attendance, and performance
**Depends on**: Phase 1 (HR), Phase 6 (Finance for payroll → GL)
- Payroll engine (salary structures, components, deductions, tax calculation)
- Leave management (leave types, accrual policies, approval workflows)
- Attendance tracking (check-in/out, overtime, shift scheduling)
- Performance appraisals (goals, reviews, 360° feedback)
- Training & certification tracking
- Org chart visualization
- Employee self-service portal

### Phase 8 — Workflow Engine & Approvals
**Goal**: Configurable, rule-based approval workflows for all modules
**Depends on**: Phase 1–7 (applies to all modules)
- Visual workflow builder (drag-and-drop, conditions, branches)
- Approval chains (sequential, parallel, conditional)
- Delegation rules (out-of-office, escalation)
- Workflow templates for common flows (PO approval, leave request, invoice approval)
- Audit trail for all workflow transitions
- SLA tracking and breach notifications

### Phase 9 — Notifications & Real-Time Events
**Goal**: Multi-channel notification system
**Depends on**: Phase 4 (Communication), Phase 8 (Workflows)
- WebSocket-based real-time updates (dashboards, notifications)
- Email notifications (transactional via Nodemailer + React Email)
- In-app notification center with read/unread/archive
- Push notifications (web push API)
- Notification preferences (per user, per module, per event)
- Digest/batching (hourly/daily summaries)
- SMS integration (Twilio/SNS placeholder)

### Phase 10 — File Storage & Document Templates
**Goal**: Centralized file management and document generation
**Depends on**: Phase 4 (Documents), Phase 6 (Finance for PDF invoices)
- S3-compatible file storage (MinIO for dev, AWS S3 for prod)
- File upload with type/size validation, virus scanning placeholder
- Document templates (invoices, purchase orders, payslips, contracts)
- PDF generation engine (React-PDF)
- Template customization (logo, colors, fields, layout)
- Bulk document generation (e.g., monthly payslips)
- Document sharing with expiring links

### Phase 11 — Advanced Reporting & Dashboards
**Goal**: Self-service analytics and executive dashboards (Depends on: Phase 4, Phase 6, all data modules)
- **Phase 11.1**: Pivot table matrix view engine allowing drag-and-drop grouping, row-column swapping, and aggregations (Sum, Avg, Min, Max).
- **Phase 11.2**: Drag-and-drop dashboard builder with customizable widgets (line, bar, donut, gauge, funnel charts) powered by ChartJS/Recharts.
- **Phase 11.3**: Advanced custom SQL/Query Builder UI with drag-and-drop filters, sorting, and conditional formatting rules.
- **Phase 11.4**: Automated report delivery engine supporting scheduled exports (PDF/CSV/XLSX) sent via email templates.
- **Phase 11.5**: Role-based executive dashboards (CEO, CFO, Operations Director) with drill-down exploration paths to origin documents.

### Phase 12 — Healthcare Industry Module
**Goal**: Hospital/clinic/pharma management extension (Depends on: Phase 7, Phase 5, Phase 6)
- **Phase 12.1**: Patient EHR/EMR (Electronic Health Record) system, patient intake registry, vitals tracking, and allergy charts.
- **Phase 12.2**: Multi-resource appointment scheduling calendar supporting clinics, practitioner shifts, and patient self-booking templates.
- **Phase 12.3**: Digital prescription management (e-prescribing) and lab order/results reporting with PDF attachments.
- **Phase 12.4**: Pharmacy inventory control with drug batch tracing, barcode verification, expiry alerts, and controlled substance logging.
- **Phase 12.5**: Insurance claims validation workflow (encounters to claims processing) and HIPAA-compliant audit trails.

### Phase 13 — Education Industry Module
**Goal**: School/university management extension (Depends on: Phase 7, Phase 6, Phase 4)
- **Phase 13.1**: Student/Parent information registry, admissions wizard, dynamic enrollment tracking, and gradebook management.
- **Phase 13.2**: Academic course setup, master timetable scheduler (handling rooms, professors, conflict-resolution), and syllabus tracking.
- **Phase 13.3**: Fee structure configuration, automated fee collection runs, scholarship credits, and parent payment gateways.
- **Phase 13.4**: Attendance management dashboard (student daily roster, RFID/barcode integration hooks, staff rosters).
- **Phase 13.5**: Library circulation manager (book registers, barcode scanning, check-in/out, automated fine calculations).

### Phase 14 — Real Estate Industry Module
**Goal**: Property and construction management extension (Depends on: Phase 6, Phase 1, Phase 3)
- **Phase 14.1**: Property registry tree structure (Portfolios ➔ Buildings ➔ Floors ➔ Units) with property specifications, amenities, and floor plans.
- **Phase 14.2**: Tenant lease agreement lifecycle management (lease creation, automated rent invoicing, security deposits, renewals).
- **Phase 14.3**: Tenant portal for maintenance work orders, maintenance dispatch flow, and vendor invoice logging.
- **Phase 14.4**: Commission engine for sales/leasing agents, commission split setups, and integration into Finance general ledger.
- **Phase 14.5**: Property valuation modeller, net operating income (NOI) calculators, and real estate investment yield charts.

### Phase 15 — Field Service Industry Module
**Goal**: Maintenance, utilities, and on-site service management (Depends on: Phase 7, Phase 5, Phase 3)
- **Phase 15.1**: Customer service request ticket system and service level agreement (SLA) status trackers.
- **Phase 15.2**: Technician dispatcher scheduling panel (interactive calendar + map routes overlay showing locations).
- **Phase 15.3**: Technician mobile web view showing checklist forms, inventory check-out (from service van), and customer signature capture.
- **Phase 15.4**: Service contract management, preventative maintenance scheduling (cron-based recurring service tickets).
- **Phase 15.5**: Auto-invoicing for parts and labor, integrating timesheets directly with CRM billing accounts.

### Phase 16 — API Platform & Integration Hub
**Goal**: Open API platform for third-party integrations (Depends on: All core modules)
- **Phase 16.1**: Developer console in admin settings for public API key management (generate, rotate, revoke, name).
- **Phase 16.2**: Webhooks manager allowing subscriptions to system-wide domain events, webhook retries log, and payload customization.
- **Phase 16.3**: OpenAPI/Swagger interactive developer documentation hosted on `/docs` and API rate-limiting guard.
- **Phase 16.4**: Pre-built integration templates / placeholders for major external apps (QuickBooks, Stripe, Salesforce, Shopify).
- **Phase 16.5**: Data import/export wizards with CSV/Excel column-mapping validation templates.

### Phase 17 — Multi-Language (i18n) & Localization
**Goal**: Full internationalization support (Depends on: All UI modules)
- **Phase 17.1**: Integration of next-intl framework and JSON file dictionary structure (en, es, fr, de, ar, zh, hi, ja).
- **Phase 17.2**: Global language switcher widget in navbar and dynamic Right-to-Left (RTL) CSS layouts support.
- **Phase 17.3**: Regional localization parameters for dates, times, currencies, and numeric formats based on active locale.
- **Phase 17.4**: UI-based translation editor in admin modules allowing administrators to override localization text in-database.
- **Phase 17.5**: Database multi-lingual record translation support (localized product descriptions, invoice terms, etc.).

### Phase 18 — Mobile Responsive & PWA
**Goal**: Mobile-first optimizations and offline capability (Depends on: Phase 17, all UI modules)
- **Phase 18.1**: Comprehensive CSS responsive audits and touch-target enhancement for all dashboard layout screens.
- **Phase 18.2**: Progressive Web App (PWA) configuration (manifest, icons, service workers) for installation on iOS/Android home screens.
- **Phase 18.3**: Service worker caching engine supporting offline access to critical workflows (POS, attendance registers).
- **Phase 18.4**: Offline data synchronization queue using IndexDB with automatic reconciliation upon reconnection.
- **Phase 18.5**: Device native hardware access hooks (camera for barcode scanning, GPS geolocation for field service).

### Phase 19 — DevOps, CI/CD & Monitoring
**Goal**: Production-grade deployment and observability (Depends on: All modules)
- **Phase 19.1**: GitHub Actions YAML pipelines for automated build checking, ESLint vetting, and unit testing runs.
- **Phase 19.2**: Multi-stage production Dockerfile optimization and Kubernetes/Docker-compose staging configuration.
- **Phase 19.3**: OpenTelemetry (APM) telemetry instrumentation, logging integration with structured JSON formats, and Grafana dashboard alerts.
- **Phase 19.4**: Database zero-downtime migration protocols, backup validation scripts, and replica failover plans.
- **Phase 19.5**: Sentry error tracking integration and uptime performance status indicators.

### Phase 20 — Enterprise SaaS Platform
**Goal**: Multi-tenant SaaS with subscription billing and marketplace (Depends on: All previous phases)
- **Phase 20.1**: Stripe pricing plan configurations, subscription billing cycles, and automated portal checkouts.
- **Phase 20.2**: Usage-based metering service (API endpoints, disk space, active user count billing restrictions).
- **Phase 20.3**: Dynamic tenant setup wizard allowing organization provisioning on workspace onboarding.
- **Phase 20.4**: Tenant domain mapping router (reverse proxy support for custom domains mapping to tenant subdomains).
- **Phase 20.5**: Admin Super-Panel (SuperAdmin Dashboard) monitoring cross-tenant usage metrics, server health, and subscription statuses.

---

## 📚 Extended Context Files

Before starting any significant work, read the relevant files from `.ai/`:

| Task | Read These Files |
|:---|:---|
| Creating a new module | `ARCHITECTURE.md`, `CONVENTIONS.md`, `prompts/new-module.md` |
| Adding database entities | `DATA_MODEL.md`, `CONVENTIONS.md`, `prompts/new-entity.md` |
| Building API endpoints | `API_STANDARDS.md`, `CONVENTIONS.md`, `prompts/new-api-endpoint.md` |
| Building UI pages | `CONVENTIONS.md`, `prompts/new-ui-page.md` |
| Fixing bugs | `prompts/bugfix.md` |
| Reviewing code | `prompts/review.md`, `SECURITY.md`, `TESTING.md` |
| Understanding the domain | `GLOSSARY.md`, `MODULE_REGISTRY.md` |
