// @ts-nocheck
import { Injectable } from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class EducationGradesService {
  async getGradebooks(tenantId: string, courseId?: string) {
    return prisma.educationGradebook.findMany({
      where: { tenantId, courseId, isActive: true },
      include: { entries: { include: { student: true } }, course: true },
      orderBy: { createdAt: "desc" },
    });
  }
  async createGradebook(tenantId: string, data: any) {
    return prisma.educationGradebook.create({
      data: { ...data, tenantId },
      include: { course: true },
    });
  }
  async updateGradebook(tenantId: string, id: string, data: any) {
    await prisma.educationGradebook.updateMany({
      where: { tenantId, id },
      data,
    });
    return prisma.educationGradebook.findFirst({
      where: { tenantId, id },
      include: { entries: { include: { student: true } } },
    });
  }
  async deleteGradebook(tenantId: string, id: string) {
    return prisma.educationGradebook.updateMany({
      where: { tenantId, id },
      data: { isActive: false },
    });
  }
  async getGradeEntries(tenantId: string, gradebookId: string) {
    return prisma.educationGradeEntry.findMany({
      where: { tenantId, gradebookId },
      include: { student: true },
      orderBy: { createdAt: "desc" },
    });
  }
  async upsertGradeEntry(tenantId: string, gradebookId: string, data: any) {
    const existing = await prisma.educationGradeEntry.findFirst({
      where: { tenantId, gradebookId, studentId: data.studentId },
    });
    if (existing) {
      await prisma.educationGradeEntry.updateMany({
        where: { tenantId, id: existing.id },
        data: { score: data.score, comment: data.comment },
      });
      return prisma.educationGradeEntry.findFirst({
        where: { tenantId, id: existing.id },
        include: { student: true },
      });
    }
    return prisma.educationGradeEntry.create({
      data: { ...data, tenantId, gradebookId },
      include: { student: true },
    });
  }
  async bulkUpsertGrades(
    tenantId: string,
    gradebookId: string,
    entries: { studentId: string; score: number; comment?: string }[],
  ) {
    for (const entry of entries)
      await this.upsertGradeEntry(tenantId, gradebookId, entry);
    return this.getGradeEntries(tenantId, gradebookId);
  }
  async getLegacyGrades(
    tenantId: string,
    filters?: { studentId?: string; courseId?: string },
  ) {
    return prisma.grade.findMany({
      where: { tenantId, ...filters },
      include: { student: true, course: true },
      orderBy: { createdAt: "desc" },
    });
  }
  async createLegacyGrade(tenantId: string, data: any) {
    return prisma.grade.create({
      data: { ...data, tenantId },
      include: { student: true, course: true },
    });
  }
  async getStudentGradeSummary(tenantId: string, studentId: string) {
    const gradebooks = await prisma.educationGradebook.findMany({
      where: { tenantId, isActive: true },
      include: { entries: { where: { studentId } }, course: true },
    });
    return gradebooks
      .filter((gb) => gb.entries.length > 0)
      .map((gb) => ({
        course: gb.course.name,
        gradebook: gb.name,
        score: gb.entries[0]?.score,
        maxScore: gb.maxScore,
        weight: gb.weight,
      }));
  }
}
