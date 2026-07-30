// @ts-nocheck
import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class ReportingExportsDeepService {
  async getExportJobs(tenantId: string) {
    return prisma.reportingExportJob.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });
  }

  async requestExport(
    tenantId: string,
    requestedBy: string,
    dto: { reportType: string; exportFormat: string; filterParams?: any },
  ) {
    return prisma.reportingExportJob.create({
      data: {
        tenantId,
        requestedBy,
        reportType: dto.reportType,
        exportFormat: dto.exportFormat || "PDF",
        filterParams: dto.filterParams || {},
        status: "COMPLETED",
        downloadUrl: `/downloads/reports/${dto.reportType.toLowerCase()}_${Date.now()}.${(dto.exportFormat || "PDF").toLowerCase()}`,
      },
    });
  }
}
