-- AlterTable
ALTER TABLE "offboarding_items" ADD COLUMN     "comments" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "onboarding_items" ADD COLUMN     "comments" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PENDING';

-- CreateTable
CREATE TABLE "goal_comments" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "goal_id" TEXT NOT NULL,
    "comment" TEXT NOT NULL,
    "author_name" TEXT NOT NULL DEFAULT 'System Admin',
    "file_url" TEXT,
    "file_name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "goal_comments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "goal_comments_tenant_id_idx" ON "goal_comments"("tenant_id");

-- CreateIndex
CREATE INDEX "goal_comments_goal_id_idx" ON "goal_comments"("goal_id");

-- AddForeignKey
ALTER TABLE "goal_comments" ADD CONSTRAINT "goal_comments_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
