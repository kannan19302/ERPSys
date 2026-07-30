// @ts-nocheck
import { SubscriptionsGeneratedController } from "./subscriptions-generated.controller";
import { SubscriptionsGeneratedService } from "./subscriptions-generated.service";
import { Module } from "@nestjs/common";
import { SubscriptionsController } from "./subscriptions.controller";
import { SubscriptionsDeepController } from "./subscriptions-deep.controller";
import { SubscriptionsBulkController } from "./subscriptions-bulk.controller";
import { SubscriptionsService } from "./subscriptions.service";
import { SubscriptionPlansService } from "./subscription-plans.service";
import { SubscriptionUsageService } from "./subscription-usage.service";
import { SubscriptionCouponService } from "./subscription-coupon.service";
import { SubscriptionPlanGroupService } from "./subscription-plan-group.service";
import { SubscriptionMigrationService } from "./subscription-migration.service";
import { SubscriptionDunningService } from "./subscription-dunning.service";
import { SubscriptionCreditNoteService } from "./subscription-credit-note.service";
import { SubscriptionAutoScaleService } from "./subscription-auto-scale.service";

@Module({
  controllers: [
    SubscriptionsGeneratedController,
    SubscriptionsController,
    SubscriptionsDeepController,
    SubscriptionsBulkController,
  ],
  providers: [
    SubscriptionsGeneratedService,
    SubscriptionsService,
    SubscriptionPlansService,
    SubscriptionUsageService,
    SubscriptionCouponService,
    SubscriptionPlanGroupService,
    SubscriptionMigrationService,
    SubscriptionDunningService,
    SubscriptionCreditNoteService,
    SubscriptionAutoScaleService,
  ],
  exports: [
    SubscriptionsGeneratedService,
    SubscriptionsService,
    SubscriptionPlansService,
    SubscriptionUsageService,
    SubscriptionCouponService,
    SubscriptionMigrationService,
  ],
})
export class SubscriptionsModule {}
