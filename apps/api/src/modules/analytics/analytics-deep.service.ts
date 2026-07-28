import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { prisma } from "@unerp/database";
import { Prisma } from "@prisma/client";

export interface CreateKpiDefinitionDto {
  name: string;
  code: string;
  description?: string;
  formula: string;
  target?: number;
  unit?: string;
  visualization?: string;
  category?: string;
  sourceTable?: string;
  sourceColumn?: string;
  config?: Record<string, unknown>;
}

export interface UpdateKpiDefinitionDto extends Partial<CreateKpiDefinitionDto> {}

export interface CreateCrossFilterDashboardDto {
  name: string;
  description?: string;
  layout?: Record<string, unknown>;
  filters?: Record<string, unknown>;
  widgets?: Record<string, unknown>;
}

export interface UpdateCrossFilterDashboardDto extends Partial<CreateCrossFilterDashboardDto> {}

export interface CreateBiMetricDefinitionDto {
  name: string;
  code: string;
  description?: string;
  sourceTable: string;
  sourceColumn: string;
  aggregation?: string;
  dataType?: string;
  unit?: string;
  category?: string;
  formula?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateBiMetricDefinitionDto extends Partial<CreateBiMetricDefinitionDto> {}

@Injectable()
export class AnalyticsDeepService {
  async getKpiDefinitions(
    tenantId: string,
    params: {
      page?: number;
      limit?: number;
      search?: string;
      category?: string;
    } = {},
  ) {
    const page = params.page || 1;
    const limit = params.limit || 50;
    const skip = (page - 1) * limit;
    const where: Record<string, unknown> = { tenantId };
    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: "insensitive" } },
        { code: { contains: params.search, mode: "insensitive" } },
      ];
    }
    if (params.category) where.category = params.category;
    const [data, total] = await Promise.all([
      prisma.analyticsKpiDefinition.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.analyticsKpiDefinition.count({ where }),
    ]);
    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getKpiDefinition(tenantId: string, id: string) {
    const item = await prisma.analyticsKpiDefinition.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("KPI definition not found");
    return item;
  }

  async createKpiDefinition(tenantId: string, dto: CreateKpiDefinitionDto) {
    return prisma.analyticsKpiDefinition.create({
      data: {
        tenantId,
        name: dto.name,
        code: dto.code,
        description: dto.description || null,
        formula: dto.formula,
        target: dto.target ?? null,
        unit: dto.unit || null,
        visualization: dto.visualization || "NUMBER",
        category: dto.category || null,
        sourceTable: dto.sourceTable || null,
        sourceColumn: dto.sourceColumn || null,
        config: (dto.config as any) || undefined,
      },
    });
  }

  async updateKpiDefinition(
    tenantId: string,
    id: string,
    dto: UpdateKpiDefinitionDto,
  ) {
    const existing = await prisma.analyticsKpiDefinition.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException("KPI definition not found");
    return prisma.analyticsKpiDefinition.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.code !== undefined ? { code: dto.code } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description }
          : {}),
        ...(dto.formula !== undefined ? { formula: dto.formula } : {}),
        ...(dto.target !== undefined ? { target: dto.target } : {}),
        ...(dto.unit !== undefined ? { unit: dto.unit } : {}),
        ...(dto.visualization !== undefined
          ? { visualization: dto.visualization }
          : {}),
        ...(dto.category !== undefined ? { category: dto.category } : {}),
        ...(dto.sourceTable !== undefined
          ? { sourceTable: dto.sourceTable }
          : {}),
        ...(dto.sourceColumn !== undefined
          ? { sourceColumn: dto.sourceColumn }
          : {}),
        ...(dto.config !== undefined ? { config: dto.config as any } : {}),
      },
    });
  }

  async deleteKpiDefinition(tenantId: string, id: string) {
    const existing = await prisma.analyticsKpiDefinition.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException("KPI definition not found");
    return prisma.analyticsKpiDefinition.delete({ where: { id } });
  }

  async getTrendAnalysis(tenantId: string, kpiDefinitionId: string) {
    const kpi = await prisma.analyticsKpiDefinition.findFirst({
      where: { id: kpiDefinitionId, tenantId },
    });
    if (!kpi) throw new NotFoundException("KPI definition not found");
    const results = await prisma.analyticsTrendResult.findMany({
      where: { tenantId, kpiDefinitionId },
      orderBy: { periodStart: "desc" },
      take: 24,
    });
    return { kpi, results };
  }

  async computeTrendAnalysis(
    tenantId: string,
    kpiDefinitionId: string,
    period: "MONTHLY" | "QUARTERLY" | "YEARLY" = "MONTHLY",
  ) {
    const kpi = await prisma.analyticsKpiDefinition.findFirst({
      where: { id: kpiDefinitionId, tenantId },
    });
    if (!kpi) throw new NotFoundException("KPI definition not found");
    const now = new Date();
    const periods: { start: Date; end: Date; label: string }[] = [];
    for (let i = 5; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      periods.push({
        start,
        end,
        label: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`,
      });
    }
    const results = [];
    for (let i = 0; i < periods.length; i++) {
      const currentValues = await prisma.analyticsKpiValue.aggregate({
        where: {
          tenantId,
          kpiId: kpiDefinitionId,
          periodStart: { gte: periods[i]!.start },
          periodEnd: { lte: periods[i]!.end },
        },
        _avg: { value: true },
      });
      const currentValue = Number(currentValues._avg.value || 0);
      let previousValue: number | null = null;
      if (i > 0) {
        const prevValues = await prisma.analyticsKpiValue.aggregate({
          where: {
            tenantId,
            kpiId: kpiDefinitionId,
            periodStart: { gte: periods[i - 1]!.start },
            periodEnd: { lte: periods[i - 1]!.end },
          },
          _avg: { value: true },
        });
        previousValue = Number(prevValues._avg.value || 0);
      }
      const changePercent =
        previousValue && previousValue !== 0
          ? Math.round(
              ((currentValue - previousValue) / previousValue) * 10000,
            ) / 100
          : null;
      const trend =
        changePercent !== null
          ? changePercent > 1
            ? "UP"
            : changePercent < -1
              ? "DOWN"
              : "FLAT"
          : "FLAT";
      const result = await prisma.analyticsTrendResult.upsert({
        where: {
          kpiDefinitionId_period_periodStart_periodEnd: {
            kpiDefinitionId,
            period,
            periodStart: periods[i]!.start,
            periodEnd: periods[i]!.end,
          },
        },
        create: {
          tenantId,
          kpiDefinitionId,
          period,
          periodStart: periods[i]!.start,
          periodEnd: periods[i]!.end,
          value: currentValue,
          previousValue,
          changePercent,
          trend,
        },
        update: {
          value: currentValue,
          previousValue,
          changePercent,
          trend,
          computedAt: new Date(),
        },
      });
      results.push(result);
    }
    return results;
  }

  async getScheduledExports(tenantId: string) {
    return prisma.analyticsScheduledExport.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });
  }

  async createScheduledExport(tenantId: string, dto: Record<string, unknown>) {
    const cronMap: Record<string, number> = {
      DAILY: 1,
      WEEKLY: 7,
      MONTHLY: 30,
      QUARTERLY: 90,
    };
    const nextRunAt = new Date();
    nextRunAt.setDate(
      nextRunAt.getDate() + (cronMap[String(dto.schedule)] || 1),
    );
    return prisma.analyticsScheduledExport.create({
      data: {
        tenantId,
        name: String(dto.name || ""),
        description: dto.description ? String(dto.description) : null,
        dataset: String(dto.dataset || ""),
        format: String(dto.format || "CSV"),
        schedule: String(dto.schedule || "DAILY"),
        recipients: (dto.recipients as any) || [],
        filters: (dto.filters as any) || undefined,
        nextRunAt,
      },
    });
  }

  async updateScheduledExport(
    tenantId: string,
    id: string,
    dto: Record<string, unknown>,
  ) {
    const existing = await prisma.analyticsScheduledExport.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException("Scheduled export not found");
    const data: Record<string, unknown> = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.format !== undefined) data.format = dto.format;
    if (dto.schedule !== undefined) {
      data.schedule = dto.schedule;
      const cronMap: Record<string, number> = {
        DAILY: 1,
        WEEKLY: 7,
        MONTHLY: 30,
        QUARTERLY: 90,
      };
      const nextRunAt = new Date();
      nextRunAt.setDate(
        nextRunAt.getDate() + (cronMap[String(dto.schedule)] || 1),
      );
      data.nextRunAt = nextRunAt;
    }
    if (dto.recipients !== undefined) data.recipients = dto.recipients;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    return prisma.analyticsScheduledExport.update({
      where: { id },
      data: data as any,
    });
  }

  async deleteScheduledExport(tenantId: string, id: string) {
    const existing = await prisma.analyticsScheduledExport.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException("Scheduled export not found");
    return prisma.analyticsScheduledExport.delete({ where: { id } });
  }

  async getCrossFilterDashboards(tenantId: string) {
    return prisma.analyticsCrossFilterDashboard.findMany({
      where: { tenantId, isActive: true },
      orderBy: { updatedAt: "desc" },
    });
  }

  async getCrossFilterDashboard(tenantId: string, id: string) {
    const item = await prisma.analyticsCrossFilterDashboard.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("Dashboard not found");
    return item;
  }

  async createCrossFilterDashboard(
    tenantId: string,
    dto: CreateCrossFilterDashboardDto,
    userId: string,
  ) {
    return prisma.analyticsCrossFilterDashboard.create({
      data: {
        tenantId,
        name: dto.name,
        description: dto.description || null,
        layout: (dto.layout as any) || [],
        filters: (dto.filters as any) || [],
        widgets: (dto.widgets as any) || [],
        createdBy: userId,
      },
    });
  }

  async updateCrossFilterDashboard(
    tenantId: string,
    id: string,
    dto: UpdateCrossFilterDashboardDto,
  ) {
    const existing = await prisma.analyticsCrossFilterDashboard.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException("Dashboard not found");
    return prisma.analyticsCrossFilterDashboard.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description }
          : {}),
        ...(dto.layout !== undefined ? { layout: dto.layout as any } : {}),
        ...(dto.filters !== undefined ? { filters: dto.filters as any } : {}),
        ...(dto.widgets !== undefined ? { widgets: dto.widgets as any } : {}),
      },
    });
  }

  async deleteCrossFilterDashboard(tenantId: string, id: string) {
    const existing = await prisma.analyticsCrossFilterDashboard.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException("Dashboard not found");
    return prisma.analyticsCrossFilterDashboard.delete({ where: { id } });
  }

  async getBiMetricCatalog(
    tenantId: string,
    params: {
      page?: number;
      limit?: number;
      search?: string;
      category?: string;
    } = {},
  ) {
    const page = params.page || 1;
    const limit = params.limit || 50;
    const skip = (page - 1) * limit;
    const where: Record<string, unknown> = { tenantId };
    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: "insensitive" } },
        { code: { contains: params.search, mode: "insensitive" } },
      ];
    }
    if (params.category) where.category = params.category;
    const [data, total] = await Promise.all([
      prisma.analyticsBiMetricDefinition.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.analyticsBiMetricDefinition.count({ where }),
    ]);
    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getBiMetricDefinition(tenantId: string, id: string) {
    const item = await prisma.analyticsBiMetricDefinition.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("BI metric definition not found");
    return item;
  }

  async createBiMetricDefinition(
    tenantId: string,
    dto: CreateBiMetricDefinitionDto,
  ) {
    return prisma.analyticsBiMetricDefinition.create({
      data: {
        tenantId,
        name: dto.name,
        code: dto.code,
        description: dto.description || null,
        sourceTable: dto.sourceTable,
        sourceColumn: dto.sourceColumn,
        aggregation: dto.aggregation || "SUM",
        dataType: dto.dataType || "NUMBER",
        unit: dto.unit || null,
        category: dto.category || null,
        formula: dto.formula || null,
        metadata: (dto.metadata as any) || undefined,
      },
    });
  }

  async updateBiMetricDefinition(
    tenantId: string,
    id: string,
    dto: UpdateBiMetricDefinitionDto,
  ) {
    const existing = await prisma.analyticsBiMetricDefinition.findFirst({
      where: { id, tenantId },
    });
    if (!existing)
      throw new NotFoundException("BI metric definition not found");
    return prisma.analyticsBiMetricDefinition.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.code !== undefined ? { code: dto.code } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description }
          : {}),
        ...(dto.sourceTable !== undefined
          ? { sourceTable: dto.sourceTable }
          : {}),
        ...(dto.sourceColumn !== undefined
          ? { sourceColumn: dto.sourceColumn }
          : {}),
        ...(dto.aggregation !== undefined
          ? { aggregation: dto.aggregation }
          : {}),
        ...(dto.dataType !== undefined ? { dataType: dto.dataType } : {}),
        ...(dto.unit !== undefined ? { unit: dto.unit } : {}),
        ...(dto.category !== undefined ? { category: dto.category } : {}),
        ...(dto.formula !== undefined ? { formula: dto.formula } : {}),
        ...(dto.metadata !== undefined
          ? { metadata: dto.metadata as any }
          : {}),
      },
    });
  }

  async deleteBiMetricDefinition(tenantId: string, id: string) {
    const existing = await prisma.analyticsBiMetricDefinition.findFirst({
      where: { id, tenantId },
    });
    if (!existing)
      throw new NotFoundException("BI metric definition not found");
    return prisma.analyticsBiMetricDefinition.delete({ where: { id } });
  }
}
