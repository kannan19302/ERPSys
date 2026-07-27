import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class FieldServicePartsService {
  async getPartRequests(tenantId: string, query: any = {}) {
    const where: any = { tenantId, isActive: true };
    if (query.technicianId) where.technicianId = query.technicianId;
    if (query.ticketId) where.ticketId = query.ticketId;
    if (query.status) where.status = query.status;
    if (query.priority) where.priority = query.priority;
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 50;
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      prisma.fieldServicePartRequest.findMany({
        where,
        include: {
          technician: { select: { id: true, name: true } },
          ticket: { select: { id: true, title: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.fieldServicePartRequest.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getPartRequestById(tenantId: string, id: string) {
    const pr = await prisma.fieldServicePartRequest.findFirst({
      where: { tenantId, id },
      include: { technician: true, ticket: true },
    });
    if (!pr) throw new NotFoundException("Part request not found");
    return pr;
  }

  async createPartRequest(tenantId: string, data: any) {
    return prisma.fieldServicePartRequest.create({
      data: {
        ...data,
        tenantId,
        totalPrice:
          Number(data.unitPrice || 0) * Number(data.quantityRequested || 1),
      },
      include: { technician: { select: { id: true, name: true } } },
    });
  }

  async updatePartRequest(tenantId: string, id: string, data: any) {
    const existing = await prisma.fieldServicePartRequest.findFirst({
      where: { tenantId, id },
    });
    if (!existing) throw new NotFoundException("Part request not found");
    const updateData: any = { ...data };
    if (data.unitPrice || data.quantityRequested) {
      const qty = data.quantityRequested ?? existing.quantityRequested;
      const price = data.unitPrice ?? Number(existing.unitPrice);
      updateData.totalPrice = Number(price) * Number(qty);
    }
    if (data.status === "APPROVED" && existing.status === "PENDING") {
      updateData.approvedAt = new Date();
    }
    if (data.status === "FULFILLED" || data.status === "PARTIALLY_FULFILLED") {
      updateData.fulfilledAt = new Date();
    }
    return prisma.fieldServicePartRequest.update({
      where: { id },
      data: updateData,
    });
  }

  async approvePartRequest(tenantId: string, id: string, approvedBy: string) {
    const existing = await prisma.fieldServicePartRequest.findFirst({
      where: { tenantId, id },
    });
    if (!existing) throw new NotFoundException("Part request not found");
    if (existing.status !== "PENDING")
      throw new BadRequestException("Part request is not in PENDING status");
    return prisma.fieldServicePartRequest.update({
      where: { id },
      data: {
        status: "APPROVED",
        approvedBy,
        approvedAt: new Date(),
        quantityApproved: existing.quantityRequested,
      },
    });
  }

  async getVanStock(tenantId: string, query: any = {}) {
    const where: any = { tenantId, isActive: true };
    if (query.technicianId) where.technicianId = query.technicianId;
    if (query.itemId) where.itemId = query.itemId;
    return prisma.fieldServiceVanStock.findMany({
      where,
      include: { technician: { select: { id: true, name: true } } },
      orderBy: { itemName: "asc" },
    });
  }

  async getVanStockById(tenantId: string, id: string) {
    const vs = await prisma.fieldServiceVanStock.findFirst({
      where: { tenantId, id },
      include: { technician: true },
    });
    if (!vs) throw new NotFoundException("Van stock item not found");
    return vs;
  }

  async createVanStock(tenantId: string, data: any) {
    return prisma.fieldServiceVanStock.upsert({
      where: {
        tenantId_technicianId_itemId: {
          tenantId,
          technicianId: data.technicianId,
          itemId: data.itemId,
        },
      },
      update: {
        quantityOnVan: data.quantityOnVan,
        itemName: data.itemName,
        minStockLevel: data.minStockLevel ?? 5,
        maxStockLevel: data.maxStockLevel ?? 20,
        reorderPoint: data.reorderPoint ?? 5,
        location: data.location,
      },
      create: { ...data, tenantId },
    });
  }

  async updateVanStock(tenantId: string, id: string, data: any) {
    const existing = await prisma.fieldServiceVanStock.findFirst({
      where: { tenantId, id },
    });
    if (!existing) throw new NotFoundException("Van stock item not found");
    return prisma.fieldServiceVanStock.update({ where: { id }, data });
  }

  async deleteVanStock(tenantId: string, id: string) {
    const existing = await prisma.fieldServiceVanStock.findFirst({
      where: { tenantId, id },
    });
    if (!existing) throw new NotFoundException("Van stock item not found");
    return prisma.fieldServiceVanStock.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async adjustVanStockQuantity(tenantId: string, id: string, quantity: number) {
    const existing = await prisma.fieldServiceVanStock.findFirst({
      where: { tenantId, id },
    });
    if (!existing) throw new NotFoundException("Van stock item not found");
    if (quantity < 0)
      throw new BadRequestException("Quantity cannot be negative");
    return prisma.fieldServiceVanStock.update({
      where: { id },
      data: { quantityOnVan: quantity },
    });
  }

  async getLowStockAlerts(tenantId: string) {
    return prisma.fieldServiceVanStock.findMany({
      where: {
        tenantId,
        isActive: true,
        quantityOnVan: { lte: prisma.fieldServiceVanStock.fields.reorderPoint },
      },
      include: { technician: { select: { id: true, name: true } } },
      orderBy: { quantityOnVan: "asc" },
    });
  }
}
