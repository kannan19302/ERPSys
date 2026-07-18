# Implementation Plan — current DEV cycle

> Overwritten exactly ONCE at cycle start; mid-cycle changes = dated addenda.

## Cycle

- **Cycle #:** 11
- **Phase:** F — Foundation
- **Date:** 2026-07-18
- **Agent/session:** fable-5 (claim: `foundation-track-h4`); autonomous run, iteration 9/10

## Scope & rationale

**Track H.4 — retention policy per data class** (roadmap § 11c): no retention
matrix; no automated enforcement.

**Duplicate-check:** `gdpr.service.ts` has tenant-configurable
`retentionDays` records (a per-tenant policy CRUD) but no *platform* matrix,
no enforcement job, and no coverage of the operational/log classes
(AuditLog, ChangeHistory, Notification, WebhookDeliveryLog, UserSession,
BackgroundJob — verified present in schema). No @nestjs/schedule; BullMQ
exists but a standalone script is the leanest schedulable unit (cron/CI/Task
Scheduler) and needs no API surface.

## Ordered work items

1. `scripts/retention-matrix.json` — the matrix (single source): data class →
   Prisma model, timestamp column, retention days, mode (hard-delete),
   condition notes (e.g. only `read` notifications; only terminal
   BackgroundJob states; only expired/revoked sessions), legal-basis note.
   Business documents are explicitly OUT (soft-delete + audit per G.4;
   erasure via H.1).
2. `scripts/enforce-retention.mjs` — loads the matrix, `--dry-run` (default:
   reports counts, deletes nothing) and `--apply`; per-class `deleteMany`
   with cutoff + class-specific conditions; JSON summary; audited via
   console + exit codes. Uses the generated @prisma/client directly
   (privileged maintenance path per roadmap C.3 doctrine, documented).
3. `docs/DATA_RETENTION_MATRIX.md` — human matrix + how enforcement runs +
   interplay with the tenant-level GDPR retention records + F-track
   partitioning note.
4. Verify: `--dry-run` against the dev DB (read-only counts); vitest not
   needed for a script exercised end-to-end — proof = dry-run output.
5. Record + ship: CHANGELOG, Ledger 10 → 11, roadmap H.4 status, board,
   lock, `main`.

## Acceptance criteria

- Matrix covers the 6 platform classes with explicit conditions; dry-run
  executes against dev DB and reports per-class candidates; `--apply`
  deletes only matrix-matched rows (not run against dev data this cycle —
  dev DB is seed-only; dry-run is the proof).
- No schema changes.

## Gate tier & rollback note

- **FAST** — additive script + docs; default dry-run.
- **Rollback:** delete script + doc.

## Addenda (dated, append-only)

—
