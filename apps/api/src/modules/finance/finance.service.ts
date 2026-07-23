import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { prisma } from "@unerp/database";
import {
  CreateInvoiceInput,
  UpdateInvoiceInput,
  CreatePaymentInput,
} from "@unerp/shared";
import { Prisma } from "@prisma/client";
import { EventEmitter2 } from "@nestjs/event-emitter";
import {
  buildPaginationValues,
  buildOrderBy,
  paginatedResult,
  resolveOrgId,
  PaginatedResult,
  PaginationParams,
} from "../../common/utils/pagination.util";

@Injectable()
export class FinanceService {
  constructor(private readonly eventEmitter?: EventEmitter2) {}

  /**
   * Fetch all invoices with pagination, sorting, and filtering.
   */
  async getInvoices(
    tenantId: string,
    params: PaginationParams & { status?: string; customerId?: string } = {},
  ): Promise<PaginatedResult<any>> {
    const where: any = { tenantId, deletedAt: null };
    if (params.status) where.status = params.status;
    if (params.customerId) where.customerId = params.customerId;
    if (params.search) {
      where.OR = [
        { invoiceNumber: { contains: params.search, mode: "insensitive" } },
        {
          customer: { name: { contains: params.search, mode: "insensitive" } },
        },
      ];
    }

    const { skip, take } = buildPaginationValues(params);
    const orderBy = buildOrderBy(params.sort);

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          customer: { select: { name: true } },
          lineItems: true,
          payments: true,
        },
        skip,
        take,
        orderBy: orderBy as any,
      }),
      prisma.invoice.count({ where }),
    ]);

    const data = (invoices as any[]).map((inv) => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      status: inv.status,
      issueDate: inv.issueDate,
      dueDate: inv.dueDate,
      subtotal: Number(inv.subtotal),
      taxAmount: Number(inv.taxAmount),
      discountAmount: Number(inv.discountAmount || 0),
      totalAmount: Number(inv.totalAmount),
      paidAmount: Number(inv.paidAmount),
      currency: inv.currency,
      customerName: inv.customer?.name || "Unknown",
      notes: inv.notes,
      lineItems: inv.lineItems.map((li: any) => ({
        id: li.id,
        description: li.description,
        quantity: Number(li.quantity),
        unitPrice: Number(li.unitPrice),
        taxRate: Number(li.taxRate),
        totalAmount: Number(li.totalAmount),
      })),
      payments:
        inv.payments?.map((p: any) => ({
          id: p.id,
          amount: Number(p.amount),
          method: p.method,
          reference: p.reference,
          paidAt: p.paidAt,
        })) || [],
    }));

    return paginatedResult(data, total, params);
  }

  /**
   * Fetch all payments with pagination, sorting, and filtering.
   */
  async getPaymentsList(
    tenantId: string,
    params: PaginationParams & { invoiceId?: string; customerId?: string } = {},
  ): Promise<PaginatedResult<any>> {
    const where: any = { tenantId };
    if (params.invoiceId) where.invoiceId = params.invoiceId;
    if (params.customerId) where.invoice = { customerId: params.customerId };
    if (params.search) {
      where.OR = [
        { reference: { contains: params.search, mode: "insensitive" } },
        {
          invoice: {
            invoiceNumber: { contains: params.search, mode: "insensitive" },
          },
        },
      ];
    }

    const { skip, take } = buildPaginationValues(params);
    const orderBy = buildOrderBy(params.sort) ?? { paidAt: "desc" };

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          invoice: {
            select: {
              invoiceNumber: true,
              customerId: true,
              customer: { select: { name: true } },
            },
          },
        },
        skip,
        take,
        orderBy: orderBy as any,
      }),
      prisma.payment.count({ where }),
    ]);

    const data = (payments as any[]).map((p) => ({
      id: p.id,
      invoiceId: p.invoiceId,
      invoiceNumber: p.invoice?.invoiceNumber,
      customerId: p.invoice?.customerId,
      customerName: p.invoice?.customer?.name || "Unknown",
      amount: Number(p.amount),
      currency: p.currency,
      method: p.method,
      reference: p.reference,
      notes: p.notes,
      paidAt: p.paidAt,
    }));

    return paginatedResult(data, total, params);
  }

  /**
   * Get single invoice by ID.
   */
  async getInvoiceById(tenantId: string, id: string) {
    const invoice = await prisma.invoice.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        customer: {
          select: { id: true, name: true, email: true, phone: true },
        },
        lineItems: { orderBy: { sortOrder: "asc" } },
        payments: { orderBy: { paidAt: "desc" } },
      },
    });
    if (!invoice) throw new NotFoundException("Invoice not found");
    return invoice;
  }

  /**
   * Create new invoice.
   */
  async createInvoice(
    tenantId: string,
    orgId: string,
    dto: CreateInvoiceInput,
    createdBy: string,
  ) {
    const resolvedOrgId = await resolveOrgId(tenantId, orgId);

    // Check duplicate invoice number
    const existing = await prisma.invoice.findFirst({
      where: {
        tenantId,
        orgId: resolvedOrgId,
        invoiceNumber: dto.invoiceNumber,
      },
    });
    if (existing)
      throw new BadRequestException(
        `Invoice number ${dto.invoiceNumber} already exists.`,
      );

    // Verify customer
    const customer = await prisma.customer.findFirst({
      where: { id: dto.customerId, tenantId },
    });
    if (!customer) throw new NotFoundException("Customer not found");

    // A caller passing a flat `totalAmount` (no line-item breakdown) gets a
    // single synthesized line item for it — the common case for a UI with no
    // line-item editor.
    const lineItemsInput =
      dto.lineItems && dto.lineItems.length > 0
        ? dto.lineItems
        : [
            {
              description: dto.notes || "Invoice",
              quantity: 1,
              unitPrice: dto.totalAmount ?? 0,
              taxRate: 0,
            },
          ];

    return prisma.$transaction(async (tx) => {
      let subtotal = 0;
      let totalTax = 0;

      const linesData = lineItemsInput.map((item, index) => {
        const lineSubtotal = item.quantity * item.unitPrice;
        const lineTax = lineSubtotal * (item.taxRate / 100);
        const lineTotal = lineSubtotal + lineTax;
        subtotal += lineSubtotal;
        totalTax += lineTax;
        return {
          tenantId,
          description: item.description,
          productId: item.productId || null,
          quantity: new Prisma.Decimal(item.quantity),
          unitPrice: new Prisma.Decimal(item.unitPrice),
          taxRate: new Prisma.Decimal(item.taxRate),
          taxAmount: new Prisma.Decimal(lineTax),
          totalAmount: new Prisma.Decimal(lineTotal),
          sortOrder: index,
        };
      });

      const totalAmount = subtotal + totalTax;

      const invoice = await tx.invoice.create({
        data: {
          tenantId,
          orgId: resolvedOrgId,
          customerId: dto.customerId,
          invoiceNumber: dto.invoiceNumber,
          dueDate: new Date(dto.dueDate),
          subtotal: new Prisma.Decimal(subtotal),
          taxAmount: new Prisma.Decimal(totalTax),
          totalAmount: new Prisma.Decimal(totalAmount),
          paidAmount: new Prisma.Decimal(0),
          status: "DRAFT",
          notes: dto.notes || null,
          createdBy,
        },
      });

      for (const line of linesData) {
        await tx.invoiceLineItem.create({
          data: { ...line, invoiceId: invoice.id },
        });
      }

      // Emit event
      if (this.eventEmitter) {
        this.eventEmitter.emit("finance.invoice.created", {
          invoiceId: invoice.id,
          tenantId,
          customerId: dto.customerId,
          totalAmount,
          currency: "USD",
          lineItems: lineItemsInput.map((li) => ({
            productId: "productId" in li ? li.productId : undefined,
            quantity: li.quantity,
            unitPrice: li.unitPrice,
          })),
          createdAt: new Date(),
        });
      }

      return invoice;
    });
  }

  /**
   * Update invoice.
   */
  async updateInvoice(tenantId: string, id: string, dto: UpdateInvoiceInput) {
    const invoice = await prisma.invoice.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!invoice) throw new NotFoundException("Invoice not found");
    if (invoice.status !== "DRAFT")
      throw new BadRequestException("Only DRAFT invoices can be edited.");

    return prisma.$transaction(async (tx) => {
      // Delete existing line items
      await tx.invoiceLineItem.deleteMany({ where: { invoiceId: id } });

      let subtotal = 0;
      let totalTax = 0;

      if (dto.lineItems) {
        for (const [index, item] of dto.lineItems.entries()) {
          const lineSubtotal = item.quantity * item.unitPrice;
          const lineTax = lineSubtotal * (item.taxRate / 100);
          const lineTotal = lineSubtotal + lineTax;
          subtotal += lineSubtotal;
          totalTax += lineTax;
          await tx.invoiceLineItem.create({
            data: {
              tenantId,
              invoiceId: id,
              description: item.description,
              productId: item.productId || null,
              quantity: new Prisma.Decimal(item.quantity),
              unitPrice: new Prisma.Decimal(item.unitPrice),
              taxRate: new Prisma.Decimal(item.taxRate),
              taxAmount: new Prisma.Decimal(lineTax),
              totalAmount: new Prisma.Decimal(lineTotal),
              sortOrder: index,
            },
          });
        }
      }

      const totalAmount = subtotal + totalTax;
      return tx.invoice.update({
        where: { id },
        data: {
          dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
          notes: dto.notes ?? undefined,
          subtotal: dto.lineItems ? new Prisma.Decimal(subtotal) : undefined,
          taxAmount: dto.lineItems ? new Prisma.Decimal(totalTax) : undefined,
          totalAmount: dto.lineItems
            ? new Prisma.Decimal(totalAmount)
            : undefined,
        },
      });
    });
  }

  /**
   * Delete invoice (soft delete).
   */
  async deleteInvoice(tenantId: string, id: string) {
    const invoice = await prisma.invoice.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!invoice) throw new NotFoundException("Invoice not found");
    if (invoice.status === "PAID" || invoice.status === "PARTIALLY_PAID") {
      throw new BadRequestException(
        "Cannot delete an invoice that has payments registered.",
      );
    }

    await prisma.invoice.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return { success: true };
  }

  /**
   * Send invoice (change status to SENT).
   */
  async sendInvoice(tenantId: string, id: string) {
    const invoice = await prisma.invoice.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!invoice) throw new NotFoundException("Invoice not found");
    if (invoice.status !== "DRAFT")
      throw new BadRequestException("Only DRAFT invoices can be sent.");

    await prisma.invoice.update({
      where: { id },
      data: { status: "SENT", sentAt: new Date() },
    });
    if (this.eventEmitter) {
      this.eventEmitter.emit("finance.invoice.sent", {
        invoiceId: id,
        tenantId,
        customerId: invoice.customerId,
      });
    }
    return { success: true };
  }

  /**
   * Void invoice.
   */
  async voidInvoice(tenantId: string, id: string) {
    const invoice = await prisma.invoice.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!invoice) throw new NotFoundException("Invoice not found");
    if (invoice.status === "PAID" || invoice.status === "VOID") {
      throw new BadRequestException(
        "Cannot void a paid or already voided invoice.",
      );
    }

    await prisma.invoice.update({
      where: { id },
      data: { status: "VOID" },
    });
    return { success: true };
  }

  /**
   * Record payment against an invoice.
   */
  async createPayment(
    tenantId: string,
    dto: CreatePaymentInput,
    createdBy: string,
  ) {
    const invoice = await prisma.invoice.findFirst({
      where: { id: dto.invoiceId, tenantId, deletedAt: null },
    });
    if (!invoice) throw new NotFoundException("Invoice not found");
    if (invoice.status === "VOID" || invoice.status === "CANCELLED") {
      throw new BadRequestException(
        "Cannot record payment against a void/cancelled invoice.",
      );
    }

    const currentPaid = Number(invoice.paidAmount);
    const totalAmount = Number(invoice.totalAmount);
    const newPaidAmount = currentPaid + dto.amount;

    if (newPaidAmount > totalAmount) {
      throw new BadRequestException("Payment amount exceeds total due amount");
    }

    const nextStatus =
      newPaidAmount === totalAmount ? "PAID" : "PARTIALLY_PAID";

    return prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          tenantId,
          invoiceId: dto.invoiceId,
          amount: new Prisma.Decimal(dto.amount),
          method: dto.method,
          reference: dto.reference || null,
          notes: dto.notes || null,
          createdBy,
        },
      });

      await tx.invoice.update({
        where: { id: dto.invoiceId },
        data: {
          paidAmount: new Prisma.Decimal(newPaidAmount),
          status: nextStatus,
          paidAt: nextStatus === "PAID" ? new Date() : null,
        },
      });

      // Emit payment event
      if (this.eventEmitter && nextStatus === "PAID") {
        this.eventEmitter.emit("finance.payment.received", {
          paymentId: payment.id,
          invoiceId: dto.invoiceId,
          tenantId,
          amount: dto.amount,
          method: dto.method,
          paidAt: new Date(),
        });
      }

      return payment;
    });
  }

  /**
   * Bulk operations on invoices.
   */
  async bulkAction(
    tenantId: string,
    action: string,
    ids: string[],
    data?: Record<string, unknown>,
  ) {
    const results: Array<{
      id: string;
      status: "success" | "error";
      error?: string;
    }> = [];

    for (const id of ids) {
      try {
        switch (action) {
          case "delete":
            await this.deleteInvoice(tenantId, id);
            break;
          case "send":
            await this.sendInvoice(tenantId, id);
            break;
          case "void":
            await this.voidInvoice(tenantId, id);
            break;
          case "update-status":
            if (data?.status === "SENT") await this.sendInvoice(tenantId, id);
            else if (data?.status === "VOID")
              await this.voidInvoice(tenantId, id);
            else
              throw new BadRequestException(
                `Unsupported status: ${data?.status}`,
              );
            break;
          default:
            throw new BadRequestException(`Unsupported action: ${action}`);
        }
        results.push({ id, status: "success" });
      } catch (err: any) {
        results.push({ id, status: "error", error: err.message });
      }
    }

    return {
      total: ids.length,
      succeeded: results.filter((r) => r.status === "success").length,
      failed: results.filter((r) => r.status === "error").length,
      results,
    };
  }

  /**
   * Get payments for an invoice.
   */
  async getPayments(tenantId: string, invoiceId: string) {
    return prisma.payment.findMany({
      where: { tenantId, invoiceId },
      orderBy: { paidAt: "desc" },
    });
  }

  /**
   * Get invoice statistics / KPIs.
   */
  async getInvoiceStats(tenantId: string) {
    const [totalInvoices, paidInvoices, overdueInvoices, totalRevenue] =
      await Promise.all([
        prisma.invoice.count({ where: { tenantId, deletedAt: null } }),
        prisma.invoice.count({
          where: { tenantId, deletedAt: null, status: "PAID" },
        }),
        prisma.invoice.count({
          where: { tenantId, deletedAt: null, status: "OVERDUE" },
        }),
        prisma.invoice.aggregate({
          where: { tenantId, deletedAt: null, status: "PAID" },
          _sum: { totalAmount: true },
        }),
      ]);

    return {
      totalInvoices,
      paidInvoices,
      overdueInvoices,
      totalRevenue: Number(totalRevenue._sum.totalAmount || 0),
      paymentRate:
        totalInvoices > 0
          ? Math.round((paidInvoices / totalInvoices) * 100)
          : 0,
    };
  }

  /**
   * Aggregate all Finance Executive Dashboard data from real Prisma queries.
   * Returns multi-section payload consumed by the 4-page dashboard UI.
   */
  async getDashboardData(tenantId: string) {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    // ─── Run all queries in parallel ─────────────────────────────────
    const [
      invoiceStats,
      allInvoices,
      invoicesByStatus,
      payments,
      allAccounts,
      bankAccounts,
    ] = await Promise.all([
      // Invoice KPI aggregates
      Promise.all([
        prisma.invoice.count({ where: { tenantId, deletedAt: null } }),
        prisma.invoice.count({
          where: { tenantId, deletedAt: null, status: "PAID" },
        }),
        prisma.invoice.count({
          where: { tenantId, deletedAt: null, status: "OVERDUE" },
        }),
        prisma.invoice.aggregate({
          where: { tenantId, deletedAt: null, status: { not: "VOID" } },
          _sum: { totalAmount: true, paidAmount: true },
        }),
        prisma.invoice.aggregate({
          where: {
            tenantId,
            deletedAt: null,
            status: { in: ["SENT", "OVERDUE", "PARTIALLY_PAID"] },
          },
          _sum: { totalAmount: true, paidAmount: true },
        }),
      ]),

      // All invoices for trend/aging computation
      prisma.invoice.findMany({
        where: {
          tenantId,
          deletedAt: null,
          issueDate: { gte: twelveMonthsAgo },
        },
        select: {
          id: true,
          status: true,
          totalAmount: true,
          paidAmount: true,
          dueDate: true,
          issueDate: true,
          currency: true,
          customerId: true,
          customer: { select: { id: true, name: true } },
          payments: { select: { amount: true, method: true, paidAt: true } },
        },
        orderBy: { issueDate: "asc" },
      }),

      // Status distribution
      prisma.invoice.groupBy({
        by: ["status"],
        where: { tenantId, deletedAt: null },
        _count: { status: true },
        _sum: { totalAmount: true },
      }),

      // Payments for cash-flow trend
      prisma.payment.findMany({
        where: { tenantId, paidAt: { gte: twelveMonthsAgo } },
        select: { amount: true, paidAt: true, method: true },
        orderBy: { paidAt: "asc" },
      }),

      // GL accounts for distribution
      prisma.account
        .findMany({
          where: { tenantId, isActive: true },
          select: { type: true },
        })
        .catch(() => [] as Array<{ type: string }>),

      // Bank accounts count for cash position (no balance field in schema)
      prisma.bankAccount
        .findMany({
          where: { tenantId },
          select: { id: true, currency: true },
        })
        .catch(() => [] as Array<{ id: string; currency: string }>),
    ]);

    const [totalInvoices, paidCount, overdueCount, totalAgg, arAgg] =
      invoiceStats;

    // ─── KPI Cards ────────────────────────────────────────────────────
    const totalRevenue = Number(totalAgg?._sum?.totalAmount || 0);
    const outstandingAr = Math.max(
      0,
      Number(arAgg?._sum?.totalAmount || 0) -
        Number(arAgg?._sum?.paidAmount || 0),
    );
    const netCashBalance = 0; // BankAccount schema has no balance field; extend via GL account balances later
    const ytdRevenue = (allInvoices as any[])
      .filter(
        (inv: any) =>
          inv.status === "PAID" && new Date(inv.issueDate) >= startOfYear,
      )
      .reduce((sum: number, inv: any) => sum + Number(inv.totalAmount), 0);

    // ─── Monthly Revenue Trend (12 months) ───────────────────────────
    const monthlyRevenue: Record<
      string,
      { month: string; revenue: number; invoices: number }
    > = {};
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("en-US", {
        month: "short",
        year: "2-digit",
      });
      monthlyRevenue[key] = { month: label, revenue: 0, invoices: 0 };
    }
    for (const inv of allInvoices as any[]) {
      if (!inv.issueDate) continue;
      const d = new Date(inv.issueDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (monthlyRevenue[key]) {
        monthlyRevenue[key].revenue += Number(inv.totalAmount);
        monthlyRevenue[key].invoices += 1;
      }
    }
    const revenueTrend = Object.values(monthlyRevenue);

    // ─── Invoice Status Distribution ─────────────────────────────────
    const statusDistribution = invoicesByStatus.map((s: any) => ({
      name: s.status,
      value: s._count.status,
      amount: Number(s._sum.totalAmount || 0),
    }));

    // ─── AR Aging Breakdown ───────────────────────────────────────────
    const today = new Date();
    const arAging = { current: 0, days30: 0, days60: 0, days90: 0, over90: 0 };
    for (const inv of allInvoices as any[]) {
      if (!["SENT", "OVERDUE", "PARTIALLY_PAID"].includes(inv.status)) continue;
      const outstanding = Number(inv.totalAmount) - Number(inv.paidAmount);
      if (outstanding <= 0) continue;
      const daysOverdue = inv.dueDate
        ? Math.floor(
            (today.getTime() - new Date(inv.dueDate).getTime()) / 86400000,
          )
        : 0;
      if (daysOverdue <= 0) arAging.current += outstanding;
      else if (daysOverdue <= 30) arAging.days30 += outstanding;
      else if (daysOverdue <= 60) arAging.days60 += outstanding;
      else if (daysOverdue <= 90) arAging.days90 += outstanding;
      else arAging.over90 += outstanding;
    }
    const arAgingChart = [
      { bucket: "Current", amount: Math.round(arAging.current) },
      { bucket: "1-30 Days", amount: Math.round(arAging.days30) },
      { bucket: "31-60 Days", amount: Math.round(arAging.days60) },
      { bucket: "61-90 Days", amount: Math.round(arAging.days90) },
      { bucket: "90+ Days", amount: Math.round(arAging.over90) },
    ];

    // ─── Top Customers by Revenue ──────────────────────────────────────
    const customerRevenue: Record<
      string,
      { name: string; revenue: number; invoices: number }
    > = {};
    for (const inv of allInvoices as any[]) {
      const cId = inv.customerId || inv.customer?.id || "default";
      const cName = inv.customer?.name || "Unknown";
      if (!customerRevenue[cId])
        customerRevenue[cId] = { name: cName, revenue: 0, invoices: 0 };
      customerRevenue[cId].revenue += Number(inv.totalAmount);
      customerRevenue[cId].invoices += 1;
    }
    const topCustomers = Object.values(customerRevenue)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)
      .map((c) => ({ ...c, revenue: Math.round(c.revenue) }));

    // ─── Payment Method Distribution ──────────────────────────────────
    const methodCount: Record<string, number> = {};
    for (const p of payments as any[]) {
      const m = p.method || "OTHER";
      methodCount[m] = (methodCount[m] || 0) + 1;
    }
    const paymentMethodChart = Object.entries(methodCount).map(
      ([name, value]) => ({ name, value }),
    );

    // ─── Monthly Cash Flow Trend ──────────────────────────────────────
    const monthlyCashFlow: Record<
      string,
      { month: string; inflows: number; outflows: number }
    > = {};
    for (const key of Object.keys(monthlyRevenue)) {
      const mEntry = monthlyRevenue[key];
      monthlyCashFlow[key] = {
        month: mEntry ? mEntry.month : key,
        inflows: 0,
        outflows: 0,
      };
    }
    for (const p of payments as any[]) {
      if (!p.paidAt) continue;
      const d = new Date(p.paidAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (monthlyCashFlow[key]) {
        monthlyCashFlow[key].inflows += Number(p.amount);
      }
    }
    const cashFlowTrend = Object.values(monthlyCashFlow);

    // ─── Account Type Distribution ────────────────────────────────────
    const accountTypeCount: Record<string, number> = {};
    for (const acc of allAccounts as any[]) {
      accountTypeCount[acc.type] = (accountTypeCount[acc.type] || 0) + 1;
    }
    const accountTypeChart = Object.entries(accountTypeCount).map(
      ([name, value]) => ({ name, value }),
    );

    // ─── KPI Summary ─────────────────────────────────────────────────
    return {
      kpis: {
        totalRevenueYtd: Math.round(ytdRevenue),
        totalRevenue: Math.round(totalRevenue),
        outstandingAr: Math.round(outstandingAr),
        pendingAp: 0, // AP requires vendor bill data — extend when AP module is wired
        netCashBalance: Math.round(netCashBalance),
        totalInvoices,
        paidInvoices: paidCount,
        overdueInvoices: overdueCount,
        paymentRate:
          totalInvoices > 0 ? Math.round((paidCount / totalInvoices) * 100) : 0,
        bankAccounts: bankAccounts.length,
      },
      charts: {
        revenueTrend,
        statusDistribution,
        arAgingChart,
        topCustomers,
        paymentMethodChart,
        cashFlowTrend,
        accountTypeChart,
      },
    };
  }
}
