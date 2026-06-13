-- AlterTable
ALTER TABLE "sales_orders" ADD COLUMN     "payment_method" TEXT,
ADD COLUMN     "payment_status" TEXT NOT NULL DEFAULT 'UNPAID',
ADD COLUMN     "sales_channel" TEXT NOT NULL DEFAULT 'B2B';
