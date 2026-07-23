import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { SubcontractingService } from '../subcontracting.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

vi.mock('@unerp/database', () => ({
  prisma: {
    subcontractingOrder: { findMany: vi.fn(), findFirst: vi.fn(), count: vi.fn(), create: vi.fn(), update: vi.fn() },
    subcontractingMaterial: { findFirst: vi.fn(), update: vi.fn(), findMany: vi.fn() },
    vendor: { findFirst: vi.fn() },
    product: { findFirst: vi.fn() },
  },
}));

const { prisma } = require('@unerp/database');

describe('SubcontractingService (extra)', () => {
  let service: SubcontractingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({ providers: [SubcontractingService] }).compile();
    service = module.get<SubcontractingService>(SubcontractingService);
    vi.clearAllMocks();
  });

  it('should issue material successfully', async () => {
    prisma.subcontractingOrder.findFirst.mockResolvedValue({ id: '1', status: 'SENT' });
    prisma.subcontractingMaterial.findFirst.mockResolvedValue({ id: 'mat-1', requiredQty: 10, issuedQty: 0, consumedQty: 0 });
    prisma.subcontractingMaterial.update.mockResolvedValue({ id: 'mat-1', issuedQty: '5' });

    const result = await service.issueMaterial('tenant-1', '1', 'mat-1', 5);
    expect(result.id).toBe('mat-1');
  });

  it('should throw NotFoundException when issuing material for missing order', async () => {
    prisma.subcontractingOrder.findFirst.mockResolvedValue(null);
    await expect(service.issueMaterial('tenant-1', 'x', 'mat-1', 5)).rejects.toThrow(NotFoundException);
  });

  it('should throw NotFoundException when issuing missing material line', async () => {
    prisma.subcontractingOrder.findFirst.mockResolvedValue({ id: '1', status: 'SENT' });
    prisma.subcontractingMaterial.findFirst.mockResolvedValue(null);
    await expect(service.issueMaterial('tenant-1', '1', 'missing', 5)).rejects.toThrow(NotFoundException);
  });

  it('should record consumption successfully', async () => {
    prisma.subcontractingOrder.findFirst.mockResolvedValue({ id: '1', status: 'SENT' });
    prisma.subcontractingMaterial.update.mockResolvedValue({ id: 'mat-1', consumedQty: '3' });

    const result = await service.recordConsumption('tenant-1', '1', 'mat-1', 3);
    expect(result.id).toBe('mat-1');
  });

  it('should throw NotFoundException when recording consumption for missing order', async () => {
    prisma.subcontractingOrder.findFirst.mockResolvedValue(null);
    await expect(service.recordConsumption('tenant-1', 'x', 'mat-1', 3)).rejects.toThrow(NotFoundException);
  });

  it('should update order fields', async () => {
    prisma.subcontractingOrder.findFirst.mockResolvedValue({ id: '1', quantity: 10, unitCost: 50, status: 'SENT' });
    prisma.subcontractingOrder.update.mockResolvedValue({ id: '1', quantity: 20, unitCost: 50, totalCost: 1000 });

    const result = await service.updateOrder('tenant-1', '1', { quantity: 20 });
    expect(result.id).toBe('1');
  });

  it('should throw NotFoundException when updating missing order', async () => {
    prisma.subcontractingOrder.findFirst.mockResolvedValue(null);
    await expect(service.updateOrder('tenant-1', 'x', { quantity: 5 })).rejects.toThrow(NotFoundException);
  });

  it('should close order successfully', async () => {
    prisma.subcontractingOrder.findFirst.mockResolvedValue({ id: '1', status: 'RECEIVED' });
    prisma.subcontractingOrder.update.mockResolvedValue({ id: '1', status: 'COMPLETED' });

    const result = await service.closeOrder('tenant-1', '1');
    expect(result.status).toBe('COMPLETED');
  });

  it('should throw BadRequestException when closing already completed order', async () => {
    prisma.subcontractingOrder.findFirst.mockResolvedValue({ id: '1', status: 'COMPLETED' });
    await expect(service.closeOrder('tenant-1', '1')).rejects.toThrow(BadRequestException);
  });

  it('should get orders by subcontractor with tenant isolation', async () => {
    const mockOrders = [{ id: '1', product: { name: 'Product A', sku: 'SKU1' } }];
    prisma.subcontractingOrder.findMany.mockResolvedValue(mockOrders);
    prisma.subcontractingOrder.count.mockResolvedValue(1);

    const result = await service.getOrdersBySubcontractor('tenant-1', 'vendor-1', {});
    expect(result.data).toEqual(mockOrders);
    expect(result.total).toBe(1);
    expect(prisma.subcontractingOrder.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ tenantId: 'tenant-1', vendorId: 'vendor-1' }) })
    );
  });

  it('should get material consumption report', async () => {
    prisma.subcontractingMaterial.findMany.mockResolvedValue([
      { product: { name: 'Material A', sku: 'MAT1' }, requiredQty: 10, issuedQty: 8, consumedQty: 6, subcontractingOrder: { id: '1', status: 'SENT', vendorId: 'v1' } },
      { product: { name: 'Material B', sku: 'MAT2' }, requiredQty: 5, issuedQty: 5, consumedQty: 5, subcontractingOrder: { id: '2', status: 'COMPLETED', vendorId: 'v1' } },
    ]);

    const report = await service.getMaterialConsumptionReport('tenant-1');
    expect(report.totalMaterials).toBe(2);
    expect(report.totalRequired).toBe(15);
    expect(report.totalIssued).toBe(13);
    expect(report.totalConsumed).toBe(11);
    expect(report.utilizationRate).toBeCloseTo(84.62, 0);
  });

  it('should enforce tenant isolation in getById for different tenant', async () => {
    prisma.subcontractingOrder.findFirst.mockResolvedValue(null);
    await expect(service.getById('tenant-2', '1')).rejects.toThrow(NotFoundException);
    expect(prisma.subcontractingOrder.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: '1', tenantId: 'tenant-2' } })
    );
  });

  it('should handle empty list gracefully', async () => {
    prisma.subcontractingOrder.findMany.mockResolvedValue([]);
    prisma.subcontractingOrder.count.mockResolvedValue(0);

    const result = await service.list('tenant-1', {});
    expect(result.data).toEqual([]);
    expect(result.total).toBe(0);
  });
});
