import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TaxEngineService } from '../services/tax-engine.service';
import { prisma } from '@unerp/database';
import { Prisma } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';

vi.mock('@prisma/client', () => {
  return {
    Prisma: {
      Decimal: class Decimal {
        private value: number;
        constructor(val: unknown) {
          this.value = Number(val);
        }
        add(other: Decimal) {
          return new Decimal(this.value + other.value);
        }
        gt(other: Decimal | number) {
          const checkVal = other instanceof Decimal ? other.value : Number(other);
          return this.value > checkVal;
        }
        toNumber() {
          return this.value;
        }
        toFixed(digits?: number) {
          return this.value.toFixed(digits);
        }
      },
    },
  };
});

vi.mock('@unerp/database', () => {
  const createMockPrismaCollection = () => ({
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
  });

  return {
    prisma: {
      dunningLevel: createMockPrismaCollection(),
      dunningRun: createMockPrismaCollection(),
      invoice: createMockPrismaCollection(),
      invoiceLineItem: createMockPrismaCollection(),
      invoiceDunningLog: createMockPrismaCollection(),
      $transaction: vi.fn((cb) => cb(prisma)),
    },
  };
});

describe('TaxEngineService - Dunning Cadence Execution', () => {
  let service: TaxEngineService;
  let mockGlService: any;
  let mockEventEmitter: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockGlService = {
      resolveOrgId: vi.fn().mockResolvedValue('org-1'),
    };

    mockEventEmitter = {
      emit: vi.fn(),
    };

    service = new TaxEngineService(mockGlService, mockEventEmitter as EventEmitter2);
  });

  it('should return empty dunning run if no active dunning levels configured', async () => {
    vi.mocked(prisma.dunningLevel.findMany).mockResolvedValue([]);
    vi.mocked(prisma.dunningRun.create).mockResolvedValue({
      id: 'run-empty',
      status: 'COMPLETED',
      totalInvoices: 0,
    } as any);

    const result = await service.createDunningRun('tenant-1', 'org-1');

    expect(prisma.dunningLevel.findMany).toHaveBeenCalled();
    expect(prisma.dunningRun.create).toHaveBeenCalledWith({
      data: {
        tenantId: 'tenant-1',
        orgId: 'org-1',
        totalInvoices: 0,
        status: 'COMPLETED',
      },
    });
    expect(result.status).toBe('COMPLETED');
    expect(result.totalInvoices).toBe(0);
  });

  it('should process overdue invoices and skip if already dunned at that level', async () => {
    const mockLevels = [
      { id: 'level-1', daysOverdue: 5, feeAmount: new Prisma.Decimal(10), levelName: 'First Notice', status: 'ACTIVE' },
      { id: 'level-2', daysOverdue: 15, feeAmount: new Prisma.Decimal(25), levelName: 'Second Notice', status: 'ACTIVE' },
    ];

    const mockInvoices = [
      {
        id: 'inv-1',
        invoiceNumber: 'INV-001',
        dueDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days overdue
        subtotal: new Prisma.Decimal(100),
        totalAmount: new Prisma.Decimal(100),
        customerId: 'cust-1',
        customer: { id: 'cust-1', name: 'John Doe', email: 'john@example.com' },
      },
    ];

    vi.mocked(prisma.dunningLevel.findMany).mockResolvedValue(mockLevels as any);
    vi.mocked(prisma.invoice.findMany).mockResolvedValue(mockInvoices as any);
    vi.mocked(prisma.dunningRun.create).mockResolvedValue({ id: 'run-1', status: 'IN_PROGRESS' } as any);
    vi.mocked(prisma.invoiceDunningLog.findFirst).mockResolvedValue({ id: 'existing-log' } as any); // Already processed
    vi.mocked(prisma.dunningRun.update).mockResolvedValue({ id: 'run-1', status: 'COMPLETED', totalInvoices: 0 } as any);

    const result = await service.createDunningRun('tenant-1', 'org-1');

    expect(prisma.invoiceDunningLog.findFirst).toHaveBeenCalledWith({
      where: {
        tenantId: 'tenant-1',
        invoiceId: 'inv-1',
        dunningLevelId: 'level-1', // Matches level-1
      },
    });
    expect(prisma.invoiceLineItem.create).not.toHaveBeenCalled();
    expect(result.totalInvoices).toBe(0);
  });

  it('should execute dunning reminder, apply late fee, record log, and emit events', async () => {
    const mockLevels = [
      { id: 'level-1', daysOverdue: 5, feeAmount: new Prisma.Decimal(10), levelName: 'First Notice', status: 'ACTIVE' },
      { id: 'level-2', daysOverdue: 15, feeAmount: new Prisma.Decimal(25), levelName: 'Second Notice', status: 'ACTIVE' },
    ];

    const mockInvoices = [
      {
        id: 'inv-1',
        invoiceNumber: 'INV-001',
        dueDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 days overdue (matches level-2)
        subtotal: new Prisma.Decimal(100),
        totalAmount: new Prisma.Decimal(100),
        customerId: 'cust-1',
        customer: { id: 'cust-1', name: 'John Doe', email: 'john@example.com' },
      },
    ];

    vi.mocked(prisma.dunningLevel.findMany).mockResolvedValue(mockLevels as any);
    vi.mocked(prisma.invoice.findMany).mockResolvedValue(mockInvoices as any);
    vi.mocked(prisma.dunningRun.create).mockResolvedValue({ id: 'run-1', status: 'IN_PROGRESS' } as any);
    vi.mocked(prisma.invoiceDunningLog.findFirst).mockResolvedValue(null); // Not already processed
    vi.mocked(prisma.invoiceLineItem.findMany).mockResolvedValue([]); // No existing fee items
    vi.mocked(prisma.dunningRun.update).mockResolvedValue({ id: 'run-1', status: 'COMPLETED', totalInvoices: 1 } as any);

    const result = await service.createDunningRun('tenant-1', 'org-1');

    // Verifies transactions and database entries
    expect(prisma.invoiceLineItem.create).toHaveBeenCalledWith({
      data: {
        tenantId: 'tenant-1',
        invoiceId: 'inv-1',
        description: 'Late Payment Fee - Second Notice',
        quantity: expect.any(Object),
        unitPrice: expect.any(Object),
        totalAmount: expect.any(Object),
        sortOrder: 1,
      },
    });

    expect(prisma.invoice.update).toHaveBeenCalledWith({
      where: { id: 'inv-1' },
      data: {
        subtotal: expect.any(Object),
        totalAmount: expect.any(Object),
      },
    });

    expect(prisma.invoiceDunningLog.create).toHaveBeenCalledWith({
      data: {
        tenantId: 'tenant-1',
        orgId: 'org-1',
        invoiceId: 'inv-1',
        dunningLevelId: 'level-2',
        dunningRunId: 'run-1',
        feeApplied: expect.any(Object),
        status: 'SENT',
        emailSentTo: 'john@example.com',
      },
    });

    // Verifies events
    expect(mockEventEmitter.emit).toHaveBeenCalledWith('finance.invoice.overdue', {
      tenantId: 'tenant-1',
      invoiceId: 'inv-1',
      customerId: 'cust-1',
      dunningLevelId: 'level-2',
      daysOverdue: 20,
      feeApplied: 25,
    });

    expect(mockEventEmitter.emit).toHaveBeenCalledWith('notification.send', {
      tenantId: 'tenant-1',
      userId: 'cust-1',
      type: 'DUNNING_REMINDER',
      title: 'Overdue Invoice Payment Reminder: Invoice #INV-001',
      body: expect.stringContaining('Second Notice'),
      channel: 'EMAIL',
    });

    expect(prisma.dunningRun.update).toHaveBeenCalledWith({
      where: { id: 'run-1' },
      data: {
        totalInvoices: 1,
        status: 'COMPLETED',
      },
    });

    expect(result.totalInvoices).toBe(1);
  });
});
