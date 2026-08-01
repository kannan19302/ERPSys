import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class HrExperienceService {
  // ══════════════════════════════════════════════════════════════
  // RECOGNITION AWARDS
  // ══════════════════════════════════════════════════════════════

  async getRecognitionAwards(tenantId: string, category?: string) {
    const where: any = { tenantId };
    if (category) where.category = category;
    return (
      (prisma as any).employeeRecognitionAward?.findMany({
        where,
        orderBy: { name: "asc" },
      }) || []
    );
  }

  async getRecognitionAwardById(tenantId: string, id: string) {
    const item = await (prisma as any).employeeRecognitionAward?.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("Recognition award not found");
    return item;
  }

  async createRecognitionAward(tenantId: string, dto: any) {
    return (prisma as any).employeeRecognitionAward?.create({
      data: {
        tenantId,
        name: dto.name,
        description: dto.description || null,
        category: dto.category || "VALUE_BASED",
        points: dto.points || 100,
        iconUrl: dto.iconUrl || null,
        isActive: dto.isActive !== false,
      },
    });
  }

  async updateRecognitionAward(tenantId: string, id: string, dto: any) {
    const item = await (prisma as any).employeeRecognitionAward?.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("Recognition award not found");
    return (prisma as any).employeeRecognitionAward?.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        category: dto.category,
        points: dto.points,
        iconUrl: dto.iconUrl,
        isActive: dto.isActive,
      },
    });
  }

  async deleteRecognitionAward(tenantId: string, id: string) {
    const item = await (prisma as any).employeeRecognitionAward?.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("Recognition award not found");
    await (prisma as any).employeeRecognitionAward?.delete({ where: { id } });
    return { success: true };
  }

  // ══════════════════════════════════════════════════════════════
  // EMPLOYEE RECOGNITIONS
  // ══════════════════════════════════════════════════════════════

  async getRecognitions(
    tenantId: string,
    params: {
      page?: number;
      limit?: number;
      employeeId?: string;
      category?: string;
    } = {},
  ) {
    const where: any = { tenantId };
    if (params.employeeId) where.employeeId = params.employeeId;
    if (params.category) where.category = params.category;
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;
    const p = prisma as any;
    const [items, total] = await Promise.all([
      p.employeeRecognition
        ? p.employeeRecognition.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
            include: {
              award: { select: { id: true, name: true, iconUrl: true } },
            },
          })
        : Promise.resolve([]),
      p.employeeRecognition
        ? p.employeeRecognition.count({ where })
        : Promise.resolve(0),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getRecognitionById(tenantId: string, id: string) {
    const item = await (prisma as any).employeeRecognition?.findFirst({
      where: { id, tenantId },
      include: { award: { select: { id: true, name: true, iconUrl: true } } },
    });
    if (!item) throw new NotFoundException("Recognition not found");
    return item;
  }

  async createRecognition(tenantId: string, dto: any) {
    return (prisma as any).employeeRecognition?.create({
      data: {
        tenantId,
        employeeId: dto.employeeId,
        awardId: dto.awardId || null,
        recognizedBy: dto.recognizedBy,
        category: dto.category || "PEER",
        title: dto.title,
        message: dto.message || null,
        points: dto.points || 0,
        isPublic: dto.isPublic !== false,
      },
    });
  }

  async updateRecognition(tenantId: string, id: string, dto: any) {
    const item = await (prisma as any).employeeRecognition?.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("Recognition not found");
    return (prisma as any).employeeRecognition?.update({
      where: { id },
      data: {
        title: dto.title,
        message: dto.message,
        category: dto.category,
        points: dto.points,
        isPublic: dto.isPublic,
        awardId: dto.awardId,
      },
    });
  }

  async deleteRecognition(tenantId: string, id: string) {
    const item = await (prisma as any).employeeRecognition?.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("Recognition not found");
    await (prisma as any).employeeRecognition?.delete({ where: { id } });
    return { success: true };
  }

  async getRecognitionFeed(tenantId: string, limit = 50) {
    return (
      (prisma as any).employeeRecognition?.findMany({
        where: { tenantId, isPublic: true },
        orderBy: { createdAt: "desc" },
        take: limit,
        include: { award: { select: { id: true, name: true, iconUrl: true } } },
      }) || []
    );
  }

  // ══════════════════════════════════════════════════════════════
  // WELLNESS CHALLENGES
  // ══════════════════════════════════════════════════════════════

  async getWellnessChallenges(
    tenantId: string,
    challengeType?: string,
    isActive?: boolean,
  ) {
    const where: any = { tenantId };
    if (challengeType) where.challengeType = challengeType;
    if (isActive !== undefined) where.isActive = isActive;
    return (
      (prisma as any).wellnessChallenge?.findMany({
        where,
        orderBy: { startDate: "desc" },
        include: { _count: { select: { leaderboard: true } } },
      }) || []
    );
  }

  async getWellnessChallengeById(tenantId: string, id: string) {
    const item = await (prisma as any).wellnessChallenge?.findFirst({
      where: { id, tenantId },
      include: { leaderboard: { orderBy: { rank: "asc" } } },
    });
    if (!item) throw new NotFoundException("Wellness challenge not found");
    return item;
  }

  async createWellnessChallenge(tenantId: string, dto: any) {
    return (prisma as any).wellnessChallenge?.create({
      data: {
        tenantId,
        name: dto.name,
        description: dto.description || null,
        challengeType: dto.challengeType,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        goalMetric: dto.goalMetric,
        goalValue: dto.goalValue,
        isTeamBased: dto.isTeamBased || false,
        isActive: dto.isActive !== false,
      },
    });
  }

  async updateWellnessChallenge(tenantId: string, id: string, dto: any) {
    const item = await (prisma as any).wellnessChallenge?.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("Wellness challenge not found");
    return (prisma as any).wellnessChallenge?.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        challengeType: dto.challengeType,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        goalMetric: dto.goalMetric,
        goalValue: dto.goalValue,
        isTeamBased: dto.isTeamBased,
        isActive: dto.isActive,
      },
    });
  }

  async deleteWellnessChallenge(tenantId: string, id: string) {
    const item = await (prisma as any).wellnessChallenge?.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("Wellness challenge not found");
    await (prisma as any).wellnessChallenge?.delete({ where: { id } });
    return { success: true };
  }

  async getLeaderboard(tenantId: string, challengeId: string) {
    const challenge = await (prisma as any).wellnessChallenge?.findFirst({
      where: { id: challengeId, tenantId },
    });
    if (!challenge) throw new NotFoundException("Wellness challenge not found");
    return (
      (prisma as any).wellnessLeaderboard?.findMany({
        where: { tenantId, challengeId },
        orderBy: { rank: "asc" },
      }) || []
    );
  }

  // ══════════════════════════════════════════════════════════════
  // eNPS SURVEYS
  // ══════════════════════════════════════════════════════════════

  async getENPSurveys(tenantId: string, startDate?: string, endDate?: string) {
    const where: any = { tenantId };
    if (startDate) where.startDate = { gte: new Date(startDate) };
    if (endDate) where.endDate = { lte: new Date(endDate) };
    return (
      (prisma as any).eNPSurvey?.findMany({
        where,
        orderBy: { createdAt: "desc" },
      }) || []
    );
  }

  async getENPSurveyById(tenantId: string, id: string) {
    const item = await (prisma as any).eNPSurvey?.findFirst({
      where: { id, tenantId },
      include: { responses: { orderBy: { createdAt: "desc" } } },
    });
    if (!item) throw new NotFoundException("eNPS survey not found");
    return item;
  }

  async createENPSurvey(tenantId: string, dto: any) {
    return (prisma as any).eNPSurvey?.create({
      data: {
        tenantId,
        title: dto.title,
        description: dto.description || null,
        surveyType: "ENPS",
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        isActive: dto.isActive !== false,
      },
    });
  }

  async updateENPSurvey(tenantId: string, id: string, dto: any) {
    const item = await (prisma as any).eNPSurvey?.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("eNPS survey not found");
    return (prisma as any).eNPSurvey?.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        isActive: dto.isActive,
      },
    });
  }

  async deleteENPSurvey(tenantId: string, id: string) {
    const item = await (prisma as any).eNPSurvey?.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("eNPS survey not found");
    await (prisma as any).eNPSurvey?.delete({ where: { id } });
    return { success: true };
  }

  async launchENPSurvey(tenantId: string, id: string) {
    const item = await (prisma as any).eNPSurvey?.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("eNPS survey not found");
    if (item.isActive)
      throw new BadRequestException("eNPS survey is already active");
    return (prisma as any).eNPSurvey?.update({
      where: { id },
      data: { isActive: true },
    });
  }

  async getENPSDashboard(tenantId: string) {
    const surveys =
      (await (prisma as any).eNPSurvey?.findMany({
        where: { tenantId },
        include: { _count: { select: { responses: true } } },
        orderBy: { startDate: "desc" },
      })) || [];

    const totalEmployees = await prisma.employee.count({
      where: { tenantId, deletedAt: null, status: "ACTIVE" },
    });
    const totalResponses = surveys.reduce(
      (s: number, sv: any) => s + (sv._count?.responses || 0),
      0,
    );
    const totalSurveys = surveys.length;
    const completedSurveys = surveys.filter(
      (sv: any) => new Date(sv.endDate) < new Date(),
    ).length;

    const avgScores = surveys
      .filter((sv: any) => sv.avgScore !== null)
      .map((sv: any) => ({
        surveyId: sv.id,
        title: sv.title,
        avgScore: Number(sv.avgScore),
        endDate: sv.endDate,
      }));

    const allResponses =
      (await (prisma as any).surveyResponse?.findMany({
        where: { tenantId, surveyType: "ENP_SURVEY" },
      })) || [];
    const promoters = allResponses.filter(
      (r: any) => (r.score || r.rating || 0) >= 9,
    ).length;
    const passives = allResponses.filter(
      (r: any) =>
        (r.score || r.rating || 0) >= 7 && (r.score || r.rating || 0) <= 8,
    ).length;
    const detractors = allResponses.filter(
      (r: any) => (r.score || r.rating || 0) <= 6,
    ).length;
    const totalScored = promoters + passives + detractors;
    const enpsScore =
      totalScored > 0
        ? Math.round(((promoters - detractors) / totalScored) * 100)
        : 0;

    return {
      totalSurveys,
      completedSurveys,
      totalResponses,
      responseRate:
        totalEmployees > 0
          ? Math.round(
              (totalResponses / (totalSurveys * totalEmployees || 1)) * 100,
            )
          : 0,
      enpsScore,
      avgScoresOverTime: avgScores,
      breakdown: { promoters, passives, detractors, totalScored },
      promotersPct:
        totalScored > 0 ? Math.round((promoters / totalScored) * 100) : 0,
      detractorsPct:
        totalScored > 0 ? Math.round((detractors / totalScored) * 100) : 0,
    };
  }

  // ══════════════════════════════════════════════════════════════
  // PULSE SURVEYS
  // ══════════════════════════════════════════════════════════════

  async getPulseSurveys(
    tenantId: string,
    frequency?: string,
    departmentId?: string,
  ) {
    const where: any = { tenantId };
    if (frequency) where.frequency = frequency;
    if (departmentId) where.departmentId = departmentId;
    return (
      (prisma as any).pulseSurvey?.findMany({
        where,
        orderBy: { createdAt: "desc" },
      }) || []
    );
  }

  async getPulseSurveyById(tenantId: string, id: string) {
    const item = await (prisma as any).pulseSurvey?.findFirst({
      where: { id, tenantId },
      include: { responses: { orderBy: { createdAt: "desc" } } },
    });
    if (!item) throw new NotFoundException("Pulse survey not found");
    return item;
  }

  async createPulseSurvey(tenantId: string, dto: any) {
    return (prisma as any).pulseSurvey?.create({
      data: {
        tenantId,
        title: dto.title,
        description: dto.description || null,
        frequency: dto.frequency || "MONTHLY",
        questions: dto.questions || [],
        departmentId: dto.departmentId || null,
        isActive: dto.isActive !== false,
      },
    });
  }

  async updatePulseSurvey(tenantId: string, id: string, dto: any) {
    const item = await (prisma as any).pulseSurvey?.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("Pulse survey not found");
    return (prisma as any).pulseSurvey?.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        frequency: dto.frequency,
        questions: dto.questions,
        departmentId: dto.departmentId,
        isActive: dto.isActive,
      },
    });
  }

  async deletePulseSurvey(tenantId: string, id: string) {
    const item = await (prisma as any).pulseSurvey?.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("Pulse survey not found");
    await (prisma as any).pulseSurvey?.delete({ where: { id } });
    return { success: true };
  }

  async sendPulseSurvey(tenantId: string, id: string) {
    const item = await (prisma as any).pulseSurvey?.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("Pulse survey not found");
    return (prisma as any).pulseSurvey?.update({
      where: { id },
      data: { lastSentAt: new Date() },
    });
  }

  // ══════════════════════════════════════════════════════════════
  // SURVEY RESPONSES
  // ══════════════════════════════════════════════════════════════

  async submitSurveyResponse(tenantId: string, dto: any) {
    const existing = await (prisma as any).surveyResponse?.findFirst({
      where: {
        tenantId,
        surveyId: dto.surveyId,
        surveyType: dto.surveyType,
        employeeId: dto.employeeId,
      },
    });
    if (existing)
      throw new BadRequestException(
        "Employee has already submitted a response to this survey",
      );

    const response = await (prisma as any).surveyResponse?.create({
      data: {
        tenantId,
        surveyId: dto.surveyId,
        surveyType: dto.surveyType,
        employeeId: dto.employeeId,
        responses: dto.responses || {},
        score: dto.score || null,
        comments: dto.comments || null,
        isAnonymous: dto.isAnonymous !== false,
      },
    });

    if (dto.surveyType === "ENP_SURVEY" && dto.score !== undefined) {
      const allResponses =
        (await (prisma as any).surveyResponse?.findMany({
          where: {
            tenantId,
            surveyId: dto.surveyId,
            surveyType: "ENP_SURVEY",
            score: { not: null },
          },
        })) || [];
      const avgScore =
        allResponses.length > 0
          ? allResponses.reduce(
              (s: number, r: any) => s + (r.score || r.rating || 0),
              0,
            ) / allResponses.length
          : 0;
      if ((prisma as any).eNPSurvey) {
        await (prisma as any).eNPSurvey.update({
          where: { id: dto.surveyId },
          data: {
            responseCount: allResponses.length,
            avgScore: Math.round(avgScore * 100) / 100,
          },
        });
      }
    }

    return response;
  }

  async getSurveyResponses(tenantId: string, surveyId: string) {
    return (
      (prisma as any).surveyResponse?.findMany({
        where: { tenantId, surveyId },
        orderBy: { createdAt: "desc" },
      }) || []
    );
  }

  async getResponseAnalytics(tenantId: string, surveyId: string) {
    const responses =
      (await (prisma as any).surveyResponse?.findMany({
        where: { tenantId, surveyId },
      })) || [];
    const scored = responses.filter(
      (r: any) => r.score !== undefined || r.rating !== undefined,
    );
    const avgScore =
      scored.length > 0
        ? Math.round(
            (scored.reduce(
              (s: number, r: any) => s + (r.score || r.rating || 0),
              0,
            ) /
              scored.length) *
              100,
          ) / 100
        : 0;

    const distribution: Record<number, number> = {};
    for (const r of scored) {
      const s = r.score || r.rating || 0;
      distribution[s] = (distribution[s] || 0) + 1;
    }

    return {
      totalResponses: responses.length,
      avgScore,
      scoredResponses: scored.length,
      distribution: Object.entries(distribution).map(([score, count]) => ({
        score: Number(score),
        count,
      })),
    };
  }

  // ══════════════════════════════════════════════════════════════
  // EMPLOYEE JOURNEY MILESTONES
  // ══════════════════════════════════════════════════════════════

  async getJourneyMilestones(
    tenantId: string,
    employeeId?: string,
    milestoneType?: string,
  ) {
    const where: any = { tenantId };
    if (employeeId) where.employeeId = employeeId;
    if (milestoneType) where.milestoneType = milestoneType;
    return (
      (prisma as any).employeeJourneyMilestone?.findMany({
        where,
        orderBy: { milestoneDate: "asc" },
      }) || []
    );
  }

  async getJourneyMilestoneById(tenantId: string, id: string) {
    const item = await (prisma as any).employeeJourneyMilestone?.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("Journey milestone not found");
    return item;
  }

  async createJourneyMilestone(tenantId: string, dto: any) {
    return (prisma as any).employeeJourneyMilestone.create({
      data: {
        tenantId,
        employeeId: dto.employeeId,
        milestoneType: dto.milestoneType,
        title: dto.title,
        description: dto.description || null,
        milestoneDate: new Date(dto.milestoneDate),
        isCompleted: dto.isCompleted || false,
        completedAt: dto.completedAt ? new Date(dto.completedAt) : null,
      },
    });
  }

  async updateJourneyMilestone(tenantId: string, id: string, dto: any) {
    const item = await (prisma as any).employeeJourneyMilestone.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("Journey milestone not found");
    return (prisma as any).employeeJourneyMilestone.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        milestoneType: dto.milestoneType,
        milestoneDate: dto.milestoneDate
          ? new Date(dto.milestoneDate)
          : undefined,
        isCompleted: dto.isCompleted,
        completedAt: dto.completedAt ? new Date(dto.completedAt) : undefined,
      },
    });
  }

  async deleteJourneyMilestone(tenantId: string, id: string) {
    const item = await (prisma as any).employeeJourneyMilestone.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("Journey milestone not found");
    await (prisma as any).employeeJourneyMilestone.delete({ where: { id } });
    return { success: true };
  }

  async completeJourneyMilestone(tenantId: string, id: string) {
    const item = await (prisma as any).employeeJourneyMilestone.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("Journey milestone not found");
    if (item.isCompleted)
      throw new BadRequestException("Milestone is already completed");
    return (prisma as any).employeeJourneyMilestone.update({
      where: { id },
      data: { isCompleted: true, completedAt: new Date() },
    });
  }

  // ══════════════════════════════════════════════════════════════
  // ALUMNI RECORDS
  // ══════════════════════════════════════════════════════════════

  async getAlumniRecords(
    tenantId: string,
    isActiveAlumni?: boolean,
    search?: string,
  ) {
    const where: any = { tenantId };
    if (isActiveAlumni !== undefined) where.isActiveAlumni = isActiveAlumni;
    if (search)
      where.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { lastPosition: { contains: search, mode: "insensitive" } },
      ];
    return (prisma as any).alumniRecord
      ? (prisma as any).alumniRecord.findMany({
          where,
          orderBy: { employmentEnd: "desc" },
          include: { _count: { select: { events: true } } },
        })
      : [];
  }

  async getAlumniRecordById(tenantId: string, id: string) {
    const item = (prisma as any).alumniRecord
      ? await (prisma as any).alumniRecord.findFirst({
          where: { id, tenantId },
          include: { events: { orderBy: { eventDate: "desc" } } },
        })
      : null;
    if (!item) throw new NotFoundException("Alumni record not found");
    return item;
  }

  async createAlumniRecord(tenantId: string, dto: any) {
    const existing = (prisma as any).alumniRecord
      ? await (prisma as any).alumniRecord.findFirst({
          where: { tenantId, employeeId: dto.employeeId },
        })
      : null;
    if (existing)
      throw new BadRequestException(
        "Alumni record already exists for this employee",
      );
    return (prisma as any).alumniRecord.create({
      data: {
        tenantId,
        employeeId: dto.employeeId,
        lastPosition: dto.lastPosition,
        lastDepartment: dto.lastDepartment || null,
        employmentStart: new Date(dto.employmentStart),
        employmentEnd: new Date(dto.employmentEnd),
        email: dto.email,
        phone: dto.phone || null,
        linkedInUrl: dto.linkedInUrl || null,
        isActiveAlumni: dto.isActiveAlumni !== false,
        notes: dto.notes || null,
      },
    });
  }

  async updateAlumniRecord(tenantId: string, id: string, dto: any) {
    const item = await (prisma as any).alumniRecord.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("Alumni record not found");
    return (prisma as any).alumniRecord.update({
      where: { id },
      data: {
        lastPosition: dto.lastPosition,
        lastDepartment: dto.lastDepartment,
        email: dto.email,
        phone: dto.phone,
        linkedInUrl: dto.linkedInUrl,
        isActiveAlumni: dto.isActiveAlumni,
        notes: dto.notes,
      },
    });
  }

  async deleteAlumniRecord(tenantId: string, id: string) {
    const item = await (prisma as any).alumniRecord.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("Alumni record not found");
    await (prisma as any).alumniRecord.delete({ where: { id } });
    return { success: true };
  }

  // ══════════════════════════════════════════════════════════════
  // ALUMNI EVENTS
  // ══════════════════════════════════════════════════════════════

  async getAlumniEvents(
    tenantId: string,
    startDate?: string,
    endDate?: string,
  ) {
    const where: any = { tenantId };
    if (startDate)
      where.eventDate = {
        ...(where.eventDate || {}),
        gte: new Date(startDate),
      };
    if (endDate)
      where.eventDate = { ...(where.eventDate || {}), lte: new Date(endDate) };
    return (prisma as any).alumniEvent
      ? (prisma as any).alumniEvent.findMany({
          where,
          orderBy: { eventDate: "desc" },
          include: { _count: { select: { attendees: true } } },
        })
      : [];
  }

  async getAlumniEventById(tenantId: string, id: string) {
    const item = (prisma as any).alumniEvent
      ? await (prisma as any).alumniEvent.findFirst({
          where: { id, tenantId },
          include: {
            attendees: {
              include: {
                alumni: {
                  select: { id: true, email: true, lastPosition: true },
                },
              },
            },
          },
        })
      : null;
    if (!item) throw new NotFoundException("Alumni event not found");
    return item;
  }

  async createAlumniEvent(tenantId: string, dto: any) {
    return (prisma as any).alumniEvent.create({
      data: {
        tenantId,
        organizerId: dto.organizerId || null,
        name: dto.name,
        description: dto.description || null,
        eventDate: new Date(dto.eventDate),
        location: dto.location || null,
        eventType: dto.eventType || "NETWORKING",
        maxAttendees: dto.maxAttendees || null,
      },
    });
  }

  async updateAlumniEvent(tenantId: string, id: string, dto: any) {
    const item = await (prisma as any).alumniEvent.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("Alumni event not found");
    return (prisma as any).alumniEvent.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        eventDate: dto.eventDate ? new Date(dto.eventDate) : undefined,
        location: dto.location,
        eventType: dto.eventType,
        maxAttendees: dto.maxAttendees,
      },
    });
  }

  async deleteAlumniEvent(tenantId: string, id: string) {
    const item = await (prisma as any).alumniEvent.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("Alumni event not found");
    await (prisma as any).alumniEvent.delete({ where: { id } });
    return { success: true };
  }

  // ══════════════════════════════════════════════════════════════
  // ALUMNI EVENT ATTENDANCE
  // ══════════════════════════════════════════════════════════════

  async getAlumniEventAttendees(tenantId: string, eventId: string) {
    return (prisma as any).alumniEventAttendee
      ? (prisma as any).alumniEventAttendee.findMany({
          where: { tenantId, eventId },
          include: {
            alumni: {
              select: {
                id: true,
                email: true,
                lastPosition: true,
                phone: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        })
      : [];
  }

  async rsvpAlumniEvent(tenantId: string, eventId: string, alumniId: string) {
    const event = (prisma as any).alumniEvent
      ? await (prisma as any).alumniEvent.findFirst({
          where: { id: eventId, tenantId },
        })
      : null;
    if (!event) throw new NotFoundException("Alumni event not found");

    if (event.maxAttendees && (prisma as any).alumniEventAttendee) {
      const count = await (prisma as any).alumniEventAttendee.count({
        where: { tenantId, eventId },
      });
      if (count >= event.maxAttendees)
        throw new BadRequestException("Event has reached maximum attendees");
    }

    const existing = (prisma as any).alumniEventAttendee
      ? await (prisma as any).alumniEventAttendee.findFirst({
          where: { tenantId, eventId, alumniId },
        })
      : null;
    if (existing) throw new BadRequestException("Already RSVPed to this event");

    return (prisma as any).alumniEventAttendee.create({
      data: {
        tenantId,
        eventId,
        alumniId,
        rsvpStatus: "CONFIRMED",
        attended: false,
      },
    });
  }

  async checkInAlumniEvent(
    tenantId: string,
    eventId: string,
    alumniId: string,
  ) {
    const attendee = (prisma as any).alumniEventAttendee
      ? await (prisma as any).alumniEventAttendee.findFirst({
          where: { tenantId, eventId, alumniId },
        })
      : null;
    if (!attendee)
      throw new NotFoundException("Attendee not found for this event");
    if (attendee.attended) throw new BadRequestException("Already checked in");
    return (prisma as any).alumniEventAttendee.update({
      where: { id: attendee.id },
      data: { attended: true, rsvpStatus: "ATTENDED" },
    });
  }

  // ══════════════════════════════════════════════════════════════
  // EXPERIENCE DASHBOARD
  // ══════════════════════════════════════════════════════════════

  async getExperienceAnalytics(tenantId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalRecognitionsThisMonth,
      activeChallenges,
      enpsSurveys,
      pendingPulseSurveys,
      totalAlumni,
    ] = await Promise.all([
      (prisma as any).employeeRecognition
        ? (prisma as any).employeeRecognition.count({
            where: { tenantId, recognizedAt: { gte: startOfMonth } },
          })
        : Promise.resolve(0),
      (prisma as any).wellnessChallenge
        ? (prisma as any).wellnessChallenge.count({
            where: { tenantId, isActive: true, endDate: { gte: now } },
          })
        : Promise.resolve(0),
      (prisma as any).eNPSurvey
        ? (prisma as any).eNPSurvey.findMany({
            where: { tenantId },
            orderBy: { endDate: "desc" },
            take: 1,
          })
        : Promise.resolve([]),
      (prisma as any).pulseSurvey
        ? (prisma as any).pulseSurvey.count({
            where: { tenantId, isActive: true },
          })
        : Promise.resolve(0),
      (prisma as any).alumniRecord
        ? (prisma as any).alumniRecord.count({
            where: { tenantId, isActiveAlumni: true },
          })
        : Promise.resolve(0),
    ]);

    const avgENPSScore =
      enpsSurveys.length > 0 && enpsSurveys[0].avgScore !== null
        ? Number(enpsSurveys[0].avgScore)
        : 0;

    return {
      totalRecognitionsThisMonth,
      activeChallenges,
      avgENPSScore,
      pendingSurveys: pendingPulseSurveys,
      totalActiveAlumni: totalAlumni,
    };
  }
}
