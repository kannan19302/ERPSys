import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";
import { Prisma } from "@prisma/client";

@Injectable()
export class ContainerTrackingService {
  async list(
    tenantId: string,
    opts: {
      page?: number;
      limit?: number;
      status?: string;
      carrierId?: string;
    },
  ) {
    const page = opts.page ?? 1;
    const limit = opts.limit ?? 20;
    const skip = (page - 1) * limit;
    const where: Prisma.ContainerTrackingWhereInput = {
      tenantId,
      ...(opts.status ? { status: opts.status } : {}),
      ...(opts.carrierId ? { carrierId: opts.carrierId } : {}),
    };
    const [data, total] = await Promise.all([
      prisma.containerTracking.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: { events: { orderBy: { occurredAt: "desc" }, take: 1 } },
      }),
      prisma.containerTracking.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getById(tenantId: string, id: string) {
    const container = await prisma.containerTracking.findFirst({
      where: { id, tenantId },
      include: { events: { orderBy: { occurredAt: "desc" } } },
    });
    if (!container) throw new NotFoundException(`Container not found: ${id}`);
    return container;
  }

  async create(tenantId: string, dto: Prisma.ContainerTrackingCreateInput) {
    return prisma.containerTracking.create({ data: { ...dto, tenantId } });
  }

  async update(
    tenantId: string,
    id: string,
    dto: Prisma.ContainerTrackingUpdateInput,
  ) {
    await this.getById(tenantId, id);
    return prisma.containerTracking.update({ where: { id }, data: dto });
  }

  async delete(tenantId: string, id: string) {
    await this.getById(tenantId, id);
    return prisma.containerTracking.delete({ where: { id } });
  }

  async addEvent(
    tenantId: string,
    containerId: string,
    dto: Prisma.ContainerTrackingEventCreateInput,
  ) {
    await this.getById(tenantId, containerId);
    return prisma.containerTrackingEvent.create({
      data: { ...dto, tenantId, containerId } as any,
    });
  }

  async getAtRiskContainers(tenantId: string) {
    const containers = await prisma.containerTracking.findMany({
      where: {
        tenantId,
        status: { in: ["LOADED", "IN_TRANSIT", "AT_PORT"] },
        estimatedReturn: { not: null },
      },
      include: { events: { orderBy: { occurredAt: "desc" }, take: 1 } },
    });
    const now = new Date();
    return containers
      .filter((c) => c.estimatedReturn && c.estimatedReturn < now)
      .map((c) => ({
        ...c,
        demurrageDays: c.estimatedReturn
          ? Math.floor((now.getTime() - c.estimatedReturn.getTime()) / 86400000)
          : 0,
        atRisk: true,
      }));
  }

  async linkToShipment(
    tenantId: string,
    id: string,
    shipmentType: string,
    shipmentId: string,
  ) {
    await this.getById(tenantId, id);
    const updateData = (shipmentType === "INBOUND"
      ? { inboundShipmentId: shipmentId }
      : {
          outboundShipmentId: shipmentId,
        }) as unknown as Prisma.ContainerTrackingUpdateInput;
    return prisma.containerTracking.update({ where: { id }, data: updateData });
  }
}
