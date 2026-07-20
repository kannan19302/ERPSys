import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class AuditLogService {
  async logAction(
    tenantId: string,
    action: string,
    resource: string,
    resourceId: string,
    details?: Record<string, unknown>,
    ipAddress?: string,
  ) {
    return prisma.tenantAuditLog.create({
      data: {
        tenantId,
        action,
        resource,
        resourceId,
        details: details as any ?? {},
        ipAddress,
      },
    });
  }

  async listAuditLogs(
    tenantId: string,
    page: number,
    limit: number,
    filters: { action?: string; actor?: string; from?: string; to?: string },
  ) {
    const where: Record<string, unknown> = { tenantId };

    if (filters.action) where.action = filters.action;
    if (filters.from || filters.to) {
      where.createdAt = {};
      if (filters.from) (where.createdAt as Record<string, unknown>).gte = new Date(filters.from);
      if (filters.to) (where.createdAt as Record<string, unknown>).lte = new Date(filters.to);
    }

    const [items, total] = await Promise.all([
      prisma.tenantAuditLog.findMany({
        where: where as any,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.tenantAuditLog.count({ where: where as any }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getAuditLog(tenantId: string, id: string) {
    const log = await prisma.tenantAuditLog.findFirst({ where: { id, tenantId } });
    if (!log) throw new NotFoundException("Audit log entry not found");
    return log;
  }

  async exportAuditLogs(
    tenantId: string,
    format: string,
    filters: { from?: string; to?: string },
  ) {
    const where: Record<string, unknown> = { tenantId };
    if (filters.from || filters.to) {
      where.createdAt = {};
      if (filters.from) (where.createdAt as Record<string, unknown>).gte = new Date(filters.from);
      if (filters.to) (where.createdAt as Record<string, unknown>).lte = new Date(filters.to);
    }

    const logs = await prisma.tenantAuditLog.findMany({
      where: where as any,
      orderBy: { createdAt: "desc" },
    });

    if (format === "json" || format === "JSON") {
      return { format: "JSON", data: JSON.stringify(logs), filename: `audit-log-${tenantId}.json` };
    }

    const header = "id,tenantId,action,resource,resourceId,details,ipAddress,createdAt";
    const rows = logs.map((l) =>
      `"${l.id}","${l.tenantId}","${l.action}","${l.resource ?? ""}","${l.resourceId ?? ""}","${JSON.stringify(l.details).replace(/"/g, '""')}","${l.ipAddress ?? ""}","${l.createdAt.toISOString()}"`,
    );
    const csv = [header, ...rows].join("\n");

    return { format: "CSV", data: csv, filename: `audit-log-${tenantId}.csv`, rowCount: logs.length };
  }

  async getAuditStats(tenantId: string) {
    const [total, actionGroups, recent] = await Promise.all([
      prisma.tenantAuditLog.count({ where: { tenantId } }),
      prisma.tenantAuditLog.groupBy({
        by: ["action"],
        where: { tenantId },
        _count: true,
      }),
      prisma.tenantAuditLog.findFirst({
        where: { tenantId },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return {
      totalEntries: total,
      byAction: actionGroups.map((g) => ({ action: g.action, count: g._count })),
      mostRecentEntry: recent,
    };
  }

  async cleanupOldLogs(retentionDays: number) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - retentionDays);

    const result = await prisma.tenantAuditLog.deleteMany({
      where: { createdAt: { lt: cutoff } },
    });

    return { deletedCount: result.count, retentionDays, cutoff };
  }
}
