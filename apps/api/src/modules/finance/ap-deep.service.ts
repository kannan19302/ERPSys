import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";
import { Prisma } from "@prisma/client";
import {
  buildPaginationValues,
  buildOrderBy,
  paginatedResult,
  PaginatedResult,
  PaginationParams,
} from "../../common/utils/pagination.util";

@Injectable()
export class ApDeepService {
  async getInvoiceMatching(
    tenantId: string,
    params: PaginationParams & { status?: string } = {},
  ): Promise<PaginatedResult<any>> {
    const where: any = { tenantId, deletedAt: null, type: "PURCHASE" };
    if (params.status) where.status = params.status;
    if (params.search)
      where.OR = [
        { invoiceNumber: { contains: params.search, mode: "insensitive" } },
        { vendor: { name: { contains: params.search, mode: "insensitive" } } },
      ];
    const { skip, take } = buildPaginationValues(params);
    const orderBy = buildOrderBy(params.sort);
    const [data, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip,
        take,
        orderBy,
        include: { customer: true },
      }),
      prisma.invoice.count({ where }),
    ]);
    const enriched = data.map((inv: any) => ({
      ...inv,
      matchStatus: this.computeMatchStatus(inv),
      matchVariance: 0,
    }));
    return paginatedResult(enriched, total, params);
  }

  private computeMatchStatus(invoice: any): string {
    if (invoice.status === "PAID") return "MATCHED";
    if (invoice.status === "DRAFT") return "PENDING";
    return "PARTIAL";
  }

  async getMatchingStats(tenantId: string) {
    const invoices = await prisma.invoice.findMany({
      where: { tenantId, deletedAt: null },
      select: { id: true, totalAmount: true, paidAmount: true, status: true },
    });
    const totalMatchable = invoices.length;
    const matched = invoices.filter((i: any) => i.status === "PAID").length;
    const unmatched = invoices.filter(
      (i: any) => i.status === "DRAFT" || i.status === "SENT",
    ).length;
    const pendingApproval = invoices.filter(
      (i: any) => i.status === "APPROVED_PENDING",
    ).length;
    const totalInvoiceAmount = invoices.reduce(
      (s: number, i: any) => s + Number(i.totalAmount),
      0,
    );
    const totalPaidAmount = invoices.reduce(
      (s: number, i: any) => s + Number(i.paidAmount || 0),
      0,
    );
    return {
      totalMatchable,
      matched,
      unmatched,
      pendingApproval,
      matchRate: totalMatchable
        ? ((matched / totalMatchable) * 100).toFixed(1)
        : "0.0",
      totalInvoiceAmount,
      totalPaidAmount,
      totalUnmatchedAmount: totalInvoiceAmount - totalPaidAmount,
    };
  }

  async getVendorBills(
    tenantId: string,
    params: PaginationParams & { status?: string; vendorId?: string } = {},
  ): Promise<PaginatedResult<any>> {
    const where: any = { tenantId, deletedAt: null };
    if (params.status) where.status = params.status;
    if (params.vendorId) where.customerId = params.vendorId;
    if (params.search)
      where.OR = [
        { invoiceNumber: { contains: params.search, mode: "insensitive" } },
        {
          customer: { name: { contains: params.search, mode: "insensitive" } },
        },
      ];
    const { skip, take } = buildPaginationValues(params);
    const orderBy = buildOrderBy(params.sort);
    const [data, total] = await Promise.all([
      prisma.invoice.findMany({
        where: { ...where, type: "PURCHASE" },
        skip,
        take,
        orderBy,
        include: { customer: true },
      }),
      prisma.invoice.count({ where: { ...where, type: "PURCHASE" } }),
    ]);
    return paginatedResult(data, total, params);
  }

  async getApApprovalQueue(
    tenantId: string,
    params: PaginationParams & { status?: string } = {},
  ): Promise<PaginatedResult<any>> {
    const where: any = {
      tenantId,
      deletedAt: null,
      status: params.status || "APPROVED_PENDING",
    };
    const { skip, take } = buildPaginationValues(params);
    const orderBy = buildOrderBy(params.sort);
    const [data, total] = await Promise.all([
      prisma.invoice.findMany({
        where: { ...where, type: "PURCHASE" },
        skip,
        take,
        orderBy,
        include: { customer: true },
      }),
      prisma.invoice.count({ where: { ...where, type: "PURCHASE" } }),
    ]);
    return paginatedResult(data, total, params);
  }

  async approveVendorBill(
    tenantId: string,
    invoiceId: string,
    _approvedBy: string,
  ) {
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, tenantId },
    });
    if (!invoice) throw new NotFoundException("Invoice not found");
    return prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: "APPROVED", updatedAt: new Date() },
    });
  }

  async rejectVendorBill(tenantId: string, invoiceId: string, reason: string) {
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, tenantId },
    });
    if (!invoice) throw new NotFoundException("Invoice not found");
    return prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: "REJECTED", notes: reason, updatedAt: new Date() } as any,
    });
  }

  async getPaymentSchedule(
    tenantId: string,
    params: PaginationParams & { status?: string; vendorId?: string } = {},
  ): Promise<PaginatedResult<any>> {
    const where: any = {
      tenantId,
      deletedAt: null,
      status: { notIn: ["PAID", "CANCELLED", "DRAFT"] },
    };
    if (params.status) where.status = params.status;
    if (params.vendorId) where.customerId = params.vendorId;
    const { skip, take } = buildPaginationValues(params);
    const orderBy = [{ dueDate: "asc" as const }];
    const [data, total] = await Promise.all([
      prisma.invoice.findMany({
        where: { ...where, type: "PURCHASE" },
        skip,
        take,
        orderBy,
        include: { customer: true },
      }),
      prisma.invoice.count({ where: { ...where, type: "PURCHASE" } }),
    ]);
    return paginatedResult(data, total, params);
  }

  async getPaymentBatches(
    tenantId: string,
    params: PaginationParams = {},
  ): Promise<PaginatedResult<any>> {
    const where: any = { tenantId };
    const { skip, take } = buildPaginationValues(params);
    const orderBy = buildOrderBy(params.sort);
    const [data, total] = await Promise.all([
      prisma.paymentBatch.findMany({
        where,
        skip,
        take,
        orderBy,
        include: { lines: true },
      }),
      prisma.paymentBatch.count({ where }),
    ]);
    return paginatedResult(data, total, params);
  }

  async createPaymentBatch(
    tenantId: string,
    data: {
      batchNumber: string;
      createdBy: string;
      lines?: {
        invoiceId: string;
        amount: number;
        scheduledPaymentDate: string;
      }[];
    },
  ) {
    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const batch = await tx.paymentBatch.create({
        data: {
          tenantId,
          batchNumber: data.batchNumber,
          status: "DRAFT",
          createdBy: data.createdBy,
        } as any,
      });
      if (data.lines?.length) {
        for (const line of data.lines) {
          await tx.paymentBatchLine.create({
            data: {
              tenantId,
              batchId: batch.id,
              invoiceId: line.invoiceId,
              amount: line.amount,
              scheduledPaymentDate: new Date(line.scheduledPaymentDate),
              status: "INCLUDED",
            } as any,
          });
        }
      }
      return tx.paymentBatch.findUnique({
        where: { id: batch.id },
        include: { lines: true },
      });
    });
  }

  async submitPaymentBatch(
    tenantId: string,
    batchId: string,
    submittedBy: string,
  ) {
    const batch = await prisma.paymentBatch.findFirst({
      where: { id: batchId, tenantId },
    });
    if (!batch) throw new NotFoundException("Payment batch not found");
    return prisma.paymentBatch.update({
      where: { id: batchId },
      data: {
        status: "SUBMITTED",
        submittedAt: new Date(),
        submittedBy,
      } as any,
    });
  }

  async getVendorStatementReconciliation(tenantId: string, vendorId: string) {
    const invoices = await prisma.invoice.findMany({
      where: { tenantId, customerId: vendorId, deletedAt: null },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        invoiceNumber: true,
        totalAmount: true,
        paidAmount: true,
        status: true,
        issueDate: true,
        dueDate: true,
        paidAt: true,
      },
    });
    const totalBilled = invoices.reduce(
      (s: number, i: any) => s + Number(i.totalAmount),
      0,
    );
    const totalPaid = invoices.reduce(
      (s: number, i: any) => s + Number(i.paidAmount || 0),
      0,
    );
    const outstanding = totalBilled - totalPaid;
    return {
      vendorId,
      totalBilled,
      totalPaid,
      outstandingBalance: outstanding,
      invoiceCount: invoices.length,
      invoices,
      statementDate: new Date().toISOString(),
    };
  }

  async getApAnalytics(tenantId: string) {
    const invoices = await prisma.invoice.findMany({
      where: { tenantId, deletedAt: null },
      select: {
        totalAmount: true,
        paidAmount: true,
        status: true,
        dueDate: true,
      },
    });
    const totalPayables = invoices.reduce(
      (s: number, i: any) =>
        s + Number(i.totalAmount) - Number(i.paidAmount || 0),
      0,
    );
    const overdue = invoices.filter(
      (i: any) =>
        i.status !== "PAID" &&
        i.status !== "CANCELLED" &&
        i.dueDate &&
        new Date(i.dueDate) < new Date(),
    );
    const overdueAmount = overdue.reduce(
      (s: number, i: any) =>
        s + Number(i.totalAmount) - Number(i.paidAmount || 0),
      0,
    );
    return {
      totalPayables,
      overdueAmount,
      overdueCount: overdue.length,
      totalBilled: invoices.reduce(
        (s: number, i: any) => s + Number(i.totalAmount),
        0,
      ),
      invoiceCount: invoices.length,
    };
  }
}
