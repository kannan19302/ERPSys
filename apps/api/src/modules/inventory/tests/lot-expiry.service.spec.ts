import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LotExpiryService } from '../lot-expiry.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

vi.mock('@unerp/database', () => ({
  prisma: {
    lotExpiryRecord: {
      findMany: vi.fn(), findFirst: vi.fn(), count: vi.fn(),
      create: vi.fn(), update: vi.fn(),
    },
    lotExpiryAlert: {
      findMany: vi.fn(), findFirst: vi.fn(), count: vi.fn(),
      create: vi.fn(), update: vi.fn(),
    },
    lotDisposalRecord: {
      findMany: vi.fn(), count: vi.fn(), create: vi.fn(),
    },
  },
}));

const T = 'tenant-1';
const futureDate = new Date(Date.now() + 90 * 86400000);

describe('LotExpiryService', () => {
  let svc: LotExpiryService;
  beforeEach(() => { vi.clearAllMocks(); svc = new LotExpiryService(); });

  // ── Lot Records ───────────────────────────────────────────────────────────

  it('registerLot creates lot record', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.lotExpiryRecord.create).mockResolvedValue({ id: 'lot1', lotNumber: 'LOT-001' } as any);
    const result = await svc.registerLot(T, 'u1', { lotNumber: 'LOT-001', productId: 'p1', warehouseId: 'w1', expiryDate: futureDate, qty: 100 });
    expect(prisma.lotExpiryRecord.create).toHaveBeenCalled();
    expect((result as any).lotNumber).toBe('LOT-001');
  });

  it('registerLot throws for past expiryDate', async () => {
    const pastDate = new Date(Date.now() - 86400000);
    await expect(svc.registerLot(T, 'u1', { lotNumber: 'LOT-001', productId: 'p1', warehouseId: 'w1', expiryDate: pastDate, qty: 100 }))
      .rejects.toThrow(BadRequestException);
  });

  it('registerLot throws for non-positive qty', async () => {
    await expect(svc.registerLot(T, 'u1', { lotNumber: 'LOT-001', productId: 'p1', warehouseId: 'w1', expiryDate: futureDate, qty: 0 }))
      .rejects.toThrow(BadRequestException);
  });

  it('getLot throws NotFoundException when not found', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.lotExpiryRecord.findFirst).mockResolvedValue(null);
    await expect(svc.getLot(T, 'lot-none')).rejects.toThrow(NotFoundException);
  });

  it('quarantineLot transitions ACTIVE → QUARANTINE', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.lotExpiryRecord.findFirst).mockResolvedValue({ id: 'lot1', status: 'ACTIVE' } as any);
    vi.mocked(prisma.lotExpiryRecord.update).mockResolvedValue({ id: 'lot1', status: 'QUARANTINE' } as any);
    const result = await svc.quarantineLot(T, 'lot1', 'Failed QC');
    expect((result as any).status).toBe('QUARANTINE');
  });

  it('quarantineLot throws for non-ACTIVE', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.lotExpiryRecord.findFirst).mockResolvedValue({ id: 'lot1', status: 'QUARANTINE' } as any);
    await expect(svc.quarantineLot(T, 'lot1', 'reason')).rejects.toThrow(BadRequestException);
  });

  it('releaseLot transitions QUARANTINE → ACTIVE', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.lotExpiryRecord.findFirst).mockResolvedValue({ id: 'lot1', status: 'QUARANTINE' } as any);
    vi.mocked(prisma.lotExpiryRecord.update).mockResolvedValue({ id: 'lot1', status: 'ACTIVE' } as any);
    const result = await svc.releaseLot(T, 'lot1');
    expect((result as any).status).toBe('ACTIVE');
  });

  // ── FEFO ──────────────────────────────────────────────────────────────────

  it('getFEFOPick returns lots sorted by earliest expiry', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.lotExpiryRecord.findMany).mockResolvedValue([
      { id: 'l1', lotNumber: 'LOT-001', expiryDate: new Date(Date.now() + 10 * 86400000), remainingQty: 30 },
      { id: 'l2', lotNumber: 'LOT-002', expiryDate: new Date(Date.now() + 20 * 86400000), remainingQty: 80 },
    ] as any);
    const result = await svc.getFEFOPick(T, 'p1', 'w1', 50);
    expect(result.picks).toHaveLength(2);
    expect(result.picks[0].lotNumber).toBe('LOT-001');
    expect(result.picks[0].qty).toBe(30);
    expect(result.picks[1].qty).toBe(20);
    expect(result.totalQty).toBe(50);
  });

  it('getFEFOPick throws when insufficient stock', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.lotExpiryRecord.findMany).mockResolvedValue([
      { id: 'l1', lotNumber: 'LOT-001', expiryDate: futureDate, remainingQty: 10 },
    ] as any);
    await expect(svc.getFEFOPick(T, 'p1', 'w1', 50)).rejects.toThrow(BadRequestException);
  });

  // ── Alerts & Disposal ─────────────────────────────────────────────────────

  it('dismissAlert marks alert as dismissed', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.lotExpiryAlert.findFirst).mockResolvedValue({ id: 'al1', dismissed: false } as any);
    vi.mocked(prisma.lotExpiryAlert.update).mockResolvedValue({ id: 'al1', dismissed: true } as any);
    const result = await svc.dismissAlert(T, 'al1');
    expect((result as any).dismissed).toBe(true);
  });

  it('disposeLot auto-numbers LDR-XXXXXX', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.lotExpiryRecord.findFirst).mockResolvedValue({ id: 'lot1', status: 'ACTIVE', remainingQty: 100 } as any);
    vi.mocked(prisma.lotDisposalRecord.count).mockResolvedValue(0);
    vi.mocked(prisma.lotDisposalRecord.create).mockResolvedValue({ id: 'dr1', disposalNumber: 'LDR-000001' } as any);
    vi.mocked(prisma.lotExpiryRecord.update).mockResolvedValue({} as any);
    const result = await svc.disposeLot(T, 'u1', { lotId: 'lot1', disposalMethod: 'DESTROY', qtyDisposed: 50, reason: 'Expired' });
    expect(prisma.lotDisposalRecord.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ disposalNumber: 'LDR-000001' }) })
    );
    expect((result as any).disposalNumber).toBe('LDR-000001');
  });

  it('getDashboard returns expiry stats', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.lotExpiryRecord.count)
      .mockResolvedValueOnce(50).mockResolvedValueOnce(40)
      .mockResolvedValueOnce(3).mockResolvedValueOnce(5)
      .mockResolvedValueOnce(2).mockResolvedValueOnce(2).mockResolvedValueOnce(8);
    vi.mocked(prisma.lotExpiryAlert.count).mockResolvedValue(10);
    const result = await svc.getDashboard(T);
    expect(result.total).toBe(50);
    expect(result.active).toBe(40);
    expect(result.openAlerts).toBe(10);
  });
});
