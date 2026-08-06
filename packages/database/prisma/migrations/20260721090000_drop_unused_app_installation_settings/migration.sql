-- DropForeignKey
ALTER TABLE "AppInstallation" DROP CONSTRAINT IF EXISTS "AppInstallation_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "AppSettings" DROP CONSTRAINT IF EXISTS "AppSettings_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "AppSettings" DROP CONSTRAINT IF EXISTS "AppSettings_roleId_fkey";

-- DropTable
DROP TABLE IF EXISTS "AppInstallation" CASCADE;

-- DropTable
DROP TABLE IF EXISTS "AppSettings" CASCADE;

-- DropEnum
DROP TYPE IF EXISTS "AppInstallStatus";

-- DropEnum
DROP TYPE IF EXISTS "SettingScope";
