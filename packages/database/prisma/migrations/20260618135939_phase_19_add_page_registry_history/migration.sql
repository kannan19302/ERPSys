-- AlterTable
ALTER TABLE "page_registries" ADD COLUMN     "history" JSONB[] DEFAULT ARRAY[]::JSONB[];
