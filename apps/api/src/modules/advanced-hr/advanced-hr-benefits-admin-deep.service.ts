import { Injectable } from "@nestjs/common";
import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";

@Injectable()
export class AdvancedHrBenefitsAdminDeepService {
  async getPlans(tenantId: string) {
    return prisma.advancedHrBenefitsPlanDeep.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });
  }

  async createPlan(
    tenantId: string,
    dto: {
      planName: string;
      planType: string;
      providerName: string;
      employeeCost: number;
      employerCost: number;
    },
  ) {
    return prisma.advancedHrBenefitsPlanDeep.create({
      data: {
        tenantId,
        planName: dto.planName,
        planType: dto.planType || "HEALTH",
        providerName: dto.providerName,
        employeeCost: dto.employeeCost,
        employerCost: dto.employerCost,
        enrollmentOpen: true,
      },
    });
  }

  async enrollEmployee(planId: string, tenantId: string, employeeId: string) {
    return prisma.advancedHrBenefitsEnrollment.create({
      data: {
        planId,
        tenantId,
        employeeId,
        status: "ACTIVE",
      },
    });
  }
}
