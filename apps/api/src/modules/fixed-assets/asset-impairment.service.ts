// @ts-nocheck
import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";
import { Prisma } from "@prisma/client";

@Injectable()
export class AssetImpairmentService {
  async getImpairments(tenantId: string, assetId?: string) {
    const where: Prisma.FixedAssetImpairmentWhereInput = { tenantId };
    if (assetId) where.assetId = assetId;
    return prisma.fixedAssetImpairment.findMany({
      where,
      orderBy: { impairmentDate: "desc" },
    });
  }

  async createImpairment(
    tenantId: string,
    assetId: string,
    userId: string,
    dto: {
      impairmentDate: string;
      carryingAmount: number;
      recoverableAmount: number;
      impairmentType?: string;
      reason: string;
      approvedBy?: string;
    },
  ) {
    const asset = await prisma.fixedAsset.findFirst({
      where: { tenantId, id: assetId },
    });
    if (!asset) throw new NotFoundException("Asset not found");
    const loss = new Prisma.Decimal(dto.carryingAmount).minus(
      new Prisma.Decimal(dto.recoverableAmount),
    );
    const result = await prisma.fixedAssetImpairment.create({
      data: {
        tenantId,
        assetId,
        impairmentDate: new Date(dto.impairmentDate),
        carryingAmount: new Prisma.Decimal(dto.carryingAmount),
        recoverableAmount: new Prisma.Decimal(dto.recoverableAmount),
        impairmentLoss: loss,
        impairmentType: dto.impairmentType || "INDICATOR",
        reason: dto.reason,
        approvedBy: dto.approvedBy,
      },
    });
    await prisma.fixedAsset.update({
      where: { id: assetId },
      data: {
        currentValue: new Prisma.Decimal(dto.recoverableAmount),
        updatedBy: userId,
      },
    });
    return result;
  }

  async getImpairmentSummary(tenantId: string) {
    const impairments = await prisma.fixedAssetImpairment.findMany({
      where: { tenantId },
    });
    const totalLoss = impairments.reduce(
      (s, i) => s + Number(i.impairmentLoss),
      0,
    );
    const indicators = impairments.filter(
      (i) => i.impairmentType === "INDICATOR",
    ).length;
    const reversals = impairments.filter(
      (i) => i.impairmentType === "REVERSAL",
    ).length;
    return {
      totalImpairments: impairments.length,
      totalLoss,
      indicators,
      reversals,
    };
  }
}
