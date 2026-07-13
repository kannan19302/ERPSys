import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ColdChainWriteoffService } from '../cold-chain-writeoff.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

vi.mock('@unerp/database', () => ({
  prisma: {
    coldChainRequirement: {
      findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), count: vi.fn(),
    },
    temperatureExcursion: {
      findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), count: vi.fn(),
    },
    stockWriteDownRequest: {
      findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), count: vi.fn(),
    },
    stockWriteOffRecord: {
      findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), count: vi.fn(),
      groupBy: vi.fn(),
    },
  },
}));

vi.mock('@prisma/client', () => ({
  Prisma: { Decimal: class Decimal { constructor(v: unknown) { return v; } } },
}));

const T = 'tenant-1';

describe('ColdChainWriteoffService', () => {
  let svc: ColdChainWriteoffService;

  beforeEach(() => {
    vi.clearAllMocks();
    svc = new ColdChainWriteoffService();
  });

  // ── Cold Chain Requirements ──────────────────────────────────

  it('upsertRequirement creates new when none exists', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.coldChainRequirement.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.coldChainRequirement.create).mockResolvedValue({ id: 'r1', productId: 'p1' } as any);
    const result = await svc.upsertRequirement(T, { productId: 'p1', minTempCelsius: 2, maxTempCelsius: 8 });
    expect((result as any).id).toBe('r1');
    expect(prisma.coldChainRequirement.create).toHaveBeenCalled();
  });

  it('upsertRequirement updates when existing', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.coldChainRequirement.findUnique).mockResolvedValue({ id: 'r1', productId: 'p1' } as any);
    vi.mocked(prisma.coldChainRequirement.update).mockResolvedValue({ id: 'r1', active: true } as any);
    const result = await svc.upsertRequirement(T, { productId: 'p1', minTempCelsius: 2, maxTempCelsius: 8 });
    expect(prisma.coldChainRequirement.update).toHaveBeenCalled();
    expect((result as any).id).toBe('r1');
  });

  it('deactivateRequirement throws NotFoundException when not found', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.coldChainRequirement.findUnique).mockResolvedValue(null);
    await expect(svc.deactivateRequirement(T, 'p-none')).rejects.toThrow(NotFoundException);
  });

  it('checkProductCompliance returns hasColdChain=false when no requirement', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.coldChainRequirement.findUnique).mockResolvedValue(null);
    const result = await svc.checkProductCompliance(T, 'p1');
    expect(result.hasColdChain).toBe(false);
  });

  it('checkProductCompliance returns compliant=false when open excursions exist', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.coldChainRequirement.findUnique).mockResolvedValue({
      id: 'r1', minTempCelsius: 2, maxTempCelsius: 8,
    } as any);
    vi.mocked(prisma.temperatureExcursion.count).mockResolvedValue(2);
    const result = await svc.checkProductCompliance(T, 'p1');
    expect(result.compliant).toBe(false);
    expect(result.openExcursions).toBe(2);
  });

  // ── Temperature Excursions ────────────────────────────────────

  it('logExcursion classifies CRITICAL severity for large temp deviation', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.coldChainRequirement.findUnique).mockResolvedValue({
      id: 'r1', minTempCelsius: 2, maxTempCelsius: 8,
    } as any);
    vi.mocked(prisma.temperatureExcursion.create).mockImplementation(async ({ data }: any) => ({ id: 'e1', severity: data.severity }));
    const result = await svc.logExcursion(T, {
      productId: 'p1', warehouseId: 'w1', recordedTempC: 25,
      excursionStartAt: '2026-07-13T10:00:00Z', loggedById: 'u1',
    });
    expect((result as any).severity).toBe('CRITICAL');
  });

  it('logExcursion classifies MINOR severity for small deviation', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.coldChainRequirement.findUnique).mockResolvedValue({
      id: 'r1', minTempCelsius: 2, maxTempCelsius: 8,
    } as any);
    vi.mocked(prisma.temperatureExcursion.create).mockImplementation(async ({ data }: any) => ({ id: 'e1', severity: data.severity }));
    const result = await svc.logExcursion(T, {
      productId: 'p1', warehouseId: 'w1', recordedTempC: 10,
      excursionStartAt: '2026-07-13T10:00:00Z', loggedById: 'u1',
    });
    expect((result as any).severity).toBe('MINOR');
  });

  it('logExcursion throws NotFoundException when no cold-chain requirement', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.coldChainRequirement.findUnique).mockResolvedValue(null);
    await expect(svc.logExcursion(T, {
      productId: 'p-none', warehouseId: 'w1', recordedTempC: 25,
      excursionStartAt: '2026-07-13T10:00:00Z', loggedById: 'u1',
    })).rejects.toThrow(NotFoundException);
  });

  it('reviewExcursion updates status', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.temperatureExcursion.findFirst).mockResolvedValue({ id: 'e1', status: 'OPEN' } as any);
    vi.mocked(prisma.temperatureExcursion.update).mockResolvedValue({ id: 'e1', status: 'QUARANTINED' } as any);
    const result = await svc.reviewExcursion(T, 'e1', { status: 'QUARANTINED', reviewedById: 'u1' });
    expect((result as any).status).toBe('QUARANTINED');
  });

  // ── Write-Down Requests ───────────────────────────────────────

  it('createWriteDown throws BadRequestException when proposed >= original value', async () => {
    await expect(svc.createWriteDown(T, {
      warehouseId: 'w1', productId: 'p1', quantity: 10,
      originalValuePerUnit: 5, proposedValuePerUnit: 6,
      writeDownReason: 'Test', requestedById: 'u1',
    })).rejects.toThrow(BadRequestException);
  });

  it('createWriteDown creates write-down with auto-number', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.stockWriteDownRequest.count).mockResolvedValue(5);
    vi.mocked(prisma.stockWriteDownRequest.create).mockImplementation(async ({ data }: any) => ({
      id: 'wd1', requestNumber: data.requestNumber,
    }));
    const result = await svc.createWriteDown(T, {
      warehouseId: 'w1', productId: 'p1', quantity: 10,
      originalValuePerUnit: 10, proposedValuePerUnit: 5,
      writeDownReason: 'Aging', requestedById: 'u1',
    });
    expect((result as any).requestNumber).toBe('WD-000006');
  });

  it('approveWriteDown transitions to APPROVED', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.stockWriteDownRequest.findFirst).mockResolvedValue({ id: 'wd1', status: 'PENDING_APPROVAL' } as any);
    vi.mocked(prisma.stockWriteDownRequest.update).mockResolvedValue({ id: 'wd1', status: 'APPROVED' } as any);
    const result = await svc.approveWriteDown(T, 'wd1', 'u2');
    expect((result as any).status).toBe('APPROVED');
  });

  it('approveWriteDown throws BadRequestException for non-pending', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.stockWriteDownRequest.findFirst).mockResolvedValue({ id: 'wd1', status: 'APPROVED' } as any);
    await expect(svc.approveWriteDown(T, 'wd1', 'u2')).rejects.toThrow(BadRequestException);
  });

  // ── Write-Off Records ─────────────────────────────────────────

  it('createWriteOff calculates totalWriteOff correctly', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.stockWriteOffRecord.count).mockResolvedValue(0);
    vi.mocked(prisma.stockWriteOffRecord.create).mockImplementation(async ({ data }: any) => ({
      id: 'wo1', totalWriteOff: data.totalWriteOff,
    }));
    const result = await svc.createWriteOff(T, {
      warehouseId: 'w1', productId: 'p1', quantity: 20,
      bookValuePerUnit: 15, disposalMethod: 'DESTROY',
      writeOffReason: 'Expired', requestedById: 'u1',
    });
    expect(prisma.stockWriteOffRecord.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ writeOffNumber: 'WO-000001' }) })
    );
  });

  it('completeWriteOff throws BadRequestException for non-approved', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.stockWriteOffRecord.findFirst).mockResolvedValue({ id: 'wo1', status: 'DRAFT' } as any);
    await expect(svc.completeWriteOff(T, 'wo1')).rejects.toThrow(BadRequestException);
  });

  it('getDashboard returns aggregate counts', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.coldChainRequirement.count).mockResolvedValue(12);
    vi.mocked(prisma.temperatureExcursion.count)
      .mockResolvedValueOnce(3)  // open
      .mockResolvedValueOnce(1); // critical
    vi.mocked(prisma.stockWriteDownRequest.count).mockResolvedValue(5);
    vi.mocked(prisma.stockWriteOffRecord.count).mockResolvedValue(2);
    vi.mocked(prisma.stockWriteOffRecord.groupBy).mockResolvedValue([{ _sum: { totalWriteOff: 50000 } }] as any);
    const result = await svc.getDashboard(T);
    expect(result.coldChainProducts).toBe(12);
    expect(result.openExcursions).toBe(3);
    expect(result.totalWriteOffValue).toBe(50000);
  });
});
