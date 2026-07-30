import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class ManufacturingMpsService {
  async createMps(
    tenantId: string,
    dto: {
      name: string;
      planningHorizon: number;
      planningUnit?: string;
      frozenPeriod?: number;
      demandSource?: string;
      safetyStockDays?: number;
      entries?: Array<{
        productId: string;
        period: string;
        forecastDemand: number;
        actualDemand?: number;
        openOrders?: number;
      }>;
    },
  ) {
    const existing = await prisma.masterProductionSchedule.findFirst({
      where: { tenantId, name: dto.name },
    });
    if (existing)
      throw new BadRequestException(`MPS "${dto.name}" already exists`);

    return prisma.masterProductionSchedule.create({
      data: {
        tenantId,
        name: dto.name,
        planningHorizon: dto.planningHorizon,
        planningUnit: dto.planningUnit || "WEEKS",
        frozenPeriod: dto.frozenPeriod,
        demandSource: dto.demandSource || "SALES_ORDERS",
        safetyStockDays: dto.safetyStockDays,
        entries: dto.entries
          ? {
              createMany: {
                data: dto.entries.map((e) => ({
                  tenantId,
                  productId: e.productId,
                  period: e.period,
                  forecastDemand: e.forecastDemand,
                  actualDemand: e.actualDemand,
                  openOrders: e.openOrders,
                })),
              },
            }
          : undefined,
      },
      include: { entries: true },
    });
  }

  async getMpsList(tenantId: string) {
    return prisma.masterProductionSchedule.findMany({
      where: { tenantId },
      include: { entries: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async getMpsById(tenantId: string, id: string) {
    const mps = await prisma.masterProductionSchedule.findFirst({
      where: { id, tenantId },
      include: { entries: true },
    });
    if (!mps) throw new NotFoundException("MPS not found");
    return mps;
  }

  async approveMps(tenantId: string, id: string, approvedBy: string) {
    const mps = await prisma.masterProductionSchedule.findFirst({
      where: { id, tenantId },
    });
    if (!mps) throw new NotFoundException("MPS not found");
    if (mps.status !== "DRAFT")
      throw new BadRequestException("Only DRAFT MPS can be approved");

    return prisma.masterProductionSchedule.update({
      where: { id },
      data: { status: "APPROVED", approvedBy, approvedAt: new Date() },
    });
  }

  async updateMpsEntry(
    tenantId: string,
    entryId: string,
    dto: {
      forecastDemand?: number;
      actualDemand?: number;
      openOrders?: number;
      plannedProd?: number;
    },
  ) {
    const entry = await prisma.mpsEntry.findFirst({
      where: { id: entryId, tenantId },
    });
    if (!entry) throw new NotFoundException("MPS entry not found");

    const projectedInventory =
      dto.actualDemand != null
        ? (entry.projectedInventory ?? 0) +
          (dto.plannedProd ?? 0) -
          dto.actualDemand
        : undefined;

    return prisma.mpsEntry.update({
      where: { id: entryId },
      data: {
        forecastDemand: dto.forecastDemand,
        actualDemand: dto.actualDemand,
        openOrders: dto.openOrders,
        plannedProd: dto.plannedProd,
        projectedInventory,
        availableToPromise:
          projectedInventory != null
            ? Math.max(0, projectedInventory)
            : undefined,
      },
    });
  }

  async getMpsDashboard(tenantId: string) {
    const schedules = await prisma.masterProductionSchedule.findMany({
      where: { tenantId },
      include: { entries: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    const totalSchedules = schedules.length;
    const approvedSchedules = schedules.filter(
      (s) => s.status === "APPROVED",
    ).length;
    const totalEntries = schedules.reduce(
      (sum, s) => sum + s.entries.length,
      0,
    );
    const totalForecast = schedules.reduce(
      (sum, s) => sum + s.entries.reduce((es, e) => es + e.forecastDemand, 0),
      0,
    );

    return {
      totalSchedules,
      approvedSchedules,
      draftSchedules: totalSchedules - approvedSchedules,
      totalEntries,
      totalForecast,
      schedules,
    };
  }

  async calculateAvaialableToPromise(tenantId: string, mpsId: string) {
    const mps = await prisma.masterProductionSchedule.findFirst({
      where: { id: mpsId, tenantId },
      include: { entries: { orderBy: { period: "asc" } } },
    });
    if (!mps) throw new NotFoundException("MPS not found");

    let cumulativeInventory = 0;
    const updatedEntries = [];

    for (const entry of mps.entries) {
      const projected =
        cumulativeInventory +
        (entry.plannedProd ?? 0) -
        (entry.actualDemand ?? entry.forecastDemand);
      const atp = Math.max(0, projected);

      await prisma.mpsEntry.update({
        where: { id: entry.id },
        data: {
          projectedInventory: projected,
          availableToPromise: atp,
        },
      });

      cumulativeInventory = projected;
      updatedEntries.push({
        entryId: entry.id,
        projectedInventory: projected,
        availableToPromise: atp,
      });
    }

    return { mpsId, entries: updatedEntries };
  }
}
