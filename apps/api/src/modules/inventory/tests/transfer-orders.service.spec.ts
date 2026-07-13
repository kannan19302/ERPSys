import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { TransferOrdersService } from '../transfer-orders.service';

vi.mock('@unerp/database', () => ({
  prisma: {
    transferOrder: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    transferOrderLine: {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    transferOrderReceipt: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    transferOrderReceiptLine: {
      findMany: vi.fn(),
    },
  },
}));

const TENANT = 't1';
const USER = 'u1';

const mockOrder = (o: Record<string, unknown> = {}) => ({
  id: 'to1', tenantId: TENANT, transferNumber: 'TO-00001',
  fromWarehouseId: 'wh1', toWarehouseId: 'wh2',
  status: 'DRAFT', priority: 'NORMAL', lines: [], receipts: [],
  ...o,
});

const mockLine = (o: Record<string, unknown> = {}) => ({
  id: 'l1', tenantId: TENANT, transferOrderId: 'to1',
  productId: 'prod1', requestedQty: '100', shippedQty: '0', receivedQty: '0',
  ...o,
});

describe('TransferOrdersService', () => {
  let svc: TransferOrdersService;

  beforeEach(async () => {
    vi.clearAllMocks();
    svc = new TransferOrdersService();
  });

  describe('listTransferOrders', () => {
    it('returns orders for tenant', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.transferOrder.findMany).mockResolvedValue([mockOrder()] as never);
      const result = await svc.listTransferOrders(TENANT);
      expect(result).toHaveLength(1);
    });

    it('filters by status', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.transferOrder.findMany).mockResolvedValue([] as never);
      await svc.listTransferOrders(TENANT, 'IN_TRANSIT');
      expect(prisma.transferOrder.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ status: 'IN_TRANSIT' }) }),
      );
    });
  });

  describe('getTransferOrder', () => {
    it('returns order when found', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.transferOrder.findFirst).mockResolvedValue(mockOrder() as never);
      const result = await svc.getTransferOrder(TENANT, 'to1');
      expect(result.id).toBe('to1');
    });

    it('throws NotFoundException when not found', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.transferOrder.findFirst).mockResolvedValue(null as never);
      await expect(svc.getTransferOrder(TENANT, 'missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createTransferOrder', () => {
    it('creates order with auto-number', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.transferOrder.count).mockResolvedValue(0 as never);
      vi.mocked(prisma.transferOrder.create).mockResolvedValue(mockOrder() as never);
      await svc.createTransferOrder(TENANT, USER, {
        fromWarehouseId: 'wh1', toWarehouseId: 'wh2',
        lines: [{ productId: 'prod1', requestedQty: 50 }],
      });
      expect(prisma.transferOrder.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ transferNumber: 'TO-00001' }) }),
      );
    });

    it('throws if same from/to warehouse', async () => {
      await expect(svc.createTransferOrder(TENANT, USER, {
        fromWarehouseId: 'wh1', toWarehouseId: 'wh1',
        lines: [],
      })).rejects.toThrow(BadRequestException);
    });
  });

  describe('submitForApproval', () => {
    it('moves DRAFT to PENDING_APPROVAL', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.transferOrder.findFirst).mockResolvedValue(mockOrder({ lines: [mockLine()] }) as never);
      vi.mocked(prisma.transferOrder.update).mockResolvedValue(mockOrder({ status: 'PENDING_APPROVAL' }) as never);
      const result = await svc.submitForApproval(TENANT, 'to1');
      expect(result.status).toBe('PENDING_APPROVAL');
    });

    it('throws if no lines', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.transferOrder.findFirst).mockResolvedValue(mockOrder({ lines: [] }) as never);
      await expect(svc.submitForApproval(TENANT, 'to1')).rejects.toThrow(BadRequestException);
    });

    it('throws if not DRAFT', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.transferOrder.findFirst).mockResolvedValue(mockOrder({ status: 'APPROVED' }) as never);
      await expect(svc.submitForApproval(TENANT, 'to1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('approve', () => {
    it('approves PENDING_APPROVAL order', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.transferOrder.findFirst).mockResolvedValue(mockOrder({ status: 'PENDING_APPROVAL' }) as never);
      vi.mocked(prisma.transferOrder.update).mockResolvedValue(mockOrder({ status: 'APPROVED' }) as never);
      const result = await svc.approve(TENANT, 'to1', USER);
      expect(result.status).toBe('APPROVED');
    });

    it('throws if not PENDING_APPROVAL', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.transferOrder.findFirst).mockResolvedValue(mockOrder({ status: 'DRAFT' }) as never);
      await expect(svc.approve(TENANT, 'to1', USER)).rejects.toThrow(BadRequestException);
    });
  });

  describe('ship', () => {
    it('ships APPROVED order', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.transferOrder.findFirst).mockResolvedValue(mockOrder({ status: 'APPROVED', lines: [mockLine()] }) as never);
      vi.mocked(prisma.transferOrderLine.update).mockResolvedValue(mockLine() as never);
      vi.mocked(prisma.transferOrder.update).mockResolvedValue(mockOrder({ status: 'IN_TRANSIT' }) as never);
      const result = await svc.ship(TENANT, 'to1', USER, {
        shippedLines: [{ lineId: 'l1', shippedQty: 80 }],
      });
      expect(result.status).toBe('IN_TRANSIT');
    });

    it('throws if shipped qty exceeds requested', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.transferOrder.findFirst).mockResolvedValue(mockOrder({ status: 'APPROVED', lines: [mockLine({ requestedQty: '100' })] }) as never);
      await expect(svc.ship(TENANT, 'to1', USER, {
        shippedLines: [{ lineId: 'l1', shippedQty: 150 }],
      })).rejects.toThrow(BadRequestException);
    });

    it('throws if not APPROVED', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.transferOrder.findFirst).mockResolvedValue(mockOrder({ status: 'DRAFT' }) as never);
      await expect(svc.ship(TENANT, 'to1', USER, { shippedLines: [] })).rejects.toThrow(BadRequestException);
    });
  });

  describe('cancel', () => {
    it('cancels non-terminal order', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.transferOrder.findFirst).mockResolvedValue(mockOrder({ status: 'APPROVED' }) as never);
      vi.mocked(prisma.transferOrder.update).mockResolvedValue(mockOrder({ status: 'CANCELLED' }) as never);
      const result = await svc.cancel(TENANT, 'to1');
      expect(result.status).toBe('CANCELLED');
    });

    it('throws if already completed', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.transferOrder.findFirst).mockResolvedValue(mockOrder({ status: 'COMPLETED' }) as never);
      await expect(svc.cancel(TENANT, 'to1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('closeOut', () => {
    it('closes out PARTIALLY_RECEIVED order', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.transferOrder.findFirst).mockResolvedValue(mockOrder({ status: 'PARTIALLY_RECEIVED' }) as never);
      vi.mocked(prisma.transferOrder.update).mockResolvedValue(mockOrder({ status: 'COMPLETED' }) as never);
      const result = await svc.closeOut(TENANT, 'to1');
      expect(result.status).toBe('COMPLETED');
    });

    it('throws if not PARTIALLY_RECEIVED', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.transferOrder.findFirst).mockResolvedValue(mockOrder({ status: 'IN_TRANSIT' }) as never);
      await expect(svc.closeOut(TENANT, 'to1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('addLine', () => {
    it('adds line to DRAFT order', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.transferOrder.findFirst).mockResolvedValue(mockOrder({ lines: [] }) as never);
      vi.mocked(prisma.transferOrderLine.create).mockResolvedValue(mockLine() as never);
      const result = await svc.addLine(TENANT, 'to1', { productId: 'prod1', requestedQty: 50 });
      expect(result.id).toBe('l1');
    });

    it('throws if order is IN_TRANSIT', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.transferOrder.findFirst).mockResolvedValue(mockOrder({ status: 'IN_TRANSIT' }) as never);
      await expect(svc.addLine(TENANT, 'to1', { productId: 'prod1', requestedQty: 50 })).rejects.toThrow(BadRequestException);
    });
  });

  describe('getDashboard', () => {
    it('returns all status counts', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.transferOrder.count).mockResolvedValue(5 as never);
      const result = await svc.getDashboard(TENANT);
      expect(result.total).toBe(5);
      expect(result.byStatus).toBeDefined();
    });
  });

  describe('getInTransitSummary', () => {
    it('returns in-transit summary', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.transferOrder.findMany).mockResolvedValue([
        mockOrder({ status: 'IN_TRANSIT', lines: [mockLine({ shippedQty: '80', receivedQty: '50' })] }),
      ] as never);
      const result = await svc.getInTransitSummary(TENANT);
      expect(result).toHaveLength(1);
      expect(result[0].pendingLines).toBe(1);
    });
  });
});
