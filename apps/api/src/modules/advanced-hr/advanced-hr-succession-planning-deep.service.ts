import { Injectable } from "@nestjs/common";
import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";

@Injectable()
export class AdvancedHrSuccessionPlanningDeepService {
  async getPlans(tenantId: string) {
    return prisma.advancedHrSuccessionPlan.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });
  }

  async createPlan(
    tenantId: string,
    dto: { planName: string; targetRoleId: string; urgencyLevel?: string },
  ) {
    return prisma.advancedHrSuccessionPlan.create({
      data: {
        tenantId,
        planName: dto.planName,
        targetRoleId: dto.targetRoleId,
        urgencyLevel: dto.urgencyLevel || "MEDIUM",
      },
    });
  }

  async nominateCandidate(
    planId: string,
    tenantId: string,
    dto: { employeeId: string; readinessScore: number; readinessLevel: string },
  ) {
    return prisma.advancedHrSuccessionCandidate.create({
      data: {
        planId,
        tenantId,
        employeeId: dto.employeeId,
        readinessScore: dto.readinessScore,
        readinessLevel: dto.readinessLevel || "READY_IN_1_YEAR",
      },
    });
  }
}
