import { Test } from '@nestjs/testing';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { WarehouseOpsService } from '../warehouse-ops.service';
import { PrismaService } from '@unerp/database';

vi.mock('@unerp/database', () => ({
  PrismaService: vi.fn(),
  prisma: {
    warehouseTask: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      groupBy: vi.fn(),
      count: vi.fn(),
    },
    binTransferRequest: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    goodsReceiptNote: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
    },
    grnLineItem: {
      update: vi.fn(),
    },
    packingSession: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    packingCarton: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
      aggregate: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

const TENANT = 'tenant-wh-1';
const USER = 'user-1';

describe('WarehouseOpsService', () => {
  let svc: WarehouseOpsService;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await Test.createTestingModule({ providers: [WarehouseOpsService] }).compile();
    svc = mod.get(WarehouseOpsService);
  });

  // ── Tasks ─────────────────────────────────────────────────────────────────
  describe('listTasks', () => {
    it('returns tasks with filters', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.warehouseTask.findMany).mockResolvedValue([{ id: 't1' }] as any);
      const result = await svc.listTasks(TENANT, { status: 'QUEUED' });
      expect(result).toHaveLength(1);
      expect(vi.mocked(prisma.warehouseTask.findMany)).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ tenantId: TENANT, status: 'QUEUED' }) }),
      );
    });
  });

  describe('createTask', () => {
    it('creates a task and generates a task number', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.warehouseTask.count).mockResolvedValue(5);
      vi.mocked(prisma.warehouseTask.create).mockResolvedValue({ id: 't1', taskNumber: 'WH-0006' } as any);
      const result = await svc.createTask(TENANT, {
        taskType: 'PICK', priority: 50, warehouseId: 'wh1',
      });
      expect(result.taskNumber).toBe('WH-0006');
    });
  });

  describe('assignTask', () => {
    it('assigns a QUEUED task to a worker', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.warehouseTask.findFirst).mockResolvedValue({ id: 't1', status: 'QUEUED' } as any);
      vi.mocked(prisma.warehouseTask.update).mockResolvedValue({ id: 't1', status: 'ASSIGNED' } as any);
      const result = await svc.assignTask(TENANT, 't1', 'worker-1');
      expect(result.status).toBe('ASSIGNED');
    });

    it('throws if task not found', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.warehouseTask.findFirst).mockResolvedValue(null);
      await expect(svc.assignTask(TENANT, 't1', 'w1')).rejects.toThrow(NotFoundException);
    });

    it('throws if task is not QUEUED or ASSIGNED', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.warehouseTask.findFirst).mockResolvedValue({ id: 't1', status: 'COMPLETE' } as any);
      await expect(svc.assignTask(TENANT, 't1', 'w1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('startTask', () => {
    it('starts an ASSIGNED task', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.warehouseTask.findFirst).mockResolvedValue({ id: 't1', status: 'ASSIGNED' } as any);
      vi.mocked(prisma.warehouseTask.update).mockResolvedValue({ id: 't1', status: 'IN_PROGRESS' } as any);
      const result = await svc.startTask(TENANT, 't1');
      expect(result.status).toBe('IN_PROGRESS');
    });

    it('throws if task is not ASSIGNED', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.warehouseTask.findFirst).mockResolvedValue({ id: 't1', status: 'QUEUED' } as any);
      await expect(svc.startTask(TENANT, 't1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('completeTask', () => {
    it('completes an IN_PROGRESS task', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.warehouseTask.findFirst).mockResolvedValue({ id: 't1', status: 'IN_PROGRESS' } as any);
      vi.mocked(prisma.warehouseTask.update).mockResolvedValue({ id: 't1', status: 'COMPLETE' } as any);
      const result = await svc.completeTask(TENANT, 't1');
      expect(result.status).toBe('COMPLETE');
    });
  });

  describe('getTaskDashboard', () => {
    it('returns task counts by status and type', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.warehouseTask.count)
        .mockResolvedValueOnce(3)   // queued
        .mockResolvedValueOnce(1)   // assigned
        .mockResolvedValueOnce(2)   // in_progress
        .mockResolvedValueOnce(10); // complete
      vi.mocked(prisma.warehouseTask.groupBy).mockResolvedValue([
        { taskType: 'PICK', _count: { id: 5 } },
      ] as any);
      const result = await svc.getTaskDashboard(TENANT);
      expect(result.queued).toBe(3);
      expect(result.inProgress).toBe(2);
    });
  });

  // ── Bin Transfers ─────────────────────────────────────────────────────────
  describe('createBinTransfer', () => {
    it('creates a bin transfer request', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.binTransferRequest.count).mockResolvedValue(0);
      vi.mocked(prisma.binTransferRequest.create).mockResolvedValue({ id: 'bt1', status: 'PENDING' } as any);
      const result = await svc.createBinTransfer(TENANT, {
        productId: 'p1', fromBin: 'A-01-01', toBin: 'B-01-01', qty: 10, uom: 'EA',
      });
      expect(result.status).toBe('PENDING');
    });

    it('throws if fromBin equals toBin', async () => {
      await expect(svc.createBinTransfer(TENANT, {
        productId: 'p1', fromBin: 'A-01', toBin: 'A-01', qty: 5, uom: 'EA',
      })).rejects.toThrow(BadRequestException);
    });
  });

  describe('approveBinTransfer', () => {
    it('approves a PENDING transfer', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.binTransferRequest.findFirst).mockResolvedValue({ id: 'bt1', status: 'PENDING' } as any);
      vi.mocked(prisma.binTransferRequest.update).mockResolvedValue({ id: 'bt1', status: 'APPROVED' } as any);
      const result = await svc.approveBinTransfer(TENANT, 'bt1', USER);
      expect(result.status).toBe('APPROVED');
    });

    it('throws if transfer is not PENDING', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.binTransferRequest.findFirst).mockResolvedValue({ id: 'bt1', status: 'COMPLETE' } as any);
      await expect(svc.approveBinTransfer(TENANT, 'bt1', USER)).rejects.toThrow(BadRequestException);
    });
  });

  describe('rejectBinTransfer', () => {
    it('rejects a PENDING transfer', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.binTransferRequest.findFirst).mockResolvedValue({ id: 'bt1', status: 'PENDING' } as any);
      vi.mocked(prisma.binTransferRequest.update).mockResolvedValue({ id: 'bt1', status: 'REJECTED' } as any);
      const result = await svc.rejectBinTransfer(TENANT, 'bt1', 'Wrong bin');
      expect(result.status).toBe('REJECTED');
    });
  });

  // ── GRN ──────────────────────────────────────────────────────────────────
  describe('createGrn', () => {
    it('creates a GRN with auto-generated number and line items', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.goodsReceiptNote.count).mockResolvedValue(2);
      vi.mocked(prisma.goodsReceiptNote.create).mockResolvedValue({
        id: 'grn1', grnNumber: 'GRN-00003', status: 'DRAFT',
      } as any);
      const result = await svc.createGrn(TENANT, {
        warehouseId: 'wh1',
        receivedDate: new Date().toISOString(),
        lineItems: [{ productId: 'p1', orderedQty: 100, receivedQty: 95, uom: 'EA' }],
      });
      expect(result.grnNumber).toBe('GRN-00003');
    });
  });

  describe('verifyGrn', () => {
    it('verifies a DRAFT GRN and updates line items', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.goodsReceiptNote.findFirst).mockResolvedValue({
        id: 'grn1', status: 'DRAFT', lineItems: [{ id: 'li1' }],
      } as any);
      vi.mocked(prisma.$transaction).mockResolvedValue({ id: 'grn1', status: 'VERIFIED' } as any);
      const result = await svc.verifyGrn(TENANT, 'grn1', {
        lineItems: [{ lineItemId: 'li1', acceptedQty: 90, rejectedQty: 5 }],
      });
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('throws if GRN is not in DRAFT status', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.goodsReceiptNote.findFirst).mockResolvedValue({ id: 'grn1', status: 'COMPLETE' } as any);
      await expect(svc.verifyGrn(TENANT, 'grn1', { lineItems: [] })).rejects.toThrow(BadRequestException);
    });
  });

  describe('getGrnDashboard', () => {
    it('returns GRN counts by status', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.goodsReceiptNote.count)
        .mockResolvedValueOnce(4)   // draft
        .mockResolvedValueOnce(2)   // verified
        .mockResolvedValueOnce(1)   // quality_check
        .mockResolvedValueOnce(10)  // complete
        .mockResolvedValueOnce(0);  // rejected
      const result = await svc.getGrnDashboard(TENANT);
      expect(result.draft).toBe(4);
      expect(result.complete).toBe(10);
    });
  });

  // ── Packing ───────────────────────────────────────────────────────────────
  describe('createPackingSession', () => {
    it('creates a packing session', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.packingSession.count).mockResolvedValue(0);
      vi.mocked(prisma.packingSession.create).mockResolvedValue({ id: 'ps1', status: 'OPEN', totalCartons: 0 } as any);
      const result = await svc.createPackingSession(TENANT, { workerId: 'w1' });
      expect(result.status).toBe('OPEN');
    });
  });

  describe('addCarton', () => {
    it('adds a carton to an OPEN packing session', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.packingSession.findFirst).mockResolvedValue({ id: 'ps1', status: 'OPEN' } as any);
      vi.mocked(prisma.$transaction).mockResolvedValue([{ id: 'c1', cartonNumber: 'CTN-001' }, {}] as any);
      const result = await svc.addCarton(TENANT, 'ps1', { weight: 5.2 });
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('throws if session is not OPEN', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.packingSession.findFirst).mockResolvedValue({ id: 'ps1', status: 'COMPLETE' } as any);
      await expect(svc.addCarton(TENANT, 'ps1', {})).rejects.toThrow(BadRequestException);
    });
  });

  describe('completePackingSession', () => {
    it('completes a packing session and sums weight', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.packingSession.findFirst).mockResolvedValue({ id: 'ps1', status: 'OPEN', cartons: [{ weight: 5.5 }, { weight: 7.0 }] } as any);
      vi.mocked(prisma.packingSession.update).mockResolvedValue({ id: 'ps1', status: 'COMPLETE', totalWeight: 12.5 } as any);
      const result = await svc.completePackingSession(TENANT, 'ps1');
      expect(result.status).toBe('COMPLETE');
    });
  });

  describe('sealCarton', () => {
    it('seals an unsealed carton', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.packingSession.findFirst).mockResolvedValue({ id: 'ps1', status: 'OPEN' } as any);
      vi.mocked(prisma.packingCarton.findFirst).mockResolvedValue({ id: 'c1', sealedAt: null } as any);
      vi.mocked(prisma.packingCarton.update).mockResolvedValue({ id: 'c1', sealedAt: new Date() } as any);
      const result = await svc.sealCarton(TENANT, 'ps1', 'c1');
      expect(vi.mocked(prisma.packingCarton.update)).toHaveBeenCalled();
    });
  });

  describe('getWarehouseOpsDashboard', () => {
    it('returns combined dashboard metrics', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.binTransferRequest.count).mockResolvedValue(3);
      vi.mocked(prisma.packingSession.count).mockResolvedValue(2);
      vi.mocked(prisma.warehouseTask.count).mockResolvedValue(10);
      vi.mocked(prisma.goodsReceiptNote.count).mockResolvedValue(5);
      const result = await svc.getWarehouseOpsDashboard(TENANT);
      expect(result).toBeDefined();
    });
  });
});
