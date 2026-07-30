// @ts-nocheck
import { Injectable } from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class HealthcareAppointmentsService {
  async findAll(
    tenantId: string,
    filters?: {
      patientId?: string;
      practitionerId?: string;
      status?: string;
      from?: string;
      to?: string;
    },
  ) {
    return prisma.healthcareAppointment.findMany({
      where: {
        tenantId,
        patientId: filters?.patientId,
        practitionerId: filters?.practitionerId,
        status: filters?.status,
        startTime: {
          gte: filters?.from ? new Date(filters.from) : undefined,
          lte: filters?.to ? new Date(filters.to) : undefined,
        },
      },
      include: { patient: true, practitioner: true },
      orderBy: { startTime: "desc" },
    });
  }
  async findById(tenantId: string, id: string) {
    return prisma.healthcareAppointment.findFirst({
      where: { tenantId, id },
      include: { patient: true, practitioner: true },
    });
  }
  async create(tenantId: string, data: any) {
    const conflict = await prisma.healthcareAppointment.findFirst({
      where: {
        tenantId,
        practitionerId: data.practitionerId,
        status: { not: "CANCELLED" },
        startTime: { lt: new Date(data.endTime) },
        endTime: { gt: new Date(data.startTime) },
      },
    });
    if (conflict)
      throw new Error(
        "Practitioner has a conflicting appointment at this time",
      );
    return prisma.healthcareAppointment.create({
      data: { ...data, tenantId },
      include: { patient: true, practitioner: true },
    });
  }
  async update(tenantId: string, id: string, data: any) {
    await prisma.healthcareAppointment.updateMany({
      where: { tenantId, id },
      data,
    });
    return this.findById(tenantId, id);
  }
  async cancel(tenantId: string, id: string, reason?: string) {
    return prisma.healthcareAppointment.updateMany({
      where: { tenantId, id },
      data: { status: "CANCELLED", notes: reason },
    });
  }
  async complete(tenantId: string, id: string) {
    return prisma.healthcareAppointment.updateMany({
      where: { tenantId, id },
      data: { status: "COMPLETED" },
    });
  }
  async getUpcoming(tenantId: string, days: number = 7) {
    const end = new Date();
    end.setDate(end.getDate() + days);
    return prisma.healthcareAppointment.findMany({
      where: {
        tenantId,
        startTime: { gte: new Date(), lte: end },
        status: "SCHEDULED",
      },
      include: { patient: true, practitioner: true },
      orderBy: { startTime: "asc" },
    });
  }
  async getSchedule(tenantId: string, practitionerId: string, date: string) {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);
    return prisma.healthcareAppointment.findMany({
      where: {
        tenantId,
        practitionerId,
        startTime: { gte: dayStart, lte: dayEnd },
      },
      include: { patient: true },
      orderBy: { startTime: "asc" },
    });
  }
  async createScheduleTemplate(tenantId: string, data: any) {
    return prisma.healthcareAppointmentSchedule.create({
      data: { ...data, tenantId },
      include: { patient: true, practitioner: true },
    });
  }
  async getScheduleTemplates(tenantId: string) {
    return prisma.healthcareAppointmentSchedule.findMany({
      where: { tenantId, isActive: true },
      include: { patient: true, practitioner: true },
    });
  }
}
