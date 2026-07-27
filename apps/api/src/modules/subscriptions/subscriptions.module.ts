import { Module } from "@nestjs/common";
import { SubscriptionsController } from "./subscriptions.controller";
import { SubscriptionsService } from "./subscriptions.service";
import { SubscriptionPlansService } from "./subscription-plans.service";
import { SubscriptionUsageService } from "./subscription-usage.service";

@Module({
  controllers: [SubscriptionsController],
  providers: [
    SubscriptionsService,
    SubscriptionPlansService,
    SubscriptionUsageService,
  ],
  exports: [
    SubscriptionsService,
    SubscriptionPlansService,
    SubscriptionUsageService,
  ],
})
export class SubscriptionsModule {}
