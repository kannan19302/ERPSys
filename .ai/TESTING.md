# Testing Strategy — Universal ERP System

> AI agents MUST write tests for all business logic. No exceptions.

---

## 1. Testing Pyramid

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

| Type | Tool | Target | Coverage Goal |
|:---|:---|:---|:---|
| Unit | Vitest | Services, validators, utils, helpers | 80%+ |
| Integration | Vitest + Supertest | Controllers, API endpoints, DB operations | Key paths |
| E2E | Playwright | Full user workflows (login → create → verify) | Critical flows |

---

## 2. File Organization

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

---

## 3. Unit Test Pattern (Service)

```typescript
// finance.service.spec.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FinanceService } from '../finance.service';
import { PrismaService } from '@unerp/database';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { createMockInvoice, createMockInvoiceDto } from './fixtures/invoice.fixtures';

describe('FinanceService', () => {
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

  describe('createInvoice', () => {
    it('should create an invoice and emit an event', async () => {
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
        'invoice.created',
        expect.objectContaining({ invoiceId: expected.id }),
      );
    });

    it('should throw NotFoundException when customer does not exist', async () => {
      // Arrange
      const dto = createMockInvoiceDto({ customerId: 'nonexistent' });
      vi.mocked(prisma.invoice.create).mockRejectedValue(
        new Error('Foreign key constraint failed'),
      );

      // Act & Assert
      await expect(service.createInvoice(dto)).rejects.toThrow();
    });
  });
});
```

---

## 4. Test Data Factories (Fixtures)

```typescript
// fixtures/invoice.fixtures.ts
import { createId } from '@paralleldrive/cuid2';
import type { Invoice } from '@unerp/shared/types';
import type { CreateInvoiceInput } from '@unerp/shared/validators';

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
        description: 'Test product',
      },
    ],
    notes: 'Test invoice',
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
    invoiceNumber: 'INV-2026-0001',
    status: 'DRAFT',
    subtotal: 100,
    taxAmount: 10,
    totalAmount: 110,
    currency: 'USD',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...dto,
    ...overrides,
  };
}
```

---

## 5. Integration Test Pattern (Controller)

```typescript
// finance.controller.spec.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { FinanceModule } from '../finance.module';
import { DatabaseModule } from '@unerp/database';

describe('FinanceController (Integration)', () => {
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

  describe('POST /api/v1/finance/invoices', () => {
    it('should create an invoice and return 201', async () => {
      const dto = {
        customerId: 'test_customer_id',
        dueDate: '2026-07-10T00:00:00Z',
        lineItems: [{ productId: 'test_product_id', quantity: 1, unitPrice: 100 }],
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/finance/invoices')
        .set('Authorization', `Bearer ${authToken}`)
        .send(dto)
        .expect(201);

      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.attributes.status).toBe('DRAFT');
    });

    it('should return 401 without auth token', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/finance/invoices')
        .send({})
        .expect(401);
    });

    it('should return 422 with invalid data', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/finance/invoices')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ customerId: '' }) // Missing required fields
        .expect(422);
    });
  });
});
```

---

## 6. E2E Test Pattern (Playwright)

```typescript
// e2e/finance/create-invoice.spec.ts
import { test, expect } from '@playwright/test';
import { loginAsAdmin, seedTestData } from '../helpers';

test.describe('Create Invoice Flow', () => {
  test.beforeEach(async ({ page }) => {
    await seedTestData();
    await loginAsAdmin(page);
  });

  test('should create a new invoice from the finance dashboard', async ({ page }) => {
    // Navigate to invoices
    await page.goto('/finance/invoices');
    await expect(page.getByRole('heading', { name: 'Invoices' })).toBeVisible();

    // Click create button
    await page.getByRole('link', { name: 'Create Invoice' }).click();
    await expect(page).toHaveURL('/finance/invoices/new');

    // Fill form
    await page.getByLabel('Customer').click();
    await page.getByRole('option', { name: 'Acme Corp' }).click();
    await page.getByLabel('Due Date').fill('2026-07-10');

    // Add line item
    await page.getByRole('button', { name: 'Add Line Item' }).click();
    await page.getByLabel('Product').first().click();
    await page.getByRole('option', { name: 'Widget Pro' }).click();
    await page.getByLabel('Quantity').first().fill('5');

    // Submit
    await page.getByRole('button', { name: 'Create Invoice' }).click();

    // Verify
    await expect(page.getByText('Invoice created successfully')).toBeVisible();
    await expect(page).toHaveURL(/\/finance\/invoices\/[a-z0-9]+/);
  });
});
```

---

## 7. Running Tests

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

---

## 8. Test Naming Conventions

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
