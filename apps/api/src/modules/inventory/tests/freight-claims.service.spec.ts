import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FreightClaimsService } from '../freight-claims.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

vi.mock('@unerp/database', () => ({
  prisma: {
    cargoDamageReport: {
      findMany: vi.fn(), findFirst: vi.fn(), count: vi.fn(),
      create: vi.fn(), update: vi.fn(),
    },
    freightClaim: {
      findMany: vi.fn(), findFirst: vi.fn(), findUnique: vi.fn(),
      count: vi.fn(), create: vi.fn(), update: vi.fn(),
    },
    freightClaimEvent: {
      findMany: vi.fn(), create: vi.fn(),
    },
  },
}));

const T = 'tenant-1';

describe('FreightClaimsService', () => {
  let svc: FreightClaimsService;

  beforeEach(() => {
    vi.clearAllMocks();
    svc = new FreightClaimsService();
  });

  // ── Damage Reports ────────────────────────────────────────────────────────

  it('createDamageReport auto-numbers CDR-XXXXXX', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.cargoDamageReport.count).mockResolvedValue(3);
    vi.mocked(prisma.cargoDamageReport.create).mockResolvedValue({ id: 'dr1', reportNumber: 'CDR-000004' } as any);
    const result = await svc.createDamageReport(T, 'u1', {
      discoveredAt: new Date(), description: 'Pallet crushed', severity: 'MODERATE',
    });
    expect(prisma.cargoDamageReport.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ reportNumber: 'CDR-000004' }) })
    );
    expect((result as any).reportNumber).toBe('CDR-000004');
  });

  it('listDamageReports filters by status', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.cargoDamageReport.findMany).mockResolvedValue([{ id: 'dr1' }] as any);
    vi.mocked(prisma.cargoDamageReport.count).mockResolvedValue(1);
    const result = await svc.listDamageReports(T, { status: 'SUBMITTED' });
    expect(prisma.cargoDamageReport.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ status: 'SUBMITTED' }) })
    );
    expect(result.total).toBe(1);
  });

  it('getDamageReport throws NotFoundException when not found', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.cargoDamageReport.findFirst).mockResolvedValue(null);
    await expect(svc.getDamageReport(T, 'dr-none')).rejects.toThrow(NotFoundException);
  });

  it('submitDamageReport transitions DRAFT → SUBMITTED', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.cargoDamageReport.findFirst).mockResolvedValue({ id: 'dr1', status: 'DRAFT' } as any);
    vi.mocked(prisma.cargoDamageReport.update).mockResolvedValue({ id: 'dr1', status: 'SUBMITTED' } as any);
    const result = await svc.submitDamageReport(T, 'dr1');
    expect((result as any).status).toBe('SUBMITTED');
  });

  it('submitDamageReport throws BadRequestException for non-DRAFT', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.cargoDamageReport.findFirst).mockResolvedValue({ id: 'dr1', status: 'SUBMITTED' } as any);
    await expect(svc.submitDamageReport(T, 'dr1')).rejects.toThrow(BadRequestException);
  });

  it('reviewDamageReport sets reviewedById and reviewedAt', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.cargoDamageReport.findFirst).mockResolvedValue({ id: 'dr1', status: 'SUBMITTED' } as any);
    vi.mocked(prisma.cargoDamageReport.update).mockResolvedValue({ id: 'dr1', status: 'RESOLVED' } as any);
    const result = await svc.reviewDamageReport(T, 'dr1', 'u1', 'RESOLVED');
    expect(prisma.cargoDamageReport.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ reviewedById: 'u1', status: 'RESOLVED' }) })
    );
    expect((result as any).status).toBe('RESOLVED');
  });

  // ── Freight Claims ────────────────────────────────────────────────────────

  it('fileClaim auto-numbers FC-XXXXXX and marks report CLAIM_FILED', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.cargoDamageReport.findFirst).mockResolvedValue({ id: 'dr1', status: 'SUBMITTED' } as any);
    vi.mocked(prisma.freightClaim.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.freightClaim.count).mockResolvedValue(0);
    vi.mocked(prisma.freightClaim.create).mockResolvedValue({ id: 'fc1', claimNumber: 'FC-000001' } as any);
    vi.mocked(prisma.cargoDamageReport.update).mockResolvedValue({} as any);
    const result = await svc.fileClaim(T, 'u1', {
      damageReportId: 'dr1', carrierId: 'c1', claimType: 'DAMAGE', claimedAmount: 5000,
    });
    expect(prisma.freightClaim.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ claimNumber: 'FC-000001' }) })
    );
    expect(prisma.cargoDamageReport.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'CLAIM_FILED' }) })
    );
    expect((result as any).claimNumber).toBe('FC-000001');
  });

  it('fileClaim throws when damage report not found', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.cargoDamageReport.findFirst).mockResolvedValue(null);
    await expect(svc.fileClaim(T, 'u1', {
      damageReportId: 'dr-none', carrierId: 'c1', claimType: 'DAMAGE', claimedAmount: 100,
    })).rejects.toThrow(NotFoundException);
  });

  it('fileClaim throws when duplicate claim exists', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.cargoDamageReport.findFirst).mockResolvedValue({ id: 'dr1' } as any);
    vi.mocked(prisma.freightClaim.findUnique).mockResolvedValue({ id: 'fc-existing' } as any);
    await expect(svc.fileClaim(T, 'u1', {
      damageReportId: 'dr1', carrierId: 'c1', claimType: 'DAMAGE', claimedAmount: 100,
    })).rejects.toThrow(BadRequestException);
  });

  it('fileClaim throws for non-positive claimedAmount', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.cargoDamageReport.findFirst).mockResolvedValue({ id: 'dr1' } as any);
    vi.mocked(prisma.freightClaim.findUnique).mockResolvedValue(null);
    await expect(svc.fileClaim(T, 'u1', {
      damageReportId: 'dr1', carrierId: 'c1', claimType: 'DAMAGE', claimedAmount: 0,
    })).rejects.toThrow(BadRequestException);
  });

  it('updateClaimStatus transitions DRAFT → FILED', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.freightClaim.findFirst).mockResolvedValue({ id: 'fc1', status: 'DRAFT' } as any);
    vi.mocked(prisma.freightClaimEvent.create).mockResolvedValue({} as any);
    vi.mocked(prisma.freightClaim.update).mockResolvedValue({ id: 'fc1', status: 'FILED' } as any);
    const result = await svc.updateClaimStatus(T, 'fc1', 'u1', { status: 'FILED' });
    expect((result as any).status).toBe('FILED');
  });

  it('updateClaimStatus throws for invalid transition', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.freightClaim.findFirst).mockResolvedValue({ id: 'fc1', status: 'DRAFT' } as any);
    await expect(svc.updateClaimStatus(T, 'fc1', 'u1', { status: 'ACCEPTED' })).rejects.toThrow(BadRequestException);
  });

  it('addClaimEvent creates event record', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.freightClaimEvent.create).mockResolvedValue({ id: 'ev1' } as any);
    const result = await svc.addClaimEvent(T, 'fc1', 'u1', 'Carrier acknowledged', 'NOTE');
    expect(prisma.freightClaimEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ claimId: 'fc1', eventType: 'NOTE' }) })
    );
    expect((result as any).id).toBe('ev1');
  });

  it('getDashboard returns aggregate stats', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.cargoDamageReport.count)
      .mockResolvedValueOnce(10).mockResolvedValueOnce(3).mockResolvedValueOnce(2);
    vi.mocked(prisma.freightClaim.count)
      .mockResolvedValueOnce(5).mockResolvedValueOnce(1).mockResolvedValueOnce(2)
      .mockResolvedValueOnce(1).mockResolvedValueOnce(1);
    const result = await svc.getDashboard(T);
    expect(result.totalReports).toBe(10);
    expect(result.draftReports).toBe(3);
    expect(result.totalClaims).toBe(5);
  });
});
