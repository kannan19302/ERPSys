// @ts-nocheck
import { Injectable } from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class EducationExamsService {
  async findAll(tenantId: string, courseId?: string) {
    return prisma.educationExamSchedule.findMany({
      where: { tenantId, courseId, isActive: true },
      include: { course: true, results: { include: { student: true } } },
      orderBy: { examDate: "desc" },
    });
  }
  async findById(tenantId: string, id: string) {
    return prisma.educationExamSchedule.findFirst({
      where: { tenantId, id },
      include: { course: true, results: { include: { student: true } } },
    });
  }
  async create(tenantId: string, data: any) {
    return prisma.educationExamSchedule.create({
      data: { ...data, tenantId },
      include: { course: true },
    });
  }
  async update(tenantId: string, id: string, data: any) {
    await prisma.educationExamSchedule.updateMany({
      where: { tenantId, id },
      data,
    });
    return this.findById(tenantId, id);
  }
  async delete(tenantId: string, id: string) {
    return prisma.educationExamSchedule.updateMany({
      where: { tenantId, id },
      data: { isActive: false },
    });
  }
  async addResult(tenantId: string, examId: string, data: any) {
    const existing = await prisma.educationExamResult.findFirst({
      where: { tenantId, examId, studentId: data.studentId },
    });
    if (existing) {
      await prisma.educationExamResult.updateMany({
        where: { tenantId, id: existing.id },
        data: {
          score: data.score,
          grade: data.grade,
          comments: data.comments,
          isPassed: data.score >= (data.passingScore || 40),
        },
      });
      return prisma.educationExamResult.findFirst({
        where: { tenantId, id: existing.id },
        include: { student: true, exam: true },
      });
    }
    return prisma.educationExamResult.create({
      data: {
        ...data,
        tenantId,
        examId,
        isPassed: data.score >= (data.passingScore || 40),
      },
      include: { student: true, exam: true },
    });
  }
  async getResults(tenantId: string, examId: string) {
    return prisma.educationExamResult.findMany({
      where: { tenantId, examId },
      include: { student: true },
      orderBy: { score: "desc" },
    });
  }
  async bulkAddResults(
    tenantId: string,
    examId: string,
    results: {
      studentId: string;
      score: number;
      grade?: string;
      comments?: string;
    }[],
  ) {
    for (const r of results) await this.addResult(tenantId, examId, r);
    return this.getResults(tenantId, examId);
  }
}
