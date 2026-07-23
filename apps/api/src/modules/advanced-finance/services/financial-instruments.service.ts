import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { prisma } from "@unerp/database";
import { Prisma } from "@prisma/client";

@Injectable()
export class FinancialInstrumentsService {
  // ── Fair Value Measurements ──────────────────────────────────

  async getFairValueMeasurements(tenantId: string, instrumentType?: string) {
    const where: any = { tenantId };
    if (instrumentType) where.instrumentType = instrumentType;
    return prisma.fairValueMeasurement.findMany({ where, orderBy: { measurementDate: "desc" } });
  }

  async getFairValueMeasurementById(tenantId: string, id: string) {
    const m = await prisma.fairValueMeasurement.findFirst({ where: { id, tenantId } });
    if (!m) throw new NotFoundException("Fair value measurement not found");
    return m;
  }

  async createFairValueMeasurement(tenantId: string, orgId: string, dto: any) {
    const costBasis = Number(dto.costBasis);
    const fairValue = Number(dto.fairValue);
    return prisma.fairValueMeasurement.create({
      data: {
        ...dto, tenantId, orgId,
        unrealizedGL: new Prisma.Decimal(fairValue - costBasis),
        measurementDate: new Date(dto.measurementDate),
        valuationDate: dto.valuationDate ? new Date(dto.valuationDate) : null,
        significantInputs: dto.significantInputs ?? Prisma.JsonNull,
      },
    });
  }

  async updateFairValueMeasurement(tenantId: string, id: string, dto: any) {
    const existing = await this.getFairValueMeasurementById(tenantId, id);
    const data: any = { ...dto };
    const newFairValue = dto.fairValue !== undefined ? Number(dto.fairValue) : Number(existing.fairValue);
    const newCostBasis = dto.costBasis !== undefined ? Number(dto.costBasis) : Number(existing.costBasis);
    data.unrealizedGL = new Prisma.Decimal(newFairValue - newCostBasis);
    if (dto.measurementDate) data.measurementDate = new Date(dto.measurementDate);
    if (dto.valuationDate !== undefined) data.valuationDate = dto.valuationDate ? new Date(dto.valuationDate) : null;
    if (dto.significantInputs) data.significantInputs = dto.significantInputs;
    return prisma.fairValueMeasurement.update({ where: { id }, data });
  }

  async deleteFairValueMeasurement(tenantId: string, id: string) {
    await this.getFairValueMeasurementById(tenantId, id);
    return prisma.fairValueMeasurement.delete({ where: { id } });
  }

  async getMeasurementsByInstrument(tenantId: string, instrumentType: string, instrumentId: string) {
    return prisma.fairValueMeasurement.findMany({
      where: { tenantId, instrumentType, instrumentId },
      orderBy: { measurementDate: "desc" },
    });
  }

  async getLatestMeasurement(tenantId: string, instrumentType: string, instrumentId: string) {
    const m = await prisma.fairValueMeasurement.findFirst({
      where: { tenantId, instrumentType, instrumentId },
      orderBy: { measurementDate: "desc" },
    });
    if (!m) throw new NotFoundException("No measurement found for this instrument");
    return m;
  }

  async getFairValueByLevel(tenantId: string, hierarchyLevel: string) {
    return prisma.fairValueMeasurement.findMany({
      where: { tenantId, hierarchyLevel },
      orderBy: { measurementDate: "desc" },
    });
  }

  async getFairValueHierarchySummary(tenantId: string, orgId: string) {
    const measurements = await prisma.fairValueMeasurement.findMany({ where: { tenantId, orgId } });
    const level1 = measurements.filter((m) => m.hierarchyLevel === "LEVEL_1").reduce((s, m) => s + Number(m.fairValue), 0);
    const level2 = measurements.filter((m) => m.hierarchyLevel === "LEVEL_2").reduce((s, m) => s + Number(m.fairValue), 0);
    const level3 = measurements.filter((m) => m.hierarchyLevel === "LEVEL_3").reduce((s, m) => s + Number(m.fairValue), 0);
    const totalUnrealized = measurements.reduce((s, m) => s + Number(m.unrealizedGL), 0);
    return { totalFairValue: level1 + level2 + level3, level1, level2, level3, totalUnrealizedGL: totalUnrealized, measurementCount: measurements.length };
  }

  async approveMeasurement(tenantId: string, id: string, approvedBy: string) {
    await this.getFairValueMeasurementById(tenantId, id);
    return prisma.fairValueMeasurement.update({
      where: { id },
      data: { approvedBy, performedBy: approvedBy },
    });
  }

  // ── Expected Credit Loss Provisions (CECL / IFRS 9) ────────

  async getExpectedCreditLossProvisions(tenantId: string, period?: string, stage?: string) {
    const where: any = { tenantId };
    if (period) where.period = period;
    if (stage) where.stage = stage;
    return prisma.expectedCreditLossProvision.findMany({ where, orderBy: { provisionDate: "desc" } });
  }

  async getExpectedCreditLossProvisionById(tenantId: string, id: string) {
    const p = await prisma.expectedCreditLossProvision.findFirst({ where: { id, tenantId } });
    if (!p) throw new NotFoundException("Expected credit loss provision not found");
    return p;
  }

  async createExpectedCreditLossProvision(tenantId: string, orgId: string, dto: any) {
    const grossAmount = Number(dto.grossCarryingAmount);
    const lossRate = Number(dto.lossRate || 0);
    const expectedLoss = grossAmount * lossRate;
    const previousAllowance = Number(dto.previousAllowance || 0);
    const chargeToPL = expectedLoss - previousAllowance;
    return prisma.expectedCreditLossProvision.create({
      data: {
        ...dto, tenantId, orgId,
        grossCarryingAmount: new Prisma.Decimal(grossAmount),
        lossRate: new Prisma.Decimal(lossRate),
        expectedLoss: new Prisma.Decimal(expectedLoss),
        allowanceBalance: new Prisma.Decimal(expectedLoss),
        previousAllowance: new Prisma.Decimal(previousAllowance),
        chargeToPL: new Prisma.Decimal(chargeToPL),
        provisionDate: new Date(dto.provisionDate),
        probabilityDefault: dto.probabilityDefault ? new Prisma.Decimal(dto.probabilityDefault) : null,
        lossGivenDefault: dto.lossGivenDefault ? new Prisma.Decimal(dto.lossGivenDefault) : null,
        exposureAtDefault: dto.exposureAtDefault ? new Prisma.Decimal(dto.exposureAtDefault) : null,
      },
    });
  }

  async updateExpectedCreditLossProvision(tenantId: string, id: string, dto: any) {
    const existing = await this.getExpectedCreditLossProvisionById(tenantId, id);
    const data: any = { ...dto };
    const grossAmount = dto.grossCarryingAmount !== undefined ? Number(dto.grossCarryingAmount) : Number(existing.grossCarryingAmount);
    const lossRate = dto.lossRate !== undefined ? Number(dto.lossRate) : Number(existing.lossRate);
    const expectedLoss = grossAmount * lossRate;
    const previousAllowance = Number(existing.allowanceBalance);
    const chargeToPL = expectedLoss - previousAllowance;
    data.expectedLoss = new Prisma.Decimal(expectedLoss);
    data.allowanceBalance = new Prisma.Decimal(expectedLoss);
    data.chargeToPL = new Prisma.Decimal(chargeToPL);
    if (dto.grossCarryingAmount !== undefined) data.grossCarryingAmount = new Prisma.Decimal(dto.grossCarryingAmount);
    if (dto.lossRate !== undefined) data.lossRate = new Prisma.Decimal(dto.lossRate);
    if (dto.probabilityDefault !== undefined) data.probabilityDefault = new Prisma.Decimal(dto.probabilityDefault);
    if (dto.lossGivenDefault !== undefined) data.lossGivenDefault = new Prisma.Decimal(dto.lossGivenDefault);
    if (dto.exposureAtDefault !== undefined) data.exposureAtDefault = new Prisma.Decimal(dto.exposureAtDefault);
    return prisma.expectedCreditLossProvision.update({ where: { id }, data });
  }

  async deleteExpectedCreditLossProvision(tenantId: string, id: string) {
    await this.getExpectedCreditLossProvisionById(tenantId, id);
    return prisma.expectedCreditLossProvision.delete({ where: { id } });
  }

  async reviewExpectedCreditLossProvision(tenantId: string, id: string, reviewedBy: string) {
    const prov = await this.getExpectedCreditLossProvisionById(tenantId, id);
    if (prov.status !== "DRAFT") throw new BadRequestException("Only draft provisions can be reviewed");
    return prisma.expectedCreditLossProvision.update({
      where: { id },
      data: { status: "REVIEWED", reviewedBy, reviewedAt: new Date() },
    });
  }

  async approveExpectedCreditLossProvision(tenantId: string, id: string, approvedBy: string) {
    const prov = await this.getExpectedCreditLossProvisionById(tenantId, id);
    if (prov.status !== "REVIEWED") throw new BadRequestException("Provision must be reviewed first");
    return prisma.expectedCreditLossProvision.update({
      where: { id },
      data: { status: "APPROVED", approvedBy, approvedAt: new Date() },
    });
  }

  async postExpectedCreditLossProvision(tenantId: string, id: string) {
    const prov = await this.getExpectedCreditLossProvisionById(tenantId, id);
    if (prov.status !== "APPROVED") throw new BadRequestException("Provision must be approved first");
    return prisma.expectedCreditLossProvision.update({
      where: { id },
      data: { status: "POSTED" },
    });
  }

  async getProvisionsByPeriod(tenantId: string, period: string) {
    return prisma.expectedCreditLossProvision.findMany({
      where: { tenantId, period },
      orderBy: { provisionDate: "desc" },
    });
  }

  async getECLSummary(tenantId: string, orgId: string, period: string) {
    const provisions = await prisma.expectedCreditLossProvision.findMany({
      where: { tenantId, orgId, period },
    });
    const stage1 = provisions.filter((p) => p.stage === "STAGE_1");
    const stage2 = provisions.filter((p) => p.stage === "STAGE_2");
    const stage3 = provisions.filter((p) => p.stage === "STAGE_3");
    return {
      period,
      totalGrossExposure: provisions.reduce((s, p) => s + Number(p.grossCarryingAmount), 0),
      totalExpectedLoss: provisions.reduce((s, p) => s + Number(p.expectedLoss), 0),
      totalAllowance: provisions.reduce((s, p) => s + Number(p.allowanceBalance), 0),
      totalChargeToPL: provisions.reduce((s, p) => s + Number(p.chargeToPL), 0),
      stage1: { count: stage1.length, expectedLoss: stage1.reduce((s, p) => s + Number(p.expectedLoss), 0) },
      stage2: { count: stage2.length, expectedLoss: stage2.reduce((s, p) => s + Number(p.expectedLoss), 0) },
      stage3: { count: stage3.length, expectedLoss: stage3.reduce((s, p) => s + Number(p.expectedLoss), 0) },
      provisionCount: provisions.length,
    };
  }

  async getECLRollForward(tenantId: string, orgId: string, period: string) {
    const provisions = await prisma.expectedCreditLossProvision.findMany({
      where: { tenantId, orgId, period },
    });
    const openingAllowance = provisions.reduce((s, p) => s + Number(p.previousAllowance), 0);
    const newProvisions = provisions.filter((p) => Number(p.chargeToPL) > 0).reduce((s, p) => s + Number(p.chargeToPL), 0);
    const releases = provisions.filter((p) => Number(p.chargeToPL) < 0).reduce((s, p) => s + Math.abs(Number(p.chargeToPL)), 0);
    const closingAllowance = provisions.reduce((s, p) => s + Number(p.allowanceBalance), 0);
    return { period, openingAllowance, newProvisions, releases, writeOffs: 0, closingAllowance };
  }

  async computeLossRate(tenantId: string, orgId: string, portfolio: string) {
    const provisions = await prisma.expectedCreditLossProvision.findMany({
      where: { tenantId, orgId, portfolio, status: "POSTED" },
      orderBy: { provisionDate: "desc" },
      take: 12,
    });
    if (provisions.length === 0) throw new NotFoundException("No posted provisions found for portfolio");
    const avgLossRate = provisions.length > 0 ? provisions.reduce((s, p) => s + Number(p.lossRate), 0) / provisions.length : 0;
    const minRate = Math.min(...provisions.map((p) => Number(p.lossRate)));
    const maxRate = Math.max(...provisions.map((p) => Number(p.lossRate)));
    const latest = provisions[0]!;
    return { portfolio, periodsAnalyzed: provisions.length, averageLossRate: avgLossRate, minRate, maxRate, currentRate: Number(latest.lossRate) };
  }

  async getAllECLDashboard(tenantId: string, orgId: string) {
    const provisions = await prisma.expectedCreditLossProvision.findMany({ where: { tenantId, orgId } });
    const totalAllowance = provisions.reduce((s, p) => s + Number(p.allowanceBalance), 0);
    const draftCount = provisions.filter((p) => p.status === "DRAFT").length;
    const postedCount = provisions.filter((p) => p.status === "POSTED").length;
    const portfolios = [...new Set(provisions.map((p) => p.portfolio).filter(Boolean))];
    const byPortfolio = portfolios.map((port) => {
      const p = provisions.filter((pr) => pr.portfolio === port);
      return { portfolio: port, count: p.length, totalAllowance: p.reduce((s, pr) => s + Number(pr.allowanceBalance), 0) };
    });
    return { totalProvisions: provisions.length, totalAllowance, draftCount, postedCount, portfolios, byPortfolio };
  }

  async getFinancialInstrumentsDashboard(tenantId: string, orgId: string) {
    const fvMeasurements = await prisma.fairValueMeasurement.findMany({ where: { tenantId, orgId } });
    const eclProvisions = await prisma.expectedCreditLossProvision.findMany({ where: { tenantId, orgId } });
    return {
      fairValueCount: fvMeasurements.length,
      totalFairValue: fvMeasurements.reduce((s, m) => s + Number(m.fairValue), 0),
      totalUnrealizedGL: fvMeasurements.reduce((s, m) => s + Number(m.unrealizedGL), 0),
      eclCount: eclProvisions.length,
      totalECLAllowance: eclProvisions.reduce((s, p) => s + Number(p.allowanceBalance), 0),
      totalChargeToPL: eclProvisions.reduce((s, p) => s + Number(p.chargeToPL), 0),
    };
  }
}
