// @ts-nocheck
import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class RealEstateMaintenanceService {
  // RealEstateMaintenanceRequest only stores `propertyId`/`vendorId` scalars —
  // the schema has no `property`/`vendor` relations to `include`, so
  // summaries are batched in manually.
  private async attachProperty<T extends { propertyId: string }>(
    tenantId: string,
    rows: T[],
  ) {
    const properties = await prisma.realEstateProperty.findMany({
      where: { tenantId, id: { in: rows.map((r) => r.propertyId) } },
      select: { id: true, name: true },
    });
    const byId = new Map(properties.map((p) => [p.id, p]));
    return rows.map((r) => ({
      ...r,
      property: byId.get(r.propertyId) || null,
    }));
  }

  private async attachVendor<T extends { vendorId: string | null }>(
    tenantId: string,
    rows: T[],
  ) {
    const vendorIds = rows
      .map((r) => r.vendorId)
      .filter((id): id is string => id !== null);
    const vendors = await prisma.realEstateMaintenanceVendor.findMany({
      where: { tenantId, id: { in: vendorIds } },
      select: { id: true, name: true },
    });
    const byId = new Map(vendors.map((v) => [v.id, v]));
    return rows.map((r) => ({
      ...r,
      vendor: r.vendorId ? byId.get(r.vendorId) || null : null,
    }));
  }

  async getRequests(tenantId: string, query: any = {}) {
    const where: any = { tenantId, isActive: true };
    if (query.propertyId) where.propertyId = query.propertyId;
    if (query.status) where.status = query.status;
    if (query.priority) where.priority = query.priority;
    if (query.category) where.category = query.category;
    if (query.vendorId) where.vendorId = query.vendorId;
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 50;
    const skip = (page - 1) * limit;
    const [rows, total] = await Promise.all([
      prisma.realEstateMaintenanceRequest.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.realEstateMaintenanceRequest.count({ where }),
    ]);
    const withProperty = await this.attachProperty(tenantId, rows);
    const data = await this.attachVendor(tenantId, withProperty);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getRequestById(tenantId: string, id: string) {
    const r = await prisma.realEstateMaintenanceRequest.findFirst({
      where: { tenantId, id },
    });
    if (!r) throw new NotFoundException("Maintenance request not found");
    const [withProperty] = await this.attachProperty(tenantId, [r]);
    const [result] = await this.attachVendor(tenantId, [withProperty!]);
    return result;
  }

  async createRequest(tenantId: string, data: any) {
    const created = await prisma.realEstateMaintenanceRequest.create({
      data: {
        ...data,
        tenantId,
        scheduledDate: data.scheduledDate ? new Date(data.scheduledDate) : null,
      },
    });
    const [result] = await this.attachProperty(tenantId, [created]);
    return result;
  }

  async updateRequest(tenantId: string, id: string, data: any) {
    const existing = await prisma.realEstateMaintenanceRequest.findFirst({
      where: { tenantId, id },
    });
    if (!existing) throw new NotFoundException("Maintenance request not found");
    const updateData: any = { ...data };
    if (data.scheduledDate)
      updateData.scheduledDate = new Date(data.scheduledDate);
    if (data.completedDate)
      updateData.completedDate = new Date(data.completedDate);
    if (data.status === "COMPLETED" && !existing.completedDate) {
      updateData.completedDate = new Date();
    }
    const updated = await prisma.realEstateMaintenanceRequest.update({
      where: { id },
      data: updateData,
    });
    const [withProperty] = await this.attachProperty(tenantId, [updated]);
    const [result] = await this.attachVendor(tenantId, [withProperty!]);
    return result;
  }

  async deleteRequest(tenantId: string, id: string) {
    const existing = await prisma.realEstateMaintenanceRequest.findFirst({
      where: { tenantId, id },
    });
    if (!existing) throw new NotFoundException("Maintenance request not found");
    return prisma.realEstateMaintenanceRequest.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async getRequestStats(tenantId: string) {
    const [open, inProgress, completed, byPriority, byCategory] =
      await Promise.all([
        prisma.realEstateMaintenanceRequest.count({
          where: { tenantId, status: "OPEN", isActive: true },
        }),
        prisma.realEstateMaintenanceRequest.count({
          where: { tenantId, status: "IN_PROGRESS", isActive: true },
        }),
        prisma.realEstateMaintenanceRequest.count({
          where: { tenantId, status: "COMPLETED", isActive: true },
        }),
        prisma.realEstateMaintenanceRequest.groupBy({
          by: ["priority"],
          where: { tenantId, isActive: true },
          _count: true,
        }),
        prisma.realEstateMaintenanceRequest.groupBy({
          by: ["category"],
          where: { tenantId, isActive: true },
          _count: true,
        }),
      ]);
    return { open, inProgress, completed, byPriority, byCategory };
  }

  async getVendors(tenantId: string) {
    return prisma.realEstateMaintenanceVendor.findMany({
      where: { tenantId, isActive: true },
      orderBy: { name: "asc" },
    });
  }

  async getVendorById(tenantId: string, id: string) {
    const v = await prisma.realEstateMaintenanceVendor.findFirst({
      where: { tenantId, id },
      include: { workOrders: { take: 10, orderBy: { createdAt: "desc" } } },
    });
    if (!v) throw new NotFoundException("Vendor not found");
    return v;
  }

  async createVendor(tenantId: string, data: any) {
    return prisma.realEstateMaintenanceVendor.create({
      data: { ...data, tenantId },
    });
  }

  async updateVendor(tenantId: string, id: string, data: any) {
    const existing = await prisma.realEstateMaintenanceVendor.findFirst({
      where: { tenantId, id },
    });
    if (!existing) throw new NotFoundException("Vendor not found");
    return prisma.realEstateMaintenanceVendor.update({ where: { id }, data });
  }

  async assignVendor(tenantId: string, requestId: string, vendorId: string) {
    const existing = await prisma.realEstateMaintenanceRequest.findFirst({
      where: { tenantId, id: requestId },
    });
    if (!existing) throw new NotFoundException("Maintenance request not found");
    return prisma.realEstateMaintenanceRequest.update({
      where: { id: requestId },
      data: {
        vendorId,
        status: existing.status === "OPEN" ? "ASSIGNED" : existing.status,
      },
    });
  }
}
