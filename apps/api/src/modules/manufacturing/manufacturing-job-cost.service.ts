import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";
import { Prisma } from "@prisma/client";

@Injectable()
export class ManufacturingJobCostService {
  async createJobCostSheet(
    tenantId: string,
    dto: {
      workOrderId: string;
      productId?: string;
      plannedMaterialCost?: number;
      plannedLaborCost?: number;
      plannedOverheadCost?: number;
      currency?: string;
    },
  ) {
    const wo = await prisma.workOrder.findFirst({
      where: { id: dto.workOrderId, tenantId },
    });
    if (!wo) throw new NotFoundException("Work order not found");

    const existing = await prisma.jobCostSheet.findFirst({
      where: { tenantId, workOrderId: dto.workOrderId },
    });
    if (existing)
      throw new BadRequestException(
        "Job cost sheet already exists for this work order",
      );

    const totalPlanned =
      (dto.plannedMaterialCost || 0) +
      (dto.plannedLaborCost || 0) +
      (dto.plannedOverheadCost || 0);

    return prisma.jobCostSheet.create({
      data: {
        tenantId,
        workOrderId: dto.workOrderId,
        productId: dto.productId,
        plannedMaterialCost: dto.plannedMaterialCost,
        plannedLaborCost: dto.plannedLaborCost,
        plannedOverheadCost: dto.plannedOverheadCost,
        totalPlannedCost: totalPlanned,
        currency: dto.currency || "USD",
      },
      include: { costEntries: true },
    });
  }

  async getJobCostSheets(tenantId: string) {
    return prisma.jobCostSheet.findMany({
      where: { tenantId },
      include: { costEntries: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async getJobCostSheetById(tenantId: string, id: string) {
    const sheet = await prisma.jobCostSheet.findFirst({
      where: { id, tenantId },
      include: { costEntries: { orderBy: { postedAt: "asc" } } },
    });
    if (!sheet) throw new NotFoundException("Job cost sheet not found");
    return sheet;
  }

  async addCostEntry(
    tenantId: string,
    costSheetId: string,
    dto: {
      costType: string;
      description?: string;
      quantity?: number;
      unitCost?: number;
      amount: number;
      currency?: string;
      resourceId?: string;
      resourceType?: string;
    },
  ) {
    const sheet = await prisma.jobCostSheet.findFirst({
      where: { id: costSheetId, tenantId },
    });
    if (!sheet) throw new NotFoundException("Job cost sheet not found");

    const entry = await prisma.mfgCostEntry.create({
      data: {
        tenantId,
        costSheetId,
        costType: dto.costType,
        description: dto.description,
        quantity: dto.quantity,
        unitCost: dto.unitCost,
        amount: dto.amount,
        currency: dto.currency || "USD",
        resourceId: dto.resourceId,
        resourceType: dto.resourceType,
      },
    });

    await this.recalculateCostSheet(tenantId, costSheetId);
    return entry;
  }

  private async recalculateCostSheet(tenantId: string, costSheetId: string) {
    const entries = await prisma.mfgCostEntry.findMany({
      where: { costSheetId, tenantId },
    });

    // Every total below used to be summed with `sum + Number(e.amount)`.
    // `amount` is Decimal(19,4) and the columns written further down are
    // Decimal(19,4) too, but the arithmetic in between ran in binary floating
    // point — so the money was exact in storage and drifted the moment it was
    // recalculated. Cost sheets recalculate on every entry added and again on
    // close, so the error compounds over the life of a job. Summing as Decimal
    // keeps the whole path exact.
    const sumByType = (costType: string) =>
      entries
        .filter((e) => e.costType === costType)
        .reduce((sum, e) => sum.add(e.amount ?? 0), new Prisma.Decimal(0));

    const actualMaterialCost = sumByType("MATERIAL");
    const actualLaborCost = sumByType("LABOR");
    const actualOverheadCost = sumByType("OVERHEAD");
    const scrapCost = sumByType("SCRAP");
    const reworkCost = sumByType("REWORK");
    const totalActualCost = actualMaterialCost
      .add(actualLaborCost)
      .add(actualOverheadCost)
      .add(scrapCost)
      .add(reworkCost);

    const sheet = await prisma.jobCostSheet.findFirst({
      where: { id: costSheetId, tenantId },
    });
    const totalPlanned = new Prisma.Decimal(sheet?.totalPlannedCost ?? 0);
    // variancePct is a percentage, not money: its column is Float and stays
    // one. It is derived from Decimal inputs and converted only at the end.
    const variancePct = totalPlanned.greaterThan(0)
      ? totalActualCost
          .minus(totalPlanned)
          .dividedBy(totalPlanned)
          .times(100)
          .toNumber()
      : 0;

    await prisma.jobCostSheet.update({
      where: { id: costSheetId },
      data: {
        actualMaterialCost,
        actualLaborCost,
        actualOverheadCost,
        scrapCost,
        reworkCost,
        totalActualCost,
        variancePct,
      },
    });
  }

  async closeCostSheet(tenantId: string, id: string) {
    const sheet = await prisma.jobCostSheet.findFirst({
      where: { id, tenantId },
    });
    if (!sheet) throw new NotFoundException("Job cost sheet not found");

    await this.recalculateCostSheet(tenantId, id);

    return prisma.jobCostSheet.update({
      where: { id },
      data: { closedAt: new Date() },
      include: { costEntries: true },
    });
  }

  async createStandardCost(
    tenantId: string,
    dto: {
      productId: string;
      effectiveFrom: string;
      effectiveTo?: string;
      materialCost: number;
      laborCost: number;
      overheadCost: number;
      currency?: string;
    },
  ) {
    const totalCost = dto.materialCost + dto.laborCost + dto.overheadCost;

    await prisma.standardCost.updateMany({
      where: { tenantId, productId: dto.productId, isActive: true },
      data: { isActive: false },
    });

    return prisma.standardCost.create({
      data: {
        tenantId,
        productId: dto.productId,
        effectiveFrom: new Date(dto.effectiveFrom),
        effectiveTo: dto.effectiveTo ? new Date(dto.effectiveTo) : null,
        materialCost: dto.materialCost,
        laborCost: dto.laborCost,
        overheadCost: dto.overheadCost,
        totalCost,
        currency: dto.currency || "USD",
      },
    });
  }

  async getStandardCosts(tenantId: string, productId?: string) {
    const where: any = { tenantId };
    if (productId) where.productId = productId;
    return prisma.standardCost.findMany({
      where,
      orderBy: { effectiveFrom: "desc" },
    });
  }

  async getJobCostDashboard(tenantId: string) {
    const sheets = await prisma.jobCostSheet.findMany({
      where: { tenantId },
      include: { costEntries: true },
    });

    // Both columns are Decimal(19,4); rolling them up through Number() drifted
    // the analytics totals away from the sheets they summarise.
    const totalPlanned = sheets.reduce(
      (sum, s) => sum.add(s.totalPlannedCost ?? 0),
      new Prisma.Decimal(0),
    );
    const totalActual = sheets.reduce(
      (sum, s) => sum.add(s.totalActualCost ?? 0),
      new Prisma.Decimal(0),
    );
    const openSheets = sheets.filter((s) => !s.closedAt).length;
    const closedSheets = sheets.filter((s) => s.closedAt).length;
    // A percentage, not money — derived from the Decimal totals and converted
    // only at the end. (`totalPlanned > 0` on a Decimal compared against a
    // number is not a valid comparison; use the Decimal predicate.)
    const totalVariance = totalPlanned.greaterThan(0)
      ? totalActual
          .minus(totalPlanned)
          .dividedBy(totalPlanned)
          .times(100)
          .toNumber()
      : 0;

    return {
      totalSheets: sheets.length,
      openSheets,
      closedSheets,
      totalPlannedCost: totalPlanned,
      totalActualCost: totalActual,
      totalVariancePct: totalVariance,
      recentSheets: sheets.slice(0, 10),
    };
  }
}
