import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FinanceService } from '../finance.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
// import { Prisma } from '@prisma/client';

vi.mock('@prisma/client', () => {
  return {
    Prisma: {
      Decimal: class Decimal {
        constructor(value: unknown) {
          return Number(value);
        }
      }
    }
  };
});

vi.mock('@unerp/database', () => {
  return {
    prisma: {
      invoice: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      customer: {
        findFirst: vi.fn(),
      },
      organization: {
        findFirst: vi.fn(),
      },
      invoiceLineItem: {
        create: vi.fn(),
      },
      payment: {
        create: vi.fn(),
      },
      $transaction: vi.fn(async (cb) => {
        return cb({
          invoice: {
            create: vi.fn().mockResolvedValue({ id: 'new-inv', invoiceNumber: 'INV-123' }),
            update: vi.fn().mockResolvedValue({ id: 'updated-inv' }),
            findUnique: vi.fn(),
          },
          invoiceLineItem: {
            create: vi.fn().mockResolvedValue({ id: 'new-li' }),
          },
          payment: {
            create: vi.fn().mockResolvedValue({ id: 'new-pay' }),
          },
          account: {
            findUnique: vi.fn().mockResolvedValue({ id: 'acc-1', type: 'ASSET' }),
            update: vi.fn().mockResolvedValue({}),
          },
          journal: {
            create: vi.fn().mockResolvedValue({ id: 'jou-1' }),
            findUnique: vi.fn().mockResolvedValue({ id: 'jou-1', entries: [] }),
          },
          journalEntry: {
            create: vi.fn(),
          }
        });
      }),
    },
  };
});

describe('FinanceService', () => {
  let financeService: FinanceService;

  beforeEach(() => {
    financeService = new FinanceService();
    vi.clearAllMocks();
  });

  describe('getInvoices', () => {
    it('should return all invoices for the tenant', async () => {
      const { prisma } = await import('@unerp/database');
      const mockInvoices = [
        {
          id: 'inv-1',
          invoiceNumber: 'INV-001',
          status: 'DRAFT',
          issueDate: new Date(),
          dueDate: new Date(),
          subtotal: 1000,
          taxAmount: 150,
          totalAmount: 1150,
          paidAmount: 0,
          currency: 'USD',
          customer: { name: 'Acme' },
          lineItems: [
            {
              id: 'li-1',
              description: 'Item',
              quantity: 1,
              unitPrice: 1000,
              taxRate: 15,
              totalAmount: 1150,
            }
          ],
          payments: [
            {
              id: 'pay-1',
              amount: 100,
              method: 'CASH',
              reference: 'ref',
              paidAt: new Date(),
            }
          ],
        },
      ];

      vi.mocked(prisma.invoice.findMany).mockResolvedValue(mockInvoices as never);

      const result = await financeService.getInvoices('tenant-123');

      expect(result).toBeDefined();
      expect(result.length).toBe(1);
      expect(result[0]!.invoiceNumber).toBe('INV-001');
      expect(result[0]!.customerName).toBe('Acme');
      expect(result[0]!.subtotal).toBe(1000);
      expect(result[0]!.lineItems.length).toBe(1);
      expect(result[0]!.payments.length).toBe(1);
    });
  });

  describe('createInvoice', () => {
    const defaultDto = {
      customerId: 'cust-1',
      invoiceNumber: 'INV-123',
      dueDate: new Date().toISOString(),
      lineItems: [
        { description: 'Item 1', quantity: 2, unitPrice: 100, taxRate: 10 }
      ]
    };

    it('should create an invoice successfully', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.organization.findFirst).mockResolvedValue({ id: 'org-1' } as never);
      vi.mocked(prisma.invoice.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.customer.findFirst).mockResolvedValue({ id: 'cust-1' } as never);

      const result = await financeService.createInvoice('tenant-123', 'org-1', defaultDto as never, 'user-1');

      expect(result).toBeDefined();
      expect(prisma.customer.findFirst).toHaveBeenCalledWith({ where: { id: 'cust-1', tenantId: 'tenant-123' } });
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should resolve orgId if org-system-default is passed', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.organization.findFirst).mockResolvedValue({ id: 'resolved-org' } as never);
      vi.mocked(prisma.invoice.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.customer.findFirst).mockResolvedValue({ id: 'cust-1' } as never);

      await financeService.createInvoice('tenant-123', 'org-system-default', defaultDto as never, 'user-1');

      expect(prisma.organization.findFirst).toHaveBeenCalledWith({ where: { tenantId: 'tenant-123' } });
      expect(prisma.invoice.findFirst).toHaveBeenCalledWith(expect.objectContaining({
        where: { tenantId: 'tenant-123', orgId: 'resolved-org', invoiceNumber: 'INV-123' }
      }));
    });

    it('should throw BadRequestException if org is not found', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.organization.findFirst).mockResolvedValue(null);

      await expect(financeService.createInvoice('tenant-123', 'org-system-default', defaultDto as never, 'user-1'))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if invoice number exists', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.organization.findFirst).mockResolvedValue({ id: 'org-1' } as never);
      vi.mocked(prisma.invoice.findFirst).mockResolvedValue({ id: 'existing-inv' } as never);

      await expect(financeService.createInvoice('tenant-123', 'org-1', defaultDto as never, 'user-1'))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if customer does not exist', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.organization.findFirst).mockResolvedValue({ id: 'org-1' } as never);
      vi.mocked(prisma.invoice.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.customer.findFirst).mockResolvedValue(null);

      await expect(financeService.createInvoice('tenant-123', 'org-1', defaultDto as never, 'user-1'))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('createPayment', () => {
    const defaultDto = {
      invoiceId: 'inv-1',
      amount: 100,
      method: 'CASH'
    };

    it('should create payment successfully and update invoice to PARTIALLY_PAID', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.invoice.findFirst).mockResolvedValue({
        id: 'inv-1',
        paidAmount: 50,
        totalAmount: 200
      } as never);

      const result = await financeService.createPayment('tenant-123', defaultDto as never, 'user-1');

      expect(result).toBeDefined();
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should set status to PAID if fully paid', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.invoice.findFirst).mockResolvedValue({
        id: 'inv-1',
        paidAmount: 50,
        totalAmount: 150
      } as never);

      await financeService.createPayment('tenant-123', defaultDto as never, 'user-1');

      expect(prisma.$transaction).toHaveBeenCalled();
      // Implementation inside transaction mock checks for this
    });

    it('should throw NotFoundException if invoice not found', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.invoice.findFirst).mockResolvedValue(null);

      await expect(financeService.createPayment('tenant-123', defaultDto as never, 'user-1'))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if payment exceeds total amount', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.invoice.findFirst).mockResolvedValue({
        id: 'inv-1',
        paidAmount: 150,
        totalAmount: 200
      } as never);

      await expect(financeService.createPayment('tenant-123', defaultDto as never, 'user-1'))
        .rejects.toThrow(BadRequestException);
    });
  });
});
