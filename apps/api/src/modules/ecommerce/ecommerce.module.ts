import { Module } from "@nestjs/common";
import { OutboxModule } from "../outbox/outbox.module";
import { EcommerceAdminController } from "./ecommerce-admin.controller";
import { EcommerceAdminService } from "./ecommerce-admin.service";
import { EcommercePublicController } from "./ecommerce-public.controller";
import { EcommercePublicService } from "./ecommerce-public.service";
import { EcommerceCheckoutService } from "./ecommerce-checkout.service";
import { EcommerceExpansionController } from "./ecommerce-expansion.controller";
import { EcommerceExpansionService } from "./ecommerce-expansion.service";
import { MockPaymentGatewayService } from "./payments/mock-payment-gateway.service";
import { StripePaymentGatewayService } from "./payments/stripe-payment-gateway.service";
import { PlatformCredentialsModule } from "../../common/platform-credentials/platform-credentials.module";

/**
 * E-Commerce Storefront module (module #33). See
 * .ai/ECOMMERCE_MODULE_REQUIREMENTS.md and .ai/DATA_MODEL.md Section 3.4.
 *
 * Track D (#22): The synchronous SalesService import has been removed.  The
 * checkout flow now writes a `StorefrontCheckoutState` row and an outbox
 * event (`ecommerce.checkout.completed`) inside a single transaction.  The
 * Sales consumer handler processes the event asynchronously.
 */
@Module({
  imports: [OutboxModule, PlatformCredentialsModule],
  controllers: [EcommerceAdminController, EcommercePublicController, EcommerceExpansionController],
  providers: [
    EcommerceAdminService,
    EcommercePublicService,
    EcommerceCheckoutService,
    EcommerceExpansionService,
    MockPaymentGatewayService,
    StripePaymentGatewayService,
    {
      provide: "PAYMENT_GATEWAY",
      useFactory: (
        stripeService: StripePaymentGatewayService,
        mockService: MockPaymentGatewayService,
      ) => {
        // Transparent fallback to Mock gateway if Stripe variables are missing
        const hasStripeKey =
          process.env.STRIPE_SECRET_KEY &&
          process.env.STRIPE_SECRET_KEY.trim().length > 0;
        return hasStripeKey ? stripeService : mockService;
      },
      inject: [StripePaymentGatewayService, MockPaymentGatewayService],
    },
  ],
  exports: [EcommerceAdminService, EcommercePublicService, EcommerceExpansionService, "PAYMENT_GATEWAY"],
})
export class EcommerceModule {}
