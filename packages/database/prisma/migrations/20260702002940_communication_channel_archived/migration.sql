-- AlterTable
-- US-B1 (Connect / Channel archive): additive, non-breaking column.
-- Kept separate from `type` (PUBLIC/PRIVATE) which remains the visibility flag
-- consumed by channel browse/join queries.
ALTER TABLE "channels" ADD COLUMN IF NOT EXISTS "archived" BOOLEAN NOT NULL DEFAULT false;
