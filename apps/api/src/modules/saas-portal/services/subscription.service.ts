import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';

/**
 * Subscription lifecycle + invoices as consumed from the SaaS Portal home.
 * Consolidates the read/admin-facing halves of
 * `modules/saas/subscription-lifecycle.controller.ts`,
 * `modules/saas/invoice-engine.{controller,service}.ts`, and
 * `modules/admin/subscription.{controller,service}.ts` (platform-admin plan
 * assignment / seat management) into `/saas-portal/subscription`.
 *
 * OUT OF SCOPE: Stripe/webhook signature verification
 * (`modules/saas/billing-webhook.controller.ts`) and the realtime gateway
 * (`modules/saas/saas.gateway.ts`) are untouched. `saas/customer-billing` and
 * `saas/billing-portal` controllers largely re-expose the same
 * invoice/payment surface for the self-service customer portal and were not
 * duplicated a third time (see services/billing.service.ts header for the
 * full delegate-vs-duplicate rationale).
 *
 * Independent implementation against the same `TenantSubscription`/
 * `SaaSInvoice`/`BillingEvent` Prisma models, not a cross-module delegate —
 * module-boundary hard-block, no port/event abstraction for this data yet.
 */
@Injectable()
export class SaasPortalSubscriptionService {
  /* ── Subscription ───────────────────────────────── */

  async getCurrentSubscription(tenantId: string) {
    const subscription = await prisma.tenantSubscription.findUnique({
      where: { tenantId },
      include: { plan: { include: { prices: { where: { isActive: true } } } }, addOns: { include: { addon: true } } },
    });
    if (!subscription) return null;
    return subscription;
  }

  async getCurrentPlan(tenantId: string) {
    const subscription = await prisma.tenantSubscription.findUnique({ where: { tenantId }, include: { plan: true } });
    const userCount = await prisma.user.count({ where: { tenantId, status: 'ACTIVE' } });

    if (!subscription) {
      return {
        plan: { name: 'Free', maxUsers: 5, maxStorage: 1024, price: 0, interval: 'monthly' },
        usage: { users: userCount, maxUsers: 5, storageUsed: 0, maxStorage: 1024 },
        status: 'ACTIVE',
      };
    }

    return {
      plan: subscription.plan || { name: 'Free', maxUsers: 5, maxStorage: 1024, price: 0, interval: 'monthly' },
      usage: { users: userCount, maxUsers: subscription.plan?.maxUsers || 5, storageUsed: 0, maxStorage: subscription.plan?.maxStorage || 1024 },
      status: subscription.status,
      currentPeriodEnd: subscription.endDate,
    };
  }

  async getAvailablePlans() {
    return prisma.saaSPlan.findMany({ orderBy: { maxUsers: 'asc' } });
  }

  async changePlan(tenantId: string, planId: string) {
    const plan = await prisma.saaSPlan.findUnique({ where: { id: planId } });
    if (!plan) throw new NotFoundException('Plan not found');

    const subscription = await prisma.tenantSubscription.update({ where: { tenantId }, data: { planId }, include: { plan: true } });

    await prisma.billingEvent.create({
      data: { tenantId, type: 'PLAN_CHANGE', amount: 0, description: `Plan changed to ${plan.name}`, metadata: { planId, planName: plan.name } },
    });

    return subscription;
  }

  async updateSeats(tenantId: string, seats: number) {
    const subscription = await prisma.tenantSubscription.findUnique({ where: { tenantId }, include: { plan: true } });
    if (!subscription) throw new NotFoundException('No active subscription found');

    await prisma.billingEvent.create({
      data: { tenantId, type: 'SEAT_UPDATE', amount: 0, description: `Seats updated to ${seats}`, metadata: { seats, planId: subscription.planId } },
    });

    return { seats, subscription };
  }

  async cancelSubscription(tenantId: string) {
    const subscription = await prisma.tenantSubscription.findUnique({ where: { tenantId } });
    if (!subscription) throw new NotFoundException('No active subscription found');

    const updated = await prisma.tenantSubscription.update({ where: { tenantId }, data: { status: 'CANCELLED' } });
    await prisma.billingEvent.create({ data: { tenantId, type: 'CANCELLATION', amount: 0, description: 'Subscription cancelled' } });
    return updated;
  }

  async getBillingHistory(tenantId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [events, total] = await Promise.all([
      prisma.billingEvent.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' }, skip, take: limit }),
      prisma.billingEvent.count({ where: { tenantId } }),
    ]);
    return { data: events, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getTrialInfo(tenantId: string) {
    const sub = await prisma.tenantSubscription.findUnique({ where: { tenantId } });
    return {
      isTrial: sub?.status === 'TRIAL',
      trialEndsAt: (sub as any)?.trialEndsAt ?? null,
      daysRemaining: (sub as any)?.trialEndsAt ? Math.max(0, Math.ceil((new Date((sub as any).trialEndsAt).getTime() - Date.now()) / 86400000)) : 0,
    };
  }

  async validateSubscriptionAccess(tenantId: string) {
    const sub = await prisma.tenantSubscription.findUnique({ where: { tenantId } });
    return { valid: sub?.status === 'ACTIVE' || sub?.status === 'TRIAL', subscription: sub };
  }

  /* ── Invoices ───────────────────────────────────── */

  async listInvoices(tenantId: string, page: number, limit: number, status?: string) {
    const where: Record<string, unknown> = { tenantId };
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      prisma.saaSInvoice.findMany({ where: where as any, include: { lines: true }, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
      prisma.saaSInvoice.count({ where: where as any }),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getInvoice(tenantId: string, id: string) {
    const invoice = await prisma.saaSInvoice.findFirst({ where: { id, tenantId }, include: { lines: true, transactions: true } });
    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
  }

  async generateInvoiceNumber() {
    const now = new Date();
    const prefix = `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-`;
    const last = await prisma.saaSInvoice.findFirst({ where: { invoiceNumber: { startsWith: prefix } }, orderBy: { invoiceNumber: 'desc' }, select: { invoiceNumber: true } });
    let seq = 1;
    if (last) {
      const parts = last.invoiceNumber.split('-');
      const lastPart = parts[parts.length - 1];
      seq = lastPart ? parseInt(lastPart, 10) + 1 : 1;
    }
    return `${prefix}${String(seq).padStart(5, '0')}`;
  }

  async generateInvoice(tenantId: string, body: { planId: string; amount: number; currency?: string; description?: string; dueDate?: string }) {
    const invoiceNumber = await this.generateInvoiceNumber();
    const totalAmount = body.amount;

    return prisma.saaSInvoice.create({
      data: {
        tenantId,
        invoiceNumber,
        status: 'DRAFT',
        currency: body.currency ?? 'USD',
        subtotal: totalAmount,
        totalAmount,
        amountDue: totalAmount,
        dueDate: body.dueDate ? new Date(body.dueDate) : new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        lines: { create: [{ description: body.description ?? 'Service', type: 'PLAN', quantity: 1, unitPrice: totalAmount, totalPrice: totalAmount }] },
      },
      include: { lines: true },
    });
  }

  async payInvoice(tenantId: string, id: string) {
    const invoice = await prisma.saaSInvoice.findFirst({ where: { id, tenantId } });
    if (!invoice) throw new NotFoundException('Invoice not found');
    if (invoice.status === 'PAID') throw new BadRequestException('Invoice already paid');
    if (invoice.status === 'CANCELLED') throw new BadRequestException('Invoice is cancelled');

    return prisma.$transaction([
      prisma.saaSInvoice.update({ where: { id }, data: { status: 'PAID', amountPaid: invoice.totalAmount, amountDue: 0, paidAt: new Date() } }),
      prisma.paymentTransaction.create({
        data: { tenantId, invoiceId: id, provider: 'MANUAL', type: 'SUBSCRIPTION', status: 'SUCCEEDED', amount: invoice.totalAmount, currency: invoice.currency, description: `Payment for invoice ${invoice.invoiceNumber}` },
      }),
    ]);
  }

  async refundInvoice(tenantId: string, id: string) {
    const invoice = await prisma.saaSInvoice.findFirst({ where: { id, tenantId } });
    if (!invoice) throw new NotFoundException('Invoice not found');
    if (invoice.status !== 'PAID') throw new BadRequestException('Only paid invoices can be refunded');

    return prisma.$transaction([
      prisma.saaSInvoice.update({ where: { id }, data: { status: 'REFUNDED', amountPaid: 0, amountDue: 0 } }),
      prisma.paymentTransaction.create({
        data: { tenantId, invoiceId: id, provider: 'MANUAL', type: 'REFUND', status: 'SUCCEEDED', amount: invoice.totalAmount, currency: invoice.currency, description: `Refund for invoice ${invoice.invoiceNumber}` },
      }),
    ]);
  }

  async cancelInvoice(tenantId: string, id: string) {
    const invoice = await prisma.saaSInvoice.findFirst({ where: { id, tenantId } });
    if (!invoice) throw new NotFoundException('Invoice not found');
    if (invoice.status !== 'DRAFT') throw new BadRequestException('Only draft invoices can be cancelled');
    return prisma.saaSInvoice.update({ where: { id }, data: { status: 'CANCELLED' } });
  }

  async downloadInvoicePdf(tenantId: string, id: string) {
    const invoice = await prisma.saaSInvoice.findFirst({ where: { id, tenantId } });
    if (!invoice) throw new NotFoundException('Invoice not found');
    return { pdfUrl: invoice.pdfUrl || null, invoiceNumber: invoice.invoiceNumber };
  }

  async getInvoiceStats(tenantId: string) {
    const invoices = await prisma.saaSInvoice.findMany({ where: { tenantId }, select: { status: true, totalAmount: true, amountPaid: true, amountDue: true } });
    return {
      totalInvoices: invoices.length,
      paidCount: invoices.filter((i) => i.status === 'PAID').length,
      pendingCount: invoices.filter((i) => i.status === 'PENDING').length,
      overdueCount: invoices.filter((i) => i.status === 'OVERDUE').length,
      draftCount: invoices.filter((i) => i.status === 'DRAFT').length,
      cancelledCount: invoices.filter((i) => i.status === 'CANCELLED').length,
      refundedCount: invoices.filter((i) => i.status === 'REFUNDED').length,
      totalPaid: invoices.filter((i) => i.status === 'PAID').reduce((s, i) => s + Number(i.totalAmount), 0),
      totalOutstanding: invoices.filter((i) => i.status === 'PENDING' || i.status === 'OVERDUE').reduce((s, i) => s + Number(i.amountDue), 0),
    };
  }

  async getUpcomingInvoices(tenantId: string) {
    const sub = await prisma.tenantSubscription.findFirst({
      where: { tenantId, status: { in: ['ACTIVE', 'TRIAL'] } },
      include: { plan: { include: { prices: { where: { isActive: true } } } }, addOns: { include: { addon: true } } },
    });
    if (!sub) return null;

    const usdPrice = (sub.plan as any).prices?.[0] ? Number((sub.plan as any).prices[0].monthly) : 0;
    const planCost = sub.billingPeriod === 'YEARLY' ? usdPrice * 12 : usdPrice;
    let total = planCost;

    const lineItems: Array<{ description: string; type: string; amount: number }> = [{ description: `Plan: ${sub.plan.name}`, type: 'PLAN', amount: planCost }];
    for (const tao of sub.addOns) {
      const cost = Number(tao.addon.price) * tao.quantity;
      total += cost;
      lineItems.push({ description: `Add-On: ${tao.addon.name} x${tao.quantity}`, type: 'ADDON', amount: cost });
    }

    return { nextBillingDate: sub.endDate, billingPeriod: sub.billingPeriod, currency: sub.currency, estimatedTotal: total, lineItems };
  }
}
