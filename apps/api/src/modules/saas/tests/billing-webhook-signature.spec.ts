import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as crypto from "node:crypto";

vi.mock("@prisma/client", () => ({
  Prisma: {
    Decimal: class Decimal {
      constructor(v: unknown) {
        return Number(v) as unknown as Decimal;
      }
    },
    JsonNull: "JsonNull",
  },
}));

vi.mock("@unerp/database", () => ({
  prisma: {
    tenant: { update: vi.fn() },
  },
}));

import { BillingService } from "../billing.service";

/**
 * Regression coverage for the billing webhook signature bypass: the original
 * implementation only checked `signature.length >= 10`, so ANY 10+ character
 * string was accepted as a "valid" Stripe/Razorpay signature — letting an
 * attacker forge a `checkout.session.completed` / `order.paid` event and
 * upgrade any tenant's plan for free. These tests pin the real HMAC
 * verification and the fail-closed-when-unconfigured behavior in its place.
 */
describe("BillingService — webhook signature verification", () => {
  let service: BillingService;
  const secret = "whsec_test_secret_1234567890";

  beforeEach(() => {
    service = new BillingService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    delete process.env.STRIPE_WEBHOOK_SECRET;
    delete process.env.RAZORPAY_WEBHOOK_SECRET;
  });

  describe("processStripeWebhook", () => {
    it("rejects when STRIPE_WEBHOOK_SECRET is not configured, even with a plausible signature", async () => {
      const payload = JSON.stringify({
        type: "checkout.session.completed",
        data: { object: {} },
      });
      await expect(
        service.processStripeWebhook(payload, "t=1,v1=" + "a".repeat(64)),
      ).rejects.toThrow("not configured");
    });

    it("rejects a forged signature (the exact bug: any 10+ char string used to pass)", async () => {
      process.env.STRIPE_WEBHOOK_SECRET = secret;
      const payload = JSON.stringify({
        type: "checkout.session.completed",
        data: { object: {} },
      });
      const forged = "totally-fake-signature-that-is-long-enough";
      await expect(
        service.processStripeWebhook(payload, forged),
      ).rejects.toThrow("signature verification failed");
    });

    it("accepts a correctly computed HMAC signature", async () => {
      process.env.STRIPE_WEBHOOK_SECRET = secret;
      const payload = JSON.stringify({
        type: "checkout.session.completed",
        data: { object: { client_reference_id: null, metadata: {} } },
      });
      const t = Math.floor(Date.now() / 1000).toString();
      const v1 = crypto
        .createHmac("sha256", secret)
        .update(`${t}.${payload}`)
        .digest("hex");

      const result = await service.processStripeWebhook(
        payload,
        `t=${t},v1=${v1}`,
      );
      expect(result).toEqual({ received: true });
    });

    it("rejects a signature computed with the wrong secret", async () => {
      process.env.STRIPE_WEBHOOK_SECRET = secret;
      const payload = JSON.stringify({
        type: "checkout.session.completed",
        data: { object: {} },
      });
      const t = Math.floor(Date.now() / 1000).toString();
      const v1 = crypto
        .createHmac("sha256", "wrong-secret")
        .update(`${t}.${payload}`)
        .digest("hex");

      await expect(
        service.processStripeWebhook(payload, `t=${t},v1=${v1}`),
      ).rejects.toThrow("signature verification failed");
    });
  });

  describe("processRazorpayWebhook", () => {
    it("rejects when RAZORPAY_WEBHOOK_SECRET is not configured", async () => {
      const payload = JSON.stringify({
        event: "order.paid",
        payload: { payment: { entity: {} } },
      });
      await expect(
        service.processRazorpayWebhook(payload, "a".repeat(64)),
      ).rejects.toThrow("not configured");
    });

    it("rejects a forged signature", async () => {
      process.env.RAZORPAY_WEBHOOK_SECRET = secret;
      const payload = JSON.stringify({
        event: "order.paid",
        payload: { payment: { entity: {} } },
      });
      await expect(
        service.processRazorpayWebhook(
          payload,
          "forged-signature-value-1234567890",
        ),
      ).rejects.toThrow("signature verification failed");
    });

    it("accepts a correctly computed HMAC signature", async () => {
      process.env.RAZORPAY_WEBHOOK_SECRET = secret;
      const payload = JSON.stringify({
        event: "order.paid",
        payload: { payment: { entity: { notes: {} } } },
      });
      const sig = crypto
        .createHmac("sha256", secret)
        .update(payload)
        .digest("hex");

      const result = await service.processRazorpayWebhook(payload, sig);
      expect(result).toEqual({ received: true });
    });
  });
});
