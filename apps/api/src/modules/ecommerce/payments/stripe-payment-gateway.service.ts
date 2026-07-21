import { Injectable, BadRequestException, Optional } from "@nestjs/common";
import { AppLogger } from "../../../common/services/logger.service";
import type {
  PaymentGatewayAdapter,
  PaymentIntentResult,
} from "./payment-gateway.interface";
import { PlatformCredentialsService } from "../../../common/platform-credentials/platform-credentials.service";

@Injectable()
export class StripePaymentGatewayService implements PaymentGatewayAdapter {
  private readonly logger = new AppLogger();

  constructor(
    @Optional()
    private readonly platformCredentialsService?: PlatformCredentialsService,
  ) {
    this.logger.setContext("StripePaymentGatewayService");
  }

  /**
   * Resolved per-call (not cached on the instance) so a credential saved from
   * the SaaS Portal Settings UI takes effect within PlatformCredentialsService's
   * own cache TTL, without an API restart.
   */
  private async getApiKey(): Promise<string> {
    if (this.platformCredentialsService) {
      const creds = await this.platformCredentialsService.get("stripe");
      if (creds.secretKey) return creds.secretKey;
    }
    return process.env.STRIPE_SECRET_KEY || "";
  }

  private async getHeaders() {
    return {
      Authorization: `Bearer ${await this.getApiKey()}`,
      "Content-Type": "application/x-www-form-urlencoded",
    };
  }

  private buildFormBody(
    data: Record<string, any>,
    prefix = "",
  ): URLSearchParams {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(data)) {
      const paramKey = prefix ? `${prefix}[${key}]` : key;
      if (value && typeof value === "object" && !Array.isArray(value)) {
        const nested = this.buildFormBody(value, paramKey);
        for (const [k, v] of nested.entries()) {
          params.append(k, v);
        }
      } else if (value !== undefined && value !== null) {
        params.append(paramKey, String(value));
      }
    }
    return params;
  }

  async createIntent(
    amount: number,
    currency: string,
    metadata: Record<string, unknown>,
  ): Promise<PaymentIntentResult> {
    const apiKey = await this.getApiKey();
    if (!apiKey) {
      throw new BadRequestException("Stripe API Key is not configured.");
    }

    try {
      this.logger.log(
        `Creating Stripe PaymentIntent for amount=${amount} currency=${currency}`,
      );

      const body = this.buildFormBody({
        amount: Math.round(amount * 100), // Stripe expects cents
        currency: currency.toLowerCase(),
        metadata,
      });

      const res = await fetch("https://api.stripe.com/v1/payment_intents", {
        method: "POST",
        headers: await this.getHeaders(),
        body: body.toString(),
      });

      const data = (await res.json()) as any;

      if (!res.ok) {
        this.logger.error(
          `Stripe createIntent failed: ${JSON.stringify(data.error)}`,
        );
        throw new BadRequestException(
          data.error?.message || "Stripe payment intent creation failed.",
        );
      }

      this.logger.log(`Stripe PaymentIntent created id=${data.id}`);

      return {
        id: data.id,
        status: this.mapStripeStatus(data.status),
        clientSecret: data.client_secret,
      };
    } catch (err: any) {
      this.logger.error(`Stripe createIntent exception: ${err.message}`);
      throw new BadRequestException(
        err.message || "Payment intent creation failed.",
      );
    }
  }

  async confirmIntent(
    intentId: string,
    simulateDecline = false,
  ): Promise<PaymentIntentResult> {
    const apiKey = await this.getApiKey();
    if (!apiKey) {
      throw new BadRequestException("Stripe API Key is not configured.");
    }

    try {
      this.logger.log(`Confirming Stripe PaymentIntent id=${intentId}`);

      // Stripe test card token to simulate decline if requested, else use tok_visa
      const token = simulateDecline ? "tok_chargeDeclined" : "tok_visa";

      // 1. Create a PaymentMethod from the token
      const pmBody = this.buildFormBody({
        type: "card",
        card: { token },
      });

      const pmRes = await fetch("https://api.stripe.com/v1/payment_methods", {
        method: "POST",
        headers: await this.getHeaders(),
        body: pmBody.toString(),
      });

      const pmData = (await pmRes.json()) as any;

      if (!pmRes.ok) {
        this.logger.error(
          `Stripe PaymentMethod creation failed: ${JSON.stringify(pmData.error)}`,
        );
        throw new BadRequestException(
          pmData.error?.message || "Payment method creation failed.",
        );
      }

      // 2. Confirm the PaymentIntent with the new PaymentMethod
      const confirmBody = this.buildFormBody({
        payment_method: pmData.id,
      });

      const res = await fetch(
        `https://api.stripe.com/v1/payment_intents/${intentId}/confirm`,
        {
          method: "POST",
          headers: await this.getHeaders(),
          body: confirmBody.toString(),
        },
      );

      const data = (await res.json()) as any;

      if (!res.ok) {
        this.logger.error(
          `Stripe confirmIntent failed: ${JSON.stringify(data.error)}`,
        );
        return {
          id: intentId,
          status: "failed",
        };
      }

      this.logger.log(
        `Stripe PaymentIntent confirmed id=${intentId} status=${data.status}`,
      );

      return {
        id: intentId,
        status: this.mapStripeStatus(data.status),
      };
    } catch (err: any) {
      this.logger.error(`Stripe confirmIntent exception: ${err.message}`);
      return {
        id: intentId,
        status: "failed",
      };
    }
  }

  async refund(intentId: string, amount: number): Promise<PaymentIntentResult> {
    const apiKey = await this.getApiKey();
    if (!apiKey) {
      throw new BadRequestException("Stripe API Key is not configured.");
    }

    try {
      this.logger.log(
        `Refunding Stripe PaymentIntent id=${intentId} amount=${amount}`,
      );

      const body = this.buildFormBody({
        payment_intent: intentId,
        amount: Math.round(amount * 100),
      });

      const res = await fetch("https://api.stripe.com/v1/refunds", {
        method: "POST",
        headers: await this.getHeaders(),
        body: body.toString(),
      });

      const data = (await res.json()) as any;

      if (!res.ok) {
        this.logger.error(
          `Stripe refund failed: ${JSON.stringify(data.error)}`,
        );
        throw new BadRequestException(
          data.error?.message || "Stripe refund failed.",
        );
      }

      return {
        id: intentId,
        status: "refunded",
      };
    } catch (err: any) {
      this.logger.error(`Stripe refund exception: ${err.message}`);
      throw new BadRequestException(err.message || "Refund processing failed.");
    }
  }

  private mapStripeStatus(
    status: string,
  ): "requires_confirmation" | "succeeded" | "failed" | "refunded" {
    switch (status) {
      case "requires_confirmation":
      case "requires_action":
      case "requires_payment_method":
        return "requires_confirmation";
      case "succeeded":
        return "succeeded";
      case "canceled":
      case "failed":
        return "failed";
      default:
        return "requires_confirmation";
    }
  }
}
