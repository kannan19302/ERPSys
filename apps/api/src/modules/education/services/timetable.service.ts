import { Injectable } from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class EducationTimetableService {
  async findAll(tenantId: string) {
    return prisma.educationTimetable.findMany({
      where: { tenantId, isActive: true },
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
        isActive: true,
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
    return prisma.educationTimetable.updateMany({
      where: { tenantId, id },
      data: { isActive: false },
    });
  }
  async getByDay(tenantId: string, weekday: string) {
    return prisma.educationTimetable.findMany({
      where: { tenantId, weekday, isActive: true },
      include: { course: true },
      orderBy: { startTime: "asc" },
    });
  }
  async getByCourse(tenantId: string, courseId: string) {
    return prisma.educationTimetable.findMany({
      where: { tenantId, courseId, isActive: true },
      include: { course: true },
      orderBy: { weekday: "asc" },
    });
  }
}
