import { Injectable } from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class EducationAttendanceService {
  async getSessions(tenantId: string, courseId?: string) {
    return prisma.educationAttendance.findMany({
      where: { tenantId, courseId, isActive: true },
      include: { course: true, records: { include: { student: true } } },
      orderBy: { date: "desc" },
    });
  }
  async createSession(tenantId: string, data: any) {
    return prisma.educationAttendance.create({
      data: { ...data, tenantId },
      include: { course: true },
    });
  }
  async getSessionById(tenantId: string, id: string) {
    return prisma.educationAttendance.findFirst({
      where: { tenantId, id },
      include: { course: true, records: { include: { student: true } } },
    });
  }
  async markAttendance(
    tenantId: string,
    attendanceId: string,
    records: { studentId: string; status: string }[],
  ) {
    for (const r of records) {
      const attendance = await prisma.educationAttendance.findFirst({
        where: { tenantId, id: attendanceId },
      });
      if (!attendance) throw new Error("Attendance session not found");
      const existing = await prisma.educationAttendanceRecord.findFirst({
        where: {
          tenantId,
          studentId: r.studentId,
          courseId: attendance.courseId,
          date: attendance.date,
        },
      });
      if (existing) {
        await prisma.educationAttendanceRecord.updateMany({
          where: { tenantId, id: existing.id },
          data: { status: r.status },
        });
      } else {
        await prisma.educationAttendanceRecord.create({
          data: {
            tenantId,
            studentId: r.studentId,
            courseId: attendance.courseId,
            date: attendance.date,
            attendanceId,
            status: r.status,
          },
        });
      }
    }
    return this.getSessionById(tenantId, attendanceId);
  }
  async getRecords(
    tenantId: string,
    filters?: {
      studentId?: string;
      courseId?: string;
      from?: string;
      to?: string;
    },
  ) {
    return prisma.educationAttendanceRecord.findMany({
      where: {
        tenantId,
        studentId: filters?.studentId,
        courseId: filters?.courseId,
        date: {
          gte: filters?.from ? new Date(filters.from) : undefined,
          lte: filters?.to ? new Date(filters.to) : undefined,
        },
      },
      include: { student: true, course: true },
      orderBy: { date: "desc" },
    });
  }
  async getStudentSummary(tenantId: string, studentId: string) {
    const records = await prisma.educationAttendanceRecord.findMany({
      where: { tenantId, studentId },
      include: { course: true },
    });
    const grouped: Record<
      string,
      { present: number; absent: number; late: number; total: number }
    > = {};
    for (const r of records) {
      if (!grouped[r.courseId])
        grouped[r.courseId] = { present: 0, absent: 0, late: 0, total: 0 };
      grouped[r.courseId].total++;
      if (r.status === "PRESENT") grouped[r.courseId].present++;
      else if (r.status === "ABSENT") grouped[r.courseId].absent++;
      else if (r.status === "LATE") grouped[r.courseId].late++;
    }
    return Object.entries(grouped).map(([courseId, stats]) => ({
      course: records.find((r) => r.courseId === courseId)?.course,
      ...stats,
      percentage:
        stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0,
    }));
  }
}
