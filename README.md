# UniERP — Universal Enterprise Resource Planning System

A composable, multi-tenant, industry-agnostic ERP system with 33 production-ready modules spanning finance, HR, CRM, manufacturing, healthcare, education, and more — built with modern TypeScript and developed using AI-Agent Driven Development (AADD).

## Tech Stack

| Layer | Technology |
|:---|:---|
| **Frontend** | Next.js 15 (App Router), React 19, TanStack Query, Zustand, Radix UI |
| **Backend** | NestJS 11, BullMQ, Event-Driven Architecture |
| **Database** | PostgreSQL 16, Prisma 6 ORM, Row-Level Security |
| **Cache & Queues** | Redis 7, BullMQ |
| **Auth** | Auth.js (NextAuth v5), RBAC, Multi-Tenancy |
| **Testing** | Vitest, Playwright, Supertest |
| **DevOps** | Docker, GitHub Actions, Turborepo, pnpm |
| **Observability** | Pino (structured logs), Prometheus, OpenTelemetry, Sentry |

## Modules (33)

### Core Business
| Module | Description |
|:---|:---|
| **Finance** | Invoices, payments, GL, bank reconciliation, budgeting, multi-currency |
| **Advanced Finance** | Chart of accounts, journal entries, fixed assets, tax engine, revenue recognition |
| **HR** | Employees, departments, attendance, leave management |
| **Advanced HR** | Payroll, shift scheduling, appraisals, benefits, tax computation |
| **CRM** | Contacts, leads, opportunities, pipelines, web forms, commission tracking |
| **Sales** | Quotations, sales orders, delivery notes, returns, pricing rules |
| **Inventory** | Products, warehouses, stock levels, costing methods (FIFO/LIFO/weighted) |
| **Procurement** | Vendors, purchase orders, RFQs, blanket agreements, contracts |
| **Supply Chain** | Shipments, carriers, routes, demand forecasting |
| **Manufacturing** | BOM, work orders, production plans, routings, MRP |
| **POS** | Terminals, registers, shifts, cash management |
| **Projects** | Project management, timesheets, milestones, budgets, Gantt |

### Platform & Communication
| Module | Description |
|:---|:---|
| **Admin** | Tenants, users, roles, permissions, settings, audit trails |
| **Auth** | Authentication, SSO, MFA, session management |
| **Communication** | Messages, channels, email templates, real-time chat |
| **Notifications** | Multi-channel delivery, preferences, digests, WebSockets |
| **Documents** | File storage (S3), versioning, sharing, AES-256 encryption |
| **Storage** | S3-compatible file management |
| **Workflow** | Workflow engine, approval chains, SLAs, automation rules |
| **Analytics** | Dashboards, reports, KPIs, widgets |
| **Reporting** | Report builder, saved views, scheduled reports |
| **API Platform** | OpenAPI docs, webhooks, OAuth, API keys, rate limiting |
| **Localization** | i18n, RTL support, date/currency formats |
| **PWA** | Offline mode, responsive design, push notifications |
| **SaaS** | Billing, metering, subscription management |
| **DevOps** | CI/CD, monitoring, logging, APM |
| **AI** | AI copilot, intelligent suggestions |

### Industry Extensions
| Module | Description |
|:---|:---|
| **Healthcare** | Patient records, clinical workflows, SMART/FHIR |
| **Education** | Student management, courses, grading, LMS |
| **Real Estate** | Property management, lease accounting |
| **Field Service** | Dispatch, work orders, mobile technician workflows |

### Builder Studio
| Module | Description |
|:---|:---|
| **Builder** | Zero-code form/page/dashboard/workflow builder |
| **Marketplace** | App store for custom modules, vendor portal |

## Architecture

```
ERPSys/
├── apps/
│   ├── api/                 # NestJS backend (port 4000)
│   └── web/                 # Next.js 15 frontend (port 3000)
├── packages/
│   ├── database/            # Prisma schema, migrations, RLS
│   ├── shared/              # Types, Zod validators, constants
│   ├── ui/                  # Design system (Radix + CSS tokens)
│   ├── auth/                # Auth.js + RBAC guards
│   └── config/              # ESLint, TypeScript, Prettier configs
├── docker/                  # Docker Compose (dev services)
├── deploy/                  # Production Docker Compose
├── scripts/                 # Dev tooling (startup, scorecard)
├── .ai/                     # AI agent reference docs
├── AGENTS.md                # AI agent master instructions
└── RUNBOOK.md               # Operations runbook
```

### Key Design Decisions

- **Multi-Tenancy**: Shared database with PostgreSQL Row-Level Security (4-layer isolation: JWT → TenantGuard → Prisma middleware → RLS)
- **Event-Driven**: Modules communicate via domain events (`@nestjs/event-emitter`) — no direct cross-module imports
- **RBAC**: Permission format `<module>.<resource>.<action>` on every endpoint
- **Validation**: Shared Zod schemas used by both frontend and backend
- **Audit Trail**: Every mutation tracked via `@TrackChanges()` decorator

## Getting Started

### Prerequisites

- Node.js >= 22
- pnpm >= 9
- Docker (for PostgreSQL, Redis, MinIO)

### Quick Start

```bash
# Clone and install
git clone <repo-url>
cd ERPSys
pnpm install

# Configure environment
cp .env.example .env.local

# Start project containerized (Recommended)
# Automatically builds code, starts Postgres, Redis, MinIO,
# runs database migrations, and seeds mock data in a single dev container.
.\scripts\docker-start.ps1
```

The containerized startup handles the entire stack. Once started, you can access the apps at:
- **Web App**: http://localhost:3000
- **API Backend**: http://localhost:3001/api/v1
- **Swagger Docs**: http://localhost:3001/swagger
- **MinIO Console**: http://localhost:9001

#### Manual/Docker Setup

If you prefer to run raw commands:
```bash
# Start containerized dev stack
docker compose -f docker-compose.dev.yml up -d --build
```

### Available Scripts

| Script | Description |
|:---|:---|
| `pnpm dev` | Start all apps in development mode |
| `pnpm dev:web` | Start only the web frontend |
| `pnpm dev:api` | Start only the API backend |
| `pnpm docker:up` | Build and start the entire stack as Docker containers |
| `pnpm docker:down` | Stop and tear down all Docker containers |
| `pnpm build` | Build all packages and apps |
| `pnpm test` | Run all tests |
| `pnpm test:coverage` | Run tests with coverage report |
| `pnpm test:e2e` | Run Playwright E2E tests |
| `pnpm lint` | Lint all packages |
| `pnpm format` | Format all files with Prettier |
| `pnpm db:migrate` | Run database migrations |
| `pnpm db:studio` | Open Prisma Studio |
| `pnpm db:seed` | Seed database with sample data |

### Environment Variables

See [`.env.example`](.env.example) for the full list. Key variables:

| Variable | Required | Description |
|:---|:---|:---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `REDIS_URL` | Yes | Redis connection string |
| `NEXTAUTH_SECRET` | Yes | Auth.js secret (32+ random bytes) |
| `NEXTAUTH_URL` | Yes | Frontend URL (`http://localhost:3000`) |
| `PII_ENCRYPTION_KEY` | Yes | 32-byte hex key for PII encryption |
| `API_URL` | Yes | Backend URL (`http://localhost:4000`) |
| `SENTRY_DSN` | No | Sentry error tracking |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | No | OpenTelemetry collector |

## Production Deployment

```bash
docker compose -f deploy/docker-compose.prod.yml up -d --build
pnpm --filter @unerp/database exec prisma migrate deploy
```

See [RUNBOOK.md](RUNBOOK.md) for full operational reference including health checks, observability, and incident response.

| Service | Port | Health Check |
|:---|:---|:---|
| API (NestJS) | 3001 | `GET /health` (liveness), `GET /api/v1/ready` (readiness) |
| Web (Next.js) | 3000 | `GET /` |
| PostgreSQL | 5432 | `pg_isready` |
| Redis | 6379 | `redis-cli ping` |

## API Documentation

Swagger UI is available at `/swagger` when the API server is running.

**Endpoint format**: `/api/v1/<module>/<resource>`

**Response format**:
```json
{
  "statusCode": 200,
  "data": { },
  "meta": { "page": 1, "total": 100 }
}
```

## Quality & Production Readiness

- **Scorecard**: 10/10 across all 33 modules (7-dimension rubric: functionality, validation, tests, security, observability, docs, ops)
- **TypeScript**: Strict mode with `noUncheckedIndexedAccess`
- **Test Coverage**: 80%+ target (Vitest unit, Supertest integration, Playwright E2E)
- **Security**: RBAC on every route, tenant isolation via RLS, AES-256 encryption for PII, audit logging
- **Code Quality**: ESLint 9 (flat config), Prettier, Husky pre-commit hooks, lint-staged

## AI-Agent Development

This project uses AI-Agent Driven Development. All AI agents must follow:

- [AGENTS.md](AGENTS.md) — Master instruction set
- [.ai/](/.ai) — Architecture, conventions, module registry, security, API standards, data model, and testing docs

## License

Proprietary — All rights reserved.
