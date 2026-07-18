# Implementation Plan — current DEV cycle

> Overwritten exactly ONCE at cycle start; mid-cycle changes = dated addenda.

## Cycle

- **Cycle #:** 5
- **Phase:** F — Foundation
- **Date:** 2026-07-18
- **Agent/session:** fable-5 (claim: `foundation-track-g9`); autonomous 10-cycle run, iteration 2/10

## Scope & rationale

**Track G.9 — error envelope + pagination as executable contracts**
(roadmap § 11b): today one `all-exceptions.filter.ts` implements the envelope
privately and pagination is convention-only prose (rule 16b).

**Duplicate-check:** `packages/shared/src/types/index.ts` has
`PaginatedResponse`/`PaginationMeta` *interfaces* (types only — no runtime
schema, no tests, not consumed by the filter); the filter defines its own
private `ErrorEnvelope` interface; `scaffold-entity.mjs` hand-rolls
page/limit. No runtime contract module exists → G.9 is open.

## Ordered work items

1. `packages/shared/src/contracts/error-envelope.ts` — canonical error-code
   registry (const map), Zod `errorEnvelopeSchema`, `ErrorEnvelope` type,
   `codeForStatus()` helper (moved from the filter).
2. `packages/shared/src/contracts/pagination.ts` — `listQuerySchema`
   (coerced `page`≥1/25-default `limit`≤100/`sortBy`/`sortOrder`),
   `ListQuery` type, `paginationMetaSchema`, `paginatedResponseSchema(item)`
   builder, `buildPaginationMeta()` helper.
3. Barrel `contracts/index.ts`, export from package root; deprecate (JSDoc)
   the old type-only interfaces pointing at the contracts.
4. Vitest suites for both contracts (validation edges, coercion, meta math).
5. Consume: `AllExceptionsFilter` imports `ErrorEnvelope` + `codeForStatus`
   from `@unerp/shared` (behavior identical); `scaffold-entity.mjs` template
   emits `listQuerySchema`-based parsing + `buildPaginationMeta` so every new
   module gets the contract by default (exit-gate "scaffolder default").
6. Rebuild shared dist (tsc by path); shared tests + API typecheck + boundary
   check; record (CHANGELOG, Ledger 4 → 5, roadmap G.9 ✅, board) and ship.

## Acceptance criteria

- Contracts importable from `@unerp/shared` with runtime schemas + tests.
- Filter compiles against the shared type with no behavior change.
- Scaffolder emits contract-conformant list handling.
- Shared vitest + API typecheck + boundary check green.

## Gate tier & rollback note

- **FAST** — additive package code + internal refactor of one filter.
- **Rollback:** filter can re-inline its interface (one import revert);
  contracts module is additive.

## Addenda (dated, append-only)

- **2026-07-18** — duplicate-check correction: `validators/index.ts` already
  held a loose runtime `paginationSchema` (legacy `sort`/`search` shape) and a
  `paginatedResponseSchema` (missed by the initial grep, which covered
  types/utils only). Consolidated instead of duplicated: contracts version is
  canonical, validators' local response schema removed, legacy query schema
  kept with `@deprecated` pointer.
