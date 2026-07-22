import { Test, TestingModule } from '@nestjs/testing';
import { VendorRmaService } from '../vendor-rma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

jest.mock('@unerp/database', () => ({
  prisma: {
    vendorRmaRequest: { findMany: jest.fn(), findFirst: jest.fn(), count: jest.fn(), create: jest.fn(), update: jest.fn() },
    vendorReturnShipment: { findMany: jest.fn(), findFirst: jest.fn(), count: jest.fn(), create: jest.fn(), update: jest.fn() },
    vendor: { findFirst: jest.fn() },
  },
}));

const { prisma } = require('@unerp/database');

describe('VendorRmaService', () => {
  let service: VendorRmaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({ providers: [VendorRmaService] }).compile();
    service = module.get<VendorRmaService>(VendorRmaService);
    jest.clearAllMocks();
  });

  it('should list RMAs', async () => {
    (prisma.vendorRmaRequest.findMany as jest.Mock).mockResolvedValue([{ id: '1', rmaNumber: 'RMA-0001', vendor: { name: 'Vendor A' }, shipments: [] }]);
    (prisma.vendorRmaRequest.count as jest.Mock).mockResolvedValue(1);
    const result = await service.listRmas('tenant-1', {});
    expect(result.total).toBe(1);
  });

  it('should create RMA', async () => {
    (prisma.vendor.findFirst as jest.Mock).mockResolvedValue({ id: 'vendor-1' });
    (prisma.vendorRmaRequest.count as jest.Mock).mockResolvedValue(0);
    (prisma.vendorRmaRequest.create as jest.Mock).mockResolvedValue({ id: 'new-rma', rmaNumber: 'RMA-0001' });

    const result = await service.createRma('tenant-1', 'org-1', { purchaseReturnId: 'pr-1', vendorId: 'vendor-1' }, 'user-1');
    expect(result.id).toBe('new-rma');
  });

  it('should transition RMA from PENDING to SUBMITTED', async () => {
    (prisma.vendorRmaRequest.findFirst as jest.Mock).mockResolvedValue({ id: '1', status: 'PENDING' });
    (prisma.vendorRmaRequest.update as jest.Mock).mockResolvedValue({ id: '1', status: 'SUBMITTED' });

    const result = await service.updateRmaStatus('tenant-1', '1', 'SUBMITTED');
    expect(result.status).toBe('SUBMITTED');
  });

  it('should reject invalid RMA transitions', async () => {
    (prisma.vendorRmaRequest.findFirst as jest.Mock).mockResolvedValue({ id: '1', status: 'COMPLETED' });
    await expect(service.updateRmaStatus('tenant-1', '1', 'PENDING')).rejects.toThrow(BadRequestException);
  });

  it('should create shipment', async () => {
    (prisma.vendorRmaRequest.findFirst as jest.Mock).mockResolvedValue({ id: 'rma-1' });
    (prisma.vendorReturnShipment.count as jest.Mock).mockResolvedValue(0);
    (prisma.vendorReturnShipment.create as jest.Mock).mockResolvedValue({ id: 'new-shipment', shipmentNumber: 'RMA-SHP-0001' });

    const result = await service.createShipment('tenant-1', { rmaRequestId: 'rma-1', warehouseId: 'wh-1' });
    expect(result.id).toBe('new-shipment');
  });

  it('should get stats', async () => {
    (prisma.vendorRmaRequest.findMany as jest.Mock).mockResolvedValue([{ status: 'PENDING' }, { status: 'AUTHORIZED' }]);
    (prisma.vendorReturnShipment.findMany as jest.Mock).mockResolvedValue([{ status: 'SHIPPED', creditAmount: 500 }]);
    const stats = await service.getStats('tenant-1');
    expect(stats.totalRmas).toBe(2);
    expect(stats.totalShipments).toBe(1);
    expect(stats.totalCredits).toBe(500);
  });
});
