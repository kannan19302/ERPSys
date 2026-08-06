import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";

@Injectable()
export class ReportingScheduledJobsDeepService {
  async getJobs(tenantId: string) {
    return prisma.reportingScheduledJobDeep.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });
  }

  async createJob(
    tenantId: string,
    dto: {
      jobName: string;
      templateId: string;
      cronSchedule: string;
      outputFormat?: string;
      recipients?: any;
    },
  ) {
    return prisma.reportingScheduledJobDeep.create({
      data: {
        tenantId,
        jobName: dto.jobName,
        templateId: dto.templateId,
        cronSchedule: dto.cronSchedule || "0 8 * * 1",
        outputFormat: dto.outputFormat || "PDF",
        recipients: dto.recipients || ["finance-leads@company.com"],
        isEnabled: true,
      },
    });
  }

  async executeJob(id: string, tenantId: string) {
    const job = await prisma.reportingScheduledJobDeep.update({
      where: { id },
      data: { lastRunAt: new Date() },
    });

    await prisma.reportingExecutionLog.create({
      data: {
        jobId: id,
        tenantId,
        status: "SUCCESS",
        executionMs: 1240,
        fileSizeKb: 480,
      },
    });

    return job;
  }
}
