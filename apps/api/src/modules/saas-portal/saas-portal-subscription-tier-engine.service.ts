import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class SaasPortalSubscriptionTierEngineService {
  async upgradePlan(
    tenantId: string,
    dto: { fromTier: string; toTier: string; proratedCharge: number },
  ) {
    return prisma.saasPortalSubscriptionUpgrade.create({
      data: {
        tenantId,
        fromTier: dto.fromTier,
        toTier: dto.toTier,
        proratedCharge: dto.proratedCharge,
        status: "COMPLETED",
      },
    });
  }

  async downgradePlanReason(
    tenantId: string,
    dto: { reasonCategory: string; feedback?: string },
  ) {
    return prisma.saasPortalPlanDowngradeReason.create({
      data: {
        tenantId,
        reasonCategory: dto.reasonCategory,
        feedback: dto.feedback,
      },
    });
  }

  async getUpgradeHistory(tenantId: string) {
    return prisma.saasPortalSubscriptionUpgrade.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });
  }
}
