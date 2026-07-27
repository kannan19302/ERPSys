import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class FieldServiceSchedulingService {
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
    const [data, total] = await Promise.all([
      prisma.fieldServiceSchedule.findMany({
        where,
        include: {
          technician: { select: { id: true, name: true } },
          ticket: { select: { id: true, title: true } },
        },
        orderBy: { scheduledDate: "asc" },
        skip,
        take: limit,
      }),
      prisma.fieldServiceSchedule.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getScheduleById(tenantId: string, id: string) {
    const s = await prisma.fieldServiceSchedule.findFirst({
      where: { tenantId, id },
      include: { technician: true, ticket: true },
    });
    if (!s) throw new NotFoundException("Schedule entry not found");
    return s;
  }

  async createSchedule(tenantId: string, data: any) {
    return prisma.fieldServiceSchedule.create({
      data: {
        ...data,
        tenantId,
        scheduledDate: new Date(data.scheduledDate),
        startTime: data.startTime ? new Date(data.startTime) : null,
        endTime: data.endTime ? new Date(data.endTime) : null,
      },
      include: { technician: { select: { id: true, name: true } } },
    });
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
    return prisma.fieldServiceSchedule.update({
      where: { id },
      data: updateData,
      include: { technician: { select: { id: true, name: true } } },
    });
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
    return prisma.fieldServiceCalendarEvent.findMany({
      where,
      include: { technician: { select: { id: true, name: true } } },
      orderBy: { startTime: "asc" },
    });
  }

  async createCalendarEvent(tenantId: string, data: any) {
    return prisma.fieldServiceCalendarEvent.create({
      data: {
        ...data,
        tenantId,
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
      },
      include: { technician: { select: { id: true, name: true } } },
    });
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
    const [schedules, events] = await Promise.all([
      prisma.fieldServiceSchedule.findMany({
        where: {
          tenantId,
          scheduledDate: { gte: start, lt: end },
          isActive: true,
        },
        include: {
          technician: { select: { id: true, name: true } },
          ticket: { select: { id: true, title: true } },
        },
        orderBy: [{ scheduledDate: "asc" }, { startTime: "asc" }],
      }),
      prisma.fieldServiceCalendarEvent.findMany({
        where: { tenantId, startTime: { gte: start, lt: end }, isActive: true },
        include: { technician: { select: { id: true, name: true } } },
        orderBy: { startTime: "asc" },
      }),
    ]);
    return { schedules, events, weekStart: start, weekEnd: end };
  }
}
