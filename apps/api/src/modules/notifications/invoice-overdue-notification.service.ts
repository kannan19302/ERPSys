import { Injectable } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { prisma } from '@unerp/database';

interface InvoiceOverdueEvent {
  tenantId: string;
  invoiceId: string;
  customerId: string;
  dunningLevelId: string;
  daysOverdue: number;
  feeApplied: number;
}

/**
 * Real consumer for `finance.invoice.overdue` (emitted at
 * advanced-finance/services/tax-engine.service.ts). Prior to this, the event had
 * zero listeners (MODULE_FOCUS.md §5 criterion 5 / MODULE_REGISTRY.md Up Next 25d).
 *
 * Notifies every internal user in the tenant who holds a finance invoice
 * permission (AR/finance team) with an in-app notification so the overdue
 * escalation is visible to staff, not just the customer-facing dunning email
 * already sent by tax-engine.service.ts.
 */
@Injectable()
export class InvoiceOverdueNotificationService {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  @OnEvent('finance.invoice.overdue')
  async handleInvoiceOverdue(payload: InvoiceOverdueEvent) {
    const { tenantId, invoiceId, customerId, daysOverdue, feeApplied } = payload;
    if (!tenantId || !invoiceId) return;

    try {
      const [invoice, dunningLevel] = await Promise.all([
        prisma.invoice.findFirst({
          where: { id: invoiceId, tenantId },
          select: { invoiceNumber: true, totalAmount: true, customer: { select: { name: true } } },
        }),
        prisma.dunningLevel.findFirst({
          where: { id: payload.dunningLevelId, tenantId },
          select: { levelName: true },
        }),
      ]);
      if (!invoice) return;

      const recipients = await this.resolveFinanceTeam(tenantId);
      if (recipients.length === 0) return;

      const title = `Invoice #${invoice.invoiceNumber} is ${daysOverdue} days overdue`;
      const body = `${invoice.customer?.name ?? 'Customer'} (customer ${customerId}) has an unpaid invoice #${invoice.invoiceNumber} for ${invoice.totalAmount.toString()}, now ${daysOverdue} days overdue at dunning level "${dunningLevel?.levelName ?? 'N/A'}".${feeApplied > 0 ? ` A late fee of ${feeApplied.toFixed(2)} was applied.` : ''}`;

      for (const userId of recipients) {
        this.eventEmitter.emit('notification.send', {
          tenantId,
          userId,
          type: 'FINANCE_INVOICE_OVERDUE',
          title,
          body,
          channel: 'IN_APP',
        });
      }
    } catch (err) {
      const { pinoLogger } = await import('../../common/services/logger.service');
      pinoLogger.error({ invoiceId, tenantId, err }, 'Failed to notify finance team of overdue invoice');
    }
  }

  /** Users in the tenant holding an AR/finance invoice-management permission. */
  private async resolveFinanceTeam(tenantId: string): Promise<string[]> {
    const roles = await prisma.role.findMany({
      where: { tenantId },
      select: { id: true, permissions: true },
    });
    const financeRoleIds = roles
      .filter((role) => {
        const perms = Array.isArray(role.permissions) ? (role.permissions as string[]) : [];
        return perms.some(
          (p) => p === '*' || p === 'finance.invoice.update' || p === 'finance.invoice.read',
        );
      })
      .map((role) => role.id);
    if (financeRoleIds.length === 0) return [];

    const userRoles = await prisma.userRole.findMany({
      where: { roleId: { in: financeRoleIds }, user: { tenantId, deletedAt: null, status: 'ACTIVE' } },
      select: { userId: true },
      distinct: ['userId'],
    });
    return userRoles.map((ur) => ur.userId);
  }
}
