import { describe, it, expect, vi, beforeEach } from 'vitest';
import { computeAmortizationSchedule, LeaseAccountingService } from '../lease-accounting.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

vi.mock('@unerp/database', () => ({
  prisma: {
    financeLease: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    leaseSchedule: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      createMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    journal: {
      create: vi.fn(),
    },
  },
}));

import { prisma } from '@unerp/database';

const mockEvents = { emit: vi.fn() };
const makeSvc = () => new LeaseAccountingService(mockEvents as any);

const tid = 'tenant-1';
const oid = 'org-1';

const fakeLease = {
  id: 'lease-1',
  tenantId: tid,
  orgId: oid,
  leaseRef: 'L-001',
  description: 'Office HQ',
  startDate: new Date('2024-01-01'),
  endDate: new Date('2026-12-31'),
  leaseType: 'OPERATING',
  presentValue: 100000,
  interestRate: 0.05,
  carryingAmount: 95000,
  initialRecognition: 100000,
  status: 'ACTIVE',
  schedules: [],
};

describe('computeAmortizationSchedule', () => {
  it('computes schedule with correct number of months', () => {
    const rows = computeAmortizationSchedule(12000, 0.06, new Date('2026-01-01'), 12);
    expect(rows).toHaveLength(12);
  });

  it('principal sum approximates PV (existing test)', () => {
    const pv = 12000;
    const rows = computeAmortizationSchedule(pv, 0.06, new Date('2026-01-01'), 12);
    const totalPrincipal = rows.reduce((s, r) => s + r.principalRepayment, 0);
    expect(totalPrincipal).toBeGreaterThan(pv - 0.5);
    expect(totalPrincipal).toBeLessThan(pv + 0.5);
  });

  it('zero-rate divides evenly', () => {
    const rows = computeAmortizationSchedule(12000, null, new Date('2024-01-01'), 12);
    expect(rows[0].paymentAmount).toBeCloseTo(1000);
    expect(rows[0].interestExpense).toBe(0);
  });

  it('first period interest = PV × monthly rate', () => {
    const pv = 120000;
    const annual = 0.06;
    const rows = computeAmortizationSchedule(pv, annual, new Date('2024-01-01'), 24);
    expect(rows[0].interestExpense).toBeCloseTo(pv * (annual / 12), 2);
  });

  it('last period carrying amount is ~0', () => {
    const rows = computeAmortizationSchedule(50000, 0.05, new Date('2024-01-01'), 36);
    expect(rows[35].endingCarryingAmount).toBeCloseTo(0, 0);
  });

  it('total payments = total interest + total principal', () => {
    const rows = computeAmortizationSchedule(80000, 0.04, new Date('2024-01-01'), 24);
    const totalInterest = rows.reduce((s, r) => s + r.interestExpense, 0);
    const totalPrincipal = rows.reduce((s, r) => s + r.principalRepayment, 0);
    const totalPayments = rows.reduce((s, r) => s + r.paymentAmount, 0);
    expect(totalInterest + totalPrincipal).toBeCloseTo(totalPayments, 1);
  });
});

describe('LeaseAccountingService', () => {
  let svc: LeaseAccountingService;

  beforeEach(() => {
    vi.clearAllMocks();
    svc = makeSvc();
  });

  it('getLeases returns paginated results', async () => {
    (prisma.financeLease.findMany as any).mockResolvedValue([fakeLease]);
    (prisma.financeLease.count as any).mockResolvedValue(1);
    const res = await svc.getLeases(tid, { page: 1, limit: 10 });
    expect(res.data).toHaveLength(1);
    expect(res.total).toBe(1);
  });

  it('getLeaseSummary aggregates by type', async () => {
    (prisma.financeLease.findMany as any).mockResolvedValue([
      { ...fakeLease, carryingAmount: 95000, leaseType: 'FINANCE' },
      { ...fakeLease, id: 'l2', carryingAmount: 50000, leaseType: 'OPERATING' },
    ]);
    const sum = await svc.getLeaseSummary(tid);
    expect(sum.totalROU).toBe(145000);
    expect(sum.financeCount).toBe(1);
    expect(sum.operatingCount).toBe(1);
  });

  it('getLeaseById throws NotFoundException for unknown id', async () => {
    (prisma.financeLease.findFirst as any).mockResolvedValue(null);
    await expect(svc.getLeaseById(tid, 'bad')).rejects.toThrow(NotFoundException);
  });

  it('getLeaseById returns lease', async () => {
    (prisma.financeLease.findFirst as any).mockResolvedValue(fakeLease);
    const result = await svc.getLeaseById(tid, 'lease-1');
    expect(result.id).toBe('lease-1');
  });

  it('createLease persists lease and generates schedule', async () => {
    (prisma.financeLease.create as any).mockResolvedValue(fakeLease);
    (prisma.leaseSchedule.createMany as any).mockResolvedValue({ count: 36 });
    (prisma.financeLease.update as any).mockResolvedValue(fakeLease);
    await svc.createLease(tid, oid, { startDate: '2024-01-01', endDate: '2026-12-31', presentValue: 100000, interestRate: 0.05 });
    expect(prisma.leaseSchedule.createMany).toHaveBeenCalled();
  });

  it('createLease throws BadRequestException on invalid date range', async () => {
    await expect(
      svc.createLease(tid, oid, { startDate: '2025-01-01', endDate: '2024-01-01' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('updateLease updates metadata', async () => {
    (prisma.financeLease.findFirst as any).mockResolvedValue(fakeLease);
    (prisma.financeLease.update as any).mockResolvedValue({ ...fakeLease, description: 'Updated' });
    const result = await svc.updateLease(tid, 'lease-1', { description: 'Updated' });
    expect(result.description).toBe('Updated');
  });

  it('setLeaseStatus rejects invalid status', async () => {
    (prisma.financeLease.findFirst as any).mockResolvedValue(fakeLease);
    await expect(svc.setLeaseStatus(tid, 'lease-1', 'BOGUS')).rejects.toThrow(BadRequestException);
  });

  it('setLeaseStatus accepts valid status', async () => {
    (prisma.financeLease.findFirst as any).mockResolvedValue(fakeLease);
    (prisma.financeLease.update as any).mockResolvedValue({ ...fakeLease, status: 'INACTIVE' });
    const result = await svc.setLeaseStatus(tid, 'lease-1', 'INACTIVE');
    expect(result.status).toBe('INACTIVE');
  });

  it('deleteLease rejects non-INACTIVE leases', async () => {
    (prisma.financeLease.findFirst as any).mockResolvedValue(fakeLease);
    await expect(svc.deleteLease(tid, 'lease-1')).rejects.toThrow(BadRequestException);
  });

  it('deleteLease succeeds for INACTIVE lease', async () => {
    (prisma.financeLease.findFirst as any).mockResolvedValue({ ...fakeLease, status: 'INACTIVE', schedules: [] });
    (prisma.leaseSchedule.deleteMany as any).mockResolvedValue({ count: 0 });
    (prisma.financeLease.delete as any).mockResolvedValue(fakeLease);
    const res = await svc.deleteLease(tid, 'lease-1');
    expect(res.success).toBe(true);
  });

  it('postMonthlyEntry posts GL entry and marks schedule as posted', async () => {
    (prisma.financeLease.findFirst as any).mockResolvedValue({ ...fakeLease, schedules: [] });
    const fakeSchedule = {
      id: 'sched-1',
      financeLeaseId: 'lease-1',
      periodStart: new Date('2024-01-01'),
      periodEnd: new Date('2024-01-31'),
      paymentAmount: 1000,
      interestExpense: 400,
      principalRepayment: 600,
    };
    (prisma.leaseSchedule.findFirst as any).mockResolvedValue(fakeSchedule);
    (prisma.journal.create as any).mockResolvedValue({ id: 'je-1' });
    (prisma.leaseSchedule.update as any).mockResolvedValue({ ...fakeSchedule, journalPosted: true });
    (prisma.financeLease.update as any).mockResolvedValue(fakeLease);
    const result = await svc.postMonthlyEntry(tid, 'lease-1', '2024-01');
    expect(result.journalEntry.id).toBe('je-1');
    expect(prisma.leaseSchedule.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ journalPosted: true }) }),
    );
  });

  it('postMonthlyEntry throws NotFoundException when no pending schedule', async () => {
    (prisma.financeLease.findFirst as any).mockResolvedValue({ ...fakeLease, schedules: [] });
    (prisma.leaseSchedule.findFirst as any).mockResolvedValue(null);
    await expect(svc.postMonthlyEntry(tid, 'lease-1', '2024-01')).rejects.toThrow(NotFoundException);
  });

  it('terminateLease throws BadRequestException for non-ACTIVE lease', async () => {
    (prisma.financeLease.findFirst as any).mockResolvedValue({ ...fakeLease, status: 'TERMINATED', schedules: [] });
    await expect(svc.terminateLease(tid, 'lease-1', '2024-06-01')).rejects.toThrow(BadRequestException);
  });

  it('getLeaseAnalytics returns maturity distribution', async () => {
    const future = new Date();
    future.setFullYear(future.getFullYear() + 2);
    (prisma.financeLease.findMany as any).mockResolvedValue([
      { ...fakeLease, endDate: future, leaseType: 'FINANCE', status: 'ACTIVE' },
    ]);
    const analytics = await svc.getLeaseAnalytics(tid);
    expect(analytics.total).toBe(1);
    expect(analytics.byType.FINANCE).toBe(1);
    expect(analytics.maturityDistribution['1to3y']).toBe(1);
  });

  it('getUpcomingPayments queries within the date window', async () => {
    (prisma.leaseSchedule.findMany as any).mockResolvedValue([]);
    await svc.getUpcomingPayments(tid, 30);
    expect(prisma.leaseSchedule.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ journalPosted: false }) }),
    );
  });

  it('getExpiringSoon returns leases expiring within window', async () => {
    (prisma.financeLease.findMany as any).mockResolvedValue([fakeLease]);
    const result = await svc.getExpiringSoon(tid, 90);
    expect(result).toHaveLength(1);
  });
});
