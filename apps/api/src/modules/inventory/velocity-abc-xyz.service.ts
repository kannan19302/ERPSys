import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { Prisma } from '@prisma/client';

@Injectable()
export class VelocityAbcXyzService {

  // ── Classification Runs ────────────────────────────────────────────────────

  async listRuns(tenantId: string, query: { warehouseId?: string; status?: string; limit?: number; offset?: number }) {
    const where: Prisma.VelocityClassificationRunWhereInput = {
      tenantId,
      ...(query.warehouseId ? { warehouseId: query.warehouseId } : {}),
      ...(query.status ? { status: query.status as any } : {}),
    };
    const [data, total] = await Promise.all([
      prisma.velocityClassificationRun.findMany({
        where, orderBy: { createdAt: 'desc' },
        take: query.limit ?? 20, skip: query.offset ?? 0,
      }),
      prisma.velocityClassificationRun.count({ where }),
    ]);
    return { data, total };
  }

  async getRun(tenantId: string, runId: string) {
    const run = await prisma.velocityClassificationRun.findFirst({ where: { id: runId, tenantId } });
    if (!run) throw new NotFoundException(`Classification run ${runId} not found`);
    return run;
  }

  async createRun(tenantId: string, dto: {
    warehouseId?: string; periodStart: string; periodEnd: string;
    notes?: string; runByUserId: string;
  }) {
    const count = await prisma.velocityClassificationRun.count({ where: { tenantId } });
    const runNumber = `VCR-${String(count + 1).padStart(6, '0')}`;
    return prisma.velocityClassificationRun.create({
      data: {
        tenantId, runNumber,
        warehouseId: dto.warehouseId ?? null,
        periodStart: new Date(dto.periodStart),
        periodEnd: new Date(dto.periodEnd),
        notes: dto.notes,
        runByUserId: dto.runByUserId,
        status: 'DRAFT',
      },
    });
  }

  async deleteRun(tenantId: string, runId: string) {
    const run = await prisma.velocityClassificationRun.findFirst({ where: { id: runId, tenantId } });
    if (!run) throw new NotFoundException(`Classification run ${runId} not found`);
    if (run.status === 'ACTIVE') throw new BadRequestException('Cannot delete an ACTIVE classification run');
    await prisma.velocityClassificationItem.deleteMany({ where: { runId } });
    return prisma.velocityClassificationRun.delete({ where: { id: runId } });
  }

  // ── ABC-XYZ Computation ────────────────────────────────────────────────────

  /** Compute and persist ABC-XYZ classification items for a DRAFT run. */
  async computeClassification(tenantId: string, runId: string, items: Array<{
    productId: string; warehouseId?: string;
    totalRevenue: number; totalQuantitySold: number;
    monthlyDemandSeries: number[]; // demand per month for XYZ computation
  }>) {
    const run = await prisma.velocityClassificationRun.findFirst({ where: { id: runId, tenantId } });
    if (!run) throw new NotFoundException(`Classification run ${runId} not found`);
    if (run.status !== 'DRAFT') throw new BadRequestException('Can only compute on a DRAFT run');

    // ABC: sort by revenue desc, compute cumulative share
    const sorted = [...items].sort((a, b) => b.totalRevenue - a.totalRevenue);
    const grandTotal = sorted.reduce((s, i) => s + i.totalRevenue, 0);

    let cumulative = 0;
    const classified = sorted.map(item => {
      const share = grandTotal > 0 ? item.totalRevenue / grandTotal : 0;
      cumulative += share;
      const abcClass = cumulative <= 0.8 ? 'A' : cumulative <= 0.95 ? 'B' : 'C';

      // XYZ: coefficient of variation of monthly demand
      const series = item.monthlyDemandSeries;
      let xyzClass = 'Z';
      if (series.length >= 2) {
        const mean = series.reduce((s, v) => s + v, 0) / series.length;
        if (mean > 0) {
          const variance = series.reduce((s, v) => s + (v - mean) ** 2, 0) / series.length;
          const cv = Math.sqrt(variance) / mean;
          xyzClass = cv <= 0.25 ? 'X' : cv <= 0.5 ? 'Y' : 'Z';
        }
      }

      const mean = series.length > 0 ? series.reduce((s, v) => s + v, 0) / series.length : null;
      const stdDev = series.length >= 2 && mean !== null
        ? Math.sqrt(series.reduce((s, v) => s + (v - mean) ** 2, 0) / series.length)
        : null;
      const cv = mean && mean > 0 && stdDev !== null ? stdDev / mean : null;

      return { ...item, share, cumulative, abcClass, xyzClass, mean, stdDev, cv };
    });

    // Delete existing items for this run and re-insert
    await prisma.velocityClassificationItem.deleteMany({ where: { runId } });
    await prisma.velocityClassificationItem.createMany({
      data: classified.map(c => ({
        tenantId, runId,
        productId: c.productId,
        warehouseId: c.warehouseId ?? null,
        totalRevenue: new Prisma.Decimal(c.totalRevenue),
        totalQuantitySold: new Prisma.Decimal(c.totalQuantitySold),
        revenueShare: new Prisma.Decimal(c.share),
        cumulativeShare: new Prisma.Decimal(c.cumulative),
        demandCv: c.cv !== null ? new Prisma.Decimal(c.cv) : null,
        avgMonthlyDemand: c.mean !== null ? new Prisma.Decimal(c.mean) : null,
        stdDevDemand: c.stdDev !== null ? new Prisma.Decimal(c.stdDev) : null,
        abcClass: c.abcClass as any,
        xyzClass: c.xyzClass as any,
        combinedClass: `${c.abcClass}${c.xyzClass}`,
      })),
    });

    const counts = { A: 0, B: 0, C: 0, X: 0, Y: 0, Z: 0 };
    classified.forEach(c => {
      counts[c.abcClass as 'A' | 'B' | 'C']++;
      counts[c.xyzClass as 'X' | 'Y' | 'Z']++;
    });

    return prisma.velocityClassificationRun.update({
      where: { id: runId },
      data: {
        totalProducts: classified.length,
        classACount: counts.A, classBCount: counts.B, classCCount: counts.C,
        classXCount: counts.X, classYCount: counts.Y, classZCount: counts.Z,
      },
    });
  }

  async activateRun(tenantId: string, runId: string) {
    const run = await prisma.velocityClassificationRun.findFirst({ where: { id: runId, tenantId } });
    if (!run) throw new NotFoundException(`Classification run ${runId} not found`);
    if (run.status !== 'DRAFT') throw new BadRequestException('Only DRAFT runs can be activated');
    if (run.totalProducts === 0) throw new BadRequestException('Run has no computed items — run computeClassification first');

    // Supersede previous active run for same warehouse scope
    await prisma.velocityClassificationRun.updateMany({
      where: { tenantId, warehouseId: run.warehouseId, status: 'ACTIVE' },
      data: { status: 'SUPERSEDED' },
    });

    return prisma.velocityClassificationRun.update({
      where: { id: runId },
      data: { status: 'ACTIVE', activatedAt: new Date() },
    });
  }

  // ── Classification Items ───────────────────────────────────────────────────

  async listItems(tenantId: string, runId: string, query: {
    abcClass?: string; xyzClass?: string; combinedClass?: string;
    limit?: number; offset?: number;
  }) {
    const where: Prisma.VelocityClassificationItemWhereInput = {
      tenantId, runId,
      ...(query.abcClass ? { abcClass: query.abcClass as any } : {}),
      ...(query.xyzClass ? { xyzClass: query.xyzClass as any } : {}),
      ...(query.combinedClass ? { combinedClass: query.combinedClass } : {}),
    };
    const [data, total] = await Promise.all([
      prisma.velocityClassificationItem.findMany({
        where, orderBy: { cumulativeShare: 'asc' },
        take: query.limit ?? 50, skip: query.offset ?? 0,
      }),
      prisma.velocityClassificationItem.count({ where }),
    ]);
    return { data, total };
  }

  async getProductCurrentClass(tenantId: string, productId: string, warehouseId?: string) {
    // Find the most recent ACTIVE run's item for this product
    const item = await prisma.velocityClassificationItem.findFirst({
      where: {
        tenantId, productId,
        ...(warehouseId ? { warehouseId } : {}),
        run: { status: 'ACTIVE' },
      },
      include: { run: { select: { runNumber: true, periodStart: true, periodEnd: true, activatedAt: true } } },
      orderBy: { createdAt: 'desc' },
    });
    if (!item) return { productId, classified: false };
    const { productId: _pid, ...rest } = item as any;
    return { productId, classified: true, ...rest };
  }

  // ── Slotting Policies ──────────────────────────────────────────────────────

  async listPolicies(tenantId: string) {
    return prisma.velocitySlottingPolicy.findMany({
      where: { tenantId }, orderBy: { combinedClass: 'asc' },
    });
  }

  async upsertPolicy(tenantId: string, dto: {
    combinedClass: string; description?: string;
    reviewFrequency: string; reorderMethod: string;
    safetyStockMultiplier?: number; preferredZone?: string;
  }) {
    const existing = await prisma.velocitySlottingPolicy.findUnique({
      where: { tenantId_combinedClass: { tenantId, combinedClass: dto.combinedClass } },
    });
    const data = {
      description: dto.description,
      reviewFrequency: dto.reviewFrequency,
      reorderMethod: dto.reorderMethod,
      safetyStockMultiplier: dto.safetyStockMultiplier !== undefined
        ? new Prisma.Decimal(dto.safetyStockMultiplier) : undefined,
      preferredZone: dto.preferredZone,
    };
    if (existing) {
      return prisma.velocitySlottingPolicy.update({ where: { id: existing.id }, data });
    }
    return prisma.velocitySlottingPolicy.create({
      data: { tenantId, combinedClass: dto.combinedClass, ...data,
        safetyStockMultiplier: new Prisma.Decimal(dto.safetyStockMultiplier ?? 1),
        reviewFrequency: dto.reviewFrequency, reorderMethod: dto.reorderMethod },
    });
  }

  async deletePolicy(tenantId: string, policyId: string) {
    const policy = await prisma.velocitySlottingPolicy.findFirst({ where: { id: policyId, tenantId } });
    if (!policy) throw new NotFoundException(`Policy ${policyId} not found`);
    return prisma.velocitySlottingPolicy.delete({ where: { id: policyId } });
  }

  // ── Velocity Snapshots ─────────────────────────────────────────────────────

  async recordSnapshot(tenantId: string, dto: {
    productId: string; warehouseId?: string; snapshotMonth: string;
    quantitySold: number; revenue: number; transactionCount: number;
    avgSellingPrice?: number; abcClass?: string; xyzClass?: string;
  }) {
    const month = new Date(dto.snapshotMonth);
    month.setDate(1); month.setHours(0, 0, 0, 0);

    const existing = await prisma.productVelocitySnapshot.findFirst({
      where: { tenantId, productId: dto.productId,
        warehouseId: dto.warehouseId ?? null, snapshotMonth: month },
    });
    const data = {
      quantitySold: new Prisma.Decimal(dto.quantitySold),
      revenue: new Prisma.Decimal(dto.revenue),
      transactionCount: dto.transactionCount,
      avgSellingPrice: dto.avgSellingPrice !== undefined ? new Prisma.Decimal(dto.avgSellingPrice) : null,
      abcClass: dto.abcClass as any ?? null,
      xyzClass: dto.xyzClass as any ?? null,
    };
    if (existing) {
      return prisma.productVelocitySnapshot.update({ where: { id: existing.id }, data });
    }
    return prisma.productVelocitySnapshot.create({
      data: { tenantId, productId: dto.productId, warehouseId: dto.warehouseId ?? null,
        snapshotMonth: month, ...data },
    });
  }

  async getProductSnapshots(tenantId: string, productId: string, query: {
    warehouseId?: string; months?: number;
  }) {
    const since = new Date();
    since.setMonth(since.getMonth() - (query.months ?? 12));
    return prisma.productVelocitySnapshot.findMany({
      where: {
        tenantId, productId,
        ...(query.warehouseId ? { warehouseId: query.warehouseId } : {}),
        snapshotMonth: { gte: since },
      },
      orderBy: { snapshotMonth: 'asc' },
    });
  }

  // ── Dashboard ──────────────────────────────────────────────────────────────

  async getDashboard(tenantId: string) {
    const [totalRuns, activeRun, totalSnapshots] = await Promise.all([
      prisma.velocityClassificationRun.count({ where: { tenantId } }),
      prisma.velocityClassificationRun.findFirst({
        where: { tenantId, status: 'ACTIVE' },
        orderBy: { activatedAt: 'desc' },
      }),
      prisma.productVelocitySnapshot.count({ where: { tenantId } }),
    ]);

    let classBreakdown: Record<string, number> = {};
    if (activeRun) {
      const items = await prisma.velocityClassificationItem.groupBy({
        by: ['combinedClass'],
        where: { tenantId, runId: activeRun.id },
        _count: { id: true },
      });
      items.forEach(i => { classBreakdown[i.combinedClass] = i._count.id; });
    }

    const policyCount = await prisma.velocitySlottingPolicy.count({ where: { tenantId, active: true } });

    return {
      totalRuns,
      activeRun: activeRun ? {
        id: activeRun.id, runNumber: activeRun.runNumber,
        totalProducts: activeRun.totalProducts, activatedAt: activeRun.activatedAt,
        classACount: activeRun.classACount, classBCount: activeRun.classBCount, classCCount: activeRun.classCCount,
        classXCount: activeRun.classXCount, classYCount: activeRun.classYCount, classZCount: activeRun.classZCount,
      } : null,
      classBreakdown,
      totalSnapshots,
      activePolicies: policyCount,
    };
  }
}
