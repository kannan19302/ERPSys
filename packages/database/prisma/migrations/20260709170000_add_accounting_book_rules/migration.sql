-- AlterTable
ALTER TABLE "journals" ADD COLUMN     "source_journal_id" TEXT;

-- CreateTable
CREATE TABLE "accounting_book_rules" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "source_book_id" TEXT NOT NULL,
    "destination_book_id" TEXT NOT NULL,
    "source_account_id" TEXT,
    "destination_account_id" TEXT,
    "rule_type" TEXT NOT NULL,
    "multiplier" DECIMAL(15,4) NOT NULL DEFAULT 1.0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounting_book_rules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "accounting_book_rules_tenant_id_idx" ON "accounting_book_rules"("tenant_id");

-- AddForeignKey
ALTER TABLE "journals" ADD CONSTRAINT "journals_source_journal_id_fkey" FOREIGN KEY ("source_journal_id") REFERENCES "journals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounting_book_rules" ADD CONSTRAINT "accounting_book_rules_source_book_id_fkey" FOREIGN KEY ("source_book_id") REFERENCES "accounting_books"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounting_book_rules" ADD CONSTRAINT "accounting_book_rules_destination_book_id_fkey" FOREIGN KEY ("destination_book_id") REFERENCES "accounting_books"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounting_book_rules" ADD CONSTRAINT "accounting_book_rules_source_account_id_fkey" FOREIGN KEY ("source_account_id") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounting_book_rules" ADD CONSTRAINT "accounting_book_rules_destination_account_id_fkey" FOREIGN KEY ("destination_account_id") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
