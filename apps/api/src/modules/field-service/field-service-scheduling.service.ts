import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class FieldServiceSchedulingService {
  // FieldServiceSchedule/FieldServiceCalendarEvent only store `technicianId`/
  // `ticketId` scalars — the schema has no `technician`/`ticket` relations to
  // `include`, so callers here need it batched in manually.
  private async attachTechnicians<T extends { technicianId: string }>(
    tenantId: string,
    rows: T[],
  ) {
    const technicians = await prisma.fieldServiceTechnician.findMany({
      where: { tenantId, id: { in: rows.map((r) => r.technicianId) } },
      select: { id: true, name: true },
    });
    const byId = new Map(technicians.map((t) => [t.id, t]));
    return rows.map((r) => ({
      ...r,
      technician: byId.get(r.technicianId) || null,
    }));
  }

  private async attachTickets<T extends { ticketId: string | null }>(
    tenantId: string,
    rows: T[],
  ) {
    const ticketIds = rows
      .map((r) => r.ticketId)
      .filter((id): id is string => id !== null);
    const tickets = await prisma.fieldServiceTicket.findMany({
      where: { tenantId, id: { in: ticketIds } },
      select: { id: true, title: true },
    });
    const byId = new Map(tickets.map((t) => [t.id, t]));
    return rows.map((r) => ({
      ...r,
      ticket: r.ticketId ? byId.get(r.ticketId) || null : null,
    }));
  }

  async getSchedules(tenantId: string, query: any = {}) {
    const where: any = { tenantId, isActive: true };
    if (query.technicianId) where.technicianId = query.technicianId;
    if (query.status) where.status = query.status;
    if (query.date) where.scheduledDate = new Date(query.date);
    if (query.fromDate)
      where.scheduledDate = {
        ...(where.scheduledDate || {}),
        gte: new Date(query.fromDate),
      };
    if (query.toDate)
      where.scheduledDate = {
        ...(where.scheduledDate || {}),
        lte: new Date(query.toDate),
      };
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 50;
    const skip = (page - 1) * limit;
    const [rows, total] = await Promise.all([
      prisma.fieldServiceSchedule.findMany({
        where,
        orderBy: { scheduledDate: "asc" },
        skip,
        take: limit,
      }),
      prisma.fieldServiceSchedule.count({ where }),
    ]);
    const withTech = await this.attachTechnicians(tenantId, rows);
    const data = await this.attachTickets(tenantId, withTech);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getScheduleById(tenantId: string, id: string) {
    const s = await prisma.fieldServiceSchedule.findFirst({
      where: { tenantId, id },
    });
    if (!s) throw new NotFoundException("Schedule entry not found");
    const [withTech] = await this.attachTechnicians(tenantId, [s]);
    const [result] = await this.attachTickets(tenantId, [withTech!]);
    return result;
  }

  async createSchedule(tenantId: string, data: any) {
    const created = await prisma.fieldServiceSchedule.create({
      data: {
        ...data,
        tenantId,
        scheduledDate: new Date(data.scheduledDate),
        startTime: data.startTime ? new Date(data.startTime) : null,
        endTime: data.endTime ? new Date(data.endTime) : null,
      },
    });
    const [result] = await this.attachTechnicians(tenantId, [created]);
    return result;
  }

  async updateSchedule(tenantId: string, id: string, data: any) {
    const existing = await prisma.fieldServiceSchedule.findFirst({
      where: { tenantId, id },
    });
    if (!existing) throw new NotFoundException("Schedule entry not found");
    const updateData: any = { ...data };
    if (data.scheduledDate)
      updateData.scheduledDate = new Date(data.scheduledDate);
    if (data.startTime) updateData.startTime = new Date(data.startTime);
    if (data.endTime) updateData.endTime = new Date(data.endTime);
    const updated = await prisma.fieldServiceSchedule.update({
      where: { id },
      data: updateData,
    });
    const [result] = await this.attachTechnicians(tenantId, [updated]);
    return result;
  }

  async deleteSchedule(tenantId: string, id: string) {
    const existing = await prisma.fieldServiceSchedule.findFirst({
      where: { tenantId, id },
    });
    if (!existing) throw new NotFoundException("Schedule entry not found");
    return prisma.fieldServiceSchedule.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async getCalendarEvents(tenantId: string, query: any = {}) {
    const where: any = { tenantId, isActive: true };
    if (query.technicianId) where.technicianId = query.technicianId;
    if (query.status) where.status = query.status;
    if (query.fromDate)
      where.startTime = {
        ...(where.startTime || {}),
        gte: new Date(query.fromDate),
      };
    if (query.toDate)
      where.endTime = { ...(where.endTime || {}), lte: new Date(query.toDate) };
    const rows = await prisma.fieldServiceCalendarEvent.findMany({
      where,
      orderBy: { startTime: "asc" },
    });
    return this.attachTechnicians(tenantId, rows);
  }

  async createCalendarEvent(tenantId: string, data: any) {
    const created = await prisma.fieldServiceCalendarEvent.create({
      data: {
        ...data,
        tenantId,
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
      },
    });
    const [result] = await this.attachTechnicians(tenantId, [created]);
    return result;
  }

  async updateCalendarEvent(tenantId: string, id: string, data: any) {
    const existing = await prisma.fieldServiceCalendarEvent.findFirst({
      where: { tenantId, id },
    });
    if (!existing) throw new NotFoundException("Calendar event not found");
    const updateData: any = { ...data };
    if (data.startTime) updateData.startTime = new Date(data.startTime);
    if (data.endTime) updateData.endTime = new Date(data.endTime);
    return prisma.fieldServiceCalendarEvent.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteCalendarEvent(tenantId: string, id: string) {
    const existing = await prisma.fieldServiceCalendarEvent.findFirst({
      where: { tenantId, id },
    });
    if (!existing) throw new NotFoundException("Calendar event not found");
    return prisma.fieldServiceCalendarEvent.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async getWeeklySchedule(tenantId: string, startDate: string) {
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    const [scheduleRows, eventRows] = await Promise.all([
      prisma.fieldServiceSchedule.findMany({
        where: {
          tenantId,
          scheduledDate: { gte: start, lt: end },
          isActive: true,
        },
        orderBy: [{ scheduledDate: "asc" }, { startTime: "asc" }],
      }),
      prisma.fieldServiceCalendarEvent.findMany({
        where: { tenantId, startTime: { gte: start, lt: end }, isActive: true },
        orderBy: { startTime: "asc" },
      }),
    ]);
    const schedulesWithTech = await this.attachTechnicians(
      tenantId,
      scheduleRows,
    );
    const schedules = await this.attachTickets(tenantId, schedulesWithTech);
    const events = await this.attachTechnicians(tenantId, eventRows);
    return { schedules, events, weekStart: start, weekEnd: end };
  }
}
