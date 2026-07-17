import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InvoiceOverdueNotificationService } from '../invoice-overdue-notification.service';

/**
 * Closes MODULE_REGISTRY.md Up Next 25d: `finance.invoice.overdue` was emitted
 * (advanced-finance/services/tax-engine.service.ts:866) with zero listeners. This
 * verifies the new real consumer resolves the tenant's finance/AR team and notifies
 * them, tenant-scoped, without leaking across tenants or notifying unrelated roles.
 */

vi.mock('@unerp/database', () => ({
  prisma: {
    invoice: { findFirst: vi.fn() },
    dunningLevel: { findFirst: vi.fn() },
    role: { findMany: vi.fn() },
    userRole: { findMany: vi.fn() },
  },
}));

describe('InvoiceOverdueNotificationService — finance.invoice.overdue consumer', () => {
  let service: InvoiceOverdueNotificationService;
  let emitter: EventEmitter2;

  beforeEach(() => {
    vi.clearAllMocks();
    emitter = { emit: vi.fn() } as unknown as EventEmitter2;
    service = new InvoiceOverdueNotificationService(emitter);
  });

  it('emits notification.send for every finance-team user in the tenant', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.invoice.findFirst).mockResolvedValue({
      invoiceNumber: 'INV-1001',
      totalAmount: { toString: () => '500.00' },
      customer: { name: 'Acme Co' },
    } as never);
    vi.mocked(prisma.dunningLevel.findFirst).mockResolvedValue({ levelName: 'Level 2' } as never);
    vi.mocked(prisma.role.findMany).mockResolvedValue([
      { id: 'role-finance', permissions: ['finance.invoice.update'] },
      { id: 'role-sales', permissions: ['sales.order.read'] },
    ] as never);
    vi.mocked(prisma.userRole.findMany).mockResolvedValue([
      { userId: 'user-ar-1' },
      { userId: 'user-ar-2' },
    ] as never);

    await service.handleInvoiceOverdue({
      tenantId: 't1',
      invoiceId: 'inv-1',
      customerId: 'cust-1',
      dunningLevelId: 'level-2',
      daysOverdue: 15,
      feeApplied: 25,
    });

    expect(prisma.userRole.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          roleId: { in: ['role-finance'] },
          user: expect.objectContaining({ tenantId: 't1' }),
        }),
      }),
    );
    expect(emitter.emit).toHaveBeenCalledTimes(2);
    expect(emitter.emit).toHaveBeenCalledWith(
      'notification.send',
      expect.objectContaining({
        tenantId: 't1',
        userId: 'user-ar-1',
        type: 'FINANCE_INVOICE_OVERDUE',
        title: expect.stringContaining('INV-1001'),
        channel: 'IN_APP',
      }),
    );
  });

  it('does nothing when the tenant has no finance-permissioned roles', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.invoice.findFirst).mockResolvedValue({
      invoiceNumber: 'INV-2',
      totalAmount: { toString: () => '100.00' },
      customer: { name: 'Beta Inc' },
    } as never);
    vi.mocked(prisma.dunningLevel.findFirst).mockResolvedValue(null as never);
    vi.mocked(prisma.role.findMany).mockResolvedValue([
      { id: 'role-sales', permissions: ['sales.order.read'] },
    ] as never);

    await service.handleInvoiceOverdue({
      tenantId: 't2',
      invoiceId: 'inv-2',
      customerId: 'cust-2',
      dunningLevelId: 'level-1',
      daysOverdue: 5,
      feeApplied: 0,
    });

    expect(prisma.userRole.findMany).not.toHaveBeenCalled();
    expect(emitter.emit).not.toHaveBeenCalled();
  });

  it('is a no-op when the invoice cannot be found in the tenant (tenant isolation)', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.invoice.findFirst).mockResolvedValue(null as never);

    await service.handleInvoiceOverdue({
      tenantId: 't3',
      invoiceId: 'inv-does-not-exist',
      customerId: 'cust-3',
      dunningLevelId: 'level-1',
      daysOverdue: 3,
      feeApplied: 0,
    });

    expect(prisma.role.findMany).not.toHaveBeenCalled();
    expect(emitter.emit).not.toHaveBeenCalled();
  });

  it('ignores events missing tenantId or invoiceId', async () => {
    const { prisma } = await import('@unerp/database');
    await service.handleInvoiceOverdue({
      tenantId: '',
      invoiceId: '',
      customerId: 'cust-4',
      dunningLevelId: 'level-1',
      daysOverdue: 1,
      feeApplied: 0,
    });
    expect(prisma.invoice.findFirst).not.toHaveBeenCalled();
    expect(emitter.emit).not.toHaveBeenCalled();
  });
});
