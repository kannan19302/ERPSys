import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import * as crypto from "crypto";
import { StripePaymentGatewayService } from "../payments/stripe-payment-gateway.service";
import { MockPaymentGatewayService } from "../payments/mock-payment-gateway.service";
import { EcommerceCheckoutService } from "../ecommerce-checkout.service";

vi.mock("@unerp/database", () => {
  const mockPrisma = {
    $transaction: vi.fn(async (cb) => cb(mockPrisma)),
    cart: { findFirst: vi.fn(), update: vi.fn() },
    organization: { findFirst: vi.fn() },
    customer: { findFirst: vi.fn(), create: vi.fn() },
    storefrontOrderPayment: { findFirst: vi.fn(), create: vi.fn() },
    storefrontCheckoutState: {
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  };
  return {
    prisma: mockPrisma,
  };
});

function fakeSalesService() {
  return {
    createConfirmedOnlineOrder: vi.fn().mockResolvedValue({
      id: "so-webhook-123",
      orderNumber: "ONL-WEBHOOK-999",
      status: "CONFIRMED",
      totalAmount: 100,
    }),
  };
}

const baseCart = {
  id: "cart-stripe-1",
  tenantId: "t1",
  sessionToken: "sess-stripe-1",
  status: "ACTIVE",
  currency: "USD",
  items: [
    {
      id: "item-stripe-1",
      quantity: 4,
      unitPriceSnapshot: 25,
      productListing: {
        productId: "prod-stripe-1",
        displayName: "Super Widget",
        product: { name: "Super Widget" },
      },
    },
  ],
};

describe("Stripe Payment Gateway Integration & Webhooks", () => {
  let salesService: ReturnType<typeof fakeSalesService>;
  let checkoutService: EcommerceCheckoutService;
  const webhookSecret = "whsec_test_secret_key_12345678";

  beforeEach(async () => {
    vi.clearAllMocks();
    process.env.STRIPE_SECRET_KEY = "sk_test_mock_secret_key";
    process.env.STRIPE_WEBHOOK_SECRET = webhookSecret;

    salesService = fakeSalesService();
    const mockOutbox = {
      writeEvent: vi.fn().mockResolvedValue({ id: "event-stripe-1" }),
    };
    // Inject the real Stripe service since we mock the underlying fetch API
    checkoutService = new EcommerceCheckoutService(
      mockOutbox as never,
      new StripePaymentGatewayService(),
    );

    const { prisma } = await import("@unerp/database");
    vi.mocked(prisma.organization).findFirst.mockResolvedValue({
      id: "org-stripe-1",
      tenantId: "t1",
    } as never);
    vi.mocked(prisma.customer).findFirst.mockResolvedValue(null);
    vi.mocked(prisma.customer).create.mockResolvedValue({
      id: "cust-stripe-1",
    } as never);
    vi.mocked(prisma.storefrontOrderPayment).findFirst.mockResolvedValue(null);
    vi.mocked(prisma.storefrontOrderPayment).create.mockResolvedValue({
      id: "pay-stripe-1",
    } as never);
    vi.mocked(prisma.cart).update.mockResolvedValue({
      id: "cart-stripe-1",
      status: "CONVERTED",
    } as never);
    vi.mocked(prisma.storefrontCheckoutState.create).mockResolvedValue({
      id: "state-stripe-1",
    } as never);
    vi.mocked(prisma.storefrontCheckoutState.findFirst).mockResolvedValue(null);
  });

  afterEach(() => {
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_WEBHOOK_SECRET;
  });

  describe("StripePaymentGatewayService API Requests", () => {
    it("creates PaymentIntent correctly mapping cents", async () => {
      const stripeService = new StripePaymentGatewayService();

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          id: "pi_test_123",
          status: "requires_confirmation",
          client_secret: "pi_test_123_secret",
        }),
      });
      global.fetch = mockFetch;

      const result = await stripeService.createIntent(49.99, "USD", {
        cartId: "c1",
      });

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.stripe.com/v1/payment_intents",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining("amount=4999"), // 49.99 * 100
        }),
      );
      expect(result).toEqual({
        id: "pi_test_123",
        status: "requires_confirmation",
        clientSecret: "pi_test_123_secret",
      });
    });

    it("handles confirmIntent by creating a payment method and confirming", async () => {
      const stripeService = new StripePaymentGatewayService();

      const mockFetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: "pm_test_card" }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: "pi_test_123", status: "succeeded" }),
        });
      global.fetch = mockFetch;

      const result = await stripeService.confirmIntent("pi_test_123");

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result).toEqual({
        id: "pi_test_123",
        status: "succeeded",
      });
    });
  });

  describe("Webhook Cryptographic Signature Verification", () => {
    it("verifies valid HMAC webhook signatures correctly", async () => {
      const { prisma } = await import("@unerp/database");
      vi.mocked(prisma.cart).findFirst.mockResolvedValue(baseCart as never);

      const timestamp = Math.floor(Date.now() / 1000);
      const payload = JSON.stringify({
        type: "payment_intent.succeeded",
        data: {
          object: {
            id: "pi_webhook_success",
            metadata: {
              cartId: "cart-stripe-1",
              customerName: "Stripe Buyer",
              customerEmail: "stripe@example.com",
            },
          },
        },
      });

      const signedPayload = `${timestamp}.${payload}`;
      const hmac = crypto
        .createHmac("sha256", webhookSecret)
        .update(signedPayload)
        .digest("hex");

      const stripeSignatureHeader = `t=${timestamp},v1=${hmac}`;

      const result = await checkoutService.handleStripeWebhook(
        Buffer.from(payload),
        stripeSignatureHeader,
      );

      expect(result.success).toBe(true);
      expect(result.checkoutStateId).toBe("state-stripe-1");
    });

    it("rejects webhooks with invalid signatures", async () => {
      const payload = JSON.stringify({ type: "payment_intent.succeeded" });
      const badSignature = "t=12345,v1=wrong_hmac_hash";

      await expect(
        checkoutService.handleStripeWebhook(Buffer.from(payload), badSignature),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("Webhook Idempotency Protection", () => {
    it("skips duplicate webhook runs if payment is already recorded", async () => {
      const { prisma } = await import("@unerp/database");
      // Simulate that this payment was already processed (exists in DB)
      vi.mocked(prisma.storefrontCheckoutState.findFirst).mockResolvedValue({
        id: "existing-pay-record",
      } as never);

      const timestamp = Math.floor(Date.now() / 1000);
      const payload = JSON.stringify({
        type: "payment_intent.succeeded",
        data: {
          object: {
            id: "pi_duplicate_intent",
            metadata: { cartId: "cart-stripe-1" },
          },
        },
      });

      const signedPayload = `${timestamp}.${payload}`;
      const hmac = crypto
        .createHmac("sha256", webhookSecret)
        .update(signedPayload)
        .digest("hex");
      const signature = `t=${timestamp},v1=${hmac}`;

      const result = await checkoutService.handleStripeWebhook(
        Buffer.from(payload),
        signature,
      );

      expect(result).toEqual({ success: true, duplicate: true });
      expect(salesService.createConfirmedOnlineOrder).not.toHaveBeenCalled();
    });
  });
});
