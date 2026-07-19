import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class SaasService {
  /**
   * Shapes raw SaaSPlan rows into what the portal UI expects. SaaSPlan has
   * no price/currency/interval/maxApiCalls columns today — real per-plan
   * pricing (and the proration/regional-pricing engine that would consume
   * it) is tracked as still-open in AUTH_BILLING_PROGRAM.md, not modeled
   * yet — so these are safe placeholder defaults, not billed amounts.
   */
  async getPlans(tenantId?: string) {
    const [plans, currentSub] = await Promise.all([
      prisma.saaSPlan.findMany({ orderBy: { maxUsers: "asc" } }),
      tenantId
        ? prisma.tenantSubscription.findFirst({ where: { tenantId } })
        : Promise.resolve(null),
    ]);

    return plans.map((plan) => ({
      id: plan.id,
      name: plan.name,
      price: 0,
      currency: "USD",
      interval: "month",
      maxUsers: plan.maxUsers,
      maxStorageMb: plan.maxStorage,
      maxApiCalls: 10000,
      features: Array.isArray(plan.features) ? plan.features : [],
      isCurrent: currentSub?.planId === plan.id,
      recommended: false,
    }));
  }

  /**
   * Shapes the raw TenantSubscription+SaaSPlan rows into what the SaaS
   * portal UI actually expects (planName/currentPeriodStart/
   * currentPeriodEnd/trialEndsAt) — the two had drifted apart because no
   * tenant ever had a real subscription row until registration started
   * creating one (see AuthService.register), so this path was never
   * exercised with real data before.
   */
  async getSubscription(tenantId: string) {
    const sub = await prisma.tenantSubscription.findFirst({
      where: { tenantId },
      include: { plan: true },
    });
    if (!sub) throw new NotFoundException("No active subscription found");
    return {
      id: sub.id,
      planId: sub.planId,
      planName: sub.plan.name,
      status: sub.status,
      currentPeriodStart: sub.startDate,
      currentPeriodEnd: sub.endDate,
      trialEndsAt: sub.status === "TRIAL" ? sub.endDate : null,
      // SaaSPlan doesn't track price/currency/interval today — the portal
      // renders these for paid plans fetched via getPlans() instead; a
      // trial's own price is always 0.
      price: 0,
      currency: "USD",
      interval: "month",
    };
  }

  async getUsageRecords(tenantId: string) {
    return prisma.usageRecord.findMany({
      where: { tenantId },
      orderBy: { metric: "asc" },
    });
  }

  async updateUsage(
    tenantId: string,
    metric: string,
    value: number,
    limit: number,
  ) {
    const existing = await prisma.usageRecord.findUnique({
      where: { tenantId_metric: { tenantId, metric } },
    });

    if (existing) {
      return prisma.usageRecord.update({
        where: { id: existing.id },
        data: { currentValue: value, limitValue: limit },
      });
    }

    return prisma.usageRecord.create({
      data: {
        tenantId,
        metric,
        currentValue: value,
        limitValue: limit,
      },
    });
  }

  async handleStripeWebhook(event: {
    type: string;
    data: { object: unknown };
  }) {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const tenantId = (session as Record<string, unknown>)
        .client_reference_id as string;
      const stripePriceId = (
        (session as Record<string, unknown>).metadata as Record<string, unknown>
      )?.stripePriceId as string;

      if (!tenantId || !stripePriceId) {
        throw new BadRequestException(
          "Missing tenantId or stripePriceId metadata",
        );
      }

      const plan = await prisma.saaSPlan.findUnique({
        where: { stripePriceId },
      });

      if (!plan) throw new NotFoundException("Matching SaaS plan not found");

      // Create or update subscription
      const existingSub = await prisma.tenantSubscription.findFirst({
        where: { tenantId },
      });

      if (existingSub) {
        await prisma.tenantSubscription.update({
          where: { id: existingSub.id },
          data: {
            planId: plan.id,
            status: "ACTIVE",
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        });
      } else {
        await prisma.tenantSubscription.create({
          data: {
            tenantId,
            planId: plan.id,
            status: "ACTIVE",
            startDate: new Date(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        });
      }

      // Also reset usage records
      await this.updateUsage(tenantId, "USERS_COUNT", 1, plan.maxUsers);
      await this.updateUsage(tenantId, "STORAGE_MB", 0, plan.maxStorage);
      await this.updateUsage(tenantId, "API_CALLS_COUNT", 0, 10000);

      return {
        success: true,
        message: "Subscription successfully upgraded via webhook",
      };
    }

    return { received: true };
  }

  async getInstalledApps(tenantId: string) {
    const installed = await prisma.installedApp.findMany({
      where: { tenantId },
      select: { appId: true, appSlug: true },
    });
    const list = new Set<string>();
    for (const i of installed) {
      if (i.appId) list.add(i.appId);
      if (i.appSlug) list.add(i.appSlug);
    }
    return Array.from(list);
  }

  async installApp(tenantId: string, appId: string) {
    return prisma.installedApp.upsert({
      where: {
        tenantId_appId: { tenantId, appId },
      },
      update: {},
      create: {
        tenantId,
        appId,
      },
    });
  }

  async uninstallApp(tenantId: string, appId: string) {
    return prisma.installedApp.deleteMany({
      where: { tenantId, appId },
    });
  }

  async createPlan(dto: {
    name: string;
    maxUsers: number;
    maxStorage: number;
    stripePriceId: string;
    features: string[];
  }) {
    return prisma.saaSPlan.create({
      data: {
        name: dto.name,
        maxUsers: dto.maxUsers,
        maxStorage: dto.maxStorage,
        stripePriceId: dto.stripePriceId,
        features: dto.features,
      },
    });
  }

  async getCoupons() {
    return prisma.saaSCoupon.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  async createCoupon(dto: {
    code: string;
    discountType: string;
    discountValue: number;
  }) {
    return prisma.saaSCoupon.create({
      data: {
        code: dto.code,
        discountType: dto.discountType,
        discountValue: dto.discountValue,
      },
    });
  }
}
