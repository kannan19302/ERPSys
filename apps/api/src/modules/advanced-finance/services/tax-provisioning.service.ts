import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { prisma } from "@unerp/database";
import { Prisma } from "@prisma/client";

@Injectable()
export class TaxProvisioningService {
  // ── Provision Runs ───────────────────────────────────────────────────────

  async listProvisionRuns(tenantId: string, fiscalYear?: number) {
    return prisma.taxProvisionRun.findMany({
      where: {
        tenantId,
        ...(fiscalYear ? { fiscalYear } : {}),
      },
      orderBy: [{ fiscalYear: "desc" }, { period: "desc" }],
    });
  }

  async getProvisionRun(tenantId: string, id: string) {
    const run = await prisma.taxProvisionRun.findFirst({
      where: { id, tenantId },
    });
    if (!run) throw new NotFoundException("Tax provision run not found");
    return run;
  }

  async createProvisionRun(
    tenantId: string,
    dto: {
      fiscalYear: number;
      period: string;
      pretaxIncome?: number;
      statutoryRate?: number;
    },
  ) {
    const existing = await prisma.taxProvisionRun.findFirst({
      where: { tenantId, fiscalYear: dto.fiscalYear, period: dto.period },
    });
    if (existing)
      throw new BadRequestException(
        "Provision run already exists for this period",
      );

    return prisma.taxProvisionRun.create({
      data: {
        tenantId,
        fiscalYear: dto.fiscalYear,
        period: dto.period,
        status: "DRAFT",
        pretaxIncome: dto.pretaxIncome
          ? new Prisma.Decimal(dto.pretaxIncome)
          : null,
        statutoryRate: dto.statutoryRate
          ? new Prisma.Decimal(dto.statutoryRate)
          : null,
      },
    });
  }

  async updateProvisionRun(
    tenantId: string,
    id: string,
    dto: Partial<{
      pretaxIncome: number;
      statutoryRate: number;
      status: string;
    }>,
  ) {
    await this.getProvisionRun(tenantId, id);
    const data: Record<string, unknown> = {};
    if (dto.pretaxIncome !== undefined)
      data.pretaxIncome = new Prisma.Decimal(dto.pretaxIncome);
    if (dto.statutoryRate !== undefined)
      data.statutoryRate = new Prisma.Decimal(dto.statutoryRate);
    if (dto.status !== undefined) data.status = dto.status;
    return prisma.taxProvisionRun.update({ where: { id }, data });
  }

  async deleteProvisionRun(tenantId: string, id: string) {
    await this.getProvisionRun(tenantId, id);
    return prisma.taxProvisionRun.delete({ where: { id } });
  }

  async computeProvision(tenantId: string, id: string) {
    const run = await this.getProvisionRun(tenantId, id);
    if (run.status !== "DRAFT")
      throw new BadRequestException("Provision run is not in DRAFT status");

    const details = await prisma.taxProvisionDetail.findMany({
      where: { tenantId, runId: id },
    });

    if (details.length === 0)
      throw new BadRequestException(
        "No provision details found — add jurisdiction details first",
      );

    let currentTaxExpense = new Prisma.Decimal(0);
    for (const d of details) {
      currentTaxExpense = currentTaxExpense.add(d.currentTaxAmount);
    }

    const deferredSchedules = await prisma.deferredTaxSchedule.findMany({
      where: { tenantId, runId: id },
    });

    let deferredTaxExpense = new Prisma.Decimal(0);
    for (const s of deferredSchedules) {
      if (s.deferredTaxLiability)
        deferredTaxExpense = deferredTaxExpense.add(s.deferredTaxLiability);
      if (s.deferredTaxAsset)
        deferredTaxExpense = deferredTaxExpense.sub(s.deferredTaxAsset);
    }

    const totalTaxProvision = currentTaxExpense.add(deferredTaxExpense);
    const pretaxIncome = run.pretaxIncome || new Prisma.Decimal(0);
    const effectiveTaxRate = pretaxIncome.isZero()
      ? null
      : new Prisma.Decimal(
          Number(totalTaxProvision.div(pretaxIncome).mul(100)).toFixed(2),
        );

    return prisma.taxProvisionRun.update({
      where: { id },
      data: {
        currentTaxExpense,
        deferredTaxExpense,
        totalTaxProvision,
        effectiveTaxRate,
        status: "COMPUTED",
      },
    });
  }

  async reviewProvisionRun(tenantId: string, id: string, reviewedBy: string) {
    const run = await this.getProvisionRun(tenantId, id);
    if (run.status !== "COMPUTED")
      throw new BadRequestException("Provision must be computed before review");
    return prisma.taxProvisionRun.update({
      where: { id },
      data: { status: "REVIEWED", reviewedBy },
    });
  }

  async postProvisionRun(tenantId: string, id: string) {
    const run = await this.getProvisionRun(tenantId, id);
    if (run.status !== "REVIEWED")
      throw new BadRequestException(
        "Provision must be reviewed before posting",
      );
    return prisma.taxProvisionRun.update({
      where: { id },
      data: { status: "POSTED", postedAt: new Date() },
    });
  }

  // ── Provision Details ────────────────────────────────────────────────────

  async listProvisionDetails(tenantId: string, runId: string) {
    return prisma.taxProvisionDetail.findMany({
      where: { tenantId, runId },
      orderBy: { jurisdiction: "asc" },
    });
  }

  async getProvisionDetail(tenantId: string, id: string) {
    const detail = await prisma.taxProvisionDetail.findFirst({
      where: { id, tenantId },
    });
    if (!detail) throw new NotFoundException("Provision detail not found");
    return detail;
  }

  async createProvisionDetail(
    tenantId: string,
    runId: string,
    dto: {
      jurisdiction: string;
      taxableIncome: number;
      taxRate: number;
      credits?: number;
      payments?: number;
      withholding?: number;
      temporaryDifferences?: object;
      filingStatus?: string;
    },
  ) {
    await this.getProvisionRun(tenantId, runId);
    const taxableIncome = new Prisma.Decimal(dto.taxableIncome);
    const taxRate = new Prisma.Decimal(dto.taxRate);
    const currentTaxAmount = taxableIncome.mul(taxRate).div(100);

    return prisma.taxProvisionDetail.create({
      data: {
        tenantId,
        runId,
        jurisdiction: dto.jurisdiction,
        taxableIncome,
        taxRate,
        currentTaxAmount,
        credits:
          dto.credits !== undefined
            ? new Prisma.Decimal(dto.credits)
            : new Prisma.Decimal(0),
        payments:
          dto.payments !== undefined
            ? new Prisma.Decimal(dto.payments)
            : new Prisma.Decimal(0),
        withholding:
          dto.withholding !== undefined
            ? new Prisma.Decimal(dto.withholding)
            : new Prisma.Decimal(0),
        netTaxPayable: currentTaxAmount
          .sub(dto.credits || 0)
          .sub(dto.payments || 0)
          .sub(dto.withholding || 0),
        temporaryDifferences: (dto.temporaryDifferences as never) || null,
        filingStatus: dto.filingStatus || "ESTIMATED",
      },
    });
  }

  async updateProvisionDetail(
    tenantId: string,
    id: string,
    dto: Partial<{
      taxableIncome: number;
      taxRate: number;
      credits: number;
      payments: number;
      withholding: number;
      temporaryDifferences: object;
      filingStatus: string;
    }>,
  ) {
    const detail = await this.getProvisionDetail(tenantId, id);
    const data: Record<string, unknown> = {};
    const taxableIncome =
      dto.taxableIncome !== undefined
        ? new Prisma.Decimal(dto.taxableIncome)
        : detail.taxableIncome;
    const taxRate =
      dto.taxRate !== undefined
        ? new Prisma.Decimal(dto.taxRate)
        : detail.taxRate;
    const credits =
      dto.credits !== undefined
        ? new Prisma.Decimal(dto.credits)
        : detail.credits;
    const payments =
      dto.payments !== undefined
        ? new Prisma.Decimal(dto.payments)
        : detail.payments;
    const withholding =
      dto.withholding !== undefined
        ? new Prisma.Decimal(dto.withholding)
        : detail.withholding;

    if (dto.taxableIncome !== undefined || dto.taxRate !== undefined) {
      data.currentTaxAmount = taxableIncome.mul(taxRate).div(100);
    }
    data.netTaxPayable = taxableIncome
      .mul(taxRate)
      .div(100)
      .sub(credits || 0)
      .sub(payments || 0)
      .sub(withholding || 0);

    if (dto.taxableIncome !== undefined) data.taxableIncome = taxableIncome;
    if (dto.taxRate !== undefined) data.taxRate = taxRate;
    if (dto.credits !== undefined) data.credits = credits;
    if (dto.payments !== undefined) data.payments = payments;
    if (dto.withholding !== undefined) data.withholding = withholding;
    if (dto.temporaryDifferences !== undefined)
      data.temporaryDifferences = dto.temporaryDifferences as never;
    if (dto.filingStatus !== undefined) data.filingStatus = dto.filingStatus;

    return prisma.taxProvisionDetail.update({ where: { id }, data });
  }

  async computeProvisionDetail(tenantId: string, id: string) {
    const detail = await this.getProvisionDetail(tenantId, id);
    const taxAmount = detail.taxableIncome.mul(detail.taxRate).div(100);
    const netPayable = taxAmount
      .sub(detail.credits || new Prisma.Decimal(0))
      .sub(detail.payments || new Prisma.Decimal(0))
      .sub(detail.withholding || new Prisma.Decimal(0));

    return prisma.taxProvisionDetail.update({
      where: { id },
      data: {
        currentTaxAmount: taxAmount,
        netTaxPayable: netPayable,
      },
    });
  }

  async deleteProvisionDetail(tenantId: string, id: string) {
    await this.getProvisionDetail(tenantId, id);
    return prisma.taxProvisionDetail.delete({ where: { id } });
  }

  // ── Deferred Tax Schedules ───────────────────────────────────────────────

  async listDeferredTaxSchedules(tenantId: string, runId?: string) {
    return prisma.deferredTaxSchedule.findMany({
      where: {
        tenantId,
        ...(runId ? { runId } : {}),
      },
      orderBy: [{ categorization: "asc" }, { reversalYear: "asc" }],
    });
  }

  async getDeferredTaxSchedule(tenantId: string, id: string) {
    const schedule = await prisma.deferredTaxSchedule.findFirst({
      where: { id, tenantId },
    });
    if (!schedule)
      throw new NotFoundException("Deferred tax schedule not found");
    return schedule;
  }

  async createDeferredTaxSchedule(
    tenantId: string,
    runId: string,
    dto: {
      accountId: string;
      temporaryDifference: number;
      taxRate: number;
      reversalYear?: number;
      reversalType?: string;
      categorization?: string;
    },
  ) {
    const tempDiff = new Prisma.Decimal(dto.temporaryDifference);
    const taxRate = new Prisma.Decimal(dto.taxRate);
    const deferredTax = tempDiff.mul(taxRate).div(100);
    const deferredTaxAsset = tempDiff.isNeg() ? deferredTax.abs() : null;
    const deferredTaxLiability = tempDiff.isNeg() ? null : deferredTax;

    return prisma.deferredTaxSchedule.create({
      data: {
        tenantId,
        runId,
        accountId: dto.accountId,
        temporaryDifference: tempDiff,
        deferredTaxAsset,
        deferredTaxLiability,
        taxRate,
        reversalYear: dto.reversalYear || null,
        reversalType: dto.reversalType || null,
        categorization: dto.categorization || null,
      },
    });
  }

  async updateDeferredTaxSchedule(
    tenantId: string,
    id: string,
    dto: Partial<{
      temporaryDifference: number;
      taxRate: number;
      reversalYear: number;
      reversalType: string;
      categorization: string;
    }>,
  ) {
    await this.getDeferredTaxSchedule(tenantId, id);
    const data: Record<string, unknown> = {};
    if (dto.temporaryDifference !== undefined) {
      const tempDiff = new Prisma.Decimal(dto.temporaryDifference);
      data.temporaryDifference = tempDiff;
      const taxRate =
        dto.taxRate !== undefined ? new Prisma.Decimal(dto.taxRate) : null;
      const rate = taxRate || new Prisma.Decimal(0);
      const deferredTax = tempDiff.mul(rate).div(100);
      data.deferredTaxAsset = tempDiff.isNeg() ? deferredTax.abs() : null;
      data.deferredTaxLiability = tempDiff.isNeg() ? null : deferredTax;
    }
    if (dto.taxRate !== undefined) {
      data.taxRate = new Prisma.Decimal(dto.taxRate);
      if (dto.temporaryDifference !== undefined) {
        const tempDiff = new Prisma.Decimal(dto.temporaryDifference);
        const rate = new Prisma.Decimal(dto.taxRate);
        const deferredTax = tempDiff.mul(rate).div(100);
        data.deferredTaxAsset = tempDiff.isNeg() ? deferredTax.abs() : null;
        data.deferredTaxLiability = tempDiff.isNeg() ? null : deferredTax;
      }
    }
    if (dto.reversalYear !== undefined) data.reversalYear = dto.reversalYear;
    if (dto.reversalType !== undefined) data.reversalType = dto.reversalType;
    if (dto.categorization !== undefined)
      data.categorization = dto.categorization;
    return prisma.deferredTaxSchedule.update({ where: { id }, data });
  }

  async computeDeferredTaxes(tenantId: string, runId: string) {
    await this.getProvisionRun(tenantId, runId);
    const schedules = await prisma.deferredTaxSchedule.findMany({
      where: { tenantId, runId },
    });

    let totalDeferredAsset = new Prisma.Decimal(0);
    let totalDeferredLiability = new Prisma.Decimal(0);

    for (const s of schedules) {
      if (s.deferredTaxAsset)
        totalDeferredAsset = totalDeferredAsset.add(s.deferredTaxAsset);
      if (s.deferredTaxLiability)
        totalDeferredLiability = totalDeferredLiability.add(
          s.deferredTaxLiability,
        );
    }

    const netDeferred = totalDeferredLiability.sub(totalDeferredAsset);

    return {
      runId,
      totalDeferredTaxAsset: totalDeferredAsset,
      totalDeferredTaxLiability: totalDeferredLiability,
      netDeferredTaxPosition: netDeferred,
      scheduleCount: schedules.length,
    };
  }

  async deleteDeferredTaxSchedule(tenantId: string, id: string) {
    await this.getDeferredTaxSchedule(tenantId, id);
    return prisma.deferredTaxSchedule.delete({ where: { id } });
  }

  // ── Uncertain Tax Positions ──────────────────────────────────────────────

  async listUncertainTaxPositions(
    tenantId: string,
    runId?: string,
    status?: string,
  ) {
    return prisma.uncertainTaxPosition.findMany({
      where: {
        tenantId,
        ...(runId ? { runId } : {}),
        ...(status ? { status } : {}),
      },
      orderBy: { evaluationDate: "desc" },
    });
  }

  async getUncertainTaxPosition(tenantId: string, id: string) {
    const pos = await prisma.uncertainTaxPosition.findFirst({
      where: { id, tenantId },
    });
    if (!pos) throw new NotFoundException("Uncertain tax position not found");
    return pos;
  }

  async createUncertainTaxPosition(
    tenantId: string,
    runId: string,
    dto: {
      positionName: string;
      jurisdiction: string;
      description: string;
      taxAmountAtRisk: number;
      probabilityOfLoss: number;
    },
  ) {
    const taxAmountAtRisk = new Prisma.Decimal(dto.taxAmountAtRisk);
    const probabilityOfLoss = new Prisma.Decimal(dto.probabilityOfLoss);
    const expectedLossAmount = taxAmountAtRisk.mul(probabilityOfLoss).div(100);

    return prisma.uncertainTaxPosition.create({
      data: {
        tenantId,
        runId,
        positionName: dto.positionName,
        jurisdiction: dto.jurisdiction,
        description: dto.description,
        taxAmountAtRisk,
        probabilityOfLoss,
        expectedLossAmount,
        status: "IDENTIFIED",
        evaluationDate: new Date(),
      },
    });
  }

  async evaluateUncertainTaxPosition(
    tenantId: string,
    id: string,
    probabilityOfLoss: number,
  ) {
    const pos = await this.getUncertainTaxPosition(tenantId, id);
    const prob = new Prisma.Decimal(probabilityOfLoss);
    const expectedLoss = pos.taxAmountAtRisk.mul(prob).div(100);

    return prisma.uncertainTaxPosition.update({
      where: { id },
      data: {
        probabilityOfLoss: prob,
        expectedLossAmount: expectedLoss,
        status: "EVALUATED",
        evaluationDate: new Date(),
      },
    });
  }

  async reserveUncertainTaxPosition(
    tenantId: string,
    id: string,
    reserveAmount: number,
  ) {
    const pos = await this.getUncertainTaxPosition(tenantId, id);
    if (pos.status === "SETTLED")
      throw new BadRequestException("Position is already settled");

    return prisma.uncertainTaxPosition.update({
      where: { id },
      data: {
        reserveAmount: new Prisma.Decimal(reserveAmount),
        status: "RESERVED",
      },
    });
  }

  async settleUncertainTaxPosition(
    tenantId: string,
    id: string,
    settlementAmount: number,
  ) {
    await this.getUncertainTaxPosition(tenantId, id);
    return prisma.uncertainTaxPosition.update({
      where: { id },
      data: {
        reserveAmount: new Prisma.Decimal(settlementAmount),
        status: "SETTLED",
        settlementDate: new Date(),
      },
    });
  }

  async updateUncertainTaxPosition(
    tenantId: string,
    id: string,
    dto: Partial<{
      positionName: string;
      jurisdiction: string;
      description: string;
      taxAmountAtRisk: number;
      probabilityOfLoss: number;
    }>,
  ) {
    await this.getUncertainTaxPosition(tenantId, id);
    const data: Record<string, unknown> = {};
    if (dto.positionName !== undefined) data.positionName = dto.positionName;
    if (dto.jurisdiction !== undefined) data.jurisdiction = dto.jurisdiction;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.taxAmountAtRisk !== undefined)
      data.taxAmountAtRisk = new Prisma.Decimal(dto.taxAmountAtRisk);
    if (dto.probabilityOfLoss !== undefined) {
      const prob = new Prisma.Decimal(dto.probabilityOfLoss);
      data.probabilityOfLoss = prob;
      const atRisk =
        dto.taxAmountAtRisk !== undefined
          ? new Prisma.Decimal(dto.taxAmountAtRisk)
          : null;
      if (atRisk) data.expectedLossAmount = atRisk.mul(prob).div(100);
    }
    return prisma.uncertainTaxPosition.update({ where: { id }, data });
  }

  async deleteUncertainTaxPosition(tenantId: string, id: string) {
    await this.getUncertainTaxPosition(tenantId, id);
    return prisma.uncertainTaxPosition.delete({ where: { id } });
  }

  // ── Valuation Allowances ─────────────────────────────────────────────────

  async listValuationAllowances(tenantId: string, runId?: string) {
    return prisma.valuationAllowanceAssessment.findMany({
      where: {
        tenantId,
        ...(runId ? { runId } : {}),
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getValuationAllowance(tenantId: string, id: string) {
    const va = await prisma.valuationAllowanceAssessment.findFirst({
      where: { id, tenantId },
    });
    if (!va)
      throw new NotFoundException("Valuation allowance assessment not found");
    return va;
  }

  async createValuationAllowance(
    tenantId: string,
    runId: string,
    dto: {
      jurisdiction: string;
      deferredTaxAssetId?: string;
      allowanceAmount: number;
      assessmentType: string;
      positiveEvidence?: object;
      negativeEvidence?: object;
      conclusion?: string;
    },
  ) {
    return prisma.valuationAllowanceAssessment.create({
      data: {
        tenantId,
        runId,
        jurisdiction: dto.jurisdiction,
        deferredTaxAssetId: dto.deferredTaxAssetId || null,
        allowanceAmount: new Prisma.Decimal(dto.allowanceAmount),
        assessmentType: dto.assessmentType,
        positiveEvidence: (dto.positiveEvidence as never) || null,
        negativeEvidence: (dto.negativeEvidence as never) || null,
        conclusion: dto.conclusion || null,
        status: "DRAFT",
      },
    });
  }

  async updateValuationAllowance(
    tenantId: string,
    id: string,
    dto: Partial<{
      allowanceAmount: number;
      assessmentType: string;
      positiveEvidence: object;
      negativeEvidence: object;
      conclusion: string;
      status: string;
      reviewerId: string;
    }>,
  ) {
    await this.getValuationAllowance(tenantId, id);
    const data: Record<string, unknown> = {};
    if (dto.allowanceAmount !== undefined)
      data.allowanceAmount = new Prisma.Decimal(dto.allowanceAmount);
    if (dto.assessmentType !== undefined)
      data.assessmentType = dto.assessmentType;
    if (dto.positiveEvidence !== undefined)
      data.positiveEvidence = dto.positiveEvidence as never;
    if (dto.negativeEvidence !== undefined)
      data.negativeEvidence = dto.negativeEvidence as never;
    if (dto.conclusion !== undefined) data.conclusion = dto.conclusion;
    if (dto.reviewerId !== undefined) data.reviewerId = dto.reviewerId;
    if (dto.status !== undefined) {
      data.status = dto.status;
      if (dto.status === "REVIEWED") data.reviewedAt = new Date();
    }
    return prisma.valuationAllowanceAssessment.update({ where: { id }, data });
  }

  async assessValuationAllowance(
    tenantId: string,
    id: string,
    reviewerId: string,
  ) {
    const va = await this.getValuationAllowance(tenantId, id);
    if (va.status !== "DRAFT")
      throw new BadRequestException("Assessment is not in DRAFT status");
    return prisma.valuationAllowanceAssessment.update({
      where: { id },
      data: { status: "REVIEWED", reviewerId, reviewedAt: new Date() },
    });
  }

  async deleteValuationAllowance(tenantId: string, id: string) {
    await this.getValuationAllowance(tenantId, id);
    return prisma.valuationAllowanceAssessment.delete({ where: { id } });
  }

  // ── Effective Rate Reconciliation ────────────────────────────────────────

  async computeEffectiveRateReconciliation(tenantId: string, runId: string) {
    const run = await this.getProvisionRun(tenantId, runId);
    if (!run.pretaxIncome || !run.statutoryRate) {
      throw new BadRequestException(
        "Provision run must have pretax income and statutory rate set",
      );
    }

    const details = await prisma.taxProvisionDetail.findMany({
      where: { tenantId, runId },
    });
    const deferredSchedules = await prisma.deferredTaxSchedule.findMany({
      where: { tenantId, runId },
    });
    const uncertainPositions = await prisma.uncertainTaxPosition.findMany({
      where: { tenantId, runId },
    });

    const pretaxIncome = Number(run.pretaxIncome);
    const statutoryRate = Number(run.statutoryRate);
    const expectedTax = pretaxIncome * (statutoryRate / 100);

    let currentTaxTotal = 0;
    const byJurisdiction: {
      jurisdiction: string;
      income: number;
      tax: number;
      rate: number;
      weight: number;
    }[] = [];
    for (const d of details) {
      const income = Number(d.taxableIncome);
      const tax = Number(d.currentTaxAmount);
      currentTaxTotal += tax;
      byJurisdiction.push({
        jurisdiction: d.jurisdiction,
        income,
        tax,
        rate: Number(d.taxRate),
        weight: pretaxIncome > 0 ? (income / pretaxIncome) * 100 : 0,
      });
    }

    let deferredTaxTotal = 0;
    for (const s of deferredSchedules) {
      if (s.deferredTaxLiability)
        deferredTaxTotal += Number(s.deferredTaxLiability);
      if (s.deferredTaxAsset) deferredTaxTotal -= Number(s.deferredTaxAsset);
    }

    let uncertainReserveTotal = 0;
    for (const p of uncertainPositions) {
      if (p.reserveAmount) uncertainReserveTotal += Number(p.reserveAmount);
    }

    const totalTaxProvision =
      currentTaxTotal + deferredTaxTotal + uncertainReserveTotal;
    const effectiveTaxRate =
      pretaxIncome > 0 ? (totalTaxProvision / pretaxIncome) * 100 : 0;
    const rateDifference = effectiveTaxRate - statutoryRate;

    return {
      runId,
      fiscalYear: run.fiscalYear,
      period: run.period,
      pretaxIncome,
      statutoryRate,
      expectedTax,
      currentTaxExpense: currentTaxTotal,
      deferredTaxExpense: deferredTaxTotal,
      uncertainReserve: uncertainReserveTotal,
      totalTaxProvision,
      effectiveTaxRate: Number(effectiveTaxRate.toFixed(2)),
      rateDifference: Number(rateDifference.toFixed(2)),
      byJurisdiction,
      reconciliationItems: [
        { item: "Statutory rate", rate: statutoryRate, taxEffect: expectedTax },
        {
          item: "Current tax by jurisdiction",
          rate: (currentTaxTotal / pretaxIncome) * 100,
          taxEffect: currentTaxTotal,
        },
        {
          item: "Deferred tax adjustments",
          rate: (deferredTaxTotal / pretaxIncome) * 100,
          taxEffect: deferredTaxTotal,
        },
        {
          item: "Uncertain tax position reserves",
          rate: (uncertainReserveTotal / pretaxIncome) * 100,
          taxEffect: uncertainReserveTotal,
        },
        {
          item: "Effective rate",
          rate: effectiveTaxRate,
          taxEffect: totalTaxProvision,
        },
      ],
    };
  }

  // ── Dashboard ────────────────────────────────────────────────────────────

  async getTaxProvisionDashboard(tenantId: string, fiscalYear?: number) {
    const fy = fiscalYear || new Date().getFullYear();

    const [runs, details, deferred, uncertain, valuations] = await Promise.all([
      prisma.taxProvisionRun.findMany({ where: { tenantId, fiscalYear: fy } }),
      prisma.taxProvisionDetail.findMany({
        where: { tenantId, run: { tenantId, fiscalYear: fy } },
      }),
      prisma.deferredTaxSchedule.findMany({
        where: { tenantId, run: { tenantId, fiscalYear: fy } },
      }),
      prisma.uncertainTaxPosition.findMany({
        where: { tenantId, run: { tenantId, fiscalYear: fy } },
      }),
      prisma.valuationAllowanceAssessment.findMany({
        where: { tenantId, run: { tenantId, fiscalYear: fy } },
      }),
    ]);

    const totalCurrentTax = details.reduce(
      (s, d) => s + Number(d.currentTaxAmount),
      0,
    );
    const totalDeferredAsset = deferred.reduce(
      (s, d) => s + Number(d.deferredTaxAsset || 0),
      0,
    );
    const totalDeferredLiability = deferred.reduce(
      (s, d) => s + Number(d.deferredTaxLiability || 0),
      0,
    );
    const totalUncertainReserve = uncertain.reduce(
      (s, p) => s + Number(p.reserveAmount || 0),
      0,
    );
    const totalValuationAllowance = valuations.reduce(
      (s, v) => s + Number(v.allowanceAmount),
      0,
    );

    const postedRuns = runs.filter((r) => r.status === "POSTED");
    const totalProvision = postedRuns.reduce(
      (s, r) => s + Number(r.totalTaxProvision || 0),
      0,
    );

    return {
      fiscalYear: fy,
      totalRuns: runs.length,
      postedRuns: postedRuns.length,
      totalProvisionPosted: totalProvision,
      currentTaxExpense: totalCurrentTax,
      netDeferredTax: totalDeferredLiability - totalDeferredAsset,
      deferredTaxAsset: totalDeferredAsset,
      deferredTaxLiability: totalDeferredLiability,
      uncertainReserveTotal: totalUncertainReserve,
      valuationAllowanceTotal: totalValuationAllowance,
      jurisdictionCount: new Set(details.map((d) => d.jurisdiction)).size,
    };
  }
}
