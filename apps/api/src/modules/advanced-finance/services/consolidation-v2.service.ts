// @ts-nocheck
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { prisma } from "@unerp/database";
import { Prisma } from "@prisma/client";

@Injectable()
export class ConsolidationV2Service {
  // ── Groups ─────────────────────────────────────────────────────────────────

  async createGroup(
    tenantId: string,
    dto: {
      name: string;
      groupType: string;
      baseCurrency: string;
      consolidationMethod: string;
      ownershipThreshold?: number;
    },
  ) {
    return prisma.consolidationGroup.create({
      data: {
        tenantId,
        name: dto.name,
        groupType: dto.groupType,
        baseCurrency: dto.baseCurrency,
        consolidationMethod: dto.consolidationMethod,
        ownershipThreshold: dto.ownershipThreshold
          ? new Prisma.Decimal(dto.ownershipThreshold)
          : new Prisma.Decimal(50),
        isActive: true,
      },
    });
  }

  async getGroups(tenantId: string, groupType?: string) {
    const where: Prisma.ConsolidationGroupWhereInput = { tenantId };
    if (groupType) where.groupType = groupType;
    return (prisma.consolidationGroup as any).findMany({
      where,
      include: { _count: { select: { members: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  async getGroup(tenantId: string, id: string) {
    const group = await (prisma.consolidationGroup as any).findFirst({
      where: { id, tenantId },
      include: { members: true },
    });
    if (!group) throw new NotFoundException("Consolidation group not found");
    return group;
  }

  async updateGroup(
    tenantId: string,
    id: string,
    dto: {
      name?: string;
      baseCurrency?: string;
      consolidationMethod?: string;
      ownershipThreshold?: number;
      isActive?: boolean;
    },
  ) {
    await this.getGroup(tenantId, id);
    const data: Prisma.ConsolidationGroupUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.baseCurrency !== undefined) data.baseCurrency = dto.baseCurrency;
    if (dto.consolidationMethod !== undefined)
      data.consolidationMethod = dto.consolidationMethod;
    if (dto.ownershipThreshold !== undefined)
      data.ownershipThreshold = new Prisma.Decimal(dto.ownershipThreshold);
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    return prisma.consolidationGroup.update({ where: { id }, data });
  }

  async deleteGroup(tenantId: string, id: string) {
    await this.getGroup(tenantId, id);
    await prisma.consolidationGroupMember.deleteMany({
      where: { groupId: id, tenantId },
    });
    await prisma.consolidationGroup.delete({ where: { id } });
    return { success: true };
  }

  // ── Group Members ──────────────────────────────────────────────────────────

  async addGroupMember(
    tenantId: string,
    dto: {
      groupId: string;
      entityId: string;
      ownershipPercent: number;
      consolidationMethod: string;
      functionalCurrency: string;
      isDirectSubsidiary?: boolean;
    },
  ) {
    await this.getGroup(tenantId, dto.groupId);
    const existing = await prisma.consolidationGroupMember.findFirst({
      where: { tenantId, groupId: dto.groupId, entityId: dto.entityId },
    });
    if (existing)
      throw new BadRequestException("Entity is already a member of this group");

    return prisma.consolidationGroupMember.create({
      data: {
        tenantId,
        groupId: dto.groupId,
        entityId: dto.entityId,
        ownershipPercent: new Prisma.Decimal(dto.ownershipPercent),
        consolidationMethod: dto.consolidationMethod,
        functionalCurrency: dto.functionalCurrency,
        isDirectSubsidiary: dto.isDirectSubsidiary ?? true,
      },
    });
  }

  async removeGroupMember(tenantId: string, id: string) {
    const member = await prisma.consolidationGroupMember.findFirst({
      where: { id, tenantId },
    });
    if (!member) throw new NotFoundException("Group member not found");
    await prisma.consolidationGroupMember.delete({ where: { id } });
    return { success: true };
  }

  async getGroupTree(tenantId: string, groupId: string) {
    const group = await this.getGroup(tenantId, groupId);
    const members = await prisma.consolidationGroupMember.findMany({
      where: { tenantId, groupId },
    });

    const entityIds = members.map((m) => m.entityId);
    const entities = await prisma.organization.findMany({
      where: { tenantId, id: { in: entityIds } },
      select: { id: true, name: true, currency: true },
    });
    const entityMap = new Map(entities.map((e) => [e.id, e]));

    const treeNodes = members.map((m) => ({
      id: m.id,
      entityId: m.entityId,
      entityName: entityMap.get(m.entityId)?.name || "Unknown",
      entityCurrency: entityMap.get(m.entityId)?.currency || "USD",
      ownershipPercent: Number(m.ownershipPercent),
      consolidationMethod: m.consolidationMethod,
      functionalCurrency: m.functionalCurrency,
      isDirectSubsidiary: m.isDirectSubsidiary,
    }));

    return {
      group: {
        id: group.id,
        name: group.name,
        groupType: group.groupType,
        baseCurrency: group.baseCurrency,
        consolidationMethod: group.consolidationMethod,
      },
      memberCount: treeNodes.length,
      members: treeNodes,
    };
  }

  // ── Execution ──────────────────────────────────────────────────────────────

  async createRun(
    tenantId: string,
    _userId: string,
    dto: { groupId: string; periodId: string },
  ) {
    await this.getGroup(tenantId, dto.groupId);
    const existingRun = await prisma.consolidationExecution.findFirst({
      where: {
        tenantId,
        groupId: dto.groupId,
        periodId: dto.periodId,
        status: "DRAFT",
      },
    });
    if (existingRun)
      throw new BadRequestException(
        "A draft run already exists for this group/period",
      );

    return prisma.consolidationExecution.create({
      data: {
        tenantId,
        groupId: dto.groupId,
        periodId: dto.periodId,
        status: "DRAFT",
        startedAt: new Date(),
      },
    });
  }

  async executeRun(tenantId: string, id: string) {
    const run = await prisma.consolidationExecution.findFirst({
      where: { id, tenantId },
    });
    if (!run) throw new NotFoundException("Consolidation run not found");
    if (run.status !== "DRAFT") {
      throw new BadRequestException(`Run is already ${run.status}`);
    }

    const group = await this.getGroup(tenantId, run.groupId);
    const members = await prisma.consolidationGroupMember.findMany({
      where: { tenantId, groupId: group.id },
    });

    let consolidatedRevenue = 0;
    let consolidatedExpenses = 0;
    let totalEliminations = 0;
    let minorityInterest = 0;

    for (const member of members) {
      const accounts = await prisma.account.findMany({
        where: { tenantId, orgId: member.entityId, isActive: true },
      });

      const rate = member.functionalCurrency === group.baseCurrency ? 1 : 1.0;

      for (const account of accounts) {
        const balance = Number(account.balance) * rate;
        if (account.type === "REVENUE") consolidatedRevenue += balance;
        else if (account.type === "EXPENSE") consolidatedExpenses += balance;
      }

      const nciPct = (100 - Number(member.ownershipPercent)) / 100;
      const entityNetIncome = accounts
        .filter((a) => a.type === "REVENUE")
        .reduce((s, a) => s + Number(a.balance) * rate, 0);
      const entityExpenses = accounts
        .filter((a) => a.type === "EXPENSE")
        .reduce((s, a) => s + Number(a.balance) * rate, 0);
      minorityInterest += (entityNetIncome - entityExpenses) * nciPct;
    }

    const rules = await prisma.consolidationEliminationRule.findMany({
      where: { tenantId, groupId: group.id, isActive: true },
    });

    for (const rule of rules) {
      const entries = await prisma.journalEntry.findMany({
        where: {
          tenantId,
          accountId:
            rule.sourceEntityId || rule.targetEntityId
              ? { in: [rule.sourceEntityId || "", rule.targetEntityId || ""] }
              : undefined,
        },
      });
      for (const entry of entries) {
        const amt = Number(entry.debit) + Number(entry.credit);
        totalEliminations += amt;

        await prisma.consolidationEliminationEntry.create({
          data: {
            tenantId,
            runId: id,
            ruleId: rule.id,
            sourceEntityId: rule.sourceEntityId,
            targetEntityId: rule.targetEntityId,
            accountId: entry.accountId,
            amount: new Prisma.Decimal(amt),
            entryType: "AUTO",
            eliminationType: rule.ruleType,
            status: "DRAFT",
          },
        });
      }
    }

    const consolidatedNetIncome = consolidatedRevenue - consolidatedExpenses;

    return prisma.consolidationExecution.update({
      where: { id },
      data: {
        status: "COMPLETED",
        totalEliminations,
        minorityInterest: new Prisma.Decimal(minorityInterest),
        consolidatedRevenue: new Prisma.Decimal(consolidatedRevenue),
        consolidatedNetIncome: new Prisma.Decimal(consolidatedNetIncome),
        completedAt: new Date(),
      },
    });
  }

  async reviewRun(tenantId: string, id: string, userId: string) {
    const run = await prisma.consolidationExecution.findFirst({
      where: { id, tenantId },
    });
    if (!run) throw new NotFoundException("Consolidation run not found");
    if (run.status !== "COMPLETED") {
      throw new BadRequestException("Only completed runs can be reviewed");
    }
    return prisma.consolidationExecution.update({
      where: { id },
      data: { status: "REVIEWED", reviewedBy: userId },
    });
  }

  async postRun(tenantId: string, id: string) {
    const run = await prisma.consolidationExecution.findFirst({
      where: { id, tenantId },
    });
    if (!run) throw new NotFoundException("Consolidation run not found");
    if (run.status !== "REVIEWED") {
      throw new BadRequestException("Only reviewed runs can be posted");
    }

    await prisma.consolidationEliminationEntry.updateMany({
      where: { runId: id, status: "DRAFT" },
      data: { status: "POSTED", postedAt: new Date() },
    });

    return prisma.consolidationExecution.update({
      where: { id },
      data: { status: "POSTED", postedAt: new Date() },
    });
  }

  // ── Elimination Rules ──────────────────────────────────────────────────────

  async createEliminationRule(
    tenantId: string,
    dto: {
      groupId: string;
      name: string;
      ruleType: string;
      sourceEntityId?: string;
      targetEntityId?: string;
      matchCriteria: Prisma.JsonValue;
      autoPost?: boolean;
      toleranceAmount?: number;
    },
  ) {
    return prisma.consolidationEliminationRule.create({
      data: {
        tenantId,
        groupId: dto.groupId,
        name: dto.name,
        ruleType: dto.ruleType,
        sourceEntityId: dto.sourceEntityId || null,
        targetEntityId: dto.targetEntityId || null,
        matchCriteria: dto.matchCriteria as any,
        autoPost: dto.autoPost || false,
        toleranceAmount: dto.toleranceAmount
          ? new Prisma.Decimal(dto.toleranceAmount)
          : null,
        isActive: true,
      },
    });
  }

  async listEliminationRules(tenantId: string, groupId?: string) {
    const where: Prisma.ConsolidationEliminationRuleWhereInput = { tenantId };
    if (groupId) where.groupId = groupId;
    return prisma.consolidationEliminationRule.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
  }

  async getEliminationRule(tenantId: string, id: string) {
    const rule = await prisma.consolidationEliminationRule.findFirst({
      where: { id, tenantId },
    });
    if (!rule) throw new NotFoundException("Elimination rule not found");
    return rule;
  }

  async updateEliminationRule(
    tenantId: string,
    id: string,
    dto: {
      name?: string;
      matchCriteria?: Prisma.JsonValue;
      autoPost?: boolean;
      toleranceAmount?: number;
      isActive?: boolean;
    },
  ) {
    await this.getEliminationRule(tenantId, id);
    const data: Prisma.ConsolidationEliminationRuleUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.matchCriteria !== undefined)
      data.matchCriteria = dto.matchCriteria as any;
    if (dto.autoPost !== undefined) data.autoPost = dto.autoPost;
    if (dto.toleranceAmount !== undefined)
      data.toleranceAmount = new Prisma.Decimal(dto.toleranceAmount);
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    return prisma.consolidationEliminationRule.update({ where: { id }, data });
  }

  async deleteEliminationRule(tenantId: string, id: string) {
    await this.getEliminationRule(tenantId, id);
    await prisma.consolidationEliminationRule.delete({ where: { id } });
    return { success: true };
  }

  async updateEliminationRuleAutoPost(
    tenantId: string,
    id: string,
    autoPost: boolean,
  ) {
    await this.getEliminationRule(tenantId, id);
    return prisma.consolidationEliminationRule.update({
      where: { id },
      data: { autoPost },
    });
  }

  // ── Elimination Entries ────────────────────────────────────────────────────

  async listEliminationEntries(
    tenantId: string,
    query: { runId?: string; status?: string; page?: string; limit?: string },
  ) {
    const page = Math.max(1, parseInt(query.page || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(query.limit || "20", 10)));
    const skip = (page - 1) * limit;

    const where: Prisma.ConsolidationEliminationEntryWhereInput = { tenantId };
    if (query.runId) where.runId = query.runId;
    if (query.status) where.status = query.status;

    const [items, total] = await Promise.all([
      prisma.consolidationEliminationEntry.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.consolidationEliminationEntry.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async approveEliminationEntry(tenantId: string, id: string) {
    const entry = await prisma.consolidationEliminationEntry.findFirst({
      where: { id, tenantId },
    });
    if (!entry) throw new NotFoundException("Elimination entry not found");
    if (entry.status !== "DRAFT") {
      throw new BadRequestException(`Entry is already ${entry.status}`);
    }
    return prisma.consolidationEliminationEntry.update({
      where: { id },
      data: { status: "APPROVED" },
    });
  }

  async postEliminationEntry(tenantId: string, id: string) {
    const entry = await prisma.consolidationEliminationEntry.findFirst({
      where: { id, tenantId },
    });
    if (!entry) throw new NotFoundException("Elimination entry not found");
    if (entry.status !== "APPROVED") {
      throw new BadRequestException("Only approved entries can be posted");
    }
    return prisma.consolidationEliminationEntry.update({
      where: { id },
      data: { status: "POSTED", postedAt: new Date() },
    });
  }

  // ── Translation Adjustments ────────────────────────────────────────────────

  async computeTranslationAdjustments(
    tenantId: string,
    runId: string,
    reportingCurrency: string,
  ) {
    const run = await prisma.consolidationExecution.findFirst({
      where: { id: runId, tenantId },
    });
    if (!run) throw new NotFoundException("Consolidation run not found");

    const group = await this.getGroup(tenantId, run.groupId);
    const members = await prisma.consolidationGroupMember.findMany({
      where: { tenantId, groupId: group.id },
    });

    const adjustments: Array<{
      entityId: string;
      accountId: string;
      originalAmount: number;
      translatedAmount: number;
      exchangeRate: number;
      adjustmentAmount: number;
    }> = [];

    for (const member of members) {
      if (member.functionalCurrency === reportingCurrency) continue;

      const rate = await this.getRate(
        tenantId,
        member.functionalCurrency,
        reportingCurrency,
      );
      const accounts = await prisma.account.findMany({
        where: { tenantId, orgId: member.entityId, isActive: true },
      });

      for (const account of accounts) {
        const originalAmount = Number(account.balance);
        const translatedAmount = originalAmount * rate;
        const adjustmentAmount = translatedAmount - originalAmount;

        await prisma.consolidationTranslationAdjustment.create({
          data: {
            tenantId,
            runId,
            entityId: member.entityId,
            accountId: account.id,
            originalAmount: new Prisma.Decimal(originalAmount),
            translatedAmount: new Prisma.Decimal(translatedAmount),
            exchangeRate: new Prisma.Decimal(rate),
            translationMethod: "CURRENT_RATE",
            adjustmentAmount: new Prisma.Decimal(adjustmentAmount),
          },
        });

        adjustments.push({
          entityId: member.entityId,
          accountId: account.id,
          originalAmount,
          translatedAmount,
          exchangeRate: rate,
          adjustmentAmount,
        });
      }
    }

    const totalAdjustment = adjustments.reduce(
      (s, a) => s + a.adjustmentAmount,
      0,
    );
    await prisma.consolidationExecution.update({
      where: { id: runId },
      data: { translationAdjustment: new Prisma.Decimal(totalAdjustment) },
    });

    return {
      runId,
      adjustmentsCount: adjustments.length,
      totalAdjustment,
      adjustments,
    };
  }

  async listTranslationAdjustments(tenantId: string, runId: string) {
    return prisma.consolidationTranslationAdjustment.findMany({
      where: { tenantId, runId },
      orderBy: { createdAt: "desc" },
    });
  }

  // ── Minority Interest ──────────────────────────────────────────────────────

  async computeMinorityInterest(tenantId: string, runId: string) {
    const run = await prisma.consolidationExecution.findFirst({
      where: { id: runId, tenantId },
    });
    if (!run) throw new NotFoundException("Consolidation run not found");

    const group = await this.getGroup(tenantId, run.groupId);
    const members = await prisma.consolidationGroupMember.findMany({
      where: { tenantId, groupId: group.id },
    });

    const minorityItems: Array<{
      entityId: string;
      nciPercentage: number;
      netIncomeShare: number;
      equityShare: number;
    }> = [];

    for (const member of members) {
      const nciPct = (100 - Number(member.ownershipPercent)) / 100;
      if (nciPct <= 0) continue;

      const accounts = await prisma.account.findMany({
        where: { tenantId, orgId: member.entityId, isActive: true },
      });

      const revenue = accounts
        .filter((a) => a.type === "REVENUE")
        .reduce((s, a) => s + Number(a.balance), 0);
      const expenses = accounts
        .filter((a) => a.type === "EXPENSE")
        .reduce((s, a) => s + Number(a.balance), 0);
      const equity = accounts
        .filter((a) => a.type === "EQUITY")
        .reduce((s, a) => s + Number(a.balance), 0);

      const netIncomeShare = (revenue - expenses) * nciPct;
      const equityShare = equity * nciPct;

      await prisma.minorityInterestSchedule.create({
        data: {
          tenantId,
          runId,
          entityId: member.entityId,
          nciPercentage: new Prisma.Decimal(nciPct * 100),
          netIncomeShare: new Prisma.Decimal(netIncomeShare),
          equityShare: new Prisma.Decimal(equityShare),
          attributionType: member.isDirectSubsidiary ? "DIRECT" : "INDIRECT",
        },
      });

      minorityItems.push({
        entityId: member.entityId,
        nciPercentage: nciPct * 100,
        netIncomeShare,
        equityShare,
      });
    }

    const totalMinorityInterest = minorityItems.reduce(
      (s, m) => s + m.netIncomeShare,
      0,
    );

    await prisma.consolidationExecution.update({
      where: { id: runId },
      data: { minorityInterest: new Prisma.Decimal(totalMinorityInterest) },
    });

    return {
      runId,
      itemsCount: minorityItems.length,
      totalMinorityInterest,
      items: minorityItems,
    };
  }

  async listMinorityInterest(tenantId: string, runId: string) {
    return prisma.minorityInterestSchedule.findMany({
      where: { tenantId, runId },
      orderBy: { createdAt: "desc" },
    });
  }

  // ── Dashboard ──────────────────────────────────────────────────────────────

  async getConsolidationDashboard(tenantId: string) {
    const [groups, runs, rules, entries] = await Promise.all([
      prisma.consolidationGroup.count({ where: { tenantId } }),
      prisma.consolidationExecution.findMany({
        where: { tenantId },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.consolidationEliminationRule.count({
        where: { tenantId, isActive: true },
      }),
      prisma.consolidationEliminationEntry.count({
        where: { tenantId, status: "DRAFT" },
      }),
    ]);

    const runsByStatus = await prisma.consolidationExecution.groupBy({
      by: ["status"],
      where: { tenantId },
      _count: true,
    });

    return {
      totalGroups: groups,
      activeEliminationRules: rules,
      pendingEliminationEntries: entries,
      recentRuns: runs.map((r) => ({
        id: r.id,
        status: r.status,
        periodId: r.periodId,
        consolidatedRevenue: Number(r.consolidatedRevenue || 0),
        consolidatedNetIncome: Number(r.consolidatedNetIncome || 0),
        totalEliminations: r.totalEliminations,
        minorityInterest: Number(r.minorityInterest || 0),
        translationAdjustment: Number(r.translationAdjustment || 0),
        completedAt: r.completedAt,
      })),
      runsByStatus: runsByStatus.map((r) => ({
        status: r.status,
        count: r._count,
      })),
    };
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private async getRate(
    tenantId: string,
    from: string,
    to: string,
  ): Promise<number> {
    if (from === to) return 1;
    const direct = await prisma.exchangeRate.findFirst({
      where: { tenantId, fromCurrency: from, toCurrency: to },
      orderBy: { date: "desc" },
    });
    if (direct) return Number(direct.rate);
    const inverse = await prisma.exchangeRate.findFirst({
      where: { tenantId, fromCurrency: to, toCurrency: from },
      orderBy: { date: "desc" },
    });
    if (inverse && Number(inverse.rate) !== 0) return 1 / Number(inverse.rate);
    return 1;
  }
}
