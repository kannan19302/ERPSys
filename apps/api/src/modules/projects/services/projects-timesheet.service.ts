// @ts-nocheck
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class ProjectsTimesheetService {
  async getTimesheets(tenantId: string, userId?: string, status?: string) {
    const where: any = { tenantId };
    if (userId) where.userId = userId;
    if (status) where.status = status;
    return prisma.ppmTimesheet.findMany({
      where,
      include: { timesheetEntries: true },
      orderBy: { weekStart: "desc" },
    });
  }

  async getTimesheetById(tenantId: string, id: string) {
    const timesheet = await prisma.ppmTimesheet.findFirst({
      where: { id, tenantId },
      include: { timesheetEntries: true },
    });
    if (!timesheet) throw new NotFoundException("Timesheet not found");
    return timesheet;
  }

  async createTimesheet(
    tenantId: string,
    dto: {
      userId: string;
      weekStart: string;
      weekEnd: string;
      notes?: string;
      entries?: {
        projectId?: string;
        taskId?: string;
        date: string;
        hours: number;
        isBillable?: boolean;
        description?: string;
        activityType?: string;
      }[];
    },
  ) {
    const overlapping = await prisma.ppmTimesheet.findFirst({
      where: {
        tenantId,
        userId: dto.userId,
        weekStart: new Date(dto.weekStart),
      },
    });
    if (overlapping) {
      throw new BadRequestException(
        "A timesheet already exists for this week.",
      );
    }
    const totalHours = dto.entries
      ? dto.entries.reduce((s, e) => s + e.hours, 0)
      : 0;
    const billableHours = dto.entries
      ? dto.entries
          .filter((e) => e.isBillable !== false)
          .reduce((s, e) => s + e.hours, 0)
      : 0;
    return prisma.ppmTimesheet.create({
      data: {
        tenantId,
        userId: dto.userId,
        weekStart: new Date(dto.weekStart),
        weekEnd: new Date(dto.weekEnd),
        totalHours,
        billableHours,
        notes: dto.notes || null,
        timesheetEntries: dto.entries
          ? {
              createMany: {
                data: dto.entries.map((e) => ({
                  tenantId,
                  projectId: e.projectId || null,
                  taskId: e.taskId || null,
                  date: new Date(e.date),
                  hours: e.hours,
                  isBillable: e.isBillable ?? true,
                  description: e.description || null,
                  activityType: e.activityType || null,
                })),
              },
            }
          : undefined,
      },
      include: { timesheetEntries: true },
    });
  }

  async submitTimesheet(tenantId: string, timesheetId: string) {
    const timesheet = await prisma.ppmTimesheet.findFirst({
      where: { id: timesheetId, tenantId },
    });
    if (!timesheet) throw new NotFoundException("Timesheet not found");
    if (timesheet.status !== "DRAFT") {
      throw new BadRequestException(
        `Timesheet is already ${timesheet.status}.`,
      );
    }
    return prisma.ppmTimesheet.update({
      where: { id: timesheetId },
      data: { status: "SUBMITTED", submittedAt: new Date() },
    });
  }

  async approveTimesheet(
    tenantId: string,
    timesheetId: string,
    approvedBy: string,
    notes?: string,
  ) {
    const timesheet = await prisma.ppmTimesheet.findFirst({
      where: { id: timesheetId, tenantId },
    });
    if (!timesheet) throw new NotFoundException("Timesheet not found");
    if (timesheet.status !== "SUBMITTED") {
      throw new BadRequestException(
        "Only submitted timesheets can be approved.",
      );
    }
    return prisma.ppmTimesheet.update({
      where: { id: timesheetId },
      data: {
        status: "APPROVED",
        approvedBy,
        approvedAt: new Date(),
        notes: notes
          ? `${timesheet.notes || ""}\n[Approval]: ${notes}`
          : undefined,
      },
    });
  }

  async rejectTimesheet(tenantId: string, timesheetId: string, reason: string) {
    const timesheet = await prisma.ppmTimesheet.findFirst({
      where: { id: timesheetId, tenantId },
    });
    if (!timesheet) throw new NotFoundException("Timesheet not found");
    if (timesheet.status !== "SUBMITTED") {
      throw new BadRequestException(
        "Only submitted timesheets can be rejected.",
      );
    }
    return prisma.ppmTimesheet.update({
      where: { id: timesheetId },
      data: {
        status: "REJECTED",
        notes: `${timesheet.notes || ""}\n[Rejection]: ${reason}`,
      },
    });
  }

  async getUtilizationRate(
    tenantId: string,
    userId?: string,
    startDate?: string,
    endDate?: string,
  ) {
    const where: any = { tenantId, status: "APPROVED" };
    if (userId) where.userId = userId;
    if (startDate) where.weekStart = { gte: new Date(startDate) };
    if (endDate) where.weekEnd = { lte: new Date(endDate) };
    const timesheets = await prisma.ppmTimesheet.findMany({
      where,
      include: { timesheetEntries: true },
    });
    const totalHours = timesheets.reduce((s, t) => s + (t.totalHours || 0), 0);
    const billableHours = timesheets.reduce(
      (s, t) => s + (t.billableHours || 0),
      0,
    );
    const utilizationRate =
      totalHours > 0 ? Math.round((billableHours / totalHours) * 100) : 0;
    const weeksCount = timesheets.length;
    const avgHoursPerWeek = weeksCount > 0 ? totalHours / weeksCount : 0;
    return {
      totalTimesheets: weeksCount,
      totalHours,
      billableHours,
      nonBillableHours: totalHours - billableHours,
      utilizationRate,
      avgHoursPerWeek: Math.round(avgHoursPerWeek * 10) / 10,
      byUser: userId ? undefined : this.aggregateByUser(timesheets),
    };
  }

  async getTimesheetDashboard(tenantId: string) {
    const allTimesheets = await prisma.ppmTimesheet.findMany({
      where: { tenantId },
      include: { timesheetEntries: true },
    });
    const total = allTimesheets.length;
    const draft = allTimesheets.filter((t) => t.status === "DRAFT").length;
    const submitted = allTimesheets.filter(
      (t) => t.status === "SUBMITTED",
    ).length;
    const approved = allTimesheets.filter(
      (t) => t.status === "APPROVED",
    ).length;
    const rejected = allTimesheets.filter(
      (t) => t.status === "REJECTED",
    ).length;
    const totalHours = allTimesheets.reduce(
      (s, t) => s + (t.totalHours || 0),
      0,
    );
    const billableHours = allTimesheets.reduce(
      (s, t) => s + (t.billableHours || 0),
      0,
    );
    return {
      total,
      draft,
      submitted,
      approved,
      rejected,
      approvalRate:
        submitted + approved + rejected > 0
          ? Math.round((approved / (submitted + approved + rejected)) * 100)
          : 0,
      totalHours,
      billableHours,
      utilizationRate:
        totalHours > 0 ? Math.round((billableHours / totalHours) * 100) : 0,
      uniqueUsers: new Set(allTimesheets.map((t) => t.userId)).size,
    };
  }

  private aggregateByUser(timesheets: any[]) {
    const userMap = new Map<
      string,
      { total: number; billable: number; count: number }
    >();
    for (const t of timesheets) {
      const existing = userMap.get(t.userId) || {
        total: 0,
        billable: 0,
        count: 0,
      };
      existing.total += t.totalHours || 0;
      existing.billable += t.billableHours || 0;
      existing.count += 1;
      userMap.set(t.userId, existing);
    }
    return Array.from(userMap.entries()).map(([userId, data]) => ({
      userId,
      ...data,
      utilizationRate:
        data.total > 0 ? Math.round((data.billable / data.total) * 100) : 0,
      avgHoursPerWeek: Math.round((data.total / data.count) * 10) / 10,
    }));
  }
}
