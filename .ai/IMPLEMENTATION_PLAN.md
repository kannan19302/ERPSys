# Implementation Plan — current DEV cycle

> Overwritten exactly ONCE at cycle start; mid-cycle changes = dated addenda.

## Cycle

- **Cycle #:** 10
- **Phase:** F — Foundation
- **Date:** 2026-07-18
- **Agent/session:** fable-5 (claim: `foundation-track-g1`); autonomous run, iteration 7/10
- **Cadence note:** completing this cycle sets the DEV counter to 10 →
  `Next run: HARDEN (mandatory)` per binding #17.

## Scope & rationale

**Track G.1 — API versioning is a prefix, not a policy** (roadmap § 11b):
only `setGlobalPrefix('api/v1')` in `main.ts`; no way to signal deprecation,
no sunset policy, no tie-in to the extension `apiVersion` window.

**Duplicate-check:** no `Deprecation`/`Sunset` header emission anywhere in
`apps/api/src` (grep); no versioning policy doc in `docs/`; service-kit
exposes `EXT_API_VERSION` (number) with no platform policy document.

## Ordered work items

1. `common/versioning/deprecation-registry.ts` — typed registry of
   deprecations: `{ pathPrefix, deprecatedAt, sunsetAt, successor, link }`;
   empty today (nothing is deprecated) but the mechanism is live and tested.
2. `common/versioning/deprecation.middleware.ts` — Express middleware: on a
   registry match adds RFC-compliant `Deprecation` (RFC 9745),
   `Sunset` (RFC 8594) and `Link rel="successor-version"` headers. Wired in
   `main.ts` for all API routes.
3. `docs/API_VERSIONING_POLICY.md` — the written policy: URI versioning
   (`/api/v1` → `/api/v2` served side-by-side ≥ 1 documented release),
   deprecation clock rules, header semantics, extension `apiVersion`
   window interplay (service-kit `EXT_API_VERSION`), and the §15.5
   "deprecation as a product feature" doctrine hooks.
4. Vitest: registry matching (longest-prefix), header emission, no-op on
   unregistered paths, sunset formatting.
5. Gates: api tests + typecheck (true exit codes) + boundary check.
6. Record + ship: CHANGELOG, **Ledger 9 → 10 + `Next run: HARDEN
   (mandatory)`**, roadmap G.1, board, lock, `main`.

## Acceptance criteria

- Registering a test deprecation makes responses carry correct
  Deprecation/Sunset/Link headers (unit-proven); unregistered routes
  untouched.
- Policy doc exists and is referenced from the roadmap row.
- Ledger flips the harden flag in the same commit.

## Gate tier & rollback note

- **FAST** — additive middleware (registry empty in prod), docs.
- **Rollback:** remove middleware wiring line; registry inert.

## Addenda (dated, append-only)

—
