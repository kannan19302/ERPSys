import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { AslService } from '../asl.service';

vi.mock('@unerp/database', () => ({
  prisma: {
    approvedSupplier: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    supplierPriceTier: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    aslChangeLog: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    vendorItemAttribute: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
    },
    aslComplianceRule: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

const TENANT = 't1';
const USER = 'u1';

const mkAsl = (o: Record<string, unknown> = {}) => ({
  id: 'asl1', tenantId: TENANT, productId: 'prod1', vendorId: 'ven1',
  status: 'PENDING_APPROVAL', isPreferred: false, preferenceRank: 999,
  unitPrice: '10.0000', currency: 'USD', moq: '5.0000', leadTimeDays: 14,
  expiryDate: null, priceTiers: [], changeLog: [], ...o,
});

const mkTier = (o: Record<string, unknown> = {}) => ({
  id: 'tier1', tenantId: TENANT, approvedSupplierId: 'asl1',
  fromQty: '1', toQty: '99', unitPrice: '10.0000',
  effectiveFrom: new Date(), effectiveTo: null, ...o,
});

const mkAttr = (o: Record<string, unknown> = {}) => ({
  id: 'attr1', tenantId: TENANT, productId: 'prod1', vendorId: 'ven1',
  attributeKey: 'COLOR', attributeValue: 'RED', ...o,
});

const mkRule = (o: Record<string, unknown> = {}) => ({
  id: 'rule1', tenantId: TENANT, productCategory: 'CHEMICALS',
  minApprovedVendors: 2, requiresQualification: true,
  qualificationValidityDays: 365, requiresPreferred: false, ...o,
});

describe('AslService', () => {
  let svc: AslService;

  beforeEach(() => {
    vi.clearAllMocks();
    svc = new AslService();
  });

  describe('listApprovedSuppliers', () => {
    it('returns entries for tenant', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.approvedSupplier.findMany).mockResolvedValue([mkAsl()] as never);
      const result = await svc.listApprovedSuppliers(TENANT);
      expect(result).toHaveLength(1);
    });

    it('filters by productId', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.approvedSupplier.findMany).mockResolvedValue([] as never);
      await svc.listApprovedSuppliers(TENANT, 'prod2');
      expect(prisma.approvedSupplier.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ productId: 'prod2' }) }),
      );
    });
  });

  describe('createApprovedSupplier', () => {
    it('creates a new ASL entry', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.approvedSupplier.findFirst).mockResolvedValue(null as never);
      vi.mocked(prisma.approvedSupplier.create).mockResolvedValue(mkAsl() as never);
      vi.mocked(prisma.aslChangeLog.create).mockResolvedValue({} as never);
      await svc.createApprovedSupplier(TENANT, USER, { productId: 'prod1', vendorId: 'ven1' });
      expect(prisma.approvedSupplier.create).toHaveBeenCalled();
    });

    it('throws if vendor already in ASL for product', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.approvedSupplier.findFirst).mockResolvedValue(mkAsl() as never);
      await expect(svc.createApprovedSupplier(TENANT, USER, { productId: 'prod1', vendorId: 'ven1' }))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('approveSupplier', () => {
    it('approves a PENDING_APPROVAL supplier', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.approvedSupplier.findFirst).mockResolvedValue(mkAsl() as never);
      vi.mocked(prisma.aslChangeLog.create).mockResolvedValue({} as never);
      vi.mocked(prisma.approvedSupplier.update).mockResolvedValue(mkAsl({ status: 'APPROVED' }) as never);
      const result = await svc.approveSupplier(TENANT, 'asl1', USER);
      expect(result.status).toBe('APPROVED');
    });

    it('throws if already approved', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.approvedSupplier.findFirst).mockResolvedValue(mkAsl({ status: 'APPROVED' }) as never);
      await expect(svc.approveSupplier(TENANT, 'asl1', USER)).rejects.toThrow(BadRequestException);
    });
  });

  describe('disqualifySupplier', () => {
    it('disqualifies a supplier', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.approvedSupplier.findFirst).mockResolvedValue(mkAsl({ status: 'APPROVED' }) as never);
      vi.mocked(prisma.aslChangeLog.create).mockResolvedValue({} as never);
      vi.mocked(prisma.approvedSupplier.update).mockResolvedValue(mkAsl({ status: 'DISQUALIFIED' }) as never);
      const result = await svc.disqualifySupplier(TENANT, 'asl1', USER, 'Failed audit');
      expect(result.status).toBe('DISQUALIFIED');
    });

    it('throws if already disqualified', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.approvedSupplier.findFirst).mockResolvedValue(mkAsl({ status: 'DISQUALIFIED' }) as never);
      await expect(svc.disqualifySupplier(TENANT, 'asl1', USER, 'x')).rejects.toThrow(BadRequestException);
    });
  });

  describe('setPreferred', () => {
    it('sets an APPROVED supplier as preferred', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.approvedSupplier.findFirst).mockResolvedValue(mkAsl({ status: 'APPROVED' }) as never);
      vi.mocked(prisma.aslChangeLog.create).mockResolvedValue({} as never);
      vi.mocked(prisma.approvedSupplier.update).mockResolvedValue(mkAsl({ isPreferred: true, preferenceRank: 1 }) as never);
      const result = await svc.setPreferred(TENANT, 'asl1', USER, 1);
      expect(result.isPreferred).toBe(true);
    });

    it('throws if not APPROVED', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.approvedSupplier.findFirst).mockResolvedValue(mkAsl() as never);
      await expect(svc.setPreferred(TENANT, 'asl1', USER)).rejects.toThrow(BadRequestException);
    });
  });

  describe('addPriceTier', () => {
    it('creates a price tier', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.approvedSupplier.findFirst).mockResolvedValue(mkAsl({ status: 'APPROVED' }) as never);
      vi.mocked(prisma.supplierPriceTier.create).mockResolvedValue(mkTier() as never);
      await svc.addPriceTier(TENANT, 'asl1', {
        fromQty: 1, unitPrice: 10, effectiveFrom: '2026-07-01',
      });
      expect(prisma.supplierPriceTier.create).toHaveBeenCalled();
    });
  });

  describe('getEffectivePrice', () => {
    it('returns tier price for matching qty', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.supplierPriceTier.findMany).mockResolvedValue([
        mkTier({ fromQty: '1', toQty: '100', unitPrice: '9.5000' }),
      ] as never);
      vi.mocked(prisma.approvedSupplier.findFirst).mockResolvedValue(mkAsl({ status: 'APPROVED' }) as never);
      const result = await svc.getEffectivePrice(TENANT, 'asl1', 50);
      expect(result.effectivePrice).toBe(9.5);
    });

    it('falls back to base price when no tier matches', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.supplierPriceTier.findMany).mockResolvedValue([] as never);
      vi.mocked(prisma.approvedSupplier.findFirst).mockResolvedValue(mkAsl({ status: 'APPROVED' }) as never);
      const result = await svc.getEffectivePrice(TENANT, 'asl1', 1);
      expect(result.effectivePrice).toBe(10);
    });
  });

  describe('upsertAttribute', () => {
    it('upserts a vendor item attribute', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.vendorItemAttribute.upsert).mockResolvedValue(mkAttr() as never);
      await svc.upsertAttribute(TENANT, { productId: 'prod1', vendorId: 'ven1', attributeKey: 'COLOR', attributeValue: 'RED' });
      expect(prisma.vendorItemAttribute.upsert).toHaveBeenCalled();
    });
  });

  describe('upsertComplianceRule', () => {
    it('creates or updates compliance rule', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.aslComplianceRule.upsert).mockResolvedValue(mkRule() as never);
      const result = await svc.upsertComplianceRule(TENANT, { productCategory: 'CHEMICALS', minApprovedVendors: 2 });
      expect(result.minApprovedVendors).toBe(2);
    });
  });

  describe('checkProductCompliance', () => {
    it('marks compliant when requirements are met', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.approvedSupplier.count)
        .mockResolvedValueOnce(2 as never)  // approved
        .mockResolvedValueOnce(1 as never)  // preferred
        .mockResolvedValueOnce(0 as never); // expired
      vi.mocked(prisma.aslComplianceRule.findFirst).mockResolvedValue(
        mkRule({ minApprovedVendors: 2, requiresPreferred: true }) as never,
      );
      const result = await svc.checkProductCompliance(TENANT, 'prod1', 'CHEMICALS');
      expect(result.compliant).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('flags non-compliance when below min vendors', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.approvedSupplier.count)
        .mockResolvedValueOnce(1 as never)
        .mockResolvedValueOnce(1 as never)
        .mockResolvedValueOnce(0 as never);
      vi.mocked(prisma.aslComplianceRule.findFirst).mockResolvedValue(
        mkRule({ minApprovedVendors: 3, requiresPreferred: false }) as never,
      );
      const result = await svc.checkProductCompliance(TENANT, 'prod1', 'CHEMICALS');
      expect(result.compliant).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
    });
  });

  describe('getDashboard', () => {
    it('returns aggregated counts', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.approvedSupplier.count).mockResolvedValue(5 as never);
      const result = await svc.getDashboard(TENANT);
      expect(result.total).toBe(5);
    });
  });

  describe('getVendorSourcingReport', () => {
    it('returns sourcing summary for a product', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.approvedSupplier.findMany).mockResolvedValue([
        mkAsl({ status: 'APPROVED', unitPrice: '8.0000', leadTimeDays: 7, priceTiers: [] }),
        mkAsl({ id: 'asl2', vendorId: 'ven2', status: 'APPROVED', unitPrice: '9.5000', leadTimeDays: 14, priceTiers: [] }),
      ] as never);
      const result = await svc.getVendorSourcingReport(TENANT, 'prod1');
      expect(result.supplierCount).toBe(2);
      expect(result.lowestPrice).toBe(8);
      expect(result.shortestLeadTime).toBe(7);
    });
  });

  describe('getExpiringSuppliers', () => {
    it('returns expiring suppliers', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.approvedSupplier.findMany).mockResolvedValue([mkAsl({ status: 'APPROVED' })] as never);
      const result = await svc.getExpiringSuppliers(TENANT, 30);
      expect(result).toHaveLength(1);
    });
  });

  describe('getChangeLog', () => {
    it('returns change log for an ASL entry', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.approvedSupplier.findFirst).mockResolvedValue(mkAsl() as never);
      vi.mocked(prisma.aslChangeLog.findMany).mockResolvedValue([{ id: 'log1', changeType: 'APPROVED' }] as never);
      const result = await svc.getChangeLog(TENANT, 'asl1');
      expect(result).toHaveLength(1);
    });
  });

  describe('getApprovedSupplier - not found', () => {
    it('throws NotFoundException', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.approvedSupplier.findFirst).mockResolvedValue(null as never);
      await expect(svc.getApprovedSupplier(TENANT, 'bad')).rejects.toThrow(NotFoundException);
    });
  });
});
