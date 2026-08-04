# GOVERNANCE.md

> Per `PLATFORM_ARCHITECTURE.md § 4.6`: governance files are generated from `unierp-workspace` templates and drift-checked — never hand-copied.
> This is the template source for all 15 repositories.

## Repository Conventions

| Convention        | Rule                                                                                       |
| :---------------- | :----------------------------------------------------------------------------------------- |
| Repository name   | `unierp-<layer-role>`, lowercase, no product-marketing names                               |
| npm scope         | `@unerp/*` internal · `@unierp/*` public (SDK, CLI, extension-api)                         |
| Default branch    | `main` everywhere                                                                          |
| Branch protection | PR review, all checks green, linear history, signed commits, **administrators not exempt** |
| Versioning        | SemVer per repo; L3–L5 additionally carry the dated train version                          |
| Shared CI         | Reusable workflows in `unierp-workspace`; a repo defines _which_ gates apply, never _how_  |

## Decision Records (ADR)

| ADR     | Decision                                                                         | Status   |
| :------ | :------------------------------------------------------------------------------- | :------- |
| ADR-001 | PostgreSQL as the only persistent store                                          | Accepted |
| ADR-002 | Prisma ORM with RLS enforcement on every tenant table                            | Accepted |
| ADR-003 | Module extraction requires independent scaling or release profile                | Accepted |
| ADR-004 | PKCE mandatory on all OAuth 2.1 flows                                            | Accepted |
| ADR-005 | `@ts-nocheck` ratchet must monotonically decrease; no new suppressions           | Accepted |
| ADR-006 | All money fields must be `Decimal(19,4)`, never `Float`                          | Accepted |
| ADR-007 | Extension scopes are always ⊆ the installing admin's permissions                 | Accepted |
| ADR-008 | Contract-first: L0 (`@unerp/contracts`) is the single source of truth            | Accepted |
| ADR-009 | Tier-3 extensions run in V8 isolates with capability-based context injection     | Accepted |
| ADR-010 | Native Windows is a first-class, CI-verified development target                  | Accepted |
| ADR-011 | Platform manifest (M1) is the unit of release; rollback is the previous manifest | Accepted |
| ADR-012 | Consumer-driven contract tests (M2) ship before first repo extraction            | Accepted |

## Code Ownership

| Layer | Package                                                       | Owner Team                  |
| :---- | :------------------------------------------------------------ | :-------------------------- |
| L0    | `@unerp/contracts`                                            | Platform Infrastructure     |
| L1    | `@unerp/kernel`, `@unerp/sdk`                                 | Platform Infrastructure     |
| L2    | `@unerp/database`, `@unerp/framework`, `@unerp/extension-api` | Platform Infrastructure     |
| L3    | `@unerp/api`                                                  | Backend (all feature teams) |
| L4    | `@unerp/web`, `@unerp/console`                                | Frontend                    |
| L5    | `@unerp/mobile`, `@unerp/desktop`                             | Mobile                      |
| L6    | `unierp-extensions/*`                                         | Vertical teams / Partners   |
| L7    | `unierp-infra`, `unierp-workspace`                            | Platform Infrastructure     |

## Change Management

All changes follow:

1. **Design doc or ADR** for architectural decisions
2. **PR with all gates green** — never merge red
3. **Linear history** — squash or rebase; no merge commits
4. **Signed commits** required (GPG or SSH key)
5. **Changeset** for versioned packages (triggers choreography bot M3)

## Escalation Policy

| Situation                              | Action                                                     |
| :------------------------------------- | :--------------------------------------------------------- |
| SLO error budget exhausted             | Feature work pauses; on-call escalated                     |
| Finance SLO 75% budget                 | Escalate to CTO immediately                                |
| Security vulnerability (high/critical) | Security embargo, patch within 24h, coordinated disclosure |
| Extension compatibility break          | Release blocked; immediate revert                          |
| Control-plane boundary bypass          | P0 incident, audit log reviewed                            |
