-- AlterTable
ALTER TABLE "web_templates" ADD COLUMN     "design_tokens" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "thumbnail" TEXT;

-- CreateTable
CREATE TABLE "web_settings" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "active_template_id" TEXT,
    "global_css" TEXT,
    "theme_tokens" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "web_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "web_settings_tenant_id_key" ON "web_settings"("tenant_id");

-- AddForeignKey
ALTER TABLE "web_settings" ADD CONSTRAINT "web_settings_active_template_id_fkey" FOREIGN KEY ("active_template_id") REFERENCES "web_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
