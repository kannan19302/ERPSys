import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { HazmatService } from '../hazmat.service';

vi.mock('@unerp/database', () => ({
  prisma: {
    hazmatClassification: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    safetyDataSheet: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    hazmatStorageRule: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      upsert: vi.fn(),
    },
    hazmatManifest: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    hazmatManifestLine: {
      findMany: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    hazmatIncident: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
  },
}));

const TENANT = 't1';
const USER = 'u1';

const mkClass = (o: Record<string, unknown> = {}) => ({
  id: 'cls1', tenantId: TENANT, productId: 'prod1',
  unNumber: 'UN1234', properShippingName: 'Flammable liquid, n.o.s.',
  hazardClass: 'CLASS_3_FLAMMABLE_LIQUIDS', subsidiaryHazards: [],
  packingGroup: 'II', regulation: 'ADR', sdsRecords: [], manifests: [], ...o,
});

const mkSds = (o: Record<string, unknown> = {}) => ({
  id: 'sds1', tenantId: TENANT, classificationId: 'cls1', productId: 'prod1',
  sdsNumber: 'SDS-00001', revision: '1.0', issueDate: new Date(),
  supplier: 'Acme Chemicals', language: 'EN', status: 'CURRENT',
  acknowledgedBy: null, acknowledgedAt: null, classification: mkClass(), ...o,
});

const mkManifest = (o: Record<string, unknown> = {}) => ({
  id: 'mf1', tenantId: TENANT, manifestNumber: 'HMF-000001', regulation: 'ADR',
  originAddress: '1 Warehouse Rd', destAddress: '5 Depot Ave',
  status: 'DRAFT', lines: [], createdBy: USER, ...o,
});

const mkIncident = (o: Record<string, unknown> = {}) => ({
  id: 'inc1', tenantId: TENANT, incidentNumber: 'HMI-00001',
  productId: 'prod1', incidentDate: new Date(),
  severity: 'MEDIUM', description: 'Spill detected', reportedBy: USER,
  closedAt: null, closedBy: null, ...o,
});

describe('HazmatService', () => {
  let svc: HazmatService;

  beforeEach(() => {
    vi.clearAllMocks();
    svc = new HazmatService();
  });

  describe('listClassifications', () => {
    it('returns classifications for tenant', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.hazmatClassification.findMany).mockResolvedValue([mkClass()] as never);
      const result = await svc.listClassifications(TENANT);
      expect(result).toHaveLength(1);
    });

    it('filters by productId', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.hazmatClassification.findMany).mockResolvedValue([] as never);
      await svc.listClassifications(TENANT, 'prod2');
      expect(prisma.hazmatClassification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ productId: 'prod2' }) }),
      );
    });
  });

  describe('getClassification', () => {
    it('returns classification when found', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.hazmatClassification.findFirst).mockResolvedValue(mkClass() as never);
      const result = await svc.getClassification(TENANT, 'cls1');
      expect(result.unNumber).toBe('UN1234');
    });

    it('throws NotFoundException when not found', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.hazmatClassification.findFirst).mockResolvedValue(null as never);
      await expect(svc.getClassification(TENANT, 'bad')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createClassification', () => {
    it('creates classification with auto-number', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.hazmatClassification.findFirst).mockResolvedValue(null as never);
      vi.mocked(prisma.hazmatClassification.create).mockResolvedValue(mkClass() as never);
      await svc.createClassification(TENANT, USER, {
        productId: 'prod1', unNumber: 'UN1234', properShippingName: 'Flammable liquid',
        hazardClass: 'CLASS_3_FLAMMABLE_LIQUIDS', regulation: 'ADR',
      });
      expect(prisma.hazmatClassification.create).toHaveBeenCalled();
    });

    it('throws if classification already exists for product+regulation', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.hazmatClassification.findFirst).mockResolvedValue(mkClass() as never);
      await expect(svc.createClassification(TENANT, USER, {
        productId: 'prod1', unNumber: 'UN1234', properShippingName: 'x',
        hazardClass: 'CLASS_3_FLAMMABLE_LIQUIDS', regulation: 'ADR',
      })).rejects.toThrow(BadRequestException);
    });
  });

  describe('deleteClassification', () => {
    it('deletes when no manifest references', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.hazmatClassification.findFirst).mockResolvedValue(mkClass() as never);
      vi.mocked(prisma.hazmatManifestLine.count).mockResolvedValue(0 as never);
      vi.mocked(prisma.hazmatClassification.delete).mockResolvedValue(mkClass() as never);
      const result = await svc.deleteClassification(TENANT, 'cls1');
      expect(result.deleted).toBe(true);
    });

    it('throws when manifest lines reference the classification', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.hazmatClassification.findFirst).mockResolvedValue(mkClass() as never);
      vi.mocked(prisma.hazmatManifestLine.count).mockResolvedValue(2 as never);
      await expect(svc.deleteClassification(TENANT, 'cls1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('listSds', () => {
    it('returns SDS records', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.safetyDataSheet.findMany).mockResolvedValue([mkSds()] as never);
      const result = await svc.listSds(TENANT);
      expect(result).toHaveLength(1);
    });
  });

  describe('createSds', () => {
    it('creates SDS with auto-number', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.safetyDataSheet.count).mockResolvedValue(0 as never);
      vi.mocked(prisma.hazmatClassification.findFirst).mockResolvedValue(mkClass() as never);
      vi.mocked(prisma.safetyDataSheet.create).mockResolvedValue(mkSds() as never);
      await svc.createSds(TENANT, {
        classificationId: 'cls1', productId: 'prod1', revision: '1.0',
        issueDate: '2026-07-01', supplier: 'Acme',
      });
      expect(prisma.safetyDataSheet.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ sdsNumber: 'SDS-00001' }) }),
      );
    });

    it('throws if classification not found', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.safetyDataSheet.count).mockResolvedValue(0 as never);
      vi.mocked(prisma.hazmatClassification.findFirst).mockResolvedValue(null as never);
      await expect(svc.createSds(TENANT, {
        classificationId: 'bad', productId: 'prod1', revision: '1.0',
        issueDate: '2026-07-01', supplier: 'Acme',
      })).rejects.toThrow(NotFoundException);
    });
  });

  describe('acknowledgeSds', () => {
    it('acknowledges an unacknowledged SDS', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.safetyDataSheet.findFirst).mockResolvedValue(mkSds() as never);
      vi.mocked(prisma.safetyDataSheet.update).mockResolvedValue(mkSds({ acknowledgedBy: USER }) as never);
      const result = await svc.acknowledgeSds(TENANT, 'sds1', USER);
      expect(result.acknowledgedBy).toBe(USER);
    });

    it('throws if already acknowledged', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.safetyDataSheet.findFirst).mockResolvedValue(mkSds({ acknowledgedBy: 'someone' }) as never);
      await expect(svc.acknowledgeSds(TENANT, 'sds1', USER)).rejects.toThrow(BadRequestException);
    });
  });

  describe('getExpiringSds', () => {
    it('returns SDS expiring within window', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.safetyDataSheet.findMany).mockResolvedValue([mkSds()] as never);
      const result = await svc.getExpiringSds(TENANT, 30);
      expect(result).toHaveLength(1);
    });
  });

  describe('upsertStorageRule', () => {
    it('creates or updates a storage compatibility rule', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.hazmatStorageRule.upsert).mockResolvedValue({
        id: 'rule1', tenantId: TENANT,
        hazardClassA: 'CLASS_3_FLAMMABLE_LIQUIDS', hazardClassB: 'CLASS_5_OXIDIZERS',
        result: 'INCOMPATIBLE', condition: null, notes: null, createdAt: new Date(),
      } as never);
      const result = await svc.upsertStorageRule(TENANT, {
        hazardClassA: 'CLASS_3_FLAMMABLE_LIQUIDS', hazardClassB: 'CLASS_5_OXIDIZERS', result: 'INCOMPATIBLE',
      });
      expect(result.result).toBe('INCOMPATIBLE');
    });
  });

  describe('checkCompatibility', () => {
    it('returns rule when found', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.hazmatStorageRule.findFirst).mockResolvedValue({ result: 'INCOMPATIBLE', condition: null } as never);
      const result = await svc.checkCompatibility(TENANT, 'CLASS_3_FLAMMABLE_LIQUIDS', 'CLASS_5_OXIDIZERS');
      expect((result as Record<string, unknown>).result).toBe('INCOMPATIBLE');
    });

    it('returns COMPATIBLE when no rule defined', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.hazmatStorageRule.findFirst).mockResolvedValue(null as never);
      const result = await svc.checkCompatibility(TENANT, 'CLASS_1_EXPLOSIVES', 'CLASS_9_MISC');
      expect((result as Record<string, unknown>).result).toBe('COMPATIBLE');
    });
  });

  describe('createManifest', () => {
    it('creates manifest with auto-number', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.hazmatManifest.count).mockResolvedValue(0 as never);
      vi.mocked(prisma.hazmatManifest.create).mockResolvedValue(mkManifest() as never);
      await svc.createManifest(TENANT, USER, {
        regulation: 'ADR', originAddress: '1 Warehouse Rd', destAddress: '5 Depot Ave',
      });
      expect(prisma.hazmatManifest.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ manifestNumber: 'HMF-000001' }) }),
      );
    });
  });

  describe('submitManifest', () => {
    it('submits a DRAFT manifest with lines', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.hazmatManifest.findFirst).mockResolvedValue(
        mkManifest({ lines: [{ id: 'l1' }] }) as never,
      );
      vi.mocked(prisma.hazmatManifest.update).mockResolvedValue(mkManifest({ status: 'SUBMITTED' }) as never);
      const result = await svc.submitManifest(TENANT, 'mf1');
      expect(result.status).toBe('SUBMITTED');
    });

    it('throws if manifest has no lines', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.hazmatManifest.findFirst).mockResolvedValue(mkManifest({ lines: [] }) as never);
      await expect(svc.submitManifest(TENANT, 'mf1')).rejects.toThrow(BadRequestException);
    });

    it('throws if not DRAFT', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.hazmatManifest.findFirst).mockResolvedValue(mkManifest({ status: 'DELIVERED', lines: [{ id: 'l1' }] }) as never);
      await expect(svc.submitManifest(TENANT, 'mf1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('manifest lifecycle', () => {
    it('acknowledges SUBMITTED manifest', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.hazmatManifest.findFirst).mockResolvedValue(mkManifest({ status: 'SUBMITTED', lines: [] }) as never);
      vi.mocked(prisma.hazmatManifest.update).mockResolvedValue(mkManifest({ status: 'ACKNOWLEDGED' }) as never);
      const result = await svc.acknowledgeManifest(TENANT, 'mf1');
      expect(result.status).toBe('ACKNOWLEDGED');
    });

    it('marks ACKNOWLEDGED manifest as IN_TRANSIT', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.hazmatManifest.findFirst).mockResolvedValue(mkManifest({ status: 'ACKNOWLEDGED', lines: [] }) as never);
      vi.mocked(prisma.hazmatManifest.update).mockResolvedValue(mkManifest({ status: 'IN_TRANSIT' }) as never);
      const result = await svc.markInTransit(TENANT, 'mf1');
      expect(result.status).toBe('IN_TRANSIT');
    });

    it('delivers IN_TRANSIT manifest', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.hazmatManifest.findFirst).mockResolvedValue(mkManifest({ status: 'IN_TRANSIT', lines: [] }) as never);
      vi.mocked(prisma.hazmatManifest.update).mockResolvedValue(mkManifest({ status: 'DELIVERED' }) as never);
      const result = await svc.deliverManifest(TENANT, 'mf1');
      expect(result.status).toBe('DELIVERED');
    });

    it('cancels a DRAFT manifest', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.hazmatManifest.findFirst).mockResolvedValue(mkManifest({ lines: [] }) as never);
      vi.mocked(prisma.hazmatManifest.update).mockResolvedValue(mkManifest({ status: 'CANCELLED' }) as never);
      const result = await svc.cancelManifest(TENANT, 'mf1');
      expect(result.status).toBe('CANCELLED');
    });

    it('throws on cancel of DELIVERED manifest', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.hazmatManifest.findFirst).mockResolvedValue(mkManifest({ status: 'DELIVERED', lines: [] }) as never);
      await expect(svc.cancelManifest(TENANT, 'mf1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('createIncident', () => {
    it('creates incident with auto-number', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.hazmatIncident.count).mockResolvedValue(0 as never);
      vi.mocked(prisma.hazmatIncident.create).mockResolvedValue(mkIncident() as never);
      await svc.createIncident(TENANT, USER, {
        productId: 'prod1', incidentDate: '2026-07-13', severity: 'MEDIUM', description: 'Spill',
      });
      expect(prisma.hazmatIncident.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ incidentNumber: 'HMI-00001' }) }),
      );
    });
  });

  describe('closeIncident', () => {
    it('closes an open incident', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.hazmatIncident.findFirst).mockResolvedValue(mkIncident() as never);
      vi.mocked(prisma.hazmatIncident.update).mockResolvedValue(mkIncident({ closedAt: new Date(), closedBy: USER }) as never);
      const result = await svc.closeIncident(TENANT, 'inc1', USER);
      expect(result.closedBy).toBe(USER);
    });

    it('throws if already closed', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.hazmatIncident.findFirst).mockResolvedValue(mkIncident({ closedAt: new Date() }) as never);
      await expect(svc.closeIncident(TENANT, 'inc1', USER)).rejects.toThrow(BadRequestException);
    });
  });

  describe('getDashboard', () => {
    it('returns aggregated counts', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.hazmatClassification.count).mockResolvedValue(5 as never);
      vi.mocked(prisma.safetyDataSheet.count).mockResolvedValue(10 as never);
      vi.mocked(prisma.hazmatManifest.count).mockResolvedValue(3 as never);
      vi.mocked(prisma.hazmatIncident.count).mockResolvedValue(2 as never);
      const result = await svc.getDashboard(TENANT);
      expect(result.classifications.total).toBe(5);
    });
  });

  describe('getComplianceReport', () => {
    it('marks product compliant when current SDS is acknowledged', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.hazmatClassification.findMany).mockResolvedValue([
        mkClass({ sdsRecords: [{ ...mkSds(), acknowledgedBy: USER }] }),
      ] as never);
      const result = await svc.getComplianceReport(TENANT);
      expect(result[0].compliant).toBe(true);
    });

    it('marks product non-compliant when SDS is unacknowledged', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.hazmatClassification.findMany).mockResolvedValue([
        mkClass({ sdsRecords: [mkSds()] }),
      ] as never);
      const result = await svc.getComplianceReport(TENANT);
      expect(result[0].compliant).toBe(false);
    });
  });
});
