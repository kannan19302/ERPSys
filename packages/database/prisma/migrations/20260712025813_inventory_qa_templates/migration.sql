-- CreateTable
CREATE TABLE "qa_inspection_templates" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "product_id" TEXT,
    "checklist" JSONB NOT NULL DEFAULT '[]',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "qa_inspection_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "qa_inspection_templates_tenant_id_idx" ON "qa_inspection_templates"("tenant_id");

-- AddForeignKey
ALTER TABLE "qa_inspection_templates" ADD CONSTRAINT "qa_inspection_templates_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
