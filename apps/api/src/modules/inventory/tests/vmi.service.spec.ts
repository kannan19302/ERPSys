import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VmiService } from '../vmi.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

vi.mock('@unerp/database', () => ({
  prisma: {
    vmiAgreement: {
      findMany: vi.fn(), findFirst: vi.fn(), count: vi.fn(),
      create: vi.fn(), update: vi.fn(),
    },
    vmiStockSnapshot: {
      findMany: vi.fn(), create: vi.fn(),
    },
    vmiOrder: {
      findMany: vi.fn(), findFirst: vi.fn(), count: vi.fn(),
      create: vi.fn(), update: vi.fn(),
    },
  },
}));

const T = 'tenant-1';

describe('VmiService', () => {
  let svc: VmiService;
  beforeEach(() => { vi.clearAllMocks(); svc = new VmiService(); });

  // ── Agreements ────────────────────────────────────────────────────────────

  it('createAgreement auto-numbers VMI-XXXXXX', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.vmiAgreement.count).mockResolvedValue(2);
    vi.mocked(prisma.vmiAgreement.create).mockResolvedValue({ id: 'ag1', agreementNumber: 'VMI-000003' } as any);
    const result = await svc.createAgreement(T, 'u1', {
      vendorId: 'v1', warehouseId: 'w1', productId: 'p1', minQty: 10, maxQty: 100, targetQty: 80,
    });
    expect(prisma.vmiAgreement.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ agreementNumber: 'VMI-000003' }) })
    );
    expect((result as any).agreementNumber).toBe('VMI-000003');
  });

  it('createAgreement throws when minQty >= maxQty', async () => {
    await expect(svc.createAgreement(T, 'u1', {
      vendorId: 'v1', warehouseId: 'w1', productId: 'p1', minQty: 100, maxQty: 50, targetQty: 70,
    })).rejects.toThrow(BadRequestException);
  });

  it('createAgreement throws when targetQty out of range', async () => {
    await expect(svc.createAgreement(T, 'u1', {
      vendorId: 'v1', warehouseId: 'w1', productId: 'p1', minQty: 10, maxQty: 100, targetQty: 5,
    })).rejects.toThrow(BadRequestException);
  });

  it('activateAgreement transitions DRAFT → ACTIVE', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.vmiAgreement.findFirst).mockResolvedValue({ id: 'ag1', status: 'DRAFT' } as any);
    vi.mocked(prisma.vmiAgreement.update).mockResolvedValue({ id: 'ag1', status: 'ACTIVE' } as any);
    const result = await svc.activateAgreement(T, 'ag1');
    expect((result as any).status).toBe('ACTIVE');
  });

  it('activateAgreement throws for non-DRAFT', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.vmiAgreement.findFirst).mockResolvedValue({ id: 'ag1', status: 'ACTIVE' } as any);
    await expect(svc.activateAgreement(T, 'ag1')).rejects.toThrow(BadRequestException);
  });

  it('suspendAgreement transitions ACTIVE → SUSPENDED', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.vmiAgreement.findFirst).mockResolvedValue({ id: 'ag1', status: 'ACTIVE' } as any);
    vi.mocked(prisma.vmiAgreement.update).mockResolvedValue({ id: 'ag1', status: 'SUSPENDED' } as any);
    const result = await svc.suspendAgreement(T, 'ag1');
    expect((result as any).status).toBe('SUSPENDED');
  });

  it('terminateAgreement throws when already terminated', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.vmiAgreement.findFirst).mockResolvedValue({ id: 'ag1', status: 'TERMINATED' } as any);
    await expect(svc.terminateAgreement(T, 'ag1')).rejects.toThrow(BadRequestException);
  });

  // ── Stock Snapshots ───────────────────────────────────────────────────────

  it('recordSnapshot creates snapshot and auto-triggers order when below min', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.vmiAgreement.findFirst)
      .mockResolvedValueOnce({ id: 'ag1', status: 'ACTIVE', replenTrigger: 'BELOW_MIN', minQty: 20, maxQty: 100, targetQty: 80, vendorId: 'v1', currency: 'USD' } as any)
      .mockResolvedValueOnce({ id: 'ag1', status: 'ACTIVE', replenTrigger: 'BELOW_MIN', minQty: 20, maxQty: 100, targetQty: 80, vendorId: 'v1', currency: 'USD' } as any);
    vi.mocked(prisma.vmiStockSnapshot.create).mockResolvedValue({ id: 'ss1' } as any);
    vi.mocked(prisma.vmiOrder.count).mockResolvedValue(0);
    vi.mocked(prisma.vmiOrder.create).mockResolvedValue({ id: 'ord1', orderNumber: 'VMIO-000001' } as any);

    await svc.recordSnapshot(T, 'u1', { agreementId: 'ag1', snapshotDate: new Date(), onHandQty: 5 });

    expect(prisma.vmiStockSnapshot.create).toHaveBeenCalled();
    expect(prisma.vmiOrder.create).toHaveBeenCalled(); // auto-trigger fired
  });

  it('recordSnapshot does not trigger order when at or above min', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.vmiAgreement.findFirst).mockResolvedValue(
      { id: 'ag1', status: 'ACTIVE', replenTrigger: 'BELOW_MIN', minQty: 20, maxQty: 100, targetQty: 80, vendorId: 'v1', currency: 'USD' } as any
    );
    vi.mocked(prisma.vmiStockSnapshot.create).mockResolvedValue({ id: 'ss1' } as any);
    await svc.recordSnapshot(T, 'u1', { agreementId: 'ag1', snapshotDate: new Date(), onHandQty: 25 });
    expect(prisma.vmiOrder.create).not.toHaveBeenCalled();
  });

  // ── VMI Orders ────────────────────────────────────────────────────────────

  it('createOrder auto-numbers VMIO-XXXXXX', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.vmiAgreement.findFirst).mockResolvedValue({ id: 'ag1', vendorId: 'v1', currency: 'USD' } as any);
    vi.mocked(prisma.vmiOrder.count).mockResolvedValue(4);
    vi.mocked(prisma.vmiOrder.create).mockResolvedValue({ id: 'ord1', orderNumber: 'VMIO-000005' } as any);
    const result = await svc.createOrder(T, 'u1', { agreementId: 'ag1', triggeredBy: 'MANUAL', orderedQty: 50 });
    expect(prisma.vmiOrder.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ orderNumber: 'VMIO-000005' }) })
    );
    expect((result as any).orderNumber).toBe('VMIO-000005');
  });

  it('createOrder throws for non-positive orderedQty', async () => {
    await expect(svc.createOrder(T, 'u1', { agreementId: 'ag1', triggeredBy: 'MANUAL', orderedQty: 0 }))
      .rejects.toThrow(BadRequestException);
  });

  it('advanceOrderStatus PENDING → CONFIRMED', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.vmiOrder.findFirst).mockResolvedValue({ id: 'ord1', status: 'PENDING' } as any);
    vi.mocked(prisma.vmiOrder.update).mockResolvedValue({ id: 'ord1', status: 'CONFIRMED' } as any);
    const result = await svc.advanceOrderStatus(T, 'ord1', { status: 'CONFIRMED' });
    expect((result as any).status).toBe('CONFIRMED');
  });

  it('advanceOrderStatus throws for invalid transition', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.vmiOrder.findFirst).mockResolvedValue({ id: 'ord1', status: 'PENDING' } as any);
    await expect(svc.advanceOrderStatus(T, 'ord1', { status: 'RECEIVED' })).rejects.toThrow(BadRequestException);
  });

  it('getDashboard returns aggregate stats', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.vmiAgreement.count).mockResolvedValueOnce(10).mockResolvedValueOnce(7).mockResolvedValueOnce(2);
    vi.mocked(prisma.vmiOrder.count).mockResolvedValueOnce(20).mockResolvedValueOnce(5).mockResolvedValueOnce(3).mockResolvedValueOnce(2);
    const result = await svc.getDashboard(T);
    expect(result.totalAgreements).toBe(10);
    expect(result.activeAgreements).toBe(7);
    expect(result.totalOrders).toBe(20);
    expect(result.pendingOrders).toBe(5);
  });

  it('getAgreement throws NotFoundException when not found', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.vmiAgreement.findFirst).mockResolvedValue(null);
    await expect(svc.getAgreement(T, 'ag-none')).rejects.toThrow(NotFoundException);
  });
});
