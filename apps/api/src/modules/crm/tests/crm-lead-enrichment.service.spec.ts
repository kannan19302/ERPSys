import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { CrmLeadEnrichmentService } from '../crm-lead-enrichment.service';

vi.mock('@unerp/database', () => ({
  prisma: {
    crmEnrichmentSource: { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), count: vi.fn() },
    crmEnrichmentRule: { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), count: vi.fn() },
    crmEnrichmentFieldMapping: { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    crmLeadEnrichmentData: { findMany: vi.fn(), create: vi.fn() },
    crmEnrichmentLog: { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn(), count: vi.fn() },
    crmEnrichmentSchedule: { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    lead: { findFirst: vi.fn(), findFirstOrThrow: vi.fn() },
  },
}));

import { prisma } from '@unerp/database';

const TENANT = 'tenant-1';

describe('CrmLeadEnrichmentService', () => {
  let service: CrmLeadEnrichmentService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CrmLeadEnrichmentService();
  });

  describe('listSources', () => {
    it('returns sources for tenant', async () => {
      vi.mocked(prisma.crmEnrichmentSource.findMany).mockResolvedValue([{ id: 's1', name: 'Clearbit', provider: 'CLEARBIT', tenantId: TENANT }] as any);
      const result = await service.listSources(TENANT);
      expect(result).toHaveLength(1);
      expect(prisma.crmEnrichmentSource.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { tenantId: TENANT, deletedAt: null } }));
    });
  });

  describe('getSource', () => {
    it('throws if not found', async () => {
      vi.mocked(prisma.crmEnrichmentSource.findFirst).mockResolvedValue(null);
      await expect(service.getSource(TENANT, 'bad')).rejects.toThrow(NotFoundException);
    });
    it('returns source if found', async () => {
      vi.mocked(prisma.crmEnrichmentSource.findFirst).mockResolvedValue({ id: 's1' } as any);
      const r = await service.getSource(TENANT, 's1');
      expect(r.id).toBe('s1');
    });
  });

  describe('createSource', () => {
    it('creates and returns source', async () => {
      const dto = { name: 'Test', provider: 'CLEARBIT' as const };
      vi.mocked(prisma.crmEnrichmentSource.create).mockResolvedValue({ id: 'new', ...dto, tenantId: TENANT } as any);
      const r = await service.createSource(TENANT, dto);
      expect(r.id).toBe('new');
    });
  });

  describe('testSource', () => {
    it('updates lastTestedAt and result', async () => {
      vi.mocked(prisma.crmEnrichmentSource.findFirst).mockResolvedValue({ id: 's1', apiUrl: 'https://api.example.com' } as any);
      vi.mocked(prisma.crmEnrichmentSource.update).mockResolvedValue({} as any);
      await service.testSource(TENANT, 's1');
      expect(prisma.crmEnrichmentSource.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 's1' }, data: expect.objectContaining({ lastTestResult: 'SUCCESS' }) }));
    });
  });

  describe('toggleSource', () => {
    it('toggles enabled', async () => {
      vi.mocked(prisma.crmEnrichmentSource.findFirst).mockResolvedValue({ id: 's1', enabled: false } as any);
      vi.mocked(prisma.crmEnrichmentSource.update).mockResolvedValue({} as any);
      await service.toggleSource(TENANT, 's1');
      expect(prisma.crmEnrichmentSource.update).toHaveBeenCalledWith(expect.objectContaining({ data: { enabled: true } }));
    });
  });

  describe('rules', () => {
    it('listRules returns rules with source include', async () => {
      vi.mocked(prisma.crmEnrichmentRule.findMany).mockResolvedValue([{ id: 'r1', name: 'Rule 1' }] as any);
      const r = await service.listRules(TENANT, 'LEAD');
      expect(r).toHaveLength(1);
    });

    it('createRule validates source exists', async () => {
      vi.mocked(prisma.crmEnrichmentSource.findFirst).mockResolvedValue(null);
      const dto = { name: 'R', sourceId: 'bad', objectType: 'LEAD' as const, triggerType: 'MANUAL' as const };
      await expect(service.createRule(TENANT, dto as any)).rejects.toThrow(NotFoundException);
    });
  });

  describe('fieldMappings', () => {
    it('listFieldMappings filters by source', async () => {
      vi.mocked(prisma.crmEnrichmentFieldMapping.findMany).mockResolvedValue([]);
      await service.listFieldMappings(TENANT, 's1');
      expect(prisma.crmEnrichmentFieldMapping.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { tenantId: TENANT, sourceId: 's1' } }));
    });
  });

  describe('enrichLead', () => {
    it('throws if lead not found', async () => {
      vi.mocked(prisma.lead.findFirst).mockResolvedValue(null);
      await expect(service.enrichLead(TENANT, 'bad')).rejects.toThrow(NotFoundException);
    });

    it('enriches lead with available sources', async () => {
      vi.mocked(prisma.lead.findFirst).mockResolvedValue({ id: 'l1', company: 'Acme', email: 'test@acme.com' } as any);
      vi.mocked(prisma.crmEnrichmentSource.findMany).mockResolvedValue([{ id: 's1', name: 'Clearbit', enabled: true }] as any);
      vi.mocked(prisma.crmLeadEnrichmentData.create).mockResolvedValue({ id: 'e1' } as any);
      vi.mocked(prisma.crmEnrichmentLog.create).mockResolvedValue({} as any);
      const r = await service.enrichLead(TENANT, 'l1');
      expect(r).toHaveLength(1);
    });
  });

  describe('schedules', () => {
    it('createSchedule validates rule', async () => {
      vi.mocked(prisma.crmEnrichmentRule.findFirst).mockResolvedValue(null);
      const dto = { ruleId: 'bad', frequency: 'DAILY' as const, objectType: 'LEAD' as const };
      await expect(service.createSchedule(TENANT, dto as any)).rejects.toThrow(NotFoundException);
    });
  });

  describe('stats', () => {
    it('returns computed stats', async () => {
      vi.mocked(prisma.crmEnrichmentSource.count).mockResolvedValue(2);
      vi.mocked(prisma.crmEnrichmentRule.count).mockResolvedValue(3);
      vi.mocked(prisma.crmEnrichmentLog.count).mockResolvedValueOnce(100).mockResolvedValueOnce(80).mockResolvedValueOnce(20);
      const s = await service.getStats(TENANT);
      expect(s.sources).toBe(2);
      expect(s.rules).toBe(3);
      expect(s.totalEnriched).toBe(100);
      expect(s.successRate).toBe(80);
    });
  });
});
