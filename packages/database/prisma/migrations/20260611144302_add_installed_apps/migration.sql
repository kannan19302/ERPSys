-- CreateTable
CREATE TABLE "installed_apps" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "app_id" TEXT NOT NULL,
    "installed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "installed_apps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "installed_apps_tenant_id_idx" ON "installed_apps"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "installed_apps_tenant_id_app_id_key" ON "installed_apps"("tenant_id", "app_id");

-- AddForeignKey
ALTER TABLE "installed_apps" ADD CONSTRAINT "installed_apps_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
