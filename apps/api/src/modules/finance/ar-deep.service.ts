import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";
import {
  buildPaginationValues,
  buildOrderBy,
  paginatedResult,
  PaginatedResult,
  PaginationParams,
} from "../../common/utils/pagination.util";

@Injectable()
export class ArDeepService {
  async getCollectionsQueue(
    tenantId: string,
    params: PaginationParams & { status?: string; customerId?: string } = {},
  ): Promise<PaginatedResult<any>> {
    const where: any = { tenantId, deletedAt: null };
    if (params.status) where.status = params.status;
    if (params.customerId) where.customerId = params.customerId;
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
        where,
        skip,
        take,
        orderBy,
        include: { customer: true },
      }),
      prisma.invoice.count({ where }),
    ]);
    return paginatedResult(data, total, params);
  }

  async getCollectionsStats(tenantId: string) {
    const invoices = await prisma.invoice.findMany({
      where: { tenantId, deletedAt: null },
      select: {
        id: true,
        totalAmount: true,
        paidAmount: true,
        status: true,
        dueDate: true,
      },
    });
    const overdue = invoices.filter(
      (i: any) =>
        i.status !== "PAID" &&
        i.status !== "CANCELLED" &&
        i.dueDate &&
        new Date(i.dueDate) < new Date(),
    );
    const totalOverdue = overdue.reduce(
      (sum: number, i: any) =>
        sum + Number(i.totalAmount) - Number(i.paidAmount || 0),
      0,
    );
    const agingBuckets: Record<string, number> = {
      "0-30": 0,
      "31-60": 0,
      "61-90": 0,
      "90+": 0,
    };
    const now = new Date();
    overdue.forEach((i: any) => {
      const days = Math.floor(
        (now.getTime() - new Date(i.dueDate).getTime()) / 86400000,
      );
      const bal = Number(i.totalAmount) - Number(i.paidAmount || 0);
      const key =
        days <= 30
          ? "0-30"
          : days <= 60
            ? "31-60"
            : days <= 90
              ? "61-90"
              : "90+";
      agingBuckets[key] = (agingBuckets[key] || 0) + bal;
    });
    const totalOutstanding = invoices.reduce(
      (s: number, i: any) =>
        s + Number(i.totalAmount) - Number(i.paidAmount || 0),
      0,
    );
    return {
      totalOverdue,
      overdueCount: overdue.length,
      totalOutstanding,
      agingBuckets,
      collectionEfficiency: invoices.length
        ? (
            ((invoices.length - overdue.length) / invoices.length) *
            100
          ).toFixed(1)
        : "100.0",
    };
  }

  async getCreditManagement(
    tenantId: string,
    params: PaginationParams & { riskRating?: string } = {},
  ): Promise<PaginatedResult<any>> {
    const where: any = { tenantId, deletedAt: null };
    if (params.riskRating) where.riskRating = params.riskRating;
    if (params.search)
      where.OR = [
        { name: { contains: params.search, mode: "insensitive" } },
        { email: { contains: params.search, mode: "insensitive" } },
      ];
    const { skip, take } = buildPaginationValues(params);
    const orderBy = buildOrderBy(params.sort);
    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take,
        orderBy,
        include: { _count: { select: { invoices: true } } },
      }),
      prisma.customer.count({ where }),
    ]);
    return paginatedResult(customers, total, params);
  }

  async setCreditLimit(
    tenantId: string,
    customerId: string,
    creditLimit: number,
  ) {
    const c = await prisma.customer.findFirst({
      where: { id: customerId, tenantId },
    });
    if (!c) throw new NotFoundException("Customer not found");
    return prisma.customer.update({
      where: { id: customerId },
      data: { creditLimit },
    });
  }

  async placeCreditHold(tenantId: string, customerId: string, reason: string) {
    const c = await prisma.customer.findFirst({
      where: { id: customerId, tenantId },
    });
    if (!c) throw new NotFoundException("Customer not found");
    return prisma.customer.update({
      where: { id: customerId },
      data: { creditHold: true, creditHoldReason: reason },
    });
  }

  async releaseCreditHold(tenantId: string, customerId: string) {
    const c = await prisma.customer.findFirst({
      where: { id: customerId, tenantId },
    });
    if (!c) throw new NotFoundException("Customer not found");
    return prisma.customer.update({
      where: { id: customerId },
      data: { creditHold: false, creditHoldReason: null },
    });
  }

  async getPromiseToPay(
    tenantId: string,
    params: PaginationParams & { status?: string } = {},
  ): Promise<PaginatedResult<any>> {
    const where: any = { tenantId };
    if (params.status) where.status = params.status;
    const { skip, take } = buildPaginationValues(params);
    const orderBy = buildOrderBy(params.sort);
    const [data, total] = await Promise.all([
      prisma.aRPromiseToPay.findMany({ where, skip, take, orderBy }),
      prisma.aRPromiseToPay.count({ where }),
    ]);
    return paginatedResult(data, total, params);
  }

  async createPromiseToPay(
    tenantId: string,
    data: {
      customerId: string;
      invoiceId: string;
      promisedDate: string;
      promisedAmount: number;
      notes?: string;
      collectorId?: string;
    },
  ) {
    const invoice = await prisma.invoice.findFirst({
      where: { id: data.invoiceId, tenantId },
    });
    if (!invoice) throw new NotFoundException("Invoice not found");
    return prisma.aRPromiseToPay.create({
      data: {
        tenantId,
        customerId: data.customerId,
        invoiceId: data.invoiceId,
        promisedDate: new Date(data.promisedDate),
        promisedAmount: data.promisedAmount,
        notes: data.notes || null,
        collectorId: data.collectorId || null,
        status: "PROMISED",
        openedBy: data.collectorId || "",
      } as any,
    });
  }

  async fulfillPromiseToPay(
    tenantId: string,
    promiseId: string,
    receivedAmount?: number,
  ) {
    const promise = await prisma.aRPromiseToPay.findFirst({
      where: { id: promiseId, tenantId },
    });
    if (!promise) throw new NotFoundException("Promise not found");
    const status =
      receivedAmount && receivedAmount < Number(promise.promisedAmount)
        ? "PARTIAL"
        : "KEPT";
    return prisma.aRPromiseToPay.update({
      where: { id: promiseId },
      data: {
        status,
        receivedAmount: receivedAmount || promise.promisedAmount,
      } as any,
    });
  }

  async getArDisputes(
    tenantId: string,
    params: PaginationParams & { status?: string } = {},
  ): Promise<PaginatedResult<any>> {
    const where: any = { tenantId };
    if (params.status) where.status = params.status;
    const { skip, take } = buildPaginationValues(params);
    const orderBy = buildOrderBy(params.sort);
    const [data, total] = await Promise.all([
      prisma.aRDispute.findMany({ where, skip, take, orderBy }),
      prisma.aRDispute.count({ where }),
    ]);
    return paginatedResult(data, total, params);
  }

  async createArDispute(
    tenantId: string,
    data: {
      invoiceId: string;
      customerId: string;
      reason: string;
      disputedAmount: number;
      notes?: string;
      openedBy: string;
      assignedTo?: string;
    },
  ) {
    const invoice = await prisma.invoice.findFirst({
      where: { id: data.invoiceId, tenantId },
    });
    if (!invoice) throw new NotFoundException("Invoice not found");
    return prisma.aRDispute.create({
      data: {
        tenantId,
        invoiceId: data.invoiceId,
        customerId: data.customerId,
        reason: data.reason,
        disputedAmount: data.disputedAmount,
        notes: data.notes || null,
        openedBy: data.openedBy,
        assignedTo: data.assignedTo || null,
        status: "OPEN",
      } as any,
    });
  }

  async updateArDisputeStatus(
    tenantId: string,
    disputeId: string,
    status: string,
    resolvedAmount?: number,
  ) {
    const dispute = await prisma.aRDispute.findFirst({
      where: { id: disputeId, tenantId },
    });
    if (!dispute) throw new NotFoundException("Dispute not found");
    return prisma.aRDispute.update({
      where: { id: disputeId },
      data: {
        status,
        resolvedAmount: resolvedAmount || null,
        resolvedAt: status === "RESOLVED" ? new Date() : null,
      } as any,
    });
  }

  async getArAnalytics(tenantId: string) {
    const invoices = await prisma.invoice.findMany({
      where: { tenantId, deletedAt: null },
      select: {
        totalAmount: true,
        paidAmount: true,
        status: true,
        dueDate: true,
      },
    });
    const totalReceivables = invoices.reduce(
      (s: number, i: any) =>
        s + Number(i.totalAmount) - Number(i.paidAmount || 0),
      0,
    );
    const totalPaid = invoices
      .filter((i: any) => i.status === "PAID")
      .reduce((s: number, i: any) => s + Number(i.totalAmount), 0);
    const totalBilled = invoices.reduce(
      (s: number, i: any) => s + Number(i.totalAmount),
      0,
    );
    return {
      totalReceivables,
      totalPaid,
      totalBilled,
      dso: totalBilled ? Math.round((totalReceivables / totalBilled) * 365) : 0,
      invoiceCount: invoices.length,
      paidInvoiceCount: invoices.filter((i: any) => i.status === "PAID").length,
      collectionRate: totalBilled
        ? ((totalPaid / totalBilled) * 100).toFixed(1)
        : "0.0",
    };
  }
}
