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
      updateMany: vi.fn(),
    },
    contact: { findFirst: vi.fn(), findMany: vi.fn() },
    customer: { findFirst: vi.fn(), findMany: vi.fn(), update: vi.fn(), updateMany: vi.fn(), delete: vi.fn() },
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
    const result = await service.scanEntity(TENANT, 'leads');
    expect(result.length).toBe(1);
    expect(result[0].records.map((r: any) => r.id).sort()).toEqual(['l1', 'l2']);
  });

  it('merges a source lead into a target, filling missing fields and soft-deleting source', async () => {
    (prisma.lead.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 's', tenantId: TENANT, company: 'Acme', phone: '123' },
      { id: 't', tenantId: TENANT, company: null, phone: '999' },
    ]);
    (prisma.lead.update as ReturnType<typeof vi.fn>).mockResolvedValue({});
    (prisma.lead.updateMany as ReturnType<typeof vi.fn>).mockResolvedValue({});

    const result = await service.mergeLeads(TENANT, { winnerId: 't', loserIds: ['s'], fieldChoices: { company: 's' } });
    expect(result.merged).toBe(true);
    const firstUpdate = (prisma.lead.update as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(firstUpdate.where.id).toBe('t');
    expect(firstUpdate.data.company).toBe('Acme');
    // target already had phone → not in fieldChoices and not overwritten
    expect(firstUpdate.data.phone).toBeUndefined();
    const secondUpdate = (prisma.lead.updateMany as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(secondUpdate.where.id.in).toContain('s');
    expect(secondUpdate.data.deletedAt).toBeInstanceOf(Date);
  });

  it('merges accounts (customers) and SOFT-deletes losers via updateMany + deletedAt, consistent with CrmCustomersService.deleteCustomer', async () => {
    (prisma.customer.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 'winner', tenantId: TENANT, name: 'Acme Inc', email: null },
      { id: 'loser', tenantId: TENANT, name: 'Acme Incorporated', email: 'contact@acme.com' },
    ]);
    (prisma.customer.update as ReturnType<typeof vi.fn>).mockResolvedValue({});
    (prisma.customer.updateMany as ReturnType<typeof vi.fn>).mockResolvedValue({ count: 1 });

    const result = await service.mergeAccounts(TENANT, {
      winnerId: 'winner',
      loserIds: ['loser'],
      fieldChoices: { email: 'loser' },
    });

    expect(result.merged).toBe(true);
    // Never hard-deletes — deleteMany must not be called for customer
    expect(prisma.customer.delete).not.toHaveBeenCalled();
    expect(prisma.customer.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ['loser'] }, tenantId: TENANT },
      data: { deletedAt: expect.any(Date) },
    });
    const patchCall = (prisma.customer.update as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(patchCall.where.id).toBe('winner');
    expect(patchCall.data.email).toBe('contact@acme.com');
  });

  it('rejects merging an account into itself', async () => {
    await expect(
      service.mergeAccounts(TENANT, { winnerId: 'a', loserIds: ['a'] }),
    ).rejects.toThrow('winnerId cannot be in loserIds');
  });
});
