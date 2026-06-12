import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FinanceEventHandler } from '../finance.event-handler';
import { FinanceService } from '../finance.service';
import { prisma } from '@unerp/database';

vi.mock('@unerp/database', () => {
  return {
    prisma: {
      salesOrder: {
        findFirst: vi.fn(),
        update: vi.fn(),
      },
    },
  };
});

describe('FinanceEventHandler', () => {
  let eventHandler: FinanceEventHandler;
  let financeService: FinanceService;

  beforeEach(() => {
    financeService = new FinanceService();
    vi.spyOn(financeService, 'createInvoice').mockResolvedValue({ id: 'inv-1', invoiceNumber: 'INV-AUTO-DEL-1' } as any);
    eventHandler = new FinanceEventHandler(financeService);
    vi.clearAllMocks();
  });

  it('should auto-create invoice when sales delivery is created', async () => {
    const mockEvent = {
      tenantId: 'tenant-1',
      salesOrderId: 'so-1',
      deliveryNumber: 'DEL-1',
      lineItems: [
        { productId: 'prod-1', description: 'Product 1', deliveredQty: 5 },
      ],
    };

    vi.mocked(prisma.salesOrder.findFirst).mockResolvedValue({
      id: 'so-1',
      orgId: 'org-1',
      customerId: 'cust-1',
      lineItems: [
        { productId: 'prod-1', unitPrice: 100, taxRate: 10 },
      ],
    } as any);

    await eventHandler.handleSalesDeliveryCreated(mockEvent);

    expect(prisma.salesOrder.findFirst).toHaveBeenCalledWith({
      where: { id: 'so-1', tenantId: 'tenant-1' },
      include: { lineItems: true },
    });

    expect(financeService.createInvoice).toHaveBeenCalled();
    const createInvoiceCallArgs = vi.mocked(financeService.createInvoice).mock.calls[0];
    expect(createInvoiceCallArgs).toBeDefined();
    if (!createInvoiceCallArgs) return;
    expect(createInvoiceCallArgs[0]).toBe('tenant-1');
    expect(createInvoiceCallArgs[1]).toBe('org-1');
    expect(createInvoiceCallArgs[2].customerId).toBe('cust-1');
    expect(createInvoiceCallArgs[2].lineItems?.[0]?.quantity).toBe(5);
    expect(createInvoiceCallArgs[2].lineItems?.[0]?.unitPrice).toBe(100);

    expect(prisma.salesOrder.update).toHaveBeenCalledWith({
      where: { id: 'so-1' },
      data: { invoiceId: 'inv-1' },
    });
  });

  it('should abort if sales order is not found', async () => {
    const mockEvent = {
      tenantId: 'tenant-1',
      salesOrderId: 'so-1',
      deliveryNumber: 'DEL-1',
      lineItems: [],
    };

    vi.mocked(prisma.salesOrder.findFirst).mockResolvedValue(null);

    await eventHandler.handleSalesDeliveryCreated(mockEvent);

    expect(financeService.createInvoice).not.toHaveBeenCalled();
    expect(prisma.salesOrder.update).not.toHaveBeenCalled();
  });

  it('should handle errors gracefully without throwing', async () => {
    const mockEvent = {
      tenantId: 'tenant-1',
      salesOrderId: 'so-1',
      deliveryNumber: 'DEL-1',
      lineItems: [],
    };

    vi.mocked(prisma.salesOrder.findFirst).mockRejectedValue(new Error('Database error'));

    // Should not throw
    await expect(eventHandler.handleSalesDeliveryCreated(mockEvent)).resolves.not.toThrow();
  });
});
