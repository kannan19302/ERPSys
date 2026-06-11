import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AnalyticsService } from '../analytics.service';

vi.mock('@unerp/database', () => {
  return {
    prisma: {
      dashboard: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
      },
      report: {
        findMany: vi.fn(),
        create: vi.fn(),
      },
      kPI: {
        findMany: vi.fn(),
        createMany: vi.fn(),
      },
      invoice: {
        aggregate: vi.fn(),
      },
      employee: {
        count: vi.fn(),
      },
      product: {
        count: vi.fn(),
      },
      organization: {
        findFirst: vi.fn(),
      },
    },
  };
});

describe('AnalyticsService', () => {
  let analyticsService: AnalyticsService;

  beforeEach(() => {
    analyticsService = new AnalyticsService();
    vi.clearAllMocks();
  });

  it('should fetch dashboards', async () => {
    const { prisma } = await import('@unerp/database');
    const mockDash = [{ id: 'd-1', name: 'Sales Dash' }];
    vi.mocked(prisma.dashboard.findMany).mockResolvedValue(mockDash as any);

    const res = await analyticsService.getDashboards('tenant-123');
    expect(res).toBeDefined();
    expect(res[0]?.name).toBe('Sales Dash');
  });

  it('should fetch reports', async () => {
    const { prisma } = await import('@unerp/database');
    const mockReports = [{ id: 'r-1', name: 'Inventory Report' }];
    vi.mocked(prisma.report.findMany).mockResolvedValue(mockReports as any);

    const res = await analyticsService.getReports('tenant-123');
    expect(res).toBeDefined();
    expect(res[0]?.name).toBe('Inventory Report');
  });

  it('should fetch KPIs', async () => {
    const { prisma } = await import('@unerp/database');
    const mockKPIs = [{ id: 'k-1', code: 'TOTAL_REVENUE', value: '$10,000', trend: '[]' }];
    vi.mocked(prisma.kPI.findMany).mockResolvedValue(mockKPIs as any);

    const res = await analyticsService.getKPIs('tenant-123');
    expect(res).toBeDefined();
    expect(res[0]?.code).toBe('TOTAL_REVENUE');
  });
});
