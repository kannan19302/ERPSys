import { Injectable, NotFoundException, Optional } from "@nestjs/common";
import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";

@Injectable()
export class AssetOperationsService {
  private readonly prisma: typeof prisma;

  /**
   * Injectable so this service can be unit-tested. It previously used the
   * module-level `prisma` import directly, so the mock its spec passes to the
   * constructor was discarded and every test hit the real database — failing on
   * RLS, since a unit test establishes no tenant session.
   *
   * `@Optional()` leaves the parameter undefined under Nest DI in production,
   * so the real client is used and runtime behaviour is unchanged.
   */
  constructor(@Optional() client?: typeof prisma) {
    this.prisma = client ?? prisma;
  }
  // ── INSURANCE POLICIES ──
  async getInsurancePolicies(tenantId: string, query: { assetId?: string }) {
    const where: any = { tenantId };
    if (query.assetId) where.assetId = query.assetId;

    return this.prisma.fixedAssetInsurancePolicy.findMany({
      where,
      orderBy: { endDate: "asc" },
    });
  }

  async createInsurancePolicy(tenantId: string, data: any) {
    const policyNo = `POL-${Date.now().toString().slice(-6)}`;
    return this.prisma.fixedAssetInsurancePolicy.create({
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

    return this.prisma.fixedAssetRevaluation.findMany({
      where,
      orderBy: { revaluedAt: "desc" },
    });
  }

  async createAssetRevaluation(tenantId: string, data: any) {
    return this.prisma.fixedAssetRevaluation.create({
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

    return this.prisma.fixedAssetPhysicalAudit.findMany({
      where,
      orderBy: { auditedAt: "desc" },
    });
  }

  async createPhysicalAudit(tenantId: string, data: any) {
    return this.prisma.fixedAssetPhysicalAudit.create({
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
