import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';

vi.mock('@unerp/database', () => ({
  prisma: {
    advanceShippingNotice: {
      count: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      groupBy: vi.fn(),
    },
    aSNLineItem: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    asnDiscrepancy: {
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
      groupBy: vi.fn(),
    },
  },
}));

import { AsnService } from '../asn.service';

describe('AsnService', () => {
  let svc: AsnService;
  const tenantId = 'tenant-1';
  const userId = 'user-1';
  const asnId = 'asn-1';

  beforeEach(() => {
    svc = new AsnService();
    vi.clearAllMocks();
  });

  it('createAsn — auto-numbers ASN-000001', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.advanceShippingNotice.count).mockResolvedValue(0);
    vi.mocked(prisma.advanceShippingNotice.create).mockResolvedValue({ id: asnId, asnNumber: 'ASN-000001' } as never);

    const result = await svc.createAsn(tenantId, userId, { vendorId: 'v1', warehouseId: 'wh-1' });
    expect(vi.mocked(prisma.advanceShippingNotice.create)).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ asnNumber: 'ASN-000001' }) }),
    );
    expect(result).toMatchObject({ id: asnId });
  });

  it('addLineItem — zero qty throws', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.advanceShippingNotice.findFirst).mockResolvedValue({ id: asnId, status: 'PENDING' } as never);
    await expect(svc.addLineItem(tenantId, asnId, { productId: 'p1', expectedQty: 0 })).rejects.toThrow(BadRequestException);
  });

  it('addLineItem — throws on RECEIVED ASN', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.advanceShippingNotice.findFirst).mockResolvedValue({ id: asnId, status: 'RECEIVED' } as never);
    await expect(svc.addLineItem(tenantId, asnId, { productId: 'p1', expectedQty: 10 })).rejects.toThrow(BadRequestException);
  });

  it('markInTransit — PENDING→IN_TRANSIT', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.advanceShippingNotice.findFirst).mockResolvedValue({ id: asnId, status: 'PENDING' } as never);
    vi.mocked(prisma.advanceShippingNotice.update).mockResolvedValue({ id: asnId, status: 'IN_TRANSIT' } as never);

    await svc.markInTransit(tenantId, asnId);
    expect(vi.mocked(prisma.advanceShippingNotice.update)).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'IN_TRANSIT' }) }),
    );
  });

  it('markInTransit — non-PENDING throws', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.advanceShippingNotice.findFirst).mockResolvedValue({ id: asnId, status: 'IN_TRANSIT' } as never);
    await expect(svc.markInTransit(tenantId, asnId)).rejects.toThrow(BadRequestException);
  });

  it('receiveLineItem — auto-creates SHORTAGE discrepancy', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.advanceShippingNotice.findFirst).mockResolvedValue({ id: asnId, status: 'ARRIVED' } as never);
    vi.mocked(prisma.aSNLineItem.findFirst).mockResolvedValue({ id: 'li1', productId: 'p1', expectedQty: 100, receivedQty: 0 } as never);
    vi.mocked(prisma.aSNLineItem.update).mockResolvedValue({ id: 'li1', receivedQty: 80 } as never);
    vi.mocked(prisma.advanceShippingNotice.update).mockResolvedValue({} as never);
    vi.mocked(prisma.asnDiscrepancy.create).mockResolvedValue({ id: 'd1', discrepancyType: 'SHORTAGE' } as never);

    await svc.receiveLineItem(tenantId, userId, asnId, 'li1', 80);
    expect(vi.mocked(prisma.asnDiscrepancy.create)).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ discrepancyType: 'SHORTAGE' }) }),
    );
  });

  it('receiveLineItem — auto-creates OVERAGE discrepancy', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.advanceShippingNotice.findFirst).mockResolvedValue({ id: asnId, status: 'RECEIVING' } as never);
    vi.mocked(prisma.aSNLineItem.findFirst).mockResolvedValue({ id: 'li1', productId: 'p1', expectedQty: 100, receivedQty: 0 } as never);
    vi.mocked(prisma.aSNLineItem.update).mockResolvedValue({ id: 'li1', receivedQty: 120 } as never);
    vi.mocked(prisma.asnDiscrepancy.create).mockResolvedValue({ id: 'd1', discrepancyType: 'OVERAGE' } as never);

    await svc.receiveLineItem(tenantId, userId, asnId, 'li1', 120);
    expect(vi.mocked(prisma.asnDiscrepancy.create)).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ discrepancyType: 'OVERAGE' }) }),
    );
  });

  it('receiveLineItem — exact qty, no discrepancy created', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.advanceShippingNotice.findFirst).mockResolvedValue({ id: asnId, status: 'RECEIVING' } as never);
    vi.mocked(prisma.aSNLineItem.findFirst).mockResolvedValue({ id: 'li1', productId: 'p1', expectedQty: 100, receivedQty: 0 } as never);
    vi.mocked(prisma.aSNLineItem.update).mockResolvedValue({ id: 'li1', receivedQty: 100 } as never);

    await svc.receiveLineItem(tenantId, userId, asnId, 'li1', 100);
    expect(vi.mocked(prisma.asnDiscrepancy.create)).not.toHaveBeenCalled();
  });

  it('finalizeReceiving — all received → RECEIVED status', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.advanceShippingNotice.findFirst).mockResolvedValue({ id: asnId, status: 'RECEIVING' } as never);
    vi.mocked(prisma.aSNLineItem.findMany).mockResolvedValue([
      { expectedQty: 10, receivedQty: 10 },
      { expectedQty: 5, receivedQty: 5 },
    ] as never);
    vi.mocked(prisma.advanceShippingNotice.update).mockResolvedValue({ id: asnId, status: 'RECEIVED' } as never);

    await svc.finalizeReceiving(tenantId, asnId);
    expect(vi.mocked(prisma.advanceShippingNotice.update)).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'RECEIVED' }) }),
    );
  });

  it('finalizeReceiving — partial received → PARTIALLY_RECEIVED', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.advanceShippingNotice.findFirst).mockResolvedValue({ id: asnId, status: 'RECEIVING' } as never);
    vi.mocked(prisma.aSNLineItem.findMany).mockResolvedValue([
      { expectedQty: 10, receivedQty: 8 },
    ] as never);
    vi.mocked(prisma.advanceShippingNotice.update).mockResolvedValue({ id: asnId, status: 'PARTIALLY_RECEIVED' } as never);

    await svc.finalizeReceiving(tenantId, asnId);
    expect(vi.mocked(prisma.advanceShippingNotice.update)).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'PARTIALLY_RECEIVED' }) }),
    );
  });

  it('cancelAsn — RECEIVED throws', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.advanceShippingNotice.findFirst).mockResolvedValue({ id: asnId, status: 'RECEIVED' } as never);
    await expect(svc.cancelAsn(tenantId, asnId)).rejects.toThrow(BadRequestException);
  });

  it('resolveDiscrepancy — already resolved throws', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.asnDiscrepancy.findFirst).mockResolvedValue({ id: 'd1', resolvedAt: new Date() } as never);
    await expect(svc.resolveDiscrepancy(tenantId, userId, 'd1', 'fixed')).rejects.toThrow(BadRequestException);
  });

  it('getDashboard — returns aggregates', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.advanceShippingNotice.groupBy).mockResolvedValue([{ status: 'PENDING', _count: { id: 3 } }] as never);
    vi.mocked(prisma.asnDiscrepancy.groupBy).mockResolvedValue([]);
    vi.mocked(prisma.advanceShippingNotice.findMany).mockResolvedValue([]);

    const result = await svc.getDashboard(tenantId);
    expect(result).toHaveProperty('byStatus');
    expect(result).toHaveProperty('discrepancyStats');
    expect(result).toHaveProperty('recentAsns');
  });
});
