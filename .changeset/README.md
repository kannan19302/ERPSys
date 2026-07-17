# Changesets

This directory contains changesets for publishing `@unerp/ui-*` packages.

## Workflow

1. When a package changes, add a changeset: `pnpm changeset`
2. Select the affected packages and bump level (patch/minor/major)
3. On release: `pnpm changeset version` then `pnpm changeset publish`

See [changesets docs](https://github.com/changesets/changesets) for details.
