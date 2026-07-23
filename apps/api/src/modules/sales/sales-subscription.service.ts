import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { prisma } from "@unerp/database";
import { Prisma } from "@prisma/client";

@Injectable()
export class SalesSubscriptionService {
  async getSubscriptions(tenantId: string, status?: string) {
    const where: Prisma.SubscriptionWhereInput = { tenantId };
    if (status) where.status = status;
    return prisma.subscription.findMany({
      where,
      include: { _count: { select: { lines: true, invoices: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  async getSubscriptionById(tenantId: string, id: string) {
    const sub = await prisma.subscription.findFirst({
      where: { id, tenantId },
      include: { lines: true, invoices: { orderBy: { createdAt: "desc" }, take: 12 }, usage: { orderBy: { usageDate: "desc" }, take: 50 } },
    });
    if (!sub) throw new NotFoundException("Subscription not found");
    return sub;
  }

  async createSubscription(tenantId: string, orgId: string, dto: any) {
    let resolvedOrgId = orgId;
    if (!orgId || orgId === "org-system-default") {
      const org = await prisma.organization.findFirst({ where: { tenantId } });
      if (!org) throw new BadRequestException("No Organization found for this Tenant.");
      resolvedOrgId = org.id;
    }

    const startDate = new Date(dto.startDate);
    const currentPeriodEnd = new Date(startDate);
    const billingPeriod = dto.billingPeriod || "MONTHLY";
    if (billingPeriod === "MONTHLY") currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
    else if (billingPeriod === "QUARTERLY") currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 3);
    else if (billingPeriod === "SEMI_ANNUAL") currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 6);
    else if (billingPeriod === "ANNUAL") currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);

    return prisma.subscription.create({
      data: {
        tenantId, orgId: resolvedOrgId,
        name: dto.name, description: dto.description || null,
        customerId: dto.customerId, productId: dto.productId || null,
        currency: dto.currency || "USD",
        unitAmount: new Prisma.Decimal(dto.unitAmount),
        quantity: dto.quantity || 1,
        billingPeriod, billingCycles: dto.billingCycles || null,
        status: dto.trialEndDate ? "TRIALING" : "ACTIVE",
        startDate, currentPeriodStart: startDate, currentPeriodEnd,
        trialEndDate: dto.trialEndDate ? new Date(dto.trialEndDate) : null,
        lines: dto.lines?.length ? { create: dto.lines.map((l: any) => ({ tenantId, productId: l.productId || null, description: l.description, unitAmount: new Prisma.Decimal(l.unitAmount), quantity: l.quantity || 1, taxRate: new Prisma.Decimal(l.taxRate || 0), totalAmount: new Prisma.Decimal((l.unitAmount * (l.quantity || 1)) * (1 + (l.taxRate || 0) / 100)) })) } : undefined,
      },
      include: { lines: true },
    });
  }

  async updateSubscription(tenantId: string, id: string, dto: any) {
    const sub = await prisma.subscription.findFirst({ where: { id, tenantId } });
    if (!sub) throw new NotFoundException("Subscription not found");
    const data: Prisma.SubscriptionUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.unitAmount !== undefined) data.unitAmount = new Prisma.Decimal(dto.unitAmount);
    if (dto.quantity !== undefined) data.quantity = dto.quantity;
    if (dto.billingPeriod !== undefined) data.billingPeriod = dto.billingPeriod;
    if (dto.billingCycles !== undefined) data.billingCycles = dto.billingCycles;
    if (dto.currentPeriodEnd !== undefined) data.currentPeriodEnd = new Date(dto.currentPeriodEnd);
    return prisma.subscription.update({ where: { id }, data, include: { lines: true } });
  }

  async cancelSubscription(tenantId: string, id: string, atPeriodEnd = true) {
    const sub = await prisma.subscription.findFirst({ where: { id, tenantId } });
    if (!sub) throw new NotFoundException("Subscription not found");
    if (sub.status === "CANCELED") throw new BadRequestException("Subscription is already canceled");
    return prisma.subscription.update({
      where: { id },
      data: atPeriodEnd ? { cancelAtPeriodEnd: true } : { status: "CANCELED", canceledAt: new Date() },
    });
  }

  async pauseSubscription(tenantId: string, id: string) {
    const sub = await prisma.subscription.findFirst({ where: { id, tenantId } });
    if (!sub) throw new NotFoundException("Subscription not found");
    if (sub.status !== "ACTIVE") throw new BadRequestException("Only active subscriptions can be paused");
    return prisma.subscription.update({ where: { id }, data: { status: "PAUSED", pausedAt: new Date() } });
  }

  async resumeSubscription(tenantId: string, id: string) {
    const sub = await prisma.subscription.findFirst({ where: { id, tenantId } });
    if (!sub) throw new NotFoundException("Subscription not found");
    if (sub.status !== "PAUSED") throw new BadRequestException("Only paused subscriptions can be resumed");
    return prisma.subscription.update({ where: { id }, data: { status: "ACTIVE", pausedAt: null } });
  }

  async recordUsage(tenantId: string, subscriptionId: string, dto: any) {
    const sub = await prisma.subscription.findFirst({ where: { id: subscriptionId, tenantId } });
    if (!sub) throw new NotFoundException("Subscription not found");
    return prisma.subscriptionUsage.create({
      data: {
        tenantId, subscriptionId, usageDate: new Date(),
        metricName: dto.metricName, quantity: dto.quantity,
        unitAmount: new Prisma.Decimal(dto.unitAmount || 0),
        totalAmount: new Prisma.Decimal((dto.unitAmount || 0) * dto.quantity),
      },
    });
  }

  async getUsageMetrics(tenantId: string, subscriptionId: string, period?: string) {
    const where: Prisma.SubscriptionUsageWhereInput = { tenantId, subscriptionId };
    if (period) {
      const parts = period.split("-");
      const year = parseInt(parts[0] || "0", 10);
      const month = parseInt(parts[1] || "0", 10);
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59, 999);
      where.usageDate = { gte: start, lte: end };
    }
    const records = await prisma.subscriptionUsage.findMany({ where, orderBy: { usageDate: "desc" } });
    const byMetric = records.reduce((acc: Record<string, { total: number; count: number }>, r) => {
      const key = r.metricName;
      if (!acc[key]) acc[key] = { total: 0, count: 0 };
      acc[key].total += Number(r.totalAmount);
      acc[key].count += r.quantity;
      return acc;
    }, {});
    return { records, summary: byMetric, totalRecords: records.length };
  }

  async generateRecurringInvoice(tenantId: string, subscriptionId: string) {
    const sub = await prisma.subscription.findFirst({
      where: { id: subscriptionId, tenantId },
      include: { lines: true, invoices: { orderBy: { sequenceNumber: "desc" }, take: 1 } },
    });
    if (!sub) throw new NotFoundException("Subscription not found");
    if (sub.status !== "ACTIVE") throw new BadRequestException("Cannot generate invoice for non-active subscription");

    const seqNum = (sub.invoices[0]?.sequenceNumber || 0) + 1;
    const invoiceNumber = `INV-SUB-${sub.id.slice(0, 8)}-${String(seqNum).padStart(4, "0")}`;
    const periodStart = new Date(sub.currentPeriodStart);
    const periodEnd = new Date(sub.currentPeriodEnd);

    const subtotal = Number(sub.unitAmount) * sub.quantity;
    const existingInvoice = await prisma.invoice.findFirst({ where: { tenantId, invoiceNumber } });
    if (existingInvoice) throw new BadRequestException(`Invoice ${invoiceNumber} already exists for this period`);

    const invoice = await prisma.invoice.create({
      data: {
        tenantId, orgId: sub.orgId,
        customerId: sub.customerId || "", invoiceNumber,
        status: "UNPAID", issueDate: new Date(), dueDate: new Date(periodEnd),
        subtotal: new Prisma.Decimal(subtotal),
        taxAmount: new Prisma.Decimal(0), totalAmount: new Prisma.Decimal(subtotal),
        currency: sub.currency, notes: `Auto-generated for subscription ${sub.name} (period ${periodStart.toISOString().slice(0, 10)} - ${periodEnd.toISOString().slice(0, 10)})`,
        createdBy: "system",
      },
    });
    await prisma.subscriptionInvoice.create({
      data: { tenantId, subscriptionId, invoiceId: invoice.id, periodStart, periodEnd, sequenceNumber: seqNum, status: "PENDING", amount: new Prisma.Decimal(subtotal) },
    });
    return invoice;
  }

  async dunningProcess(tenantId: string, invoiceIds?: string[]) {
    const where: Prisma.SubscriptionInvoiceWhereInput = { tenantId, status: "PENDING" };
    if (invoiceIds?.length) where.invoiceId = { in: invoiceIds };
    const pendingInvoices = await prisma.subscriptionInvoice.findMany({ where, include: { subscription: { select: { name: true, customerId: true } }, invoice: true } });

    const results: Array<{ invoiceId: string; subscriptionName: string; action: string }> = [];
    for (const si of pendingInvoices) {
      const daysOverdue = Math.floor((Date.now() - new Date(si.invoice.dueDate).getTime()) / 86400000);
      let action = "OK";
      if (daysOverdue > 30) { action = "FLAGGED_FOR_SUSPENSION"; }
      else if (daysOverdue > 15) { action = "ESCALATED_COLLECTIONS"; }
      else if (daysOverdue > 7) { action = "SENT_REMINDER_2"; }
      else if (daysOverdue > 0) { action = "SENT_REMINDER_1"; }
      results.push({ invoiceId: si.invoiceId, subscriptionName: si.subscription.name, action });
    }
    return { dunningRun: new Date().toISOString(), totalProcessed: pendingInvoices.length, results };
  }

  async getSubscriptionAnalytics(tenantId: string) {
    const [active, canceled, totalRevenue, totalSubs] = await Promise.all([
      prisma.subscription.count({ where: { tenantId, status: "ACTIVE" } }),
      prisma.subscription.count({ where: { tenantId, status: "CANCELED" } }),
      prisma.subscriptionInvoice.aggregate({ where: { tenantId, status: "PAID" }, _sum: { amount: true } }),
      prisma.subscription.count({ where: { tenantId } }),
    ]);
    return { activeSubscriptions: active, canceledSubscriptions: canceled, totalMRR: Number(totalRevenue._sum.amount || 0) / (active || 1), totalARR: (Number(totalRevenue._sum.amount || 0) / (active || 1)) * 12, totalSubscriptions: totalSubs, churnRate: totalSubs > 0 ? Math.round((canceled / totalSubs) * 100) : 0 };
  }
}
