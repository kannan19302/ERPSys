import { Test, TestingModule } from '@nestjs/testing';
import { PaymentSchedulesService } from '../payment-schedules.service';
import { NotFoundException } from '@nestjs/common';

jest.mock('@unerp/database', () => ({
  prisma: {
    paymentSchedule: { findMany: jest.fn(), findFirst: jest.fn(), count: jest.fn(), create: jest.fn(), update: jest.fn(), createMany: jest.fn() },
    purchaseOrder: { findFirst: jest.fn() },
  },
}));

const { prisma } = require('@unerp/database');

describe('PaymentSchedulesService', () => {
  let service: PaymentSchedulesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({ providers: [PaymentSchedulesService] }).compile();
    service = module.get<PaymentSchedulesService>(PaymentSchedulesService);
    jest.clearAllMocks();
  });

  it('should list payment schedules', async () => {
    (prisma.paymentSchedule.findMany as jest.Mock).mockResolvedValue([{ id: '1', vendor: { name: 'Vendor A' }, amount: 500, dueDate: new Date() }]);
    (prisma.paymentSchedule.count as jest.Mock).mockResolvedValue(1);
    const result = await service.list('tenant-1', {});
    expect(result.total).toBe(1);
  });

  it('should create payment schedule', async () => {
    (prisma.paymentSchedule.create as jest.Mock).mockResolvedValue({ id: 'new-ps', vendor: { name: 'Vendor A' } });
    const result = await service.create('tenant-1', 'org-1', { vendorId: 'vendor-1', dueDate: new Date().toISOString(), amount: 500 });
    expect(result.id).toBe('new-ps');
  });

  it('should bulk create from PO', async () => {
    (prisma.purchaseOrder.findFirst as jest.Mock).mockResolvedValue({ id: 'po-1', vendorId: 'vendor-1' });
    (prisma.paymentSchedule.findMany as jest.Mock).mockResolvedValue([{ id: 'ps-1', amount: 500 }]);

    const result = await service.bulkCreateFromPo('tenant-1', 'org-1', 'po-1', [{ dueDate: new Date().toISOString(), amount: 500 }]);
    expect(result.length).toBe(1);
  });

  it('should get upcoming payments', async () => {
    (prisma.paymentSchedule.findMany as jest.Mock).mockResolvedValue([{ vendor: { name: 'Vendor A' }, amount: 500, dueDate: new Date() }]);
    const result = await service.getUpcoming('tenant-1', 30);
    expect(result.count).toBe(1);
    expect(result.totalDue).toBe(500);
  });

  it('should get stats', async () => {
    const past = new Date();
    past.setDate(past.getDate() - 10);
    (prisma.paymentSchedule.findMany as jest.Mock).mockResolvedValue([
      { status: 'PENDING', amount: 500, dueDate: past },
      { status: 'PAID', amount: 300, dueDate: new Date() },
    ]);
    const stats = await service.getStats('tenant-1');
    expect(stats.total).toBe(2);
    expect(stats.overdueCount).toBe(1);
    expect(stats.overdueAmount).toBe(500);
  });
});
