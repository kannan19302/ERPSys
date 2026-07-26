import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { prisma } from "@unerp/database";
import { Prisma } from "@prisma/client";

@Injectable()
export class CloseManagementService {
  // ── Task Dependencies ──────────────────────────────────────────────────────

  async createTaskDependency(
    tenantId: string,
    dto: {
      taskId: string;
      dependsOnTaskId: string;
      dependencyType: string;
      lagDays?: number;
      isCritical?: boolean;
    },
  ) {
    return prisma.closeTaskDependency.create({
      data: {
        tenantId,
        taskId: dto.taskId,
        dependsOnTaskId: dto.dependsOnTaskId,
        dependencyType: dto.dependencyType,
        lagDays: dto.lagDays || 0,
        isCritical: dto.isCritical || false,
      },
    });
  }

  async listTaskDependencies(tenantId: string, taskId?: string) {
    const where: Prisma.CloseTaskDependencyWhereInput = { tenantId };
    if (taskId) where.taskId = taskId;
    return (prisma.closeTaskDependency as any).findMany({
      where,
      include: {
        dependsOn: {
          select: { id: true, name: true, status: true, dueDate: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async deleteTaskDependency(tenantId: string, id: string) {
    const dep = await prisma.closeTaskDependency.findFirst({
      where: { id, tenantId },
    });
    if (!dep) throw new NotFoundException("Task dependency not found");
    await prisma.closeTaskDependency.delete({ where: { id } });
    return { success: true };
  }

  // ── SLA Management ─────────────────────────────────────────────────────────

  async createSla(
    tenantId: string,
    dto: {
      taskId: string;
      deadlineAt: string;
      slaMinutes: number;
      priority?: string;
      escalateAfter?: number;
    },
  ) {
    return prisma.closeTaskSla.create({
      data: {
        tenantId,
        taskId: dto.taskId,
        deadlineAt: new Date(dto.deadlineAt),
        slaMinutes: dto.slaMinutes,
        priority: dto.priority || "NORMAL",
        escalateAfter: dto.escalateAfter || 30,
        status: "ACTIVE",
      },
    });
  }

  async listSlas(
    tenantId: string,
    query: { status?: string; taskId?: string; page?: string; limit?: string },
  ) {
    const page = Math.max(1, parseInt(query.page || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(query.limit || "20", 10)));
    const skip = (page - 1) * limit;

    const where: Prisma.CloseTaskSlaWhereInput = { tenantId };
    if (query.status) where.status = query.status;
    if (query.taskId) where.taskId = query.taskId;

    const [items, total] = await Promise.all([
      prisma.closeTaskSla.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.closeTaskSla.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async updateSlaStatus(tenantId: string, id: string, dto: { status: string }) {
    const sla = await prisma.closeTaskSla.findFirst({
      where: { id, tenantId },
    });
    if (!sla) throw new NotFoundException("SLA not found");
    const data: Prisma.CloseTaskSlaUpdateInput = { status: dto.status };
    if (dto.status === "BREACHED") data.breachedAt = new Date();
    return prisma.closeTaskSla.update({ where: { id }, data });
  }

  async getBreachedSlas(tenantId: string) {
    return (prisma.closeTaskSla as any).findMany({
      where: { tenantId, status: "BREACHED" },
      include: {
        task: {
          select: {
            id: true,
            name: true,
            category: true,
            assigneeId: true,
            dueDate: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  // ── Close Calendar ─────────────────────────────────────────────────────────

  async createCalendarEvent(
    tenantId: string,
    dto: {
      periodId: string;
      eventType: string;
      title: string;
      description?: string;
      dueAt: string;
    },
  ) {
    return prisma.closeCalendarEvent.create({
      data: {
        tenantId,
        periodId: dto.periodId,
        eventType: dto.eventType,
        title: dto.title,
        description: dto.description || null,
        dueAt: new Date(dto.dueAt),
        status: "PENDING",
      },
    });
  }

  async listCalendarEvents(
    tenantId: string,
    periodId?: string,
    eventType?: string,
  ) {
    const where: Prisma.CloseCalendarEventWhereInput = { tenantId };
    if (periodId) where.periodId = periodId;
    if (eventType) where.eventType = eventType;
    return prisma.closeCalendarEvent.findMany({
      where,
      orderBy: { dueAt: "asc" },
    });
  }

  async completeCalendarEvent(tenantId: string, id: string) {
    const event = await prisma.closeCalendarEvent.findFirst({
      where: { id, tenantId },
    });
    if (!event) throw new NotFoundException("Calendar event not found");
    if (event.status === "COMPLETED") {
      throw new BadRequestException("Event is already completed");
    }
    return prisma.closeCalendarEvent.update({
      where: { id },
      data: { status: "COMPLETED", completedAt: new Date() },
    });
  }

  async getPeriodEvents(tenantId: string, periodId: string) {
    const [pending, completed, total] = await Promise.all([
      prisma.closeCalendarEvent.count({
        where: { tenantId, periodId, status: "PENDING" },
      }),
      prisma.closeCalendarEvent.count({
        where: { tenantId, periodId, status: "COMPLETED" },
      }),
      prisma.closeCalendarEvent.findMany({
        where: { tenantId, periodId },
        orderBy: { dueAt: "asc" },
      }),
    ]);
    return {
      total: total.length,
      pending,
      completed,
      completionRate:
        total.length > 0 ? Math.round((completed / total.length) * 100) : 0,
      events: total,
    };
  }

  // ── Escalation Rules ───────────────────────────────────────────────────────

  async createEscalationRule(
    tenantId: string,
    dto: {
      name: string;
      conditionField: string;
      conditionOperator: string;
      conditionValue: string;
      escalateToRole?: string;
      escalateToUser?: string;
      notifyMethod?: string;
    },
  ) {
    return prisma.closeEscalationRule.create({
      data: {
        tenantId,
        name: dto.name,
        conditionField: dto.conditionField,
        conditionOperator: dto.conditionOperator,
        conditionValue: dto.conditionValue,
        escalateToRole: dto.escalateToRole || null,
        escalateToUser: dto.escalateToUser || null,
        notifyMethod: dto.notifyMethod || "EMAIL",
        isActive: true,
      },
    });
  }

  async listEscalationRules(tenantId: string, isActive?: boolean) {
    const where: Prisma.CloseEscalationRuleWhereInput = { tenantId };
    if (isActive !== undefined) where.isActive = isActive;
    return prisma.closeEscalationRule.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
  }

  async getEscalationRule(tenantId: string, id: string) {
    const rule = await prisma.closeEscalationRule.findFirst({
      where: { id, tenantId },
    });
    if (!rule) throw new NotFoundException("Escalation rule not found");
    return rule;
  }

  async updateEscalationRule(
    tenantId: string,
    id: string,
    dto: {
      name?: string;
      conditionField?: string;
      conditionOperator?: string;
      conditionValue?: string;
      escalateToRole?: string;
      escalateToUser?: string;
      notifyMethod?: string;
      isActive?: boolean;
    },
  ) {
    await this.getEscalationRule(tenantId, id);
    const data: Prisma.CloseEscalationRuleUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.conditionField !== undefined)
      data.conditionField = dto.conditionField;
    if (dto.conditionOperator !== undefined)
      data.conditionOperator = dto.conditionOperator;
    if (dto.conditionValue !== undefined)
      data.conditionValue = dto.conditionValue;
    if (dto.escalateToRole !== undefined)
      data.escalateToRole = dto.escalateToRole;
    if (dto.escalateToUser !== undefined)
      data.escalateToUser = dto.escalateToUser;
    if (dto.notifyMethod !== undefined) data.notifyMethod = dto.notifyMethod;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    return prisma.closeEscalationRule.update({ where: { id }, data });
  }

  async deleteEscalationRule(tenantId: string, id: string) {
    await this.getEscalationRule(tenantId, id);
    await prisma.closeEscalationRule.delete({ where: { id } });
    return { success: true };
  }

  // ── Analytics ──────────────────────────────────────────────────────────────

  async captureSnapshot(
    tenantId: string,
    _userId: string,
    dto: {
      periodId: string;
      totalTasks: number;
      completedTasks: number;
      overdueTasks: number;
      breachedSlas: number;
      avgCompletion?: number;
      cycleTimeHours?: number;
      snapshotData?: Prisma.JsonValue;
    },
  ) {
    return prisma.closeAnalyticsSnapshot.create({
      data: {
        tenantId,
        periodId: dto.periodId,
        totalTasks: dto.totalTasks,
        completedTasks: dto.completedTasks,
        overdueTasks: dto.overdueTasks,
        breachedSlas: dto.breachedSlas,
        avgCompletion:
          dto.avgCompletion !== undefined
            ? new Prisma.Decimal(dto.avgCompletion)
            : null,
        cycleTimeHours:
          dto.cycleTimeHours !== undefined
            ? new Prisma.Decimal(dto.cycleTimeHours)
            : null,
        snapshotData: dto.snapshotData || Prisma.JsonNull,
      },
    });
  }

  async getPeriodAnalytics(tenantId: string, periodId: string) {
    const snapshots = await prisma.closeAnalyticsSnapshot.findMany({
      where: { tenantId, periodId },
      orderBy: { capturedAt: "asc" },
    });

    const latest =
      snapshots.length > 0 ? snapshots[snapshots.length - 1] : null;
    const earliest = snapshots.length > 0 ? snapshots[0] : null;

    return {
      periodId,
      snapshotCount: snapshots.length,
      latest: latest
        ? {
            totalTasks: latest.totalTasks,
            completedTasks: latest.completedTasks,
            overdueTasks: latest.overdueTasks,
            breachedSlas: latest.breachedSlas,
            avgCompletion: latest.avgCompletion,
            cycleTimeHours: latest.cycleTimeHours,
            capturedAt: latest.capturedAt,
          }
        : null,
      snapshots,
      improvement:
        latest && earliest
          ? {
              overdueChange: earliest.overdueTasks - latest.overdueTasks,
              completionChange:
                earliest.totalTasks > 0 && latest.totalTasks > 0
                  ? (latest.completedTasks / latest.totalTasks) * 100 -
                    (earliest.completedTasks / earliest.totalTasks) * 100
                  : 0,
            }
          : null,
    };
  }

  async getTrendData(tenantId: string) {
    const snapshots = await prisma.closeAnalyticsSnapshot.findMany({
      where: { tenantId },
      orderBy: { capturedAt: "asc" },
    });

    const groupedByPeriod = snapshots.reduce<
      Record<
        string,
        { capturedAt: Date; completedRate: number; overdueCount: number }[]
      >
    >((acc, s) => {
      const arr = acc[s.periodId] || [];
      arr.push({
        capturedAt: s.capturedAt,
        completedRate:
          s.totalTasks > 0 ? (s.completedTasks / s.totalTasks) * 100 : 0,
        overdueCount: s.overdueTasks,
      });
      acc[s.periodId] = arr;
      return acc;
    }, {});

    return {
      periodCount: Object.keys(groupedByPeriod).length,
      totalSnapshots: snapshots.length,
      byPeriod: groupedByPeriod,
    };
  }

  // ── Dashboard ──────────────────────────────────────────────────────────────

  async getCloseStatusSummary(tenantId: string, periodId?: string) {
    const where: Prisma.CloseTaskWhereInput = { tenantId };
    if (periodId) where.financialPeriodId = periodId;

    const [total, open, inProgress, done, skipped, overdue] = await Promise.all(
      [
        prisma.closeTask.count({ where }),
        prisma.closeTask.count({ where: { ...where, status: "OPEN" } }),
        prisma.closeTask.count({ where: { ...where, status: "IN_PROGRESS" } }),
        prisma.closeTask.count({ where: { ...where, status: "DONE" } }),
        prisma.closeTask.count({ where: { ...where, status: "SKIPPED" } }),
        prisma.closeTask.count({
          where: {
            ...where,
            status: { notIn: ["DONE", "SKIPPED"] },
            dueDate: { lt: new Date() },
          },
        }),
      ],
    );

    const tasksByCategory = await prisma.closeTask.groupBy({
      by: ["category"],
      where,
      _count: true,
    });

    return {
      total,
      open,
      inProgress,
      done,
      skipped,
      overdue,
      completionRate: total > 0 ? Math.round((done / total) * 100) : 0,
      tasksByCategory: tasksByCategory.map((t) => ({
        category: t.category,
        count: t._count,
      })),
    };
  }

  async getCriticalPathAnalysis(tenantId: string, periodId?: string) {
    const deps = await (prisma.closeTaskDependency as any).findMany({
      where: { tenantId, isCritical: true },
      include: {
        task: {
          select: {
            id: true,
            name: true,
            status: true,
            dueDate: true,
            priority: true,
          },
        },
        dependsOn: {
          select: {
            id: true,
            name: true,
            status: true,
            dueDate: true,
            priority: true,
          },
        },
      },
    });

    const criticalDepIds = deps.map((d: any) => d.dependsOnTaskId);
    const blockedTasks = await prisma.closeTask.count({
      where: {
        tenantId,
        ...(periodId ? { financialPeriodId: periodId } : {}),
        id: { in: criticalDepIds },
        status: { notIn: ["DONE", "SKIPPED"] },
      },
    });

    return {
      criticalDependencies: deps.length,
      blockedTasks,
      criticalPath: deps.map((d: any) => ({
        id: d.id,
        task: d.task,
        dependsOn: d.dependsOn,
        dependencyType: d.dependencyType,
        lagDays: d.lagDays,
      })),
    };
  }
}
