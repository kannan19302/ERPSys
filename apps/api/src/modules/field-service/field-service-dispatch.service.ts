import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class FieldServiceDispatchService {
  // ── Technicians ──
  async getTechnicians(tenantId: string, query: any = {}) {
    const where: any = { tenantId, isActive: true };
    if (query.status) where.currentStatus = query.status;
    if (query.search)
      where.name = { contains: query.search, mode: "insensitive" };
    if (query.skill) where.skills = { array_contains: query.skill };
    return prisma.fieldServiceTechnician.findMany({
      where,
      orderBy: { name: "asc" },
    });
  }
  async getTechnicianById(tenantId: string, id: string) {
    const tech = await prisma.fieldServiceTechnician.findFirst({
      where: { tenantId, id },
      include: {
        dispatches: {
          take: 10,
          orderBy: { scheduledStart: "desc" },
          include: {
            ticket: { select: { id: true, title: true, status: true } },
          },
        },
        appointments: {
          take: 10,
          orderBy: { startTime: "desc" },
          include: { ticket: { select: { id: true, title: true } } },
        },
        timesheets: { take: 10, orderBy: { dateWorked: "desc" } },
      },
    });
    if (!tech) throw new NotFoundException("Technician not found");
    return tech;
  }
  async createTechnician(tenantId: string, data: any) {
    return prisma.fieldServiceTechnician.create({
      data: { ...data, tenantId },
    });
  }
  async updateTechnician(tenantId: string, id: string, data: any) {
    const existing = await prisma.fieldServiceTechnician.findFirst({
      where: { tenantId, id },
    });
    if (!existing) throw new NotFoundException("Technician not found");
    return prisma.fieldServiceTechnician.update({ where: { id }, data });
  }
  async deleteTechnician(tenantId: string, id: string) {
    const existing = await prisma.fieldServiceTechnician.findFirst({
      where: { tenantId, id },
    });
    if (!existing) throw new NotFoundException("Technician not found");
    return prisma.fieldServiceTechnician.update({
      where: { id },
      data: { isActive: false, currentStatus: "OFFLINE" },
    });
  }
  async updateTechnicianLocation(
    tenantId: string,
    id: string,
    lat: number,
    lng: number,
  ) {
    const existing = await prisma.fieldServiceTechnician.findFirst({
      where: { tenantId, id },
    });
    if (!existing) throw new NotFoundException("Technician not found");
    return prisma.fieldServiceTechnician.update({
      where: { id },
      data: {
        locationLat: lat,
        locationLng: lng,
        lastLocationUpdate: new Date(),
      },
    });
  }
  async setTechnicianStatus(tenantId: string, id: string, status: string) {
    const existing = await prisma.fieldServiceTechnician.findFirst({
      where: { tenantId, id },
    });
    if (!existing) throw new NotFoundException("Technician not found");
    return prisma.fieldServiceTechnician.update({
      where: { id },
      data: { currentStatus: status },
    });
  }
  async getTechnicianStats(tenantId: string) {
    const [available, busy, offline, totalTechs, avgRating] = await Promise.all(
      [
        prisma.fieldServiceTechnician.count({
          where: { tenantId, currentStatus: "AVAILABLE", isActive: true },
        }),
        prisma.fieldServiceTechnician.count({
          where: {
            tenantId,
            currentStatus: { in: ["BUSY", "ON_BREAK"] },
            isActive: true,
          },
        }),
        prisma.fieldServiceTechnician.count({
          where: {
            tenantId,
            currentStatus: { in: ["OFFLINE", "ON_LEAVE"] },
            isActive: true,
          },
        }),
        prisma.fieldServiceTechnician.count({
          where: { tenantId, isActive: true },
        }),
        prisma.fieldServiceTechnician.aggregate({
          where: { tenantId, isActive: true },
          _avg: { rating: true },
        }),
      ],
    );
    return {
      available,
      busy,
      offline,
      total: totalTechs,
      avgRating: avgRating._avg.rating || 0,
    };
  }

  // ── Dispatches ──
  async getDispatches(tenantId: string, query: any = {}) {
    const where: any = { tenantId };
    if (query.status) where.status = query.status;
    if (query.ticketId) where.ticketId = query.ticketId;
    if (query.technicianId) where.technicianId = query.technicianId;
    if (query.fromDate)
      where.scheduledStart = { gte: new Date(query.fromDate) };
    if (query.toDate)
      where.scheduledStart = {
        ...where.scheduledStart,
        lte: new Date(query.toDate),
      };
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 50;
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      prisma.fieldServiceDispatch.findMany({
        where,
        include: {
          ticket: {
            select: { id: true, title: true, priority: true, status: true },
          },
          technician: { select: { id: true, name: true, currentStatus: true } },
        },
        orderBy: { scheduledStart: "desc" },
        skip,
        take: limit,
      }),
      prisma.fieldServiceDispatch.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
  async getDispatchById(tenantId: string, id: string) {
    const d = await prisma.fieldServiceDispatch.findFirst({
      where: { tenantId, id },
      include: { ticket: true, technician: true },
    });
    if (!d) throw new NotFoundException("Dispatch not found");
    return d;
  }
  async createDispatch(tenantId: string, data: any) {
    const dispatch = await prisma.fieldServiceDispatch.create({
      data: { ...data, tenantId },
      include: { ticket: true, technician: true },
    });
    await prisma.fieldServiceTicket.update({
      where: { id: data.ticketId },
      data: { status: "ASSIGNED" },
    });
    return dispatch;
  }
  async updateDispatch(tenantId: string, id: string, data: any) {
    const existing = await prisma.fieldServiceDispatch.findFirst({
      where: { tenantId, id },
    });
    if (!existing) throw new NotFoundException("Dispatch not found");
    return prisma.fieldServiceDispatch.update({
      where: { id },
      data,
      include: { ticket: true, technician: true },
    });
  }
  async updateDispatchStatus(tenantId: string, id: string, status: string) {
    const existing = await prisma.fieldServiceDispatch.findFirst({
      where: { tenantId, id },
    });
    if (!existing) throw new NotFoundException("Dispatch not found");
    const techStatusMap: any = {
      EN_ROUTE: "BUSY",
      ON_SITE: "BUSY",
      IN_PROGRESS: "BUSY",
      COMPLETED: "AVAILABLE",
    };
    if (techStatusMap[status]) {
      await prisma.fieldServiceTechnician.update({
        where: { id: existing.technicianId },
        data: { currentStatus: techStatusMap[status] },
      });
    }
    if (status === "COMPLETED") {
      await prisma.fieldServiceTicket.update({
        where: { id: existing.ticketId },
        data: { status: "RESOLVED", completedDate: new Date() },
      });
    }
    return prisma.fieldServiceDispatch.update({
      where: { id },
      data: { status },
      include: { ticket: true, technician: true },
    });
  }
  async cancelDispatch(tenantId: string, id: string) {
    const existing = await prisma.fieldServiceDispatch.findFirst({
      where: { tenantId, id },
    });
    if (!existing) throw new NotFoundException("Dispatch not found");
    return prisma.fieldServiceDispatch.update({
      where: { id },
      data: { status: "CANCELLED" },
    });
  }
  async getDailySchedule(tenantId: string, date?: string) {
    const dayStart = date ? new Date(date) : new Date();
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);
    return prisma.fieldServiceDispatch.findMany({
      where: {
        tenantId,
        scheduledStart: { gte: dayStart, lte: dayEnd },
        status: { notIn: ["CANCELLED"] },
      },
      include: {
        ticket: {
          select: {
            id: true,
            title: true,
            priority: true,
            customerName: true,
            location: true,
          },
        },
        technician: { select: { id: true, name: true } },
      },
      orderBy: { scheduledStart: "asc" },
    });
  }
  async getDispatchStats(tenantId: string) {
    const [scheduled, enRoute, onSite, completed, cancelled] =
      await Promise.all([
        prisma.fieldServiceDispatch.count({
          where: { tenantId, status: "SCHEDULED" },
        }),
        prisma.fieldServiceDispatch.count({
          where: { tenantId, status: "EN_ROUTE" },
        }),
        prisma.fieldServiceDispatch.count({
          where: { tenantId, status: "ON_SITE" },
        }),
        prisma.fieldServiceDispatch.count({
          where: { tenantId, status: "COMPLETED" },
        }),
        prisma.fieldServiceDispatch.count({
          where: { tenantId, status: "CANCELLED" },
        }),
      ]);
    return { scheduled, enRoute, onSite, completed, cancelled };
  }

  // ── Appointments ──
  async getAppointments(tenantId: string, query: any = {}) {
    const where: any = { tenantId };
    if (query.ticketId) where.ticketId = query.ticketId;
    if (query.technicianId) where.technicianId = query.technicianId;
    if (query.status) where.status = query.status;
    if (query.fromDate) where.startTime = { gte: new Date(query.fromDate) };
    if (query.toDate)
      where.startTime = { ...where.startTime, lte: new Date(query.toDate) };
    return prisma.fieldServiceAppointment.findMany({
      where,
      include: {
        ticket: { select: { id: true, title: true } },
        technician: { select: { id: true, name: true } },
      },
      orderBy: { startTime: "desc" },
    });
  }
  async getAppointmentById(tenantId: string, id: string) {
    const appt = await prisma.fieldServiceAppointment.findFirst({
      where: { tenantId, id },
      include: { ticket: true, technician: true },
    });
    if (!appt) throw new NotFoundException("Appointment not found");
    return appt;
  }
  async createAppointment(tenantId: string, data: any) {
    return prisma.fieldServiceAppointment.create({
      data: { ...data, tenantId },
      include: { ticket: true, technician: true },
    });
  }
  async updateAppointment(tenantId: string, id: string, data: any) {
    const existing = await prisma.fieldServiceAppointment.findFirst({
      where: { tenantId, id },
    });
    if (!existing) throw new NotFoundException("Appointment not found");
    return prisma.fieldServiceAppointment.update({
      where: { id },
      data,
      include: { ticket: true, technician: true },
    });
  }
  async checkInAppointment(tenantId: string, id: string, data: any = {}) {
    const existing = await prisma.fieldServiceAppointment.findFirst({
      where: { tenantId, id },
    });
    if (!existing) throw new NotFoundException("Appointment not found");
    return prisma.fieldServiceAppointment.update({
      where: { id },
      data: { ...data, checkInTime: new Date(), status: "CHECKED_IN" },
      include: { ticket: true, technician: true },
    });
  }
  async checkOutAppointment(tenantId: string, id: string, data: any) {
    const existing = await prisma.fieldServiceAppointment.findFirst({
      where: { tenantId, id },
    });
    if (!existing) throw new NotFoundException("Appointment not found");
    const checkOut = new Date();
    const duration = existing.checkInTime
      ? Math.round(
          (checkOut.getTime() - existing.checkInTime.getTime()) / 60000,
        )
      : null;
    return prisma.fieldServiceAppointment.update({
      where: { id },
      data: {
        ...data,
        checkOutTime: checkOut,
        duration,
        endTime: checkOut,
        status: "COMPLETED",
        customerSignature: data.customerSignature,
        signatureName: data.signatureName,
        customerRating: data.customerRating,
        customerFeedback: data.customerFeedback,
        photos: data.photos,
        checklistResults: data.checklistResults,
        partsUsed: data.partsUsed,
      },
      include: { ticket: true, technician: true },
    });
  }
  async cancelAppointment(tenantId: string, id: string) {
    const existing = await prisma.fieldServiceAppointment.findFirst({
      where: { tenantId, id },
    });
    if (!existing) throw new NotFoundException("Appointment not found");
    return prisma.fieldServiceAppointment.update({
      where: { id },
      data: { status: "CANCELLED" },
    });
  }
}
