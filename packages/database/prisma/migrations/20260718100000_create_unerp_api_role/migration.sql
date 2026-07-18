-- Track C (#21) — C.1: Split DB identities
-- Create the application runtime role that CANNOT bypass RLS.
-- Migrations use the owner role (unerp); the app connects as unerp_api.
-- WARNING: This migration runs as superuser (unerp) — the owner role.

-- Create the app runtime role (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = 'unerp_api') THEN
    CREATE ROLE unerp_api WITH
      LOGIN PASSWORD 'unerp_api_password'
      NOSUPERUSER
      NOBYPASSRLS
      NOINHERIT;
  END IF;
END
$$;

-- Grant schema access
GRANT USAGE ON SCHEMA public TO unerp_api;

-- Grant DML on all existing tables
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO unerp_api;

-- Grant sequence usage (for serial/bigserial columns)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO unerp_api;

-- Grant execute on all existing functions (including current_tenant_id())
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO unerp_api;

-- Default privileges: future tables and sequences auto-granted
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO unerp_api;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE ON SEQUENCES TO unerp_api;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT EXECUTE ON FUNCTIONS TO unerp_api;
