-- Add InstalledApp.serviceConfig for declarative+service extension apps (ext-gateway)
ALTER TABLE "installed_apps" ADD COLUMN IF NOT EXISTS "service_config" JSONB;
