import { Module } from "@nestjs/common";
import { SaasController } from "./saas.controller";
import { SaasService } from "./saas.service";
import { BillingService } from "./billing.service";
import { BillingController } from "./billing.controller";
import { BillingWebhookController } from "./billing-webhook.controller";

@Module({
  controllers: [SaasController, BillingController, BillingWebhookController],
  providers: [SaasService, BillingService],
  exports: [SaasService, BillingService],
})
export class SaasModule {}
