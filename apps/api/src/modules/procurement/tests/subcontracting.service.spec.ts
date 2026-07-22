import { Test, TestingModule } from '@nestjs/testing';
import { SubcontractingService } from '../subcontracting.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

jest.mock('@unerp/database', () => ({
  prisma: {
    subcontractingOrder: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    subcontractingMaterial: { findFirst: jest.fn(), update: jest.fn() },
    vendor: { findFirst: jest.fn() },
    product: { findFirst: jest.fn() },
  },
}));

const { prisma } = require('@unerp/database');

describe('SubcontractingService', () => {
  let service: SubcontractingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({ providers: [SubcontractingService] }).compile();
    service = module.get<SubcontractingService>(SubcontractingService);
    jest.clearAllMocks();
  });

  it('should list subcontracting orders', async () => {
    const mockOrders = [{ id: '1', vendor: { name: 'Vendor A' }, product: { name: 'Product A', sku: 'SKU1' }, materials: [] }];
    (prisma.subcontractingOrder.findMany as jest.Mock).mockResolvedValue(mockOrders);
    (prisma.subcontractingOrder.count as jest.Mock).mockResolvedValue(1);

    const result = await service.list('tenant-1', {});
    expect(result.data).toEqual(mockOrders);
    expect(result.total).toBe(1);
  });

  it('should get subcontracting order by id', async () => {
    const mockOrder = { id: '1', vendor: { name: 'Vendor A' }, product: { name: 'Product A' }, materials: [] };
    (prisma.subcontractingOrder.findFirst as jest.Mock).mockResolvedValue(mockOrder);

    const result = await service.getById('tenant-1', '1');
    expect(result.id).toBe('1');
  });

  it('should throw NotFoundException for missing order', async () => {
    (prisma.subcontractingOrder.findFirst as jest.Mock).mockResolvedValue(null);
    await expect(service.getById('tenant-1', 'nonexistent')).rejects.toThrow(NotFoundException);
  });

  it('should create a subcontracting order', async () => {
    (prisma.vendor.findFirst as jest.Mock).mockResolvedValue({ id: 'vendor-1' });
    (prisma.product.findFirst as jest.Mock).mockResolvedValue({ id: 'product-1' });
    (prisma.subcontractingOrder.create as jest.Mock).mockResolvedValue({ id: 'new-order', vendor: { name: 'Vendor A' }, product: { name: 'Product A' } });

    const result = await service.create('tenant-1', { vendorId: 'vendor-1', productId: 'product-1', quantity: 10, unitCost: 50 });
    expect(result.id).toBe('new-order');
  });

  it('should reject invalid status transitions', async () => {
    (prisma.subcontractingOrder.findFirst as jest.Mock).mockResolvedValue({ id: '1', status: 'COMPLETED' });
    await expect(service.updateStatus('tenant-1', '1', 'SENT')).rejects.toThrow(BadRequestException);
  });

  it('should get stats', async () => {
    (prisma.subcontractingOrder.findMany as jest.Mock).mockResolvedValue([
      { status: 'SENT', totalCost: 500 },
      { status: 'SENT', totalCost: 300 },
      { status: 'COMPLETED', totalCost: 1000 },
    ]);

    const stats = await service.getStats('tenant-1');
    expect(stats.total).toBe(3);
    expect(stats.byStatus.SENT).toBe(2);
    expect(stats.totalCost).toBe(1800);
  });
});
