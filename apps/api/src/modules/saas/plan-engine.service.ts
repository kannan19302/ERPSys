import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class PlanEngineService {
  async listPlans(_tenantId?: string) {
    return prisma.saaSPlan.findMany({
      where: { status: { not: "ARCHIVED" } },
      orderBy: { sortOrder: "asc" },
      include: {
        prices: { where: { isActive: true } },
        featureEntitlements: { where: { isActive: true } },
      },
    });
  }

  async getPlan(_tenantId: string, id: string) {
    const plan = await prisma.saaSPlan.findUnique({
      where: { id },
      include: {
        prices: { where: { isActive: true } },
        featureEntitlements: { where: { isActive: true } },
        quotaRules: true,
      },
    });
    if (!plan) throw new NotFoundException("Plan not found");
    return plan;
  }

  async createPlan(_tenantId: string, dto: {
    name: string;
    description?: string;
    price: number;
    currency?: string;
    interval?: string;
    maxUsers: number;
    maxStorage: number;
    maxApiCalls?: number;
    trialPeriodDays?: number;
    isActive?: boolean;
    sortOrder?: number;
    stripePriceId?: string;
  }) {
    const stripePriceId = dto.stripePriceId ?? `${dto.name.toLowerCase().replace(/\s+/g, "-")}_${Date.now()}`;
    const existing = await prisma.saaSPlan.findUnique({ where: { stripePriceId } });
    if (existing) throw new ConflictException("Plan with this Stripe price ID already exists");

    return prisma.saaSPlan.create({
      data: {
        name: dto.name,
        stripePriceId,
        maxUsers: dto.maxUsers,
        maxStorage: dto.maxStorage,
        maxApiCalls: dto.maxApiCalls ?? 10000,
        features: [],
        description: dto.description,
        isPublic: dto.isActive ?? true,
        sortOrder: dto.sortOrder ?? 0,
        prices: {
          create: {
            currency: dto.currency ?? "USD",
            region: "US",
            monthly: dto.interval === "year" ? Math.round(dto.price / 12) : dto.price,
            yearly: dto.interval === "year" ? dto.price : dto.price * 12,
          },
        },
      },
      include: { prices: true, featureEntitlements: true },
    });
  }

  async updatePlan(_tenantId: string, id: string, dto: {
    name?: string;
    description?: string;
    price?: number;
    currency?: string;
    interval?: string;
    maxUsers?: number;
    maxStorage?: number;
    maxApiCalls?: number;
    trialPeriodDays?: number;
    isActive?: boolean;
    sortOrder?: number;
  }) {
    const plan = await prisma.saaSPlan.findUnique({ where: { id } });
    if (!plan) throw new NotFoundException("Plan not found");

    return prisma.saaSPlan.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.maxUsers !== undefined && { maxUsers: dto.maxUsers }),
        ...(dto.maxStorage !== undefined && { maxStorage: dto.maxStorage }),
        ...(dto.maxApiCalls !== undefined && { maxApiCalls: dto.maxApiCalls }),
        ...(dto.isActive !== undefined && { isPublic: dto.isActive }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
      },
      include: { prices: true, featureEntitlements: true },
    });
  }

  async deletePlan(_tenantId: string, id: string) {
    const plan = await prisma.saaSPlan.findUnique({ where: { id } });
    if (!plan) throw new NotFoundException("Plan not found");
    return prisma.saaSPlan.update({
      where: { id },
      data: { status: "ARCHIVED" },
    });
  }

  async comparePlans(_tenantId: string, planIds: string[]) {
    const plans = await prisma.saaSPlan.findMany({
      where: { id: { in: planIds }, status: { not: "ARCHIVED" } },
      include: {
        prices: { where: { isActive: true } },
        featureEntitlements: { where: { isActive: true } },
      },
      orderBy: { sortOrder: "asc" },
    });
    return plans.map((plan) => ({
      id: plan.id,
      name: plan.name,
      description: plan.description,
      maxUsers: plan.maxUsers,
      maxStorage: plan.maxStorage,
      maxApiCalls: plan.maxApiCalls,
      prices: plan.prices,
      features: plan.featureEntitlements,
    }));
  }

  async getRecommended(tenantId: string) {
    const usage = await prisma.usageRecord.findMany({ where: { tenantId } });
    const userCount = await prisma.user.count({ where: { tenantId } });
    const usageMap = new Map(usage.map((r) => [r.metric, r.currentValue]));
    const currentUsers = usageMap.get("USERS_COUNT") ?? userCount;
    const currentStorage = usageMap.get("STORAGE_MB") ?? 0;
    const currentApi = usageMap.get("API_CALLS_COUNT") ?? 0;

    const plans = await prisma.saaSPlan.findMany({
      where: { status: "ACTIVE", isPublic: true },
      orderBy: { sortOrder: "asc" },
      include: {
        prices: { where: { isActive: true, currency: "USD", region: "US" } },
        featureEntitlements: { where: { isActive: true } },
      },
    });

    const scored = plans.map((plan) => {
      let score = 0;
      if (currentUsers <= plan.maxUsers) score += 30;
      else score -= (currentUsers - plan.maxUsers) * 5;
      if (currentStorage <= plan.maxStorage) score += 30;
      else score -= (currentStorage - plan.maxStorage) / 100;
      if (currentApi <= plan.maxApiCalls) score += 20;
      else score -= (currentApi - plan.maxApiCalls) / 1000;
      if (plan.featureEntitlements.length > 0) score += 10;
      return { plan, score };
    });

    scored.sort((a, b) => b.score - a.score);
    const top = scored[0];
    return top ? top.plan : null;
  }

  async listPlanPrices(_tenantId: string, planId: string) {
    const plan = await prisma.saaSPlan.findUnique({ where: { id: planId } });
    if (!plan) throw new NotFoundException("Plan not found");
    return prisma.saaSPlanPrice.findMany({
      where: { planId, isActive: true },
    });
  }

  async setPlanPrice(_tenantId: string, planId: string, dto: {
    amount: number;
    currency: string;
    interval: string;
    billingPeriods?: number;
    isActive?: boolean;
    stripePriceId?: string;
  }) {
    const plan = await prisma.saaSPlan.findUnique({ where: { id: planId } });
    if (!plan) throw new NotFoundException("Plan not found");

    const region = "US";
    const existing = await prisma.saaSPlanPrice.findUnique({
      where: { planId_currency_region: { planId, currency: dto.currency, region } },
    });
    if (existing) throw new ConflictException("Price already exists for this plan/currency/region");

    return prisma.saaSPlanPrice.create({
      data: {
        planId,
        currency: dto.currency,
        region,
        monthly: dto.interval === "year" ? Math.round(dto.amount / 12) : dto.amount,
        yearly: dto.interval === "year" ? dto.amount : dto.amount * 12,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async updatePlanPrice(_tenantId: string, priceId: string, dto: {
    amount?: number;
    currency?: string;
    interval?: string;
    billingPeriods?: number;
    isActive?: boolean;
    stripePriceId?: string;
  }) {
    const price = await prisma.saaSPlanPrice.findUnique({ where: { id: priceId } });
    if (!price) throw new NotFoundException("Plan price not found");

    const updateData: Record<string, unknown> = {};
    if (dto.amount !== undefined) {
      updateData.monthly = dto.interval === "year" ? Math.round(dto.amount / 12) : dto.amount;
      updateData.yearly = dto.interval === "year" ? dto.amount : dto.amount * 12;
    }
    if (dto.currency !== undefined) updateData.currency = dto.currency;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;

    return prisma.saaSPlanPrice.update({ where: { id: priceId }, data: updateData });
  }

  async deletePlanPrice(_tenantId: string, priceId: string) {
    const price = await prisma.saaSPlanPrice.findUnique({ where: { id: priceId } });
    if (!price) throw new NotFoundException("Plan price not found");
    return prisma.saaSPlanPrice.delete({ where: { id: priceId } });
  }

  async listPlanFeatures(_tenantId: string, planId: string) {
    const plan = await prisma.saaSPlan.findUnique({ where: { id: planId } });
    if (!plan) throw new NotFoundException("Plan not found");
    return prisma.saaSPlanFeature.findMany({
      where: { planId, isActive: true },
    });
  }

  async addPlanFeature(_tenantId: string, planId: string, dto: {
    featureKey: string;
    featureName: string;
    featureType?: string;
    featureValue?: string;
    description?: string;
    isHighlighted?: boolean;
    sortOrder?: number;
  }) {
    const plan = await prisma.saaSPlan.findUnique({ where: { id: planId } });
    if (!plan) throw new NotFoundException("Plan not found");

    const typeMap: Record<string, string> = { boolean: "BOOLEAN", numeric: "USAGE_LIMITED", text: "BOOLEAN", select: "BOOLEAN" };

    const existing = await prisma.saaSPlanFeature.findUnique({
      where: { planId_featureKey: { planId, featureKey: dto.featureKey } },
    });
    if (existing) throw new ConflictException("Feature already exists for this plan");

    return prisma.saaSPlanFeature.create({
      data: {
        planId,
        featureKey: dto.featureKey,
        name: dto.featureName,
        description: dto.description,
        type: typeMap[dto.featureType ?? "boolean"] ?? "BOOLEAN",
        limitValue: dto.featureValue ? parseInt(dto.featureValue, 10) || null : null,
      },
    });
  }

  async updatePlanFeature(_tenantId: string, featureId: string, dto: {
    featureName?: string;
    featureType?: string;
    featureValue?: string;
    description?: string;
    isHighlighted?: boolean;
    sortOrder?: number;
  }) {
    const feature = await prisma.saaSPlanFeature.findUnique({ where: { id: featureId } });
    if (!feature) throw new NotFoundException("Plan feature not found");

    const typeMap: Record<string, string> = { boolean: "BOOLEAN", numeric: "USAGE_LIMITED", text: "BOOLEAN", select: "BOOLEAN" };

    const updateData: Record<string, unknown> = {};
    if (dto.featureName !== undefined) updateData.name = dto.featureName;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.featureType !== undefined) updateData.type = typeMap[dto.featureType] ?? "BOOLEAN";
    if (dto.featureValue !== undefined) updateData.limitValue = parseInt(dto.featureValue, 10) || null;

    return prisma.saaSPlanFeature.update({ where: { id: featureId }, data: updateData });
  }

  async removePlanFeature(_tenantId: string, featureId: string) {
    const feature = await prisma.saaSPlanFeature.findUnique({ where: { id: featureId } });
    if (!feature) throw new NotFoundException("Plan feature not found");
    return prisma.saaSPlanFeature.delete({ where: { id: featureId } });
  }
}
