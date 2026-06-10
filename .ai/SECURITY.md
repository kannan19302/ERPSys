# Security — Universal ERP System

> Security requirements and patterns. Non-negotiable — no exceptions.

---

## 1. Authentication Flow

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

### 1.1 Token Strategy

| Token | Lifetime | Storage | Purpose |
|:---|:---|:---|:---|
| Access Token (JWT) | 15 minutes | Memory only | API authorization |
| Refresh Token | 7 days | HttpOnly cookie | Token renewal |
| Session Token | 24 hours | Redis | Server-side session |

### 1.2 JWT Payload

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

---

## 2. Authorization (RBAC)

### 2.1 Permission Format

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

### 2.2 Role Hierarchy

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

### 2.3 Guard Implementation

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

---

## 3. Multi-Tenancy Security

### 3.1 Tenant Isolation Layers

```
Layer 1: JWT token contains tenant_id (cannot be forged)
    │
Layer 2: NestJS TenantGuard validates tenant context
    │
Layer 3: Prisma middleware injects WHERE tenant_id = ? on ALL queries
    │
Layer 4: PostgreSQL RLS policies (defense in depth — even if app layer fails)
```

### 3.2 RLS Policy Example

```sql
-- Enable RLS on all tenant tables
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their tenant's data
CREATE POLICY tenant_isolation ON invoices
  USING (tenant_id = current_setting('app.current_tenant_id')::text);

-- Set the tenant context on each request
SET app.current_tenant_id = 'tenant_clx1def456';
```

### 3.3 Prisma Tenant Middleware

```typescript
// packages/database/src/middleware/tenant.middleware.ts
prisma.$use(async (params, next) => {
  const tenantId = getTenantFromContext();

  // Auto-inject tenant_id on create
  if (params.action === 'create') {
    params.args.data.tenantId = tenantId;
  }

  // Auto-filter by tenant_id on all reads
  if (['findMany', 'findFirst', 'findUnique', 'count'].includes(params.action)) {
    params.args.where = { ...params.args.where, tenantId };
  }

  // Auto-filter on updates/deletes
  if (['update', 'updateMany', 'delete', 'deleteMany'].includes(params.action)) {
    params.args.where = { ...params.args.where, tenantId };
  }

  return next(params);
});
```

---

## 4. Input Validation & Sanitization

### 4.1 Validation Rules

1. **All input MUST be validated with Zod** before processing
2. **Never trust client-side validation alone** — always validate server-side
3. **Sanitize HTML input** to prevent XSS (use DOMPurify for rich text)
4. **Validate file uploads**: type, size, extension whitelist
5. **Parameterize all database queries** — Prisma handles this automatically

### 4.2 Common Validation Patterns

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

export const dateRangeSchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
}).refine(
  (data) => !data.from || !data.to || new Date(data.from) <= new Date(data.to),
  { message: "'from' must be before 'to'" }
);
```

---

## 5. Data Protection

### 5.1 Encryption

| Data Type | At Rest | In Transit |
|:---|:---|:---|
| Passwords | bcrypt (cost factor 12) | TLS 1.3 |
| PII (SSN, Tax ID) | AES-256-GCM | TLS 1.3 |
| Financial data | AES-256-GCM | TLS 1.3 |
| General data | Transparent DB encryption | TLS 1.3 |
| File uploads | Server-side encryption (S3) | TLS 1.3 |

### 5.2 PII Handling

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

---

## 6. Security Headers (Helmet)

```typescript
// Applied globally via NestJS
app.use(helmet({
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
  crossOriginResourcePolicy: { policy: 'same-site' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));
```

---

## 7. Audit Logging

### 7.1 What to Log

| Event | Log Level | Details |
|:---|:---|:---|
| Login success | INFO | userId, IP, userAgent |
| Login failure | WARN | email, IP, userAgent, reason |
| Resource created | INFO | entityType, entityId, userId |
| Resource updated | INFO | entityType, entityId, userId, changedFields |
| Resource deleted | WARN | entityType, entityId, userId |
| Permission denied | WARN | userId, resource, requiredPermission |
| Rate limit exceeded | WARN | userId/IP, endpoint |
| System error | ERROR | Stack trace, request context |

### 7.2 Never Log

- Passwords or password hashes
- Full credit card numbers
- Social Security Numbers
- API keys or tokens
- Raw request/response bodies containing PII
