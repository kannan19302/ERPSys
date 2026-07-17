-- CreateTable
CREATE TABLE "gamification_badges" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT NOT NULL DEFAULT 'award',
    "criteria_type" TEXT NOT NULL,
    "criteria_value" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "period_scope" TEXT NOT NULL DEFAULT 'ALL_TIME',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "gamification_badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gamification_badge_awards" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "badge_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "context" JSONB NOT NULL DEFAULT '{}',
    "awarded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gamification_badge_awards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_streaks" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "streak_type" TEXT NOT NULL DEFAULT 'ACTIVITY',
    "current_streak" INTEGER NOT NULL DEFAULT 0,
    "best_streak" INTEGER NOT NULL DEFAULT 0,
    "last_counted_date" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_streaks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leaderboard_snapshots" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "deals_won" INTEGER NOT NULL DEFAULT 0,
    "revenue" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "activity_count" INTEGER NOT NULL DEFAULT 0,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leaderboard_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commission_plans" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "effective_start" TIMESTAMP(3) NOT NULL,
    "effective_end" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "commission_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commission_plan_tiers" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "min_attainment_pct" DECIMAL(6,2) NOT NULL,
    "max_attainment_pct" DECIMAL(6,2),
    "commission_rate" DECIMAL(6,3) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "commission_plan_tiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commission_spiffs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "plan_id" TEXT,
    "name" TEXT NOT NULL,
    "criteria_type" TEXT NOT NULL,
    "criteria_value" JSONB NOT NULL DEFAULT '{}',
    "bonus_type" TEXT NOT NULL DEFAULT 'FLAT',
    "bonus_amount" DECIMAL(15,2) NOT NULL,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commission_spiffs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commission_payouts" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "quota_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "attained_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "attainment_pct" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "applied_tier_rate" DECIMAL(6,3) NOT NULL DEFAULT 0,
    "tiered_commission" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "spiff_bonus" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total_payout" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "calculated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "paid_at" TIMESTAMP(3),

    CONSTRAINT "commission_payouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commission_payout_spiff_lines" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "payout_id" TEXT NOT NULL,
    "spiff_id" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "reason" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "commission_payout_spiff_lines_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "gamification_badges_tenant_id_idx" ON "gamification_badges"("tenant_id");

-- CreateIndex
CREATE INDEX "gamification_badge_awards_tenant_id_idx" ON "gamification_badge_awards"("tenant_id");

-- CreateIndex
CREATE INDEX "gamification_badge_awards_tenant_id_user_id_idx" ON "gamification_badge_awards"("tenant_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "gamification_badge_awards_tenant_id_badge_id_user_id_key" ON "gamification_badge_awards"("tenant_id", "badge_id", "user_id");

-- CreateIndex
CREATE INDEX "sales_streaks_tenant_id_idx" ON "sales_streaks"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "sales_streaks_tenant_id_user_id_streak_type_key" ON "sales_streaks"("tenant_id", "user_id", "streak_type");

-- CreateIndex
CREATE INDEX "leaderboard_snapshots_tenant_id_idx" ON "leaderboard_snapshots"("tenant_id");

-- CreateIndex
CREATE INDEX "leaderboard_snapshots_tenant_id_period_idx" ON "leaderboard_snapshots"("tenant_id", "period");

-- CreateIndex
CREATE UNIQUE INDEX "leaderboard_snapshots_tenant_id_period_user_id_key" ON "leaderboard_snapshots"("tenant_id", "period", "user_id");

-- CreateIndex
CREATE INDEX "commission_plans_tenant_id_idx" ON "commission_plans"("tenant_id");

-- CreateIndex
CREATE INDEX "commission_plan_tiers_tenant_id_idx" ON "commission_plan_tiers"("tenant_id");

-- CreateIndex
CREATE INDEX "commission_plan_tiers_plan_id_idx" ON "commission_plan_tiers"("plan_id");

-- CreateIndex
CREATE INDEX "commission_spiffs_tenant_id_idx" ON "commission_spiffs"("tenant_id");

-- CreateIndex
CREATE INDEX "commission_payouts_tenant_id_idx" ON "commission_payouts"("tenant_id");

-- CreateIndex
CREATE INDEX "commission_payouts_tenant_id_user_id_idx" ON "commission_payouts"("tenant_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "commission_payouts_tenant_id_plan_id_user_id_period_key" ON "commission_payouts"("tenant_id", "plan_id", "user_id", "period");

-- CreateIndex
CREATE INDEX "commission_payout_spiff_lines_tenant_id_idx" ON "commission_payout_spiff_lines"("tenant_id");

-- CreateIndex
CREATE INDEX "commission_payout_spiff_lines_payout_id_idx" ON "commission_payout_spiff_lines"("payout_id");

-- AddForeignKey
ALTER TABLE "gamification_badge_awards" ADD CONSTRAINT "gamification_badge_awards_badge_id_fkey" FOREIGN KEY ("badge_id") REFERENCES "gamification_badges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commission_plan_tiers" ADD CONSTRAINT "commission_plan_tiers_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "commission_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commission_spiffs" ADD CONSTRAINT "commission_spiffs_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "commission_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commission_payouts" ADD CONSTRAINT "commission_payouts_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "commission_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commission_payout_spiff_lines" ADD CONSTRAINT "commission_payout_spiff_lines_payout_id_fkey" FOREIGN KEY ("payout_id") REFERENCES "commission_payouts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commission_payout_spiff_lines" ADD CONSTRAINT "commission_payout_spiff_lines_spiff_id_fkey" FOREIGN KEY ("spiff_id") REFERENCES "commission_spiffs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
