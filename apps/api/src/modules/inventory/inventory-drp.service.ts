import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { Prisma } from '@prisma/client';
import { z } from 'zod';

export const createPlanRunSchema = z.object({
  runNumber: z.string().min(1),
  horizonDays: z.number().int().positive().default(90),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  includeWarehouses: z.array(z.string()).optional(),
  notes: z.string().optional(),
});
export type CreatePlanRunInput = z.infer<typeof createPlanRunSchema>;

@Injectable()
export class InventoryDrpService {

  async listPlanRuns(tenantId: string, query: { page?: number; limit?: number }) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, query.limit ?? 20);
    const where: Prisma.DistributionPlanRunWhereInput = { tenantId };

    const [data, total] = await Promise.all([
      prisma.distributionPlanRun.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.distributionPlanRun.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) };
  }

  async getPlanRun(tenantId: string, id: string) {
    const record = await prisma.distributionPlanRun.findFirst({
      where: { id, tenantId },
      include: { plans: { orderBy: { priority: 'asc' } } },
    });
    if (!record) throw new NotFoundException('Plan run not found');
    return record;
  }

  async createPlanRun(tenantId: string, dto: CreatePlanRunInput) {
    const existing = await prisma.distributionPlanRun.findFirst({
      where: { tenantId, runNumber: dto.runNumber },
    });
    if (existing) throw new BadRequestException(`Plan run '${dto.runNumber}' already exists`);

    return prisma.distributionPlanRun.create({
      data: {
        tenantId,
        runNumber: dto.runNumber,
        status: 'DRAFT',
        horizonDays: dto.horizonDays,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        includeWarehouses: dto.includeWarehouses ?? [],
        notes: dto.notes ?? null,
      },
    });
  }

  async executePlanRun(tenantId: string, id: string) {
    const run = await prisma.distributionPlanRun.findFirst({ where: { id, tenantId } });
    if (!run) throw new NotFoundException('Plan run not found');
    if (run.status === 'RUNNING') throw new BadRequestException('Plan run is already running');
    if (run.status === 'COMPLETED') throw new BadRequestException('Plan run is already completed');

    await prisma.distributionPlanRun.update({ where: { id }, data: { status: 'RUNNING', startedAt: new Date() } });

    try {
      const warehouseFilter = run.includeWarehouses.length > 0 ? run.includeWarehouses : undefined;

      const warehouseWhere: Prisma.WarehouseWhereInput = { tenantId };
      if (warehouseFilter) warehouseWhere.id = { in: warehouseFilter };

      const warehouses = await prisma.warehouse.findMany({ where: warehouseWhere });
      const products = await prisma.product.findMany({ where: { tenantId } });

      const plans: Array<{
        tenantId: string;
        runId: string;
        productId: string;
        sourceWarehouseId: string | null;
        destWarehouseId: string;
        forecastDemand: Prisma.Decimal;
        projectedStock: Prisma.Decimal;
        suggestedTransfer: Prisma.Decimal;
        suggestedPO: Prisma.Decimal;
        priority: string;
        notes: string | null;
      }> = [];

      for (const wh of warehouses) {
        for (const product of products) {
          const stockLevel = await prisma.inventoryItem.findFirst({
            where: { tenantId, warehouseId: wh.id, productId: product.id },
          });

          const onHand = Number(stockLevel?.quantity ?? 0);
          const projectedStock = new Prisma.Decimal(onHand.toFixed(3));
          const forecastDemand = new Prisma.Decimal(0);
          const shortfall = forecastDemand.sub(projectedStock);

          let suggestedTransfer = new Prisma.Decimal(0);
          let suggestedPO = new Prisma.Decimal(0);
          let sourceWarehouseId: string | null = null;

          if (shortfall.isPositive()) {
            const sourceWh = warehouses.find((w) => w.id !== wh.id);
            if (sourceWh) {
              const sourceStock = await prisma.inventoryItem.findFirst({
                where: { tenantId, warehouseId: sourceWh.id, productId: product.id },
              });
              const sourceQty = new Prisma.Decimal(Number(sourceStock?.quantity ?? 0).toFixed(3));
              if (sourceQty.gte(shortfall)) {
                suggestedTransfer = shortfall;
                sourceWarehouseId = sourceWh.id;
              } else {
                suggestedTransfer = sourceQty;
                suggestedPO = shortfall.sub(sourceQty);
                sourceWarehouseId = sourceWh.id;
              }
            } else {
              suggestedPO = shortfall;
            }
          }

          const priority = shortfall.isPositive() ? (shortfall.gt(100) ? 'HIGH' : 'MEDIUM') : 'LOW';

          plans.push({
            tenantId,
            runId: id,
            productId: product.id,
            sourceWarehouseId,
            destWarehouseId: wh.id,
            forecastDemand,
            projectedStock,
            suggestedTransfer,
            suggestedPO,
            priority,
            notes: null,
          });
        }
      }

      await prisma.distributionPlan.createMany({ data: plans });

      await prisma.distributionPlanRun.update({
        where: { id },
        data: { status: 'COMPLETED', completedAt: new Date() },
      });

      return { plansCreated: plans.length, status: 'COMPLETED' };
    } catch (error) {
      await prisma.distributionPlanRun.update({
        where: { id },
        data: { status: 'FAILED' },
      });
      throw error;
    }
  }

  async getPlansByRun(
    tenantId: string,
    runId: string,
    query: { priority?: string; productId?: string; page?: number; limit?: number },
  ) {
    const run = await prisma.distributionPlanRun.findFirst({ where: { id: runId, tenantId } });
    if (!run) throw new NotFoundException('Plan run not found');

    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, query.limit ?? 20);
    const where: Prisma.DistributionPlanWhereInput = { tenantId, runId };
    if (query.priority) where.priority = query.priority;
    if (query.productId) where.productId = query.productId;

    const [data, total] = await Promise.all([
      prisma.distributionPlan.findMany({
        where,
        orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.distributionPlan.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) };
  }

  async listPlans(tenantId: string, query: { priority?: string; productId?: string; page?: number; limit?: number }) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, query.limit ?? 20);
    const where: Prisma.DistributionPlanWhereInput = { tenantId };
    if (query.priority) where.priority = query.priority;
    if (query.productId) where.productId = query.productId;

    const [data, total] = await Promise.all([
      prisma.distributionPlan.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.distributionPlan.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) };
  }
}
