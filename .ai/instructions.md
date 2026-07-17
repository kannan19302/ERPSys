# INSTRUCTIONS.md — UniERP Supreme Governance & Standards

> **Authority**: This file is the **supreme instruction set** for all AI coding agents
> (Claude, Gemini/Antigravity, GPT, Copilot, Cursor, Aider, Codex, or any future tool)
> working on UniERP. It consolidates every coding standard, architecture flow, policy,
> and governance rule into a single authoritative reference.
>
> **Read this file FIRST** — before `AGENTS.md`, `AUTOPILOT.md`, `HANDBOOK.md`, or any
> other documentation. Every rule here is binding and non-negotiable.
>
> **Goal**: Make UniERP the **#1 ERP platform** in the world — surpassing SAP S/4HANA,
> Oracle NetSuite, Microsoft Dynamics 365, Workday, Salesforce, Odoo, ERPNext, Infor,
> Acumatica, and Epicor in features, architecture, and developer experience.

---

## Table of Contents

1. [Architecture Flows](#1-architecture-flows)
2. [Frontend Standards](#2-frontend-standards)
3. [Backend Policies](#3-backend-policies)
4. [Database Rules](#4-database-rules)
5. [Authentication & Security Governance](#5-authentication--security-governance)
6. [Package & Dependency Governance](#6-package--dependency-governance)
7. [Testing Mandate](#7-testing-mandate)
8. [ADP Performance Targets](#8-adp-performance-targets)
9. [Feature Ledger Accuracy](#9-feature-ledger-accuracy)
10. [Git & Branch Policy](#10-git--branch-policy)
11. [Repository Hygiene](#11-repository-hygiene)
12. [PM Agent Market Research Protocol](#12-pm-agent-market-research-protocol)
13. [Cycle-End Mandatory Checklist](#13-cycle-end-mandatory-checklist)
14. [Production-Grade Mandate](#14-production-grade-mandate)
15. [Cross-File Reference Map](#15-cross-file-reference-map)

---

## 1. Architecture Flows

> Every AI agent must understand the full data flow across all layers before writing
> any code. These diagrams are the canonical reference.

### 1.1 Full Request Lifecycle

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          USER → BROWSER → SERVER → DB                       │
│                                                                             │
│  User Action                                                                │
│    │                                                                        │
│    ▼                                                                        │
│  Next.js App Router (apps/web)                                              │
│    │  ├── Server Component: direct fetch / tRPC server call                 │
│    │  └── Client Component: useApiClient() → REST / tRPC                    │
│    │                                                                        │
│    ▼                                                                        │
│  NestJS API (apps/api)                                                      │
│    │  1. Global Middleware (CORS, Helmet, CSRF, Rate Limiter)               │
│    │  2. Auth Guard (JWT validation → extract user + tenantId)              │
│    │  3. Tenant Guard (verify tenant context, set AsyncLocalStorage)        │
│    │  4. RBAC Guard (check @Permissions decorator against user roles)       │
│    │  5. Validation Pipe (Zod schema validation on DTO)                     │
│    │  6. Controller (thin — delegates to service)                           │
│    │  7. Service (business logic, domain events)                            │
│    │  8. Change History Interceptor (@TrackChanges audit trail)             │
│    │                                                                        │
│    ▼                                                                        │
│  Prisma ORM (packages/database)                                             │
│    │  1. Tenant-scoping extension (auto-inject WHERE tenant_id = ?)        │
│    │  2. RLS context (SET LOCAL app.current_tenant_id in transaction)       │
│    │  3. Soft-delete filter (auto-exclude deleted_at IS NOT NULL)           │
│    │                                                                        │
│    ▼                                                                        │
│  PostgreSQL 16                                                              │
│    │  1. Row-Level Security policies (defense in depth)                     │
│    │  2. Indexes (tenant_id composite, full-text search)                    │
│    │  3. ACID transactions (business invariant protection)                  │
│    │                                                                        │
│    ▼                                                                        │
│  Response flows back through the same chain (serialized, paginated)         │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Frontend Architecture Flow

```
┌────────────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js 15 App Router)             │
│                                                                 │
│  apps/web/app/                                                  │
│    │                                                            │
│    ├── (auth)/                    ← Public routes (login etc.)  │
│    │     └── layout.tsx           ← Centered auth layout        │
│    │                                                            │
│    ├── (dashboard)/               ← Protected routes            │
│    │     ├── layout.tsx           ← Sidebar + Header + Breadcrumbs│
│    │     │   └── SEGMENT_NAMES   ← Register new route labels   │
│    │     ├── [module]/            ← Module pages                │
│    │     │   ├── page.tsx         ← List view (DataTable)       │
│    │     │   ├── [id]/page.tsx    ← Detail view (ChangeHistory) │
│    │     │   └── new/page.tsx     ← Create form                 │
│    │     └── page.tsx             ← Home dashboard              │
│    │                                                            │
│    └── layout.tsx                 ← Root layout (providers)     │
│                                                                 │
│  Data Fetching Strategy:                                        │
│    ├── Server Components: RSC data loading (default)            │
│    ├── Client Components: useApiClient() + React Query          │
│    ├── RouteGuard: permission-gated page rendering              │
│    └── Forms: React Hook Form + Zod validation                  │
│                                                                 │
│  UI Framework:                                                  │
│    ├── @unerp/ui-tokens         ← Design tokens (CSS vars)     │
│    ├── @unerp/ui-components     ← Reusable components          │
│    ├── @unerp/ui (facade)       ← Backward-compat import       │
│    ├── globals.css               ← .ui-* utility classes        │
│    └── CSS Modules               ← Component-scoped styles      │
└────────────────────────────────────────────────────────────────┘
```

### 1.3 Backend Architecture Flow

```
┌────────────────────────────────────────────────────────────────┐
│                    BACKEND (NestJS Modular Monolith)            │
│                                                                 │
│  apps/api/src/                                                  │
│    │                                                            │
│    ├── main.ts                    ← Bootstrap + global pipes    │
│    ├── app.module.ts              ← Root module (imports all)   │
│    │                                                            │
│    ├── common/                    ← Shared infrastructure       │
│    │   ├── guards/                ← Auth, Tenant, RBAC guards   │
│    │   ├── decorators/            ← @Permissions, @TrackChanges │
│    │   ├── interceptors/          ← ChangeHistory, Logging      │
│    │   ├── pipes/                 ← ZodValidation pipe          │
│    │   ├── filters/               ← Global exception filters    │
│    │   ├── middleware/            ← CSRF, tenant resolution      │
│    │   └── integrations/          ← Common ports (AI, reporting) │
│    │                                                            │
│    └── modules/                   ← Domain modules              │
│        ├── finance/               ← Finance & Accounting        │
│        ├── crm/                   ← CRM & Sales                 │
│        ├── inventory/             ← Inventory & Warehouse       │
│        ├── hr/                    ← Human Resources             │
│        ├── procurement/           ← Procurement                 │
│        ├── manufacturing/         ← Manufacturing (MRP)         │
│        └── [30+ more modules]     ← See MODULE_REGISTRY.md      │
│                                                                 │
│  Module Internal Structure (MANDATORY for every module):        │
│    modules/<name>/                                              │
│    ├── <name>.module.ts           ← @Module definition          │
│    ├── <name>.controller.ts       ← THIN controller             │
│    ├── <name>.service.ts          ← ALL business logic          │
│    ├── dto/                       ← Zod-validated DTOs          │
│    ├── entities/                  ← Domain entity types          │
│    ├── events/                    ← Domain event definitions     │
│    └── tests/                     ← Co-located tests            │
│                                                                 │
│  Cross-Module Communication:                                    │
│    ├── Domain Events (EventEmitter2) ← Non-critical signals     │
│    ├── Common Integration Ports     ← Approved narrow APIs       │
│    └── Transactional Outbox (#17)   ← Critical facts (future)   │
│    ⛔ NEVER: Direct imports between modules                     │
└────────────────────────────────────────────────────────────────┘
```

### 1.4 Database Architecture Flow

```
┌────────────────────────────────────────────────────────────────┐
│                    DATABASE (PostgreSQL 16 + Prisma)            │
│                                                                 │
│  Schema Source of Truth:                                        │
│    packages/database/prisma/schema.prisma                       │
│                                                                 │
│  Migration Flow:                                                │
│    1. Edit schema.prisma                                        │
│    2. pnpm db:migrate --name <module>_<description>             │
│    3. Review generated SQL in migrations/                       │
│    4. pnpm db:deploy (applies migrations)                       │
│    ⛔ NEVER: pnpm db:push (disabled by guard)                   │
│    ⛔ NEVER: Manual edit of migration files                     │
│    ⛔ NEVER: Destructive SQL without approved reconciliation    │
│                                                                 │
│  Tenant Isolation (4 layers):                                   │
│    Layer 1: JWT token → extract tenant_id                       │
│    Layer 2: NestJS TenantGuard → validate context               │
│    Layer 3: Prisma extension → auto WHERE tenant_id = ?         │
│    Layer 4: PostgreSQL RLS → defense in depth                   │
│                                                                 │
│  Every Table MUST Have:                                         │
│    ├── id           VARCHAR(30) PK  ← CUID2 format             │
│    ├── tenant_id    VARCHAR(30) NN  ← FK to tenants             │
│    ├── created_at   TIMESTAMPTZ NN  ← DEFAULT NOW()             │
│    ├── updated_at   TIMESTAMPTZ NN  ← @updatedAt                │
│    ├── created_by   VARCHAR(30)     ← FK to users               │
│    └── updated_by   VARCHAR(30)     ← FK to users               │
│                                                                 │
│  Money Fields:      Decimal(15, 2)  ← NEVER Float              │
│  IDs:               CUID2           ← NEVER auto-increment      │
│  Enums:             String + Zod    ← NEVER Postgres enums      │
│  Soft Deletes:      deleted_at      ← NULL = active             │
└────────────────────────────────────────────────────────────────┘
```

### 1.5 Auth & Security Flow

```
┌────────────────────────────────────────────────────────────────┐
│                    AUTH & SECURITY FLOW                          │
│                                                                 │
│  Login:                                                         │
│    Browser → POST /auth/login → NextAuth → bcrypt verify        │
│    → Issue JWT (15min) + Refresh Token (7d, HttpOnly cookie)    │
│    → Session stored in Redis (24h)                              │
│                                                                 │
│  Every API Request:                                             │
│    1. Extract Bearer token from Authorization header            │
│    2. Validate JWT signature + expiry (jose library)            │
│    3. Extract: sub(userId), tenantId, roles[], orgId            │
│    4. TenantGuard: verify tenant active, set context            │
│    5. RbacGuard: check @Permissions against user.roles.perms    │
│    6. If pass → controller → service → Prisma (tenant-scoped)  │
│    7. If fail → 401 Unauthorized or 403 Forbidden              │
│                                                                 │
│  Permission Format: <module>.<resource>.<action>                │
│    Example: finance.invoice.create                              │
│    Registry: packages/shared/src/permissions/registry.ts        │
│                                                                 │
│  Token Refresh:                                                 │
│    POST /auth/refresh → validate refresh cookie → new JWT       │
│                                                                 │
│  Security Headers: Helmet (CSP, COEP, COOP, CORP, Referrer)    │
│  Rate Limiting: @nestjs/throttler (per-tenant, per-tier)        │
│  CSRF: Double-submit cookie pattern                             │
│  Input: Zod validation on ALL inputs, parameterized queries     │
│  Audit: Every mutation → AuditLog (append-only, immutable)      │
└────────────────────────────────────────────────────────────────┘
```

### 1.6 Package Dependency Graph

```
┌────────────────────────────────────────────────────────────────┐
│                    PACKAGE DEPENDENCY GRAPH                      │
│                                                                 │
│  apps/web ──────► @unerp/ui (facade → ui-* packages)           │
│      │            @unerp/shared (types, validators)             │
│      │            @unerp/auth (session, guards)                 │
│      │            @unerp/database (types only, NEVER queries)   │
│      │            @unerp/framework (schema-driven runtime)      │
│                                                                 │
│  apps/api ──────► @unerp/shared (types, validators)             │
│      │            @unerp/auth (RBAC, guards)                    │
│      │            @unerp/database (Prisma client)               │
│                                                                 │
│  @unerp/ui ────► @unerp/shared (types only)                    │
│  @unerp/auth ──► @unerp/shared + @unerp/database               │
│                                                                 │
│  Rules:                                                         │
│    ✅ apps/ → packages/                                         │
│    ✅ packages/ → other packages/                               │
│    ⛔ packages/ → apps/ (NEVER)                                 │
│    ⛔ Circular dependencies (NEVER)                             │
│    ⛔ Direct cross-module imports in apps/api (NEVER)           │
│    Check: pnpm architecture:check                               │
└────────────────────────────────────────────────────────────────┘
```

### 1.7 Event-Driven Cross-Module Flow

```
┌────────────────────────────────────────────────────────────────┐
│                    CROSS-MODULE EVENT FLOW                       │
│                                                                 │
│  Module A (producer)                                            │
│    │  1. Business logic executes in service                     │
│    │  2. Prisma transaction commits                             │
│    │  3. EventEmitter2.emit('domain.entity.action', payload)    │
│    │                                                            │
│    ▼                                                            │
│  Event Bus (in-process, best-effort)                            │
│    │                                                            │
│    ▼                                                            │
│  Module B (consumer)                                            │
│    │  @OnEvent('domain.entity.action')                          │
│    │  Handles event, writes own data, idempotent                │
│    │                                                            │
│  Event Naming: <domain>.<entity>.<past_tense_action>            │
│    finance.invoice.created                                      │
│    sales.order.confirmed                                        │
│    inventory.stock.depleted                                     │
│    hr.employee.onboarded                                        │
│                                                                 │
│  CRITICAL: EventEmitter2 is LEGACY BEST-EFFORT.                 │
│    ⛔ Do NOT use for critical business invariants               │
│    ⛔ Do NOT use for external integrations                      │
│    ✅ Transactional Outbox (#17) required for critical facts    │
│    ✅ Consumers must be idempotent + at-least-once safe         │
└────────────────────────────────────────────────────────────────┘
```

---

## 2. Frontend Standards

### 2.1 UniERP Design System (Mandatory)

Every UI page, component, and layout MUST use the UniERP Design System. No exceptions.

| Rule                                                                     | Enforcement                                     |
| :----------------------------------------------------------------------- | :---------------------------------------------- |
| Use `@unerp/ui-tokens` CSS variables for all colors, spacing, typography | No hardcoded hex (`#fff`) or pixels (`16px`)    |
| Use `.ui-*` utility classes from `globals.css` for layouts               | No inline styles for forms or structural layout |
| Use `<DataTable>` from `@unerp/ui` for all entity lists                  | No hand-rolled `<table>` markup                 |
| Use `<ChangeHistory>` on every record detail page                        | ERPNext-style audit timeline                    |
| Use `<ProtectedComponent>` for privileged UI actions                     | Permission-gated rendering                      |
| Use `lucide-react` for all icons                                         | Tree-shakeable, consistent set                  |
| Register new route segments in `SEGMENT_NAMES` in `layout.tsx`           | Dynamic breadcrumb navigation                   |

### 2.2 HCI Principles (Non-Negotiable)

| Principle       | Application                                                                                   |
| :-------------- | :-------------------------------------------------------------------------------------------- |
| **Hick's Law**  | Remove unnecessary icons; text + chevron for dropdowns; minimize options per view             |
| **Fitts's Law** | Min 32px height for dense views, 40px for standard; clickable areas extend to container edges |
| **Gestalt**     | Subtle borders (`#e2e8f0`), subdued shadows (0.04–0.05 opacity), sharp radius (4–6px)         |

### 2.3 Component Patterns

- **Server Components by default** — no `'use client'` unless interactivity required
- **Client boundary as deep as possible** — push `'use client'` to leaf components
- **React Query (TanStack)** for client-side cache
- **React Hook Form + Zod** for all forms
- **No global state libraries** — React Context for theme/auth only
- **Named exports only** (except Next.js pages which require default exports)

### 2.4 Data Table Conventions

- Every entity list MUST use `<DataTable>` with `sortable`, `sortBy`, `sortOrder`, `onSortChange`
- Lists exceeding 20 records MUST paginate (server-side default: `page`/`limit`/`sortBy`/`sortOrder`)
- Every DataTable MUST include an Actions column (View/Edit/Delete with `lucide-react` icons)
- Action handlers MUST use `e.stopPropagation()` to prevent row-click interference
- Sort indicators render via `.dt-sort-th` / `.dt-sort-arrow` classes — no per-page sort CSS

### 2.5 Page Structure Template

Every module page follows this pattern:

```
PageHeader (title, description, primary action button)
  └── Filters (optional, client-side)
  └── Suspense fallback={<Skeleton variant="table" />}
        └── DataTable (server-loaded data, paginated, sorted)
        └── ChangeHistory (on detail pages)
```

---

## 3. Backend Policies

### 3.1 Absolute Rules

| Policy                      | Detail                                                                                                                          |
| :-------------------------- | :------------------------------------------------------------------------------------------------------------------------------ |
| **Thin controllers**        | Controllers validate input + delegate to services. No business logic in controllers. No Prisma/database imports in controllers. |
| **Fat services**            | All business logic lives in services. Services emit domain events for cross-module communication.                               |
| **No cross-module imports** | Modules NEVER import from each other. Communication via events or common integration ports only.                                |
| **DTO validation**          | Every endpoint MUST use Zod schemas from `@unerp/shared` for input validation.                                                  |
| **Permission guards**       | Every endpoint MUST use `@Permissions('module.resource.action')` decorator.                                                     |
| **Change tracking**         | Every mutation endpoint MUST use `@TrackChanges('EntityType')` decorator.                                                       |
| **Structured logging**      | Use `@unerp/shared/logger`. NEVER `console.log`.                                                                                |
| **Error handling**          | Use NestJS built-in exceptions. Custom errors extend the base exception classes.                                                |

### 3.2 Module Registration

Every new NestJS module MUST:

1. Follow the exact directory structure in HANDBOOK.md § 3
2. Be registered in the root `AppModule`
3. Export only services, NEVER controllers
4. Have co-located tests in a `tests/` subdirectory
5. Be registered in `.ai/MODULE_REGISTRY.md`

### 3.3 Service Decomposition

- Services exceeding **1,200 LOC** must be decomposed using the strangler-fig pattern
- Extract sub-domain operations into dedicated services (e.g., `InventoryProductsService`)
- The parent service delegates to child services, maintaining backward compatibility
- Register all extracted services in the module's `@Module({ providers: [...] })`

### 3.4 API Design Rules

- URL: `/api/v1/<module>/<resource>` — plural nouns, kebab-case
- Methods: GET (read), POST (create/action), PATCH (partial update), DELETE (soft delete)
- Pagination: `page`/`limit`/`sortBy`/`sortOrder` query params on all list endpoints
- Response: `{ data, meta: { page, limit, total, totalPages } }` for lists
- Errors: `{ error: { statusCode, code, message, details[], timestamp, path } }`
- Max nesting: 2 levels (`/invoices/:id/line-items`)
- Never use verbs in URLs (except action endpoints like `/invoices/:id/send`)

---

## 4. Database Rules

### 4.1 Schema Rules (Non-Negotiable)

| Rule                                                     | Rationale                               |
| :------------------------------------------------------- | :-------------------------------------- |
| Every table has `tenant_id VARCHAR(30) NOT NULL`         | Multi-tenancy enforcement               |
| Every table has `id VARCHAR(30) PRIMARY KEY` using CUID2 | Collision-resistant, sortable, URL-safe |
| Every table has `created_at`, `updated_at` timestamps    | Audit trail                             |
| Every table has `created_by`, `updated_by` user FKs      | Accountability                          |
| Money fields use `Decimal(15, 2)`                        | NEVER use Float for financial data      |
| Money tables include a `currency` column                 | Multi-currency support                  |
| Enums stored as `String` with Zod app-level validation   | No Postgres enums (migration-hostile)   |
| NEVER use auto-increment integers for IDs                | Leaks count, not portable               |
| NEVER use UUIDv4 for IDs                                 | Poor index performance                  |

### 4.2 Migration Discipline

1. **Edit schema.prisma** → changes are source-controlled
2. **Generate migration**: `pnpm db:migrate --name <module>_<description>`
3. **Apply**: `pnpm db:deploy` (the ONLY allowed application command)
4. **FORBIDDEN**: `pnpm db:push` — disabled by script guard
5. **FORBIDDEN**: Manual editing of migration files
6. **FORBIDDEN**: Destructive SQL without approved #19 reconciliation
7. Development startup MUST fail closed on migration drift
8. All migrations MUST replay cleanly on a fresh disposable database

### 4.3 Soft Delete Convention

```prisma
deleted_at  DateTime? @map("deleted_at")
deleted_by  String?   @map("deleted_by")
```

- `deleted_at IS NOT NULL` = soft-deleted
- Prisma middleware auto-filters soft-deleted records
- Hard delete only via explicit admin action with audit trail

### 4.4 Index Strategy

- Composite indexes on `(tenant_id, <primary_lookup_field>)` for all tenant-scoped queries
- Full-text search indexes on user-facing searchable fields
- Unique constraints always include `tenant_id` (e.g., `@@unique([tenantId, orgId, sku])`)

---

## 5. Authentication & Security Governance

### 5.1 Auth Flow

| Step | Component             | Detail                               |
| :--- | :-------------------- | :----------------------------------- |
| 1    | Browser               | User submits credentials             |
| 2    | NextAuth (Auth.js v5) | Validates credentials, issues JWT    |
| 3    | JWT Access Token      | 15 minutes, stored in memory only    |
| 4    | Refresh Token         | 7 days, HttpOnly secure cookie       |
| 5    | Session               | 24 hours, stored in Redis            |
| 6    | API Request           | Bearer token in Authorization header |
| 7    | NestJS Guard Chain    | Auth → Tenant → RBAC → Controller    |

### 5.2 Security Layers (All Mandatory)

1. **Security Headers**: Helmet (CSP, COEP, COOP, CORP)
2. **CORS**: Configurable origin whitelist — NEVER disable
3. **Rate Limiting**: Per-tenant, per-tier (@nestjs/throttler) — NEVER disable
4. **CSRF**: Double-submit cookie pattern — NEVER disable
5. **Input Validation**: Zod on ALL inputs — NEVER trust client-only validation
6. **SQL Injection**: Prisma parameterized queries (automatic)
7. **XSS**: DOMPurify for rich text; CSP headers
8. **Tenant Isolation**: 4-layer defense (JWT → Guard → Prisma → RLS)
9. **Audit Logging**: Every mutation logged, append-only, immutable
10. **PII Encryption**: AES-256-GCM at rest, TLS 1.3 in transit
11. **Secret Management**: Environment variables only, NEVER in code

### 5.3 RBAC Convention

- Permission format: `<module>.<resource>.<action>` (e.g., `finance.invoice.create`)
- Register all permissions in `packages/shared/src/permissions/registry.ts`
- Backend: `@Permissions('...')` decorator on every endpoint
- Frontend: `<ProtectedComponent permission="...">` wrapper on privileged UI

### 5.4 What NEVER to Log

- Passwords or password hashes
- Full credit card numbers
- Social Security Numbers / national IDs
- API keys or JWT tokens
- Raw request/response bodies containing PII

---

## 6. Package & Dependency Governance

### 6.1 Adding Dependencies

Before adding ANY npm dependency:

1. Check if an existing dependency already covers the use case
2. Evaluate bundle size (bundlephobia.com)
3. Check maintenance status (last commit, open issues, downloads)
4. Prefer: tree-shakeable, TypeScript-native, well-maintained
5. Document rationale in commit message
6. Update `HANDBOOK.md#tech-stack` with the new dependency

### 6.2 Forbidden Dependencies

| Don't Use       | Use Instead               | Reason                     |
| :-------------- | :------------------------ | :------------------------- |
| Moment.js       | date-fns                  | Legacy, not tree-shakeable |
| Lodash (full)   | Native JS / lodash-es     | Bundle bloat               |
| Axios           | Native fetch / tRPC       | Unnecessary HTTP client    |
| Redux / Zustand | React Query + Context     | Over-engineered            |
| Tailwind CSS    | Vanilla CSS + CSS Modules | No utility-class lock-in   |
| Express         | NestJS (built on Express) | NestJS provides structure  |

### 6.3 Internal Package Scope

All internal packages use `@unerp/` scope. All 13 UI packages are consumed through the `@unerp/ui` facade for backward compatibility.

---

## 7. Testing Mandate

### 7.1 Coverage Targets

| Test Type   | Tool               | Target            | Scope                           |
| :---------- | :----------------- | :---------------- | :------------------------------ |
| Unit        | Vitest             | **80%+ coverage** | All services, validators, utils |
| Integration | Vitest + Supertest | Key paths         | Controllers, API endpoints      |
| E2E         | Playwright         | Critical flows    | Full user workflows             |

### 7.2 Non-Negotiable Testing Rules

1. **ALL business logic MUST have unit tests** — no exceptions
2. Tests are co-located with source in `tests/` directories
3. Use fixture factories for test data (no inline magic values)
4. Use `describe` / `it` with descriptive names
5. Follow Arrange-Act-Assert pattern
6. Mock external dependencies, not business logic
7. NEVER commit empty stubs (`expect(true).toBe(true)`)
8. Tenant isolation tests: verify tenant A cannot access tenant B data
9. RBAC tests: verify unauthorized users are rejected

### 7.3 Gate Tiers

| Gate          | When                           | Checks                                                         |
| :------------ | :----------------------------- | :------------------------------------------------------------- |
| **FAST**      | Every batch/fix                | Scoped typecheck + vitest for touched modules                  |
| **MILESTONE** | Every ~4 cycles, risky changes | Full `pnpm turbo typecheck`, full test suite, Playwright smoke |

---

## 8. ADP Performance Targets

> These targets transform UniERP from a feature-par system into the definitive
> market leader. Every DEV and QA cycle must meet these minimums.

### 8.1 Module Maturity Tiers

Every module is classified into a maturity tier based on weighted feature points:

| Tier                            | Feature Points | Status                             | Priority Rule                                                 |
| :------------------------------ | :------------- | :--------------------------------- | :------------------------------------------------------------ |
| **Skeleton**                    | < 10           | ⛔ BLOCKED                         | MUST reach MVM before ANY module above 200 gets more features |
| **MVM** (Minimum Viable Module) | 10–50          | Basic CRUD + list pages + tests    | Unblocked for other work                                      |
| **Functional**                  | 50–200         | Core workflows working end-to-end  | Normal priority                                               |
| **Competitive**                 | 200–500        | Feature parity with market leaders | Normal priority                                               |
| **Complete**                    | 500+           | Exceeds market leaders             | Maintenance mode                                              |

**Current distribution** (as of last ledger): 3 modules at Complete (inventory 746, advanced-finance 502, crm 474), 22 modules below MVM. The priority ladder deprioritizes deepening modules above 200 until all modules reach MVM.

### 8.2 Feature Maturity Levels (Weighted Scoring)

Raw endpoint count inflates easily. Features are weighted by maturity:

| Level                | Meaning                                              | Weight |
| :------------------- | :--------------------------------------------------- | :----- |
| **L1 — Stub**        | Route exists, returns mock/hardcoded data            | 0.25   |
| **L2 — Functional**  | Real DB query, basic validation, no tests            | 0.50   |
| **L3 — Production**  | Zod validation + RBAC + change tracking + unit tests | 1.00   |
| **L4 — Competitive** | L3 + matches/exceeds top-3 competitor implementation | 1.25   |

Module completion target: **500 weighted feature points** (not raw endpoint count).

### 8.3 Module Completion Definition

A module is **COMPLETE** when it has:

- **500+ weighted feature points** (verified by `node scripts/feature-ledger.mjs`)
- Full CRUD for all entities with server-side pagination/sorting
- Comprehensive test coverage (80%+)
- Production-grade error handling and validation
- Feature parity or superiority vs. top 10 market leaders
- Full UI pages with DataTable, ChangeHistory, breadcrumbs
- Health score above 80 (computed by `node scripts/module-health.mjs`)

### 8.4 DEV Cycle Velocity (Per "Start" Run)

| Metric                       | Minimum Target                                    |
| :--------------------------- | :------------------------------------------------ |
| **New features shipped**     | 40+ distinct business features per cycle          |
| **End-to-end slices**        | Every feature = DB schema + API + UI + tests      |
| **Test coverage**            | 80%+ on all new code                              |
| **Feature ledger delta**     | Net positive 40+ features in regenerated ledger   |
| **Micro-harden checkpoints** | At features 10, 20, 30: scoped typecheck + vitest |

**Parallel DEV cycles**: When bringing Skeleton modules (< 10 features) to MVM,
agents may claim **up to 3 modules** in a single cycle. Each gets 15+ features.
Combined target remains 40+. Use `node scripts/scaffold-entity.mjs` for boilerplate.

### 8.5 QA Cycle Velocity (Per "Harden" Run)

| Metric                       | Minimum Target                                       |
| :--------------------------- | :--------------------------------------------------- |
| **Bugs found & fixed**       | 10+ verified fixes per cycle                         |
| **New feature suggestions**  | 10+ improvement ideas logged to Collab Board Up Next |
| **Security findings**        | All critical/high fixed immediately; medium tracked  |
| **Performance improvements** | At least 2 measurable optimizations per cycle        |

### 8.6 INTEGRATION Cycle Velocity (Per "Integrate" Run)

| Metric                           | Minimum Target                                   |
| :------------------------------- | :----------------------------------------------- |
| **Cross-module workflows wired** | 2+ workflows spanning 3+ modules each            |
| **Integration tests**            | 1+ per workflow (service-level event chain test) |
| **E2E tests**                    | 1+ Playwright test per workflow                  |
| **Dashboard pages**              | 1+ cross-module dashboard per workflow           |

### 8.7 Velocity Enforcement

- Every cycle report MUST include a feature count delta
- If a DEV cycle ships fewer than 40 features, the cycle report must explain why
- The PM hat pass at cycle start must identify enough scope for 40+ features
- Feature suggestions from QA cycles feed directly into the next DEV cycle's scope

---

## 9. Feature Ledger Accuracy

> The feature ledger is the single source of truth for "what exists" in UniERP.
> It MUST be accurate, or agents build duplicates and waste cycles.

### 9.1 Regeneration Rules

1. **Regenerate at the START of every cycle**: `node scripts/feature-ledger.mjs`
2. **Regenerate at the END of every cycle** (same command) — this captures new work
3. **Grep the ledger before building** — duplicate-check is mandatory
4. **Grep again after pre-merge rebase** — catch concurrent additions
5. The ledger is gitignored — it's a generated snapshot, not a committed artifact

### 9.2 Accuracy Validation

After each regeneration, verify:

- Module feature counts match expectations (did the count grow?)
- No routes are listed twice (dedup check)
- Permissions are correctly listed for every endpoint
- New modules appear in the summary table
- Total feature count reflects the cycle's additions

### 9.3 Cross-Check with MODULE_REGISTRY

At cycle end, the feature ledger totals MUST be consistent with MODULE_REGISTRY status:

- A module marked ACTIVE should have features in the ledger
- A module marked ENHANCED should show significant feature growth
- Missing modules in the ledger indicate unscanned controllers — investigate

---

## 10. Git & Branch Policy

### 10.1 Push-to-Main (Mandatory)

**Always push directly to `main`.** Do not create feature branches unless the user explicitly requests one.

| Rule                  | Detail                                                                                       |
| :-------------------- | :------------------------------------------------------------------------------------------- |
| **Default target**    | `origin/main` — always                                                                       |
| **Before push**       | `git pull --rebase origin main` → resolve conflicts → re-run typecheck                       |
| **Commit style**      | Conventional Commits: `<type>(<scope>): <description>`                                       |
| **No force push**     | NEVER `git push --force`                                                                     |
| **No stale branches** | If a branch exists from a prior session, note it on Collab Board — don't silently abandon it |
| **Red build**         | A failing build is NEVER pushed to main                                                      |

### 10.2 Commit Convention

```
<type>(<scope>): <description>

Types: feat, fix, docs, style, refactor, test, chore, perf, ci
Scopes: finance, hr, crm, inventory, ui, database, auth, api, web, shared, admin, ...
```

### 10.3 Commit Atomicity

- Each commit should represent ONE logical change
- CHANGELOG + MODULE_REGISTRY updates go in the SAME commit as the code
- Never batch unrelated changes in a single commit
- Push promptly after committing — unpushed work is invisible to other agents

---

## 11. Repository Hygiene

> The repository MUST always be in a production-grade, clean state.
> No temporary artifacts, no dead code, no placeholder stubs.

### 11.1 Temp File Cleanup (Every Cycle End)

Before marking a cycle complete, verify and clean:

| Check                                            | Action                                             |
| :----------------------------------------------- | :------------------------------------------------- |
| Stray `.js`/`.ts`/`.mjs` files at repo root      | Delete if not in `package.json` scripts            |
| One-off scripts in `scripts/`                    | Delete — `scripts/` is for persistent tooling only |
| Debug helpers or patch scripts anywhere          | Delete before cycle close                          |
| Empty test stubs (`expect(true).toBe(true)`)     | Delete or write real tests                         |
| Unused imports in modified files                 | Remove                                             |
| `console.log` statements                         | Replace with structured logger or remove           |
| Commented-out code blocks                        | Remove unless they document a "why"                |
| Temporary data files (`.json`, `.csv` test data) | Move to `tests/fixtures/` or delete                |

### 11.2 Scripts Directory Policy

`scripts/` contains ONLY persistent, reusable tooling:

- ✅ `feature-ledger.mjs` (feature inventory generator)
- ✅ `claim.mjs` (multi-agent lock management)
- ✅ `docker-start.ps1` (dev environment startup)
- ✅ `check-foundation-readiness.mjs` (architecture gate)
- ⛔ One-time migration fixers
- ⛔ Bulk rename scripts
- ⛔ Debug/investigation scripts
- ⛔ Ad-hoc data patchers

### 11.3 Code Quality Standards

- TypeScript strict mode: ALWAYS enabled, NEVER `any` type
- ESLint: NEVER bypass rules — fix the code
- No TODO comments without a linked GitHub issue
- Imports ordered: Node builtins → External packages → Internal packages → Relative
- Named exports only (except Next.js page defaults)

---

## 12. PM Agent Market Research Protocol

> The Product Manager hat (inline or subagent) MUST conduct deep competitive
> research before scoping feature work. Surface-level comparison is insufficient.

### 12.1 Top 10 ERP Leaders to Benchmark

Every feature scoping pass MUST research these platforms:

| Rank | Platform                   | Key Strengths to Study                                   |
| :--- | :------------------------- | :------------------------------------------------------- |
| 1    | **SAP S/4HANA**            | Clean core, side-by-side extensions, industry solutions  |
| 2    | **Oracle NetSuite**        | SuiteCloud, multi-subsidiary, revenue recognition        |
| 3    | **Microsoft Dynamics 365** | Business events, Power Platform integration, Copilot AI  |
| 4    | **Workday**                | HR/Finance depth, governed API gateway, orchestration    |
| 5    | **Salesforce**             | Event bus, change data capture, AppExchange ecosystem    |
| 6    | **Odoo**                   | Module breadth, community ecosystem, document automation |
| 7    | **ERPNext/Frappe**         | Hookable documents, background jobs, low-code            |
| 8    | **Infor**                  | Industry-specific CloudSuites, Event Hub, OS licenses    |
| 9    | **Acumatica**              | API-first, unlimited users, industry editions            |
| 10   | **Epicor**                 | Manufacturing depth, supply chain, cloud deployment      |

### 12.2 PM Research Cache (`.ai/MARKET_BENCHMARK.md`)

To avoid redundant research every cycle, maintain a cached benchmark file:

- **Location**: `.ai/MARKET_BENCHMARK.md` (gitignored, regenerated as needed)
- **Cache validity**: 7 days per module section
- **Format**: One section per module with a gap analysis table
- Agents read the cache first before doing fresh research
- QA cycles append new gap discoveries to the cache
- Fresh research only required when the module section is > 7 days old

### 12.3 Research Depth Requirements

For each feature scope, the PM pass must:

1. **Search** for the latest (2025–2026) capabilities in the top 10 platforms
2. **Identify gaps** where UniERP lacks features competitors have
3. **Score candidates** using RICE framework (Reach × Impact × Confidence / Effort)
4. **Rank by competitive gap** — build what closes real feature parity gaps first
5. **Document the benchmark** in the Collab Board Up Next queue with:
   - Feature name
   - Which competitors have it
   - RICE score
   - Estimated effort
6. **Prioritize** features that would give UniERP a competitive advantage, not just parity
7. **Discover** emerging ERP trends (AI copilots, embedded analytics, low-code, composable architecture)

### 12.3 Research Sources

- Official product documentation and release notes
- Analyst reports (Gartner Magic Quadrant, Forrester Wave, G2 Grid)
- Community forums and feature request boards
- Product comparison sites (SelectHub, TrustRadius, Capterra)
- Recent blog posts and product announcements
- GitHub repositories (for open-source competitors)

---

## 13. Cycle-End Mandatory Checklist

> This checklist is NON-NEGOTIABLE. Every cycle (DEV or QA) MUST complete ALL
> items before the cycle is considered done. A cycle that skips any item is
> an incomplete cycle.

### 13.1 DEV Cycle ("Start") End Checklist

```
□ 1. CHANGELOG.md updated (what changed + why, newest first)
□ 2. MODULE_REGISTRY.md updated (module status, Collab Board moved to Recently Completed)
□ 3. Feature Ledger regenerated: node scripts/feature-ledger.mjs
□ 4. Feature count delta verified (net +40 features minimum)
□ 5. All new code has unit tests (80%+ coverage)
□ 6. Scoped typecheck passes: pnpm --filter @unerp/api typecheck && pnpm --filter @unerp/web typecheck
□ 7. No console.log, no ESLint bypasses, no `any` types in new code
□ 8. All temporary scripts/files deleted
□ 9. Pre-push gate passes: node scripts/pre-push-gate.mjs
□ 10. Module health score computed: node scripts/module-health.mjs
□ 11. Commit with CHANGELOG + MODULE_REGISTRY in same commit as code
□ 12. git pull --rebase origin main → resolve conflicts → push to main
□ 13. Collab Board claim released
□ 14. Cycle report generated: node scripts/cycle-report.mjs
□ 15. Report: features shipped, maturity levels, health score change, top 3 next items
```

### 13.2 QA Cycle ("Harden") End Checklist

```
□ 1. All findings filed as GitHub issues BEFORE fixing
□ 2. All fixes verified with reproduction + regression test
□ 3. CHANGELOG.md updated (found N / fixed M / blocked K)
□ 4. MODULE_REGISTRY.md updated
□ 5. Feature suggestions added to Collab Board Up Next (10+ minimum)
□ 6. Market benchmark cache updated: .ai/MARKET_BENCHMARK.md
□ 7. MILESTONE gate run if ≥5 fixes or risky surface touched
□ 8. All temporary scripts/files deleted
□ 9. Pre-push gate passes: node scripts/pre-push-gate.mjs
□ 10. Commit and push to main
□ 11. Every fixed issue confirmed closed on GitHub
□ 12. Cycle report generated: node scripts/cycle-report.mjs
```

### 13.3 INTEGRATION Cycle End Checklist

```
□ 1. Event chain mapped for each workflow (producer → consumer)
□ 2. All event handlers idempotent + tenant-isolated
□ 3. Integration test for each workflow (service-level event chain)
□ 4. Playwright E2E test for the primary happy path
□ 5. Cross-module dashboard page created
□ 6. CHANGELOG.md + MODULE_REGISTRY.md updated
□ 7. Pre-push gate passes: node scripts/pre-push-gate.mjs
□ 8. Commit and push to main
□ 9. Cycle report generated: node scripts/cycle-report.mjs
```

### 13.4 Both Cycles — Universal End Actions

1. **Verify repo cleanliness**: No stray files, no uncommitted changes, no temp scripts
2. **Verify build health**: `pnpm turbo typecheck` passes (or scoped check at minimum)
3. **Verify git state**: Everything committed and pushed to `origin/main`
4. **Verify documentation**: CHANGELOG and MODULE_REGISTRY reflect all changes
5. **Verify feature ledger**: Regenerated and totals make sense

---

## 14. Production-Grade Mandate

> UniERP is NOT a prototype, demo, or MVP. It is a **production-grade enterprise
> system** that must be deployable to real customers at any time.

### 14.1 What "Production-Grade" Means

| Dimension          | Standard                                                              |
| :----------------- | :-------------------------------------------------------------------- |
| **Code Quality**   | TypeScript strict, no `any`, no ESLint bypasses, no `console.log`     |
| **Error Handling** | Every endpoint has proper error responses; no unhandled rejections    |
| **Validation**     | Zod on all inputs; parameterized queries; file upload validation      |
| **Security**       | RBAC on every endpoint; tenant isolation at all layers; audit logging |
| **Testing**        | 80%+ unit test coverage; integration tests for key paths              |
| **Performance**    | Server-side pagination; indexed queries; no N+1 queries               |
| **Observability**  | Structured logging; OpenTelemetry; Sentry error tracking              |
| **Documentation**  | Every module in MODULE_REGISTRY; every change in CHANGELOG            |
| **Deployment**     | Docker stack works; migrations apply cleanly; seeds run               |
| **UI/UX**          | Design system tokens; responsive; accessible; breadcrumbs             |

### 14.2 What is NOT Production-Grade (Fix Immediately)

- Hardcoded credentials or secrets in code
- Missing `tenant_id` on any table
- Missing `@Permissions` on any endpoint
- Missing error handling (bare `catch(e) {}`)
- Inline styles or hardcoded colors in UI
- Direct cross-module imports
- Empty test files or stub tests
- Commented-out code without explanation
- `console.log` in committed code
- Disabled security features (CORS, rate limiting, CSRF)

---

## 15. Cross-File Reference Map

> This section maps every governance file and its role. Agents should read
> `instructions.md` FIRST, then the specific file relevant to their task.

| File                                  | Role                                                          | When to Read                  |
| :------------------------------------ | :------------------------------------------------------------ | :---------------------------- |
| **`.ai/instructions.md`**             | Supreme governance (THIS FILE)                                | ALWAYS — before any work      |
| **`AGENTS.md`**                       | Master instruction set, critical rules, workflows             | Every session start           |
| **`.ai/AUTOPILOT.md`**                | ADP protocol (DEV + QA + INTEGRATION flows, gates, roster)    | Before any cycle              |
| **`.ai/HANDBOOK.md`**                 | Architecture, conventions, data model, API, security, testing | When building features        |
| **`.ai/MODULE_REGISTRY.md`**          | Module status + Collab Board + Progress Dashboard             | Before claiming work          |
| **`.ai/CHANGELOG.md`**                | Append-only change history                                    | After completing work         |
| **`.ai/FEATURE_LEDGER.md`**           | Generated feature inventory (gitignored)                      | Before building (dedup check) |
| **`.ai/MARKET_BENCHMARK.md`**         | Cached PM market research (gitignored)                        | Before scoping features       |
| **`docs/ARCHITECTURE_FOUNDATION.md`** | Foundation freeze, blocker designs (#17/#19/#21)              | Before architecture changes   |

### Reading Order for New Agents

1. `.ai/instructions.md` (this file) — understand ALL rules
2. `AGENTS.md` — understand critical rules and project identity
3. `.ai/AUTOPILOT.md` — understand the DEV and QA flows
4. `.ai/MODULE_REGISTRY.md` § Collab Board — understand what's claimed/available
5. `.ai/HANDBOOK.md` — reference specific sections as needed for your task

---

## Appendix: Rules Summary (Quick Reference Card)

```
╔══════════════════════════════════════════════════════════════════╗
║              UNERP AGENT QUICK REFERENCE CARD                   ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  BEFORE WORK:                                                    ║
║    1. Read instructions.md (this file)                           ║
║    2. git pull --rebase origin main                              ║
║    3. Read MODULE_REGISTRY § Collab Board                        ║
║    4. Claim your scope                                           ║
║    5. Regenerate feature ledger + grep for duplicates            ║
║                                                                  ║
║  WHILE WORKING:                                                  ║
║    • DB: tenant_id + CUID2 + Decimal(15,2) + timestamps         ║
║    • API: @Permissions + @TrackChanges + Zod + thin controller   ║
║    • UI: .ui-* classes + DataTable + ChangeHistory + tokens      ║
║    • No cross-module imports, no console.log, no any             ║
║    • Push to main only — no branches                             ║
║    • 40+ features per DEV cycle, 10+ fixes per QA cycle          ║
║                                                                  ║
║  AFTER WORK:                                                     ║
║    1. Update CHANGELOG.md                                        ║
║    2. Update MODULE_REGISTRY.md                                  ║
║    3. Regenerate feature ledger                                  ║
║    4. Delete temp files/scripts                                  ║
║    5. Commit + push to main                                      ║
║    6. Release claim on Collab Board                              ║
║    7. Report: features, gates, next items                        ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
```

---

> **Last updated**: 2026-07-17
> **Authority**: This file supersedes any conflicting instruction in other files.
> **Maintained by**: AI agents + human owner. Update when policies change.
