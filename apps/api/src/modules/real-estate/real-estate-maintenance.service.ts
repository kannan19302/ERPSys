import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class RealEstateMaintenanceService {
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
    const [data, total] = await Promise.all([
      prisma.realEstateMaintenanceRequest.findMany({
        where,
        include: {
          property: { select: { id: true, name: true } },
          vendor: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.realEstateMaintenanceRequest.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getRequestById(tenantId: string, id: string) {
    const r = await prisma.realEstateMaintenanceRequest.findFirst({
      where: { tenantId, id },
      include: { property: true, vendor: true },
    });
    if (!r) throw new NotFoundException("Maintenance request not found");
    return r;
  }

  async createRequest(tenantId: string, data: any) {
    return prisma.realEstateMaintenanceRequest.create({
      data: {
        ...data,
        tenantId,
        scheduledDate: data.scheduledDate ? new Date(data.scheduledDate) : null,
      },
      include: { property: { select: { id: true, name: true } } },
    });
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
    return prisma.realEstateMaintenanceRequest.update({
      where: { id },
      data: updateData,
      include: { property: true, vendor: true },
    });
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
