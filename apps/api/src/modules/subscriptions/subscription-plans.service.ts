import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";

@Injectable()
export class SubscriptionPlansService {
  async getPlanTiers(tenantId: string) {
    return prisma.subscriptionPlanTier.findMany({
      where: { tenantId, isActive: true },
      orderBy: { monthlyPrice: "asc" },
    });
  }

  async createPlanTier(tenantId: string, data: any) {
    return prisma.subscriptionPlanTier.create({
      data: {
        ...data,
        tenantId,
        features: data.features || [],
      },
    });
  }

  async getPlanGroups(tenantId: string) {
    return prisma.subscriptionPlanGroup.findMany({ where: { tenantId } });
  }

  async createPlan(tenantId: string, body: any) {
    return prisma.subscription.create({
      data: { ...body, tenantId } as any,
    });
  }

  async updatePlanTier(tenantId: string, id: string, data: any) {
    const existing = await prisma.subscriptionPlanTier.findFirst({
      where: { tenantId, id },
    });
    if (!existing)
      throw new NotFoundException("Subscription plan tier not found");
    return prisma.subscriptionPlanTier.update({
      where: { id },
      data,
    });
  }
}
