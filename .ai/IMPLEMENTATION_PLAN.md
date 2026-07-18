# Implementation Plan — current DEV cycle

> Overwritten exactly ONCE at cycle start; mid-cycle changes = dated addenda.

## Cycle

- **Cycle #:** 8
- **Phase:** F — Foundation
- **Date:** 2026-07-18
- **Agent/session:** fable-5 (claim: `foundation-track-h3`); autonomous run, iteration 5/10

## Scope & rationale

**Track H.3 — backup/DR automation** (roadmap § 11c): "`scripts/` has no
backup, restore-verify, or PITR drill; a backup that has never been restored
is not a backup."

**Duplicate-check:** `scripts/` contains no backup/restore tooling (verified
by ls); no `docs/` runbook; Track A cycle 2 took *manual one-off* dumps —
this cycle turns that into repeatable, verified automation.

## Ordered work items

1. `scripts/backup-database.mjs` — pg_dump (custom format) via the
   `unerp-postgres` container (host pg tools not assumed), timestamped into
   `var/backups/`, SHA-256 recorded, retention pruning (keep last N,
   default 14), `--label` support.
2. `scripts/verify-backup.mjs` — restore the newest (or `--file`) backup into
   a disposable `unerp_restore_verify` DB inside the container, then verify:
   pg_restore exit, table count vs source, per-table row-count equality
   (exact, via the same catalog query), `_prisma_migrations` count match;
   drop the disposable DB after. `--json` summary output.
3. Run a full **drill**: backup → verify → record evidence (counts, hashes,
   duration) in the CHANGELOG entry + a runbook.
4. `docs/RUNBOOK_BACKUP_RESTORE.md` — how to back up, verify, restore for
   real (incl. PITR notes + stated RPO/RTO targets for the current
   single-node dev topology, and what changes at production topology).
5. Record + ship: CHANGELOG, Ledger 7 → 8, roadmap H.3 status, board, lock,
   `main`.

## Acceptance criteria

- One command produces a backup; one command proves it restores with equal
  row counts (drill executed this cycle, evidence recorded).
- Retention pruning works (unit-of-work: create fake old files, prune).
- No schema/API changes; dev DB touched read-only + disposable restore DB.

## Gate tier & rollback note

- **FAST** — tooling + docs; the only DB writes hit a disposable database
  created and dropped by the verifier.
- **Rollback:** delete the two scripts + runbook.

## Addenda (dated, append-only)

—
