import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';

@Injectable()
export class ArCollectionsService {
  private async resolveOrgId(tenantId: string): Promise<string> {
    const org = await prisma.organization.findFirst({ where: { tenantId } });
    return org?.id ?? 'org-system-default';
  }

  // ── PROMISES TO PAY ──────────────────────────────────

  async listPromisesToPay(tenantId: string, customerId?: string, status?: string) {
    return prisma.aRPromiseToPay.findMany({
      where: { tenantId, ...(customerId && { customerId }), ...(status && { status }) },
      orderBy: { promisedDate: 'asc' },
    });
  }

  async createPromiseToPay(tenantId: string, dto: {
    customerId: string; invoiceId: string; promisedDate: string;
    promisedAmount: number; collectorId?: string; notes?: string;
  }) {
    return prisma.aRPromiseToPay.create({
      data: {
        tenantId,
        customerId: dto.customerId,
        invoiceId: dto.invoiceId,
        promisedDate: new Date(dto.promisedDate),
        promisedAmount: dto.promisedAmount,
        receivedAmount: 0,
        collectorId: dto.collectorId,
        notes: dto.notes,
        status: 'PROMISED',
      },
    });
  }

  async updatePromiseToPay(tenantId: string, id: string, dto: Partial<{
    status: string; receivedAmount: number; notes: string;
  }>) {
    const p = await prisma.aRPromiseToPay.findFirst({ where: { id, tenantId } });
    if (!p) throw new NotFoundException('Promise to pay not found');
    return prisma.aRPromiseToPay.update({ where: { id }, data: dto });
  }

  async checkBrokenPromises(tenantId: string) {
    const now = new Date();
    const broken = await prisma.aRPromiseToPay.findMany({
      where: {
        tenantId,
        status: 'PROMISED',
        promisedDate: { lt: now },
      },
    });
    const updated = [];
    for (const p of broken) {
      if (Number(p.receivedAmount) < Number(p.promisedAmount)) {
        const upd = await prisma.aRPromiseToPay.update({ where: { id: p.id }, data: { status: 'BROKEN' } });
        updated.push(upd);
      }
    }
    return { brokenCount: updated.length, updated };
  }

  // ── AR DISPUTES ──────────────────────────────────

  async listDisputes(tenantId: string, status?: string) {
    return prisma.aRDispute.findMany({
      where: { tenantId, ...(status && { status }) },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getDispute(tenantId: string, id: string) {
    const d = await prisma.aRDispute.findFirst({ where: { id, tenantId } });
    if (!d) throw new NotFoundException('Dispute not found');
    return d;
  }

  async createDispute(tenantId: string, dto: {
    invoiceId: string; customerId: string; reason: string;
    disputedAmount: number; openedBy: string; assignedTo?: string; notes?: string;
  }) {
    return prisma.aRDispute.create({ data: { tenantId, ...dto, status: 'OPEN' } });
  }

  async updateDispute(tenantId: string, id: string, dto: Partial<{
    status: string; assignedTo: string; resolvedAmount: number;
    linkedCreditNoteId: string; notes: string;
  }>) {
    await this.getDispute(tenantId, id);
    const data: Record<string, unknown> = { ...dto };
    if (dto.status === 'RESOLVED') data.resolvedAt = new Date();
    return prisma.aRDispute.update({ where: { id }, data });
  }

  async escalateDispute(tenantId: string, id: string) {
    await this.getDispute(tenantId, id);
    return prisma.aRDispute.update({ where: { id }, data: { status: 'ESCALATED' } });
  }

  // ── BAD DEBT PROVISIONS ──────────────────────────────────

  async listBadDebtProvisions(tenantId: string) {
    return prisma.badDebtProvision.findMany({ where: { tenantId }, orderBy: { period: 'desc' } });
  }

  async computeBadDebtProvision(tenantId: string, period: string) {
    const orgId = await this.resolveOrgId(tenantId);
    const now = new Date();
    // Aging buckets with provision %: 90+ days = 10%, 180+ = 25%, 365+ = 50%
    const openInvoices = await prisma.invoice.findMany({
      where: { tenantId, status: { notIn: ['PAID', 'CANCELLED', 'DRAFT'] } },
    });
    let provisionAmount = 0;
    const details: { invoiceId: string; amount: number; agingDays: number; provisionPct: number; provision: number }[] = [];
    for (const inv of openInvoices) {
      if (!inv.dueDate) continue;
      const agingDays = Math.floor((now.getTime() - inv.dueDate.getTime()) / 86400000);
      let provisionPct = 0;
      if (agingDays >= 365) provisionPct = 0.5;
      else if (agingDays >= 180) provisionPct = 0.25;
      else if (agingDays >= 90) provisionPct = 0.1;
      if (provisionPct > 0) {
        const provision = Number(inv.totalAmount) * provisionPct;
        provisionAmount += provision;
        details.push({ invoiceId: inv.id, amount: Number(inv.totalAmount), agingDays, provisionPct, provision });
      }
    }
    return prisma.badDebtProvision.create({
      data: {
        tenantId, orgId, period,
        method: 'AGING_BUCKET',
        provisionAmount,
        details: details as never,
        status: 'DRAFT',
      },
    });
  }

  async postBadDebtProvision(tenantId: string, id: string, _glAccountId?: string) {
    const prov = await prisma.badDebtProvision.findFirst({ where: { id, tenantId } });
    if (!prov) throw new NotFoundException('Bad debt provision not found');
    if (prov.status !== 'DRAFT') throw new BadRequestException('Only DRAFT provisions can be posted');
    return prisma.badDebtProvision.update({ where: { id }, data: { status: 'POSTED', postedAt: new Date() } });
  }

  // ── COLLECTOR WORKBENCH ──────────────────────────────────

  async getCollectorWorkbench(tenantId: string, collectorId?: string) {
    const now = new Date();
    const overdueInvoices = await prisma.invoice.findMany({
      where: {
        tenantId,
        status: { notIn: ['PAID', 'CANCELLED', 'DRAFT'] },
        dueDate: { lt: now },
      },
      include: { customer: true },
      orderBy: { dueDate: 'asc' },
      take: 50,
    });

    const customerSummaries = new Map<string, {
      customerId: string; customerName: string; overdueBalance: number;
      oldestDueDate: Date; invoiceCount: number; lastContactDate?: Date;
    }>();

    for (const inv of overdueInvoices) {
      const cid = inv.customerId ?? '';
      if (!customerSummaries.has(cid)) {
        customerSummaries.set(cid, {
          customerId: cid,
          customerName: inv.customer?.name ?? 'Unknown',
          overdueBalance: 0,
          oldestDueDate: inv.dueDate!,
          invoiceCount: 0,
        });
      }
      const cs = customerSummaries.get(cid)!;
      cs.overdueBalance += Number(inv.totalAmount);
      cs.invoiceCount++;
      if (inv.dueDate && inv.dueDate < cs.oldestDueDate) cs.oldestDueDate = inv.dueDate;
    }

    const promises = await prisma.aRPromiseToPay.findMany({
      where: { tenantId, status: 'PROMISED', ...(collectorId && { collectorId }) },
    });

    return {
      overdueCustomers: Array.from(customerSummaries.values()),
      totalOverdueBalance: Array.from(customerSummaries.values()).reduce((s, c) => s + c.overdueBalance, 0),
      activePromises: promises.length,
    };
  }

  // ── DSO ANALYTICS ──────────────────────────────────

  async getDsoTrend(tenantId: string, months: number = 12) {
    const result: { month: string; dso: number }[] = [];
    const now = new Date();
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      const agg = await prisma.invoice.aggregate({
        where: {
          tenantId,
          issueDate: { gte: d, lte: endOfMonth },
          status: { notIn: ['DRAFT', 'CANCELLED'] },
        },
        _sum: { totalAmount: true },
        _count: { id: true },
      });
      const paidAgg = await prisma.payment.aggregate({
        where: {
          tenantId,
          paidAt: { gte: d, lte: endOfMonth },
        },
        _sum: { amount: true },
      });
      const revenue = Number(agg._sum.totalAmount ?? 0);
      const collected = Number(paidAgg._sum?.amount ?? 0);
      const dso = revenue > 0 ? Math.round((collected / revenue) * 30) : 0;
      result.push({ month: monthStr, dso });
    }
    return result;
  }

  async getArPerformanceDashboard(tenantId: string) {
    const [totalOpen, disputes, promises, provisions] = await Promise.all([
      prisma.invoice.count({ where: { tenantId, status: { notIn: ['PAID', 'CANCELLED', 'DRAFT'] } } }),
      prisma.aRDispute.count({ where: { tenantId, status: 'OPEN' } }),
      prisma.aRPromiseToPay.count({ where: { tenantId, status: 'PROMISED' } }),
      prisma.badDebtProvision.aggregate({ where: { tenantId, status: 'POSTED' }, _sum: { provisionAmount: true } }),
    ]);
    return {
      openInvoices: totalOpen,
      openDisputes: disputes,
      activePromises: promises,
      totalProvision: Number(provisions._sum.provisionAmount ?? 0),
    };
  }
}
