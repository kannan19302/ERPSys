// @ts-nocheck
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { prisma, Prisma } from "@unerp/database";
import { z } from "zod";

export const createTerritoryPlanSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  fiscalYear: z.string().min(1),
  status: z.enum(["DRAFT", "ACTIVE", "COMPLETED", "ARCHIVED"]).optional(),
  metadata: z.record(z.any()).optional(),
  assignments: z
    .array(
      z.object({
        territoryId: z.string().min(1),
        userId: z.string().min(1),
        allocation: z.number().min(0).max(100).optional(),
        startDate: z.string().min(1),
        endDate: z.string().optional(),
      }),
    )
    .optional(),
});
export const updateTerritoryPlanSchema = createTerritoryPlanSchema
  .partial()
  .omit({ assignments: true });
export type CreateTerritoryPlanInput = z.infer<
  typeof createTerritoryPlanSchema
>;
export type UpdateTerritoryPlanInput = z.infer<
  typeof updateTerritoryPlanSchema
>;

export const createAccountTeamMemberSchema = z.object({
  customerId: z.string().min(1),
  userId: z.string().min(1),
  role: z
    .enum(["LEAD", "MEMBER", "EXEC_SPONSOR", "TECHNICAL"])
    .optional()
    .default("MEMBER"),
  isPrimary: z.boolean().optional().default(false),
});
export const updateAccountTeamMemberSchema = createAccountTeamMemberSchema
  .partial()
  .omit({ customerId: true });
export type CreateAccountTeamMemberInput = z.infer<
  typeof createAccountTeamMemberSchema
>;
export type UpdateAccountTeamMemberInput = z.infer<
  typeof updateAccountTeamMemberSchema
>;

export const createNamedAccountSchema = z.object({
  customerId: z.string().min(1),
  name: z.string().min(1).max(200),
  tier: z
    .enum(["STRATEGIC", "KEY", "STANDARD", "PROSPECT"])
    .optional()
    .default("STANDARD"),
  status: z.enum(["ACTIVE", "AT_RISK", "CHURNED"]).optional(),
  targetRevenue: z.number().optional(),
  strategy: z.record(z.any()).optional(),
  notes: z.string().max(3000).optional(),
});
export const updateNamedAccountSchema = createNamedAccountSchema
  .partial()
  .omit({ customerId: true });
export type CreateNamedAccountInput = z.infer<typeof createNamedAccountSchema>;
export type UpdateNamedAccountInput = z.infer<typeof updateNamedAccountSchema>;

@Injectable()
export class CrmTerritoryDeepService {
  // ── Territory Plans ──────────────────────────────────────────

  async getTerritoryPlans(tenantId: string) {
    return prisma.territoryPlan.findMany({
      where: { tenantId, deletedAt: null },
      include: { _count: { select: { assignments: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  async getTerritoryPlan(tenantId: string, id: string) {
    const plan = await prisma.territoryPlan.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: { assignments: true },
    });
    if (!plan) throw new NotFoundException("Territory plan not found");
    return plan;
  }

  async createTerritoryPlan(
    tenantId: string,
    _orgId: string,
    dto: CreateTerritoryPlanInput,
    createdBy: string,
  ) {
    const plan = await prisma.territoryPlan.create({
      data: {
        tenantId,
        name: dto.name,
        description: dto.description || null,
        fiscalYear: dto.fiscalYear,
        status: dto.status || "DRAFT",
        metadata: (dto.metadata ?? {}) as Prisma.InputJsonValue,
        createdBy,
      },
    });
    if (dto.assignments && dto.assignments.length > 0) {
      for (const a of dto.assignments) {
        await prisma.territoryPlanAssignment.create({
          data: {
            tenantId,
            planId: plan.id,
            territoryId: a.territoryId,
            userId: a.userId,
            allocation: a.allocation ?? 100,
            startDate: new Date(a.startDate),
            endDate: a.endDate ? new Date(a.endDate) : null,
          },
        });
      }
    }
    return this.getTerritoryPlan(tenantId, plan.id);
  }

  async updateTerritoryPlan(
    tenantId: string,
    id: string,
    dto: UpdateTerritoryPlanInput,
  ) {
    const existing = await prisma.territoryPlan.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!existing) throw new NotFoundException("Territory plan not found");
    return prisma.territoryPlan.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.fiscalYear !== undefined && { fiscalYear: dto.fiscalYear }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.metadata !== undefined && {
          metadata: dto.metadata as Prisma.InputJsonValue,
        }),
      },
      include: { assignments: true },
    });
  }

  async deleteTerritoryPlan(tenantId: string, id: string) {
    const existing = await prisma.territoryPlan.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!existing) throw new NotFoundException("Territory plan not found");
    return prisma.territoryPlan.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async getTerritoryAssignmentHistory(tenantId: string, territoryId: string) {
    const logs = await prisma.territoryRebalanceLog.findMany({
      where: { plan: { tenantId, deletedAt: null } },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    const assignments = await prisma.territoryPlanAssignment.findMany({
      where: { plan: { tenantId, deletedAt: null }, territoryId },
      include: { plan: { select: { id: true, name: true, fiscalYear: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return { logs, assignments };
  }

  async rebalanceTerritory(tenantId: string, planId: string) {
    const plan = await prisma.territoryPlan.findFirst({
      where: { id: planId, tenantId, deletedAt: null },
      include: { assignments: { include: { plan: false } } },
    });
    if (!plan) throw new NotFoundException("Territory plan not found");
    const previousJson = JSON.parse(JSON.stringify(plan.assignments));

    const assignments = plan.assignments;
    if (assignments.length === 0)
      return { rebalanced: false, message: "No assignments to rebalance" };

    const totalAllocation = assignments.reduce(
      (sum, a) => sum + Number(a.allocation),
      0,
    );
    const equalShare =
      totalAllocation > 0
        ? Math.floor((100 / assignments.length) * 100) / 100
        : 0;
    let remainder = 100;
    const updates: Array<{ id: string; userId: string; allocation: number }> =
      [];
    for (let i = 0; i < assignments.length; i++) {
      const a = assignments[i]!;
      const alloc = i === assignments.length - 1 ? remainder : equalShare;
      await prisma.territoryPlanAssignment.update({
        where: { id: a.id },
        data: { allocation: alloc },
      });
      remainder -= alloc;
      updates.push({ id: a.id, userId: a.userId, allocation: alloc });
    }

    await prisma.territoryRebalanceLog.create({
      data: {
        tenantId,
        planId,
        previousJson: previousJson as Prisma.InputJsonValue,
        newJson: updates as Prisma.InputJsonValue,
        strategy: "BALANCED",
        summary: `Rebalanced ${assignments.length} assignments to equal distribution`,
        createdBy: "system",
      },
    });

    return { rebalanced: true, previous: previousJson, current: updates };
  }

  async previewRebalance(tenantId: string, planId: string) {
    const plan = await prisma.territoryPlan.findFirst({
      where: { id: planId, tenantId, deletedAt: null },
      include: { assignments: true },
    });
    if (!plan) throw new NotFoundException("Territory plan not found");
    const assignments = plan.assignments;
    if (assignments.length === 0) return { preview: [] };
    const equalShare = Math.floor((100 / assignments.length) * 100) / 100;
    let remainder = 100;
    const preview: Array<{
      assignmentId: string;
      userId: string;
      territoryId: string;
      currentAllocation: number;
      proposedAllocation: number;
    }> = [];
    for (let i = 0; i < assignments.length; i++) {
      const a = assignments[i]!;
      const alloc = i === assignments.length - 1 ? remainder : equalShare;
      preview.push({
        assignmentId: a.id,
        userId: a.userId,
        territoryId: a.territoryId,
        currentAllocation: Number(a.allocation),
        proposedAllocation: alloc,
      });
      remainder -= alloc;
    }
    return { preview };
  }

  // ── Account Teams ────────────────────────────────────────────

  async getAccountTeams(customerId: string) {
    const teams = await prisma.accountTeam.findMany({
      where: { customerId },
      include: { members: true },
      orderBy: { createdAt: "desc" },
    });
    if (teams.length === 0) {
      const defaultTeam = await prisma.accountTeam.create({
        data: {
          tenantId: "system",
          customerId,
          name: "Account Team",
          description: "Default account team",
        },
        include: { members: true },
      });
      return [defaultTeam];
    }
    return teams;
  }

  async addAccountTeamMember(
    tenantId: string,
    _orgId: string,
    dto: CreateAccountTeamMemberInput,
  ) {
    let team = await prisma.accountTeam.findFirst({
      where: { customerId: dto.customerId },
    });
    if (!team) {
      team = await prisma.accountTeam.create({
        data: {
          tenantId,
          customerId: dto.customerId,
          name: "Account Team",
          description: "Default account team",
        },
      });
    }
    const existing = await prisma.accountTeamMember.findFirst({
      where: { tenantId, teamId: team.id, userId: dto.userId },
    });
    if (existing)
      throw new BadRequestException(
        "User is already a member of this account team",
      );
    const member = await prisma.accountTeamMember.create({
      data: {
        tenantId,
        teamId: team.id,
        userId: dto.userId,
        role: dto.role || "MEMBER",
        isPrimary: dto.isPrimary ?? false,
      },
    });
    return member;
  }

  async updateAccountTeamMember(
    tenantId: string,
    id: string,
    dto: UpdateAccountTeamMemberInput,
  ) {
    const existing = await prisma.accountTeamMember.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException("Account team member not found");
    return prisma.accountTeamMember.update({
      where: { id },
      data: {
        ...(dto.userId !== undefined && { userId: dto.userId }),
        ...(dto.role !== undefined && { role: dto.role }),
        ...(dto.isPrimary !== undefined && { isPrimary: dto.isPrimary }),
      },
    });
  }

  async removeAccountTeamMember(tenantId: string, id: string) {
    const existing = await prisma.accountTeamMember.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException("Account team member not found");
    return prisma.accountTeamMember.delete({ where: { id } });
  }

  // ── Account Scoring ──────────────────────────────────────────

  async getAccountScoring(customerId: string) {
    const score = await prisma.accountScore.findFirst({
      where: { customerId },
    });
    if (!score) {
      return { score: 0, factors: [], scorecard: {}, calculatedAt: null };
    }
    return score;
  }

  async calculateAccountScore(tenantId: string, customerId: string) {
    const customer = await prisma.customer.findFirst({
      where: { id: customerId, tenantId, deletedAt: null },
    });
    if (!customer) throw new NotFoundException("Customer not found");

    const opportunities = await prisma.opportunity.findMany({
      where: { customerId, tenantId, deletedAt: null },
    });
    const totalRevenue = opportunities.reduce(
      (s, o) => s + Number(o.amount || 0),
      0,
    );
    const wonOpps = opportunities.filter((o) => o.stage === "CLOSED_WON");
    const activities = await prisma.activity.count({
      where: { customerId, tenantId },
    });

    const factors = [
      {
        name: "revenue",
        weight: 0.3,
        value: Math.min((totalRevenue / 10000) * 10, 100),
      },
      {
        name: "opportunity_pipeline",
        weight: 0.25,
        value: Math.min(opportunities.length * 10, 100),
      },
      {
        name: "win_rate",
        weight: 0.2,
        value:
          opportunities.length > 0
            ? Math.round((wonOpps.length / opportunities.length) * 100)
            : 0,
      },
      {
        name: "engagement",
        weight: 0.15,
        value: Math.min(activities * 5, 100),
      },
      {
        name: "tenure",
        weight: 0.1,
        value: customer.createdAt
          ? Math.min(
              Math.floor(
                (Date.now() - customer.createdAt.getTime()) / 86400000 / 30,
              ) * 2,
              100,
            )
          : 0,
      },
    ];
    const score = Math.round(
      factors.reduce((s, f) => s + f.value * f.weight, 0),
    );

    const upserted = await prisma.accountScore.upsert({
      where: { tenantId_customerId: { tenantId, customerId } },
      create: {
        tenantId,
        customerId,
        score,
        factors: factors as Prisma.InputJsonValue,
        scorecard: {} as Prisma.InputJsonValue,
        calculatedAt: new Date(),
      },
      update: {
        score,
        factors: factors as Prisma.InputJsonValue,
        calculatedAt: new Date(),
      },
    });
    return upserted;
  }

  // ── Named Accounts ───────────────────────────────────────────

  async getNamedAccounts(tenantId: string) {
    return prisma.namedAccount.findMany({
      where: { tenantId, deletedAt: null },
      include: {
        customer: {
          select: { id: true, name: true, email: true, status: true },
        },
      },
      orderBy: [{ tier: "asc" }, { name: "asc" }],
    });
  }

  async createNamedAccount(
    tenantId: string,
    _orgId: string,
    dto: CreateNamedAccountInput,
    createdBy: string,
  ) {
    const customer = await prisma.customer.findFirst({
      where: { id: dto.customerId, tenantId },
    });
    if (!customer) throw new NotFoundException("Customer not found");
    const existing = await prisma.namedAccount.findFirst({
      where: { tenantId, customerId: dto.customerId, deletedAt: null },
    });
    if (existing)
      throw new BadRequestException("Customer is already a named account");
    return prisma.namedAccount.create({
      data: {
        tenantId,
        customerId: dto.customerId,
        name: dto.name,
        tier: dto.tier || "STANDARD",
        status: dto.status || "ACTIVE",
        targetRevenue: dto.targetRevenue ?? undefined,
        strategy: (dto.strategy ?? {}) as Prisma.InputJsonValue,
        notes: dto.notes || null,
        createdBy,
      },
      include: {
        customer: {
          select: { id: true, name: true, email: true, status: true },
        },
      },
    });
  }

  async updateNamedAccount(
    tenantId: string,
    id: string,
    dto: UpdateNamedAccountInput,
  ) {
    const existing = await prisma.namedAccount.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!existing) throw new NotFoundException("Named account not found");
    return prisma.namedAccount.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.tier !== undefined && { tier: dto.tier }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.targetRevenue !== undefined && {
          targetRevenue: dto.targetRevenue,
        }),
        ...(dto.strategy !== undefined && {
          strategy: dto.strategy as Prisma.InputJsonValue,
        }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
      include: {
        customer: {
          select: { id: true, name: true, email: true, status: true },
        },
      },
    });
  }

  async removeNamedAccount(tenantId: string, id: string) {
    const existing = await prisma.namedAccount.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!existing) throw new NotFoundException("Named account not found");
    return prisma.namedAccount.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // ── Territory Performance & Dashboard ────────────────────────

  async getTerritoryPerformance(
    tenantId: string,
    territoryId: string,
    period?: string,
  ) {
    const days =
      period === "this_quarter"
        ? 90
        : period === "this_year"
          ? 365
          : period === "last_30"
            ? 30
            : 60;
    const since = new Date(Date.now() - days * 86400000);

    const opportunities = await prisma.opportunity.findMany({
      where: { tenantId, deletedAt: null, createdAt: { gte: since } },
    });
    const won = opportunities.filter((o) => o.stage === "CLOSED_WON");
    const pipeline = opportunities.filter(
      (o) => !["CLOSED_WON", "CLOSED_LOST"].includes(o.stage),
    );

    return {
      territoryId,
      period: period || "last_60",
      revenue: won.reduce((s, o) => s + Number(o.amount || 0), 0),
      pipelineValue: pipeline.reduce((s, o) => s + Number(o.amount || 0), 0),
      dealCount: opportunities.length,
      wonCount: won.length,
      winRate:
        opportunities.length > 0
          ? Math.round((won.length / opportunities.length) * 100)
          : 0,
      avgDealSize:
        opportunities.length > 0
          ? Math.round(
              opportunities.reduce((s, o) => s + Number(o.amount || 0), 0) /
                opportunities.length,
            )
          : 0,
    };
  }

  async getTerritoryDashboard(tenantId: string) {
    const territories = await prisma.salesTerritory.findMany({
      where: { tenantId, deletedAt: null },
      include: { _count: { select: { members: true } } },
    });
    const plans = await prisma.territoryPlan.findMany({
      where: { tenantId, deletedAt: null },
      select: { id: true, name: true, status: true, fiscalYear: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    });
    const namedAccounts = await prisma.namedAccount.count({
      where: { tenantId, deletedAt: null },
    });
    const totalRevenue = await prisma.opportunity.aggregate({
      where: { tenantId, deletedAt: null, stage: "CLOSED_WON" },
      _sum: { amount: true },
    });

    return {
      totalTerritories: territories.length,
      totalTeamMembers: territories.reduce((s, t) => s + t._count.members, 0),
      activePlans: plans.filter((p) => p.status === "ACTIVE").length,
      namedAccounts,
      totalRevenue: totalRevenue._sum.amount || 0,
      territories,
      recentPlans: plans,
    };
  }
}
