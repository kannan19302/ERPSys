import { Module } from "@nestjs/common";
import { SubscriptionsController } from "./subscriptions.controller";
import { SubscriptionsDeepController } from "./subscriptions-deep.controller";
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
  controllers: [SubscriptionsController, SubscriptionsDeepController],
  providers: [
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
    SubscriptionsService,
    SubscriptionPlansService,
    SubscriptionUsageService,
    SubscriptionCouponService,
    SubscriptionMigrationService,
  ],
})
export class SubscriptionsModule {}
