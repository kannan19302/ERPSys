import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReportingService } from '../reporting.service';

vi.mock('@unerp/database', () => {
  return {
    prisma: {
      reportWidget: {
        findMany: vi.fn(),
        create: vi.fn(),
      },
      reportView: {
        findMany: vi.fn(),
        create: vi.fn(),
      },
    },
  };
});

describe('ReportingService', () => {
  let service: ReportingService;

  beforeEach(() => {
    service = new ReportingService();
    vi.clearAllMocks();
  });

  it('should get report widgets', async () => {
    const { prisma } = await import('@unerp/database');
    const mockWidgets = [{ id: 'w-1', title: 'Sales Report', chartType: 'BAR' }];
    vi.mocked(prisma.reportWidget.findMany).mockResolvedValue(mockWidgets as any);

    const res = await service.getWidgets('tenant-123');
    expect(res).toBeDefined();
    expect(res[0]?.title).toBe('Sales Report');
  });
});
