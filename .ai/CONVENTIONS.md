# Coding Conventions — Universal ERP System

> All AI agents and human developers MUST follow these conventions without exception.

---

## 1. Naming Conventions

### 1.1 Files & Directories

| Type | Convention | Example |
|:---|:---|:---|
| Directories | `kebab-case` | `purchase-orders/`, `sales-reports/` |
| React Components | `kebab-case.tsx` | `invoice-list.tsx`, `page-header.tsx` |
| NestJS files | `kebab-case` with suffix | `finance.controller.ts`, `create-invoice.dto.ts` |
| Test files | `*.spec.ts` or `*.test.ts` | `finance.service.spec.ts` |
| CSS files | `kebab-case.css` | `invoice-list.css`, `design-tokens.css` |
| Constants files | `kebab-case.ts` | `error-codes.ts`, `permissions.ts` |
| Type files | `kebab-case.ts` | `invoice.types.ts`, `user.types.ts` |

### 1.2 Code Identifiers

| Type | Convention | Example |
|:---|:---|:---|
| Variables | `camelCase` | `invoiceTotal`, `lineItems` |
| Functions | `camelCase` | `calculateTax()`, `getInvoiceById()` |
| Classes | `PascalCase` | `FinanceService`, `InvoiceController` |
| Interfaces | `PascalCase` (no `I` prefix) | `Invoice`, `CreateInvoiceDto` |
| Types | `PascalCase` | `InvoiceStatus`, `PaymentMethod` |
| Enums | `PascalCase` (values UPPER_SNAKE) | `InvoiceStatus.PAID`, `Role.ADMIN` |
| Constants | `UPPER_SNAKE_CASE` | `MAX_RETRY_COUNT`, `DEFAULT_PAGE_SIZE` |
| Database tables | `snake_case` (plural) | `invoices`, `purchase_orders` |
| Database columns | `snake_case` | `tenant_id`, `created_at`, `total_amount` |
| API endpoints | `kebab-case` (plural nouns) | `/api/v1/invoices`, `/api/v1/purchase-orders` |
| Event names | `dot.separated` | `finance.invoice.created` |
| Environment vars | `UPPER_SNAKE_CASE` | `DATABASE_URL`, `REDIS_HOST` |

### 1.3 Boolean Naming

Always use a verb prefix for booleans:
- ✅ `isActive`, `hasPermission`, `canEdit`, `shouldNotify`
- ❌ `active`, `permission`, `edit`, `notify`

---

## 2. TypeScript Rules

### 2.1 Strict Mode

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

### 2.2 Type Safety

```typescript
// ✅ CORRECT — explicit types
function calculateTotal(items: InvoiceLineItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
}

// ❌ WRONG — never use `any`
function calculateTotal(items: any[]): any {
  return items.reduce((sum: any, item: any) => sum + item.quantity * item.unitPrice, 0);
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

### 2.3 Import Order

Always order imports in this sequence, with a blank line between groups:

```typescript
// 1. Node.js built-ins
import { readFile } from 'node:fs/promises';

// 2. External packages
import { Injectable } from '@nestjs/common';
import { z } from 'zod';

// 3. Internal packages (monorepo)
import { PrismaService } from '@unerp/database';
import { type Invoice } from '@unerp/shared/types';

// 4. Relative imports (parent first, then siblings, then children)
import { FinanceService } from '../finance.service';
import { CreateInvoiceDto } from './create-invoice.dto';
```

### 2.4 Export Rules

- **Named exports only.** No default exports (except Next.js pages which require them).
- **Barrel exports** (`index.ts`) are allowed in `packages/` but NOT in `apps/`.
- **Re-export types** with `export type` to enable proper tree-shaking.

```typescript
// packages/shared/src/types/index.ts
export type { Invoice, InvoiceLineItem, InvoiceStatus } from './invoice.types';
export type { User, UserRole } from './user.types';
```

---

## 3. React / Next.js Conventions

### 3.1 Component Structure

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

### 3.2 Server vs Client Components

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

### 3.3 State Management

- **Server State**: React Query (TanStack Query) via tRPC
- **Client State**: React `useState` / `useReducer` for local state
- **Form State**: React Hook Form + Zod validation
- **No global state library** (no Redux, Zustand, etc.) — use React Context for theme/auth only

---

## 4. NestJS Conventions

### 4.1 Controller Rules

- Controllers are **thin** — they validate input and delegate to services
- Controllers handle HTTP concerns only (status codes, headers, response format)
- Controllers MUST use guards for auth/permissions
- Controllers MUST use DTOs for input validation

### 4.2 Service Rules

- Services contain **all business logic**
- Services emit domain events for cross-module communication
- Services MUST NOT import from other modules directly
- Services use dependency injection (constructor injection)

### 4.3 DTO Validation

All DTOs use Zod schemas from `packages/shared`:

```typescript
// packages/shared/src/validators/invoice.validator.ts
import { z } from 'zod';

export const createInvoiceSchema = z.object({
  customerId: z.string().uuid(),
  dueDate: z.string().datetime(),
  lineItems: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().positive(),
    unitPrice: z.number().positive(),
    description: z.string().max(500).optional(),
  })).min(1),
  notes: z.string().max(2000).optional(),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;

// apps/api/src/modules/finance/dto/create-invoice.dto.ts
import { createInvoiceSchema, type CreateInvoiceInput } from '@unerp/shared/validators';

export class CreateInvoiceDto implements CreateInvoiceInput {
  // Validated by Zod pipe in controller
}
```

---

## 5. Error Handling

### 5.1 Backend Errors

```typescript
// Use NestJS built-in exceptions
throw new NotFoundException(`Invoice ${id} not found`);
throw new BadRequestException('Invalid invoice data');
throw new ForbiddenException('Insufficient permissions');
throw new ConflictException('Invoice already exists');

// Custom business errors extend a base class
export class InsufficientStockError extends BadRequestException {
  constructor(productId: string, requested: number, available: number) {
    super(`Insufficient stock for product ${productId}: requested ${requested}, available ${available}`);
  }
}
```

### 5.2 Error Response Format

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

---

## 6. Git Conventions

### 6.1 Commit Messages

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

### 6.2 Branch Naming

```
<type>/<module>/<description>
```

Examples:
```
feat/finance/invoice-crud
fix/inventory/stock-sync
docs/ai/update-architecture
```

---

## 7. Comments & Documentation

### 7.1 When to Comment

- **DO** comment on "why" — business logic rationale, non-obvious decisions
- **DO** document public APIs with JSDoc
- **DON'T** comment on "what" — the code should be self-explanatory
- **DON'T** leave TODO comments without a linked issue

### 7.2 JSDoc Pattern

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
