import { Test } from '@nestjs/testing';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { LotSerialTrackingService } from '../lot-serial-tracking.service';

vi.mock('@unerp/database', () => ({
  PrismaService: vi.fn(),
  prisma: {
    batch: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    serialNumber: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    serialNumberHistory: {
      create: vi.fn(),
    },
    lotMovement: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    pickSuggestion: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    expiryAlert: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    quarantineOrder: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

const TENANT = 'tenant-ls-1';
const USER = 'user-1';

describe('LotSerialTrackingService', () => {
  let svc: LotSerialTrackingService;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await Test.createTestingModule({ providers: [LotSerialTrackingService] }).compile();
    svc = mod.get(LotSerialTrackingService);
  });

  // ── Batch/Lot ─────────────────────────────────────────────────────────────
  describe('listBatches', () => {
    it('returns batches with status filter', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.batch.findMany).mockResolvedValue([{ id: 'b1', batchNo: 'LOT-001' }] as any);
      const result = await svc.listBatches(TENANT, { status: 'ACTIVE' });
      expect(result).toHaveLength(1);
      expect(vi.mocked(prisma.batch.findMany)).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ tenantId: TENANT, status: 'ACTIVE' }) })
      );
    });
  });

  describe('createBatch', () => {
    it('creates a batch when batchNo is unique', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.batch.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.batch.create).mockResolvedValue({ id: 'b1', batchNo: 'LOT-001', status: 'ACTIVE' } as any);
      const result = await svc.createBatch(TENANT, { productId: 'p1', warehouseId: 'wh1', batchNo: 'LOT-001', quantity: 100 });
      expect(result.status).toBe('ACTIVE');
    });

    it('throws if batchNo already exists for product', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.batch.findFirst).mockResolvedValue({ id: 'b1' } as any);
      await expect(svc.createBatch(TENANT, { productId: 'p1', warehouseId: 'wh1', batchNo: 'LOT-001', quantity: 100 }))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('quarantineBatch', () => {
    it('quarantines an ACTIVE batch', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.batch.findFirst).mockResolvedValue({ id: 'b1', status: 'ACTIVE' } as any);
      vi.mocked(prisma.batch.update).mockResolvedValue({ id: 'b1', status: 'QUARANTINE' } as any);
      const result = await svc.quarantineBatch(TENANT, 'b1');
      expect(result.status).toBe('QUARANTINE');
    });

    it('throws if batch is already in quarantine', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.batch.findFirst).mockResolvedValue({ id: 'b1', status: 'QUARANTINE' } as any);
      await expect(svc.quarantineBatch(TENANT, 'b1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('releaseBatchFromQuarantine', () => {
    it('releases a QUARANTINE batch', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.batch.findFirst).mockResolvedValue({ id: 'b1', status: 'QUARANTINE' } as any);
      vi.mocked(prisma.batch.update).mockResolvedValue({ id: 'b1', status: 'ACTIVE' } as any);
      const result = await svc.releaseBatchFromQuarantine(TENANT, 'b1');
      expect(result.status).toBe('ACTIVE');
    });

    it('throws if batch is not in quarantine', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.batch.findFirst).mockResolvedValue({ id: 'b1', status: 'ACTIVE' } as any);
      await expect(svc.releaseBatchFromQuarantine(TENANT, 'b1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('recordLotMovement', () => {
    it('records a movement for a valid batch', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.batch.findFirst).mockResolvedValue({ id: 'b1' } as any);
      vi.mocked(prisma.lotMovement.create).mockResolvedValue({ id: 'm1', movementType: 'PICK' } as any);
      const result = await svc.recordLotMovement(TENANT, USER, {
        batchId: 'b1', movementType: 'PICK', qty: 10,
      });
      expect(result.movementType).toBe('PICK');
    });

    it('throws if batch not found', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.batch.findFirst).mockResolvedValue(null);
      await expect(svc.recordLotMovement(TENANT, USER, { batchId: 'b1', movementType: 'PICK', qty: 5 }))
        .rejects.toThrow(NotFoundException);
    });
  });

  // ── Serial Numbers ────────────────────────────────────────────────────────
  describe('createSerial', () => {
    it('creates a serial when serialNo is unique', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.serialNumber.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.serialNumber.create).mockResolvedValue({ id: 's1', serialNo: 'SN-001', status: 'AVAILABLE' } as any);
      const result = await svc.createSerial(TENANT, { productId: 'p1', warehouseId: 'wh1', serialNo: 'SN-001' });
      expect(result.status).toBe('AVAILABLE');
    });

    it('throws if serialNo already exists', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.serialNumber.findFirst).mockResolvedValue({ id: 's1' } as any);
      await expect(svc.createSerial(TENANT, { productId: 'p1', warehouseId: 'wh1', serialNo: 'SN-001' }))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('markSerialSold', () => {
    it('marks an AVAILABLE serial as SOLD', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.serialNumber.findFirst).mockResolvedValue({ id: 's1', status: 'AVAILABLE', salesOrderId: null } as any);
      vi.mocked(prisma.$transaction).mockResolvedValue([{ id: 's1', status: 'SOLD' }, {}] as any);
      const result = await svc.markSerialSold(TENANT, 's1', 'SO-001');
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('throws if serial is neither AVAILABLE nor RESERVED', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.serialNumber.findFirst).mockResolvedValue({ id: 's1', status: 'SOLD' } as any);
      await expect(svc.markSerialSold(TENANT, 's1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('markSerialReturned', () => {
    it('marks a SOLD serial as RETURNED', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.serialNumber.findFirst).mockResolvedValue({ id: 's1', status: 'SOLD' } as any);
      vi.mocked(prisma.$transaction).mockResolvedValue([{ id: 's1', status: 'RETURNED' }, {}] as any);
      const result = await svc.markSerialReturned(TENANT, 's1', 'Customer return');
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('throws if serial is not SOLD', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.serialNumber.findFirst).mockResolvedValue({ id: 's1', status: 'AVAILABLE' } as any);
      await expect(svc.markSerialReturned(TENANT, 's1')).rejects.toThrow(BadRequestException);
    });
  });

  // ── Pick Suggestions ──────────────────────────────────────────────────────
  describe('generatePickSuggestions', () => {
    it('generates FEFO suggestions from active batches', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.batch.findMany).mockResolvedValue([
        { id: 'b1', batchNo: 'LOT-001', quantity: { toString: () => '50' }, usedQty: { toString: () => '0' }, expiryDate: new Date('2026-08-01') },
        { id: 'b2', batchNo: 'LOT-002', quantity: { toString: () => '100' }, usedQty: { toString: () => '0' }, expiryDate: new Date('2026-09-01') },
      ] as any);
      vi.mocked(prisma.pickSuggestion.create).mockResolvedValue({ id: 'ps1', batchId: 'b1' } as any);
      const result = await svc.generatePickSuggestions(TENANT, {
        productId: 'p1', warehouseId: 'wh1', qtyNeeded: 30, strategy: 'FEFO',
      });
      expect(result.fullyAllocated).toBe(true);
      expect(result.unallocatedQty).toBe(0);
    });

    it('reports unallocatedQty when batches are insufficient', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.batch.findMany).mockResolvedValue([
        { id: 'b1', batchNo: 'LOT-001', quantity: { toString: () => '20' }, usedQty: { toString: () => '0' }, expiryDate: null },
      ] as any);
      vi.mocked(prisma.pickSuggestion.create).mockResolvedValue({ id: 'ps1' } as any);
      const result = await svc.generatePickSuggestions(TENANT, {
        productId: 'p1', warehouseId: 'wh1', qtyNeeded: 50, strategy: 'FEFO',
      });
      expect(result.fullyAllocated).toBe(false);
      expect(result.unallocatedQty).toBe(30);
    });
  });

  describe('confirmPickSuggestion', () => {
    it('confirms a PENDING suggestion with valid qty', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.pickSuggestion.findFirst).mockResolvedValue({
        id: 'ps1', status: 'PENDING', suggestedQty: { toString: () => '30' },
      } as any);
      vi.mocked(prisma.pickSuggestion.update).mockResolvedValue({ id: 'ps1', status: 'CONFIRMED' } as any);
      const result = await svc.confirmPickSuggestion(TENANT, 'ps1', { pickedQty: 25 });
      expect(result.status).toBe('CONFIRMED');
    });

    it('throws if picked qty exceeds suggested qty', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.pickSuggestion.findFirst).mockResolvedValue({
        id: 'ps1', status: 'PENDING', suggestedQty: { toString: () => '10' },
      } as any);
      await expect(svc.confirmPickSuggestion(TENANT, 'ps1', { pickedQty: 20 })).rejects.toThrow(BadRequestException);
    });
  });

  // ── Expiry Alerts ─────────────────────────────────────────────────────────
  describe('generateExpiryAlerts', () => {
    it('generates alerts for batches expiring within threshold', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.batch.findMany).mockResolvedValue([
        { id: 'b1', productId: 'p1', quantity: 50, expiryDate: new Date(Date.now() + 5 * 86400000) },
      ] as any);
      vi.mocked(prisma.expiryAlert.create).mockResolvedValue({ id: 'a1', severity: 'CRITICAL' } as any);
      const result = await svc.generateExpiryAlerts(TENANT, { thresholdDays: 30 });
      expect(result.generated).toBe(1);
    });
  });

  describe('acknowledgeExpiryAlert', () => {
    it('acknowledges an alert', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.expiryAlert.findFirst).mockResolvedValue({ id: 'a1', acknowledged: false } as any);
      vi.mocked(prisma.expiryAlert.update).mockResolvedValue({ id: 'a1', acknowledged: true } as any);
      const result = await svc.acknowledgeExpiryAlert(TENANT, 'a1', USER);
      expect(result.acknowledged).toBe(true);
    });

    it('throws if alert not found', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.expiryAlert.findFirst).mockResolvedValue(null);
      await expect(svc.acknowledgeExpiryAlert(TENANT, 'a1', USER)).rejects.toThrow(NotFoundException);
    });
  });

  // ── Quarantine Orders ─────────────────────────────────────────────────────
  describe('createQuarantineOrder', () => {
    it('creates a quarantine order with auto-number and quarantines batch', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.quarantineOrder.count).mockResolvedValue(2);
      vi.mocked(prisma.quarantineOrder.create).mockResolvedValue({ id: 'qo1', orderNumber: 'QO-00003', status: 'ACTIVE' } as any);
      vi.mocked(prisma.batch.update).mockResolvedValue({} as any);
      const result = await svc.createQuarantineOrder(TENANT, USER, {
        productId: 'p1', warehouseId: 'wh1', qty: 50, reason: 'Contamination', batchId: 'b1',
      });
      expect(result.orderNumber).toBe('QO-00003');
      expect(prisma.batch.update).toHaveBeenCalledWith(expect.objectContaining({ data: { status: 'QUARANTINE' } }));
    });
  });

  describe('releaseQuarantineOrder', () => {
    it('releases an ACTIVE quarantine order and restores batch', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.quarantineOrder.findFirst).mockResolvedValue({
        id: 'qo1', status: 'ACTIVE', batchId: 'b1', serialId: null,
      } as any);
      vi.mocked(prisma.quarantineOrder.update).mockResolvedValue({ id: 'qo1', status: 'RELEASED' } as any);
      vi.mocked(prisma.batch.update).mockResolvedValue({} as any);
      const result = await svc.releaseQuarantineOrder(TENANT, 'qo1', USER, { releaseNotes: 'Passed QC' });
      expect(result.status).toBe('RELEASED');
      expect(prisma.batch.update).toHaveBeenCalledWith(expect.objectContaining({ data: { status: 'ACTIVE' } }));
    });

    it('throws if order is not ACTIVE', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.quarantineOrder.findFirst).mockResolvedValue({ id: 'qo1', status: 'RELEASED', batchId: null, serialId: null } as any);
      await expect(svc.releaseQuarantineOrder(TENANT, 'qo1', USER, { releaseNotes: 'x' })).rejects.toThrow(BadRequestException);
    });
  });

  // ── Dashboard ─────────────────────────────────────────────────────────────
  describe('getLotSerialDashboard', () => {
    it('returns combined dashboard metrics', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.batch.count).mockResolvedValue(5);
      vi.mocked(prisma.serialNumber.count).mockResolvedValue(10);
      vi.mocked(prisma.pickSuggestion.count).mockResolvedValue(3);
      vi.mocked(prisma.expiryAlert.count).mockResolvedValue(2);
      vi.mocked(prisma.quarantineOrder.count).mockResolvedValue(1);
      const result = await svc.getLotSerialDashboard(TENANT);
      expect(result.batches).toBeDefined();
      expect(result.serials).toBeDefined();
      expect(result.picks).toBeDefined();
    });
  });

  describe('getExpiryReport', () => {
    it('returns expiry bucketing counts', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.batch.count)
        .mockResolvedValueOnce(2)   // expired
        .mockResolvedValueOnce(1)   // in7
        .mockResolvedValueOnce(3)   // in30
        .mockResolvedValueOnce(5);  // in90
      const result = await svc.getExpiryReport(TENANT);
      expect(result.expired).toBe(2);
      expect(result.expiringIn7).toBe(1);
      expect(result.expiringIn30).toBe(3);
    });
  });
});
