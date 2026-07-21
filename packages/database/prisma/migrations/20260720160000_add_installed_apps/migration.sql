-- CreateEnum
CREATE TYPE "AppInstallStatus" AS ENUM ('INSTALLED', 'UNINSTALLING', 'UNINSTALLED');

-- CreateEnum
CREATE TYPE "SettingScope" AS ENUM ('TENANT', 'USER', 'ROLE');

-- AlterTable
ALTER TABLE "tenants" ADD COLUMN     "industry" TEXT,
ADD COLUMN     "installedApps" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "kernelApps" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "onboardingComplete" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "AppInstallation" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "appSlug" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "status" "AppInstallStatus" NOT NULL DEFAULT 'INSTALLED',
    "config" JSONB,
    "installedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uninstalledAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppInstallation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppSettings" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "appSlug" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "scope" "SettingScope" NOT NULL DEFAULT 'TENANT',
    "roleId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AppInstallation_tenantId_idx" ON "AppInstallation"("tenantId");

-- CreateIndex
CREATE INDEX "AppInstallation_appSlug_idx" ON "AppInstallation"("appSlug");

-- CreateIndex
CREATE UNIQUE INDEX "AppInstallation_tenantId_appSlug_key" ON "AppInstallation"("tenantId", "appSlug");

-- CreateIndex
CREATE INDEX "AppSettings_tenantId_appSlug_idx" ON "AppSettings"("tenantId", "appSlug");

-- CreateIndex
CREATE UNIQUE INDEX "AppSettings_tenantId_appSlug_key_scope_roleId_key" ON "AppSettings"("tenantId", "appSlug", "key", "scope", "roleId");

-- AddForeignKey
ALTER TABLE "AppInstallation" ADD CONSTRAINT "AppInstallation_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppSettings" ADD CONSTRAINT "AppSettings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppSettings" ADD CONSTRAINT "AppSettings_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
