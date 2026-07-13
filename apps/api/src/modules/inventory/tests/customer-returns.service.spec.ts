import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CustomerReturnsService } from '../customer-returns.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

vi.mock('@unerp/database', () => ({
  prisma: {
    customerRma: {
      findMany: vi.fn(), findFirst: vi.fn(), count: vi.fn(),
      create: vi.fn(), update: vi.fn(), updateMany: vi.fn(),
    },
    customerRmaLine: {
      findMany: vi.fn(), findFirst: vi.fn(), count: vi.fn(),
      update: vi.fn(),
    },
    returnCredit: {
      findMany: vi.fn(), findFirst: vi.fn(), findUnique: vi.fn(),
      count: vi.fn(), create: vi.fn(), update: vi.fn(), groupBy: vi.fn(),
    },
    returnRestock: {
      findMany: vi.fn(), create: vi.fn(),
    },
  },
}));

vi.mock('@prisma/client', () => ({
  Prisma: { Decimal: class Decimal { constructor(v: unknown) { return v; } } },
}));

const T = 'tenant-1';

describe('CustomerReturnsService', () => {
  let svc: CustomerReturnsService;

  beforeEach(() => {
    vi.clearAllMocks();
    svc = new CustomerReturnsService();
  });

  // ── RMA Lifecycle ─────────────────────────────────────────────────────────

  it('createRma generates RMA-000001 for first RMA', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.customerRma.count).mockResolvedValue(0);
    vi.mocked(prisma.customerRma.create).mockImplementation(async ({ data }: any) => ({
      id: 'rma1', rmaNumber: data.rmaNumber, lines: [],
    }));
    const result = await svc.createRma(T, {
      customerId: 'c1', returnReason: 'Defective', requestedById: 'u1',
      lines: [{ productId: 'p1', quantityRequested: 5 }],
    });
    expect((result as any).rmaNumber).toBe('RMA-000001');
  });

  it('getRma throws NotFoundException when not found', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.customerRma.findFirst).mockResolvedValue(null);
    await expect(svc.getRma(T, 'rma-none')).rejects.toThrow(NotFoundException);
  });

  it('approveRma transitions REQUESTED → APPROVED', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.customerRma.findFirst).mockResolvedValue({ id: 'rma1', status: 'REQUESTED' } as any);
    vi.mocked(prisma.customerRma.update).mockResolvedValue({ id: 'rma1', status: 'APPROVED' } as any);
    const result = await svc.approveRma(T, 'rma1', 'u2');
    expect((result as any).status).toBe('APPROVED');
  });

  it('approveRma throws BadRequestException for non-REQUESTED RMA', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.customerRma.findFirst).mockResolvedValue({ id: 'rma1', status: 'APPROVED' } as any);
    await expect(svc.approveRma(T, 'rma1', 'u2')).rejects.toThrow(BadRequestException);
  });

  it('rejectRma transitions REQUESTED → REJECTED', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.customerRma.findFirst).mockResolvedValue({ id: 'rma1', status: 'REQUESTED' } as any);
    vi.mocked(prisma.customerRma.update).mockResolvedValue({ id: 'rma1', status: 'REJECTED' } as any);
    const result = await svc.rejectRma(T, 'rma1', 'u2', 'Not eligible');
    expect((result as any).status).toBe('REJECTED');
  });

  it('receiveRma throws BadRequestException for non-APPROVED RMA', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.customerRma.findFirst).mockResolvedValue({ id: 'rma1', status: 'REQUESTED' } as any);
    await expect(svc.receiveRma(T, 'rma1', { lines: [] })).rejects.toThrow(BadRequestException);
  });

  it('receiveRma updates lines and transitions to RECEIVED', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.customerRma.findFirst).mockResolvedValue({ id: 'rma1', status: 'APPROVED' } as any);
    vi.mocked(prisma.customerRmaLine.update).mockResolvedValue({ id: 'l1' } as any);
    vi.mocked(prisma.customerRma.update).mockResolvedValue({ id: 'rma1', status: 'RECEIVED', lines: [] } as any);
    const result = await svc.receiveRma(T, 'rma1', {
      lines: [{ lineId: 'l1', quantityReceived: 4 }],
    });
    expect((result as any).status).toBe('RECEIVED');
    expect(prisma.customerRmaLine.update).toHaveBeenCalledTimes(1);
  });

  // ── Line Inspection ───────────────────────────────────────────────────────

  it('inspectLine sets disposition and auto-advances RMA when all lines inspected', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.customerRma.findFirst).mockResolvedValue({ id: 'rma1', status: 'RECEIVED' } as any);
    vi.mocked(prisma.customerRmaLine.findFirst).mockResolvedValue({ id: 'l1', rmaId: 'rma1' } as any);
    vi.mocked(prisma.customerRmaLine.update).mockResolvedValue({ id: 'l1', disposition: 'RESTOCK' } as any);
    vi.mocked(prisma.customerRmaLine.count).mockResolvedValue(0); // no uninspected
    vi.mocked(prisma.customerRma.update).mockResolvedValue({ id: 'rma1', status: 'INSPECTED' } as any);
    const result = await svc.inspectLine(T, 'rma1', 'l1', { disposition: 'RESTOCK', inspectedById: 'u1' });
    expect((result as any).disposition).toBe('RESTOCK');
    expect(prisma.customerRma.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: 'INSPECTED' } })
    );
  });

  it('closeRma throws BadRequestException when not INSPECTED', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.customerRma.findFirst).mockResolvedValue({ id: 'rma1', status: 'RECEIVED' } as any);
    await expect(svc.closeRma(T, 'rma1')).rejects.toThrow(BadRequestException);
  });

  // ── Credits ───────────────────────────────────────────────────────────────

  it('issueCredit creates credit memo with auto-number', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.customerRma.findFirst).mockResolvedValue({ id: 'rma1', customerId: 'c1' } as any);
    vi.mocked(prisma.returnCredit.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.returnCredit.count).mockResolvedValue(0);
    vi.mocked(prisma.returnCredit.create).mockImplementation(async ({ data }: any) => ({
      id: 'cr1', creditNumber: data.creditNumber, status: 'ISSUED',
    }));
    const result = await svc.issueCredit(T, 'rma1', { creditAmount: 250, issuedById: 'u1' });
    expect((result as any).creditNumber).toBe('CRM-000001');
    expect((result as any).status).toBe('ISSUED');
  });

  it('issueCredit throws BadRequestException for zero/negative amount', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.customerRma.findFirst).mockResolvedValue({ id: 'rma1', customerId: 'c1' } as any);
    await expect(svc.issueCredit(T, 'rma1', { creditAmount: 0, issuedById: 'u1' })).rejects.toThrow(BadRequestException);
  });

  it('issueCredit throws BadRequestException when credit already exists', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.customerRma.findFirst).mockResolvedValue({ id: 'rma1', customerId: 'c1' } as any);
    vi.mocked(prisma.returnCredit.findUnique).mockResolvedValue({ id: 'cr1' } as any);
    await expect(svc.issueCredit(T, 'rma1', { creditAmount: 100, issuedById: 'u1' })).rejects.toThrow(BadRequestException);
  });

  it('voidCredit transitions ISSUED → VOIDED', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.returnCredit.findFirst).mockResolvedValue({ id: 'cr1', status: 'ISSUED' } as any);
    vi.mocked(prisma.returnCredit.update).mockResolvedValue({ id: 'cr1', status: 'VOIDED' } as any);
    const result = await svc.voidCredit(T, 'cr1', { voidedById: 'u1', voidReason: 'Error' });
    expect((result as any).status).toBe('VOIDED');
  });

  // ── Restock ───────────────────────────────────────────────────────────────

  it('restockLine throws BadRequestException when disposition is not RESTOCK', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.customerRmaLine.findFirst).mockResolvedValue({ id: 'l1', disposition: 'SCRAP' } as any);
    await expect(svc.restockLine(T, {
      rmaLineId: 'l1', productId: 'p1', warehouseId: 'w1',
      quantityRestocked: 4, restockedById: 'u1',
    })).rejects.toThrow(BadRequestException);
  });

  it('restockLine creates restock record', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.customerRmaLine.findFirst).mockResolvedValue({ id: 'l1', disposition: 'RESTOCK' } as any);
    vi.mocked(prisma.returnRestock.create).mockResolvedValue({ id: 'rs1', rmaLineId: 'l1' } as any);
    const result = await svc.restockLine(T, {
      rmaLineId: 'l1', productId: 'p1', warehouseId: 'w1',
      quantityRestocked: 4, restockedById: 'u1',
    });
    expect((result as any).id).toBe('rs1');
  });

  // ── Dashboard ─────────────────────────────────────────────────────────────

  it('getDashboard returns aggregate counts', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.customerRma.count)
      .mockResolvedValueOnce(50) // total
      .mockResolvedValueOnce(5)  // requested
      .mockResolvedValueOnce(10) // approved
      .mockResolvedValueOnce(8)  // received
      .mockResolvedValueOnce(3); // inspected
    vi.mocked(prisma.returnCredit.count)
      .mockResolvedValueOnce(20) // total
      .mockResolvedValueOnce(2); // pending
    vi.mocked(prisma.returnCredit.groupBy).mockResolvedValue([
      { status: 'ISSUED', _sum: { creditAmount: 12500 } },
    ] as any);
    const result = await svc.getDashboard(T);
    expect(result.totalRmas).toBe(50);
    expect(result.requested).toBe(5);
    expect(result.totalCredits).toBe(20);
    expect(result.totalCreditIssued).toBe(12500);
  });
});
