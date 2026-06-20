import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AnalyticsService } from '../analytics.service';

vi.mock('@unerp/database', () => {
  return {
    prisma: {
      dashboard: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
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
        findMany: vi.fn(),
      },
      employee: {
        count: vi.fn(),
        findMany: vi.fn(),
      },
      product: {
        count: vi.fn(),
        findMany: vi.fn(),
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
    vi.mocked(prisma.dashboard.findMany).mockResolvedValue(mockDash as never);

    const res = await analyticsService.getDashboards('tenant-123');
    expect(res).toBeDefined();
    expect(res[0]?.name).toBe('Sales Dash');
  });

  it('should fetch reports', async () => {
    const { prisma } = await import('@unerp/database');
    const mockReports = [{ id: 'r-1', name: 'Inventory Report' }];
    vi.mocked(prisma.report.findMany).mockResolvedValue(mockReports as never);

    const res = await analyticsService.getReports('tenant-123');
    expect(res).toBeDefined();
    expect(res[0]?.name).toBe('Inventory Report');
  });

  it('should fetch KPIs', async () => {
    const { prisma } = await import('@unerp/database');
    const mockKPIs = [{ id: 'k-1', code: 'TOTAL_REVENUE', value: '$10,000', trend: '[]' }];
    vi.mocked(prisma.kPI.findMany).mockResolvedValue(mockKPIs as never);

    const res = await analyticsService.getKPIs('tenant-123');
    expect(res).toBeDefined();
    expect(res[0]?.code).toBe('TOTAL_REVENUE');
  });

  it('should enrich KPIs with goal/target and change %', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.kPI.findMany).mockResolvedValue([
      { id: 'k-1', code: 'TOTAL_REVENUE', value: '$10,000', unit: 'USD', trend: '[8,10]' },
    ] as never);

    const res = await analyticsService.getKPIs('tenant-123');
    expect(res[0]?.numericValue).toBe(10000);
    expect(res[0]?.target).toBe(12000);
    expect(res[0]?.progressPct).toBe(83);
    expect(res[0]?.changePct).toBe(25);
  });

  it('should drill down into TOTAL_REVENUE invoices', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.invoice.findMany).mockResolvedValue([
      { invoiceNumber: 'INV-1', totalAmount: 500, status: 'PAID', issueDate: new Date('2026-01-15') },
    ] as never);

    const res = await analyticsService.getKpiDrilldown('tenant-123', 'TOTAL_REVENUE');
    expect(res.columns).toContain('invoiceNumber');
    expect(res.rows[0]?.totalAmount).toBe(500);
  });

  it('should detect overdue receivables in insights', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.invoice.findMany).mockResolvedValue([
      { invoiceNumber: 'INV-OVERDUE', totalAmount: 5000, paidAmount: 0, status: 'SENT', issueDate: new Date('2026-01-01'), dueDate: new Date('2026-02-01') },
    ] as never);
    vi.mocked(prisma.product.findMany).mockResolvedValue([] as never);

    const res = await analyticsService.getInsights('tenant-123');
    expect(res.insights.some(i => i.id === 'ar-overdue')).toBe(true);
  });

  it('should export invoices as CSV', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.invoice.findMany).mockResolvedValue([
      { invoiceNumber: 'INV-1', status: 'PAID', issueDate: new Date('2026-01-15'), dueDate: new Date('2026-02-15'), totalAmount: 1000, paidAmount: 1000, currency: 'USD' },
    ] as never);

    const res = await analyticsService.exportDataset('tenant-123', 'invoices');
    expect(res.filename).toContain('invoices-export');
    expect(res.content).toContain('invoiceNumber');
    expect(res.content).toContain('INV-1');
    expect(res.rowCount).toBe(1);
  });
});
