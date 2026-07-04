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

## 📊 Mandatory Tracking Convention — The 3-File System

> **This section is non-negotiable for every AI agent that touches this repo** — named
> (Claude Code, Antigravity, Cursor, GitHub Copilot, Windsurf, Aider) or unnamed, present
> or future. It echoes the framing at the top of this file: if you are an AI agent working
> on UniERP, you MUST follow this, no exceptions, not even for "small" changes.

UniERP tracks its entire state in exactly **three files**. Nothing else counts as documentation of record:

| File | Purpose |
|:---|:---|
| [`.ai/MODULE_REGISTRY.md`](.ai/MODULE_REGISTRY.md) | Module status/phase/entities/paths for all 31 modules, **plus the § Collab Board** (live multi-agent sync — active claims, up-next work, recently completed, conflict log) |
| [`.ai/CHANGELOG.md`](.ai/CHANGELOG.md) | Append-only history — one entry per feature/fix/refactor, ever |
| [`.ai/HANDBOOK.md`](.ai/HANDBOOK.md) | Architecture, coding conventions, data model, API standards, tech stack, security, testing — the "how we build" reference |

**The concrete rule, every session, every task, no exceptions:**
1. **Before starting work** — read `MODULE_REGISTRY.md` § Collab Board (Active Claims + Up Next). Don't start on something already claimed or already built.
2. **After finishing any unit of work** — however small:
   - Add an entry to `CHANGELOG.md` (what changed + why).
   - Update `MODULE_REGISTRY.md` (module status/table if a module changed; move your Collab Board claim from Active Claims to Recently Completed).
   - This applies even to one-line fixes and doc tweaks. "Too small to log" is not a valid exception.
3. **Applies retroactively** — if you discover past work that was never logged (a module that exists in code but isn't in the registry, a merged change with no CHANGELOG entry), backfill it rather than leaving it invisible. Undocumented work is invisible to every other agent and gets silently duplicated. (A dedicated backfill pass may already be in flight for pre-existing gaps as of 2026-07 — check `MODULE_REGISTRY.md` § Collab Board before doing a large backfill yourself to avoid colliding with it. But going forward, this gap must not recur — log as you go.)

Every other rule file in this repo (`.claude/agents/*.md`, `.cursor/rules/unerp-agents.mdc`, `.github/copilot-instructions.md`) points back to this section rather than restating it. This is the single source of truth for the tracking convention.

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

> 📖 **Full details**: Read [.ai/HANDBOOK.md#architecture-reference](.ai/HANDBOOK.md#architecture-reference)

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

> 📖 **Full details & rationale**: Read [.ai/HANDBOOK.md#tech-stack](.ai/HANDBOOK.md#tech-stack)

---

## 🚨 Critical Rules (NEVER VIOLATE)

### Code Quality
1. **TypeScript strict mode is mandatory.** Never use `any` type. Use `unknown` + type guards when type is uncertain.
2. **Never bypass ESLint rules.** Fix the code, don't disable the rule. If a rule is genuinely wrong, discuss it first.
3. **Never commit `console.log` statements.** Use the structured logger (`@unerp/shared/logger`).
4. **All business logic MUST have unit tests.** No exceptions. Target 80%+ coverage.

### UI/UX Aesthetics
5. **Always follow the Frappe/ERPNext UI aesthetic** outlined in [.ai/HANDBOOK.md#frappe-erpnext-ui-aesthetic](.ai/HANDBOOK.md#frappe-erpnext-ui-aesthetic) (Coding Conventions § 8). Apply psychological HCI principles (Hick's Law, Fitts's Law) by removing unnecessary icons, keeping borders soft, and avoiding hardcoded pixels or hex colors.
   - Use `design-tokens.css` strictly for spacing, colors, and typography.
   - For all layouts, use the global UI utility classes defined in `globals.css` (e.g., `.frappe-card`, `.frappe-form-group`, `.frappe-input`, `.frappe-btn`, `.frappe-grid-3`, `.frappe-breadcrumb`).
   - Do NOT use inline styles for forms or layout. Always use the predefined `.frappe-*` utility classes to achieve 90+ UX consistently across all modules.
   - **Page Breadcrumb Navigation**: Every application page must display a dynamic breadcrumb header navigation representing the hierarchy of parent pages: `Apps / [Application Name] / [Sub-pages]...`. This is handled centrally in `apps/web/app/(dashboard)/layout.tsx`. If creating new route paths, register their human-readable segment mappings in `SEGMENT_NAMES` in `layout.tsx`.

### Architecture
6. **Never import directly between ERP modules.** Modules communicate via domain events only. Read [.ai/HANDBOOK.md#architecture-reference](.ai/HANDBOOK.md#architecture-reference) Section 4 (Event-Driven Communication).
7. **Never modify `packages/database/prisma/migrations/` manually.** Always use `pnpm db:migrate` to generate migrations from schema changes.
8. **Every database table MUST include `tenant_id`.** Multi-tenancy is enforced at the data layer via Row-Level Security. Read [.ai/HANDBOOK.md#security](.ai/HANDBOOK.md#security).
9. **Follow the Module Structure Template exactly.** Every new module must match the pattern in [.ai/HANDBOOK.md#architecture-reference](.ai/HANDBOOK.md#architecture-reference) Section 3.

### Dependencies & Security
10. **Never add npm dependencies without documenting rationale** in the commit message and updating [.ai/HANDBOOK.md#tech-stack](.ai/HANDBOOK.md#tech-stack).
11. **Never store secrets in code.** Use environment variables. Reference `.env.example` for the required variables.
12. **Never disable CORS, rate limiting, or security headers** without explicit approval.

### Change History (Audit Trail)
13. **Every entity mutation endpoint MUST use `@TrackChanges('EntityType')` decorator.** This ensures field-level change history is recorded automatically. Import from `../../common/decorators/track-changes.decorator` and apply `@UseInterceptors(ChangeHistoryInterceptor)` alongside.
14. **Every record detail page MUST include `<ChangeHistory entityType="X" entityId={id} />` at the bottom.** This displays the ERPNext-style edit timeline in light gray below the main content. Import from `@unerp/ui`.

### RBAC & Access Control
15. **Every new endpoint MUST use `@Permissions('module.resource.action')` decorator.** Register new permissions in `packages/shared/src/permissions/registry.ts`.
16. **Every UI component that controls a privileged action MUST be wrapped in `<ProtectedComponent permission="x">`** to conditionally render based on user permissions. Import from `@unerp/ui`.

### Process
17. **Always update [.ai/MODULE_REGISTRY.md](.ai/MODULE_REGISTRY.md)** when creating or modifying ERP modules. See § Mandatory Tracking Convention above — this is non-negotiable.
18. **Always update [.ai/CHANGELOG.md](.ai/CHANGELOG.md)** after completing a unit of work. See § Mandatory Tracking Convention above.
19. **Always read [.ai/prompts/MASTER_PROMPT.md](.ai/prompts/MASTER_PROMPT.md)** before starting any task — it is the single master prompt (mission/scale goal, the 3-file tracking system, the Codebase Growth Tracker protocol, and task templates for new module/entity/endpoint/UI page/bugfix/review).
16. **Always develop End-to-End.** When requested to "develop" or "build" a page or feature, AI agents MUST provide a completely end-to-end working implementation. This includes the database schema (Prisma), backend API (NestJS Controllers/Services), and the frontend (Next.js) hooked up to the API. Do not just build frontend mocks unless explicitly requested.
17. **Zero-Code Builder Philosophy.** The Builder Studio module is strictly a **No-Code / Low-Code environment** aimed at non-technical users. AI agents MUST NOT provide "code snippets", "developer instructions", or expect the user to manually copy-paste React code to deploy forms. All form deployment, layout adjustment, and page creation MUST be handled via visual UI controls and dynamic rendering (via the Page Registry). Read [.ai/HANDBOOK.md#builder-studio-conventions](.ai/HANDBOOK.md#builder-studio-conventions).

### Dev Environment Startup (MANDATORY BEFORE ANY DEV WORK)
18. **Always start the dev environment before making changes.** This allows the user to manually test each new feature in the browser in parallel.
    - **One-command start**: `.\scripts\docker-start.ps1` (from the project root in PowerShell)
    - This script automatically: starts Docker, launches the containerized dev stack (Postgres, Redis, MinIO, and the API/Web app inside a single development container), runs database migrations, seeds data, and waits for health checks.
    - **Manual steps** (if the script cannot be run):
      1. Start Docker Desktop
      2. `docker compose -f docker-compose.dev.yml up -d --build`
    - **Default test credentials** (after seeding):
      - URL: `http://localhost:3000`
      - Email: `admin@unerp.dev`
      - Password: `admin123`
19. **Always verify both servers are running** before asking the user to test. Confirm port 3001 (API) and 3000 (Web) are listening.
20. **Never run browser testing subagents** unless explicitly requested by the user. The user will handle manual testing in the browser themselves.

---

## 🔄 Multi-Agent Collaboration Protocol (Claude Code ⇄ Antigravity ⇄ others)

> This section is the detailed operating protocol for the Collab Board named in
> § Mandatory Tracking Convention above. Read that section first for the 3-file
> system as a whole; this section is the step-by-step mechanics of the Collab
> Board specifically.

This repo is developed in parallel by more than one AI coding tool — this Claude
Code CLI session and Google's **Antigravity** IDE agent (and potentially others,
per the "any future tool" line at the top of this file). They do not share a
process, memory, or message bus. **The git repo plus [.ai/MODULE_REGISTRY.md#collab-board--multi-agent-sync](.ai/MODULE_REGISTRY.md#collab-board--multi-agent-sync)
is the only synchronization mechanism.** Every agent MUST follow this protocol —
it costs one file read/write per session and prevents silently clobbered work.

**On starting any session or non-trivial task:**
1. `git status` / `git pull` first — never start work on a stale tree.
2. Read [.ai/MODULE_REGISTRY.md § Collab Board](.ai/MODULE_REGISTRY.md#collab-board--multi-agent-sync) §1 (Active Claims). If another
   agent's claimed scope overlaps files/modules you're about to touch, **stop**
   — pick a different item from §2 (Up Next), or flag the overlap to the user.
3. Add a row to §1 with your agent name, start time, and scope (module or file
   list) before writing any code.

**While working:**
4. Keep diffs scoped to your claimed scope. If you need to touch something
   outside it (a shared cross-cutting file, e.g. `csrf.middleware.ts`), note it
   in your claim row rather than expanding silently.
5. Commit in small, coherent units and push promptly — per
   [[feedback-module-completion-strategy]], always commit+push after a working
   unit, don't let uncommitted work pile up (it's invisible to the other agent
   until pushed).

**On finishing:**
6. Update `.ai/MODULE_REGISTRY.md` / `.ai/CHANGELOG.md` as usual (rules 17–18
   above).
7. Move your row from §1 to §3 (Recently Completed) in `MODULE_REGISTRY.md` § Collab Board with a
   one-line result and commit hash.
8. If §2 (Up Next) is thin or stale, add newly-identified work (bugs found,
   follow-ups, PM-scoped items) so the next agent — human or AI — always has a
   ready answer to "what should I build next?" without re-deriving it.

**On conflict** (you discover another agent's unpushed/uncommitted work
touching the same files): do not silently overwrite. Log it in
`MODULE_REGISTRY.md` § Collab Board §4 and either merge, rebase, or defer — never force-push over
another agent's in-flight work.

---

## 🤖 Role-Based Subagent Team

This project ships a team of specialized subagents in [`.claude/agents/`](.claude/agents/). Each acts as a domain expert and is expected to **read this `AGENTS.md` and the relevant `.ai/` files first** (subagents do not auto-inherit this context). Delegate to the right role instead of doing everything in one thread:

| Agent | Owns | Typical trigger |
|:---|:---|:---|
| `product-manager` | Scope, user stories, acceptance criteria, sequencing | "What/why should we build?" |
| `uiux-designer` | Layout, design tokens, `@unerp/ui`, accessibility, Frappe aesthetic | Any UI/UX decision |
| `data-architect` | Prisma schema, migrations, indexes, multi-tenant RLS | Data-model changes |
| `backend-developer` | NestJS modules, services, DTOs, domain events, RBAC | Server-side APIs |
| `frontend-developer` | Next.js App Router pages, API wiring, forms | Client-side UI |
| `fullstack-developer` | End-to-end vertical slices (DB→API→UI) | New module/feature slice |
| `devops-engineer` | Turbo/pnpm, Docker, CI/CD, migrations-in-deploy, observability | Build/infra/pipeline |
| `qa-tester` | Vitest/Playwright, edge cases, tenant/RBAC tests | Verify before ship |
| `business-analyst-uat` | UAT scripts, business-rule validation, sign-off | End-user acceptance |
| `code-reviewer` | Diff review vs. project rules, correctness | Before merge |
| `security-auditor` | Auth, tenant isolation, injection, secrets, HIPAA | Security-sensitive change |
| `tech-writer` | `.ai/` docs, CHANGELOG, MODULE_REGISTRY, API docs | Keep docs true |

**Typical flow for a feature:** product-manager → data-architect → backend-developer + frontend-developer (or fullstack-developer) → qa-tester → code-reviewer → security-auditor → business-analyst-uat → tech-writer.

---

## 📁 Navigation Guide

```
ERPSys/
├── AGENTS.md                    ← YOU ARE HERE
├── .ai/                         ← Extended AI context (architecture, conventions, etc.)
│   ├── MODULE_REGISTRY.md       ← Status of every ERP module + Collab Board (multi-agent sync)
│   ├── HANDBOOK.md              ← Consolidated reference: architecture, conventions
│   │                              (incl. Frappe/ERPNext UI aesthetic), data model, API
│   │                              standards, tech stack, security, testing, GitHub rules,
│   │                              Builder Studio conventions, glossary
│   ├── CHANGELOG.md             ← Agent-maintained change log
│   └── prompts/MASTER_PROMPT.md ← Single master prompt (mission, tracking, growth, task templates)
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
1. Read [.ai/prompts/MASTER_PROMPT.md](.ai/prompts/MASTER_PROMPT.md) § New Module for the full template
2. Read [.ai/HANDBOOK.md#architecture-reference](.ai/HANDBOOK.md#architecture-reference) Section 3 (Module Structure)
3. Check [.ai/MODULE_REGISTRY.md](.ai/MODULE_REGISTRY.md) for existing modules and dependencies

### Step 2: Database Layer
4. Define Prisma models in `packages/database/prisma/schema.prisma`
5. Follow [.ai/HANDBOOK.md#data-model](.ai/HANDBOOK.md#data-model) for entity design rules
6. Generate migration: `pnpm db:migrate --name <module>_initial`
7. Add seed data in `packages/database/prisma/seed.ts`

### Step 3: Backend (NestJS)
8. Create module directory: `apps/api/src/modules/<module-name>/`
9. Follow the exact structure: `module.ts`, `controller.ts`, `service.ts`, `dto/`, `entities/`, `events/`, `tests/`
10. Implement DTOs with Zod validation (shared via `packages/shared`)
11. Follow [.ai/HANDBOOK.md#api-standards](.ai/HANDBOOK.md#api-standards) for endpoint design

### Step 4: Frontend (Next.js)
12. Create pages: `apps/web/app/(dashboard)/<module-name>/`
13. Use components from `packages/ui` — never create ad-hoc UI components
14. Follow [.ai/prompts/MASTER_PROMPT.md](.ai/prompts/MASTER_PROMPT.md) § New UI Page for page templates

### Step 5: Testing
15. Write unit tests for all services: `*.service.spec.ts`
16. Write controller tests: `*.controller.spec.ts`
17. Write E2E tests for critical flows
18. Follow [.ai/HANDBOOK.md#testing](.ai/HANDBOOK.md#testing) for patterns

### Step 6: Register
19. Update [.ai/MODULE_REGISTRY.md](.ai/MODULE_REGISTRY.md) with the new module
20. Update [.ai/CHANGELOG.md](.ai/CHANGELOG.md) with what was built
21. Update navigation menus in `apps/web`

---

## 🎯 Current Sprint Context

**Phase**: Post-Phase-20 — Module hardening, UI framework consolidation, E-Commerce & AI Copilot
**Goal**: All 31 planned modules (Phase 0–20) are built and marked ACTIVE/ENHANCED in `.ai/MODULE_REGISTRY.md`. Current work is enterprise hardening (see `.ai/MODULE_REGISTRY.md` § Production Readiness & Hardening), the `@unerp/framework` frontend runtime consolidation, and new cross-cutting modules (E-Commerce Storefront, AI Copilot).
**Status**: See `.ai/MODULE_REGISTRY.md` for authoritative per-module status, § Production Readiness & Hardening for the hardening roadmap, and § Studio Backlog for active Studio sprint tracking.

### Completed (Phase 0–20 — see `.ai/MODULE_REGISTRY.md` for verified module-level detail)
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
- ✅ Phase 11 — Advanced Reporting & Dashboards
- ✅ Phase 12 — Healthcare Industry Module
- ✅ Phase 13 — Education Industry Module
- ✅ Phase 14 — Real Estate Industry Module
- ✅ Phase 15 — Field Service Industry Module
- ✅ Phase 16 — API Platform & Integration Hub
- ✅ Phase 17 — Multi-Language (i18n) & Localization
- ✅ Phase 18 — Mobile Responsive & PWA
- ✅ Phase 19 — DevOps, CI/CD & Monitoring
- ✅ Phase 20 — Enterprise SaaS Platform

### In Progress
- 🔄 `@unerp/framework` — unified schema-driven frontend runtime (see `.ai/MODULE_REGISTRY.md` Shared Packages, currently 🟡 IN_PROGRESS)
- 🔄 Enterprise hardening plan phases (dependency-cruiser lint, DTO standardization, god-class refactors) — see `.ai/MODULE_REGISTRY.md` § Production Readiness & Hardening

### Next
- Track ongoing/backlog work in `.ai/MODULE_REGISTRY.md` § Studio Backlog and § Collab Board §2 (Up Next) rather than here — this list is a snapshot and goes stale quickly under multi-agent development.

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

Before starting any significant work, read the relevant files from `.ai/`. For task-specific
step-by-step templates (new module, new entity, new API endpoint, new UI page, bugfix, code
review), read `prompts/MASTER_PROMPT.md` § Task Templates by Type instead of a per-task file —
there is now one master prompt, not several.

| Task | Read These Files |
|:---|:---|
| Any task (start here) | `prompts/MASTER_PROMPT.md` |
| Creating a new module | `HANDBOOK.md#architecture-reference`, `HANDBOOK.md#coding-conventions`, `prompts/MASTER_PROMPT.md` § New Module |
| Adding database entities | `HANDBOOK.md#data-model`, `HANDBOOK.md#coding-conventions`, `prompts/MASTER_PROMPT.md` § New Entity |
| Building API endpoints | `HANDBOOK.md#api-standards`, `HANDBOOK.md#coding-conventions`, `prompts/MASTER_PROMPT.md` § New API Endpoint |
| Building UI pages | `HANDBOOK.md#coding-conventions`, `prompts/MASTER_PROMPT.md` § New UI Page |
| Fixing bugs | `prompts/MASTER_PROMPT.md` § Bugfix |
| Reviewing code | `prompts/MASTER_PROMPT.md` § Code Review, `HANDBOOK.md#security`, `HANDBOOK.md#testing` |
| Understanding the domain | `HANDBOOK.md#glossary`, `MODULE_REGISTRY.md` |
| Working on the Builder Studio | `HANDBOOK.md#builder-studio-conventions` |
