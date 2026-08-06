-- Fix stale seed-time flags on the 13 gated business-module catalog rows
-- (finance, hr, crm, inventory, procurement, sales, supply-chain, projects,
-- manufacturing, analytics, drive, communication, pos).
--
-- seedDefaultApps() in marketplace.service.ts previously marked these rows
-- isCore:true / metadata.isSystem:true even though none of them are in
-- KERNEL_SLUGS (module-tiers.ts — only `saas-portal` and `app-store` are
-- kernel). isUninstallable() falls back to isCore/metadata.isSystem after the
-- kernel-slug check, so these 13 business modules were incorrectly locked as
-- non-uninstallable for every tenant already seeded before this fix. The code
-- fix (this same change, applied to seedDefaultApps()) only affects future
-- seeds — existing MarketplaceApp rows need a data backfill too. Mirrors the
-- pattern used in 20260719145229_gate_builder_studio_module for Studio.
--
-- Idempotent: safe to re-run (UPDATE ... WHERE only touches rows still stale).
--
-- Note: `saas-portal` and `app-store` are the true kernel slugs and have no
-- MarketplaceApp catalog rows under those slugs in this schema (the kernel
-- lock is enforced purely by KERNEL_SLUGS in module-tiers.ts, independent of
-- any catalog row) — so there is nothing to preserve/avoid touching for them
-- here. The legacy `saas`, `admin`, `api-keys`, and `dashboard` catalog slugs
-- (conceptually merged into saas-portal) are intentionally left untouched by
-- this migration; they are out of scope for this fix.

UPDATE "marketplace_apps"
SET
  "is_core" = false,
  "metadata" = (
    CASE
      WHEN "metadata" IS NULL THEN '{}'::jsonb
      ELSE ("metadata" - 'isSystem')
    END
  ),
  "updated_at" = CURRENT_TIMESTAMP
WHERE "slug" IN (
  'finance', 'hr', 'crm', 'inventory', 'procurement', 'sales',
  'supply-chain', 'projects', 'manufacturing', 'analytics',
  'drive', 'communication', 'pos'
)
AND ("is_core" = true OR "metadata"->>'isSystem' = 'true');
