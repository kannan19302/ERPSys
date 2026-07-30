// @ts-nocheck
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class HrTalentService {
  // ══════════════════════════════════════════════════════════════
  // LEARNING COURSES
  // ══════════════════════════════════════════════════════════════

  async getLearningCourses(
    tenantId: string,
    params: {
      page?: number;
      limit?: number;
      category?: string;
      status?: string;
      search?: string;
    } = {},
  ) {
    const where: any = { tenantId };
    if (params.category) where.category = params.category;
    if (params.status) where.status = params.status;
    if (params.search)
      where.OR = [
        { title: { contains: params.search, mode: "insensitive" } },
        { code: { contains: params.search, mode: "insensitive" } },
      ];
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      (prisma as any).learningCourse.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { modules: true, enrollments: true } } },
      }),
      (prisma as any).learningCourse.count({ where }),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getLearningCourseById(tenantId: string, id: string) {
    const item = await (prisma as any).learningCourse.findFirst({
      where: { id, tenantId },
      include: {
        modules: { orderBy: { orderIndex: "asc" } },
        enrollments: { include: { course: { select: { title: true } } } },
      },
    });
    if (!item) throw new NotFoundException("Learning course not found");
    return item;
  }

  async createLearningCourse(tenantId: string, dto: any) {
    return (prisma as any).learningCourse.create({
      data: {
        tenantId,
        title: dto.title,
        code: dto.code,
        description: dto.description || null,
        category: dto.category || null,
        durationHours: dto.durationHours || null,
        provider: dto.provider || null,
        deliveryMode: dto.deliveryMode || "ONLINE",
        difficulty: dto.difficulty || "BEGINNER",
        cost: dto.cost || null,
        maxAttendees: dto.maxAttendees || null,
        isMandatory: dto.isMandatory || false,
        isActive: dto.isActive !== false,
        status: dto.status || "PUBLISHED",
      },
    });
  }

  async updateLearningCourse(tenantId: string, id: string, dto: any) {
    const item = await (prisma as any).learningCourse.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("Learning course not found");
    return (prisma as any).learningCourse.update({
      where: { id },
      data: {
        title: dto.title,
        code: dto.code,
        description: dto.description,
        category: dto.category,
        durationHours: dto.durationHours,
        provider: dto.provider,
        deliveryMode: dto.deliveryMode,
        difficulty: dto.difficulty,
        cost: dto.cost,
        maxAttendees: dto.maxAttendees,
        isMandatory: dto.isMandatory,
        isActive: dto.isActive,
        status: dto.status,
      },
    });
  }

  async deleteLearningCourse(tenantId: string, id: string) {
    const item = await (prisma as any).learningCourse.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("Learning course not found");
    await (prisma as any).learningCourse.delete({ where: { id } });
    return { success: true };
  }

  // ══════════════════════════════════════════════════════════════
  // LEARNING MODULES
  // ══════════════════════════════════════════════════════════════

  async getLearningModules(tenantId: string, courseId?: string) {
    const where: any = { tenantId };
    if (courseId) where.courseId = courseId;
    return (prisma as any).learningModule.findMany({
      where,
      orderBy: { orderIndex: "asc" },
    });
  }

  async createLearningModule(tenantId: string, dto: any) {
    const course = await (prisma as any).learningCourse.findFirst({
      where: { id: dto.courseId, tenantId },
    });
    if (!course) throw new NotFoundException("Course not found");
    return (prisma as any).learningModule.create({
      data: {
        tenantId,
        courseId: dto.courseId,
        title: dto.title,
        description: dto.description || null,
        orderIndex: dto.orderIndex || 0,
        contentType: dto.contentType || "VIDEO",
        contentUrl: dto.contentUrl || null,
        durationMin: dto.durationMin || null,
        isRequired: dto.isRequired !== false,
      },
    });
  }

  async updateLearningModule(tenantId: string, id: string, dto: any) {
    const item = await (prisma as any).learningModule.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("Learning module not found");
    return (prisma as any).learningModule.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        orderIndex: dto.orderIndex,
        contentType: dto.contentType,
        contentUrl: dto.contentUrl,
        durationMin: dto.durationMin,
        isRequired: dto.isRequired,
      },
    });
  }

  async deleteLearningModule(tenantId: string, id: string) {
    const item = await (prisma as any).learningModule.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("Learning module not found");
    await (prisma as any).learningModule.delete({ where: { id } });
    return { success: true };
  }

  // ══════════════════════════════════════════════════════════════
  // LEARNING ENROLLMENTS
  // ══════════════════════════════════════════════════════════════

  async getEnrollments(
    tenantId: string,
    employeeId?: string,
    courseId?: string,
  ) {
    const where: any = { tenantId };
    if (employeeId) where.employeeId = employeeId;
    if (courseId) where.courseId = courseId;
    return (prisma as any).learningEnrollment.findMany({
      where,
      orderBy: { enrolledAt: "desc" },
      include: {
        course: { select: { id: true, title: true, code: true, status: true } },
      },
    });
  }

  async getEnrollmentById(tenantId: string, id: string) {
    const item = await (prisma as any).learningEnrollment.findFirst({
      where: { id, tenantId },
      include: { course: true },
    });
    if (!item) throw new NotFoundException("Enrollment not found");
    return item;
  }

  async enrollInCourse(tenantId: string, dto: any) {
    const existing = await (prisma as any).learningEnrollment.findFirst({
      where: { tenantId, courseId: dto.courseId, employeeId: dto.employeeId },
    });
    if (existing)
      throw new BadRequestException(
        "Employee is already enrolled in this course",
      );
    const course = await (prisma as any).learningCourse.findFirst({
      where: { id: dto.courseId, tenantId },
    });
    if (!course) throw new NotFoundException("Course not found");
    return (prisma as any).learningEnrollment.create({
      data: {
        tenantId,
        courseId: dto.courseId,
        employeeId: dto.employeeId,
        status: "ENROLLED",
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      },
    });
  }

  async updateEnrollment(tenantId: string, id: string, dto: any) {
    const item = await (prisma as any).learningEnrollment.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("Enrollment not found");
    return (prisma as any).learningEnrollment.update({
      where: { id },
      data: {
        progressPct: dto.progressPct,
        score: dto.score,
        status: dto.status,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      },
    });
  }

  async completeEnrollment(tenantId: string, id: string, score?: number) {
    const item = await (prisma as any).learningEnrollment.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("Enrollment not found");
    if (item.status === "COMPLETED")
      throw new BadRequestException("Course already completed");
    return (prisma as any).learningEnrollment.update({
      where: { id },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        progressPct: 100,
        score: score || null,
      },
    });
  }

  async unenroll(tenantId: string, id: string) {
    const item = await (prisma as any).learningEnrollment.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("Enrollment not found");
    return (prisma as any).learningEnrollment.update({
      where: { id },
      data: { status: "WITHDRAWN" },
    });
  }

  // ══════════════════════════════════════════════════════════════
  // CERTIFICATIONS
  // ══════════════════════════════════════════════════════════════

  async getCertifications(tenantId: string, employeeId?: string) {
    const where: any = { tenantId };
    if (employeeId) where.employeeId = employeeId;
    return (prisma as any).certification.findMany({
      where,
      orderBy: { issueDate: "desc" },
    });
  }

  async getCertificationById(tenantId: string, id: string) {
    const item = await (prisma as any).certification.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("Certification not found");
    return item;
  }

  async createCertification(tenantId: string, dto: any) {
    return (prisma as any).certification.create({
      data: {
        tenantId,
        employeeId: dto.employeeId,
        name: dto.name,
        issuingBody: dto.issuingBody,
        credentialId: dto.credentialId || null,
        issueDate: new Date(dto.issueDate),
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
        neverExpires: dto.neverExpires || false,
        documentUrl: dto.documentUrl || null,
      },
    });
  }

  async updateCertification(tenantId: string, id: string, dto: any) {
    const item = await (prisma as any).certification.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("Certification not found");
    return (prisma as any).certification.update({
      where: { id },
      data: {
        name: dto.name,
        issuingBody: dto.issuingBody,
        credentialId: dto.credentialId,
        issueDate: dto.issueDate ? new Date(dto.issueDate) : undefined,
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
        neverExpires: dto.neverExpires,
        documentUrl: dto.documentUrl,
      },
    });
  }

  async verifyCertification(tenantId: string, id: string, verifiedBy: string) {
    const item = await (prisma as any).certification.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("Certification not found");
    if (item.isVerified)
      throw new BadRequestException("Certification is already verified");
    return (prisma as any).certification.update({
      where: { id },
      data: { isVerified: true, verifiedBy, verifiedAt: new Date() },
    });
  }

  async deleteCertification(tenantId: string, id: string) {
    const item = await (prisma as any).certification.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("Certification not found");
    await (prisma as any).certification.delete({ where: { id } });
    return { success: true };
  }

  // ══════════════════════════════════════════════════════════════
  // SKILL MATRIX (Catalog)
  // ══════════════════════════════════════════════════════════════

  async getSkills(tenantId: string, category?: string) {
    const where: any = { tenantId };
    if (category) where.category = category;
    return (prisma as any).skillMatrix.findMany({
      where,
      orderBy: { name: "asc" },
    });
  }

  async getSkillById(tenantId: string, id: string) {
    const item = await (prisma as any).skillMatrix.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("Skill not found");
    return item;
  }

  async createSkill(tenantId: string, dto: any) {
    return (prisma as any).skillMatrix.create({
      data: {
        tenantId,
        name: dto.name,
        category: dto.category || null,
        description: dto.description || null,
        isActive: dto.isActive !== false,
      },
    });
  }

  async updateSkill(tenantId: string, id: string, dto: any) {
    const item = await (prisma as any).skillMatrix.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("Skill not found");
    return (prisma as any).skillMatrix.update({
      where: { id },
      data: {
        name: dto.name,
        category: dto.category,
        description: dto.description,
        isActive: dto.isActive,
      },
    });
  }

  async deleteSkill(tenantId: string, id: string) {
    const item = await (prisma as any).skillMatrix.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("Skill not found");
    await (prisma as any).skillMatrix.delete({ where: { id } });
    return { success: true };
  }

  // ══════════════════════════════════════════════════════════════
  // SKILL GAP ANALYSIS
  // ══════════════════════════════════════════════════════════════

  async getGapAnalyses(tenantId: string, employeeId?: string) {
    const where: any = { tenantId };
    if (employeeId) where.employeeId = employeeId;
    return (prisma as any).skillGapAnalysis.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { skill: { select: { id: true, name: true, category: true } } },
    });
  }

  async createGapAnalysis(tenantId: string, dto: any) {
    const existing = await (prisma as any).skillGapAnalysis.findFirst({
      where: { tenantId, employeeId: dto.employeeId, skillId: dto.skillId },
    });
    if (existing)
      throw new BadRequestException(
        "Gap analysis already exists for this employee and skill",
      );
    return (prisma as any).skillGapAnalysis.create({
      data: {
        tenantId,
        employeeId: dto.employeeId,
        skillId: dto.skillId,
        currentLevel: dto.currentLevel,
        requiredLevel: dto.requiredLevel,
        gapScore: dto.gapScore || 0,
        priority: dto.priority || "MEDIUM",
        notes: dto.notes || null,
      },
    });
  }

  async updateGapAnalysis(tenantId: string, id: string, dto: any) {
    const item = await (prisma as any).skillGapAnalysis.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("Gap analysis not found");
    return (prisma as any).skillGapAnalysis.update({
      where: { id },
      data: {
        currentLevel: dto.currentLevel,
        requiredLevel: dto.requiredLevel,
        gapScore: dto.gapScore,
        priority: dto.priority,
        notes: dto.notes,
        closedAt: dto.closedAt ? new Date(dto.closedAt) : undefined,
      },
    });
  }

  async getGapAnalytics(tenantId: string) {
    const analyses = await (prisma as any).skillGapAnalysis.findMany({
      where: { tenantId },
      include: { skill: { select: { id: true, name: true, category: true } } },
    });
    const gapScores = analyses.filter((a: any) => a.gapScore > 0);
    const byPriority = { HIGH: 0, MEDIUM: 0, LOW: 0 };
    for (const a of analyses) {
      if (a.priority in byPriority)
        byPriority[a.priority as keyof typeof byPriority]++;
    }
    const bySkillCategory: Record<
      string,
      { total: number; open: number; avgGap: number }
    > = {};
    for (const a of analyses) {
      const cat = a.skill.category || "UNCATEGORIZED";
      if (!bySkillCategory[cat])
        bySkillCategory[cat] = { total: 0, open: 0, avgGap: 0 };
      bySkillCategory[cat].total++;
      if (a.closedAt === null) bySkillCategory[cat].open++;
    }
    for (const cat of Object.keys(bySkillCategory)) {
      const catAnalyses = analyses.filter(
        (a: any) => ((a.skill && a.skill.category) || "UNCATEGORIZED") === cat,
      );
      if (bySkillCategory[cat]) {
        bySkillCategory[cat].avgGap =
          catAnalyses.length > 0
            ? Math.round(
                (catAnalyses.reduce(
                  (s: number, a: any) => s + (a.gapScore || 0),
                  0,
                ) /
                  catAnalyses.length) *
                  100,
              ) / 100
            : 0;
      }
    }
    return {
      totalAnalyses: analyses.length,
      openGaps: gapScores.filter((a: any) => !a.closedAt).length,
      closedGaps: gapScores.filter((a: any) => a.closedAt).length,
      byPriority,
      bySkillCategory,
    };
  }

  // ══════════════════════════════════════════════════════════════
  // CAREER PATHS
  // ══════════════════════════════════════════════════════════════

  async getCareerPaths(tenantId: string) {
    return (prisma as any).careerPath.findMany({
      where: { tenantId },
      orderBy: { name: "asc" },
      include: {
        requirements: {
          include: {
            skill: { select: { id: true, name: true, category: true } },
          },
        },
      },
    });
  }

  async getCareerPathById(tenantId: string, id: string) {
    const item = await (prisma as any).careerPath.findFirst({
      where: { id, tenantId },
      include: { requirements: { include: { skill: true } } },
    });
    if (!item) throw new NotFoundException("Career path not found");
    return item;
  }

  async createCareerPath(tenantId: string, dto: any) {
    return (prisma as any).careerPath.create({
      data: {
        tenantId,
        name: dto.name,
        description: dto.description || null,
        fromPosition: dto.fromPosition,
        toPosition: dto.toPosition,
        typicalDurationMonths: dto.typicalDurationMonths || null,
        isActive: dto.isActive !== false,
      },
    });
  }

  async updateCareerPath(tenantId: string, id: string, dto: any) {
    const item = await (prisma as any).careerPath.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("Career path not found");
    return (prisma as any).careerPath.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        fromPosition: dto.fromPosition,
        toPosition: dto.toPosition,
        typicalDurationMonths: dto.typicalDurationMonths,
        isActive: dto.isActive,
      },
    });
  }

  async addRequirement(tenantId: string, careerPathId: string, dto: any) {
    const path = await (prisma as any).careerPath.findFirst({
      where: { id: careerPathId, tenantId },
    });
    if (!path) throw new NotFoundException("Career path not found");
    const existing = await (prisma as any).careerPathRequirement.findFirst({
      where: { tenantId, careerPathId, skillId: dto.skillId },
    });
    if (existing)
      throw new BadRequestException(
        "Requirement for this skill already exists",
      );
    return (prisma as any).careerPathRequirement.create({
      data: {
        tenantId,
        careerPathId,
        skillId: dto.skillId,
        minimumLevel: dto.minimumLevel,
        isRequired: dto.isRequired !== false,
      },
    });
  }

  async removeRequirement(tenantId: string, id: string) {
    const item = await (prisma as any).careerPathRequirement.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("Career path requirement not found");
    await (prisma as any).careerPathRequirement.delete({ where: { id } });
    return { success: true };
  }

  // ══════════════════════════════════════════════════════════════
  // MENTORING PROGRAMS
  // ══════════════════════════════════════════════════════════════

  async getPrograms(tenantId: string) {
    return (prisma as any).mentoringProgram.findMany({
      where: { tenantId },
      orderBy: { startDate: "desc" },
      include: { _count: { select: { sessions: true } } },
    });
  }

  async getProgramById(tenantId: string, id: string) {
    const item = await (prisma as any).mentoringProgram.findFirst({
      where: { id, tenantId },
      include: { sessions: { orderBy: { startDate: "desc" } } },
    });
    if (!item) throw new NotFoundException("Mentoring program not found");
    return item;
  }

  async createProgram(tenantId: string, dto: any) {
    return (prisma as any).mentoringProgram.create({
      data: {
        tenantId,
        name: dto.name,
        description: dto.description || null,
        objectives: dto.objectives || null,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        maxPairs: dto.maxPairs || null,
        status: dto.status || "ACTIVE",
      },
    });
  }

  async updateProgram(tenantId: string, id: string, dto: any) {
    const item = await (prisma as any).mentoringProgram.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("Mentoring program not found");
    return (prisma as any).mentoringProgram.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        objectives: dto.objectives,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        maxPairs: dto.maxPairs,
        status: dto.status,
      },
    });
  }

  // ══════════════════════════════════════════════════════════════
  // MENTORING SESSIONS
  // ══════════════════════════════════════════════════════════════

  async getSessions(
    tenantId: string,
    programId?: string,
    mentorId?: string,
    menteeId?: string,
  ) {
    const where: any = { tenantId };
    if (programId) where.programId = programId;
    if (mentorId) where.mentorId = mentorId;
    if (menteeId) where.menteeId = menteeId;
    return (prisma as any).mentoringSession.findMany({
      where,
      orderBy: { startDate: "desc" },
    });
  }

  async getSessionById(tenantId: string, id: string) {
    const item = await (prisma as any).mentoringSession.findFirst({
      where: { id, tenantId },
      include: { program: { select: { id: true, name: true } } },
    });
    if (!item) throw new NotFoundException("Mentoring session not found");
    return item;
  }

  async createSession(tenantId: string, dto: any) {
    const program = await (prisma as any).mentoringProgram.findFirst({
      where: { id: dto.programId, tenantId },
    });
    if (!program) throw new NotFoundException("Mentoring program not found");
    return (prisma as any).mentoringSession.create({
      data: {
        tenantId,
        programId: dto.programId,
        mentorId: dto.mentorId,
        menteeId: dto.menteeId,
        status: "ACTIVE",
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        sessionTopic: dto.sessionTopic || null,
        goals: dto.goals || [],
      },
    });
  }

  async updateSession(tenantId: string, id: string, dto: any) {
    const item = await (prisma as any).mentoringSession.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("Mentoring session not found");
    return (prisma as any).mentoringSession.update({
      where: { id },
      data: {
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        sessionTopic: dto.sessionTopic,
        feedback: dto.feedback,
        rating: dto.rating,
        goals: dto.goals,
        status: dto.status,
      },
    });
  }

  async completeSession(
    tenantId: string,
    id: string,
    dto: { feedback?: string; rating?: number; goals?: any },
  ) {
    const item = await (prisma as any).mentoringSession.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("Mentoring session not found");
    if (item.status === "COMPLETED")
      throw new BadRequestException("Session is already completed");
    return (prisma as any).mentoringSession.update({
      where: { id },
      data: {
        status: "COMPLETED",
        endDate: new Date(),
        feedback: dto.feedback || null,
        rating: dto.rating || null,
        goals: dto.goals || undefined,
      },
    });
  }

  async deleteSession(tenantId: string, id: string) {
    const item = await (prisma as any).mentoringSession.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("Mentoring session not found");
    await (prisma as any).mentoringSession.delete({ where: { id } });
    return { success: true };
  }

  // ══════════════════════════════════════════════════════════════
  // TALENT ANALYTICS
  // ══════════════════════════════════════════════════════════════

  async getTalentAnalytics(tenantId: string) {
    const [
      totalCourses,
      totalEnrollments,
      completedEnrollments,
      totalCertifications,
      totalSessions,
      activeSessions,
      totalSkills,
      totalGapAnalyses,
      closedGaps,
    ] = await Promise.all([
      (prisma as any).learningCourse
        ? (prisma as any).learningCourse.count({ where: { tenantId } })
        : Promise.resolve(0),
      (prisma as any).learningEnrollment
        ? (prisma as any).learningEnrollment.count({ where: { tenantId } })
        : Promise.resolve(0),
      (prisma as any).learningEnrollment
        ? (prisma as any).learningEnrollment.count({
            where: { tenantId, status: "COMPLETED" },
          })
        : Promise.resolve(0),
      (prisma as any).certification
        ? (prisma as any).certification.count({ where: { tenantId } })
        : Promise.resolve(0),
      (prisma as any).mentoringSession
        ? (prisma as any).mentoringSession.count({ where: { tenantId } })
        : Promise.resolve(0),
      (prisma as any).mentoringSession
        ? (prisma as any).mentoringSession.count({
            where: { tenantId, status: "ACTIVE" },
          })
        : Promise.resolve(0),
      (prisma as any).skillMatrix
        ? (prisma as any).skillMatrix.count({
            where: { tenantId, isActive: true },
          })
        : Promise.resolve(0),
      (prisma as any).skillGapAnalysis
        ? (prisma as any).skillGapAnalysis.count({ where: { tenantId } })
        : Promise.resolve(0),
      (prisma as any).skillGapAnalysis
        ? (prisma as any).skillGapAnalysis.count({
            where: { tenantId, closedAt: { not: null } },
          })
        : Promise.resolve(0),
    ]);

    const completionRate =
      totalEnrollments > 0
        ? Math.round((completedEnrollments / totalEnrollments) * 100)
        : 0;
    const gapClosureRate =
      totalGapAnalyses > 0
        ? Math.round((closedGaps / totalGapAnalyses) * 100)
        : 0;

    const coursesByCategory = (prisma as any).learningCourse
      ? await (prisma as any).learningCourse.groupBy({
          by: ["category"],
          where: { tenantId, category: { not: null } },
          _count: true,
        })
      : [];

    return {
      totalCourses,
      totalEnrollments,
      completedEnrollments,
      completionRate,
      totalCertifications,
      totalMentoringSessions: totalSessions,
      activeMentoringPairs: activeSessions,
      activeSkills: totalSkills,
      totalGapAnalyses,
      gapClosureRate,
      coursesByCategory: coursesByCategory.map((c: any) => ({
        category: c.category,
        count: c._count,
      })),
    };
  }
}
