// @ts-nocheck
import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class ManufacturingApsService {
  async getSchedulingData(tenantId: string) {
    const [workOrders, workstations, constraints] = await Promise.all([
      prisma.workOrder.findMany({
        where: {
          tenantId,
          status: { in: ["DRAFT", "PLANNED", "IN_PROGRESS"] },
        },
        include: { operations: { orderBy: { sequence: "asc" } }, bom: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.workstation.findMany({ where: { tenantId } }),
      prisma.apsConstraint.findMany({ where: { tenantId, isActive: true } }),
    ]);
    return {
      workOrderCount: workOrders.length,
      workstationCount: workstations.length,
      constraintCount: constraints.length,
      workOrders,
      workstations,
      constraints,
    };
  }

  async runConstraintSolver(
    tenantId: string,
    data: { name: string; algorithm?: string; horizonDays?: number },
  ) {
    const schedule = await prisma.apsSchedule.create({
      data: {
        tenantId,
        name: data.name,
        algorithm: data.algorithm || "FORWARD",
        horizonDays: data.horizonDays || 30,
        status: "RUNNING",
      },
    });
    const workOrders = await prisma.workOrder.findMany({
      where: { tenantId, status: { in: ["DRAFT", "PLANNED"] } },
      include: { operations: true },
    });
    const workstations = await prisma.workstation.findMany({
      where: { tenantId },
    });
    const jobs: Array<{
      tenantId: string;
      scheduleId: string;
      workOrderId: string;
      workstationId: string;
      sequence: number;
      durationMin: number;
      setupMin: number;
      startTime: Date;
      endTime: Date;
    }> = [];
    const baseDate = new Date();
    let cursor = new Date(baseDate);
    for (const wo of workOrders) {
      const ops = wo.operations || [];
      if (ops.length === 0) continue;
      for (const op of ops) {
        const ws =
          workstations.find((w) => w.code === op.workstationCode) ||
          workstations[0];
        if (!ws) continue;
        const duration = op.durationMinutes || 60;
        const setup = 0;
        const startTime = new Date(cursor);
        const endTime = new Date(
          startTime.getTime() + (duration + setup) * 60000,
        );
        jobs.push({
          tenantId,
          scheduleId: schedule.id,
          workOrderId: wo.id,
          workstationId: ws.id,
          sequence: ops.indexOf(op) + 1,
          durationMin: duration,
          setupMin: setup,
          startTime,
          endTime,
        });
        cursor = endTime;
      }
    }
    if (jobs.length > 0) {
      await prisma.apsJob.createMany({ data: jobs });
    }
    const scheduleJson = jobs.map((j) => ({
      workOrderId: j.workOrderId,
      workstationId: j.workstationId,
      startTime: j.startTime,
      endTime: j.endTime,
      durationMin: j.durationMin,
    }));
    const completed = await prisma.apsSchedule.update({
      where: { id: schedule.id },
      data: { status: "COMPLETED", scheduleJson, completedAt: new Date() },
      include: { jobs: true },
    });
    return completed;
  }

  async getScheduleGanttData(tenantId: string, scheduleId: string) {
    const schedule = await prisma.apsSchedule.findFirst({
      where: { id: scheduleId, tenantId },
      include: {
        jobs: { orderBy: [{ workstationId: "asc" }, { startTime: "asc" }] },
      },
    });
    if (!schedule) throw new NotFoundException("APS Schedule not found");
    const grouped: Record<
      string,
      Array<{
        workOrderId: string;
        startTime: Date;
        endTime: Date;
        durationMin: number;
      }>
    > = {};
    for (const job of schedule.jobs) {
      const wsId = job.workstationId || "unknown";
      if (!grouped[wsId]) grouped[wsId] = [];
      grouped[wsId].push({
        workOrderId: job.workOrderId,
        startTime: job.startTime || new Date(),
        endTime: job.endTime || new Date(),
        durationMin: job.durationMin,
      });
    }
    return {
      scheduleId: schedule.id,
      name: schedule.name,
      algorithm: schedule.algorithm,
      ganttData: grouped,
    };
  }

  async simulateFiniteLoad(
    tenantId: string,
    data: {
      scenarioName: string;
      overtimeHours?: number;
      additionalShifts?: number;
      workstationIds?: string[];
    },
  ) {
    const scenario = await prisma.apsSimulationScenario.create({
      data: {
        tenantId,
        name: data.scenarioName,
        whatIfJson: {
          overtimeHours: data.overtimeHours || 0,
          additionalShifts: data.additionalShifts || 0,
          workstationIds: data.workstationIds || [],
        },
        status: "RUNNING",
      },
    });
    const workOrders = await prisma.workOrder.findMany({
      where: { tenantId, status: { in: ["DRAFT", "PLANNED"] } },
      include: { operations: true },
    });
    const workstations = data.workstationIds
      ? await prisma.workstation.findMany({
          where: { tenantId, id: { in: data.workstationIds } },
        })
      : await prisma.workstation.findMany({ where: { tenantId } });
    const totalLoad = workOrders.reduce(
      (sum, wo) =>
        sum +
        (wo.operations || []).reduce(
          (s, op) =>
            s + (op.durationMinutes || 0) + (data.overtimeHours || 0) * 60,
          0,
        ),
      0,
    );
    const availableCapacity =
      workstations.reduce((sum, ws) => sum + Number(ws.capacityHours) * 60, 0) *
      (1 + (data.additionalShifts || 0));
    const feasibility =
      availableCapacity > 0
        ? Math.min(100, Math.round((totalLoad / availableCapacity) * 100))
        : 0;
    const result = {
      totalLoadMinutes: totalLoad,
      availableCapacityMinutes: availableCapacity,
      utilizationPct: feasibility,
      workOrderCount: workOrders.length,
      workstationCount: workstations.length,
    };
    await prisma.apsSimulationScenario.update({
      where: { id: scenario.id },
      data: { resultJson: result, status: "COMPLETED" },
    });
    return { scenarioId: scenario.id, ...result };
  }

  async getApsDashboard(tenantId: string) {
    const [schedules, constraints] = await Promise.all([
      prisma.apsSchedule.findMany({
        where: { tenantId },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.apsConstraint.findMany({ where: { tenantId, isActive: true } }),
    ]);
    return {
      totalSchedules: schedules.length,
      activeSchedules: schedules.filter((s) => s.status === "COMPLETED").length,
      constraintsByType: constraints.reduce(
        (acc: Record<string, number>, c) => {
          acc[c.type] = (acc[c.type] || 0) + 1;
          return acc;
        },
        {},
      ),
      recentSchedules: schedules,
    };
  }

  async createConstraint(
    tenantId: string,
    data: {
      name: string;
      type?: string;
      resourceId?: string;
      resourceType?: string;
      maxLoad?: number;
      priority?: number;
    },
  ) {
    return prisma.apsConstraint.create({
      data: {
        tenantId,
        name: data.name,
        type: data.type || "CAPACITY",
        resourceId: data.resourceId,
        resourceType: data.resourceType,
        maxLoad: data.maxLoad,
        priority: data.priority || 50,
      },
    });
  }
}
