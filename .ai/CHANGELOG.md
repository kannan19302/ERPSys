# Changelog — Universal ERP System

> This file is maintained by AI agents and developers after completing work.
> Format: Newest entries at the top.

## [2026-07-03] E-Commerce Storefront: frontend — admin config/categories/listings, public store/cart/checkout (frontend-developer)

Frontend build for module #33, completing the vertical slice on top of the backend landed
earlier the same day (see the entry directly below). Wired end-to-end to the real, already-running
NestJS API — no mocked data.

- **Admin** `apps/web/app/(dashboard)/ecommerce/{page.tsx,categories/page.tsx,listings/page.tsx}` —
  storefront config (enable/disable, slug, currency, branding) with an empty-state "Get started" flow
  when `GET /ecommerce/config` returns `null`; a `DataTable`-driven Categories CRUD screen (Modal +
  ConfirmDialog); a Listings screen with a searchable Inventory-product picker, category assign,
  publish toggle, price override, and inline Publish/Unpublish action, all gated per-action by the
  registered `ecommerce.storefront.*`/`ecommerce.category.*`/`ecommerce.listing.*` permissions via
  `<ProtectedComponent>`. Fixed a pre-existing bug in these two files where `useToast()` was
  destructured as `{ showToast }` (an API that doesn't exist — the hook returns
  `{ toast, success, error, warning, info, dismiss }`) and toast `variant: 'danger'` was passed (the
  real `ToastVariant` union is `'success'|'error'|'warning'|'info'`); both pages now call
  `toast.success(...)`/`toast.error(...)` directly.
- **Public storefront** `apps/web/app/(storefront)/` — new route group, plain wrapper layout (no
  nested `<html>`/`<body>`, no dashboard chrome, no auth guard), `lib/storefront-api.ts` (unauthenticated
  fetch helper, deliberately omits the Bearer/CSRF headers `@/lib/api` attaches for the dashboard) and
  `lib/cart-session.ts` (localStorage-backed `sessionToken` persistence keyed
  `storefront_cart_{tenantSlug}`, with transparent create-on-404 re-issue). Pages: `store/[tenantSlug]`
  (branding, category filter, paginated product grid, "store not available" empty state on 404/disabled),
  `products/[listingId]` (detail + quantity + add-to-cart), `cart` (line items, quantity edit, remove,
  subtotal, empty-cart state), `checkout` (shipping form, order summary, mock "Test Payment" banner,
  inline decline-error with retry, order confirmation showing `orderNumber`/total, clears the cart
  token on success).
- **Bug found and fixed in the backend** (file lives outside the `ecommerce`/`sales`/`database`
  boundaries this task was scoped to, so treated as in-scope cross-cutting glue):
  `apps/api/src/common/middleware/csrf.middleware.ts` rejected every non-GET `/store/:tenantSlug/*`
  request with 403 `"Invalid or missing CSRF token"` — the global CSRF middleware's skip-list only
  exempted `/auth/login`, `/auth/register`, and paths containing `/public/`, but never the storefront's
  public routes, even though those routes are documented (Section 7 of
  `.ai/ECOMMERCE_MODULE_REQUIREMENTS.md`, and the `PublicTenantResolverGuard` header comment) as
  intentionally unauthenticated with no session/CSRF cookie ever issued to the anonymous customer.
  This 403'd cart creation, add-to-cart, quantity updates, and checkout end-to-end. Added a
  `path.startsWith('/api/v1/store/') || path.startsWith('/store/')` bypass alongside the existing
  `/public/` bypass, matching the same documented-exception pattern.
- Navigation: `apps/web/src/navigation/registry.tsx` (`SEGMENT_NAMES.ecommerce`/`.listings`,
  new `E-Commerce` app entry using the `Globe` icon aliased `StorefrontIcon` to avoid colliding with
  `Store` already used by POS) and `apps/web/src/navigation/moduleNav.tsx` (`/ecommerce/*` sidebar:
  Storefront Settings / Categories / Product Listings) were already registered from the prior session
  and verified correct — breadcrumbs render `Apps / E-Commerce / [Settings|Categories|Listings]`.
- **Verified in the browser end-to-end**: enabled the storefront (slug `system`), confirmed two
  pre-published listings (UltraBook Laptop Pro, 4K IPS Curved Monitor) render on `/store/system` with
  currency-formatted prices, category filter works, add-to-cart creates a `Cart`/`CartItem` via the
  public API, cart page shows correct quantity/line totals/subtotal, checkout with a valid shipping
  address returns `201` and an order confirmation with a real `orderNumber` (`ONL-...`), and the
  `sessionToken` is cleared from localStorage after conversion. Verified the decline path via a direct
  API call with `simulateDecline: true` — returns `400` with the exact `"Payment was declined. Please
  try again."` message, creates no `SalesOrder`, and leaves the cart `ACTIVE` for retry (matches
  Flow C's acceptance criteria and the `StorefrontOrderPayment` FK constraint's documented deviation).
- `pnpm --filter web typecheck` and `pnpm --filter @unerp/api typecheck` both clean.

## [2026-07-03] E-Commerce Storefront: backend API — admin CRUD, public storefront, mock checkout (backend-developer)

Backend build for module #33 (data layer landed earlier this session). See
`.ai/ECOMMERCE_MODULE_REQUIREMENTS.md` for the full MVP spec and
`.ai/MODULE_REGISTRY.md` #33 for the up-to-date module description.

- **New module** `apps/api/src/modules/ecommerce/`: `EcommerceAdminController`/`EcommerceAdminService`
  (JWT+RBAC, `ecommerce.*` permissions) for StorefrontConfig upsert, StorefrontCategory CRUD, and
  ProductListing CRUD — validates `productId` belongs to the tenant's own `Product` before linking,
  joins Product+Category for the admin list view, all mutations carry `@TrackChanges`+
  `ChangeHistoryInterceptor`.
- **New `PublicTenantResolverGuard`** (`guards/public-tenant-resolver.guard.ts`): resolves
  `:tenantSlug` → `StorefrontConfig.storeSlug` (404 if missing/disabled) and stamps a synthetic
  `request.user = { tenantId, userId: 'storefront-guest' }` so the existing global
  `TenantInterceptor`/`AsyncLocalStorage` tenant-scoping mechanism (`packages/database/src/tenant-context.ts`)
  activates unmodified — no parallel tenant-scoping mechanism was built.
- **New `EcommercePublicController`** (`store/:tenantSlug/*`) — deliberately unauthenticated, no
  `@Permissions()`, guarded only by `PublicTenantResolverGuard`. Covers public config/categories/
  products (published-only, paginated, category filter)/cart CRUD (server-persisted, price
  snapshotted at add-time, quantity merges on repeat add-to-cart)/checkout. This is the one
  documented exception to AGENTS.md Rule 15 — flagged in both `.ai/DATA_MODEL.md` §3.4 and
  code comments so it isn't mistaken for an oversight in review.
- **New `PaymentGatewayAdapter` interface + `MockPaymentGatewayService`**
  (`payments/`) — Stripe-PaymentIntent-shaped (`createIntent`/`confirmIntent`/`refund`), unmistakably
  labeled MOCK in class name, every log line, and `provider: 'mock_gateway'` on every record. Supports
  a `simulateDecline` test-mode lever for the decline-path acceptance test.
- **`apps/api/src/modules/sales/sales.service.ts`**: added `createConfirmedOnlineOrder()` — the
  sanctioned "variant entry point" called for by the spec, since `createSalesOrder` assumes an
  authenticated internal user/existing dashboard flow and never emits `sales.order.confirmed`
  synchronously even for auto-confirmed B2C/D2C orders (that event only fires later from
  `updateSalesOrderStatus`/`approveCreditHold`/`recordOrderPayment`). Extracted the shared
  transactional write into a private `persistSalesOrderTransaction()` helper reused by both methods,
  rather than duplicating the SalesOrder+SalesOrderItem creation logic.
- **Checkout flow** (`EcommerceCheckoutService`): validates the cart is `ACTIVE` and non-empty,
  finds-or-creates a guest `Customer` by tenant+email, runs the mock payment intent
  (create→confirm), and on success calls `SalesService.createConfirmedOnlineOrder()` (never a direct
  `prisma.salesOrder.create` in this module) to create a real `SalesOrder`
  (`salesChannel = 'ONLINE'`, `status = 'CONFIRMED'`, `paymentStatus = 'PAID'`) which synchronously
  emits `sales.order.confirmed` — triggering Finance's existing Invoice-creation listener with zero
  Finance-module changes. Records a `StorefrontOrderPayment` (`SUCCEEDED`) and marks the `Cart`
  `CONVERTED`. On decline: zero `SalesOrder`s created, cart stays `ACTIVE` for retry; the failed
  attempt is logged rather than persisted as a `StorefrontOrderPayment` row, because that model's
  `salesOrderId` FK is required/non-null and no order exists yet to attach it to — a deliberate,
  documented deviation from a literal "record a FAILED payment row on decline" reading.
- **Permissions**: added `ecommerce.storefront.{read,manage}`, `ecommerce.category.{read,create,update,delete}`,
  `ecommerce.listing.{read,create,update,delete}`, `ecommerce.order.read` to
  `packages/shared/src/permissions/registry.ts`.
- **Tests**: `apps/api/src/modules/ecommerce/tests/*.coverage.spec.ts` — 30 tests across admin CRUD
  (incl. cross-tenant Product rejection), public catalog/cart (incl. cross-tenant cart-isolation and
  published-only filtering), checkout (happy path, decline path, empty-cart, existing-vs-new
  Customer), the guard's 404 behavior, and a metadata-level proof the public controller carries
  neither `JwtAuthGuard`/`RbacGuard` nor any `@Permissions()`. `pnpm --filter @unerp/api typecheck`
  and the full `sales`+`ecommerce` Vitest suites pass (47 + 30 tests respectively, no regressions).
- **Not yet built** (next agents): frontend admin pages (`apps/web/app/(dashboard)/ecommerce/*`),
  public storefront pages (`apps/web/app/(storefront)/store/*`), Sales Orders list channel filter
  (Flow D), real payment gateway wiring.

## [2026-07-03] AI: dedicated admin console + tenant kill switch (fullstack-developer)

Additive vertical slice, scoped by product-manager this session. Gives tenant admins a single place to
turn the AI assistant off org-wide and control the local Ollama engine, without touching the floating
widget's chat logic or `/ai/converse`'s agent-loop internals.

- `apps/api/src/modules/ai/ai-config.service.ts` (new): `AiConfigService` — tenant-scoped kill switch backed
  by the generic `Setting` model (`key = 'ai.config'`, same JSON-blob pattern as `PlatformService`'s feature
  flags — no new migration). `getConfig()` returns `{ enabled, model, baseUrl }` where `model`/`baseUrl` are
  always live-read from `AiService` (env-configured, not persisted — no per-tenant model override yet).
  `setEnabled()` upserts just the `enabled` field. `isEnabled()` is a cheap boolean helper, defaulting to
  `true` when unset so existing tenants aren't silently broken.
- `apps/api/src/modules/ai/ai.controller.ts`: injected `AiConfigService`; every AI-invoking handler (`ask`,
  `summarize/:entityType/:entityId`, `draft-email`, `generate-form`, `generate-workflow`, `process-invoice`,
  `converse`) now calls a private `assertAiEnabled()` helper first, throwing a 503
  `ServiceUnavailableException` if the tenant disabled AI. `GET /ai/status` (unguarded by the check, since
  it's just a config read) now also returns `enabled` so any authenticated user (not just admins) can learn
  whether AI is on, needed by the floating widget.
- `apps/api/src/modules/ai/ai-admin.controller.ts` (new): `AiAdminController` at `admin/ai/*`, every route
  (including reads) gated by the new `ai.admin.manage` permission. `GET/POST admin/ai/config` for the kill
  switch; `GET/POST admin/ai/engine/{status,start,stop}` relocated from `OperationsController`'s
  `admin/operations/ai-engine/*` (removed there, along with its now-unused `OllamaProcessService`
  constructor param). `AdminModule` no longer imports `AiModule` — nothing else in it depended on AI.
- `packages/shared/src/permissions/registry.ts`: added `ai.admin.manage` permission.
- `apps/web/app/(dashboard)/admin/ai/page.tsx` (new): AI admin console — kill-switch card (toggle +
  disabled-state warning), read-only model/base-URL info card, and the engine start/stop/status card
  relocated from the admin dashboard sidebar (API paths updated to `admin/ai/engine/*`).
- `apps/web/app/(dashboard)/admin/page.tsx`: removed the AI Engine sidebar card and its state/handlers;
  replaced with an "AI Assistant" link-out card plus a matching `quickLinks` entry pointing to `/admin/ai`.
- `apps/web/app/(dashboard)/layout.tsx`: floating chat widget now fetches `/ai/status` on mount and hides
  itself entirely when `enabled === false`; fails open (widget stays visible) on fetch error so a transient
  outage never silently hides AI for everyone.

## [2026-07-02] AI: switched provider from Anthropic (paid API) to self-hosted Ollama (free, open-source) (backend-developer)

Deliberate cost decision: the AI copilot module was calling the paid Anthropic API for every chat/summarize/
classify/extract/agent call. The user chose to eliminate that cost entirely by running models locally via
Ollama (https://ollama.com) instead, accepting a quality/reliability tradeoff (local models are weaker and a
local server can be down) in exchange for zero per-token spend. This reverses the direction of the entry
directly below (which had *added* the Anthropic SDK); that work is fully superseded.

- `apps/api/package.json`: removed `@anthropic-ai/sdk` dependency; `pnpm install` re-run to prune it from
  `pnpm-lock.yaml`. No package replaces it — Ollama is called via plain `fetch()`, no SDK needed.
- `apps/api/src/modules/ai/ai.service.ts`: rewritten to call `POST {OLLAMA_BASE_URL}/api/chat` directly.
  `OLLAMA_BASE_URL` defaults to `http://localhost:11434`, `OLLAMA_MODEL` defaults to `llama3.1`. `isConfigured()`
  now always returns `true` (no API-key gate for a self-hosted server); connection/HTTP failures throw a
  friendly `BadRequestException` at request time instead of blocking startup. Public signatures unchanged:
  `chat()`, `summarize()`, `classify()`, `extractFields()`. Added `rawChat()` (returns the raw Ollama assistant
  message, including `tool_calls`, for callers that need function-calling) plus `getBaseUrl()`/`getDefaultModel()`,
  replacing the old `getClient()`/Anthropic-SDK-specific accessors. `classify`/`extractFields` now pass
  `format: 'json'` to request structured output per Ollama's documented JSON-mode option.
- `apps/api/src/modules/ai/ai-agent.service.ts`: tool-use loop rewritten from Anthropic's content-block format
  (`response.content` blocks, `stop_reason: 'tool_use'`, `tool_result` blocks) to Ollama's OpenAI-style function
  calling (`tools: [{type:'function', function:{...}}]` request field, `message.tool_calls` response field,
  `role: 'tool'` result messages). Same 6-iteration cap, same 6 tools (`query_erp_data`, `summarize_record`,
  `draft_email`, `generate_form`, `generate_workflow`, `process_invoice_text`), same `executeTool()` business
  logic delegating 1:1 to tenant-scoped `AiCopilotService` methods — tenant scoping unchanged. Same public
  `converse(tenantId, userId, history, context) -> { reply, actions }` signature.
- `apps/api/src/modules/ai/ai-copilot.service.ts`: only change is the not-configured fallback message in
  `askData()` no longer references `ANTHROPIC_API_KEY`.
- `.env.example`: replaced `ANTHROPIC_API_KEY`/`AI_MODEL` with `OLLAMA_BASE_URL`/`OLLAMA_MODEL`, with a comment
  that Ollama must be installed and the model pulled (`ollama pull llama3.1`) before the API can use AI features.
- Tests: `apps/api/src/modules/ai/tests/ai-agent.service.spec.ts` and `ai.service.coverage.spec.ts` rewritten to
  mock `global.fetch` against the Ollama endpoint instead of the Anthropic SDK client — covering unreachable-
  server short-circuit, non-OK HTTP status, and a full tool-call → tool-result → final-answer loop. All 4 spec
  files under `apps/api/src/modules/ai/tests/` pass (22 tests): `pnpm --filter @unerp/api test -- src/modules/ai`.
  `pnpm --filter @unerp/api typecheck` passes clean.
- **Known gap, explicitly out of scope for this change:** `apps/api/src/modules/workflow/workflow-engine.service.ts`
  and `apps/api/src/modules/builder/web-studio.service.ts` both call `https://api.anthropic.com/v1/messages`
  directly via raw `fetch`, bypassing `AiService` entirely (also a cross-module architecture smell — they should
  go through `AiService` rather than hardcoding a provider). They still incur Anthropic API cost after this
  change. Flagged for a follow-up task; not touched here per the task's explicit scope.
- Not touched (per task spec): `apps/web/app/(dashboard)/layout.tsx`, the separate `/ai` full page, and the
  Studio-only `AiCopilotSidebar` — the frontend only consumes `{ reply, actions }` JSON and needed no changes.

## [2026-07-02] AI: real Anthropic SDK integration + tool-use agentic loop wired to the global Copilot widget (fullstack-developer)

Replaced the raw `fetch()` call in `AiService.chat()` with the official `@anthropic-ai/sdk` client, and gave the
global floating "AI Copilot" widget a real backend instead of canned keyword-matched replies.

- `apps/api/package.json`: added `@anthropic-ai/sdk` (`^0.32.1`).
- `apps/api/src/modules/ai/ai.service.ts`: `chat()` now calls `client.messages.create(...)` via the SDK instead of
  raw `fetch`; same public method signature and return shape, so `AiCopilotService` needed no changes. Added
  `getClient(): Anthropic` (throws `BadRequestException` if unconfigured) and `getDefaultModel()` as the single
  source of truth for API key/model config, for `AiAgentService` to reuse. Default model bumped to
  `claude-sonnet-5` (still overridable via `AI_MODEL`).
- `apps/api/src/modules/ai/ai-agent.service.ts` (new): `AiAgentService.converse()` runs a manual Anthropic
  tool-use loop (capped at 6 iterations) exposing `query_erp_data`, `summarize_record`, `draft_email`,
  `generate_form`, `generate_workflow`, `process_invoice_text` as tools that delegate 1:1 to the existing
  tenant-scoped `AiCopilotService` methods. Unknown tool names and tool execution errors are fed back to the
  model as `tool_result`/`is_error` blocks instead of crashing the request. Returns `{ reply, actions }`.
- `apps/api/src/modules/ai/ai.controller.ts` / `ai.module.ts`: new `POST /ai/converse` endpoint
  (`ai.create` permission, same guard stack as siblings); `AiAgentService` registered as a provider/export.
- `apps/api/src/modules/ai/tests/ai-agent.service.spec.ts` (new): not-configured short-circuit (no SDK call),
  and a happy-path tool_use → end_turn loop asserting `actions` and `reply`. All 4 spec files in
  `apps/api/src/modules/ai/tests/` pass (17 tests).
- `apps/web/app/(dashboard)/layout.tsx`: `handleChatSubmit` is now async and calls `POST /api/v1/ai/converse`
  with the full message history and `{ context: { path: pathname } }`, using the same
  `Authorization: Bearer <token>` + `credentials: 'include'` pattern used elsewhere in this file. Removed the
  entire fake `query.includes(...)` keyword-branching block and `setTimeout` delay. Errors show a friendly
  inline bubble; `chatTyping` is always reset in a `finally`. No JSX/styling changes.
- `.ai/MODULE_REGISTRY.md`: row 32 (AI module) updated to describe the real SDK integration and `AiAgentService`.

Left out of scope (per task spec): the separate `/ai` full page, Studio's `AiCopilotSidebar`, streaming/SSE,
and any new DB tables/permissions.

## [2026-07-02] Admin P0-2 + P1-1: Real automation-rule execution engine; honest backup labeling + real BullMQ↔BackgroundJob wiring (backend-developer)

Closed the two confirmed gaps in `.ai/ADMIN_MODULE_COMPLETION_REQUIREMENTS.md` (P0-2, P1-1) and applied the RBAC
boundary fix from `.ai/ADMIN_SECURITY_AUDIT.md` Section 3. P0-1 (RBAC decorator-stacking) was already fixed in a
prior pass and untouched here.

**P0-2 — Automation Rules real execution engine:**
- Extracted the condition-evaluation logic previously private to `AutomationRulesService.testRule` into a shared
  `static evaluateConditions()` method — both `testRule` (sample data) and the new real-event engine reuse it,
  no duplication.
- Added `apps/api/src/modules/admin/automation-rule-engine.service.ts`: real `@OnEvent` listeners for the domain
  events already emitted elsewhere (confirmed via grep, no new events invented) — `sales.order.confirmed`,
  `sales.delivery.created`, `sales.return.created`, `sales.return.processed`, `procurement.receipt.created`,
  `procurement.return.created`, `finance.invoice.created`, `finance.invoice.sent`, `finance.payment.received`,
  `hr.employee.onboarded`. On each event: loads ACTIVE `AutomationRule` rows for that tenant + trigger (DRAFT/
  PAUSED rules never load, so they're inert by design), evaluates conditions, and for matching rules executes
  `notify`/`notification` actions (emits `notification.send`, consumed by the existing
  `NotificationDeliveryService`/`NotificationsGateway` — no cross-module import) and `email` actions (real
  BullMQ job via the existing `email` queue, tracked through the new `BackgroundJob` correlation helper). Other
  action types are recorded as not-executed rather than silently dropped (P2 follow-up). Records
  `AutomationRuleExecution` rows with `status: 'SUCCESS'` / `'SKIPPED'` / `'FAILED'` for real triggers, leaving
  `testRule`'s `'TEST'` status path untouched. Registered in `admin.module.ts`.
- Added `apps/api/src/modules/admin/tests/automation-rule-engine.service.spec.ts`: emits real domain events
  through a real `EventEmitter2` and asserts real side effects (notification.send emitted with correct payload,
  execution rows created with the right status, BullMQ `queue.add` called for email actions, DRAFT/PAUSED
  exclusion via the `status: 'ACTIVE'` query filter, tenant isolation, missing-tenantId guard) — not just another
  `testRule` sample-data call.

**P1-1 — Operations: honest backup labeling + real BullMQ↔BackgroundJob wiring:**
- `OperationsService.getBackups`/`createBackup` now stamp every backup record (including the two seeded
  fallback rows, backfilled on read) with `source: 'SIMULATED'`. No real `pg_dump` runs — that requires
  devops-engineer sign-off on shelling out from the API container, which this pass doesn't have; per the task's
  explicit guidance, relabeling honestly was chosen over building a false sense of real DR coverage. Frontend
  copy update is a separate, already-spec'd pass (`.ai/ADMIN_UI_ACCESS_CONTROL_SPEC.md`).
- Added `apps/api/src/common/queues/job-tracking.util.ts`: `enqueueTrackedJob()` adds a job to a real BullMQ
  queue and creates a correlated `BackgroundJob` row with `bullJobId` set; `syncBackgroundJobStatus()` updates
  that row by `queueName` + `bullJobId` from a processor's lifecycle hooks (safe no-op if no row correlates).
- `EmailProcessor`/`ExportProcessor` (`apps/api/src/common/queues/*.processor.ts`) now implement
  `@OnWorkerEvent('active'|'completed'|'failed')` to keep `BackgroundJob` rows in sync with real BullMQ state —
  previously these were two fully unconnected systems (confirmed zero references from `common/queues/*` to the
  `BackgroundJob` table).
- `OperationsService.retryJobs` now actually re-enqueues each FAILED `BackgroundJob` row into the correct live
  BullMQ `Queue` instance (by `queueName`, injected via `@InjectQueue`, all `@Optional()` so the service is still
  constructible without a DI container in tests) using its stored `payload`/`jobType`, and re-links the row to
  the new `bullJobId`. Rows whose `queueName` has no live processor (e.g. legacy `scheduled-*` rows from
  `triggerTask` — a P2 item) are left `FAILED` and counted as `skippedCount` rather than silently faked.
- RBAC boundary fix (security audit Section 3): `admin/operations/backups` (GET) and
  `admin/operations/backups/create` (POST) now require the new `system.operations.backup` permission (never
  seeded to a tenant role) and `@SkipTenantScope()`, following the `SuperAdminController`/`system.tenant.*`
  precedent — a Postgres backup is instance-wide, so the old tenant-scoped `admin.operations.*` gate would have
  let any Tenant Admin trigger what is effectively a platform-wide operation once a real `pg_dump` lands. Every
  other `admin/operations/*` endpoint remains tenant-scoped as before. Registered
  `system.operations.backup` in `packages/shared/src/permissions/registry.ts`.
- Extended `apps/api/src/modules/admin/tests/operations.service.spec.ts` with real re-enqueue assertions
  (BullMQ `queue.add` called with the row's `jobType`/`payload`/`priority`, `BackgroundJob.update` called with
  the new `bullJobId`), a skip-path test for queues with no live instance, and `source: 'SIMULATED'` coverage
  for both `createBackup` and `getBackups` (including backfill of pre-existing rows). Added
  `apps/api/src/common/queues/tests/job-tracking.util.spec.ts` for the new helper.
- Schema: `BackgroundJob.bullJobId` (nullable, indexed with `queueName`) was already added by a prior
  data-architect pass (migration `20260702130000_admin_background_job_bull_correlation`); applied it to the dev
  DB via `prisma migrate deploy` (idempotent SQL) and regenerated the Prisma client — no new migration needed.
- Verified: `apps/api` full vitest suite (133 files / 1787 tests) green; `pnpm turbo run typecheck` clean for
  `@unerp/api`, `@unerp/shared`, `@unerp/database`.
- Deferred (explicitly out of scope, matching the task's stated boundaries): real `pg_dump`-backed backup/restore
  pipeline (needs devops-engineer sign-off); `payroll`/`data-import` queue processors (queues are registered but
  no processor exists for either — adding one is a separate, larger unit of work, not part of P1-1's "connect
  the 4 existing queues" scope); scheduled-task → real handler dispatch (P2, tracked separately); action types
  beyond `notify`/`email` for automation rules (webhooks, cross-module writes — P2).

## [2026-07-02] Admin P0-1: Fixed dead fine-grained RBAC across all 19 Admin controllers (backend-developer)

Fixed the confirmed P0 security bug documented in `.ai/ADMIN_MODULE_COMPLETION_REQUIREMENTS.md` (P0-1) and
`.ai/ADMIN_SECURITY_AUDIT.md`: every admin controller handler stacked two `@Permissions(...)` decorators
(coarse + fine-grained). Since `Permissions()` is `SetMetadata` on a single reflect-metadata key and
`RbacGuard` reads it via `getAllAndOverride` (first-defined-wins, no merge), only the physically topmost
(coarse) decorator was ever enforced — the fine-grained one was silently dead. Worst instance:
`super-admin.controller.ts` — any role with plain `admin.read` could call `GET /super-admin/tenants` and
enumerate every tenant on the platform.

- Collapsed all 180 stacked pairs (360 decorators -> 180 single `@Permissions(fine)` calls) across all 19
  `apps/api/src/modules/admin/*.controller.ts` files. No cross-module mismatches found (unlike the CRM
  example in the audit) — every fine-grained code was already correctly scoped to admin/system.
- Registered 32 missing fine-grained codes in `packages/shared/src/permissions/registry.ts`
  (`admin.security.*`, `admin.user-group.*`, `admin.automation.*`, `admin.platform.*`, `admin.operations.*`,
  `admin.org-hierarchy.*`, `admin.bulk-ops.*`, `admin.custom-fields.*`, `admin.data-quality.*`,
  `admin.delegations.*`, `admin.recycle-bin.*`, `admin.subscription.*`, `admin.alerts.*`). `system.tenant.*`
  and other `system.*` codes already existed. Some controllers (gdpr, import-export, announcements,
  activity-feed, marketplace) intentionally reuse existing `admin.setting.*` / `admin.platform.*` codes
  rather than declaring new ones — verified as intentional, not drift.
- Added `apps/api/src/modules/admin/tests/permissions-drift.spec.ts` (US-P0-1b): parses all admin controller
  source for `@Permissions(...)` literals, fails on any remaining stacked pair, fails on any code missing
  from the registry, and diagnostically reports (non-failing) orphaned admin/system registry entries.
  Verified red before the registry fix, green after.
- Seed data: no changes needed. The only seeded role touching admin permissions (`ADMIN` in
  `packages/database/prisma/seed.ts`) uses the wildcard `'admin.*'`, which already matches all newly-live
  fine-grained `admin.x.y` codes per `hasPermission`'s prefix-match rule — non-breaking.
- Verified: full `@unerp/api` vitest suite (131 files / 1772 tests) green; `pnpm turbo run typecheck`
  (forced, no cache) clean for `@unerp/api` and dependencies.
- Out of scope (per task): the same bug in the other 54 non-admin controller files (1,024 endpoints total
  per the audit), P0-2 (automation engine runtime), P1-1 (backup/job queue reality).

## [2026-07-02] Connect: UAT Sign-Off — Teams/GChat Parity Pass ACCEPTED (business-analyst-uat)

Ran a full UAT pass covering both the QA-validated feature set (file attachments, WebSocket real-time,
search, channel management/roles, notification levels, forwarding, emoji picker) and the newer additions
from the same-day follow-up sprint (seen-by read receipts, DND-aware notification suppression, link-preview
unfurling, workspace directory search, Saved Messages). Full script and evidence in
`.ai/CONNECT_UAT_SIGNOFF.md`.

**Decision: UAT ACCEPTED — Connect parity pass is ready for release.**

### Independently re-verified (not just trusted from prior reports)
- QA's two closed P0s (channel-owner seeding; `PermissionContext` provider wiring) re-spot-checked live
  against the current dev DB — both still hold.
- Re-ran the full communication+notifications automated suite myself: 9 files / 85 tests, all passing.
  Re-ran `tsc --noEmit` for `apps/api`: clean.
- Live end-to-end walkthrough on a freshly created channel: create → OWNER seeded → rename → archive, all
  as the owner, no 403s.
- Live-verified notification-level picker, link-preview unfurling (including graceful failure on a
  malformed URL), forwarded-message marker persistence, seen-by read-receipts endpoint (membership gating,
  self-exclusion, ≤8-member bound).

### New defect found during this pass (not caught by requirements doc or QA report)
- **DND-aware notification suppression (US-B6) does not actually apply to Connect `@mention` notifications.**
  `NotificationDeliveryService`'s DND-suppression logic is correct and unit-tested in isolation, but
  `CommunicationService.notifyMentions` writes notifications directly via `prisma.notification.create` and
  never emits the `notification.send` event that logic listens for — confirmed by code read and by grepping
  every emitter of that event across `apps/api/src` (5 files, `communication.service.ts` not among them).
  Practical impact is low today (Connect mentions are in-app-only regardless of DND, so nothing is actively
  un-suppressed), but the acceptance criterion as written is not demonstrable. Routed to `backend-developer`
  as a non-blocking follow-up — not treated as a release blocker for this sign-off.

### Other findings, routed to their owners (not blocking)
- Link-preview endpoint (`GET /communication/link-preview`) performs a server-side fetch of a fully
  user-supplied URL with no SSRF guard — routed to `security-auditor`.
- Directory designation/department enrichment (US-D1) is correct in code but cannot be demonstrated with
  real data — the seeded dev DB has zero `Employee` rows linked to a `User.id`. Routed to whoever owns
  `packages/database/prisma/seed.ts` as a fixture-quality follow-up.
- `PermissionContext` provider's actual rendered-browser confirmation remains outstanding (QA's own
  carried-over recommendation) — no browser automation was run in this pass either, per `AGENTS.md` rule
  #20.

## [2026-07-02] Connect: Seen-by List, DND Suppression, Link Previews, Saved Messages, & Directory Search (US-B4, US-B6, US-C2, US-D1, US-D2)

Completed the remaining gaps in the Connect module as specified in `.ai/CONNECT_MODULE_REQUIREMENTS.md`.

### Added — Backend (Communication module)
- **Seen-by read receipts (US-B4)**: Exposed `GET /communication/messages/:id/read-receipts` to fetch which small group/DM members have read a specific message. Gated to groups <= 8 members to respect performance limits.
- **Link Previews (US-C2)**: Exposed `GET /communication/link-preview` to perform server-side fetching and parsing of OpenGraph metadata with an AbortSignal timeout and caching.
- **DND Notification Suppression (US-B6)**: Updated `NotificationDeliveryService` event handler to check recipient presence status. Suppresses external push/email notification delivery if the status is `DND`, while keeping the in-app notification row.
- **Directory Search Enrichment (US-D1)**: Enriched `getDirectory` database query to join `Employee` and `Department` tables to include job designation/title and department name.

### Added — Frontend (Next.js web app)
- **Workspace Directory Modal (US-D1)**: Added Workspace Directory search modal accessible via the sidebar status footer. Supports filtering by name, email, department, and designation. Added Message button shortcut to instantly start a DM.
- **Profile Card Enrichment**: Updated user profiles and profile cards to render designation/title and department name resolved from the directory API.
- **Saved Messages Panel (US-D2)**: Built right-side panel listing all bookmarked messages, complete with "Go to message" navigation jump/feed-flash, and "Unsave" button. Wired saved messages toggle button in the header.
- **Seen-by Tooltip (US-B4)**: Integrated Seen receipts tooltip next to reactions on message rows, fetching read status dynamically on-hover.
- **Link Previews (US-C2)**: Integrated OpenGraph preview cards rendering below message texts when urls are detected.

### Tests
- Added `apps/api/src/modules/notifications/tests/notification-delivery.service.spec.ts` asserting DND notification suppression.
- Added test blocks in `communication.attachments-and-realtime.spec.ts` asserting `getMessageReadReceipts` and `getLinkPreview`.
- Fixed mock signatures in `communication.service.spec.ts`.

## [2026-07-02] Connect: Real File Attachments + WebSocket Real-Time Wiring (US-A1/A2/A3/A4/A5)

Implemented the two P0 backend gaps called out in `.ai/CONNECT_MODULE_REQUIREMENTS.md` section 1.2
("exists but is fake/broken"): attachments that were never actually uploaded anywhere, and a real
Socket.IO gateway (`notifications.gateway.ts`) that Connect never used.

### Added — Backend (Communication module)
- **Real file attachments (US-A1/US-A2)**: `POST /communication/channels/:channelId/attachments`
  (multipart, `FileInterceptor('file')`, same pattern as `drive.controller.ts`). Validates the
  channel is tenant-scoped, enforces a 25MB cap (Drive's own `createDocument` has no size/type
  limits to "reuse" — verified by reading `documents.service.ts`, so the cap is new, not reused),
  then calls Drive's `DocumentsService.createDocument(...)` — a public service method, not Drive's
  S3 client/repository directly — to store the file durably under `drive/<tenantId>/<documentId>/...`
  in MinIO/S3. Returns `{ documentId, attachment: { id, name, size, mime, url } }` where `url` is
  Drive's existing `/drive/documents/versions/:versionId/download` route, to be stored in the
  message's existing `attachments` Json field — replacing the client's `URL.createObjectURL(f)`
  blob URLs entirely (frontend wiring is a separate frontend-developer task).
- **WebSocket wiring (US-A3/US-A4/US-A5)**: `NotificationsGateway` gained two server-initiated
  broadcast methods — `broadcastChatMessage(channelId, payload)` (emits `chat:message` into
  `channel:<id>`) and `broadcastPresenceUpdate(tenantId, payload)` (emits `presence` into
  `tenant:<id>`). `CommunicationService.createMessage` now calls `broadcastChatMessage` with the
  fully persisted message (real id/createdAt from Postgres, not an ephemeral guess) immediately
  after `prisma.message.create`. `CommunicationService.setPresence` now calls
  `broadcastPresenceUpdate` after `prisma.userPresence.upsert`. The existing `typing`
  `@SubscribeMessage` handler was confirmed correct as-is (uses `client.to(...)`, which already
  excludes the sender) — no change needed there, only documented. Clients without a live socket
  keep working via the existing polling endpoints (`GET .../messages` every 5s, presence every
  15s) — no breaking change to the polling path.
- **Cross-module wiring**: `CommunicationModule` now imports `DocumentsModule` and
  `NotificationsModule` and injects `DocumentsService`/`NotificationsGateway` into
  `CommunicationService`'s constructor. This follows the precedent already established elsewhere
  in this codebase (`ai.module.ts` imports `ReportingModule`; `builder.module.ts` imports
  `AiModule`) for shared-infrastructure services, not a domain-boundary violation — per
  `.ai/CONNECT_MODULE_REQUIREMENTS.md` section 4: "the gateway wiring in Phase A is a legitimate
  exception since notifications.gateway.ts is explicitly the shared real-time transport."
- **RBAC**: registered `communication.message-attachment.upload` permission, applied via
  `@Permissions('communication.message-attachment.upload')` on the new endpoint.

### Tests
- `apps/api/src/modules/communication/tests/communication.attachments-and-realtime.spec.ts` (new,
  11 tests): tenant isolation on upload, missing-file rejection, size-cap rejection before Drive is
  ever called, durable documentId/download-URL assertion (never a blob: URL), gateway broadcast
  triggered with the real persisted message id/timestamp on `createMessage`, no broadcast on
  validation failure, presence broadcast on `setPresence`.
- `apps/api/src/modules/notifications/tests/notifications.gateway.spec.ts` (new, 4 tests):
  `broadcastChatMessage`/`broadcastPresenceUpdate` target the correct Socket.IO rooms, defensive
  no-throw when `server` isn't yet attached, `typing` handler excludes the sender.
- Updated existing `CommunicationService` constructor call sites in
  `communication.service.spec.ts`, `communication.service.coverage.spec.ts`, and
  `communication.channel-management.spec.ts` to pass mocked `DocumentsService`/
  `NotificationsGateway` args (constructor signature changed).

### Verified
- `pnpm --filter api typecheck` — clean, no errors.
- `communication` + `notifications` module test suites: 8 files, 76 tests, all passing.
- `documents` + `admin` module suites re-run as a regression check (cross-module import risk):
  25 files, 237 tests, all passing.

### Fixed — registry code drift (found during verification of this pass)
- The four "legacy coarse" `communication.*` registry entries were declared via the `p()` helper,
  which always emits a 3-segment `module.resource.action` code — so they registered as
  `communication.general.read/create/update/delete`. The controller's actual runtime strings for
  these routes are the bare 2-segment `communication.read/create/update/delete` (confirmed by
  grepping every `@Permissions(...)` call in `communication.controller.ts`), so the registered
  codes never matched and these four permissions were still invisible to the Access Control admin
  UI despite "existing" in the file. Replaced with literal `PermissionDefinition` objects whose
  `code` exactly matches the runtime string. Verified zero drift: all 18 distinct
  `@Permissions(...)` strings used in the controller now have an exact-match registry entry.

### Note on scope
This same working tree already contained a prior, separately-changelogged pass (see the entry
immediately below) implementing Phase B (channel management/roles) and message search — that work
was not part of this task and is documented separately.

## [2026-07-02] Connect: Message Search + Channel Management & Roles (US-A6, US-B1/B2/B3)

Implemented the message-search and channel/space-management-with-roles phases from
`.ai/CONNECT_MODULE_REQUIREMENTS.md` in `apps/api/src/modules/communication`. Schema additions
(`ChannelMember.role`, `ChannelMember.notifyLevel`, `Channel.archived`, `pg_trgm` GIN index on
`messages.content`) were applied by a data-architect pass ahead of/during this work.

### Added — Backend (Communication module)
- **Message search**: `GET /communication/search?q=...` — tenant-scoped and membership-scoped
  (only searches channels/DMs the requester belongs to), via `prisma.$queryRaw` `ILIKE` against
  `messages.content` (accelerated by `idx_messages_content_trgm`), excludes soft-deleted messages,
  returns channel name, author, timestamp, and a highlighted snippet for jump-to-message.
- **Channel rename/archive**: `PATCH /communication/channels/:id` — rename gated to OWNER/ADMIN,
  archive gated to OWNER only; archived channels are excluded from the default workspace channel
  list and the browse/join discovery list but remain readable via history.
- **Member management**: `POST /communication/channels/:id/members` and
  `DELETE /communication/channels/:id/members/:userId` — gated to OWNER/ADMIN, post a SYSTEM
  message announcing join/departure, retain full message history for remaining members, and block
  removing the channel OWNER.
- **Channel discovery**: `GET /communication/channels/browse` (PUBLIC, non-archived, not-yet-joined
  channels with topic + member count) and `POST /communication/channels/:id/join` (direct join, no
  invite needed, for PUBLIC channels only).
- **Schema**: `Channel.archived` (Boolean, default false) added additively via migration
  `20260702002940_communication_channel_archived`.
- **RBAC**: registered `communication.channel.manage`, `communication.channel.join`,
  `communication.channel.member.manage`, and `communication.message.search` in
  `packages/shared/src/permissions/registry.ts`, alongside the module's existing
  `communication.channel.*`/`communication.message.*`/`communication.notification.*`/
  `communication.email-template.*` permissions (previously unregistered — now all visible/assignable
  in the Access Control admin UI).
- **Change history**: `@TrackChanges('Channel')` + `ChangeHistoryInterceptor` on rename/archive and
  member add/remove endpoints.

### Tests
- `apps/api/src/modules/communication/tests/communication.channel-management.spec.ts` (14 tests):
  tenant isolation for updateChannel/search, RBAC gating (MEMBER blocked, ADMIN vs OWNER-only
  archive), member add/remove with SYSTEM announcements and owner-removal protection, browse/join
  discovery scoping.
- Fixed a pre-existing constructor-signature break in `communication.service.spec.ts` caused by
  `CommunicationService` picking up new constructor dependencies (`DocumentsService`,
  `NotificationsGateway`) from concurrent attachment-upload work in the same module.

### Verified
- `pnpm --filter api exec vitest run` — 127 test files, 1748 tests passing.
- `pnpm --filter api typecheck` — clean, exit 0.

## [2026-07-01] Layout Navbar Revamp & Floating AI Chatbot Companion

Overhauled the main ERP top header navigation panel with modern, premium glassmorphism styling and integrated a floating AI chatbot companion at the bottom of all dashboard pages.

### Added — Navigation & Layout UI/UX
- **Glassmorphic Top Header**: Replaced the solid white header in `layout.tsx` with a translucent glass background (`rgba(255, 255, 255, 0.72)` in light theme, `rgba(24, 25, 32, 0.72)` in dark theme) paired with an active blur overlay.
- **Commander Search Bar**: Styled the search input with hover glows, focus scale transitions, and custom keyboard shortcut pills (`⌘K` / `Ctrl+K`).
- **Status Indicator Badges**: Added JIT active session green ring badges to the revamped user profile avatar button.
- **Floating AI Chatbot Copilot**: Implemented a floating Sparkles button at the bottom-right of all dashboard layouts. Clicking it toggles a translucent chat box that responds contextually to queries regarding ledgers, inventory, active directories, and workflows.

## [2026-07-01] Authentication, Registration & Password Recovery System Overhaul

Overhauled user authentication and onboarding pages, introducing a multi-step registration wizard, a demo user login bypass modal, OIDC/SAML SSO configurations checkers, and a signed JWT-based secure password recovery flow.

### Added — Authentication & Onboarding
- **Multi-Step Onboarding Wizard**: Converted `/register` page into a 3-step setup form (Step 1: Org profile, Step 2: System Admin profile + password strength meter, Step 3: Interactive terminal progress logs seeding simulated partitioned resources) with automatic silent background log in.
- **Biometric & SSO Checkers**: Integrated automatic query to detect OIDC/SAML tenant-level SSO configs on `/login`, dynamically toggling authentication flows.
- **One-Click Demo Personas Shortcut**: Added a popover drawer on `/login` to log in instantly as pre-seeded roles (Super Admin, HR, Finance, Guest/Viewer) provisioning database tables and users JIT on demand.
- **Secure Password Reset Portal**: Created `/reset-password` page wrapped in a Next.js 15 compliant `<Suspense>` wrapper to prevent build time optimizations errors.
- **Signed Recovery JWTs Backend**: Implemented secure recovery token signed JWT generation and validation endpoints (`POST /auth/forgot-password` and `POST /auth/reset-password`) in NestJS `auth.service.ts` and `auth.controller.ts`.

### Verified
- Zero linting or type-checking errors across `@unerp/web` and `@unerp/api`.

## [2026-07-01] Public Landing Page UI/UX Revamp & Procurement Controller Fix

Revamped the public landing page with modern interactive capabilities and fixed a NestJS dependency injection startup crash in the Procurement module.

### Added — Landing Page Overhaul
- **Interactive Dashboard Playground Console**: Replaced the static hero preview with a fully functional 6-tab playground mock panel (Dashboard, Finance, HR, CRM, Inventory, Builder Studio) showcasing interactive states, client actions, list additions, and node simulation animations.
- **Dynamic Theme Toggle**: Implemented a sun/moon switch in the header to switch between light and dark modes, persisted in `localStorage`.
- **Floating Glassmorphism Navbar**: Restructured navbar to a floating rounded glassmorphism bar with blur transitions upon scrolling.
- **Interactive Costing Calculator**: Added a monthly/annual toggle and a team size slider that dynamically updates estimates in real time.

### Fixed — NestJS API Boot Crash
- **Procurement Dependency Injection**: Added `VendorPortalService` to the `providers` and `exports` list of `ProcurementModule`, resolving a bootstrap DI crash.

---

## [2026-07-01] AI Copilot NL-to-report fix + Project revenue recognition + resource-workload date-scoping fix

Closing out the remaining tractable items from the product-manager gap analysis (schema-dependent
items — CRM ticketing/SLA, supplier portal, e-auction, POS omnichannel — remain blocked: no live
Postgres is available in this environment to generate a real Prisma migration).

### Fixed — AI Copilot (`AiCopilotService.askData`)
- The existing "ask your data" endpoint (`POST /ai/ask`) asked the LLM to freeform "answer" a
  business question from a hardcoded schema **description only** — it never executed a query
  against the database. Every answer was a plausible-sounding hallucination (e.g. a fabricated
  AR balance for "what's our AR total?"). Rewired it to: (1) ask the model to choose a structured
  query against the real reporting-engine semantic layer, (2) actually execute that query
  (tenant-scoped, field-allowlisted by `ReportingEngineService.executeQuery`), (3) narrate the
  *real* result. Refuses ungrounded answers if the model names an entity outside the semantic
  layer or returns non-JSON, instead of guessing. `AiModule` now imports `ReportingModule`.
  Added a natural-language "Ask in Plain English" panel to `analytics/query/page.tsx` (the
  existing Visual Query Builder) so this is actually reachable in the product. 4 new tests
  proving the answer is grounded in real `executeQuery` output, not the model's imagination.
- Flagged (not fixed, out of scope for this pass) two more instances of the same "fabricated
  fallback data" anti-pattern found while investigating: `analytics/query/page.tsx`'s own
  `runQuery()` (wrong API URL, `Math.random()` fallback data on failure) and
  `procurement/vendors/[id]/scorecard/page.tsx` (hardcoded demo vendor data on failure).

### Added — Project revenue recognition
- Verified Resource Capacity Planning was already real (`GET /projects/resource-workload` +
  `projects/workloads` page) — no work needed. Project revenue recognition was genuinely
  absent. Built it using **only existing fields** (`Project.budget/startDate/endDate/status`) —
  no schema change needed: `ProjectsService.getRevenueRecognition` computes time-based
  percentage-of-completion revenue recognition (elapsed/total duration × budget, clamped, 100%
  for COMPLETED, 0% for CANCELLED, an explicit "missing data" reason instead of a fabricated
  number for unscoped projects). New endpoint `GET /projects/revenue-recognition` and page
  `apps/web/app/(dashboard)/projects/revenue-recognition/page.tsx`, registered in nav +
  breadcrumbs. 5 new tests.

### Fixed — Resource workload utilization (regression found while verifying it was "already real")
- `ProjectsService.getResourceWorkload` summed an employee's **entire history** of timesheets
  with no date filter, then divided that all-time total by a single week's 40-hour capacity —
  anyone with more than ~1 week of logged hours showed nonsensical utilization (1000%+ for six
  months of normal timesheets). Scoped to a real 7-day window (defaults to the current week, or
  an explicit `?weekStart=` query param). 2 new regression tests, including one simulating
  exactly the six-months-of-history scenario that broke before.

### Verified
- 381/381 API tests pass across all touched modules. Full API + web typecheck clean, ESLint
  clean on touched frontend files.

## [2026-07-01] Finite-capacity scheduling (APS) frontend

`SchedulingController`/`SchedulingService` (`apps/api/src/modules/manufacturing/scheduling.*`)
already implemented real finite-capacity APS — sequencing work orders against actual
workstation availability (forward/backward from a start date) and BOM cost rollups — but had
no frontend page, so it was unreachable from the product. Built
`apps/web/app/(dashboard)/manufacturing/scheduling/page.tsx`: run scheduling with a forward/
backward algorithm selector, a KPI summary (scheduled/unscheduled/total operations), the
resulting schedule table (work order → workstation → start/end), an unscheduled-orders callout,
and a BOM cost lookup tool. Registered the route in the manufacturing sidebar nav
(`apps/web/src/navigation/moduleNav.tsx`) and breadcrumb segment map
(`apps/web/src/navigation/registry.tsx`) per the mandatory breadcrumb-navigation rule.

Note: schema changes (e.g. a CRM Case/ticketing model, project resource-allocation model) were
deliberately deferred this session — no live Postgres instance was available to generate a real
Prisma migration, and hand-editing migration files is a hard "never do this" rule. Building the
backend code against a schema change that can't be migrated/verified would be a half-finished,
unverifiable deliverable. Flagged as the next work item once a dev DB is available.

### Verified
- Full API + web typecheck clean; ESLint clean on touched frontend files.

## [2026-07-01] RBAC permission-matrix hardening + real Consolidation backend

Continuing the product-manager gap-closure pass. Verified several PM-flagged items were
already real (Rolling Forecast/xP&A is wired into the budgeting page; Succession Planning
has full backend+frontend) — no work needed there. Built/fixed two genuine gaps:

### Fixed — RBAC (`RbacGuard`, `hasPermission`)
- `hasPermission` (`packages/shared/src/utils/index.ts`) had a wildcard-matching bug: a
  role granted `"finance.invoice.*"` would also match an unrelated permission like
  `"finance.invoiceapproval.create"`, because the prefix check used a bare `.startsWith()`
  with no `.` boundary. Fixed to require an exact prefix match or a `.`-delimited boundary.
- `RbacGuard` (`apps/api/src/common/guards/rbac.guard.ts`) had two `console.log` debug
  statements dumping the full authenticated user object and all resolved user roles on
  every permission check — a `AGENTS.md` rule-3 violation and a PII/permission-data log leak.
  Removed.
- Added a real permission-matrix test suite closing the exact gap the hardening plan named
  ("RBAC that is actually enforced, not decorator-presence"): 17 pure-function cases
  (`packages/shared/src/utils/permission-matrix.test.ts`) + 10 `RbacGuard` integration cases
  mocking Prisma (`apps/api/src/common/guards/tests/rbac.guard.spec.ts`) — exact match, module
  and resource wildcards, super-admin `*`, multi-role aggregation, malformed-role handling,
  and the wildcard-boundary regression, all proving deny-by-default.

### Added — Consolidation (Finance)
- `finance/advanced/consolidation` was frontend-only: a hardcoded `ENTITIES`/`CONSOLIDATED_TREND`
  mock array with no backing API call. Built a real backend:
  - `AdvancedFinanceService.getConsolidation` — live YTD per-entity P&L + balance-sheet totals
    (reusing `getProfitAndLoss`/`getBalanceSheet`), inter-company eliminations netted from
    consolidated totals, and a quarterly consolidated trend for the current fiscal year.
  - `GET /advanced-finance/consolidation/overview` and `GET /advanced-finance/consolidation/runs`
    (run history) added alongside the existing `POST /consolidation/run`.
  - Fixed a real bug in the pre-existing `runConsolidation`: it declared `totalRevenue`/
    `totalExpenses` but never incremented them in the aggregation loop, so every persisted
    `ConsolidationRun` recorded both as hardcoded 0. Now aggregated the same way as assets/
    liabilities/equity.
  - Frontend page rewired to fetch real data and call `POST .../consolidation/run` from the
    "Run Consolidation" button (previously a no-op `onClick={() => {}}`).
  - Tests: `apps/api/src/modules/advanced-finance/tests/consolidation.spec.ts` (4 cases,
    including a check that inter-company eliminations are scoped to the tenant's own
    organizations, not looked up unbounded).

### Verified
- `packages/shared`: 18/18 tests pass. `apps/api`: 202/202 advanced-finance tests pass,
  10/10 new RbacGuard tests pass. Full API + web typecheck clean.

## [2026-07-01] Central tenant-isolation enforcement closed (Enterprise Hardening Phase 2)

Product-manager gap analysis (targeting market-leading ERP functionality) flagged that
`MODULE_REGISTRY.md` overstates completeness vs. actual code. A follow-up audit confirmed
most flagged functional gaps (Fixed Assets, revenue recognition, e-invoicing, bank feeds,
treasury, ATS/benefits, quality management, CLM, POS loyalty, an AI module) are already real —
but surfaced a live security gap that both the PM analysis and `.ai/ENTERPRISE_HARDENING_PLAN.md`
independently called the top trust issue: tenant isolation was enforced per-service manually,
not centrally.

### Fixed
- `TenantInterceptor` (`apps/api/src/common/guards/tenant.interceptor.ts`) — which binds the
  authenticated user's `tenantId` to an `AsyncLocalStorage` session consumed by the Prisma
  client extension — was only wired into 36 of 72 controllers via `@UseInterceptors`. Core
  modules (finance, hr, crm, inventory, sales, procurement, supply-chain, projects,
  manufacturing, analytics, documents, communication, pos, notifications, devops, saas, and
  more) never set the session, so cross-tenant safety for those modules relied entirely on
  each service remembering to filter by `tenantId` manually.
- The Prisma extension itself (`packages/database/src/index.ts`) had a bug: it mutated a
  `typedArgs` copy but called `query(args)` with the original, pre-mutation object. For any
  call made with no options (e.g. `prisma.invoice.findMany()`, where `args` is `undefined`),
  the tenant filter was silently dropped.

### Added
- `TenantInterceptor` is now registered globally via `APP_INTERCEPTOR` in `app.module.ts` —
  every authenticated request is tenant-scoped by construction.
- `@SkipTenantScope()` decorator (`common/decorators/skip-tenant-scope.decorator.ts`) for the
  one legitimate cross-tenant surface, `SuperAdminController` (platform-wide aggregates like
  `prisma.user.count()`), gated by `system.tenant.*` permissions instead of tenant membership.
- Extracted the scoping logic into a pure, unit-testable function
  (`packages/database/src/tenant-scope.ts`) and added `packages/database/src/tenant-isolation.test.ts`
  (22 cases, including the exact `undefined`-args regression).
- `packages/database` had **no `test` script and no vitest dependency at all** — its one existing
  test file (misnamed `tenant-isolation.test.ts`, actually testing PII encryption) had never run
  in CI. Added `vitest`, a `test`/`test:watch` script, and renamed that file to
  `encryption.test.ts` to match its actual content (also fixed a missing `beforeAll`/`afterAll`
  import that had gone unnoticed for the same reason).

### Verified
- `packages/database`: 26/26 tests pass (22 new tenant-isolation cases + 4 encryption).
- `apps/api`: typecheck clean; targeted regression run (finance + super-admin + marketplace
  suites, 69 tests) green — confirms the global interceptor doesn't change existing
  correctly-scoped behavior, and `SuperAdminController`'s cross-tenant aggregates still work.

## [2026-06-27] ERP-Wide Dashboard & Visual Overhaul (Phase 2-10)

### Added
- **Shared Visualization Infrastructure (`@unerp/ui`)**:
  - `ChartTypePicker`: Dynamic chart visualization selector dropdown.
  - `ViewSwitcher`: Icon toggle button group (List, Chart, Kanban, Grid).
  - `DrillDownModal`: Granular BI datatable with query filters and CSV export.
  - `DashboardKPICard`: Enhanced key performance indicator card with sparklines and progress.
  - `DashboardChart`: Composed Recharts wrapper supporting dynamic series rendering.
  - `KanbanBoard`: HTML5 drag-and-drop workflow card tracker.
- **Login & Registration Redesign**:
  - Rebuilt `/login` and `/register` pages with responsive split-screen branding panels, feature carousels, password strength indicators, and MFA/Social options.
- **Enhanced Application Dashboards**:
  - Upgraded dashboards with live Recharts components, KPIs, view switchers, and Kanban support across: Finance, HR, CRM, Inventory, Sales, Procurement, Manufacturing, Supply Chain, Projects, Education, Real Estate, Field Service, POS Terminal, SaaS Portal, and BI Analytics.
  - Implemented 100% interactive KPI card coverage by binding missing `drillDown` and `onClick` parameters on every dashboard card (e.g. Warehouses, Total Stock Value, CRM Qualified status, Active Vendors list, Manufacturing scrap quantities, EVM metrics details, etc.).
- **Relative Routing & Type Safety**:
  - Replaced all hardcoded absolute references to `http://localhost:3001` backend endpoints with relative paths, preventing CORS and cross-origin deployment bugs.
  - Resolved strict mode TypeScript compilation issues in packages and applications.
  - Added `onClick` prop handler to `DashboardKPICard` component in `@unerp/ui` to support dynamic parent-handled drilldowns.

---

## [2026-06-21] App Store System Applications Integration

### Added
- **Marketplace Core System Catalog**:
  - Integrated 18 core system applications (Finance, HR, CRM, Inventory, Procurement, Sales, Supply Chain, Projects, Manufacturing, POS, Analytics, Drive, Connect, etc.) into the App Store catalog.
  - Core system apps show up as "Installed" by default and cannot be uninstalled by the user.
  - Added a system warning notice/banner on the app detail page to inform users that these core dependencies are pre-installed and cannot be uninstalled.
  - Added backend checks to throw `ForbiddenException` if users attempt to uninstall a system app.
  - Seeded all required system applications and corresponding `InstalledApp` mappings for existing and new tenants.

### Fixed
- **Typescript Compilation & Prisma Mismatches**:
  - Resolved `appSlug` query select mismatch in `saas.service.ts` and `marketplace.service.ts` by regenerating Prisma client and building the database package.
  - Fixed `org-hierarchy.service.ts` cost center creation and update compiler errors by removing the non-existent `budget` field from direct Prisma queries.
  - Fixed `bulk-operations.service.ts` database column mappings from `processedRecords` and `failedRecords` to the actual database columns `processed` and `failed`.
  - Resolved union type properties checking for `appData.price` and `appData.metadata` in `marketplace.service.ts` by casting `appData as any` inside `seedDefaultApps()`.
  - Corrected `operations.service.spec.ts` unit tests to access `result.data.length` for paginated error logs, and passed missing `tenantId` parameters.

---

## [2026-06-21] Dedicated Page Security Split

### Added
- **Dedicated Sub-Pages for Security Control Hub**:
  - Replaced Next.js transparent page redirects with full standalone operational pages:
    - `/admin/audit-trail` (Audit logs search table with severity filters)
    - `/admin/login-history` (Security authentication actions logs grid)
    - `/admin/password-policy` (Password rule complexity constraints and age configuration form)
    - `/admin/mfa` (Multi-Factor authentication settings management panel)
    - `/admin/ip-restrictions` (Network IP/CIDR whitelist and blacklist rules manager)
    - `/admin/sessions` (Active device user session listings with revoke triggers)
    - `/admin/impersonate` (Sandbox directory to impersonate tenant members with secure login bypass)
    - `/admin/data-retention` (Entity lifetime policy CRUD scheduler)
    - `/admin/compliance` (Score analyser showing security compliance parameters checklist)

## [2026-06-21] Admin Consolidation, Operations, Branding & Platform (Sprint 1–5 Complete)

### Added
- **Sprint 4 & 5 Operations UI Pages**:
  - `System Health` (`/admin/system-health`): Real-time CPU, memory, and database status widgets with auto-refresh (10s).
  - `Background Jobs` (`/admin/jobs`): Telemetry monitor for BullMQ worker queues with action triggers to retry failed jobs.
  - `Scheduled Tasks` (`/admin/scheduled-tasks`): Cron schedule viewer with manual trigger actions.
  - `Error Logs` (`/admin/error-logs`): Searchable monospace logger UI console with level filters (ERROR/WARN).
  - `Backup & Restore` (`/admin/backups`): Cold Postgres dump generator list with download actions.
  - `DB Schema Manager` (`/admin/db-schema`): Schema metadata viewer querying Postgres dynamic tables row volume counts.
- **Sprint 4 & 5 Branding & Platform UI Pages**:
  - `Email Server (SMTP)` (`/admin/email-config`): Host, username, password credentials and sender identity form with connection test mail dispatcher.
  - `Email Templates` (`/admin/email-templates`): Categories-bound grid list and dialog editor drawer with placeholder variables insert list.
  - `Module Manager` (`/admin/modules`): Toggle switch dashboard enabling/disabling core modules (Finance, HR, CRM, Inventory, Procurement, MRP, POS) globally.
  - `Feature Flags` (`/admin/feature-flags`): Selective rollout beta keys toggle editor.
  - `Custom Domains` (`/admin/domains`): Custom host link wizard detailing DNS records (CNAME/TXT) verified dynamically.
  - `Environment Manager` (`/admin/environments`): Production/Staging/Development sandbox state monitor and synchronization.
  - `Maintenance Mode` (`/admin/maintenance`): Global lockout toggler and custom warning banner message writer.
  - `Tenant Usage Analytics` (`/admin/tenant-analytics`): Counters for records (Users, Invoices, Products, API Hits) and progress bar for storage bytes quota.
  - `System Updates` (`/admin/updates`): Update checker showing current vs latest software version status and release logs.
- **Identity & Access Page Redirects**:
  - Created server-side redirects on `/admin/mfa`, `/admin/password-policy`, `/admin/sessions`, and `/admin/impersonate` routing to targeted tabs inside `/admin/security` hub.
- **Navigation & Search Integration**:
  - Registered all new sub-pages in sidebar navigation.
  - Added new routes to `SEGMENT_NAMES` for correct breadcrumbs translation.
  - Added all 25 new pages and actions to `GLOBAL_SEARCH_ITEMS` command palette search catalog.

### Reorganized
- **Admin Consolidation (Sprint 1)**:
  - Removed "System" dropdown folder and combined 4 sub-apps (Admin, Localization, Sync, DevOps) into a single "Admin" app.
  - Reorganized `/admin` sidebar navigation with grouped sections: Identity & Access, Security & Compliance, Automation & Workflows, Branding & Communication, Platform Settings, Data & Integration, Reports, and Super Admin.
  - Moved workflows module from `/workflows` to `/admin/workflows` (including page, advanced, escalations, and simulation pages).
  - Deleted old `/workflows` directory.
- **Drive Restructuring (Sprint 1)**:
  - Moved "Files & Storage" features from `/storage` into `/drive`.
  - Added new pages under `/drive` for Templates, Designer, Storage Quotas, and Media Conversion.
  - Deleted old `/storage` directory.
- **Super Admin**:
  - Merged `/super-admin` into the consolidated Admin app under `/admin/super-admin`.
  - Deleted old `/super-admin` directory.

### Updated
- `layout.tsx` — Updated segment naming mappings, apps switcher sidebar items, global search index items, and main applications index list.
- `apps/page.tsx` — Consolidated application list to remove separate tiles for workflows, storage, localization, sync, and devops; updated description for Admin.

---

## [2026-06-21] Phase 5 — System Modules Complete (End-to-End)

### Wired Existing Backends to Frontends
- **Localization**: Real API calls for languages, overrides CRUD, export/import JSON, completeness indicators
- **Sync Monitor**: Real API calls for sync queue, reconcile actions, conflict resolution modal, auto-refresh, filter tabs
- **SaaS Portal**: Real API calls for plans/subscription/usage, plan comparison matrix, trial management, upgrade modal
- **DevOps**: Real system metrics (DB latency, connections, memory, CPU), recent errors section, auto-refresh

### New Backend Services & Controllers
- **Security**: `SecurityController` + `SecurityService` — real audit log queries with pagination/search/filters, password policy CRUD via Setting model
- **Announcements**: `AnnouncementsController` + `AnnouncementsService` — CRUD for system-wide admin broadcasts with expiry
- **Scheduled Reports**: `ScheduledReportsController` + `ScheduledReportsService` — CRUD + run-now for scheduled report jobs
- **Activity Feed**: `ActivityFeedController` + `ActivityFeedService` — company-wide change stream from ChangeHistory
- **Notification Preferences**: `NotificationPreferencesController` — per-user channel preferences (in-app/email/SMS/push)
- **Import/Export Center**: `ImportExportController` + `ImportExportService` — validate, execute imports (Customer/Vendor/Product/Employee), export entity data
- **GDPR Data Management**: `GdprController` + `GdprService` — retention policies, erasure requests, subject data export

### New Frontend Pages
- `/admin/security` — Real audit logs with pagination, password policy settings, session management
- `/admin/settings` — Added demo data section, numbering series, fiscal year config
- `/admin/announcements` — System announcement management
- `/admin/scheduled-reports` — Scheduled report configuration
- `/admin/activity-feed` — Company-wide timeline with filters and infinite scroll
- `/admin/notifications` — Notification preferences grid (7 categories × 4 channels)
- `/admin/import-export` — 5-step import wizard + export with format/filter selection
- `/admin/gdpr` — Data retention policies + erasure request management

### New Prisma Models
- `SystemAnnouncement`, `ScheduledReport`, `DataRetentionPolicy`, `DataErasureRequest`, `NotificationPreference`

### Navigation
- Admin sidebar: added "Data & Compliance" section with Import/Export, GDPR, Announcements, Scheduled Reports, Activity Feed, Notification Prefs

---

## [2026-06-21] ERP Platform Foundation — Change History, Demo Data, RBAC, Super Admin

### Added
- **Change History System** (Phase 1): Entity+field-level audit trail across all modules
  - `ChangeHistory` Prisma model with tenant-scoped indexes
  - `@TrackChanges('EntityType')` decorator + `ChangeHistoryInterceptor` for automatic diff tracking
  - `ChangeHistoryService` with field diff logic and paginated history API
  - `GET /api/v1/change-history/:entityType/:entityId` endpoint
  - `<ChangeHistory>` reusable UI component (ERPNext-style timeline, light gray, vertical dots)
- **Demo Data System** (Phase 2): Toggle-able demo data with banner
  - `DemoDataRecord` model to track demo records per module
  - `Tenant.demoDataLoaded` + `Tenant.demoLoadedAt` fields
  - Admin endpoints: `POST/DELETE /admin/demo/load|remove|remove/:module`, `GET /admin/demo/status`
  - `<DemoBanner>` sticky amber banner with "Remove all" / "Remove from this app" actions
  - Integrated into dashboard layout with auto-fetch on login
- **Advanced RBAC System** (Phase 3): Multi-level access control
  - `Permission` registry model (endpoint/page/component/field/record levels)
  - `AccessPackage` model with field access rules and record filters
  - `RoleAccessPackage` many-to-many relation
  - Admin CRUD endpoints for access packages + role assignment
  - `<ProtectedComponent>`, `<ProtectedField>` UI components with `usePermission`/`useFieldAccess` hooks
  - `PermissionContext` React context for frontend permission state
  - Permission registry (`packages/shared/src/permissions/registry.ts`) with 100+ permission definitions
  - Access Control admin page (`/admin/access-control`) with Roles, Packages, and Matrix tabs
- **Super Admin Dashboard** (Phase 4): Cross-tenant management
  - `SuperAdminController` + `SuperAdminService` with tenant CRUD, admin listing, analytics, health
  - 4 frontend pages: Dashboard, Tenants, Admin Users, System Health
  - Sidebar navigation for `/super-admin` routes
- **AGENTS.md Rules**: Added mandatory rules 13-16 for change history and RBAC in all future development

### Changed
- `AdminModule` now includes `SuperAdminController` and `SuperAdminService`
- `AppModule` imports global `CommonModule` (ChangeHistory service)
- Dashboard layout sidebar: added Access Control, Settings, Super Admin navigation
- `SEGMENT_NAMES` updated with super-admin, access-control entries

### Schema
- New models: `ChangeHistory`, `DemoDataRecord`, `Permission`, `AccessPackage`, `RoleAccessPackage`
- Modified: `Tenant` (+demoDataLoaded, +demoLoadedAt), `Role` (+accessPackages relation)

---

## [2026-06-21] Procurement — Competitor Revamp (SAP Ariba/Coupa/Oracle Overhaul)

### Added
- **Purchase Requisition (PR) & Approvals** (`apps/web/app/(dashboard)/procurement/requisitions/page.tsx`): Built employee-purchasing request forms with dynamic multi-row line items, department budgeting, and workflow actions (Approve, Reject, Convert to PO draft).
- **Blanket Purchase Agreements (BPA)** (`apps/web/app/(dashboard)/procurement/blanket-agreements/page.tsx`): Added long-term supply contracts with fixed pre-negotiated prices, contract consumption progress tracking, and drawdown PO release actions.
- **3-Way Matching Checklist** (`apps/web/app/(dashboard)/procurement/purchase-orders/[id]/page.tsx`): Overhauled PO details to integrate an interactive 3-Way Match Check comparing ordered quantities/pricing against warehouse receipts (GRN) and vendor invoices.
- **Supplier Performance Scorecard** (`apps/web/app/(dashboard)/procurement/vendors/[id]/scorecard/page.tsx`): Created analytical dashboards compiling quality acceptance metrics, defect rates, average shipment lead times, and OTD performance.
- **Public Supplier Bidding Portal** (`apps/web/app/public/bids/[rfqNumber]/page.tsx`): Designed an unauthenticated workspace for external vendors to review RFQ details and submit binding bids directly.

### Fixed
- **TypeScript Typecheck Errors**:
  - Safely checked array elements and cast dynamic properties (`as any`) in `handleItemChange` within `requisitions/page.tsx` and `blanket-agreements/page.tsx`.
  - Replaced invalid `"secondary"` badge variant values with `"default"` across multiple pages (`blanket-agreements/page.tsx`, `purchase-orders/[id]/page.tsx`, `requisitions/page.tsx`, and `public/bids/[rfqNumber]/page.tsx`).
  - Resolved state update type incompatibility for `linePrices` (`Record`) in `public/bids/[rfqNumber]/page.tsx` using a functional state updater.
  - Resolved search input text overlapping with magnifying glass search icons by defining the missing `--space-9` design token (`2.25rem` / `36px`) centrally in `packages/ui/src/tokens/design-tokens.css`, instantly correcting all 25 instances across all ERP application search bars.

---

## [2026-06-21] Manufacturing — Competitor Revamp (SAP/NetSuite/Odoo MRP Overhaul)

### Added
- **Recursive Multi-Level BOM Explosion** (`apps/api/src/modules/manufacturing/manufacturing.service.ts`): Built recursive `getBOMTree` endpoint to traverse component formulas and render hierarchical sub-assembly trees. Added a matching visual tree drawer on the BOMs catalog.
- **Workstation Gantt Scheduler Timeline** (`apps/web/app/(dashboard)/manufacturing/mrp/page.tsx`): Upgraded the scheduling views to render an interactive workstation allocation Gantt chart mapping jobs and shifts.
- **MES Operator Routing Clock-in/out** (`apps/web/app/(dashboard)/manufacturing/shop-floor/page.tsx`): Overhauled the operator shop-floor terminal, enabling operators to check-in/out of sequence steps, log lot numbers, and increment machine tool cycles.
- **Lot Genealogy Trace Explorer** (`apps/web/app/(dashboard)/manufacturing/diagnostics/page.tsx`): Created a double-sided genealogy tracing layout searching component lot consumption histories (upstream and downstream).
- **OEE Metrics breakdown** (`apps/api/src/modules/manufacturing/manufacturing.service.ts`): Wired multi-dimensional OEE calculation (Availability, Performance, Quality components) with downtime log charts.
- **Engineering Change Orders (ECO)** (`apps/web/app/(dashboard)/manufacturing/boms/page.tsx`): Added BOM revision control (v1.0, v1.1) and approval routing to prevent modification of active production formulas without a change request.
- **Tooling Cycle Counters & PM Integration**: Created automated cycle counts on workstations equipment tools, auto-raising preventive maintenance requests if wear limit is exceeded.
- **Enhanced Spec-based Quality Templates** (`apps/web/app/(dashboard)/manufacturing/quality/page.tsx`): Rearchitected inspection checklists supporting custom checkbox/numeric range templates instead of plain text strings.
- **Robust Unit Testing Suite** (`apps/api/src/modules/manufacturing/tests/manufacturing.service.spec.ts`): Added 7 comprehensive test blocks verifying capacity adjustments, recursive trees, OEE scores, tool cycles, ECOs, and lot tracers.

---

## [2026-06-21] Inventory & Stock — Dashboard Analytics & Route Restructuring

### Added
- **Inventory Dashboard** (`apps/web/app/(dashboard)/inventory/page.tsx`): Built a premium, visually stunning inventory dashboard utilizing HSL custom properties. Includes real-time statistics (total items, active products, active warehouses), custom SVG-based visual charts (donut chart showing stock value breakdown by category, and warehouse distribution progress bars), replenishment urgency lists, and a modular quick-actions operations hub.
- **Relocated Products Catalog Route**: Moved the product catalog from `/inventory` to `/inventory/products`.
- **Breadcrumbs Segment Names & Sidebar Navigation**: Added the new `/inventory/products` segment path and configured the sidebar links under `layout.tsx` to cleanly route the dashboard to `/inventory` and the catalog to `/inventory/products`.

### Changed
- **Default Products Catalog Layout**: Configured the default catalog layout format state to show the list view first instead of grid view (`/inventory/products/page.tsx`).
- **Product Detail Back Redirection**: Programmed the '< Back' button, error fallback redirect, and path breadcrumbs stack on the product details page (`/inventory/products/[id]/page.tsx`) to correctly navigate to the new `/inventory/products` catalog route instead of `/inventory`.

---

## [2026-06-21] Inventory & Stock — Market Top Competitor #1 Overhaul

### Added
- **Product Detail Page** (`apps/web/app/(dashboard)/inventory/products/[id]/page.tsx`): Created a high-fidelity client page supporting dynamic variant matrices, mini warehouse stock grids, and paginated Stock Ledger audit timelines.
- **Overhauled Product Catalog** (`apps/web/app/(dashboard)/inventory/page.tsx`): Integrated category tree sidebar navigation, Grid/List/Kanban view switchers, in-stock valuation rates, and click-through detail routes.
- **Overhauled Stock Entries** (`apps/web/app/(dashboard)/inventory/stock-entries/page.tsx`): Rewired warehouse material transactions with dynamic warehouse-specific bin dropdowns, interactive serial/batch tracking forms, and E2E voucher submissions and cancellation reversals.
- **Overhauled Stock Ledger** (`apps/web/app/(dashboard)/inventory/stock-ledger/page.tsx`): Re-engineered continuous audit tables with custom product/warehouse dropdown selections, real-time client-side CSV exports, and running balance tracking columns.
- **Overhauled Warehouse Directory** (`apps/web/app/(dashboard)/inventory/warehouses/page.tsx`): Implemented card-based warehouse listings with unique product counters, active status selectors, and add/edit forms.

---

## [2026-06-21] Drive — Google Drive UI, AES-256 S3 Envelope Encryption & Advanced Sharing

### Added
- **Google Drive UI**: Created a premium, high-fidelity Google Drive clone at `/drive` with custom nested folder navigation, double-click traversal, path breadcrumbs stack, responsive grids/lists, and collapsible Details Side Drawer.
- **Envelope Encryption**: Programmed on-the-fly AES-256-CBC envelope encryption for document binary buffer streams uploaded directly to MinIO (S3-compatible object storage) with unique database-indexed IVs.
- **OneDrive-style Sharing**: Integrated custom share configuration inputs including password protection and link expiration calendar dates.
- **Box-style Compliance**: Added active Legal Hold toggles to folders and files to block deletion workflows.
- **Digital Signatures & Versions**: Wired e-signature requests and multi-version upload/download decrypter streams directly.
- **Sidebar Nav Split**: Separated Drive and Storage explorer links cleanly under layout and home screens.
- **Self-Healing S3 Bucket Initialization**: Configured automated checks in backend `DocumentsService` (`createDocument` and `addVersion`) to verify and create the target MinIO bucket dynamically on demand, handling instances where the storage container boots late.

### Fixed
- **TS6133 Error**: Removed unused `Readable` import in `documents.service.ts` to clean compiler status.
- **Sidebar Active Highlighting**: Added `/drive` and `/storage` to exact path matches in `layout.tsx` to prevent overlapping active link states when viewing child routes (like `/drive/advanced` or `/storage/advanced`).
- **MinIO Container Startup**: Started the `unerp-minio` container using docker-compose, enabling S3-compatible file storage local binding.
- **Shared/Starred/Trash Nested Folder Duplication**: Fixed `getFolders` and `getDocuments` query filtration in `documents.service.ts` where `parentId`/`folderId` was ignored for non-personal views, preventing infinite folder opening loops and duplicate displays during navigation.
- **Double Click Navigation Guard**: Implemented navigation guards in `drive/page.tsx` (`handleEnterFolder`) to block race conditions from rapid double-clicks and guaranteed React list key uniqueness with composite `${folder.id}-${index}` strings.

## [2026-06-20] Web Studio — Rich Block Library, Forms, E-commerce & Publish Workflow

### Added
- **Rich block library** (`apps/web/src/components/builder/blocks/RichBlocks.tsx`): Navbar (with live cart badge), Footer, Rich Text (HTML), Image, Gallery, Columns, Logo Cloud, CTA Banner — bringing the page builder to 18+ block types. A single shared registry (`blocks/registry.tsx`) now feeds both the canvas preview and the public `PublicPageRenderer`.
- **Contact Form block**: renders a configurable form and posts to the public `/api/v1/public/web/forms/submit` endpoint, landing leads straight in the Form Submissions inbox.
- **E-commerce**: new `WebOrder` Prisma model + migration `20260620140000_add_web_orders`. A `useCart` localStorage hook, **Add to Cart** on product collection cards, a **Cart & Checkout** block that posts to a public `/api/v1/public/web/checkout` endpoint (totals recomputed server-side, order number issued), and a **Web Studio → Orders** admin page with revenue/pending/fulfilled stats and status management. 2 new service tests (builder suite now 119 passing).
- **Asset picker**: Image/Gallery block fields and the inspector can pick from the Asset Manager (image assets) or paste a URL, with a live thumbnail.
- **Page publish workflow**: the page builder now has Save Draft, **Preview** (opens the live `/{slug}`), and Publish / Update Live with a "Live" status indicator.
- **Navigation**: Orders added to the Web Studio hub + sidebar + breadcrumbs.

### Changed
- `CollectionBlock` renders an **Add to Cart** button for `PRODUCT`-kind collections.

## [2026-06-20] Web Studio — Collection-bound Blocks & Visual Block Inspector

### Added
- **Collection List block** (`apps/web/src/components/builder/blocks/CollectionBlock.tsx`): a CMS-bound page block that renders published items from any Web Studio collection (products with pricing, projects/portfolio, team, testimonials with star ratings, etc.). Self-fetching so it works identically in the builder canvas (authenticated, current tenant) and on the live public site (public API). Responsive grid/list layouts, featured-only filter, item limit, auto-derives title/image/price/subtitle from the collection's field metadata.
- **Block registry wiring**: `collection` registered in both the canvas preview (`builder/web/canvas`) and the public renderer (`PublicPageRenderer`) so it renders end-to-end — content modeled in Collections now appears on real pages.
- **Real visual block inspector** (`builder/web/pages`): replaced the stubbed "properties would appear here" panel with a schema-driven inspector. Per-block-type editable fields (hero headline/subtitle/CTAs/alignment; collection picker + layout/columns/limit/featured; CTA, text, features). The collection picker is populated from the tenant's collections; edits live-sync to the canvas via the existing postMessage flow.
- **Expanded section palette**: added Collection List, CTA Banner and Text Block to the page builder palette.

## [2026-06-20] Web Studio — CMS Collections Engine (dynamic content modeling)

### Added
- **CMS Collections** — the headless content backbone that makes Web Studio a true end-to-end CMS (Webflow/Wix/Sanity-class), suitable for e-commerce, portfolios and company sites. New Prisma models `WebCollection`, `WebCollectionItem`, `WebFormSubmission` + idempotent migration `20260620120000_add_web_cms_collections`.
- **Dynamic content types**: define collections with typed fields (Text, RichText, Number, Price, Boolean, Date, Image, Gallery, Select, Color, URL, Email, Tags, Reference). Manage entries with auto-slugging, draft/published status, featured flag and ordering.
- **Ready-made presets** (`web-collections.presets.ts`): one-click Products, Projects, Team, Testimonials, Blog, Services, Events — each seeded with field schema + sample content so the CMS is usable out of the box.
- **Backend** (`WebCollectionsService` + routes on `BuilderController`): full CRUD for collections + items, preset seeding, and a form-submissions inbox. 8 new unit tests (builder suite now 117 passing).
- **Public API** (`WebPublicController`, unauthenticated, `/api/v1/public/web/...`): published collection reads (`collections/:slug`, `collections/:slug/:itemSlug`) and public form submission capture (`forms/submit`) for the live customer-facing website. Tenant resolved by slug (defaults to `system`).
- **Web Studio UI**: new `builder/web/collections` page — collection gallery, preset/custom creation modal with a field-schema builder, and a dynamic entry editor drawer that renders inputs from each collection's field definitions. New `builder/web/submissions` inbox (read/archive/spam/delete). Wired into the Web Studio hub + sidebar nav + breadcrumbs.

## [2026-06-20] Navigation — Breadcrumbs Duplicate Removal & Grey Theme Styling

### Changed
- **Removed Duplicate Breadcrumbs**: Removed local breadcrumb navigation rendering from the shared [PageHeader](file:///c:/Users/kanna/OneDrive/Documents/Antigravity/ERPSys/packages/ui/src/components/page-header.tsx) component. This cleanly resolves duplicates across all ERP pages since pages use PageHeader while the layout renders breadcrumbs centrally.
- **Grey Styling theme**: Replaced the bright blue link styles on central breadcrumbs in [globals.css](file:///c:/Users/kanna/OneDrive/Documents/Antigravity/ERPSys/packages/ui/src/styles/globals.css) with clean, soft grey link colors (`var(--color-text-secondary)`) matching the requested reference format.
- **Interactive States & Separation**: Configured `/` separator margin/opacity and hover colors to shift dynamically from grey to dark (`var(--color-text)`).
- **Active Segment Selection**: Updated the [layout.tsx](file:///c:/Users/kanna/OneDrive/Documents/Antigravity/ERPSys/apps/web/app/%28dashboard%29/layout.tsx) template segment loop to detect the final active page, styling it as unclickable dark text (`.frappe-breadcrumb-active`) while retaining parent routes as clickable grey link triggers.

## [2026-06-20] Fix — NestJS API Compilation Mismatch & Next.js Runtime Cache Reset

### Fixed
- **App Page Builder Service**: Resolved a TypeScript compilation error in `builder.service.ts` where `addPageToModule` had a mismatch with `AddAppPageInput`'s `formId` and `dashboardId` types (which allowed `null` but the service signature only allowed `string | undefined`). Updated signature to accept `string | null` for both arguments.
- **Server Startup**: Restored NestJS server to a healthy compiled state, allowing the backend API and Next.js frontend to work correctly under dev mode.
- **Next.js Runtime Chunk Resolution**: Resolved the runtime chunk loading error `Cannot find module './6543.js'` by stopping the active Next.js development server process, clearing the `.next/` cache directory, and launching a fresh compiler process.



## [2026-06-20] Navigation — ERP-wide Dynamic Page Breadcrumbs Rollout

### Added
- **Dynamic Breadcrumbs Engine**: Implemented central breadcrumbs rendering at the top of the content viewport in `apps/web/app/(dashboard)/layout.tsx` to automatically supply navigation to all child pages in the system.
- **Segment Names Dictionary**: Registered human-readable translations for all core module roots and standard sub-page URL segments.
- **Dynamic Key Checker**: Programmed an identifier scanner in `formatSegment` to auto-detect database IDs/slug hashes (Pure numeric, UUID, CUID, long alphanumeric) and resolve them to clean `'Detail'` labels.
- **Breadcrumbs CSS Design**: Added `.frappe-breadcrumb` classes to `globals.css` with blue links and light grey `/` separators, adhering strictly to the user screenshots and Frappe UX guidelines.
- **Guidelines Enforcement**: Added breadcrumb navigation policies to `AGENTS.md` to secure consistency across new pages.

## [2026-06-20] Navigation — Dropdown Styling Revamp & Tree Connector Visuals

### Changed
- **Dropdown Cleanliness**: Extracted inline CSS styles from `layout.tsx` for the Switch App, Tenant Selector, Search Results, and User Profile dropdown menus into global utility classes in `globals.css` (`.frappe-dropdown-*`).
- **Nesting UI Hierarchy**: Replaced the simple indent spacing for nested sub-apps inside expanded folders (Developer & System) with a distinct vertical connector line (`.frappe-dropdown-item-nested-container`) aligned precisely with the folder icons.
- **Dynamic Caret Rotations**: Caret indicators (`ChevronDown` and folder `ChevronRight`) now rotate smoothly using CSS transitions when toggled open/expanded, rather than popping instantly.
- **Interactive Micro-animations**: Dropdown menus fade-in-up dynamically using keyframe animations on mount. Added a subtle `translateX(2px)` hover animation on list items to increase responsiveness.
- **Danger Action Isolation**: Created `.frappe-dropdown-item-danger` for negative triggers (Sign out) to eliminate hover styling event listeners.

## [2026-06-20] Navigation — Rearranged Navbar & Global CSS Styling

### Changed
- **Header Structure**: Rearranged elements in the main layout header panel:
  - Placed the "Switch Tenant" button directly next to the "Switch App" button on the left side of the navbar.
  - Removed the redundant "Apps Home" button.
  - Moved the search bar to the right side of the navbar, positioned next to the theme toggle button.
  - Aligned search results dropdown menu to render relative to the right-hand position (`right: 0`).
- **Global Styling Alignment**: Replaced custom inline CSS borders, backgrounds, and colors with global utility classes:
  - Search Input: `className="frappe-input"`
  - Theme Toggle: `className="frappe-btn frappe-btn-secondary"`
  - Notification Bell: `className="frappe-btn frappe-btn-secondary"`

## [2026-06-20] Navigation — Collapsible Folders in Switch App Dropdown

### Added
- **Collapsible Switcher folders**: Added collapsible subfolders for "Developer" and "System" in the "Switch App" dropdown in `layout.tsx` to mirror the Desk layout.
- **Indented sub-apps**: Inside collapsed dropdown folders, children applications render slightly indented.
- **Chevron Indicators**: Implemented interactive `ChevronRight` and `ChevronDown` icons to signify the expansion state of collapsible sections.
- **Alphabetical sorting**: Both root apps and folder headers are combined and sorted alphabetically.

## [2026-06-20] Custom App Builder — Workflow & Dashboard Editors Embedded Inline

### Added
- **Extracted `WorkflowEditorWorkspace`** (`apps/web/src/components/builder/WorkflowEditorWorkspace.tsx`): the full React Flow workflow editor (palette, drag-drop nodes, properties panel, test-run, execution history) is now a reusable component accepting `{ workflowId, onBack, onSaved, embedded, defaultName }`. Route `builder/erp/workflows/[id]` slimmed to a thin wrapper.
- **Extracted `DashboardEditorWorkspace`** (`apps/web/src/components/builder/DashboardEditorWorkspace.tsx`): the full grid-layout dashboard editor (widget palette, resizable grid, properties panel) is now a reusable component. Route `builder/erp/dashboards/[id]` slimmed to a thin wrapper.
- **Studio Workflows tab — Build New + inline Edit**: launches the workflow editor as a full-screen overlay over `builder/erp/apps/[id]`; on first save the workflow is auto-linked to the app.
- **Studio Dashboards tab — Build New + inline Edit**: same pattern for dashboards. Both follow the form-builder convention so the user never leaves build mode.
- **Generic `linkComponentToApp` helper** in the app studio centralizes the link-on-save behavior across form/workflow/dashboard overlays.

## [2026-06-20] Custom App Builder — Integrated In-Studio Builders (never leave build mode)

### Added
- **Extracted `FormBuilderWorkspace`** (`apps/web/src/components/builder/FormBuilderWorkspace.tsx`): the full visual form builder (palette, properties, dnd, zoom/pan, AI-generate) is now a reusable component accepting `{ formId, onBack, onSaved, embedded, defaultModule }`. The route `builder/erp/forms/[id]` is now a thin wrapper around it.
- **Embedded form builder in the App Studio**: launches as a full-screen overlay over `builder/erp/apps/[id]` — you build/edit a form and return to the app without any navigation. On first save of a new form it auto-links to the app; `onSaved` keeps the overlay open on the now-saved form for continued editing.
- **Forms section — Build New + inline Edit**: the studio Forms tab now has a "Build New" action (opens the full builder) and a per-form pencil to edit the linked form in place.
- **Page composer**: the Add Page flow now binds a data source for form/list pages — either **Link Existing** (form dropdown) or **Build New** (opens the form builder; on save it links the form and creates the page bound to it via `formId`).

### Notes
- Same overlay pattern is ready to extend to the Workflow and Dashboard editors (planned next) for a fully end-to-end in-studio full-stack builder.

## [2026-06-20] Custom App Builder — Release Management & App Store Loop

### Added
- **App releases (immutable snapshots)**: New `AppRelease` Prisma model. Publishing a custom app now cuts an immutable, self-contained snapshot (components dereferenced into full form/workflow/dashboard/automation definitions, plus pages, data models, permissions and store metadata) rather than just flipping a status flag. Migration `20260620050000_add_app_releases_and_store_listing`.
- **Semantic versioning on publish**: `POST /builder/modules/:id/publish` accepts `{ scope, bump: 'patch'|'minor'|'major', version?, changelog, category, longDescription, publisher, screenshots }`. Auto-bumps patch by default; rejects duplicate versions (`@@unique([moduleId, version])`).
- **Release history & rollback**: `GET /builder/modules/:id/releases` and `POST /builder/modules/:id/rollback` ({ releaseId }) — restores a prior release's snapshot into the live module and marks newer releases `ROLLED_BACK`.
- **App Marketplace API**: `GET /builder/marketplace` lists installable builder apps (GLOBAL from any tenant + this tenant's ORG apps) annotated with install state and `updateAvailable`. `POST /builder/marketplace/install` and `/uninstall`.
- **Provision-on-install**: Installing a built app provisions its pages as resolvable `SchemaRegistry` + `PageRegistry` entries (route `/app/<module-slug>/<page-slug>`), pins the install to a release, and records provisioned IDs on `InstalledApp` for clean teardown on uninstall. Data models without a page also get a runtime surface.
- **App Store integration (closes the loop)**: `apps/store` now renders a live **"Built in your workspace"** section sourced from `/builder/marketplace` alongside the static catalog — apps published from the builder are now actually discoverable and installable, with update/uninstall actions.
- **Studio Publish & Releases tab**: Rebuilt publish UI with version-bump selector (live next-version preview), changelog, store-listing fields (category/publisher/description), scope, and a release-history list with one-click rollback.
- **Enhanced test + sandbox engine** (`runAppTests`): structural checks are now categorized (structure/data/automation/security/performance) and joined by a sandbox simulator that validates a sample record per data model and linked form (required/type/select-options/regex), plus per-run history (last 10) with a score-trend chart in the Test tab.
- **In-studio runtime Preview tab**: A simulated app shell that renders the app's pages with a working nav; form pages render live via `DynamicFormRenderer` (submissions captured locally, not persisted) and an "Open Live" deep link to `/app/<slug>/<page>` once published. List/dashboard pages show a runtime placeholder.
- **App lifecycle stats** (`getModuleStats`): now returns installs, release count, automation-run totals, current version/scope/status, and score trend — surfaced as stat cards on the studio Overview tab.

### Changed
- **`InstalledApp`** extended with `source` (CATALOG|BUILDER), `sourceModuleId`, `releaseId`, `installedVersion`, `provisioned`.
- **`BuilderModule`** extended with store-listing fields (`category`, `longDescription`, `publisher`, `screenshots`, `installCount`) and `currentReleaseId`; added `@@index([scope, status])`.

### Tests
- Added service unit tests for `publishModule` (version bump, duplicate-version guard), `getMarketplace` (install/update annotation), `installBuilderApp` (provisioning) and `uninstallBuilderApp` (teardown). Builder suite: 63 passing.

## [2026-06-20] Fix — ReferenceError on App Builder page

### Fixed
- **App Builder Overview Page**: Resolved a critical runtime `ReferenceError: HelpCircle is not defined` by adding the missing import for `HelpCircle` from `lucide-react`.

## [2026-06-20] Builder Studio — App Builder Overview & No-Code Test Platform

### Added
- **No-Code Test Platform Tab**: A complete interactive sandbox directly inside the ERP App Builder overview page (`/builder/erp`). Users can select any developed form from the system to render live.
- **Dynamic Input & Rules Execution**: Sandbox fields are rendered automatically via the shared `<DynamicForm>` component, supporting formulas, conditional visibility rules, data formats, and validation.
- **Form Sandbox State Modes**:
  - **Live Database Mode**: When testing a published form, submissions are written directly to the PostgreSQL database via `POST /api/v1/builder/custom-records/:schemaId`.
  - **Simulated Sandbox Mode**: When testing draft forms, submissions are captured in temporary React state to allow testing of visibility rules and formulas without deploying to database tables.
- **Interactive API Log & Payload Inspector**: Shows history log of test submissions, raw JSON payload inspections, and supports entry deletion (SQL deletion for live tables).
- **Custom Modules CRUD Enhancements**: Expanded Custom Modules list to dynamically fetch `/api/v1/builder/modules` and support full create and edit configurations with specific theme colors, icons, and publish scopes.
- **Publish Scopes for Modules**: Added support for module scopes: "Draft" (private draft), "Organization Level" (restricted to tenant), and "App Store" (globally accessible).
- **Database Schema Migration**: Added `scope String @default("ORGANIZATION")` field to the `BuilderModule` table in PostgreSQL.
- **Shared Validation Schemas**: Added `scope` field validation to `createBuilderModuleSchema` and `updateBuilderModuleSchema` in packages/shared.
- **App Builder Overview Sidebar Link**: Added the overview page `/builder/erp` to the global `ERP App Builder` sidebar navigation under layout.tsx.

---

## [2026-06-19] Builder Studio — Deploy Loop & Runtime Renderer Overhaul

### Added
- **`publishForm` backend engine** (`builder.service.ts`): New `POST /page-registries/:id/publish` endpoint that closes the zero-code deploy loop. On publish: derives field metadata from the visual layout, upserts a `SchemaRegistry` (creates on first publish, updates on re-publish — no orphaned schemas), links it to the `PageRegistry` via `schemaId`, and sets `status: 'PUBLISHED'`. Returns the live `/app/{module}/{slug}` route.
- **Deploy-to-App wizard** (`DeployFormModal.tsx`): Frappe-styled modal replacing the hardcoded publish flow. Users choose a target module (with datalist of existing modules), URL slug (auto-suggested from title, URL-safe validated), and description. Shows live route preview. On success: displays "Open Page" and "Copy Link" actions.
- **`getSchemaRegistryById` helper**: New service method for fetching schemas by ID (used by publish flow + tests).
- **Search/sort/pagination for custom records**: `GET /custom-records/:schemaId` now accepts `?search=&sortBy=&sortOrder=&page=&pageSize=` query params. Server-side filtering across all field values, sorting by any data column (asc/desc), and paginated response `{ data, total, page, pageSize, totalPages }`.

### Changed
- **Runtime renderer** (`app/[module]/[slug]/page.tsx`): Full rewrite fixing a React Rules-of-Hooks violation (useState/useEffect called after conditional returns). Now supports: server-side search, sortable column headers, pagination controls (10/25/50), per-row edit (pre-fills DynamicFormRenderer) and delete (with inline confirm), and `frappe-*` utility classes throughout.
- **Form builder Publish button**: Now opens the DeployFormModal ("Deploy to App") instead of calling `handleSave(true)` with hardcoded `module:'custom'` and `slug:custom-${timestamp}`. Save payload now uses the deploy wizard's module/slug/title.
- **Sidebar Page Registry filter**: Only pages with `status === 'PUBLISHED'` now appear in the sidebar navigation — drafts are no longer visible to the team.

### Tested
- **Builder service tests** (`builder.service.spec.ts`): Extended prisma mock with `schemaRegistry`, `pageRegistry`, `customRecord` stubs and `$transaction` support. Added test suites for: `publishForm` (new schema creation, re-publish update, not-found error), `getSchemaRegistryById` (found, not-found), and `getCustomRecords` with query (default pagination, search filtering, asc/desc sorting, page slicing, RBAC scrub with query, null-schema fallback).

---

## [2026-06-18] Builder Studio — P0 (Logic & Modules Wiring)

### Added
- **Automation Logic API Wiring**: Wired the Automation/Logic UI (`/builder/erp/logic`) to the actual backend API `/api/v1/builder/automation-rules`. Implemented rule creation, status toggling, deletion, and real-time statistics generation instead of using hardcoded mock data.
- **Module CRUD Wiring**: Wired the Custom Modules UI (`/builder/erp/page.tsx`) to the backend API `/api/v1/builder/modules`. Implemented module creation via the `GenericBuilderModal`, deletion functionality, and live statistics counts for entities and relationships.
- **Sidebar Integration Review**: Verified that Builder Studio navigation correctly exists and resolves dynamically based on the current context within `layout.tsx`.

## [2026-06-18] Builder Studio — Phase 2 Complete (Data Import, Conditional Logic, Website CMS)

### Added
- **Conditional Logic Visual Builder**: Field inspector now has a 3-step visual condition editor — select field → select operator (equals/not/contains/greater/less) → enter value. Generates `visibilityRule` syntax automatically. Shows live preview of the generated rule.
- **Data Import Wizard** (`/builder/erp/data`): Full 3-step modal wizard (Select File → Map Columns → Confirm), KPI summary cards, import jobs table with status badges (COMPLETED/FAILED/IMPORTING/VALIDATING/PENDING), row counts, connected to live `/api/v1/builder/data-imports` API.
- **Forms List Connected to Live API**: Forms page now fetches from `/api/v1/builder/forms` and `/api/v1/builder/page-registries` instead of static mock data. Auto-refreshes on publish events.
- **Backend Pagination for Builder Forms**: `getForms()` now supports page/limit/search with standardized `{ data, meta }` paginated response format.

### Builder Properties Panel Structure (Final)
- General (label, name, description, placeholder, default, checkboxes)
- Layout & Appearance (column span, height, CSS class)
- Static Options / Content (for Select/Radio/Link/HTML/Table)
- Validation (min/max length, regex pattern)
- Conditional Logic (3-step visual builder with field/operator/value selectors)
- Computed Formula (auto-calculated expressions like `{qty} * {rate}`)
- Security / RBAC (read roles, write roles)
- Data Source (for dynamic Select/Radio/Link fields)
- Form-level: Webhooks (event-based HTTP callbacks) + JS Automations (Node VM sandbox scripts)

## [2026-06-18] Builder Studio — Comprehensive Enhancement (Forms, Workflows, Dashboards, Dynamic Rendering)

### Added
- **Dynamic Form Rendering Engine**: Created `DynamicForm.tsx` — runtime component that reads PageRegistry JSON layouts and renders live forms. Supports 17 field types, computed formulas (`{qty} * {rate}`), visibility rules (`eval:{status}==Open`), validation (required/min/max/regex), and 12-column responsive grid.
- **Builder Store — Undo/Redo + Duplicate**: Enhanced Zustand store with full history tracking (20 versions), `undo()`, `redo()`, `canUndo()`, `canRedo()`, `duplicateField()` methods. All mutations auto-push to history.
- **Backend Pagination for Builder Forms**: `getForms()` now supports page/limit/search with paginated response `{ data, meta }`.
- **Forms List Connected to Live API**: Forms page now fetches from `/api/v1/builder/forms` and `/api/v1/builder/page-registries` instead of hardcoded mock data.
- **Workflow List Page** (`/builder/erp/workflows`): Full page with CRUD, search, status toggle (ACTIVE/PAUSED), trigger badges, step counts, summary KPI cards. Connected to live API.
- **Dashboard List Page** (`/builder/erp/dashboards`): Full page with CRUD, search, widget counts, refresh rate display, status badges, summary KPI cards. Connected to live API.

## [2026-06-18] Phase 11–20 Advanced Features — Comprehensive Backend Enhancement

### Added
- **Shared Validators Expansion (Phase 1)**:
  - Added `bulkActionSchema`, `bulkActionResultSchema`, `exportSchema` for cross-module bulk operations and data export
  - Added `paginationSchema`, `paginatedResponseSchema`, `dateRangeSchema` for standardized paginated queries
  - Added `updateInvoiceSchema`, `updatePurchaseOrderSchema`, `updatePurchaseReturnSchema`, `updateOrganizationSchema`, `updateCustomerSchema` — previously missing update DTOs
  - Added `createWarehouseSchema`, `updateWarehouseSchema`, `createDepartmentSchema`, `updateDepartmentSchema`, `createRoleSchema`, `updateRoleSchema` — previously missing entity DTOs
  - Added `updateEmployeeSchema`, `updateVendorSchema`, `updateContactSchema`, `updateProjectSchema`, `updateTaskSchema` — enabling partial updates
  - Added status enums: `invoiceStatusEnum`, `purchaseOrderStatusEnum`, `salesOrderStatusEnum`, `projectStatusEnum`, `employeeStatusEnum`
  - Enhanced `createPurchaseReturnSchema` with `unitPrice`, `taxRate`, `purchaseReceiptId`, `reason` fields
  - Added `createPurchaseOrderSchema` with `shippingAddress` field support
  - Total: ~250 lines of new validation schemas added

- **Common Backend Utilities (Phase 1b)**:
  - Created `apps/api/src/common/utils/pagination.util.ts` with `buildPaginationValues()`, `buildOrderBy()`, `paginatedResult()`, `resolveOrgId()` helpers
  - All pagination utilities support page/limit/sort/search/filter parameters
  - Standardized paginated response format: `{ data: [...], meta: { page, limit, total, totalPages } }`

- **Finance Module Enhancement (Phase 2)**:
  - Added `getInvoiceById()` — single invoice detail with customer info, line items, payments
  - Added `updateInvoice()` — edit DRAFT invoices with line item replacement logic
  - Added `deleteInvoice()` — soft delete with status validation (can't delete PAID)
  - Added `sendInvoice()` — status transition DRAFT→SENT with sentAt timestamp
  - Added `voidInvoice()` — status transition with validation
  - Added `bulkAction()` — batch delete/send/void/update-status operations
  - Added `getPayments()` — payment history for specific invoice
  - Added `getInvoiceStats()` — KPI data (total, paid, overdue, revenue, payment rate)
  - Enhanced `getInvoices()` with pagination, sorting, search, status/customer filtering
  - Enhanced `createPayment()` with status validation (can't pay void/cancelled)
  - Added event emission: `finance.invoice.created`, `finance.invoice.sent`, `finance.payment.received`
  - Controller: 13 new endpoints, standardized pagination query params

- **HR Module Enhancement (Phase 3)**:
  - Added `getEmployeeById()` — single employee detail with department
  - Added `updateEmployee()` — partial update with all employee fields
  - Added `deleteEmployee()` — soft delete with TERMINATED status
  - Added `bulkAction()` — batch delete/update-status operations
  - Added `getDepartments()` — department list with employee counts
  - Added `getEmployeeStats()` — KPI data (total, active, on leave, terminated, active rate)
  - Enhanced `getEmployees()` with pagination, sorting, search, status/department filtering
  - Added event emission: `hr.employee.onboarded`
  - Controller: 8 new endpoints

- **Inventory Module Enhancement (Phase 4)**:
  - Added `getProductById()` — product detail with warehouse stock and usage counts
  - Added `updateProduct()` — partial update with all product fields
  - Added `deleteProduct()` — soft delete with isActive=false
  - Added full Warehouse CRUD: `getWarehouses()`, `getWarehouseById()`, `createWarehouse()`, `updateWarehouse()`, `deleteWarehouse()` — all with pagination
  - Added `getStockLevels()` — warehouse stock with pagination and product/warehouse filtering
  - Added `bulkAction()` — batch delete operations
  - Added `getInventoryStats()` — KPI data (total/active products, warehouses, low stock alerts)
  - Enhanced `getProducts()` with pagination, sorting, search, type/category filtering
  - Controller: 15 new endpoints

- **Procurement Module Enhancement (Phase 5)**:
  - Enhanced `getPurchaseOrders()` with pagination, sorting, search, status/vendor filtering
  - Added `createPurchaseReturn()` with debit note auto-creation (previously referenced but incomplete)
  - Added event emission: `procurement.receipt.created`, `procurement.return.created`
  - Added `auto-reorder event listener` (`procurement.order.reorder`) — automatically creates POs when stock is low
  - Controller: all appropriate endpoint signatures updated

### Updated Documentation
- Updated `.ai/MODULE_REGISTRY.md` to reflect enhanced module capabilities
- `.ai/CHANGELOG.md` updated with this entry

### Technical Details
- All modules use the common `PaginationParams`, `PaginatedResult` interfaces and utilities
- All paginated endpoints return `{ data: [...], meta: { page, limit, total, totalPages } }` format
- Domain events follow `module.entity.action` naming convention (e.g., `hr.employee.onboarded`)
- Bulk operations support `{ action, ids, data? }` format per API standards
- TypeScript strict mode maintained throughout — no `any` types in exposed interfaces

---

## [2026-06-14] Modules 3–13 Gap Features & Sidebar Navigation Rollout

### Added
- **Sidebar Integration**: Registered 11 advanced feature routes in the global navigation menu (`layout.tsx`):
  - Predictive Analytics (`/analytics/predictive`) and Advanced BI (`/analytics/advanced`)
  - Advanced Document Mgmt (`/documents/advanced`)
  - Storage & Templates Pro (`/storage/advanced`)
  - Advanced Messaging & Threading (`/communication/advanced`)
  - Advanced POS Features (`/pos/advanced`)
  - Advanced Workflow Engine (`/workflows/advanced`)
  - Security Control Hub (`/admin/security`)
  - App Marketplace (`/admin/marketplace`)
  - API Integration Hub (`/admin/api-platform`)
- **Walkthrough & Tasks**: Generated comprehensive Walkthrough documentation and updated Task lists.

### Fixed
- **ESLint & Unused Imports**: Resolved unused-import warnings in numerous pages
- **TypeScript Type Safety**: Resolved strict type errors across analytics, storage, and other modules
- **Production Build Success**: Successfully compiled and bundled the Next.js frontend without ESLint or TS warnings

---

## [2026-06-14] Module 2: Project Management Gaps Implementation

### Added
- **Database Models & Schema**: `ProjectPortfolio`, `ProjectRisk`, `ChangeRequest` models
- **Backend NestJS APIs**: Portfolio Management, Risk Register, Change Request tracking, EVM Calculator, auto-billing
- **Next.js Frontend Pages**: Strategic Portfolio Hub, Stakeholder Portal, tabbed Projects view, Resource Workloads

---

## [2026-06-14] Module 1: Human Resources (HR) Gaps Implementation

### Added
- **Database Models**: `OfferLetter`, `BenefitScheme`, `EmployeeBenefit`, `SkillRequirement`, `Position`, `ComplianceCheck`, `TaxTable`, `HolidayCalendar`
- **Backend APIs**: Biometric/RFID, overtime calc, compliance scanner, tax brackets, offer letters
- **Frontend Pages**: Self-Service Portal, Benefits Admin, Labor Compliance, Positions, Skills Matrix, Holidays, enhanced Leave/Payroll/Recruitment

---

## [2026-06-14] Cross-Module Advanced Features & MES Rollout

### Added
- **Database Tables**: `Campaign`, `SalesReturn`, `PurchaseReturn`, extended fields for projects, manufacturing, POS
- **Shared Layer**: Zod validators for Campaigns, Returns, POS receipts, API platforms
- **Backend APIs**: Marketing Campaigns, Lead Scoring, Returns with Credit/Debit notes, OEE logging, CPM, SLA engine, receipt templates, presigned S3 URLs
- **Frontend Pages**: Manufacturing diagnostics, Project CPM, POS receipt designer, Visual Query Builder, Workflow editor, API Keys console, Campaigns, Returns

---

## [2026-06-13] Sales & Orders Module Implementation

### Added
- **Database**: Sales channels, payment methods/status fields
- **Backend**: B2B credit limit validation, quotation-to-order conversion
- **Frontend**: Sales dashboard, Quotations workspace, Sales Orders hub, Delivery Notes

---

## [2026-06-13] Advanced Inventory & Stock Control

### Added
- **Database**: `StockLedgerEntry`, `StockEntry`, `QualityInspection`
- **Backend**: Material slip transaction logic, moving average costing, quality inspections
- **Frontend**: 8 tabbed views (Stock Entries, Ledger, Valuations, QA, Serial Numbers, etc.)

---

## [2026-06-13] CRM Advanced Features

### Added
- **Database**: 7 new models (Contact, LeadSource, Lead, SalesPipeline, Opportunity, Activity, EmailTemplate)
- **Backend**: ~50 new endpoints across CRM controller
- **Frontend**: 14 pages including Kanban boards (Leads, Opportunities), detail pages, advanced CRM hub

---

## [2026-06-10] Phase 0 — Foundation Completion

### Added
- **Monorepo Scaffold**: Turborepo + pnpm, shared packages, NestJS backend, Next.js frontend
- **Multi-Tenancy**: PostgreSQL RLS, Prisma middleware, tenant context
- **Authentication**: JWT, RBAC guards, login/register flows
- **Administration**: User/role management, settings, navigation
- **Unit Testing**: Vitest setup, service mocks

---