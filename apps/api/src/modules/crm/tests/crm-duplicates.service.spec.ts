import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CrmDuplicatesService } from '../crm-duplicates.service';

vi.mock('@unerp/database', () => ({
  prisma: {
    duplicateRule: {
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
    contact: { findFirst: vi.fn(), findMany: vi.fn() },
    customer: { findFirst: vi.fn(), findMany: vi.fn(), update: vi.fn(), delete: vi.fn() },
  },
}));

import { prisma } from '@unerp/database';

const TENANT = 'tenant-1';

describe('CrmDuplicatesService', () => {
  let service: CrmDuplicatesService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CrmDuplicatesService();
  });

  it('creates a duplicate rule', async () => {
    (prisma.duplicateRule.create as ReturnType<typeof vi.fn>).mockImplementation(({ data }) =>
      Promise.resolve({ id: 'd1', ...data }),
    );
    const rule = await service.createRule(TENANT, {
      name: 'Same email', entity: 'LEAD', matchFields: ['email'], threshold: 100, action: 'WARN',
    });
    expect(rule.entity).toBe('LEAD');
    expect(rule.active).toBe(true);
  });

  it('scans and groups leads with matching normalized email', async () => {
    (prisma.duplicateRule.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 'r1', name: 'Same email', matchFields: ['email'] },
    ]);
    (prisma.lead.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 'l1', email: 'a@b.com' },
      { id: 'l2', email: 'A@B.com  ' },
      { id: 'l3', email: 'x@y.com' },
    ]);
    const result = await service.scanEntity(TENANT, 'LEAD');
    expect(result.groups.length).toBe(1);
    expect(result.groups[0].ids.sort()).toEqual(['l1', 'l2']);
  });

  it('merges a source lead into a target, filling missing fields and soft-deleting source', async () => {
    (prisma.lead.findFirst as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ id: 's', tenantId: TENANT, company: 'Acme', phone: '123' })
      .mockResolvedValueOnce({ id: 't', tenantId: TENANT, company: null, phone: '999' });
    (prisma.lead.update as ReturnType<typeof vi.fn>).mockResolvedValue({});

    const result = await service.mergeLeads(TENANT, { sourceId: 's', targetId: 't' });
    expect(result.merged).toBe(true);
    const firstUpdate = (prisma.lead.update as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(firstUpdate.where.id).toBe('t');
    expect(firstUpdate.data.company).toBe('Acme');
    // target already had phone → not overwritten
    expect(firstUpdate.data.phone).toBeUndefined();
    const secondUpdate = (prisma.lead.update as ReturnType<typeof vi.fn>).mock.calls[1][0];
    expect(secondUpdate.data.deletedAt).toBeInstanceOf(Date);
  });
});
