# Architecture Reference — Universal ERP System

> Last updated: 2026-06-10 | Phase: 0 — Foundation

---

## 1. System Overview

UniERP is a **composable, multi-tenant ERP system** built as a TypeScript monorepo. The system follows a **modular monolith** approach for the backend (NestJS), with clean domain boundaries that allow future extraction to microservices if needed.

### High-Level Architecture

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

---

## 2. Monorepo Structure

### 2.1 Workspace Organization

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

### 2.2 Dependency Graph

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

### 2.3 Turborepo Pipeline

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

---

## 3. Module Structure (Backend)

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

### 3.1 Module Definition Pattern

```typescript
// finance.module.ts
import { Module } from '@nestjs/common';
import { FinanceController } from './finance.controller';
import { FinanceService } from './finance.service';
import { DatabaseModule } from '@unerp/database';

@Module({
  imports: [DatabaseModule],
  controllers: [FinanceController],
  providers: [FinanceService],
  exports: [FinanceService], // Only export service, never controller
})
export class FinanceModule {}
```

### 3.2 Controller Pattern (Thin Controller)

```typescript
// finance.controller.ts
import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { TenantGuard } from '@/common/guards/tenant.guard';
import { RbacGuard } from '@/common/guards/rbac.guard';
import { Permissions } from '@/common/decorators/permissions.decorator';

@Controller('finance')
@UseGuards(TenantGuard, RbacGuard)
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Post('invoices')
  @Permissions('finance.invoice.create')
  async createInvoice(@Body() dto: CreateInvoiceDto) {
    return this.financeService.createInvoice(dto);
  }
}
```

### 3.3 Service Pattern (Business Logic)

```typescript
// finance.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@unerp/database';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { InvoiceCreatedEvent } from './events/invoice-created.event';

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
    this.eventEmitter.emit(
      'invoice.created',
      new InvoiceCreatedEvent(invoice),
    );

    return invoice;
  }
}
```

---

## 4. Event-Driven Communication

### 4.1 Rules

1. **Modules MUST NOT import from each other directly.** No `import { InventoryService } from '../inventory/inventory.service'`.
2. **Cross-module communication happens via domain events only.**
3. **Events are fire-and-forget by default.** For guaranteed delivery, use BullMQ job queues.
4. **Every event must be documented** with its payload schema.

### 4.2 Event Naming Convention

```
<domain>.<entity>.<action>
```

Examples:
- `finance.invoice.created`
- `finance.payment.received`
- `inventory.stock.depleted`
- `hr.employee.onboarded`
- `crm.lead.converted`

### 4.3 Event Payload Pattern

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

### 4.4 Event Listener Pattern

```typescript
// In inventory module — listening to finance events
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class InventoryEventHandler {
  @OnEvent('finance.invoice.created')
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

### 4.5 Core Event Map

| Source Module | Event | Listeners |
|:---|:---|:---|
| Finance | `invoice.created` | Inventory (reduce stock), Accounting (post journal entry) |
| Finance | `payment.received` | CRM (update customer status), Notifications |
| Sales | `order.confirmed` | Inventory (reserve stock), Finance (create invoice) |
| Inventory | `stock.depleted` | Procurement (auto-reorder), Notifications |
| HR | `employee.onboarded` | Finance (add to payroll), IT (provision accounts) |
| CRM | `lead.converted` | Sales (create opportunity), Notifications |
| Procurement | `purchase.approved` | Finance (create AP entry), Inventory (expect delivery) |

---

## 5. Frontend Architecture (Next.js)

### 5.1 Route Structure

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

### 5.2 Page Pattern

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

### 5.3 Data Fetching Pattern

- **Server Components** for initial data load (direct database queries via tRPC)
- **Client Components** for interactive elements (forms, filters, real-time updates)
- **React Query (TanStack Query)** for client-side cache management
- **tRPC** for type-safe API calls between Next.js frontend and NestJS backend

---

## 6. Multi-Tenancy Architecture

### 6.1 Strategy: Shared Database + Row-Level Security

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

### 6.2 Implementation

1. Every table includes `tenant_id VARCHAR NOT NULL`
2. PostgreSQL RLS policies enforce tenant isolation
3. Prisma middleware injects `tenant_id` from the authenticated user's context
4. The `tenant_id` is extracted from the JWT token on every request

### 6.3 Tenant Resolution Flow

```
Request → JWT Decode → Extract tenant_id → Set PostgreSQL session variable
       → Prisma middleware auto-filters all queries by tenant_id
       → RLS acts as safety net at database level
```

---

## 7. Scalability Path

The modular monolith is designed to evolve:

```
Phase 0-2: Modular Monolith (single NestJS app, all modules in-process)
    ↓
Phase 3+:  Extract high-traffic modules to microservices (if needed)
    ↓
Future:    Event-driven microservices with message broker (RabbitMQ/Kafka)
```

Because modules communicate via events (not direct imports), extracting a module to a separate service only requires:
1. Move the module code to a new NestJS app
2. Replace in-process EventEmitter with a message broker
3. No changes to the other modules
