import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CrmAccountManagementService } from '../crm-account-management.service';

vi.mock('@unerp/database', () => ({
  prisma: {
    customer: { findFirst: vi.fn(), findMany: vi.fn(), update: vi.fn() },
    opportunity: { findMany: vi.fn() },
  },
}));

import { prisma } from '@unerp/database';

const TENANT = 'tenant-1';

describe('CrmAccountManagementService — real account hierarchy (Up Next item 49)', () => {
  let service: CrmAccountManagementService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CrmAccountManagementService();
  });

  it('getAccountHierarchy reads the real parentCustomerId relation, not a notes mock', async () => {
    (prisma.customer.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'child1', name: 'Acme West', parentCustomer: { id: 'parent1', name: 'Acme Corp' },
    });
    (prisma.customer.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 'grandchild1', name: 'Acme West Division A', customerType: 'RECURRING' },
    ]);

    const result = await service.getAccountHierarchy(TENANT, 'child1');
    expect(result.parent).toEqual({ id: 'parent1', name: 'Acme Corp' });
    expect(result.subsidiaries).toHaveLength(1);
    expect(result.subsidiaries[0].id).toBe('grandchild1');
  });

  it('setParentAccount rejects self-parenting', async () => {
    (prisma.customer.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'c1', parentCustomerId: null });
    await expect(service.setParentAccount(TENANT, 'c1', 'c1')).rejects.toThrow('cannot be its own parent');
  });

  it('setParentAccount rejects a cycle (A -> B -> A)', async () => {
    (prisma.customer.findFirst as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ id: 'A', parentCustomerId: null }) // the customer being assigned a parent
      .mockResolvedValueOnce({ id: 'B', parentCustomerId: 'A' }) // proposed parent B, whose parent is A
      .mockResolvedValueOnce({ id: 'A', parentCustomerId: null }); // walk-up hits A -> cycle

    await expect(service.setParentAccount(TENANT, 'A', 'B')).rejects.toThrow('circular');
  });

  it('setParentAccount succeeds for a valid non-cyclical assignment', async () => {
    (prisma.customer.findFirst as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ id: 'child1', parentCustomerId: null })
      .mockResolvedValueOnce({ id: 'parent1', parentCustomerId: null });
    (prisma.customer.update as ReturnType<typeof vi.fn>).mockImplementation(({ data }: never) => Promise.resolve({ id: 'child1', ...data }));

    const result = await service.setParentAccount(TENANT, 'child1', 'parent1');
    expect(result.parentCustomerId).toBe('parent1');
  });

  it('getHierarchyRollup sums open pipeline and won revenue across the whole subtree', async () => {
    (prisma.customer.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'root', name: 'Acme Corp' });
    (prisma.customer.findMany as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce([{ id: 'child1' }]) // children of root
      .mockResolvedValueOnce([]) // children of child1
      .mockResolvedValueOnce([{ id: 'root', name: 'Acme Corp' }, { id: 'child1', name: 'Acme West' }]); // customer name lookup
    (prisma.opportunity.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { customerId: 'root', amount: 10000, stage: 'CLOSED_WON' },
      { customerId: 'child1', amount: 5000, stage: 'PROPOSAL' },
      { customerId: 'child1', amount: 2000, stage: 'CLOSED_LOST' },
    ]);

    const rollup = await service.getHierarchyRollup(TENANT, 'root');
    expect(rollup.accountCount).toBe(2);
    expect(rollup.totalWonRevenue).toBe(10000);
    expect(rollup.totalOpenPipeline).toBe(5000);
    expect(rollup.wonOpportunityCount).toBe(1);
    expect(rollup.openOpportunityCount).toBe(1);
  });
});
