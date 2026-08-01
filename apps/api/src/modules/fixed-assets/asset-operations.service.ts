import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class AssetOperationsService {
  // ── INSURANCE POLICIES ──
  async getInsurancePolicies(tenantId: string, query: { assetId?: string }) {
    const where: any = { tenantId };
    if (query.assetId) where.assetId = query.assetId;

    return prisma.fixedAssetInsurancePolicy.findMany({
      where,
      orderBy: { endDate: "asc" },
    });
  }

  async createInsurancePolicy(tenantId: string, data: any) {
    const policyNo = `POL-${Date.now().toString().slice(-6)}`;
    return prisma.fixedAssetInsurancePolicy.create({
      data: {
        tenantId,
        assetId: data.assetId,
        policyNo,
        insurer: data.insurer,
        coverageAmount: data.coverageAmount,
        premiumAmount: data.premiumAmount,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        status: "ACTIVE",
      },
    });
  }

  // ── ASSET REVALUATIONS ──
  async getAssetRevaluations(tenantId: string, query: { assetId?: string }) {
    const where: any = { tenantId };
    if (query.assetId) where.assetId = query.assetId;

    return prisma.fixedAssetRevaluation.findMany({
      where,
      orderBy: { revaluedAt: "desc" },
    });
  }

  async createAssetRevaluation(tenantId: string, data: any) {
    return prisma.fixedAssetRevaluation.create({
      data: {
        tenantId,
        assetId: data.assetId,
        oldValue: data.oldValue,
        newValue: data.newValue,
        revaluedBy: data.revaluedBy,
        reason: data.reason,
      },
    });
  }

  // ── PHYSICAL AUDITS ──
  async getPhysicalAudits(tenantId: string, query: { assetId?: string }) {
    const where: any = { tenantId };
    if (query.assetId) where.assetId = query.assetId;

    return prisma.fixedAssetPhysicalAudit.findMany({
      where,
      orderBy: { auditedAt: "desc" },
    });
  }

  async createPhysicalAudit(tenantId: string, data: any) {
    return prisma.fixedAssetPhysicalAudit.create({
      data: {
        tenantId,
        auditName: data.auditName || "Q3 Physical Asset Audit",
        assetId: data.assetId,
        expectedLocation: data.expectedLocation,
        foundLocation: data.foundLocation,
        condition: data.condition || "GOOD",
        auditedBy: data.auditedBy,
      },
    });
  }
}
