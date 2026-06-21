import { Injectable } from '@nestjs/common';
import { prisma } from '@unerp/database';

@Injectable()
export class ScheduledReportsService {
  async getScheduledReports(tenantId: string) {
    return prisma.scheduledReport.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createScheduledReport(
    tenantId: string,
    createdBy: string,
    dto: {
      name: string;
      reportType: string;
      schedule: string;
      recipients?: string[];
      filters?: Record<string, unknown>;
      format?: string;
    },
  ) {
    return prisma.scheduledReport.create({
      data: {
        tenantId,
        createdBy,
        name: dto.name,
        reportType: dto.reportType,
        schedule: dto.schedule,
        recipients: dto.recipients ?? [],
        filters: dto.filters ?? {},
        format: dto.format ?? 'pdf',
      },
    });
  }

  async updateScheduledReport(
    tenantId: string,
    id: string,
    dto: {
      name?: string;
      reportType?: string;
      schedule?: string;
      recipients?: string[];
      filters?: Record<string, unknown>;
      format?: string;
      isActive?: boolean;
    },
  ) {
    return prisma.scheduledReport.update({
      where: { id, tenantId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.reportType !== undefined && { reportType: dto.reportType }),
        ...(dto.schedule !== undefined && { schedule: dto.schedule }),
        ...(dto.recipients !== undefined && { recipients: dto.recipients }),
        ...(dto.filters !== undefined && { filters: dto.filters }),
        ...(dto.format !== undefined && { format: dto.format }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  async deleteScheduledReport(tenantId: string, id: string) {
    return prisma.scheduledReport.delete({
      where: { id, tenantId },
    });
  }

  async runScheduledReport(tenantId: string, id: string) {
    await prisma.scheduledReport.update({
      where: { id, tenantId },
      data: { lastRunAt: new Date() },
    });
    return { success: true, message: 'Report execution triggered' };
  }
}
