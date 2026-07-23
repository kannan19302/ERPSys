import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { VendorRmaService } from '../vendor-rma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

vi.mock('@unerp/database', () => ({
  prisma: {
    vendorRmaRequest: { findMany: vi.fn(), findFirst: vi.fn(), count: vi.fn(), create: vi.fn(), update: vi.fn() },
    vendorReturnShipment: { findMany: vi.fn(), findFirst: vi.fn(), count: vi.fn(), create: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
    vendor: { findFirst: vi.fn() },
  },
}));

const { prisma } = require('@unerp/database');

describe('VendorRmaService (extra)', () => {
  let service: VendorRmaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({ providers: [VendorRmaService] }).compile();
    service = module.get<VendorRmaService>(VendorRmaService);
    vi.clearAllMocks();
  });

  it('should get RMA by id', async () => {
    const mockRma = { id: '1', rmaNumber: 'RMA-0001', vendor: { name: 'Vendor A' }, reasonCode: {}, shipments: [] };
    prisma.vendorRmaRequest.findFirst.mockResolvedValue(mockRma);

    const result = await service.getRmaById('tenant-1', '1');
    expect(result.id).toBe('1');
  });

  it('should throw NotFoundException for missing RMA', async () => {
    prisma.vendorRmaRequest.findFirst.mockResolvedValue(null);
    await expect(service.getRmaById('tenant-1', 'nonexistent')).rejects.toThrow(NotFoundException);
  });

  it('should enforce tenant isolation on getRmaById', async () => {
    prisma.vendorRmaRequest.findFirst.mockResolvedValue(null);
    await expect(service.getRmaById('tenant-2', '1')).rejects.toThrow(NotFoundException);
    expect(prisma.vendorRmaRequest.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: '1', tenantId: 'tenant-2' } })
    );
  });

  it('should update shipment status to PACKED', async () => {
    prisma.vendorReturnShipment.findFirst.mockResolvedValue({ id: 'shp-1', status: 'PENDING' });
    prisma.vendorReturnShipment.update.mockResolvedValue({ id: 'shp-1', status: 'PACKED' });

    const result = await service.updateShipmentStatus('tenant-1', 'shp-1', 'PACKED');
    expect(result.status).toBe('PACKED');
  });

  it('should update shipment status to DELIVERED with credit info', async () => {
    prisma.vendorReturnShipment.findFirst.mockResolvedValue({ id: 'shp-1', status: 'SHIPPED' });
    prisma.vendorReturnShipment.update.mockResolvedValue({ id: 'shp-1', status: 'DELIVERED', creditMemoRef: 'CM-001', creditAmount: 500 });

    const result = await service.updateShipmentStatus('tenant-1', 'shp-1', 'DELIVERED', 'CM-001', 500);
    expect(result.status).toBe('DELIVERED');
  });

  it('should resolve RMA with credit', async () => {
    prisma.vendorRmaRequest.findFirst.mockResolvedValue({ id: 'rma-1', status: 'AUTHORIZED' });
    prisma.vendorReturnShipment.updateMany.mockResolvedValue({ count: 1 });
    prisma.vendorRmaRequest.update.mockResolvedValue({ id: 'rma-1', status: 'COMPLETED', vendor: { name: 'Vendor A' }, shipments: [] });

    const result = await service.resolveRma('tenant-1', 'rma-1', { resolution: 'Accepted', creditAmount: 500, creditMemoRef: 'CM-001' });
    expect(result.status).toBe('COMPLETED');
  });

  it('should throw BadRequestException when resolving non-AUTHORIZED RMA', async () => {
    prisma.vendorRmaRequest.findFirst.mockResolvedValue({ id: 'rma-1', status: 'PENDING' });
    await expect(service.resolveRma('tenant-1', 'rma-1', { resolution: 'Accepted' })).rejects.toThrow(BadRequestException);
  });

  it('should cancel RMA with reason', async () => {
    prisma.vendorRmaRequest.findFirst.mockResolvedValue({ id: 'rma-1', status: 'PENDING' });
    prisma.vendorRmaRequest.update.mockResolvedValue({ id: 'rma-1', status: 'CANCELLED', vendor: { name: 'Vendor A' } });

    const result = await service.cancelRma('tenant-1', 'rma-1', 'No longer needed');
    expect(result.status).toBe('CANCELLED');
  });

  it('should throw BadRequestException when cancelling completed RMA', async () => {
    prisma.vendorRmaRequest.findFirst.mockResolvedValue({ id: 'rma-1', status: 'COMPLETED' });
    await expect(service.cancelRma('tenant-1', 'rma-1')).rejects.toThrow(BadRequestException);
  });

  it('should get RMAs by vendor', async () => {
    prisma.vendorRmaRequest.findMany.mockResolvedValue([{ id: '1', vendor: { name: 'Vendor A' }, reasonCode: { name: 'Defective' }, shipments: [] }]);
    prisma.vendorRmaRequest.count.mockResolvedValue(1);

    const result = await service.getRmasByVendor('tenant-1', 'vendor-1', {});
    expect(result.total).toBe(1);
  });

  it('should get RMAs by date range', async () => {
    prisma.vendorRmaRequest.findMany.mockResolvedValue([{ id: '1', vendor: { name: 'Vendor A' }, shipments: [] }]);
    prisma.vendorRmaRequest.count.mockResolvedValue(1);

    const result = await service.getRmasByDateRange('tenant-1', '2026-01-01', '2026-06-30', {});
    expect(result.total).toBe(1);
  });

  it('should get detailed RMA stats with byVendor and resolution time', async () => {
    const pastDate = new Date('2026-01-01');
    const laterDate = new Date('2026-01-15');
    prisma.vendorRmaRequest.findMany.mockResolvedValue([
      { id: '1', vendorId: 'v1', vendor: { name: 'Vendor A' }, status: 'COMPLETED', submittedAt: pastDate, updatedAt: laterDate, createdAt: pastDate },
      { id: '2', vendorId: 'v2', vendor: { name: 'Vendor B' }, status: 'AUTHORIZED', submittedAt: pastDate, updatedAt: pastDate, createdAt: pastDate },
    ]);
    prisma.vendorReturnShipment.findMany.mockResolvedValue([{ status: 'DELIVERED', creditAmount: 500 }]);

    const stats = await service.getRmaStatsDetailed('tenant-1');
    expect(stats.totalRmas).toBe(2);
    expect(stats.byVendor).toHaveLength(2);
    expect(stats.averageResolutionDays).toBeGreaterThan(0);
    expect(stats.authorizedRate).toBeGreaterThan(0);
  });

  it('should list shipments for an RMA', async () => {
    prisma.vendorReturnShipment.findMany.mockResolvedValue([{ id: 'shp-1', warehouse: { name: 'Main WH' } }]);
    prisma.vendorReturnShipment.count.mockResolvedValue(1);

    const result = await service.listShipments('tenant-1', 'rma-1', {});
    expect(result.total).toBe(1);
  });

  it('should throw NotFoundException when creating shipment for missing RMA', async () => {
    prisma.vendorRmaRequest.findFirst.mockResolvedValue(null);
    await expect(service.createShipment('tenant-1', { rmaRequestId: 'missing', warehouseId: 'wh-1' })).rejects.toThrow(NotFoundException);
  });
});
