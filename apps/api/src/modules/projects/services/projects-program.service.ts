import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";
import { Prisma } from "@prisma/client";
import type {
  CreateProgramDto,
  AddProgramProjectDto,
  TrackProgramBenefitDto,
} from "../dto/projects-deep.dto";

@Injectable()
export class ProjectsProgramService {
  async getPrograms(tenantId: string) {
    return prisma.program.findMany({
      where: { tenantId },
      include: {
        programProjects: { include: { project: true } },
        programBenefits: true,
        programFinancials: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getProgramById(tenantId: string, id: string) {
    const program = await prisma.program.findFirst({
      where: { id, tenantId },
      include: {
        programProjects: { include: { project: true } },
        programBenefits: true,
        programFinancials: true,
      },
    });
    if (!program) throw new NotFoundException("Program not found");
    return program;
  }

  async createProgram(tenantId: string, orgId: string, dto: CreateProgramDto) {
    let resolvedOrgId = orgId;
    if (!orgId || orgId === "org-system-default") {
      const org = await prisma.organization.findFirst({ where: { tenantId } });
      if (!org)
        throw new BadRequestException("No Organization found for this Tenant.");
      resolvedOrgId = org.id;
    }
    const existing = await prisma.program.findFirst({
      where: { tenantId, orgId: resolvedOrgId, code: dto.code },
    });
    if (existing)
      throw new BadRequestException(`Program code ${dto.code} already exists.`);
    return prisma.program.create({
      data: {
        tenantId,
        orgId: resolvedOrgId,
        name: dto.name,
        code: dto.code,
        description: dto.description || null,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        budget: dto.budget ? new Prisma.Decimal(dto.budget) : null,
        strategicAlignment: dto.strategicAlignment || "MEDIUM",
        sponsorId: dto.sponsorId || null,
        managerId: dto.managerId || null,
      },
    });
  }

  async addProgramProject(
    tenantId: string,
    programId: string,
    dto: AddProgramProjectDto,
  ) {
    const program = await prisma.program.findFirst({
      where: { id: programId, tenantId },
    });
    if (!program) throw new NotFoundException("Program not found");
    const project = await prisma.project.findFirst({
      where: { id: dto.projectId, tenantId },
    });
    if (!project) throw new NotFoundException("Project not found");
    const existing = await prisma.programProject.findFirst({
      where: { tenantId, programId, projectId: dto.projectId },
    });
    if (existing)
      throw new BadRequestException("Project already linked to this program.");
    return prisma.programProject.create({
      data: { tenantId, programId, projectId: dto.projectId },
      include: { project: true },
    });
  }

  async removeProgramProject(tenantId: string, programProjectId: string) {
    const link = await prisma.programProject.findFirst({
      where: { id: programProjectId, tenantId },
    });
    if (!link) throw new NotFoundException("Program-project link not found");
    return prisma.programProject.delete({ where: { id: programProjectId } });
  }

  async trackProgramBenefit(
    tenantId: string,
    programId: string,
    dto: TrackProgramBenefitDto,
  ) {
    const program = await prisma.program.findFirst({
      where: { id: programId, tenantId },
    });
    if (!program) throw new NotFoundException("Program not found");
    return prisma.programBenefit.create({
      data: {
        tenantId,
        programId,
        name: dto.name,
        description: dto.description || null,
        metric: dto.metric || "ROI",
        targetValue: dto.targetValue
          ? new Prisma.Decimal(dto.targetValue)
          : null,
        targetDate: dto.targetDate ? new Date(dto.targetDate) : null,
      },
    });
  }

  async updateBenefitStatus(
    tenantId: string,
    benefitId: string,
    status: string,
    actualValue?: number,
  ) {
    const benefit = await prisma.programBenefit.findFirst({
      where: { id: benefitId, tenantId },
    });
    if (!benefit) throw new NotFoundException("Program benefit not found");
    return prisma.programBenefit.update({
      where: { id: benefitId },
      data: {
        status,
        actualValue:
          actualValue !== undefined
            ? new Prisma.Decimal(actualValue)
            : undefined,
        achievedAt: status === "ACHIEVED" ? new Date() : undefined,
      },
    });
  }

  async getProgramFinancials(tenantId: string, programId: string) {
    const program = await prisma.program.findFirst({
      where: { id: programId, tenantId },
    });
    if (!program) throw new NotFoundException("Program not found");
    return prisma.programFinancial.findMany({
      where: { tenantId, programId },
      orderBy: { fiscalYear: "asc" },
    });
  }

  async addProgramFinancial(
    tenantId: string,
    programId: string,
    dto: {
      fiscalYear: string;
      category: string;
      amount: number;
      period?: string;
      notes?: string;
    },
  ) {
    const program = await prisma.program.findFirst({
      where: { id: programId, tenantId },
    });
    if (!program) throw new NotFoundException("Program not found");
    return prisma.programFinancial.create({
      data: {
        tenantId,
        programId,
        fiscalYear: dto.fiscalYear,
        category: dto.category,
        amount: new Prisma.Decimal(dto.amount),
        period: dto.period || null,
        notes: dto.notes || null,
      },
    });
  }

  async getProgramDashboard(tenantId: string, programId: string) {
    const program = await this.getProgramById(tenantId, programId);
    const totalBudget = Number(program.budget || 0);
    const benefits = program.programBenefits;
    const achievedBenefits = benefits.filter(
      (b) => b.status === "ACHIEVED",
    ).length;
    const projectsList = program.programProjects.map((pp) => pp.project);
    const activeProjects = projectsList.filter(
      (p) => p.status === "ACTIVE",
    ).length;
    const completedProjects = projectsList.filter(
      (p) => p.status === "COMPLETED",
    ).length;
    return {
      ...program,
      totalProjects: projectsList.length,
      activeProjects,
      completedProjects,
      totalBenefits: benefits.length,
      achievedBenefits,
      benefitProgress:
        benefits.length > 0
          ? Math.round((achievedBenefits / benefits.length) * 100)
          : 0,
      budgetUtilization:
        totalBudget > 0
          ? Math.round((Number(program.actualSpend || 0) / totalBudget) * 100)
          : 0,
    };
  }
}
