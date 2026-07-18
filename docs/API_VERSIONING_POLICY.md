# UniERP API Versioning & Deprecation Policy (Track G.1)

> Status: platform contract — sealed with foundation v1.0 (roadmap § 12b);
> changes require an ADR. Created 2026-07-18 (Phase F cycle 10).
> Mechanism: `apps/api/src/common/versioning/` (registry + middleware).

## 1. Versioning scheme

- **URI-versioned**: every public REST surface lives under `/api/v<major>`
  (today: `/api/v1`, the global prefix in `main.ts`).
- **Major versions only** appear in the URI. Additive, backward-compatible
  change (new endpoints, new optional fields, new response fields) happens
  *within* a major version and is NOT versioned.
- **Breaking change** (removing/renaming fields, changing semantics or status
  codes, tightening validation on existing input) requires a new major
  surface served **beside** the old one — never an in-place break.

## 2. Side-by-side rule

A new major version ships alongside the previous one for **at least one
documented release cycle** (minimum 6 months for any surface a marketplace
extension or external integration can reach). Both versions share services;
the old surface becomes a thin adapter over the new one — divergence of
business logic between versions is forbidden.

## 3. Deprecation clocks (mechanical, not prose)

Deprecating a surface = adding an entry to
`common/versioning/deprecation-registry.ts` with `deprecatedAt`, a
`successor`, a migration-guide `link`, and (when scheduled) `sunsetAt`. The
middleware then emits on every matching response:

| Header | Format | Meaning |
|---|---|---|
| `Deprecation` | `@<unix-ts>` (RFC 9745) | surface is deprecated since that instant |
| `Sunset` | HTTP-date (RFC 8594) | hard removal date |
| `Link` | `rel="successor-version"`, `rel="deprecation"` | where to migrate + docs |

Rules:
- No `sunsetAt` may be set less than the § 2 window away from `deprecatedAt`.
- Nothing is removed while telemetry shows an active in-window consumer
  (§15.5 doctrine: *"breaking an extension without its migration window is a
  platform incident"*).
- Expired entries move to the history table below (never silently deleted).

## 4. Extension `apiVersion` window interplay

Marketplace/out-of-process extensions declare a numeric `apiVersion`
(service-kit `EXT_API_VERSION`). The platform supports extensions across a
**two-version window** (current + previous). A REST major-version deprecation
that affects the ext-gateway surface MUST be mirrored as an `EXT_API_VERSION`
bump with the same clock, so both mechanisms tell one story.

## 5. Process checklist (per deprecation)

1. ADR describing the breaking change + successor design.
2. Ship successor surface; contract tests green for both versions.
3. Registry entry (headers live from that deploy) + CHANGELOG note.
4. Migration guide published at the `link` URL.
5. Telemetry on old-surface usage; sunset only at zero in-window consumers
   (or contractual expiry).
6. After sunset: remove code, move the registry entry to History.

## 6. History

_No UniERP API surface has been deprecated yet. The registry is empty; the
mechanism is live and unit-tested._
