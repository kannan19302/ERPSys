# Implementation Plan — current DEV cycle

> Overwritten exactly ONCE at cycle start; mid-cycle changes = dated addenda.

## Cycle

- **Cycle #:** 14 (parallel slice — Track C alongside fable-5's Track B)
- **Phase:** F — Foundation
- **Date:** 2026-07-18
- **Agent/session:** claude-code (claim: `foundation-track-c`)

## Scope & rationale

**Track C (#21) — transaction-scoped RLS proof** (roadmap § 8). Track A is closed
(reconciled dev DB, 0 drift); B is in progress (fable-5, outbox schema). C is
parallel-safe with B after A — delivering the non-bypass role, per-table RLS policies,
tenant unit-of-work hardening, and the two-tenant CI proof.

**Duplicate-check:** no `unerp_api` role exists in any migration; the existing RLS
migrations cover only 12 + 6 + 1 = 19 tables of ~650+ tenant-scoped tables; no
`DATABASE_OWNER_URL` in env schema or docker-compose. No overlap with Track A (reconciliation)
or Track B (outbox schema).

## Ordered work items

1. **C.1 Migration — create `unerp_api` app role** (`20260718100000_create_unerp_api_role`):
   `CREATE ROLE unerp_api WITH LOGIN NOSUPERUSER NOBYPASSRLS NOINHERIT PASSWORD 'unerp_api_password'` +
   schema/table/sequence grants + default privileges.
2. **C.3 Migration — RLS on ALL tenant-scoped tables** (`20260718101000_rls_all_tables`):
   DO block iterating `information_schema.columns` for every table with `tenant_id`, enables RLS +
   FORCE RLS + creates `tenant_isolation_<table>` policy. Uses `current_tenant_id()` function
   (already exists from prior migration).
3. **C.1 Env schema update** — add `DATABASE_OWNER_URL` (required, for migrations) to
   `env.schema.ts`; regenerate `.env.example`.
4. **C.1 Docker/dev update** — add `DATABASE_OWNER_URL` to `docker-compose.dev.yml`; update
   `docker-entrypoint.sh` to use `DATABASE_OWNER_URL` for migration commands.
5. **C.2 Tenant UoW hardening** — update `tenant.interceptor.ts` to set session-level
   `app.current_tenant_id` as fallback; simplify `packages/database/src/index.ts` to remove
   `RLS_PROTECTED_MODELS` gate now that ALL tables have RLS.
6. **C.4 Two-tenant proof tests** — rewrite `tenant-rls-integration.test.ts` with full:
   tenant-A can't read/write tenant-B data, spoofed tenant_id in insert fails, no-context returns
   no rows, concurrent A/B isolation, raw SQL isolation.
7. **C.4 CI job** — add `rls-integration` job to `ci.yml` with PostgreSQL service, role setup,
   migration deploy, and two-tenant proof suite.

## Acceptance criteria

- `unerp_api` role exists with NOSUPERUSER NOBYPASSRLS NOINHERIT.
- Every table with a `tenant_id` column has RLS enabled + FORCE'd + has a `tenant_isolation` policy.
- `DATABASE_OWNER_URL` is validated in env schema; migrations run with owner creds.
- Integration tests prove: A-only reads/writes, cross-tenant blocked, no-context empty,
  concurrent isolation, raw SQL safety. All green in CI with the non-bypass role.

## Gate tier & rollback note

- **MILESTONE** (schema + DB role changes): full migration replay proof, CI RLS job.
- **Rollback:** `DROP ROLE IF EXISTS unerp_api;` + drop the RLS policy migration. App still works
  because `DATABASE_URL` can keep using the owner role until the switch.

## Addenda (dated, append-only)

—
