import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProcurementService } from '../procurement.service';

// Mock @unerp/database
vi.mock('@unerp/database', () => ({
  prisma: {
    purchaseOrder: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    purchaseOrderItem: {
      create: vi.fn(),
    },
    purchaseReceipt: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    purchaseReceiptItem: {
      create: vi.fn(),
    },
    organization: {
      findFirst: vi.fn(),
    },
    vendor: {
      findFirst: vi.fn(),
    },
    $transaction: vi.fn((fn: (tx: unknown) => Promise<unknown>) => fn({
      purchaseOrder: {
        create: vi.fn().mockResolvedValue({ id: 'po-1', poNumber: 'PO-001', status: 'DRAFT' }),
        update: vi.fn(),
      },
      purchaseOrderItem: { create: vi.fn() },
      purchaseReceipt: {
        create: vi.fn().mockResolvedValue({ id: 'rcpt-1', receiptNumber: 'REC-001' }),
      },
      purchaseReceiptItem: { create: vi.fn() },
    })),
  },
}));

import { prisma } from '@unerp/database';

describe('ProcurementService', () => {
  let service: ProcurementService;

  beforeEach(() => {
    service = new ProcurementService();
    vi.clearAllMocks();
  });

  describe('getPurchaseOrders', () => {
    it('should return an array of mapped purchase orders', async () => {
      const mockOrders = [
        {
          id: 'po-1',
          poNumber: 'PO-001',
          status: 'DRAFT',
          orderDate: new Date(),
          expectedDate: null,
          subtotal: { toString: () => '1000' },
          taxAmount: { toString: () => '100' },
          totalAmount: { toString: () => '1100' },
          currency: 'USD',
          notes: null,
          vendor: { name: 'Test Vendor' },
          lineItems: [
            {
              id: 'li-1',
              description: 'Widget',
              quantity: { toString: () => '10' },
              receivedQty: { toString: () => '0' },
              unitPrice: { toString: () => '100' },
              taxRate: { toString: () => '10' },
              totalAmount: { toString: () => '1100' },
            },
          ],
          receipts: [],
        },
      ];

      vi.mocked(prisma.purchaseOrder.findMany).mockResolvedValue(mockOrders as never);

      const result = await service.getPurchaseOrders('tenant-1');

      expect(result).toHaveLength(1);
      expect(result[0]?.poNumber).toBe('PO-001');
      expect(result[0]?.vendorName).toBe('Test Vendor');
      expect(prisma.purchaseOrder.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { tenantId: 'tenant-1', deletedAt: null } }),
      );
    });
  });

  describe('createPurchaseOrder', () => {
    it('should create a PO with line items using a transaction', async () => {
      vi.mocked(prisma.organization.findFirst).mockResolvedValue(
        { id: 'org-1', name: 'Test Org' } as never,
      );
      vi.mocked(prisma.purchaseOrder.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.vendor.findFirst).mockResolvedValue(
        { id: 'vendor-1', name: 'Vendor' } as never,
      );

      const dto = {
        vendorId: 'vendor-1',
        poNumber: 'PO-001',
        lineItems: [
          { description: 'Widget Pro', quantity: 5, unitPrice: 100, taxRate: 10 },
        ],
      };

      const result = await service.createPurchaseOrder('tenant-1', 'org-system-default', dto, 'user-1');

      expect(result).toBeDefined();
      expect(result.poNumber).toBe('PO-001');
    });

    it('should throw BadRequestException when PO number already exists', async () => {
      vi.mocked(prisma.organization.findFirst).mockResolvedValue(
        { id: 'org-1', name: 'Test Org' } as never,
      );
      vi.mocked(prisma.purchaseOrder.findFirst).mockResolvedValue(
        { id: 'existing' } as never,
      );

      const dto = {
        vendorId: 'vendor-1',
        poNumber: 'PO-001',
        lineItems: [{ description: 'Widget', quantity: 1, unitPrice: 50, taxRate: 0 }],
      };

      await expect(
        service.createPurchaseOrder('tenant-1', 'org-1', dto, 'user-1'),
      ).rejects.toThrow('PO number PO-001 already exists');
    });
  });

  describe('updatePurchaseOrderStatus', () => {
    it('should update status and set approval fields when APPROVED', async () => {
      vi.mocked(prisma.purchaseOrder.findFirst).mockResolvedValue({ id: 'po-1' } as never);
      vi.mocked(prisma.purchaseOrder.update).mockResolvedValue({
        id: 'po-1',
        status: 'APPROVED',
      } as never);

      await service.updatePurchaseOrderStatus('tenant-1', 'po-1', 'APPROVED', 'user-1');

      expect(prisma.purchaseOrder.update).toHaveBeenCalledWith({
        where: { id: 'po-1' },
        data: expect.objectContaining({ status: 'APPROVED', approvedBy: 'user-1' }),
      });
    });

    it('should throw NotFoundException when PO does not exist', async () => {
      vi.mocked(prisma.purchaseOrder.findFirst).mockResolvedValue(null);

      await expect(
        service.updatePurchaseOrderStatus('tenant-1', 'nonexistent', 'APPROVED', 'user-1'),
      ).rejects.toThrow('Purchase order not found');
    });
  });
});
