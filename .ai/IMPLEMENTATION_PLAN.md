# Implementation Plan — current DEV cycle

> **Working artifact, not a file of record** (AUTOPILOT § Shared bindings #16).
> Overwritten exactly ONCE at the start of each DEV cycle. Mid-cycle scope
> changes are appended as dated addendum lines, never rewrites.

## Cycle

- **Cycle #:** 3
- **Phase:** F — Foundation (lift gate unmet)
- **Date:** 2026-07-18
- **Agent/session:** fable-5 (claim: `foundation-track-i1`)

## Scope & rationale

**Track I.1 — production build broken at HEAD** (roadmap § 11d). Selected via
the priority ladder's **P0 rung (broken build)** — it outranks P-F ordering,
and Track A (the next dependency-ordered item) is paused at the human
sign-off gate (`.ai/TRACK_A_RECONCILIATION_2026-07-18.md` § 6, no approval
yet), so the pickable foundation work is sign-off-independent anyway.

**Diagnosis (verified this cycle):** `next build` fails with
`Module not found: Can't resolve '@unerp/ui-components'` from
`packages/ui-data-grid/dist/index.mjs` (same for `ui-layout`, and
`ui-theme → @unerp/ui-tokens`). Root cause is NOT package `exports` (all dist
files exist, exports map is correct): the pnpm-created **junctions under
`packages/*/node_modules/@unerp/` are broken/dangling** — `Test-Path
<link>/package.json` is False and Node's resolver cannot traverse them
(OneDrive sync + repeatedly EACCES-aborted `pnpm install` runs corrupt
junction metadata). Dev mode masks it because the `development` exports
condition resolves through `transpilePackages` into `src`.

**Duplicate-check:** no existing repair tooling in `scripts/` (only
claim/boundary/migration/feature scripts); `pnpm install` cannot self-heal in
this environment (EACCES, three attempts across cycles). MODULE_REGISTRY has
no record of a workspace-link repair capability.

## Ordered work items

1. `scripts/repair-workspace-links.mjs` — scan every
   `{apps,packages}/*/node_modules/@unerp/<name>` entry; for each broken link
   (unreadable `package.json` through the link), delete and recreate a
   junction to the real workspace directory (`packages/<dir>` resolved from
   the workspace map). Idempotent, report-only `--check` mode for CI/doctor
   use. No `pnpm install` invocation.
2. Run the repair; verify Node can resolve through every repaired link.
3. Rebuild stale ui-* dists if needed (known gotcha: dists stale vs src);
   only for packages whose build output predates src edits.
4. `next build` end-to-end → must complete green.
5. CI gate: add a `web-build` job (`next build`) to `.github/workflows/ci.yml`
   so the prod artifact can never silently break again (I.1's second half).
   (Actions billing is a known separate issue — the gate lands as config.)
6. Record + ship: CHANGELOG, Cycle Ledger 2 → 3, roadmap I.1 status note,
   Collab Board; release lock; land on `main`.

## Acceptance criteria / Definition of Done

- `node -e "require.resolve('@unerp/ui-components', {paths:[.../ui-data-grid/dist]})"`
  succeeds (it fails today).
- `next build` exits 0 with a full page manifest.
- `repair-workspace-links.mjs --check` exits 0 after repair, non-zero before
  (proof captured in CHANGELOG).
- CI workflow contains a required prod-build job.
- API surface untouched; no schema changes; tree clean on `main`.

## Gate tier & rollback note

- **Gate tier:** MILESTONE for the build proof (full `next build`), FAST
  elsewhere (no API/schema changes → no architecture:check/migration gates
  triggered, but boundary check re-run anyway as regression insurance).
- **Rollback:** repair script only recreates node_modules junctions (never
  touches tracked files); junctions are disposable state re-creatable by any
  future successful `pnpm install`. CI job revert = one workflow-file hunk.

## Addenda (dated, append-only during the cycle)

—
