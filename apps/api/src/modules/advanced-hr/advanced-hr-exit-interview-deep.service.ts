// @ts-nocheck
import { Injectable } from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class AdvancedHrExitInterviewDeepService {
  async getInterviews(tenantId: string) {
    return prisma.advancedHrExitInterviewDeep.findMany({
      where: { tenantId },
      orderBy: { conductedAt: "desc" },
    });
  }

  async recordInterview(
    tenantId: string,
    dto: {
      employeeId: string;
      exitDate: string;
      exitReason: string;
      satisfactionScore: number;
      wouldRehire: boolean;
      comments?: string;
    },
  ) {
    return prisma.advancedHrExitInterviewDeep.create({
      data: {
        tenantId,
        employeeId: dto.employeeId,
        exitDate: new Date(dto.exitDate),
        exitReason: dto.exitReason,
        satisfactionScore: dto.satisfactionScore,
        wouldRehire: dto.wouldRehire,
        comments: dto.comments ?? null,
      },
    });
  }

  async getAttritionInsights(tenantId: string) {
    const records = await prisma.advancedHrExitInterviewDeep.findMany({
      where: { tenantId },
    });
    const topReasons = records.reduce<Record<string, number>>((acc, r) => {
      acc[r.exitReason] = (acc[r.exitReason] ?? 0) + 1;
      return acc;
    }, {});
    const avgSatisfaction = records.length
      ? records.reduce((sum, r) => sum + r.satisfactionScore, 0) /
        records.length
      : 0;
    const rehireRate = records.length
      ? (records.filter((r) => r.wouldRehire).length / records.length) * 100
      : 0;
    return {
      totalExits: records.length,
      avgSatisfaction: Math.round(avgSatisfaction * 10) / 10,
      rehireRate: Math.round(rehireRate),
      topReasons,
    };
  }
}
