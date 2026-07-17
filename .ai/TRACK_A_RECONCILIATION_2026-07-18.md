# Track A (#19) — Migration Reconciliation Report & Mapping Ledger

> Produced by DEV cycle 2 (Phase F), 2026-07-18. Roadmap:
> `.ai/FOUNDATION_HARDENING_ROADMAP.md` § 6. Status: **A.1 + A.2 complete;
> A.3/A.4 PREPARED — ⚠️ AWAITING named DB-owner + code-owner sign-off.**
> Nothing in this report has been applied to any non-disposable database.

## 1. Headline findings (they change the plan's risk profile)

1. **The dev DB has ZERO drift from the recorded migration history.**
   `prisma migrate diff --from-url <dev DB> --to-migrations` → *"This is an
   empty migration."* All 128 recorded migrations are applied and match
   exactly. The roadmap § 2.1's "shared dev DB diverges from the Prisma
   schema" is real but mislocated: the divergence is **migration history vs
   `schema.prisma`** — schema edits (mostly `@map` naming-convention work)
   were made without ever generating a migration. There is no second,
   "drifted-clone" DB shape to preserve: dev DB ≡ migrations.
2. **Every affected table is empty.** The 23 tables touched by the
   reconciliation hold **0 rows** (dev DB total: 333 rows across 655 tables —
   seed-level data only; largest table `_prisma_migrations` at 128). The
   reconciliation is therefore **provably data-loss-free in this
   environment** whatever shape it takes. Rename-based SQL remains the right
   candidate (any other environment restored from history would behave
   identically, and it keeps the ledger honest), but the risk class drops
   from "destructive on live data" to "empty-table DDL".

## 2. A.1 — Baselines & backups (complete)

Local, gitignored `var/track-a-baselines/` (backups never in git):

| File | Size | SHA-256 |
|---|---|---|
| `unerp_dev.schema.sql` (schema-only dump) | 1,018,920 B | `0143588ed67c579b6bba56ceda083c809b87084929079d1604b60e9e9d6cc3b7` |
| `unerp_dev_track_a.dump` (pg_dump -Fc full) | 1,677,654 B | `557ae0991de7096a1d991ee12da50d359622e7e73895712ff767b044e665a631` |
| `row-counts.txt` (exact per-table counts, 655 tables) | 17,343 B | — |

Row-count baseline summary: **655 public tables, 333 total rows**. Only a
single backup pair is needed (not the roadmap's two) because finding 1 proves
the migration-history shape and the dev DB shape are the same shape.

## 3. A.2 — Reconciliation classification (complete)

Source: `pnpm migration:reconciliation:report` against disposable
`unerp_shadow_track_a` (created and dropped this cycle) + raw
`migrate diff --script` output, committed as
[`TRACK_A_CANDIDATE_RECONCILIATION_2026-07-18.sql`](TRACK_A_CANDIDATE_RECONCILIATION_2026-07-18.sql)
(1,341 lines — REVIEW ARTIFACT, DO NOT APPLY).

Totals: **134 rename candidates · 9 same-name type conversions · 3 unmatched**
across 23 tables.

| Class | Count | Disposition |
|---|---|---|
| (a) Proven renames — snake_case ↔ camelCase pairs (e.g. `inventory_cost_layers.qty_received → qtyReceived`, `cross_dock_orders.completedAt → completed_at`) | 125 | Hand-edit to `ALTER TABLE … RENAME COLUMN` in the A.4 candidate migration. Mechanical, 1:1, same type. |
| (a′) Same-name **text→enum conversions**: `catch_weight_readings.variance_status` (→`CatchWeightVariance`), `item_barcodes.symbology`, `label_templates.template_type`, `landed_cost_vouchers.status`, `product_recalls.recall_class/status/action_required`, `recall_disposal_records.action_type`, `packaging_specs.level` | 9 | DROP+ADD as generated is acceptable (tables empty); if any environment ever has rows, convert via `USING (col::text::<Enum>)` instead. |
| (b) Additive | `connect_meetings.lobby`, `user_presence.clear_at` | Plain `ADD COLUMN`, nullable/default — no risk. |
| (c) The one true drop — `landed_cost_receipt_links.updatedAt` | 1 | **A.3 decision (sign-off required):** roadmap-proposed retention = rename to `legacy_updated_at`, expose read-only nullable. Given the table is empty, plain drop is equally lossless **here**; the rename retains the roadmap's cross-environment guarantee. Recommended: follow the roadmap (rename). |

Full machine-readable candidate list: `var/track-a-baselines/reconciliation-report.txt`
(regenerable any time with `MIGRATION_SHADOW_DATABASE_URL=… pnpm migration:reconciliation:report`).

## 4. A.4 mapping ledger (draft — sign-off gate)

Because 125/134 are mechanical case-convention renames with identical types,
the ledger is expressed as a rule plus exceptions rather than 134 rows:

| # | Mapping | Transformation | Null/default | Validation query | Owner |
|---|---|---|---|---|---|
| L-1 | All 125 case-convention pairs in the CANDIDATE list | `RENAME COLUMN` only (no type change) | unchanged | `information_schema.columns` name-set equality per table, before/after row-count equality | ⚠️ unsigned |
| L-2 | 9 text→enum columns (list above) | `DROP+ADD` (empty tables) or `USING` cast | NOT NULL per schema | enum labels ⊇ distinct old values (vacuous: 0 rows) | ⚠️ unsigned |
| L-3 | `landed_cost_receipt_links.updatedAt` → `legacy_updated_at` | `RENAME` + make nullable, read-only | nullable | column exists, 0 rows affected | ⚠️ unsigned |
| L-4 | `connect_meetings.lobby`, `user_presence.clear_at` | `ADD COLUMN` | per schema default | column exists | ⚠️ unsigned |

## 5. What sign-off unlocks (the A.4→A.6 execution plan, next Track A cycle)

1. Generate `--create-only` migration on a disposable DB; hand-edit per L-1/L-3.
2. A.5: apply to a fresh clone restored from `unerp_dev_track_a.dump`; verify
   row counts (all 0 in affected tables), FK integrity, smoke tests.
3. `pnpm db:deploy` on dev; confirm `migrate diff --to-schema-datamodel` is
   **empty** both ways.
4. A.6: CI gates — fresh replay + empty-schema-diff (`--check` mode of the
   report script already fails on unmatched ops).

**Sign-off required from:** named DB owner + code owner (roadmap § 13).
Record approval as a dated line in this file + CHANGELOG before any SQL is
generated into `packages/database/prisma/migrations/`.

## 6. Approvals (append-only)

- _none yet — ⚠️ AWAITING SIGN-OFF_
