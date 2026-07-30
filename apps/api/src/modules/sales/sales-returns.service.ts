// @ts-nocheck
import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class SalesReturnsService {
  async listReturns(tenantId: string, status?: string, customerId?: string) {
    const where: any = { tenantId };
    if (status) where.status = status;
    if (customerId) where.customerId = customerId;

    return prisma.salesReturn.findMany({
      where,
      include: { lineItems: true, customer: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async getReturn(tenantId: string, id: string) {
    const record = await prisma.salesReturn.findFirst({
      where: { id, tenantId },
      include: { lineItems: true, customer: true, salesOrder: true },
    });
    if (!record) throw new NotFoundException("Sales return not found");
    return record;
  }

  async createReturn(tenantId: string, data: any, userId: string) {
    const count = await prisma.salesReturn.count({ where: { tenantId } });
    const returnNumber =
      data.returnNumber ||
      `SR-${new Date().getFullYear()}-${String(count + 1).padStart(5, "0")}`;
    const orgId = data.orgId || "org-system-default";

    return prisma.salesReturn.create({
      data: {
        tenantId,
        orgId,
        customerId: data.customerId,
        salesOrderId: data.salesOrderId,
        deliveryNoteId: data.deliveryNoteId || null,
        returnNumber,
        status: data.status || "DRAFT",
        returnDate: data.returnDate ? new Date(data.returnDate) : new Date(),
        subtotal: data.subtotal || 0,
        taxAmount: data.taxAmount || 0,
        totalAmount: data.totalAmount || 0,
        reason: data.reason || null,
        createdBy: userId,
        lineItems: data.lineItems
          ? {
              create: data.lineItems.map((item: any) => ({
                tenantId,
                productId: item.productId || null,
                description: item.description || "",
                quantity: item.quantity || 0,
                unitPrice: item.unitPrice || 0,
                taxRate: item.taxRate || 0,
                taxAmount: item.taxAmount || 0,
                totalAmount: item.totalAmount || 0,
              })),
            }
          : undefined,
      },
      include: { lineItems: true },
    });
  }

  async processReturn(tenantId: string, id: string, action: string, userId: string) {
    const record = await this.getReturn(tenantId, id);

    const validTransitions: Record<string, string[]> = {
      DRAFT: ["SUBMITTED", "CANCELLED"],
      SUBMITTED: ["APPROVED", "REJECTED"],
      APPROVED: ["RECEIVED", "CANCELLED"],
      RECEIVED: ["INSPECTED", "REFUNDED"],
      INSPECTED: ["REFUNDED", "PARTIALLY_REFUNDED"],
    };

    const allowed = validTransitions[record.status];
    if (!allowed || !allowed.includes(action)) {
      throw new BadRequestException(
        `Cannot transition from ${record.status} to ${action}`,
      );
    }

    return prisma.salesReturn.update({
      where: { id },
      data: { status: action, createdBy: userId },
    });
  }

  async approveReturn(tenantId: string, id: string, userId: string) {
    return this.processReturn(tenantId, id, "APPROVED", userId);
  }

  async rejectReturn(tenantId: string, id: string, reason: string, userId: string) {
    const record = await this.getReturn(tenantId, id);
    return prisma.salesReturn.update({
      where: { id },
      data: { status: "CANCELLED", reason: reason || record.reason },
    });
  }

  async listReturnReasons(tenantId: string) {
    return prisma.returnReasonCode.findMany({
      where: { tenantId, isActive: true },
      orderBy: { code: "asc" },
    });
  }

  async createReturnReason(tenantId: string, data: { code: string; label: string; type: string }) {
    return prisma.returnReasonCode.create({
      data: {
        tenantId,
        code: data.code,
        name: data.label,
        description: data.type || null,
        isActive: true,
      },
    });
  }

  async listRMAs(tenantId: string, status?: string) {
    const where: any = { tenantId };
    if (status) where.status = status;

    return prisma.returnMerchandiseAuthorization.findMany({
      where,
      include: { lines: true, inspection: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async createRMA(tenantId: string, data: any, userId: string) {
    const count = await prisma.returnMerchandiseAuthorization.count({
      where: { tenantId },
    });
    const rmaNumber =
      data.rmaNumber ||
      `RMA-${new Date().getFullYear()}-${String(count + 1).padStart(5, "0")}`;

    return prisma.returnMerchandiseAuthorization.create({
      data: {
        tenantId,
        rmaNumber,
        status: data.status || "REQUESTED",
        source: data.source || "CUSTOMER",
        customerId: data.customerId || null,
        customerName: data.customerName || null,
        vendorId: data.vendorId || null,
        vendorName: data.vendorName || null,
        salesOrderId: data.salesOrderId || null,
        salesOrderNumber: data.salesOrderNumber || null,
        returnReason: data.returnReason || null,
        returnType: data.returnType || null,
        priority: data.priority || "MEDIUM",
        warehouseId: data.warehouseId || null,
        warehouseName: data.warehouseName || null,
        totalQty: data.totalQty || null,
        totalValue: data.totalValue || null,
        currency: data.currency || "USD",
        returnTrackingNumber: data.returnTrackingNumber || null,
        notes: data.notes || null,
        createdBy: userId,
        lines: data.lines
          ? {
              create: data.lines.map((line: any) => ({
                tenantId,
                productId: line.productId || null,
                productSku: line.productSku || null,
                productName: line.productName || null,
                expectedQty: line.expectedQty || 0,
                uom: line.uom || "EA",
                unitValue: line.unitValue || null,
                totalValue: line.totalValue || null,
                condition: line.condition || null,
                notes: line.notes || null,
              })),
            }
          : undefined,
      },
      include: { lines: true },
    });
  }

  async rmaReceiveItem(tenantId: string, rmaId: string, lineId: string, condition: string, userId: string) {
    const rma = await prisma.returnMerchandiseAuthorization.findFirst({
      where: { id: rmaId, tenantId },
    });
    if (!rma) throw new NotFoundException("RMA not found");

    const line = await prisma.rMALine.findFirst({
      where: { id: lineId, rmaId, tenantId },
    });
    if (!line) throw new NotFoundException("RMA line not found");

    const updated = await prisma.rMALine.update({
      where: { id: lineId },
      data: { receivedQty: line.expectedQty, condition },
    });

    await prisma.rMAInspection.upsert({
      where: { rmaId },
      create: { tenantId, rmaId, inspectorId: userId, inspectionDate: new Date(), overallCondition: condition },
      update: { overallCondition: condition, inspectorId: userId },
    });

    return updated;
  }

  async createCreditNote(tenantId: string, returnId: string, data: any, userId: string) {
    const salesReturn = await this.getReturn(tenantId, returnId);
    const count = await prisma.creditNote.count({ where: { tenantId } });
    const noteNumber =
      data.noteNumber ||
      `CN-${new Date().getFullYear()}-${String(count + 1).padStart(5, "0")}`;
    const orgId = data.orgId || "org-system-default";

    const creditNote = await prisma.creditNote.create({
      data: {
        tenantId,
        orgId,
        customerId: salesReturn.customerId,
        invoiceId: data.invoiceId || null,
        noteNumber,
        amount: data.amount || salesReturn.totalAmount,
        lineItems: data.lineItems || null,
        reason: data.reason || salesReturn.reason || null,
        status: data.status || "DRAFT",
        issueDate: data.issueDate ? new Date(data.issueDate) : new Date(),
        createdBy: userId,
      },
    });

    await prisma.salesReturn.update({
      where: { id: returnId },
      data: { creditNoteId: creditNote.id, status: "REFUNDED" },
    });

    return creditNote;
  }

  async listCreditNotes(tenantId: string, customerId?: string) {
    const where: any = { tenantId };
    if (customerId) where.customerId = customerId;

    return prisma.creditNote.findMany({
      where,
      include: { customer: true, invoice: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async getReturnAnalytics(tenantId: string, period?: string) {
    const where: any = { tenantId };
    if (period) {
      const start = new Date();
      if (period === "7d") start.setDate(start.getDate() - 7);
      else if (period === "30d") start.setDate(start.getDate() - 30);
      else if (period === "90d") start.setDate(start.getDate() - 90);
      else if (period === "1y") start.setFullYear(start.getFullYear() - 1);
      where.createdAt = { gte: start };
    }

    const returns = await prisma.salesReturn.findMany({ where });
    const totalReturns = returns.length;
    const totalRefundAmount = returns.reduce(
      (sum, r) => sum + Number(r.totalAmount),
      0,
    );

    const reasonBreakdown: Record<string, number> = {};
    returns.forEach((r) => {
      const key = r.reason || "UNSPECIFIED";
      reasonBreakdown[key] = (reasonBreakdown[key] || 0) + 1;
    });

    const statusBreakdown: Record<string, number> = {};
    returns.forEach((r) => {
      statusBreakdown[r.status] = (statusBreakdown[r.status] || 0) + 1;
    });

    return {
      totalReturns,
      totalRefundAmount,
      reasonBreakdown,
      statusBreakdown,
    };
  }
}
