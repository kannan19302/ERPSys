# Implementation Plan — current DEV cycle

> Overwritten exactly ONCE at cycle start; mid-cycle changes = dated addenda.

## Cycle

- **Cycle #:** 4
- **Phase:** F — Foundation (lift gate unmet)
- **Date:** 2026-07-18
- **Agent/session:** fable-5 (claim: `foundation-track-g6`); autonomous 10-cycle run (user /goal), no focus question (Phase F)

## Scope & rationale

**Track G.6 — boot-time env validation** (roadmap § 11b): "No boot-time env
validation. Zod-validated typed config loaded at bootstrap; process refuses to
start on invalid/missing env; `.env.example` generated from the schema so it
can never drift."

Selected because: no P0/P1 open (build fixed cycle 3); Track A paused at the
human sign-off gate → next unblocked, sign-off-independent, migration-free
foundation item in G. **Duplicate-check:** no ConfigModule/joi/envalid/zod
config anywhere in `apps/api/src` (verified by grep); `main.ts` hand-parses
.env files with zero validation; a hand-written `.env.example` exists (drift
unchecked). Env inventory captured by grep: ~32 variables across api +
database + auth.

## Ordered work items

1. `apps/api/src/common/config/env.schema.ts` — dependency-light Zod schema
   (zod only, no Nest imports) covering the full grepped inventory; required
   core (DATABASE_URL, REDIS_URL in prod), typed coercions (ports, booleans),
   secrets min-length in production, sensible dev defaults; `.describe()` on
   every key (drives the generator).
2. `validateEnv()` — aggregate all failures into one readable report; exit 1
   before Nest bootstrap. Wire into `main.ts` right after `loadEnv()`.
   Non-production keeps dev-friendly defaults; production is strict.
3. `scripts/generate-env-example.mjs` — imports the schema (Node 24 type
   stripping), emits `.env.example` grouped + commented from `.describe()`
   metadata; `--check` mode diffs against the committed file (CI drift gate).
4. Unit tests (vitest): valid env passes; missing/invalid production env fails
   with aggregated messages; boolean/port coercion.
5. CI: add `node scripts/generate-env-example.mjs --check` step.
6. Record + ship: CHANGELOG, Ledger 3 → 4, roadmap G.6 ✅, board rows, lock
   release, land on `main`.

## Acceptance criteria

- API refuses to boot with an invalid production env (unit-proven).
- `.env.example` regenerated from schema; `--check` green in repo, red on
  a deliberate edit (proof run).
- API typecheck + targeted vitest green; boundary check green.

## Gate tier & rollback note

- **FAST** — additive bootstrap validation; no schema/API surface change.
- **Rollback:** remove the `validateEnv()` call in `main.ts` (one line); the
  schema/generator are inert without it.

## Addenda (dated, append-only)

—
