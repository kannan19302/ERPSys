import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { prisma } from "@unerp/database";
import { EventEmitter2 } from "@nestjs/event-emitter";
import {
  buildPaginationValues,
  buildOrderBy,
  paginatedResult,
  resolveOrgId,
  PaginationParams,
} from "../../common/utils/pagination.util";

@Injectable()
export class HrAdvancedService {
  constructor(private readonly eventEmitter?: EventEmitter2) {}

  // ══════════════════════════════════════════════════════════════
  // BENEFIT SCHEMES
  // ══════════════════════════════════════════════════════════════

  async getBenefitSchemes(tenantId: string) {
    return prisma.benefitScheme.findMany({
      where: { tenantId },
      orderBy: { name: "asc" },
      include: { _count: { select: { enrollments: true } } },
    });
  }

  async getBenefitSchemeById(tenantId: string, id: string) {
    const item = await prisma.benefitScheme.findFirst({
      where: { id, tenantId },
      include: {
        enrollments: { include: { scheme: { select: { name: true } } } },
      },
    });
    if (!item) throw new NotFoundException("Benefit scheme not found");
    return item;
  }

  async createBenefitScheme(tenantId: string, dto: any) {
    return prisma.benefitScheme.create({
      data: {
        tenantId,
        name: dto.name,
        type: dto.type,
        provider: dto.provider,
        description: dto.description || null,
        employeeCostShare: dto.employeeCostShare || 0,
        employerCostShare: dto.employerCostShare || 0,
        isActive: dto.isActive !== false,
      },
    });
  }

  async updateBenefitScheme(tenantId: string, id: string, dto: any) {
    const item = await prisma.benefitScheme.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("Benefit scheme not found");
    return prisma.benefitScheme.update({
      where: { id },
      data: {
        name: dto.name,
        type: dto.type,
        provider: dto.provider,
        description: dto.description,
        employeeCostShare: dto.employeeCostShare,
        employerCostShare: dto.employerCostShare,
        isActive: dto.isActive,
      },
    });
  }

  async deleteBenefitScheme(tenantId: string, id: string) {
    const item = await prisma.benefitScheme.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("Benefit scheme not found");
    await prisma.benefitScheme.delete({ where: { id } });
    return { success: true };
  }

  async enrollInBenefit(tenantId: string, dto: any) {
    const existing = await prisma.employeeBenefit.findFirst({
      where: { tenantId, employeeId: dto.employeeId, schemeId: dto.schemeId },
    });
    if (existing)
      throw new BadRequestException(
        "Employee already enrolled in this benefit scheme",
      );
    return prisma.employeeBenefit.create({
      data: {
        tenantId,
        employeeId: dto.employeeId,
        schemeId: dto.schemeId,
        coverageAmount: dto.coverageAmount || null,
        status: dto.status || "ACTIVE",
      },
    });
  }

  async terminateEmployeeBenefit(tenantId: string, id: string) {
    const item = await prisma.employeeBenefit.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("Employee benefit not found");
    return prisma.employeeBenefit.update({
      where: { id },
      data: { status: "TERMINATED", terminatedAt: new Date() },
    });
  }

  async getEmployeeBenefits(tenantId: string, employeeId?: string) {
    const where: any = { tenantId };
    if (employeeId) where.employeeId = employeeId;
    return prisma.employeeBenefit.findMany({
      where,
      include: { scheme: true },
      orderBy: { enrollmentDate: "desc" },
    });
  }

  async getBenefitEnrollmentCosts(tenantId: string) {
    const schemes = await prisma.benefitScheme.findMany({
      where: { tenantId, isActive: true },
    });
    const enrollments = await prisma.employeeBenefit.findMany({
      where: { tenantId, status: "ACTIVE" },
      include: { scheme: true },
    });
    return {
      totalEmployeeCost: enrollments.reduce(
        (s, e) => s + Number(e.scheme.employeeCostShare),
        0,
      ),
      totalEmployerCost: enrollments.reduce(
        (s, e) => s + Number(e.scheme.employerCostShare),
        0,
      ),
      totalEnrolled: enrollments.length,
      byScheme: schemes.map((s) => ({
        id: s.id,
        name: s.name,
        enrolled: enrollments.filter((e) => e.schemeId === s.id).length,
        employeeCost: Number(s.employeeCostShare),
        employerCost: Number(s.employerCostShare),
      })),
    };
  }

  // ══════════════════════════════════════════════════════════════
  // ENGAGEMENT SURVEYS
  // ══════════════════════════════════════════════════════════════

  async getEngagementSurveys(tenantId: string) {
    return prisma.engagementSurvey.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { questions: true } } },
    });
  }

  async getEngagementSurveyById(tenantId: string, id: string) {
    const item = await prisma.engagementSurvey.findFirst({
      where: { id, tenantId },
      include: {
        questions: {
          include: { responses: true },
          orderBy: { sortOrder: "asc" },
        },
      },
    });
    if (!item) throw new NotFoundException("Engagement survey not found");
    return item;
  }

  async createEngagementSurvey(tenantId: string, dto: any) {
    const questions = dto.questions || [];
    return prisma.engagementSurvey.create({
      data: {
        tenantId,
        title: dto.title,
        description: dto.description || null,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        status: dto.status || "DRAFT",
        questions:
          questions.length > 0
            ? {
                create: questions.map((q: any, idx: number) => ({
                  tenantId,
                  question: q.question,
                  category: q.category || "ENGAGEMENT",
                  sortOrder: idx,
                })),
              }
            : undefined,
      },
      include: { questions: true },
    });
  }

  async updateEngagementSurvey(tenantId: string, id: string, dto: any) {
    const item = await prisma.engagementSurvey.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("Engagement survey not found");
    return prisma.engagementSurvey.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        status: dto.status,
      },
    });
  }

  async launchEngagementSurvey(tenantId: string, id: string) {
    const item = await prisma.engagementSurvey.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("Engagement survey not found");
    if (item.status !== "DRAFT")
      throw new BadRequestException("Survey is not in DRAFT status");
    return prisma.engagementSurvey.update({
      where: { id },
      data: { status: "ACTIVE" },
    });
  }

  async closeEngagementSurvey(tenantId: string, id: string) {
    const item = await prisma.engagementSurvey.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("Engagement survey not found");
    return prisma.engagementSurvey.update({
      where: { id },
      data: { status: "COMPLETED" },
    });
  }

  async deleteEngagementSurvey(tenantId: string, id: string) {
    const item = await prisma.engagementSurvey.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("Engagement survey not found");
    await prisma.engagementSurvey.delete({ where: { id } });
    return { success: true };
  }

  async submitSurveyResponse(
    tenantId: string,
    surveyId: string,
    employeeId: string,
    responses: any[],
  ) {
    const survey = await prisma.engagementSurvey.findFirst({
      where: { id: surveyId, tenantId, status: "ACTIVE" },
    });
    if (!survey) throw new NotFoundException("Active survey not found");
    const created: any[] = [];
    for (const r of responses) {
      const existing = await prisma.surveyResponse.findFirst({
        where: { tenantId, questionId: r.questionId, employeeId },
      });
      if (existing) continue;
      created.push(
        await prisma.surveyResponse.create({
          data: {
            tenantId,
            questionId: r.questionId,
            employeeId,
            rating: r.rating,
            comment: r.comment || null,
          },
        }),
      );
    }
    return { submitted: created.length, surveyId };
  }

  async getSurveyAnalytics(tenantId: string, surveyId: string) {
    const survey = await prisma.engagementSurvey.findFirst({
      where: { id: surveyId, tenantId },
      include: {
        questions: {
          include: { responses: true },
          orderBy: { sortOrder: "asc" },
        },
      },
    });
    if (!survey) throw new NotFoundException("Survey not found");
    const totalEmployees = await prisma.employee.count({
      where: { tenantId, deletedAt: null, status: "ACTIVE" },
    });
    const respondents = new Set(
      survey.questions.flatMap((q) => q.responses.map((r) => r.employeeId)),
    ).size;
    const avgRating =
      survey.questions.length > 0
        ? Math.round(
            (survey.questions
              .flatMap((q) => q.responses)
              .reduce((s, r) => s + r.rating, 0) /
              Math.max(
                1,
                survey.questions.flatMap((q) => q.responses).length,
              )) *
              100,
          ) / 100
        : 0;
    return {
      surveyId,
      title: survey.title,
      totalEmployees,
      respondents,
      responseRate:
        totalEmployees > 0
          ? Math.round((respondents / totalEmployees) * 100)
          : 0,
      avgRating,
      totalResponses: survey.questions.reduce(
        (s, q) => s + q.responses.length,
        0,
      ),
      questionBreakdown: survey.questions.map((q) => ({
        questionId: q.id,
        question: q.question,
        category: q.category,
        responses: q.responses.length,
        avgRating:
          q.responses.length > 0
            ? Math.round(
                (q.responses.reduce((s, r) => s + r.rating, 0) /
                  q.responses.length) *
                  100,
              ) / 100
            : 0,
        ratingDistribution: [1, 2, 3, 4, 5].map((r) => ({
          rating: r,
          count: q.responses.filter((resp) => resp.rating === r).length,
        })),
      })),
    };
  }

  // ══════════════════════════════════════════════════════════════
  // COMPLIANCE CHECKS
  // ══════════════════════════════════════════════════════════════

  async getComplianceChecks(tenantId: string, employeeId?: string) {
    const where: any = { tenantId };
    if (employeeId) where.employeeId = employeeId;
    return prisma.complianceCheck.findMany({
      where,
      orderBy: { checkedAt: "desc" },
    });
  }

  async createComplianceCheck(tenantId: string, dto: any) {
    return prisma.complianceCheck.create({
      data: {
        tenantId,
        employeeId: dto.employeeId || null,
        checkType: dto.checkType,
        status: dto.status || "PASSED",
        message: dto.message || "",
      },
    });
  }

  async getComplianceReport(tenantId: string) {
    const all = await prisma.complianceCheck.findMany({ where: { tenantId } });
    const passed = all.filter((c) => c.status === "PASSED").length;
    const warning = all.filter((c) => c.status === "WARNING").length;
    const failed = all.filter((c) => c.status === "FAILED").length;
    return {
      total: all.length,
      passed,
      warning,
      failed,
      passRate: all.length > 0 ? Math.round((passed / all.length) * 100) : 100,
      checks: all,
    };
  }

  // ══════════════════════════════════════════════════════════════
  // SKILL REQUIREMENTS
  // ══════════════════════════════════════════════════════════════

  async getSkillRequirements(tenantId: string, designation?: string) {
    const where: any = { tenantId };
    if (designation) where.designation = designation;
    return prisma.skillRequirement.findMany({
      where,
      orderBy: { designation: "asc" },
    });
  }

  async createSkillRequirement(tenantId: string, dto: any) {
    return prisma.skillRequirement.create({
      data: {
        tenantId,
        designation: dto.designation,
        skillName: dto.skillName,
        requiredLevel: dto.requiredLevel || 3,
      },
    });
  }

  async deleteSkillRequirement(tenantId: string, id: string) {
    const item = await prisma.skillRequirement.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("Skill requirement not found");
    await prisma.skillRequirement.delete({ where: { id } });
    return { success: true };
  }

  async getEmployeeSkillGap(tenantId: string, employeeId: string) {
    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, tenantId },
    });
    if (!employee) throw new NotFoundException("Employee not found");
    const designation = employee.designation;
    if (!designation)
      return {
        employeeId,
        designation: null,
        gaps: [],
        message: "No designation assigned",
      };
    const requirements = await prisma.skillRequirement.findMany({
      where: { tenantId, designation },
    });
    const employeeSkills = await prisma.employeeSkill.findMany({
      where: { tenantId, employeeId },
    });
    const skillMap = new Map(employeeSkills.map((s) => [s.skillName, s]));
    const gaps = requirements.map((req) => {
      const empSkill = skillMap.get(req.skillName);
      const gap = req.requiredLevel - (empSkill?.proficiency || 0);
      return {
        skillName: req.skillName,
        requiredLevel: req.requiredLevel,
        currentLevel: empSkill?.proficiency || 0,
        gap: Math.max(0, gap),
        certified: empSkill?.certified || false,
      };
    });
    return {
      employeeId,
      designation,
      totalRequired: requirements.length,
      met: gaps.filter((g) => g.gap === 0).length,
      gaps: gaps.filter((g) => g.gap > 0),
    };
  }

  // ══════════════════════════════════════════════════════════════
  // OFFER LETTERS
  // ══════════════════════════════════════════════════════════════

  async getOfferLetters(tenantId: string) {
    return prisma.offerLetter.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      include: {
        applicant: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
  }

  async getOfferLetterById(tenantId: string, id: string) {
    const item = await prisma.offerLetter.findFirst({
      where: { id, tenantId },
      include: { applicant: true },
    });
    if (!item) throw new NotFoundException("Offer letter not found");
    return item;
  }

  async createOfferLetter(tenantId: string, dto: any) {
    const applicant = await prisma.applicant.findFirst({
      where: { id: dto.applicantId, tenantId },
    });
    if (!applicant) throw new NotFoundException("Applicant not found");
    return prisma.offerLetter.create({
      data: {
        tenantId,
        applicantId: dto.applicantId,
        salaryOffered: dto.salaryOffered,
        status: dto.status || "DRAFT",
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        notes: dto.notes || null,
      },
    });
  }

  async sendOfferLetter(tenantId: string, id: string) {
    const item = await prisma.offerLetter.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("Offer letter not found");
    if (item.status !== "DRAFT")
      throw new BadRequestException("Offer letter is not in DRAFT status");
    return prisma.offerLetter.update({
      where: { id },
      data: { status: "SENT", sentAt: new Date() },
    });
  }

  async updateOfferLetterStatus(tenantId: string, id: string, status: string) {
    const item = await prisma.offerLetter.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("Offer letter not found");
    const updateData: any = { status };
    if (status === "ACCEPTED") updateData.signedAt = new Date();
    return prisma.offerLetter.update({ where: { id }, data: updateData });
  }

  // ══════════════════════════════════════════════════════════════
  // HOLIDAY CALENDAR
  // ══════════════════════════════════════════════════════════════

  async getHolidays(tenantId: string, region?: string) {
    const where: any = { tenantId };
    if (region) where.region = region;
    return prisma.holidayCalendar.findMany({ where, orderBy: { date: "asc" } });
  }

  async createHoliday(tenantId: string, dto: any) {
    return prisma.holidayCalendar.create({
      data: {
        tenantId,
        name: dto.name,
        date: new Date(dto.date),
        region: dto.region || "GLOBAL",
      },
    });
  }

  async updateHoliday(tenantId: string, id: string, dto: any) {
    const item = await prisma.holidayCalendar.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("Holiday not found");
    return prisma.holidayCalendar.update({
      where: { id },
      data: {
        name: dto.name,
        date: dto.date ? new Date(dto.date) : undefined,
        region: dto.region,
      },
    });
  }

  async deleteHoliday(tenantId: string, id: string) {
    const item = await prisma.holidayCalendar.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("Holiday not found");
    await prisma.holidayCalendar.delete({ where: { id } });
    return { success: true };
  }

  // ══════════════════════════════════════════════════════════════
  // EMPLOYEE ACHIEVEMENTS
  // ══════════════════════════════════════════════════════════════

  async getEmployeeAchievements(tenantId: string, employeeId?: string) {
    const where: any = { tenantId };
    if (employeeId) where.employeeId = employeeId;
    return prisma.employeeAchievement.findMany({
      where,
      orderBy: { awardDate: "desc" },
    });
  }

  async createEmployeeAchievement(tenantId: string, dto: any) {
    return prisma.employeeAchievement.create({
      data: {
        tenantId,
        employeeId: dto.employeeId,
        title: dto.title,
        description: dto.description || null,
        awardDate: new Date(dto.awardDate),
        awardedBy: dto.awardedBy || null,
        category: dto.category || "OTHER",
      },
    });
  }

  async deleteEmployeeAchievement(tenantId: string, id: string) {
    const item = await prisma.employeeAchievement.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("Achievement not found");
    await prisma.employeeAchievement.delete({ where: { id } });
    return { success: true };
  }

  // ══════════════════════════════════════════════════════════════
  // EMPLOYEE REFERRALS
  // ══════════════════════════════════════════════════════════════

  async getEmployeeReferrals(tenantId: string) {
    return prisma.employeeReferral.findMany({
      where: { tenantId },
      orderBy: { referralDate: "desc" },
    });
  }

  async createEmployeeReferral(tenantId: string, dto: any) {
    return prisma.employeeReferral.create({
      data: {
        tenantId,
        referringEmployeeId: dto.referringEmployeeId,
        candidateName: dto.candidateName,
        candidateEmail: dto.candidateEmail,
        candidatePhone: dto.candidatePhone || null,
        position: dto.position || null,
        relationship: dto.relationship || null,
        notes: dto.notes || null,
        status: "SUBMITTED",
      },
    });
  }

  async updateEmployeeReferralStatus(
    tenantId: string,
    id: string,
    status: string,
    rewardAmount?: number,
  ) {
    const item = await prisma.employeeReferral.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("Referral not found");
    const updateData: any = { status };
    if (rewardAmount !== undefined) {
      updateData.rewardAmount = rewardAmount;
      if (status === "REWARDED") updateData.rewardPaid = true;
    }
    return prisma.employeeReferral.update({ where: { id }, data: updateData });
  }

  // ══════════════════════════════════════════════════════════════
  // EMPLOYEE EDUCATION
  // ══════════════════════════════════════════════════════════════

  async getEmployeeEducation(tenantId: string, employeeId?: string) {
    const where: any = { tenantId };
    if (employeeId) where.employeeId = employeeId;
    return prisma.employeeEducation.findMany({
      where,
      orderBy: { endYear: "desc" },
    });
  }

  async createEmployeeEducation(tenantId: string, dto: any) {
    return prisma.employeeEducation.create({
      data: {
        tenantId,
        employeeId: dto.employeeId,
        degree: dto.degree,
        institution: dto.institution,
        field: dto.field || null,
        startYear: dto.startYear || null,
        endYear: dto.endYear || null,
        grade: dto.grade || null,
        isHighestDegree: dto.isHighestDegree || false,
      },
    });
  }

  async deleteEmployeeEducation(tenantId: string, id: string) {
    const item = await prisma.employeeEducation.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("Education record not found");
    await prisma.employeeEducation.delete({ where: { id } });
    return { success: true };
  }

  // ══════════════════════════════════════════════════════════════
  // EMPLOYEE DEPENDENTS
  // ══════════════════════════════════════════════════════════════

  async getEmployeeDependents(tenantId: string, employeeId?: string) {
    const where: any = { tenantId };
    if (employeeId) where.employeeId = employeeId;
    return prisma.employeeDependent.findMany({
      where,
      orderBy: { name: "asc" },
    });
  }

  async createEmployeeDependent(tenantId: string, dto: any) {
    if (dto.isNominee && dto.nomineePercent) {
      const existingTotal = await prisma.employeeDependent.aggregate({
        where: { tenantId, employeeId: dto.employeeId, isNominee: true },
        _sum: { nomineePercent: true },
      });
      const currentTotal = Number(existingTotal._sum.nomineePercent || 0);
      if (currentTotal + dto.nomineePercent > 100) {
        throw new BadRequestException(
          "Total nominee percentage would exceed 100%",
        );
      }
    }
    return prisma.employeeDependent.create({
      data: {
        tenantId,
        employeeId: dto.employeeId,
        name: dto.name,
        relationship: dto.relationship,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null,
        isNominee: dto.isNominee || false,
        nomineePercent: dto.nomineePercent || null,
      },
    });
  }

  async deleteEmployeeDependent(tenantId: string, id: string) {
    const item = await prisma.employeeDependent.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("Dependent not found");
    await prisma.employeeDependent.delete({ where: { id } });
    return { success: true };
  }

  // ══════════════════════════════════════════════════════════════
  // EMPLOYEE EMERGENCY CONTACTS
  // ══════════════════════════════════════════════════════════════

  async getEmployeeEmergencyContacts(tenantId: string, employeeId?: string) {
    const where: any = { tenantId };
    if (employeeId) where.employeeId = employeeId;
    return prisma.employeeEmergencyContact.findMany({
      where,
      orderBy: [{ isPrimary: "desc" }, { name: "asc" }],
    });
  }

  async createEmployeeEmergencyContact(tenantId: string, dto: any) {
    if (dto.isPrimary) {
      await prisma.employeeEmergencyContact.updateMany({
        where: { tenantId, employeeId: dto.employeeId, isPrimary: true },
        data: { isPrimary: false },
      });
    }
    return prisma.employeeEmergencyContact.create({
      data: {
        tenantId,
        employeeId: dto.employeeId,
        name: dto.name,
        relationship: dto.relationship,
        phone: dto.phone,
        email: dto.email || null,
        address: dto.address || null,
        isPrimary: dto.isPrimary || false,
      },
    });
  }

  async deleteEmployeeEmergencyContact(tenantId: string, id: string) {
    const item = await prisma.employeeEmergencyContact.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("Emergency contact not found");
    await prisma.employeeEmergencyContact.delete({ where: { id } });
    return { success: true };
  }

  // ══════════════════════════════════════════════════════════════
  // HR EXPENSE CLAIMS
  // ══════════════════════════════════════════════════════════════

  async getExpenseClaims(
    tenantId: string,
    params: PaginationParams & { employeeId?: string; status?: string } = {},
  ) {
    const where: any = { tenantId };
    if (params.employeeId) where.employeeId = params.employeeId;
    if (params.status) where.status = params.status;
    const { skip, take } = buildPaginationValues(params);
    const orderBy = buildOrderBy(params.sort);
    const [items, total] = await Promise.all([
      prisma.hrExpenseClaim.findMany({
        where,
        skip,
        take,
        orderBy: orderBy as any,
        include: { items: true, _count: { select: { items: true } } },
      }),
      prisma.hrExpenseClaim.count({ where }),
    ]);
    return paginatedResult(items, total, params);
  }

  async getExpenseClaimById(tenantId: string, id: string) {
    const item = await prisma.hrExpenseClaim.findFirst({
      where: { id, tenantId },
      include: { items: true },
    });
    if (!item) throw new NotFoundException("Expense claim not found");
    return item;
  }

  async createExpenseClaim(tenantId: string, orgId: string, dto: any) {
    await resolveOrgId(tenantId, orgId);
    const claimNumber = `EXP-${Date.now()}`;
    const items = dto.items || [];
    const totalAmount = items.reduce(
      (sum: number, item: any) => sum + item.amount,
      dto.totalAmount || 0,
    );
    return prisma.hrExpenseClaim.create({
      data: {
        tenantId,
        employeeId: dto.employeeId,
        claimNumber,
        title: dto.title,
        description: dto.description || null,
        totalAmount,
        currency: dto.currency || "USD",
        status: "DRAFT",
        notes: dto.notes || null,
        items:
          items.length > 0
            ? {
                create: items.map((item: any) => ({
                  tenantId,
                  category: item.category,
                  description: item.description,
                  amount: item.amount,
                  expenseDate: new Date(item.expenseDate),
                  receiptUrl: item.receiptUrl || null,
                  currency: item.currency || "USD",
                })),
              }
            : undefined,
      },
      include: { items: true },
    });
  }

  async submitExpenseClaim(tenantId: string, id: string) {
    const item = await prisma.hrExpenseClaim.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("Expense claim not found");
    if (item.status !== "DRAFT")
      throw new BadRequestException("Expense claim is not in DRAFT status");
    return prisma.hrExpenseClaim.update({
      where: { id },
      data: { status: "SUBMITTED", submittedAt: new Date() },
    });
  }

  async approveExpenseClaim(tenantId: string, id: string, userId: string) {
    const item = await prisma.hrExpenseClaim.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("Expense claim not found");
    if (item.status !== "SUBMITTED")
      throw new BadRequestException("Expense claim is not in SUBMITTED status");
    return prisma.hrExpenseClaim.update({
      where: { id },
      data: { status: "APPROVED", approvedBy: userId, approvedAt: new Date() },
    });
  }

  async rejectExpenseClaim(tenantId: string, id: string, reason: string) {
    const item = await prisma.hrExpenseClaim.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("Expense claim not found");
    return prisma.hrExpenseClaim.update({
      where: { id },
      data: { status: "REJECTED", rejectedReason: reason },
    });
  }

  async reimburseExpenseClaim(
    tenantId: string,
    id: string,
    paymentMethod?: string,
  ) {
    const item = await prisma.hrExpenseClaim.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("Expense claim not found");
    if (item.status !== "APPROVED")
      throw new BadRequestException(
        "Expense claim must be APPROVED before reimbursement",
      );
    return prisma.hrExpenseClaim.update({
      where: { id },
      data: {
        status: "REIMBURSED",
        reimbursedAt: new Date(),
        paymentMethod: paymentMethod || null,
      },
    });
  }

  // ══════════════════════════════════════════════════════════════
  // EMPLOYEE PROMOTIONS
  // ══════════════════════════════════════════════════════════════

  async getEmployeePromotions(tenantId: string, employeeId?: string) {
    const where: any = { tenantId };
    if (employeeId) where.employeeId = employeeId;
    return prisma.employeePromotion.findMany({
      where,
      orderBy: { promotionDate: "desc" },
    });
  }

  async createEmployeePromotion(tenantId: string, dto: any) {
    const employee = await prisma.employee.findFirst({
      where: { id: dto.employeeId, tenantId },
    });
    if (!employee) throw new NotFoundException("Employee not found");
    const result = await prisma.employeePromotion.create({
      data: {
        tenantId,
        employeeId: dto.employeeId,
        previousTitle: dto.previousTitle,
        newTitle: dto.newTitle,
        previousGrade: dto.previousGrade || null,
        newGrade: dto.newGrade || null,
        previousSalary: dto.previousSalary || null,
        newSalary: dto.newSalary || null,
        promotionDate: new Date(dto.promotionDate),
        promotionType: dto.promotionType || "PROMOTION",
        reason: dto.reason || null,
        approvedBy: dto.approvedBy || null,
      },
    });
    await prisma.employee.update({
      where: { id: dto.employeeId },
      data: { designation: dto.newTitle },
    });
    if (this.eventEmitter) {
      this.eventEmitter.emit("hr.employee.promoted", {
        employeeId: dto.employeeId,
        tenantId,
        previousTitle: dto.previousTitle,
        newTitle: dto.newTitle,
        promotionDate: dto.promotionDate,
        promotionType: dto.promotionType,
      });
    }
    return result;
  }

  // ══════════════════════════════════════════════════════════════
  // EMPLOYEE SEPARATIONS
  // ══════════════════════════════════════════════════════════════

  async getEmployeeSeparations(tenantId: string) {
    return prisma.employeeSeparation.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });
  }

  async createEmployeeSeparation(tenantId: string, dto: any) {
    const result = await prisma.employeeSeparation.create({
      data: {
        tenantId,
        employeeId: dto.employeeId,
        separationType: dto.separationType,
        lastWorkingDay: new Date(dto.lastWorkingDay),
        reason: dto.reason || null,
        isEligibleForRehire: dto.isEligibleForRehire !== false,
        noticePeriodDays: dto.noticePeriodDays || null,
        settlementAmount: dto.settlementAmount || null,
        approvedBy: dto.approvedBy || null,
      },
    });
    await prisma.employee.update({
      where: { id: dto.employeeId },
      data: {
        status: "TERMINATED",
        dateOfLeaving: new Date(dto.lastWorkingDay),
      },
    });
    if (this.eventEmitter) {
      this.eventEmitter.emit("hr.employee.separated", {
        employeeId: dto.employeeId,
        tenantId,
        separationType: dto.separationType,
        lastWorkingDay: dto.lastWorkingDay,
      });
    }
    return result;
  }

  // ══════════════════════════════════════════════════════════════
  // EXIT INTERVIEWS
  // ══════════════════════════════════════════════════════════════

  async getExitInterviews(tenantId: string) {
    return prisma.exitInterview.findMany({
      where: { tenantId },
      orderBy: { interviewDate: "desc" },
    });
  }

  async createExitInterview(tenantId: string, dto: any) {
    return prisma.exitInterview.create({
      data: {
        tenantId,
        employeeId: dto.employeeId,
        separationId: dto.separationId || null,
        interviewDate: new Date(dto.interviewDate),
        interviewer: dto.interviewer || null,
        reasonForLeaving: dto.reasonForLeaving || null,
        feedback: dto.feedback || null,
        suggestions: dto.suggestions || null,
        wouldReturn: dto.wouldReturn || null,
        wouldRecommend: dto.wouldRecommend || null,
        satisfactionScore: dto.satisfactionScore || null,
      },
    });
  }

  // ══════════════════════════════════════════════════════════════
  // EMPLOYEE WARNINGS
  // ══════════════════════════════════════════════════════════════

  async getEmployeeWarnings(tenantId: string, employeeId?: string) {
    const where: any = { tenantId };
    if (employeeId) where.employeeId = employeeId;
    return prisma.employeeWarning.findMany({
      where,
      orderBy: { issuedDate: "desc" },
    });
  }

  async createEmployeeWarning(tenantId: string, dto: any) {
    return prisma.employeeWarning.create({
      data: {
        tenantId,
        employeeId: dto.employeeId,
        warningType: dto.warningType,
        title: dto.title,
        description: dto.description,
        issuedBy: dto.issuedBy,
        issuedDate: new Date(dto.issuedDate),
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
        status: "ACTIVE",
      },
    });
  }

  async resolveEmployeeWarning(
    tenantId: string,
    id: string,
    resolution: string,
  ) {
    const item = await prisma.employeeWarning.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("Warning not found");
    return prisma.employeeWarning.update({
      where: { id },
      data: { status: "RESOLVED", resolution: resolution },
    });
  }

  // ══════════════════════════════════════════════════════════════
  // HR POLICIES
  // ══════════════════════════════════════════════════════════════

  async getHrPolicies(tenantId: string) {
    return prisma.hrPolicy.findMany({
      where: { tenantId },
      orderBy: { effectiveDate: "desc" },
      include: { _count: { select: { acknowledgments: true } } },
    });
  }

  async getHrPolicyById(tenantId: string, id: string) {
    const item = await prisma.hrPolicy.findFirst({
      where: { id, tenantId },
      include: { acknowledgments: true },
    });
    if (!item) throw new NotFoundException("HR Policy not found");
    return item;
  }

  async createHrPolicy(tenantId: string, dto: any) {
    return prisma.hrPolicy.create({
      data: {
        tenantId,
        title: dto.title,
        category: dto.category,
        content: dto.content,
        version: dto.version || "1.0",
        effectiveDate: new Date(dto.effectiveDate),
        createdBy: dto.createdBy || null,
        requiresAcknowledgment: dto.requiresAcknowledgment || false,
        status: dto.status || "ACTIVE",
      },
    });
  }

  async updateHrPolicy(tenantId: string, id: string, dto: any) {
    const item = await prisma.hrPolicy.findFirst({ where: { id, tenantId } });
    if (!item) throw new NotFoundException("HR Policy not found");
    return prisma.hrPolicy.update({
      where: { id },
      data: {
        title: dto.title,
        category: dto.category,
        content: dto.content,
        version: dto.version || `${Number(item.version.split(".")[0]) + 1}.0`,
        effectiveDate: dto.effectiveDate
          ? new Date(dto.effectiveDate)
          : undefined,
        requiresAcknowledgment: dto.requiresAcknowledgment,
        status: dto.status,
      },
    });
  }

  async deleteHrPolicy(tenantId: string, id: string) {
    const item = await prisma.hrPolicy.findFirst({ where: { id, tenantId } });
    if (!item) throw new NotFoundException("HR Policy not found");
    await prisma.hrPolicy.delete({ where: { id } });
    return { success: true };
  }

  async acknowledgeHrPolicy(
    tenantId: string,
    policyId: string,
    employeeId: string,
    signature?: string,
  ) {
    const existing = await prisma.hrPolicyAcknowledgment.findFirst({
      where: { tenantId, policyId, employeeId },
    });
    if (existing)
      throw new BadRequestException(
        "Policy already acknowledged by this employee",
      );
    return prisma.hrPolicyAcknowledgment.create({
      data: { tenantId, policyId, employeeId, signature: signature || null },
    });
  }

  async getPolicyAcknowledgments(tenantId: string, policyId: string) {
    const policy = await prisma.hrPolicy.findFirst({
      where: { id: policyId, tenantId },
    });
    if (!policy) throw new NotFoundException("Policy not found");
    const totalEmployees = await prisma.employee.count({
      where: { tenantId, deletedAt: null, status: "ACTIVE" },
    });
    const acknowledgments = await prisma.hrPolicyAcknowledgment.findMany({
      where: { tenantId, policyId },
      include: { policy: { select: { title: true } } },
    });
    return {
      policyId,
      policyTitle: policy.title,
      totalEmployees,
      acknowledgedCount: acknowledgments.length,
      completionRate:
        totalEmployees > 0
          ? Math.round((acknowledgments.length / totalEmployees) * 100)
          : 0,
      acknowledgments,
    };
  }

  // ══════════════════════════════════════════════════════════════
  // HR ANNOUNCEMENTS
  // ══════════════════════════════════════════════════════════════

  async getHrAnnouncements(tenantId: string) {
    const now = new Date();
    return prisma.hrAnnouncement.findMany({
      where: {
        tenantId,
        startsAt: { lte: now },
        OR: [{ expiresAt: null }, { expiresAt: { gte: now } }],
      },
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    });
  }

  async createHrAnnouncement(tenantId: string, dto: any) {
    return prisma.hrAnnouncement.create({
      data: {
        tenantId,
        title: dto.title,
        body: dto.body,
        category: dto.category || "GENERAL",
        priority: dto.priority || "NORMAL",
        startsAt: new Date(dto.startsAt),
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        createdBy: dto.createdBy || null,
        pinned: dto.pinned || false,
      },
    });
  }

  async deleteHrAnnouncement(tenantId: string, id: string) {
    const item = await prisma.hrAnnouncement.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("Announcement not found");
    await prisma.hrAnnouncement.delete({ where: { id } });
    return { success: true };
  }

  // ══════════════════════════════════════════════════════════════
  // RECRUITMENT AGENCIES
  // ══════════════════════════════════════════════════════════════

  async getRecruitmentAgencies(tenantId: string) {
    return prisma.recruitmentAgency.findMany({
      where: { tenantId },
      orderBy: { name: "asc" },
    });
  }

  async createRecruitmentAgency(tenantId: string, dto: any) {
    return prisma.recruitmentAgency.create({
      data: {
        tenantId,
        name: dto.name,
        contactPerson: dto.contactPerson || null,
        email: dto.email || null,
        phone: dto.phone || null,
        commissionRate: dto.commissionRate || null,
        agreementUrl: dto.agreementUrl || null,
        status: dto.status || "ACTIVE",
      },
    });
  }

  async updateRecruitmentAgency(tenantId: string, id: string, dto: any) {
    const item = await prisma.recruitmentAgency.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("Recruitment agency not found");
    return prisma.recruitmentAgency.update({ where: { id }, data: dto });
  }

  async deleteRecruitmentAgency(tenantId: string, id: string) {
    const item = await prisma.recruitmentAgency.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("Recruitment agency not found");
    await prisma.recruitmentAgency.delete({ where: { id } });
    return { success: true };
  }

  // ══════════════════════════════════════════════════════════════
  // OFFER TEMPLATES
  // ══════════════════════════════════════════════════════════════

  async getOfferTemplates(tenantId: string) {
    return prisma.offerTemplate.findMany({
      where: { tenantId },
      orderBy: { name: "asc" },
    });
  }

  async createOfferTemplate(tenantId: string, dto: any) {
    return prisma.offerTemplate.create({
      data: {
        tenantId,
        name: dto.name,
        content: dto.content,
        variables: dto.variables || [],
      },
    });
  }

  async updateOfferTemplate(tenantId: string, id: string, dto: any) {
    const item = await prisma.offerTemplate.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("Offer template not found");
    return prisma.offerTemplate.update({ where: { id }, data: dto });
  }

  async deleteOfferTemplate(tenantId: string, id: string) {
    const item = await prisma.offerTemplate.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("Offer template not found");
    await prisma.offerTemplate.delete({ where: { id } });
    return { success: true };
  }

  // ══════════════════════════════════════════════════════════════
  // SALARY REVISIONS
  // ══════════════════════════════════════════════════════════════

  async getSalaryRevisions(tenantId: string, employeeId?: string) {
    const where: any = { tenantId };
    if (employeeId) where.employeeId = employeeId;
    return prisma.salaryRevision.findMany({
      where,
      orderBy: { effectiveDate: "desc" },
    });
  }

  async createSalaryRevision(tenantId: string, dto: any) {
    const revision = await prisma.salaryRevision.create({
      data: {
        tenantId,
        employeeId: dto.employeeId,
        previousSalary: dto.previousSalary,
        newSalary: dto.newSalary,
        revisionType: dto.revisionType || "ANNUAL",
        effectiveDate: new Date(dto.effectiveDate),
        reason: dto.reason || null,
        approvedBy: dto.approvedBy || null,
        approvedAt: new Date(),
      },
    });
    await prisma.salaryStructure.updateMany({
      where: { tenantId, employeeId: dto.employeeId },
      data: { baseSalary: dto.newSalary },
    });
    return revision;
  }

  // ══════════════════════════════════════════════════════════════
  // OVERTIME REQUESTS
  // ══════════════════════════════════════════════════════════════

  async getOvertimeRequests(tenantId: string, employeeId?: string) {
    const where: any = { tenantId };
    if (employeeId) where.employeeId = employeeId;
    return prisma.overtimeRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
  }

  async createOvertimeRequest(tenantId: string, dto: any) {
    return prisma.overtimeRequest.create({
      data: {
        tenantId,
        employeeId: dto.employeeId,
        date: new Date(dto.date),
        startTime: new Date(dto.startTime),
        endTime: new Date(dto.endTime),
        totalHours: dto.totalHours,
        rate: dto.rate || 1.5,
        reason: dto.reason || null,
        status: "PENDING",
      },
    });
  }

  async approveOvertimeRequest(tenantId: string, id: string, userId: string) {
    const item = await prisma.overtimeRequest.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("Overtime request not found");
    if (item.status !== "PENDING")
      throw new BadRequestException("Overtime request is not PENDING");
    return prisma.overtimeRequest.update({
      where: { id },
      data: { status: "APPROVED", approvedBy: userId, approvedAt: new Date() },
    });
  }

  async rejectOvertimeRequest(tenantId: string, id: string) {
    const item = await prisma.overtimeRequest.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("Overtime request not found");
    return prisma.overtimeRequest.update({
      where: { id },
      data: { status: "REJECTED" },
    });
  }

  // ══════════════════════════════════════════════════════════════
  // ATTENDANCE ADJUSTMENTS
  // ══════════════════════════════════════════════════════════════

  async getAttendanceAdjustments(tenantId: string, employeeId?: string) {
    const where: any = { tenantId };
    if (employeeId) where.employeeId = employeeId;
    return prisma.attendanceAdjustment.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
  }

  async createAttendanceAdjustment(tenantId: string, dto: any) {
    return prisma.attendanceAdjustment.create({
      data: {
        tenantId,
        employeeId: dto.employeeId,
        attendanceId: dto.attendanceId || null,
        date: new Date(dto.date),
        previousCheckIn: dto.previousCheckIn
          ? new Date(dto.previousCheckIn)
          : null,
        previousCheckOut: dto.previousCheckOut
          ? new Date(dto.previousCheckOut)
          : null,
        newCheckIn: dto.newCheckIn ? new Date(dto.newCheckIn) : null,
        newCheckOut: dto.newCheckOut ? new Date(dto.newCheckOut) : null,
        reason: dto.reason,
        status: "PENDING",
      },
    });
  }

  async approveAttendanceAdjustment(
    tenantId: string,
    id: string,
    userId: string,
  ) {
    const item = await prisma.attendanceAdjustment.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("Attendance adjustment not found");
    if (item.attendanceId) {
      await prisma.attendanceRecord.update({
        where: { id: item.attendanceId },
        data: {
          checkIn: item.newCheckIn || undefined,
          checkOut: item.newCheckOut || undefined,
        },
      });
    }
    return prisma.attendanceAdjustment.update({
      where: { id },
      data: { status: "APPROVED", approvedBy: userId },
    });
  }

  // ══════════════════════════════════════════════════════════════
  // PAYROLL TAX & CONTRIBUTIONS
  // ══════════════════════════════════════════════════════════════

  async getPayrollTaxEntries(tenantId: string, payrollRunId?: string) {
    const where: any = { tenantId };
    if (payrollRunId) where.payrollRunId = payrollRunId;
    return prisma.payrollTaxEntry.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
  }

  async getPayrollContributions(tenantId: string, payrollRunId?: string) {
    const where: any = { tenantId };
    if (payrollRunId) where.payrollRunId = payrollRunId;
    return prisma.payrollContribution.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
  }

  async computePayrollTaxes(tenantId: string, payrollRunId: string) {
    const payRun = await prisma.payrollRun.findFirst({
      where: { id: payrollRunId, tenantId },
    });
    if (!payRun) throw new NotFoundException("Pay run not found");
    const slips = await prisma.payrollSlip.findMany({
      where: { tenantId, payrollRunId },
    });
    const taxEntries: any[] = [];
    const contributionEntries: any[] = [];
    for (const slip of slips) {
      const gross = Number(slip.grossSalary);
      const estimatedTax = gross * 0.1;
      taxEntries.push(
        await prisma.payrollTaxEntry.create({
          data: {
            tenantId,
            payrollRunId,
            employeeId: slip.employeeId,
            taxType: "INCOME_TAX",
            taxableAmount: gross,
            taxAmount: estimatedTax,
          },
        }),
      );
      contributionEntries.push(
        await prisma.payrollContribution.create({
          data: {
            tenantId,
            payrollRunId,
            employeeId: slip.employeeId,
            contributionType: "PENSION",
            employerAmount: gross * 0.05,
            employeeAmount: gross * 0.03,
          },
        }),
      );
    }
    return {
      taxesCreated: taxEntries.length,
      contributionsCreated: contributionEntries.length,
    };
  }

  // ══════════════════════════════════════════════════════════════
  // KPI TEMPLATES & EVALUATIONS
  // ══════════════════════════════════════════════════════════════

  async getKpiTemplates(tenantId: string) {
    return prisma.kpiTemplate.findMany({
      where: { tenantId },
      orderBy: { name: "asc" },
    });
  }

  async createKpiTemplate(tenantId: string, dto: any) {
    return prisma.kpiTemplate.create({
      data: {
        tenantId,
        name: dto.name,
        description: dto.description || null,
        category: dto.category || "PERFORMANCE",
        metricType: dto.metricType,
        targetValue: dto.targetValue || null,
        unit: dto.unit || null,
      },
    });
  }

  async deleteKpiTemplate(tenantId: string, id: string) {
    const item = await prisma.kpiTemplate.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("KPI template not found");
    await prisma.kpiTemplate.delete({ where: { id } });
    return { success: true };
  }

  async getKpiEvaluations(tenantId: string, employeeId?: string) {
    const where: any = { tenantId };
    if (employeeId) where.employeeId = employeeId;
    return prisma.kpiEvaluation.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        kpiTemplate: {
          select: { id: true, name: true, metricType: true, unit: true },
        },
      },
    });
  }

  async createKpiEvaluation(tenantId: string, dto: any) {
    return prisma.kpiEvaluation.create({
      data: {
        tenantId,
        employeeId: dto.employeeId,
        kpiTemplateId: dto.kpiTemplateId,
        period: dto.period,
        targetValue: dto.targetValue,
        actualValue: dto.actualValue || null,
        weightage: dto.weightage || 100,
        reviewerId: dto.reviewerId || null,
        notes: dto.notes || null,
        status: "DRAFT",
      },
    });
  }

  async updateKpiEvaluation(tenantId: string, id: string, dto: any) {
    const item = await prisma.kpiEvaluation.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("KPI evaluation not found");
    const actualValue =
      dto.actualValue !== undefined ? dto.actualValue : item.actualValue;
    const score =
      actualValue && item.targetValue
        ? (Number(actualValue) / Number(item.targetValue)) * 100
        : null;
    return prisma.kpiEvaluation.update({
      where: { id },
      data: {
        actualValue,
        score: score ? Math.round(score * 100) / 100 : null,
        notes: dto.notes,
        reviewerId: dto.reviewerId,
      },
    });
  }

  async submitKpiEvaluation(tenantId: string, id: string) {
    const item = await prisma.kpiEvaluation.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("KPI evaluation not found");
    return prisma.kpiEvaluation.update({
      where: { id },
      data: { status: "SUBMITTED" },
    });
  }

  // ══════════════════════════════════════════════════════════════
  // ENHANCED DASHBOARD & ANALYTICS
  // ══════════════════════════════════════════════════════════════

  async getEnhancedDashboard(tenantId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [
      total,
      active,
      newHires,
      pendingLeaves,
      openPositions,
      deptCount,
      leaveCount,
      pendingExpenses,
      pendingOvertime,
      openTickets,
    ] = await Promise.all([
      prisma.employee.count({ where: { tenantId, deletedAt: null } }),
      prisma.employee.count({
        where: { tenantId, deletedAt: null, status: "ACTIVE" },
      }),
      prisma.employee.count({
        where: {
          tenantId,
          deletedAt: null,
          dateOfJoining: { gte: startOfMonth },
        },
      }),
      prisma.leaveRequest.count({ where: { tenantId, status: "PENDING" } }),
      prisma.position.count({ where: { tenantId, status: "VACANT" } }),
      prisma.department.count({ where: { tenantId } }),
      prisma.employee.count({
        where: { tenantId, deletedAt: null, status: "ON_LEAVE" },
      }),
      prisma.hrExpenseClaim.count({ where: { tenantId, status: "SUBMITTED" } }),
      prisma.overtimeRequest.count({ where: { tenantId, status: "PENDING" } }),
      prisma.hRTicket.count({
        where: { tenantId, status: { in: ["OPEN", "IN_PROGRESS"] } },
      }),
    ]);

    const [present, absent] = await Promise.all([
      prisma.attendanceRecord.count({
        where: { tenantId, date: today, status: "PRESENT" },
      }),
      prisma.attendanceRecord.count({
        where: { tenantId, date: today, status: "ABSENT" },
      }),
    ]);

    const [byDept, byEmpType] = await Promise.all([
      prisma.department.findMany({
        where: { tenantId },
        include: {
          _count: { select: { employees: { where: { deletedAt: null } } } },
        },
      }),
      prisma.employee.groupBy({
        by: ["employmentType"],
        where: { tenantId, deletedAt: null },
        _count: true,
      }),
    ]);

    const recentHires = await prisma.employee.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { dateOfJoining: "desc" },
      take: 10,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        designation: true,
        dateOfJoining: true,
      },
    });

    const holidaysCount = await prisma.holidayCalendar.count({
      where: { tenantId, date: { gte: today } },
    });

    return {
      totalEmployees: total,
      activeEmployees: active,
      newHiresThisMonth: newHires,
      departuresThisMonth: 0,
      pendingLeaveRequests: pendingLeaves,
      openPositions,
      attendanceToday: { present, absent, onLeave: leaveCount, late: 0 },
      departmentCount: deptCount,
      pendingExpenseClaims: pendingExpenses,
      pendingOvertimeRequests: pendingOvertime,
      openTickets,
      upcomingEvents: holidaysCount,
      headcountByDepartment: byDept.map((d) => ({
        departmentId: d.id,
        departmentName: d.name,
        count: d._count.employees,
      })),
      headcountByEmploymentType: byEmpType.map((e) => ({
        type: e.employmentType,
        count: e._count,
      })),
      recentNewHires: recentHires.map((h) => ({
        ...h,
        dateOfJoining: h.dateOfJoining.toISOString(),
      })),
      upcomingBirthdays: [],
      upcomingAnniversaries: [],
    };
  }

  async getHeadcountAnalytics(tenantId: string) {
    const [byDepartment, byEmploymentType, byStatus, byDesignation, total] =
      await Promise.all([
        prisma.department.findMany({
          where: { tenantId },
          include: {
            _count: { select: { employees: { where: { deletedAt: null } } } },
          },
        }),
        prisma.employee.groupBy({
          by: ["employmentType"],
          where: { tenantId, deletedAt: null },
          _count: true,
        }),
        prisma.employee.groupBy({
          by: ["status"],
          where: { tenantId, deletedAt: null },
          _count: true,
        }),
        prisma.employee.groupBy({
          by: ["designation"],
          where: { tenantId, deletedAt: null, designation: { not: null } },
          _count: true,
        }),
        prisma.employee.count({ where: { tenantId, deletedAt: null } }),
      ]);

    // Fixed table, fixed shape, tenantId is the only variable — no reason for the
    // Unsafe variant. docs/ai/ARCHITECTURE_REVIEW.md § F12.
    const joinedByMonth = await prisma.$queryRaw<
      Array<{ month: string; count: bigint }>
    >`SELECT TO_CHAR(date_of_joining, 'YYYY-MM') as month, COUNT(*)::int as count
      FROM employees
      WHERE tenant_id = ${tenantId} AND deleted_at IS NULL AND date_of_joining IS NOT NULL
      GROUP BY month ORDER BY month`;

    return {
      total,
      byDepartment: byDepartment.map((d) => ({
        departmentId: d.id,
        departmentName: d.name,
        count: d._count.employees,
      })),
      byEmploymentType: byEmploymentType.map((e) => ({
        type: e.employmentType,
        count: e._count,
      })),
      byStatus: byStatus.map((s) => ({ status: s.status, count: s._count })),
      byDesignation: byDesignation.map((d) => ({
        designation: d.designation,
        count: d._count,
      })),
      joinedByMonth: Array.isArray(joinedByMonth)
        ? joinedByMonth.map((r: any) => ({
            month: r.month,
            count: Number(r.count),
          }))
        : [],
      tenureDistribution: [],
    };
  }

  async getPayrollAnalytics(tenantId: string) {
    const structures = await prisma.salaryStructure.findMany({
      where: { tenantId },
    });
    const runs = await prisma.payrollRun.findMany({
      where: { tenantId },
      orderBy: { periodStart: "desc" },
      take: 12,
    });
    const slips = await prisma.payrollSlip.findMany({
      where: { tenantId, payrollRunId: { in: runs.map((r) => r.id) } },
    });
    const totalPayroll = runs.reduce((s, r) => s + Number(r.totalNet), 0);
    return {
      totalSalaryStructures: structures.length,
      averageSalary:
        structures.length > 0
          ? structures.reduce((s, r) => s + Number(r.baseSalary), 0) /
            structures.length
          : 0,
      totalPayrollProcessed: totalPayroll,
      payrollRuns: runs.map((r) => ({
        id: r.id,
        periodStart: r.periodStart,
        periodEnd: r.periodEnd,
        status: r.status,
        totalNet: r.totalNet,
      })),
      monthsProcessed: runs.length,
      totalSlips: slips.length,
    };
  }

  async getAttendanceAnalytics(
    tenantId: string,
    startDate?: string,
    endDate?: string,
  ) {
    const where: any = { tenantId };
    if (startDate) where.date = { gte: new Date(startDate) };
    if (endDate) where.date = { ...where.date, lte: new Date(endDate) };

    const byStatus = await prisma.attendanceRecord.groupBy({
      by: ["status"],
      where,
      _count: true,
    });
    const total = await prisma.attendanceRecord.count({ where });
    const byDate = await prisma.attendanceRecord.groupBy({
      by: ["date", "status"],
      where,
      _count: true,
      orderBy: { date: "asc" },
    });

    return {
      total,
      byStatus: byStatus.map((s) => ({ status: s.status, count: s._count })),
      dailyTrend: Array.isArray(byDate)
        ? byDate.map((r: any) => ({
            date: r.date,
            status: r.status,
            count: r._count,
          }))
        : [],
      overallAttendanceRate:
        total > 0
          ? Math.round(
              ((byStatus.find((s) => s.status === "PRESENT")?._count || 0) /
                total) *
                100,
            )
          : 0,
    };
  }

  async getLeaveAnalytics(tenantId: string, year?: number) {
    const targetYear = year || new Date().getFullYear();
    const where: any = {
      tenantId,
      startDate: {
        gte: new Date(targetYear, 0, 1),
        lte: new Date(targetYear, 11, 31),
      },
    };
    const requests = await prisma.leaveRequest.findMany({
      where,
      include: { policy: true },
    });
    const byType = new Map<
      string,
      {
        name: string;
        total: number;
        approved: number;
        pending: number;
        rejected: number;
      }
    >();
    for (const r of requests) {
      const key = r.policyId;
      if (!byType.has(key)) {
        byType.set(key, {
          name: r.policy.name,
          total: 0,
          approved: 0,
          pending: 0,
          rejected: 0,
        });
      }
      const entry = byType.get(key)!;
      entry.total++;
      if (r.status === "APPROVED") entry.approved++;
      else if (r.status === "PENDING") entry.pending++;
      else if (r.status === "REJECTED") entry.rejected++;
    }
    return {
      year: targetYear,
      totalRequests: requests.length,
      approvedRate:
        requests.length > 0
          ? Math.round(
              (requests.filter((r) => r.status === "APPROVED").length /
                requests.length) *
                100,
            )
          : 0,
      byType: Array.from(byType.values()),
      monthlyTrend: [],
    };
  }

  async getRecruitmentAnalytics(tenantId: string) {
    const [postings, applicants, interviews] = await Promise.all([
      prisma.jobPosting.findMany({
        where: { tenantId },
        select: { id: true, title: true, status: true },
      }),
      prisma.applicant.findMany({ where: { tenantId } }),
      prisma.interview.findMany({ where: { tenantId } }),
    ]);
    return {
      totalPostings: postings.length,
      openPostings: postings.filter((p) => p.status === "OPEN").length,
      totalApplicants: applicants.length,
      applicantsByStage: [
        "APPLIED",
        "SCREENING",
        "INTERVIEW",
        "OFFER",
        "HIRED",
        "REJECTED",
      ].map((stage) => ({
        stage,
        count: applicants.filter((a) => a.currentStage === stage).length,
      })),
      hiredCount: applicants.filter((a) => a.status === "HIRED").length,
      totalInterviews: interviews.length,
      completedInterviews: interviews.filter((i) => i.status === "COMPLETED")
        .length,
      conversionRate:
        applicants.length > 0
          ? Math.round(
              (applicants.filter((a) => a.status === "HIRED").length /
                applicants.length) *
                100,
            )
          : 0,
    };
  }

  async getTrainingAnalytics(tenantId: string) {
    const [trainings, enrollments] = await Promise.all([
      prisma.training.findMany({ where: { tenantId } }),
      prisma.trainingEnrollment.findMany({ where: { tenantId } }),
    ]);
    return {
      totalTrainings: trainings.length,
      activeTrainings: trainings.filter(
        (t) => t.startDate <= new Date() && t.endDate >= new Date(),
      ).length,
      totalEnrollments: enrollments.length,
      completedEnrollments: enrollments.filter((e) => e.status === "COMPLETED")
        .length,
      completionRate:
        enrollments.length > 0
          ? Math.round(
              (enrollments.filter((e) => e.status === "COMPLETED").length /
                enrollments.length) *
                100,
            )
          : 0,
      cancelledEnrollments: enrollments.filter((e) => e.status === "CANCELLED")
        .length,
    };
  }

  async getTurnoverAnalytics(tenantId: string, months: number = 12) {
    const since = new Date();
    since.setMonth(since.getMonth() - months);
    const [joined, left, total] = await Promise.all([
      prisma.employee.count({
        where: { tenantId, deletedAt: null, dateOfJoining: { gte: since } },
      }),
      prisma.employee.count({
        where: { tenantId, deletedAt: null, dateOfLeaving: { gte: since } },
      }),
      prisma.employee.count({ where: { tenantId, deletedAt: null } }),
    ]);
    const separations = await prisma.employeeSeparation.findMany({
      where: { tenantId, createdAt: { gte: since } },
    });
    const byType = new Map<string, number>();
    for (const s of separations) {
      byType.set(s.separationType, (byType.get(s.separationType) || 0) + 1);
    }
    return {
      periodMonths: months,
      newHires: joined,
      departures: left,
      totalEmployees: total,
      turnoverRate: total > 0 ? Math.round((left / total) * 100) : 0,
      voluntaryTurnover: separations.filter(
        (s) => s.separationType === "RESIGNATION",
      ).length,
      involuntaryTurnover: separations.filter(
        (s) =>
          s.separationType === "TERMINATION" || s.separationType === "LAYOFF",
      ).length,
      bySeparationType: Array.from(byType.entries()).map(([type, count]) => ({
        type,
        count,
      })),
      monthlyTrend: [],
    };
  }

  async getHrAnalyticsSummary(tenantId: string) {
    const [
      headcount,
      payroll,
      attendance,
      leave,
      recruitment,
      training,
      turnover,
    ] = await Promise.all([
      this.getHeadcountAnalytics(tenantId),
      this.getPayrollAnalytics(tenantId),
      this.getAttendanceAnalytics(tenantId),
      this.getLeaveAnalytics(tenantId),
      this.getRecruitmentAnalytics(tenantId),
      this.getTrainingAnalytics(tenantId),
      this.getTurnoverAnalytics(tenantId),
    ]);
    return {
      headcount,
      payroll,
      attendance,
      leave,
      recruitment,
      training,
      turnover,
    };
  }

  async getBirthdayReport(tenantId: string, month?: number) {
    const targetMonth = month !== undefined ? month : new Date().getMonth() + 1;
    const employees = await prisma.employee.findMany({
      where: { tenantId, deletedAt: null, dateOfBirth: { not: null } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        designation: true,
        departmentId: true,
        dateOfBirth: true,
      },
    });
    return employees
      .filter(
        (e) => e.dateOfBirth && e.dateOfBirth.getMonth() + 1 === targetMonth,
      )
      .map((e) => ({ ...e, dateOfBirth: e.dateOfBirth!.toISOString() }))
      .sort(
        (a, b) =>
          new Date(a.dateOfBirth).getDate() - new Date(b.dateOfBirth).getDate(),
      );
  }

  async getAnniversaryReport(tenantId: string, month?: number) {
    const targetMonth = month !== undefined ? month : new Date().getMonth() + 1;
    const employees = await prisma.employee.findMany({
      where: { tenantId, deletedAt: null },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        designation: true,
        departmentId: true,
        dateOfJoining: true,
      },
    });
    const now = new Date();
    return employees
      .filter((e) => e.dateOfJoining.getMonth() + 1 === targetMonth)
      .map((e) => ({
        ...e,
        dateOfJoining: e.dateOfJoining.toISOString(),
        yearsOfService: now.getFullYear() - e.dateOfJoining.getFullYear(),
      }))
      .sort(
        (a, b) =>
          new Date(a.dateOfJoining).getDate() -
          new Date(b.dateOfJoining).getDate(),
      );
  }

  async getGenderDistribution(_tenantId: string) {
    return {
      message:
        "Gender distribution requires employee gender field. Add via custom fields.",
    };
  }

  async getAgeDistribution(tenantId: string) {
    const employees = await prisma.employee.findMany({
      where: { tenantId, deletedAt: null, dateOfBirth: { not: null } },
      select: { dateOfBirth: true },
    });
    const now = new Date();
    const buckets = {
      "18-25": 0,
      "26-35": 0,
      "36-45": 0,
      "46-55": 0,
      "55+": 0,
    };
    for (const e of employees) {
      const age = now.getFullYear() - e.dateOfBirth!.getFullYear();
      if (age <= 25) buckets["18-25"]++;
      else if (age <= 35) buckets["26-35"]++;
      else if (age <= 45) buckets["36-45"]++;
      else if (age <= 55) buckets["46-55"]++;
      else buckets["55+"]++;
    }
    return { totalWithBirthDate: employees.length, buckets };
  }

  async getTenureDistribution(tenantId: string) {
    const employees = await prisma.employee.findMany({
      where: { tenantId, deletedAt: null },
      select: { dateOfJoining: true },
    });
    const now = new Date();
    const buckets = {
      "<1 year": 0,
      "1-2 years": 0,
      "2-5 years": 0,
      "5-10 years": 0,
      "10+ years": 0,
    };
    for (const e of employees) {
      const years =
        (now.getTime() - e.dateOfJoining.getTime()) /
        (365.25 * 24 * 60 * 60 * 1000);
      if (years < 1) buckets["<1 year"]++;
      else if (years < 2) buckets["1-2 years"]++;
      else if (years < 5) buckets["2-5 years"]++;
      else if (years < 10) buckets["5-10 years"]++;
      else buckets["10+ years"]++;
    }
    return { total: employees.length, buckets };
  }

  async getDepartmentSalaryAnalytics(tenantId: string) {
    const departments = await prisma.department.findMany({
      where: { tenantId },
      include: {
        employees: { where: { deletedAt: null }, select: { id: true } },
      },
    });
    const allStructures = await prisma.salaryStructure.findMany({
      where: { tenantId },
    });
    const salaryByEmployee = new Map<string, number>();
    for (const s of allStructures) {
      salaryByEmployee.set(s.employeeId, Number(s.baseSalary));
    }
    return departments.map((dept) => {
      const empIds = dept.employees.map((e) => e.id);
      const salaries = empIds
        .map((id) => salaryByEmployee.get(id))
        .filter((v): v is number => v !== undefined);
      const totalSalary = salaries.reduce((s, v) => s + v, 0);
      return {
        departmentId: dept.id,
        departmentName: dept.name,
        headcount: dept.employees.length,
        totalSalary,
        averageSalary:
          salaries.length > 0 ? Math.round(totalSalary / salaries.length) : 0,
        minSalary: salaries.length > 0 ? Math.min(...salaries) : 0,
        maxSalary: salaries.length > 0 ? Math.max(...salaries) : 0,
      };
    });
  }
}
