# Implementation Plan — current DEV cycle

> **Working artifact, not a file of record** (AUTOPILOT § Shared bindings #16).
> Overwritten exactly ONCE at the start of each DEV cycle — after selection/claim,
> before any code — then left untouched until the next cycle (mid-cycle scope
> changes are appended as dated addendum lines, never rewrites). Committed with
> the cycle's first commit so all agents can see in-flight intent.
> CHANGELOG.md + MODULE_REGISTRY.md remain the documentation of record.

## Cycle

- **Cycle #:** 1 (first cycle under the Program Ladder)
- **Phase:** F — Foundation (lift gate unmet: #17/#19/#21 open, Tracks A–I open)
- **Date:** 2026-07-18
- **Agent/session:** fable-5 (claim: `foundation-track-0`)

## Scope & rationale

**Track 0 — Governance & blockchain quarantine** (`.ai/FOUNDATION_HARDENING_ROADMAP.md` § 5),
the first unblocked item in the dependency order (0 → A → B∥C → D → E → F/G/H/I).

Priority-ladder rung: **P-F** (no P0 broken build blocking this work; no open
P1 security issue selected this cycle — #17/#19/#21 are foundation blockers
addressed by Tracks A–C, which depend on Track 0's governance being landed).

**Duplicate-check:** CHANGELOG already contains the Track 0.1 roadmap entry and
the 0.4 dated architecture exception — written by a prior session but **never
committed**. MODULE_REGISTRY has a Collab Board row for the blockchain
integration (status `pending`). What does NOT exist: the 0.2 CI quarantine
guard, and the 0.3 "provisional / freeze-exception" marking. Nothing here
re-implements existing capability.

**Stranded-tree note:** the working tree carries uncommitted prior-session work
(ADP rewiring docs/skills, Connect phase 2, blockchain module, roadmap). The
binding "always land work on main" rule requires landing it; Track 0 is
precisely the governance record for that state. This cycle verifies the tree
(typecheck + architecture gates), lands it in logical commits, and adds the
quarantine guard so the blockchain island cannot be wired before Track E.

## Ordered work items

1. Commit the claim lock (per claim.mjs protocol).
2. **0.2 CI guard**: extend `scripts/check-module-boundaries.mjs` (runs inside
   `pnpm architecture:check`) with a blockchain-quarantine rule — fail if any
   file outside `apps/api/src/modules/blockchain` imports `@unerp/blockchain`
   or anything under `modules/blockchain` (covers `*BlockchainService`).
   Confirm `BLOCKCHAIN_ENABLED` stays default-off.
3. **0.3**: mark the blockchain module + migration `20260717180000` as
   "provisional / freeze-exception, not to be wired (see Track E)" in
   MODULE_REGISTRY (Collab Board row + module note).
4. **0.1/0.4**: already drafted in CHANGELOG — verify present, land them.
5. Verify: `pnpm architecture:check`, `node scripts/check-foundation-readiness.mjs`,
   scoped API typecheck.
6. Record + ship: CHANGELOG cycle entry, MODULE_REGISTRY § Cycle Ledger
   (DEV counter → 1, Next run: DEV, 9 until harden) in the same commit as the
   code; mark Track 0 ✅ in the roadmap with evidence; release lock; land on
   `main` and push.

## Acceptance criteria / Definition of Done

- A deliberate test import of `@unerp/blockchain` from a non-blockchain module
  makes `architecture:check` fail; removing it goes green (proof captured in
  CHANGELOG entry).
- `check-foundation-readiness.mjs` green; API typecheck green.
- Roadmap § 5 exit gate satisfied: guard in CI path, exception recorded,
  roadmap in tracked files. Track 0 marked ✅ with commit hash.
- Working tree clean; all work on `origin/main`.

## Gate tier & rollback note

- **Gate tier:** FAST (docs + one CI-script rule; no schema, no API surface,
  no UI). The stranded feature code lands as-is after typecheck verification —
  it is prior recorded work, not this cycle's feature scope.
- **Rollback:** the quarantine rule is a single self-contained block in
  `check-module-boundaries.mjs`; revert that block to restore prior behavior.
  Doc changes revert cleanly. No data/schema impact.

## Addenda (dated, append-only during the cycle)

- **2026-07-18 — quarantine hardened to full dormancy.** Verification found the
  blockchain module does not compile: `@unerp/blockchain` was never linked
  (`pnpm install` fails on OneDrive EACCES — known env limitation), its `dist`
  was never built, and `@hyperledger/fabric-gateway` is not installed. With
  `BlockchainModule` registered in `app.module.ts`, the API typecheck fails
  inside the island. Resolution within Track 0 scope: unregister
  `BlockchainModule` from `app.module.ts` (dated Track E pointer left in
  place), exclude `modules/blockchain` from the API tsconfig, and drop the
  app.module exemption from the quarantine guard (now zero legitimate
  importers). Code stays in-repo untouched for Track E re-platforming.
