-- DropIndex
DROP INDEX "channels_tenant_id_org_id_name_key";

-- AlterTable
ALTER TABLE "builder_modules" ADD COLUMN     "components" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "dataModels" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "pages" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "published_at" TIMESTAMP(3),
ADD COLUMN     "testResults" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "version" TEXT NOT NULL DEFAULT '1.0.0';

-- AlterTable
ALTER TABLE "document_versions" ADD COLUMN     "iv" TEXT;

-- AlterTable
ALTER TABLE "documents" ADD COLUMN     "legal_hold" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "starred" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "folders" ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "legal_hold" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "starred" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "folder_shares" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "folder_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'VIEWER',
    "password_hash" TEXT,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "folder_shares_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_shares" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'VIEWER',
    "password_hash" TEXT,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_shares_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "folder_shares_tenant_id_idx" ON "folder_shares"("tenant_id");

-- CreateIndex
CREATE INDEX "folder_shares_user_id_idx" ON "folder_shares"("user_id");

-- CreateIndex
CREATE INDEX "document_shares_tenant_id_idx" ON "document_shares"("tenant_id");

-- CreateIndex
CREATE INDEX "document_shares_user_id_idx" ON "document_shares"("user_id");

-- AddForeignKey
ALTER TABLE "folder_shares" ADD CONSTRAINT "folder_shares_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "folders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_shares" ADD CONSTRAINT "document_shares_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

