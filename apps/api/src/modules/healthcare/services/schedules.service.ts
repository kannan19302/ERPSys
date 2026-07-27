import { Injectable } from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class HealthcareSchedulesService {
  async getDoctorSchedules(tenantId: string, practitionerId?: string) {
    return prisma.healthcareDoctorSchedule.findMany({
      where: { tenantId, practitionerId, isActive: true },
      include: { practitioner: true },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });
  }
  async createDoctorSchedule(tenantId: string, data: any) {
    const existing = await prisma.healthcareDoctorSchedule.findFirst({
      where: {
        tenantId,
        practitionerId: data.practitionerId,
        dayOfWeek: data.dayOfWeek,
      },
    });
    if (existing)
      await prisma.healthcareDoctorSchedule.updateMany({
        where: { tenantId, id: existing.id },
        data: { isActive: false },
      });
    return prisma.healthcareDoctorSchedule.create({
      data: { ...data, tenantId },
      include: { practitioner: true },
    });
  }
  async updateDoctorSchedule(tenantId: string, id: string, data: any) {
    await prisma.healthcareDoctorSchedule.updateMany({
      where: { tenantId, id },
      data,
    });
    return prisma.healthcareDoctorSchedule.findFirst({
      where: { tenantId, id },
    });
  }
  async getAvailableSlots(
    tenantId: string,
    practitionerId: string,
    date: string,
  ) {
    const dayOfWeek = new Date(date).getDay();
    const schedule = await prisma.healthcareDoctorSchedule.findFirst({
      where: {
        tenantId,
        practitionerId,
        dayOfWeek,
        isAvailable: true,
        isActive: true,
      },
    });
    if (!schedule) return [];
    const appointments = await prisma.healthcareAppointment.findMany({
      where: {
        tenantId,
        practitionerId,
        status: { not: "CANCELLED" },
        startTime: {
          gte: new Date(date + "T00:00:00"),
          lte: new Date(date + "T23:59:59"),
        },
      },
      select: { startTime: true, endTime: true },
    });
    const slots: { start: string; end: string; available: boolean }[] = [];
    const [startH, startM] = schedule.startTime.split(":").map(Number);
    const [endH, endM] = schedule.endTime.split(":").map(Number);
    const startMin = startH * 60 + startM;
    const endMin = endH * 60 + endM;
    for (
      let m = startMin;
      m + schedule.slotDurationMin <= endMin;
      m += schedule.slotDurationMin
    ) {
      const slotStart = `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
      const slotEndMin = m + schedule.slotDurationMin;
      const slotEnd = `${String(Math.floor(slotEndMin / 60)).padStart(2, "0")}:${String(slotEndMin % 60).padStart(2, "0")}`;
      const [sh, sm] = slotStart.split(":").map(Number);
      const [eh, em] = slotEnd.split(":").map(Number);
      const slotStartDate = new Date(date + "T" + slotStart + ":00");
      const slotEndDate = new Date(date + "T" + slotEnd + ":00");
      const isBooked = appointments.some(
        (a) => a.startTime < slotEndDate && a.endTime > slotStartDate,
      );
      slots.push({ start: slotStart, end: slotEnd, available: !isBooked });
    }
    return { schedule, slots };
  }
}
