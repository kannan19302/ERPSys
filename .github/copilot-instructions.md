# GitHub Copilot Instructions — UniERP

Universal ERP System (UniERP): composable, multi-tenant, industry-agnostic ERP.
31 modules across phases 0–20 | NestJS API | Next.js 15 | PostgreSQL/Prisma | Redis/BullMQ

## Before suggesting anything

1. The project has 31 fully implemented ERP modules. Check `.ai/MODULE_REGISTRY.md` before suggesting new code — it very likely already exists.
2. Read `AGENTS.md` for all critical project rules.
3. Read `.ai/CONVENTIONS.md` for naming, UI, and TypeScript patterns.

## Non-negotiable rules (enforce in every suggestion)

### TypeScript
- Strict mode everywhere — no `any`, no ESLint disables
- Use `unknown` + type guards when type is uncertain
- Zod for all DTO validation (shared between frontend and backend via `packages/shared`)

### Multi-tenancy (every DB query)
- Every Prisma query must include `where: { tenantId: ctx.tenantId, ... }`
- Every table has a `tenant_id` column — never omit it from a new model
- Never suggest a query that could return records from multiple tenants

### RBAC (every API endpoint)
- Every NestJS controller method needs `@Permissions('module.resource.action')`
- Every UI privileged action needs `<ProtectedComponent permission="...">`
- Register new permissions in `packages/shared/src/permissions/registry.ts`

### Change history (every mutation)
- Every entity-mutation controller method needs `@TrackChanges('EntityType')` + `@UseInterceptors(ChangeHistoryInterceptor)`

### Module boundaries
- Modules NEVER import from each other directly
- Cross-module communication via domain events only (emit in one module, consume in another)

### UI/UX (all frontend suggestions)
- Use `@unerp/ui` components from `packages/ui/` — not custom or third-party components
- Use `.frappe-*` utility classes for layout/forms (defined in `globals.css`)
- Use CSS variables from `design-tokens.css` — no hardcoded hex colors or pixel values
- No inline styles on layout elements
- Every page needs breadcrumbs registered in `SEGMENT_NAMES` in `apps/web/app/(dashboard)/layout.tsx`
- Handle all four states in every data view: loading, empty, error, success

### Logging & secrets
- Never suggest `console.log` — use `@unerp/shared/logger`
- Never put secrets, API keys, or credentials in code — use env vars from `.env`

### Database migrations
- Schema changes go in `packages/database/prisma/schema.prisma`
- Never hand-edit `prisma/migrations/` — always use `pnpm db:migrate`

### Testing
- All business logic must have unit tests (80%+ coverage target)
- Tenant isolation tests are mandatory: a user in Tenant A must never access Tenant B's data
- RBAC enforcement must be tested: unauthorized role must get 403

## Project structure

```
apps/
  api/src/modules/<module>/   ← NestJS modules
    *.module.ts, *.controller.ts, *.service.ts
    dto/, entities/, events/, tests/
  web/app/(dashboard)/<module>/  ← Next.js 15 pages
packages/
  database/prisma/schema.prisma  ← single Prisma schema
  shared/src/                    ← Zod validators, types, permissions
  ui/                            ← @unerp/ui design system
  auth/                          ← Auth.js + RBAC
```

## Module status

All 31 modules are tracked in `.ai/MODULE_REGISTRY.md`. Before suggesting a new service, entity, or page, check if the module is already ACTIVE. If it is, suggest extending it rather than creating a parallel implementation.
