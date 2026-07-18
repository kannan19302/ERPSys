# Runbook — Database Backup, Restore-Verification & Recovery (Track H.3)

> Owner: platform/devops. Created 2026-07-18 (Phase F cycle 8).
> Tooling: `scripts/backup-database.mjs`, `scripts/verify-backup.mjs`.
> Policy: **a backup that has never been restored is not a backup** — every
> backup cadence includes a verification cadence.

## 1. Take a backup

```bash
node scripts/backup-database.mjs --label pre-migration   # or scheduled/adhoc
```

- Runs `pg_dump -Fc` inside the `unerp-postgres` container (no host pg tools
  needed), writes `var/backups/<db>_<timestamp>_<label>.dump` + `.sha256`.
- Retention: newest 14 dumps kept (override `--keep <n>`).
- Flags: `--database`, `--user`, `--container` for non-default targets.

## 2. Verify it restores (the drill)

```bash
node scripts/verify-backup.mjs            # newest backup
node scripts/verify-backup.mjs --file var/backups/<name>.dump
```

Restores into a disposable `unerp_restore_verify` DB, then proves: pg_restore
success, table count equality, **exact per-table row counts**, and
`_prisma_migrations` equality vs the live source. Drops the disposable DB in
all paths. Exit 0 + `RESTORE VERIFIED` = pass.

**Cadence:** run the verify after every backup in CI/cron once Actions is
restored (I.4); minimum quarterly drill per roadmap § 11c.

## 3. Real recovery (data loss on the primary)

1. STOP the API (`docker stop unerp-dev` or scale workers to 0) — no writes
   during recovery.
2. Choose the artifact: newest verified `.dump` (check `.sha256` first:
   `sha256sum -c <file>.sha256`).
3. Restore into a NEW database, verify, then switch:
   ```bash
   docker exec unerp-postgres psql -U unerp -d postgres -c 'CREATE DATABASE unerp_recovered'
   docker cp var/backups/<name>.dump unerp-postgres:/tmp/r.dump
   docker exec unerp-postgres pg_restore -U unerp -d unerp_recovered --no-owner --role unerp /tmp/r.dump
   node scripts/verify-backup.mjs --file var/backups/<name>.dump --database unerp_recovered
   ```
4. Repoint `DATABASE_URL` at the recovered DB (env change + restart), keep the
   damaged DB for forensics (rename, do not drop).
5. Record the incident + drill timings in `.ai/CHANGELOG.md`.

## 4. RPO / RTO (current single-node dev topology)

| Metric | Target | Basis (2026-07-18 drill) |
|---|---|---|
| RPO | ≤ 24h (scheduled daily backup) — tighten with WAL archiving at production topology | backup runtime 1.9s @ 1.6 MB |
| RTO | ≤ 30 min manual | restore+verify of full DB took 20.3s at seed scale; budget scales with data volume |

## 5. PITR (point-in-time recovery) — production requirement, not yet wired

Logical dumps give restore points, not PITR. Before production launch:
`wal_level=replica`, `archive_mode=on` + WAL shipping to object storage
(MinIO/S3), and `restore_command`-based recovery to a timestamp. Tracked as
the remaining H.3 sub-item; quarterly drill then includes a PITR exercise.

## 6. Scope notes

- These scripts protect the **database**. Uploaded files (MinIO) and Redis
  (transient queues) have separate stories: MinIO bucket replication is a
  Track F storage item; Redis is intentionally rebuildable (transport, not
  source of truth — roadmap B.5 doctrine).
- Backups live under gitignored `var/backups/` locally; production artifacts
  must ship off-host (object storage with lifecycle rules).
