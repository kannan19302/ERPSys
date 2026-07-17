import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CrmSegmentsService } from '../crm-segments.service';

vi.mock('@unerp/database', () => ({
  prisma: {
    segment: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    segmentMember: {
      deleteMany: vi.fn(),
      createMany: vi.fn(),
      findMany: vi.fn(),
    },
    lead: { findMany: vi.fn() },
    contact: { findMany: vi.fn() },
    customer: { findMany: vi.fn() },
    $transaction: vi.fn((ops: unknown[]) => Promise.all(ops as Promise<unknown>[])),
  },
}));

import { prisma } from '@unerp/database';

const TENANT = 'tenant-1';

describe('CrmSegmentsService', () => {
  let service: CrmSegmentsService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CrmSegmentsService();
  });

  it('creates a segment', async () => {
    (prisma.segment.create as ReturnType<typeof vi.fn>).mockImplementation(({ data }) =>
      Promise.resolve({ id: 'seg1', ...data }),
    );
    const seg = await service.createSegment(TENANT, {
      name: 'Enterprise leads',
      entity: 'LEAD',
      criteria: { combinator: 'AND', rules: [{ field: 'industry', op: 'eq', value: 'TECH' }] },
    });
    expect(seg.name).toBe('Enterprise leads');
  });

  it('evaluates a segment and materializes matching members', async () => {
    (prisma.segment.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'seg1', tenantId: TENANT, entity: 'LEAD',
      criteria: { combinator: 'AND', rules: [{ field: 'industry', op: 'eq', value: 'TECH' }] },
    });
    (prisma.lead.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 'l1', industry: 'TECH' },
      { id: 'l2', industry: 'RETAIL' },
      { id: 'l3', industry: 'TECH' },
    ]);
    (prisma.segmentMember.deleteMany as ReturnType<typeof vi.fn>).mockResolvedValue({ count: 0 });
    (prisma.segmentMember.createMany as ReturnType<typeof vi.fn>).mockResolvedValue({ count: 2 });

    const result = await service.evaluate(TENANT, 'seg1');
    expect(result.count).toBe(2);
    const createManyCall = (prisma.segmentMember.createMany as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(createManyCall.data).toEqual([
      { segmentId: 'seg1', entityId: 'l1' },
      { segmentId: 'seg1', entityId: 'l3' },
    ]);
  });
});
