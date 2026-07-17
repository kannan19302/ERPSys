import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { StockTakeService } from '../stock-take.service';

vi.mock('@unerp/database', () => ({
  prisma: {
    stockTake: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    countSheet: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    countSheetItem: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    stockTakeVariance: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

const TENANT = 't1';
const USER = 'u1';

const mockSt = (o: Record<string, unknown> = {}) => ({
  id: 'st1', tenantId: TENANT, stockTakeNumber: 'ST-00001',
  warehouseId: 'wh1', status: 'DRAFT', countType: 'FULL',
  countDate: new Date(), sheets: [], variances: [],
  createdBy: USER, ...o,
});

const mockSheet = (o: Record<string, unknown> = {}) => ({
  id: 'sh1', tenantId: TENANT, stockTakeId: 'st1',
  sheetNumber: 'ST-00001-001', warehouseId: 'wh1',
  status: 'PENDING', items: [], ...o,
});

const mockItem = (o: Record<string, unknown> = {}) => ({
  id: 'item1', tenantId: TENANT, sheetId: 'sh1',
  productId: 'prod1', systemQty: { equals: (x: unknown) => String(x) === '0', minus: (x: unknown) => ({ equals: (y: unknown) => false, div: () => ({ times: () => ({}) }), times: () => ({}) }), toString: () => '100' },
  countedQty: null, uom: 'UNIT', unitCost: null,
  ...o,
});

const mockVariance = (o: Record<string, unknown> = {}) => ({
  id: 'var1', tenantId: TENANT, stockTakeId: 'st1',
  productId: 'prod1', warehouseId: 'wh1',
  systemQty: '100', countedQty: '95', varianceQty: '-5', variancePct: '-5',
  status: 'PENDING', ...o,
});

describe('StockTakeService', () => {
  let svc: StockTakeService;

  beforeEach(() => {
    vi.clearAllMocks();
    svc = new StockTakeService();
  });

  describe('listStockTakes', () => {
    it('returns stock takes for tenant', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.stockTake.findMany).mockResolvedValue([mockSt()] as never);
      const result = await svc.listStockTakes(TENANT);
      expect(result).toHaveLength(1);
    });

    it('filters by status', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.stockTake.findMany).mockResolvedValue([] as never);
      await svc.listStockTakes(TENANT, undefined, 'POSTED');
      expect(prisma.stockTake.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ status: 'POSTED' }) }),
      );
    });
  });

  describe('getStockTake', () => {
    it('returns stock take when found', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.stockTake.findFirst).mockResolvedValue(mockSt() as never);
      const result = await svc.getStockTake(TENANT, 'st1');
      expect(result.id).toBe('st1');
    });

    it('throws NotFoundException when not found', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.stockTake.findFirst).mockResolvedValue(null as never);
      await expect(svc.getStockTake(TENANT, 'bad')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createStockTake', () => {
    it('creates with auto-number', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.stockTake.count).mockResolvedValue(0 as never);
      vi.mocked(prisma.stockTake.create).mockResolvedValue(mockSt() as never);
      await svc.createStockTake(TENANT, USER, { warehouseId: 'wh1', countDate: '2026-07-20' });
      expect(prisma.stockTake.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ stockTakeNumber: 'ST-00001' }) }),
      );
    });
  });

  describe('startStockTake', () => {
    it('starts a DRAFT stock take with sheets', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.stockTake.findFirst).mockResolvedValue(mockSt({ sheets: [mockSheet()] }) as never);
      vi.mocked(prisma.stockTake.update).mockResolvedValue(mockSt({ status: 'IN_PROGRESS' }) as never);
      const result = await svc.startStockTake(TENANT, 'st1');
      expect(result.status).toBe('IN_PROGRESS');
    });

    it('throws if no sheets', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.stockTake.findFirst).mockResolvedValue(mockSt({ sheets: [] }) as never);
      await expect(svc.startStockTake(TENANT, 'st1')).rejects.toThrow(BadRequestException);
    });

    it('throws if not DRAFT', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.stockTake.findFirst).mockResolvedValue(mockSt({ status: 'POSTED' }) as never);
      await expect(svc.startStockTake(TENANT, 'st1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('cancelStockTake', () => {
    it('cancels non-terminal stock take', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.stockTake.findFirst).mockResolvedValue(mockSt({ sheets: [] }) as never);
      vi.mocked(prisma.stockTake.update).mockResolvedValue(mockSt({ status: 'CANCELLED' }) as never);
      const result = await svc.cancelStockTake(TENANT, 'st1');
      expect(result.status).toBe('CANCELLED');
    });

    it('throws if already posted', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.stockTake.findFirst).mockResolvedValue(mockSt({ status: 'POSTED', sheets: [] }) as never);
      await expect(svc.cancelStockTake(TENANT, 'st1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('createCountSheet', () => {
    it('creates a sheet with auto-number', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.stockTake.findFirst).mockResolvedValue(mockSt({ sheets: [] }) as never);
      vi.mocked(prisma.countSheet.count).mockResolvedValue(0 as never);
      vi.mocked(prisma.countSheet.create).mockResolvedValue(mockSheet() as never);
      const result = await svc.createCountSheet(TENANT, 'st1', { zone: 'A' });
      expect(prisma.countSheet.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ sheetNumber: 'ST-00001-001' }) }),
      );
      expect(result.id).toBe('sh1');
    });

    it('throws if stock take is not DRAFT or IN_PROGRESS', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.stockTake.findFirst).mockResolvedValue(mockSt({ status: 'POSTED', sheets: [] }) as never);
      await expect(svc.createCountSheet(TENANT, 'st1', {})).rejects.toThrow(BadRequestException);
    });
  });

  describe('approveVariance', () => {
    it('approves a PENDING variance', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.stockTakeVariance.findFirst).mockResolvedValue(mockVariance() as never);
      vi.mocked(prisma.stockTakeVariance.update).mockResolvedValue(mockVariance({ status: 'APPROVED' }) as never);
      const result = await svc.approveVariance(TENANT, 'var1', USER);
      expect(result.status).toBe('APPROVED');
    });

    it('throws if not PENDING', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.stockTakeVariance.findFirst).mockResolvedValue(mockVariance({ status: 'APPROVED' }) as never);
      await expect(svc.approveVariance(TENANT, 'var1', USER)).rejects.toThrow(BadRequestException);
    });

    it('throws if not found', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.stockTakeVariance.findFirst).mockResolvedValue(null as never);
      await expect(svc.approveVariance(TENANT, 'bad', USER)).rejects.toThrow(NotFoundException);
    });
  });

  describe('rejectVariance', () => {
    it('rejects a PENDING variance', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.stockTakeVariance.findFirst).mockResolvedValue(mockVariance() as never);
      vi.mocked(prisma.stockTakeVariance.update).mockResolvedValue(mockVariance({ status: 'REJECTED' }) as never);
      const result = await svc.rejectVariance(TENANT, 'var1', 'Recount mismatch');
      expect(result.status).toBe('REJECTED');
    });
  });

  describe('approveStockTake', () => {
    it('approves when no pending variances remain', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.stockTake.findFirst).mockResolvedValue(mockSt({ status: 'VARIANCE_REVIEW', sheets: [] }) as never);
      vi.mocked(prisma.stockTakeVariance.count).mockResolvedValue(0 as never);
      vi.mocked(prisma.stockTake.update).mockResolvedValue(mockSt({ status: 'APPROVED' }) as never);
      const result = await svc.approveStockTake(TENANT, 'st1', USER);
      expect(result.status).toBe('APPROVED');
    });

    it('throws if pending variances remain', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.stockTake.findFirst).mockResolvedValue(mockSt({ status: 'VARIANCE_REVIEW', sheets: [] }) as never);
      vi.mocked(prisma.stockTakeVariance.count).mockResolvedValue(3 as never);
      await expect(svc.approveStockTake(TENANT, 'st1', USER)).rejects.toThrow(BadRequestException);
    });

    it('throws if not VARIANCE_REVIEW', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.stockTake.findFirst).mockResolvedValue(mockSt({ status: 'DRAFT', sheets: [] }) as never);
      await expect(svc.approveStockTake(TENANT, 'st1', USER)).rejects.toThrow(BadRequestException);
    });
  });

  describe('postStockTake', () => {
    it('posts an APPROVED stock take', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.stockTake.findFirst).mockResolvedValue(mockSt({ status: 'APPROVED', sheets: [] }) as never);
      vi.mocked(prisma.stockTakeVariance.findMany).mockResolvedValue([mockVariance({ status: 'APPROVED' })] as never);
      vi.mocked(prisma.stockTakeVariance.update).mockResolvedValue(mockVariance() as never);
      vi.mocked(prisma.stockTake.update).mockResolvedValue(mockSt({ status: 'POSTED' }) as never);
      const result = await svc.postStockTake(TENANT, 'st1', USER);
      expect(result.postedVariances).toBe(1);
    });

    it('throws if not APPROVED', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.stockTake.findFirst).mockResolvedValue(mockSt({ status: 'DRAFT', sheets: [] }) as never);
      await expect(svc.postStockTake(TENANT, 'st1', USER)).rejects.toThrow(BadRequestException);
    });
  });

  describe('getDashboard', () => {
    it('returns all status counts and variance metrics', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.stockTake.count).mockResolvedValue(10 as never);
      vi.mocked(prisma.stockTakeVariance.count).mockResolvedValue(5 as never);
      const result = await svc.getDashboard(TENANT);
      expect(result.total).toBe(10);
      expect(result.variances.pending).toBe(5);
    });
  });

  describe('listVariances', () => {
    it('returns variances for a stock take', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.stockTake.findFirst).mockResolvedValue(mockSt({ sheets: [] }) as never);
      vi.mocked(prisma.stockTakeVariance.findMany).mockResolvedValue([mockVariance()] as never);
      const result = await svc.listVariances(TENANT, 'st1');
      expect(result).toHaveLength(1);
    });
  });

  describe('getAccuracyReport', () => {
    it('returns accuracy metrics for posted stock takes', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.stockTake.findMany).mockResolvedValue([
        mockSt({ status: 'POSTED', sheets: [], variances: [
          { ...mockVariance(), varianceQty: { equals: () => false } },
          { ...mockVariance(), varianceQty: { equals: () => true } },
        ] }),
      ] as never);
      const result = await svc.getAccuracyReport(TENANT);
      expect(result).toHaveLength(1);
      expect(result[0].accuracyRate).toBe(50);
    });
  });
});
