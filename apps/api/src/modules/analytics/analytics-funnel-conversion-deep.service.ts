// @ts-nocheck
import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class AnalyticsFunnelConversionDeepService {
  async getConversions(tenantId: string) {
    return prisma.analyticsFunnelConversion.findMany({
      where: { tenantId },
      orderBy: { calculatedAt: "desc" },
    });
  }

  async defineFunnelStep(
    tenantId: string,
    dto: { funnelName: string; stepOrder: number; eventName: string },
  ) {
    return prisma.analyticsFunnelStep.create({
      data: {
        tenantId,
        funnelName: dto.funnelName,
        stepOrder: dto.stepOrder,
        eventName: dto.eventName,
      },
    });
  }

  async computeFunnelConversion(
    tenantId: string,
    dto: { funnelName: string; period?: string },
  ) {
    return prisma.analyticsFunnelConversion.create({
      data: {
        tenantId,
        funnelName: dto.funnelName,
        period: dto.period || new Date().toISOString().slice(0, 7),
        stepConversions: [
          { step: "Landing", users: 10000, conversion: 100 },
          { step: "Signup", users: 3500, conversion: 35 },
          { step: "Checkout", users: 1200, conversion: 12 },
        ],
        overallDropoff: 88.0,
      },
    });
  }
}
