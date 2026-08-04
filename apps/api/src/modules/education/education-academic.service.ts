import { Injectable, NotFoundException, Optional } from "@nestjs/common";
import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";

@Injectable()
export class EducationAcademicService {
  private readonly prisma: typeof prisma;

  /**
   * Injectable so this service can be unit-tested. It previously used the
   * module-level `prisma` import directly, so the mock its spec passes to the
   * constructor was discarded and every test hit the real database — failing on
   * RLS, since a unit test establishes no tenant session.
   *
   * `@Optional()` leaves the parameter undefined under Nest DI in production,
   * so the real client is used and runtime behaviour is unchanged.
   */
  constructor(@Optional() client?: typeof prisma) {
    this.prisma = client ?? prisma;
  }
  // ── REPORT CARDS ──
  async getReportCards(
    tenantId: string,
    query: { studentId?: string; term?: string },
  ) {
    const where: any = { tenantId };
    if (query.studentId) where.studentId = query.studentId;
    if (query.term) where.term = query.term;

    return this.prisma.educationReportCard.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
  }

  async createReportCard(tenantId: string, data: any) {
    return this.prisma.educationReportCard.create({
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
  async getScholarships(
    tenantId: string,
    query: { studentId?: string; status?: string },
  ) {
    const where: any = { tenantId };
    if (query.studentId) where.studentId = query.studentId;
    if (query.status) where.status = query.status;

    return this.prisma.educationScholarship.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
  }

  async createScholarship(tenantId: string, data: any) {
    return this.prisma.educationScholarship.create({
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
  async getSubmissions(
    tenantId: string,
    query: { assignmentId?: string; studentId?: string },
  ) {
    const where: any = { tenantId };
    if (query.assignmentId) where.assignmentId = query.assignmentId;
    if (query.studentId) where.studentId = query.studentId;

    return this.prisma.educationAssignmentSubmission.findMany({
      where,
      orderBy: { submittedAt: "desc" },
    });
  }

  async submitAssignment(tenantId: string, data: any) {
    return this.prisma.educationAssignmentSubmission.create({
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
