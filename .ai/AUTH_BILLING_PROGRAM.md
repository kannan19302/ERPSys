# Production Auth, Registration, Subscription & Billing — Program Roadmap

> Source: user directive 2026-07-18 (full spec). Gap analysis by product-manager
> against `MODULE_REGISTRY.md`. This file is the program backlog; each DEV cycle
> ("Start") working this program picks the next unchecked phase item, plans it in
> `IMPLEMENTATION_PLAN.md`, ships it end-to-end onto `main`, and checks it off
> here. Do NOT re-implement anything marked EXISTS — extend it.

## Ground truth (what already exists — do not rebuild)

- **EXISTS**: email/password login, MFA (TOTP + recovery + push approval),
  account lockout, tenant-tiered rate limiting, sessions + device UI, audit
  logging, password reset tokens, register wizard (3-step), tenant+org+roles
  provisioning, entitlement middleware, `Invoice`/`Payment`/`SaaSPlan`/
  `TenantSubscription`/`UsageRecord`/`Subscription*`/`CreditNote` schemas,
  Stripe adapter (ecommerce only, behind `PaymentGatewayAdapter` abstraction),
  admin subscription + super-admin controllers, customer subscription settings
  page.
- **Fixed 2026-07-18**: registration 500 (RLS GUC missing in unauthenticated
  flows — register + SSO JIT provisioning). Commit `c77fc9b`.

## Phase 1 — Authentication completion (auth module, 40/100 MVM)

- [x] 1.1 Email verification (2026-07-18): `EmailVerificationToken` model +
      `users.email_verified_at`, token minted in the register transaction,
      email queued via BullMQ `email` queue, `POST /auth/verify-email` +
      `POST /auth/resend-verification` (throttled, enumeration-safe),
      `/verify-email` page with resend form. Also repaired the RLS-broken
      forgot/reset-password flows via `auth_lookup_reset_token` /
      `auth_lookup_verification_token` SECURITY DEFINER lookups.
      Deferred: blocking sensitive actions until verified — lands with the
      trial/read-only write-guard middleware in 2.3.
- [x] 1.2 Refresh tokens + JWT rotation (2026-07-18): 15m access tokens
      (ACCESS_TOKEN_TTL env), rotating single-use refresh token hashed on
      UserSession (7d / 30d remember-me, sliding), httpOnly cookie scoped to
      /api/v1/auth, `POST /auth/refresh` with `auth_lookup_refresh_token`
      SECURITY DEFINER lookup, revocation clears the hash, web client does
      deduplicated silent refresh-and-retry on 401, Remember-me checkbox wired.
- [x] 1.3/1.4 Real Google OAuth 2.0 + Microsoft Entra ID OIDC (2026-07-18):
      confidential authorization-code flow in `oauth.service.ts` /
      `oauth.controller.ts`; env-gated (GOOGLE*OAUTH*_/MICROSOFT*OAUTH*_,
      MICROSOFT_OAUTH_TENANT, API_PUBLIC_URL); signed 10m `state` JWT
      (TOKEN_TYPE.OAUTH_STATE); identity anchored on provider subject in new
      `user_identities` table (+ RLS + `auth_lookup_oauth_identity`);
      first login matches by verified email (slug disambiguates multi-tenant),
      never auto-creates tenants; provider-verified email satisfies our own
      verification; sessions issued through issueSession (refresh rotation);
      login page shows real provider buttons (disabled until configured) via
      GET /auth/oauth/providers, demo persona modal now dev-only;
      /oauth/complete rotates the refresh cookie into the client session.
      Remaining for full sign-off: live round-trip with real Google/Entra
      credentials in a deployed environment.
- [x] 1.5 Login history entity (2026-07-18): `LoginHistory` model (distinct
      from `UserSession`), success/failure + IP/UA/device/geo-hint, recorded
      from `issueSession`, failed-attempt/lockout, MFA verify failure, and
      push-deny/expiry paths; `GET /auth/login-history`; profile UI table.
- [x] 1.6 CAPTCHA (2026-07-18): `verifyCaptcha()` (Turnstile/hCaptcha,
      env-gated via `CAPTCHA_SECRET_KEY`) wired into login after repeated
      failures, integrated with the existing lockout counters.
- [ ] 1.7 Remove any remaining demo/mock auth code paths (audit login page
      provider buttons; delete fake OAuth stubs) — demo persona modal is now
      dev-only (1.3/1.4); full sweep still open.

## Phase 2 — Registration & onboarding

- [x] 2.1 Extended register wizard + `RegisterInput` (2026-07-18): business
      type, country, language, estimated users, logo URL, industry persisted
      to `Tenant.settings` JSON; currency/timezone onto `Organization`;
      `tenantId` is a client-generated UUID (validated `.uuid()` — was
      unvalidated `z.string()`, tightened 2026-07-19) so the client can poll
      progress before the response returns.
- [x] 2.2 Real provisioning progress (2026-07-18): `ProvisioningService`
      (Redis-backed with in-memory fallback), `GET
    /auth/provisioning/:tenantId/status` polled every 300ms by the register
      page; replaces the old fixed-timer simulated console.
- [x] 2.4 Core modules auto-installed on registration (2026-07-19, this
      user's explicit ask): `AuthService.register()` emits `tenant.registered`
      after its transaction commits; `MarketplaceService` listens
      (`@OnEvent`) and installs all 18 `isCore` apps for the new tenant,
      self-healing an empty catalog via `seedDefaultApps()` if needed.
      Decoupled via the event bus — AuthModule has no direct dependency on
      MarketplaceModule. Verified live: fresh registration → 18/18 apps
      installed, Desk shows them immediately, no manual `/marketplace/seed`
      step required.
- [ ] 2.3 Start every new tenant on a 30-day full-feature evaluation with
      read-only downgrade on expiry — **partially landed but was broken**:
      `TenantWriteGuard` existed as a global `APP_GUARD`, which runs before
      any per-route guard populates `request.user`, so it silently never
      enforced anything. Fixed 2026-07-19: converted to an `APP_INTERCEPTOR`
      (see `tenant-write.guard.ts` for the ordering explanation). Still open:
      nothing currently sets a tenant onto the 30-day trial clock explicitly
      (the guard reads `tenant.createdAt` + `plan === 'free'|'trial'`, which
      works today since new tenants default to `plan: 'free'`) — needs a
      dedicated `TenantSubscription` TRIALING row and explicit read-only UI
      messaging when a write is blocked.

## Phase 3 — Subscription & billing engine (platform side, saas module 43/100)

- [x] 3.1 Schema (2026-07-18): `SaaSCoupon`, `SaaSAddOn`, `TenantAddOn`,
      `PaymentMethod`, `QuotaRule` added. Money fields were created as
      `Float`/`DOUBLE PRECISION` (Track G.8 violation) — fixed forward
      2026-07-19 via a corrective `ALTER COLUMN ... DECIMAL(15,2)` migration
      (the original migration was already applied, so fixed forward rather
      than edited in place) plus explicit `Number()` conversion at the two
      arithmetic call sites in `billing.service.ts`.
- [x] 3.2 Billing calculator (2026-07-18): `calculateBill()` — base plan +
      add-ons + quota-rule overage, itemized. Not yet a full pluggable
      Strategy interface (FreeEvaluation/Hybrid/EnterpriseContract are still
      implicit in the plan's fields rather than swappable strategy classes) —
      revisit if/when a 4th+ billing model is needed.
- [x] 3.3 Metering: `recordUsage()` buffers increments in-memory
      (`usageBuffer`), `getUsageSummary()` reads `UsageRecord`.
- [x] 3.4 Coupons wired into checkout/plan-change (`changePlan(tenantId,
    planId, couponCode)`); proration/regional-pricing/budget-alerts still
      open.
- [x] 3.5 `runDailyRenewal()` — ACTIVE → PAST_DUE → EXPIRED with grace
      period, `POST /billing/cron-run` (admin-triggered; no scheduler
      wired to call it automatically yet — see 5.3).
- [x] 3.6 Stripe + Razorpay webhooks — **had a critical auth bypass, fixed
      2026-07-19 before landing**: `processStripeWebhook`/
      `processRazorpayWebhook` only checked `signature.length >= 10`, i.e.
      any 10+ character string was accepted as a "valid" signature, letting
      anyone forge a `checkout.session.completed`/`order.paid` event and
      upgrade any tenant's plan for free. Replaced with real HMAC-SHA256
      verification (`STRIPE_WEBHOOK_SECRET` / `RAZORPAY_WEBHOOK_SECRET`,
      timing-safe compare, fail-closed if the secret isn't configured — never
      falls back to accepting unsigned events, unlike the ecommerce module's
      Stripe path). Regression-tested in
      `billing-webhook-signature.spec.ts` (7 tests, including the exact
      forged-signature scenario). A second, older, still-unfixed webhook path
      at `POST /saas/webhooks/stripe` (pre-existing, predates this program)
      was found during the audit and flagged separately — see spawned task.

## Phase 4 — Portals

- [x] 4.1 Admin portal (2026-07-18): `apps/web/app/(dashboard)/saas/admin/`
      — plan template CRUD, coupon list/creation, MRR/ARR reporting;
      `saas.subscription.manage` permission-gated endpoints.
- [x] 4.2 Customer billing dashboard: `saas/portal/page.tsx` extended with
      Stripe checkout redirect + coupon code input.
- [ ] 4.3 Plan selection / comparison screens in onboarding — still open
      (register flow doesn't offer a plan choice; everyone starts on `free`).

## Phase 5 — Hardening & docs

- [ ] 5.1 Security pass — **critical finding already fixed** (webhook
      signature bypass, see 3.6); two more pre-existing gaps found and
      flagged for follow-up (unsigned legacy `/saas/webhooks/stripe`, missing
      `RbacGuard` on `/saas/install` + `/saas/uninstall`). Still open: secure
      cookies/CSRF/headers audit, full PCI-scope review.
- [ ] 5.2 Documentation set
- [ ] 5.3 Automated tests: `runDailyRenewal()`/cron scheduling, e2e
      trial-expiry and overage scenarios

## UI/UX pass (2026-07-19, user-reported)

- [x] Icon overlap on login/register/reset-password password fields: the
      show/hide toggle button used `right: var(--space-3-5)`, a custom
      property only defined under `.landing-root` — which none of the
      `/(auth)` pages wrap their content in, so it resolved to nothing and
      the button fell back to its static position, landing on top of the
      left-side lock icon. Fixed with a literal value in `landing.css`.
- [x] MFA push "Approve" not working: the service worker
      (`public/mfa-push-sw.js`) called a _relative_ URL
      (`/api/v1/auth/mfa/push/respond`); converted to a dynamic route
      (`app/mfa-push-sw.js/route.ts`) that bakes in the real API origin
      server-side, added a failure notification instead of silently
      swallowing errors, and made tapping the notification body (not just
      the tiny Approve/Deny buttons) bring the app to the foreground instead
      of doing nothing.
- [x] MFA/push device-sync confusion (QR-scanned-on-phone vs.
      push-approval-registered-on-laptop): these are two genuinely separate
      mechanisms (an authenticator app only generates codes, offline, and
      can never receive push) — added explicit "Step 1 of 2" / "Step 2 of 2
      (optional)" copy in the profile enrollment flow clarifying this, and
      improved push device labels to include OS (`Windows • Chrome`) so
      same-browser-different-device entries are distinguishable.

## Phase 5 — Hardening & docs

- [ ] 5.1 Security pass (security-auditor): secure cookies, CSRF, headers,
      webhook secrets, PCI-scope review of payment flows
- [ ] 5.2 Documentation set: auth/OAuth, billing engine, schema, API docs,
      admin + developer guides
- [ ] 5.3 Automated tests: unit + integration for every strategy, provider
      adapter contract tests, e2e trial-expiry and overage scenarios

## Binding constraints

- No per-user pricing anywhere; resource-based only. Nothing hard-coded —
  plans/prices/quotas live in DB config.
- Every endpoint: tenant isolation + RBAC + Zod. `pnpm architecture:check` on
  API changes; `pnpm migration:discipline` on schema changes.
- Unauthenticated flows that write tenant-scoped rows MUST establish the RLS
  tenant context (`runWithTenantSession` or transaction-local `set_config`) —
  see commit `c77fc9b` for the pattern.
