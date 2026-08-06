-- AlterTable
ALTER TABLE "consolidation_runs" ADD COLUMN     "cta_amount" DECIMAL(15,2) DEFAULT 0,
ADD COLUMN     "period" TEXT,
ADD COLUMN     "target_currency" TEXT DEFAULT 'USD';
