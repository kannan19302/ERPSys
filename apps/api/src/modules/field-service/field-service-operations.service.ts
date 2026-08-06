import { Injectable, NotFoundException, Optional } from "@nestjs/common";
import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";

@Injectable()
export class FieldServiceOperationsService {
  private readonly prisma: typeof prisma;

  /**
   * Injectable so this service can be unit-tested. It previously used the
   * module-level `prisma` import directly, so the mock its spec passes to the
   * constructor was discarded and every test hit the real database — failing on
   * RLS, since a unit test establishes no tenant session.
   *
   * `@Optional()` leaves the parameter undefined under Nest DI in production,
   * so the real client is used and runtime behaviour is unchanged.
   */
  constructor(@Optional() client?: typeof prisma) {
    this.prisma = client ?? prisma;
  }
  // ── WARRANTIES ──
  async getWarranties(
    tenantId: string,
    query: { assetId?: string; status?: string },
  ) {
    const where: any = { tenantId };
    if (query.assetId) where.assetId = query.assetId;
    if (query.status) where.status = query.status;

    return this.prisma.fieldServiceWarranty.findMany({
      where,
      orderBy: { endDate: "asc" },
    });
  }

  async createWarranty(tenantId: string, data: any) {
    const warrantyNo = `WRN-${Date.now().toString().slice(-6)}`;
    return this.prisma.fieldServiceWarranty.create({
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

    return this.prisma.fieldServiceWorkOrderExpense.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
  }

  async createWorkOrderExpense(tenantId: string, data: any) {
    return this.prisma.fieldServiceWorkOrderExpense.create({
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

    return this.prisma.fieldServiceInspectionChecklist.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
  }

  async createInspectionChecklist(tenantId: string, data: any) {
    return this.prisma.fieldServiceInspectionChecklist.create({
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
