import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  Optional,
} from "@nestjs/common";
import * as crypto from "node:crypto";
import { prisma } from "@unerp/database";
import { StorageMeteringService } from "./storage-metering.service";
import Stripe from "stripe";

export interface BillingCalculation {
  baseCost: number;
  addOnsCost: number;
  overageCost: number;
  totalCost: number;
  details: Array<{ item: string; cost: number }>;
}

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  private readonly usageBuffer = new Map<string, number>();
  private readonly stripe: Stripe | null = null;

  constructor(
    @Optional()
    private readonly storageMetering?: StorageMeteringService,
  ) {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (stripeKey) {
      // Initialize Stripe with the standard API version
      this.stripe = new Stripe(stripeKey, { apiVersion: "2024-04-10" as any });
    }
  }

  async createCheckoutSession(
    tenantId: string,
    planId: string,
    successUrl: string,
    couponCode?: string,
  ) {
    const plan = await prisma.saaSPlan.findUnique({
      where: { id: planId },
    });
    if (!plan) throw new NotFoundException("Plan not found");

    const joiner = successUrl.includes("?") ? "&" : "?";

    if (this.stripe && plan.stripePriceId) {
      try {
        const session = await this.stripe.checkout.sessions.create({
          payment_method_types: ["card"],
          mode: "subscription",
          client_reference_id: tenantId,
          line_items: [
            {
              price: plan.stripePriceId,
              quantity: 1,
            },
          ],
          success_url: `${successUrl}${joiner}session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${successUrl.replace("success=true", "cancel=true")}`,
          metadata: {
            planId,
            couponCode: couponCode || "",
          },
        });

        return {
          url: session.url,
          sessionId: session.id,
          metadata: { planId, couponCode: couponCode || "" },
        };
      } catch (err: any) {
        this.logger.error(`Stripe checkout failed: ${err.message}`);
        // Fallback to simulation if Stripe fails (e.g. invalid price ID)
      }
    }

    // Generate Stripe checkout session URL simulation
    const sessionId = `cs_${Date.now()}_${tenantId.slice(0, 8)}`;
    const metadata = { planId, couponCode: couponCode || "" };
    return {
      url: `${successUrl}${joiner}session_id=${sessionId}`,
      sessionId,
      metadata,
    };
  }

  async getCurrentSubscription(tenantId: string) {
    const sub = await prisma.tenantSubscription.findFirst({
      where: { tenantId },
      include: { plan: { include: { quotaRules: true } } },
    });

    if (!sub) {
      const freePlan = await prisma.saaSPlan.findFirst({
        where: { name: "Free" },
        include: { quotaRules: true },
      });
      return {
        plan: freePlan || {
          id: "free-id",
          name: "Free",
          maxUsers: 5,
          maxStorage: 1024,
          stripePriceId: "free-price",
          features: [],
        },
        status: "ACTIVE",
        startDate: null,
        endDate: null,
      };
    }

    return {
      id: sub.id,
      plan: sub.plan,
      status: sub.status,
      startDate: sub.startDate,
      endDate: sub.endDate,
    };
  }

  async changePlan(tenantId: string, newPlanId: string, couponCode?: string) {
    const newPlan = await prisma.saaSPlan.findUnique({
      where: { id: newPlanId },
    });
    if (!newPlan) throw new NotFoundException("Plan not found");

    if (couponCode) {
      const coupon = await prisma.saaSCoupon.findUnique({
        where: { code: couponCode },
      });
      if (coupon && coupon.status === "ACTIVE") {
        await prisma.saaSCoupon.update({
          where: { id: coupon.id },
          data: { timesRedeemed: coupon.timesRedeemed + 1 },
        });
      }
    }

    const existingSub = await prisma.tenantSubscription.findFirst({
      where: { tenantId },
    });

    if (existingSub) {
      return prisma.tenantSubscription.update({
        where: { id: existingSub.id },
        data: { planId: newPlanId, status: "ACTIVE" },
        include: { plan: true },
      });
    }

    return prisma.tenantSubscription.create({
      data: {
        tenantId,
        planId: newPlanId,
        status: "ACTIVE",
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      include: { plan: true },
    });
  }

  async cancelSubscription(tenantId: string) {
    const sub = await prisma.tenantSubscription.findFirst({
      where: { tenantId },
    });
    if (!sub) throw new BadRequestException("No active subscription");

    return prisma.tenantSubscription.update({
      where: { id: sub.id },
      data: { status: "CANCELLED" },
    });
  }

  async calculateBill(tenantId: string): Promise<BillingCalculation> {
    const sub = await prisma.tenantSubscription.findFirst({
      where: { tenantId },
      include: {
        plan: {
          include: {
            quotaRules: true,
          },
        },
      },
    });

    const baseCost =
      sub?.plan?.name === "Business"
        ? 49.0
        : sub?.plan?.name === "Enterprise"
          ? 199.0
          : 0.0;
    let addOnsCost = 0;
    let overageCost = 0;
    const details: Array<{ item: string; cost: number }> = [];

    if (sub?.plan) {
      details.push({ item: `Base Plan: ${sub.plan.name}`, cost: baseCost });
    }

    // 1. Add-ons cost
    const tenantAddOns = await prisma.tenantAddOn.findMany({
      where: { tenantId, status: "ACTIVE" },
      include: { addon: true },
    });

    for (const tao of tenantAddOns) {
      // addon.price is a Prisma Decimal (Track G.8 money discipline) — convert
      // explicitly rather than relying on implicit numeric coercion.
      const cost = Number(tao.addon.price) * tao.quantity;
      addOnsCost += cost;
      details.push({
        item: `Add-On: ${tao.addon.name} x${tao.quantity}`,
        cost,
      });
    }

    // 2. Overages calculation
    const usageRecords = await prisma.usageRecord.findMany({
      where: { tenantId },
    });

    const quotaRules = sub?.plan?.quotaRules || [];
    for (const rule of quotaRules) {
      const record = usageRecords.find((r) => r.metric === rule.metric);
      if (record && record.currentValue > rule.limitValue) {
        const overage = record.currentValue - rule.limitValue;
        const threshold = rule.billingThreshold || 1;
        const units = Math.ceil(overage / threshold);
        const cost = units * Number(rule.pricePerUnit);
        overageCost += cost;
        details.push({
          item: `Overage: ${rule.metric} (${overage} units over limit)`,
          cost,
        });
      }
    }

    const totalCost = baseCost + addOnsCost + overageCost;
    return {
      baseCost,
      addOnsCost,
      overageCost,
      totalCost,
      details,
    };
  }

  async getUsageSummary(tenantId: string) {
    const records = await prisma.usageRecord.findMany({ where: { tenantId } });
    const sub = await prisma.tenantSubscription.findFirst({
      where: { tenantId },
      include: { plan: true },
    });

    const userCount = await prisma.user.count({ where: { tenantId } });

    // Real per-app storage data if available; fall back to UsageRecord.
    let storageCurrent = records.find((r) => r.metric === "STORAGE_MB")
      ?.currentValue || 0;
    let appUsage: Array<{
      appSlug: string;
      rowCount: number;
      estimatedBytes: number;
    }> = [];
    if (this.storageMetering) {
      try {
        const rows = await this.storageMetering.getTenantUsage(tenantId);
        appUsage = rows as any;
        const realStorageMb = Math.round(
          rows.reduce(
            (sum: number, r: { estimatedBytes: bigint | number }) =>
              sum + Number(r.estimatedBytes),
            0,
          ) /
            (1024 * 1024),
        );
        if (realStorageMb > 0) storageCurrent = realStorageMb;
      } catch {
        // Fall back to UsageRecord value
      }
    }

    const storageLimit =
      records.find((r) => r.metric === "STORAGE_MB")?.limitValue ||
      sub?.plan?.maxStorage ||
      1024;
    const overStorageQuota = storageCurrent > storageLimit;

    return {
      plan: sub?.plan?.name || "Free",
      overQuota: overStorageQuota,
      users: {
        current: userCount,
        limit: sub?.plan?.maxUsers || 5,
        pct: Math.round((userCount / (sub?.plan?.maxUsers || 5)) * 100),
      },
      storage: {
        current: storageCurrent,
        limit: storageLimit,
        pct:
          storageLimit > 0
            ? Math.round((storageCurrent / storageLimit) * 100)
            : 0,
        perApp: appUsage.map((a) => ({
          appSlug: a.appSlug,
          rowCount: a.rowCount,
          estimatedMb: Math.round(
            Number(a.estimatedBytes) / (1024 * 1024),
          ),
        })),
      },
      metrics: records.map((r) => ({
        metric: r.metric,
        current: r.currentValue,
        limit: r.limitValue,
        pct:
          r.limitValue > 0
            ? Math.round((r.currentValue / r.limitValue) * 100)
            : 0,
      })),
    };
  }

  async recordUsage(tenantId: string, metric: string, increment: number) {
    const key = `${tenantId}:${metric}`;
    const currentBuffer = this.usageBuffer.get(key) || 0;
    this.usageBuffer.set(key, currentBuffer + increment);

    // Persist asynchronously in the background to prevent request blocking / write amplification
    this.persistUsage(tenantId, metric, increment).catch(() => {});
  }

  private async persistUsage(
    tenantId: string,
    metric: string,
    increment: number,
  ) {
    const existing = await prisma.usageRecord.findUnique({
      where: { tenantId_metric: { tenantId, metric } },
    });

    if (existing) {
      await prisma.usageRecord.update({
        where: { id: existing.id },
        data: { currentValue: existing.currentValue + increment },
      });
    } else {
      const sub = await prisma.tenantSubscription.findFirst({
        where: { tenantId },
        include: { plan: { include: { quotaRules: true } } },
      });
      const limitRule = sub?.plan?.quotaRules.find((r) => r.metric === metric);
      let limitValue = 0;
      if (limitRule) {
        limitValue = limitRule.limitValue;
      } else if (metric === "USERS_COUNT") {
        limitValue = sub?.plan?.maxUsers || 5;
      } else if (metric === "STORAGE_MB") {
        limitValue = sub?.plan?.maxStorage || 1024;
      }

      await prisma.usageRecord.create({
        data: { tenantId, metric, currentValue: increment, limitValue },
      });
    }
  }

  async runDailyRenewal() {
    const expiredSubscriptions = await prisma.tenantSubscription.findMany({
      where: {
        endDate: { lte: new Date() },
        status: { in: ["ACTIVE", "PAST_DUE"] },
      },
      include: {
        tenant: {
          include: {
            paymentMethods: {
              where: { isDefault: true },
            },
          },
        },
      },
    });

    for (const sub of expiredSubscriptions) {
      try {
        const billingInfo = await this.calculateBill(sub.tenantId);
        const defaultPm = sub.tenant.paymentMethods[0];
        if (defaultPm) {
          const success = await this.chargeMockCard(
            defaultPm,
            billingInfo.totalCost,
          );
          if (success) {
            await prisma.tenantSubscription.update({
              where: { id: sub.id },
              data: {
                status: "ACTIVE",
                startDate: new Date(),
                endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              },
            });
            continue;
          }
        }

        if (sub.status === "ACTIVE") {
          await prisma.tenantSubscription.update({
            where: { id: sub.id },
            data: { status: "PAST_DUE" },
          });
        } else if (sub.status === "PAST_DUE") {
          await prisma.tenantSubscription.update({
            where: { id: sub.id },
            data: { status: "EXPIRED" },
          });
        }
      } catch (err) {
        // Daily worker error logging
      }
    }
  }

  private async chargeMockCard(_pm: any, amount: number): Promise<boolean> {
    return amount >= 0;
  }

  /**
   * Verifies a Stripe webhook's HMAC signature: `t=<unix ts>,v1=<hex hmac>`
   * over `${t}.${rawPayload}` using STRIPE_WEBHOOK_SECRET. Same algorithm as
   * ecommerce-checkout.service.ts's verifyStripeSignature.
   */
  private verifyStripeSignature(
    payload: string,
    signature: string,
    secret: string,
  ): boolean {
    try {
      const parts = signature.split(",");
      const t = parts.find((p) => p.startsWith("t="))?.split("=")[1];
      const v1 = parts.find((p) => p.startsWith("v1="))?.split("=")[1];
      if (!t || !v1) return false;

      const computed = crypto
        .createHmac("sha256", secret)
        .update(`${t}.${payload}`)
        .digest("hex");

      const computedBuf = Buffer.from(computed, "hex");
      const givenBuf = Buffer.from(v1, "hex");
      return (
        computedBuf.length === givenBuf.length &&
        crypto.timingSafeEqual(computedBuf, givenBuf)
      );
    } catch {
      return false;
    }
  }

  /** Verifies a Razorpay webhook: hex HMAC-SHA256 of the raw body. */
  private verifyRazorpaySignature(
    payload: string,
    signature: string,
    secret: string,
  ): boolean {
    try {
      const computed = crypto
        .createHmac("sha256", secret)
        .update(payload)
        .digest("hex");
      const computedBuf = Buffer.from(computed, "hex");
      const givenBuf = Buffer.from(signature, "hex");
      return (
        computedBuf.length === givenBuf.length &&
        crypto.timingSafeEqual(computedBuf, givenBuf)
      );
    } catch {
      return false;
    }
  }

  /**
   * Processes a Stripe billing webhook. SECURITY: this triggers a real plan
   * change with no other auth — a forged event here lets an attacker upgrade
   * any tenant's plan for free. STRIPE_WEBHOOK_SECRET is mandatory (fail
   * closed): unlike best-effort features elsewhere in the app, a billing
   * webhook must never process an unverified payload, configured or not.
   */
  async processStripeWebhook(payload: string, sig: string) {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) {
      this.logger.error(
        "STRIPE_WEBHOOK_SECRET is not configured — rejecting webhook.",
      );
      throw new BadRequestException("Webhook processing is not configured");
    }
    if (!sig || !this.verifyStripeSignature(payload, sig, secret)) {
      this.logger.error(
        "Stripe billing webhook signature verification failed.",
      );
      throw new BadRequestException("Webhook signature verification failed");
    }

    let event: any;
    try {
      event = JSON.parse(payload);
    } catch {
      throw new BadRequestException("Invalid webhook payload");
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const tenantId = session.client_reference_id as string;
      const planId = (session.metadata as Record<string, string>)?.planId;
      const couponCode = (session.metadata as Record<string, string>)
        ?.couponCode;

      if (tenantId && planId) {
        await this.changePlan(tenantId, planId, couponCode);
      }
    }
    return { received: true };
  }

  /** Processes a Razorpay billing webhook. Same fail-closed policy as Stripe above. */
  async processRazorpayWebhook(payload: string, sig: string) {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) {
      this.logger.error(
        "RAZORPAY_WEBHOOK_SECRET is not configured — rejecting webhook.",
      );
      throw new BadRequestException("Webhook processing is not configured");
    }
    if (!sig || !this.verifyRazorpaySignature(payload, sig, secret)) {
      this.logger.error(
        "Razorpay billing webhook signature verification failed.",
      );
      throw new BadRequestException("Webhook signature verification failed");
    }

    let event: any;
    try {
      event = JSON.parse(payload);
    } catch {
      throw new BadRequestException("Invalid webhook payload");
    }

    if (event.event === "order.paid") {
      const order = event.payload.payment.entity;
      const tenantId = order.notes?.tenantId;
      const planId = order.notes?.planId;
      if (tenantId && planId) {
        await this.changePlan(tenantId, planId);
      }
    }
    return { received: true };
  }
}
