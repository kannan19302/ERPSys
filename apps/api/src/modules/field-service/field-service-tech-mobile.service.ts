import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class FieldServiceTechMobileService {
  async getDashboard(tenantId: string, technicianId: string) {
    const dash = await prisma.fieldServiceTechnicianDashboard.findMany({
      where: { tenantId, technicianId },
      orderBy: { date: "desc" },
      take: 30,
    });
    const tech = await prisma.fieldServiceTechnician.findFirst({
      where: { tenantId, id: technicianId },
      include: {
        dispatches: {
          orderBy: { scheduledStart: "desc" },
          take: 5,
          include: {
            ticket: {
              select: {
                id: true,
                title: true,
                status: true,
                customerName: true,
              },
            },
          },
        },
        appointments: {
          orderBy: { startTime: "desc" },
          take: 5,
          include: { ticket: { select: { id: true, title: true } } },
        },
      },
    });
    if (!tech) throw new NotFoundException("Technician not found");
    return {
      technician: tech,
      dashboard: dash.length > 0 ? dash[0] : null,
      history: dash,
    };
  }

  async getTodayJobs(tenantId: string, technicianId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return prisma.fieldServiceDispatch.findMany({
      where: {
        tenantId,
        technicianId,
        scheduledStart: { gte: today, lt: tomorrow },
      },
      include: {
        ticket: {
          select: {
            id: true,
            title: true,
            customerName: true,
            priority: true,
            status: true,
            location: true,
          },
        },
      },
      orderBy: { scheduledStart: "asc" },
    });
  }

  async updateDashboard(tenantId: string, id: string, data: any) {
    const existing = await prisma.fieldServiceTechnicianDashboard.findFirst({
      where: { tenantId, id },
    });
    if (!existing) throw new NotFoundException("Dashboard record not found");
    return prisma.fieldServiceTechnicianDashboard.update({
      where: { id },
      data: { ...data, lastUpdatedAt: new Date() },
    });
  }

  async upsertDashboard(tenantId: string, data: any) {
    const { technicianId, date, ...rest } = data;
    const existing = await prisma.fieldServiceTechnicianDashboard.findFirst({
      where: {
        tenantId,
        technicianId,
        date: date ? new Date(date) : new Date(new Date().toDateString()),
      },
    });
    if (existing) {
      return prisma.fieldServiceTechnicianDashboard.update({
        where: { id: existing.id },
        data: { ...rest, lastUpdatedAt: new Date() },
      });
    }
    return prisma.fieldServiceTechnicianDashboard.create({
      data: { ...data, tenantId, date: date ? new Date(date) : new Date() },
    });
  }

  async getTechnicianStatuses(tenantId: string) {
    return prisma.fieldServiceTechnician.findMany({
      where: { tenantId, isActive: true },
      select: {
        id: true,
        name: true,
        currentStatus: true,
        locationLat: true,
        locationLng: true,
        lastLocationUpdate: true,
        completedJobs: true,
        rating: true,
      },
    });
  }

  async updateTechnicianStatus(
    tenantId: string,
    technicianId: string,
    status: string,
  ) {
    const valid = ["AVAILABLE", "BUSY", "ON_BREAK", "OFFLINE", "ON_LEAVE"];
    if (!valid.includes(status))
      throw new BadRequestException(`Invalid status: ${status}`);
    const existing = await prisma.fieldServiceTechnician.findFirst({
      where: { tenantId, id: technicianId },
    });
    if (!existing) throw new NotFoundException("Technician not found");
    return prisma.fieldServiceTechnician.update({
      where: { id: technicianId },
      data: { currentStatus: status },
    });
  }
}
