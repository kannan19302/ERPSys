import { Module } from '@nestjs/common';
import { SalesModule } from '../sales/sales.module';
import { EcommerceAdminController } from './ecommerce-admin.controller';
import { EcommerceAdminService } from './ecommerce-admin.service';
import { EcommercePublicController } from './ecommerce-public.controller';
import { EcommercePublicService } from './ecommerce-public.service';
import { EcommerceCheckoutService } from './ecommerce-checkout.service';
import { MockPaymentGatewayService } from './payments/mock-payment-gateway.service';
import { StripePaymentGatewayService } from './payments/stripe-payment-gateway.service';

/**
 * E-Commerce Storefront module (module #33). See
 * .ai/ECOMMERCE_MODULE_REQUIREMENTS.md and .ai/DATA_MODEL.md Section 3.4.
 */
@Module({
  imports: [SalesModule],
  controllers: [EcommerceAdminController, EcommercePublicController],
  providers: [
    EcommerceAdminService,
    EcommercePublicService,
    EcommerceCheckoutService,
    MockPaymentGatewayService,
    StripePaymentGatewayService,
    {
      provide: 'PAYMENT_GATEWAY',
      useFactory: (
        stripeService: StripePaymentGatewayService,
        mockService: MockPaymentGatewayService,
      ) => {
        // Transparent fallback to Mock gateway if Stripe variables are missing
        const hasStripeKey = process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.trim().length > 0;
        return hasStripeKey ? stripeService : mockService;
      },
      inject: [StripePaymentGatewayService, MockPaymentGatewayService],
    },
  ],
  exports: [EcommerceAdminService, EcommercePublicService, 'PAYMENT_GATEWAY'],
})
export class EcommerceModule {}
