# Implementation Plan — current DEV cycle

> Overwritten exactly ONCE at cycle start; mid-cycle changes = dated addenda.

## Cycle

- **Cycle #:** 7
- **Phase:** F — Foundation
- **Date:** 2026-07-18
- **Agent/session:** fable-5 (claim: `foundation-track-g2`); autonomous run, iteration 4/10

## Scope & rationale

**Track G.2 — optimistic-locking convention** (roadmap § 11b): ~2 `version Int`
fields across 645 tables; lost-update protection effectively absent; no shared
enforcement helper.

**Duplicate-check:** grep confirms exactly 2 `version Int @default(1)` columns
(schema lines 1481, 14128) and no locking helper in `packages/database/src`
(encryption/tenant-context/tenant-scope only) nor `apps/api/src/common`.

**Scope boundary:** adding `version` columns to existing aggregates is a
migration → blocked by the Track A schema freeze; queued for the post-A
window (like G.8's Decimal conversion). This cycle lands the *mechanical
convention* so it exists platform-wide the moment columns can be added, and
applies to new modules immediately via the scaffolder.

## Ordered work items

1. `packages/database/src/optimistic-locking.ts` — `StaleWriteError` +
   `updateWithVersionGuard(delegate, { id, tenantId, expectedVersion }, data)`:
   single `updateMany` conditioned on `(id, tenantId, version)` with
   `version: { increment: 1 }`; 0 affected rows → distinguish not-found vs
   stale via a follow-up existence probe; typed, delegate-generic.
2. Filter mapping: `StaleWriteError` → 409 `STALE_WRITE` (code already
   reserved in the G.9 `ERROR_CODES` registry) in `AllExceptionsFilter`.
3. Scaffolder: emitted update path uses `updateWithVersionGuard` with an
   `expectedVersion` input (schema template includes `version Int @default(1)`
   for NEW entities — new tables are not blocked by the freeze).
4. Vitest unit tests (mock delegate): success increments; stale → 
   `StaleWriteError`; missing row → not-found path; tenant mismatch behaves
   as not-found (no cross-tenant probe leak).
5. Gates: database pkg tests + build, API typecheck, boundary check.
6. Record + ship: CHANGELOG, Ledger 6 → 7, roadmap G.2 status (convention
   live + backfill queued), board, lock, `main`.

## Acceptance criteria

- Helper exported from `@unerp/database`, tests green.
- Filter returns the contract envelope with code `STALE_WRITE` for stale
  writes (unit-level assertion on mapping).
- Scaffolder output contains version-guarded update + `version` column.
- Existing-aggregate backfill explicitly queued (roadmap note), not silently
  dropped.

## Gate tier & rollback note

- **FAST** — additive helper + one filter case + scaffolder template.
- **Rollback:** delete helper + filter case; scaffolder hunk revert.

## Addenda (dated, append-only)

—
