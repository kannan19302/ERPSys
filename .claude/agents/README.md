# UniERP Subagent Team

Role-based AI subagents for the Universal ERP System. Each agent is context-aware: it loads the current project state (MODULE_REGISTRY.md — including its § Studio Backlog and § Production Readiness & Hardening sections — and CHANGELOG.md) before every session, checks for existing implementations before suggesting new work, and pushes back when the user is wrong.

## Mandatory Tracking Convention — The 3-File System

UniERP tracks all state in exactly 3 files: `.ai/MODULE_REGISTRY.md` (module status + Collab
Board), `.ai/CHANGELOG.md` (append-only history), `.ai/HANDBOOK.md` (architecture/conventions
reference). Every agent below MUST check the Collab Board before starting and update
CHANGELOG.md + MODULE_REGISTRY.md after finishing — every time, no exceptions. Full rule:
[AGENTS.md § Mandatory Tracking Convention](../../AGENTS.md#-mandatory-tracking-convention--the-3-file-system).

## Git Branch & Husky Pre-Check Policy (Mandatory)

1. **Single Branch (`v1.0`) Development**: All active development work occurs directly on branch `v1.0`. Never create side/feature/fix branches. Both `main` and `v1.0` have a strict **Disable Branch Delete Policy** and stay synchronized.
2. **Husky Pre-Checks**: Run pre-commit (`lint-staged`, `foundation:check`, `architecture:check`) and pre-push (`lint`, `typecheck`, `foundation:check`, `architecture:check`) before any push. All code pushed to `origin` must maintain a production-grade repo state. Full rule: [AGENTS.md § Git Branch & Husky Pre-Check Policy](../../AGENTS.md#-git-branch--husky-pre-check-policy-mandatory).

## The three guarantees every agent provides

> **Architecture foundation gate:** Foundation SEALED v1.0 (2026-07-18) — the historical feature freeze is lifted. Every role follows the 8 non-negotiable rules in [`.ai/ARCHITECTURE_FOUNDATION.md`](../../.ai/ARCHITECTURE_FOUNDATION.md); changing a sealed contract requires a documented ADR. API work must run `pnpm architecture:check`; policy/agent/gate edits must also run `pnpm foundation:check`. Extension work must honor the executable `apiVersion` compatibility range enforced by `@unerp/service-kit` per [`docs/API_VERSIONING_POLICY.md`](../../docs/API_VERSIONING_POLICY.md).

1. **Context-first**: reads MODULE_REGISTRY.md (all sections) and CHANGELOG.md before every session
2. **Duplicate check**: verifies a feature doesn't already exist before building or speccing it
3. **Pushback**: corrects the user when wrong — never blindly agrees

## PM Gate — auto-triggered on feature requests

When you suggest any new functionality, the product-manager agent must run first. It checks MODULE_REGISTRY.md and the codebase before accepting the request. If the feature exists, it tells you where — and does not re-spec it.

## Roles

| Phase    | Agent                  | Trigger                                                                 |
| :------- | :--------------------- | :---------------------------------------------------------------------- |
| Plan     | `product-manager`      | New feature request, user stories, acceptance criteria, duplicate check |
| Design   | `uiux-designer`        | UI/UX layout, design system, accessibility, component design            |
| Design   | `data-architect`       | Schema changes, migrations, new Prisma models, RLS                      |
| Build    | `backend-developer`    | NestJS modules, services, controllers, domain events                    |
| Build    | `frontend-developer`   | Next.js pages, UI components, API wiring                                |
| Build    | `fullstack-developer`  | End-to-end vertical slices (DB→API→UI)                                  |
| Build    | `devops-engineer`      | CI/CD, Docker, Turborepo, observability, secrets                        |
| Verify   | `qa-tester`            | Unit/integration/E2E tests, coverage gaps, regression                   |
| Verify   | `code-reviewer`        | Diff review, rule enforcement, merge gate                               |
| Verify   | `security-auditor`     | Tenant isolation, RBAC, injection, secrets, HIPAA                       |
| Verify   | `business-analyst-uat` | User workflow validation, UAT sign-off before release                   |
| Document | `tech-writer`          | `.ai/` context files, MODULE_REGISTRY, CHANGELOG                        |

## Recommended feature flow

product-manager → data-architect → backend-developer / frontend-developer (or fullstack-developer) → qa-tester → code-reviewer → security-auditor → business-analyst-uat → tech-writer

## Cross-IDE support

These agents are defined for Claude Code (`.claude/agents/*.md`), but equivalent rules exist for other tools:

| IDE            | Rules file                             |
| :------------- | :------------------------------------- |
| Claude Code    | `.claude/agents/*.md` (this directory) |
| Cursor         | `.cursor/rules/unerp-agents.mdc`       |
| Windsurf       | `.windsurfrules`                       |
| GitHub Copilot | `.github/copilot-instructions.md`      |
| Any AI agent   | `AGENTS.md` (master rule document)     |

All rules point back to `AGENTS.md` and `.ai/MODULE_REGISTRY.md` as the single sources of truth.

## Editing agents

Tweak behavior by editing the relevant `.md` file. Key sections in each:

- **Mandatory Project Context** — what to read before doing anything
- **Pushback Protocol** — how to correct the user
- **Critical rules / Design rules** — domain-specific non-negotiables

Keep the `description` field action-oriented (it drives auto-delegation in Claude Code).
