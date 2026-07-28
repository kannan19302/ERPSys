# MULTI_CLIENT_MASTER_PLAN.md — Sealed v1.0 (2026-07-28)

> **Status: SEALED.** This document is a permanent, binding contract, at the
> same governance tier as `.ai/ARCHITECTURE_FOUNDATION.md`. Every AI agent
> and every DEV/QA cycle MUST read and execute against it. **No agent may
> edit this file.** Amending it requires an explicit human instruction that
> names this file and states an intent to change the seal — not inferred
> from ordinary feature work. `AUTOPILOT.md` and `AGENTS.md` reference it as
> a permanent contract alongside `ARCHITECTURE_FOUNDATION.md`.

## 1. The one goal

**UniERP ships full feature parity across three client surfaces — the
existing Next.js web app, a Flutter mobile app (iOS/Android), and a Flutter
desktop app (Windows/macOS/Linux, same codebase as mobile) — for every
module, growing together, until the ERP program itself is complete.**

This supersedes the implicit prior assumption that web is the primary
client and mobile/desktop trail behind it. From the point this document is
sealed, **no module's maturity tier may advance past MVM on the strength of
web-only work** — see § 3.

This is not a bounded project with an end date. It is the standing shape of
all future DEV cycles, replacing "grow the web/API surface" with "grow
web + mobile + desktop together" as the unit of progress. It does not
change *what* UniERP is trying to become (§ Mission in `AUTOPILOT.md`) —
only that every module's growth must now land on all three surfaces.

## 2. Non-negotiable architectural decision: keep the poly-repo gateway

The four industry-vertical apps (`unierp-app-education`, `-fieldservice`,
`-healthcare`, `-realestate`) remain **separate microservices**, reached
only through `apps/api/src/modules/ext-gateway` (`/api/v1/ext/<slug>/*`).
They are **not** merged into `apps/api`. All three clients (web, mobile,
desktop) treat `apps/api` as the single logical API surface; Flutter never
talks to a vertical service directly. This preserves `ARCHITECTURE_FOUNDATION.md`
rule 1 (extensions reach core only via public API/events/gateway) and rule 8
(extension compatibility is an executable, versioned contract). No changes
to the 4 sibling repos are required or permitted by this document.

## 3. Module completion now has 6 criteria, not 5

`MODULE_REGISTRY.md § 0` and `AUTOPILOT.md`'s Module Completion Goal
currently bind a module's "Complete"/"Deep" status to 5 criteria (1500+
weighted features, full CRUD w/ pagination/sorting, 80%+ test coverage,
feature parity/superiority vs. top 10 ERP leaders, and — implicitly —
shipped on web). Effective at this seal, add a **6th, equally binding**
criterion:

> **6. Cross-platform parity.** The module's feature set ships on Web
> (Next.js) **and** Mobile (Flutter, iOS/Android) **and** Desktop (Flutter,
> Windows/macOS/Linux) — OR the module is a logged **Tier 4 exemption**
> (§ 5) with the exemption reason recorded in `MODULE_REGISTRY.md`.

A module cannot be marked Complete or Deep with criterion 6 unmet and no
logged exemption. This is enforced the same way the other 5 criteria are
enforced today — by `scripts/feature-ledger.mjs` / `module-health.mjs` and
by the Collab Board review step, extended to also read the per-module
cross-platform status field added to `MODULE_REGISTRY.md`.

## 4. The phase/sprint formula (generative, not pre-authored)

To avoid the trap of hand-writing 1000+ sprint descriptions (which would be
stale the moment reality diverges, and contradicts how AUTOPILOT.md already
works — one cycle's `IMPLEMENTATION_PLAN.md` generated at a time), the
100+ phases / 1000+ sprints are defined as a **formula over existing,
already-tracked units**:

- **Module count**: read live from `MODULE_REGISTRY.md § System Progress
  Dashboard` at any point in time. At seal time: **45 modules** (verified
  2026-07-28 against the Module Health List — includes the 4 externalized
  vertical apps `education`, `field-service`, `healthcare`, `real-estate`,
  which are tracked in the registry even though they run as separate
  services per § 2).
- **Parity Phase** = one module's transition across one existing maturity-tier
  boundary. `AUTOPILOT.md` already defines 7 tiers: Skeleton (<10) → MVM
  (10–50) → Functional (50–200) → Competitive (200–500) → Advanced
  (500–1000) → Complete (1000–1500) → Deep (1500+) — i.e. **6 tier-transitions
  per module**.
  → **45 modules × 6 tier-transitions = 270 Parity Phases.**
  (Named "Parity Phase" — not bare "Phase" — to avoid colliding with
  `MODULE_REGISTRY.md`'s existing "Phase 0–20" module-category grouping,
  which is an unrelated, older numbering and is untouched by this document.)
- **Sprint** = one horizontal-layer batch within a Parity Phase (DB layer,
  API layer, then UI-layer slices), i.e. exactly today's "1 sprint = 1
  AUTOPILOT DEV cycle's batch" (`COMPETITIVE_ROADMAP.md § 2`). Historical
  velocity is 40–186 features/cycle; typical tier deltas run 40–500+
  features, so a Parity Phase realistically spans **~3–5 sprints**.
  → **270 Parity Phases × ~4 sprints ≈ 1,080 sprints.**
- Both numbers are **derived, live, and re-computed from `MODULE_REGISTRY.md`
  as modules grow** — they are not a fixed checklist to tick off. As the
  module count or tier thresholds change, so do these totals; this document
  does not need to be re-sealed for that, only if the *formula itself*
  changes.

## 5. Client-applicability tiers (bounds what "grow together" requires)

Not every module makes sense on every surface. Modules/areas are classified
once, here, and the classification is what `MODULE_REGISTRY.md`'s
cross-platform exemption field points back to:

| Tier | Modules | Client requirement |
|---|---|---|
| **Tier 1** — core daily-use | auth, dashboard/home, crm, inventory, sales, finance, hr, people, projects, notifications, marketplace (browse/install) | Full parity: Web + Mobile + Desktop, every Parity Phase. |
| **Tier 2** — remaining core ERP | procurement, supply-chain, manufacturing, fixed-assets, advanced-finance, hr-advanced, communication, documents, drive, pos, reporting, search, saved-views, ecommerce, subscriptions, service-management, storage, pwa | Full parity, generic bundle-renderer (§ 6) preferred over native where the module is list/detail-shaped; native where interaction-heavy (pos, communication). |
| **Tier 3** — marketplace vertical apps | education, field-service, healthcare, real-estate | Full parity via the generic bundle-renderer (§ 6) by default; native Flutter only where a vertical genuinely needs it (field-service: signature capture, dispatch board; real-estate: lease-schedule charts; education: calendar/timetable; healthcare: dedicated native module — clinical charting/CPOE/e-Rx/ADT are not safe to render generically). |
| **Tier 4** — config/authoring/admin, web-or-desktop-only by default | builder, devops, api-platform, blockchain, localization, ai (config screens; a thin mobile chat client is allowed), analytics (mobile gets read-only dashboards; authoring stays desktop), saas-portal (minimal presence everywhere — kernel module), admin (desktop yes, mobile read-only at most) | **Exempted from full Tier-1-style parity by default.** Each exemption must still be an explicit row in `MODULE_REGISTRY.md`'s cross-platform status field (`Exempted — <reason>`), not a silent omission. |

Rule of thumb for classifying any module not listed above: if the web UI is
primarily **configuration/authoring**, it defaults to Tier 4 (web/desktop
only); if it is primarily **data consumption or field data-entry**, it is
Tier 1/2/3 and requires full parity.

## 6. The mechanism that makes "grow together" possible without an app-store release per module

A generic, manifest-driven bundle-page renderer (Flutter `features/bundle_renderer/`)
consumes the same `pages[]` schema `apps/api/src/modules/marketplace` already
defines and that `apps/web` already renders generically (see
`unierp-app-fieldservice/bundle/manifest.json` for the reference shape).
Flutter fetches a module/app's manifest via `GET /marketplace/apps/:slug/manifest`
(new endpoint, § 7), caches it, and dynamically builds nav + routes from it —
so most Tier 2/3 modules do not require a compiled Dart release to appear on
mobile/desktop. Native Flutter feature modules are reserved for the specific
exceptions named in § 5's Tier 3 row.

## 7. Phase 0 — prerequisite gate (must land before any Parity Phase counts)

Cross-platform credit toward criterion 6 (§ 3) does not start accruing for
**any** module until this prerequisite work lands:

1. `apps/mobile` registered in `MODULE_REGISTRY.md` (currently untracked).
2. Flutter platform targets for macOS and Linux added to `apps/mobile`
   (Windows, Android, iOS already scaffolded).
3. `apps/api/src/modules/auth`: device/refresh-token grant flow (short-lived
   access JWT + rotating refresh token per device; `deviceId`/`platform`/
   `appVersion` on issuance) — distinct from the web session-cookie flow.
4. `apps/api/src/modules/marketplace`: `GET /marketplace/apps/:slug/manifest`
   endpoint (§ 6) and a tenant-scoped `marketplace:install` permission
   distinct from admin-only.
5. `apps/mobile`: adaptive shell skeleton (`ShellMobile`/`ShellDesktop`,
   breakpoint-driven, single `go_router` table) and the generic bundle
   renderer (§ 6), proved end-to-end against the field-service manifest.
6. `.github/workflows/mobile-ci.yml` stood up (Android + Windows first).

Full detail of this prerequisite work — including why the poly-repo gateway
is kept (§ 2), the backend/Flutter architecture, and the original Tier 1–4
rationale — lives in the planning record at
`C:\Users\kanna\.claude\plans\first-draft-a-plan-tidy-blossom.md` (outside
the repo; not itself part of this seal, kept for historical context only).

## 8. What this document does not change

- `ARCHITECTURE_FOUNDATION.md` — unchanged, still the senior sealed contract.
- The 4 vertical-app sibling repos — unchanged, no code required of them.
- `AUTOPILOT.md`'s Phase F/M/X program ladder itself — unchanged in shape;
  this document changes what Phase M's completion criteria and horizontal
  build order *require* (see `AUTOPILOT.md` edits made alongside this seal).
- `MODULE_REGISTRY.md`'s existing "Phase 0–20" module-category grouping —
  unrelated numbering, untouched; see § 4's naming note.
