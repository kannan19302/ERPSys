import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@unerp/database';

/**
 * Audit log home for the SaaS Portal. Consolidates the concern previously
 * only reachable at `/saas/audit-logs` into `/saas-portal/audit-log`.
 * Independent implementation against the same `TenantAuditLog` Prisma model
 * (see `org-hierarchy.service.ts` header for why this isn't a cross-module
 * delegate).
 */
@Injectable()
export class SaasPortalAuditLogService {
  async logAction(tenantId: string, action: string, resource: string, resourceId: string, details?: Record<string, unknown>, ipAddress?: string) {
    return prisma.tenantAuditLog.create({
      data: { tenantId, action, resource, resourceId, details: (details ?? {}) as never, ipAddress },
    });
  }

  async listAuditLogs(tenantId: string, page: number, limit: number, filters: { action?: string; actor?: string; from?: string; to?: string }) {
    const where: Record<string, unknown> = { tenantId };
    if (filters.action) where.action = filters.action;
    if (filters.from || filters.to) {
      const createdAt: Record<string, Date> = {};
      if (filters.from) createdAt.gte = new Date(filters.from);
      if (filters.to) createdAt.lte = new Date(filters.to);
      where.createdAt = createdAt;
    }

    const [items, total] = await Promise.all([
      prisma.tenantAuditLog.findMany({ where: where as never, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
      prisma.tenantAuditLog.count({ where: where as never }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getAuditLog(tenantId: string, id: string) {
    const log = await prisma.tenantAuditLog.findFirst({ where: { id, tenantId } });
    if (!log) throw new NotFoundException('Audit log entry not found');
    return log;
  }

  async exportAuditLogs(tenantId: string, format: string, filters: { from?: string; to?: string }) {
    const where: Record<string, unknown> = { tenantId };
    if (filters.from || filters.to) {
      const createdAt: Record<string, Date> = {};
      if (filters.from) createdAt.gte = new Date(filters.from);
      if (filters.to) createdAt.lte = new Date(filters.to);
      where.createdAt = createdAt;
    }

    const logs = await prisma.tenantAuditLog.findMany({ where: where as never, orderBy: { createdAt: 'desc' } });

    if (format.toLowerCase() === 'json') {
      return { format: 'JSON', data: JSON.stringify(logs), filename: `audit-log-${tenantId}.json` };
    }

    interface AuditLogRow {
      id: string; tenantId: string; action: string; resource: string | null;
      resourceId: string | null; details: unknown; ipAddress: string | null; createdAt: Date;
    }
    const header = 'id,tenantId,action,resource,resourceId,details,ipAddress,createdAt';
    const rows = (logs as unknown as AuditLogRow[]).map(
      (row) =>
        `"${row.id}","${row.tenantId}","${row.action}","${row.resource ?? ''}","${row.resourceId ?? ''}","${JSON.stringify(row.details).replace(/"/g, '""')}","${row.ipAddress ?? ''}","${row.createdAt.toISOString()}"`,
    );
    const csv = [header, ...rows].join('\n');
    return { format: 'CSV', data: csv, filename: `audit-log-${tenantId}.csv`, rowCount: logs.length };
  }

  async getAuditStats(tenantId: string) {
    const [total, actionGroups, recent] = await Promise.all([
      prisma.tenantAuditLog.count({ where: { tenantId } }),
      prisma.tenantAuditLog.groupBy({ by: ['action'], where: { tenantId }, _count: true }),
      prisma.tenantAuditLog.findFirst({ where: { tenantId }, orderBy: { createdAt: 'desc' } }),
    ]);

    return {
      totalEntries: total,
      byAction: (actionGroups as unknown as { action: string; _count: number }[]).map((g) => ({ action: g.action, count: g._count })),
      mostRecentEntry: recent,
    };
  }
}
