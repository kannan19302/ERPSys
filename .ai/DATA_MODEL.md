# Data Model — Universal ERP System

> Reference document for the core data model. All entity design decisions are documented here.
> AI agents MUST follow these patterns when creating new database entities.

---

## 1. Design Principles

### 1.1 Every Table Must Include

```sql
-- These columns are MANDATORY on every table
id              VARCHAR(30)   PRIMARY KEY    -- CUID2 format (e.g., "clx1a2b3c4...")
tenant_id       VARCHAR(30)   NOT NULL       -- Foreign key to tenants table
created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
created_by      VARCHAR(30)   REFERENCES users(id)
updated_by      VARCHAR(30)   REFERENCES users(id)
```

### 1.2 ID Generation

- Use **CUID2** for all primary keys (collision-resistant, sortable, URL-safe)
- Never use auto-increment integers (leaks count, not portable across tenants)
- Never use UUIDv4 (poor index performance due to randomness)

### 1.3 Soft Deletes

For entities that should be recoverable:

```sql
deleted_at      TIMESTAMPTZ   DEFAULT NULL
deleted_by      VARCHAR(30)   REFERENCES users(id)
```

- When `deleted_at IS NOT NULL`, the record is soft-deleted
- Prisma middleware auto-filters soft-deleted records from queries
- Hard delete only via explicit admin action

### 1.4 Enum Strategy

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

---

## 2. Core Entity Relationship Diagram

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

---

## 3. Core Prisma Models

### 3.1 Tenant & Auth

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

### 3.2 Organization Structure

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

### 3.3 Business Entities (Preview)

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

---

## 3.4 E-Commerce Storefront (module #33)

Public catalog/cart/checkout layer built on top of existing `Product` / `SalesOrder` / `Invoice` —
see `.ai/ECOMMERCE_MODULE_REQUIREMENTS.md` for the full MVP spec. No parallel product or order
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
public guard is only responsible for resolving *which* `tenantId` to inject before the extension runs,
never for bypassing the extension itself.

**Status field convention**: `Cart.status` and `StorefrontOrderPayment.status` follow this repo's
enum strategy (Section 1.4) — plain `String` columns with app-level Zod validation, not Postgres
enums, matching every other status field in the schema.

## 4. Money & Currency Handling

### 4.1 Rules

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

---

## 5. Audit Trail

### 5.1 Pattern

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

### 5.2 Implementation

- Prisma middleware intercepts all `create`, `update`, `delete` operations
- Automatically captures before/after values for `update` operations
- Audit logs are append-only — never modified or deleted
- Stored in the same database but can be moved to a separate store at scale
