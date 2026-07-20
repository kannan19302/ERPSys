# Cycle 29 — Supply Chain Deepening (22 features)

**Cycle**: 29 of 30 (next = mandatory harden)
**Phase**: M — Module strengthening (Foundation SEALED)
**Focus**: Inventory & Supply Chain
**Scope**: Supply Chain module (28→50 features, MVM→Functional)

## Why

Supply Chain (28 features, 51/100 health) is the weakest half of the current focus module (Inventory is Complete at 746). Pushing it to Functional (50+) closes a real competitive gap — ERP market leaders (SAP, NetSuite, Odoo) all have rich SCM modules.

## Ordered Slice List

### Feature Set A: Vendor Returns API (5 features)
- `GET /supply-chain/vendor-returns` — list returns (paginated/sorted)
- `GET /supply-chain/vendor-returns/:id` — detail
- `POST /supply-chain/vendor-returns` — create
- `PATCH /supply-chain/vendor-returns/:id/status` — status update
- `GET /supply-chain/vendor-returns/stats` — summary stats

### Feature Set B: Cross-Docking API (6 features)
- `GET /supply-chain/cross-dock/stations` — list stations
- `POST /supply-chain/cross-dock/stations` — create station
- `GET /supply-chain/cross-dock/orders` — list orders
- `POST /supply-chain/cross-dock/orders` — create order
- `GET /supply-chain/cross-dock/orders/:id` — detail w/ events
- `PATCH /supply-chain/cross-dock/orders/:id/status` — update status

### Feature Set C: Route Optimization API (3 features)
- `POST /supply-chain/routes/optimize` — run optimization
- `POST /supply-chain/routes/solve` — solve with start/end
- `GET /supply-chain/routes/estimate` — distance/time estimate

### Feature Set D: Cross-Module Domain Events (2 features)
- Event handler: `asn.received → notification.send`
- Event handler: `shipment.delivered → notification.send`

### Feature Set E: Supply Chain Analytics API (5 features)
- `GET /supply-chain/analytics/dashboard` — KPI overview
- `GET /supply-chain/analytics/carrier-performance` — carrier scorecard
- `GET /supply-chain/analytics/on-time-delivery` — OTIF rate
- `GET /supply-chain/analytics/cost-analysis` — shipping cost trends
- `GET /supply-chain/analytics/lead-time` — lead time metrics

### Feature Set F: Frontend Updates (N/A features but wires new APIs)
- Update RoutesTab to wire to real backend
- Add vendor returns UI section to operations hub
- Wire analytics endpoints to supply-chain analytics page

### Duplicate-Check (grep against FEATURE_LEDGER)
None of these endpoint prefixes exist in the current supply-chain controller.

## Acceptance Criteria
1. All 22 new endpoints return correct tenant-scoped data
2. All endpoints have Zod validation and proper RBAC
3. `pnpm typecheck` clean (api + web + shared)
4. `pnpm architecture:check` clean (no cross-module imports)
5. Supply-chain feature count: 28 → 50+ in FEATURE_LEDGER

## Gate Tier
FAST (non-milestone — adding features to existing module, no new models/migrations)

## Rollback Note
All changes are additive (new controller methods, new service). Remove the new controller/service class and revert frontend changes.
