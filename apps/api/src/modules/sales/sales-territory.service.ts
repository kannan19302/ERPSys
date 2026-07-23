import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { prisma } from "@unerp/database";
import { Prisma } from "@prisma/client";

@Injectable()
export class SalesTerritoryService {
  async getTerritories(tenantId: string) {
    return prisma.salesTerritory.findMany({
      where: { tenantId, deletedAt: null },
      include: { _count: { select: { members: true, children: true } }, parent: { select: { id: true, name: true } } },
      orderBy: { name: "asc" },
    });
  }

  async getTerritoryById(tenantId: string, id: string) {
    const territory = await prisma.salesTerritory.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: { parent: true, children: { where: { deletedAt: null } }, members: true, rules: { where: { isActive: true } }, salesTerritoryForecasts: { orderBy: { period: "desc" }, take: 8 }, salesTerritoryRealignments: { orderBy: { createdAt: "desc" }, take: 10 } },
    });
    if (!territory) throw new NotFoundException("Territory not found");
    return territory;
  }

  async createTerritory(tenantId: string, orgId: string, dto: any) {
    let resolvedOrgId = orgId;
    if (!orgId || orgId === "org-system-default") {
      const org = await prisma.organization.findFirst({ where: { tenantId } });
      if (!org) throw new BadRequestException("No Organization found.");
      resolvedOrgId = org.id;
    }
    if (dto.parentId) {
      const parent = await prisma.salesTerritory.findFirst({ where: { id: dto.parentId, tenantId } });
      if (!parent) throw new NotFoundException("Parent territory not found");
    }
    return prisma.salesTerritory.create({
      data: {
        tenantId, orgId: resolvedOrgId, name: dto.name,
        description: dto.description || null,
        criteria: (dto.criteria || {}) as Prisma.InputJsonValue,
        parentId: dto.parentId || null, managerId: dto.managerId || null,
      },
    });
  }

  async updateTerritory(tenantId: string, id: string, dto: any) {
    const existing = await prisma.salesTerritory.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException("Territory not found");
    const data: Prisma.SalesTerritoryUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.criteria !== undefined) data.criteria = dto.criteria as Prisma.InputJsonValue;
    if (dto.parentId !== undefined && dto.parentId !== null) {
      const parent = await prisma.salesTerritory.findFirst({ where: { id: dto.parentId, tenantId } });
      if (!parent) throw new NotFoundException("Parent territory not found");
      data.parent = { connect: { id: dto.parentId } };
    } else if (dto.parentId === null) {
      data.parent = { disconnect: true };
    }
    if (dto.managerId !== undefined) data.managerId = dto.managerId;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    return prisma.salesTerritory.update({ where: { id }, data });
  }

  async deleteTerritory(tenantId: string, id: string) {
    const existing = await prisma.salesTerritory.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException("Territory not found");
    const children = await prisma.salesTerritory.count({ where: { parentId: id, deletedAt: null } });
    if (children > 0) throw new BadRequestException("Cannot delete territory with active children");
    return prisma.salesTerritory.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async getTerritoryHierarchy(tenantId: string) {
    const territories = await prisma.salesTerritory.findMany({ where: { tenantId, deletedAt: null }, include: { members: true, children: { where: { deletedAt: null } } }, orderBy: { name: "asc" } });

    const buildTree = (parentId: string | null): any[] => {
      return territories.filter((t) => t.parentId === parentId).map((t) => ({ ...t, children: buildTree(t.id) }));
    };
    return buildTree(null);
  }

  async addMember(tenantId: string, territoryId: string, dto: any) {
    const territory = await prisma.salesTerritory.findFirst({ where: { id: territoryId, tenantId } });
    if (!territory) throw new NotFoundException("Territory not found");
    const existing = await prisma.salesTeamMember.findFirst({ where: { territoryId, userId: dto.userId } });
    if (existing) throw new BadRequestException("User is already a member of this territory");
    return prisma.salesTeamMember.create({ data: { tenantId, territoryId, userId: dto.userId, role: dto.role || "REP" } });
  }

  async removeMember(tenantId: string, territoryId: string, userId: string) {
    const member = await prisma.salesTeamMember.findFirst({ where: { territoryId, userId, tenantId } });
    if (!member) throw new NotFoundException("Member not found");
    return prisma.salesTeamMember.delete({ where: { territoryId_userId: { territoryId, userId } } });
  }

  async updateMemberRole(tenantId: string, territoryId: string, userId: string, role: string) {
    const member = await prisma.salesTeamMember.findFirst({ where: { territoryId, userId, tenantId } });
    if (!member) throw new NotFoundException("Member not found");
    return prisma.salesTeamMember.update({ where: { territoryId_userId: { territoryId, userId } }, data: { role } });
  }

  async getRules(tenantId: string, territoryId?: string) {
    const where: Prisma.TerritoryAssignmentRuleWhereInput = { tenantId };
    if (territoryId) where.territoryId = territoryId;
    return prisma.territoryAssignmentRule.findMany({ where, include: { territory: { select: { id: true, name: true } } }, orderBy: [{ priority: "asc" }, { createdAt: "desc" }] });
  }

  async createRule(tenantId: string, orgId: string, dto: any) {
    let resolvedOrgId = orgId;
    if (!orgId || orgId === "org-system-default") {
      const org = await prisma.organization.findFirst({ where: { tenantId } });
      if (!org) throw new BadRequestException("No Organization found.");
      resolvedOrgId = org.id;
    }
    const territory = await prisma.salesTerritory.findFirst({ where: { id: dto.territoryId, tenantId } });
    if (!territory) throw new NotFoundException("Territory not found");
    return prisma.territoryAssignmentRule.create({
      data: { tenantId, orgId: resolvedOrgId, territoryId: dto.territoryId, name: dto.name, ruleType: dto.ruleType, priority: dto.priority ?? 0, conditions: (dto.conditions || {}) as Prisma.InputJsonValue, createdBy: "system" },
    });
  }

  async updateRule(tenantId: string, id: string, dto: any) {
    const existing = await prisma.territoryAssignmentRule.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException("Rule not found");
    const data: Prisma.TerritoryAssignmentRuleUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.priority !== undefined) data.priority = dto.priority;
    if (dto.conditions !== undefined) data.conditions = dto.conditions as Prisma.InputJsonValue;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    return prisma.territoryAssignmentRule.update({ where: { id }, data });
  }

  async deleteRule(tenantId: string, id: string) {
    const existing = await prisma.territoryAssignmentRule.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException("Rule not found");
    return prisma.territoryAssignmentRule.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async assignEntity(tenantId: string, dto: any) {
    const territory = await prisma.salesTerritory.findFirst({ where: { id: dto.territoryId, tenantId } });
    if (!territory) throw new NotFoundException("Territory not found");
    const logs: Array<{ entityType: string; entityId: string; reason: string }> = [];
    for (const entityId of dto.entityIds) {
      await prisma.territoryAssignmentLog.create({
        data: { tenantId, entityType: dto.entityType, entityId, territoryId: dto.territoryId, ruleId: null, assignedToId: dto.userId, reason: dto.reason || "Manual assignment" },
      });
      logs.push({ entityType: dto.entityType, entityId, reason: dto.reason || "Manual assignment" });
    }
    return { assigned: dto.entityIds.length, territoryId: dto.territoryId, entityType: dto.entityType, logs };
  }

  async getForecasts(tenantId: string, territoryId?: string) {
    const where: Prisma.SalesTerritoryForecastWhereInput = { tenantId };
    if (territoryId) where.territoryId = territoryId;
    return prisma.salesTerritoryForecast.findMany({ where, include: { territory: { select: { id: true, name: true } } }, orderBy: [{ period: "desc" }, { createdAt: "desc" }] });
  }

  async createForecast(tenantId: string, orgId: string, dto: any) {
    let resolvedOrgId = orgId;
    if (!orgId || orgId === "org-system-default") {
      const org = await prisma.organization.findFirst({ where: { tenantId } });
      if (!org) throw new BadRequestException("No Organization found.");
      resolvedOrgId = org.id;
    }
    const territory = await prisma.salesTerritory.findFirst({ where: { id: dto.territoryId, tenantId } });
    if (!territory) throw new NotFoundException("Territory not found");
    return prisma.salesTerritoryForecast.create({
      data: {
        tenantId, orgId: resolvedOrgId, territoryId: dto.territoryId,
        period: dto.period,
        pipelineValue: new Prisma.Decimal(dto.pipelineValue || 0),
        expectedValue: new Prisma.Decimal(dto.expectedValue || 0),
        forecastValue: new Prisma.Decimal(dto.forecastValue || 0),
        confidence: new Prisma.Decimal(dto.confidence || 50),
        notes: dto.notes || null, createdBy: "system",
      },
    });
  }

  async updateForecast(tenantId: string, id: string, dto: any) {
    const existing = await prisma.salesTerritoryForecast.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException("Forecast not found");
    const data: Prisma.SalesTerritoryForecastUpdateInput = {};
    if (dto.pipelineValue !== undefined) data.pipelineValue = new Prisma.Decimal(dto.pipelineValue);
    if (dto.expectedValue !== undefined) data.expectedValue = new Prisma.Decimal(dto.expectedValue);
    if (dto.forecastValue !== undefined) data.forecastValue = new Prisma.Decimal(dto.forecastValue);
    if (dto.confidence !== undefined) data.confidence = new Prisma.Decimal(dto.confidence);
    if (dto.notes !== undefined) data.notes = dto.notes;
    return prisma.salesTerritoryForecast.update({ where: { id }, data });
  }

  async deleteForecast(tenantId: string, id: string) {
    const existing = await prisma.salesTerritoryForecast.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException("Forecast not found");
    return prisma.salesTerritoryForecast.delete({ where: { id } });
  }

  async realignTerritory(tenantId: string, orgId: string, dto: any, changedBy: string) {
    let resolvedOrgId = orgId;
    if (!orgId || orgId === "org-system-default") {
      const org = await prisma.organization.findFirst({ where: { tenantId } });
      if (!org) throw new BadRequestException("No Organization found.");
      resolvedOrgId = org.id;
    }
    const territory = await prisma.salesTerritory.findFirst({ where: { id: dto.territoryId, tenantId } });
    if (!territory) throw new NotFoundException("Territory not found");

    const updateData: Prisma.SalesTerritoryUpdateInput = {};
    if (dto.newManagerId !== undefined) updateData.managerId = dto.newManagerId;
    if (dto.newParentId !== undefined) updateData.parent = dto.newParentId ? { connect: { id: dto.newParentId } } : { disconnect: true };

    await prisma.salesTerritoryRealignment.create({
      data: {
        tenantId, orgId: resolvedOrgId, territoryId: dto.territoryId,
        previousManagerId: territory.managerId, newManagerId: dto.newManagerId || null,
        previousParentId: territory.parentId, newParentId: dto.newParentId || null,
        reason: dto.reason || null, changedBy,
      },
    });

    return prisma.salesTerritory.update({ where: { id: dto.territoryId }, data: updateData });
  }

  async getAssignmentLogs(tenantId: string, entityType?: string, entityId?: string) {
    const where: Prisma.TerritoryAssignmentLogWhereInput = { tenantId };
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;
    return prisma.territoryAssignmentLog.findMany({ where, orderBy: { createdAt: "desc" }, take: 50 });
  }

  async getTerritoryAnalytics(tenantId: string) {
    const [totalTerritories, totalMembers, activeRules, totalForecasts] = await Promise.all([
      prisma.salesTerritory.count({ where: { tenantId, deletedAt: null } }),
      prisma.salesTeamMember.count({ where: { tenantId } }),
      prisma.territoryAssignmentRule.count({ where: { tenantId, isActive: true, deletedAt: null } }),
      prisma.salesTerritoryForecast.count({ where: { tenantId } }),
    ]);
    const forecasts = await prisma.salesTerritoryForecast.findMany({ where: { tenantId } });
    return {
      totalTerritories, totalMembers, activeRules, totalForecasts,
      totalPipelineValue: forecasts.reduce((s, f) => s + Number(f.pipelineValue), 0),
      totalForecastValue: forecasts.reduce((s, f) => s + Number(f.forecastValue), 0),
    };
  }
}
