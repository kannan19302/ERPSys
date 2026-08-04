import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";

@Injectable()
export class FieldServiceLogisticsService {
  // ── Van Inventory ──
  async getInventoryItems(tenantId: string, query: any = {}) {
    const where: any = { tenantId };
    if (query.status) where.status = query.status;
    if (query.category) where.category = query.category;
    if (query.search)
      where.name = { contains: query.search, mode: "insensitive" };
    if (query.sku) where.sku = { contains: query.sku, mode: "insensitive" };
    if (query.lowStock !== undefined) {
      where.minStockLevel = query.lowStock === "true" ? { gte: 0 } : undefined;
      if (query.lowStock === "true")
        where.quantityOnVan = {
          lte: prisma.fieldServiceInventoryItem.fields.minStockLevel,
        };
    }
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 50;
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      prisma.fieldServiceInventoryItem.findMany({
        where,
        orderBy: { name: "asc" },
        skip,
        take: limit,
      }),
      prisma.fieldServiceInventoryItem.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
  async getInventoryItemById(tenantId: string, id: string) {
    const item = await prisma.fieldServiceInventoryItem.findFirst({
      where: { tenantId, id },
    });
    if (!item) throw new NotFoundException("Inventory item not found");
    return item;
  }
  async createInventoryItem(tenantId: string, data: any) {
    return prisma.fieldServiceInventoryItem.create({
      data: { ...data, tenantId },
    });
  }
  async updateInventoryItem(tenantId: string, id: string, data: any) {
    const existing = await prisma.fieldServiceInventoryItem.findFirst({
      where: { tenantId, id },
    });
    if (!existing) throw new NotFoundException("Inventory item not found");
    return prisma.fieldServiceInventoryItem.update({ where: { id }, data });
  }
  async deleteInventoryItem(tenantId: string, id: string) {
    const existing = await prisma.fieldServiceInventoryItem.findFirst({
      where: { tenantId, id },
    });
    if (!existing) throw new NotFoundException("Inventory item not found");
    return prisma.fieldServiceInventoryItem.update({
      where: { id },
      data: { isActive: false },
    });
  }
  async restockItem(tenantId: string, id: string, quantity: number) {
    const existing = await prisma.fieldServiceInventoryItem.findFirst({
      where: { tenantId, id },
    });
    if (!existing) throw new NotFoundException("Inventory item not found");
    return prisma.fieldServiceInventoryItem.update({
      where: { id },
      data: {
        quantityOnVan: existing.quantityOnVan + quantity,
        lastRestocked: new Date(),
      },
    });
  }
  async transferStock(
    tenantId: string,
    id: string,
    fromVan: boolean,
    quantity: number,
  ) {
    const existing = await prisma.fieldServiceInventoryItem.findFirst({
      where: { tenantId, id },
    });
    if (!existing) throw new NotFoundException("Inventory item not found");
    if (fromVan) {
      if (existing.quantityOnVan < quantity)
        throw new Error("Insufficient van stock");
      return prisma.fieldServiceInventoryItem.update({
        where: { id },
        data: {
          quantityOnVan: existing.quantityOnVan - quantity,
          quantityWarehouse: existing.quantityWarehouse + quantity,
        },
      });
    }
    if (existing.quantityWarehouse < quantity)
      throw new Error("Insufficient warehouse stock");
    return prisma.fieldServiceInventoryItem.update({
      where: { id },
      data: {
        quantityWarehouse: existing.quantityWarehouse - quantity,
        quantityOnVan: existing.quantityOnVan + quantity,
      },
    });
  }
  async getLowStockItems(tenantId: string) {
    const items = await prisma.fieldServiceInventoryItem.findMany({
      where: { tenantId, isActive: true },
    });
    return items
      .filter((i) => i.quantityOnVan <= i.minStockLevel)
      .sort(
        (a, b) =>
          a.quantityOnVan / a.minStockLevel - b.quantityOnVan / b.minStockLevel,
      );
  }
  async getInventoryStats(tenantId: string) {
    const [total, inStock, lowStock, outOfStock, byCategory] =
      await Promise.all([
        prisma.fieldServiceInventoryItem.count({
          where: { tenantId, isActive: true },
        }),
        prisma.fieldServiceInventoryItem.count({
          where: { tenantId, status: "IN_STOCK", isActive: true },
        }),
        prisma.fieldServiceInventoryItem.count({
          where: { tenantId, status: "LOW_STOCK", isActive: true },
        }),
        prisma.fieldServiceInventoryItem.count({
          where: { tenantId, status: "OUT_OF_STOCK", isActive: true },
        }),
        prisma.fieldServiceInventoryItem.groupBy({
          by: ["category"],
          where: { tenantId, isActive: true },
          _count: true,
        }),
      ]);
    return { total, inStock, lowStock, outOfStock, byCategory };
  }
  async bulkUpdateInventory(tenantId: string, ids: string[], data: any) {
    return prisma.fieldServiceInventoryItem.updateMany({
      where: { tenantId, id: { in: ids } },
      data,
    });
  }

  // ── Parts Usage ──
  async getPartsUsage(tenantId: string, query: any = {}) {
    const where: any = { tenantId };
    if (query.ticketId) where.ticketId = query.ticketId;
    if (query.itemId) where.itemId = query.itemId;
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 50;
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      prisma.fieldServicePartsUsage.findMany({
        where,
        include: { ticket: { select: { id: true, title: true } } },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.fieldServicePartsUsage.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
  async createPartsUsage(tenantId: string, data: any) {
    const partsUsage = await prisma.fieldServicePartsUsage.create({
      data: { ...data, tenantId },
      include: { ticket: true },
    });
    if (data.itemId) {
      const item = await prisma.fieldServiceInventoryItem.findFirst({
        where: { tenantId, id: data.itemId },
      });
      if (item && item.quantityOnVan >= (data.quantity || 1)) {
        const newQty = item.quantityOnVan - (data.quantity || 1);
        const newStatus =
          newQty <= 0
            ? "OUT_OF_STOCK"
            : newQty <= item.minStockLevel
              ? "LOW_STOCK"
              : "IN_STOCK";
        await prisma.fieldServiceInventoryItem.update({
          where: { id: data.itemId },
          data: { quantityOnVan: newQty, status: newStatus },
        });
      }
    }
    return partsUsage;
  }
  async deletePartsUsage(tenantId: string, id: string) {
    const existing = await prisma.fieldServicePartsUsage.findFirst({
      where: { tenantId, id },
    });
    if (!existing) throw new NotFoundException("Parts usage not found");
    return prisma.fieldServicePartsUsage.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // ── Service Contracts ──
  async getContracts(tenantId: string, query: any = {}) {
    const where: any = { tenantId };
    if (query.status) where.status = query.status;
    if (query.billingType) where.billingType = query.billingType;
    if (query.slaLevel) where.slaLevel = query.slaLevel;
    if (query.search)
      where.customerName = { contains: query.search, mode: "insensitive" };
    if (query.autoRenewal !== undefined)
      where.autoRenewal = query.autoRenewal === "true";
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 50;
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      prisma.fieldServiceContract.findMany({
        where,
        include: { sla: { select: { id: true, name: true } } },
        orderBy: { startDate: "desc" },
        skip,
        take: limit,
      }),
      prisma.fieldServiceContract.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
  async getContractById(tenantId: string, id: string) {
    const contract = await prisma.fieldServiceContract.findFirst({
      where: { tenantId, id },
      include: { sla: true },
    });
    if (!contract) throw new NotFoundException("Contract not found");
    return contract;
  }
  async createContract(tenantId: string, data: any) {
    return prisma.fieldServiceContract.create({
      data: { ...data, tenantId },
      include: { sla: true },
    });
  }
  async updateContract(tenantId: string, id: string, data: any) {
    const existing = await prisma.fieldServiceContract.findFirst({
      where: { tenantId, id },
    });
    if (!existing) throw new NotFoundException("Contract not found");
    return prisma.fieldServiceContract.update({
      where: { id },
      data,
      include: { sla: true },
    });
  }
  async deleteContract(tenantId: string, id: string) {
    const existing = await prisma.fieldServiceContract.findFirst({
      where: { tenantId, id },
    });
    if (!existing) throw new NotFoundException("Contract not found");
    return prisma.fieldServiceContract.update({
      where: { id },
      data: { isActive: false, status: "CANCELLED" },
    });
  }
  async renewContract(tenantId: string, id: string, data: any) {
    const existing = await prisma.fieldServiceContract.findFirst({
      where: { tenantId, id },
    });
    if (!existing) throw new NotFoundException("Contract not found");
    await prisma.fieldServiceContract.update({
      where: { id },
      data: { status: "RENEWED", isActive: false },
    });
    return prisma.fieldServiceContract.create({
      data: {
        tenantId,
        customerName: existing.customerName,
        customerEmail: existing.customerEmail,
        customerPhone: existing.customerPhone,
        startDate: data.startDate || existing.endDate,
        endDate: data.endDate,
        scopeOfWork: data.scopeOfWork || existing.scopeOfWork,
        billingType: data.billingType || existing.billingType,
        billingFrequency: data.billingFrequency || existing.billingFrequency,
        contractValue: data.contractValue || existing.contractValue,
        monthlyRecurring: data.monthlyRecurring || existing.monthlyRecurring,
        slaLevel: data.slaLevel || existing.slaLevel,
        slaId: data.slaId || existing.slaId,
        autoRenewal:
          data.autoRenewal !== undefined
            ? data.autoRenewal
            : existing.autoRenewal,
      },
      include: { sla: true },
    });
  }
  async getExpiringContracts(tenantId: string, days: number = 30) {
    const threshold = new Date();
    threshold.setDate(threshold.getDate() + days);
    return prisma.fieldServiceContract.findMany({
      where: { tenantId, status: "ACTIVE", endDate: { lte: threshold } },
      include: { sla: true },
      orderBy: { endDate: "asc" },
    });
  }
  async getContractStats(tenantId: string) {
    const [active, expiring, byType, totalValue] = await Promise.all([
      prisma.fieldServiceContract.count({
        where: { tenantId, status: "ACTIVE" },
      }),
      prisma.fieldServiceContract.count({
        where: {
          tenantId,
          status: "ACTIVE",
          endDate: { lte: new Date(Date.now() + 30 * 86400000) },
        },
      }),
      prisma.fieldServiceContract.groupBy({
        by: ["billingType"],
        where: { tenantId, status: "ACTIVE" },
        _count: true,
        _sum: { monthlyRecurring: true },
      }),
      prisma.fieldServiceContract.aggregate({
        where: { tenantId, status: "ACTIVE" },
        _sum: { contractValue: true },
      }),
    ]);
    return {
      active,
      expiring,
      byType,
      totalContractValue: totalValue._sum.contractValue || 0,
    };
  }

  // ── Timesheets ──
  async getTimesheets(tenantId: string, query: any = {}) {
    const where: any = { tenantId };
    if (query.ticketId) where.ticketId = query.ticketId;
    if (query.technicianId) where.technicianId = query.technicianId;
    if (query.status) where.status = query.status;
    if (query.fromDate) where.dateWorked = { gte: new Date(query.fromDate) };
    if (query.toDate)
      where.dateWorked = { ...where.dateWorked, lte: new Date(query.toDate) };
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 50;
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      prisma.fieldServiceTimesheet.findMany({
        where,
        include: {
          ticket: { select: { id: true, title: true } },
          technician: { select: { id: true, name: true } },
        },
        orderBy: { dateWorked: "desc" },
        skip,
        take: limit,
      }),
      prisma.fieldServiceTimesheet.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
  async getTimesheetById(tenantId: string, id: string) {
    const ts = await prisma.fieldServiceTimesheet.findFirst({
      where: { tenantId, id },
      include: { ticket: true, technician: true },
    });
    if (!ts) throw new NotFoundException("Timesheet not found");
    return ts;
  }
  async createTimesheet(tenantId: string, data: any) {
    const hoursWorked = data.hoursWorked || 0;
    const overtimeHours = data.overtimeHours || 0;
    const travelTime = data.travelTime || 0;
    const hourlyRate = data.hourlyRate || 0;
    const overtimeRate = data.overtimeRate || 0;
    const totalPay = hoursWorked * hourlyRate + overtimeHours * overtimeRate;
    const billableHours = hoursWorked + travelTime;
    const billableAmount = billableHours * hourlyRate;
    return prisma.fieldServiceTimesheet.create({
      data: { ...data, tenantId, totalPay, billableHours, billableAmount },
      include: { ticket: true, technician: true },
    });
  }
  async updateTimesheet(tenantId: string, id: string, data: any) {
    const existing = await prisma.fieldServiceTimesheet.findFirst({
      where: { tenantId, id },
    });
    if (!existing) throw new NotFoundException("Timesheet not found");
    return prisma.fieldServiceTimesheet.update({
      where: { id },
      data,
      include: { ticket: true, technician: true },
    });
  }
  async deleteTimesheet(tenantId: string, id: string) {
    const existing = await prisma.fieldServiceTimesheet.findFirst({
      where: { tenantId, id },
    });
    if (!existing) throw new NotFoundException("Timesheet not found");
    return prisma.fieldServiceTimesheet.update({
      where: { id },
      data: { isActive: false },
    });
  }
  async approveTimesheet(tenantId: string, id: string, approvedBy: string) {
    const existing = await prisma.fieldServiceTimesheet.findFirst({
      where: { tenantId, id },
    });
    if (!existing) throw new NotFoundException("Timesheet not found");
    return prisma.fieldServiceTimesheet.update({
      where: { id },
      data: { status: "APPROVED", approvedBy, approvedAt: new Date() },
    });
  }
  async rejectTimesheet(tenantId: string, id: string) {
    const existing = await prisma.fieldServiceTimesheet.findFirst({
      where: { tenantId, id },
    });
    if (!existing) throw new NotFoundException("Timesheet not found");
    return prisma.fieldServiceTimesheet.update({
      where: { id },
      data: { status: "REJECTED" },
    });
  }
  async getTimesheetStats(
    tenantId: string,
    fromDate?: string,
    toDate?: string,
  ) {
    const where: any = { tenantId, status: "APPROVED" };
    if (fromDate) where.dateWorked = { gte: new Date(fromDate) };
    if (toDate)
      where.dateWorked = { ...where.dateWorked, lte: new Date(toDate) };
    const [totalHours, totalBillable, totalPay, byTechnician] =
      await Promise.all([
        prisma.fieldServiceTimesheet.aggregate({
          where,
          _sum: { hoursWorked: true, overtimeHours: true, travelTime: true },
        }),
        prisma.fieldServiceTimesheet.aggregate({
          where,
          _sum: { billableAmount: true },
        }),
        prisma.fieldServiceTimesheet.aggregate({
          where,
          _sum: { totalPay: true },
        }),
        prisma.fieldServiceTimesheet.groupBy({
          by: ["technicianId"],
          where,
          _sum: { hoursWorked: true, billableAmount: true },
        }),
      ]);
    return {
      totalHours: totalHours._sum.hoursWorked || 0,
      overtimeHours: totalHours._sum.overtimeHours || 0,
      travelTime: totalHours._sum.travelTime || 0,
      totalBillable: totalBillable._sum.billableAmount || 0,
      totalPay: totalPay._sum.totalPay || 0,
      byTechnician,
    };
  }
  async generateInvoiceFromTimesheets(tenantId: string, ticketId: string) {
    const timesheets = await prisma.fieldServiceTimesheet.findMany({
      where: { tenantId, ticketId, status: "APPROVED" },
    });
    if (!timesheets.length)
      throw new NotFoundException(
        "No approved timesheets found for this ticket",
      );
    const totalBillable = timesheets.reduce(
      (s, t) => s + Number(t.billableAmount),
      0,
    );
    await prisma.fieldServiceTimesheet.updateMany({
      where: { tenantId, ticketId, status: "APPROVED" },
      data: { status: "BILLED" },
    });
    await prisma.fieldServiceTicket.update({
      where: { id: ticketId },
      data: { invoiced: true, laborCost: totalBillable },
    });
    return { ticketId, totalBillable, timesheetsBilled: timesheets.length };
  }
}
