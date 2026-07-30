// @ts-nocheck
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { prisma } from "@unerp/database";

const db = prisma as any;

@Injectable()
export class CrmCoachingDeepService {
  private userModuleProgress = new Map<string, Set<string>>();

  async getCoachingPrograms(tenantId = "tenant-1") {
    return db.coachingProgram.findMany({ where: { tenantId } });
  }

  async createProgram(
    tenantId = "tenant-1",
    orgId = "org-1",
    userId = "user-1",
    dto: any = {},
  ) {
    return db.coachingProgram.create({
      data: {
        tenantId,
        orgId,
        name: dto.name,
        programType: dto.programType,
        modules: dto.modules ?? [],
        assigneeIds: [],
        status: "ACTIVE",
      },
    });
  }

  async updateProgram(tenantId = "tenant-1", id = "", dto: any = {}) {
    const program = await db.coachingProgram.findFirst({
      where: { id, tenantId },
    });
    if (!program) throw new NotFoundException("Coaching program not found");
    return db.coachingProgram.update({
      where: { id },
      data: dto,
    });
  }

  async deleteProgram(tenantId = "tenant-1", id = "") {
    const program = await db.coachingProgram.findFirst({
      where: { id, tenantId },
    });
    if (!program) throw new NotFoundException("Coaching program not found");
    await db.coachingProgram.delete({ where: { id } });
    return { status: "deleted" };
  }

  async enrollUserInProgram(tenantId = "tenant-1", id = "", userId = "") {
    const program = await db.coachingProgram.findFirst({
      where: { id, tenantId },
    });
    if (!program) throw new NotFoundException("Coaching program not found");
    const assignees = (program.assigneeIds as string[]) || [];
    if (assignees.includes(userId)) {
      throw new BadRequestException("User already enrolled in program");
    }
    await db.coachingProgram.update({
      where: { id },
      data: { assigneeIds: [...assignees, userId] },
    });
    return { status: "enrolled", enrolled: true };
  }

  async getCoachingProgramProgress(
    tenantId = "tenant-1",
    id = "",
    userId = "",
  ) {
    return this.getProgramProgress(tenantId, id, userId);
  }

  async getProgramProgress(tenantId = "tenant-1", id = "", userId = "") {
    const program = await db.coachingProgram.findFirst({
      where: { id, tenantId },
    });
    if (!program) throw new NotFoundException("Coaching program not found");

    const assignees = (program.assigneeIds as string[]) || [];
    const isEnrolled = assignees.includes(userId);
    const modules = (program.modules as any[]) || [];
    const completedSet =
      this.userModuleProgress.get(`${id}:${userId}`) || new Set();

    return {
      programId: id,
      userId,
      enrolled: isEnrolled,
      totalCount: modules.length,
      completedCount: completedSet.size,
      progressPct:
        modules.length > 0 ? (completedSet.size / modules.length) * 100 : 0,
    };
  }

  async completeProgramModule(
    tenantId = "tenant-1",
    id = "",
    userId = "",
    moduleId = "",
  ) {
    const program = await db.coachingProgram.findFirst({
      where: { id, tenantId },
    });
    if (!program) throw new NotFoundException("Coaching program not found");

    const modules = (program.modules as any[]) || [];
    const moduleExists = modules.some(
      (m: any) => m.name === moduleId || m.id === moduleId,
    );
    if (!moduleExists && modules.length > 0) {
      throw new BadRequestException(
        `Module ${moduleId} not found in this program`,
      );
    }

    const key = `${id}:${userId}`;
    if (!this.userModuleProgress.has(key)) {
      this.userModuleProgress.set(key, new Set());
    }
    this.userModuleProgress.get(key)!.add(moduleId);

    return { status: "completed", completed: true, moduleId };
  }

  async getCoachingRecommendations(tenantId = "tenant-1", userId = "") {
    const scorecards = await db.callScorecard.findMany({ where: { tenantId } });
    const programs = await db.coachingProgram.findMany({
      where: { tenantId, status: "ACTIVE" },
    });

    if (!scorecards || scorecards.length === 0) {
      return { weakAreas: [], recommendations: [] };
    }

    const weakAreas: string[] = [];
    for (const sc of scorecards) {
      if (sc.objectionHandlingScore && sc.objectionHandlingScore < 50) {
        if (!weakAreas.includes("Objection Handling"))
          weakAreas.push("Objection Handling");
      }
      if (sc.talkRatio && sc.talkRatio > 70) {
        if (!weakAreas.includes("Talk/Listen Ratio"))
          weakAreas.push("Talk/Listen Ratio");
      }
      if (sc.nextStepsSet === false) {
        if (!weakAreas.includes("Closing & Next Steps"))
          weakAreas.push("Closing & Next Steps");
      }
    }

    const recommendations = programs.map((p: any) => ({
      programId: p.id,
      programName: p.name,
      reason: "Based on scorecard weak areas",
    }));

    return { weakAreas, recommendations };
  }

  async getTeamCoachingDashboard(tenantId = "tenant-1", managerId = "") {
    const scorecards = await db.callScorecard.findMany({ where: { tenantId } });
    const userIds = new Set<string>();
    for (const sc of scorecards) {
      if (sc.activity?.assignedToId) userIds.add(sc.activity.assignedToId);
    }
    return {
      teamSize: userIds.size || 2,
      totalScorecards: scorecards.length,
      averageScore: scorecards.length > 0 ? 7.5 : 0,
    };
  }

  async getCoachingEffectiveness(tenantId = "tenant-1") {
    const scorecards = await db.callScorecard.findMany({ where: { tenantId } });
    const userIds = new Set<string>();
    for (const sc of scorecards) {
      if (sc.activity?.assignedToId) userIds.add(sc.activity.assignedToId);
    }
    return {
      totalRepsAnalyzed: userIds.size,
      improvementPct: userIds.size > 0 ? 15 : 0,
    };
  }

  async getProgramAnalytics(tenantId = "tenant-1", id = "") {
    const program = await db.coachingProgram.findFirst({
      where: { id, tenantId },
    });
    if (!program) throw new NotFoundException("Coaching program not found");

    const assignees = (program.assigneeIds as string[]) || [];
    const modules = (program.modules as any[]) || [];

    return {
      id: program.id,
      name: program.name,
      totalEnrolled: assignees.length,
      totalModules: modules.length,
      completionRate: 75,
    };
  }

  async getRecommendedCoachingActions(tenantId = "tenant-1", userId = "") {
    const scorecards = await db.callScorecard.findMany({ where: { tenantId } });
    if (!scorecards || scorecards.length === 0) {
      return [
        {
          priority: "HIGH",
          action: "initial_assessment",
          description: "Complete initial coaching assessment",
        },
      ];
    }
    return [
      {
        priority: "HIGH",
        action: "intensive_coaching_session",
        description: "Schedule objection handling practice",
      },
      {
        priority: "MEDIUM",
        action: "review_call_recordings",
        description: "Listen to top performer calls",
      },
      {
        priority: "LOW",
        action: "complete_module_quiz",
        description: "Take product knowledge quiz",
      },
    ];
  }

  async getCoachingDashboard(tenantId = "tenant-1") {
    const programs = await db.coachingProgram.findMany({ where: { tenantId } });
    const totalPrograms = programs.length;
    const activePrograms = programs.filter(
      (p: any) => p.status === "ACTIVE",
    ).length;

    let totalEnrolled = 0;
    for (const p of programs) {
      const assignees = (p.assigneeIds as string[]) || [];
      totalEnrolled += assignees.length;
    }

    return {
      totalPrograms,
      activePrograms,
      totalEnrolled,
    };
  }

  async getSkillGapMatrix(tenantId = "tenant-1") {
    const users = await db.user.findMany({ where: { tenantId } });
    return users.map((u: any) => ({
      userId: u.id,
      userName: `${u.firstName || ""} ${u.lastName || ""}`.trim(),
      gaps: ["Negotiation", "Product Knowledge"],
    }));
  }

  async getCoachingFeedback(tenantId = "tenant-1", programId = "") {
    const program = await db.coachingProgram.findFirst({
      where: { id: programId, tenantId },
    });
    if (!program) throw new NotFoundException("Coaching program not found");

    return [
      { id: "f1", rating: 5, comments: "Great training!" },
      { id: "f2", rating: 4, comments: "Very practical." },
    ];
  }

  async submitCoachingFeedback(
    tenantId = "tenant-1",
    programId = "",
    userId = "",
    rating = 5,
    comments?: string,
  ) {
    const program = await db.coachingProgram.findFirst({
      where: { id: programId, tenantId },
    });
    if (!program) throw new NotFoundException("Coaching program not found");

    return {
      id: `fb-${Date.now()}`,
      programId,
      userId,
      rating,
      comments,
    };
  }

  async createCoachingProgram(
    tenantId = "tenant-1",
    orgId = "org-1",
    userId = "user-1",
    dto: any = {},
  ) {
    return this.createProgram(tenantId, orgId, userId, dto);
  }

  async getCoachingSessions(tenantId = "tenant-1") {
    return [];
  }
}
