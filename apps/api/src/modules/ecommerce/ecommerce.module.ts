import { Module } from '@nestjs/common';
import { SalesModule } from '../sales/sales.module';
import { EcommerceAdminController } from './ecommerce-admin.controller';
import { EcommerceAdminService } from './ecommerce-admin.service';
import { EcommercePublicController } from './ecommerce-public.controller';
import { EcommercePublicService } from './ecommerce-public.service';
import { EcommerceCheckoutService } from './ecommerce-checkout.service';
import { MockPaymentGatewayService } from './payments/mock-payment-gateway.service';

/**
 * E-Commerce Storefront module (module #33). See
 * .ai/ECOMMERCE_MODULE_REQUIREMENTS.md and .ai/DATA_MODEL.md Section 3.4.
 *
 * Imports `SalesModule` to inject the exported `SalesService` for the
 * checkout write path (`createConfirmedOnlineOrder`) — an in-process service
 * call within the same Nest app, the same established cross-module pattern
 * other modules use (e.g. `procurement` injecting `inventory`/`finance`
 * services), not a Prisma-model reach-through.
 */
@Module({
  imports: [SalesModule],
  controllers: [EcommerceAdminController, EcommercePublicController],
  providers: [EcommerceAdminService, EcommercePublicService, EcommerceCheckoutService, MockPaymentGatewayService],
  exports: [EcommerceAdminService, EcommercePublicService],
})
export class EcommerceModule {}
