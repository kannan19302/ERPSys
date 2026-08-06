import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";

@Injectable()
export class FieldServicePartsService {
  // FieldServicePartRequest/FieldServiceVanStock only store `technicianId`/
  // `ticketId` scalars — the schema has no `technician`/`ticket` relations to
  // `include`, so summaries are batched in manually.
  private async attachTechnicians<T extends { technicianId: string }>(
    tenantId: string,
    rows: T[],
  ) {
    const technicians = await prisma.fieldServiceTechnician.findMany({
      where: { tenantId, id: { in: rows.map((r) => r.technicianId) } },
      select: { id: true, name: true },
    });
    const byId = new Map(technicians.map((t) => [t.id, t]));
    return rows.map((r) => ({
      ...r,
      technician: byId.get(r.technicianId) || null,
    }));
  }

  private async attachTickets<T extends { ticketId: string | null }>(
    tenantId: string,
    rows: T[],
  ) {
    const ticketIds = rows
      .map((r) => r.ticketId)
      .filter((id): id is string => id !== null);
    const tickets = await prisma.fieldServiceTicket.findMany({
      where: { tenantId, id: { in: ticketIds } },
      select: { id: true, title: true },
    });
    const byId = new Map(tickets.map((t) => [t.id, t]));
    return rows.map((r) => ({
      ...r,
      ticket: r.ticketId ? byId.get(r.ticketId) || null : null,
    }));
  }

  async getPartRequests(tenantId: string, query: any = {}) {
    const where: any = { tenantId, isActive: true };
    if (query.technicianId) where.technicianId = query.technicianId;
    if (query.ticketId) where.ticketId = query.ticketId;
    if (query.status) where.status = query.status;
    if (query.priority) where.priority = query.priority;
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 50;
    const skip = (page - 1) * limit;
    const [rows, total] = await Promise.all([
      prisma.fieldServicePartRequest.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.fieldServicePartRequest.count({ where }),
    ]);
    const withTech = await this.attachTechnicians(tenantId, rows);
    const data = await this.attachTickets(tenantId, withTech);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getPartRequestById(tenantId: string, id: string) {
    const pr = await prisma.fieldServicePartRequest.findFirst({
      where: { tenantId, id },
    });
    if (!pr) throw new NotFoundException("Part request not found");
    const [withTech] = await this.attachTechnicians(tenantId, [pr]);
    const [result] = await this.attachTickets(tenantId, [withTech!]);
    return result;
  }

  async createPartRequest(tenantId: string, data: any) {
    const created = await prisma.fieldServicePartRequest.create({
      data: {
        ...data,
        tenantId,
        totalPrice:
          Number(data.unitPrice || 0) * Number(data.quantityRequested || 1),
      },
    });
    const [result] = await this.attachTechnicians(tenantId, [created]);
    return result;
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
    const rows = await prisma.fieldServiceVanStock.findMany({
      where,
      orderBy: { itemName: "asc" },
    });
    return this.attachTechnicians(tenantId, rows);
  }

  async getVanStockById(tenantId: string, id: string) {
    const vs = await prisma.fieldServiceVanStock.findFirst({
      where: { tenantId, id },
    });
    if (!vs) throw new NotFoundException("Van stock item not found");
    const [result] = await this.attachTechnicians(tenantId, [vs]);
    return result;
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
    const rows = await prisma.fieldServiceVanStock.findMany({
      where: {
        tenantId,
        isActive: true,
        quantityOnVan: { lte: prisma.fieldServiceVanStock.fields.reorderPoint },
      },
      orderBy: { quantityOnVan: "asc" },
    });
    return this.attachTechnicians(tenantId, rows);
  }
}
