import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { prisma } from "@unerp/database";

interface PaginationQuery {
  page?: number;
  limit?: number;
  status?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

interface DateRangeQuery {
  startDate?: string;
  endDate?: string;
}

@Injectable()
export class ColdChainService {
  private get db() {
    return prisma as any;
  }

  // ─── Shipment CRUD ──────────────────────────────────────────────────

  async listShipments(
    tenantId: string,
    query: PaginationQuery &
      DateRangeQuery & {
        productId?: string;
        origin?: string;
        destination?: string;
        severity?: string;
      },
  ) {
    const {
      page = 1,
      limit = 20,
      status,
      productId,
      origin,
      destination,
      startDate,
      endDate,
      sortBy,
      sortOrder,
    } = query;
    const where: any = { tenantId };
    if (status) where.status = status;
    if (productId) where.productId = productId;
    if (origin) where.origin = { contains: origin, mode: "insensitive" };
    if (destination)
      where.destination = { contains: destination, mode: "insensitive" };
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }
    const orderBy: any = {};
    orderBy[sortBy ?? "createdAt"] = sortOrder ?? "desc";
    const [data, total] = await Promise.all([
      this.db.coldChainShipment.findMany({
        where,
        include: {
          temperatureLogs: { take: 10, orderBy: { recordedAt: "desc" } },
          ccExcursions: true,
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.db.coldChainShipment.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async getShipment(tenantId: string, id: string) {
    const shipment = await this.db.coldChainShipment.findFirst({
      where: { id, tenantId },
      include: {
        temperatureLogs: { orderBy: { recordedAt: "desc" } },
        ccExcursions: { orderBy: { detectedAt: "desc" } },
      },
    });
    if (!shipment)
      throw new NotFoundException(`Cold chain shipment #${id} not found`);
    return shipment;
  }

  async createShipment(tenantId: string, data: any, userId: string) {
    return this.db.coldChainShipment.create({
      data: { ...data, tenantId, createdBy: userId },
    });
  }

  async updateShipment(tenantId: string, id: string, data: any) {
    const existing = await this.db.coldChainShipment.findFirst({
      where: { id, tenantId },
    });
    if (!existing)
      throw new NotFoundException(`Cold chain shipment #${id} not found`);
    return this.db.coldChainShipment.update({ where: { id }, data });
  }

  async deleteShipment(tenantId: string, id: string) {
    const existing = await this.db.coldChainShipment.findFirst({
      where: { id, tenantId },
    });
    if (!existing)
      throw new NotFoundException(`Cold chain shipment #${id} not found`);
    await this.db.coldChainTemperatureLog.deleteMany({
      where: { shipmentId: id },
    });
    await this.db.coldChainExcursion.deleteMany({ where: { shipmentId: id } });
    return this.db.coldChainShipment.delete({ where: { id } });
  }

  async departShipment(tenantId: string, id: string) {
    const existing = await this.db.coldChainShipment.findFirst({
      where: { id, tenantId },
    });
    if (!existing)
      throw new NotFoundException(`Cold chain shipment #${id} not found`);
    if (existing.status !== "PLANNED")
      throw new BadRequestException("Only PLANNED shipments can depart");
    return this.db.coldChainShipment.update({
      where: { id },
      data: { status: "IN_TRANSIT", departedAt: new Date() },
    });
  }

  async arriveShipment(tenantId: string, id: string) {
    const existing = await this.db.coldChainShipment.findFirst({
      where: { id, tenantId },
    });
    if (!existing)
      throw new NotFoundException(`Cold chain shipment #${id} not found`);
    if (existing.status !== "IN_TRANSIT")
      throw new BadRequestException("Only IN_TRANSIT shipments can arrive");
    return this.db.coldChainShipment.update({
      where: { id },
      data: { status: "ARRIVED", arrivedAt: new Date() },
    });
  }

  // ─── Temperature logs ───────────────────────────────────────────────

  async logTemperature(
    tenantId: string,
    shipmentId: string,
    data: {
      temperature: number;
      humidity?: number;
      location?: string;
      deviceId?: string;
      recordedAt?: string;
    },
  ) {
    const shipment = await this.db.coldChainShipment.findFirst({
      where: { id: shipmentId, tenantId },
    });
    if (!shipment)
      throw new NotFoundException(
        `Cold chain shipment #${shipmentId} not found`,
      );

    const log = await this.db.coldChainTemperatureLog.create({
      data: {
        ...data,
        shipmentId,
        tenantId,
        recordedAt: data.recordedAt ? new Date(data.recordedAt) : new Date(),
      },
    });

    if (
      shipment.requiredTempMax != null &&
      data.temperature > shipment.requiredTempMax
    ) {
      await this.db.coldChainExcursion.create({
        data: {
          tenantId,
          shipmentId,
          excursionType: "HIGH_TEMP",
          detectedAt: new Date(),
          maxDeviation: data.temperature - shipment.requiredTempMax,
          severity:
            data.temperature > shipment.requiredTempMax * 1.2
              ? "CRITICAL"
              : "HIGH",
          location: data.location,
        },
      });
      await this.db.coldChainShipment.update({
        where: { id: shipmentId },
        data: { totalExcursions: { increment: 1 } },
      });
    }
    if (
      shipment.requiredTempMin != null &&
      data.temperature < shipment.requiredTempMin
    ) {
      await this.db.coldChainExcursion.create({
        data: {
          tenantId,
          shipmentId,
          excursionType: "LOW_TEMP",
          detectedAt: new Date(),
          maxDeviation: shipment.requiredTempMin - data.temperature,
          severity:
            data.temperature < shipment.requiredTempMin * 0.8
              ? "CRITICAL"
              : "HIGH",
          location: data.location,
        },
      });
      await this.db.coldChainShipment.update({
        where: { id: shipmentId },
        data: { totalExcursions: { increment: 1 } },
      });
    }
    return log;
  }

  async batchLogTemperature(
    tenantId: string,
    shipmentId: string,
    logs: Array<{
      temperature: number;
      humidity?: number;
      location?: string;
      deviceId?: string;
      recordedAt?: string;
    }>,
  ) {
    const results = [];
    for (const log of logs) {
      results.push(await this.logTemperature(tenantId, shipmentId, log));
    }
    return results;
  }

  async listTemperatureLogs(
    tenantId: string,
    query: PaginationQuery &
      DateRangeQuery & { shipmentId?: string; deviceId?: string },
  ) {
    const {
      page = 1,
      limit = 100,
      shipmentId,
      deviceId,
      startDate,
      endDate,
    } = query;
    const where: any = { tenantId };
    if (shipmentId) where.shipmentId = shipmentId;
    if (deviceId) where.deviceId = deviceId;
    if (startDate || endDate) {
      where.recordedAt = {};
      if (startDate) where.recordedAt.gte = new Date(startDate);
      if (endDate) where.recordedAt.lte = new Date(endDate);
    }
    const [data, total] = await Promise.all([
      this.db.coldChainTemperatureLog.findMany({
        where,
        orderBy: { recordedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.db.coldChainTemperatureLog.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async getTemperatureLogById(tenantId: string, id: string) {
    const log = await this.db.coldChainTemperatureLog.findFirst({
      where: { id, tenantId },
    });
    if (!log) throw new NotFoundException(`Temperature log #${id} not found`);
    return log;
  }

  // ─── Excursion Management ───────────────────────────────────────────

  async listExcursions(
    tenantId: string,
    query: PaginationQuery &
      DateRangeQuery & {
        shipmentId?: string;
        excursionType?: string;
        severity?: string;
      },
  ) {
    const {
      page = 1,
      limit = 20,
      shipmentId,
      excursionType,
      severity,
      startDate,
      endDate,
      status,
    } = query;
    const where: any = { tenantId };
    if (shipmentId) where.shipmentId = shipmentId;
    if (excursionType) where.excursionType = excursionType;
    if (severity) where.severity = severity;
    if (startDate || endDate) {
      where.detectedAt = {};
      if (startDate) where.detectedAt.gte = new Date(startDate);
      if (endDate) where.detectedAt.lte = new Date(endDate);
    }
    if (status === "OPEN") where.resolvedAt = null;
    if (status === "RESOLVED") where.resolvedAt = { not: null };
    const [data, total] = await Promise.all([
      this.db.coldChainExcursion.findMany({
        where,
        orderBy: { detectedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.db.coldChainExcursion.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async getExcursion(tenantId: string, id: string) {
    const excursion = await this.db.coldChainExcursion.findFirst({
      where: { id, tenantId },
    });
    if (!excursion) throw new NotFoundException(`Excursion #${id} not found`);
    return excursion;
  }

  async resolveExcursion(
    tenantId: string,
    id: string,
    data: { action: string; dispositionDecision: string; approvedBy: string },
  ) {
    const existing = await this.db.coldChainExcursion.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException(`Excursion #${id} not found`);
    if (existing.resolvedAt)
      throw new BadRequestException("Excursion already resolved");
    return this.db.coldChainExcursion.update({
      where: { id },
      data: {
        resolvedAt: new Date(),
        action: data.action,
        dispositionDecision: data.dispositionDecision,
        approvedBy: data.approvedBy,
      },
    });
  }

  async getOpenExcursionCount(tenantId: string) {
    return this.db.coldChainExcursion.count({
      where: { tenantId, resolvedAt: null },
    });
  }

  // ─── Dashboard & Analytics ──────────────────────────────────────────

  async getDashboard(tenantId: string) {
    const [
      activeShipments,
      totalShipments,
      totalExcursions,
      openExcursions,
      recentLogs,
    ] = await Promise.all([
      this.db.coldChainShipment.count({
        where: { tenantId, status: "IN_TRANSIT" },
      }),
      this.db.coldChainShipment.count({ where: { tenantId } }),
      this.db.coldChainExcursion.count({ where: { tenantId } }),
      this.db.coldChainExcursion.count({
        where: { tenantId, resolvedAt: null },
      }),
      this.db.coldChainTemperatureLog.findMany({
        where: { tenantId },
        orderBy: { recordedAt: "desc" },
        take: 20,
      }),
    ]);
    return {
      activeShipments,
      totalShipments,
      totalExcursions,
      openExcursions,
      excursionRate:
        totalShipments > 0
          ? Math.round((totalExcursions / totalShipments) * 100) / 100
          : 0,
      recentReadings: recentLogs,
      lastUpdated: new Date().toISOString(),
    };
  }

  async getFleetAnalytics(tenantId: string) {
    const shipments = await this.db.coldChainShipment.findMany({
      where: { tenantId },
      include: { temperatureLogs: true, ccExcursions: true },
    });
    const totalShipments = shipments.length;
    const shipmentsWithExcursions = shipments.filter(
      (s: any) => s.totalExcursions > 0,
    ).length;
    return {
      totalShipments,
      shipmentsWithExcursions,
      complianceRate:
        totalShipments > 0
          ? Math.round(
              ((totalShipments - shipmentsWithExcursions) / totalShipments) *
                10000,
            ) / 100
          : 100,
      averageExcursionsPerShipment:
        totalShipments > 0
          ? Math.round(
              (shipments.reduce(
                (sum: number, s: any) => sum + s.totalExcursions,
                0,
              ) /
                totalShipments) *
                100,
            ) / 100
          : 0,
      statusBreakdown: {
        planned: shipments.filter((s: any) => s.status === "PLANNED").length,
        inTransit: shipments.filter((s: any) => s.status === "IN_TRANSIT")
          .length,
        arrived: shipments.filter((s: any) => s.status === "ARRIVED").length,
        completed: shipments.filter((s: any) => s.status === "COMPLETED")
          .length,
      },
      totalTemperatureReadings: shipments.reduce(
        (sum: number, s: any) => sum + s.temperatureLogs.length,
        0,
      ),
    };
  }

  async getSensorAnalytics(tenantId: string) {
    const logs = await this.db.coldChainTemperatureLog.findMany({
      where: { tenantId },
      orderBy: { recordedAt: "desc" },
      take: 1000,
    });
    const temps = logs.map((l: any) => l.temperature);
    const avg =
      temps.length > 0
        ? temps.reduce((a: number, b: number) => a + b, 0) / temps.length
        : 0;
    return {
      totalReadings: logs.length,
      averageTemperature: Math.round(avg * 100) / 100,
      minTemperature: temps.length > 0 ? Math.min(...temps) : null,
      maxTemperature: temps.length > 0 ? Math.max(...temps) : null,
      uniqueDevices: [
        ...new Set(logs.map((l: any) => l.deviceId).filter(Boolean)),
      ].length,
    };
  }

  async getComplianceReport(
    tenantId: string,
    query: { startDate?: string; endDate?: string },
  ) {
    const where: any = { tenantId };
    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt.gte = new Date(query.startDate);
      if (query.endDate) where.createdAt.lte = new Date(query.endDate);
    }
    const shipments = await this.db.coldChainShipment.findMany({
      where,
      include: { ccExcursions: true },
    });
    const compliant = shipments.filter(
      (s: any) => s.totalExcursions === 0,
    ).length;
    return {
      totalShipments: shipments.length,
      compliantShipments: compliant,
      nonCompliantShipments: shipments.length - compliant,
      complianceRate:
        shipments.length > 0
          ? Math.round((compliant / shipments.length) * 10000) / 100
          : 100,
      totalExcursions: shipments.reduce(
        (sum: number, s: any) => sum + s.totalExcursions,
        0,
      ),
      excursionTypes: this.groupBy(
        shipments.flatMap((s: any) => s.ccExcursions),
        "excursionType",
      ),
      period: { start: query.startDate ?? "all", end: query.endDate ?? "all" },
    };
  }

  // ─── Requirements Management ────────────────────────────────────────

  async listRequirements(
    tenantId: string,
    query: { page?: number; limit?: number; productId?: string },
  ) {
    const { page = 1, limit = 20, productId } = query;
    const where: any = { tenantId };
    if (productId) where.productId = productId;
    const [data, total] = await Promise.all([
      this.db.coldChainRequirement.findMany({
        where,
        include: { excursions: { take: 5, orderBy: { recordedAt: "desc" } } },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.db.coldChainRequirement.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async createRequirement(
    tenantId: string,
    data: {
      productId: string;
      minTempCelsius: number;
      maxTempCelsius: number;
      minHumidityPct?: number;
      maxHumidityPct?: number;
      packagingType?: string;
      temperatureUnit?: string;
    },
  ) {
    return this.db.coldChainRequirement.create({ data: { ...data, tenantId } });
  }

  async updateRequirement(tenantId: string, id: string, data: any) {
    const existing = await this.db.coldChainRequirement.findFirst({
      where: { id, tenantId },
    });
    if (!existing)
      throw new NotFoundException(`Cold chain requirement #${id} not found`);
    return this.db.coldChainRequirement.update({ where: { id }, data });
  }

  async deleteRequirement(tenantId: string, id: string) {
    const existing = await this.db.coldChainRequirement.findFirst({
      where: { id, tenantId },
    });
    if (!existing)
      throw new NotFoundException(`Cold chain requirement #${id} not found`);
    return this.db.coldChainRequirement.delete({ where: { id } });
  }

  // ─── Helpers ────────────────────────────────────────────────────────

  private groupBy(arr: any[], key: string): Record<string, number> {
    return arr.reduce((acc: Record<string, number>, item: any) => {
      const k = item[key] ?? "UNKNOWN";
      acc[k] = (acc[k] ?? 0) + 1;
      return acc;
    }, {});
  }
}
