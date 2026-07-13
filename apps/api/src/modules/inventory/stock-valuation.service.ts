import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { Prisma } from '@prisma/client';

@Injectable()
export class StockValuationService {
  // ── Valuation Policies ───────────────────────────────────────────────────────

  async listPolicies(tenantId: string) {
    return prisma.stockValuationPolicy.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPolicy(tenantId: string, id: string) {
    const p = await prisma.stockValuationPolicy.findFirst({ where: { tenantId, id } });
    if (!p) throw new NotFoundException('Valuation policy not found');
    return p;
  }

  async upsertPolicy(tenantId: string, createdBy: string, dto: {
    productId?: string;
    warehouseId?: string;
    method: string;
    standardCost?: number;
    currency?: string;
    notes?: string;
  }) {
    return prisma.stockValuationPolicy.upsert({
      where: {
        tenantId_productId_warehouseId: {
          tenantId,
          productId: dto.productId ?? null as unknown as string,
          warehouseId: dto.warehouseId ?? null as unknown as string,
        },
      },
      create: {
        tenantId,
        productId: dto.productId,
        warehouseId: dto.warehouseId,
        method: dto.method as never,
        standardCost: dto.standardCost != null ? new Prisma.Decimal(dto.standardCost) : null,
        currency: dto.currency ?? 'USD',
        notes: dto.notes,
        createdBy,
      },
      update: {
        method: dto.method as never,
        ...(dto.standardCost != null && { standardCost: new Prisma.Decimal(dto.standardCost) }),
        ...(dto.currency && { currency: dto.currency }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
    });
  }

  async deactivatePolicy(tenantId: string, id: string) {
    await this.getPolicy(tenantId, id);
    return prisma.stockValuationPolicy.update({
      where: { id },
      data: { isActive: false, effectiveTo: new Date() },
    });
  }

  // ── Valuation Ledger ─────────────────────────────────────────────────────────

  async postLedgerEntry(tenantId: string, dto: {
    productId: string;
    warehouseId?: string;
    method: string;
    transactionType: string;
    transactionRef: string;
    qty: number;
    unitCost: number;
  }) {
    // Compute running totals from last entry
    const last = await prisma.stockValuationLedger.findFirst({
      where: { tenantId, productId: dto.productId, warehouseId: dto.warehouseId ?? null },
      orderBy: { postedAt: 'desc' },
    });

    const prevQty = Number(last?.runningQty ?? 0);
    const prevValue = Number(last?.runningValue ?? 0);
    const totalCost = dto.qty * dto.unitCost;
    const newQty = prevQty + dto.qty;
    const newValue = prevValue + totalCost;
    const avgCost = newQty !== 0 ? newValue / newQty : 0;

    return prisma.stockValuationLedger.create({
      data: {
        tenantId,
        productId: dto.productId,
        warehouseId: dto.warehouseId,
        method: dto.method as never,
        transactionType: dto.transactionType,
        transactionRef: dto.transactionRef,
        qty: new Prisma.Decimal(dto.qty),
        unitCost: new Prisma.Decimal(dto.unitCost),
        totalCost: new Prisma.Decimal(totalCost),
        runningQty: new Prisma.Decimal(newQty),
        runningValue: new Prisma.Decimal(newValue),
        runningAvgCost: new Prisma.Decimal(avgCost),
      },
    });
  }

  async getLedger(tenantId: string, productId?: string, warehouseId?: string, limit = 100) {
    return prisma.stockValuationLedger.findMany({
      where: {
        tenantId,
        ...(productId ? { productId } : {}),
        ...(warehouseId ? { warehouseId } : {}),
      },
      orderBy: { postedAt: 'desc' },
      take: limit,
    });
  }

  async getProductValuation(tenantId: string, productId: string, warehouseId?: string) {
    const last = await prisma.stockValuationLedger.findFirst({
      where: { tenantId, productId, ...(warehouseId ? { warehouseId } : {}) },
      orderBy: { postedAt: 'desc' },
    });
    if (!last) return { productId, warehouseId, qty: 0, value: 0, avgCost: 0 };
    return {
      productId,
      warehouseId,
      qty: Number(last.runningQty),
      value: Number(last.runningValue),
      avgCost: Number(last.runningAvgCost ?? 0),
      method: last.method,
      lastUpdated: last.postedAt,
    };
  }

  // ── FIFO / LIFO / WAC cost layer calculations ────────────────────────────────

  async computeIssueCost(tenantId: string, productId: string, warehouseId: string | undefined, issueQty: number, method: string) {
    const entries = await prisma.stockValuationLedger.findMany({
      where: {
        tenantId, productId,
        ...(warehouseId ? { warehouseId } : {}),
        transactionType: 'RECEIPT',
        status: 'ACTIVE',
      },
      orderBy: method === 'LIFO' ? { postedAt: 'desc' } : { postedAt: 'asc' },
    });

    if (method === 'WEIGHTED_AVG') {
      const last = await prisma.stockValuationLedger.findFirst({
        where: { tenantId, productId, ...(warehouseId ? { warehouseId } : {}) },
        orderBy: { postedAt: 'desc' },
      });
      const avgCost = Number(last?.runningAvgCost ?? 0);
      return { method, issueCost: avgCost * issueQty, unitCost: avgCost };
    }

    let remaining = issueQty;
    let totalCost = 0;
    for (const e of entries) {
      if (remaining <= 0) break;
      const available = Number(e.qty);
      const used = Math.min(available, remaining);
      totalCost += used * Number(e.unitCost);
      remaining -= used;
    }
    const unitCost = issueQty > 0 ? totalCost / issueQty : 0;
    return { method, issueCost: totalCost, unitCost };
  }

  // ── Cost Adjustments ─────────────────────────────────────────────────────────

  async listAdjustments(tenantId: string, status?: string) {
    return prisma.costAdjustment.findMany({
      where: { tenantId, ...(status ? { status } : {}) },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAdjustment(tenantId: string, id: string) {
    const a = await prisma.costAdjustment.findFirst({ where: { tenantId, id } });
    if (!a) throw new NotFoundException('Cost adjustment not found');
    return a;
  }

  async createAdjustment(tenantId: string, createdBy: string, dto: {
    productId: string;
    warehouseId?: string;
    oldUnitCost: number;
    newUnitCost: number;
    qty: number;
    reason: string;
  }) {
    const seq = await prisma.costAdjustment.count({ where: { tenantId } });
    const adjustmentNumber = `CAD-${String(seq + 1).padStart(5, '0')}`;
    const impactAmount = (dto.newUnitCost - dto.oldUnitCost) * dto.qty;
    return prisma.costAdjustment.create({
      data: {
        tenantId,
        adjustmentNumber,
        productId: dto.productId,
        warehouseId: dto.warehouseId,
        oldUnitCost: new Prisma.Decimal(dto.oldUnitCost),
        newUnitCost: new Prisma.Decimal(dto.newUnitCost),
        qty: new Prisma.Decimal(dto.qty),
        impactAmount: new Prisma.Decimal(impactAmount),
        reason: dto.reason,
        createdBy,
      },
    });
  }

  async approveAdjustment(tenantId: string, id: string, approvedBy: string) {
    const a = await this.getAdjustment(tenantId, id);
    if (a.status !== 'PENDING') throw new BadRequestException('Only PENDING adjustments can be approved');
    return prisma.costAdjustment.update({
      where: { id },
      data: { status: 'APPROVED', approvedBy, approvedAt: new Date() },
    });
  }

  async postAdjustment(tenantId: string, id: string) {
    const a = await this.getAdjustment(tenantId, id);
    if (a.status !== 'APPROVED') throw new BadRequestException('Only APPROVED adjustments can be posted');
    await prisma.stockValuationLedger.create({
      data: {
        tenantId,
        productId: a.productId,
        warehouseId: a.warehouseId ?? undefined,
        method: 'ACTUAL_COST' as never,
        transactionType: 'ADJUSTMENT',
        transactionRef: a.adjustmentNumber,
        qty: new Prisma.Decimal(0),
        unitCost: a.newUnitCost,
        totalCost: a.impactAmount,
        runningQty: new Prisma.Decimal(Number(a.qty)),
        runningValue: new Prisma.Decimal(Number(a.newUnitCost) * Number(a.qty)),
        runningAvgCost: a.newUnitCost,
      },
    });
    return prisma.costAdjustment.update({
      where: { id },
      data: { status: 'POSTED', postedAt: new Date() },
    });
  }

  async rejectAdjustment(tenantId: string, id: string) {
    const a = await this.getAdjustment(tenantId, id);
    if (a.status !== 'PENDING') throw new BadRequestException('Only PENDING adjustments can be rejected');
    return prisma.costAdjustment.update({ where: { id }, data: { status: 'REJECTED' } });
  }

  // ── Stock Revaluations ───────────────────────────────────────────────────────

  async listRevaluations(tenantId: string) {
    return prisma.stockRevaluation.findMany({
      where: { tenantId },
      include: { lines: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getRevaluation(tenantId: string, id: string) {
    const r = await prisma.stockRevaluation.findFirst({
      where: { tenantId, id },
      include: { lines: true },
    });
    if (!r) throw new NotFoundException('Revaluation not found');
    return r;
  }

  async createRevaluation(tenantId: string, createdBy: string, dto: {
    description?: string;
    revaluationDate: string;
    currency?: string;
    lines: { productId: string; warehouseId?: string; currentQty: number; currentUnitCost: number; newUnitCost: number }[];
  }) {
    const seq = await prisma.stockRevaluation.count({ where: { tenantId } });
    const revaluationNumber = `RVL-${String(seq + 1).padStart(5, '0')}`;
    const totalImpact = dto.lines.reduce((s, l) => s + (l.newUnitCost - l.currentUnitCost) * l.currentQty, 0);

    return prisma.stockRevaluation.create({
      data: {
        tenantId,
        revaluationNumber,
        description: dto.description,
        revaluationDate: new Date(dto.revaluationDate),
        currency: dto.currency ?? 'USD',
        totalImpact: new Prisma.Decimal(totalImpact),
        createdBy,
        lines: {
          create: dto.lines.map(l => ({
            tenantId,
            productId: l.productId,
            warehouseId: l.warehouseId,
            currentQty: new Prisma.Decimal(l.currentQty),
            currentUnitCost: new Prisma.Decimal(l.currentUnitCost),
            newUnitCost: new Prisma.Decimal(l.newUnitCost),
            impactAmount: new Prisma.Decimal((l.newUnitCost - l.currentUnitCost) * l.currentQty),
          })),
        },
      },
      include: { lines: true },
    });
  }

  async postRevaluation(tenantId: string, id: string) {
    const r = await this.getRevaluation(tenantId, id);
    if (r.status !== 'DRAFT') throw new BadRequestException('Only DRAFT revaluations can be posted');

    // Post a valuation ledger entry for each line
    for (const line of r.lines) {
      await prisma.stockValuationLedger.create({
        data: {
          tenantId,
          productId: line.productId,
          warehouseId: line.warehouseId ?? undefined,
          method: 'ACTUAL_COST' as never,
          transactionType: 'REVALUATION',
          transactionRef: r.revaluationNumber,
          qty: new Prisma.Decimal(0),
          unitCost: line.newUnitCost,
          totalCost: line.impactAmount,
          runningQty: line.currentQty,
          runningValue: new Prisma.Decimal(Number(line.currentQty) * Number(line.newUnitCost)),
          runningAvgCost: line.newUnitCost,
          status: 'REVALUED',
        },
      });
    }

    return prisma.stockRevaluation.update({
      where: { id },
      data: { status: 'POSTED', postedAt: new Date() },
    });
  }

  async cancelRevaluation(tenantId: string, id: string) {
    const r = await this.getRevaluation(tenantId, id);
    if (r.status === 'POSTED') throw new BadRequestException('Posted revaluations cannot be cancelled');
    return prisma.stockRevaluation.update({ where: { id }, data: { status: 'CANCELLED' } });
  }

  // ── Reports & Dashboard ──────────────────────────────────────────────────────

  async getDashboard(tenantId: string) {
    const [totalPolicies, activePolicies, totalAdjustments, pendingAdjustments, totalRevaluations, postedRevaluations] =
      await Promise.all([
        prisma.stockValuationPolicy.count({ where: { tenantId } }),
        prisma.stockValuationPolicy.count({ where: { tenantId, isActive: true } }),
        prisma.costAdjustment.count({ where: { tenantId } }),
        prisma.costAdjustment.count({ where: { tenantId, status: 'PENDING' } }),
        prisma.stockRevaluation.count({ where: { tenantId } }),
        prisma.stockRevaluation.count({ where: { tenantId, status: 'POSTED' } }),
      ]);

    const revalImpact = await prisma.stockRevaluation.aggregate({
      where: { tenantId, status: 'POSTED' },
      _sum: { totalImpact: true },
    });

    const adjustImpact = await prisma.costAdjustment.aggregate({
      where: { tenantId, status: 'POSTED' },
      _sum: { impactAmount: true },
    });

    return {
      totalPolicies,
      activePolicies,
      totalAdjustments,
      pendingAdjustments,
      totalRevaluations,
      postedRevaluations,
      totalRevaluationImpact: Number(revalImpact._sum.totalImpact ?? 0),
      totalAdjustmentImpact: Number(adjustImpact._sum.impactAmount ?? 0),
    };
  }

  async getVarianceReport(tenantId: string, productId?: string) {
    const adjustments = await prisma.costAdjustment.findMany({
      where: { tenantId, status: 'POSTED', ...(productId ? { productId } : {}) },
      orderBy: { postedAt: 'desc' },
    });

    const byProduct: Record<string, { count: number; totalImpact: number }> = {};
    for (const a of adjustments) {
      const key = a.productId;
      const entry = byProduct[key] ?? { count: 0, totalImpact: 0 };
      entry.count += 1;
      entry.totalImpact += Number(a.impactAmount);
      byProduct[key] = entry;
    }

    return { adjustments, byProduct };
  }

  async getValuationSummary(tenantId: string) {
    const entries = await prisma.stockValuationLedger.findMany({
      where: { tenantId, status: 'ACTIVE' },
      orderBy: [{ productId: 'asc' }, { postedAt: 'desc' }],
    });

    const byProduct = new Map<string, { productId: string; qty: number; value: number; avgCost: number; method: string }>();
    for (const e of entries) {
      if (!byProduct.has(e.productId)) {
        byProduct.set(e.productId, {
          productId: e.productId,
          qty: Number(e.runningQty),
          value: Number(e.runningValue),
          avgCost: Number(e.runningAvgCost ?? 0),
          method: e.method,
        });
      }
    }

    const totalValue = [...byProduct.values()].reduce((s, v) => s + v.value, 0);
    return { products: [...byProduct.values()], totalValue };
  }
}
