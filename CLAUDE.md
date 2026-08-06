# UniERP — Agent Instructions

> **You are working on a production enterprise ERP platform intended to run real businesses
> for a decade. Not a prototype. Someone's payroll runs on what you ship.**

## Read these before your first edit. All of them are in `docs/ai/`.

| File                                                             | What it governs                                                   |
| :--------------------------------------------------------------- | :---------------------------------------------------------------- |
| **[docs/ai/README.md](docs/ai/README.md)**                       | **THE LAW — read this first**                                     |
| [docs/ai/PRD.md](docs/ai/PRD.md)                                 | The Goal, scope, personas, requirements                           |
| [docs/ai/TRD.md](docs/ai/TRD.md)                                 | Tech stack, hosting, CI/CD, the open-source mandate               |
| [docs/ai/APP_FLOW.md](docs/ai/APP_FLOW.md)                       | User journeys, screens, actions, states                           |
| [docs/ai/UI_UX_BRIEF.md](docs/ai/UI_UX_BRIEF.md)                 | Colour, type, spacing, motion, a11y                               |
| [docs/ai/BACKEND_SCHEMA.md](docs/ai/BACKEND_SCHEMA.md)           | Data model, auth, tenancy, encryption                             |
| [docs/ai/IMPLEMENTATION_PLAN.md](docs/ai/IMPLEMENTATION_PLAN.md) | Build order and the agent workflow                                |
| [docs/ai/ARCHITECTURE_REVIEW.md](docs/ai/ARCHITECTURE_REVIEW.md) | Honest state of the system + remediation                          |
| [docs/ai/CODE_STANDARDS.md](docs/ai/CODE_STANDARDS.md)           | **Conduct, code quality, maintainability — the review checklist** |
| [docs/ai/CHANGELOG.md](docs/ai/CHANGELOG.md)                     | The one log — you append to it every time                         |

## The rules that get violated most often

1. **NEVER create a new file in `docs/ai/`.** It holds exactly ten files, for the entire life
   of the project. Your notes, plans, and summaries go _inside_ an existing master file or
   nowhere. Extra files are deleted without review.
2. **NEVER overwrite or regenerate a master document.** Amend surgically. These are one file
   each, forever — even if the Goal takes years.
3. **NEVER suppress a check to make it pass.** No `@ts-nocheck`, `@ts-ignore`,
   `eslint-disable`, `continue-on-error`, `|| true`, `--no-verify`. A failing check means the
   code is wrong, not the check. This is treated as a production incident.
4. **ALWAYS build end-to-end** in this order: Model → Database → API → Auth → UI → Test.
   A UI without the migration and endpoint behind it is a mock, not a feature.
5. **ALWAYS append one line to `docs/ai/CHANGELOG.md`.** No exceptions for small changes.
6. **ALWAYS run `pnpm verify` before pushing.** It runs the same gates CI runs.
7. **ALWAYS self-review against `docs/ai/CODE_STANDARDS.md` § 9** before you say you are done.

## Non-negotiables on every change

- Every table has `tenantId` + an RLS policy + a passing two-tenant isolation test
- Every endpoint has `@Permissions('module.resource.action')` and Zod validation
- Money is `Decimal(19,4)` — never `Float`
- No cross-module imports — cross-module facts go through the transactional outbox
- No hardcoded hex colours or pixel values — design tokens only
- No hand-rolled `<table>` — use the shared `DataTable`
- No secrets, credentials, or real customer data in the repo
- No one-off scripts, temp files, or debug artifacts left behind

## The two agents

- **`feature-architect`** — builds new capability and scales the platform (the DEV flow)
- **`security-sentinel`** — finds and fixes bugs, vulnerabilities, and decay (the QA flow)

Definitions: `.claude/agents/`. They are written vendor-neutrally — follow them whichever tool
you are.

## Current priority

**Phase 0 is ~97% done, and this section said otherwise for two days.** It read "the platform
scores 5.4/10 and 100% of application source is currently `@ts-nocheck`" — the 2026-07-30
assessment, still being handed to every agent as its standing instruction after the numbers it
quotes had reached zero. Read `docs/PLATFORM_ARCHITECTURE.md` § 14 for the measured state, not
this paragraph, and amend this paragraph when it drifts again.

Where the foundation actually stands: `@ts-nocheck` 0, unguarded routes 0, `Float` money 0, RLS
verified on 1,780 tables over a `NOBYPASSRLS` role, `pnpm verify` 15/15 with nothing skipped.
What is genuinely still owed is presentational — 309 hardcoded colours and 2,315 hardcoded pixel
declarations, neither of which can corrupt data or bypass authorisation — plus one reviewed raw-SQL
exception.

**So new feature work is no longer blocked by Phase 0.** Two things do still block a clean
push, and both are recorded in § 14.2: the `Supply chain` gate is red (1 critical, `vitest`
< 3.2.6, and 21 high), and the Flutter `Analyze` job needs `dart format`. Neither is a reason to
suppress a check — that rule has no exceptions and none of this changes it.
