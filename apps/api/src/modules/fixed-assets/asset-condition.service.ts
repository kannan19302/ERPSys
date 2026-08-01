import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";
import { Prisma } from "@prisma/client";

@Injectable()
export class AssetConditionService {
  async getAssessments(tenantId: string, assetId?: string) {
    const where: Prisma.FixedAssetConditionAssessmentWhereInput = { tenantId };
    if (assetId) where.assetId = assetId;
    return prisma.fixedAssetConditionAssessment.findMany({
      where,
      orderBy: { assessmentDate: "desc" },
    });
  }

  async createAssessment(
    tenantId: string,
    assetId: string,
    dto: {
      assessmentDate: string;
      conditionScore: number;
      conditionRating: string;
      assessedBy: string;
      notes?: string;
      remainingLifeEstimate?: number;
      replacementCostEstimate?: number;
      nextAssessmentDate?: string;
    },
  ) {
    return prisma.fixedAssetConditionAssessment.create({
      data: {
        tenantId,
        assetId,
        ...dto,
        assessmentDate: new Date(dto.assessmentDate),
        replacementCostEstimate: dto.replacementCostEstimate
          ? new Prisma.Decimal(dto.replacementCostEstimate)
          : undefined,
        nextAssessmentDate: dto.nextAssessmentDate
          ? new Date(dto.nextAssessmentDate)
          : undefined,
      },
    });
  }

  async getLatestAssessments(tenantId: string) {
    const assets = await prisma.fixedAsset.findMany({
      where: { tenantId },
      select: { id: true, name: true },
    });
    const result: any[] = [];
    for (const asset of assets) {
      const latest = await prisma.fixedAssetConditionAssessment.findFirst({
        where: { tenantId, assetId: asset.id },
        orderBy: { assessmentDate: "desc" },
      });
      if (latest) result.push({ assetName: asset.name, ...latest });
    }
    return result;
  }

  async getConditionSummary(tenantId: string) {
    const assessments = await prisma.fixedAssetConditionAssessment.findMany({
      where: { tenantId },
    });
    const byRating: Record<string, number> = {};
    for (const a of assessments) {
      byRating[a.conditionRating] = (byRating[a.conditionRating] || 0) + 1;
    }
    const avgScore =
      assessments.length > 0
        ? assessments.reduce((s, a) => s + a.conditionScore, 0) /
          assessments.length
        : 0;
    return {
      totalAssessments: assessments.length,
      averageScore: Math.round(avgScore * 10) / 10,
      byRating,
    };
  }
}
