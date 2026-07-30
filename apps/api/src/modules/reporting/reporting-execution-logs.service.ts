import { Injectable } from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class ReportingExecutionLogsService {
  async getLogs(
    tenantId: string,
    reportId?: string,
    status?: string,
    limit = 100,
    offset = 0,
  ) {
    const where: Record<string, unknown> = { tenantId };
    if (reportId) where.reportId = reportId;
    if (status) where.status = status;
    const [items, total] = await Promise.all([
      prisma.reportExecutionLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.reportExecutionLog.count({ where }),
    ]);
    return { items, total, limit, offset };
  }

  async getStats(tenantId: string) {
    const [total, completed, failed, running] = await Promise.all([
      prisma.reportExecutionLog.count({ where: { tenantId } }),
      prisma.reportExecutionLog.count({
        where: { tenantId, status: "COMPLETED" },
      }),
      prisma.reportExecutionLog.count({
        where: { tenantId, status: "FAILED" },
      }),
      prisma.reportExecutionLog.count({
        where: { tenantId, status: "RUNNING" },
      }),
    ]);
    return { total, completed, failed, running };
  }
}
