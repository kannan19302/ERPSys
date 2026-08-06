-- Gate Studio/Builder ("builder") through the same install/uninstall system as every
-- other business module (Finance, HR, ...). Only `saas-portal` and `app-store` remain
-- permanently kernel (KERNEL_SLUGS in module-tiers.ts). Idempotent: safe to re-run.

-- 1) Ensure the "builder" catalog row exists and is uninstallable (isCore:false, no
--    metadata.isSystem), matching seedDefaultApps() in marketplace.service.ts.
INSERT INTO "marketplace_apps" (
  "id", "slug", "name", "description", "long_description", "category", "publisher",
  "version", "pricing", "rating", "review_count", "installs", "features", "screenshots",
  "tags", "metadata", "requires_apps", "config_schema", "featured", "verified", "status",
  "is_core", "created_at", "updated_at"
)
VALUES (
  'mktapp_builder_seed',
  'builder',
  'Studio',
  'No-code visual page builder, schema creator, and CMS designer.',
  'Empower non-technical users to build custom modules. Visually design forms and layouts using a drag-and-drop editor, construct new database tables, define relationships, and deploy custom pages instantly without writing code.',
  'AI & Automation',
  'UniERP',
  '1.0.0',
  'FREE',
  5.0,
  0,
  5000,
  '["Visual form layout editor","Dynamic schema architect","Page registry deployments","No-code workflows"]'::jsonb,
  '[]'::jsonb,
  '["builder","no-code","studio","pages","forms"]'::jsonb,
  '{}'::jsonb,
  '[]'::jsonb,
  '{}'::jsonb,
  false,
  true,
  'PUBLISHED',
  false,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("slug") DO UPDATE SET
  "is_core" = false,
  "metadata" = '{}'::jsonb,
  "updated_at" = CURRENT_TIMESTAMP;

-- 2) Backfill: every existing tenant gets an ACTIVE installed_apps row for "builder" so
--    gating it does not lock out tenants who have always had Studio available. Studio has
--    always been always-on, so this is a one-time entitlement grant, not a fresh purchase.
--    Matches both historical appId conventions used in this codebase: the bare slug
--    (seedDefaultApps' auto-install loop) and "marketplace:<MarketplaceApp.id>"
--    (installApp()). Guarded by NOT EXISTS on app_slug so re-running is a no-op.
INSERT INTO "installed_apps" (
  "id", "tenant_id", "app_id", "app_slug", "app_name", "installed_at", "status",
  "config", "source", "provisioned"
)
SELECT
  'iapp_builder_' || t."id",
  t."id",
  'marketplace:' || b."id",
  'builder',
  'Studio',
  CURRENT_TIMESTAMP,
  'ACTIVE',
  '{}'::jsonb,
  'CATALOG',
  '{}'::jsonb
FROM "tenants" t
CROSS JOIN (SELECT "id" FROM "marketplace_apps" WHERE "slug" = 'builder' LIMIT 1) b
WHERE NOT EXISTS (
  SELECT 1 FROM "installed_apps" ia
  WHERE ia."tenant_id" = t."id"
    AND (
      ia."app_slug" = 'builder'
      OR ia."app_id" = 'builder'
      OR ia."app_id" = 'marketplace:' || b."id"
    )
)
ON CONFLICT ("tenant_id", "app_id") DO NOTHING;
