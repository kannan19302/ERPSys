import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { Prisma } from '@prisma/client';
import { z } from 'zod';

export const createForecastSchema = z.object({
  productId: z.string().min(1),
  warehouseId: z.string().optional(),
  forecastDate: z.string().datetime(),
  horizon: z.number().int().min(1).max(365),
  method: z.enum(['MOVING_AVG', 'WEIGHTED_AVG', 'EXPONENTIAL', 'LINEAR_REGRESSION']),
  forecastedQty: z.number().positive(),
  confidenceLow: z.number().optional(),
  confidenceHigh: z.number().optional(),
  notes: z.string().optional(),
});

export const updateActualSchema = z.object({
  actualQty: z.number().min(0),
});

export const calculateReorderPointSchema = z.object({
  productId: z.string().min(1),
  warehouseId: z.string().optional(),
  leadTimeDays: z.number().int().min(1),
  avgDailyDemand: z.number().min(0),
  serviceLevel: z.number().min(0.5).max(0.9999).default(0.95),
  safetyStock: z.number().min(0).optional(),
});

export const upsertSafetyStockConfigSchema = z.object({
  productId: z.string().min(1),
  warehouseId: z.string().optional(),
  method: z.enum(['FIXED', 'STATISTICAL', 'DEMAND_VARIABILITY']).default('FIXED'),
  fixedQty: z.number().min(0).optional(),
  coverageDays: z.number().int().min(0).optional(),
  serviceLevel: z.number().min(0.5).max(0.9999).optional(),
  demandStdDev: z.number().min(0).optional(),
  leadTimeStdDev: z.number().min(0).optional(),
});

export const createReplenishmentOrderSchema = z.object({
  productId: z.string().min(1),
  warehouseId: z.string().min(1),
  suggestedQty: z.number().positive(),
  uom: z.string().default('EA'),
  triggerType: z.enum(['ROP', 'FORECAST', 'MANUAL', 'MIN_MAX']),
  currentStock: z.number().min(0),
  reorderPoint: z.number().min(0).optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).default('NORMAL'),
  expectedDate: z.string().datetime().optional(),
  supplierId: z.string().optional(),
  notes: z.string().optional(),
});

export const approveReplenishmentSchema = z.object({
  approvedQty: z.number().positive(),
  notes: z.string().optional(),
});

export const generateStockoutPredictionsSchema = z.object({
  warehouseId: z.string().optional(),
  riskThresholdDays: z.number().int().min(1).default(30),
});

export const acknowledgeStockoutSchema = z.object({
  acknowledgedBy: z.string().min(1),
});

export const runForecastEngineSchema = z.object({
  productIds: z.array(z.string()).optional(),
  warehouseId: z.string().optional(),
  horizon: z.number().int().min(1).max(365).default(30),
  method: z.enum(['MOVING_AVG', 'WEIGHTED_AVG', 'EXPONENTIAL', 'LINEAR_REGRESSION']).default('MOVING_AVG'),
  lookbackDays: z.number().int().min(7).default(90),
});

export type CreateForecastDto = z.infer<typeof createForecastSchema>;
export type CalculateReorderPointDto = z.infer<typeof calculateReorderPointSchema>;
export type UpsertSafetyStockConfigDto = z.infer<typeof upsertSafetyStockConfigSchema>;
export type CreateReplenishmentOrderDto = z.infer<typeof createReplenishmentOrderSchema>;
export type ApproveReplenishmentDto = z.infer<typeof approveReplenishmentSchema>;
export type GenerateStockoutPredictionsDto = z.infer<typeof generateStockoutPredictionsSchema>;
export type RunForecastEngineDto = z.infer<typeof runForecastEngineSchema>;

@Injectable()
export class DemandForecastingService {
  async listForecasts(tenantId: string, productId?: string, status?: string) {
    return prisma.demandForecast.findMany({
      where: { tenantId, ...(productId && { productId }), ...(status && { status }) },
      orderBy: { forecastDate: 'desc' },
      take: 200,
    });
  }

  async createForecast(tenantId: string, createdBy: string, dto: CreateForecastDto) {
    return prisma.demandForecast.create({
      data: {
        tenantId,
        productId: dto.productId,
        warehouseId: dto.warehouseId,
        forecastDate: new Date(dto.forecastDate),
        horizon: dto.horizon,
        method: dto.method,
        forecastedQty: new Prisma.Decimal(dto.forecastedQty),
        confidenceLow: dto.confidenceLow != null ? new Prisma.Decimal(dto.confidenceLow) : undefined,
        confidenceHigh: dto.confidenceHigh != null ? new Prisma.Decimal(dto.confidenceHigh) : undefined,
        notes: dto.notes,
        createdBy,
      },
    });
  }

  async getForecast(tenantId: string, id: string) {
    const f = await prisma.demandForecast.findFirst({ where: { tenantId, id } });
    if (!f) throw new NotFoundException('Forecast not found');
    return f;
  }

  async updateActual(tenantId: string, id: string, dto: { actualQty: number }) {
    const f = await prisma.demandForecast.findFirst({ where: { tenantId, id } });
    if (!f) throw new NotFoundException('Forecast not found');
    const forecastedQty = Number(f.forecastedQty);
    const mape = forecastedQty > 0 ? Math.abs((dto.actualQty - forecastedQty) / forecastedQty) : null;
    return prisma.demandForecast.update({
      where: { id },
      data: {
        actualQty: new Prisma.Decimal(dto.actualQty),
        mape: mape != null ? new Prisma.Decimal(mape) : undefined,
      },
    });
  }

  async archiveForecast(tenantId: string, id: string) {
    const f = await prisma.demandForecast.findFirst({ where: { tenantId, id } });
    if (!f) throw new NotFoundException('Forecast not found');
    return prisma.demandForecast.update({ where: { id }, data: { status: 'ARCHIVED' } });
  }

  async runForecastEngine(tenantId: string, createdBy: string, dto: RunForecastEngineDto) {
    const productIds = dto.productIds && dto.productIds.length > 0
      ? dto.productIds
      : await prisma.demandForecast
          .findMany({ where: { tenantId }, select: { productId: true }, distinct: ['productId'] })
          .then((rows) => rows.map((r) => r.productId));

    const created: string[] = [];
    for (const productId of productIds.slice(0, 50)) {
      const prior = await prisma.demandForecast.findMany({
        where: { tenantId, productId, actualQty: { not: null } },
        orderBy: { forecastDate: 'desc' },
        take: dto.method === 'MOVING_AVG' ? 3 : 7,
      });

      let forecastedQty = 10;
      if (prior.length > 0) {
        const actuals = prior.map((p) => Number(p.actualQty));
        if (dto.method === 'MOVING_AVG') {
          forecastedQty = actuals.reduce((a, b) => a + b, 0) / actuals.length;
        } else if (dto.method === 'WEIGHTED_AVG') {
          const weights = actuals.map((_, i) => i + 1);
          const totalWeight = weights.reduce((a, b) => a + b, 0);
          forecastedQty = actuals.reduce((sum, v, i) => sum + v * (weights[i] ?? 1), 0) / totalWeight;
        } else if (dto.method === 'EXPONENTIAL') {
          const alpha = 0.3;
          forecastedQty = actuals.reduce((prev, curr) => alpha * curr + (1 - alpha) * prev);
        } else {
          const n = actuals.length;
          const xs = actuals.map((_, i) => i);
          const mx = xs.reduce((a, b) => a + b, 0) / n;
          const my = actuals.reduce((a, b) => a + b, 0) / n;
          const slope =
            xs.reduce((sum, x, i) => sum + (x - mx) * ((actuals[i] ?? 0) - my), 0) /
            (xs.reduce((sum, x) => sum + (x - mx) ** 2, 0) || 1);
          forecastedQty = my + slope * n;
        }
      }

      const forecastDate = new Date();
      forecastDate.setDate(forecastDate.getDate() + 1);

      const forecast = await prisma.demandForecast.create({
        data: {
          tenantId, productId,
          warehouseId: dto.warehouseId,
          forecastDate, horizon: dto.method ? dto.horizon : 30,
          method: dto.method,
          forecastedQty: new Prisma.Decimal(Math.max(0, forecastedQty)),
          confidenceLow: new Prisma.Decimal(Math.max(0, forecastedQty * 0.8)),
          confidenceHigh: new Prisma.Decimal(forecastedQty * 1.2),
          createdBy,
        },
      });
      created.push(forecast.id);

      await prisma.demandForecast.updateMany({
        where: { tenantId, productId, status: 'ACTIVE', id: { not: forecast.id } },
        data: { status: 'SUPERSEDED' },
      });
    }

    return { generated: created.length, forecastIds: created };
  }

  async listReorderPoints(tenantId: string, productId?: string, activeOnly?: boolean) {
    return prisma.reorderPoint.findMany({
      where: { tenantId, ...(productId && { productId }), ...(activeOnly && { isActive: true }) },
      orderBy: { calculatedAt: 'desc' },
    });
  }

  async calculateReorderPoint(tenantId: string, dto: CalculateReorderPointDto) {
    const zScores: Record<string, number> = { '0.9': 1.28, '0.95': 1.645, '0.99': 2.33 };
    const closest = Object.keys(zScores)
      .map(Number)
      .sort((a, b) => Math.abs(a - dto.serviceLevel) - Math.abs(b - dto.serviceLevel))[0];
    const z = closest != null ? (zScores[String(closest)] ?? 1.645) : 1.645;
    const safetyStock = dto.safetyStock != null
      ? dto.safetyStock
      : z * dto.avgDailyDemand * Math.sqrt(dto.leadTimeDays);
    const reorderPoint = dto.avgDailyDemand * dto.leadTimeDays + safetyStock;
    const reorderQty = dto.avgDailyDemand * dto.leadTimeDays * 2;

    return prisma.reorderPoint.upsert({
      where: {
        tenantId_productId_warehouseId: {
          tenantId, productId: dto.productId, warehouseId: dto.warehouseId ?? null,
        } as any,
      },
      create: {
        tenantId, productId: dto.productId, warehouseId: dto.warehouseId,
        reorderPoint: new Prisma.Decimal(reorderPoint),
        reorderQty: new Prisma.Decimal(reorderQty),
        safetyStock: new Prisma.Decimal(safetyStock),
        leadTimeDays: dto.leadTimeDays,
        avgDailyDemand: new Prisma.Decimal(dto.avgDailyDemand),
        serviceLevel: new Prisma.Decimal(dto.serviceLevel),
        calculatedAt: new Date(),
      },
      update: {
        reorderPoint: new Prisma.Decimal(reorderPoint),
        reorderQty: new Prisma.Decimal(reorderQty),
        safetyStock: new Prisma.Decimal(safetyStock),
        leadTimeDays: dto.leadTimeDays,
        avgDailyDemand: new Prisma.Decimal(dto.avgDailyDemand),
        serviceLevel: new Prisma.Decimal(dto.serviceLevel),
        calculatedAt: new Date(),
        isActive: true,
      },
    });
  }

  async getReorderPoint(tenantId: string, id: string) {
    const rp = await prisma.reorderPoint.findFirst({ where: { tenantId, id } });
    if (!rp) throw new NotFoundException('Reorder point not found');
    return rp;
  }

  async deactivateReorderPoint(tenantId: string, id: string) {
    const rp = await prisma.reorderPoint.findFirst({ where: { tenantId, id } });
    if (!rp) throw new NotFoundException('Reorder point not found');
    return prisma.reorderPoint.update({ where: { id }, data: { isActive: false } });
  }

  async checkReorderAlerts(tenantId: string) {
    const reorderPoints = await prisma.reorderPoint.findMany({ where: { tenantId, isActive: true } });
    const alerts = await Promise.all(
      reorderPoints.map(async (rp) => {
        const items = await prisma.stockEntryItem.findMany({
          where: {
            tenantId,
            productId: rp.productId,
            ...(rp.warehouseId && { toWarehouseId: rp.warehouseId }),
          },
        });
        const currentQty = items.reduce((sum, s) => sum + Number(s.qty), 0);
        const ropQty = Number(rp.reorderPoint);
        return {
          reorderPointId: rp.id,
          productId: rp.productId,
          warehouseId: rp.warehouseId,
          currentQty,
          reorderPoint: ropQty,
          safetyStock: Number(rp.safetyStock),
          belowRop: currentQty <= ropQty,
          belowSafetyStock: currentQty <= Number(rp.safetyStock),
          suggestedOrderQty: Number(rp.reorderQty),
        };
      }),
    );
    return alerts.filter((a) => a.belowRop);
  }

  async listSafetyStockConfigs(tenantId: string, productId?: string) {
    return prisma.safetyStockConfig.findMany({
      where: { tenantId, ...(productId && { productId }) },
    });
  }

  async upsertSafetyStockConfig(tenantId: string, dto: UpsertSafetyStockConfigDto) {
    let calculatedSafety: number | null = null;
    if (dto.method === 'FIXED' && dto.fixedQty != null) {
      calculatedSafety = dto.fixedQty;
    } else if (dto.method === 'STATISTICAL' && dto.demandStdDev != null) {
      const leadStd = dto.leadTimeStdDev ?? 0;
      const demStd = dto.demandStdDev;
      const days = dto.coverageDays ?? 1;
      calculatedSafety = 1.645 * Math.sqrt(leadStd ** 2 * demStd ** 2 + days * demStd ** 2);
    } else if (dto.method === 'DEMAND_VARIABILITY' && dto.demandStdDev != null && dto.coverageDays != null) {
      calculatedSafety = dto.demandStdDev * Math.sqrt(dto.coverageDays);
    }

    return prisma.safetyStockConfig.upsert({
      where: {
        tenantId_productId_warehouseId: {
          tenantId, productId: dto.productId, warehouseId: dto.warehouseId ?? null,
        } as any,
      },
      create: {
        tenantId, productId: dto.productId, warehouseId: dto.warehouseId,
        method: dto.method,
        fixedQty: dto.fixedQty != null ? new Prisma.Decimal(dto.fixedQty) : undefined,
        coverageDays: dto.coverageDays,
        serviceLevel: dto.serviceLevel != null ? new Prisma.Decimal(dto.serviceLevel) : undefined,
        demandStdDev: dto.demandStdDev != null ? new Prisma.Decimal(dto.demandStdDev) : undefined,
        leadTimeStdDev: dto.leadTimeStdDev != null ? new Prisma.Decimal(dto.leadTimeStdDev) : undefined,
        calculatedSafety: calculatedSafety != null ? new Prisma.Decimal(calculatedSafety) : undefined,
        lastRecalcAt: new Date(),
      },
      update: {
        method: dto.method,
        fixedQty: dto.fixedQty != null ? new Prisma.Decimal(dto.fixedQty) : undefined,
        coverageDays: dto.coverageDays,
        serviceLevel: dto.serviceLevel != null ? new Prisma.Decimal(dto.serviceLevel) : undefined,
        demandStdDev: dto.demandStdDev != null ? new Prisma.Decimal(dto.demandStdDev) : undefined,
        leadTimeStdDev: dto.leadTimeStdDev != null ? new Prisma.Decimal(dto.leadTimeStdDev) : undefined,
        calculatedSafety: calculatedSafety != null ? new Prisma.Decimal(calculatedSafety) : undefined,
        lastRecalcAt: new Date(),
      },
    });
  }

  async deleteSafetyStockConfig(tenantId: string, id: string) {
    const c = await prisma.safetyStockConfig.findFirst({ where: { tenantId, id } });
    if (!c) throw new NotFoundException('Safety stock config not found');
    return prisma.safetyStockConfig.delete({ where: { id } });
  }

  async listReplenishmentOrders(tenantId: string, status?: string, priority?: string) {
    return prisma.replenishmentOrder.findMany({
      where: { tenantId, ...(status && { status }), ...(priority && { priority }) },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async createReplenishmentOrder(tenantId: string, createdBy: string, dto: CreateReplenishmentOrderDto) {
    const count = await prisma.replenishmentOrder.count({ where: { tenantId } });
    const orderNumber = `RPL-${String(count + 1).padStart(5, '0')}`;
    return prisma.replenishmentOrder.create({
      data: {
        tenantId, orderNumber,
        productId: dto.productId, warehouseId: dto.warehouseId,
        suggestedQty: new Prisma.Decimal(dto.suggestedQty),
        uom: dto.uom, triggerType: dto.triggerType,
        currentStock: new Prisma.Decimal(dto.currentStock),
        reorderPoint: dto.reorderPoint != null ? new Prisma.Decimal(dto.reorderPoint) : undefined,
        priority: dto.priority,
        expectedDate: dto.expectedDate ? new Date(dto.expectedDate) : undefined,
        supplierId: dto.supplierId, notes: dto.notes, createdBy,
      },
    });
  }

  async getReplenishmentOrder(tenantId: string, id: string) {
    const ro = await prisma.replenishmentOrder.findFirst({ where: { tenantId, id } });
    if (!ro) throw new NotFoundException('Replenishment order not found');
    return ro;
  }

  async approveReplenishmentOrder(tenantId: string, id: string, approvedBy: string, dto: ApproveReplenishmentDto) {
    const ro = await prisma.replenishmentOrder.findFirst({ where: { tenantId, id } });
    if (!ro) throw new NotFoundException('Replenishment order not found');
    if (ro.status !== 'PENDING') throw new BadRequestException('Order is not in PENDING status');
    return prisma.replenishmentOrder.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedQty: new Prisma.Decimal(dto.approvedQty),
        approvedBy, approvedAt: new Date(),
        ...(dto.notes && { notes: dto.notes }),
      },
    });
  }

  async updateReplenishmentStatus(tenantId: string, id: string, status: string) {
    const ro = await prisma.replenishmentOrder.findFirst({ where: { tenantId, id } });
    if (!ro) throw new NotFoundException('Replenishment order not found');
    const validTransitions: Record<string, string[]> = {
      PENDING: ['APPROVED', 'CANCELLED'],
      APPROVED: ['ORDERED', 'CANCELLED'],
      ORDERED: ['RECEIVED', 'CANCELLED'],
    };
    const allowed = validTransitions[ro.status];
    if (allowed && !allowed.includes(status)) {
      throw new BadRequestException(`Cannot transition from ${ro.status} to ${status}`);
    }
    return prisma.replenishmentOrder.update({ where: { id }, data: { status } });
  }

  async cancelReplenishmentOrder(tenantId: string, id: string) {
    return this.updateReplenishmentStatus(tenantId, id, 'CANCELLED');
  }

  async autoGenerateReplenishments(tenantId: string, createdBy: string) {
    const alerts = await this.checkReorderAlerts(tenantId);
    const created: string[] = [];
    for (const alert of alerts) {
      const existing = await prisma.replenishmentOrder.findFirst({
        where: { tenantId, productId: alert.productId, status: { in: ['PENDING', 'APPROVED', 'ORDERED'] } },
      });
      if (existing) continue;
      const ro = await this.createReplenishmentOrder(tenantId, createdBy, {
        productId: alert.productId,
        warehouseId: alert.warehouseId ?? 'DEFAULT',
        suggestedQty: alert.suggestedOrderQty,
        uom: 'EA',
        triggerType: 'ROP',
        currentStock: alert.currentQty,
        reorderPoint: alert.reorderPoint,
        priority: alert.belowSafetyStock ? 'URGENT' : 'HIGH',
      });
      created.push(ro.id);
    }
    return { generated: created.length, orderIds: created };
  }

  async listStockoutPredictions(tenantId: string, riskLevel?: string, acknowledged?: boolean) {
    return prisma.stockoutPrediction.findMany({
      where: { tenantId, ...(riskLevel && { riskLevel }), ...(acknowledged != null && { acknowledged }) },
      orderBy: { createdAt: 'desc' },
    });
  }

  async generateStockoutPredictions(tenantId: string, dto: GenerateStockoutPredictionsDto) {
    const items = await prisma.stockEntryItem.findMany({
      where: {
        tenantId,
        ...(dto.warehouseId && { toWarehouseId: dto.warehouseId }),
      },
      select: { productId: true, toWarehouseId: true, qty: true },
    });

    // Aggregate by product+warehouse
    const stockMap = new Map<string, { productId: string; warehouseId: string; qty: number }>();
    for (const item of items) {
      const key = `${item.productId}:${item.toWarehouseId ?? ''}`;
      const existing = stockMap.get(key);
      if (existing) {
        existing.qty += Number(item.qty);
      } else {
        stockMap.set(key, {
          productId: item.productId,
          warehouseId: item.toWarehouseId ?? 'DEFAULT',
          qty: Number(item.qty),
        });
      }
    }

    const created: string[] = [];
    for (const entry of stockMap.values()) {
      const currentStock = entry.qty;
      const forecast = await prisma.demandForecast.findFirst({
        where: { tenantId, productId: entry.productId, status: 'ACTIVE' },
        orderBy: { forecastDate: 'desc' },
      });
      const avgDailyDemand = forecast ? Number(forecast.forecastedQty) / (forecast.horizon || 30) : 1;
      if (avgDailyDemand <= 0) continue;

      const daysOfStock = currentStock / avgDailyDemand;
      if (daysOfStock > dto.riskThresholdDays) continue;

      const riskLevel =
        daysOfStock <= 0 ? 'CRITICAL' : daysOfStock <= 7 ? 'HIGH' : daysOfStock <= 14 ? 'MEDIUM' : 'LOW';
      const predictedStockoutDate = new Date();
      predictedStockoutDate.setDate(predictedStockoutDate.getDate() + Math.floor(daysOfStock));

      const recommendedAction =
        daysOfStock <= 0 ? 'Immediate replenishment required — stockout already occurring'
        : daysOfStock <= 7 ? `Order ${Math.ceil(avgDailyDemand * 30)} units immediately`
        : `Plan replenishment within ${Math.floor(daysOfStock - 7)} days`;

      const prediction = await prisma.stockoutPrediction.create({
        data: {
          tenantId, productId: entry.productId, warehouseId: entry.warehouseId,
          currentStock: new Prisma.Decimal(currentStock),
          avgDailyDemand: new Prisma.Decimal(avgDailyDemand),
          daysOfStock: new Prisma.Decimal(daysOfStock),
          predictedStockoutDate, riskLevel, recommendedAction,
        },
      });
      created.push(prediction.id);
    }
    return { generated: created.length, predictionIds: created };
  }

  async getStockoutPrediction(tenantId: string, id: string) {
    const p = await prisma.stockoutPrediction.findFirst({ where: { tenantId, id } });
    if (!p) throw new NotFoundException('Stockout prediction not found');
    return p;
  }

  async acknowledgeStockoutPrediction(tenantId: string, id: string, dto: { acknowledgedBy: string }) {
    const p = await prisma.stockoutPrediction.findFirst({ where: { tenantId, id } });
    if (!p) throw new NotFoundException('Stockout prediction not found');
    return prisma.stockoutPrediction.update({
      where: { id },
      data: { acknowledged: true, acknowledgedBy: dto.acknowledgedBy, acknowledgedAt: new Date() },
    });
  }

  async getDashboard(tenantId: string) {
    const [
      totalForecasts, activeForecasts, activeReorderPoints,
      pendingReplenishments, urgentReplenishments,
      criticalStockouts, highStockouts, totalSafetyConfigs,
      belowRopCount, mapeAgg,
    ] = await Promise.all([
      prisma.demandForecast.count({ where: { tenantId } }),
      prisma.demandForecast.count({ where: { tenantId, status: 'ACTIVE' } }),
      prisma.reorderPoint.count({ where: { tenantId, isActive: true } }),
      prisma.replenishmentOrder.count({ where: { tenantId, status: 'PENDING' } }),
      prisma.replenishmentOrder.count({ where: { tenantId, status: 'PENDING', priority: 'URGENT' } }),
      prisma.stockoutPrediction.count({ where: { tenantId, riskLevel: 'CRITICAL', acknowledged: false } }),
      prisma.stockoutPrediction.count({ where: { tenantId, riskLevel: 'HIGH', acknowledged: false } }),
      prisma.safetyStockConfig.count({ where: { tenantId } }),
      this.checkReorderAlerts(tenantId).then((a) => a.length),
      prisma.demandForecast.aggregate({ where: { tenantId, mape: { not: null } }, _avg: { mape: true } }),
    ]);

    return {
      totalForecasts, activeForecasts, activeReorderPoints,
      pendingReplenishments, urgentReplenishments,
      criticalStockouts, highStockouts, totalSafetyConfigs, belowRopCount,
      avgMape: mapeAgg._avg.mape ? Number(mapeAgg._avg.mape) : null,
    };
  }

  async getReplenishmentSummary(tenantId: string) {
    const [byStatus, byPriority, byTriggerType] = await Promise.all([
      prisma.replenishmentOrder.groupBy({ by: ['status'], where: { tenantId }, _count: true }),
      prisma.replenishmentOrder.groupBy({
        by: ['priority'],
        where: { tenantId, status: { in: ['PENDING', 'APPROVED'] } },
        _count: true,
      }),
      prisma.replenishmentOrder.groupBy({ by: ['triggerType'], where: { tenantId }, _count: true }),
    ]);
    return { byStatus, byPriority, byTriggerType };
  }

  async getForecastAccuracy(tenantId: string, productId?: string) {
    const forecasts = await prisma.demandForecast.findMany({
      where: { tenantId, ...(productId && { productId }), actualQty: { not: null }, mape: { not: null } },
      orderBy: { forecastDate: 'desc' },
      take: 100,
    });
    if (forecasts.length === 0) return { accuracy: null, samples: 0, byMethod: {} };
    const avgMape = forecasts.reduce((sum, f) => sum + Number(f.mape), 0) / forecasts.length;
    const byMethod: Record<string, { count: number; avgMape: number }> = {};
    for (const f of forecasts) {
      const m = byMethod[f.method] ?? { count: 0, avgMape: 0 };
      m.count++;
      m.avgMape += Number(f.mape);
      byMethod[f.method] = m;
    }
    for (const m of Object.keys(byMethod)) {
      const entry = byMethod[m];
      if (entry) entry.avgMape /= entry.count;
    }
    return { avgMape, accuracy: Math.max(0, 1 - avgMape), samples: forecasts.length, byMethod };
  }
}
