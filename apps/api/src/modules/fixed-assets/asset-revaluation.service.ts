import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";
import { Prisma } from "@prisma/client";

@Injectable()
export class AssetRevaluationService {
  async getRevaluations(tenantId: string, assetId?: string) {
    const where: Prisma.FixedAssetRevaluationWhereInput = { tenantId };
    if (assetId) where.assetId = assetId;
    return prisma.fixedAssetRevaluation.findMany({
      where,
      orderBy: { revaluedAt: "desc" },
    });
  }

  async createRevaluation(
    tenantId: string,
    assetId: string,
    userId: string,
    dto: {
      oldValue: number;
      newValue: number;
      reason: string;
      revaluedAt?: string;
    },
  ) {
    const asset = await prisma.fixedAsset.findFirst({
      where: { tenantId, id: assetId },
    });
    if (!asset) throw new NotFoundException("Asset not found");
    const result = await prisma.fixedAssetRevaluation.create({
      data: {
        tenantId,
        assetId,
        oldValue: new Prisma.Decimal(dto.oldValue),
        newValue: new Prisma.Decimal(dto.newValue),
        revaluedBy: userId,
        revaluedAt: dto.revaluedAt ? new Date(dto.revaluedAt) : new Date(),
        reason: dto.reason,
      },
    });
    await prisma.fixedAsset.update({
      where: { id: assetId },
      data: {
        currentValue: new Prisma.Decimal(dto.newValue),
        updatedBy: userId,
      },
    });
    return result;
  }

  async getRevaluationSummary(tenantId: string) {
    const revaluations = await prisma.fixedAssetRevaluation.findMany({
      where: { tenantId },
    });
    const totalIncrease = revaluations.reduce(
      (s, r) => s + Math.max(0, Number(r.newValue) - Number(r.oldValue)),
      0,
    );
    const totalDecrease = revaluations.reduce(
      (s, r) => s + Math.max(0, Number(r.oldValue) - Number(r.newValue)),
      0,
    );
    return {
      totalRevaluations: revaluations.length,
      totalIncrease,
      totalDecrease,
      netChange: totalIncrease - totalDecrease,
    };
  }
}
