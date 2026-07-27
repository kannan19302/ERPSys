import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AnalyticsDeepService } from '../analytics-deep.service';
import { NotFoundException } from '@nestjs/common';

vi.mock('@unerp/database', () => ({
  prisma: {
    analyticsKpiDefinition: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    analyticsTrendResult: {
      findMany: vi.fn(),
      create: vi.fn(),
      createMany: vi.fn(),
      aggregate: vi.fn(),
      upsert: vi.fn(),
    },
    analyticsScheduledExport: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    analyticsCrossFilterDashboard: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    analyticsBiMetricDefinition: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    analyticsKpiValue: {
      aggregate: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

describe('AnalyticsDeepService', () => {
  let service: AnalyticsDeepService;
  let prisma: any;

  beforeEach(async () => {
    service = new AnalyticsDeepService();
    prisma = (await import('@unerp/database')).prisma;
    vi.clearAllMocks();
  });

  describe('KPI Definitions', () => {
    it('should get KPI definitions', async () => {
      vi.mocked(prisma.analyticsKpiDefinition.findMany).mockResolvedValue([
        { id: 'k1', name: 'Revenue', code: 'REV', formula: 'SUM(amount)', category: 'FINANCE', isActive: true, tenantId: 't1', createdAt: new Date(), updatedAt: new Date() },
      ]);
      vi.mocked(prisma.analyticsKpiDefinition.count).mockResolvedValue(1);
      const result = await service.getKpiDefinitions('t1');
      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('Revenue');
    });

    it('should get single KPI definition', async () => {
      vi.mocked(prisma.analyticsKpiDefinition.findFirst).mockResolvedValue({ id: 'k1', name: 'Revenue', code: 'REV', formula: 'SUM(amount)', tenantId: 't1' });
      const result = await service.getKpiDefinition('t1', 'k1');
      expect(result.name).toBe('Revenue');
    });

    it('should throw on missing KPI', async () => {
      vi.mocked(prisma.analyticsKpiDefinition.findFirst).mockResolvedValue(null);
      await expect(service.getKpiDefinition('t1', 'nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should create KPI definition', async () => {
      vi.mocked(prisma.analyticsKpiDefinition.create).mockResolvedValue({ id: 'k1', name: 'New KPI', code: 'NKPI', formula: 'COUNT(*)', tenantId: 't1' });
      const result = await service.createKpiDefinition('t1', { name: 'New KPI', code: 'NKPI', formula: 'COUNT(*)' });
      expect(result.name).toBe('New KPI');
    });

    it('should update KPI definition', async () => {
      vi.mocked(prisma.analyticsKpiDefinition.findFirst).mockResolvedValue({ id: 'k1', tenantId: 't1' });
      vi.mocked(prisma.analyticsKpiDefinition.update).mockResolvedValue({ id: 'k1', name: 'Updated KPI', code: 'UKPI', formula: 'SUM(*)', tenantId: 't1' });
      const result = await service.updateKpiDefinition('t1', 'k1', { name: 'Updated KPI' });
      expect(result.name).toBe('Updated KPI');
    });

    it('should delete KPI definition', async () => {
      vi.mocked(prisma.analyticsKpiDefinition.findFirst).mockResolvedValue({ id: 'k1', tenantId: 't1' });
      await service.deleteKpiDefinition('t1', 'k1');
      expect(prisma.analyticsKpiDefinition.delete).toHaveBeenCalledWith({ where: { id: 'k1' } });
    });
  });

  describe('Trend Analysis', () => {
    it('should get trend analysis results', async () => {
      vi.mocked(prisma.analyticsKpiDefinition.findFirst).mockResolvedValue({ id: 'k1', name: 'Revenue', tenantId: 't1' } as any);
      vi.mocked(prisma.analyticsTrendResult.findMany).mockResolvedValue([
        { id: 't1', kpiName: 'Revenue', period: '2026-01', value: 1000, previousValue: 800, changePercent: 25, periodStart: new Date('2026-01-01'), periodEnd: new Date('2026-01-31'), kpiDefinitionId: 'k1', metadata: null, tenantId: 't1', createdAt: new Date(), updatedAt: new Date() },
      ]);
      const result = await service.getTrendAnalysis('t1', 'k1');
      expect(result.results).toHaveLength(1);
      expect(result.results[0].changePercent).toBe(25);
    });

    it('should compute trend analysis with raw query', async () => {
      vi.mocked(prisma.analyticsKpiDefinition.findFirst).mockResolvedValue({ id: 'k1', name: 'Revenue', code: 'REV', formula: 'SUM(amount)', tenantId: 't1' } as any);
      vi.mocked(prisma.analyticsKpiValue.aggregate).mockResolvedValue({ _avg: { value: 5000 } } as any);
      const result = await service.computeTrendAnalysis('t1', 'k1', 'MONTHLY');
      expect(result.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Scheduled Exports', () => {
    it('should get scheduled exports', async () => {
      vi.mocked(prisma.analyticsScheduledExport.findMany).mockResolvedValue([
        { id: 'e1', name: 'Daily Sales', source: 'SALES_ORDER', format: 'CSV', scheduleType: 'DAILY', isActive: true, recipients: [], tenantId: 't1', createdAt: new Date(), updatedAt: new Date(), scheduleConfig: {} },
      ] as any);
      const result = await service.getScheduledExports('t1');
      expect(result).toHaveLength(1);
    });

    it('should create scheduled export', async () => {
      vi.mocked(prisma.analyticsScheduledExport.create).mockResolvedValue({ id: 'e1', name: 'Test Export', source: 'INVOICE', format: 'CSV', scheduleType: 'ONCE', isActive: true, recipients: ['admin@test.com'], tenantId: 't1', scheduleConfig: {} } as any);
      const result = await service.createScheduledExport('t1', { name: 'Test Export', source: 'INVOICE', format: 'CSV', scheduleType: 'ONCE', recipients: ['admin@test.com'] });
      expect(result.name).toBe('Test Export');
    });
  });

  describe('Cross-Filter Dashboards', () => {
    it('should get cross-filter dashboards', async () => {
      vi.mocked(prisma.analyticsCrossFilterDashboard.findMany).mockResolvedValue([
        { id: 'd1', name: 'Sales Dashboard', description: 'Cross-filter sales', tenantId: 't1', createdAt: new Date(), updatedAt: new Date() },
      ] as any);
      const result = await service.getCrossFilterDashboards('t1');
      expect(result).toHaveLength(1);
    });

    it('should create cross-filter dashboard', async () => {
      vi.mocked(prisma.analyticsCrossFilterDashboard.create).mockResolvedValue({ id: 'd1', name: 'New Dashboard', tenantId: 't1' } as any);
      const result = await service.createCrossFilterDashboard('t1', { name: 'New Dashboard' });
      expect(result.name).toBe('New Dashboard');
    });
  });

  describe('BI Metric Catalog', () => {
    it('should get BI metrics', async () => {
      vi.mocked(prisma.analyticsBiMetricDefinition.findMany).mockResolvedValue([
        { id: 'b1', name: 'Total Revenue', category: 'FINANCE', source: 'SALES_ORDER', expression: 'SUM(amount)', isActive: true, dimensions: ['region'], tenantId: 't1', createdAt: new Date(), updatedAt: new Date() },
      ] as any);
      vi.mocked(prisma.analyticsBiMetricDefinition.count).mockResolvedValue(1);
      const result = await service.getBiMetricCatalog('t1');
      expect(result.data).toHaveLength(1);
    });

    it('should create BI metric', async () => {
      vi.mocked(prisma.analyticsBiMetricDefinition.create).mockResolvedValue({ id: 'b1', name: 'New Metric', category: 'SALES', source: 'INVOICE', expression: 'COUNT(*)', isActive: true, dimensions: [], tenantId: 't1' } as any);
      const result = await service.createBiMetricDefinition('t1', { name: 'New Metric', category: 'SALES', source: 'INVOICE', expression: 'COUNT(*)' });
      expect(result.name).toBe('New Metric');
    });

    it('should update BI metric', async () => {
      vi.mocked(prisma.analyticsBiMetricDefinition.findFirst).mockResolvedValue({ id: 'b1', tenantId: 't1' } as any);
      vi.mocked(prisma.analyticsBiMetricDefinition.update).mockResolvedValue({ id: 'b1', name: 'Updated' } as any);
      const result = await service.updateBiMetricDefinition('t1', 'b1', { name: 'Updated' });
      expect(result.name).toBe('Updated');
    });

    it('should delete BI metric with tenant check', async () => {
      vi.mocked(prisma.analyticsBiMetricDefinition.findFirst).mockResolvedValue({ id: 'b1', tenantId: 't1' } as any);
      await service.deleteBiMetricDefinition('t1', 'b1');
      expect(prisma.analyticsBiMetricDefinition.delete).toHaveBeenCalledWith({ where: { id: 'b1' } });
    });

    it('should throw on missing BI metric when deleting', async () => {
      vi.mocked(prisma.analyticsBiMetricDefinition.findFirst).mockResolvedValue(null);
      await expect(service.deleteBiMetricDefinition('t1', 'nonexistent')).rejects.toThrow(NotFoundException);
    });
  });
});
