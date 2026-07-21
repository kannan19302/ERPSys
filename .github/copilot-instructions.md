# GitHub Copilot Instructions — UniERP

Universal ERP System (UniERP): composable, multi-tenant, industry-agnostic ERP.
All registered modules (see .ai/MODULE_REGISTRY.md dashboard) across phases 0–20 | NestJS API | Next.js 15 | PostgreSQL/Prisma | Redis/BullMQ

## Before suggesting anything

1. The project has 31 fully implemented ERP modules. Check `.ai/MODULE_REGISTRY.md` before suggesting new code — it very likely already exists.
2. Read `AGENTS.md` for all critical project rules.
3. Read `.ai/HANDBOOK.md#coding-conventions` for naming, UI, and TypeScript patterns.
4. Read `.ai/ARCHITECTURE_FOUNDATION.md`. Foundation SEALED v1.0 (2026-07-18): the freeze is lifted, and its 8 non-negotiable rules are permanent sealed contracts (changing one requires an ADR).

## Mandatory Tracking Convention — The 3-File System

UniERP tracks all state in exactly 3 files: `.ai/MODULE_REGISTRY.md` (module status + Collab
Board), `.ai/CHANGELOG.md` (append-only history), `.ai/HANDBOOK.md` (architecture/conventions
reference). Check the Collab Board before starting; after finishing, update CHANGELOG.md and
MODULE_REGISTRY.md — every time, no exceptions, even for small changes. Full rule:
[AGENTS.md § Mandatory Tracking Convention](../AGENTS.md#-mandatory-tracking-convention--the-3-file-system).

## Non-negotiable rules (enforce in every suggestion)

### TypeScript

- Strict mode everywhere — no `any`, no ESLint disables
- Use `unknown` + type guards when type is uncertain
- Zod for all DTO validation (shared between frontend and backend via `packages/shared`)

### Multi-tenancy (every DB query)

- Every Prisma query must include `where: { tenantId: ctx.tenantId, ... }`
- Every table has a `tenant_id` column — never omit it from a new model
- Never suggest a query that could return records from multiple tenants
- Treat application scoping as defense in depth: database isolation comes from the sealed #21 transaction-scoped RLS implementation in `.ai/ARCHITECTURE_FOUNDATION.md` — every protected operation must run through the tenant-scoped transaction client.

### RBAC (every API endpoint)

- Every NestJS controller method needs `@Permissions('module.resource.action')`
- Every UI privileged action needs `<ProtectedComponent permission="...">`
- Register new permissions in `packages/shared/src/permissions/registry.ts`

### Change history (every mutation)

- Every entity-mutation controller method needs `@TrackChanges('EntityType')` + `@UseInterceptors(ChangeHistoryInterceptor)`

### Module boundaries

- Modules NEVER import from each other directly
- Cross-module state changes via domain events; narrow read-only/provider capabilities only through an approved common integration port
- Run `pnpm architecture:check` before accepting API changes. The legacy in-process emitter is not approved for critical business effects — use the sealed #17 transactional outbox.
- Extension manifests must validate `apiVersion` through `@unerp/service-kit`'s published compatibility range; do not add a public contract or retire a supported version without updating `docs/API_VERSIONING_POLICY.md` and its focused tests.

### UI/UX (all frontend suggestions)

- Use `@unerp/ui` components from `packages/ui/` — not custom or third-party components
- Use `.ui-*` utility classes for layout/forms (defined in `globals.css`; `.frappe-*` names are deprecated aliases)
- Use CSS variables from `design-tokens.css` — no hardcoded hex colors or pixel values
- No inline styles on layout elements
- Every page needs breadcrumbs registered in `SEGMENT_NAMES` in `apps/web/app/(dashboard)/layout.tsx`
- Handle all four states in every data view: loading, empty, error, success

### Logging & secrets

- Never suggest `console.log` — use `@unerp/shared/logger`
- Never put secrets, API keys, or credentials in code — use env vars from `.env`

### Database migrations

- `db:push` is disabled. Apply recorded migration history with `pnpm db:deploy`; drift must fail closed and be reconciled through an approved expand/backfill/contract plan.
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

All modules are tracked in `.ai/MODULE_REGISTRY.md`. Before suggesting a new service, entity, or page, check if the module is already ACTIVE. If it is, suggest extending it rather than creating a parallel implementation.
