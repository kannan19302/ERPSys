import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ProcurementService } from '../procurement.service';

// Mock @prisma/client
vi.mock('@prisma/client', () => ({
  Prisma: {
    Decimal: class Decimal {
      constructor(value: unknown) {
        return Number(value);
      }
    },
    JsonNull: 'JsonNull',
  },
}));

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
    purchaseReturn: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    purchaseReturnItem: {
      create: vi.fn(),
    },
    debitNote: {
      create: vi.fn(),
    },
    product: {
      findFirst: vi.fn(),
    },
    inventoryItem: {
      findFirst: vi.fn(),
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
      debitNote: {
        create: vi.fn().mockResolvedValue({ id: 'dn-1', noteNumber: 'DN-PR-001' }),
      },
      purchaseReturn: {
        create: vi.fn().mockResolvedValue({ id: 'pr-1', returnNumber: 'PR-001' }),
      },
      purchaseReturnItem: {
        create: vi.fn(),
      },
    })),
  },
}));

import { prisma } from '@unerp/database';

describe('ProcurementService', () => {
  let service: ProcurementService;
  let mockEventEmitter: EventEmitter2;

  beforeEach(() => {
    mockEventEmitter = {
      emit: vi.fn(),
    } as unknown as EventEmitter2;
    service = new ProcurementService(mockEventEmitter);
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

  describe('Purchase Returns', () => {
    it('should return mapped purchase returns', async () => {
      const mockReturns = [
        {
          id: 'pr-1',
          returnNumber: 'PR-001',
          status: 'COMPLETED',
          returnDate: new Date(),
          totalAmount: { toString: () => '100' },
          vendor: { name: 'Test Vendor' },
          purchaseOrder: { poNumber: 'PO-001' },
          lineItems: [{}],
        },
      ];
      vi.mocked(prisma.purchaseReturn.findMany).mockResolvedValue(mockReturns as never);

      const result = await service.getPurchaseReturns('tenant-1');
      expect(result).toHaveLength(1);
      expect(result[0]?.returnNumber).toBe('PR-001');
      expect(result[0]?.vendorName).toBe('Test Vendor');
    });

    it('should create a purchase return and debit note', async () => {
      vi.mocked(prisma.purchaseOrder.findFirst).mockResolvedValue({
        id: 'po-1',
        vendorId: 'vendor-1',
      } as never);
      vi.mocked(prisma.purchaseReturn.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.organization.findFirst).mockResolvedValue({ id: 'org-1' } as never);

      const dto = {
        purchaseOrderId: 'po-1',
        returnNumber: 'PR-001',
        reason: 'Defective items',
        lineItems: [
          { productId: 'prod-1', description: 'Item A', quantity: 2, unitPrice: 50, taxRate: 10 },
        ],
      };

      const result = await service.createPurchaseReturn('tenant-1', 'org-1', dto, 'user-1');
      expect(result).toBeDefined();
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'procurement.return.created',
        expect.objectContaining({
          tenantId: 'tenant-1',
          purchaseReturnId: 'pr-1',
        }),
      );
    });
  });

  describe('handleReorderEvent', () => {
    it('should auto-create a draft purchase order when event is received', async () => {
      vi.mocked(prisma.product.findFirst).mockResolvedValue({
        id: 'prod-1',
        name: 'Restock Product',
        sku: 'RESTOCK-001',
        costPrice: { toString: () => '10' },
      } as never);
      vi.mocked(prisma.organization.findFirst).mockResolvedValue({ id: 'org-1' } as never);
      vi.mocked(prisma.vendor.findFirst).mockResolvedValue({ id: 'vendor-1', status: 'ACTIVE' } as never);
      vi.mocked(prisma.purchaseOrder.findFirst).mockResolvedValue(null);

      await service.handleReorderEvent({
        tenantId: 'tenant-1',
        productId: 'prod-1',
        warehouseId: 'wh-1',
        reorderQty: 50,
      });

      // Verify that findFirst was called to check if PO exists
      expect(prisma.purchaseOrder.findFirst).toHaveBeenCalled();
    });
  });
});
