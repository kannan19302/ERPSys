import { Injectable } from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class EducationService {
  // ── Students ──
  async getStudents(tenantId: string) {
    return prisma.educationStudent.findMany({ where: { tenantId }, orderBy: { createdAt: "desc" } });
  }
  async getStudentById(tenantId: string, id: string) {
    return prisma.educationStudent.findFirst({ where: { tenantId, id } });
  }
  async createStudent(tenantId: string, data: any) {
    return prisma.educationStudent.create({ data: { ...data, tenantId } });
  }
  async updateStudent(tenantId: string, id: string, data: any) {
    return prisma.educationStudent.updateMany({ where: { tenantId, id }, data });
  }

  // ── Courses ──
  async getCourses(tenantId: string) {
    return prisma.educationCourse.findMany({ where: { tenantId }, orderBy: { createdAt: "desc" } });
  }
  async getCourseById(tenantId: string, id: string) {
    return prisma.educationCourse.findFirst({ where: { tenantId, id } });
  }
  async createCourse(tenantId: string, data: any) {
    return prisma.educationCourse.create({ data: { ...data, tenantId } });
  }

  // ── Fee Structures ──
  async getFeeStructures(tenantId: string) {
    return prisma.educationFeeStructure.findMany({ where: { tenantId }, orderBy: { createdAt: "desc" } });
  }
  async createFeeStructure(tenantId: string, data: any) {
    return prisma.educationFeeStructure.create({ data: { ...data, tenantId } });
  }

  // ── Student Fees ──
  async getStudentFees(tenantId: string) {
    return prisma.studentFee.findMany({
      where: { tenantId },
      include: { student: true, feeStructure: true },
      orderBy: { createdAt: "desc" },
    });
  }

  // ── Books ──
  async getBooks(tenantId: string) {
    return prisma.educationBook.findMany({ where: { tenantId }, orderBy: { createdAt: "desc" } });
  }
  async createBook(tenantId: string, data: any) {
    return prisma.educationBook.create({ data: { ...data, tenantId } });
  }
  async checkoutBook(tenantId: string, data: any) {
    return prisma.bookTransaction.create({ data: { ...data, tenantId } });
  }

  // ── Book Transactions ──
  async getBookTransactions(tenantId: string) {
    return prisma.bookTransaction.findMany({
      where: { tenantId },
      include: { student: true, book: true },
      orderBy: { createdAt: "desc" },
    });
  }

  // ── Timetables ──
  async getTimetables(tenantId: string) {
    return prisma.educationTimetable.findMany({
      where: { tenantId },
      include: { course: true },
      orderBy: { weekday: "asc" },
    });
  }
  async createTimetable(tenantId: string, data: any) {
    return prisma.educationTimetable.create({ data: { ...data, tenantId } });
  }

  // ── Attendance ──
  async getAttendance(tenantId: string, filters?: { studentId?: string; courseId?: string; date?: string }) {
    return prisma.educationAttendanceRecord.findMany({
      where: { tenantId, ...filters },
      include: { student: true, course: true },
      orderBy: { date: "desc" },
    });
  }

  // ── Grades ──
  async getGrades(tenantId: string, filters?: { studentId?: string; courseId?: string }) {
    return prisma.grade.findMany({
      where: { tenantId, ...filters },
      include: { student: true, course: true },
      orderBy: { createdAt: "desc" },
    });
  }
}
