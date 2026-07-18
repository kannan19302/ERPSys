# Contributing to UniERP

This repository is source-available under an all-rights-reserved [LICENSE](LICENSE). Contributions
are welcome from authorized collaborators; by opening a pull request you agree that your
contribution may be incorporated under the project's existing terms.

## Before you start

1. Read [AGENTS.md](AGENTS.md) — the architecture, critical rules, and module conventions.
2. Read [docs/ARCHITECTURE_FOUNDATION.md](docs/ARCHITECTURE_FOUNDATION.md) for the binding
   architectural governance every change must follow.
3. Check the [Wiki](../../wiki) and open [Issues](../../issues) / [Discussions](../../discussions)
   to avoid duplicate work.

## Development setup

See [README § Development Setup](README.md#development-setup) for the full local environment
walkthrough (Docker, database, env vars).

## Branching & commits

- Branch from `main`: `feat/<short-slug>`, `fix/<short-slug>`, `chore/<short-slug>`.
- Commits follow [Conventional Commits](https://www.conventionalcommits.org/):
  `feat(module): summary`, `fix(api): summary`, `chore(deps): summary`, etc. This is enforced by
  commitlint on every commit (see `.husky/commit-msg`).
- Keep commits scoped and atomic; prefer several small commits over one large one.

## Before opening a PR

Run the same checks CI runs:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm format:check
pnpm architecture:check   # required for any API change
pnpm migration:discipline # required for any database change
```

`db:push` is intentionally disabled — use `pnpm db:migrate` / `pnpm db:deploy`.

## Pull requests

- Use the PR template ([.github/PULL_REQUEST_TEMPLATE.md](.github/PULL_REQUEST_TEMPLATE.md)) —
  describe the change, link the issue, and check off the verification steps you ran.
- All tenant-scoped endpoints must enforce RBAC + Row-Level Security + Zod validation
  (see [docs/SECURITY_CHECKLIST.md](docs/SECURITY_CHECKLIST.md)).
- CI must be green (lint, typecheck, test, CodeQL) before merge — see
  [.github/workflows/ci.yml](.github/workflows/ci.yml).
- [CODEOWNERS](.github/CODEOWNERS) auto-requests review on protected paths
  (`.github/`, `.ai/`, migrations, `scripts/`, deploy config).
- If your change touches a package that ships a changelog, add a changeset:
  `pnpm changeset`.

## Code style

- Formatting: Prettier (`pnpm format`), enforced by `.husky/pre-commit` via lint-staged.
- Linting: ESLint (`pnpm lint`), flat config in [eslint.config.mjs](eslint.config.mjs).
- TypeScript strict mode throughout — no `any` without a comment explaining why.
- UI goes through `@unerp/framework` and `@unerp/ui-*` tokens; no ad-hoc styling in feature code.

## Reporting bugs / requesting features

Use the [issue templates](.github/ISSUE_TEMPLATE) — bug report or feature request. For security
issues, see [SECURITY.md](SECURITY.md) instead of opening a public issue.

## Code of Conduct

This project follows the [Code of Conduct](CODE_OF_CONDUCT.md). Be respectful.
