// @ts-nocheck
import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class AdvancedHrWorkforceDeepService {
  async listHeadcountPlans(tenantId: string, fiscalYear?: string, status?: string) {
    const where: any = { tenantId };
    if (fiscalYear) where.fiscalYear = parseInt(fiscalYear, 10);
    if (status) where.status = status;
    return prisma.hrHeadcountPlan.findMany({ where, orderBy: { createdAt: "desc" } });
  }

  async getHeadcountPlan(tenantId: string, id: string) {
    const plan = await prisma.hrHeadcountPlan.findFirst({ where: { id, tenantId }, include: { lines: true } });
    if (!plan) throw new NotFoundException("Headcount plan not found");
    return plan;
  }

  async createHeadcountPlan(tenantId: string, data: { name: string; fiscalYear: number; description?: string }, userId: string) {
    return prisma.hrHeadcountPlan.create({
      data: { tenantId, name: data.name, fiscalYear: data.fiscalYear, description: data.description, status: "DRAFT" },
    });
  }

  async updateHeadcountPlan(tenantId: string, id: string, data: { name?: string; description?: string; status?: string; approvedBy?: string }, userId: string) {
    const existing = await prisma.hrHeadcountPlan.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException("Headcount plan not found");
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.approvedBy !== undefined) { updateData.approvedBy = data.approvedBy; updateData.approvedAt = new Date(); }
    return prisma.hrHeadcountPlan.update({ where: { id }, data: updateData });
  }

  async listHeadcountPlanLines(tenantId: string, planId: string) {
    const plan = await prisma.hrHeadcountPlan.findFirst({ where: { id: planId, tenantId } });
    if (!plan) throw new NotFoundException("Headcount plan not found");
    return prisma.hrHeadcountPlanLine.findMany({ where: { tenantId, planId }, orderBy: { createdAt: "asc" } });
  }

  async listSuccessionPlans(tenantId: string, status?: string) {
    const where: any = { tenantId };
    if (status) where.status = status;
    return prisma.hrSuccessionPlan.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { candidates: true },
    });
  }

  async getSuccessionPlan(tenantId: string, id: string) {
    const plan = await prisma.hrSuccessionPlan.findFirst({ where: { id, tenantId }, include: { candidates: true } });
    if (!plan) throw new NotFoundException("Succession plan not found");
    return plan;
  }

  async createSuccessionPlan(tenantId: string, data: { positionId: string; riskLevel?: string; notes?: string }, userId: string) {
    return prisma.hrSuccessionPlan.create({
      data: { tenantId, positionId: data.positionId, riskLevel: data.riskLevel || "MEDIUM", notes: data.notes, status: "ACTIVE" },
    });
  }

  async listSuccessionCandidates(tenantId: string, planId: string) {
    const plan = await prisma.hrSuccessionPlan.findFirst({ where: { id: planId, tenantId } });
    if (!plan) throw new NotFoundException("Succession plan not found");
    return prisma.hrSuccessionCandidate.findMany({ where: { tenantId, planId }, orderBy: { rank: "asc" } });
  }

  async addSuccessionCandidate(tenantId: string, data: { planId: string; employeeId: string; readinessLevel: string; readinessTimeline?: string; strengths?: string; developmentAreas?: string; isPreferred?: boolean; rank?: number }, userId: string) {
    const plan = await prisma.hrSuccessionPlan.findFirst({ where: { id: data.planId, tenantId } });
    if (!plan) throw new NotFoundException("Succession plan not found");
    return prisma.hrSuccessionCandidate.create({
      data: { tenantId, planId: data.planId, employeeId: data.employeeId, readinessLevel: data.readinessLevel, readinessTimeline: data.readinessTimeline, strengths: data.strengths, developmentAreas: data.developmentAreas, isPreferred: data.isPreferred ?? false, rank: data.rank },
    });
  }

  async getSkillGapAnalysis(tenantId: string, departmentId?: string) {
    const where: any = { tenantId };
    if (departmentId) where.employee = { departmentId };
    return prisma.skillGapAnalysis.findMany({
      where,
      include: { skill: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async listCareerPaths(tenantId: string, departmentId?: string) {
    const where: any = { tenantId, isActive: true };
    return prisma.careerPath.findMany({
      where,
      include: { requirements: { include: { skill: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  async listMentoringPrograms(tenantId: string, status?: string) {
    const where: any = { tenantId };
    if (status) where.status = status;
    return prisma.mentoringProgram.findMany({
      where,
      include: { sessions: true },
      orderBy: { createdAt: "desc" },
    });
  }
}
