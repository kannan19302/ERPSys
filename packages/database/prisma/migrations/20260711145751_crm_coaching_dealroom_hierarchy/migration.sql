-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "parent_customer_id" TEXT;

-- CreateTable
CREATE TABLE "coaching_rubrics" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "criteria" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coaching_rubrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "call_scorecards" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "activity_id" TEXT NOT NULL,
    "rubric_id" TEXT NOT NULL,
    "reviewer_id" TEXT NOT NULL,
    "criteria_scores" JSONB NOT NULL,
    "total_score" INTEGER NOT NULL,
    "max_score" INTEGER NOT NULL,
    "talk_ratio" INTEGER,
    "objection_handling_score" INTEGER,
    "next_steps_set" BOOLEAN NOT NULL DEFAULT false,
    "manager_notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "acknowledged_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "call_scorecards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coaching_library_items" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "source_activity_id" TEXT,
    "notes" TEXT,
    "tags" TEXT[],
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coaching_library_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deal_rooms" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "opportunity_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "buyer_access_token" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deal_rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deal_room_milestones" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "deal_room_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "ownerType" TEXT NOT NULL DEFAULT 'SELLER',
    "due_date" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "completed_at" TIMESTAMP(3),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deal_room_milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deal_room_stakeholders" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "deal_room_id" TEXT NOT NULL,
    "contact_id" TEXT,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "side" TEXT NOT NULL DEFAULT 'BUYER',
    "sentiment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deal_room_stakeholders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deal_room_documents" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "deal_room_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'GENERAL',
    "uploaded_by_id" TEXT,
    "viewed_by_buyer_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deal_room_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "coaching_rubrics_tenant_id_idx" ON "coaching_rubrics"("tenant_id");

-- CreateIndex
CREATE INDEX "call_scorecards_tenant_id_idx" ON "call_scorecards"("tenant_id");

-- CreateIndex
CREATE INDEX "call_scorecards_activity_id_idx" ON "call_scorecards"("activity_id");

-- CreateIndex
CREATE INDEX "call_scorecards_rubric_id_idx" ON "call_scorecards"("rubric_id");

-- CreateIndex
CREATE INDEX "coaching_library_items_tenant_id_idx" ON "coaching_library_items"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "deal_rooms_opportunity_id_key" ON "deal_rooms"("opportunity_id");

-- CreateIndex
CREATE UNIQUE INDEX "deal_rooms_buyer_access_token_key" ON "deal_rooms"("buyer_access_token");

-- CreateIndex
CREATE INDEX "deal_rooms_tenant_id_idx" ON "deal_rooms"("tenant_id");

-- CreateIndex
CREATE INDEX "deal_room_milestones_tenant_id_idx" ON "deal_room_milestones"("tenant_id");

-- CreateIndex
CREATE INDEX "deal_room_milestones_deal_room_id_idx" ON "deal_room_milestones"("deal_room_id");

-- CreateIndex
CREATE INDEX "deal_room_stakeholders_tenant_id_idx" ON "deal_room_stakeholders"("tenant_id");

-- CreateIndex
CREATE INDEX "deal_room_stakeholders_deal_room_id_idx" ON "deal_room_stakeholders"("deal_room_id");

-- CreateIndex
CREATE INDEX "deal_room_documents_tenant_id_idx" ON "deal_room_documents"("tenant_id");

-- CreateIndex
CREATE INDEX "deal_room_documents_deal_room_id_idx" ON "deal_room_documents"("deal_room_id");

-- CreateIndex
CREATE INDEX "customers_parent_customer_id_idx" ON "customers"("parent_customer_id");

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_parent_customer_id_fkey" FOREIGN KEY ("parent_customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "call_scorecards" ADD CONSTRAINT "call_scorecards_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "call_scorecards" ADD CONSTRAINT "call_scorecards_rubric_id_fkey" FOREIGN KEY ("rubric_id") REFERENCES "coaching_rubrics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal_rooms" ADD CONSTRAINT "deal_rooms_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "opportunities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal_room_milestones" ADD CONSTRAINT "deal_room_milestones_deal_room_id_fkey" FOREIGN KEY ("deal_room_id") REFERENCES "deal_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal_room_stakeholders" ADD CONSTRAINT "deal_room_stakeholders_deal_room_id_fkey" FOREIGN KEY ("deal_room_id") REFERENCES "deal_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal_room_documents" ADD CONSTRAINT "deal_room_documents_deal_room_id_fkey" FOREIGN KEY ("deal_room_id") REFERENCES "deal_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
