import { Test, TestingModule } from '@nestjs/testing';
import { SupplierScorecardService } from '../supplier-scorecard.service';
import { NotFoundException } from '@nestjs/common';

jest.mock('@unerp/database', () => ({
  prisma: {
    supplierScorecard: { findMany: jest.fn(), findFirst: jest.fn(), count: jest.fn(), create: jest.fn() },
    vendor: { findFirst: jest.fn() },
    purchaseReceipt: { findMany: jest.fn() },
    purchaseOrderItem: { findMany: jest.fn() },
  },
}));

const { prisma } = require('@unerp/database');

describe('SupplierScorecardService', () => {
  let service: SupplierScorecardService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({ providers: [SupplierScorecardService] }).compile();
    service = module.get<SupplierScorecardService>(SupplierScorecardService);
    jest.clearAllMocks();
  });

  it('should list supplier scorecards', async () => {
    const mockItems = [{ id: '1', vendor: { name: 'Vendor A' }, overallScore: 85, periodStart: new Date() }];
    (prisma.supplierScorecard.findMany as jest.Mock).mockResolvedValue(mockItems);
    (prisma.supplierScorecard.count as jest.Mock).mockResolvedValue(1);

    const result = await service.list('tenant-1', {});
    expect(result.data).toEqual(mockItems);
    expect(result.total).toBe(1);
  });

  it('should get scorecard by id', async () => {
    const mockScorecard = { id: '1', vendor: { name: 'Vendor A' }, overallScore: 90 };
    (prisma.supplierScorecard.findFirst as jest.Mock).mockResolvedValue(mockScorecard);

    const result = await service.getById('tenant-1', '1');
    expect(result.id).toBe('1');
  });

  it('should throw NotFoundException for missing scorecard', async () => {
    (prisma.supplierScorecard.findFirst as jest.Mock).mockResolvedValue(null);
    await expect(service.getById('tenant-1', 'nonexistent')).rejects.toThrow(NotFoundException);
  });

  it('should compute and save a scorecard', async () => {
    (prisma.vendor.findFirst as jest.Mock).mockResolvedValue({ id: 'vendor-1' });
    (prisma.purchaseReceipt.findMany as jest.Mock).mockResolvedValue([
      { id: 'rec-1', receivedDate: new Date('2026-01-15'), purchaseOrder: { orderDate: new Date('2026-01-20'), poNumber: 'PO-001' }, lineItems: [{ acceptedQty: 10, rejectedQty: 1 }] },
    ]);
    (prisma.purchaseOrderItem.findMany as jest.Mock).mockResolvedValue([
      { quantity: 10, receivedQty: 9, purchaseOrder: { status: 'RECEIVED' } },
    ]);
    (prisma.supplierScorecard.create as jest.Mock).mockResolvedValue({ id: 'new-sc', vendor: { name: 'Vendor A' }, overallScore: 88, qualityScore: 90, deliveryScore: 100, fillRateScore: 90 });

    const result = await service.computeAndSave('tenant-1', 'vendor-1', '2026-01-01', '2026-06-30');
    expect(result.id).toBe('new-sc');
    expect(result.overallScore).toBe(88);
  });

  it('should get vendor trend', async () => {
    const mockScorecards = [
      { id: '1', vendorId: 'vendor-1', periodStart: new Date('2026-01-01'), qualityScore: 90, deliveryScore: 85, fillRateScore: 95, overallScore: 90 },
      { id: '2', vendorId: 'vendor-1', periodStart: new Date('2026-02-01'), qualityScore: 92, deliveryScore: 88, fillRateScore: 96, overallScore: 92 },
    ];
    (prisma.supplierScorecard.findMany as jest.Mock).mockResolvedValue(mockScorecards);

    const result = await service.getVendorTrend('tenant-1', 'vendor-1', 2);
    expect(result.vendorId).toBe('vendor-1');
    expect(result.scorecards.length).toBe(2);
    expect(result.trend.overall).toEqual([90, 92]);
  });

  it('should get stats', async () => {
    (prisma.supplierScorecard.findMany as jest.Mock).mockResolvedValue([
      { id: '1', vendorId: 'v1', periodStart: new Date('2026-01-01'), overallScore: 80, qualityScore: 85, deliveryScore: 75, fillRateScore: 80 },
      { id: '2', vendorId: 'v2', periodStart: new Date('2026-02-01'), overallScore: 90, qualityScore: 95, deliveryScore: 85, fillRateScore: 90 },
    ]);

    const stats = await service.getStats('tenant-1');
    expect(stats.totalScorecards).toBe(2);
    expect(stats.vendorsScored).toBe(2);
    expect(stats.averageOverallScore).toBe(85);
  });
});
