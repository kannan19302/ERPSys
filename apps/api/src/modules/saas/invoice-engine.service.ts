import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class InvoiceEngineService {
  async listInvoices(tenantId: string, page: number, limit: number, status?: string) {
    const where: Record<string, unknown> = { tenantId };
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      prisma.saaSInvoice.findMany({
        where: where as any,
        include: { lines: true },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.saaSInvoice.count({ where: where as any }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getInvoice(tenantId: string, id: string) {
    const invoice = await prisma.saaSInvoice.findFirst({
      where: { id, tenantId },
      include: { lines: true, transactions: true },
    });
    if (!invoice) throw new NotFoundException("Invoice not found");
    return invoice;
  }

  async generateInvoice(tenantId: string, body: {
    planId: string;
    amount: number;
    currency?: string;
    description?: string;
    dueDate?: string;
    lineItems?: Array<{ description: string; quantity: number; unitPrice: number; total: number }>;
  }) {
    const invoiceNumber = await this.generateInvoiceNumber();
    const totalAmount = body.amount;
    const lineItems = body.lineItems ?? [{ description: body.description ?? "Service", quantity: 1, unitPrice: totalAmount, total: totalAmount }];

    return prisma.saaSInvoice.create({
      data: {
        tenantId,
        invoiceNumber,
        status: "DRAFT",
        currency: body.currency ?? "USD",
        subtotal: totalAmount,
        totalAmount,
        amountDue: totalAmount,
        dueDate: body.dueDate ? new Date(body.dueDate) : new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        lines: {
          create: lineItems.map((li) => ({
            description: li.description,
            type: "PLAN",
            quantity: li.quantity,
            unitPrice: li.unitPrice,
            totalPrice: li.total,
          })),
        },
      },
      include: { lines: true },
    });
  }

  async payInvoice(tenantId: string, id: string) {
    const invoice = await prisma.saaSInvoice.findFirst({ where: { id, tenantId } });
    if (!invoice) throw new NotFoundException("Invoice not found");
    if (invoice.status === "PAID") throw new BadRequestException("Invoice already paid");
    if (invoice.status === "CANCELLED") throw new BadRequestException("Invoice is cancelled");

    return prisma.$transaction([
      prisma.saaSInvoice.update({
        where: { id },
        data: {
          status: "PAID",
          amountPaid: invoice.totalAmount,
          amountDue: 0,
          paidAt: new Date(),
        },
      }),
      prisma.paymentTransaction.create({
        data: {
          tenantId,
          invoiceId: id,
          provider: "MANUAL",
          type: "SUBSCRIPTION",
          status: "SUCCEEDED",
          amount: invoice.totalAmount,
          currency: invoice.currency,
          description: `Payment for invoice ${invoice.invoiceNumber}`,
        },
      }),
    ]);
  }

  async refundInvoice(tenantId: string, id: string) {
    const invoice = await prisma.saaSInvoice.findFirst({ where: { id, tenantId } });
    if (!invoice) throw new NotFoundException("Invoice not found");
    if (invoice.status !== "PAID") throw new BadRequestException("Only paid invoices can be refunded");

    return prisma.$transaction([
      prisma.saaSInvoice.update({
        where: { id },
        data: { status: "REFUNDED", amountPaid: 0, amountDue: 0 },
      }),
      prisma.paymentTransaction.create({
        data: {
          tenantId,
          invoiceId: id,
          provider: "MANUAL",
          type: "REFUND",
          status: "SUCCEEDED",
          amount: invoice.totalAmount,
          currency: invoice.currency,
          description: `Refund for invoice ${invoice.invoiceNumber}`,
        },
      }),
    ]);
  }

  async cancelInvoice(tenantId: string, id: string) {
    const invoice = await prisma.saaSInvoice.findFirst({ where: { id, tenantId } });
    if (!invoice) throw new NotFoundException("Invoice not found");
    if (invoice.status !== "DRAFT") throw new BadRequestException("Only draft invoices can be cancelled");
    return prisma.saaSInvoice.update({
      where: { id },
      data: { status: "CANCELLED" },
    });
  }

  async downloadPdf(tenantId: string, id: string) {
    const invoice = await prisma.saaSInvoice.findFirst({ where: { id, tenantId } });
    if (!invoice) throw new NotFoundException("Invoice not found");
    return { pdfUrl: invoice.pdfUrl || null, invoiceNumber: invoice.invoiceNumber };
  }

  async getBillingHistory(tenantId: string) {
    return prisma.saaSInvoice.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      include: { lines: true, transactions: true },
    });
  }

  async getInvoiceStats(tenantId: string) {
    const invoices = await prisma.saaSInvoice.findMany({ where: { tenantId }, select: { status: true, totalAmount: true, amountPaid: true, amountDue: true } });
    const totalPaid = invoices.filter((i) => i.status === "PAID").reduce((s, i) => s + Number(i.totalAmount), 0);
    const totalOutstanding = invoices.filter((i) => i.status === "PENDING" || i.status === "OVERDUE").reduce((s, i) => s + Number(i.amountDue), 0);

    return {
      totalInvoices: invoices.length,
      paidCount: invoices.filter((i) => i.status === "PAID").length,
      pendingCount: invoices.filter((i) => i.status === "PENDING").length,
      overdueCount: invoices.filter((i) => i.status === "OVERDUE").length,
      draftCount: invoices.filter((i) => i.status === "DRAFT").length,
      cancelledCount: invoices.filter((i) => i.status === "CANCELLED").length,
      refundedCount: invoices.filter((i) => i.status === "REFUNDED").length,
      totalPaid,
      totalOutstanding,
    };
  }

  async generateInvoiceNumber() {
    const now = new Date();
    const prefix = `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}-`;
    const last = await prisma.saaSInvoice.findFirst({
      where: { invoiceNumber: { startsWith: prefix } },
      orderBy: { invoiceNumber: "desc" },
      select: { invoiceNumber: true },
    });

    let seq = 1;
    if (last) {
      const parts = last.invoiceNumber.split("-");
      const lastPart = parts[parts.length - 1];
      seq = lastPart ? parseInt(lastPart, 10) + 1 : 1;
    }

    return `${prefix}${String(seq).padStart(5, "0")}`;
  }

  async scheduleRecurringInvoice(tenantId: string, dto: {
    interval: "MONTHLY" | "YEARLY";
    startDate?: string;
    endDate?: string;
  }) {
    const sub = await prisma.tenantSubscription.findFirst({ where: { tenantId } });
    if (!sub) throw new BadRequestException("No active subscription");

    return prisma.tenantSubscription.update({
      where: { id: sub.id },
      data: {
        billingPeriod: dto.interval,
        startDate: dto.startDate ? new Date(dto.startDate) : sub.startDate,
        endDate: dto.endDate ? new Date(dto.endDate) : sub.endDate,
      },
    });
  }

  async getUpcomingInvoices(tenantId: string) {
    const sub = await prisma.tenantSubscription.findFirst({
      where: { tenantId, status: { in: ["ACTIVE", "TRIAL"] } },
      include: { plan: { include: { prices: { where: { isActive: true } } } }, addOns: { include: { addon: true } } },
    });
    if (!sub) return [];

    const usdPrice = (sub.plan as any).prices?.[0]
      ? Number((sub.plan as any).prices[0].monthly)
      : 0;
    const planCost = sub.billingPeriod === "YEARLY" ? usdPrice * 12 : usdPrice;
    let total = planCost;

    const lineItems: Array<{ description: string; type: string; amount: number }> = [{ description: `Plan: ${sub.plan.name}`, type: "PLAN", amount: planCost }];

    for (const tao of sub.addOns) {
      const cost = Number(tao.addon.price) * tao.quantity;
      total += cost;
      lineItems.push({ description: `Add-On: ${tao.addon.name} x${tao.quantity}`, type: "ADDON", amount: cost });
    }

    return {
      nextBillingDate: sub.endDate,
      billingPeriod: sub.billingPeriod,
      currency: sub.currency,
      estimatedTotal: total,
      lineItems,
    };
  }
}
