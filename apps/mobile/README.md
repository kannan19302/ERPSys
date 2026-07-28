# UniERP Mobile

Flutter client (Android + iOS) for the existing UniERP monorepo. It is a pure
consumer of `apps/api` — no new backend routes, no schema changes, no new auth
mechanism. Everything under `apps/mobile` is additive; nothing in
`apps/web`, `apps/api`, or `packages/*` was modified.

## Why it fits the existing architecture

| Concern | Reused from | How |
|---|---|---|
| Auth | `apps/api/src/modules/auth` | Same `/auth/login`, `/auth/refresh`, MFA, tenant switch endpoints. `JwtAuthGuard` already accepts a Bearer header as a fallback to the cookie, so no guard change was needed. |
| CSRF | `apps/api/src/common/middleware/csrf.middleware.ts` | The app carries a persistent cookie jar and replays the same double-submit `x-csrf-token` header the web client uses. |
| Contracts | `packages/shared/src/contracts/*` | `error_envelope.dart` and `paginated.dart` are hand-maintained Dart mirrors of the frozen TS contracts — see the doc comment in each file for the source of truth. |
| RBAC | `packages/shared/src/permissions/registry.ts` | `core/rbac/permissions.dart` reuses the same `module.resource.action` strings and the same wildcard matching rules as `hasPermission()`; the API's `RbacGuard` remains the sole enforcement point. |
| Design system | `packages/ui-tokens/src/themes/{light,dark}.css` | `app/theme/design_tokens.dart` mirrors the CSS custom properties 1:1 so the mobile UI matches web without hardcoded colors (AGENTS.md Rule 5). |
| Pagination | `apps/api/src/common/utils/pagination.util.ts` | Every list screen requests `page`/`limit`/`sort`/`search` and never paginates client-side (Rule 25). |
| Database | — | Never touched directly. All access goes through the REST API, which already enforces tenant isolation via RLS. |

## Architecture (Clean Architecture, feature-first)

```
lib/
  app/            # theme, router, shell — composition only
  core/            # cross-feature: network, storage, error handling, RBAC, widgets
  features/
    auth/
      domain/       # entities, repository interface, use cases — no Flutter/Dio imports
      data/         # models (JSON <-> entity), remote data source, repository impl
      presentation/ # Riverpod controllers + pages/widgets
    inventory/       # same three layers
    notifications/   # same three layers
```

Dependency direction is strictly `presentation -> domain <- data`; `domain`
never imports `data` or `presentation`. Adding a module (e.g. `sales`,
`hr`) means adding a new `features/<module>` folder in the same shape and
listing its endpoints in `core/network/api_paths.dart` — no change to `core`.

## Setup

1. Install the Flutter SDK (>=3.27) and Android Studio / Xcode.
2. From `apps/mobile`: `flutter pub get`
3. Start the existing dev stack from the repo root (`AGENTS.md` Rule 32):
   `./scripts/docker-start.ps1` — this is the same API/Postgres/Redis stack the
   web app uses; the mobile app talks to the same `apps/api` instance.
4. Run against it:

```bash
# Android emulator (10.0.2.2 is the emulator's alias for host localhost)
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3001

# iOS simulator (shares the host's localhost directly)
flutter run --dart-define=API_BASE_URL=http://127.0.0.1:3001

# Physical device on the same network — use the host's LAN IP
flutter run --dart-define=API_BASE_URL=http://192.168.x.x:3001
```

Staging/prod builds use `lib/main_staging.dart` / `lib/main_prod.dart` with
`--dart-define=FLAVOR=staging|prod` and an HTTPS `API_BASE_URL` (see
`core/config/env.dart`).

## What's implemented end-to-end

- **Auth**: login, MFA (TOTP + push polling), silent refresh, tenant list /
  switch, logout, forgot password — against the real endpoints in
  `apps/api/src/modules/auth`.
- **Inventory / Products**: paginated list with server-side search/sort,
  detail, delete, offline read-cache with a "stale data" banner.
- **Notifications**: feed + mark-read, against
  `apps/api/src/modules/communication`.
- **RBAC-aware UI**: `PermissionGate` hides create/delete affordances the
  signed-in user's role doesn't grant (server remains the enforcement point).

## Extending to another module

1. `features/<module>/domain/entities/*.dart` — mirror the Prisma model's
   client-relevant fields (see `packages/database/prisma/schema.prisma`).
2. `features/<module>/data/models/*.dart` — `fromJson`/`toJson` matching the
   controller's actual response shape (check the `*.service.ts` return value,
   not just the DTO type — several services return a hand-picked projection).
3. Add the routes to `core/network/api_paths.dart`.
4. `data/datasources`, `data/repositories`, `domain/usecases`,
   `presentation/providers`, `presentation/pages` — same shape as `inventory`.
5. Register the new destination in `app/router/app_router.dart` and, if it
   belongs in primary navigation, `app/shell/app_shell.dart`.

## Known gaps / follow-ups

- CAPTCHA challenge fields (`provider`, `siteKey`) don't survive the API's
  `AllExceptionsFilter.unwrapHttpResponse()`, which keeps only `message` and
  `errors` from a thrown `HttpException` body — same gap the web client has.
  `AuthRepositoryImpl._mapLoginError` documents and works around it; a real
  fix belongs in the API (move those fields under `errors`).
- No push notification wiring yet (`/auth/push/subscribe` exists server-side;
  FCM/APNs registration is not implemented in this pass).
- No biometric unlock; `SecureSessionStore.readBiometricEnabled/write...`
  are provisioned for it but unused.
