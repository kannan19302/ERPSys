import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { prisma } from "@unerp/database";
import { Prisma } from "@prisma/client";
import { z } from "zod";

export const nextBestActionConfigSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  objectType: z.enum(["OPPORTUNITY", "LEAD", "CUSTOMER"]),
  stageId: z.string().optional().nullable(),
  conditions: z.record(z.unknown()).optional().default({}),
  actionType: z.enum(["EMAIL", "CALL", "MEETING", "TASK", "PROPOSAL", "DEMO", "FOLLOW_UP", "SEND_QUOTE", "ESCALATION", "REVIEW"]),
  actionLabel: z.string().min(1),
  actionDescription: z.string().optional().nullable(),
  priority: z.number().int().min(0).optional().default(0),
  isActive: z.boolean().optional().default(true),
});

export const guidedSellingPlaybookSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  objectType: z.enum(["OPPORTUNITY", "LEAD", "CUSTOMER"]),
  stageFrom: z.string().optional().nullable(),
  stageTo: z.string().optional().nullable(),
  content: z.record(z.unknown()).optional().default({}),
  tags: z.array(z.string()).optional().default([]),
  isActive: z.boolean().optional().default(true),
});

export const dealReadinessScoreSchema = z.object({
  opportunityId: z.string().min(1),
  dimensions: z.record(z.number()).optional().default({}),
  factors: z.array(z.object({ name: z.string(), score: z.number().min(0).max(100), weight: z.number().min(0).max(100) })).optional().default([]),
});

@Injectable()
export class CrmGuidedSellingService {
  // ── Next-Best-Action Configs ──

  async listActionConfigs(tenantId: string, objectType?: string, stageId?: string) {
    const where: Prisma.CrmNextBestActionConfigWhereInput = { tenantId, deletedAt: null };
    if (objectType) where.objectType = objectType;
    if (stageId) where.stageId = stageId;
    return prisma.crmNextBestActionConfig.findMany({ where, orderBy: { priority: "desc" } });
  }

  async getActionConfig(tenantId: string, id: string) {
    const c = await prisma.crmNextBestActionConfig.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!c) throw new NotFoundException("Action config not found");
    return c;
  }

  async createActionConfig(tenantId: string, dto: z.infer<typeof nextBestActionConfigSchema>) {
    const { conditions, ...rest } = dto;
    return prisma.crmNextBestActionConfig.create({ data: { ...rest, conditions: conditions as Prisma.InputJsonValue, tenantId } });
  }

  async updateActionConfig(tenantId: string, id: string, dto: Partial<z.infer<typeof nextBestActionConfigSchema>>) {
    await this.getActionConfig(tenantId, id);
    const { conditions, ...rest } = dto;
    return prisma.crmNextBestActionConfig.update({ where: { id }, data: { ...rest, ...(conditions !== undefined ? { conditions: conditions as Prisma.InputJsonValue } : {}) } });
  }

  async deleteActionConfig(tenantId: string, id: string) {
    await this.getActionConfig(tenantId, id);
    return prisma.crmNextBestActionConfig.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async toggleActionConfig(tenantId: string, id: string) {
    const c = await this.getActionConfig(tenantId, id);
    return prisma.crmNextBestActionConfig.update({ where: { id }, data: { isActive: !c.isActive } });
  }

  // ── Suggestions ──

  async generateSuggestions(tenantId: string, objectId: string, objectType: string) {
    const configs = await prisma.crmNextBestActionConfig.findMany({
      where: { tenantId, objectType, isActive: true, deletedAt: null },
      orderBy: { priority: "desc" },
    });

    const suggestions = [];
    for (const cfg of configs) {
      const sug = await prisma.crmActionSuggestion.create({
        data: { tenantId, objectId, objectType, configId: cfg.id, actionType: cfg.actionType, title: cfg.actionLabel, description: cfg.actionDescription || undefined, priority: cfg.priority > 5 ? "HIGH" : cfg.priority > 2 ? "MEDIUM" : "LOW", reason: `Based on ${cfg.name} configuration` },
      });
      suggestions.push(sug);
    }
    if (!suggestions.length) {
      suggestions.push(await prisma.crmActionSuggestion.create({
        data: { tenantId, objectId, objectType, actionType: "FOLLOW_UP", title: "Schedule follow-up activity", description: "No specific action configured — schedule a general follow-up", priority: "MEDIUM", reason: "Default suggestion" },
      }));
    }
    return suggestions;
  }

  async listSuggestions(tenantId: string, objectId?: string, status?: string) {
    const where: Prisma.CrmActionSuggestionWhereInput = { tenantId };
    if (objectId) where.objectId = objectId;
    if (status) where.status = status;
    return prisma.crmActionSuggestion.findMany({ where, orderBy: { createdAt: "desc" } });
  }

  async getSuggestion(tenantId: string, id: string) {
    const s = await prisma.crmActionSuggestion.findFirst({ where: { id, tenantId } });
    if (!s) throw new NotFoundException("Suggestion not found");
    return s;
  }

  async acceptSuggestion(tenantId: string, id: string) {
    const s = await this.getSuggestion(tenantId, id);
    if (s.status !== "SUGGESTED") throw new BadRequestException("Suggestion is not in SUGGESTED status");
    return prisma.crmActionSuggestion.update({ where: { id }, data: { status: "ACCEPTED", acceptedAt: new Date() } });
  }

  async dismissSuggestion(tenantId: string, id: string, reason?: string) {
    const s = await this.getSuggestion(tenantId, id);
    if (s.status !== "SUGGESTED") throw new BadRequestException("Suggestion is not in SUGGESTED status");
    return prisma.crmActionSuggestion.update({ where: { id }, data: { status: "DISMISSED", dismissedAt: new Date(), dismissedReason: reason || null } });
  }

  async completeSuggestion(tenantId: string, id: string) {
    const s = await this.getSuggestion(tenantId, id);
    if (s.status !== "ACCEPTED") throw new BadRequestException("Only accepted suggestions can be completed");
    return prisma.crmActionSuggestion.update({ where: { id }, data: { status: "COMPLETED", completedAt: new Date() } });
  }

  // ── Playbooks ──

  async listPlaybooks(tenantId: string, objectType?: string) {
    const where: Prisma.CrmGuidedSellingPlaybookWhereInput = { tenantId, deletedAt: null };
    if (objectType) where.objectType = objectType;
    return prisma.crmGuidedSellingPlaybook.findMany({ where, orderBy: { version: "desc" } });
  }

  async getPlaybook(tenantId: string, id: string) {
    const p = await prisma.crmGuidedSellingPlaybook.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!p) throw new NotFoundException("Playbook not found");
    return p;
  }

  async createPlaybook(tenantId: string, dto: z.infer<typeof guidedSellingPlaybookSchema>) {
    const { content, tags, ...rest } = dto;
    return prisma.crmGuidedSellingPlaybook.create({ data: { ...rest, content: content as Prisma.InputJsonValue, tags: tags as Prisma.InputJsonValue, tenantId } });
  }

  async updatePlaybook(tenantId: string, id: string, dto: Partial<z.infer<typeof guidedSellingPlaybookSchema>>) {
    await this.getPlaybook(tenantId, id);
    const { content, tags, ...rest } = dto;
    return prisma.crmGuidedSellingPlaybook.update({ where: { id }, data: { ...rest, ...(content !== undefined ? { content: content as Prisma.InputJsonValue } : {}), ...(tags !== undefined ? { tags: tags as Prisma.InputJsonValue } : {}), version: { increment: 1 } } });
  }

  async deletePlaybook(tenantId: string, id: string) {
    await this.getPlaybook(tenantId, id);
    return prisma.crmGuidedSellingPlaybook.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async recommendPlaybook(tenantId: string, playbookId: string, objectId: string, objectType: string) {
    await this.getPlaybook(tenantId, playbookId);
    const existing = await prisma.crmActionSuggestion.findFirst({
      where: { tenantId, objectId, objectType, title: `Playbook: ${(await this.getPlaybook(tenantId, playbookId)).name}`, status: "SUGGESTED" },
    });
    if (existing) return existing;
    return prisma.crmActionSuggestion.create({
      data: { tenantId, objectId, objectType, actionType: "REVIEW", title: `Playbook: ${(await this.getPlaybook(tenantId, playbookId)).name}`, description: `Recommended playbook for ${objectType}`, priority: "HIGH", reason: "Playbook recommendation" },
    });
  }

  // ── Deal Readiness ──

  async scoreDealReadiness(tenantId: string, opportunityId: string) {
    const opp = await prisma.opportunity.findFirst({ where: { id: opportunityId, tenantId } });
    if (!opp) throw new NotFoundException("Opportunity not found");

    const dimensions: Record<string, number> = {
      budget: opp.amount && Number(opp.amount) > 0 ? 80 : 30,
      authority: 50,
      need: 70,
      timeline: opp.expectedCloseDate ? 60 : 40,
      engagement: 50,
    };
    const factors = Object.entries(dimensions).map(([name, score]) => ({ name, score, weight: 20 }));
    const totalScore = Math.round(Object.values(dimensions).reduce((a, b) => a + b, 0) / Object.keys(dimensions).length);

    let recommendation = "High likelihood — proceed with confidence";
    if (totalScore < 40) recommendation = "Significant risk — consider qualification";
    else if (totalScore < 65) recommendation = "Moderate risk — focus on identified gaps";

    return prisma.crmDealReadinessScore.create({
      data: { tenantId, opportunityId, score: totalScore, dimensions: dimensions as Prisma.InputJsonValue, factors: factors as Prisma.InputJsonValue, recommendation },
    });
  }

  async getDealReadiness(tenantId: string, opportunityId: string) {
    await prisma.opportunity.findFirstOrThrow({ where: { id: opportunityId, tenantId } }).catch(() => { throw new NotFoundException("Opportunity not found"); });
    return prisma.crmDealReadinessScore.findFirst({ where: { tenantId, opportunityId }, orderBy: { calculatedAt: "desc" } });
  }

  async getDealReadinessHistory(tenantId: string, opportunityId: string) {
    await prisma.opportunity.findFirstOrThrow({ where: { id: opportunityId, tenantId } }).catch(() => { throw new NotFoundException("Opportunity not found"); });
    return prisma.crmDealReadinessScore.findMany({ where: { tenantId, opportunityId }, orderBy: { calculatedAt: "desc" }, take: 20 });
  }

  // ── Analytics ──

  async getSuggestionAnalytics(tenantId: string) {
    const [total, accepted, dismissed, completed, expired] = await Promise.all([
      prisma.crmActionSuggestion.count({ where: { tenantId } }),
      prisma.crmActionSuggestion.count({ where: { tenantId, status: "ACCEPTED" } }),
      prisma.crmActionSuggestion.count({ where: { tenantId, status: "DISMISSED" } }),
      prisma.crmActionSuggestion.count({ where: { tenantId, status: "COMPLETED" } }),
      prisma.crmActionSuggestion.count({ where: { tenantId, status: "EXPIRED" } }),
    ]);
    const byType = await prisma.crmActionSuggestion.groupBy({ by: ["actionType"], where: { tenantId }, _count: true });
    return { total, accepted, dismissed, completed, expired, acceptanceRate: total ? Math.round(accepted / total * 100) : 0, byType };
  }

  async getDashboard(tenantId: string) {
    const [actionConfigs, playbooks, pendingSuggestions, avgScore] = await Promise.all([
      prisma.crmNextBestActionConfig.count({ where: { tenantId, isActive: true, deletedAt: null } }),
      prisma.crmGuidedSellingPlaybook.count({ where: { tenantId, isActive: true, deletedAt: null } }),
      prisma.crmActionSuggestion.count({ where: { tenantId, status: "SUGGESTED" } }),
      prisma.crmDealReadinessScore.aggregate({ where: { tenantId }, _avg: { score: true } }),
    ]);
    return { actionConfigs, playbooks, pendingSuggestions, avgDealReadiness: Math.round(avgScore._avg.score || 0) };
  }
}
