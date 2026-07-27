import { Injectable } from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class AdvancedHrCompensationBandsDeepService {
  async getBands(tenantId: string) {
    return prisma.advancedHrCompensationBandDeep.findMany({
      where: { tenantId },
      orderBy: { jobLevel: "asc" },
    });
  }

  async createBand(
    tenantId: string,
    dto: {
      bandName: string;
      jobLevel: string;
      minSalary: number;
      midSalary: number;
      maxSalary: number;
      currency?: string;
      effectiveDate: string;
    },
  ) {
    return prisma.advancedHrCompensationBandDeep.create({
      data: {
        tenantId,
        bandName: dto.bandName,
        jobLevel: dto.jobLevel,
        minSalary: dto.minSalary,
        midSalary: dto.midSalary,
        maxSalary: dto.maxSalary,
        currency: dto.currency || "USD",
        effectiveDate: new Date(dto.effectiveDate),
      },
    });
  }
}
