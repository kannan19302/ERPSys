// @ts-nocheck
import { Injectable } from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class EducationTimetableService {
  async findAll(tenantId: string) {
    return prisma.educationTimetable.findMany({
      where: { tenantId },
      include: { course: true },
      orderBy: [{ weekday: "asc" }, { startTime: "asc" }],
    });
  }
  async findById(tenantId: string, id: string) {
    return prisma.educationTimetable.findFirst({
      where: { tenantId, id },
      include: { course: true },
    });
  }
  async create(tenantId: string, data: any) {
    const conflict = await prisma.educationTimetable.findFirst({
      where: {
        tenantId,
        weekday: data.weekday,
        room: data.room,
        startTime: { lt: data.endTime },
        endTime: { gt: data.startTime },
      },
    });
    if (conflict) throw new Error("Room is already booked for this time slot");
    return prisma.educationTimetable.create({
      data: { ...data, tenantId },
      include: { course: true },
    });
  }
  async update(tenantId: string, id: string, data: any) {
    await prisma.educationTimetable.updateMany({
      where: { tenantId, id },
      data,
    });
    return this.findById(tenantId, id);
  }
  async delete(tenantId: string, id: string) {
    // No soft-delete flag exists on this model — remove the slot outright.
    return prisma.educationTimetable.deleteMany({
      where: { tenantId, id },
    });
  }
  async getByDay(tenantId: string, weekday: string) {
    return prisma.educationTimetable.findMany({
      where: { tenantId, weekday },
      include: { course: true },
      orderBy: { startTime: "asc" },
    });
  }
  async getByCourse(tenantId: string, courseId: string) {
    return prisma.educationTimetable.findMany({
      where: { tenantId, courseId },
      include: { course: true },
      orderBy: { weekday: "asc" },
    });
  }
}
