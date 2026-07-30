// @ts-nocheck
import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class EducationAcademicService {

  // ── REPORT CARDS ──
  async getReportCards(tenantId: string, query: { studentId?: string; term?: string }) {
    const where: any = { tenantId };
    if (query.studentId) where.studentId = query.studentId;
    if (query.term) where.term = query.term;

    return prisma.educationReportCard.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
  }

  async createReportCard(tenantId: string, data: any) {
    return prisma.educationReportCard.create({
      data: {
        tenantId,
        studentId: data.studentId,
        academicYear: data.academicYear || "2025-2026",
        term: data.term,
        gpa: data.gpa,
        comments: data.comments,
        gradesSummary: data.gradesSummary || [],
        status: "DRAFT",
      },
    });
  }

  // ── SCHOLARSHIPS ──
  async getScholarships(tenantId: string, query: { studentId?: string; status?: string }) {
    const where: any = { tenantId };
    if (query.studentId) where.studentId = query.studentId;
    if (query.status) where.status = query.status;

    return prisma.educationScholarship.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
  }

  async createScholarship(tenantId: string, data: any) {
    return prisma.educationScholarship.create({
      data: {
        tenantId,
        studentId: data.studentId,
        name: data.name,
        provider: data.provider,
        amount: data.amount,
        academicYear: data.academicYear || "2025-2026",
        status: "ACTIVE",
      },
    });
  }

  // ── ASSIGNMENT SUBMISSIONS ──
  async getSubmissions(tenantId: string, query: { assignmentId?: string; studentId?: string }) {
    const where: any = { tenantId };
    if (query.assignmentId) where.assignmentId = query.assignmentId;
    if (query.studentId) where.studentId = query.studentId;

    return prisma.educationAssignmentSubmission.findMany({
      where,
      orderBy: { submittedAt: "desc" },
    });
  }

  async submitAssignment(tenantId: string, data: any) {
    return prisma.educationAssignmentSubmission.create({
      data: {
        tenantId,
        assignmentId: data.assignmentId,
        studentId: data.studentId,
        submissionUrl: data.submissionUrl,
        content: data.content,
        status: "SUBMITTED",
      },
    });
  }
}
