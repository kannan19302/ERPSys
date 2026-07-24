import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { prisma } from "@unerp/database";
import { Prisma } from "@prisma/client";

@Injectable()
export class LogisticsExecutionService {
  async getTransportModes(tenantId: string) {
    return prisma.transportMode.findMany({
      where: { tenantId, isActive: true },
      orderBy: { name: "asc" },
    });
  }

  async createTransportMode(tenantId: string, dto: any) {
    const existing = await prisma.transportMode.findFirst({
      where: { tenantId, code: dto.code },
    });
    if (existing)
      throw new BadRequestException(
        `Transport mode ${dto.code} already exists`,
      );
    return prisma.transportMode.create({ data: { tenantId, ...dto } });
  }

  async getCarrierRates(
    tenantId: string,
    params?: { carrierId?: string; originZip?: string; destZip?: string },
  ) {
    const where: any = {
      tenantId,
      isActive: true,
      effectiveDate: { lte: new Date() },
      OR: [{ expirationDate: null }, { expirationDate: { gte: new Date() } }],
    };
    if (params?.carrierId) where.carrierId = params.carrierId;
    if (params?.originZip) where.originZip = params.originZip;
    if (params?.destZip) where.destZip = params.destZip;
    return prisma.carrierRate.findMany({ where, orderBy: { baseRate: "asc" } });
  }

  async createCarrierRate(tenantId: string, dto: any) {
    return prisma.carrierRate.create({
      data: {
        tenantId,
        carrierId: dto.carrierId,
        serviceLevelId: dto.serviceLevelId || null,
        originZip: dto.originZip || null,
        destZip: dto.destZip || null,
        originRegion: dto.originRegion || null,
        destRegion: dto.destRegion || null,
        weightMin: dto.weightMin ? new Prisma.Decimal(dto.weightMin) : null,
        weightMax: dto.weightMax ? new Prisma.Decimal(dto.weightMax) : null,
        rateType: dto.rateType || "PER_UNIT",
        baseRate: new Prisma.Decimal(dto.baseRate),
        perUnitRate: dto.perUnitRate
          ? new Prisma.Decimal(dto.perUnitRate)
          : null,
        perWeightRate: dto.perWeightRate
          ? new Prisma.Decimal(dto.perWeightRate)
          : null,
        perDistanceRate: dto.perDistanceRate
          ? new Prisma.Decimal(dto.perDistanceRate)
          : null,
        fuelSurcharge: dto.fuelSurcharge
          ? new Prisma.Decimal(dto.fuelSurcharge)
          : new Prisma.Decimal(0),
        minimumCharge: dto.minimumCharge
          ? new Prisma.Decimal(dto.minimumCharge)
          : null,
        maximumCharge: dto.maximumCharge
          ? new Prisma.Decimal(dto.maximumCharge)
          : null,
        currency: dto.currency || "USD",
        effectiveDate: new Date(dto.effectiveDate),
        expirationDate: dto.expirationDate
          ? new Date(dto.expirationDate)
          : null,
        transitDays: dto.transitDays || null,
      },
    });
  }

  async getLoadBuilds(
    tenantId: string,
    params?: { status?: string; page?: number; limit?: number },
  ) {
    const where: any = { tenantId, isActive: true };
    if (params?.status) where.status = params.status;
    const data = await prisma.loadBuild.findMany({
      where,
      include: { stops: { orderBy: { stopSequence: "asc" } }, items: true },
      orderBy: { createdAt: "desc" },
      skip: params?.page ? (params.page - 1) * (params.limit || 20) : 0,
      take: params?.limit || 20,
    });
    const total = await prisma.loadBuild.count({ where });
    return { data, total, page: params?.page || 1, limit: params?.limit || 20 };
  }

  async getLoadBuildById(tenantId: string, id: string) {
    const load = await prisma.loadBuild.findFirst({
      where: { id, tenantId },
      include: {
        stops: { orderBy: { stopSequence: "asc" } },
        items: true,
        tenderRequests: true,
      },
    });
    if (!load) throw new NotFoundException("Load build not found");
    return load;
  }

  async createLoadBuild(tenantId: string, dto: any, userId?: string) {
    const buildNumber = `LB-${Date.now()}`;
    return prisma.$transaction(async (tx) => {
      const load = await tx.loadBuild.create({
        data: {
          tenantId,
          buildNumber,
          loadType: dto.loadType || "OUTBOUND",
          transportMode: dto.transportMode || null,
          carrierId: dto.carrierId || null,
          carrierName: dto.carrierName || null,
          vehicleNumber: dto.vehicleNumber || null,
          driverName: dto.driverName || null,
          driverContact: dto.driverContact || null,
          originName: dto.originName || null,
          destName: dto.destName || null,
          scheduledPickup: dto.scheduledPickup
            ? new Date(dto.scheduledPickup)
            : null,
          scheduledDelivery: dto.scheduledDelivery
            ? new Date(dto.scheduledDelivery)
            : null,
          totalWeight: dto.totalWeight
            ? new Prisma.Decimal(dto.totalWeight)
            : null,
          totalVolume: dto.totalVolume
            ? new Prisma.Decimal(dto.totalVolume)
            : null,
          totalPallets: dto.totalPallets || null,
          totalCartons: dto.totalCartons || null,
          estimatedCost: dto.estimatedCost
            ? new Prisma.Decimal(dto.estimatedCost)
            : null,
          bolNumber: dto.bolNumber || null,
          temperatureReq: dto.temperatureReq || null,
          hazmat: dto.hazmat || false,
          notes: dto.notes || null,
          createdBy: userId || null,
        },
      });
      if (dto.stops?.length) {
        await tx.loadBuildStop.createMany({
          data: dto.stops.map((s: any) => ({
            tenantId,
            loadId: load.id,
            stopSequence: s.stopSequence,
            stopType: s.stopType || "PICKUP",
            locationName: s.locationName || null,
            address: s.address || null,
            scheduledArrival: s.scheduledArrival
              ? new Date(s.scheduledArrival)
              : null,
            scheduledDeparture: s.scheduledDeparture
              ? new Date(s.scheduledDeparture)
              : null,
            contactPerson: s.contactPerson || null,
            contactPhone: s.contactPhone || null,
          })),
        });
      }
      if (dto.items?.length) {
        await tx.loadBuildItem.createMany({
          data: dto.items.map((i: any) => ({
            tenantId,
            loadId: load.id,
            productId: i.productId || null,
            productSku: i.productSku || null,
            productName: i.productName || null,
            quantity: new Prisma.Decimal(i.quantity),
            uom: i.uom || "EA",
            weight: i.weight ? new Prisma.Decimal(i.weight) : null,
            volume: i.volume ? new Prisma.Decimal(i.volume) : null,
            palletCount: i.palletCount || null,
            cartonCount: i.cartonCount || null,
          })),
        });
      }
      return tx.loadBuild.findUnique({
        where: { id: load.id },
        include: { stops: { orderBy: { stopSequence: "asc" } }, items: true },
      });
    });
  }

  async updateLoadBuildStatus(tenantId: string, id: string, status: string) {
    const load = await prisma.loadBuild.findFirst({ where: { id, tenantId } });
    if (!load) throw new NotFoundException("Load build not found");
    const updateData: any = { status };
    if (status === "DISPATCHED") {
      updateData.actualPickup = new Date();
    }
    if (status === "COMPLETE") {
      updateData.actualDelivery = new Date();
    }
    return prisma.loadBuild.update({ where: { id }, data: updateData });
  }

  async createTenderRequest(tenantId: string, loadId: string, dto: any) {
    const load = await prisma.loadBuild.findFirst({
      where: { id: loadId, tenantId },
    });
    if (!load) throw new NotFoundException("Load build not found");
    return prisma.loadTenderRequest.create({
      data: {
        tenantId,
        loadId,
        tenderNumber: `TND-${Date.now()}`,
        carrierId: dto.carrierId || null,
        carrierName: dto.carrierName || null,
        requestedRate: dto.requestedRate
          ? new Prisma.Decimal(dto.requestedRate)
          : null,
        validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
        notes: dto.notes || null,
      },
    });
  }

  async getAppointments(
    tenantId: string,
    params?: {
      status?: string;
      warehouseId?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const where: any = { tenantId, isActive: true };
    if (params?.status) where.status = params.status;
    if (params?.warehouseId) where.warehouseId = params.warehouseId;
    const data = await prisma.appointmentSchedule.findMany({
      where,
      orderBy: { scheduledStart: "desc" },
      skip: params?.page ? (params.page - 1) * (params.limit || 20) : 0,
      take: params?.limit || 20,
    });
    const total = await prisma.appointmentSchedule.count({ where });
    return { data, total, page: params?.page || 1, limit: params?.limit || 20 };
  }

  async createAppointment(tenantId: string, dto: any, userId?: string) {
    const appointmentNumber = `APT-${Date.now()}`;
    return prisma.appointmentSchedule.create({
      data: {
        tenantId,
        appointmentNumber,
        appointmentType: dto.appointmentType,
        carrierId: dto.carrierId || null,
        carrierName: dto.carrierName || null,
        carrierContact: dto.carrierContact || null,
        vehicleNumber: dto.vehicleNumber || null,
        warehouseId: dto.warehouseId || null,
        dockDoor: dto.dockDoor || null,
        scheduledStart: new Date(dto.scheduledStart),
        scheduledEnd: dto.scheduledEnd ? new Date(dto.scheduledEnd) : null,
        poNumbers: dto.poNumbers || null,
        referenceNumber: dto.referenceNumber || null,
        driverName: dto.driverName || null,
        driverPhone: dto.driverPhone || null,
        totalWeight: dto.totalWeight
          ? new Prisma.Decimal(dto.totalWeight)
          : null,
        totalPallets: dto.totalPallets || null,
        totalCartons: dto.totalCartons || null,
        notes: dto.notes || null,
        createdBy: userId || null,
      },
    });
  }

  async updateAppointmentStatus(tenantId: string, id: string, status: string) {
    const apt = await prisma.appointmentSchedule.findFirst({
      where: { id, tenantId },
    });
    if (!apt) throw new NotFoundException("Appointment not found");
    const updateData: any = { status };
    if (status === "CHECKED_IN") updateData.checkInTime = new Date();
    if (status === "IN_PROGRESS") updateData.startedAt = new Date();
    if (status === "COMPLETE") updateData.completedAt = new Date();
    if (status === "CANCELLED") updateData.cancelledReason = status;
    return prisma.appointmentSchedule.update({
      where: { id },
      data: updateData,
    });
  }

  async createDeliveryConfirmation(
    tenantId: string,
    dto: any,
    userId?: string,
  ) {
    const confirmationNumber = `POD-${Date.now()}`;
    return prisma.$transaction(async (tx) => {
      const conf = await tx.documentDeliveryConfirmation.create({
        data: {
          tenantId,
          confirmationNumber,
          shipmentId: dto.shipmentId || null,
          shipmentType: dto.shipmentType || null,
          receivedBy: dto.receivedBy || null,
          signatureName: dto.signatureName || null,
          damageNotes: dto.damageNotes || null,
          carrierName: dto.carrierName || null,
          driverName: dto.driverName || null,
          receivedAt: new Date(),
          lat: dto.lat ? new Prisma.Decimal(dto.lat) : null,
          lng: dto.lng ? new Prisma.Decimal(dto.lng) : null,
          notes: dto.notes || null,
          createdBy: userId || null,
        },
      });
      if (dto.lines?.length) {
        await tx.deliveryConfirmationLine.createMany({
          data: dto.lines.map((l: any) => ({
            tenantId,
            confirmationId: conf.id,
            productId: l.productId || null,
            productSku: l.productSku || null,
            productName: l.productName || null,
            expectedQty: new Prisma.Decimal(l.expectedQty),
            deliveredQty: new Prisma.Decimal(l.deliveredQty),
            damagedQty: l.damagedQty ? new Prisma.Decimal(l.damagedQty) : null,
            rejectedQty: l.rejectedQty
              ? new Prisma.Decimal(l.rejectedQty)
              : null,
            condition: l.condition || null,
            notes: l.notes || null,
          })),
        });
      }
      return tx.documentDeliveryConfirmation.findUnique({
        where: { id: conf.id },
        include: { lines: true },
      });
    });
  }

  async getDeliveryConfirmations(
    tenantId: string,
    params?: { shipmentId?: string; page?: number; limit?: number },
  ) {
    const where: any = { tenantId, isActive: true };
    if (params?.shipmentId) where.shipmentId = params.shipmentId;
    const data = await prisma.documentDeliveryConfirmation.findMany({
      where,
      include: { lines: true },
      orderBy: { createdAt: "desc" },
      skip: params?.page ? (params.page - 1) * (params.limit || 20) : 0,
      take: params?.limit || 20,
    });
    const total = await prisma.documentDeliveryConfirmation.count({ where });
    return { data, total, page: params?.page || 1, limit: params?.limit || 20 };
  }

  async rateShop(
    tenantId: string,
    dto: {
      originZip?: string;
      destZip?: string;
      weight?: number;
      pallets?: number;
    },
  ) {
    const rates = await (prisma as any).carrierRate.findMany({
      where: {
        tenantId,
        isActive: true,
        effectiveDate: { lte: new Date() },
        OR: [{ expirationDate: null }, { expirationDate: { gte: new Date() } }],
      },
      include: { carrier: true },
    });
    return rates
      .filter(
        (r: any) =>
          (!dto.weight || !r.weightMin || dto.weight >= Number(r.weightMin)) &&
          (!dto.weight || !r.weightMax || dto.weight <= Number(r.weightMax)),
      )
      .map((r: any) => ({
        carrierId: r.carrierId,
        carrierName: (r as any).carrier?.name || "",
        serviceLevelId: r.serviceLevelId,
        rateType: r.rateType,
        baseRate: Number(r.baseRate),
        perUnitRate: r.perUnitRate ? Number(r.perUnitRate) : null,
        fuelSurcharge: Number(r.fuelSurcharge),
        totalEstimated:
          Number(r.baseRate) +
          (dto.weight ? Number(r.perWeightRate || 0) * dto.weight : 0),
        transitDays: r.transitDays,
        currency: r.currency,
      }))
      .sort((a: any, b: any) => a.totalEstimated - b.totalEstimated);
  }
}
