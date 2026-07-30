// @ts-nocheck
import { Injectable } from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class ReportingAuditLogsService {
  async getLogs(
    tenantId: string,
    reportId?: string,
    action?: string,
    limit = 100,
    offset = 0,
  ) {
    const where: Record<string, unknown> = { tenantId };
    if (reportId) where.reportId = reportId;
    if (action) where.action = action;
    const [items, total] = await Promise.all([
      prisma.reportAuditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.reportAuditLog.count({ where }),
    ]);
    return { items, total, limit, offset };
  }

  async record(
    tenantId: string,
    userId: string,
    reportId: string,
    action: string,
    details?: string,
    ipAddress?: string,
  ) {
    return prisma.reportAuditLog.create({
      data: { tenantId, userId, reportId, action, details, ipAddress },
    });
  }
}
