import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RtvService } from '../rtv.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

vi.mock('@unerp/database', () => ({
  prisma: {
    returnReasonCode: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    vendorRmaRequest: {
      findMany: vi.fn(),
      count: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      groupBy: vi.fn(),
    },
    vendorReturnShipment: {
      findMany: vi.fn(),
      count: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      aggregate: vi.fn(),
    },
  },
}));

describe('RtvService', () => {
  let service: RtvService;
  let emitter: EventEmitter2;

  beforeEach(() => {
    emitter = new EventEmitter2();
    vi.spyOn(emitter, 'emit');
    service = new RtvService(emitter);
    vi.clearAllMocks();
  });

  // ─── Reason Codes ──────────────────────────────────────────────────────

  describe('listReasonCodes', () => {
    it('returns active reason codes by default', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.returnReasonCode.findMany).mockResolvedValue([{ id: 'rc-1', code: 'DEFECTIVE', isActive: true }] as never);
      const result = await service.listReasonCodes('t-1');
      expect(prisma.returnReasonCode.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ isActive: true }) }),
      );
      expect(result).toHaveLength(1);
    });

    it('includes inactive codes when flag set', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.returnReasonCode.findMany).mockResolvedValue([]);
      await service.listReasonCodes('t-1', true);
      const call = vi.mocked(prisma.returnReasonCode.findMany).mock.calls[0]?.[0] as { where: Record<string, unknown> };
      expect(call.where.isActive).toBeUndefined();
    });
  });

  describe('createReasonCode', () => {
    it('creates a new reason code', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.returnReasonCode.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.returnReasonCode.create).mockResolvedValue({ id: 'rc-1', code: 'DEFECTIVE' } as never);
      const result = await service.createReasonCode('t-1', { code: 'defective', name: 'Defective item' });
      expect(prisma.returnReasonCode.create).toHaveBeenCalled();
      expect(result.id).toBe('rc-1');
    });

    it('throws ConflictException if code already exists', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.returnReasonCode.findUnique).mockResolvedValue({ id: 'rc-1' } as never);
      await expect(service.createReasonCode('t-1', { code: 'DEFECTIVE', name: 'Defective' })).rejects.toThrow('already exists');
    });
  });

  // ─── RMA Requests ──────────────────────────────────────────────────────

  describe('createRmaRequest', () => {
    it('creates an RMA request and emits event', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.vendorRmaRequest.create).mockResolvedValue({ id: 'rma-1', status: 'PENDING' } as never);
      const result = await service.createRmaRequest('t-1', 'org-1', 'user-1', {
        purchaseReturnId: 'pr-1',
        vendorId: 'v-1',
      });
      expect(result.id).toBe('rma-1');
      expect(emitter.emit).toHaveBeenCalledWith('inventory.rtv.rma_created', expect.objectContaining({ rmaId: 'rma-1' }));
    });
  });

  describe('submitRmaRequest', () => {
    it('submits a PENDING RMA', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.vendorRmaRequest.findFirst).mockResolvedValue({ id: 'rma-1', status: 'PENDING', shipments: [] } as never);
      vi.mocked(prisma.vendorRmaRequest.update).mockResolvedValue({ id: 'rma-1', status: 'SUBMITTED' } as never);
      const result = await service.submitRmaRequest('t-1', 'rma-1');
      expect(result.status).toBe('SUBMITTED');
    });

    it('throws if RMA is not PENDING', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.vendorRmaRequest.findFirst).mockResolvedValue({ id: 'rma-1', status: 'AUTHORIZED', shipments: [] } as never);
      await expect(service.submitRmaRequest('t-1', 'rma-1')).rejects.toThrow('cannot submit');
    });
  });

  describe('rejectRmaRequest', () => {
    it('rejects a SUBMITTED RMA with a reason', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.vendorRmaRequest.findFirst).mockResolvedValue({ id: 'rma-1', status: 'SUBMITTED', shipments: [] } as never);
      vi.mocked(prisma.vendorRmaRequest.update).mockResolvedValue({ id: 'rma-1', status: 'REJECTED' } as never);
      const result = await service.rejectRmaRequest('t-1', 'rma-1', { rejectionReason: 'Outside return window' });
      expect(result.status).toBe('REJECTED');
    });
  });

  // ─── Return Shipments ──────────────────────────────────────────────────

  describe('createShipment', () => {
    it('creates a shipment for an AUTHORIZED RMA', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.vendorRmaRequest.findFirst).mockResolvedValue({ id: 'rma-1', status: 'AUTHORIZED' } as never);
      vi.mocked(prisma.vendorReturnShipment.create).mockResolvedValue({ id: 'ship-1', status: 'PENDING' } as never);
      const result = await service.createShipment('t-1', {
        rmaRequestId: 'rma-1', warehouseId: 'wh-1', carrier: 'FedEx', trackingNumber: '123',
      });
      expect(result.id).toBe('ship-1');
    });

    it('throws if RMA is not AUTHORIZED', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.vendorRmaRequest.findFirst).mockResolvedValue({ id: 'rma-1', status: 'SUBMITTED' } as never);
      await expect(service.createShipment('t-1', { rmaRequestId: 'rma-1', warehouseId: 'wh-1' })).rejects.toThrow('AUTHORIZED');
    });
  });

  describe('shipment lifecycle', () => {
    it('advances pack → ship → deliver in order', async () => {
      const { prisma } = await import('@unerp/database');

      vi.mocked(prisma.vendorReturnShipment.findFirst).mockResolvedValue({ id: 'ship-1', status: 'PENDING', rmaRequest: {}, warehouse: {} } as never);
      vi.mocked(prisma.vendorReturnShipment.update).mockResolvedValue({ id: 'ship-1', status: 'PACKED' } as never);
      const packed = await service.packShipment('t-1', 'ship-1');
      expect(packed.status).toBe('PACKED');

      vi.mocked(prisma.vendorReturnShipment.findFirst).mockResolvedValue({ id: 'ship-1', status: 'PACKED', rmaRequest: {}, warehouse: {} } as never);
      vi.mocked(prisma.vendorReturnShipment.update).mockResolvedValue({ id: 'ship-1', status: 'SHIPPED' } as never);
      const shipped = await service.markShipped('t-1', 'ship-1');
      expect(shipped.status).toBe('SHIPPED');

      vi.mocked(prisma.vendorReturnShipment.findFirst).mockResolvedValue({ id: 'ship-1', status: 'SHIPPED', rmaRequest: {}, warehouse: {} } as never);
      vi.mocked(prisma.vendorReturnShipment.update).mockResolvedValue({ id: 'ship-1', status: 'DELIVERED' } as never);
      const delivered = await service.markDelivered('t-1', 'ship-1');
      expect(delivered.status).toBe('DELIVERED');
    });

    it('throws if pack attempted on non-PENDING shipment', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.vendorReturnShipment.findFirst).mockResolvedValue({ id: 'ship-1', status: 'SHIPPED', rmaRequest: {}, warehouse: {} } as never);
      await expect(service.packShipment('t-1', 'ship-1')).rejects.toThrow('cannot pack');
    });
  });

  describe('getRtvDashboard', () => {
    it('returns aggregate counts and credit total', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.vendorRmaRequest.count).mockResolvedValue(5);
      vi.mocked(prisma.vendorRmaRequest.groupBy).mockResolvedValue([
        { status: 'AUTHORIZED', _count: { _all: 2 } },
        { status: 'COMPLETED', _count: { _all: 3 } },
      ] as never);
      vi.mocked(prisma.vendorReturnShipment.count).mockResolvedValue(1);
      vi.mocked(prisma.vendorReturnShipment.aggregate).mockResolvedValue({ _sum: { creditAmount: 500 } } as never);
      const result = await service.getRtvDashboard('t-1');
      expect(result.totalRmas).toBe(5);
      expect(result.pendingShipments).toBe(1);
      expect(result.totalCreditReceived).toBe(500);
    });
  });
});
