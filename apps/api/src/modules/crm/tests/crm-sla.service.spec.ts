import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CrmSlaService } from '../crm-sla.service';

vi.mock('@unerp/database', () => ({
  prisma: {
    slaPolicy: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    slaBreach: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    case: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { prisma } from '@unerp/database';

const TENANT = 'tenant-1';

describe('CrmSlaService', () => {
  let service: CrmSlaService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CrmSlaService();
  });

  it('creates an SLA policy', async () => {
    (prisma.slaPolicy.create as ReturnType<typeof vi.fn>).mockImplementation(({ data }) =>
      Promise.resolve({ id: 'p1', ...data }),
    );
    const p = await service.createPolicy(TENANT, {
      name: 'Urgent', entity: 'CASE', priority: 'URGENT', firstResponseMins: 30, resolutionMins: 240,
    });
    expect(p.priority).toBe('URGENT');
    expect(p.active).toBe(true);
  });

  it('applyToCase stamps first-response and resolve-by deadlines from the matching policy', async () => {
    const createdAt = new Date('2026-01-01T00:00:00Z');
    (prisma.case.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'c1', tenantId: TENANT, priority: 'HIGH', createdAt,
    });
    (prisma.slaPolicy.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'p1', firstResponseMins: 60, resolutionMins: 480,
    });
    (prisma.case.update as ReturnType<typeof vi.fn>).mockResolvedValue({});

    const result = await service.applyToCase(TENANT, 'c1');
    expect(result?.policyId).toBe('p1');
    expect(result?.slaFirstResponseAt.getTime()).toBe(createdAt.getTime() + 60 * 60_000);
    expect(result?.slaResolveBy.getTime()).toBe(createdAt.getTime() + 480 * 60_000);
  });

  it('detectBreaches creates SlaBreach rows for missed deadlines and marks the case', async () => {
    const past = new Date(Date.now() - 60_000);
    (prisma.case.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        id: 'c1', priority: 'HIGH', firstResponseAt: null,
        slaFirstResponseAt: past, slaResolveBy: past, slaBreached: false,
      },
    ]);
    (prisma.slaPolicy.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'p1' });
    (prisma.slaBreach.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (prisma.slaBreach.create as ReturnType<typeof vi.fn>).mockResolvedValue({});
    (prisma.case.update as ReturnType<typeof vi.fn>).mockResolvedValue({});

    const result = await service.detectBreaches(TENANT);
    expect(result.scanned).toBe(1);
    expect(result.breachesCreated).toBe(2);
    expect(result.casesMarked).toBe(1);
  });
});
