# Tech Stack — Universal ERP System

> Every technology choice is documented here with its rationale.
> AI agents MUST NOT add new dependencies without updating this file.

---

## Core Stack

| Category | Technology | Version | Rationale |
|:---|:---|:---|:---|
| **Language** | TypeScript | ^5.7 | End-to-end type safety, strict mode required |
| **Runtime** | Node.js | ^22 LTS | Latest LTS with native TypeScript support |
| **Package Manager** | pnpm | ^9 | Strict dependencies, disk-efficient, fast |
| **Monorepo** | Turborepo | ^2 | Incremental builds, remote caching, pipeline orchestration |

---

## Frontend

| Category | Technology | Version | Rationale |
|:---|:---|:---|:---|
| **Framework** | Next.js | ^15 | App Router, RSC, SSR, built-in API routes |
| **UI Primitives** | Radix UI | latest | Accessible, unstyled, composable primitives |
| **Styling** | Vanilla CSS + CSS Modules | — | Full control, no build-time dependencies, CSS-native features |
| **Icons** | Lucide React | latest | Tree-shakeable, consistent, MIT licensed |
| **Charts** | Recharts | latest | React-native, composable, responsive charts |
| **Forms** | React Hook Form | ^7 | Performant, minimal re-renders, Zod integration |
| **Data Fetching** | TanStack Query + tRPC | latest | Type-safe, cached, declarative server state |
| **Tables** | TanStack Table | latest | Headless, sortable, filterable, paginated |
| **Date Handling** | date-fns | latest | Tree-shakeable, immutable, TypeScript-first |
| **Toasts** | Sonner | latest | Simple, beautiful, accessible notifications |

---

## Backend

| Category | Technology | Version | Rationale |
|:---|:---|:---|:---|
| **Framework** | NestJS | ^11 | Modular architecture, DI, guards, pipes, enterprise-ready |
| **Validation** | Zod | ^3 | Shared validation schemas between frontend & backend |
| **Events** | @nestjs/event-emitter | latest | In-process domain events for module communication |
| **Queues** | BullMQ | latest | Redis-backed job queues for async processing |
| **File Upload** | Multer (via NestJS) | — | Streaming file uploads with size/type validation |
| **PDF Generation** | @react-pdf/renderer | latest | React-based PDF templates for invoices/reports |
| **Email** | Nodemailer + React Email | latest | Templated transactional emails |
| **Scheduling** | @nestjs/schedule | latest | Cron jobs for recurring tasks (reports, cleanups) |
| **WebSockets** | @nestjs/websockets | latest | Real-time updates (notifications, dashboards) |

---

## Database & Storage

| Category | Technology | Version | Rationale |
|:---|:---|:---|:---|
| **Database** | PostgreSQL | ^16 | ACID, JSONB, RLS, window functions, CTEs |
| **ORM** | Prisma | ^6 | Type-safe queries, migrations, schema-as-code |
| **Cache** | Redis | ^7 | Session store, cache layer, BullMQ backend |
| **File Storage** | S3-compatible (MinIO for dev) | — | Document storage, attachments, exports |
| **Search** | PostgreSQL Full-Text Search | — | Good enough for Phase 0-2; Elasticsearch for Phase 3+ |

---

## Authentication & Security

| Category | Technology | Version | Rationale |
|:---|:---|:---|:---|
| **Auth Framework** | Auth.js (NextAuth v5) | ^5 | Multi-provider, JWT/session, edge-compatible |
| **Password Hashing** | bcrypt | latest | Industry standard, configurable work factor |
| **JWT** | jose | latest | Edge-compatible JWT library |
| **Rate Limiting** | @nestjs/throttler | latest | API rate limiting per tenant |
| **Security Headers** | Helmet | latest | OWASP security headers |
| **CORS** | NestJS built-in | — | Configurable origin whitelist |

---

## Testing

| Category | Technology | Version | Rationale |
|:---|:---|:---|:---|
| **Unit/Integration** | Vitest | latest | Fast, ESM-native, Jest-compatible API |
| **E2E** | Playwright | latest | Cross-browser, reliable, built-in assertions |
| **API Testing** | Supertest | latest | HTTP assertion library for NestJS controllers |
| **Mocking** | Vitest built-in + MSW | latest | Service worker-based API mocking |
| **Coverage** | Vitest c8/istanbul | — | 80% minimum coverage target |

---

## DevOps & Tooling

| Category | Technology | Version | Rationale |
|:---|:---|:---|:---|
| **Linting** | ESLint | ^9 (flat config) | Code quality, consistency |
| **Formatting** | Prettier | ^3 | Opinionated formatting, end of style debates |
| **Git Hooks** | Husky + lint-staged | latest | Pre-commit linting and formatting |
| **CI/CD** | GitHub Actions | — | Automated testing, building, deployment |
| **Containerization** | Docker + Docker Compose | — | Reproducible local dev and deployment |
| **Process Manager** | PM2 (production) | latest | Node.js process management, clustering |

---

## Package Naming

All internal packages use the `@unerp/` scope:

| Package | npm Name | Description |
|:---|:---|:---|
| `packages/database` | `@unerp/database` | Prisma client & types |
| `packages/shared` | `@unerp/shared` | Types, validators, utils |
| `packages/ui` | `@unerp/ui` | Design system components |
| `packages/auth` | `@unerp/auth` | Auth providers & RBAC |
| `packages/config` | `@unerp/config` | Shared tool configs |

---

## Adding New Dependencies

Before adding a new dependency, you MUST:

1. **Check if an existing dependency already covers the use case**
2. **Evaluate bundle size impact** (use bundlephobia.com)
3. **Check maintenance status** (last commit, open issues, downloads)
4. **Prefer packages that are**: tree-shakeable, TypeScript-native, well-maintained
5. **Document the rationale** in the commit message
6. **Update this file** with the new dependency

### Forbidden Dependencies

Do NOT add these — we have alternatives:

| Don't Use | Use Instead | Reason |
|:---|:---|:---|
| Moment.js | date-fns | Moment is legacy, not tree-shakeable |
| Lodash (full) | Native JS / lodash-es (specific imports) | Bundle bloat |
| Axios | Native fetch / tRPC | No need for HTTP client library |
| Redux | React Query + React Context | Over-engineered for our use case |
| Tailwind CSS | Vanilla CSS + CSS Modules | Full control, no utility-class lock-in |
| Express | NestJS (built on Express internally) | NestJS provides structure we need |
