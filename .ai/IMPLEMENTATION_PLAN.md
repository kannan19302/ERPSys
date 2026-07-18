# Implementation Plan — current DEV cycle

> Overwritten exactly ONCE at cycle start; mid-cycle changes = dated addenda.

## Cycle

- **Cycle #:** 12
- **Phase:** F — Foundation
- **Date:** 2026-07-18
- **Agent/session:** fable-5 (claim: `foundation-track-h1`); autonomous run, iteration 10/10 (final)

## Scope & rationale

**Track H.1 — registry-driven PII erasure declarations** (roadmap § 11c):
GDPR service exists but erasure coverage is unproven; required control =
"every model carrying PII declares its treatment; a test fails when a new
PII model lacks a declaration."

**Duplicate-check:** no PII registry file anywhere (`grep -ril pii` → only
`PII_ENCRYPTION_KEY` env usage + field encryption util); `gdpr.service.ts`
implements per-request erasure but no model-coverage control. Detector
prototype run: **11 models** carry PII-pattern fields (User, Organization,
Employee, Customer, Vendor, Contact, Lead, POSLoyaltyMember, Applicant,
CustomerPortalUser, VendorPortalUser).

## Ordered work items

1. `scripts/pii-registry.json` — declaration per model: treatment
   (`erase` | `anonymize` | `retain-legal-hold`), the PII fields, rationale,
   review status. Initial classifications: portal users/members/applicants/
   contacts/leads → erase; Customer/Vendor/Organization → anonymize (legal
   business-document counterparties); Employee → retain-legal-hold →
   anonymize post-statutory; User → anonymize (FK-referenced author trails).
2. `scripts/check-pii-registry.mjs` — parses schema.prisma with the PII
   field heuristic; FAILS if a matching model lacks a registry declaration
   (or a registry entry references a vanished model). Prove red with a probe
   model, green after.
3. Wire into CI beside the schema lint.
4. Record + ship: CHANGELOG, Ledger 11 → 12, roadmap H.1 status (registry
   control live; erasure-run audit report remains with H.1's runtime half),
   board, lock, `main`.

## Acceptance criteria

- Checker green at HEAD, red on an undeclared PII model (proof run).
- 11 models declared with explicit treatments + rationale.
- CI step added; no schema changes.

## Gate tier & rollback note

- **FAST** — tooling + registry data.
- **Rollback:** remove CI line + two files.

## Addenda (dated, append-only)

—
