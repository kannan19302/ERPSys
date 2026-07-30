// @ts-nocheck
import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class AssetPhysicalAuditService {
  async getAudits(tenantId: string, assetId?: string) {
    const where: Record<string, unknown> = { tenantId };
    if (assetId) where.assetId = assetId;
    return prisma.fixedAssetPhysicalAudit.findMany({
      where,
      orderBy: { auditedAt: "desc" },
    });
  }

  async createAudit(
    tenantId: string,
    dto: {
      assetId: string;
      auditName: string;
      expectedLocation: string;
      foundLocation: string;
      condition: string;
      auditedBy: string;
      auditedAt?: string;
    },
  ) {
    return prisma.fixedAssetPhysicalAudit.create({
      data: {
        tenantId,
        ...dto,
        auditedAt: dto.auditedAt ? new Date(dto.auditedAt) : new Date(),
      },
    });
  }

  async getAuditSummary(tenantId: string) {
    const audits = await prisma.fixedAssetPhysicalAudit.findMany({
      where: { tenantId },
    });
    const byCondition: Record<string, number> = {};
    for (const a of audits) {
      byCondition[a.condition] = (byCondition[a.condition] || 0) + 1;
    }
    return { totalAudits: audits.length, byCondition };
  }
}
