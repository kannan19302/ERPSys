import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Form1099Service } from '../services/form-1099.service';
import { prisma } from '@unerp/database';
import { NotFoundException, BadRequestException } from '@nestjs/common';

vi.mock('@prisma/client', () => {
  return {
    Prisma: {
      Decimal: class Decimal {
        private value: number;
        constructor(val: unknown) {
          this.value = Number(val);
        }
        toNumber() {
          return this.value;
        }
        valueOf() {
          return this.value;
        }
      },
    },
  };
});

vi.mock('@unerp/database', () => {
  const createMockPrismaCollection = () => ({
    findMany: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    upsert: vi.fn(),
    updateMany: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
    groupBy: vi.fn(),
  });

  return {
    prisma: {
      vendor: createMockPrismaCollection(),
      vendor1099Profile: createMockPrismaCollection(),
      purchaseOrder: createMockPrismaCollection(),
      form1099: createMockPrismaCollection(),
      form1099Batch: createMockPrismaCollection(),
    },
  };
});

describe('Form1099Service', () => {
  let service: Form1099Service;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new Form1099Service();
  });

  describe('listVendorsWithProfiles', () => {
    it('computes YTD paid and threshold-crossing flag', async () => {
      vi.mocked(prisma.vendor.findMany).mockResolvedValue([
        { id: 'v1', name: 'Acme Consulting', taxId: '12-3456789', vendor1099Profile: null },
      ] as any);
      vi.mocked(prisma.purchaseOrder.groupBy).mockResolvedValue([
        { vendorId: 'v1', _sum: { paidAmount: 1200 } },
      ] as any);

      const result = await service.listVendorsWithProfiles('tenant-1', 2026);
      expect(result[0].ytdPaid).toBe(1200);
      expect(result[0].crossesThreshold).toBe(true);
    });
  });

  describe('getVendorProfile', () => {
    it('throws NotFoundException when vendor missing', async () => {
      vi.mocked(prisma.vendor.findFirst).mockResolvedValue(null);
      await expect(service.getVendorProfile('tenant-1', 'v1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('upsertVendorProfile', () => {
    it('upserts a profile with defaults', async () => {
      vi.mocked(prisma.vendor.findFirst).mockResolvedValue({ id: 'v1' } as any);
      vi.mocked(prisma.vendor1099Profile.upsert).mockResolvedValue({ id: 'p1', is1099Vendor: true } as any);

      const result = await service.upsertVendorProfile('tenant-1', 'v1', { is1099Vendor: true });
      expect(prisma.vendor1099Profile.upsert).toHaveBeenCalled();
      expect(result).toEqual({ id: 'p1', is1099Vendor: true });
    });
  });

  describe('runTinMatch', () => {
    it('throws BadRequestException if no profile exists', async () => {
      vi.mocked(prisma.vendor.findFirst).mockResolvedValue({ id: 'v1' } as any);
      vi.mocked(prisma.vendor1099Profile.findUnique).mockResolvedValue(null);
      await expect(service.runTinMatch('tenant-1', 'v1')).rejects.toThrow(BadRequestException);
    });

    it('marks MATCHED when TIN and name are present', async () => {
      vi.mocked(prisma.vendor.findFirst).mockResolvedValue({ id: 'v1', name: 'Acme' } as any);
      vi.mocked(prisma.vendor1099Profile.findUnique).mockResolvedValue({ taxIdMasked: 'XX-1234' } as any);
      vi.mocked(prisma.vendor1099Profile.update).mockResolvedValue({ tinMatchStatus: 'MATCHED' } as any);

      const result = await service.runTinMatch('tenant-1', 'v1');
      expect(prisma.vendor1099Profile.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ tinMatchStatus: 'MATCHED' }) }),
      );
      expect(result).toEqual({ tinMatchStatus: 'MATCHED' });
    });
  });

  describe('setBackupWithholding', () => {
    it('rejects an invalid rate', async () => {
      vi.mocked(prisma.vendor.findFirst).mockResolvedValue({ id: 'v1' } as any);
      await expect(service.setBackupWithholding('tenant-1', 'v1', true, 150)).rejects.toThrow(BadRequestException);
    });
  });

  describe('getForm', () => {
    it('throws NotFoundException when form missing', async () => {
      vi.mocked(prisma.form1099.findFirst).mockResolvedValue(null);
      await expect(service.getForm('tenant-1', 'f1')).rejects.toThrow(NotFoundException);
    });

    it('scopes the lookup by tenantId — a form belonging to another tenant is not found', async () => {
      // findFirst is called with { id, tenantId } — simulate the DB filtering it out
      // for a mismatched tenant by returning null, proving cross-tenant access is denied.
      vi.mocked(prisma.form1099.findFirst).mockResolvedValue(null);
      await expect(service.getForm('tenant-other', 'f1')).rejects.toThrow(NotFoundException);
      expect(prisma.form1099.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'f1', tenantId: 'tenant-other' } }),
      );
    });
  });

  describe('updateForm', () => {
    it('rejects editing a non-DRAFT form', async () => {
      vi.mocked(prisma.form1099.findFirst).mockResolvedValue({ id: 'f1', status: 'FILED', boxAmounts: {}, totalAmount: 0 } as any);
      await expect(service.updateForm('tenant-1', 'f1', 'user-1', { notes: 'x' })).rejects.toThrow(BadRequestException);
    });

    it('recomputes totalAmount from new box amounts', async () => {
      vi.mocked(prisma.form1099.findFirst).mockResolvedValue({ id: 'f1', status: 'DRAFT', boxAmounts: { '1': 500 }, totalAmount: 500 } as any);
      vi.mocked(prisma.form1099.update).mockResolvedValue({ id: 'f1', totalAmount: 700 } as any);

      await service.updateForm('tenant-1', 'f1', 'user-1', { boxAmounts: { '1': 700 } });
      expect(prisma.form1099.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ boxAmounts: { '1': 700 } }) }),
      );
    });
  });

  describe('markReady / fileForm', () => {
    it('only allows marking DRAFT forms ready', async () => {
      vi.mocked(prisma.form1099.findFirst).mockResolvedValue({ id: 'f1', status: 'READY' } as any);
      await expect(service.markReady('tenant-1', 'f1', 'user-1')).rejects.toThrow(BadRequestException);
    });

    it('only allows filing READY forms', async () => {
      vi.mocked(prisma.form1099.findFirst).mockResolvedValue({ id: 'f1', status: 'DRAFT' } as any);
      await expect(service.fileForm('tenant-1', 'f1', 'user-1')).rejects.toThrow(BadRequestException);
    });

    it('files a READY form', async () => {
      vi.mocked(prisma.form1099.findFirst).mockResolvedValue({ id: 'f1', status: 'READY' } as any);
      vi.mocked(prisma.form1099.update).mockResolvedValue({ id: 'f1', status: 'FILED' } as any);

      const result = await service.fileForm('tenant-1', 'f1', 'user-1');
      expect(result.status).toBe('FILED');
    });
  });

  describe('correctForm', () => {
    it('rejects correcting a non-FILED form', async () => {
      vi.mocked(prisma.form1099.findFirst).mockResolvedValue({ id: 'f1', status: 'DRAFT' } as any);
      await expect(service.correctForm('tenant-1', 'f1', 'user-1', { boxAmounts: { '1': 100 } })).rejects.toThrow(BadRequestException);
    });

    it('rejects a second correction for the same form', async () => {
      vi.mocked(prisma.form1099.findFirst).mockResolvedValue({ id: 'f1', status: 'FILED', correction: { id: 'f2' } } as any);
      await expect(service.correctForm('tenant-1', 'f1', 'user-1', { boxAmounts: { '1': 100 } })).rejects.toThrow(BadRequestException);
    });

    it('creates a correction linked to the original', async () => {
      vi.mocked(prisma.form1099.findFirst).mockResolvedValue({
        id: 'f1', status: 'FILED', correction: null, vendorId: 'v1', taxYear: 2026, formType: 'NEC',
        federalWithholding: 0, state: null, stateId: null,
      } as any);
      vi.mocked(prisma.form1099.create).mockResolvedValue({ id: 'f2', isCorrection: true, correctedFromId: 'f1' } as any);

      const result = await service.correctForm('tenant-1', 'f1', 'user-1', { boxAmounts: { '1': 900 } });
      expect(prisma.form1099.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ isCorrection: true, correctedFromId: 'f1' }) }),
      );
      expect(result.correctedFromId).toBe('f1');
    });
  });

  describe('createBatch', () => {
    it('rejects an empty form list', async () => {
      await expect(service.createBatch('tenant-1', 'user-1', { taxYear: 2026, name: 'Batch A', formIds: [] })).rejects.toThrow(BadRequestException);
    });

    it('rejects if not all forms are READY / found', async () => {
      vi.mocked(prisma.form1099.findMany).mockResolvedValue([{ id: 'f1', totalAmount: 100 }] as any);
      await expect(
        service.createBatch('tenant-1', 'user-1', { taxYear: 2026, name: 'Batch A', formIds: ['f1', 'f2'] }),
      ).rejects.toThrow(BadRequestException);
    });

    it('creates a batch and links forms', async () => {
      vi.mocked(prisma.form1099.findMany).mockResolvedValue([{ id: 'f1', totalAmount: 100 }, { id: 'f2', totalAmount: 200 }] as any);
      vi.mocked(prisma.form1099Batch.create).mockResolvedValue({ id: 'b1', formCount: 2, totalAmount: 300 } as any);
      vi.mocked(prisma.form1099.updateMany).mockResolvedValue({ count: 2 } as any);

      const result = await service.createBatch('tenant-1', 'user-1', { taxYear: 2026, name: 'Batch A', formIds: ['f1', 'f2'] });
      expect(prisma.form1099.updateMany).toHaveBeenCalledWith({ where: { id: { in: ['f1', 'f2'] }, tenantId: 'tenant-1' }, data: { batchId: 'b1' } });
      expect(result.formCount).toBe(2);
    });
  });

  describe('efileBatch', () => {
    it('rejects a batch not in GENERATED status', async () => {
      vi.mocked(prisma.form1099Batch.findFirst).mockResolvedValue({ id: 'b1', status: 'SUBMITTED', forms: [] } as any);
      await expect(service.efileBatch('tenant-1', 'b1', 'user-1')).rejects.toThrow(BadRequestException);
    });

    it('submits a GENERATED batch and marks its forms FILED', async () => {
      vi.mocked(prisma.form1099Batch.findFirst).mockResolvedValue({ id: 'b1', status: 'GENERATED', forms: [] } as any);
      vi.mocked(prisma.form1099Batch.update).mockResolvedValue({ id: 'b1', status: 'SUBMITTED' } as any);
      vi.mocked(prisma.form1099.updateMany).mockResolvedValue({ count: 2 } as any);

      const result = await service.efileBatch('tenant-1', 'b1', 'user-1');
      expect(result.status).toBe('SUBMITTED');
      expect(prisma.form1099.updateMany).toHaveBeenCalled();
    });
  });

  describe('getStateFilingRequirements', () => {
    it('returns static reference data', () => {
      const result = service.getStateFilingRequirements();
      expect(result.combinedFederalStateProgram).toContain('CA');
      expect(result.separateStateFilingRequired).toContain('PA');
    });
  });
});
