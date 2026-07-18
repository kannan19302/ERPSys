# Implementation Plan — current DEV cycle

> Overwritten exactly ONCE at cycle start; mid-cycle changes = dated addenda.

## Cycle

- **Cycle #:** 6
- **Phase:** F — Foundation
- **Date:** 2026-07-18
- **Agent/session:** fable-5 (claim: `foundation-track-g8`); autonomous run, iteration 3/10

## Scope & rationale

**Track G.8 — money-type audit + Float schema lint** (roadmap § 11b).
**Duplicate-check:** no schema-lint script exists in `scripts/` (checked:
check-module-boundaries, check-migration-discipline, check-foundation-
readiness, report-migration-reconciliation, repair-workspace-links,
generate-env-example, scaffold/claim/feature tooling); no Float policy
anywhere.

**Audit result (5 Float columns in schema.prisma):**
- `VendorScorecard.averageLeadTimeDays`, `.qualityScore` — analytic metrics →
  Float acceptable.
- `ExpenseItem.ocrConfidence` — 0–1 confidence score → Float acceptable.
- **`WebOrder.subtotal`, `WebOrder.total` — MONEY as Float → violation.**
  Conversion to `Decimal @db.Decimal(18,2)` requires a migration, which is
  frozen while Track A reconciliation is pending (A.1 schema freeze).
  → queued as an explicit follow-up in the Track A execution release; lint
  baselines it so it cannot be forgotten silently (baseline file names it).

## Ordered work items

1. `scripts/check-schema-lints.mjs` — parses `schema.prisma`:
   (a) **no new `Float` fields** (baseline = the 5 above, in
   `scripts/schema-lint-baseline.json`); (b) any Float (baselined or not)
   whose name matches money/qty patterns is listed as a tracked violation and
   only tolerated while in the baseline. Exit 1 on any non-baselined Float.
2. Wire into CI (before typechecks) and into `pnpm migration:discipline`'s
   path (script chaining in root package.json: `schema:lint`).
3. Proof: deliberate `Float` addition → red; revert → green.
4. Record + ship: CHANGELOG, Ledger 5 → 6, roadmap G.8 status (audit done,
   lint live, WebOrder conversion queued behind Track A), board rows, lock,
   `main`.

## Acceptance criteria

- Lint green at HEAD; red on a deliberate new Float (proof run captured).
- Baseline names the 2 money-Float columns as "queued for conversion".
- CI + root script wired; no schema/migration changes this cycle.

## Gate tier & rollback note

- **FAST** — tooling + docs only. Rollback: remove one CI line + script files.

## Addenda (dated, append-only)

—
