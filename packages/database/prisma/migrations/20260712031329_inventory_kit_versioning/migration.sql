-- CreateTable
CREATE TABLE "kit_versions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "kit_id" TEXT NOT NULL,
    "version_no" INTEGER NOT NULL,
    "components_snapshot" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kit_versions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "kit_versions_tenant_id_idx" ON "kit_versions"("tenant_id");

-- CreateIndex
CREATE INDEX "kit_versions_kit_id_idx" ON "kit_versions"("kit_id");

-- CreateIndex
CREATE UNIQUE INDEX "kit_versions_tenant_id_kit_id_version_no_key" ON "kit_versions"("tenant_id", "kit_id", "version_no");

-- AddForeignKey
ALTER TABLE "kit_versions" ADD CONSTRAINT "kit_versions_kit_id_fkey" FOREIGN KEY ("kit_id") REFERENCES "product_kits"("id") ON DELETE CASCADE ON UPDATE CASCADE;
