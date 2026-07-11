import { Injectable } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma } from '@prisma/client';

/**
 * Revenue Intelligence / deal-risk email digest (Up Next item 42).
 *
 * Reuses the `pipeline_risk_alerts` data shipped for Pipeline Inspection
 * (item 38) and the `notification.send` + dunning-digest fan-out pattern
 * already established by `InvoiceOverdueNotificationService`/dunning: a
 * periodic (daily/weekly, admin- or scheduler-triggered) rollup of new and
 * open risk alerts per rep, plus a manager-scoped team rollup, delivered as
 * an in-app notification and persisted as an auditable `DealRiskDigestRun`
 * row (so "did the digest actually fire" is queryable, matching Gong/Clari's
 * digest-history views).
 */
@Injectable()
export class CrmRevenueIntelligenceService {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  /**
   * Generate and send the digest for every rep who owns at least one
   * currently-open risk alert, plus one team rollup digest for every user
   * holding a CRM-manager-grade permission (`crm.opportunity.update` or `*`).
   * `windowHours` controls what counts as "new" for this run (default 24h =
   * daily digest; pass 168 for a weekly cadence).
   */
  async generateAndSendDigests(tenantId: string, orgId: string, windowHours = 24) {
    const periodEnd = new Date();
    const periodStart = new Date(periodEnd.getTime() - windowHours * 3600_000);

    const openAlerts = await prisma.pipelineRiskAlert.findMany({
      where: { tenantId, status: { in: ['OPEN', 'ACKNOWLEDGED'] } },
      include: {
        opportunity: { select: { id: true, name: true, amount: true, assignedToId: true } },
      },
    });

    const byRep = new Map<string, typeof openAlerts>();
    for (const alert of openAlerts) {
      const repId = alert.opportunity?.assignedToId;
      if (!repId) continue;
      const list = byRep.get(repId) ?? [];
      list.push(alert);
      byRep.set(repId, list);
    }

    const runs: Array<Awaited<ReturnType<typeof this.sendDigestForScope>>> = [];

    for (const [repId, alerts] of byRep.entries()) {
      runs.push(await this.sendDigestForScope(tenantId, orgId, repId, 'REP', alerts, periodStart, periodEnd));
    }

    if (openAlerts.length > 0) {
      const managerIds = await this.resolveManagers(tenantId);
      for (const managerId of managerIds) {
        runs.push(
          await this.sendDigestForScope(tenantId, orgId, managerId, 'MANAGER', openAlerts, periodStart, periodEnd),
        );
      }
    }

    return {
      periodStart,
      periodEnd,
      repDigestsSent: byRep.size,
      managerDigestsSent: runs.length - byRep.size,
      totalOpenAlerts: openAlerts.length,
    };
  }

  private async sendDigestForScope(
    tenantId: string,
    orgId: string,
    recipientUserId: string,
    scope: 'REP' | 'MANAGER',
    alerts: Array<{
      riskLevel: string;
      createdAt: Date;
      opportunity: { id: string; name: string; amount: Prisma.Decimal | null } | null;
    }>,
    periodStart: Date,
    periodEnd: Date,
  ) {
    const criticalCount = alerts.filter((a) => a.riskLevel === 'CRITICAL').length;
    const newAlertCount = alerts.filter((a) => a.createdAt >= periodStart).length;
    const dealIds = new Set(alerts.map((a) => a.opportunity?.id).filter(Boolean));
    const atRiskPipelineValue = alerts.reduce((sum, a) => {
      const amt = a.opportunity?.amount ? Number(a.opportunity.amount) : 0;
      return sum + amt;
    }, 0);

    const run = await prisma.dealRiskDigestRun.create({
      data: {
        tenantId,
        orgId,
        recipientUserId,
        scope,
        periodStart,
        periodEnd,
        newAlertCount,
        openAlertCount: alerts.length,
        criticalCount,
        atRiskDealCount: dealIds.size,
        atRiskPipelineValue: new Prisma.Decimal(atRiskPipelineValue.toFixed(2)),
      },
    });

    const scopeLabel = scope === 'MANAGER' ? 'team' : 'your';
    const title = `Deal-risk digest: ${dealIds.size} ${scopeLabel} deal(s) at risk`;
    const body =
      `${alerts.length} open pipeline risk alert(s) (${criticalCount} critical, ${newAlertCount} new since last digest) ` +
      `across ${dealIds.size} deal(s) worth ${atRiskPipelineValue.toFixed(2)} in total pipeline value.`;

    this.eventEmitter.emit('notification.send', {
      tenantId,
      userId: recipientUserId,
      type: scope === 'MANAGER' ? 'CRM_REVENUE_INTELLIGENCE_TEAM_DIGEST' : 'CRM_REVENUE_INTELLIGENCE_REP_DIGEST',
      title,
      body,
      channel: 'IN_APP',
    });

    return run;
  }

  private async resolveManagers(tenantId: string): Promise<string[]> {
    const roles = await prisma.role.findMany({ where: { tenantId }, select: { id: true, permissions: true } });
    const managerRoleIds = roles
      .filter((role) => {
        const perms = Array.isArray(role.permissions) ? (role.permissions as string[]) : [];
        return perms.some((p) => p === '*' || p === 'crm.opportunity.update');
      })
      .map((role) => role.id);
    if (managerRoleIds.length === 0) return [];

    const userRoles = await prisma.userRole.findMany({
      where: { roleId: { in: managerRoleIds }, user: { tenantId, deletedAt: null, status: 'ACTIVE' } },
      select: { userId: true },
      distinct: ['userId'],
    });
    return userRoles.map((ur) => ur.userId);
  }

  async listDigestRuns(tenantId: string, recipientUserId?: string) {
    return prisma.dealRiskDigestRun.findMany({
      where: { tenantId, ...(recipientUserId ? { recipientUserId } : {}) },
      orderBy: { sentAt: 'desc' },
      take: 100,
    });
  }
}
