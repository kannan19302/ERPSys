import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class ReportingComplianceSignoffDeepService {
  async getComplianceAudits(tenantId: string) {
    return prisma.reportingComplianceAudit.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });
  }

  async initiateAudit(
    tenantId: string,
    dto: { reportName: string; complianceType: string },
  ) {
    return prisma.reportingComplianceAudit.create({
      data: {
        tenantId,
        reportName: dto.reportName,
        complianceType: dto.complianceType || "SOX",
        signoffStatus: "PENDING",
      },
    });
  }

  async signoffAudit(
    auditId: string,
    signerUserId: string,
    dto: { signatureHash: string; comments?: string },
  ) {
    const audit = await prisma.reportingComplianceAudit.update({
      where: { id: auditId },
      data: {
        signoffStatus: "APPROVED",
        auditorId: signerUserId,
        signedAt: new Date(),
      },
    });

    await prisma.reportingSignoffHistory.create({
      data: {
        auditId,
        signerUserId,
        signatureHash: dto.signatureHash,
        comments: dto.comments,
      },
    });

    return audit;
  }
}
