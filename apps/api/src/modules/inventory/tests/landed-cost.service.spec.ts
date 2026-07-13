import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { LandedCostService } from '../landed-cost.service';

vi.mock('@unerp/database', () => ({
  prisma: {
    landedCostVoucher: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      aggregate: vi.fn(),
    },
    landedCostChargeLine: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      aggregate: vi.fn(),
    },
    landedCostReceiptLink: {
      findMany: vi.fn(),
      create: vi.fn(),
      deleteMany: vi.fn(),
    },
    landedCostAllocation: {
      findMany: vi.fn(),
      createMany: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

const TENANT = 'tenant-1';
const USER = 'user-1';

const mockVoucher = (overrides = {}) => ({
  id: 'v1',
  tenantId: TENANT,
  voucherNumber: 'LCV-00001',
  status: 'DRAFT',
  allocationMethod: 'VALUE',
  totalAmount: '0',
  currency: 'USD',
  chargeLines: [],
  receiptLinks: [],
  allocations: [],
  ...overrides,
});

describe('LandedCostService', () => {
  let svc: LandedCostService;

  beforeEach(async () => {
    vi.clearAllMocks();
    svc = new LandedCostService();
  });

  describe('listVouchers', () => {
    it('returns vouchers for tenant', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.landedCostVoucher.findMany).mockResolvedValue([mockVoucher()] as never);
      const result = await svc.listVouchers(TENANT);
      expect(result).toHaveLength(1);
      expect(prisma.landedCostVoucher.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { tenantId: TENANT } }));
    });

    it('filters by status', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.landedCostVoucher.findMany).mockResolvedValue([] as never);
      await svc.listVouchers(TENANT, 'DRAFT');
      expect(prisma.landedCostVoucher.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { tenantId: TENANT, status: 'DRAFT' } }),
      );
    });
  });

  describe('getVoucher', () => {
    it('returns voucher when found', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.landedCostVoucher.findFirst).mockResolvedValue(mockVoucher() as never);
      const result = await svc.getVoucher(TENANT, 'v1');
      expect(result.id).toBe('v1');
    });

    it('throws NotFoundException when not found', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.landedCostVoucher.findFirst).mockResolvedValue(null as never);
      await expect(svc.getVoucher(TENANT, 'missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createVoucher', () => {
    it('creates voucher with generated number', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.landedCostVoucher.count).mockResolvedValue(0 as never);
      vi.mocked(prisma.landedCostVoucher.create).mockResolvedValue(mockVoucher() as never);
      await svc.createVoucher(TENANT, USER, { allocationMethod: 'VALUE' });
      expect(prisma.landedCostVoucher.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ voucherNumber: 'LCV-00001' }) }),
      );
    });
  });

  describe('submitVoucher', () => {
    it('transitions DRAFT to SUBMITTED', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.landedCostVoucher.findFirst).mockResolvedValue(mockVoucher({ chargeLines: [{ id: 'cl1' }] }) as never);
      vi.mocked(prisma.landedCostVoucher.update).mockResolvedValue(mockVoucher({ status: 'SUBMITTED' }) as never);
      const result = await svc.submitVoucher(TENANT, 'v1');
      expect(result.status).toBe('SUBMITTED');
    });

    it('throws if no charge lines', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.landedCostVoucher.findFirst).mockResolvedValue(mockVoucher({ chargeLines: [] }) as never);
      await expect(svc.submitVoucher(TENANT, 'v1')).rejects.toThrow(BadRequestException);
    });

    it('throws if not DRAFT', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.landedCostVoucher.findFirst).mockResolvedValue(mockVoucher({ status: 'ALLOCATED' }) as never);
      await expect(svc.submitVoucher(TENANT, 'v1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('cancelVoucher', () => {
    it('cancels SUBMITTED voucher', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.landedCostVoucher.findFirst).mockResolvedValue(mockVoucher({ status: 'SUBMITTED' }) as never);
      vi.mocked(prisma.landedCostVoucher.update).mockResolvedValue(mockVoucher({ status: 'CANCELLED' }) as never);
      await svc.cancelVoucher(TENANT, 'v1');
      expect(prisma.landedCostVoucher.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'CANCELLED' } }),
      );
    });

    it('throws if ALLOCATED', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.landedCostVoucher.findFirst).mockResolvedValue(mockVoucher({ status: 'ALLOCATED' }) as never);
      await expect(svc.cancelVoucher(TENANT, 'v1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('deleteVoucher', () => {
    it('deletes DRAFT voucher', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.landedCostVoucher.findFirst).mockResolvedValue(mockVoucher() as never);
      vi.mocked(prisma.landedCostVoucher.delete).mockResolvedValue(mockVoucher() as never);
      const result = await svc.deleteVoucher(TENANT, 'v1');
      expect(result.deleted).toBe(true);
    });

    it('throws if not DRAFT', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.landedCostVoucher.findFirst).mockResolvedValue(mockVoucher({ status: 'SUBMITTED' }) as never);
      await expect(svc.deleteVoucher(TENANT, 'v1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('addChargeLine', () => {
    it('adds line to DRAFT voucher and recalcs total', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.landedCostVoucher.findFirst).mockResolvedValue(mockVoucher() as never);
      vi.mocked(prisma.landedCostChargeLine.create).mockResolvedValue({ id: 'cl1', amount: '500' } as never);
      vi.mocked(prisma.landedCostChargeLine.aggregate).mockResolvedValue({ _sum: { amount: '500' } } as never);
      vi.mocked(prisma.landedCostVoucher.update).mockResolvedValue(mockVoucher() as never);
      const result = await svc.addChargeLine(TENANT, 'v1', { chargeType: 'FREIGHT', amount: 500 });
      expect(result.id).toBe('cl1');
      expect(prisma.landedCostChargeLine.create).toHaveBeenCalled();
    });

    it('throws if voucher not DRAFT', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.landedCostVoucher.findFirst).mockResolvedValue(mockVoucher({ status: 'SUBMITTED' }) as never);
      await expect(svc.addChargeLine(TENANT, 'v1', { chargeType: 'FREIGHT', amount: 100 })).rejects.toThrow(BadRequestException);
    });
  });

  describe('removeChargeLine', () => {
    it('removes charge line from DRAFT', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.landedCostVoucher.findFirst).mockResolvedValue(mockVoucher() as never);
      vi.mocked(prisma.landedCostChargeLine.delete).mockResolvedValue({} as never);
      vi.mocked(prisma.landedCostChargeLine.aggregate).mockResolvedValue({ _sum: { amount: '0' } } as never);
      vi.mocked(prisma.landedCostVoucher.update).mockResolvedValue(mockVoucher() as never);
      const result = await svc.removeChargeLine(TENANT, 'v1', 'cl1');
      expect(result.deleted).toBe(true);
    });
  });

  describe('linkReceipt', () => {
    it('links a receipt to DRAFT voucher', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.landedCostVoucher.findFirst).mockResolvedValue(mockVoucher() as never);
      vi.mocked(prisma.landedCostReceiptLink.create).mockResolvedValue({ id: 'rl1' } as never);
      const result = await svc.linkReceipt(TENANT, 'v1', { stockEntryId: 'se1', totalQty: 10, totalValue: 1000 });
      expect(result.id).toBe('rl1');
    });

    it('throws if not DRAFT', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.landedCostVoucher.findFirst).mockResolvedValue(mockVoucher({ status: 'SUBMITTED' }) as never);
      await expect(svc.linkReceipt(TENANT, 'v1', { stockEntryId: 'se1', totalQty: 10, totalValue: 1000 })).rejects.toThrow(BadRequestException);
    });
  });

  describe('allocate', () => {
    it('allocates SUBMITTED voucher', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.landedCostVoucher.findFirst).mockResolvedValue(mockVoucher({
        status: 'SUBMITTED',
        chargeLines: [{ id: 'cl1' }],
        receiptLinks: [{ id: 'rl1' }],
      }) as never);
      vi.mocked(prisma.landedCostReceiptLink.findMany).mockResolvedValue([
        { id: 'rl1', stockEntryId: 'se1', totalQty: '10', totalValue: '1000', totalWeight: null, totalVolume: null },
      ] as never);
      vi.mocked(prisma.landedCostChargeLine.findMany).mockResolvedValue([
        { id: 'cl1', chargeType: 'FREIGHT', amount: '500' },
      ] as never);
      vi.mocked(prisma.landedCostAllocation.deleteMany).mockResolvedValue({ count: 0 } as never);
      vi.mocked(prisma.landedCostAllocation.createMany).mockResolvedValue({ count: 1 } as never);
      vi.mocked(prisma.landedCostVoucher.update).mockResolvedValue(mockVoucher({ status: 'ALLOCATED' }) as never);
      const result = await svc.allocate(TENANT, 'v1');
      expect(result.allocated).toBe(1);
    });

    it('throws if not SUBMITTED', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.landedCostVoucher.findFirst).mockResolvedValue(mockVoucher({ status: 'DRAFT' }) as never);
      await expect(svc.allocate(TENANT, 'v1')).rejects.toThrow(BadRequestException);
    });

    it('throws if no receipt links', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.landedCostVoucher.findFirst).mockResolvedValue(mockVoucher({ status: 'SUBMITTED', receiptLinks: [] }) as never);
      await expect(svc.allocate(TENANT, 'v1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('getDashboard', () => {
    it('returns dashboard counts', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.landedCostVoucher.count).mockResolvedValue(5 as never);
      vi.mocked(prisma.landedCostVoucher.aggregate).mockResolvedValue({ _sum: { totalAmount: '12000' } } as never);
      const result = await svc.getDashboard(TENANT);
      expect(result.totalVouchers).toBe(5);
      expect(result.totalAllocatedAmount).toBe(12000);
    });
  });

  describe('getAllocationReport', () => {
    it('returns report with charge type breakdown', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.landedCostAllocation.findMany).mockResolvedValue([
        { id: 'a1', chargeType: 'FREIGHT', allocatedAmount: '300', voucher: {} },
        { id: 'a2', chargeType: 'DUTY', allocatedAmount: '200', voucher: {} },
      ] as never);
      const result = await svc.getAllocationReport(TENANT);
      expect(result.byChargeType['FREIGHT']).toBe(300);
      expect(result.byChargeType['DUTY']).toBe(200);
    });
  });
});
