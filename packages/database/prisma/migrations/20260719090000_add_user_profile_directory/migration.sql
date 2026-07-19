-- Teams-style profile card + org chart directory extension of User.
-- Kept as a separate table (not columns on User) so it can be added without
-- touching the large, security-sensitive User model, and because not every
-- tenant/user needs it populated.

CREATE TABLE IF NOT EXISTS "user_profiles" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "employee_id" TEXT NOT NULL,
  "pronouns" TEXT,
  "job_title" TEXT,
  "department_id" TEXT,
  "manager_id" TEXT,
  "timezone" TEXT,
  "working_hours_start" TEXT,
  "working_hours_end" TEXT,
  "working_days" JSONB NOT NULL DEFAULT '["MON","TUE","WED","THU","FRI"]',
  "working_location" TEXT,
  "overview" TEXT,
  "pronunciation_audio_url" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "user_profiles_user_id_key" ON "user_profiles"("user_id");
CREATE UNIQUE INDEX IF NOT EXISTS "user_profiles_tenant_id_employee_id_key" ON "user_profiles"("tenant_id", "employee_id");
CREATE INDEX IF NOT EXISTS "user_profiles_tenant_id_idx" ON "user_profiles"("tenant_id");
CREATE INDEX IF NOT EXISTS "user_profiles_manager_id_idx" ON "user_profiles"("manager_id");
CREATE INDEX IF NOT EXISTS "user_profiles_department_id_idx" ON "user_profiles"("department_id");

DO $$BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_profiles_tenant_id_fkey') THEN
    ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_tenant_id_fkey"
      FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_profiles_user_id_fkey') THEN
    ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_profiles_department_id_fkey') THEN
    ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_department_id_fkey"
      FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_profiles_manager_id_fkey') THEN
    ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_manager_id_fkey"
      FOREIGN KEY ("manager_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END$$;

-- Standard tenant-isolation RLS (Track C / #21).
DO $$DECLARE tbl text := 'user_profiles';
BEGIN
  EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
  EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', tbl);
  EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_%I ON %I', tbl, tbl);
  EXECUTE format('CREATE POLICY tenant_isolation_%I ON %I USING (tenant_id = current_tenant_id()) WITH CHECK (tenant_id = current_tenant_id())', tbl, tbl);
END$$;
