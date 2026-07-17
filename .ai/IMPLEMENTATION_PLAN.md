# Implementation Plan — current DEV cycle

> **Working artifact, not a file of record** (AUTOPILOT § Shared bindings #16).
> Overwritten exactly ONCE at the start of each DEV cycle — after selection/claim,
> before any code — then left untouched until the next cycle (mid-cycle scope
> changes are appended as dated addendum lines, never rewrites). Committed with
> the cycle's first commit so all agents can see in-flight intent.
> CHANGELOG.md + MODULE_REGISTRY.md remain the documentation of record.

## Cycle

- **Cycle #:** 2
- **Phase:** F — Foundation (lift gate unmet)
- **Date:** 2026-07-18
- **Agent/session:** fable-5 (claim: `foundation-track-a`)

## Scope & rationale

**Track A — #19 migration trust (ROOT blocker), preparation slice**
(`.ai/FOUNDATION_HARDENING_ROADMAP.md` § 6). Track 0 closed in cycle 1; Track A
is the next item in dependency order and blocks B (#17) and C (#21).

A.3/A.4's reconciling SQL requires **named DB-owner + code-owner sign-off** and
is NEVER auto-applied (roadmap § 13). This cycle therefore delivers everything
up to that gate:

Priority rung: **P-F**. Duplicate-check: `report-migration-reconciliation.mjs`
and `check-migration-discipline.mjs` exist (landed cycle 1); no baselines, no
classification report, and no mapping ledger exist anywhere in `.ai/` — this
cycle produces them. Nothing re-implements existing tooling.

## Ordered work items

1. **A.1 (baselines):** pg_dump backups of the drifted shared dev DB
   (schema + custom-format data dump) into a local `var/track-a-baselines/`
   (gitignored); committed row-count baseline per table in the Track A report.
2. **A.2 (report):** create a disposable shadow DB on the local Postgres;
   run `pnpm migration:reconciliation:report` (migrations → schema.prisma);
   additionally measure real drift: `prisma migrate diff --from-url <dev DB>
   --to-schema-datamodel` and `--from-url --to-migrations`. Classify every
   destructive op as (a) proven rename, (b) additive/backfill, (c) rejected
   unknown.
3. **A.4-prep (mapping ledger draft):** `.ai/TRACK_A_RECONCILIATION_2026-07-18.md`
   with the classification tables, the `landed_cost_receipt_links.updatedAt`
   retention decision (A.3) marked AWAITING SIGN-OFF, and the generated
   candidate SQL saved (NOT applied) for owner review.
4. Record + ship: CHANGELOG entry, Cycle Ledger 1 → 2, roadmap Track A items
   annotated "prepared, awaiting sign-off"; release lock; land on `main`.

## Acceptance criteria / Definition of Done

- Backup files exist locally with recorded sizes/checksums; row-count baseline
  committed.
- Reconciliation report runs green (exit 0) and its full output is classified
  in the committed Track A doc — zero unclassified destructive ops.
- Candidate SQL generated and committed for review; **zero SQL applied to any
  non-disposable database**; dev DB untouched (read-only + dumps only).
- Ledger/CHANGELOG updated in the same commit; tree clean on `main`.

## Gate tier & rollback note

- **Gate tier:** FAST (no schema, API, or UI changes; read-only DB access +
  docs/reports). `migration:discipline` not triggered (no migration files
  added).
- **Rollback:** delete the report/baseline docs; no runtime impact possible —
  nothing is applied to any database except creating/dropping the disposable
  shadow DB (`unerp_shadow_track_a`).

## Addenda (dated, append-only during the cycle)

—
