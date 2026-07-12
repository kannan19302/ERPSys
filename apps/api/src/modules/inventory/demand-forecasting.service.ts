import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { Prisma } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { z } from 'zod';

export const generateForecastRunSchema = z.object({
  name: z.string().min(1).max(200),
  method: z.enum(['MOVING_AVERAGE', 'EXPONENTIAL_SMOOTHING']).default('MOVING_AVERAGE'),
  warehouseId: z.string().optional(),
  productIds: z.array(z.string()).optional(),
  historyDays: z.number().int().min(7).max(730).default(90),
  horizonDays: z.number().int().min(1).max(365).default(30),
  windowDays: z.number().int().min(2).max(90).default(7), // moving-average window
  alpha: z.number().min(0.01).max(1).default(0.3), // exponential-smoothing factor
  leadTimeDays: z.number().int().min(0).max(365).default(7),
  safetyStockDays: z.number().int().min(0).max(90).default(3),
});
export type GenerateForecastRunInput = z.infer<typeof generateForecastRunSchema>;

export const updateForecastRunSchema = z.object({
  name: z.string().min(1).max(200).optional(),
});
export type UpdateForecastRunInput = z.infer<typeof updateForecastRunSchema>;

interface DailySeries {
  [dayIso: string]: number;
}

/**
 * Inventory Demand Forecasting (Collab Board slug `inventory-demand-forecasting`,
 * MODULE_REGISTRY 5w discovery follow-up item).
 *
 * Forecasts future demand per product/warehouse from historical outbound
 * `StockLedgerEntry.qtyOut` (reused — no new snapshot model), using either a
 * simple moving average or exponential smoothing. Each run persists a
 * `DemandForecastRun` + one `DemandForecastLine` per product/warehouse/period,
 * and derives `ReorderSuggestion` rows (distinct from the pre-existing static
 * threshold `ReorderRule`) comparing projected demand over lead time + safety
 * stock against current on-hand quantity.
 */
@Injectable()
export class DemandForecastingService {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  // ─────────────────────────── Forecast Runs (CRUD) ───────────────────────────

  async listRuns(
    tenantId: string,
    query: { page?: number; limit?: number; status?: string; sortBy?: string; sortOrder?: 'asc' | 'desc' },
  ) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? Math.min(query.limit, 100) : 20;
    const where: Prisma.DemandForecastRunWhereInput = { tenantId, deletedAt: null };
    if (query.status) where.status = query.status;

    const sortBy = query.sortBy && ['createdAt', 'name', 'status', 'method'].includes(query.sortBy) ? query.sortBy : 'createdAt';
    const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';

    const [data, total] = await Promise.all([
      prisma.demandForecastRun.findMany({
        where,
        include: { warehouse: true, _count: { select: { lines: true, suggestions: true } } },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.demandForecastRun.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) };
  }

  async getRun(tenantId: string, id: string) {
    const run = await prisma.demandForecastRun.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: { warehouse: true },
    });
    if (!run) throw new NotFoundException('Demand forecast run not found');
    return run;
  }

  async getRunLines(tenantId: string, runId: string, query: { page?: number; limit?: number }) {
    await this.getRun(tenantId, runId);
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? Math.min(query.limit, 200) : 50;

    const where: Prisma.DemandForecastLineWhereInput = { tenantId, runId };
    const [data, total] = await Promise.all([
      prisma.demandForecastLine.findMany({
        where,
        include: { product: { select: { id: true, sku: true, name: true, unit: true } }, warehouse: { select: { id: true, name: true, code: true } } },
        orderBy: { period: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.demandForecastLine.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) };
  }

  async deleteRun(tenantId: string, id: string) {
    const run = await prisma.demandForecastRun.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!run) throw new NotFoundException('Demand forecast run not found');
    await prisma.demandForecastRun.update({ where: { id }, data: { deletedAt: new Date() } });
    return { success: true };
  }

  async updateRun(tenantId: string, id: string, dto: UpdateForecastRunInput) {
    const run = await prisma.demandForecastRun.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!run) throw new NotFoundException('Demand forecast run not found');
    return prisma.demandForecastRun.update({ where: { id }, data: { ...(dto.name ? { name: dto.name } : {}) } });
  }

  // ─────────────────────────── Generate forecast ───────────────────────────

  /**
   * Generates a new forecast run: pulls historical `StockLedgerEntry.qtyOut`
   * (outbound = demand) for the requested history window, aggregates into
   * daily per-product/warehouse series, projects `horizonDays` forward using
   * the chosen method, persists lines, and derives reorder suggestions.
   */
  async generateForecast(tenantId: string, orgId: string, userId: string, dto: GenerateForecastRunInput) {
    if (dto.productIds && dto.productIds.length === 0) {
      throw new BadRequestException('productIds, if provided, must be non-empty');
    }

    const run = await prisma.demandForecastRun.create({
      data: {
        tenantId,
        orgId,
        name: dto.name,
        method: dto.method,
        parameters: dto,
        status: 'RUNNING',
        warehouseId: dto.warehouseId ?? null,
        startedAt: new Date(),
        createdBy: userId,
      },
    });

    try {
      const historyStart = new Date();
      historyStart.setDate(historyStart.getDate() - dto.historyDays);

      const ledgerWhere: Prisma.StockLedgerEntryWhereInput = {
        tenantId,
        postingDate: { gte: historyStart },
        qtyOut: { gt: 0 },
        ...(dto.warehouseId ? { warehouseId: dto.warehouseId } : {}),
        ...(dto.productIds ? { productId: { in: dto.productIds } } : {}),
      };

      const entries = await prisma.stockLedgerEntry.findMany({
        where: ledgerWhere,
        select: { productId: true, warehouseId: true, qtyOut: true, postingDate: true },
      });

      // Group by product+warehouse -> daily demand series
      const groups = new Map<string, { productId: string; warehouseId: string; series: DailySeries }>();
      for (const e of entries) {
        const key = `${e.productId}::${e.warehouseId}`;
        if (!groups.has(key)) groups.set(key, { productId: e.productId, warehouseId: e.warehouseId, series: {} });
        const dayIso = e.postingDate.toISOString().slice(0, 10);
        const g = groups.get(key)!;
        g.series[dayIso] = (g.series[dayIso] || 0) + Number(e.qtyOut);
      }

      const lines: Prisma.DemandForecastLineCreateManyInput[] = [];
      const suggestions: Array<{
        productId: string; warehouseId: string; forecastedDailyAvg: number;
      }> = [];

      for (const { productId, warehouseId, series } of groups.values()) {
        const dailyValues = this.buildDailyArray(series, dto.historyDays);
        const { historicalAvg, forecastPerDay } = this.forecast(dailyValues, dto.method, dto.windowDays, dto.alpha);

        const period = new Date();
        period.setHours(0, 0, 0, 0);
        const horizonQty = forecastPerDay * dto.horizonDays;
        const confidence = this.computeConfidence(dailyValues);

        lines.push({
          tenantId,
          runId: run.id,
          productId,
          warehouseId,
          period,
          historicalAvgQty: new Prisma.Decimal(historicalAvg.toFixed(3)),
          forecastedQuantity: new Prisma.Decimal(horizonQty.toFixed(3)),
          confidence: new Prisma.Decimal(confidence.toFixed(2)),
        });

        suggestions.push({ productId, warehouseId, forecastedDailyAvg: forecastPerDay });
      }

      if (lines.length > 0) {
        await prisma.demandForecastLine.createMany({ data: lines });
      }

      // Derive reorder suggestions: reorderPoint = dailyAvg * leadTimeDays + safetyStock;
      // suggestedQty = dailyAvg * (leadTimeDays + safetyStockDays) - currentStock (floor 0)
      let suggestionsCreated = 0;
      for (const s of suggestions) {
        const currentStockAgg = await prisma.inventoryItem.aggregate({
          where: { tenantId, productId: s.productId, warehouseId: s.warehouseId },
          _sum: { quantity: true },
        });
        const currentStockQty = Number(currentStockAgg._sum.quantity ?? 0);
        const reorderPoint = s.forecastedDailyAvg * dto.leadTimeDays + s.forecastedDailyAvg * dto.safetyStockDays;
        const suggestedQuantity = Math.max(0, reorderPoint - currentStockQty);

        if (suggestedQuantity > 0) {
          await prisma.reorderSuggestion.create({
            data: {
              tenantId,
              runId: run.id,
              productId: s.productId,
              warehouseId: s.warehouseId,
              reorderPoint: new Prisma.Decimal(reorderPoint.toFixed(3)),
              suggestedQuantity: new Prisma.Decimal(suggestedQuantity.toFixed(3)),
              currentStockQty: new Prisma.Decimal(currentStockQty.toFixed(3)),
              basis: 'FORECAST',
              status: 'PENDING',
            },
          });
          suggestionsCreated++;
        }
      }

      const completed = await prisma.demandForecastRun.update({
        where: { id: run.id },
        data: { status: 'COMPLETED', completedAt: new Date() },
      });

      this.eventEmitter.emit('inventory.demand_forecast.generated', {
        tenantId,
        runId: run.id,
        lineCount: lines.length,
        suggestionCount: suggestionsCreated,
      });

      return { run: completed, lineCount: lines.length, suggestionCount: suggestionsCreated };
    } catch (err) {
      await prisma.demandForecastRun.update({
        where: { id: run.id },
        data: { status: 'FAILED', errorMessage: err instanceof Error ? err.message : 'Unknown error', completedAt: new Date() },
      });
      throw err;
    }
  }

  /** Fills gaps in the sparse daily series with 0s so the average reflects true demand density. */
  private buildDailyArray(series: DailySeries, historyDays: number): number[] {
    const out: number[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = historyDays - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      out.push(series[d.toISOString().slice(0, 10)] || 0);
    }
    return out;
  }

  /** Simple moving average (last `windowDays`) or exponential smoothing over the full series. */
  private forecast(
    daily: number[],
    method: 'MOVING_AVERAGE' | 'EXPONENTIAL_SMOOTHING',
    windowDays: number,
    alpha: number,
  ): { historicalAvg: number; forecastPerDay: number } {
    const nonZeroLen = daily.length || 1;
    const historicalAvg = daily.reduce((a, b) => a + b, 0) / nonZeroLen;

    if (method === 'EXPONENTIAL_SMOOTHING') {
      let s = daily[0] ?? 0;
      for (let i = 1; i < daily.length; i++) {
        s = alpha * (daily[i] ?? 0) + (1 - alpha) * s;
      }
      return { historicalAvg, forecastPerDay: s };
    }

    // MOVING_AVERAGE
    const window = daily.slice(Math.max(0, daily.length - windowDays));
    const windowLen = window.length || 1;
    const forecastPerDay = window.reduce((a, b) => a + b, 0) / windowLen;
    return { historicalAvg, forecastPerDay };
  }

  /** Coefficient-of-variation-based confidence heuristic: lower variance → higher confidence. 0-100. */
  private computeConfidence(daily: number[]): number {
    if (daily.length === 0) return 0;
    const mean = daily.reduce((a, b) => a + b, 0) / daily.length;
    if (mean === 0) return 0;
    const variance = daily.reduce((a, b) => a + (b - mean) ** 2, 0) / daily.length;
    const stdDev = Math.sqrt(variance);
    const cv = stdDev / mean;
    const confidence = Math.max(0, Math.min(100, 100 * (1 - Math.min(cv, 1))));
    return confidence;
  }

  // ─────────────────────────── Reorder Suggestions ───────────────────────────

  async listSuggestions(
    tenantId: string,
    query: { page?: number; limit?: number; status?: string; warehouseId?: string; runId?: string },
  ) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? Math.min(query.limit, 100) : 20;
    const where: Prisma.ReorderSuggestionWhereInput = {
      tenantId,
      ...(query.status ? { status: query.status } : {}),
      ...(query.warehouseId ? { warehouseId: query.warehouseId } : {}),
      ...(query.runId ? { runId: query.runId } : {}),
    };

    const [data, total] = await Promise.all([
      prisma.reorderSuggestion.findMany({
        where,
        include: {
          product: { select: { id: true, sku: true, name: true, unit: true } },
          warehouse: { select: { id: true, name: true, code: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.reorderSuggestion.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) };
  }

  async acceptSuggestion(tenantId: string, id: string, userId: string) {
    return this.decideSuggestion(tenantId, id, userId, 'ACCEPTED');
  }

  async dismissSuggestion(tenantId: string, id: string, userId: string) {
    return this.decideSuggestion(tenantId, id, userId, 'DISMISSED');
  }

  private async decideSuggestion(tenantId: string, id: string, userId: string, status: 'ACCEPTED' | 'DISMISSED') {
    const suggestion = await prisma.reorderSuggestion.findFirst({ where: { id, tenantId } });
    if (!suggestion) throw new NotFoundException('Reorder suggestion not found');
    if (suggestion.status !== 'PENDING') {
      throw new BadRequestException(`Suggestion already ${suggestion.status.toLowerCase()}`);
    }

    const updated = await prisma.reorderSuggestion.update({
      where: { id },
      data: { status, decidedBy: userId, decidedAt: new Date() },
    });

    this.eventEmitter.emit('inventory.reorder_suggestion.decided', {
      tenantId,
      suggestionId: id,
      status,
      productId: suggestion.productId,
      warehouseId: suggestion.warehouseId,
    });

    return updated;
  }
}
