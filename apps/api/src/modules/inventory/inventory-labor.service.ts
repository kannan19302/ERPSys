import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { Prisma } from '@prisma/client';
import { z } from 'zod';

// ─── Input schemas ────────────────────────────────────────────────────────────

export const createLaborStandardSchema = z.object({
  taskType: z.enum(['PICK', 'PACK', 'RECEIVE', 'PUTAWAY', 'CYCLE_COUNT', 'TRANSFER', 'LABEL', 'SORT']),
  description: z.string().optional(),
  standardMins: z.number().positive(),
  warehouseId: z.string().optional(),
});
export type CreateLaborStandardInput = z.infer<typeof createLaborStandardSchema>;

export const logTaskSchema = z.object({
  workerId: z.string().min(1),
  workerName: z.string().min(1),
  warehouseId: z.string().min(1),
  taskType: z.string().min(1),
  referenceId: z.string().optional(),
  referenceType: z.string().optional(),
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime().optional(),
  notes: z.string().optional(),
});
export type LogTaskInput = z.infer<typeof logTaskSchema>;

export const completeTaskSchema = z.object({
  completedAt: z.string().datetime(),
  notes: z.string().optional(),
});
export type CompleteTaskInput = z.infer<typeof completeTaskSchema>;

export const createShiftTemplateSchema = z.object({
  warehouseId: z.string().min(1),
  shiftName: z.string().min(1),
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  headcount: z.number().int().positive().default(1),
});
export type CreateShiftTemplateInput = z.infer<typeof createShiftTemplateSchema>;

// ─── Service ─────────────────────────────────────────────────────────────────

@Injectable()
export class InventoryLaborService {

  // ─── Labor Standards ──────────────────────────────────────────────────────

  async listLaborStandards(tenantId: string, warehouseId?: string) {
    const where: Prisma.LaborStandardWhereInput = { tenantId, isActive: true };
    if (warehouseId) where.warehouseId = warehouseId;
    return prisma.laborStandard.findMany({ where, orderBy: { taskType: 'asc' } });
  }

  async createLaborStandard(tenantId: string, dto: CreateLaborStandardInput) {
    const existing = await prisma.laborStandard.findFirst({
      where: { tenantId, taskType: dto.taskType, warehouseId: dto.warehouseId ?? null },
    });
    if (existing) {
      throw new BadRequestException(`Labor standard for task type '${dto.taskType}' already exists`);
    }
    return prisma.laborStandard.create({
      data: {
        tenantId,
        taskType: dto.taskType,
        description: dto.description ?? null,
        standardMins: new Prisma.Decimal(dto.standardMins.toFixed(2)),
        warehouseId: dto.warehouseId ?? null,
      },
    });
  }

  async updateLaborStandard(tenantId: string, id: string, dto: Partial<CreateLaborStandardInput>) {
    const record = await prisma.laborStandard.findFirst({ where: { id, tenantId } });
    if (!record) throw new NotFoundException('Labor standard not found');
    return prisma.laborStandard.update({
      where: { id },
      data: {
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.standardMins !== undefined && { standardMins: new Prisma.Decimal(dto.standardMins.toFixed(2)) }),
        ...(dto.warehouseId !== undefined && { warehouseId: dto.warehouseId }),
      },
    });
  }

  async deleteLaborStandard(tenantId: string, id: string) {
    const record = await prisma.laborStandard.findFirst({ where: { id, tenantId } });
    if (!record) throw new NotFoundException('Labor standard not found');
    return prisma.laborStandard.update({ where: { id }, data: { isActive: false } });
  }

  // ─── Worker Task Logs ────────────────────────────────────────────────────

  async listTaskLogs(
    tenantId: string,
    query: { workerId?: string; warehouseId?: string; taskType?: string; page?: number; limit?: number },
  ) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, query.limit ?? 20);
    const where: Prisma.WorkerTaskLogWhereInput = { tenantId };
    if (query.workerId) where.workerId = query.workerId;
    if (query.warehouseId) where.warehouseId = query.warehouseId;
    if (query.taskType) where.taskType = query.taskType;

    const [data, total] = await Promise.all([
      prisma.workerTaskLog.findMany({
        where,
        orderBy: { startedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.workerTaskLog.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) };
  }

  async logTask(tenantId: string, dto: LogTaskInput) {
    const standard = await prisma.laborStandard.findFirst({
      where: { tenantId, taskType: dto.taskType, isActive: true },
    });

    const startedAt = new Date(dto.startedAt);
    const completedAt = dto.completedAt ? new Date(dto.completedAt) : null;
    let durationMins: Prisma.Decimal | null = null;
    let efficiencyPct: Prisma.Decimal | null = null;

    if (completedAt) {
      const durationMs = completedAt.getTime() - startedAt.getTime();
      const mins = durationMs / 60000;
      durationMins = new Prisma.Decimal(mins.toFixed(2));
      if (standard) {
        const efficiency = (Number(standard.standardMins) / mins) * 100;
        efficiencyPct = new Prisma.Decimal(efficiency.toFixed(2));
      }
    }

    return prisma.workerTaskLog.create({
      data: {
        tenantId,
        workerId: dto.workerId,
        workerName: dto.workerName,
        warehouseId: dto.warehouseId,
        taskType: dto.taskType,
        referenceId: dto.referenceId ?? null,
        referenceType: dto.referenceType ?? null,
        startedAt,
        completedAt,
        durationMins,
        standardMins: standard ? standard.standardMins : null,
        efficiencyPct,
        notes: dto.notes ?? null,
      },
    });
  }

  async completeTask(tenantId: string, id: string, dto: CompleteTaskInput) {
    const log = await prisma.workerTaskLog.findFirst({ where: { id, tenantId } });
    if (!log) throw new NotFoundException('Task log not found');
    if (log.completedAt) throw new BadRequestException('Task already completed');

    const completedAt = new Date(dto.completedAt);
    const durationMs = completedAt.getTime() - log.startedAt.getTime();
    const mins = durationMs / 60000;
    const durationMins = new Prisma.Decimal(mins.toFixed(2));

    let efficiencyPct: Prisma.Decimal | null = null;
    if (log.standardMins) {
      const efficiency = (Number(log.standardMins) / mins) * 100;
      efficiencyPct = new Prisma.Decimal(efficiency.toFixed(2));
    }

    return prisma.workerTaskLog.update({
      where: { id },
      data: { completedAt, durationMins, efficiencyPct, notes: dto.notes ?? log.notes },
    });
  }

  // ─── Shift Templates ─────────────────────────────────────────────────────

  async listShiftTemplates(tenantId: string, warehouseId?: string) {
    const where: Prisma.WarehouseShiftTemplateWhereInput = { tenantId, isActive: true };
    if (warehouseId) where.warehouseId = warehouseId;
    return prisma.warehouseShiftTemplate.findMany({ where, orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }] });
  }

  async createShiftTemplate(tenantId: string, dto: CreateShiftTemplateInput) {
    return prisma.warehouseShiftTemplate.create({
      data: { tenantId, ...dto },
    });
  }

  async deleteShiftTemplate(tenantId: string, id: string) {
    const record = await prisma.warehouseShiftTemplate.findFirst({ where: { id, tenantId } });
    if (!record) throw new NotFoundException('Shift template not found');
    return prisma.warehouseShiftTemplate.update({ where: { id }, data: { isActive: false } });
  }

  // ─── Productivity Dashboard ───────────────────────────────────────────────

  async getLaborDashboard(tenantId: string, warehouseId?: string) {
    const where: Prisma.WorkerTaskLogWhereInput = { tenantId };
    if (warehouseId) where.warehouseId = warehouseId;

    const sinceDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentWhere = { ...where, startedAt: { gte: sinceDate } };

    const [totalTasks, completedTasks, byTaskType, topWorkers] = await Promise.all([
      prisma.workerTaskLog.count({ where: recentWhere }),
      prisma.workerTaskLog.count({ where: { ...recentWhere, completedAt: { not: null } } }),
      prisma.workerTaskLog.groupBy({
        by: ['taskType'],
        where: recentWhere,
        _count: { _all: true },
        _avg: { efficiencyPct: true },
      }),
      prisma.workerTaskLog.groupBy({
        by: ['workerId', 'workerName'],
        where: { ...recentWhere, completedAt: { not: null } },
        _count: { _all: true },
        _avg: { efficiencyPct: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),
    ]);

    return {
      period: '7d',
      totalTasks,
      completedTasks,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      byTaskType: byTaskType.map((r) => ({
        taskType: r.taskType,
        count: r._count._all,
        avgEfficiencyPct: r._avg.efficiencyPct ?? null,
      })),
      topWorkers: topWorkers.map((r) => ({
        workerId: r.workerId,
        workerName: r.workerName,
        completedTasks: r._count._all,
        avgEfficiencyPct: r._avg.efficiencyPct ?? null,
      })),
    };
  }

  async getWorkerProductivity(tenantId: string, workerId: string, days = 30) {
    const sinceDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const logs = await prisma.workerTaskLog.findMany({
      where: { tenantId, workerId, startedAt: { gte: sinceDate } },
      orderBy: { startedAt: 'desc' },
    });

    const completed = logs.filter((l) => l.completedAt);
    const efficiencies = completed
      .filter((l) => l.efficiencyPct !== null)
      .map((l) => Number(l.efficiencyPct));

    return {
      workerId,
      period: `${days}d`,
      totalTasks: logs.length,
      completedTasks: completed.length,
      avgEfficiencyPct:
        efficiencies.length > 0
          ? Math.round(efficiencies.reduce((a, b) => a + b, 0) / efficiencies.length)
          : null,
      logs,
    };
  }
}
