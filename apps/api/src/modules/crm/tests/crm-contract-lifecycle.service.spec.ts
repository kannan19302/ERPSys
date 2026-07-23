import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { CrmContractLifecycleService } from '../crm-contract-lifecycle.service';

vi.mock('@unerp/database', () => ({
  prisma: {
    contract: { findMany: vi.fn(), findFirst: vi.fn(), findFirstOrThrow: vi.fn(), update: vi.fn(), count: vi.fn(), aggregate: vi.fn() },
    contractAmendment: { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), count: vi.fn() },
    contractPriceEscalationRule: { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), count: vi.fn() },
    contractAutoRenewalLog: { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn(), count: vi.fn(), groupBy: vi.fn() },
    contractExpirationPipelineItem: { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), count: vi.fn(), groupBy: vi.fn() },
    contractTemplate: { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), count: vi.fn() },
    contractClause: { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
  },
}));

import { prisma } from '@unerp/database';

const TENANT = 'tenant-1';

describe('CrmContractLifecycleService', () => {
  let service: CrmContractLifecycleService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CrmContractLifecycleService();
  });

  describe('amendments', () => {
    it('listAmendments returns amendments', async () => {
      vi.mocked(prisma.contractAmendment.findMany).mockResolvedValue([{ id: 'a1' }] as any);
      const r = await service.listAmendments(TENANT, 'c1');
      expect(r).toHaveLength(1);
      expect(prisma.contractAmendment.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ contractId: 'c1' }) }));
    });

    it('getAmendment throws if missing', async () => {
      vi.mocked(prisma.contractAmendment.findFirst).mockResolvedValue(null);
      await expect(service.getAmendment(TENANT, 'bad')).rejects.toThrow(NotFoundException);
    });

    it('createAmendment throws if contract missing', async () => {
      vi.mocked(prisma.contract.findFirst).mockResolvedValue(null);
      const dto = { contractId: 'bad', title: 'Test', amendmentType: 'SCOPE_CHANGE' as const, effectiveDate: new Date() };
      await expect(service.createAmendment(TENANT, dto as any, 'user1')).rejects.toThrow(NotFoundException);
    });

    it('createAmendment creates with amendment number', async () => {
      vi.mocked(prisma.contract.findFirst).mockResolvedValue({ id: 'c1', contractNumber: 'CN-001' } as any);
      vi.mocked(prisma.contractAmendment.count).mockResolvedValue(0);
      vi.mocked(prisma.contractAmendment.create).mockResolvedValue({ id: 'a1' } as any);
      const dto = { contractId: 'c1', title: 'Test AMD', amendmentType: 'PRICE_CHANGE' as const, effectiveDate: new Date(), newValue: 10000 };
      const r = await service.createAmendment(TENANT, dto, 'user1');
      expect(r.id).toBe('a1');
    });

    it('submitAmendmentForApproval throws if not DRAFT', async () => {
      vi.mocked(prisma.contractAmendment.findFirst).mockResolvedValue({ id: 'a1', status: 'APPROVED' } as any);
      await expect(service.submitAmendmentForApproval(TENANT, 'a1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('price escalation', () => {
    it('createPriceEscalationRule creates rule', async () => {
      const dto = { name: 'Annual 5%', escalationType: 'PERCENTAGE' as const, escalationValue: 5, frequency: 'ANNUAL' as const, startDate: new Date() };
      vi.mocked(prisma.contractPriceEscalationRule.create).mockResolvedValue({ id: 'r1' } as any);
      const r = await service.createPriceEscalationRule(TENANT, dto);
      expect(r.id).toBe('r1');
    });

    it('applyEscalation applies percentage increase', async () => {
      vi.mocked(prisma.contractPriceEscalationRule.findFirst).mockResolvedValue({ id: 'r1', escalationType: 'PERCENTAGE', escalationValue: 10, maxCap: null } as any);
      vi.mocked(prisma.contract.findFirst).mockResolvedValue({ id: 'c1', value: 1000 } as any);
      vi.mocked(prisma.contract.update).mockResolvedValue({} as any);
      vi.mocked(prisma.contractPriceEscalationRule.update).mockResolvedValue({} as any);
      await service.applyEscalation(TENANT, 'r1', 'c1');
      expect(prisma.contract.update).toHaveBeenCalledWith(expect.objectContaining({ data: { value: 1100 } }));
    });
  });

  describe('auto-renewals', () => {
    it('processAutoRenewal throws if contract missing', async () => {
      vi.mocked(prisma.contract.findFirst).mockResolvedValue(null);
      await expect(service.processAutoRenewal(TENANT, 'bad')).rejects.toThrow(NotFoundException);
    });

    it('processAutoRenewal processes renewal', async () => {
      const endDate = new Date();
      endDate.setFullYear(endDate.getFullYear() + 1);
      vi.mocked(prisma.contract.findFirst).mockResolvedValue({ id: 'c1', status: 'ACTIVE', endDate, value: 1000, autoRenew: true, renewalTermMonths: 12, renewedFromId: null } as any);
      vi.mocked(prisma.contractPriceEscalationRule.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.contract.update).mockResolvedValue({} as any);
      vi.mocked(prisma.contractAutoRenewalLog.count).mockResolvedValue(1);
      vi.mocked(prisma.contractAutoRenewalLog.create).mockResolvedValue({ id: 'log1' } as any);
      const r = await service.processAutoRenewal(TENANT, 'c1');
      expect(r.id).toBe('log1');
    });
  });

  describe('expiration pipeline', () => {
    it('scanExpirationPipeline creates items for near-expiry contracts', async () => {
      const nearEnd = new Date();
      nearEnd.setDate(nearEnd.getDate() + 30);
      vi.mocked(prisma.contract.findMany).mockResolvedValue([{ id: 'c1', endDate: nearEnd, contractNumber: 'CN-001', title: 'Test' }] as any);
      vi.mocked(prisma.contractExpirationPipelineItem.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.contractExpirationPipelineItem.create).mockResolvedValue({} as any);
      const r = await service.scanExpirationPipeline(TENANT);
      expect(r.scanned).toBe(1);
    });
  });

  describe('templates', () => {
    it('createTemplate creates template', async () => {
      const dto = { name: 'NDA Template', contractType: 'NDA' as const };
      vi.mocked(prisma.contractTemplate.create).mockResolvedValue({ id: 't1' } as any);
      const r = await service.createTemplate(TENANT, dto);
      expect(r.id).toBe('t1');
    });
  });

  describe('analytics', () => {
    it('getAnalytics returns computed metrics', async () => {
      vi.mocked(prisma.contract.count).mockResolvedValueOnce(50).mockResolvedValueOnce(30).mockResolvedValueOnce(5);
      vi.mocked(prisma.contractExpirationPipelineItem.count).mockResolvedValue(10);
      vi.mocked(prisma.contractAmendment.count).mockResolvedValue(8);
      vi.mocked(prisma.contractPriceEscalationRule.count).mockResolvedValue(3);
      vi.mocked(prisma.contractTemplate.count).mockResolvedValue(4);
      vi.mocked(prisma.contract.aggregate).mockResolvedValue({ _sum: { value: 500000 } } as any);
      const a = await service.getAnalytics(TENANT);
      expect(a.totalContracts).toBe(50);
      expect(a.activeContracts).toBe(30);
    });
  });
});
