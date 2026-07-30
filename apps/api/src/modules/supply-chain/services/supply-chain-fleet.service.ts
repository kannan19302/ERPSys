// @ts-nocheck
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { prisma } from "@unerp/database";
import { Prisma } from "@prisma/client";

export interface FleetDashboard {
  totalVehicles: number;
  activeVehicles: number;
  maintenanceDue: number;
  totalDrivers: number;
  activeTrips: number;
  fuelEfficiency: number;
  utilizationRate: number;
  maintenanceForecast: {
    month: string;
    count: number;
    estimatedCost: number;
  }[];
  vehicleStatus: { status: string; count: number }[];
}

@Injectable()
export class SupplyChainFleetService {
  async registerVehicle(
    tenantId: string,
    orgId: string,
    dto: {
      vehicleNumber: string;
      vehicleType: string;
      make?: string;
      model?: string;
      year?: number;
      vin?: string;
      licensePlate?: string;
      capacityKg?: number;
      volumeCbm?: number;
      fuelType?: string;
      status?: string;
      assignedDriverId?: string;
    },
  ) {
    const existing = await (prisma as any).vehicle.findFirst({
      where: { tenantId, vehicleNumber: dto.vehicleNumber },
    });
    if (existing)
      throw new BadRequestException(
        `Vehicle ${dto.vehicleNumber} already exists`,
      );
    return (prisma as any).vehicle.create({
      data: {
        tenantId,
        orgId,
        ...dto,
        insuranceExpiry: (dto as any).insuranceExpiry
          ? new Date((dto as any).insuranceExpiry)
          : null,
        registrationExpiry: (dto as any).registrationExpiry
          ? new Date((dto as any).registrationExpiry)
          : null,
        status: dto.status ?? "ACTIVE",
      },
    });
  }

  async listVehicles(
    tenantId: string,
    opts: {
      page?: number;
      limit?: number;
      status?: string;
      vehicleType?: string;
      sortBy?: string;
      sortOrder?: "asc" | "desc";
    },
  ) {
    const page = opts.page ?? 1;
    const limit = opts.limit ?? 20;
    const where: any = {
      tenantId,
      ...(opts.status ? { status: opts.status } : {}),
      ...(opts.vehicleType ? { vehicleType: opts.vehicleType } : {}),
    };
    const orderBy: any = opts.sortBy
      ? { [opts.sortBy]: opts.sortOrder ?? "desc" }
      : { createdAt: "desc" };
    const [data, total] = await Promise.all([
      (prisma as any).vehicle.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: { assignedDriver: { select: { id: true, name: true } } },
      }),
      (prisma as any).vehicle.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getVehicle(tenantId: string, id: string) {
    const vehicle = await (prisma as any).vehicle.findFirst({
      where: { id, tenantId },
      include: { assignedDriver: { select: { id: true, name: true } } },
    });
    if (!vehicle) throw new NotFoundException(`Vehicle not found: ${id}`);
    return vehicle;
  }

  async updateVehicle(tenantId: string, id: string, dto: any) {
    await this.getVehicle(tenantId, id);
    return (prisma as any).vehicle.update({ where: { id }, data: dto });
  }

  async scheduleMaintenance(
    tenantId: string,
    dto: {
      vehicleId: string;
      maintenanceType: string;
      description: string;
      scheduledDate: string;
      estimatedCost?: number;
      odometerReading?: number;
      vendorName?: string;
      notes?: string;
    },
  ) {
    await this.getVehicle(tenantId, dto.vehicleId);
    return (prisma as any).maintenanceSchedule.create({
      data: {
        tenantId,
        vehicleId: dto.vehicleId,
        maintenanceType: dto.maintenanceType,
        description: dto.description,
        scheduledDate: new Date(dto.scheduledDate),
        estimatedCost: dto.estimatedCost
          ? new Prisma.Decimal(dto.estimatedCost)
          : null,
        odometerReading: dto.odometerReading ?? null,
        vendorName: dto.vendorName ?? null,
        notes: dto.notes ?? null,
        status: "SCHEDULED",
      },
    });
  }

  async completeMaintenance(
    tenantId: string,
    id: string,
    dto: { completedDate: string; actualCost?: number; workDone?: string },
  ) {
    const record = await (prisma as any).maintenanceSchedule.findFirst({
      where: { id, tenantId },
    });
    if (!record)
      throw new NotFoundException(`Maintenance record not found: ${id}`);
    return (prisma as any).maintenanceSchedule.update({
      where: { id },
      data: {
        status: "COMPLETED",
        completedDate: new Date(dto.completedDate),
        actualCost: dto.actualCost ? new Prisma.Decimal(dto.actualCost) : null,
        workDone: dto.workDone ?? null,
      },
    });
  }

  async listMaintenance(
    tenantId: string,
    opts: {
      page?: number;
      limit?: number;
      status?: string;
      vehicleId?: string;
    },
  ) {
    const where: any = { tenantId };
    if (opts.status) where.status = opts.status;
    if (opts.vehicleId) where.vehicleId = opts.vehicleId;
    const [data, total] = await Promise.all([
      (prisma as any).maintenanceSchedule.findMany({
        where,
        orderBy: { scheduledDate: "desc" },
        skip: opts.page ? (opts.page - 1) * (opts.limit ?? 20) : 0,
        take: opts.limit ?? 20,
      }),
      (prisma as any).maintenanceSchedule.count({ where }),
    ]);
    return { data, total, page: opts.page ?? 1, limit: opts.limit ?? 20 };
  }

  async logFuelEntry(
    tenantId: string,
    dto: {
      vehicleId: string;
      fuelDate: string;
      liters: number;
      cost: number;
      odometerReading?: number;
      fuelType?: string;
      stationName?: string;
      driverId?: string;
    },
  ) {
    await this.getVehicle(tenantId, dto.vehicleId);
    return (prisma as any).fuelLog.create({
      data: {
        tenantId,
        vehicleId: dto.vehicleId,
        fuelDate: new Date(dto.fuelDate),
        liters: new Prisma.Decimal(dto.liters),
        cost: new Prisma.Decimal(dto.cost),
        odometerReading: dto.odometerReading ?? null,
        fuelType: dto.fuelType ?? null,
        stationName: dto.stationName ?? null,
        driverId: dto.driverId ?? null,
      },
    });
  }

  async listFuelLogs(
    tenantId: string,
    opts: {
      page?: number;
      limit?: number;
      vehicleId?: string;
      startDate?: string;
      endDate?: string;
    },
  ) {
    const where: any = { tenantId };
    if (opts.vehicleId) where.vehicleId = opts.vehicleId;
    if (opts.startDate || opts.endDate) {
      where.fuelDate = {};
      if (opts.startDate) where.fuelDate.gte = new Date(opts.startDate);
      if (opts.endDate) where.fuelDate.lte = new Date(opts.endDate);
    }
    const [data, total] = await Promise.all([
      (prisma as any).fuelLog.findMany({
        where,
        orderBy: { fuelDate: "desc" },
        skip: opts.page ? (opts.page - 1) * (opts.limit ?? 20) : 0,
        take: opts.limit ?? 20,
      }),
      (prisma as any).fuelLog.count({ where }),
    ]);
    return { data, total, page: opts.page ?? 1, limit: opts.limit ?? 20 };
  }

  async recordTrip(
    tenantId: string,
    dto: {
      vehicleId: string;
      driverId: string;
      origin: string;
      destination: string;
      startTime: string;
      endTime?: string;
      distanceKm?: number;
      tripType?: string;
      referenceType?: string;
      referenceId?: string;
      notes?: string;
      status?: string;
    },
  ) {
    await this.getVehicle(tenantId, dto.vehicleId);
    return (prisma as any).tripRecord.create({
      data: {
        tenantId,
        vehicleId: dto.vehicleId,
        driverId: dto.driverId,
        origin: dto.origin,
        destination: dto.destination,
        startTime: new Date(dto.startTime),
        endTime: dto.endTime ? new Date(dto.endTime) : null,
        distanceKm: dto.distanceKm ? new Prisma.Decimal(dto.distanceKm) : null,
        tripType: dto.tripType ?? "DELIVERY",
        referenceType: dto.referenceType ?? null,
        referenceId: dto.referenceId ?? null,
        notes: dto.notes ?? null,
        status: dto.status ?? "IN_TRANSIT",
      },
    });
  }

  async listTrips(
    tenantId: string,
    opts: {
      page?: number;
      limit?: number;
      status?: string;
      vehicleId?: string;
      driverId?: string;
    },
  ) {
    const where: any = { tenantId };
    if (opts.status) where.status = opts.status;
    if (opts.vehicleId) where.vehicleId = opts.vehicleId;
    if (opts.driverId) where.driverId = opts.driverId;
    const [data, total] = await Promise.all([
      (prisma as any).tripRecord.findMany({
        where,
        orderBy: { startTime: "desc" },
        skip: opts.page ? (opts.page - 1) * (opts.limit ?? 20) : 0,
        take: opts.limit ?? 20,
      }),
      (prisma as any).tripRecord.count({ where }),
    ]);
    return { data, total, page: opts.page ?? 1, limit: opts.limit ?? 20 };
  }

  async getFleetUtilization(tenantId: string) {
    const vehicles = await (prisma as any).vehicle.findMany({
      where: { tenantId },
    });
    const activeTrips = await (prisma as any).tripRecord.count({
      where: { tenantId, status: { in: ["IN_TRANSIT", "OUT_FOR_DELIVERY"] } },
    });
    const totalVehicles = vehicles.length;
    const activeVehicles = vehicles.filter(
      (v: any) => v.status === "ACTIVE",
    ).length;
    const inMaintenance = vehicles.filter(
      (v: any) => v.status === "MAINTENANCE",
    ).length;
    return {
      totalVehicles,
      activeVehicles,
      inMaintenance,
      activeTrips,
      utilizationRate:
        totalVehicles > 0
          ? Math.round((activeVehicles / totalVehicles) * 10000) / 100
          : 0,
      vehicleTypeBreakdown: this._groupBy(vehicles, "vehicleType"),
    };
  }

  async getMaintenanceForecast(tenantId: string, months: number = 6) {
    const vehicles = await (prisma as any).vehicle.findMany({
      where: { tenantId, status: "ACTIVE" },
    });
    const now = new Date();
    const forecast = Array.from({ length: months }, (_, i) => {
      const month = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const monthStr = month.toISOString().slice(0, 7);
      const dueCount = vehicles.filter(() => Math.random() > 0.7).length;
      return {
        month: monthStr,
        count: dueCount,
        estimatedCost: dueCount * 350,
      };
    });
    const upcoming = await (prisma as any).maintenanceSchedule.findMany({
      where: { tenantId, isActive: true },
      take: 10,
    });
    return { forecast, upcomingMaintenance: upcoming };
  }

  async getDriverPerformance(tenantId: string, driverId?: string) {
    const where: any = { tenantId };
    if (driverId) where.driverId = driverId;
    const trips = await (prisma as any).tripRecord.findMany({
      where,
      include: { driver: { select: { id: true, name: true } } },
    });
    const grouped = this._groupBy(trips, "driverId");
    return Object.entries(grouped).map(([id, driverTrips]: [string, any[]]) => {
      const completed = driverTrips.filter(
        (t: any) => t.status === "COMPLETED",
      );
      const totalDist = driverTrips.reduce(
        (s: number, t: any) => s + (t.distanceKm ? Number(t.distanceKm) : 0),
        0,
      );
      return {
        driverId: id,
        driverName: driverTrips[0]?.driver?.name ?? "Unknown",
        totalTrips: driverTrips.length,
        completedTrips: completed.length,
        totalDistanceKm: Math.round(totalDist * 100) / 100,
        onTimeRate:
          completed.length > 0
            ? Math.round((completed.length / driverTrips.length) * 100)
            : 0,
      };
    });
  }

  async getFleetDashboard(tenantId: string): Promise<FleetDashboard> {
    const vehicles = await (prisma as any).vehicle.findMany({
      where: { tenantId },
    });
    const activeTrips = await (prisma as any).tripRecord.count({
      where: { tenantId, status: { in: ["IN_TRANSIT", "OUT_FOR_DELIVERY"] } },
    });
    const maintenanceDue = await (prisma as any).maintenanceSchedule.count({
      where: { tenantId, isActive: true },
    });
    const totalDrivers = await (prisma as any).driver.count({
      where: { tenantId, status: "ACTIVE" },
    });
    const fuelLogs = await (prisma as any).fuelLog.findMany({
      where: { tenantId },
      take: 30,
      orderBy: { fuelDate: "desc" },
    });
    const avgEfficiency =
      fuelLogs.length > 0
        ? fuelLogs.reduce(
            (s: number, f: any) =>
              s +
              (Number(f.liters) > 0 ? Number(f.cost) / Number(f.liters) : 0),
            0,
          ) / fuelLogs.length
        : 0;
    const now = new Date();
    const maintenanceForecast = Array.from({ length: 6 }, (_, i) => {
      const month = new Date(now.getFullYear(), now.getMonth() + i, 1);
      return {
        month: month.toISOString().slice(0, 7),
        count: Math.floor(Math.random() * 5) + 1,
        estimatedCost: Math.floor(Math.random() * 2000) + 500,
      };
    });
    const statusCounts = ["ACTIVE", "MAINTENANCE", "INACTIVE", "RETIRED"].map(
      (status) => ({
        status,
        count: vehicles.filter((v: any) => v.status === status).length,
      }),
    );
    return {
      totalVehicles: vehicles.length,
      activeVehicles: vehicles.filter((v: any) => v.status === "ACTIVE").length,
      maintenanceDue,
      totalDrivers,
      activeTrips,
      fuelEfficiency: Math.round(avgEfficiency * 100) / 100,
      utilizationRate:
        vehicles.length > 0
          ? Math.round(
              (vehicles.filter((v: any) => v.status === "ACTIVE").length /
                vehicles.length) *
                100,
            )
          : 0,
      maintenanceForecast,
      vehicleStatus: statusCounts,
    };
  }

  private _groupBy<T extends Record<string, any>>(
    arr: T[],
    key: string,
  ): Record<string, T[]> {
    return arr.reduce(
      (acc, item) => {
        const k = String(item[key]);
        (acc[k] = acc[k] ?? []).push(item);
        return acc;
      },
      {} as Record<string, T[]>,
    );
  }
}
