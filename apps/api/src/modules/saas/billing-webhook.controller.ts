import {
  Controller,
  Post,
  Req,
  Headers,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from "@nestjs/common";
import { BillingService } from "./billing.service";
import { ApiTags, ApiOperation } from "@nestjs/swagger";

@ApiTags("saas-webhooks")
@Controller("billing-webhooks")
export class BillingWebhookController {
  constructor(private readonly billingService: BillingService) {}

  @ApiOperation({ summary: "Stripe webhook (unauthenticated)" })
  @Post("stripe")
  @HttpCode(HttpStatus.OK)
  async stripeWebhook(
    @Req() req: any,
    @Headers("stripe-signature") signature: string,
  ) {
    if (!signature) {
      throw new BadRequestException("Missing Stripe signature");
    }
    const payload = req.rawBody
      ? req.rawBody.toString("utf8")
      : JSON.stringify(req.body);
    return this.billingService.processStripeWebhook(payload, signature);
  }

  @ApiOperation({ summary: "Razorpay webhook (unauthenticated)" })
  @Post("razorpay")
  @HttpCode(HttpStatus.OK)
  async razorpayWebhook(
    @Req() req: any,
    @Headers("x-razorpay-signature") signature: string,
  ) {
    if (!signature) {
      throw new BadRequestException("Missing Razorpay signature");
    }
    const payload = req.rawBody
      ? req.rawBody.toString("utf8")
      : JSON.stringify(req.body);
    return this.billingService.processRazorpayWebhook(payload, signature);
  }
}
