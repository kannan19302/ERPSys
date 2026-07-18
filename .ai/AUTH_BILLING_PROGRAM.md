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
- [ ] 1.5 Login history entity (distinct from sessions): success/failure, IP,
      UA, geo-hint; surface in profile UI
- [ ] 1.6 CAPTCHA (Turnstile/hCaptcha, env-gated) after N failed attempts —
      integrates with existing lockout counters
- [ ] 1.7 Remove any remaining demo/mock auth code paths (audit login page
      provider buttons; delete fake OAuth stubs)

## Phase 2 — Registration & onboarding

- [ ] 2.1 Extend register wizard + `RegisterInput`: business type, country,
      language, estimated users (informational), logo upload (optional);
      persist currency/timezone/industry that the UI already collects but the
      API currently ignores
- [ ] 2.2 Replace simulated seeding console with real provisioning progress
      (SSE or polling on a provisioning job)
- [ ] 2.3 Start every new tenant on a 30-day full-feature evaluation
      (`TenantSubscription` TRIALING) with read-only downgrade on expiry
      (write-guard middleware honoring export/report/billing/support carve-outs)

## Phase 3 — Subscription & billing engine (platform side, saas module 43/100)

- [ ] 3.1 Schema: `Coupon`, `Discount`, `AddOnPack`, `AddOnPurchase`,
      `PaymentMethod`, `PricingRule`, `QuotaRule`, plan versioning + regional
      prices; migrations via `pnpm db:deploy`
- [ ] 3.2 Billing-model Strategy: FreeEvaluation / FixedPrepaid / Metered /
      Hybrid / EnterpriseContract strategies behind one interface; plan config
      (not code) selects strategy; per-plan overage behavior (block / meter /
      auto-addon / notify / grace)
- [ ] 3.3 Metering pipeline: event-driven usage ingestion (API calls, storage,
      jobs, emails…) feeding `UsageRecord` with history; extensible metric
      registry (no code change to add a metric)
- [ ] 3.4 Pricing engine: proration on plan change, coupons, taxes, regional
      pricing/currency, credit notes, budget alerts, spending limits —
      configuration-driven
- [ ] 3.5 Renewal/dunning scheduler: billing cycles (monthly/quarterly/annual),
      auto-renew, grace periods, invoice generation
- [ ] 3.6 Payment providers: wire real Stripe into platform checkout (replace
      stub in `billing.service.ts`); add Razorpay behind the existing
      `PaymentGatewayAdapter` abstraction; webhooks with signature verification

## Phase 4 — Portals

- [ ] 4.1 Admin portal: plan/pricing/quota CRUD UI, coupons, add-ons, trial
      extensions, manual credits/refunds/invoices, revenue & usage reports,
      account suspension — config-only plan launches
- [ ] 4.2 Customer billing dashboard: current plan, trial status, usage charts,
      quota remaining, cost estimate/forecast, invoices, payment methods,
      upgrade/downgrade, add-on purchase
- [ ] 4.3 Plan selection / comparison screens in onboarding + settings

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
