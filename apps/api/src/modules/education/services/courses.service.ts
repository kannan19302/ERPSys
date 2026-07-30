// @ts-nocheck
import { Injectable } from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class EducationCoursesService {
  async findAll(tenantId: string) {
    return prisma.educationCourse.findMany({
      where: { tenantId },
      include: { modules: { orderBy: { sortOrder: "asc" } }, gradebooks: true },
      orderBy: { createdAt: "desc" },
    });
  }
  async findById(tenantId: string, id: string) {
    return prisma.educationCourse.findFirst({
      where: { tenantId, id },
      include: {
        modules: { orderBy: { sortOrder: "asc" } },
        gradebooks: { include: { entries: { include: { student: true } } } },
        enrollments: {
          include: { student: true },
          where: { status: "ACTIVE" },
        },
        attendances: {
          include: { records: { include: { student: true } } },
          orderBy: { date: "desc" },
          take: 20,
        },
        examSchedules: {
          include: { results: { include: { student: true } } },
          orderBy: { examDate: "desc" },
        },
        timetables: true,
      },
    });
  }
  async create(tenantId: string, data: any) {
    return prisma.educationCourse.create({
      data: { ...data, tenantId },
      include: { modules: true },
    });
  }
  async update(tenantId: string, id: string, data: any) {
    await prisma.educationCourse.updateMany({ where: { tenantId, id }, data });
    return this.findById(tenantId, id);
  }
  async delete(tenantId: string, id: string) {
    return prisma.educationCourse.updateMany({
      where: { tenantId, id },
      data: { isActive: false },
    });
  }
  async addModule(tenantId: string, courseId: string, data: any) {
    return prisma.educationCourseModule.create({
      data: { ...data, tenantId, courseId },
    });
  }
  async updateModule(tenantId: string, id: string, data: any) {
    await prisma.educationCourseModule.updateMany({
      where: { tenantId, id },
      data,
    });
    return prisma.educationCourseModule.findFirst({ where: { tenantId, id } });
  }
  async removeModule(tenantId: string, id: string) {
    return prisma.educationCourseModule.updateMany({
      where: { tenantId, id },
      data: { isActive: false },
    });
  }
  async getEnrollments(tenantId: string, courseId: string) {
    return prisma.educationEnrollment.findMany({
      where: { tenantId, courseId },
      include: { student: true },
      orderBy: { enrollmentDate: "desc" },
    });
  }
  async createEnrollment(tenantId: string, data: any) {
    return prisma.educationEnrollment.create({
      data: { ...data, tenantId },
      include: { student: true, course: true },
    });
  }
  async updateEnrollmentStatus(tenantId: string, id: string, status: string) {
    await prisma.educationEnrollment.updateMany({
      where: { tenantId, id },
      data: { status },
    });
    return prisma.educationEnrollment.findFirst({
      where: { tenantId, id },
      include: { student: true, course: true },
    });
  }
}
