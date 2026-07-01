# UniERP Subagent Team

Role-based AI subagents for the Universal ERP System. Each agent is context-aware: it loads the current project state (MODULE_REGISTRY, DEV_SPRINTS, CHANGELOG) before every session, checks for existing implementations before suggesting new work, and pushes back when the user is wrong.

## The three guarantees every agent provides

1. **Context-first**: reads MODULE_REGISTRY.md, DEV_SPRINTS.md, and CHANGELOG.md before every session
2. **Duplicate check**: verifies a feature doesn't already exist before building or speccing it
3. **Pushback**: corrects the user when wrong — never blindly agrees

## PM Gate — auto-triggered on feature requests

When you suggest any new functionality, the product-manager agent must run first. It checks MODULE_REGISTRY.md and the codebase before accepting the request. If the feature exists, it tells you where — and does not re-spec it.

## Roles

| Phase | Agent | Trigger |
|:---|:---|:---|
| Plan | `product-manager` | New feature request, user stories, acceptance criteria, duplicate check |
| Design | `uiux-designer` | UI/UX layout, design system, accessibility, component design |
| Design | `data-architect` | Schema changes, migrations, new Prisma models, RLS |
| Build | `backend-developer` | NestJS modules, services, controllers, domain events |
| Build | `frontend-developer` | Next.js pages, UI components, API wiring |
| Build | `fullstack-developer` | End-to-end vertical slices (DB→API→UI) |
| Build | `devops-engineer` | CI/CD, Docker, Turborepo, observability, secrets |
| Verify | `qa-tester` | Unit/integration/E2E tests, coverage gaps, regression |
| Verify | `code-reviewer` | Diff review, rule enforcement, merge gate |
| Verify | `security-auditor` | Tenant isolation, RBAC, injection, secrets, HIPAA |
| Verify | `business-analyst-uat` | User workflow validation, UAT sign-off before release |
| Document | `tech-writer` | `.ai/` context files, MODULE_REGISTRY, CHANGELOG |

## Recommended feature flow

product-manager → data-architect → backend-developer / frontend-developer (or fullstack-developer) → qa-tester → code-reviewer → security-auditor → business-analyst-uat → tech-writer

## Cross-IDE support

These agents are defined for Claude Code (`.claude/agents/*.md`), but equivalent rules exist for other tools:

| IDE | Rules file |
|:---|:---|
| Claude Code | `.claude/agents/*.md` (this directory) |
| Cursor | `.cursor/rules/unerp-agents.mdc` |
| Windsurf | `.windsurfrules` |
| GitHub Copilot | `.github/copilot-instructions.md` |
| Any AI agent | `AGENTS.md` (master rule document) |

All rules point back to `AGENTS.md` and `.ai/MODULE_REGISTRY.md` as the single sources of truth.

## Editing agents

Tweak behavior by editing the relevant `.md` file. Key sections in each:
- **Mandatory Project Context** — what to read before doing anything
- **Pushback Protocol** — how to correct the user
- **Critical rules / Design rules** — domain-specific non-negotiables

Keep the `description` field action-oriented (it drives auto-delegation in Claude Code).
