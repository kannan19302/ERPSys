# Implementation Plan — Cycle 47 (Completed)

> Status: All 5 modules gap-filled. CrossDock @map("tenant_id") schema fix deferred — requires migration cycle (non-breaking inconsistency, 3 models out of 150+ have it missing).

## Phase & Scope

- **Phase**: M (Module strengthening)
- **Scope**: Fix all identified gaps across next 5 modules in Phase M focus order (Supply Chain, Manufacturing, Projects, Communication, Builder)
- **Why**: Ensure end-to-end functionality — all backend services have matching frontend pages, settings controllers registered, navigation complete
- **Gate tier**: FAST

## Work Items

### Supply Chain (5 gaps)

1. Register `SupplyChainSettingsController` in `supply-chain.module.ts`
2. Add 15+ missing `SEGMENT_NAMES` entries in `registry.tsx`
3. Add CrossDock models @@map("tenant_id") fix (schema)

### Manufacturing (5 gaps)

1. Register `ManufacturingSettingsController` in `manufacturing.module.ts`
2. Fix nav descriptor: add `settingsRoute` + missing sidebar entries (routing, work-centers, scrap, quality-checks, settings)

### Projects (5 gaps — 5 missing pages)

1. Create `/projects/timesheets/page.tsx`
2. Create `/projects/reports/page.tsx`
3. Create `/projects/templates/page.tsx`
4. Create `/projects/billing-rates/page.tsx`
5. Create `/projects/milestone-templates/page.tsx`

### Communication (4 gaps)

1. Register `CommunicationSettingsController` in `communication.module.ts`
2. Fix notifications page — replace mock with real API calls
3. Fix advanced page — replace mock with real API integration

### Builder (2 gaps)

1. Add `error.tsx` boundary at `/builder/`
2. Add `loading.tsx` at `/builder/`

## Duplicate-Check

- All 5 modules have existing backend services and Prisma models
- No new Prisma models or backend controllers needed (just registrations)
- All gaps are UI pages, nav config, or module registration fixes

## Rollback Note

- All changes in source files only; no schema/migration changes
- Rollback = revert commits
