import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { prisma } from "@unerp/database";
import { Prisma } from "@prisma/client";

@Injectable()
export class GlobalTaxDeepService {
  // ── Transfer Pricing Policies ────────────────────────────────

  async getTransferPricingPolicies(tenantId: string, isActive?: boolean) {
    const where: any = { tenantId };
    if (isActive !== undefined) where.isActive = isActive;
    return prisma.transferPricingPolicy.findMany({ where, orderBy: { effectiveFrom: "desc" } });
  }

  async getTransferPricingPolicyById(tenantId: string, id: string) {
    const policy = await prisma.transferPricingPolicy.findFirst({ where: { id, tenantId } });
    if (!policy) throw new NotFoundException("Transfer pricing policy not found");
    return policy;
  }

  async createTransferPricingPolicy(tenantId: string, orgId: string, dto: any) {
    return prisma.transferPricingPolicy.create({
      data: {
        ...dto, tenantId, orgId,
        effectiveFrom: new Date(dto.effectiveFrom),
        effectiveTo: dto.effectiveTo ? new Date(dto.effectiveTo) : null,
        markupPercentage: dto.markupPercentage ? new Prisma.Decimal(dto.markupPercentage) : null,
      },
    });
  }

  async updateTransferPricingPolicy(tenantId: string, id: string, dto: any) {
    await this.getTransferPricingPolicyById(tenantId, id);
    const data: any = { ...dto };
    if (dto.effectiveFrom) data.effectiveFrom = new Date(dto.effectiveFrom);
    if (dto.effectiveTo !== undefined) data.effectiveTo = dto.effectiveTo ? new Date(dto.effectiveTo) : null;
    if (dto.markupPercentage !== undefined) data.markupPercentage = new Prisma.Decimal(dto.markupPercentage);
    return prisma.transferPricingPolicy.update({ where: { id }, data });
  }

  async deleteTransferPricingPolicy(tenantId: string, id: string) {
    await this.getTransferPricingPolicyById(tenantId, id);
    return prisma.transferPricingPolicy.delete({ where: { id } });
  }

  async approveTransferPricingPolicy(tenantId: string, id: string, approvedBy: string) {
    await this.getTransferPricingPolicyById(tenantId, id);
    return prisma.transferPricingPolicy.update({
      where: { id },
      data: { approvedBy, approvedAt: new Date(), isActive: true },
    });
  }

  async getPoliciesByMethod(tenantId: string, method: string) {
    return prisma.transferPricingPolicy.findMany({ where: { tenantId, method, isActive: true } });
  }

  async getPoliciesByType(tenantId: string, policyType: string) {
    return prisma.transferPricingPolicy.findMany({ where: { tenantId, policyType, isActive: true } });
  }

  // ── Transfer Pricing Adjustments ────────────────────────────

  async getTransferPricingAdjustments(tenantId: string, fiscalYear?: string, policyId?: string) {
    const where: any = { tenantId };
    if (fiscalYear) where.fiscalYear = fiscalYear;
    if (policyId) where.policyId = policyId;
    return prisma.transferPricingAdjustment.findMany({ where, orderBy: { adjustmentDate: "desc" } });
  }

  async getTransferPricingAdjustmentById(tenantId: string, id: string) {
    const adj = await prisma.transferPricingAdjustment.findFirst({ where: { id, tenantId } });
    if (!adj) throw new NotFoundException("Transfer pricing adjustment not found");
    return adj;
  }

  async createTransferPricingAdjustment(tenantId: string, orgId: string, dto: any) {
    await this.getTransferPricingPolicyById(tenantId, dto.policyId);
    const original = Number(dto.originalAmount);
    const adjusted = Number(dto.adjustedAmount);
    const adjustment = adjusted - original;
    return prisma.transferPricingAdjustment.create({
      data: {
        ...dto, tenantId, orgId,
        adjustmentAmount: new Prisma.Decimal(Math.abs(adjustment)),
        adjustmentDirection: adjustment >= 0 ? "INCREASE" : "DECREASE",
        adjustmentDate: new Date(dto.adjustmentDate),
      },
    });
  }

  async updateTransferPricingAdjustment(tenantId: string, id: string, dto: any) {
    await this.getTransferPricingAdjustmentById(tenantId, id);
    const data: any = { ...dto };
    if (dto.adjustmentDate) data.adjustmentDate = new Date(dto.adjustmentDate);
    return prisma.transferPricingAdjustment.update({ where: { id }, data });
  }

  async reviewTransferPricingAdjustment(tenantId: string, id: string, reviewedBy: string) {
    const adj = await this.getTransferPricingAdjustmentById(tenantId, id);
    if (adj.status !== "DRAFT") throw new BadRequestException("Only draft adjustments can be reviewed");
    return prisma.transferPricingAdjustment.update({
      where: { id },
      data: { status: "REVIEWED", reviewedBy, reviewedAt: new Date() },
    });
  }

  async approveTransferPricingAdjustment(tenantId: string, id: string, approvedBy: string) {
    const adj = await this.getTransferPricingAdjustmentById(tenantId, id);
    if (adj.status !== "REVIEWED") throw new BadRequestException("Adjustment must be reviewed first");
    return prisma.transferPricingAdjustment.update({
      where: { id },
      data: { status: "APPROVED", approvedBy, approvedAt: new Date() },
    });
  }

  async postTransferPricingAdjustment(tenantId: string, id: string) {
    const adj = await this.getTransferPricingAdjustmentById(tenantId, id);
    if (adj.status !== "APPROVED") throw new BadRequestException("Adjustment must be approved first");
    return prisma.transferPricingAdjustment.update({
      where: { id },
      data: { status: "POSTED" },
    });
  }

  async deleteTransferPricingAdjustment(tenantId: string, id: string) {
    const adj = await this.getTransferPricingAdjustmentById(tenantId, id);
    if (adj.status !== "DRAFT") throw new BadRequestException("Only draft adjustments can be deleted");
    return prisma.transferPricingAdjustment.delete({ where: { id } });
  }

  async getAdjustmentsByPolicy(tenantId: string, policyId: string) {
    return prisma.transferPricingAdjustment.findMany({
      where: { tenantId, policyId },
      orderBy: { adjustmentDate: "desc" },
    });
  }

  async computeArmLengthRange(tenantId: string, policyId: string) {
    const policy = await this.getTransferPricingPolicyById(tenantId, policyId);
    const adjustments = await prisma.transferPricingAdjustment.findMany({
      where: { tenantId, policyId, status: "POSTED" },
    });
    if (adjustments.length === 0) throw new BadRequestException("No posted adjustments found");
    const rates = adjustments.map((a) => Number(a.adjustedAmount) / Number(a.originalAmount));
    const sorted = [...rates].sort((a, b) => a - b);
    const q1 = sorted[Math.floor(sorted.length * 0.25)] ?? 0;
    const q3 = sorted[Math.floor(sorted.length * 0.75)] ?? 0;
    const median = sorted[Math.floor(sorted.length * 0.5)] ?? 0;
    return { policyName: policy.policyName, policyMethod: policy.method, adjustmentsAnalyzed: adjustments.length, lowerQuartile: q1, median, upperQuartile: q3, armLengthRange: `${(q1 * 100).toFixed(2)}% - ${(q3 * 100).toFixed(2)}%` };
  }

  // ── Apportionment Factors ──────────────────────────────────

  async getApportionmentFactors(tenantId: string, fiscalYear?: string, jurisdiction?: string) {
    const where: any = { tenantId };
    if (fiscalYear) where.fiscalYear = fiscalYear;
    if (jurisdiction) where.jurisdiction = jurisdiction;
    return prisma.apportionmentFactor.findMany({ where, orderBy: { fiscalYear: "desc" } });
  }

  async getApportionmentFactorById(tenantId: string, id: string) {
    const factor = await prisma.apportionmentFactor.findFirst({ where: { id, tenantId } });
    if (!factor) throw new NotFoundException("Apportionment factor not found");
    return factor;
  }

  async createApportionmentFactor(tenantId: string, orgId: string, dto: any) {
    const numerator = Number(dto.numerator);
    const denominator = Number(dto.denominator);
    const factorPct = denominator !== 0 ? numerator / denominator : 0;
    return prisma.apportionmentFactor.create({
      data: {
        ...dto, tenantId, orgId,
        numerator: new Prisma.Decimal(numerator),
        denominator: new Prisma.Decimal(denominator),
        factorPct: new Prisma.Decimal(factorPct),
        effectivePct: dto.effectivePct ? new Prisma.Decimal(dto.effectivePct) : null,
        filedDate: dto.filedDate ? new Date(dto.filedDate) : null,
      },
    });
  }

  async updateApportionmentFactor(tenantId: string, id: string, dto: any) {
    await this.getApportionmentFactorById(tenantId, id);
    const data: any = { ...dto };
    if (dto.numerator !== undefined || dto.denominator !== undefined) {
      const existing = await this.getApportionmentFactorById(tenantId, id);
      const numerator = dto.numerator !== undefined ? Number(dto.numerator) : Number(existing.numerator);
      const denominator = dto.denominator !== undefined ? Number(dto.denominator) : Number(existing.denominator);
      data.factorPct = new Prisma.Decimal(denominator !== 0 ? numerator / denominator : 0);
    }
    if (dto.numerator !== undefined) data.numerator = new Prisma.Decimal(dto.numerator);
    if (dto.denominator !== undefined) data.denominator = new Prisma.Decimal(dto.denominator);
    if (dto.filedDate) data.filedDate = new Date(dto.filedDate);
    return prisma.apportionmentFactor.update({ where: { id }, data });
  }

  async finalizeApportionmentFactor(tenantId: string, id: string) {
    await this.getApportionmentFactorById(tenantId, id);
    return prisma.apportionmentFactor.update({ where: { id }, data: { isFinal: true } });
  }

  async deleteApportionmentFactor(tenantId: string, id: string) {
    await this.getApportionmentFactorById(tenantId, id);
    return prisma.apportionmentFactor.delete({ where: { id } });
  }

  async getFactorsByJurisdiction(tenantId: string, orgId: string, fiscalYear: string, jurisdiction: string) {
    return prisma.apportionmentFactor.findMany({
      where: { tenantId, orgId, fiscalYear, jurisdiction },
    });
  }

  async computeEffectiveApportionment(tenantId: string, orgId: string, fiscalYear: string) {
    const factors = await prisma.apportionmentFactor.findMany({ where: { tenantId, orgId, fiscalYear } });
    if (factors.length === 0) throw new NotFoundException("No apportionment factors found for this period");

    const byJurisdiction: Record<string, any> = {};
    for (const factor of factors) {
      if (!byJurisdiction[factor.jurisdiction]) byJurisdiction[factor.jurisdiction] = {};
      byJurisdiction[factor.jurisdiction][factor.factorType] = Number(factor.factorPct);
    }

    const result: any[] = [];
    for (const [jurisdiction, types] of Object.entries(byJurisdiction)) {
      const sales = (types as any).SALES || 0;
      const property = (types as any).PROPERTY || 0;
      const payroll = (types as any).PAYROLL || 0;
      const factorCount = [sales, property, payroll].filter((v) => v > 0).length || 1;
      const effectivePct = (sales + property + payroll) / factorCount;
      result.push({ jurisdiction, salesPct: sales, propertyPct: property, payrollPct: payroll, effectiveApportionmentPct: effectivePct });
    }
    return { fiscalYear, orgId, jurisdictions: result };
  }

  // ── Tax Compliance Dashboard ───────────────────────────────

  async getTaxComplianceDashboard(tenantId: string, orgId: string) {
    const policies = await prisma.transferPricingPolicy.findMany({ where: { tenantId, orgId, isActive: true } });
    const draftAdjustments = await prisma.transferPricingAdjustment.count({ where: { tenantId, orgId, status: "DRAFT" } });
    const pendingAdjustments = await prisma.transferPricingAdjustment.count({ where: { tenantId, orgId, status: { in: ["REVIEWED", "APPROVED"] } } });
    const postedAdjustments = await prisma.transferPricingAdjustment.count({ where: { tenantId, orgId, status: "POSTED" } });
    const jurisdictions = await prisma.apportionmentFactor.findMany({
      where: { tenantId, orgId },
      distinct: ["jurisdiction"],
      select: { jurisdiction: true },
    });
    return {
      activePolicies: policies.length,
      draftAdjustments,
      pendingAdjustments,
      postedAdjustments,
      jurisdictions: jurisdictions.map((j) => j.jurisdiction),
    };
  }

  async getTransferPricingSummary(tenantId: string, orgId: string, fiscalYear: string) {
    const policies = await prisma.transferPricingPolicy.findMany({ where: { tenantId, orgId, isActive: true } });
    const adjustments = await prisma.transferPricingAdjustment.findMany({ where: { tenantId, orgId, fiscalYear } });
    const totalAdjustment = adjustments.reduce((s, a) => s + Number(a.adjustmentAmount), 0);
    return {
      fiscalYear,
      activePolicies: policies.length,
      adjustmentsCount: adjustments.length,
      totalAdjustmentAmount: totalAdjustment,
      byStatus: {
        draft: adjustments.filter((a) => a.status === "DRAFT").length,
        reviewed: adjustments.filter((a) => a.status === "REVIEWED").length,
        approved: adjustments.filter((a) => a.status === "APPROVED").length,
        posted: adjustments.filter((a) => a.status === "POSTED").length,
      },
    };
  }

  async getMultiStateReturnSummary(tenantId: string, orgId: string, fiscalYear: string) {
    const factors = await prisma.apportionmentFactor.findMany({ where: { tenantId, orgId, fiscalYear } });
    const jurisdictions = [...new Set(factors.map((f) => f.jurisdiction))];
    const apportionment = await this.computeEffectiveApportionment(tenantId, orgId, fiscalYear);
    return {
      fiscalYear,
      jurisdictions,
      totalFactors: factors.length,
      finalizedFactors: factors.filter((f) => f.isFinal).length,
      apportionment,
    };
  }
}
