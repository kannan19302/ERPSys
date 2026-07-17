import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CrmLeadScoringService } from '../crm-lead-scoring.service';

vi.mock('@unerp/database', () => ({
  prisma: {
    leadScoringRule: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    lead: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { prisma } from '@unerp/database';

const TENANT = 'tenant-1';

describe('CrmLeadScoringService', () => {
  let service: CrmLeadScoringService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CrmLeadScoringService();
  });

  it('creates a scoring rule with defaults', async () => {
    (prisma.leadScoringRule.create as ReturnType<typeof vi.fn>).mockImplementation(({ data }) =>
      Promise.resolve({ id: 'r1', ...data }),
    );
    const rule = await service.createRule(TENANT, {
      name: 'Has Email', field: 'email', operator: 'exists', value: '', points: 15,
    });
    expect(rule.tenantId).toBe(TENANT);
    expect(rule.active).toBe(true);
    expect(rule.points).toBe(15);
  });

  it('recalculates a lead score from active rules', async () => {
    (prisma.lead.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'l1', tenantId: TENANT, deletedAt: null, email: 'a@b.com', company: 'Acme', employeeCount: 200,
    });
    (prisma.leadScoringRule.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { field: 'email', operator: 'exists', value: '', points: 10 },
      { field: 'company', operator: 'eq', value: 'Acme', points: 20 },
      { field: 'employeeCount', operator: 'gt', value: '100', points: 30 },
    ]);
    (prisma.lead.update as ReturnType<typeof vi.fn>).mockResolvedValue({});

    const result = await service.recalculateScore(TENANT, 'l1');
    expect(result?.score).toBe(60);
    expect(prisma.lead.update).toHaveBeenCalledWith({ where: { id: 'l1' }, data: { score: 60 } });
  });

  it('recalculateAll processes every non-deleted lead', async () => {
    (prisma.lead.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([{ id: 'a' }, { id: 'b' }]);
    (prisma.lead.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'a', tenantId: TENANT, deletedAt: null });
    (prisma.leadScoringRule.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (prisma.lead.update as ReturnType<typeof vi.fn>).mockResolvedValue({});

    const result = await service.recalculateAll(TENANT);
    expect(result.processed).toBe(2);
  });
});
