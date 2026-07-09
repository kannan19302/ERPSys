import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';

@Injectable()
export class FixedAssetDeepService {
  private async getAsset(tenantId: string, assetId: string) {
    const a = await prisma.fixedAsset.findFirst({ where: { id: assetId, tenantId } });
    if (!a) throw new NotFoundException('Fixed asset not found');
    return a;
  }

  private async resolveOrgId(tenantId: string): Promise<string> {
    const org = await prisma.organization.findFirst({ where: { tenantId } });
    return org?.id ?? 'org-system-default';
  }

  // ── DEPRECIATION SCHEDULE PREVIEW ──────────────────────────────────

  async getDepreciationSchedulePreview(tenantId: string, assetId: string) {
    const asset = await this.getAsset(tenantId, assetId);
    const costBasis = Number(asset.purchaseCost ?? 0);
    const salvage = Number(asset.salvageValue ?? 0);
    const usefulLifeMonths = (asset.usefulLifeYears ?? 5) * 12;
    const monthlyDepreciation = (costBasis - salvage) / usefulLifeMonths;
    const schedule: { month: number; period: string; depreciation: number; accumulatedDepreciation: number; bookValue: number }[] = [];

    let accumulated = 0;
    const startDate = asset.purchaseDate ?? new Date();
    for (let m = 1; m <= usefulLifeMonths; m++) {
      const d = new Date(startDate.getFullYear(), startDate.getMonth() + m - 1, 1);
      accumulated += monthlyDepreciation;
      schedule.push({
        month: m,
        period: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        depreciation: Math.round(monthlyDepreciation * 100) / 100,
        accumulatedDepreciation: Math.round(accumulated * 100) / 100,
        bookValue: Math.round((costBasis - accumulated) * 100) / 100,
      });
    }
    return { assetId, costBasis, salvageValue: salvage, usefulLifeMonths, monthlyDepreciation, schedule };
  }

  // ── ASSET INSURANCE ──────────────────────────────────

  async listInsurances(tenantId: string, assetId?: string) {
    return prisma.assetInsurance.findMany({
      where: { tenantId, ...(assetId && { assetId }) },
      orderBy: { renewalDate: 'asc' },
    });
  }

  async createInsurance(tenantId: string, dto: {
    assetId: string; policyNumber: string; insurer: string; coverageType: string;
    coverageAmount: number; premium: number; startDate: string; renewalDate: string;
    documentUrl?: string; notes?: string;
  }) {
    await this.getAsset(tenantId, dto.assetId);
    return prisma.assetInsurance.create({
      data: {
        tenantId,
        assetId: dto.assetId,
        policyNumber: dto.policyNumber,
        insurer: dto.insurer,
        coverageType: dto.coverageType,
        coverageAmount: dto.coverageAmount,
        premium: dto.premium,
        startDate: new Date(dto.startDate),
        renewalDate: new Date(dto.renewalDate),
        documentUrl: dto.documentUrl,
        notes: dto.notes,
        status: 'ACTIVE',
      },
    });
  }

  async updateInsurance(tenantId: string, id: string, dto: Partial<{
    status: string; renewalDate: string; premium: number; notes: string;
  }>) {
    const ins = await prisma.assetInsurance.findFirst({ where: { id, tenantId } });
    if (!ins) throw new NotFoundException('Insurance policy not found');
    return prisma.assetInsurance.update({
      where: { id },
      data: { ...dto, ...(dto.renewalDate ? { renewalDate: new Date(dto.renewalDate) } : {}) },
    });
  }

  async getExpiringInsurances(tenantId: string, daysAhead: number = 30) {
    const end = new Date(Date.now() + daysAhead * 86400000);
    return prisma.assetInsurance.findMany({
      where: { tenantId, renewalDate: { lte: end }, status: 'ACTIVE' },
      orderBy: { renewalDate: 'asc' },
    });
  }

  // ── ASSET IMPAIRMENT ──────────────────────────────────

  async listImpairments(tenantId: string) {
    return prisma.assetImpairment.findMany({ where: { tenantId }, orderBy: { testDate: 'desc' } });
  }

  async createImpairment(tenantId: string, dto: {
    assetId: string; testDate: string; carryingAmount: number;
    recoverableAmount: number; reason?: string;
  }) {
    await this.getAsset(tenantId, dto.assetId);
    const impairmentLoss = Math.max(0, dto.carryingAmount - dto.recoverableAmount);
    return prisma.assetImpairment.create({
      data: {
        tenantId,
        assetId: dto.assetId,
        testDate: new Date(dto.testDate),
        carryingAmount: dto.carryingAmount,
        recoverableAmount: dto.recoverableAmount,
        impairmentLoss,
        reason: dto.reason,
        status: 'DRAFT',
      },
    });
  }

  async postImpairment(tenantId: string, id: string) {
    const imp = await prisma.assetImpairment.findFirst({ where: { id, tenantId } });
    if (!imp) throw new NotFoundException('Impairment not found');
    if (imp.status !== 'DRAFT') throw new BadRequestException('Only DRAFT impairments can be posted');
    return prisma.assetImpairment.update({ where: { id }, data: { status: 'POSTED', postedAt: new Date() } });
  }

  // ── CAPITAL PROJECTS ──────────────────────────────────

  async listCapitalProjects(tenantId: string, status?: string) {
    return prisma.capitalProject.findMany({
      where: { tenantId, ...(status && { status }) },
      include: { costs: true },
      orderBy: { startDate: 'desc' },
    });
  }

  async getCapitalProject(tenantId: string, id: string) {
    const p = await prisma.capitalProject.findFirst({ where: { id, tenantId }, include: { costs: true } });
    if (!p) throw new NotFoundException('Capital project not found');
    return p;
  }

  async createCapitalProject(tenantId: string, dto: {
    code: string; name: string; description?: string; budgetAmount: number;
    startDate: string; expectedCompletion?: string; costGlAccountId?: string;
  }) {
    const orgId = await this.resolveOrgId(tenantId);
    return prisma.capitalProject.create({
      data: {
        tenantId, orgId,
        code: dto.code, name: dto.name, description: dto.description,
        budgetAmount: dto.budgetAmount,
        startDate: new Date(dto.startDate),
        expectedCompletion: dto.expectedCompletion ? new Date(dto.expectedCompletion) : null,
        costGlAccountId: dto.costGlAccountId,
        status: 'PLANNED',
      },
    });
  }

  async addProjectCost(tenantId: string, projectId: string, dto: {
    costDate: string; description?: string; costType: string; amount: number;
    vendorId?: string; invoiceId?: string; glAccountId?: string;
  }) {
    await this.getCapitalProject(tenantId, projectId);
    const cost = await prisma.capitalProjectCost.create({
      data: { tenantId, capitalProjectId: projectId, ...dto, costDate: new Date(dto.costDate) },
    });
    // Update actualSpend
    const agg = await prisma.capitalProjectCost.aggregate({ where: { capitalProjectId: projectId }, _sum: { amount: true } });
    await prisma.capitalProject.update({ where: { id: projectId }, data: { actualSpend: Number(agg._sum.amount ?? 0) } });
    return cost;
  }

  async updateCapitalProject(tenantId: string, id: string, dto: Partial<{
    status: string; completedDate: string; notes: string;
  }>) {
    await this.getCapitalProject(tenantId, id);
    return prisma.capitalProject.update({
      where: { id },
      data: { ...dto, ...(dto.completedDate ? { completedDate: new Date(dto.completedDate) } : {}) },
    });
  }

  async convertProjectToAsset(tenantId: string, projectId: string, dto: {
    assetName: string; categoryId: string; assetDate: string;
  }) {
    const project = await this.getCapitalProject(tenantId, projectId);
    if (project.status !== 'COMPLETED') throw new BadRequestException('Project must be COMPLETED to convert to asset');
    // Record asset reference in project
    const assetRef = { name: dto.assetName, categoryId: dto.categoryId, date: dto.assetDate, amount: Number(project.actualSpend) };
    return prisma.capitalProject.update({
      where: { id: projectId },
      data: { convertedAssets: [assetRef] as never },
    });
  }

  // ── NET BOOK VALUE ROLL-FORWARD ──────────────────────────────────

  async getNbvRollForward(tenantId: string, period: string) {
    const [year, month] = period.split('-').map(Number);
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);

    const assets = await prisma.fixedAsset.findMany({ where: { tenantId } });
    const depAgg = await prisma.assetDepreciation.aggregate({
      where: { tenantId, depreciationDate: { gte: start, lte: end } },
      _sum: { depreciationAmount: true },
    });

    const totalCost = assets.reduce((s, a) => s + Number(a.purchaseCost ?? 0), 0);
    const totalDepreciation = Number(depAgg._sum.depreciationAmount ?? 0);
    const netBookValue = totalCost - totalDepreciation;

    return {
      period,
      openingCost: totalCost,
      additions: 0,
      disposals: 0,
      periodDepreciation: totalDepreciation,
      closingNetBookValue: netBookValue,
      assetCount: assets.length,
    };
  }

  // ── ASSET TAG MANAGEMENT ──────────────────────────────────

  async bulkUploadAssets(tenantId: string, rows: {
    name: string; categoryId: string; purchaseDate: string; purchaseCost: number;
    salvageValue?: number; usefulLifeYears?: number; locationId?: string;
  }[]) {
    const orgId = await this.resolveOrgId(tenantId);
    const created = [];
    for (const row of rows) {
      const asset = await prisma.fixedAsset.create({
        data: {
          tenantId, orgId: orgId,
          name: row.name,
          categoryId: row.categoryId,
          purchaseDate: new Date(row.purchaseDate),
          purchaseCost: row.purchaseCost,
          salvageValue: row.salvageValue ?? 0,
          usefulLifeYears: row.usefulLifeYears ?? 5,
          status: 'ACTIVE',
        },
      });
      created.push(asset);
    }
    return { created: created.length, assets: created };
  }
}
