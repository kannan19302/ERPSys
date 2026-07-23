import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { PaymentSchedulesService } from '../payment-schedules.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

vi.mock('@unerp/database', () => ({
  prisma: {
    paymentSchedule: { findMany: vi.fn(), findFirst: vi.fn(), count: vi.fn(), create: vi.fn(), update: vi.fn(), createMany: vi.fn() },
    purchaseOrder: { findFirst: vi.fn() },
  },
}));

const { prisma } = require('@unerp/database');

describe('PaymentSchedulesService (extra)', () => {
  let service: PaymentSchedulesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({ providers: [PaymentSchedulesService] }).compile();
    service = module.get<PaymentSchedulesService>(PaymentSchedulesService);
    vi.clearAllMocks();
  });

  it('should get payment schedule by id', async () => {
    const mockSchedule = { id: '1', vendor: { name: 'Vendor A' }, purchaseOrder: { poNumber: 'PO-001' }, amount: 500, dueDate: new Date() };
    prisma.paymentSchedule.findFirst.mockResolvedValue(mockSchedule);

    const result = await service.getById('tenant-1', '1');
    expect(result.id).toBe('1');
  });

  it('should throw NotFoundException for missing payment schedule', async () => {
    prisma.paymentSchedule.findFirst.mockResolvedValue(null);
    await expect(service.getById('tenant-1', 'nonexistent')).rejects.toThrow(NotFoundException);
  });

  it('should enforce tenant isolation on getById', async () => {
    prisma.paymentSchedule.findFirst.mockResolvedValue(null);
    await expect(service.getById('tenant-2', '1')).rejects.toThrow(NotFoundException);
    expect(prisma.paymentSchedule.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: '1', tenantId: 'tenant-2' } })
    );
  });

  it('should update schedule status', async () => {
    prisma.paymentSchedule.findFirst.mockResolvedValue({ id: '1', status: 'PENDING' });
    prisma.paymentSchedule.update.mockResolvedValue({ id: '1', status: 'PAID' });

    const result = await service.updateStatus('tenant-1', '1', 'PAID');
    expect(result.status).toBe('PAID');
  });

  it('should throw NotFoundException when updating status for missing schedule', async () => {
    prisma.paymentSchedule.findFirst.mockResolvedValue(null);
    await expect(service.updateStatus('tenant-1', 'x', 'PAID')).rejects.toThrow(NotFoundException);
  });

  it('should get schedules by purchase order', async () => {
    prisma.paymentSchedule.findMany.mockResolvedValue([
      { id: '1', amount: 500, dueDate: new Date(), vendor: { name: 'Vendor A' } },
      { id: '2', amount: 300, dueDate: new Date(), vendor: { name: 'Vendor A' } },
    ]);

    const result = await service.getSchedulesByPurchaseOrder('tenant-1', 'po-1');
    expect(result).toHaveLength(2);
    expect(prisma.paymentSchedule.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { tenantId: 'tenant-1', purchaseOrderId: 'po-1' } })
    );
  });

  it('should get schedules by date range', async () => {
    prisma.paymentSchedule.findMany.mockResolvedValue([{ id: '1', vendor: { name: 'Vendor A' }, purchaseOrder: { poNumber: 'PO-001' } }]);
    prisma.paymentSchedule.count.mockResolvedValue(1);

    const result = await service.getSchedulesByDateRange('tenant-1', '2026-01-01', '2026-06-30', {});
    expect(result.total).toBe(1);
  });

  it('should mark schedule as overdue', async () => {
    prisma.paymentSchedule.findFirst.mockResolvedValue({ id: '1', status: 'PENDING' });
    prisma.paymentSchedule.update.mockResolvedValue({ id: '1', status: 'OVERDUE', vendor: { name: 'Vendor A' }, purchaseOrder: { poNumber: 'PO-001' } });

    const result = await service.markOverdue('tenant-1', '1');
    expect(result.status).toBe('OVERDUE');
  });

  it('should throw BadRequestException when marking non-pending schedule as overdue', async () => {
    prisma.paymentSchedule.findFirst.mockResolvedValue({ id: '1', status: 'PAID' });
    await expect(service.markOverdue('tenant-1', '1')).rejects.toThrow(BadRequestException);
  });

  it('should get payment forecast for multiple months', async () => {
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 15);
    const twoMonths = new Date(today.getFullYear(), today.getMonth() + 2, 10);

    prisma.paymentSchedule.findMany.mockResolvedValue([
      { id: '1', amount: 1000, dueDate: nextMonth, vendor: { name: 'Vendor A' } },
      { id: '2', amount: 500, dueDate: twoMonths, vendor: { name: 'Vendor B' } },
    ]);

    const forecast = await service.getPaymentForecast('tenant-1', 3);
    expect(forecast.totalProjected).toBe(1500);
    expect(forecast.totalSchedules).toBe(2);
    expect(forecast.monthlyForecast.length).toBeGreaterThanOrEqual(2);
    expect(forecast.monthlyForecast[0].schedules).toBeDefined();
  });

  it('should throw NotFoundException when bulk creating from missing PO', async () => {
    prisma.purchaseOrder.findFirst.mockResolvedValue(null);
    await expect(service.bulkCreateFromPo('tenant-1', 'org-1', 'missing-po', [{ dueDate: '2026-07-01', amount: 500 }])).rejects.toThrow(NotFoundException);
  });

  it('should handle empty upcoming payments', async () => {
    prisma.paymentSchedule.findMany.mockResolvedValue([]);
    const result = await service.getUpcoming('tenant-1', 30);
    expect(result.count).toBe(0);
    expect(result.totalDue).toBe(0);
  });
});
