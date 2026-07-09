# Extension Service Contract (out-of-process industry apps)

UniERP industry apps live in their own repos (`unierp-app-<slug>`) and ship two artifacts:

1. **A declarative bundle** (manifest + pages/schemas) published to the marketplace — rendered by core's dynamic runtime, no core rebuild.
2. **A service** — a standalone NestJS app deployed next to core, reached only through core's extension gateway.

## Manifest

`runtime: "declarative+service"` with a `service` section:

```jsonc
{
  "name": "Field Service",
  "slug": "field-service",
  "version": "1.0.0",
  "apiVersion": 1,
  "runtime": "declarative+service",
  "service": {
    "routePrefix": "field-service",        // default: app slug
    "baseUrlEnv": "FIELD_SERVICE_SERVICE_URL", // env var core reads first
    "defaultBaseUrl": "http://localhost:4103", // fallback (docker-compose)
    "healthcheck": "/svc/health",
    "scopes": ["tickets:rw"],
    "timeoutMs": 15000
  }
}
```

`apiVersion` is the contract version (`EXT_API_VERSION` in `@unerp/service-kit`). Core refuses newer versions.

## Routing & gating

- Clients call `POST/GET /api/v1/ext/<slug>/<path>` on core with their normal user JWT.
- The gateway (`apps/api/src/modules/ext-gateway/`) resolves the tenant's `InstalledApp` row:
  - not installed / disabled → **404 immediately** (this is what makes uninstall real-time),
  - installed → request is proxied to `<baseUrl>/<path>` with the tenant-context token attached.
- Base URL resolution order: `service.baseUrlEnv` env var → `<SLUG>_SERVICE_URL` (slug uppercased, `-`→`_`) → `service.defaultBaseUrl`.
- Install performs a health check (`GET <baseUrl><healthcheck>`) and **fails the install** if the service is unreachable.
- Service unreachable at request time → `503` envelope: `{ statusCode, error: "AppServiceUnavailable", message, app, requestId }`.

## Authentication

- Core signs a short-lived (60s) HS256 JWT per request with `EXT_SERVICE_JWT_SECRET` (shared secret, set on both core and each service).
- Header: `x-unierp-tenant-token`. Claims: `{ tenantId, userId, email, roles, appSlug, scopes, iat, exp }`.
- Services must verify it with `verifyTenantToken()` / `tenantContextMiddleware()` from `@unerp/service-kit` and derive **all** tenant context from the claims. Never trust other headers.
- Services are never exposed publicly — only the gateway may reach them (compose/k8s network policy).
- Service → core calls: echo the received token back to core within its TTL.

## Service requirements

- Expose the health endpoint declared in the manifest, returning `buildHealthResponse(slug, version)` from `@unerp/service-kit`.
- Every row the service persists carries `tenantId` from the verified claims (same multi-tenant discipline as core).
- Own database (no access to core's Postgres). Cross-domain data comes via core APIs.
- Depend only on `@unerp/shared` and `@unerp/service-kit` — never `@unerp/database`.

## Local development

- Core compose defines the external docker network `unierp`; each app repo's compose joins it.
- Without the service running, core still works: the app's routes return 503, declarative pages still render.

## Versioning

- `@unerp/service-kit` is published to GitHub Packages; services pin `^0.x/^1.x`.
- Breaking changes to the token or envelope bump `EXT_API_VERSION`; core supports the previous version for one release.
