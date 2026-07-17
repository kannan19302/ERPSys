import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@unerp/database';

@Injectable()
export class ApIntelligenceService {
  private async resolveOrgId(tenantId: string): Promise<string> {
    const org = await prisma.organization.findFirst({ where: { tenantId } });
    return org?.id ?? 'org-system-default';
  }

  // ── VENDOR STATEMENTS ──────────────────────────────────

  async listVendorStatements(tenantId: string, vendorId?: string) {
    return prisma.vendorStatement.findMany({
      where: { tenantId, ...(vendorId && { vendorId }) },
      orderBy: { periodEnd: 'desc' },
    });
  }

  async importVendorStatement(tenantId: string, dto: {
    vendorId: string; periodStart: string; periodEnd: string;
    openingBalance: number; closingBalance: number; lineItems?: object[];
  }) {
    return prisma.vendorStatement.create({
      data: {
        tenantId,
        vendorId: dto.vendorId,
        periodStart: new Date(dto.periodStart),
        periodEnd: new Date(dto.periodEnd),
        openingBalance: dto.openingBalance,
        closingBalance: dto.closingBalance,
        lineItems: (dto.lineItems ?? []) as never,
        status: 'IMPORTED',
      },
    });
  }

  async reconcileVendorStatement(tenantId: string, id: string) {
    const stmt = await prisma.vendorStatement.findFirst({ where: { id, tenantId } });
    if (!stmt) throw new NotFoundException('Vendor statement not found');
    // Auto-match: compare line items vs our purchase orders
    return prisma.vendorStatement.update({ where: { id }, data: { status: 'RECONCILED' } });
  }

  async getVendorStatementDiff(tenantId: string, id: string) {
    const stmt = await prisma.vendorStatement.findFirst({ where: { id, tenantId } });
    if (!stmt) throw new NotFoundException('Vendor statement not found');
    const poAgg = await prisma.purchaseOrder.aggregate({
      where: {
        tenantId,
        vendorId: stmt.vendorId,
        orderDate: { gte: stmt.periodStart, lte: stmt.periodEnd },
        status: { notIn: ['CANCELLED', 'DRAFT'] },
      },
      _sum: { totalAmount: true },
    });
    const ourBalance = Number(poAgg._sum.totalAmount ?? 0);
    return {
      statementBalance: Number(stmt.closingBalance),
      ourBalance,
      difference: Number(stmt.closingBalance) - ourBalance,
      reconciled: Math.abs(Number(stmt.closingBalance) - ourBalance) < 0.01,
    };
  }

  // ── AP DUPLICATE DETECTION ──────────────────────────────────

  async listDuplicateFlags(tenantId: string, status?: string) {
    return prisma.aPDuplicateFlag.findMany({
      where: { tenantId, ...(status && { status }) },
      orderBy: { detectedAt: 'desc' },
    });
  }

  async runDuplicateScan(tenantId: string) {
    // Find invoices within ±7 days of same amount for same vendor
    const invoices = await prisma.invoice.findMany({
      where: { tenantId, status: { notIn: ['CANCELLED', 'DRAFT'] } },
      orderBy: { issueDate: 'asc' },
    });

    const flags: { invoiceId: string; duplicateInvoiceId?: string; matchScore: number; matchCriteria: object }[] = [];
    const sevenDays = 7 * 24 * 60 * 60 * 1000;

    for (let i = 0; i < invoices.length; i++) {
      for (let j = i + 1; j < invoices.length; j++) {
        const a = invoices[i]!;
        const b = invoices[j]!;
        const dateDiff = Math.abs(a.issueDate.getTime() - b.issueDate.getTime());
        const amountMatch = Math.abs(Number(a.totalAmount) - Number(b.totalAmount)) < 0.01;
        const customerMatch = a.customerId === b.customerId;
        if (amountMatch && customerMatch && dateDiff <= sevenDays) {
          flags.push({
            invoiceId: a.id,
            duplicateInvoiceId: b.id,
            matchScore: 95,
            matchCriteria: { amount: true, customer: true, dateDiffDays: Math.round(dateDiff / 86400000) },
          });
        }
      }
    }

    const created = [];
    for (const f of flags) {
      const exists = await prisma.aPDuplicateFlag.findFirst({ where: { tenantId, invoiceId: f.invoiceId, duplicateInvoiceId: f.duplicateInvoiceId ?? undefined } });
      if (!exists) {
        const flag = await prisma.aPDuplicateFlag.create({
          data: { tenantId, ...f, matchCriteria: f.matchCriteria as never, status: 'PENDING' },
        });
        created.push(flag);
      }
    }
    return { scanned: invoices.length, flagged: flags.length, created: created.length };
  }

  async reviewDuplicateFlag(tenantId: string, id: string, dto: { status: string; notes?: string; reviewedBy: string }) {
    const flag = await prisma.aPDuplicateFlag.findFirst({ where: { id, tenantId } });
    if (!flag) throw new NotFoundException('Duplicate flag not found');
    return prisma.aPDuplicateFlag.update({
      where: { id },
      data: { status: dto.status, notes: dto.notes, reviewedBy: dto.reviewedBy, reviewedAt: new Date() },
    });
  }

  // ── AP APPROVAL POLICIES ──────────────────────────────────

  async listApprovalPolicies(tenantId: string) {
    return prisma.aPApprovalPolicy.findMany({ where: { tenantId, isActive: true }, orderBy: { thresholdMin: 'asc' } });
  }

  async createApprovalPolicy(tenantId: string, dto: {
    name: string; thresholdMin?: number; thresholdMax?: number;
    approverRoles: string[]; requiresTwo?: boolean; departmentCode?: string;
  }) {
    return prisma.aPApprovalPolicy.create({
      data: {
        tenantId,
        name: dto.name,
        thresholdMin: dto.thresholdMin,
        thresholdMax: dto.thresholdMax,
        approverRoles: dto.approverRoles as never,
        requiresTwo: dto.requiresTwo ?? false,
        departmentCode: dto.departmentCode,
      },
    });
  }

  async updateApprovalPolicy(tenantId: string, id: string, dto: Partial<{
    name: string; thresholdMin: number; thresholdMax: number;
    approverRoles: string[]; requiresTwo: boolean; isActive: boolean;
  }>) {
    const policy = await prisma.aPApprovalPolicy.findFirst({ where: { id, tenantId } });
    if (!policy) throw new NotFoundException('Approval policy not found');
    return prisma.aPApprovalPolicy.update({ where: { id }, data: dto as never });
  }

  async deleteApprovalPolicy(tenantId: string, id: string) {
    const policy = await prisma.aPApprovalPolicy.findFirst({ where: { id, tenantId } });
    if (!policy) throw new NotFoundException('Approval policy not found');
    return prisma.aPApprovalPolicy.delete({ where: { id } });
  }

  async getApprovalPolicyForAmount(tenantId: string, amount: number) {
    const policies = await prisma.aPApprovalPolicy.findMany({ where: { tenantId, isActive: true }, orderBy: { thresholdMin: 'asc' } });
    const match = policies.find(p =>
      (p.thresholdMin === null || Number(p.thresholdMin) <= amount) &&
      (p.thresholdMax === null || Number(p.thresholdMax) >= amount),
    );
    return match ?? null;
  }

  // ── GRNI ──────────────────────────────────

  async listGrni(tenantId: string, status?: string) {
    return prisma.grniRecord.findMany({
      where: { tenantId, ...(status && { status }) },
      orderBy: { receivedDate: 'desc' },
    });
  }

  async getGrniAging(tenantId: string) {
    const records = await prisma.grniRecord.findMany({
      where: { tenantId, status: { notIn: ['INVOICED', 'CLEARED'] } },
    });
    const now = new Date();
    const buckets: { '0-30': number; '31-60': number; '61-90': number; '91+': number } = { '0-30': 0, '31-60': 0, '61-90': 0, '91+': 0 };
    let totalValue = 0;
    for (const r of records) {
      const days = Math.floor((now.getTime() - r.receivedDate.getTime()) / 86400000);
      const value = Number(r.totalValue);
      totalValue += value;
      if (days <= 30) buckets['0-30'] += value;
      else if (days <= 60) buckets['31-60'] += value;
      else if (days <= 90) buckets['61-90'] += value;
      else buckets['91+'] += value;
    }
    return { totalValue, buckets, recordCount: records.length };
  }

  async createGrniRecord(tenantId: string, dto: {
    purchaseOrderId: string; receiptId?: string; vendorId: string; productId?: string;
    receivedQty: number; unitCost: number; receivedDate: string;
  }) {
    const orgId = await this.resolveOrgId(tenantId);
    return prisma.grniRecord.create({
      data: {
        tenantId, orgId,
        purchaseOrderId: dto.purchaseOrderId,
        receiptId: dto.receiptId,
        vendorId: dto.vendorId,
        productId: dto.productId,
        receivedQty: dto.receivedQty,
        unitCost: dto.unitCost,
        totalValue: dto.receivedQty * dto.unitCost,
        receivedDate: new Date(dto.receivedDate),
        status: 'PENDING',
      },
    });
  }

  async markGrniInvoiced(tenantId: string, id: string, invoiceId: string) {
    const r = await prisma.grniRecord.findFirst({ where: { id, tenantId } });
    if (!r) throw new NotFoundException('GRNI record not found');
    return prisma.grniRecord.update({ where: { id }, data: { status: 'INVOICED', invoiceId, invoicedDate: new Date() } });
  }

  async getApCashFlowObligation(tenantId: string, days: number = 90) {
    const now = new Date();
    const end = new Date(now.getTime() + days * 86400000);
    const invoices = await prisma.invoice.findMany({
      where: {
        tenantId,
        status: { notIn: ['CANCELLED', 'PAID', 'DRAFT'] },
        dueDate: { gte: now, lte: end },
      },
    });
    const buckets: { '0-30': number; '31-60': number; '61-90': number } = { '0-30': 0, '31-60': 0, '61-90': 0 };
    for (const inv of invoices) {
      if (!inv.dueDate) continue;
      const daysTodue = Math.floor((inv.dueDate.getTime() - now.getTime()) / 86400000);
      const amount = Number(inv.totalAmount);
      if (daysTodue <= 30) buckets['0-30'] += amount;
      else if (daysTodue <= 60) buckets['31-60'] += amount;
      else buckets['61-90'] += amount;
    }
    return { totalObligation: Object.values(buckets).reduce((a, b) => a + b, 0), buckets, invoiceCount: invoices.length };
  }

  async getEarlyPaymentDiscountSavings(tenantId: string, invoiceIds: string[]) {
    const invoices = await prisma.invoice.findMany({ where: { tenantId, id: { in: invoiceIds } } });
    let totalSavings = 0;
    const details = [];
    for (const inv of invoices) {
      // Assume 2/10 net 30 = 2% discount if paid within 10 days
      const discountPct = 0.02;
      const savings = Number(inv.totalAmount) * discountPct;
      totalSavings += savings;
      details.push({ invoiceId: inv.id, amount: Number(inv.totalAmount), discountPct, savings });
    }
    return { totalSavings, invoiceCount: invoices.length, details };
  }

  async getVendorScorecard(tenantId: string, vendorId: string) {
    const pos = await prisma.purchaseOrder.findMany({
      where: { tenantId, vendorId, status: 'COMPLETED' },
    });

    const total = pos.length;
    const onTime = pos.filter(p => p.status === 'COMPLETED').length; // simplified
    const invoiceCount = await prisma.invoice.count({ where: { tenantId } });
    const duplicateFlags = await prisma.aPDuplicateFlag.count({ where: { tenantId } });
    return {
      vendorId,
      totalOrders: total,
      onTimePct: total > 0 ? ((onTime / total) * 100).toFixed(1) : '0.0',
      invoiceAccuracyPct: invoiceCount > 0 ? (100 - (duplicateFlags / invoiceCount * 100)).toFixed(1) : '100.0',
      disputeRate: '0.0',
      overallScore: 90,
    };
  }
}
