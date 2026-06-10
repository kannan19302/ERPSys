# AGENTS.md — Universal ERP System

> **This file is the master instruction set for all AI coding agents working on this project.**
> Every AI agent (Claude, Gemini, GPT, Copilot, Cursor, Aider, or any future tool) MUST read this file
> and follow its rules throughout the entire development lifecycle.

---

## 🏢 Project Identity

- **Name**: Universal ERP System (UniERP)
- **Mission**: A fully-packed, composable, industry-agnostic Enterprise Resource Planning system
- **Architecture**: Monorepo (Turborepo + pnpm) with composable modules
- **Current Phase**: Phase 0 — Foundation
- **Methodology**: AI-Agent Driven Development (AADD)

---

## 📐 Architecture Summary

This is a **composable, multi-tenant ERP** built on a TypeScript monorepo. The system is organized into:

- **`apps/web`** — Next.js 15 frontend (App Router, Server Components)
- **`apps/api`** — NestJS backend (modular, domain-driven)
- **`packages/database`** — Prisma ORM, PostgreSQL, migrations
- **`packages/ui`** — Shared design system (Radix UI primitives + custom CSS)
- **`packages/shared`** — Shared types, validators (Zod), constants, utilities
- **`packages/auth`** — Authentication (Auth.js) + RBAC
- **`packages/config`** — Shared ESLint, TypeScript, Prettier configs

> 📖 **Full details**: Read [.ai/ARCHITECTURE.md](.ai/ARCHITECTURE.md)

---

## 🛠️ Tech Stack Quick Reference

| Layer | Technology |
|:---|:---|
| Monorepo | Turborepo + pnpm |
| Frontend | Next.js 15 (App Router) |
| Backend | NestJS (TypeScript) |
| Database | PostgreSQL 16 + Prisma ORM |
| Cache/Queue | Redis + BullMQ |
| Auth | Auth.js (NextAuth) |
| Validation | Zod (shared between frontend & backend) |
| UI Primitives | Radix UI + custom CSS design system |
| Testing | Vitest + Playwright |
| Language | TypeScript (strict mode everywhere) |

> 📖 **Full details & rationale**: Read [.ai/TECH_STACK.md](.ai/TECH_STACK.md)

---

## 🚨 Critical Rules (NEVER VIOLATE)

### Code Quality
1. **TypeScript strict mode is mandatory.** Never use `any` type. Use `unknown` + type guards when type is uncertain.
2. **Never bypass ESLint rules.** Fix the code, don't disable the rule. If a rule is genuinely wrong, discuss it first.
3. **Never commit `console.log` statements.** Use the structured logger (`@unerp/shared/logger`).
4. **All business logic MUST have unit tests.** No exceptions. Target 80%+ coverage.

### Architecture
5. **Never import directly between ERP modules.** Modules communicate via domain events only. Read [.ai/ARCHITECTURE.md](.ai/ARCHITECTURE.md) Section 4 (Event-Driven Communication).
6. **Never modify `packages/database/prisma/migrations/` manually.** Always use `pnpm db:migrate` to generate migrations from schema changes.
7. **Every database table MUST include `tenant_id`.** Multi-tenancy is enforced at the data layer via Row-Level Security. Read [.ai/SECURITY.md](.ai/SECURITY.md).
8. **Follow the Module Structure Template exactly.** Every new module must match the pattern in [.ai/ARCHITECTURE.md](.ai/ARCHITECTURE.md) Section 3.

### Dependencies & Security
9. **Never add npm dependencies without documenting rationale** in the commit message and updating [.ai/TECH_STACK.md](.ai/TECH_STACK.md).
10. **Never store secrets in code.** Use environment variables. Reference `.env.example` for the required variables.
11. **Never disable CORS, rate limiting, or security headers** without explicit approval.

### Process
12. **Always update [.ai/MODULE_REGISTRY.md](.ai/MODULE_REGISTRY.md)** when creating or modifying ERP modules.
13. **Always update [.ai/CHANGELOG.md](.ai/CHANGELOG.md)** after completing a unit of work.
14. **Always read the relevant `.ai/prompts/` template** before starting a common task (new module, new entity, new endpoint, new page).

### Dev Environment Startup (MANDATORY BEFORE ANY DEV WORK)
15. **Always start the dev environment before making changes.** This allows the user to manually test each new feature in the browser in parallel.
    - **One-command start**: `.\scripts\dev-start.ps1` (from the project root in PowerShell)
    - This script automatically: starts Docker, runs Postgres + Redis, applies migrations, seeds data, and opens the API + Web dev servers.
    - **Manual steps** (if the script cannot be run):
      1. Start Docker Desktop
      2. `cd docker && docker compose up -d postgres redis`
      3. `pnpm db:migrate` (from project root)
      4. `pnpm db:seed` (from project root)
      5. `pnpm dev:api` (opens NestJS on port 3001)
      6. `pnpm dev:web` (opens Next.js on port 3000)
    - **Default test credentials** (after seeding):
      - URL: `http://localhost:3000`
      - Email: `admin@unerp.dev`
      - Password: `admin123`
16. **Always verify both servers are running** before asking the user to test. Confirm port 3001 (API) and 3000 (Web) are listening.

---


## 📁 Navigation Guide

```
ERPSys/
├── AGENTS.md                    ← YOU ARE HERE
├── .ai/                         ← Extended AI context (architecture, conventions, etc.)
│   ├── ARCHITECTURE.md          ← System design, module patterns, data flow
│   ├── CONVENTIONS.md           ← Naming, file structure, code style rules
│   ├── TECH_STACK.md            ← Technology choices & rationale
│   ├── MODULE_REGISTRY.md       ← Status of every ERP module
│   ├── DATA_MODEL.md            ← Entity relationships & schema design
│   ├── API_STANDARDS.md         ← REST API conventions & endpoint design
│   ├── SECURITY.md              ← Security patterns & multi-tenancy
│   ├── TESTING.md               ← Testing strategy & patterns
│   ├── GLOSSARY.md              ← Domain terminology
│   ├── CHANGELOG.md             ← Agent-maintained change log
│   └── prompts/                 ← Pre-built task templates
├── apps/
│   ├── web/                     ← Next.js 15 frontend
│   └── api/                     ← NestJS backend
├── packages/
│   ├── ui/                      ← Design system
│   ├── database/                ← Prisma schema & migrations
│   ├── shared/                  ← Shared types & validators
│   ├── auth/                    ← Authentication & RBAC
│   └── config/                  ← Shared tool configs
├── tools/                       ← Generators & scripts
└── docker/                      ← Docker configs
```

---

## 🔄 Module Development Workflow

When building a new ERP module, follow these steps in order:

### Step 1: Prepare
1. Read [.ai/prompts/new-module.md](.ai/prompts/new-module.md) for the full template
2. Read [.ai/ARCHITECTURE.md](.ai/ARCHITECTURE.md) Section 3 (Module Structure)
3. Check [.ai/MODULE_REGISTRY.md](.ai/MODULE_REGISTRY.md) for existing modules and dependencies

### Step 2: Database Layer
4. Define Prisma models in `packages/database/prisma/schema.prisma`
5. Follow [.ai/DATA_MODEL.md](.ai/DATA_MODEL.md) for entity design rules
6. Generate migration: `pnpm db:migrate --name <module>_initial`
7. Add seed data in `packages/database/prisma/seed.ts`

### Step 3: Backend (NestJS)
8. Create module directory: `apps/api/src/modules/<module-name>/`
9. Follow the exact structure: `module.ts`, `controller.ts`, `service.ts`, `dto/`, `entities/`, `events/`, `tests/`
10. Implement DTOs with Zod validation (shared via `packages/shared`)
11. Follow [.ai/API_STANDARDS.md](.ai/API_STANDARDS.md) for endpoint design

### Step 4: Frontend (Next.js)
12. Create pages: `apps/web/app/(dashboard)/<module-name>/`
13. Use components from `packages/ui` — never create ad-hoc UI components
14. Follow [.ai/prompts/new-ui-page.md](.ai/prompts/new-ui-page.md) for page templates

### Step 5: Testing
15. Write unit tests for all services: `*.service.spec.ts`
16. Write controller tests: `*.controller.spec.ts`
17. Write E2E tests for critical flows
18. Follow [.ai/TESTING.md](.ai/TESTING.md) for patterns

### Step 6: Register
19. Update [.ai/MODULE_REGISTRY.md](.ai/MODULE_REGISTRY.md) with the new module
20. Update [.ai/CHANGELOG.md](.ai/CHANGELOG.md) with what was built
21. Update navigation menus in `apps/web`

---

## 🎯 Current Sprint Context

**Phase**: 1 — Finance, HR & CRM Modules
**Goal**: Build core business modules starting with Finance & Accounting, Human Resources, and CRM
**Status**: In Progress

### Completed
- ✅ Phase 0 — Architecture Design & AI Agent Instruction Framework
- ✅ Phase 0 — Monorepo scaffold & ESLint base configuration
- ✅ Phase 0 — Design system (packages/ui) with theme & component tokens
- ✅ Phase 0 — Multi-tenancy isolation (Prisma extended client + PostgreSQL RLS)
- ✅ Phase 0 — JWT/RBAC security, guards, and NestJS AuthModule
- ✅ Phase 0 — NestJS AdminModule user registry, setting, and roles APIs
- ✅ Phase 0 — Next.js 15 pages (login, registration, dashboard shell, user administration)
- ✅ Phase 0 — Verification (build, lint, Vitest unit tests)

### In Progress
- 🔄 Phase 1 — Finance & Accounting module setup (charts of accounts, billing/invoicing)

### Next
- ⬜ Finance & Accounting module
- ⬜ Human Resources module
- ⬜ CRM module

---

## 📚 Extended Context Files

Before starting any significant work, read the relevant files from `.ai/`:

| Task | Read These Files |
|:---|:---|
| Creating a new module | `ARCHITECTURE.md`, `CONVENTIONS.md`, `prompts/new-module.md` |
| Adding database entities | `DATA_MODEL.md`, `CONVENTIONS.md`, `prompts/new-entity.md` |
| Building API endpoints | `API_STANDARDS.md`, `CONVENTIONS.md`, `prompts/new-api-endpoint.md` |
| Building UI pages | `CONVENTIONS.md`, `prompts/new-ui-page.md` |
| Fixing bugs | `prompts/bugfix.md` |
| Reviewing code | `prompts/review.md`, `SECURITY.md`, `TESTING.md` |
| Understanding the domain | `GLOSSARY.md`, `MODULE_REGISTRY.md` |
