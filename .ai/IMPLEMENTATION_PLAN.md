# IMPLEMENTATION_PLAN.md — QA HARDEN Checkpoint (After Cycle 30)

**Date**: 2026-07-21 | **Agent**: Antigravity | **Flow**: QA HARDEN | **Phase**: M

## Scope

Execute mandatory QA HARDEN checkpoint after DEV Cycle 30 per `.ai/AUTOPILOT.md` cadence protocol.

## Step 1: Security & Vulnerability Sweep

- Scan for unmanaged raw SQL (`$queryRawUnsafe`, `$executeRawUnsafe`) across all services.
- Audit input validation on controller endpoints (`@ZodBody`, `@Query`, `@Param`).
- Inspect authentication, RBAC, tenant isolation (RLS), and rate limiting.

## Step 2: File & Root-Cause Fix

- Record any security or reliability findings.
- Fix all issues at root cause with defensive type-safe patterns.
- Verify fixes with targeted unit tests.

## Step 3: Comprehensive Verification

- Run full API test suite (`pnpm --filter @unerp/api test`).
- Run TypeScript strict typechecks (`pnpm --filter @unerp/api typecheck` and `pnpm --filter @unerp/web typecheck`).
- Run architecture boundary guard (`pnpm architecture:check`).

## Step 4: Ledger & Cadence Update

- Log QA HARDEN run in `.ai/MODULE_REGISTRY.md` § Cycle Ledger.
- Set `Next run: DEV` and reset `Cycles until mandatory harden: 10`.
- Append summary to `.ai/CHANGELOG.md`.
- Commit and push clean state to `main`.
