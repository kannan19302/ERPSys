# Implementation Plan — DEV Cycle 64 cont'd (Flutter Mobile — Cross-Platform Parity)

- **Cycle**: 64 (continuation)
- **Phase**: M (Module strengthening — cross-platform parity criterion #6)
- **Scope**: Complete Flutter (apps/mobile) Clean Architecture feature layers for 7 remaining backend modules: Supply Chain, POS, Manufacturing, Projects, Documents, Communication, Workflow
- **Why**: P2 unfinished work from prior session — entities + models exist; need remote data sources, repository impls, use cases, providers, and UI pages to reach endpoint parity with the NestJS backend
- **Duplicate-check**: 5 modules already built (sales, crm, finance, hr, procurement) — these 7 are the remainder. No overlap with any active claim.
- **Throughput floor target**: ≥ 5,000 net LOC

## Planned Work

1. **Supply Chain**: Remote DS, repo impl, use cases, providers, list/detail pages (shipments, carriers, routes)
2. **POS**: Remote DS, repo impl, use cases, providers, list pages (registers, orders, sessions)
3. **Manufacturing**: Remote DS, repo impl, use cases, providers, list/detail pages (work orders, BOMs, production plans)
4. **Projects**: Remote DS, repo impl, use cases, providers, pages (+ router wiring — projects already has entities/models)
5. **Documents**: Remote DS, repo impl, use cases, providers, pages
6. **Communication**: Remote DS, repo impl, use cases, providers, pages
7. **Workflow**: Remote DS, repo impl, use cases, providers, pages
8. **Router & Shell**: Verify all new module routes registered in `app_router.dart`

## Verification
- `flutter analyze` — 0 errors
- `flutter pub get` succeeds

## Rollback
- `git revert` the cycle commit; additive only (new files, no destructive changes)
