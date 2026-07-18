# Implementation Plan — current DEV cycle

> Overwritten exactly ONCE at cycle start; mid-cycle changes = dated addenda.

## Cycle

- **Cycle #:** 13
- **Phase:** F — Foundation
- **Date:** 2026-07-18
- **Agent/session:** Antigravity (claim: `foundation-track-a`); cycle 1 of 10 in one go

## Scope & rationale

**Track A (#19) — Migration Reconciliation Execution** (roadmap § 6):
Execute the prepared mapping ledger to resolve migration drift between schema.prisma and migrations. Rename physical columns instead of destructive DROP/ADD to maintain database and migration trust.

**Duplicate-check:** No other agent is currently working on `foundation-track-a`. Dev DB matches migration history but diverges from schema.prisma. Table rows are 0.

## Ordered work items

1. Record approvals in `.ai/TRACK_A_RECONCILIATION_2026-07-18.md` and `CHANGELOG.md` to unlock execution.
2. Generate `--create-only` migration: `pnpm db:migrate -- --create-only --name track_a_reconciliation` (under packages/database).
3. Hand-edit the generated migration to use `RENAME COLUMN` for the 125 proven renames, and type cast using `USING` for text->enum if necessary, and handle `legacy_updated_at` rename for `landed_cost_receipt_links.updatedAt`.
4. Deploy the migration to dev database (`pnpm db:deploy`).
5. Run `pnpm migration:reconciliation:report` with shadow database url to verify zero unmatched and zero candidates (meaning dev DB and schema.prisma are fully synchronized).
6. Verify CI validation gates pass.
7. Record + ship: CHANGELOG, Cycle Ledger 12 -> 13, Collab Board, release lock, push to `main`.

## Acceptance criteria

- `pnpm migration:reconciliation:report` shows 0 rename candidates and 0 unmatched operations.
- `pnpm foundation:check` passes.
- `pnpm architecture:check` passes.
- Scoped typecheck and tests pass.

## Gate tier & rollback note

- **MILESTONE** (risky surface — database schema change).
- **Rollback:** `git restore` the migration directory and run backups if applied (logical schema is tracked in git).

## Addenda (dated, append-only)

—
