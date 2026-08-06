import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";
import { Prisma } from "@prisma/client";
import type {
  CreateCapexProjectDto,
  AddCapexBudgetLineDto,
  ConductGateReviewDto,
} from "../dto/projects-deep.dto";

@Injectable()
export class ProjectsCapexService {
  async getCapexProjects(tenantId: string) {
    return prisma.capexProject.findMany({
      where: { tenantId },
      include: { budgetLines: true, gateReviews: true, capitalizations: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async getCapexProjectById(tenantId: string, id: string) {
    const project = await prisma.capexProject.findFirst({
      where: { id, tenantId },
      include: {
        budgetLines: true,
        gateReviews: true,
        capitalizations: true,
        project: true,
      },
    });
    if (!project) throw new NotFoundException("CAPEX project not found");
    return project;
  }

  async createCapexProject(
    tenantId: string,
    orgId: string,
    dto: CreateCapexProjectDto,
  ) {
    let resolvedOrgId = orgId;
    if (!orgId || orgId === "org-system-default") {
      const org = await prisma.organization.findFirst({ where: { tenantId } });
      if (!org)
        throw new BadRequestException("No Organization found for this Tenant.");
      resolvedOrgId = org.id;
    }
    const existing = await prisma.capexProject.findFirst({
      where: { tenantId, orgId: resolvedOrgId, code: dto.code },
    });
    if (existing)
      throw new BadRequestException(
        `CAPEX project code ${dto.code} already exists.`,
      );
    if (dto.projectId) {
      const linkedProject = await prisma.project.findFirst({
        where: { id: dto.projectId, tenantId },
      });
      if (!linkedProject)
        throw new NotFoundException("Linked project not found");
    }
    return prisma.capexProject.create({
      data: {
        tenantId,
        orgId: resolvedOrgId,
        projectId: dto.projectId || null,
        name: dto.name,
        code: dto.code,
        description: dto.description || null,
        justification: dto.justification || null,
        category: dto.category || null,
        totalBudget: new Prisma.Decimal(dto.totalBudget),
        requestDate: new Date(dto.requestDate),
        expectedLifeYears: dto.expectedLifeYears || null,
        residualValue: dto.residualValue
          ? new Prisma.Decimal(dto.residualValue)
          : null,
        depreciationMethod: dto.depreciationMethod || null,
      },
    });
  }

  async submitBudgetApproval(
    tenantId: string,
    id: string,
    approvedBudget: number,
  ) {
    const project = await prisma.capexProject.findFirst({
      where: { id, tenantId },
    });
    if (!project) throw new NotFoundException("CAPEX project not found");
    return prisma.capexProject.update({
      where: { id },
      data: {
        status: "APPROVED",
        approvedBudget: new Prisma.Decimal(approvedBudget),
        approvalDate: new Date(),
      },
    });
  }

  async addBudgetLine(tenantId: string, dto: AddCapexBudgetLineDto) {
    const capex = await prisma.capexProject.findFirst({
      where: { id: dto.capexId, tenantId },
    });
    if (!capex) throw new NotFoundException("CAPEX project not found");
    return prisma.capexBudgetLine.create({
      data: {
        tenantId,
        capexId: dto.capexId,
        category: dto.category,
        description: dto.description,
        requested: new Prisma.Decimal(dto.requested),
        fiscalYear: dto.fiscalYear || null,
        notes: dto.notes || null,
      },
    });
  }

  async getBudgetLines(tenantId: string, capexId: string) {
    return prisma.capexBudgetLine.findMany({
      where: { tenantId, capexId },
      orderBy: { createdAt: "desc" },
    });
  }

  async conductGateReview(tenantId: string, dto: ConductGateReviewDto) {
    const capex = await prisma.capexProject.findFirst({
      where: { id: dto.capexId, tenantId },
    });
    if (!capex) throw new NotFoundException("CAPEX project not found");
    return prisma.capexGateReview.create({
      data: {
        tenantId,
        capexId: dto.capexId,
        gateName: dto.gateName,
        gateNumber: dto.gateNumber,
        status: dto.status,
        reviewDate: new Date(),
        reviewerId: dto.reviewerId || null,
        comments: dto.comments || null,
        score: dto.score || null,
      },
    });
  }

  async getGateReviews(tenantId: string, capexId: string) {
    return prisma.capexGateReview.findMany({
      where: { tenantId, capexId },
      orderBy: { gateNumber: "asc" },
    });
  }

  async performCapitalization(
    tenantId: string,
    capexId: string,
    dto: {
      assetName: string;
      assetClass?: string;
      capitalAmount: number;
      capitalizationDate: string;
      usefulLifeYears: number;
      salvageValue?: number;
      depreciationMethod?: string;
      glAccountId?: string;
      notes?: string;
    },
  ) {
    const capex = await prisma.capexProject.findFirst({
      where: { id: capexId, tenantId },
    });
    if (!capex) throw new NotFoundException("CAPEX project not found");
    return prisma.capexCapitalization.create({
      data: {
        tenantId,
        capexId,
        assetName: dto.assetName,
        assetClass: dto.assetClass || null,
        capitalAmount: new Prisma.Decimal(dto.capitalAmount),
        capitalizationDate: new Date(dto.capitalizationDate),
        usefulLifeYears: dto.usefulLifeYears,
        salvageValue: dto.salvageValue
          ? new Prisma.Decimal(dto.salvageValue)
          : null,
        depreciationMethod: dto.depreciationMethod || null,
        glAccountId: dto.glAccountId || null,
        notes: dto.notes || null,
      },
    });
  }

  async getCapexDashboard(tenantId: string) {
    const projects = await prisma.capexProject.findMany({
      where: { tenantId },
    });
    const totalBudget = projects.reduce((s, p) => s + Number(p.totalBudget), 0);
    const approvedBudget = projects.reduce(
      (s, p) => s + Number(p.approvedBudget || 0),
      0,
    );
    const spent = projects.reduce((s, p) => s + Number(p.spentToDate || 0), 0);
    return {
      totalProjects: projects.length,
      pendingApproval: projects.filter((p) => p.status === "PENDING_APPROVAL")
        .length,
      approved: projects.filter((p) => p.status === "APPROVED").length,
      inProgress: projects.filter((p) => p.status === "IN_PROGRESS").length,
      completed: projects.filter((p) => p.status === "COMPLETED").length,
      totalBudget,
      approvedBudget,
      spentToDate: spent,
      remainingBudget: approvedBudget - spent,
      utilizationRate:
        approvedBudget > 0 ? Math.round((spent / approvedBudget) * 100) : 0,
    };
  }
}
