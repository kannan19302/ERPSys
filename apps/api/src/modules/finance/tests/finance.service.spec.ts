import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FinanceService } from '../finance.service';

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
      $transaction: vi.fn((cb) => cb({
        invoice: {
          create: vi.fn().mockResolvedValue({ id: 'new-inv', invoiceNumber: 'INV-123' }),
          update: vi.fn().mockResolvedValue({ id: 'updated-inv' }),
        },
        invoiceLineItem: {
          create: vi.fn().mockResolvedValue({ id: 'new-li' }),
        },
        payment: {
          create: vi.fn().mockResolvedValue({ id: 'new-pay' }),
        },
      })),
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
          lineItems: [],
          payments: [],
        },
      ];

      vi.mocked(prisma.invoice.findMany).mockResolvedValue(mockInvoices as unknown as Awaited<ReturnType<typeof prisma.invoice.findMany>>);

      const result = await financeService.getInvoices('tenant-123');

      expect(result).toBeDefined();
      expect(result[0]?.invoiceNumber).toBe('INV-001');
      expect(result[0]?.customerName).toBe('Acme');
    });
  });
});
