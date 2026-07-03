# E-Commerce Storefront Module — MVP Requirements

> **Owner**: product-manager
> **Module (new)**: Storefront / E-Commerce — `apps/api/src/modules/storefront` (new), public-facing
> pages under `apps/web/app/(storefront)/` (new, no dashboard sidebar), admin config under
> `apps/web/app/(dashboard)/ecommerce/` (new)
> **Registry status**: not yet in `.ai/MODULE_REGISTRY.md` — to be added as module #33,
> status `🟡 IN_PROGRESS`, depends on Inventory, Sales, Finance, CRM
> **Last updated**: 2026-07-03

---

## 0. Duplicate Feature Gate — result

Checked before writing this spec, per mandatory process:

- `.ai/MODULE_REGISTRY.md` — no e-commerce/storefront/online-store/cart/checkout entry among the
  31 registered modules.
- Grepped `apps/api/src/modules/**` and `apps/web/app/(dashboard)/**` for
  `storefront|ecommerce|e-commerce|online store|Cart|Checkout` (case-insensitive). Matches found:
  - `apps/api/src/modules/marketplace/storefront.service.ts` /
    `apps/api/src/modules/marketplace/storefront.controller.ts` — this is the **App Marketplace
    store** (installable `AppPackage`/`AppVendor`/`AppBundle` — Studio's "app store", Phase 20 /
    module #31 Studio ecosystem). Lists first-party/third-party *apps for tenants to install into
    UniERP*. It is unrelated to selling physical/digital *products to end customers*. No collision.
  - `apps/web/app/(dashboard)/builder/web/orders/page.tsx` and `.../builder/web/pages/page.tsx` —
    these belong to **Web Studio CMS** (`WebCollection`/`WebCollectionItem`/`WebFormSubmission`),
    a generic dynamic-content/form-submission engine for building marketing sites, not a
    product catalog + cart + checkout + payment flow.
  - `pos.controller.ts` / `pos.service.ts` — **POS & Retail** (module #14), in-person retail with a
    cash register/terminal UI. No cart-for-anonymous-web-customer concept, no public unauthenticated
    access, no online payment gateway.
  - Everything else (`education`, `advanced-hr`, `saas/billing.*`) matched only on the substring
    "order" (e.g. "purchase order", "work order") — false positives, not e-commerce.
- **Conclusion: this is a genuinely new module.** No existing capability lets an anonymous external
  customer browse a catalog, add to cart, and pay online. Proceeding with a full spec.

### What we deliberately reuse (not duplicating)
- **Product catalog** → existing `Product` model (`packages/database/prisma/schema.prisma`,
  Inventory module). We do NOT create a parallel `ProductListing` entity. We add a thin
  storefront-visibility layer on top.
- **Order capture** → existing `SalesOrder` + `SalesOrderItem` (Sales module). `SalesOrder` already
  has a `salesChannel` field (`@default("B2B")`) — proof the schema anticipated multiple channels.
  We add a `"ONLINE"` channel value; no new order entity.
- **Billing** → existing `Invoice` (Finance module). Checkout completion creates a real `SalesOrder`
  → existing Sales→Finance event wiring creates/attaches the `Invoice` exactly as it does for any
  other confirmed sales order. We do not build a second invoicing path.
- **Customer identity** → existing `Customer` (CRM/core). Guest checkout creates/looks up a
  `Customer` record the same way an internal sales rep would.

---

## 1. Problem & user

- **Persona: Tenant Admin / Store Manager** (see `.ai/GLOSSARY.md` — the person who configures
  modules for their org). Needs to turn a subset of their existing Inventory catalog into a
  public web storefront without re-entering product data, and see resulting orders land in the
  same Sales/Finance pipeline they already use for B2B orders.
- **Persona: External Customer** (new persona for this spec — an anonymous or lightly-authenticated
  shopper, not a UniERP dashboard user). Needs to browse products by category, add items to a cart,
  enter shipping info, pay, and receive order confirmation — with zero knowledge of UniERP's internal
  dashboard.

## 2. Existing coverage vs. gap

| Capability | Exists today? | Where | Gap |
|:---|:---|:---|:---|
| Product catalog data | Yes | Inventory `Product` | No "publish to web" flag, no public read API |
| Categories | Partial | `Product.category` (free-text string) | No structured category tree, no public browse-by-category API |
| Order creation | Yes (internal) | Sales `SalesOrder` | No public/anonymous-facing creation path; all existing endpoints are dashboard/RBAC-gated for internal staff |
| Invoicing | Yes | Finance `Invoice` | No gap — reused as-is once `SalesOrder` is created |
| Payment collection | Not for online/card payment | Finance `Payment` records payments but has no gateway integration | Net-new: payment gateway abstraction |
| Public/anonymous access to any API | No | — | Net-new: unauthenticated public routes, distinct from JWT-gated dashboard API |

## 3. Scope

### 3.1 In scope (MVP)

**Admin side (tenant-authenticated, RBAC-gated, `apps/web/app/(dashboard)/ecommerce/`)**
- Enable/disable storefront for the tenant (`StorefrontConfig`: store name, active flag, currency,
  basic theme color — no visual theme builder).
- Select which existing `Product` rows are storefront-visible (`ProductListing` join-style
  extension: `isPublished`, `storefrontPrice` override optional, `sortOrder`) — reuses `Product`,
  does not fork it.
- Manage a flat `StorefrontCategory` list and assign products to categories (many-to-many via
  `ProductListing.categoryId`, single category per listing for MVP — no nested category trees).
- View incoming online orders (reuses the existing Sales Orders list, filtered by
  `salesChannel = 'ONLINE'`; no new order list UI required beyond a filter/tab).

**Public/customer side (unauthenticated, `apps/web/app/(storefront)/`, new route group with
no dashboard chrome)**
- `/store/[tenantSlug]` catalog home — grid of published products, filterable by category.
- `/store/[tenantSlug]/product/[productId]` product detail page.
- Cart: client-side cart (localStorage-backed) + server-persisted `Cart`/`CartItem` once checkout
  starts (so abandoned-cart recovery is possible later, but MVP does not build recovery emails).
- Checkout: shipping address form → order summary → payment step.
- **Payment**: a `PaymentGatewayAdapter` interface shaped like Stripe's PaymentIntent flow
  (`createIntent`, `confirmIntent`, `refund`) with exactly one implementation for MVP —
  `MockPaymentGatewayService`, clearly labeled `MOCK` in code, logs, and the UI ("Test payment —
  no real charge"). No silent faking: the mock is documented as a swappable seam, not disguised
  as a real gateway. Real Stripe wiring is an explicit fast-follow (Section 4).
- On successful (mock) payment: create a real `SalesOrder` (`salesChannel = 'ONLINE'`) +
  `SalesOrderItem`s via the existing Sales module's creation path, which in turn triggers the
  existing `sales.order.confirmed` → Finance `Invoice` creation event. Order confirmation page
  shows the resulting order number.
- Guest checkout creates/reuses a `Customer` record by email (no signup/login required for MVP).

### 3.2 Explicitly OUT of scope for this pass (fast-follow backlog)

- Multi-vendor marketplace (single tenant = single store only).
- Subscriptions / recurring billing.
- Promotions/discount/coupon engine (flat `storefrontPrice` override only; no rules engine).
- Real payment gateway wiring (Stripe/PayPal/etc.) — MVP ships the mock adapter only, interface
  designed for a drop-in swap.
- Customer accounts/login, order history portal, saved addresses, wishlists.
- Reviews & ratings, product variants/options (size/color matrices), inventory-level stock
  reservation at add-to-cart time (MVP checks stock only at order-confirm time, same as existing
  Sales Order behavior).
- Shipping rate calculation / carrier integration (flat/free shipping only, or a single
  admin-configured flat rate).
- Tax calculation engine beyond the existing `Product.taxCategory`/tenant default tax rate already
  used by Sales/Finance.
- Abandoned cart recovery emails, SEO metadata tooling, storefront theming/visual builder.
- Nested category trees (flat list only in MVP).
- Search (category filter + simple name search only, no full-text ranking).

If any of the above turn out to be a blocking requirement, that is a scope conversation to have
explicitly — not something to silently add mid-build.

## 4. Core entities (new Prisma models)

All follow `.ai/DATA_MODEL.md` conventions: `id` (cuid2), `tenantId`, `createdAt`/`updatedAt`,
soft-delete where recoverable.

```prisma
model StorefrontConfig {
  id            String   @id @default(cuid())
  tenantId      String   @unique @map("tenant_id")
  orgId         String   @map("org_id")
  storeName     String   @map("store_name")
  isActive      Boolean  @default(false) @map("is_active")
  currency      String   @default("USD")
  flatShippingFee Decimal @default(0) @map("flat_shipping_fee") @db.Decimal(15, 2)
  themeColor    String?  @map("theme_color")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  @@map("storefront_configs")
}

model StorefrontCategory {
  id          String   @id @default(cuid())
  tenantId    String   @map("tenant_id")
  name        String
  slug        String
  sortOrder   Int      @default(0) @map("sort_order")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  listings    ProductListing[]

  @@unique([tenantId, slug])
  @@map("storefront_categories")
}

model ProductListing {
  id               String    @id @default(cuid())
  tenantId         String    @map("tenant_id")
  productId        String    @map("product_id")
  categoryId       String?   @map("category_id")
  isPublished      Boolean   @default(false) @map("is_published")
  storefrontPrice  Decimal?  @map("storefront_price") @db.Decimal(15, 2) // null = use Product.sellPrice
  sortOrder        Int       @default(0) @map("sort_order")
  createdAt        DateTime  @default(now()) @map("created_at")
  updatedAt        DateTime  @updatedAt @map("updated_at")

  product   Product              @relation(fields: [productId], references: [id])
  category  StorefrontCategory?  @relation(fields: [categoryId], references: [id])

  @@unique([tenantId, productId])
  @@index([tenantId, isPublished])
  @@map("product_listings")
}

model Cart {
  id          String    @id @default(cuid())
  tenantId    String    @map("tenant_id")
  sessionId   String    @map("session_id") // browser-generated UUID, no auth required
  customerEmail String? @map("customer_email")
  status      String    @default("OPEN") // OPEN, CHECKED_OUT, ABANDONED
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")

  items       CartItem[]

  @@index([tenantId, sessionId])
  @@map("carts")
}

model CartItem {
  id         String   @id @default(cuid())
  tenantId   String   @map("tenant_id")
  cartId     String   @map("cart_id")
  productId  String   @map("product_id")
  quantity   Int
  unitPrice  Decimal  @db.Decimal(15, 2) // snapshot at add-to-cart time
  createdAt  DateTime @default(now()) @map("created_at")
  updatedAt  DateTime @updatedAt @map("updated_at")

  cart    Cart    @relation(fields: [cartId], references: [id], onDelete: Cascade)
  product Product @relation(fields: [productId], references: [id])

  @@map("cart_items")
}

model StorefrontOrderPayment {
  id              String   @id @default(cuid())
  tenantId        String   @map("tenant_id")
  salesOrderId    String   @map("sales_order_id")
  gateway         String   @default("MOCK") // MOCK today; STRIPE fast-follow
  gatewayIntentId String   @map("gateway_intent_id") // mock-generated id, Stripe PaymentIntent id later
  status          String   @default("PENDING") // PENDING, SUCCEEDED, FAILED, REFUNDED
  amount          Decimal  @db.Decimal(15, 2)
  currency        String   @default("USD")
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  @@index([tenantId, salesOrderId])
  @@map("storefront_order_payments")
}
```

Notes:
- `Cart`/`CartItem` are intentionally NOT tied to a `Customer` or `User` — anonymous session-based,
  matching the "no login required" MVP flow.
- `StorefrontOrderPayment` is a thin ledger row per payment attempt; it does not replace `Payment`
  (Finance module) — once `SalesOrder`→`Invoice` exists, a real `Payment` record should also be
  created against that invoice using existing Finance flows (fast-follow wiring detail for
  backend-developer to confirm — see Section 6).

## 5. Key user flows (MVP)

### Flow A — Admin enables storefront and lists products
```
As a Tenant Admin,
I want to enable the storefront and choose which products are listed,
so that customers can browse and buy without me re-entering catalog data.

Given I have "ecommerce.storefront.manage" permission
When I visit /ecommerce/settings and toggle "Enable Storefront" on
Then a StorefrontConfig row is created/updated with isActive = true
And the public /store/[tenantSlug] route becomes reachable (404s while disabled)

Given I am on /ecommerce/products
When I select an existing Inventory Product and toggle "Publish to storefront"
Then a ProductListing row is created with isPublished = true
And that product appears on the public catalog within the same request cycle (no caching lag for MVP)
```

### Flow B — Customer browses and adds to cart
```
As an external Customer,
I want to browse products by category and add items to my cart,
so that I can purchase what I need.

Given the storefront is active for tenant "acme"
When I visit /store/acme
Then I see only ProductListing rows where isPublished = true, grouped/filterable by StorefrontCategory

Given I am viewing a product detail page
When I click "Add to cart" with quantity 2
Then a Cart (keyed by a browser-persisted sessionId) and CartItem are created/updated server-side
And the cart badge reflects the new item count
```

### Flow C — Checkout with mock payment
```
As an external Customer,
I want to check out with a shipping address and pay,
so that I receive my order.

Given my cart has at least 1 item
When I proceed to checkout and submit a valid shipping address
Then I see an order summary (subtotal, flat shipping fee, tax, total)

Given I click "Pay now" on the (clearly labeled "Test Payment") payment step
When MockPaymentGatewayService.createIntent() + confirmIntent() both resolve successfully
Then a real SalesOrder is created (salesChannel = "ONLINE", status = "CONFIRMED") with SalesOrderItems
  matching the cart contents, using price snapshots from CartItem.unitPrice
And a StorefrontOrderPayment row is created with status = "SUCCEEDED"
And the existing sales.order.confirmed event fires, triggering existing Finance Invoice creation
  (no new invoicing code written for this module)
And the Cart status is set to CHECKED_OUT
And I land on an order confirmation page showing the SalesOrder's orderNumber

Given the mock gateway is configured to simulate a decline (test-mode toggle)
When I click "Pay now"
Then no SalesOrder is created, the StorefrontOrderPayment (if any) shows status = "FAILED",
  and I see an inline error allowing retry
```

### Flow D — Admin views online orders
```
As a Tenant Admin,
I want to see storefront orders alongside my other sales orders,
so that I don't need a separate order management screen.

Given at least one storefront checkout has completed
When I visit /sales/orders and filter by Channel = "Online"
Then I see the resulting SalesOrder rows exactly as any other sales order (existing Sales UI, no
  new order list built for this module — only a channel filter/badge addition)
```

## 6. Dependencies & sequencing

Depends on (all already 🟢 ACTIVE, no blocked prerequisites):
- **Inventory** (`Product`) — read-only reuse.
- **Sales** (`SalesOrder`, `SalesOrderItem`) — write path reused; requires confirming the existing
  `SalesOrder` creation service can be called with `salesChannel: 'ONLINE'` and a guest `Customer`
  (no employee `createdBy`). If the current service assumes an authenticated internal user context,
  backend-developer must add a variant entry point (e.g. `createFromStorefront()`), NOT bypass
  tenant scoping or duplicate the model.
- **Finance** (`Invoice`, `Payment`) — event-driven reuse via existing `sales.order.confirmed`
  listener; confirm a `Payment` row also gets created against the invoice for a paid-online order
  (currently `Payment` creation may be manual/AR-driven — this is a real integration question for
  backend-developer to resolve, not assumed away).
- **CRM** (`Customer`) — guest checkout creates-or-finds by email + tenant.

Recommended build order (thin vertical slices, per project rule):
1. **data-architect**: `StorefrontConfig`, `StorefrontCategory`, `ProductListing`, `Cart`,
   `CartItem`, `StorefrontOrderPayment` models + migration.
2. **backend-developer**: admin config + product-listing CRUD endpoints (RBAC-gated) — Flow A only.
3. **frontend-developer**: admin `/ecommerce/settings` and `/ecommerce/products` pages — Flow A UI.
4. **backend-developer**: public read-only catalog endpoints (no auth) + cart endpoints — Flow B.
5. **frontend-developer**: public `/store/[tenantSlug]` catalog + product + cart pages — Flow B UI.
6. **backend-developer**: `PaymentGatewayAdapter` interface + `MockPaymentGatewayService` +
   checkout endpoint that creates the real `SalesOrder` — Flow C.
7. **frontend-developer**: checkout + confirmation pages — Flow C UI.
8. **backend-developer**+**frontend-developer**: channel filter on existing Sales Orders list — Flow D.
9. **qa-tester**: full flow test plan (Section 8).
10. **business-analyst-uat**: UAT script for admin + guest personas.

No cross-module imports: the new `storefront` module must call Sales/Finance/Inventory only via
their existing public service methods (if invoked in-process within the same Nest app, that's
allowed like other modules do today) or domain events — never reach into their Prisma models
directly for writes it doesn't own.

## 7. Permission model additions

Add to `packages/shared/src/permissions/registry.ts` (module string: `ecommerce`, matching the
`p(module, resource, action, ...)` helper already used for `sales`/`finance`/etc.):

```ts
// E-Commerce / Storefront
p('ecommerce', 'storefront', 'read', 'endpoint', 'View storefront configuration'),
p('ecommerce', 'storefront', 'manage', 'endpoint', 'Enable/disable storefront and edit settings'),
p('ecommerce', 'listing', 'read', 'endpoint', 'View product listings'),
p('ecommerce', 'listing', 'create', 'endpoint', 'Publish products to storefront'),
p('ecommerce', 'listing', 'update', 'endpoint', 'Update storefront listing (price override, sort, category)'),
p('ecommerce', 'listing', 'delete', 'endpoint', 'Unpublish a storefront listing'),
p('ecommerce', 'category', 'read', 'endpoint', 'View storefront categories'),
p('ecommerce', 'category', 'create', 'endpoint', 'Create storefront categories'),
p('ecommerce', 'category', 'update', 'endpoint', 'Update storefront categories'),
p('ecommerce', 'category', 'delete', 'endpoint', 'Delete storefront categories'),
p('ecommerce', 'order', 'read', 'endpoint', 'View storefront (online-channel) orders'),
```

Note: public/anonymous storefront routes (`/store/*` catalog browse, cart, checkout) are **not**
behind `@Permissions()` — they are unauthenticated by design (external customers have no UniERP
account). These routes still MUST be tenant-scoped (resolved via `tenantSlug` in the URL, not a
JWT), and MUST NOT reuse the internal `TenantGuard`/`RbacGuard` pair that assumes an authenticated
session — a new lightweight `PublicTenantResolverGuard` (or equivalent) resolves tenant context
from the slug and rejects requests where `StorefrontConfig.isActive` is false. This is the one
deliberate exception to Rule 15 in `AGENTS.md` ("every endpoint MUST use `@Permissions`") and must
be called out explicitly in code review/security-audit — it is not an oversight.

## 8. Cross-cutting requirements

- **Multi-tenancy**: every new model has `tenantId`. Public routes resolve tenant via URL slug
  (`/store/[tenantSlug]`), not JWT — flag this for security-auditor as a distinct tenant-resolution
  path that needs its own review (can't reuse the standard JWT-based tenant middleware).
  `Cart`/`CartItem` scoped by `tenantId` + `sessionId`, never trusting a client-supplied `tenantId`
  directly without validating the slug maps to it.
- **RBAC**: all `/ecommerce/*` admin endpoints gated per Section 7; public `/store/*` endpoints are
  the explicit, documented exception (Section 7 note).
- **Change history**: `StorefrontConfig`, `StorefrontCategory`, `ProductListing` mutations use
  `@TrackChanges('StorefrontConfig' | 'StorefrontCategory' | 'ProductListing')` +
  `ChangeHistoryInterceptor` per AGENTS.md Rule 13. `Cart`/`CartItem`/`StorefrontOrderPayment` are
  excluded (high-volume, low-audit-value, anonymous actor — no `userId` to attribute changes to).
- **i18n**: out of scope for MVP UI copy (English only), but currency/number formatting on the
  storefront must use the tenant's configured currency (`StorefrontConfig.currency`), not hardcoded
  `$`.
- **Audit**: `StorefrontOrderPayment` status transitions (`PENDING`→`SUCCEEDED`/`FAILED`) should be
  logged for later reconciliation once a real gateway replaces the mock — the mock's transaction log
  is the seam qa-tester should validate is swap-ready.

## 9. Success metrics / "MVP done" acceptance criteria (for qa-tester)

1. Admin can toggle storefront on/off and the public route reflects it within one request (no stale
   cache serving a disabled store).
2. Admin can publish an existing Inventory `Product` and it appears on `/store/[tenantSlug]` with
   correct name, image (if present), and effective price (`storefrontPrice` override if set, else
   `Product.sellPrice`).
3. Unpublishing a product removes it from the public catalog immediately; direct navigation to its
   now-unpublished product detail URL returns 404, not a broken page.
4. A customer can add multiple distinct products and quantities to a cart across multiple page
   loads (cart survives a refresh via persisted `sessionId`).
5. Checkout with a valid shipping address and the mock "successful payment" path creates exactly
   one `SalesOrder` with `salesChannel = 'ONLINE'`, matching `SalesOrderItem` rows, and a
   `StorefrontOrderPayment` with `status = 'SUCCEEDED'`.
6. That `SalesOrder` triggers the existing `sales.order.confirmed` → `Invoice` creation path with no
   modification to Finance module code (proves reuse, not duplication).
7. Checkout with the mock "declined payment" path creates zero `SalesOrder` rows and surfaces a
   retry-able error to the customer.
8. Two different tenants' storefronts (`/store/tenant-a` vs `/store/tenant-b`) never leak each
   other's products, categories, or carts — verified by a cross-tenant isolation test.
9. All `/ecommerce/*` admin endpoints reject requests lacking the relevant `ecommerce.*` permission
   (403), verified per-permission.
10. `pnpm --filter @unerp/api typecheck` and the new module's Vitest suite (service + controller
    specs for both admin and public controllers) pass; public controller has explicit tests proving
    it does NOT require a JWT/`Authorization` header.

---

## Next agents

- **data-architect** — implement the 6 Prisma models above (Section 4), migration
  `pnpm db:migrate --name ecommerce_storefront_initial`, and confirm indexing strategy for the
  public catalog query path (`ProductListing` by `tenantId + isPublished`, likely highest QPS
  endpoint in this module).
- **backend-developer** — build `apps/api/src/modules/storefront/` per the module template
  (`.ai/ARCHITECTURE.md` Section 3): two controllers (`storefront-admin.controller.ts` RBAC-gated,
  `storefront-public.controller.ts` unauthenticated + new `PublicTenantResolverGuard`), the
  `PaymentGatewayAdapter` interface + `MockPaymentGatewayService`, and the checkout flow that calls
  into Sales' existing order-creation path (confirm/extend that service per Section 6 point 2).
  Register new permissions in `packages/shared/src/permissions/registry.ts` per Section 7.
- **frontend-developer** — admin pages `apps/web/app/(dashboard)/ecommerce/{settings,products}/page.tsx`
  (standard dashboard chrome, breadcrumbs, `.frappe-*` classes); new public route group
  `apps/web/app/(storefront)/store/[tenantSlug]/{page.tsx, product/[productId]/page.tsx,
  cart/page.tsx, checkout/page.tsx, order-confirmation/[orderId]/page.tsx}` — **no dashboard sidebar,
  no auth-gated layout**, distinct minimal storefront shell/theme.
- **qa-tester** — test plan covering Section 9 acceptance criteria end-to-end, plus explicit
  cross-tenant isolation and unauthenticated-access regression tests for the public controller.
- **business-analyst-uat** — UAT script with two personas (Tenant Admin enabling/publishing;
  Guest Customer completing a purchase), sign-off gated on all 10 acceptance criteria in Section 9.
- **tech-writer** — once built, add module #33 row to `.ai/MODULE_REGISTRY.md` and a
  `.ai/CHANGELOG.md` entry; update `.ai/DATA_MODEL.md` if the public tenant-resolution pattern
  (slug-based, non-JWT) is judged reusable enough to document as a standing pattern for future
  public-facing modules.
