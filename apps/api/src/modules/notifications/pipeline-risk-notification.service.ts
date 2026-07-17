import { Injectable } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { prisma } from '@unerp/database';

interface PipelineDealAtRiskEvent {
  tenantId: string;
  opportunityId: string;
  alertType: string;
  riskLevel: string;
  message: string;
}

/**
 * Real consumer for `pipeline.deal.at_risk` (emitted at
 * crm/crm-pipeline-risk.service.ts on every newly-created risk alert). Prior
 * to this, the event had zero listeners (Up Next item 39 — mirrors the
 * `finance.invoice.overdue` gap closed by `InvoiceOverdueNotificationService`,
 * same fix pattern: an `@OnEvent` listener resolving tenant users with a CRM
 * permission via `Role.permissions`).
 *
 * Notifies the opportunity's assigned rep first (if any), falling back to
 * every tenant user holding a CRM opportunity-management permission so a
 * HIGH/CRITICAL risk on an unassigned deal is never silently dropped.
 */
@Injectable()
export class PipelineRiskNotificationService {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  @OnEvent('pipeline.deal.at_risk')
  async handleDealAtRisk(payload: PipelineDealAtRiskEvent) {
    const { tenantId, opportunityId, alertType, riskLevel, message } = payload;
    if (!tenantId || !opportunityId) return;

    try {
      const opportunity = await prisma.opportunity.findFirst({
        where: { id: opportunityId, tenantId },
        select: { id: true, name: true, assignedToId: true },
      });
      if (!opportunity) return;

      const recipients = await this.resolveRecipients(tenantId, opportunity.assignedToId);
      if (recipients.length === 0) return;

      const title = `Deal at risk: "${opportunity.name}" (${riskLevel})`;
      const body = `${message} — alert type ${alertType}.`;

      for (const userId of recipients) {
        this.eventEmitter.emit('notification.send', {
          tenantId,
          userId,
          type: 'CRM_PIPELINE_DEAL_AT_RISK',
          title,
          body,
          channel: 'IN_APP',
        });
      }
    } catch (err) {
      const { pinoLogger } = await import('../../common/services/logger.service');
      pinoLogger.error({ opportunityId, tenantId, err }, 'Failed to notify of at-risk pipeline deal');
    }
  }

  /**
   * The assigned rep if there is one and they're still an active user;
   * otherwise every tenant user holding a CRM opportunity permission (RVP/
   * manager fallback so nothing goes unnoticed on unassigned deals).
   */
  private async resolveRecipients(tenantId: string, assignedToId: string | null): Promise<string[]> {
    if (assignedToId) {
      const user = await prisma.user.findFirst({
        where: { id: assignedToId, tenantId, deletedAt: null, status: 'ACTIVE' },
        select: { id: true },
      });
      if (user) return [user.id];
    }

    const roles = await prisma.role.findMany({
      where: { tenantId },
      select: { id: true, permissions: true },
    });
    const crmRoleIds = roles
      .filter((role) => {
        const perms = Array.isArray(role.permissions) ? (role.permissions as string[]) : [];
        return perms.some((p) => p === '*' || p === 'crm.opportunity.update' || p === 'crm.opportunity.read');
      })
      .map((role) => role.id);
    if (crmRoleIds.length === 0) return [];

    const userRoles = await prisma.userRole.findMany({
      where: { roleId: { in: crmRoleIds }, user: { tenantId, deletedAt: null, status: 'ACTIVE' } },
      select: { userId: true },
      distinct: ['userId'],
    });
    return userRoles.map((ur) => ur.userId);
  }
}
