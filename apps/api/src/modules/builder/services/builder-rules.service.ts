// @ts-nocheck
import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class BuilderRulesService {
  async getDecisionTables(
    tenantId: string,
    params: { page?: number; limit?: number; search?: string } = {},
  ) {
    const page = params.page || 1;
    const limit = params.limit || 50;
    const skip = (page - 1) * limit;
    const where: any = { tenantId };
    if (params.search) {
      where.name = { contains: params.search, mode: "insensitive" };
    }
    const [data, total] = await Promise.all([
      prisma.decisionTable.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.decisionTable.count({ where }),
    ]);
    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getDecisionTableById(tenantId: string, id: string) {
    const table = await prisma.decisionTable.findFirst({
      where: { id, tenantId },
    });
    if (!table) throw new NotFoundException("Decision table not found");
    return table;
  }

  async createDecisionTable(tenantId: string, dto: any) {
    const existing = await prisma.decisionTable.findFirst({
      where: { tenantId, name: dto.name },
    });
    if (existing)
      throw new BadRequestException(
        "A decision table with this name already exists",
      );

    return prisma.decisionTable.create({
      data: {
        tenantId,
        name: dto.name,
        description: dto.description || null,
        hitPolicy: dto.hitPolicy || "FIRST",
        inputs: dto.inputs || [],
        outputs: dto.outputs || [],
        rules: dto.rules || [],
        settings: dto.settings || {},
      },
    });
  }

  async updateDecisionTable(tenantId: string, id: string, dto: any) {
    const table = await prisma.decisionTable.findFirst({
      where: { id, tenantId },
    });
    if (!table) throw new NotFoundException("Decision table not found");

    return prisma.decisionTable.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.hitPolicy !== undefined && { hitPolicy: dto.hitPolicy }),
        ...(dto.inputs !== undefined && { inputs: dto.inputs as any }),
        ...(dto.outputs !== undefined && { outputs: dto.outputs as any }),
        ...(dto.rules !== undefined && { rules: dto.rules as any }),
        ...(dto.settings !== undefined && { settings: dto.settings as any }),
      },
    });
  }

  async deleteDecisionTable(tenantId: string, id: string) {
    const table = await prisma.decisionTable.findFirst({
      where: { id, tenantId },
    });
    if (!table) throw new NotFoundException("Decision table not found");
    return prisma.decisionTable.delete({ where: { id } });
  }

  async createRuleSet(tenantId: string, dto: any) {
    const existing = await prisma.ruleSet.findFirst({
      where: { tenantId, name: dto.name },
    });
    if (existing)
      throw new BadRequestException("A rule set with this name already exists");

    return prisma.ruleSet.create({
      data: {
        tenantId,
        name: dto.name,
        description: dto.description || null,
        settings: dto.settings || {},
      },
    });
  }

  async getRuleSets(tenantId: string) {
    return prisma.ruleSet.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });
  }

  async getRuleSetById(tenantId: string, id: string) {
    const rs = await prisma.ruleSet.findFirst({ where: { id, tenantId } });
    if (!rs) throw new NotFoundException("Rule set not found");
    return rs;
  }

  async addRuleToSet(tenantId: string, ruleSetId: string, dto: any) {
    const rs = await prisma.ruleSet.findFirst({
      where: { id: ruleSetId, tenantId },
    });
    if (!rs) throw new NotFoundException("Rule set not found");

    return prisma.ruleDefinition.create({
      data: {
        tenantId,
        ruleSetId,
        name: dto.name,
        description: dto.description || null,
        priority: dto.priority || 0,
        condition: dto.condition,
        actions: dto.actions || [],
      },
    });
  }

  async evaluateRules(tenantId: string, ruleSetId: string, dto: any) {
    const rs = await prisma.ruleSet.findFirst({
      where: { id: ruleSetId, tenantId },
    });
    if (!rs) throw new NotFoundException("Rule set not found");

    const rules = await prisma.ruleDefinition.findMany({
      where: { tenantId, ruleSetId, status: "ACTIVE" },
      orderBy: { priority: "asc" },
    });

    let matched = false;
    let output = null;

    for (const rule of rules) {
      try {
        const result = this.evaluateCondition(rule.condition, dto.input || {});
        if (result) {
          output = rule.actions;
          matched = true;
          break;
        }
      } catch {
        continue;
      }
    }

    await prisma.ruleEvaluationLog.create({
      data: {
        tenantId,
        ruleSetId,
        input: (dto.input || {}) as any,
        output: (output || {}) as any,
        matched,
        triggeredBy: dto.triggeredBy || null,
      },
    });

    return { matched, output };
  }

  private evaluateCondition(
    condition: string,
    input: Record<string, any>,
  ): boolean {
    try {
      const fn = new Function(...Object.keys(input), `return ${condition};`);
      return fn(...Object.values(input));
    } catch {
      return false;
    }
  }

  async getRuleAnalytics(tenantId: string) {
    const [totalTables, totalRuleSets, totalRules, totalEvaluations] =
      await Promise.all([
        prisma.decisionTable.count({ where: { tenantId } }),
        prisma.ruleSet.count({ where: { tenantId } }),
        prisma.ruleDefinition.count({ where: { tenantId } }),
        prisma.ruleEvaluationLog.count({ where: { tenantId } }),
      ]);

    return { totalTables, totalRuleSets, totalRules, totalEvaluations };
  }

  async versionRule(tenantId: string, ruleSetId: string) {
    const rs = await prisma.ruleSet.findFirst({
      where: { id: ruleSetId, tenantId },
    });
    if (!rs) throw new NotFoundException("Rule set not found");

    return prisma.ruleSet.update({
      where: { id: ruleSetId },
      data: { version: (rs.version || 0) + 1 },
    });
  }
}
