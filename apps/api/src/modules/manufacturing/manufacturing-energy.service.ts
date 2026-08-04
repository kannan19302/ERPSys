import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";

@Injectable()
export class ManufacturingEnergyService {
  async registerMeter(
    tenantId: string,
    data: {
      code: string;
      name: string;
      meterType?: string;
      location?: string;
      workstationId?: string;
      unit?: string;
    },
  ) {
    return prisma.energyMeter.create({
      data: {
        tenantId,
        code: data.code,
        name: data.name,
        meterType: data.meterType || "ELECTRICITY",
        location: data.location,
        workstationId: data.workstationId,
        unit: data.unit || "kWh",
      },
    });
  }

  async getMeters(tenantId: string) {
    return prisma.energyMeter.findMany({ where: { tenantId, isActive: true } });
  }

  async logEnergyReading(
    tenantId: string,
    data: {
      meterId: string;
      reading: number;
      unit?: string;
      cost?: number | null;
      recordedBy?: string | null;
      notes?: string | null;
    },
  ) {
    const meter = await prisma.energyMeter.findFirst({
      where: { id: data.meterId, tenantId },
    });
    if (!meter) throw new NotFoundException("Energy meter not found");
    return prisma.energyReading.create({
      data: {
        tenantId,
        meterId: data.meterId,
        reading: data.reading,
        unit: data.unit || meter.unit,
        cost: data.cost ?? undefined,
        recordedBy: data.recordedBy ?? undefined,
        notes: data.notes ?? undefined,
      } as any,
    });
  }

  async getEnergyConsumption(
    tenantId: string,
    meterId?: string,
    fromDate?: string,
    toDate?: string,
  ) {
    const where: any = { tenantId };
    if (meterId) where.meterId = meterId;
    if (fromDate || toDate) {
      where.recordedAt = {};
      if (fromDate) where.recordedAt.gte = new Date(fromDate);
      if (toDate) where.recordedAt.lte = new Date(toDate);
    }
    const readings = await prisma.energyReading.findMany({
      where,
      include: { meter: true },
      orderBy: { recordedAt: "desc" },
    });
    const totalConsumption = readings.reduce(
      (sum, r) => sum + Number(r.reading),
      0,
    );
    const totalCost = readings.reduce((sum, r) => sum + Number(r.cost || 0), 0);
    return {
      totalReadings: readings.length,
      totalConsumption: Math.round(totalConsumption * 100) / 100,
      totalCost: Math.round(totalCost * 100) / 100,
      readings: readings.map((r) => ({
        id: r.id,
        meterName: r.meter.name,
        meterCode: r.meter.code,
        reading: r.reading,
        unit: r.unit,
        cost: r.cost,
        recordedAt: r.recordedAt,
      })),
    };
  }

  async calculateEnergyKPI(tenantId: string, period: string = "MONTHLY") {
    const targets = await prisma.energyKpiTarget.findMany({
      where: { tenantId, period },
    });
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const readings = await prisma.energyReading.findMany({
      where: { tenantId, recordedAt: { gte: startDate } },
      include: { meter: true },
    });
    const totalKwh = readings.reduce((sum, r) => sum + Number(r.reading), 0);
    const totalCost = readings.reduce((sum, r) => sum + Number(r.cost || 0), 0);
    const workOrders = await prisma.workOrder.count({
      where: { tenantId, status: "COMPLETED", createdAt: { gte: startDate } },
    });
    const kwhPerUnit = workOrders > 0 ? totalKwh / workOrders : 0;
    return {
      period,
      totalConsumptionKwh: Math.round(totalKwh * 100) / 100,
      totalCost: Math.round(totalCost * 100) / 100,
      unitsProduced: workOrders,
      kwhPerUnit: Math.round(kwhPerUnit * 1000) / 1000,
      targetCount: targets.length,
      targets,
    };
  }

  async allocateEnergyCost(
    tenantId: string,
    data: {
      meterId: string;
      workOrderId?: string;
      costCenterId?: string;
      amount: number;
      allocationPct: number;
      periodStart: string;
      periodEnd: string;
    },
  ) {
    const meter = await prisma.energyMeter.findFirst({
      where: { id: data.meterId, tenantId },
    });
    if (!meter) throw new NotFoundException("Energy meter not found");
    return prisma.energyCostAllocation.create({
      data: {
        tenantId,
        meterId: data.meterId,
        workOrderId: data.workOrderId,
        costCenterId: data.costCenterId,
        amount: data.amount,
        allocationPct: data.allocationPct,
        periodStart: new Date(data.periodStart),
        periodEnd: new Date(data.periodEnd),
      },
    });
  }

  async getEnergyDashboard(tenantId: string) {
    const [meters, recentReadings, targets] = await Promise.all([
      prisma.energyMeter.findMany({ where: { tenantId, isActive: true } }),
      prisma.energyReading.findMany({
        where: { tenantId },
        orderBy: { recordedAt: "desc" },
        take: 20,
        include: { meter: true },
      }),
      prisma.energyKpiTarget.findMany({ where: { tenantId } }),
    ]);
    const totalReading = recentReadings.reduce(
      (sum, r) => sum + Number(r.reading),
      0,
    );
    return {
      meterCount: meters.length,
      totalRecentConsumption: Math.round(totalReading * 100) / 100,
      targetCount: targets.length,
      recentReadings,
      targets,
    };
  }

  async createKpiTarget(
    tenantId: string,
    data: {
      meterId?: string;
      kpiType: string;
      targetValue: number;
      unit?: string;
      period?: string;
      startDate: string;
      endDate?: string;
    },
  ) {
    return prisma.energyKpiTarget.create({
      data: {
        tenantId,
        meterId: data.meterId,
        kpiType: data.kpiType,
        targetValue: data.targetValue,
        unit: data.unit || "kWh",
        period: data.period || "MONTHLY",
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
      },
    });
  }
}
