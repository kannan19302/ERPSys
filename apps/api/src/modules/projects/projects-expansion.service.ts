import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";
import { Prisma } from "@prisma/client";
import type {
  PortfolioMemberDto,
  RiskMitigationDto,
  ResourceAllocationDto,
  BudgetLineDto,
  ProjectDocumentDto,
} from "./dto/projects-expansion.dto";

@Injectable()
export class ProjectsExpansionService {
  // ── Portfolio Members ──
  async getPortfolioMembers(tenantId: string, portfolioId: string) {
    return prisma.projectPortfolioMember.findMany({
      where: { tenantId, portfolioId },
      orderBy: { createdAt: "desc" },
    });
  }

  async addPortfolioMember(
    tenantId: string,
    portfolioId: string,
    dto: PortfolioMemberDto,
  ) {
    const portfolio = await prisma.projectPortfolio.findFirst({
      where: { id: portfolioId, tenantId },
    });
    if (!portfolio) throw new NotFoundException("Portfolio not found");
    return prisma.projectPortfolioMember.create({
      data: { tenantId, portfolioId, userId: dto.userId, role: dto.role },
    });
  }

  async removePortfolioMember(tenantId: string, memberId: string) {
    const member = await prisma.projectPortfolioMember.findFirst({
      where: { id: memberId, tenantId },
    });
    if (!member) throw new NotFoundException("Portfolio member not found");
    return prisma.projectPortfolioMember.delete({ where: { id: memberId } });
  }

  // ── Risk Mitigations ──
  async getRiskMitigations(tenantId: string, riskId: string) {
    return prisma.projectRiskMitigation.findMany({
      where: { tenantId, riskId },
      orderBy: { createdAt: "desc" },
    });
  }

  async createRiskMitigation(tenantId: string, dto: RiskMitigationDto) {
    const risk = await prisma.projectRisk.findFirst({
      where: { id: dto.riskId, tenantId },
    });
    if (!risk) throw new NotFoundException("Project risk not found");
    return prisma.projectRiskMitigation.create({
      data: {
        tenantId,
        riskId: dto.riskId,
        action: dto.action,
        ownerId: dto.ownerId || null,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        notes: dto.notes || null,
      },
    });
  }

  async updateRiskMitigation(
    tenantId: string,
    id: string,
    dto: { status?: string; notes?: string },
  ) {
    const existing = await prisma.projectRiskMitigation.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException("Risk mitigation not found");
    return prisma.projectRiskMitigation.update({
      where: { id },
      data: {
        status: dto.status !== undefined ? dto.status : undefined,
        notes: dto.notes !== undefined ? dto.notes : undefined,
      },
    });
  }

  // ── Resource Allocations ──
  async getResourceAllocations(tenantId: string, projectId: string) {
    return prisma.projectResourceAllocation.findMany({
      where: { tenantId, projectId },
      orderBy: { startDate: "asc" },
    });
  }

  async createResourceAllocation(tenantId: string, dto: ResourceAllocationDto) {
    const project = await prisma.project.findFirst({
      where: { id: dto.projectId, tenantId, deletedAt: null },
    });
    if (!project) throw new NotFoundException("Project not found");
    return prisma.projectResourceAllocation.create({
      data: {
        tenantId,
        projectId: dto.projectId,
        resourceId: dto.resourceId,
        resourceType: dto.resourceType,
        allocatedHours: new Prisma.Decimal(dto.allocatedHours),
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        notes: dto.notes || null,
      },
    });
  }

  async updateResourceAllocation(
    tenantId: string,
    id: string,
    dto: Partial<ResourceAllocationDto>,
  ) {
    const existing = await prisma.projectResourceAllocation.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException("Resource allocation not found");
    return prisma.projectResourceAllocation.update({
      where: { id },
      data: {
        allocatedHours:
          dto.allocatedHours !== undefined
            ? new Prisma.Decimal(dto.allocatedHours)
            : undefined,
        startDate:
          dto.startDate !== undefined ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate !== undefined ? new Date(dto.endDate) : undefined,
        notes: dto.notes !== undefined ? dto.notes : undefined,
      },
    });
  }

  async deleteResourceAllocation(tenantId: string, id: string) {
    const existing = await prisma.projectResourceAllocation.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException("Resource allocation not found");
    return prisma.projectResourceAllocation.delete({ where: { id } });
  }

  // ── Budget Lines ──
  async getBudgetLines(tenantId: string, projectId: string) {
    return prisma.projectBudget.findMany({
      where: { tenantId, projectId },
      orderBy: { createdAt: "desc" },
    });
  }

  async createBudgetLine(tenantId: string, dto: BudgetLineDto) {
    const project = await prisma.project.findFirst({
      where: { id: dto.projectId, tenantId, deletedAt: null },
    });
    if (!project) throw new NotFoundException("Project not found");
    return prisma.projectBudget.create({
      data: {
        tenantId,
        projectId: dto.projectId,
        category: dto.category,
        allocated: new Prisma.Decimal(dto.allocated),
        committed: new Prisma.Decimal(dto.committed),
        fiscalYear: dto.fiscalYear || null,
        notes: dto.notes || null,
      },
    });
  }

  async updateBudgetLine(
    tenantId: string,
    id: string,
    dto: { allocated?: number; committed?: number; notes?: string },
  ) {
    const existing = await prisma.projectBudget.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException("Budget line not found");
    return prisma.projectBudget.update({
      where: { id },
      data: {
        allocated:
          dto.allocated !== undefined
            ? new Prisma.Decimal(dto.allocated)
            : undefined,
        committed:
          dto.committed !== undefined
            ? new Prisma.Decimal(dto.committed)
            : undefined,
        notes: dto.notes !== undefined ? dto.notes : undefined,
      },
    });
  }

  // ── Documents ──
  async getDocuments(tenantId: string, projectId: string) {
    return prisma.projectDocument.findMany({
      where: { tenantId, projectId },
      orderBy: { createdAt: "desc" },
    });
  }

  async createDocument(
    tenantId: string,
    dto: ProjectDocumentDto,
    userId?: string,
  ) {
    const project = await prisma.project.findFirst({
      where: { id: dto.projectId, tenantId, deletedAt: null },
    });
    if (!project) throw new NotFoundException("Project not found");
    return prisma.projectDocument.create({
      data: {
        tenantId,
        projectId: dto.projectId,
        name: dto.name,
        type: dto.type,
        fileUrl: dto.fileUrl || null,
        mimeType: dto.mimeType || null,
        fileSize: dto.fileSize || null,
        uploadedById: userId || null,
        description: dto.description || null,
      },
    });
  }

  async deleteDocument(tenantId: string, id: string) {
    const existing = await prisma.projectDocument.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException("Document not found");
    return prisma.projectDocument.delete({ where: { id } });
  }

  // ── Activity Log ──
  async getActivityLog(tenantId: string, projectId: string) {
    return prisma.projectActivity.findMany({
      where: { tenantId, projectId },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  }

  async logActivity(
    tenantId: string,
    projectId: string,
    action: string,
    description?: string,
    metadata?: unknown,
    userId?: string,
  ) {
    return prisma.projectActivity.create({
      data: {
        tenantId,
        projectId,
        userId: userId || "system",
        action,
        description: description || null,
        metadata: metadata || undefined,
      },
    });
  }
}
