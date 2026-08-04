import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";

@Injectable()
export class FieldServiceOperationsService {
  // ── WARRANTIES ──
  async getWarranties(
    tenantId: string,
    query: { assetId?: string; status?: string },
  ) {
    const where: any = { tenantId };
    if (query.assetId) where.assetId = query.assetId;
    if (query.status) where.status = query.status;

    return prisma.fieldServiceWarranty.findMany({
      where,
      orderBy: { endDate: "asc" },
    });
  }

  async createWarranty(tenantId: string, data: any) {
    const warrantyNo = `WRN-${Date.now().toString().slice(-6)}`;
    return prisma.fieldServiceWarranty.create({
      data: {
        tenantId,
        assetId: data.assetId,
        warrantyNo,
        provider: data.provider,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        coverageDetails: data.coverageDetails,
        status: "ACTIVE",
      },
    });
  }

  // ── WORK ORDER EXPENSES ──
  async getWorkOrderExpenses(
    tenantId: string,
    query: { workOrderId?: string; techId?: string },
  ) {
    const where: any = { tenantId };
    if (query.workOrderId) where.workOrderId = query.workOrderId;
    if (query.techId) where.techId = query.techId;

    return prisma.fieldServiceWorkOrderExpense.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
  }

  async createWorkOrderExpense(tenantId: string, data: any) {
    return prisma.fieldServiceWorkOrderExpense.create({
      data: {
        tenantId,
        workOrderId: data.workOrderId,
        techId: data.techId,
        category: data.category || "MISC",
        amount: data.amount,
        receiptUrl: data.receiptUrl,
        status: "PENDING",
      },
    });
  }

  // ── INSPECTION CHECKLISTS ──
  async getInspectionChecklists(
    tenantId: string,
    query: { workOrderId?: string },
  ) {
    const where: any = { tenantId };
    if (query.workOrderId) where.workOrderId = query.workOrderId;

    return prisma.fieldServiceInspectionChecklist.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
  }

  async createInspectionChecklist(tenantId: string, data: any) {
    return prisma.fieldServiceInspectionChecklist.create({
      data: {
        tenantId,
        workOrderId: data.workOrderId,
        title: data.title,
        items: data.items || [],
        status: "IN_PROGRESS",
      },
    });
  }
}
