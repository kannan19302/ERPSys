import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SalesService } from '../sales.service';

// Mock @prisma/client
vi.mock('@prisma/client', () => ({
  Prisma: {
    Decimal: class Decimal {
      constructor(value: any) {
        return Number(value);
      }
    },
    JsonNull: 'JsonNull',
  },
}));

// Mock @unerp/database
vi.mock('@unerp/database', () => ({
  prisma: {
    quotation: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    quotationItem: { create: vi.fn() },
    salesOrder: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    salesOrderItem: { create: vi.fn() },
    deliveryNote: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    deliveryNoteItem: { create: vi.fn() },
    organization: { findFirst: vi.fn() },
    customer: { findFirst: vi.fn() },
    $transaction: vi.fn((fn: (tx: unknown) => Promise<unknown>) => fn({
      quotation: {
        create: vi.fn().mockResolvedValue({ id: 'q-1', quotationNumber: 'QT-001', status: 'DRAFT' }),
      },
      quotationItem: { create: vi.fn() },
      salesOrder: {
        create: vi.fn().mockResolvedValue({ id: 'so-1', orderNumber: 'SO-001', status: 'DRAFT' }),
        update: vi.fn(),
      },
      salesOrderItem: { create: vi.fn() },
      deliveryNote: {
        create: vi.fn().mockResolvedValue({ id: 'dn-1', deliveryNumber: 'DN-001', status: 'PENDING' }),
      },
      deliveryNoteItem: { create: vi.fn() },
    })),
  },
}));

import { prisma } from '@unerp/database';

describe('SalesService', () => {
  let service: SalesService;

  beforeEach(() => {
    service = new SalesService();
    vi.clearAllMocks();
  });

  describe('getQuotations', () => {
    it('should return mapped quotations', async () => {
      const mockQuotations = [
        {
          id: 'q-1',
          quotationNumber: 'QT-001',
          status: 'DRAFT',
          issueDate: new Date(),
          validUntil: new Date(),
          subtotal: { toString: () => '500' },
          taxAmount: { toString: () => '50' },
          totalAmount: { toString: () => '550' },
          currency: 'USD',
          customer: { name: 'Test Customer' },
          lineItems: [{ id: 'li-1' }],
        },
      ];

      vi.mocked(prisma.quotation.findMany).mockResolvedValue(mockQuotations as never);

      const result = await service.getQuotations('tenant-1');

      expect(result).toHaveLength(1);
      expect(result[0]?.quotationNumber).toBe('QT-001');
      expect(result[0]?.customerName).toBe('Test Customer');
    });
  });

  describe('createQuotation', () => {
    it('should create a quotation with line items', async () => {
      vi.mocked(prisma.organization.findFirst).mockResolvedValue({ id: 'org-1' } as never);
      vi.mocked(prisma.quotation.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.customer.findFirst).mockResolvedValue({ id: 'cust-1' } as never);

      const dto = {
        customerId: 'cust-1',
        quotationNumber: 'QT-001',
        validUntil: new Date().toISOString(),
        lineItems: [{ description: 'Widget', quantity: 10, unitPrice: 50, taxRate: 10 }],
      };

      const result = await service.createQuotation('tenant-1', 'org-system-default', dto, 'user-1');

      expect(result).toBeDefined();
      expect(result.quotationNumber).toBe('QT-001');
    });

    it('should throw when customer not found', async () => {
      vi.mocked(prisma.organization.findFirst).mockResolvedValue({ id: 'org-1' } as never);
      vi.mocked(prisma.quotation.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.customer.findFirst).mockResolvedValue(null);

      const dto = {
        customerId: 'nonexistent',
        quotationNumber: 'QT-002',
        validUntil: new Date().toISOString(),
        lineItems: [{ description: 'Widget', quantity: 1, unitPrice: 10, taxRate: 0 }],
      };

      await expect(
        service.createQuotation('tenant-1', 'org-1', dto, 'user-1'),
      ).rejects.toThrow('Customer not found');
    });
  });

  describe('getSalesOrders', () => {
    it('should return mapped sales orders', async () => {
      const mockOrders = [
        {
          id: 'so-1',
          orderNumber: 'SO-001',
          status: 'DRAFT',
          orderDate: new Date(),
          deliveryDate: null,
          subtotal: { toString: () => '1000' },
          taxAmount: { toString: () => '100' },
          totalAmount: { toString: () => '1100' },
          currency: 'USD',
          customer: { name: 'Customer A' },
          lineItems: [{ id: 'li-1' }, { id: 'li-2' }],
          deliveryNotes: [],
        },
      ];

      vi.mocked(prisma.salesOrder.findMany).mockResolvedValue(mockOrders as never);

      const result = await service.getSalesOrders('tenant-1');

      expect(result).toHaveLength(1);
      expect(result[0]?.orderNumber).toBe('SO-001');
      expect(result[0]?.lineItemCount).toBe(2);
      expect(result[0]?.deliveryNotesCount).toBe(0);
    });
  });

  describe('createSalesOrder', () => {
    it('should create a sales order with line items', async () => {
      vi.mocked(prisma.organization.findFirst).mockResolvedValue({ id: 'org-1' } as never);
      vi.mocked(prisma.salesOrder.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.customer.findFirst).mockResolvedValue({ id: 'cust-1' } as never);

      const dto = {
        customerId: 'cust-1',
        orderNumber: 'SO-001',
        lineItems: [{ description: 'Widget Pro', quantity: 5, unitPrice: 200, taxRate: 10 }],
      };

      const result = await service.createSalesOrder('tenant-1', 'org-system-default', dto, 'user-1');

      expect(result).toBeDefined();
      expect(result.orderNumber).toBe('SO-001');
    });
  });

  describe('updateSalesOrderStatus', () => {
    it('should update the status of a sales order', async () => {
      vi.mocked(prisma.salesOrder.findFirst).mockResolvedValue({ id: 'so-1' } as never);
      vi.mocked(prisma.salesOrder.update).mockResolvedValue({ id: 'so-1', status: 'CONFIRMED' } as never);

      await service.updateSalesOrderStatus('tenant-1', 'so-1', 'CONFIRMED');

      expect(prisma.salesOrder.update).toHaveBeenCalledWith({
        where: { id: 'so-1' },
        data: { status: 'CONFIRMED' },
      });
    });

    it('should throw NotFoundException when sales order not found', async () => {
      vi.mocked(prisma.salesOrder.findFirst).mockResolvedValue(null);

      await expect(
        service.updateSalesOrderStatus('tenant-1', 'nonexistent', 'CONFIRMED'),
      ).rejects.toThrow('Sales order not found');
    });
  });
});
