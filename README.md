# Universal ERP System (UniERP)

A fully-packed, composable, industry-agnostic Enterprise Resource Planning system built with modern web technologies and developed using AI-Agent Driven Development (AADD).

## Tech Stack

- **Frontend**: Next.js 15 (App Router)
- **Backend**: NestJS (TypeScript)
- **Database**: PostgreSQL 16 + Prisma ORM
- **Cache**: Redis + BullMQ
- **Monorepo**: Turborepo + pnpm

## Getting Started

### Prerequisites

- Node.js >= 22
- pnpm >= 9
- PostgreSQL 16
- Redis 7
- Docker (optional, for local services)

### Setup

```bash
# Clone the repository
git clone <repo-url>
cd ERPSys

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local

# Start local services (PostgreSQL + Redis)
docker compose up -d

# Run database migrations
pnpm db:migrate

# Seed database
pnpm db:seed

# Start development
pnpm dev
```

### Available Scripts

| Script | Description |
|:---|:---|
| `pnpm dev` | Start all apps in development mode |
| `pnpm dev:web` | Start only the web frontend |
| `pnpm dev:api` | Start only the API backend |
| `pnpm build` | Build all packages and apps |
| `pnpm test` | Run all tests |
| `pnpm lint` | Lint all packages |
| `pnpm format` | Format all files with Prettier |
| `pnpm db:migrate` | Run database migrations |
| `pnpm db:studio` | Open Prisma Studio |

## Project Structure

```
ERPSys/
├── AGENTS.md              # AI agent instructions
├── .ai/                   # Extended AI context
├── apps/
│   ├── web/               # Next.js frontend
│   └── api/               # NestJS backend
├── packages/
│   ├── ui/                # Design system
│   ├── database/          # Prisma schema
│   ├── shared/            # Shared types & utils
│   ├── auth/              # Authentication
│   └── config/            # Shared configs
└── docker/                # Docker configs
```

## AI-Agent Development

This project uses `AGENTS.md` and the `.ai/` directory to provide consistent instructions to any AI coding agent. Read [AGENTS.md](./AGENTS.md) for details.

## License

Proprietary — All rights reserved.
