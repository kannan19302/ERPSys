import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { SupplierNcrCarService } from '../supplier-ncr-car.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

vi.mock('@unerp/database', () => ({
  prisma: {
    supplierNcr: { findMany: vi.fn(), findFirst: vi.fn(), count: vi.fn(), create: vi.fn(), update: vi.fn() },
    supplierCarRequest: { findMany: vi.fn(), findFirst: vi.fn(), count: vi.fn(), create: vi.fn(), update: vi.fn() },
    vendor: { findFirst: vi.fn() },
  },
}));

const { prisma } = require('@unerp/database');

describe('SupplierNcrCarService (extra)', () => {
  let service: SupplierNcrCarService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({ providers: [SupplierNcrCarService] }).compile();
    service = module.get<SupplierNcrCarService>(SupplierNcrCarService);
    vi.clearAllMocks();
  });

  it('should get NCR by id', async () => {
    const mockNcr = { id: '1', ncrNumber: 'NCR-00001', vendor: { name: 'Vendor A' }, carRequests: [] };
    prisma.supplierNcr.findFirst.mockResolvedValue(mockNcr);
    const result = await service.getNcrById('tenant-1', '1');
    expect(result.id).toBe('1');
  });

  it('should throw NotFoundException for missing NCR', async () => {
    prisma.supplierNcr.findFirst.mockResolvedValue(null);
    await expect(service.getNcrById('tenant-1', 'nonexistent')).rejects.toThrow(NotFoundException);
  });

  it('should enforce tenant isolation on getNcrById', async () => {
    prisma.supplierNcr.findFirst.mockResolvedValue(null);
    await expect(service.getNcrById('tenant-2', '1')).rejects.toThrow(NotFoundException);
    expect(prisma.supplierNcr.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: '1', tenantId: 'tenant-2' } })
    );
  });

  it('should get CAR by id', async () => {
    const mockCar = { id: 'car-1', carNumber: 'CAR-00001', vendor: { name: 'Vendor A' }, ncr: {} };
    prisma.supplierCarRequest.findFirst.mockResolvedValue(mockCar);
    const result = await service.getCarById('tenant-1', 'car-1');
    expect(result.id).toBe('car-1');
  });

  it('should throw NotFoundException for missing CAR', async () => {
    prisma.supplierCarRequest.findFirst.mockResolvedValue(null);
    await expect(service.getCarById('tenant-1', 'missing')).rejects.toThrow(NotFoundException);
  });

  it('should update NCR status to UNDER_REVIEW', async () => {
    prisma.supplierNcr.findFirst.mockResolvedValue({ id: '1', status: 'OPEN' });
    prisma.supplierNcr.update.mockResolvedValue({ id: '1', status: 'UNDER_REVIEW' });
    const result = await service.updateNcrStatus('tenant-1', '1', 'UNDER_REVIEW');
    expect(result.status).toBe('UNDER_REVIEW');
  });

  it('should close NCR with resolution', async () => {
    prisma.supplierNcr.findFirst.mockResolvedValue({ id: '1', status: 'UNDER_REVIEW' });
    prisma.supplierNcr.update.mockResolvedValue({ id: '1', status: 'CLOSED', resolution: 'Root cause addressed' });
    const result = await service.updateNcrStatus('tenant-1', '1', 'CLOSED', 'Root cause addressed');
    expect(result.status).toBe('CLOSED');
  });

  it('should update CAR status with vendor response', async () => {
    prisma.supplierCarRequest.findFirst.mockResolvedValue({ id: 'car-1', status: 'PENDING' });
    prisma.supplierCarRequest.update.mockResolvedValue({ id: 'car-1', status: 'SUBMITTED', vendorResponse: 'Action plan provided' });
    const result = await service.updateCarStatus('tenant-1', 'car-1', 'SUBMITTED', 'Action plan provided');
    expect(result.status).toBe('SUBMITTED');
  });

  it('should reject invalid CAR transition', async () => {
    prisma.supplierCarRequest.findFirst.mockResolvedValue({ id: 'car-1', status: 'PENDING' });
    await expect(service.updateCarStatus('tenant-1', 'car-1', 'CLOSED')).rejects.toThrow(BadRequestException);
  });

  it('should escalate NCR severity', async () => {
    prisma.supplierNcr.findFirst.mockResolvedValue({ id: '1', severity: 'MINOR', status: 'OPEN' });
    prisma.supplierNcr.update.mockResolvedValue({ id: '1', severity: 'MAJOR', vendor: { name: 'Vendor A' } });
    const result = await service.escalateNcr('tenant-1', '1', { severity: 'MAJOR' });
    expect(result.severity).toBe('MAJOR');
  });

  it('should throw BadRequestException when escalating closed NCR', async () => {
    prisma.supplierNcr.findFirst.mockResolvedValue({ id: '1', severity: 'MINOR', status: 'CLOSED' });
    await expect(service.escalateNcr('tenant-1', '1', { severity: 'MAJOR' })).rejects.toThrow(BadRequestException);
  });

  it('should throw when escalating to same or lower severity', async () => {
    prisma.supplierNcr.findFirst.mockResolvedValue({ id: '1', severity: 'CRITICAL', status: 'OPEN' });
    await expect(service.escalateNcr('tenant-1', '1', { severity: 'MAJOR' })).rejects.toThrow(BadRequestException);
  });

  it('should reopen closed CAR', async () => {
    prisma.supplierCarRequest.findFirst.mockResolvedValue({ id: 'car-1', status: 'CLOSED' });
    prisma.supplierCarRequest.update.mockResolvedValue({ id: 'car-1', status: 'SUBMITTED', vendorResponse: 'Reopened for review' });
    const result = await service.reopenCar('tenant-1', 'car-1', 'Reopened for review');
    expect(result.status).toBe('SUBMITTED');
  });

  it('should throw when reopening non-closed CAR', async () => {
    prisma.supplierCarRequest.findFirst.mockResolvedValue({ id: 'car-1', status: 'SUBMITTED' });
    await expect(service.reopenCar('tenant-1', 'car-1')).rejects.toThrow(BadRequestException);
  });

  it('should get quality metrics with defect breakdown', async () => {
    prisma.supplierNcr.findMany.mockResolvedValue([
      { id: '1', vendorId: 'v1', vendor: { name: 'Vendor A' }, defectType: 'DIMENSIONAL', severity: 'MAJOR', defectQty: 5, totalQty: 100, status: 'OPEN' },
      { id: '2', vendorId: 'v1', vendor: { name: 'Vendor A' }, defectType: 'VISUAL', severity: 'MINOR', defectQty: 2, totalQty: 100, status: 'CLOSED' },
    ]);
    const metrics = await service.getQualityMetrics('tenant-1');
    expect(metrics.totalNcrs).toBe(2);
    expect(metrics.totalDefects).toBe(7);
    expect(metrics.totalInspected).toBe(200);
    expect(metrics.defectRate).toBe(3.5);
    expect(metrics.openNcrs).toBe(1);
    expect(metrics.criticalOpen).toBe(0);
    expect(Object.keys(metrics.byDefectType)).toHaveLength(2);
    expect(Object.keys(metrics.bySeverity)).toHaveLength(2);
  });

  it('should list CARS with filters', async () => {
    prisma.supplierCarRequest.findMany.mockResolvedValue([{ id: 'car-1', vendor: { name: 'Vendor A' }, ncr: { ncrNumber: 'NCR-00001', defectType: 'DIMENSIONAL' } }]);
    prisma.supplierCarRequest.count.mockResolvedValue(1);
    const result = await service.listCars('tenant-1', { status: 'PENDING', vendorId: 'v1' });
    expect(result.total).toBe(1);
  });

  it('should get NCRs by supplier with severity filter', async () => {
    prisma.supplierNcr.findMany.mockResolvedValue([{ id: '1', carRequests: [] }]);
    prisma.supplierNcr.count.mockResolvedValue(1);
    const result = await service.getNcrsBySupplier('tenant-1', 'v1', { severity: 'CRITICAL' });
    expect(result.total).toBe(1);
    expect(prisma.supplierNcr.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { tenantId: 'tenant-1', vendorId: 'v1', severity: 'CRITICAL' } })
    );
  });

  it('should get CARs by supplier', async () => {
    prisma.supplierCarRequest.findMany.mockResolvedValue([{ id: 'car-1', ncr: { ncrNumber: 'NCR-00001', defectType: 'DIMENSIONAL' } }]);
    prisma.supplierCarRequest.count.mockResolvedValue(1);
    const result = await service.getCarsBySupplier('tenant-1', 'v1', {});
    expect(result.total).toBe(1);
  });
});
