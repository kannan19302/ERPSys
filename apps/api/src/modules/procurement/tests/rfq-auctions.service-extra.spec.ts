import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { RfqAuctionsService } from '../rfq-auctions.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

vi.mock('@unerp/database', () => ({
  prisma: {
    rFQ: { findMany: vi.fn(), findFirst: vi.fn(), count: vi.fn(), create: vi.fn(), update: vi.fn() },
    rFQAuctionBid: { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
    supplierQuotation: { create: vi.fn() },
  },
}));

const { prisma } = require('@unerp/database');

describe('RfqAuctionsService (extra)', () => {
  let service: RfqAuctionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({ providers: [RfqAuctionsService] }).compile();
    service = module.get<RfqAuctionsService>(RfqAuctionsService);
    vi.clearAllMocks();
  });

  it('should get auction by id', async () => {
    const mockAuction = { id: '1', rfqNumber: 'AUC-0001', isAuction: true, auctionBids: [], supplierQuotations: [] };
    prisma.rFQ.findFirst.mockResolvedValue(mockAuction);

    const result = await service.getAuctionById('tenant-1', '1');
    expect(result.id).toBe('1');
  });

  it('should throw NotFoundException for missing auction', async () => {
    prisma.rFQ.findFirst.mockResolvedValue(null);
    await expect(service.getAuctionById('tenant-1', 'nonexistent')).rejects.toThrow(NotFoundException);
  });

  it('should enforce tenant isolation on getAuctionById', async () => {
    prisma.rFQ.findFirst.mockResolvedValue(null);
    await expect(service.getAuctionById('tenant-2', '1')).rejects.toThrow(NotFoundException);
    expect(prisma.rFQ.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: '1', tenantId: 'tenant-2', isAuction: true } })
    );
  });

  it('should update auction status from DRAFT to SENT', async () => {
    prisma.rFQ.findFirst.mockResolvedValue({ id: '1', isAuction: true, status: 'DRAFT' });
    prisma.rFQ.update.mockResolvedValue({ id: '1', status: 'SENT' });

    const result = await service.updateAuctionStatus('tenant-1', '1', 'SENT');
    expect(result.status).toBe('SENT');
  });

  it('should reject invalid auction transition from SENT to DRAFT', async () => {
    prisma.rFQ.findFirst.mockResolvedValue({ id: '1', isAuction: true, status: 'SENT' });
    await expect(service.updateAuctionStatus('tenant-1', '1', 'DRAFT')).rejects.toThrow(BadRequestException);
  });

  it('should list bids for an auction', async () => {
    const mockBids = [
      { id: 'bid-1', vendor: { name: 'Vendor A' }, bidAmount: 1000 },
      { id: 'bid-2', vendor: { name: 'Vendor B' }, bidAmount: 1200 },
    ];
    prisma.rFQAuctionBid.findMany.mockResolvedValue(mockBids);

    const result = await service.listBids('tenant-1', 'auction-1');
    expect(result).toHaveLength(2);
    expect(result[0].bidAmount).toBe(1000);
  });

  it('should extend auction end date', async () => {
    prisma.rFQ.findFirst.mockResolvedValue({ id: '1', isAuction: true, status: 'SENT' });
    prisma.rFQ.update.mockResolvedValue({ id: '1', auctionEndsAt: new Date('2026-07-01') });

    const result = await service.extendAuction('tenant-1', '1', '2026-07-01');
    expect(result.id).toBe('1');
  });

  it('should throw BadRequestException when extending non-open auction', async () => {
    prisma.rFQ.findFirst.mockResolvedValue({ id: '1', isAuction: true, status: 'COMPLETED' });
    await expect(service.extendAuction('tenant-1', '1', '2026-07-01')).rejects.toThrow(BadRequestException);
  });

  it('should cancel auction and withdraw pending bids', async () => {
    prisma.rFQ.findFirst.mockResolvedValue({ id: '1', isAuction: true, status: 'SENT', notes: 'Original notes' });
    prisma.rFQAuctionBid.updateMany.mockResolvedValue({ count: 2 });
    prisma.rFQ.update.mockResolvedValue({ id: '1', status: 'CANCELLED' });

    const result = await service.cancelAuction('tenant-1', '1', 'Budget freeze');
    expect(result.status).toBe('CANCELLED');
    expect(prisma.rFQAuctionBid.updateMany).toHaveBeenCalled();
  });

  it('should throw BadRequestException when cancelling completed auction', async () => {
    prisma.rFQ.findFirst.mockResolvedValue({ id: '1', isAuction: true, status: 'COMPLETED' });
    await expect(service.cancelAuction('tenant-1', '1')).rejects.toThrow(BadRequestException);
  });

  it('should get auctions by vendor', async () => {
    prisma.rFQ.findMany.mockResolvedValue([{ id: '1', _count: { auctionBids: 2 } }]);
    prisma.rFQ.count.mockResolvedValue(1);
    const result = await service.getAuctionsByVendor('tenant-1', 'vendor-1', {});
    expect(result.total).toBe(1);
  });

  it('should get bid history with pagination', async () => {
    prisma.rFQAuctionBid.findMany.mockResolvedValue([{ id: 'bid-1', vendor: { name: 'Vendor A' }, bidAmount: 1000 }]);
    prisma.rFQAuctionBid.count.mockResolvedValue(1);
    const result = await service.getBidHistory('tenant-1', 'auction-1', { page: 1, limit: 20 });
    expect(result.total).toBe(1);
  });

  it('should get auction analytics', async () => {
    prisma.rFQ.findMany.mockResolvedValue([
      { id: '1', status: 'COMPLETED', _count: { auctionBids: 3 }, auctionBids: [{ bidAmount: 1000, status: 'WINNING' }] },
      { id: '2', status: 'SENT', _count: { auctionBids: 1 }, auctionBids: [] },
    ]);
    const analytics = await service.getAuctionAnalytics('tenant-1');
    expect(analytics.totalAuctions).toBe(2);
    expect(analytics.completedAuctions).toBe(1);
    expect(analytics.totalBids).toBe(4);
    expect(analytics.completionRate).toBe(50);
    expect(analytics.totalSavings).toBe(1000);
  });

  it('should getStats with average bids per auction', async () => {
    prisma.rFQ.findMany.mockResolvedValue([
      { id: '1', status: 'COMPLETED', isAuction: true },
      { id: '2', status: 'SENT', isAuction: true },
    ]);
    prisma.rFQAuctionBid.findMany.mockResolvedValue([
      { id: 'b1', bidAmount: 1000, status: 'WINNING' },
      { id: 'b2', bidAmount: 900, status: 'SUBMITTED' },
      { id: 'b3', bidAmount: 800, status: 'WINNING' },
    ]);
    const stats = await service.getStats('tenant-1');
    expect(stats.totalAuctions).toBe(2);
    expect(stats.totalBids).toBe(3);
    expect(stats.averageBidsPerAuction).toBe(1.5);
    expect(stats.totalSavings).toBe(1800);
  });

  it('should handle empty auction list gracefully', async () => {
    prisma.rFQ.findMany.mockResolvedValue([]);
    prisma.rFQ.count.mockResolvedValue(0);
    const result = await service.listAuctions('tenant-1', {});
    expect(result.data).toEqual([]);
    expect(result.total).toBe(0);
  });
});
