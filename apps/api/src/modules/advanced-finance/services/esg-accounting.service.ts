// @ts-nocheck
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { prisma } from "@unerp/database";
import { Prisma } from "@prisma/client";

@Injectable()
export class EsgAccountingService {
  // ── Emission Sources ─────────────────────────────────────────────────────

  async listEmissionSources(
    tenantId: string,
    scope?: string,
    fiscalYear?: number,
  ) {
    return prisma.emissionSourceRecord.findMany({
      where: {
        tenantId,
        ...(scope ? { scope } : {}),
        ...(fiscalYear ? { fiscalYear } : {}),
      },
      orderBy: { recordedAt: "desc" },
    });
  }

  async getEmissionSource(tenantId: string, id: string) {
    const record = await prisma.emissionSourceRecord.findFirst({
      where: { id, tenantId },
    });
    if (!record)
      throw new NotFoundException("Emission source record not found");
    return record;
  }

  async createEmissionSource(
    tenantId: string,
    dto: {
      sourceName: string;
      scope: string;
      category?: string;
      fuelType?: string;
      quantity: number;
      unit: string;
      emissionFactor: number;
      co2eKg: number;
      fiscalYear: number;
      period?: string;
    },
  ) {
    return prisma.emissionSourceRecord.create({
      data: {
        tenantId,
        sourceName: dto.sourceName,
        scope: dto.scope,
        category: dto.category || null,
        fuelType: dto.fuelType || null,
        quantity: new Prisma.Decimal(dto.quantity),
        unit: dto.unit,
        emissionFactor: new Prisma.Decimal(dto.emissionFactor),
        co2eKg: new Prisma.Decimal(dto.co2eKg),
        fiscalYear: dto.fiscalYear,
        period: dto.period || null,
      },
    });
  }

  async updateEmissionSource(
    tenantId: string,
    id: string,
    dto: Partial<{
      sourceName: string;
      scope: string;
      category: string;
      fuelType: string;
      quantity: number;
      unit: string;
      emissionFactor: number;
      co2eKg: number;
      fiscalYear: number;
      period: string;
      verified: boolean;
      verifiedBy: string;
    }>,
  ) {
    await this.getEmissionSource(tenantId, id);
    const data: Record<string, unknown> = {};
    if (dto.sourceName !== undefined) data.sourceName = dto.sourceName;
    if (dto.scope !== undefined) data.scope = dto.scope;
    if (dto.category !== undefined) data.category = dto.category;
    if (dto.fuelType !== undefined) data.fuelType = dto.fuelType;
    if (dto.quantity !== undefined)
      data.quantity = new Prisma.Decimal(dto.quantity);
    if (dto.unit !== undefined) data.unit = dto.unit;
    if (dto.emissionFactor !== undefined)
      data.emissionFactor = new Prisma.Decimal(dto.emissionFactor);
    if (dto.co2eKg !== undefined) data.co2eKg = new Prisma.Decimal(dto.co2eKg);
    if (dto.fiscalYear !== undefined) data.fiscalYear = dto.fiscalYear;
    if (dto.period !== undefined) data.period = dto.period;
    if (dto.verified !== undefined) data.verified = dto.verified;
    if (dto.verifiedBy !== undefined) data.verifiedBy = dto.verifiedBy;
    return prisma.emissionSourceRecord.update({ where: { id }, data });
  }

  async deleteEmissionSource(tenantId: string, id: string) {
    await this.getEmissionSource(tenantId, id);
    return prisma.emissionSourceRecord.delete({ where: { id } });
  }

  async recordEmission(
    tenantId: string,
    dto: {
      sourceName: string;
      scope: string;
      category?: string;
      fuelType?: string;
      quantity: number;
      unit: string;
      emissionFactor: number;
      fiscalYear: number;
      period?: string;
    },
  ) {
    const co2eKg = new Prisma.Decimal(dto.quantity).mul(
      new Prisma.Decimal(dto.emissionFactor),
    );
    return prisma.emissionSourceRecord.create({
      data: {
        tenantId,
        sourceName: dto.sourceName,
        scope: dto.scope,
        category: dto.category || null,
        fuelType: dto.fuelType || null,
        quantity: new Prisma.Decimal(dto.quantity),
        unit: dto.unit,
        emissionFactor: new Prisma.Decimal(dto.emissionFactor),
        co2eKg,
        fiscalYear: dto.fiscalYear,
        period: dto.period || null,
      },
    });
  }

  async getEmissionByScope(tenantId: string, fiscalYear: number) {
    const records = await prisma.emissionSourceRecord.findMany({
      where: { tenantId, fiscalYear },
    });
    const byScope = records.reduce<
      Record<string, { totalCo2eKg: number; count: number }>
    >((acc, r) => {
      const curr = acc[r.scope] || { totalCo2eKg: 0, count: 0 };
      curr.totalCo2eKg += Number(r.co2eKg);
      curr.count++;
      acc[r.scope] = curr;
      return acc;
    }, {});
    return {
      fiscalYear,
      totalCo2eKg: records.reduce((s, r) => s + Number(r.co2eKg), 0),
      byScope: Object.entries(byScope).map(([scope, data]) => ({
        scope,
        ...data,
      })),
    };
  }

  // ── Offset Credits ───────────────────────────────────────────────────────

  async listOffsetCredits(tenantId: string, status?: string) {
    return prisma.emissionOffsetCredit.findMany({
      where: {
        tenantId,
        ...(status ? { status } : {}),
      },
      orderBy: { purchasedAt: "desc" },
    });
  }

  async getOffsetCredit(tenantId: string, id: string) {
    const credit = await prisma.emissionOffsetCredit.findFirst({
      where: { id, tenantId },
    });
    if (!credit) throw new NotFoundException("Offset credit not found");
    return credit;
  }

  async createOffsetCredit(
    tenantId: string,
    dto: {
      creditType: string;
      quantityTonnes: number;
      creditPrice: number;
      vintageYear: number;
      registryId?: string;
      projectName?: string;
    },
  ) {
    const totalCost = new Prisma.Decimal(dto.quantityTonnes).mul(
      new Prisma.Decimal(dto.creditPrice),
    );
    return prisma.emissionOffsetCredit.create({
      data: {
        tenantId,
        creditType: dto.creditType,
        quantityTonnes: new Prisma.Decimal(dto.quantityTonnes),
        creditPrice: new Prisma.Decimal(dto.creditPrice),
        totalCost,
        vintageYear: dto.vintageYear,
        registryId: dto.registryId || null,
        projectName: dto.projectName || null,
        status: "AVAILABLE",
      },
    });
  }

  async updateOffsetCredit(
    tenantId: string,
    id: string,
    dto: Partial<{
      creditType: string;
      quantityTonnes: number;
      creditPrice: number;
      vintageYear: number;
      registryId: string;
      projectName: string;
      status: string;
    }>,
  ) {
    await this.getOffsetCredit(tenantId, id);
    const data: Record<string, unknown> = {};
    if (dto.creditType !== undefined) data.creditType = dto.creditType;
    if (dto.quantityTonnes !== undefined)
      data.quantityTonnes = new Prisma.Decimal(dto.quantityTonnes);
    if (dto.creditPrice !== undefined)
      data.creditPrice = new Prisma.Decimal(dto.creditPrice);
    if (dto.quantityTonnes !== undefined && dto.creditPrice !== undefined) {
      data.totalCost = new Prisma.Decimal(dto.quantityTonnes).mul(
        new Prisma.Decimal(dto.creditPrice),
      );
    }
    if (dto.vintageYear !== undefined) data.vintageYear = dto.vintageYear;
    if (dto.registryId !== undefined) data.registryId = dto.registryId;
    if (dto.projectName !== undefined) data.projectName = dto.projectName;
    if (dto.status !== undefined) data.status = dto.status;
    return prisma.emissionOffsetCredit.update({ where: { id }, data });
  }

  async retireOffsetCredit(tenantId: string, id: string, reason: string) {
    const credit = await this.getOffsetCredit(tenantId, id);
    if (credit.status !== "AVAILABLE") {
      throw new BadRequestException(
        "Offset credit is not available for retirement",
      );
    }
    return prisma.emissionOffsetCredit.update({
      where: { id },
      data: {
        status: "RETIRED",
        retiredAt: new Date(),
        retirementReason: reason,
      },
    });
  }

  async getAvailableOffsetCredits(tenantId: string) {
    const credits = await prisma.emissionOffsetCredit.findMany({
      where: { tenantId, status: "AVAILABLE" },
      orderBy: { vintageYear: "asc" },
    });
    return {
      totalCredits: credits.reduce((s, c) => s + Number(c.quantityTonnes), 0),
      totalCost: credits.reduce((s, c) => s + Number(c.totalCost), 0),
      creditCount: credits.length,
      credits,
    };
  }

  // ── KPI Definitions ──────────────────────────────────────────────────────

  async listKpiDefinitions(tenantId: string, category?: string) {
    return prisma.esgKpiDefinition.findMany({
      where: {
        tenantId,
        ...(category ? { category } : {}),
      },
      orderBy: { kpiName: "asc" },
    });
  }

  async getKpiDefinition(tenantId: string, id: string) {
    const def = await prisma.esgKpiDefinition.findFirst({
      where: { id, tenantId },
    });
    if (!def) throw new NotFoundException("KPI definition not found");
    return def;
  }

  async createKpiDefinition(
    tenantId: string,
    dto: {
      kpiCode: string;
      kpiName: string;
      category: string;
      subCategory?: string;
      unit: string;
      description?: string;
      calculationMethod?: string;
      targetDirection?: string;
      reportingFramework?: string;
    },
  ) {
    const existing = await prisma.esgKpiDefinition.findFirst({
      where: { tenantId, kpiCode: dto.kpiCode },
    });
    if (existing)
      throw new BadRequestException(`KPI code '${dto.kpiCode}' already exists`);
    return prisma.esgKpiDefinition.create({
      data: {
        tenantId,
        kpiCode: dto.kpiCode,
        kpiName: dto.kpiName,
        category: dto.category,
        subCategory: dto.subCategory || null,
        unit: dto.unit,
        description: dto.description || null,
        calculationMethod: dto.calculationMethod || null,
        targetDirection: dto.targetDirection || "HIGHER_IS_BETTER",
        reportingFramework: dto.reportingFramework || null,
      },
    });
  }

  async updateKpiDefinition(
    tenantId: string,
    id: string,
    dto: Partial<{
      kpiCode: string;
      kpiName: string;
      category: string;
      subCategory: string;
      unit: string;
      description: string;
      calculationMethod: string;
      targetDirection: string;
      reportingFramework: string;
      isActive: boolean;
    }>,
  ) {
    await this.getKpiDefinition(tenantId, id);
    const data: Record<string, unknown> = {};
    if (dto.kpiCode !== undefined) {
      const dup = await prisma.esgKpiDefinition.findFirst({
        where: { tenantId, kpiCode: dto.kpiCode, id: { not: id } },
      });
      if (dup)
        throw new BadRequestException(
          `KPI code '${dto.kpiCode}' is already in use`,
        );
      data.kpiCode = dto.kpiCode;
    }
    if (dto.kpiName !== undefined) data.kpiName = dto.kpiName;
    if (dto.category !== undefined) data.category = dto.category;
    if (dto.subCategory !== undefined) data.subCategory = dto.subCategory;
    if (dto.unit !== undefined) data.unit = dto.unit;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.calculationMethod !== undefined)
      data.calculationMethod = dto.calculationMethod;
    if (dto.targetDirection !== undefined)
      data.targetDirection = dto.targetDirection;
    if (dto.reportingFramework !== undefined)
      data.reportingFramework = dto.reportingFramework;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    return prisma.esgKpiDefinition.update({ where: { id }, data });
  }

  async deleteKpiDefinition(tenantId: string, id: string) {
    await this.getKpiDefinition(tenantId, id);
    return prisma.esgKpiDefinition.delete({ where: { id } });
  }

  // ── KPI Actual Values ────────────────────────────────────────────────────

  async listKpiActualValues(
    tenantId: string,
    kpiId?: string,
    fiscalYear?: number,
  ) {
    return prisma.esgKpiActualValue.findMany({
      where: {
        tenantId,
        ...(kpiId ? { kpiId } : {}),
        ...(fiscalYear ? { fiscalYear } : {}),
      },
      orderBy: [{ fiscalYear: "desc" }, { period: "asc" }],
    });
  }

  async recordKpiActualValue(
    tenantId: string,
    dto: {
      kpiId: string;
      fiscalYear: number;
      period?: string;
      actualValue: number;
      targetValue?: number;
      dataSource?: string;
      verified?: boolean;
      verifiedBy?: string;
    },
  ) {
    const def = await prisma.esgKpiDefinition.findFirst({
      where: { id: dto.kpiId, tenantId },
    });
    if (!def) throw new NotFoundException("KPI definition not found");

    const actual = new Prisma.Decimal(dto.actualValue);
    let variance: Prisma.Decimal | null = null;
    let variancePercent: Prisma.Decimal | null = null;
    if (dto.targetValue !== undefined) {
      const target = new Prisma.Decimal(dto.targetValue);
      variance = actual.sub(target);
      variancePercent = target.isZero()
        ? new Prisma.Decimal(0)
        : new Prisma.Decimal(Number(variance.div(target).mul(100)).toFixed(2));
    }

    return prisma.esgKpiActualValue.create({
      data: {
        tenantId,
        kpiId: dto.kpiId,
        fiscalYear: dto.fiscalYear,
        period: dto.period || null,
        actualValue: actual,
        targetValue:
          dto.targetValue !== undefined
            ? new Prisma.Decimal(dto.targetValue)
            : null,
        variance,
        variancePercent,
        dataSource: dto.dataSource || null,
        verified: dto.verified ?? false,
        verifiedBy: dto.verifiedBy || null,
      },
    });
  }

  async computeVariance(tenantId: string, actualValueId: string) {
    const actual = await prisma.esgKpiActualValue.findFirst({
      where: { id: actualValueId, tenantId },
    });
    if (!actual) throw new NotFoundException("KPI actual value not found");
    if (!actual.targetValue)
      throw new BadRequestException("No target value set for comparison");

    const variance = actual.actualValue.sub(actual.targetValue);
    const variancePercent = actual.targetValue.isZero()
      ? new Prisma.Decimal(0)
      : new Prisma.Decimal(
          Number(variance.div(actual.targetValue).mul(100)).toFixed(2),
        );

    return prisma.esgKpiActualValue.update({
      where: { id: actualValueId },
      data: { variance, variancePercent },
    });
  }

  // ── Report Templates ─────────────────────────────────────────────────────

  async listReportTemplates(tenantId: string, reportingFramework?: string) {
    return prisma.esgReportTemplate.findMany({
      where: {
        tenantId,
        ...(reportingFramework ? { reportingFramework } : {}),
      },
      orderBy: { templateName: "asc" },
    });
  }

  async getReportTemplate(tenantId: string, id: string) {
    const tpl = await prisma.esgReportTemplate.findFirst({
      where: { id, tenantId },
    });
    if (!tpl) throw new NotFoundException("Report template not found");
    return tpl;
  }

  async createReportTemplate(
    tenantId: string,
    dto: {
      templateName: string;
      reportingFramework: string;
      templateConfig: object;
    },
  ) {
    return prisma.esgReportTemplate.create({
      data: {
        tenantId,
        templateName: dto.templateName,
        reportingFramework: dto.reportingFramework,
        templateConfig: dto.templateConfig as never,
      },
    });
  }

  async updateReportTemplate(
    tenantId: string,
    id: string,
    dto: Partial<{
      templateName: string;
      reportingFramework: string;
      templateConfig: object;
      isDefault: boolean;
    }>,
  ) {
    await this.getReportTemplate(tenantId, id);
    const data: Record<string, unknown> = {};
    if (dto.templateName !== undefined) data.templateName = dto.templateName;
    if (dto.reportingFramework !== undefined)
      data.reportingFramework = dto.reportingFramework;
    if (dto.templateConfig !== undefined)
      data.templateConfig = dto.templateConfig as never;
    if (dto.isDefault !== undefined) data.isDefault = dto.isDefault;
    return prisma.esgReportTemplate.update({ where: { id }, data });
  }

  async setDefaultReportTemplate(tenantId: string, id: string) {
    await this.getReportTemplate(tenantId, id);
    await prisma.esgReportTemplate.updateMany({
      where: { tenantId, isDefault: true },
      data: { isDefault: false },
    });
    return prisma.esgReportTemplate.update({
      where: { id },
      data: { isDefault: true },
    });
  }

  async generateReport(tenantId: string, templateId: string) {
    const tpl = await this.getReportTemplate(tenantId, templateId);
    const config = tpl.templateConfig as Record<string, unknown> | null;
    const fiscalYear =
      (config?.fiscalYear as number) || new Date().getFullYear();

    const [emissions, kpis, targets] = await Promise.all([
      prisma.emissionSourceRecord.findMany({ where: { tenantId, fiscalYear } }),
      prisma.esgKpiActualValue.findMany({
        where: { tenantId, fiscalYear },
      }),
      prisma.sustainabilityTarget.findMany({ where: { tenantId } }),
    ]);

    const report = {
      templateId,
      templateName: tpl.templateName,
      framework: tpl.reportingFramework,
      fiscalYear,
      generatedAt: new Date().toISOString(),
      totalEmissions: emissions.reduce((s, e) => s + Number(e.co2eKg), 0),
      emissionCount: emissions.length,
      kpiCount: kpis.length,
      targetCount: targets.length,
      summary: {
        emissionsByScope: emissions.reduce<Record<string, number>>((acc, e) => {
          acc[e.scope] = (acc[e.scope] || 0) + Number(e.co2eKg);
          return acc;
        }, {}),
        kpiCompletion: kpis.filter(
          (k) =>
            k.targetValue && Number(k.actualValue) >= Number(k.targetValue),
        ).length,
        targetsOnTrack: targets.filter((t) => t.status === "ON_TRACK").length,
      },
    };

    await prisma.esgReportTemplate.update({
      where: { id: templateId },
      data: { lastGeneratedAt: new Date() },
    });

    return report;
  }

  async deleteReportTemplate(tenantId: string, id: string) {
    await this.getReportTemplate(tenantId, id);
    return prisma.esgReportTemplate.delete({ where: { id } });
  }

  // ── Disclosure Mappings ──────────────────────────────────────────────────

  async listDisclosureMappings(tenantId: string, framework?: string) {
    return prisma.esgDisclosureMapping.findMany({
      where: {
        tenantId,
        ...(framework ? { framework } : {}),
      },
      orderBy: [{ framework: "asc" }, { standardCode: "asc" }],
    });
  }

  async getDisclosureMapping(tenantId: string, id: string) {
    const mapping = await prisma.esgDisclosureMapping.findFirst({
      where: { id, tenantId },
    });
    if (!mapping) throw new NotFoundException("Disclosure mapping not found");
    return mapping;
  }

  async createDisclosureMapping(
    tenantId: string,
    dto: {
      framework: string;
      standardCode: string;
      disclosureName: string;
      mappedKpiId?: string;
      mappedField?: string;
      notes?: string;
    },
  ) {
    if (dto.mappedKpiId) {
      const kpi = await prisma.esgKpiDefinition.findFirst({
        where: { id: dto.mappedKpiId, tenantId },
      });
      if (!kpi) throw new NotFoundException("Mapped KPI not found");
    }
    return prisma.esgDisclosureMapping.create({
      data: {
        tenantId,
        framework: dto.framework,
        standardCode: dto.standardCode,
        disclosureName: dto.disclosureName,
        mappedKpiId: dto.mappedKpiId || null,
        mappedField: dto.mappedField || null,
        notes: dto.notes || null,
      },
    });
  }

  async updateDisclosureMapping(
    tenantId: string,
    id: string,
    dto: Partial<{
      framework: string;
      standardCode: string;
      disclosureName: string;
      mappedKpiId: string;
      mappedField: string;
      notes: string;
      isActive: boolean;
    }>,
  ) {
    await this.getDisclosureMapping(tenantId, id);
    const data: Record<string, unknown> = {};
    if (dto.framework !== undefined) data.framework = dto.framework;
    if (dto.standardCode !== undefined) data.standardCode = dto.standardCode;
    if (dto.disclosureName !== undefined)
      data.disclosureName = dto.disclosureName;
    if (dto.mappedKpiId !== undefined) data.mappedKpiId = dto.mappedKpiId;
    if (dto.mappedField !== undefined) data.mappedField = dto.mappedField;
    if (dto.notes !== undefined) data.notes = dto.notes;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    return prisma.esgDisclosureMapping.update({ where: { id }, data });
  }

  async deleteDisclosureMapping(tenantId: string, id: string) {
    await this.getDisclosureMapping(tenantId, id);
    return prisma.esgDisclosureMapping.delete({ where: { id } });
  }

  // ── Sustainability Targets ───────────────────────────────────────────────

  async listSustainabilityTargets(
    tenantId: string,
    targetType?: string,
    status?: string,
  ) {
    return prisma.sustainabilityTarget.findMany({
      where: {
        tenantId,
        ...(targetType ? { targetType } : {}),
        ...(status ? { status } : {}),
      },
      orderBy: { targetYear: "asc" },
    });
  }

  async getSustainabilityTarget(tenantId: string, id: string) {
    const target = await prisma.sustainabilityTarget.findFirst({
      where: { id, tenantId },
    });
    if (!target) throw new NotFoundException("Sustainability target not found");
    return target;
  }

  async createSustainabilityTarget(
    tenantId: string,
    dto: {
      targetName: string;
      targetType: string;
      baselineYear: number;
      baselineValue: number;
      targetValue: number;
      targetYear: number;
      targetUnit: string;
      approvedBy?: string;
    },
  ) {
    return prisma.sustainabilityTarget.create({
      data: {
        tenantId,
        targetName: dto.targetName,
        targetType: dto.targetType,
        baselineYear: dto.baselineYear,
        baselineValue: new Prisma.Decimal(dto.baselineValue),
        targetValue: new Prisma.Decimal(dto.targetValue),
        targetYear: dto.targetYear,
        targetUnit: dto.targetUnit,
        approvedBy: dto.approvedBy || null,
        status: "ON_TRACK",
      },
    });
  }

  async updateSustainabilityTarget(
    tenantId: string,
    id: string,
    dto: Partial<{
      targetName: string;
      targetType: string;
      baselineYear: number;
      baselineValue: number;
      targetValue: number;
      targetYear: number;
      currentValue: number;
      targetUnit: string;
      status: string;
      approvedBy: string;
    }>,
  ) {
    await this.getSustainabilityTarget(tenantId, id);
    const data: Record<string, unknown> = {};
    if (dto.targetName !== undefined) data.targetName = dto.targetName;
    if (dto.targetType !== undefined) data.targetType = dto.targetType;
    if (dto.baselineYear !== undefined) data.baselineYear = dto.baselineYear;
    if (dto.baselineValue !== undefined)
      data.baselineValue = new Prisma.Decimal(dto.baselineValue);
    if (dto.targetValue !== undefined)
      data.targetValue = new Prisma.Decimal(dto.targetValue);
    if (dto.targetYear !== undefined) data.targetYear = dto.targetYear;
    if (dto.targetUnit !== undefined) data.targetUnit = dto.targetUnit;
    if (dto.approvedBy !== undefined) data.approvedBy = dto.approvedBy;
    if (dto.status !== undefined) {
      data.status = dto.status;
      if (dto.status === "ACHIEVED") data.achievedAt = new Date();
    }
    if (dto.currentValue !== undefined) {
      data.currentValue = new Prisma.Decimal(dto.currentValue);
      data.progressPercent = this.computeProgress(
        dto.currentValue,
        Number(dto.targetValue ?? 0),
        Number(dto.baselineValue ?? 0),
      );
    }
    return prisma.sustainabilityTarget.update({ where: { id }, data });
  }

  private computeProgress(
    current: number,
    target: number,
    baseline: number,
  ): Prisma.Decimal {
    const range = target - baseline;
    if (range === 0) return new Prisma.Decimal(target > 0 ? 100 : 0);
    const progress = ((current - baseline) / range) * 100;
    return new Prisma.Decimal(
      Math.min(100, Math.max(0, Number(progress.toFixed(2)))),
    );
  }

  async updateSustainabilityTargetProgress(
    tenantId: string,
    id: string,
    currentValue: number,
  ) {
    const target = await this.getSustainabilityTarget(tenantId, id);
    const current = new Prisma.Decimal(currentValue);
    const progress = this.computeProgress(
      currentValue,
      Number(target.targetValue),
      Number(target.baselineValue),
    );
    const status = progress.gte(100)
      ? "ACHIEVED"
      : current.gte(target.targetValue)
        ? "ACHIEVED"
        : "ON_TRACK";

    const updated = await prisma.sustainabilityTarget.update({
      where: { id },
      data: { currentValue: current, progressPercent: progress, status },
    });

    if (status === "ACHIEVED") {
      await prisma.sustainabilityTarget.update({
        where: { id },
        data: { achievedAt: new Date() },
      });
    }

    return updated;
  }

  async getSustainabilityTargetStatus(tenantId: string, id: string) {
    const target = await this.getSustainabilityTarget(tenantId, id);
    const remaining =
      Number(target.targetValue) -
      Number(target.currentValue ?? target.baselineValue);
    const yearsRemaining = target.targetYear - new Date().getFullYear();
    return {
      id: target.id,
      targetName: target.targetName,
      targetType: target.targetType,
      baselineValue: Number(target.baselineValue),
      currentValue: target.currentValue ? Number(target.currentValue) : null,
      targetValue: Number(target.targetValue),
      progressPercent: target.progressPercent
        ? Number(target.progressPercent)
        : null,
      remaining,
      yearsRemaining: Math.max(0, yearsRemaining),
      status: target.status,
      achievedAt: target.achievedAt,
    };
  }

  async deleteSustainabilityTarget(tenantId: string, id: string) {
    await this.getSustainabilityTarget(tenantId, id);
    return prisma.sustainabilityTarget.delete({ where: { id } });
  }

  // ── Dashboard ────────────────────────────────────────────────────────────

  async getEsgSummaryDashboard(tenantId: string, fiscalYear?: number) {
    const fy = fiscalYear || new Date().getFullYear();

    const [emissions, kpis, targets, offsets] = await Promise.all([
      prisma.emissionSourceRecord.findMany({
        where: { tenantId, fiscalYear: fy },
      }),
      prisma.esgKpiActualValue.findMany({
        where: { tenantId, fiscalYear: fy },
      }),
      prisma.sustainabilityTarget.findMany({ where: { tenantId } }),
      prisma.emissionOffsetCredit.findMany({
        where: { tenantId, status: "AVAILABLE" },
      }),
    ]);

    const byScope = emissions.reduce<Record<string, number>>((acc, e) => {
      acc[e.scope] = (acc[e.scope] || 0) + Number(e.co2eKg);
      return acc;
    }, {});

    return {
      fiscalYear: fy,
      totalEmissionsCo2eKg: emissions.reduce((s, e) => s + Number(e.co2eKg), 0),
      emissionsByScope: Object.entries(byScope).map(([scope, total]) => ({
        scope,
        total,
      })),
      emissionSourceCount: emissions.length,
      kpisTracked: kpis.length,
      kpiMetTarget: kpis.filter(
        (k) => k.targetValue && Number(k.actualValue) >= Number(k.targetValue),
      ).length,
      targetsTotal: targets.length,
      targetsOnTrack: targets.filter((t) => t.status === "ON_TRACK").length,
      targetsAchieved: targets.filter((t) => t.status === "ACHIEVED").length,
      availableOffsetCredits: offsets.reduce(
        (s, o) => s + Number(o.quantityTonnes),
        0,
      ),
      offsetCreditCount: offsets.length,
    };
  }
}
