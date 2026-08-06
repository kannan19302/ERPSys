import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";
import { Prisma } from "@prisma/client";

@Injectable()
export class ProjectsClaimsService {
  async getClaims(tenantId: string, projectId?: string) {
    const where: any = { tenantId };
    if (projectId) where.projectId = projectId;
    return prisma.projectClaim.findMany({
      where,
      include: { claimDocuments: true, variationOrders: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async getClaimById(tenantId: string, id: string) {
    const claim = await prisma.projectClaim.findFirst({
      where: { id, tenantId },
      include: { claimDocuments: true, variationOrders: true, project: true },
    });
    if (!claim) throw new NotFoundException("Claim not found");
    return claim;
  }

  async createClaim(
    tenantId: string,
    dto: {
      projectId: string;
      claimNumber: string;
      title: string;
      description?: string;
      claimType?: string;
      claimedAmount: number;
      assigneeId?: string;
      priority?: string;
    },
  ) {
    const project = await prisma.project.findFirst({
      where: { id: dto.projectId, tenantId },
    });
    if (!project) throw new NotFoundException("Project not found");
    const existing = await prisma.projectClaim.findFirst({
      where: { tenantId, claimNumber: dto.claimNumber },
    });
    if (existing)
      throw new BadRequestException(
        `Claim number ${dto.claimNumber} already exists.`,
      );
    return prisma.projectClaim.create({
      data: {
        tenantId,
        projectId: dto.projectId,
        claimNumber: dto.claimNumber,
        title: dto.title,
        description: dto.description || null,
        claimType: dto.claimType || "CONTRACTUAL",
        claimedAmount: new Prisma.Decimal(dto.claimedAmount),
        assigneeId: dto.assigneeId || null,
        priority: dto.priority || "MEDIUM",
      },
    });
  }

  async evaluateClaim(
    tenantId: string,
    claimId: string,
    dto: { approvedAmount?: number; status: string; notes?: string },
  ) {
    const claim = await prisma.projectClaim.findFirst({
      where: { id: claimId, tenantId },
    });
    if (!claim) throw new NotFoundException("Claim not found");
    return prisma.projectClaim.update({
      where: { id: claimId },
      data: {
        status: dto.status,
        approvedAmount: dto.approvedAmount
          ? new Prisma.Decimal(dto.approvedAmount)
          : undefined,
        resolvedDate: ["APPROVED", "REJECTED", "SETTLED"].includes(dto.status)
          ? new Date()
          : undefined,
        description: dto.notes
          ? `${claim.description || ""}\n[Evaluation]: ${dto.notes}`
          : undefined,
      },
    });
  }

  async submitVariationOrder(
    tenantId: string,
    dto: {
      projectId: string;
      claimId?: string;
      variationNumber: string;
      title: string;
      description?: string;
      changeType?: string;
      costImpact?: number;
      scheduleImpact?: number;
      notes?: string;
    },
  ) {
    const project = await prisma.project.findFirst({
      where: { id: dto.projectId, tenantId },
    });
    if (!project) throw new NotFoundException("Project not found");
    if (dto.claimId) {
      const claim = await prisma.projectClaim.findFirst({
        where: { id: dto.claimId, tenantId },
      });
      if (!claim) throw new NotFoundException("Claim not found");
    }
    return prisma.variationOrder.create({
      data: {
        tenantId,
        projectId: dto.projectId,
        claimId: dto.claimId || null,
        variationNumber: dto.variationNumber,
        title: dto.title,
        description: dto.description || null,
        changeType: dto.changeType || "SCOPE",
        costImpact: dto.costImpact ? new Prisma.Decimal(dto.costImpact) : null,
        scheduleImpact: dto.scheduleImpact || null,
        requestedDate: new Date(),
        notes: dto.notes || null,
      },
    });
  }

  async getVariationOrders(tenantId: string, projectId?: string) {
    const where: any = { tenantId };
    if (projectId) where.projectId = projectId;
    return prisma.variationOrder.findMany({
      where,
      orderBy: { requestedDate: "desc" },
    });
  }

  async addClaimDocument(
    tenantId: string,
    claimId: string,
    dto: {
      name: string;
      type?: string;
      fileUrl?: string;
      description?: string;
    },
  ) {
    const claim = await prisma.projectClaim.findFirst({
      where: { id: claimId, tenantId },
    });
    if (!claim) throw new NotFoundException("Claim not found");
    return prisma.claimDocument.create({
      data: {
        tenantId,
        claimId,
        name: dto.name,
        type: dto.type || "EVIDENCE",
        fileUrl: dto.fileUrl || null,
        description: dto.description || null,
      },
    });
  }

  async getClaimsDashboard(tenantId: string) {
    const claims = await prisma.projectClaim.findMany({
      where: { tenantId },
      include: { claimDocuments: true, variationOrders: true },
    });
    const totalClaimed = claims.reduce(
      (s, c) => s + Number(c.claimedAmount),
      0,
    );
    const totalApproved = claims.reduce(
      (s, c) => s + Number(c.approvedAmount || 0),
      0,
    );
    const totalSettled = claims.reduce(
      (s, c) => s + Number(c.settlementAmount || 0),
      0,
    );
    return {
      totalClaims: claims.length,
      draft: claims.filter((c) => c.status === "DRAFT").length,
      submitted: claims.filter((c) => c.status === "SUBMITTED").length,
      underEvaluation: claims.filter((c) => c.status === "UNDER_EVALUATION")
        .length,
      approved: claims.filter((c) => c.status === "APPROVED").length,
      rejected: claims.filter((c) => c.status === "REJECTED").length,
      settled: claims.filter((c) => c.status === "SETTLED").length,
      totalClaimedAmount: totalClaimed,
      totalApprovedAmount: totalApproved,
      totalSettledAmount: totalSettled,
      totalDocuments: claims.reduce((s, c) => s + c.claimDocuments.length, 0),
    };
  }

  async resolveDispute(
    tenantId: string,
    claimId: string,
    dto: {
      settlementAmount?: number;
      status: string;
      resolutionNotes?: string;
    },
  ) {
    const claim = await prisma.projectClaim.findFirst({
      where: { id: claimId, tenantId },
    });
    if (!claim) throw new NotFoundException("Claim not found");
    return prisma.projectClaim.update({
      where: { id: claimId },
      data: {
        status: dto.status,
        settlementAmount: dto.settlementAmount
          ? new Prisma.Decimal(dto.settlementAmount)
          : undefined,
        resolvedDate: new Date(),
        description: dto.resolutionNotes
          ? `${claim.description || ""}\n[Dispute Resolution]: ${dto.resolutionNotes}`
          : undefined,
      },
    });
  }
}
