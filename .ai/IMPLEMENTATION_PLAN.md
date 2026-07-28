# Implementation Plan — Cycle 65

**Phase**: M (Module strengthening) — deepening, not new capability.
**Scope + why**: Cycle 64 built Clean Architecture layers (data/domain/providers/list
pages) for 12 mobile modules, but 6 list-page tiles call `context.pushNamed(...)`
against route names that were never registered in `app_router.dart` and have no
detail page — tapping any of these tiles throws at runtime (go_router raises on an
unknown route name). This is a broken-navigation regression left over from that
cycle, found by tracing every `pushNamed` call against the router's registered
route names. Fixing it is P2 (unfinished work on an already-claimed surface), takes
priority over new module scaffolding per the priority ladder.

**Affected routes** (module → route name → entity):

- Supply Chain → `shipment-detail`, `carrier-detail` → `Shipment`, `Carrier`
- POS → `pos-order-detail`, `pos-register-detail`, `pos-shift-detail` → `PosOrder`, `PosRegister`, `PosShift`
- Projects → `project-detail` → `Project`

**Duplicate-check**: `Get<Entity>UseCase` + `<entity>DetailProvider` already exist
for all six except `PosShift` (usecase exists, provider missing) — confirmed by
reading `supply_chain_providers.dart`, `pos_providers.dart`, `projects_providers.dart`.
No data/domain work needed; this is UI-layer only.

**Build list**:

1. `pos_providers.dart` — add `posShiftDetailProvider` (mirrors the existing
   `posOrderDetailProvider`/`posRegisterDetailProvider` pattern).
2. 6 new read-only detail pages (mirrors `ProductDetailPage`'s pattern: `UiCard`
   sections, `Formatters` for money/dates, `LoadingView`/`FailureView` for
   `AsyncValue` states): `ShipmentDetailPage`, `CarrierDetailPage`,
   `PosOrderDetailPage`, `PosRegisterDetailPage`, `PosShiftDetailPage`,
   `ProjectDetailPage`.
3. `app_router.dart` — register each as a nested `:id` `GoRoute` under its list
   route (same nesting pattern already used for `manufacturing`'s work-order/BOM/
   MRP detail routes), plus imports.

**Gate tier**: FAST — `flutter analyze` (0 new errors) is sufficient; this is UI
navigation wiring against already-tested data/domain layers, not a new surface.

**Rollback**: revert the single commit; no schema/migration/API involved.
