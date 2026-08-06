-- Marketplace bundle signing — PLATFORM_ARCHITECTURE.md § 8.2, § 10.
--
-- Approving a bundle makes it installable by every tenant on the platform, so
-- it is the last point at which authorship can still be established. The
-- existing sha256 checksum proves the blob did not rot in storage; it proves
-- nothing about authorship, because whoever can change the blob can change the
-- checksum with it. Only a signature over the manifest and file list binds
-- content to a registered publisher key.
--
-- Platform-level tables: no tenant_id, deliberately. A vendor's signing key is
-- global — the same key verifies a bundle for every tenant that installs it.
-- Registered in MODELS_WITHOUT_TENANT so the tenant-scope extension does not
-- inject a filter for a column that does not exist.

ALTER TABLE "app_bundles" ADD COLUMN IF NOT EXISTS "signature" JSONB;
ALTER TABLE "app_bundles" ADD COLUMN IF NOT EXISTS "signing_key_id" TEXT;

CREATE TABLE "app_vendor_signing_keys" (
  "id"             TEXT NOT NULL,
  "vendor_id"      TEXT NOT NULL,
  "key_id"         TEXT NOT NULL,
  "public_key"     TEXT NOT NULL,
  "algorithm"      TEXT NOT NULL DEFAULT 'ed25519',
  "revoked"        BOOLEAN NOT NULL DEFAULT false,
  "revoked_reason" TEXT,
  "created_at"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "app_vendor_signing_keys_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "app_vendor_signing_keys_key_id_key"
  ON "app_vendor_signing_keys" ("key_id");
CREATE INDEX "app_vendor_signing_keys_vendor_id_idx"
  ON "app_vendor_signing_keys" ("vendor_id");

ALTER TABLE "app_vendor_signing_keys"
  ADD CONSTRAINT "app_vendor_signing_keys_vendor_id_fkey"
  FOREIGN KEY ("vendor_id") REFERENCES "app_vendors"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
