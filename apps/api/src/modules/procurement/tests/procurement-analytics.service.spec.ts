import { Test, TestingModule } from '@nestjs/testing';
import { ProcurementAnalyticsService } from '../procurement-analytics.service';

jest.mock('@unerp/database', () => ({
  prisma: {
    purchaseOrder: { findMany: jest.fn(), groupBy: jest.fn() },
    purchaseOrderItem: { findMany: jest.fn() },
    vendor: { findMany: jest.fn() },
    supplierScorecard: { findMany: jest.fn() },
  },
}));

const { prisma } = require('@unerp/database');

describe('ProcurementAnalyticsService', () => {
  let service: ProcurementAnalyticsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({ providers: [ProcurementAnalyticsService] }).compile();
    service = module.get<ProcurementAnalyticsService>(ProcurementAnalyticsService);
    jest.clearAllMocks();
  });

  it('should get dashboard with all sections', async () => {
    (prisma.purchaseOrder.findMany as jest.Mock).mockResolvedValue([
      { id: 'po-1', vendorId: 'v1', vendor: { name: 'Vendor A' }, status: 'APPROVED', totalAmount: 1000, orderDate: new Date('2026-01-15') },
    ]);
    (prisma.supplierScorecard.findMany as jest.Mock).mockResolvedValue([
      { id: 'sc-1', vendorId: 'v1', periodStart: new Date('2026-01-01'), overallScore: 85, qualityScore: 90, deliveryScore: 80, fillRateScore: 85 },
    ]);
    (prisma.vendor.findMany as jest.Mock).mockResolvedValue([{ id: 'v1', name: 'Vendor A' }]);
    (prisma.purchaseOrderItem.findMany as jest.Mock).mockResolvedValue([
      { product: { name: 'Widget', productCategory: { name: 'Components' } }, totalAmount: 500 },
    ]);
    (prisma.purchaseOrder.groupBy as jest.Mock).mockResolvedValue([{ vendorId: 'v1', _sum: { totalAmount: 1000 }, _count: { id: 1 } }]);

    const dash = await service.getDashboard('tenant-1');
    expect(dash).toHaveProperty('spendByVendor');
    expect(dash).toHaveProperty('spendByStatus');
    expect(dash).toHaveProperty('monthlyTrend');
    expect(dash).toHaveProperty('budgetOverview');
    expect(dash).toHaveProperty('vendorPerformance');
    expect(dash).toHaveProperty('scorecardStats');
  });

  it('should compute spend by vendor with percentages', async () => {
    (prisma.purchaseOrder.findMany as jest.Mock).mockResolvedValue([
      { id: 'po-1', vendorId: 'v1', vendor: { name: 'Vendor A' }, totalAmount: 1000, status: 'APPROVED', orderDate: new Date() },
      { id: 'po-2', vendorId: 'v2', vendor: { name: 'Vendor B' }, totalAmount: 2000, status: 'APPROVED', orderDate: new Date() },
    ]);

    const result = await service.getSpendByVendor('tenant-1');
    expect(result).toHaveLength(2);
    expect(result[0].vendorName).toBe('Vendor B');
    expect(result[0].total).toBe(2000);
    expect(result[1].total).toBe(1000);
  });

  it('should compute spend by status', async () => {
    (prisma.purchaseOrder.findMany as jest.Mock).mockResolvedValue([
      { id: 'po-1', status: 'DRAFT', totalAmount: 500 },
      { id: 'po-2', status: 'APPROVED', totalAmount: 1500 },
    ]);

    const result = await service.getSpendByStatus('tenant-1');
    expect(result.DRAFT.total).toBe(500);
    expect(result.APPROVED.count).toBe(1);
  });

  it('should get monthly spend trend', async () => {
    (prisma.purchaseOrder.findMany as jest.Mock).mockResolvedValue([
      { id: 'po-1', totalAmount: 1000, orderDate: new Date('2026-01-10'), status: 'APPROVED' },
      { id: 'po-2', totalAmount: 2000, orderDate: new Date('2026-01-20'), status: 'APPROVED' },
    ]);

    const result = await service.getMonthlySpendTrend('tenant-1', 12);
    expect(result).toHaveLength(1);
    expect(result[0].month).toBe('2026-01');
    expect(result[0].total).toBe(3000);
  });

  it('should get budget overview', async () => {
    (prisma.purchaseOrder.findMany as jest.Mock).mockResolvedValue([
      { id: 'po-1', status: 'DRAFT', totalAmount: 500 },
      { id: 'po-2', status: 'APPROVED', totalAmount: 1500 },
    ]);

    const result = await service.getBudgetOverview('tenant-1');
    expect(result.totalBudgeted).toBe(2000);
    expect(result.totalSpent).toBe(1500);
    expect(result.draftAmount).toBe(500);
    expect(result.remaining).toBe(500);
  });
});
