# Handbook — Universal ERP System

> This is the consolidated reference/convention manual for UniERP. It merges
> architecture, coding conventions, data-model rules, API standards, tech
> stack, security, testing, GitHub workflow, Builder Studio philosophy, and
> the domain glossary into a single file. Every AI agent and human developer
> MUST follow these conventions without exception.
>
> **⚡ Read [instructions.md](./instructions.md) FIRST** — it is the supreme
> governance document that consolidates all architecture flows, coding standards,
> velocity targets, and repo hygiene policies. This handbook provides detailed
> reference material for the rules defined there.
>
> For live module status/dependencies, see [`.ai/MODULE_REGISTRY.md`](./MODULE_REGISTRY.md)
> (includes the Collab Board — check "Active Claims" before starting work).
> For the historical record of what changed, see [`.ai/CHANGELOG.md`](./CHANGELOG.md).

---

## Table of Contents

1. [Architecture Reference](#architecture-reference)
2. [Coding Conventions](#coding-conventions)
   - [UniERP Design System](#unierp-design-system)
3. [Data Model](#data-model)
4. [API Standards](#api-standards)
5. [Tech Stack](#tech-stack)
6. [Security](#security)
7. [Testing Strategy](#testing)
8. [GitHub Rules & Deployment Policy](#github-rules)
9. [Builder Studio Conventions](#builder-studio-conventions)
10. [Glossary](#glossary)

---

## Architecture Reference

> **Foundation remediation freeze (2026-07-16):** Read [docs/ARCHITECTURE_FOUNDATION.md](../docs/ARCHITECTURE_FOUNDATION.md) before selecting work. `pnpm architecture:check` now enforces direct API-module boundaries and cycles. `db:push` is disabled; `pnpm db:deploy` is the only supported schema-application command and development startup fails closed on migration drift. Durable transactional event delivery (#17), reconciled migrations (#19), and transaction-scoped RLS proof (#21) remain release-blocking remediation, not active safeguards.

> Last updated: 2026-06-11 | Phase: 2 — Procurement, Sales & Supply Chain

### 1. System Overview

UniERP is a **composable, multi-tenant ERP system** built as a TypeScript monorepo. The system follows a **modular monolith** approach for the backend (NestJS), with clean domain boundaries that allow future extraction to microservices if needed.

#### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
│                                                                  │
│   ┌──────────────────────────────────────────────────────────┐   │
│   │              Next.js 15 (App Router)                      │   │
│   │   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │   │
│   │   │  Finance  │ │   HR     │ │   CRM    │ │ Inventory│  │   │
│   │   │  Pages    │ │  Pages   │ │  Pages   │ │  Pages   │  │   │
│   │   └──────────┘ └──────────┘ └──────────┘ └──────────┘  │   │
│   │                    ↕ tRPC / REST                         │   │
│   └──────────────────────────────────────────────────────────┘   │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                        API LAYER                                 │
│                                                                  │
│   ┌──────────────────────────────────────────────────────────┐   │
│   │                  NestJS (Modular Monolith)                │   │
│   │                                                            │   │
│   │   ┌──────────────┐    Domain Events    ┌──────────────┐  │   │
│   │   │   Finance     │◄──────────────────►│     HR       │  │   │
│   │   │   Module      │                    │    Module     │  │   │
│   │   └──────────────┘                    └──────────────┘  │   │
│   │          ↕                                     ↕          │   │
│   │   ┌──────────────┐    Domain Events    ┌──────────────┐  │   │
│   │   │   Inventory   │◄──────────────────►│     CRM      │  │   │
│   │   │   Module      │                    │    Module     │  │   │
│   │   └──────────────┘                    └──────────────┘  │   │
│   │                                                            │   │
│   │   ┌────────────────────────────────────────────────────┐  │   │
│   │   │           Common Layer (Guards, Pipes, etc.)        │  │   │
│   │   └────────────────────────────────────────────────────┘  │   │
│   └──────────────────────────────────────────────────────────┘   │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                       DATA LAYER                                 │
│                                                                  │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│   │  PostgreSQL   │  │    Redis      │  │    File Storage      │  │
│   │  (Prisma ORM) │  │  (Cache/Queue)│  │   (S3/Local)         │  │
│   └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 2. Monorepo Structure

#### 2.1 Workspace Organization

```
ERPSys/
├── apps/                          # Deployable applications
│   ├── web/                       # Next.js 15 frontend
│   └── api/                       # NestJS backend
│
├── packages/                      # Shared libraries
│   ├── ui/                        # Design system
│   ├── database/                  # Prisma schema & client
│   ├── shared/                    # Types, validators, utils
│   ├── auth/                      # Auth & RBAC
│   └── config/                    # Tool configs
│
├── tools/                         # Developer tooling
│   ├── generators/                # Code scaffolding
│   └── scripts/                   # Build/deploy scripts
│
└── docker/                        # Container configs
```

#### 2.2 Dependency Graph

```
apps/web ──────► packages/ui
    │            packages/shared
    │            packages/auth
    │            packages/database (types only)
    │
apps/api ──────► packages/shared
    │            packages/auth
    │            packages/database
    │
packages/ui ───► packages/shared (types only)
packages/auth ─► packages/shared
                 packages/database
```

**Rules:**

- `apps/` may depend on `packages/`
- `packages/` may depend on other `packages/`
- `packages/` MUST NOT depend on `apps/`
- Circular dependencies are forbidden

#### 2.3 Turborepo Pipeline

```json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {},
    "test": {
      "dependsOn": ["^build"]
    },
    "db:migrate": {
      "cache": false
    },
    "db:seed": {
      "cache": false
    }
  }
}
```

### 3. Module Structure (Backend)

Every ERP module in `apps/api/src/modules/` MUST follow this exact structure:

```
modules/<module-name>/
├── <module-name>.module.ts          # NestJS @Module definition
├── <module-name>.controller.ts      # REST controller (thin, delegates to service)
├── <module-name>.service.ts         # Business logic (the "brain")
├── <module-name>.gateway.ts         # WebSocket gateway (optional, for real-time features)
├── dto/                             # Data Transfer Objects
│   ├── create-<entity>.dto.ts       # Creation payload validation
│   ├── update-<entity>.dto.ts       # Update payload validation
│   └── query-<entity>.dto.ts        # Query/filter parameters
├── entities/                        # Domain entity types (mirrors Prisma models)
│   └── <entity>.entity.ts
├── events/                          # Domain events emitted by this module
│   └── <entity>-created.event.ts
├── guards/                          # Module-specific authorization guards
├── interceptors/                    # Module-specific interceptors
└── tests/
    ├── <module-name>.service.spec.ts
    └── <module-name>.controller.spec.ts
```

#### 3.1 Module Definition Pattern

```typescript
// finance.module.ts
import { Module } from "@nestjs/common";
import { FinanceController } from "./finance.controller";
import { FinanceService } from "./finance.service";
import { DatabaseModule } from "@unerp/database";

@Module({
  imports: [DatabaseModule],
  controllers: [FinanceController],
  providers: [FinanceService],
  exports: [FinanceService], // Only export service, never controller
})
export class FinanceModule {}
```

#### 3.2 Controller Pattern (Thin Controller)

```typescript
// finance.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import { FinanceService } from "./finance.service";
import { CreateInvoiceDto } from "./dto/create-invoice.dto";
import { TenantGuard } from "@/common/guards/tenant.guard";
import { RbacGuard } from "@/common/guards/rbac.guard";
import { Permissions } from "@/common/decorators/permissions.decorator";

@Controller("finance")
@UseGuards(TenantGuard, RbacGuard)
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Post("invoices")
  @Permissions("finance.invoice.create")
  async createInvoice(@Body() dto: CreateInvoiceDto) {
    return this.financeService.createInvoice(dto);
  }
}
```

#### 3.3 Service Pattern (Business Logic)

```typescript
// finance.service.ts
import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@unerp/database";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { CreateInvoiceDto } from "./dto/create-invoice.dto";
import { InvoiceCreatedEvent } from "./events/invoice-created.event";

@Injectable()
export class FinanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createInvoice(dto: CreateInvoiceDto) {
    const invoice = await this.prisma.invoice.create({
      data: {
        ...dto,
        // tenant_id is injected by Prisma middleware — DO NOT set manually
      },
    });

    // Emit domain event for other modules to react
    this.eventEmitter.emit("invoice.created", new InvoiceCreatedEvent(invoice));

    return invoice;
  }
}
```

### 4. Event-Driven Communication

#### 4.1 Rules

1. **Modules MUST NOT import from each other directly.** No `import { InventoryService } from '../inventory/inventory.service'`.
2. **Cross-module state changes happen via domain events.** A feature module may consume a narrow capability only through an approved common integration port (for example `common/integrations/ai-client` or `common/integrations/reporting-query-client`); it must never import another module's service or module class.
3. **The in-process emitter is legacy best-effort only.** It is acceptable for non-critical local signals during the freeze, but must not be used for a new cross-module business invariant or external integration until the transactional outbox foundation (#17) is complete.
4. **Every event must be documented** with its payload schema, semantic version, aggregate identity, idempotency behavior, and owning module.
5. **Consumers are at-least-once safe.** Durable consumers must deduplicate by a stable event id/idempotency key and treat ordering as non-guaranteed unless a contract explicitly defines an aggregate sequence.

#### 4.1.1 Extension service compatibility

Out-of-process extensions are public contracts, not module dependencies. Their manifests declare an `apiVersion`, which core validates through `@unerp/service-kit`'s `isSupportedExtApiVersion()` against `MIN_SUPPORTED_EXT_API_VERSION` through `EXT_API_VERSION`; an omitted version normalizes to the current version. Reject malformed, retired, and future values. Breaking changes introduce a new version, retain the prior version for one documented release, and only then advance the minimum. The authoritative service-facing rules are in `docs/EXTENSION_SERVICE_CONTRACT.md`.

Service extraction is not a default scalability tactic. It requires the evidence and quarterly review defined in `docs/ARCHITECTURE_FOUNDATION.md`: bounded data ownership, durable outbox delivery, tenant proof, contract compatibility, operational SLOs/runbook, and a rehearsed rollback. Until then, retain the modular-monolith boundary and enforce it mechanically.

For critical cross-module or external effects, the transactional outbox—not `EventEmitter2`, BullMQ, or `BackgroundJob`—is the required source of truth. Its immutable-event, per-destination delivery, idempotent-consumer-receipt, lease/retry/DLQ, ordering, tenant, and verification rules are defined in `docs/ARCHITECTURE_FOUNDATION.md#17-transactional-outbox-design-implementation-blocked-by-19`. Until #17 is implemented and proven, the in-process emitter is limited to non-critical local signals.

AsyncLocalStorage plus Prisma query filters do not make PostgreSQL RLS active. The #21 implementation must use a non-bypass application role and a transaction-local `set_config('app.current_tenant_id', tenantId, true)` on the actual Prisma transaction client, with every protected operation using that client. See `docs/ARCHITECTURE_FOUNDATION.md#21-transaction-scoped-rls-design-implementation-blocked-by-19` for the role split, worker rule, policy inventory, and mandatory real two-tenant proof.

The #19 migration-history reconciliation is the sole exception to the no-manual-migration rule. It is not a blanket escape hatch: Prisma generates the candidate first, a named database owner and code owner approve a column-mapping ledger, and only proven renames or additive/backfill SQL may replace destructive generated operations. The two-shape clone proof, backup, validation, compatibility, and rollback requirements in `docs/ARCHITECTURE_FOUNDATION.md#19-reconciliation-plan-and-controlled-exception` are mandatory.

Generate the reconciliation ledger with `pnpm migration:reconciliation:report` and an isolated `MIGRATION_SHADOW_DATABASE_URL`; never point it at a shared or production database. `-- --check` is the final unknown-operation gate, not a substitute for owner approval or clone-based data proof.

The current unresolved ledger entry, `landed_cost_receipt_links.updatedAt`, has a preservation-first proposal in the foundation document: rename to a temporary read-only `legacy_updated_at` compatibility field, retain it through audit review, and never silently discard it. It remains unapproved and therefore keeps the final ledger check red.

`pnpm foundation:check` is the documentation/entry-point gate for this foundation freeze. It verifies the top-10 benchmark, #17/#19/#21 designs, required package guards, and canonical-baseline references from all role, skill, and Copilot instructions. CI runs it alongside migration discipline.

#### 4.2 Event Naming Convention

```
<domain>.<entity>.<action>
```

Examples:

- `finance.invoice.created`
- `finance.payment.received`
- `inventory.stock.depleted`
- `hr.employee.onboarded`
- `crm.lead.converted`

#### 4.3 Event Payload Pattern

```typescript
// events/invoice-created.event.ts
export class InvoiceCreatedEvent {
  constructor(
    public readonly invoiceId: string,
    public readonly tenantId: string,
    public readonly customerId: string,
    public readonly totalAmount: number,
    public readonly currency: string,
    public readonly lineItems: Array<{
      productId: string;
      quantity: number;
      unitPrice: number;
    }>,
    public readonly createdAt: Date,
  ) {}
}
```

#### 4.4 Event Listener Pattern

```typescript
// In inventory module — listening to finance events
import { OnEvent } from "@nestjs/event-emitter";

@Injectable()
export class InventoryEventHandler {
  @OnEvent("finance.invoice.created")
  async handleInvoiceCreated(event: InvoiceCreatedEvent) {
    // Reduce stock for each line item
    for (const item of event.lineItems) {
      await this.inventoryService.reduceStock(
        event.tenantId,
        item.productId,
        item.quantity,
      );
    }
  }
}
```

#### 4.5 Core Event Map

| Source Module | Event                | Listeners                                                 |
| :------------ | :------------------- | :-------------------------------------------------------- |
| Finance       | `invoice.created`    | Inventory (reduce stock), Accounting (post journal entry) |
| Finance       | `payment.received`   | CRM (update customer status), Notifications               |
| Sales         | `order.confirmed`    | Inventory (reserve stock), Finance (create invoice)       |
| Inventory     | `stock.depleted`     | Procurement (auto-reorder), Notifications                 |
| HR            | `employee.onboarded` | Finance (add to payroll), IT (provision accounts)         |
| CRM           | `lead.converted`     | Sales (create opportunity), Notifications                 |
| Procurement   | `purchase.approved`  | Finance (create AP entry), Inventory (expect delivery)    |

### 5. Frontend Architecture (Next.js)

#### 5.1 Route Structure

```
apps/web/app/
├── (auth)/                        # Public routes (no sidebar)
│   ├── login/page.tsx
│   ├── register/page.tsx
│   ├── forgot-password/page.tsx
│   └── layout.tsx                 # Centered auth layout
│
├── (dashboard)/                   # Protected routes (sidebar + header)
│   ├── layout.tsx                 # Dashboard shell (sidebar, header, breadcrumbs)
│   ├── page.tsx                   # Home dashboard
│   ├── finance/
│   │   ├── page.tsx               # Finance overview
│   │   ├── invoices/
│   │   │   ├── page.tsx           # Invoice list
│   │   │   ├── [id]/page.tsx      # Invoice detail
│   │   │   └── new/page.tsx       # Create invoice
│   │   ├── payments/
│   │   └── reports/
│   ├── hr/
│   ├── crm/
│   ├── inventory/
│   └── settings/
│       ├── general/
│       ├── users/
│       ├── roles/
│       └── billing/
│
├── api/                           # Next.js API routes (BFF layer)
│   └── trpc/[trpc]/route.ts      # tRPC handler
│
└── layout.tsx                     # Root layout (providers, fonts, metadata)
```

#### 5.2 Page Pattern

```typescript
// app/(dashboard)/finance/invoices/page.tsx
import { Suspense } from 'react';
import { InvoiceList } from './components/invoice-list';
import { InvoiceFilters } from './components/invoice-filters';
import { PageHeader } from '@unerp/ui/page-header';
import { Skeleton } from '@unerp/ui/skeleton';

export const metadata = {
  title: 'Invoices | Finance | UniERP',
};

export default function InvoicesPage() {
  return (
    <>
      <PageHeader
        title="Invoices"
        description="Manage your invoices and billing"
        actions={[
          { label: 'Create Invoice', href: '/finance/invoices/new', variant: 'primary' },
        ]}
      />
      <InvoiceFilters />
      <Suspense fallback={<Skeleton variant="table" rows={10} />}>
        <InvoiceList />
      </Suspense>
    </>
  );
}
```

#### 5.3 Data Fetching Pattern

- **Server Components** for initial data load (direct database queries via tRPC)
- **Client Components** for interactive elements (forms, filters, real-time updates)
- **React Query (TanStack Query)** for client-side cache management
- **tRPC** for type-safe API calls between Next.js frontend and NestJS backend

### 6. Multi-Tenancy Architecture

#### 6.1 Strategy: Shared Database + Row-Level Security

```
┌────────────────────────────────────────────────┐
│              Single PostgreSQL Instance          │
│                                                  │
│  ┌──────────────────────────────────────────┐   │
│  │              invoices table                │   │
│  ├──────────┬─────────┬───────┬─────────────┤   │
│  │ id       │tenant_id│amount │ customer_id  │   │
│  ├──────────┼─────────┼───────┼─────────────┤   │
│  │ inv_001  │ t_acme  │ 500   │ cust_001    │   │ ← Acme Corp sees ONLY this
│  │ inv_002  │ t_acme  │ 300   │ cust_002    │   │ ← Acme Corp sees ONLY this
│  │ inv_003  │ t_globex│ 800   │ cust_003    │   │ ← Globex sees ONLY this
│  └──────────┴─────────┴───────┴─────────────┘   │
│                                                  │
│  RLS Policy: WHERE tenant_id = current_tenant()  │
└────────────────────────────────────────────────┘
```

#### 6.2 Implementation

1. Every table includes `tenant_id VARCHAR NOT NULL`
2. PostgreSQL RLS policies enforce tenant isolation
3. Prisma middleware injects `tenant_id` from the authenticated user's context
4. The `tenant_id` is extracted from the JWT token on every request

#### 6.3 Tenant Resolution Flow

```
Request → JWT Decode → Extract tenant_id → Set PostgreSQL session variable
       → Prisma middleware auto-filters all queries by tenant_id
       → RLS acts as safety net at database level
```

### 7. Scalability Path

The modular monolith is designed to evolve:

```
Phase 0-2:   Modular Monolith (single NestJS app, all modules in-process)
    ↓
Phase 3-8:   Enhanced Monolith (workflow engine, advanced modules, event-driven)
    ↓
Phase 9-15:  Extract high-traffic modules to microservices (if needed)
    ↓
Phase 16-20: Enterprise SaaS Platform (API platform, i18n, PWA, CI/CD, billing)
```

Because modules communicate through enforced boundaries (not direct imports), extracting a module to a separate service requires:

1. Move the module code to a new NestJS app
2. Replace the transactional-outbox dispatcher with the selected broker adapter
3. Preserve published API/event contracts; do not expose implementation internals

---

## Coding Conventions

> All AI agents and human developers MUST follow these conventions without exception.

### 1. Naming Conventions

#### 1.1 Files & Directories

| Type             | Convention                 | Example                                          |
| :--------------- | :------------------------- | :----------------------------------------------- |
| Directories      | `kebab-case`               | `purchase-orders/`, `sales-reports/`             |
| React Components | `kebab-case.tsx`           | `invoice-list.tsx`, `page-header.tsx`            |
| NestJS files     | `kebab-case` with suffix   | `finance.controller.ts`, `create-invoice.dto.ts` |
| Test files       | `*.spec.ts` or `*.test.ts` | `finance.service.spec.ts`                        |
| CSS files        | `kebab-case.css`           | `invoice-list.css`, `design-tokens.css`          |
| Constants files  | `kebab-case.ts`            | `error-codes.ts`, `permissions.ts`               |
| Type files       | `kebab-case.ts`            | `invoice.types.ts`, `user.types.ts`              |

#### 1.2 Code Identifiers

| Type             | Convention                        | Example                                       |
| :--------------- | :-------------------------------- | :-------------------------------------------- |
| Variables        | `camelCase`                       | `invoiceTotal`, `lineItems`                   |
| Functions        | `camelCase`                       | `calculateTax()`, `getInvoiceById()`          |
| Classes          | `PascalCase`                      | `FinanceService`, `InvoiceController`         |
| Interfaces       | `PascalCase` (no `I` prefix)      | `Invoice`, `CreateInvoiceDto`                 |
| Types            | `PascalCase`                      | `InvoiceStatus`, `PaymentMethod`              |
| Enums            | `PascalCase` (values UPPER_SNAKE) | `InvoiceStatus.PAID`, `Role.ADMIN`            |
| Constants        | `UPPER_SNAKE_CASE`                | `MAX_RETRY_COUNT`, `DEFAULT_PAGE_SIZE`        |
| Database tables  | `snake_case` (plural)             | `invoices`, `purchase_orders`                 |
| Database columns | `snake_case`                      | `tenant_id`, `created_at`, `total_amount`     |
| API endpoints    | `kebab-case` (plural nouns)       | `/api/v1/invoices`, `/api/v1/purchase-orders` |
| Event names      | `dot.separated`                   | `finance.invoice.created`                     |
| Environment vars | `UPPER_SNAKE_CASE`                | `DATABASE_URL`, `REDIS_HOST`                  |

#### 1.3 Boolean Naming

Always use a verb prefix for booleans:

- ✅ `isActive`, `hasPermission`, `canEdit`, `shouldNotify`
- ❌ `active`, `permission`, `edit`, `notify`

### 2. TypeScript Rules

#### 2.1 Strict Mode

```json
// tsconfig.json — these MUST remain true
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

#### 2.2 Type Safety

```typescript
// ✅ CORRECT — explicit types
function calculateTotal(items: InvoiceLineItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
}

// ❌ WRONG — never use `any`
function calculateTotal(items: any[]): any {
  return items.reduce(
    (sum: any, item: any) => sum + item.quantity * item.unitPrice,
    0,
  );
}

// ✅ CORRECT — use `unknown` with type guard when type is uncertain
function parseInput(input: unknown): Invoice {
  const result = invoiceSchema.safeParse(input);
  if (!result.success) {
    throw new ValidationError(result.error);
  }
  return result.data;
}
```

#### 2.3 Import Order

Always order imports in this sequence, with a blank line between groups:

```typescript
// 1. Node.js built-ins
import { readFile } from "node:fs/promises";

// 2. External packages
import { Injectable } from "@nestjs/common";
import { z } from "zod";

// 3. Internal packages (monorepo)
import { PrismaService } from "@unerp/database";
import { type Invoice } from "@unerp/shared/types";

// 4. Relative imports (parent first, then siblings, then children)
import { FinanceService } from "../finance.service";
import { CreateInvoiceDto } from "./create-invoice.dto";
```

#### 2.4 Export Rules

- **Named exports only.** No default exports (except Next.js pages which require them).
- **Barrel exports** (`index.ts`) are allowed in `packages/` but NOT in `apps/`.
- **Re-export types** with `export type` to enable proper tree-shaking.

```typescript
// packages/shared/src/types/index.ts
export type { Invoice, InvoiceLineItem, InvoiceStatus } from "./invoice.types";
export type { User, UserRole } from "./user.types";
```

### 3. React / Next.js Conventions

#### 3.1 Component Structure

```typescript
// components/invoice-list.tsx

// 1. Imports
import { type FC } from 'react';
import { DataTable } from '@unerp/ui/data-table';
import type { Invoice } from '@unerp/shared/types';

// 2. Types (if component-specific)
interface InvoiceListProps {
  invoices: Invoice[];
  onSelect?: (invoice: Invoice) => void;
}

// 3. Component (named export, arrow function)
export const InvoiceList: FC<InvoiceListProps> = ({ invoices, onSelect }) => {
  // 4. Hooks (at the top)
  // 5. Derived state
  // 6. Event handlers
  // 7. Render
  return (
    <DataTable
      data={invoices}
      columns={columns}
      onRowClick={onSelect}
    />
  );
};

// 8. Sub-components or helpers (below main component)
```

#### 3.2 Server vs Client Components

```typescript
// Server Component (default) — no 'use client' directive
// Used for: data fetching, static rendering, SEO content
export default async function InvoicesPage() {
  const invoices = await getInvoices(); // Direct server call
  return <InvoiceList invoices={invoices} />;
}

// Client Component — requires 'use client' directive
// Used for: interactivity, event handlers, browser APIs, state
'use client';
export const InvoiceFilters: FC = () => {
  const [status, setStatus] = useState('all');
  return <Select value={status} onChange={setStatus} />;
};
```

**Rule**: Keep the `'use client'` boundary as deep as possible. Prefer Server Components.

#### 3.3 State Management

- **Server State**: React Query (TanStack Query) via tRPC
- **Client State**: React `useState` / `useReducer` for local state
- **Form State**: React Hook Form + Zod validation
- **No global state library** (no Redux, Zustand, etc.) — use React Context for theme/auth only

### 4. NestJS Conventions

#### 4.1 Controller Rules

- Controllers are **thin** — they validate input and delegate to services
- Controllers handle HTTP concerns only (status codes, headers, response format)
- Controllers MUST use guards for auth/permissions
- Controllers MUST use DTOs for input validation

#### 4.2 Service Rules

- Services contain **all business logic**
- Services emit domain events for cross-module communication
- Services MUST NOT import from other modules directly
- Services use dependency injection (constructor injection)

#### 4.3 DTO Validation

All DTOs use Zod schemas from `packages/shared`:

```typescript
// packages/shared/src/validators/invoice.validator.ts
import { z } from "zod";

export const createInvoiceSchema = z.object({
  customerId: z.string().uuid(),
  dueDate: z.string().datetime(),
  lineItems: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().positive(),
        unitPrice: z.number().positive(),
        description: z.string().max(500).optional(),
      }),
    )
    .min(1),
  notes: z.string().max(2000).optional(),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;

// apps/api/src/modules/finance/dto/create-invoice.dto.ts
import {
  createInvoiceSchema,
  type CreateInvoiceInput,
} from "@unerp/shared/validators";

export class CreateInvoiceDto implements CreateInvoiceInput {
  // Validated by Zod pipe in controller
}
```

### 5. Error Handling

#### 5.1 Backend Errors

```typescript
// Use NestJS built-in exceptions
throw new NotFoundException(`Invoice ${id} not found`);
throw new BadRequestException("Invalid invoice data");
throw new ForbiddenException("Insufficient permissions");
throw new ConflictException("Invoice already exists");

// Custom business errors extend a base class
export class InsufficientStockError extends BadRequestException {
  constructor(productId: string, requested: number, available: number) {
    super(
      `Insufficient stock for product ${productId}: requested ${requested}, available ${available}`,
    );
  }
}
```

#### 5.2 Error Response Format

All API errors return a consistent JSON structure:

```json
{
  "statusCode": 404,
  "error": "Not Found",
  "message": "Invoice inv_abc123 not found",
  "timestamp": "2026-06-10T10:30:00Z",
  "path": "/api/v1/finance/invoices/inv_abc123"
}
```

### 6. Git Conventions

#### 6.1 Commit Messages

Follow Conventional Commits:

```
<type>(<scope>): <description>

[optional body]
[optional footer]
```

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`, `ci`
**Scopes**: `finance`, `hr`, `crm`, `inventory`, `ui`, `database`, `auth`, `api`, `web`, `shared`

Examples:

```
feat(finance): add invoice creation endpoint
fix(inventory): correct stock calculation on partial shipments
docs(ai): update MODULE_REGISTRY with CRM module
test(hr): add unit tests for payroll calculation
chore(deps): update Prisma to v6.2.0
```

#### 6.2 Branch Naming

```
<type>/<module>/<description>
```

Examples:

```
feat/finance/invoice-crud
fix/inventory/stock-sync
docs/ai/update-architecture
```

### 7. Comments & Documentation

#### 7.1 When to Comment

- **DO** comment on "why" — business logic rationale, non-obvious decisions
- **DO** document public APIs with JSDoc
- **DON'T** comment on "what" — the code should be self-explanatory
- **DON'T** leave TODO comments without a linked issue

#### 7.2 JSDoc Pattern

```typescript
/**
 * Calculates the total tax for an invoice based on the tenant's tax configuration.
 *
 * Tax is calculated per line item because different products may have different
 * tax rates (e.g., food items may be zero-rated). The tenant's default tax rate
 * is used as a fallback when a product has no specific tax category.
 *
 * @param lineItems - The invoice line items to calculate tax for
 * @param tenantConfig - The tenant's tax configuration
 * @returns The total tax amount in the tenant's base currency
 */
function calculateInvoiceTax(
  lineItems: InvoiceLineItem[],
  tenantConfig: TenantTaxConfig,
): number {
  // ...
}
```

### 8. UI/UX & CSS Standards

#### UniERP Design System

> UniERP ships its **own UI framework** — the UniERP Design System (`@unerp/ui-*`
> packages: ui-tokens, ui-theme, ui-components, ui-layout, ui-charts, ui-data-grid,
> ui-dashboard, ui-notifications, ui-hooks, ui-utils, ui-icons, ui-form-engine,
> ui-workflow, consumed via the `@unerp/ui` facade). It is not styled after any
> third-party ERP; the rules below are UniERP's own design language. The former
> Frappe/ERPNext-styling mandate is retired; `.frappe-*` CSS classes remain only as
> deprecated aliases of the canonical `.ui-*` classes.

##### 8.1 Aesthetic Philosophy (UniERP Design Language)

All AI agents must adhere to the following human-computer interaction (HCI) psychological principles when designing or modifying UI components:

1. **Hick's Law (Reduce Cognitive Load)**
   - **No unnecessary icons.** Only use icons if they provide immediate semantic value. Do not use generic icons (like a building for a tenant selector or a grid for an app switcher) unless explicitly required.
   - Text with a simple chevron is preferred for dropdowns.

2. **Fitts's Law (Reachability & Sizing)**
   - Inputs and interactive buttons must have a minimum comfortable height (e.g., `32px` for dense enterprise interfaces, `40px` for standard interactions).
   - Clickable areas (padding) must extend to the edges of containers.

3. **Gestalt Principles (Figure-Ground & Proximity)**
   - **Softer Borders:** UI structural elements (borders, shadows) must be highly subdued (e.g., `#e2e8f0` for borders, `0.04` to `0.05` opacity for shadows) so that the actual business data stands out as the primary figure.
   - **Sharp & Professional:** Use `--radius-md` (6px) or `--radius-sm` (4px) for most elements to maintain a crisp, enterprise software look rather than a bubbly consumer app look.

##### 8.2 CSS Tokens

Always use the design system tokens defined in `@unerp/ui-tokens` (`packages/ui-tokens/src/`; the legacy `@unerp/ui/tokens` path is a compatibility shim).

- **Never hardcode hex colors** (e.g., `color: #ffffff`). Use `color: var(--color-bg-elevated)`.
- **Never hardcode pixel padding** (e.g., `padding: 16px`). Use `padding: var(--space-4)`.
- Keep button hover states clean and subtle: `background: transparent` transitioning to `var(--color-bg-hover)` is preferred over hard boxed borders.

### 9. Script & Temporary File Cleanup

> AI agents and developers MUST NOT leave one-off scripts in the repository.

#### Rules

- **No throwaway scripts committed.** Fix scripts, patch scripts, debug helpers, and scratch files must be deleted before the task is marked complete.
- **`scripts/` is for persistent tooling only** (e.g., `scorecard.mjs`, `dev-start.ps1`). One-off migration fixers, bulk-rename scripts, or ad-hoc patchers do not belong there.
- **No placeholder test files.** Do not commit empty or trivial test stubs (e.g., `expect(true).toBe(true)`).
- Before completing any task, verify no stray `.js`/`.ts`/`.mjs` files were left at the repo root or in `scripts/`.

---

## Data Model

> Reference document for the core data model. All entity design decisions are documented here.
> AI agents MUST follow these patterns when creating new database entities.

### 1. Design Principles

#### 1.1 Every Table Must Include

```sql
-- These columns are MANDATORY on every table
id              VARCHAR(30)   PRIMARY KEY    -- CUID2 format (e.g., "clx1a2b3c4...")
tenant_id       VARCHAR(30)   NOT NULL       -- Foreign key to tenants table
created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
created_by      VARCHAR(30)   REFERENCES users(id)
updated_by      VARCHAR(30)   REFERENCES users(id)
```

#### 1.2 ID Generation

- Use **CUID2** for all primary keys (collision-resistant, sortable, URL-safe)
- Never use auto-increment integers (leaks count, not portable across tenants)
- Never use UUIDv4 (poor index performance due to randomness)

#### 1.3 Soft Deletes

For entities that should be recoverable:

```sql
deleted_at      TIMESTAMPTZ   DEFAULT NULL
deleted_by      VARCHAR(30)   REFERENCES users(id)
```

- When `deleted_at IS NOT NULL`, the record is soft-deleted
- Prisma middleware auto-filters soft-deleted records from queries
- Hard delete only via explicit admin action

#### 1.4 Enum Strategy

Use PostgreSQL `TEXT` with application-level validation (Zod), not database enums:

```typescript
// ✅ Correct — Zod enum in shared package
export const invoiceStatusSchema = z.enum(['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED', 'VOID']);
export type InvoiceStatus = z.infer<typeof invoiceStatusSchema>;

// In Prisma schema
model Invoice {
  status String @default("DRAFT") // Validated by application layer
}
```

**Rationale**: Database enums require migrations to add new values. Application-level enums are more flexible and can be shared between frontend and backend.

### 2. Core Entity Relationship Diagram

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                           MULTI-TENANCY LAYER                                │
│                                                                              │
│  ┌──────────┐         ┌──────────────┐         ┌───────────────┐            │
│  │  Tenant   │────────►│ Organization │────────►│  Department    │            │
│  │           │         │              │         │               │            │
│  └──────┬───┘         └──────────────┘         └───────┬───────┘            │
│         │                                               │                    │
│         │         ┌──────────────┐                      │                    │
│         └────────►│     User      │◄────────────────────┘                    │
│                   │              │                                           │
│                   └──────┬───────┘                                           │
│                          │                                                   │
│                   ┌──────┴───────┐                                           │
│                   │     Role      │──────► Permission                        │
│                   └──────────────┘                                           │
├──────────────────────────────────────────────────────────────────────────────┤
│                           BUSINESS ENTITIES                                  │
│                                                                              │
│  ┌──────────┐    ┌──────────┐    ┌───────────┐    ┌──────────────┐          │
│  │ Customer  │    │  Vendor   │    │  Product   │    │  Warehouse   │          │
│  │          │    │          │    │           │    │              │          │
│  └────┬─────┘    └────┬─────┘    └─────┬─────┘    └──────┬───────┘          │
│       │               │               │                  │                  │
│  ┌────┴─────┐    ┌────┴─────────┐  ┌──┴──────────┐  ┌───┴────────┐        │
│  │  Sales    │    │  Purchase     │  │  Inventory   │  │  Stock      │        │
│  │  Order    │    │  Order        │  │  Item        │  │  Entry      │        │
│  └────┬─────┘    └──────────────┘  └──────────────┘  └──────────────┘        │
│       │                                                                      │
│  ┌────┴─────┐    ┌──────────────┐    ┌──────────────┐                        │
│  │ Invoice   │    │   Payment     │    │   Journal     │                        │
│  │          │    │              │    │   Entry       │                        │
│  └──────────┘    └──────────────┘    └──────────────┘                        │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 3. Core Prisma Models

#### 3.1 Tenant & Auth

```prisma
model Tenant {
  id            String   @id @default(cuid())
  name          String
  slug          String   @unique // Used in URLs: app.unerp.com/acme-corp
  plan          String   @default("free") // free, starter, professional, enterprise
  status        String   @default("ACTIVE") // ACTIVE, SUSPENDED, CANCELLED
  settings      Json     @default("{}") // Tenant-specific configuration
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  // Relations
  users         User[]
  organizations Organization[]

  @@map("tenants")
}

model User {
  id            String    @id @default(cuid())
  tenantId      String    @map("tenant_id")
  email         String
  passwordHash  String?   @map("password_hash")
  firstName     String    @map("first_name")
  lastName      String    @map("last_name")
  avatar        String?
  status        String    @default("ACTIVE") // ACTIVE, INACTIVE, INVITED, LOCKED
  lastLoginAt   DateTime? @map("last_login_at")
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")
  deletedAt     DateTime? @map("deleted_at")

  // Relations
  tenant        Tenant    @relation(fields: [tenantId], references: [id])
  roles         UserRole[]

  @@unique([tenantId, email])
  @@map("users")
}

model Role {
  id            String   @id @default(cuid())
  tenantId      String   @map("tenant_id")
  name          String   // Admin, Manager, Accountant, Sales Rep, etc.
  description   String?
  isSystem      Boolean  @default(false) @map("is_system") // System roles can't be deleted
  permissions   Json     @default("[]") // Array of permission strings
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  // Relations
  users         UserRole[]

  @@unique([tenantId, name])
  @@map("roles")
}

model UserRole {
  userId  String @map("user_id")
  roleId  String @map("role_id")

  user    User   @relation(fields: [userId], references: [id])
  role    Role   @relation(fields: [roleId], references: [id])

  @@id([userId, roleId])
  @@map("user_roles")
}
```

#### 3.2 Organization Structure

```prisma
model Organization {
  id            String   @id @default(cuid())
  tenantId      String   @map("tenant_id")
  name          String
  legalName     String?  @map("legal_name")
  taxId         String?  @map("tax_id")
  email         String?
  phone         String?
  website       String?
  logo          String?
  address       Json?    // { street, city, state, zip, country }
  currency      String   @default("USD")
  timezone      String   @default("UTC")
  fiscalYearStart Int    @default(1) @map("fiscal_year_start") // Month (1-12)
  settings      Json     @default("{}")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  // Relations
  tenant        Tenant       @relation(fields: [tenantId], references: [id])
  departments   Department[]
  customers     Customer[]
  vendors       Vendor[]
  products      Product[]
  warehouses    Warehouse[]

  @@map("organizations")
}

model Department {
  id            String   @id @default(cuid())
  tenantId      String   @map("tenant_id")
  orgId         String   @map("org_id")
  name          String
  code          String   // e.g., "FIN", "HR", "ENG"
  parentId      String?  @map("parent_id")
  managerId     String?  @map("manager_id")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  // Relations
  organization  Organization @relation(fields: [orgId], references: [id])
  parent        Department?  @relation("DeptHierarchy", fields: [parentId], references: [id])
  children      Department[] @relation("DeptHierarchy")
  employees     Employee[]

  @@unique([tenantId, orgId, code])
  @@map("departments")
}
```

#### 3.3 Business Entities (Preview)

```prisma
model Customer {
  id            String   @id @default(cuid())
  tenantId      String   @map("tenant_id")
  orgId         String   @map("org_id")
  type          String   @default("COMPANY") // COMPANY, INDIVIDUAL
  name          String
  email         String?
  phone         String?
  taxId         String?  @map("tax_id")
  billingAddress  Json?  @map("billing_address")
  shippingAddress Json?  @map("shipping_address")
  creditLimit   Decimal? @map("credit_limit") @db.Decimal(15, 2)
  paymentTerms  Int      @default(30) @map("payment_terms") // Days
  status        String   @default("ACTIVE")
  notes         String?
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")
  deletedAt     DateTime? @map("deleted_at")

  // Relations
  organization  Organization @relation(fields: [orgId], references: [id])
  salesOrders   SalesOrder[]
  invoices      Invoice[]

  @@map("customers")
}

model Product {
  id            String   @id @default(cuid())
  tenantId      String   @map("tenant_id")
  orgId         String   @map("org_id")
  sku           String
  name          String
  description   String?
  type          String   @default("GOODS") // GOODS, SERVICE, DIGITAL, SUBSCRIPTION
  category      String?
  unit          String   @default("EACH") // EACH, KG, LTR, HR, etc.
  costPrice     Decimal  @map("cost_price") @db.Decimal(15, 2)
  sellPrice     Decimal  @map("sell_price") @db.Decimal(15, 2)
  taxCategory   String?  @map("tax_category")
  isActive      Boolean  @default(true) @map("is_active")
  images        Json     @default("[]")
  attributes    Json     @default("{}") // Flexible key-value attributes
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")
  deletedAt     DateTime? @map("deleted_at")

  // Relations
  organization  Organization    @relation(fields: [orgId], references: [id])
  inventoryItems InventoryItem[]

  @@unique([tenantId, orgId, sku])
  @@map("products")
}
```

### 3.4 E-Commerce Storefront (module #33)

Public catalog/cart/checkout layer built on top of existing `Product` / `SalesOrder` / `Invoice` —
see `.ai/MODULE_REGISTRY.md` row 33 and § Module-Specific Completion Notes for the full spec/status. No parallel product or order
model was created: `ProductListing` is a thin publish/price-override layer over `Product`, and
checkout writes a real `SalesOrder` (`salesChannel = "ONLINE"`, reusing the existing field's
`@default("B2B")` column — no schema change needed there).

```prisma
model StorefrontConfig {
  id           String   @id @default(cuid())
  tenantId     String   @unique @map("tenant_id") // one config row per tenant
  storeName    String   @map("store_name")
  storeSlug    String   @unique @map("store_slug") // public URL routing: /store/[storeSlug]
  isEnabled    Boolean  @default(false) @map("is_enabled")
  currency     String   @default("USD")
  contactEmail String?  @map("contact_email")
  logoUrl      String?  @map("logo_url")
  primaryColor String?  @map("primary_color")
  // ...timestamps
}

model StorefrontCategory {
  // flat list only in MVP — no nested category trees
  id       String @id @default(cuid())
  tenantId String @map("tenant_id")
  name     String
  slug     String
  // @@unique([tenantId, slug])
}

model ProductListing {
  // publish/price-override layer over Product — NOT a parallel catalog
  id            String   @id @default(cuid())
  tenantId      String   @map("tenant_id")
  productId     String   @map("product_id") // FK -> Product
  categoryId    String?  @map("category_id") // FK -> StorefrontCategory
  isPublished   Boolean  @default(false) @map("is_published")
  priceOverride Decimal? @map("price_override") @db.Decimal(15, 2) // null = use Product.sellPrice
  // @@unique([tenantId, productId]); @@index([tenantId, isPublished]) — hottest public read path
}

model Cart {
  // anonymous/session-based — no Customer/User FK by design (guest checkout, no login)
  id           String   @id @default(cuid())
  tenantId     String   @map("tenant_id")
  sessionToken String   @unique @map("session_token")
  status       String   @default("ACTIVE") // ACTIVE, CONVERTED, ABANDONED
}

model CartItem {
  id                String  @id @default(cuid())
  tenantId          String  @map("tenant_id")
  cartId            String  @map("cart_id")
  productListingId  String  @map("product_listing_id")
  unitPriceSnapshot Decimal @map("unit_price_snapshot") @db.Decimal(15, 2) // captured at add-time
}

model StorefrontOrderPayment {
  // thin per-attempt payment ledger row; does not replace Finance's Payment model
  id               String  @id @default(cuid())
  tenantId         String  @map("tenant_id")
  salesOrderId     String  @map("sales_order_id") // FK -> SalesOrder
  provider         String  @default("mock_gateway") // MVP: mock only, real gateways are a drop-in swap
  status           String  @default("PENDING") // PENDING, SUCCEEDED, FAILED, REFUNDED
  rawResponse      Json?   @map("raw_response") // gateway adapter's raw payload, for reconciliation
}
```

**Tenant-resolution note**: public `/store/[tenantSlug]` routes resolve tenant via `StorefrontConfig.storeSlug`
(URL-based), not JWT — a distinct, non-standard tenant-resolution path flagged for security-auditor
review. All six models still carry a direct `tenantId` column and are auto-scoped by the same Prisma
tenant-scoping extension (`packages/database/src/tenant-scope.ts`) as every other table; the slug-based
public guard is only responsible for resolving _which_ `tenantId` to inject before the extension runs,
never for bypassing the extension itself.

**Status field convention**: `Cart.status` and `StorefrontOrderPayment.status` follow this repo's
enum strategy (Section 1.4) — plain `String` columns with app-level Zod validation, not Postgres
enums, matching every other status field in the schema.

### 4. Money & Currency Handling

#### 4.1 Rules

1. **Always use `Decimal(15, 2)` for monetary amounts** — never use `Float`
2. **Store amounts in the smallest unit** (cents) when doing calculations
3. **Every monetary table must include a `currency` column**
4. **Multi-currency**: Store both the original amount + currency AND the base-currency equivalent
5. **Exchange rates** are stored in a dedicated `exchange_rates` table

```prisma
model Invoice {
  // ...
  subtotal        Decimal  @db.Decimal(15, 2)
  taxAmount       Decimal  @map("tax_amount") @db.Decimal(15, 2)
  totalAmount     Decimal  @map("total_amount") @db.Decimal(15, 2)
  currency        String   @default("USD")
  exchangeRate    Decimal  @default(1) @map("exchange_rate") @db.Decimal(15, 6)
  baseCurrencyTotal Decimal @map("base_currency_total") @db.Decimal(15, 2)
  // ...
}
```

### 5. Audit Trail

#### 5.1 Pattern

An `audit_logs` table tracks all mutations for compliance:

```prisma
model AuditLog {
  id            String   @id @default(cuid())
  tenantId      String   @map("tenant_id")
  userId        String   @map("user_id")
  action        String   // CREATE, UPDATE, DELETE, LOGIN, EXPORT, etc.
  entityType    String   @map("entity_type") // "Invoice", "Employee", etc.
  entityId      String   @map("entity_id")
  changes       Json?    // { field: { old: "...", new: "..." } }
  ipAddress     String?  @map("ip_address")
  userAgent     String?  @map("user_agent")
  createdAt     DateTime @default(now()) @map("created_at")

  @@index([tenantId, entityType, entityId])
  @@index([tenantId, userId])
  @@index([tenantId, createdAt])
  @@map("audit_logs")
}
```

#### 5.2 Implementation

- Prisma middleware intercepts all `create`, `update`, `delete` operations
- Automatically captures before/after values for `update` operations
- Audit logs are append-only — never modified or deleted
- Stored in the same database but can be moved to a separate store at scale

---

## API Standards

> All REST API endpoints MUST follow these standards.
> AI agents MUST read this before creating any new endpoint.

### 1. URL Structure

#### 1.1 Base URL

```
/api/v1/<module>/<resource>
```

#### 1.2 Rules

- Use **plural nouns** for resources: `/invoices`, `/employees`, `/products`
- Use **kebab-case** for multi-word resources: `/purchase-orders`, `/sales-reports`
- Use **path parameters** for specific resources: `/invoices/:id`
- Use **query parameters** for filtering, sorting, pagination
- **Never use verbs** in URLs: ❌ `/api/v1/getInvoices` ✅ `/api/v1/finance/invoices`
- **Nest sub-resources** max 2 levels deep: `/invoices/:id/line-items`

#### 1.3 Examples

```
GET     /api/v1/finance/invoices                  # List invoices
POST    /api/v1/finance/invoices                  # Create invoice
GET     /api/v1/finance/invoices/:id              # Get invoice by ID
PATCH   /api/v1/finance/invoices/:id              # Update invoice
DELETE  /api/v1/finance/invoices/:id              # Delete invoice (soft)
GET     /api/v1/finance/invoices/:id/line-items   # List invoice line items
POST    /api/v1/finance/invoices/:id/send         # Action: Send invoice (verb ok for actions)
POST    /api/v1/finance/invoices/:id/void         # Action: Void invoice
```

### 2. HTTP Methods

| Method   | Use                              | Idempotent | Request Body  |
| :------- | :------------------------------- | :--------- | :------------ |
| `GET`    | Retrieve resource(s)             | Yes        | No            |
| `POST`   | Create resource / trigger action | No         | Yes           |
| `PATCH`  | Partial update                   | Yes        | Yes (partial) |
| `DELETE` | Remove resource (soft delete)    | Yes        | No            |
| `PUT`    | Full replace (rare, avoid)       | Yes        | Yes (full)    |

### 3. Request Format

#### 3.1 Create / Update Payloads

```json
// POST /api/v1/finance/invoices
{
  "customerId": "clx1abc123",
  "dueDate": "2026-07-10T00:00:00Z",
  "currency": "USD",
  "lineItems": [
    {
      "productId": "clx1def456",
      "quantity": 5,
      "unitPrice": 99.99,
      "description": "Widget Pro"
    }
  ],
  "notes": "Net 30 terms"
}
```

#### 3.2 Query Parameters

```
GET /api/v1/finance/invoices?status=PAID&customerId=clx1abc123&sort=-createdAt&page=1&limit=25
```

| Parameter     | Type     | Description                                |
| :------------ | :------- | :----------------------------------------- |
| `page`        | number   | Page number (1-indexed, default: 1)        |
| `limit`       | number   | Items per page (default: 25, max: 100)     |
| `sort`        | string   | Sort field. Prefix with `-` for descending |
| `search`      | string   | Full-text search across searchable fields  |
| `status`      | string   | Filter by status                           |
| `from` / `to` | ISO date | Date range filter                          |

### 4. Response Format

#### 4.1 Single Resource

```json
{
  "data": {
    "id": "clx1abc123",
    "type": "invoice",
    "attributes": {
      "invoiceNumber": "INV-2026-0042",
      "status": "DRAFT",
      "subtotal": 499.95,
      "taxAmount": 49.99,
      "totalAmount": 549.94,
      "currency": "USD",
      "dueDate": "2026-07-10T00:00:00Z",
      "createdAt": "2026-06-10T10:30:00Z",
      "updatedAt": "2026-06-10T10:30:00Z"
    },
    "relationships": {
      "customer": { "id": "clx1def456", "name": "Acme Corp" },
      "lineItems": [
        {
          "id": "clx1ghi789",
          "productId": "clx1jkl012",
          "quantity": 5,
          "unitPrice": 99.99
        }
      ]
    }
  }
}
```

#### 4.2 List Response (Paginated)

```json
{
  "data": [
    { "id": "clx1abc123", "type": "invoice", "attributes": { ... } },
    { "id": "clx1abc124", "type": "invoice", "attributes": { ... } }
  ],
  "meta": {
    "page": 1,
    "limit": 25,
    "total": 142,
    "totalPages": 6
  }
}
```

#### 4.3 Error Response

```json
{
  "error": {
    "statusCode": 422,
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      { "field": "customerId", "message": "Customer not found" },
      { "field": "lineItems", "message": "At least one line item is required" }
    ],
    "timestamp": "2026-06-10T10:30:00Z",
    "path": "/api/v1/finance/invoices"
  }
}
```

#### 4.4 HTTP Status Codes

| Code  | Usage                                        |
| :---- | :------------------------------------------- |
| `200` | Successful GET, PATCH                        |
| `201` | Successful POST (resource created)           |
| `204` | Successful DELETE (no content)               |
| `400` | Bad request (malformed JSON, invalid params) |
| `401` | Not authenticated                            |
| `403` | Not authorized (missing permissions)         |
| `404` | Resource not found                           |
| `409` | Conflict (duplicate, version mismatch)       |
| `422` | Validation error (valid JSON, invalid data)  |
| `429` | Rate limit exceeded                          |
| `500` | Internal server error                        |

### 5. Versioning

- API version in URL path: `/api/v1/...`
- Breaking changes require a new version (`v2`)
- Non-breaking changes (new fields, new endpoints) are added to the current version
- Old versions are supported for minimum 6 months after deprecation notice

### 6. Rate Limiting

| Tier         | Limit         | Window     |
| :----------- | :------------ | :--------- |
| Free         | 100 requests  | Per minute |
| Starter      | 500 requests  | Per minute |
| Professional | 2000 requests | Per minute |
| Enterprise   | Custom        | Custom     |

Response headers:

```
X-RateLimit-Limit: 500
X-RateLimit-Remaining: 423
X-RateLimit-Reset: 1686400000
```

### 7. Authentication

All API requests (except auth endpoints) require:

```
Authorization: Bearer <jwt_token>
X-Tenant-ID: <tenant_slug>
```

- JWT tokens are short-lived (15 minutes)
- Refresh tokens are long-lived (7 days)
- Token refresh: `POST /api/v1/auth/refresh`

### 8. Bulk Operations

For operations on multiple resources:

```json
// POST /api/v1/finance/invoices/bulk
{
  "action": "send", // or "delete", "update-status"
  "ids": ["clx1abc123", "clx1abc124", "clx1abc125"],
  "data": { "status": "SENT" } // optional, depends on action
}
```

Response:

```json
{
  "data": {
    "total": 3,
    "succeeded": 2,
    "failed": 1,
    "results": [
      { "id": "clx1abc123", "status": "success" },
      { "id": "clx1abc124", "status": "success" },
      { "id": "clx1abc125", "status": "error", "error": "Invoice already sent" }
    ]
  }
}
```

---

## Tech Stack

> Every technology choice is documented here with its rationale.
> AI agents MUST NOT add new dependencies without updating this file.

### Core Stack

| Category            | Technology | Version | Rationale                                                  |
| :------------------ | :--------- | :------ | :--------------------------------------------------------- |
| **Language**        | TypeScript | ^5.7    | End-to-end type safety, strict mode required               |
| **Runtime**         | Node.js    | ^22 LTS | Latest LTS with native TypeScript support                  |
| **Package Manager** | pnpm       | ^9      | Strict dependencies, disk-efficient, fast                  |
| **Monorepo**        | Turborepo  | ^2      | Incremental builds, remote caching, pipeline orchestration |

### Frontend

| Category          | Technology                | Version | Rationale                                                     |
| :---------------- | :------------------------ | :------ | :------------------------------------------------------------ |
| **Framework**     | Next.js                   | ^15     | App Router, RSC, SSR, built-in API routes                     |
| **UI Primitives** | Radix UI                  | latest  | Accessible, unstyled, composable primitives                   |
| **Styling**       | Vanilla CSS + CSS Modules | —       | Full control, no build-time dependencies, CSS-native features |
| **Icons**         | Lucide React              | latest  | Tree-shakeable, consistent, MIT licensed                      |
| **Charts**        | Recharts                  | latest  | React-native, composable, responsive charts                   |
| **Forms**         | React Hook Form           | ^7      | Performant, minimal re-renders, Zod integration               |
| **Data Fetching** | TanStack Query + tRPC     | latest  | Type-safe, cached, declarative server state                   |
| **Tables**        | TanStack Table            | latest  | Headless, sortable, filterable, paginated                     |
| **Date Handling** | date-fns                  | latest  | Tree-shakeable, immutable, TypeScript-first                   |
| **Toasts**        | Sonner                    | latest  | Simple, beautiful, accessible notifications                   |

### Backend

| Category           | Technology               | Version | Rationale                                                 |
| :----------------- | :----------------------- | :------ | :-------------------------------------------------------- |
| **Framework**      | NestJS                   | ^11     | Modular architecture, DI, guards, pipes, enterprise-ready |
| **Validation**     | Zod                      | ^3      | Shared validation schemas between frontend & backend      |
| **Events**         | @nestjs/event-emitter    | latest  | In-process domain events for module communication         |
| **Queues**         | BullMQ                   | latest  | Redis-backed job queues for async processing              |
| **File Upload**    | Multer (via NestJS)      | —       | Streaming file uploads with size/type validation          |
| **PDF Generation** | @react-pdf/renderer      | latest  | React-based PDF templates for invoices/reports            |
| **Email**          | Nodemailer + React Email | latest  | Templated transactional emails                            |
| **Scheduling**     | @nestjs/schedule         | latest  | Cron jobs for recurring tasks (reports, cleanups)         |
| **WebSockets**     | @nestjs/websockets       | latest  | Real-time updates (notifications, dashboards)             |

### Database & Storage

| Category         | Technology                    | Version | Rationale                                             |
| :--------------- | :---------------------------- | :------ | :---------------------------------------------------- |
| **Database**     | PostgreSQL                    | ^16     | ACID, JSONB, RLS, window functions, CTEs              |
| **ORM**          | Prisma                        | ^6      | Type-safe queries, migrations, schema-as-code         |
| **Cache**        | Redis                         | ^7      | Session store, cache layer, BullMQ backend            |
| **File Storage** | S3-compatible (MinIO for dev) | —       | Document storage, attachments, exports                |
| **Search**       | PostgreSQL Full-Text Search   | —       | Good enough for Phase 0-2; Elasticsearch for Phase 3+ |

### Authentication & Security

| Category             | Technology            | Version | Rationale                                    |
| :------------------- | :-------------------- | :------ | :------------------------------------------- |
| **Auth Framework**   | Auth.js (NextAuth v5) | ^5      | Multi-provider, JWT/session, edge-compatible |
| **Password Hashing** | bcrypt                | latest  | Industry standard, configurable work factor  |
| **JWT**              | jose                  | latest  | Edge-compatible JWT library                  |
| **Rate Limiting**    | @nestjs/throttler     | latest  | API rate limiting per tenant                 |
| **Security Headers** | Helmet                | latest  | OWASP security headers                       |
| **CORS**             | NestJS built-in       | —       | Configurable origin whitelist                |

### Testing

| Category             | Technology            | Version | Rationale                                     |
| :------------------- | :-------------------- | :------ | :-------------------------------------------- |
| **Unit/Integration** | Vitest                | latest  | Fast, ESM-native, Jest-compatible API         |
| **E2E**              | Playwright            | latest  | Cross-browser, reliable, built-in assertions  |
| **API Testing**      | Supertest             | latest  | HTTP assertion library for NestJS controllers |
| **Mocking**          | Vitest built-in + MSW | latest  | Service worker-based API mocking              |
| **Coverage**         | Vitest c8/istanbul    | —       | 80% minimum coverage target                   |

### DevOps & Tooling

| Category             | Technology              | Version          | Rationale                                    |
| :------------------- | :---------------------- | :--------------- | :------------------------------------------- |
| **Linting**          | ESLint                  | ^9 (flat config) | Code quality, consistency                    |
| **Formatting**       | Prettier                | ^3               | Opinionated formatting, end of style debates |
| **Git Hooks**        | Husky + lint-staged     | latest           | Pre-commit linting and formatting            |
| **CI/CD**            | GitHub Actions          | —                | Automated testing, building, deployment      |
| **Containerization** | Docker + Docker Compose | —                | Reproducible local dev and deployment        |
| **Process Manager**  | PM2 (production)        | latest           | Node.js process management, clustering       |

### Package Naming

All internal packages use the `@unerp/` scope:

| Package             | npm Name          | Description              |
| :------------------ | :---------------- | :----------------------- |
| `packages/database` | `@unerp/database` | Prisma client & types    |
| `packages/shared`   | `@unerp/shared`   | Types, validators, utils |
| `packages/ui`       | `@unerp/ui`       | Design system components |
| `packages/auth`     | `@unerp/auth`     | Auth providers & RBAC    |
| `packages/config`   | `@unerp/config`   | Shared tool configs      |

### Adding New Dependencies

Before adding a new dependency, you MUST:

1. **Check if an existing dependency already covers the use case**
2. **Evaluate bundle size impact** (use bundlephobia.com)
3. **Check maintenance status** (last commit, open issues, downloads)
4. **Prefer packages that are**: tree-shakeable, TypeScript-native, well-maintained
5. **Document the rationale** in the commit message
6. **Update this file** with the new dependency

#### Forbidden Dependencies

Do NOT add these — we have alternatives:

| Don't Use     | Use Instead                              | Reason                                 |
| :------------ | :--------------------------------------- | :------------------------------------- |
| Moment.js     | date-fns                                 | Moment is legacy, not tree-shakeable   |
| Lodash (full) | Native JS / lodash-es (specific imports) | Bundle bloat                           |
| Axios         | Native fetch / tRPC                      | No need for HTTP client library        |
| Redux         | React Query + React Context              | Over-engineered for our use case       |
| Tailwind CSS  | Vanilla CSS + CSS Modules                | Full control, no utility-class lock-in |
| Express       | NestJS (built on Express internally)     | NestJS provides structure we need      |

---

## Security

> Security requirements and patterns. Non-negotiable — no exceptions.

### 1. Authentication Flow

```
┌──────────┐     1. Login Request      ┌──────────────┐
│  Client   │ ────────────────────────► │  Auth Server  │
│ (Browser) │                           │ (NextAuth)    │
│           │ ◄──── 2. JWT + Refresh ── │               │
│           │                           └──────────────┘
│           │     3. API Request                │
│           │     + Bearer Token                │
│           │ ────────────────────────► ┌──────────────┐
│           │                           │  NestJS API   │
│           │ ◄──── 4. Response ─────── │  (validates)  │
└──────────┘                           └──────────────┘
```

#### 1.1 Token Strategy

| Token              | Lifetime   | Storage         | Purpose             |
| :----------------- | :--------- | :-------------- | :------------------ |
| Access Token (JWT) | 15 minutes | Memory only     | API authorization   |
| Refresh Token      | 7 days     | HttpOnly cookie | Token renewal       |
| Session Token      | 24 hours   | Redis           | Server-side session |

#### 1.2 JWT Payload

```json
{
  "sub": "user_clx1abc123",
  "tenantId": "tenant_clx1def456",
  "email": "user@acme.com",
  "roles": ["ADMIN", "FINANCE_MANAGER"],
  "orgId": "org_clx1ghi789",
  "iat": 1686400000,
  "exp": 1686400900
}
```

### 2. Authorization (RBAC)

#### 2.1 Permission Format

```
<module>.<resource>.<action>
```

Examples:

```
finance.invoice.create
finance.invoice.read
finance.invoice.update
finance.invoice.delete
finance.invoice.send
finance.invoice.void
hr.employee.read
hr.payroll.approve
inventory.stock.adjust
admin.user.manage
admin.role.manage
```

#### 2.2 Role Hierarchy

```
Super Admin (tenant owner)
    └── Admin
        ├── Finance Manager
        │   ├── Accountant
        │   └── Billing Clerk
        ├── HR Manager
        │   ├── Recruiter
        │   └── Payroll Officer
        ├── Sales Manager
        │   └── Sales Representative
        ├── Inventory Manager
        │   └── Warehouse Staff
        └── Project Manager
            └── Team Member
```

#### 2.3 Guard Implementation

```typescript
// Controller usage
@Controller('finance/invoices')
@UseGuards(AuthGuard, TenantGuard, RbacGuard)
export class InvoiceController {
  @Post()
  @RequirePermissions('finance.invoice.create')
  create(@Body() dto: CreateInvoiceDto) { ... }

  @Get()
  @RequirePermissions('finance.invoice.read')
  findAll(@Query() query: QueryInvoiceDto) { ... }

  @Patch(':id')
  @RequirePermissions('finance.invoice.update')
  update(@Param('id') id: string, @Body() dto: UpdateInvoiceDto) { ... }
}
```

### 3. Multi-Tenancy Security

#### 3.1 Tenant Isolation Layers

```
Layer 1: JWT token contains tenant_id (cannot be forged)
    │
Layer 2: NestJS TenantGuard validates tenant context
    │
Layer 3: Prisma middleware injects WHERE tenant_id = ? on ALL queries
    │
Layer 4: PostgreSQL RLS policies (defense in depth — even if app layer fails)
```

#### 3.2 RLS Policy Example

```sql
-- Enable RLS on all tenant tables
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their tenant's data
CREATE POLICY tenant_isolation ON invoices
  USING (tenant_id = current_setting('app.current_tenant_id')::text);

-- Set the tenant context on each request
SET app.current_tenant_id = 'tenant_clx1def456';
```

#### 3.3 Prisma Tenant Middleware

```typescript
// packages/database/src/middleware/tenant.middleware.ts
prisma.$use(async (params, next) => {
  const tenantId = getTenantFromContext();

  // Auto-inject tenant_id on create
  if (params.action === "create") {
    params.args.data.tenantId = tenantId;
  }

  // Auto-filter by tenant_id on all reads
  if (
    ["findMany", "findFirst", "findUnique", "count"].includes(params.action)
  ) {
    params.args.where = { ...params.args.where, tenantId };
  }

  // Auto-filter on updates/deletes
  if (
    ["update", "updateMany", "delete", "deleteMany"].includes(params.action)
  ) {
    params.args.where = { ...params.args.where, tenantId };
  }

  return next(params);
});
```

### 4. Input Validation & Sanitization

#### 4.1 Validation Rules

1. **All input MUST be validated with Zod** before processing
2. **Never trust client-side validation alone** — always validate server-side
3. **Sanitize HTML input** to prevent XSS (use DOMPurify for rich text)
4. **Validate file uploads**: type, size, extension whitelist
5. **Parameterize all database queries** — Prisma handles this automatically

#### 4.2 Common Validation Patterns

```typescript
// Shared validators in packages/shared
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  sort: z.string().optional(),
  search: z.string().max(200).optional(),
});

export const idParamSchema = z.object({
  id: z.string().cuid2(),
});

export const dateRangeSchema = z
  .object({
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
  })
  .refine(
    (data) =>
      !data.from || !data.to || new Date(data.from) <= new Date(data.to),
    { message: "'from' must be before 'to'" },
  );
```

### 5. Data Protection

#### 5.1 Encryption

| Data Type         | At Rest                     | In Transit |
| :---------------- | :-------------------------- | :--------- |
| Passwords         | bcrypt (cost factor 12)     | TLS 1.3    |
| PII (SSN, Tax ID) | AES-256-GCM                 | TLS 1.3    |
| Financial data    | AES-256-GCM                 | TLS 1.3    |
| General data      | Transparent DB encryption   | TLS 1.3    |
| File uploads      | Server-side encryption (S3) | TLS 1.3    |

#### 5.2 PII Handling

```typescript
// Mark PII fields in Prisma schema with comments
model Employee {
  // ...
  ssn           String?  @map("ssn") // PII: Encrypted at rest
  bankAccount   String?  @map("bank_account") // PII: Encrypted at rest
  // ...
}

// Encryption/decryption handled by a dedicated service
@Injectable()
export class EncryptionService {
  encrypt(plaintext: string): string { ... }
  decrypt(ciphertext: string): string { ... }
}
```

### 6. Security Headers (Helmet)

```typescript
// Applied globally via NestJS
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"], // Required for CSS-in-JS
        imgSrc: ["'self'", "data:", "blob:"],
        connectSrc: ["'self'", process.env.API_URL],
      },
    },
    crossOriginEmbedderPolicy: true,
    crossOriginOpenerPolicy: true,
    crossOriginResourcePolicy: { policy: "same-site" },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  }),
);
```

### 7. Audit Logging

#### 7.1 What to Log

| Event               | Log Level | Details                                     |
| :------------------ | :-------- | :------------------------------------------ |
| Login success       | INFO      | userId, IP, userAgent                       |
| Login failure       | WARN      | email, IP, userAgent, reason                |
| Resource created    | INFO      | entityType, entityId, userId                |
| Resource updated    | INFO      | entityType, entityId, userId, changedFields |
| Resource deleted    | WARN      | entityType, entityId, userId                |
| Permission denied   | WARN      | userId, resource, requiredPermission        |
| Rate limit exceeded | WARN      | userId/IP, endpoint                         |
| System error        | ERROR     | Stack trace, request context                |

#### 7.2 Never Log

- Passwords or password hashes
- Full credit card numbers
- Social Security Numbers
- API keys or tokens
- Raw request/response bodies containing PII

---

## Testing

> AI agents MUST write tests for all business logic. No exceptions.

### 1. Testing Pyramid

```
        ┌─────────────┐
        │    E2E       │  ← Few (critical user flows only)
        │  Playwright  │
        ├─────────────┤
        │ Integration  │  ← Moderate (API endpoints, DB queries)
        │   Vitest +   │
        │  Supertest   │
        ├─────────────┤
        │    Unit      │  ← Many (all business logic, validators)
        │   Vitest     │
        └─────────────┘
```

| Type        | Tool               | Target                                        | Coverage Goal  |
| :---------- | :----------------- | :-------------------------------------------- | :------------- |
| Unit        | Vitest             | Services, validators, utils, helpers          | 80%+           |
| Integration | Vitest + Supertest | Controllers, API endpoints, DB operations     | Key paths      |
| E2E         | Playwright         | Full user workflows (login → create → verify) | Critical flows |

### 2. File Organization

```
// Unit & Integration tests — co-located with source
apps/api/src/modules/finance/
├── finance.service.ts
├── finance.controller.ts
└── tests/
    ├── finance.service.spec.ts           # Unit tests
    ├── finance.controller.spec.ts        # Integration tests
    └── fixtures/
        └── invoice.fixtures.ts           # Test data factories

// E2E tests — in dedicated directory
apps/web/e2e/
├── auth/
│   ├── login.spec.ts
│   └── register.spec.ts
├── finance/
│   ├── create-invoice.spec.ts
│   └── invoice-list.spec.ts
└── helpers/
    ├── auth.helper.ts
    └── seed.helper.ts
```

### 3. Unit Test Pattern (Service)

```typescript
// finance.service.spec.ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import { FinanceService } from "../finance.service";
import { PrismaService } from "@unerp/database";
import { EventEmitter2 } from "@nestjs/event-emitter";
import {
  createMockInvoice,
  createMockInvoiceDto,
} from "./fixtures/invoice.fixtures";

describe("FinanceService", () => {
  let service: FinanceService;
  let prisma: PrismaService;
  let eventEmitter: EventEmitter2;

  beforeEach(() => {
    prisma = {
      invoice: {
        create: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
      },
    } as unknown as PrismaService;

    eventEmitter = {
      emit: vi.fn(),
    } as unknown as EventEmitter2;

    service = new FinanceService(prisma, eventEmitter);
  });

  describe("createInvoice", () => {
    it("should create an invoice and emit an event", async () => {
      // Arrange
      const dto = createMockInvoiceDto();
      const expected = createMockInvoice(dto);
      vi.mocked(prisma.invoice.create).mockResolvedValue(expected);

      // Act
      const result = await service.createInvoice(dto);

      // Assert
      expect(result).toEqual(expected);
      expect(prisma.invoice.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          customerId: dto.customerId,
        }),
      });
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        "invoice.created",
        expect.objectContaining({ invoiceId: expected.id }),
      );
    });

    it("should throw NotFoundException when customer does not exist", async () => {
      // Arrange
      const dto = createMockInvoiceDto({ customerId: "nonexistent" });
      vi.mocked(prisma.invoice.create).mockRejectedValue(
        new Error("Foreign key constraint failed"),
      );

      // Act & Assert
      await expect(service.createInvoice(dto)).rejects.toThrow();
    });
  });
});
```

### 4. Test Data Factories (Fixtures)

```typescript
// fixtures/invoice.fixtures.ts
import { createId } from "@paralleldrive/cuid2";
import type { Invoice } from "@unerp/shared/types";
import type { CreateInvoiceInput } from "@unerp/shared/validators";

export function createMockInvoiceDto(
  overrides: Partial<CreateInvoiceInput> = {},
): CreateInvoiceInput {
  return {
    customerId: createId(),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    lineItems: [
      {
        productId: createId(),
        quantity: 1,
        unitPrice: 100,
        description: "Test product",
      },
    ],
    notes: "Test invoice",
    ...overrides,
  };
}

export function createMockInvoice(
  dto: Partial<CreateInvoiceInput> = {},
  overrides: Partial<Invoice> = {},
): Invoice {
  return {
    id: createId(),
    tenantId: createId(),
    invoiceNumber: "INV-2026-0001",
    status: "DRAFT",
    subtotal: 100,
    taxAmount: 10,
    totalAmount: 110,
    currency: "USD",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...dto,
    ...overrides,
  };
}
```

### 5. Integration Test Pattern (Controller)

```typescript
// finance.controller.spec.ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Test } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { FinanceModule } from "../finance.module";
import { DatabaseModule } from "@unerp/database";

describe("FinanceController (Integration)", () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [FinanceModule, DatabaseModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    // Get auth token for test tenant
    authToken = await getTestAuthToken();
  });

  afterAll(async () => {
    await app.close();
  });

  describe("POST /api/v1/finance/invoices", () => {
    it("should create an invoice and return 201", async () => {
      const dto = {
        customerId: "test_customer_id",
        dueDate: "2026-07-10T00:00:00Z",
        lineItems: [
          { productId: "test_product_id", quantity: 1, unitPrice: 100 },
        ],
      };

      const response = await request(app.getHttpServer())
        .post("/api/v1/finance/invoices")
        .set("Authorization", `Bearer ${authToken}`)
        .send(dto)
        .expect(201);

      expect(response.body.data).toHaveProperty("id");
      expect(response.body.data.attributes.status).toBe("DRAFT");
    });

    it("should return 401 without auth token", async () => {
      await request(app.getHttpServer())
        .post("/api/v1/finance/invoices")
        .send({})
        .expect(401);
    });

    it("should return 422 with invalid data", async () => {
      await request(app.getHttpServer())
        .post("/api/v1/finance/invoices")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ customerId: "" }) // Missing required fields
        .expect(422);
    });
  });
});
```

### 6. E2E Test Pattern (Playwright)

```typescript
// e2e/finance/create-invoice.spec.ts
import { test, expect } from "@playwright/test";
import { loginAsAdmin, seedTestData } from "../helpers";

test.describe("Create Invoice Flow", () => {
  test.beforeEach(async ({ page }) => {
    await seedTestData();
    await loginAsAdmin(page);
  });

  test("should create a new invoice from the finance dashboard", async ({
    page,
  }) => {
    // Navigate to invoices
    await page.goto("/finance/invoices");
    await expect(page.getByRole("heading", { name: "Invoices" })).toBeVisible();

    // Click create button
    await page.getByRole("link", { name: "Create Invoice" }).click();
    await expect(page).toHaveURL("/finance/invoices/new");

    // Fill form
    await page.getByLabel("Customer").click();
    await page.getByRole("option", { name: "Acme Corp" }).click();
    await page.getByLabel("Due Date").fill("2026-07-10");

    // Add line item
    await page.getByRole("button", { name: "Add Line Item" }).click();
    await page.getByLabel("Product").first().click();
    await page.getByRole("option", { name: "Widget Pro" }).click();
    await page.getByLabel("Quantity").first().fill("5");

    // Submit
    await page.getByRole("button", { name: "Create Invoice" }).click();

    // Verify
    await expect(page.getByText("Invoice created successfully")).toBeVisible();
    await expect(page).toHaveURL(/\/finance\/invoices\/[a-z0-9]+/);
  });
});
```

### 7. Running Tests

```bash
# All unit tests
pnpm test

# Watch mode (development)
pnpm test:watch

# Specific package
pnpm --filter @unerp/api test

# Coverage report
pnpm test:coverage

# E2E tests
pnpm test:e2e

# E2E tests with UI (headed browser)
pnpm test:e2e:ui
```

### 8. Test Naming Conventions

```
describe('<ClassName or FunctionName>', () => {
  describe('<methodName>', () => {
    it('should <expected behavior> when <condition>', () => { ... });
    it('should throw <ErrorType> when <invalid condition>', () => { ... });
  });
});
```

Examples:

- ✅ `should create an invoice and emit an event`
- ✅ `should throw NotFoundException when customer does not exist`
- ✅ `should return paginated results with correct meta`
- ❌ `test invoice creation` (too vague)
- ❌ `works` (meaningless)

---

## GitHub Rules

> Enterprise-grade CI/CD governance for the UniERP platform.
> **Policy owner**: @kannan19302 — only this user may modify environment
> configurations, branch protection rules, CODEOWNERS, and CI/CD workflows.

### 1. Deployment Pipeline

All changes follow a strict 4-stage sequential pipeline. No stage can be
skipped. Each stage must succeed before the next begins.

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌──────────────┐
│ Development │ →  │   Quality   │ →  │   Staging   │ →  │  Production  │
│  (auto)     │    │   (QA)      │    │   (UAT)     │    │  (approval)  │
└─────────────┘    └─────────────┘    └─────────────┘    └──────────────┘
       ↑
  Quality Gates
  (must all pass)
```

#### Stage 0 — Quality Gates

Every push and pull request triggers these gates in parallel. **All must
pass** before any deployment stage begins.

| Gate                           | What it checks                         | Blocking?    |
| :----------------------------- | :------------------------------------- | :----------- |
| Lint & Type Check              | ESLint + TypeScript strict compilation | Yes          |
| Unit Tests                     | Vitest (463+ tests, coverage report)   | Yes          |
| Build Web                      | Next.js production build               | Yes          |
| Docker Build (API)             | Dockerfile builds cleanly              | Yes          |
| Build Storybook                | Design system compiles                 | Yes          |
| Migration Drift Check          | Prisma schema matches migrations       | Yes          |
| Production-Readiness Scorecard | 10/10 across 33 modules (7 dimensions) | Yes          |
| Security Scan                  | CodeQL + dependency audit              | Non-blocking |
| E2E (Playwright)               | End-to-end browser tests               | Non-blocking |

#### Stage 1 — Development

| Property               | Value                                                      |
| :--------------------- | :--------------------------------------------------------- |
| **GitHub Environment** | `Development`                                              |
| **Trigger**            | Push to `main` (after all gates pass)                      |
| **Approval**           | None (automatic)                                           |
| **Wait timer**         | None                                                       |
| **Branch policy**      | `main` only                                                |
| **Actions**            | Build image → push to GHCR → deploy API + Web → smoke test |

**Policy**: All quality gates must pass. Deployment is fully automated.
If any gate fails, no deployment occurs.

#### Stage 2 — Quality (QA)

| Property               | Value                                                 |
| :--------------------- | :---------------------------------------------------- |
| **GitHub Environment** | `quality`                                             |
| **Trigger**            | Development deployment succeeds                       |
| **Approval**           | None (automatic after dev passes)                     |
| **Wait timer**         | Configurable (recommended: 5 minutes)                 |
| **Branch policy**      | `main` only                                           |
| **Actions**            | Migrate DB → deploy → run regression suite → validate |

**Policy**: Development must succeed first. Automated regression tests
run against the QA environment. Any failure blocks promotion to staging.

#### Stage 3 — Staging (UAT)

| Property               | Value                                                         |
| :--------------------- | :------------------------------------------------------------ |
| **GitHub Environment** | `staging`                                                     |
| **Trigger**            | QA deployment succeeds                                        |
| **Approval**           | None (automatic after QA passes)                              |
| **Wait timer**         | Configurable (recommended: 15 minutes for UAT window)         |
| **Branch policy**      | `main` only                                                   |
| **Actions**            | Migrate DB → deploy → UAT smoke tests → tag release candidate |

**Policy**: QA must succeed first. UAT smoke tests validate business
flows. A release candidate tag is created for audit traceability.

#### Stage 4 — Production

| Property               | Value                                                                                  |
| :--------------------- | :------------------------------------------------------------------------------------- |
| **GitHub Environment** | `production`                                                                           |
| **Trigger**            | Staging deployment succeeds                                                            |
| **Approval**           | **Required — @kannan19302 only**                                                       |
| **Wait timer**         | Until approval is granted                                                              |
| **Branch policy**      | `main` only                                                                            |
| **Actions**            | Pre-deployment checklist → migrate DB → blue-green deploy → health check → tag release |

**Policy**: This is the most protected stage.

- All prior stages (Development, QA, Staging) must pass.
- **Manual approval from @kannan19302 is mandatory.**
- Even if all policies are satisfied, deployment waits for explicit approval.
- Blue-green deployment strategy for zero-downtime rollout.
- Post-deployment health check must pass.
- A production release tag is created for rollback reference.

### 2. Branch Strategy

| Branch      | Purpose                                 | Deploys to                              | Protection                                            |
| :---------- | :-------------------------------------- | :-------------------------------------- | :---------------------------------------------------- |
| `main`      | Integration branch — all PRs merge here | Development → QA → Staging → Production | Protected: require PR, require reviews, no force push |
| `develop`   | Feature integration (optional)          | CI gates only (no deployment)           | Protected                                             |
| `feature/*` | Individual feature work                 | CI gates on PR                          | None                                                  |
| `release/*` | Release preparation                     | CI gates only                           | Protected                                             |
| `hotfix/*`  | Emergency production fixes              | Fast-track through pipeline             | Require @kannan19302 review                           |

#### Branch Protection Rules (main)

- **Require pull request before merging**: Yes
- **Required approving reviews**: 1 (from CODEOWNERS)
- **Dismiss stale reviews on new push**: Yes
- **Require status checks to pass**: Lint, Unit Tests, Build Web, Docker Build, Migration Drift, Scorecard
- **Require branches up to date**: Yes
- **Restrict who can push**: @kannan19302 only
- **No force pushes**: Enforced
- **No deletions**: Enforced

### 3. CODEOWNERS

File: `.github/CODEOWNERS`

All pull requests require review from @kannan19302. Critical paths
(CI/CD, database migrations, deployment config, security) are
explicitly owned:

```
*                                        @kannan19302
.github/                                 @kannan19302
.ai/                                     @kannan19302
packages/database/prisma/migrations/     @kannan19302
deploy/                                  @kannan19302
docker/                                  @kannan19302
scripts/                                 @kannan19302
AGENTS.md                                @kannan19302
RUNBOOK.md                               @kannan19302
```

### 4. Environment Protection Matrix

| Rule               | Development | Quality  | Staging  | Production     |
| :----------------- | :---------- | :------- | :------- | :------------- |
| Required reviewers | None        | None     | None     | @kannan19302   |
| Wait timer         | 0 min       | 5 min    | 15 min   | Until approval |
| Branch policy      | main        | main     | main     | main           |
| Admin bypass       | Yes         | Yes      | No       | No             |
| Deployment logs    | Retained    | Retained | Retained | Retained       |

### 5. Access Control

#### Policy Modification Authority

Only **@kannan19302** has authority to:

- Create, modify, or delete GitHub environments
- Change environment protection rules (reviewers, wait timers, branch policies)
- Modify branch protection rules
- Edit CODEOWNERS
- Modify CI/CD workflow files (`.github/workflows/`)
- Change deployment configurations (`deploy/`, `docker/`)
- Approve production deployments

#### Contributor Permissions

Contributors may:

- Create feature branches and pull requests
- Push code changes (subject to PR review)
- View deployment status and logs
- Comment on PRs and issues

Contributors may NOT:

- Push directly to `main` or `release/*`
- Modify environment settings or protection rules
- Approve production deployments
- Change CI/CD workflows without CODEOWNER approval
- Modify database migrations without CODEOWNER approval
- Force push or delete protected branches

### 6. Secrets Management

| Secret                        | Environments        | Purpose                                       |
| :---------------------------- | :------------------ | :-------------------------------------------- |
| `DATABASE_URL`                | All                 | PostgreSQL connection string (unique per env) |
| `REDIS_URL`                   | All                 | Redis connection string                       |
| `NEXTAUTH_SECRET`             | All                 | Auth.js signing key (unique per env)          |
| `PII_ENCRYPTION_KEY`          | All                 | AES-256 encryption for PII (unique per env)   |
| `NEXTAUTH_URL`                | All                 | Frontend URL                                  |
| `NEXT_PUBLIC_API_URL`         | All                 | API URL (unique per env)                      |
| `SENTRY_DSN`                  | Staging, Production | Error tracking                                |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | Staging, Production | OpenTelemetry                                 |

**Rules**:

- Secrets are scoped per environment — never shared across stages.
- Production secrets are only accessible by the `production` environment.
- Secrets must never appear in logs, image layers, or source code.
- Rotate secrets quarterly. Emergency rotation within 24 hours of compromise.

### 7. Incident Response & Rollback

#### Emergency Hotfix Process

1. Create `hotfix/<description>` branch from `main`
2. Apply fix and open PR (requires @kannan19302 review)
3. On merge, pipeline runs all gates
4. @kannan19302 can fast-track through environments
5. Production deployment requires approval as usual

#### Rollback

- **API**: Re-deploy previous GHCR image tag (`ghcr.io/<repo>/api:<previous-sha>`)
- **Database**: Prisma does not support down migrations — apply a corrective migration
- **Web**: Re-deploy previous build artifact

#### On-Call Escalation

Production incidents escalate to @kannan19302. See [RUNBOOK.md](../RUNBOOK.md)
for operational procedures.

### 8. Audit & Compliance

- All deployments are tracked via GitHub Environments deployment history
- Every PR requires review — no direct pushes to main
- Production deployments require explicit human approval
- CODEOWNERS ensures critical paths are always reviewed
- Dependency audits run on every CI execution
- CodeQL security scanning on every push
- All container images are signed and stored in GHCR with SHA tags

### 9. Setup Checklist

To fully enable this policy, configure the following in GitHub repo settings:

#### Branch Protection (Settings → Branches → main)

- [ ] Require pull request before merging
- [ ] Require 1 approving review
- [ ] Dismiss stale reviews on new push
- [ ] Require status checks: `Gate: Lint & Type Check`, `Gate: Unit Tests`, `Gate: Build Web`, `Gate: Docker Build (API)`, `Gate: Migration Drift Check`, `Gate: Production-Readiness Scorecard`
- [ ] Require branches up to date before merging
- [ ] Restrict pushes to @kannan19302
- [ ] Do not allow force pushes
- [ ] Do not allow deletions

#### Environments (Settings → Environments)

- [ ] `Development`: No protection rules, main branch only
- [ ] `quality`: 5-minute wait timer, main branch only
- [ ] `staging`: 15-minute wait timer, main branch only
- [ ] `production`: Required reviewer @kannan19302, main branch only

#### Security (Settings → Security)

- [ ] Enable code scanning (for CodeQL results upload)
- [ ] Enable Dependabot alerts
- [ ] Enable secret scanning

#### General (Settings → General)

- [ ] Default branch: `main`
- [ ] Disable forking (if private)
- [ ] Disable wiki (documentation is in `.ai/`)

---

## Builder Studio Conventions

The Builder Studio in UniERP is designed to democratize application development by providing a strictly **Zero-Code / Low-Code environment** for non-technical users.

When working on features related to the Builder Studio, all AI Agents MUST adhere to the following critical principles:

### 1. No Code Required for Users

Never build UI or features that require the end-user to manually write, copy, or paste code snippets (like React components, JSX, or complex configuration objects).

- **If a user wants to publish a form**, provide a visual wizard that deploys the form to a dynamic route or overrides an existing route automatically.
- **If a user wants to add custom logic**, provide a visual workflow builder or rule engine, not a JavaScript eval box.

### 2. Dynamic over Hardcoded

When a user builds a form or a page in the Builder Studio, it must integrate seamlessly with the rest of the application without requiring a server restart or manual file edits.

- **Page Registry**: Custom pages and forms are stored in a database (or `localStorage` during prototyping) and rendered dynamically using wildcard catch-all routes (e.g., `apps/web/app/(dashboard)/app/[module]/[slug]/page.tsx`).
- **Sidebar Integration**: The sidebar navigation dynamically queries the Page Registry to inject newly created pages into the correct Module headers automatically.

### 3. Direct Visual Manipulation

Users should interact with UI elements directly on the canvas.

- Prefer drag-and-drop handles for resizing columns and heights.
- Provide contextual floating menus or property sidebars instead of hidden JSON configurations.
- Elements should snap to the 12-column global grid (`ui-grid-12`, formerly `frappe-grid-12`) to ensure responsiveness and alignment.

### 4. Developer Mode (Minimal)

If a technical feature must be exposed (like webhook URLs or iframe embed codes for external websites), it must be clearly separated from the primary "Internal ERP" deployment flows.

- Label these features clearly as "For Developers".
- Provide one-click "Copy to Clipboard" buttons.

### 5. Summary

The success of the Builder Studio is measured by how quickly a non-technical manager can build a custom CRM Lead Form and deploy it to their team's dashboard without ever seeing a line of code. Everything you build must serve this goal.

---

## Glossary

> Domain-specific terminology used throughout the codebase.
> AI agents should reference this when the meaning of a term is unclear.

### General ERP Terms

| Term              | Definition                                                                             |
| :---------------- | :------------------------------------------------------------------------------------- |
| **ERP**           | Enterprise Resource Planning — integrated software managing core business processes    |
| **Module**        | A self-contained functional area (e.g., Finance, HR, Inventory)                        |
| **Tenant**        | An organization/company using the system (in multi-tenant SaaS context)                |
| **Multi-tenancy** | Architecture where a single instance serves multiple organizations with data isolation |
| **RLS**           | Row-Level Security — PostgreSQL feature enforcing data isolation at the database level |
| **RBAC**          | Role-Based Access Control — authorization based on user roles and permissions          |

### Finance Terms

| Term                         | Definition                                                                       |
| :--------------------------- | :------------------------------------------------------------------------------- |
| **General Ledger (GL)**      | The master accounting record; all financial transactions flow here               |
| **Chart of Accounts (CoA)**  | Structured list of all accounts used by an organization                          |
| **Accounts Payable (AP)**    | Money the company owes to vendors/suppliers                                      |
| **Accounts Receivable (AR)** | Money owed to the company by customers                                           |
| **Journal Entry**            | A record of a financial transaction in double-entry bookkeeping                  |
| **Invoice**                  | A document requesting payment from a customer for goods/services                 |
| **Bill**                     | An invoice received from a vendor (the AP equivalent of an invoice)              |
| **Credit Note**              | A document reducing the amount owed by a customer                                |
| **Debit Note**               | A document increasing the amount owed by a customer                              |
| **Fiscal Year**              | The 12-month period used for financial reporting (may differ from calendar year) |
| **Tax Rate**                 | Percentage applied to taxable transactions                                       |
| **Payment Terms**            | Agreement on when payment is due (e.g., Net 30 = due in 30 days)                 |
| **Reconciliation**           | Process of matching bank transactions with accounting records                    |

### HR Terms

| Term            | Definition                                                  |
| :-------------- | :---------------------------------------------------------- |
| **Employee**    | A person employed by the organization                       |
| **Payroll**     | The process of calculating and distributing employee wages  |
| **Leave**       | Time off from work (vacation, sick, personal, etc.)         |
| **Attendance**  | Record of employee work hours and presence                  |
| **Department**  | An organizational unit within a company                     |
| **Designation** | An employee's job title or role                             |
| **Onboarding**  | Process of integrating a new employee into the organization |
| **Offboarding** | Process of managing an employee's departure                 |

### Inventory & Supply Chain Terms

| Term              | Definition                                                                |
| :---------------- | :------------------------------------------------------------------------ |
| **SKU**           | Stock Keeping Unit — unique identifier for a product variant              |
| **Warehouse**     | A physical location where inventory is stored                             |
| **Bin**           | A specific storage location within a warehouse                            |
| **Stock Entry**   | A record of stock movement (receipt, issue, transfer)                     |
| **Reorder Point** | Inventory level that triggers a new purchase order                        |
| **Lead Time**     | Time between placing and receiving an order                               |
| **FIFO**          | First In, First Out — inventory valuation method                          |
| **LIFO**          | Last In, First Out — inventory valuation method                           |
| **BOM**           | Bill of Materials — list of raw materials needed to manufacture a product |
| **MRP**           | Material Requirements Planning — planning production based on demand      |

### Sales & CRM Terms

| Term                    | Definition                                            |
| :---------------------- | :---------------------------------------------------- |
| **Lead**                | A potential customer who has shown interest           |
| **Opportunity**         | A qualified lead with a potential deal                |
| **Pipeline**            | Visual representation of sales opportunities by stage |
| **Quotation**           | A formal price proposal sent to a potential customer  |
| **Sales Order**         | A confirmed order from a customer                     |
| **Delivery Note**       | A document accompanying goods being delivered         |
| **Return**              | Goods sent back by a customer                         |
| **RFQ**                 | Request for Quotation — asking vendors for pricing    |
| **Purchase Order (PO)** | A formal order sent to a vendor                       |

### Technical Terms

| Term             | Definition                                                                   |
| :--------------- | :--------------------------------------------------------------------------- |
| **DTO**          | Data Transfer Object — object used to transfer data between layers           |
| **Domain Event** | A notification that something significant happened in a module               |
| **Middleware**   | Code that runs between request and handler (auth, logging, tenant injection) |
| **Guard**        | NestJS construct that determines if a request should be handled              |
| **Pipe**         | NestJS construct that transforms/validates input data                        |
| **Interceptor**  | NestJS construct that adds logic before/after handler execution              |
| **BFF**          | Backend For Frontend — an API layer tailored to a specific frontend          |
| **RSC**          | React Server Components — React components that render on the server         |
| **tRPC**         | TypeScript RPC — type-safe API calls without schema definition               |
| **ORM**          | Object-Relational Mapping — maps database tables to code objects             |
| **Migration**    | A versioned change to the database schema                                    |
| **Seed**         | Initial data loaded into the database for development/testing                |
