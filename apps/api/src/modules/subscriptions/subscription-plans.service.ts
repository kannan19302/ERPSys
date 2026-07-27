import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";

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
