import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { ProcurementAnalyticsService } from '../procurement-analytics.service';

vi.mock('@unerp/database', () => ({
  prisma: {
    purchaseOrder: { findMany: vi.fn(), groupBy: vi.fn() },
    purchaseOrderItem: { findMany: vi.fn() },
    vendor: { findMany: vi.fn() },
    supplierScorecard: { findMany: vi.fn() },
  },
}));

const { prisma } = require('@unerp/database');

describe('ProcurementAnalyticsService (extra)', () => {
  let service: ProcurementAnalyticsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({ providers: [ProcurementAnalyticsService] }).compile();
    service = module.get<ProcurementAnalyticsService>(ProcurementAnalyticsService);
    vi.clearAllMocks();
  });

  it('should get spend by category', async () => {
    prisma.purchaseOrderItem.findMany.mockResolvedValue([
      { product: { name: 'Widget', productCategory: { name: 'Components' } }, totalAmount: 1500, quantity: 10 },
      { product: { name: 'Gadget', productCategory: { name: 'Components' } }, totalAmount: 500, quantity: 5 },
      { product: { name: 'Service', productCategory: { name: 'Services' } }, totalAmount: 2000, quantity: 1 },
    ]);

    const result = await service.getSpendByCategory('tenant-1');
    expect(result).toHaveLength(2);
    expect(result[0].category).toBe('Services');
    expect(result[0].total).toBe(2000);
    expect(result[1].category).toBe('Components');
    expect(result[1].total).toBe(2000);
  });

  it('should handle uncategorized products in spend by category', async () => {
    prisma.purchaseOrderItem.findMany.mockResolvedValue([
      { product: { name: 'Unknown', productCategory: null }, totalAmount: 100, quantity: 1 },
    ]);

    const result = await service.getSpendByCategory('tenant-1');
    expect(result).toHaveLength(1);
    expect(result[0].category).toBe('Uncategorized');
  });

  it('should get spend forecast with historical average', async () => {
    const now = new Date();
    const pastDate = new Date(now.getFullYear(), now.getMonth() - 1, 15);
    const olderDate = new Date(now.getFullYear(), now.getMonth() - 2, 10);
    prisma.purchaseOrder.findMany.mockResolvedValue([
      { id: 'po-1', totalAmount: 3000, orderDate: olderDate, status: 'APPROVED' },
      { id: 'po-2', totalAmount: 5000, orderDate: pastDate, status: 'APPROVED' },
    ]);

    const result = await service.getSpendForecast('tenant-1', 3);
    expect(result.historicalAverage).toBeGreaterThan(0);
    expect(result.forecastMonths).toBe(3);
    expect(result.forecast).toHaveLength(3);
  });

  it('should get vendor comparison with all vendors', async () => {
    prisma.purchaseOrder.findMany.mockResolvedValue([
      { id: 'po-1', vendorId: 'v1', vendor: { name: 'Vendor A' }, totalAmount: 5000, status: 'APPROVED' },
      { id: 'po-2', vendorId: 'v2', vendor: { name: 'Vendor B' }, totalAmount: 3000, status: 'APPROVED' },
      { id: 'po-3', vendorId: 'v1', vendor: { name: 'Vendor A' }, totalAmount: 2000, status: 'APPROVED' },
    ]);

    const result = await service.getVendorComparison('tenant-1');
    expect(result).toHaveLength(2);
    expect(result[0].vendorName).toBe('Vendor A');
    expect(result[0].totalSpend).toBe(7000);
    expect(result[0].orderCount).toBe(2);
    expect(result[0].avgOrderValue).toBe(3500);
    expect(result[1].vendorName).toBe('Vendor B');
    expect(result[1].totalSpend).toBe(3000);
  });

  it('should get vendor comparison with filtered vendor ids', async () => {
    const mockPo = [{ id: 'po-1', vendorId: 'v1', vendor: { name: 'Vendor A' }, totalAmount: 5000, status: 'APPROVED' }];
    prisma.purchaseOrder.findMany.mockResolvedValue(mockPo);

    const result = await service.getVendorComparison('tenant-1', ['v1']);
    expect(result).toHaveLength(1);
    expect(prisma.purchaseOrder.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ vendorId: { in: ['v1'] } }) })
    );
  });

  it('should get category breakdown with date range', async () => {
    prisma.purchaseOrderItem.findMany.mockResolvedValue([
      { product: { name: 'Widget', productCategory: { name: 'Components' } }, totalAmount: 1000, quantity: 10 },
    ]);

    const result = await service.getCategoryBreakdown('tenant-1', '2026-01-01', '2026-06-30');
    expect(result).toHaveLength(1);
    expect(result[0].percentage).toBe(100);
    expect(result[0].items).toBe(10);
  });

  it('should get purchase order cycle time', async () => {
    prisma.purchaseOrder.findMany.mockResolvedValue([
      { id: 'po-1', poNumber: 'PO-001', createdAt: new Date('2026-01-01'), orderDate: new Date('2026-01-05'), status: 'APPROVED', vendor: { name: 'Vendor A' } },
      { id: 'po-2', poNumber: 'PO-002', createdAt: new Date('2026-01-10'), orderDate: new Date('2026-01-12'), status: 'RECEIVED', vendor: { name: 'Vendor B' } },
    ]);

    const result = await service.getPurchaseOrderCycleTime('tenant-1');
    expect(result.totalOrders).toBe(2);
    expect(result.averageCycleDays).toBe(3.5);
    expect(result.minCycleDays).toBe(2);
    expect(result.maxCycleDays).toBe(4);
  });

  it('should get savings opportunities', async () => {
    prisma.vendor.findMany.mockResolvedValue([
      { id: 'v1', name: 'Vendor A' },
      { id: 'v2', name: 'Vendor B' },
    ]);
    prisma.supplierScorecard.findMany.mockResolvedValue([
      { id: 'sc-1', vendorId: 'v1', periodStart: new Date('2026-01-01'), overallScore: 65, qualityScore: 70, deliveryScore: 60, fillRateScore: 65 },
      { id: 'sc-2', vendorId: 'v2', periodStart: new Date('2026-01-01'), overallScore: 95, qualityScore: 95, deliveryScore: 95, fillRateScore: 95 },
    ]);
    prisma.purchaseOrder.findMany.mockResolvedValue([
      { id: 'po-1', vendorId: 'v1', vendor: { name: 'Vendor A' }, totalAmount: 20000, status: 'APPROVED' },
      { id: 'po-2', vendorId: 'v2', vendor: { name: 'Vendor B' }, totalAmount: 5000, status: 'APPROVED' },
    ]);

    const result = await service.getSavingsOpportunities('tenant-1');
    expect(result.opportunities).toHaveLength(2);
    expect(result.vendorsNeedingImprovement).toBe(1);
    expect(result.opportunities[0].needsImprovement).toBe(true);
    expect(result.opportunities[1].needsImprovement).toBe(false);
    expect(result.totalPotentialSavings).toBeGreaterThan(0);
  });

  it('should get vendor performance summary', async () => {
    prisma.vendor.findMany.mockResolvedValue([
      { id: 'v1', name: 'Vendor A' },
      { id: 'v2', name: 'Vendor B' },
    ]);
    prisma.supplierScorecard.findMany.mockResolvedValue([
      { id: 'sc-1', vendorId: 'v1', periodStart: new Date('2026-01-01'), periodEnd: new Date('2026-06-30'), overallScore: 85, qualityScore: 90, deliveryScore: 80, fillRateScore: 85 },
    ]);
    prisma.purchaseOrder.groupBy.mockResolvedValue([
      { vendorId: 'v1', _sum: { totalAmount: 15000 }, _count: { id: 3 } },
      { vendorId: 'v2', _sum: { totalAmount: 8000 }, _count: { id: 2 } },
    ]);

    const result = await service.getVendorPerformanceSummary('tenant-1');
    expect(result).toHaveLength(2);
    expect(result[0].vendorName).toBe('Vendor A');
    expect(result[0].totalSpend).toBe(15000);
    expect(result[0].orderCount).toBe(3);
    expect(result[0].overallScore).toBe(85);
    expect(result[1].vendorName).toBe('Vendor B');
    expect(result[1].overallScore).toBe(0);
  });

  it('should handle empty spend forecast gracefully', async () => {
    prisma.purchaseOrder.findMany.mockResolvedValue([]);
    const result = await service.getSpendForecast('tenant-1', 3);
    expect(result.historicalAverage).toBe(0);
    expect(result.forecast).toHaveLength(3);
    expect(result.forecast[0].projected).toBe(0);
  });

  it('should return empty array for spendByCategory when no items', async () => {
    prisma.purchaseOrderItem.findMany.mockResolvedValue([]);
    const result = await service.getSpendByCategory('tenant-1');
    expect(result).toEqual([]);
  });
});
