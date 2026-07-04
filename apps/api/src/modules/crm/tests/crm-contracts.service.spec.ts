import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CrmContractsService } from '../crm-contracts.service';

vi.mock('@unerp/database', () => ({
  prisma: {
    contract: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      aggregate: vi.fn(),
    },
    customer: { findFirst: vi.fn() },
    vendor: { findFirst: vi.fn() },
    organization: { findFirst: vi.fn() },
    $transaction: vi.fn(),
  },
}));

import { prisma } from '@unerp/database';

const TENANT = 'tenant-1';
const ORG = 'org-1';

describe('CrmContractsService', () => {
  let service: CrmContractsService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CrmContractsService();
    (prisma.organization.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: ORG });
  });

  describe('createContract', () => {
    it('creates a contract linked to a customer', async () => {
      (prisma.customer.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'cust-1' });
      (prisma.contract.count as ReturnType<typeof vi.fn>).mockResolvedValue(0);
      (prisma.contract.create as ReturnType<typeof vi.fn>).mockImplementation(({ data }) =>
        Promise.resolve({ id: 'con-1', ...data }),
      );

      const result = await service.createContract(TENANT, ORG, {
        title: 'Annual Support Agreement',
        customerId: 'cust-1',
        type: 'SALES',
        value: 12000,
        currency: 'USD',
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31'),
        autoRenew: false,
      } as any);

      expect(result.contractNumber).toBe('CON-00001');
      expect(result.customerId).toBe('cust-1');
    });

    it('rejects when linked customerId does not belong to tenant', async () => {
      (prisma.customer.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      await expect(
        service.createContract(TENANT, ORG, {
          title: 'Bad',
          customerId: 'nope',
          type: 'SALES',
          value: 100,
          currency: 'USD',
          startDate: new Date('2026-01-01'),
          endDate: new Date('2026-12-31'),
        } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects endDate before startDate', async () => {
      (prisma.customer.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'cust-1' });
      await expect(
        service.createContract(TENANT, ORG, {
          title: 'Bad dates',
          customerId: 'cust-1',
          type: 'SALES',
          value: 100,
          currency: 'USD',
          startDate: new Date('2026-12-31'),
          endDate: new Date('2026-01-01'),
        } as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateStatus', () => {
    it('allows DRAFT -> ACTIVE', async () => {
      (prisma.contract.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'con-1', tenantId: TENANT, status: 'DRAFT' });
      (prisma.contract.update as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'con-1', status: 'ACTIVE' });

      const result = await service.updateStatus(TENANT, 'con-1', { status: 'ACTIVE' });
      expect(result.status).toBe('ACTIVE');
    });

    it('rejects illegal transition DRAFT -> EXPIRED', async () => {
      (prisma.contract.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'con-1', tenantId: TENANT, status: 'DRAFT' });
      await expect(service.updateStatus(TENANT, 'con-1', { status: 'EXPIRED' })).rejects.toThrow(BadRequestException);
    });

    it('rejects setting RENEWED directly (must go through renew action)', async () => {
      (prisma.contract.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'con-1', tenantId: TENANT, status: 'ACTIVE' });
      await expect(service.updateStatus(TENANT, 'con-1', { status: 'RENEWED' })).rejects.toThrow(
        /use POST \/crm\/contracts\/:id\/renew/,
      );
    });

    it('rejects any transition out of terminal TERMINATED', async () => {
      (prisma.contract.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'con-1', tenantId: TENANT, status: 'TERMINATED' });
      await expect(service.updateStatus(TENANT, 'con-1', { status: 'ACTIVE' })).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException for missing contract', async () => {
      (prisma.contract.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      await expect(service.updateStatus(TENANT, 'missing', { status: 'ACTIVE' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('renewContract', () => {
    it('creates a follow-on contract by default, marks original RENEWED', async () => {
      const existing = {
        id: 'con-1',
        tenantId: TENANT,
        status: 'ACTIVE',
        title: 'Support',
        customerId: 'cust-1',
        vendorId: null,
        type: 'SALES',
        value: 1000,
        currency: 'USD',
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31'),
        renewalTermMonths: 12,
        autoRenew: true,
        terms: null,
        ownerId: null,
      };
      (prisma.contract.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(existing);
      (prisma.contract.count as ReturnType<typeof vi.fn>).mockResolvedValue(1);
      (prisma.$transaction as ReturnType<typeof vi.fn>).mockImplementation(async (ops: any[]) => {
        return [{ id: 'con-1', status: 'RENEWED' }, { id: 'con-2', contractNumber: 'CON-00002', status: 'ACTIVE', renewedFromId: 'con-1' }];
      });

      const result = await service.renewContract(TENANT, ORG, 'con-1', { extendInPlace: false } as any);
      expect(result.id).toBe('con-2');
      expect(result.renewedFromId).toBe('con-1');
    });

    it('extends in place when extendInPlace=true', async () => {
      const existing = {
        id: 'con-1',
        tenantId: TENANT,
        status: 'ACTIVE',
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31'),
        renewalTermMonths: 12,
      };
      (prisma.contract.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(existing);
      (prisma.contract.update as ReturnType<typeof vi.fn>).mockImplementation(({ data }) =>
        Promise.resolve({ id: 'con-1', ...data }),
      );

      const result = await service.renewContract(TENANT, ORG, 'con-1', { extendInPlace: true } as any);
      expect(result.status).toBe('ACTIVE');
      expect(prisma.contract.update).toHaveBeenCalled();
    });

    it('rejects renewing a TERMINATED contract', async () => {
      (prisma.contract.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'con-1', tenantId: TENANT, status: 'TERMINATED' });
      await expect(service.renewContract(TENANT, ORG, 'con-1', {} as any)).rejects.toThrow(BadRequestException);
    });

    it('rejects renewal with no renewalTermMonths available', async () => {
      (prisma.contract.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'con-1', tenantId: TENANT, status: 'ACTIVE', renewalTermMonths: null,
      });
      await expect(service.renewContract(TENANT, ORG, 'con-1', {} as any)).rejects.toThrow(BadRequestException);
    });
  });

  describe('tenant isolation', () => {
    it('getContractById scopes by tenantId and returns not found for another tenant', async () => {
      (prisma.contract.findFirst as ReturnType<typeof vi.fn>).mockImplementation(({ where }) => {
        if (where.tenantId !== TENANT) return Promise.resolve(null);
        return Promise.resolve(null); // not found either way in this mock, assert call args instead
      });
      await expect(service.getContractById('other-tenant', 'con-1')).rejects.toThrow(NotFoundException);
      expect(prisma.contract.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ tenantId: 'other-tenant' }) }),
      );
    });
  });

  describe('deleteContract', () => {
    it('soft-deletes by setting deletedAt', async () => {
      (prisma.contract.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'con-1', tenantId: TENANT });
      (prisma.contract.update as ReturnType<typeof vi.fn>).mockImplementation(({ data }) => Promise.resolve({ id: 'con-1', ...data }));

      const result = await service.deleteContract(TENANT, 'con-1');
      expect(result.deletedAt).toBeInstanceOf(Date);
    });
  });

  describe('scanRenewals', () => {
    it('marks contracts within 30 days as EXPIRING_SOON and past-due as EXPIRED', async () => {
      (prisma.contract.updateMany as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({ count: 2 })
        .mockResolvedValueOnce({ count: 1 });

      const result = await service.scanRenewals(TENANT);
      expect(result).toEqual({ markedExpiringSoon: 2, markedExpired: 1 });
    });
  });
});
