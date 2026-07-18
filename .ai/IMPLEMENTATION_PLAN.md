# Implementation Plan — current DEV cycle

> Overwritten exactly ONCE at cycle start; mid-cycle changes = dated addenda.

## Cycle

- **Cycle #:** 9
- **Phase:** F — Foundation
- **Date:** 2026-07-18
- **Agent/session:** fable-5 (claim: `foundation-track-g3`); autonomous run, iteration 6/10

## Scope & rationale

**Track G.3 — platform write idempotency** (roadmap § 11b): only e-commerce
checkout implements idempotency keys; no global `Idempotency-Key` mechanism.

**Duplicate-check:** grep shows idempotency only inside
`ecommerce-checkout.service.ts` (bespoke) and unrelated test names; no
middleware/interceptor/store under `common/`. `CacheService` is in-memory
with a "use Redis in production" TODO — not suitable as the store (restarts
+ multi-worker). `ioredis` is hoisted+resolvable (bullmq transitive); it will
be declared explicitly in `apps/api` (lockfile-only pin per the OneDrive
constraint).

**Storage-shape note:** the roadmap text says "store (tenantId, key,
requestHash, response) with TTL". Redis satisfies exactly that contract
(atomic NX claim + EX TTL) without a schema migration (frozen behind Track
A). If a durable audit of idempotent replays is later wanted, a table can be
added post-A without changing the middleware contract. Recorded here as the
design decision.

## Ordered work items

1. `common/idempotency/idempotency.store.ts` — `IdempotencyStore` interface +
   `RedisIdempotencyStore` (lazy ioredis from validated `REDIS_URL`; atomic
   `SET NX EX` claim; JSON records) + `InMemoryIdempotencyStore` (tests/dev
   fallback).
2. `common/idempotency/idempotency.interceptor.ts` — global interceptor:
   only state-changing methods with an `Idempotency-Key` header participate;
   claim → execute → store `{statusCode, body, requestHash}` (TTL 24h);
   concurrent duplicate → 409 `IDEMPOTENCY_IN_FLIGHT`; key reuse with a
   different request hash → 422 `IDEMPOTENCY_KEY_REUSED`; completed replay →
   original response + `Idempotency-Replayed: true` header; handler error →
   claim released (client may retry).
3. Shared contract: add both codes to the G.9 `ERROR_CODES` registry.
4. Register via `APP_INTERCEPTOR` in `app.module.ts` (no-op without header —
   zero behavior change for existing clients).
5. Vitest: replay, hash-mismatch, in-flight conflict, error-release,
   tenant-scoped keys (A ≠ B), TTL passthrough (in-memory store).
6. Gates: api tests + typecheck + boundary; shared rebuild (registry change).
7. Record + ship: CHANGELOG, Ledger 8 → 9 (next: 1 to harden), roadmap G.3,
   board, lock, `main`.

## Acceptance criteria

- Same key+payload twice ⇒ handler runs once, second response replayed with
  marker header (unit-proven).
- Same key, different payload ⇒ 422 contract envelope.
- Keys are tenant-scoped; no cross-tenant replay.
- No migration; existing endpoints unaffected without the header.

## Gate tier & rollback note

- **FAST** — additive interceptor, opt-in per request.
- **Rollback:** remove the APP_INTERCEPTOR provider line.

## Addenda (dated, append-only)

—
