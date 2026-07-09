# Changesets

Versioning + publishing for the shared `@unerp/*` packages consumed by the
external industry app repos (`@unerp/service-kit` today; `@unerp/framework`,
`@unerp/ui` next).

Workflow:

1. `pnpm changeset` — describe the change and pick a semver bump.
2. Merge to `main` → `.github/workflows/release-packages.yml` runs
   `changeset version` (bumps + changelogs) and `changeset publish`
   (publishes to GitHub Packages).

Consumers pin a version range (e.g. `"@unerp/service-kit": "^0.2.0"`) with an
`.npmrc` mapping the `@unerp` scope to `https://npm.pkg.github.com`.
