# UniERP Operations Runbook

Operational reference for deploying and running the UniERP platform (API + Web)
in production/staging.

## Services

| Service | Port | Image | Health |
| --- | --- | --- | --- |
| API (NestJS) | 3001 | `apps/api/Dockerfile` | `GET /health` (liveness), `GET /api/v1/ready` (readiness) |
| Web (Next.js) | 3000 | `apps/web/Dockerfile` | `GET /` |
| PostgreSQL 16 | 5432 | `postgres:16-alpine` | `pg_isready` |
| Redis 7 | 6379 | `redis:7-alpine` | `redis-cli ping` |

## Required secrets / environment

Set via your orchestrator's secret store (never bake into images). See
`.env.example` for the full list. Minimum for production:

- `DATABASE_URL` — Postgres connection string
- `REDIS_URL` — Redis connection string (queues + readiness probe)
- `NEXTAUTH_SECRET` — 32+ random bytes (auth/session signing)
- `PII_ENCRYPTION_KEY` — 32-byte hex (field-level encryption)
- `NEXTAUTH_URL`, `NEXT_PUBLIC_API_URL` — public URLs
- Optional: `SENTRY_DSN` (error tracking), `OTEL_EXPORTER_OTLP_ENDPOINT` (tracing)

## Deploy

```bash
# Build + run the full stack (reference / staging)
docker compose -f deploy/docker-compose.prod.yml up -d --build

# Apply database migrations (run once per release, before traffic)
pnpm --filter @unerp/database exec prisma migrate deploy
```

CI builds the same images; production deploy is gated on `main` via a GitHub
environment with the secrets above.

## Health checks & probes

- **Liveness**: `GET /health` → 200 means the process is up. Wire to k8s
  `livenessProbe`.
- **Readiness**: `GET /api/v1/ready` → 200 only when Postgres and Redis are
  reachable; returns **503** with a per-dependency breakdown otherwise. Wire to
  k8s `readinessProbe` / load-balancer health.

## Observability

- **Logs**: structured JSON (pino); every request carries `requestId`
  (`x-request-id`). Filter audit events with `action` + `entityType`.
- **Metrics**: Prometheus at `GET /metrics` (`http_requests_total`,
  `http_request_duration_seconds`).
- **Tracing**: OpenTelemetry — set `OTEL_EXPORTER_OTLP_ENDPOINT` to enable.
- **Errors**: Sentry — set `SENTRY_DSN` to enable.

## Common incidents

| Symptom | Check | Action |
| --- | --- | --- |
| `/ready` returns 503 | response body `checks.database` / `checks.redis` | restart the down dependency; verify `DATABASE_URL` / `REDIS_URL` |
| 5xx spike | logs by `requestId`, Sentry, `/metrics` | roll back last deploy; inspect error envelope `code` |
| Migration drift | `prisma migrate status` | run `prisma migrate deploy`; never edit applied migrations |
| Rate-limit 429s | throttler config in `app.module.ts` | adjust limits or scale out |

## Rollback

Images are tagged per commit. Re-deploy the previous tag. Migrations are
forward-only — design them to be backward-compatible so the prior image keeps
working during a rollback.
