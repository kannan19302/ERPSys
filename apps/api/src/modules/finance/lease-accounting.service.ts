import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { Prisma } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';

export type AmortizationRow = {
  periodStart: Date;
  periodEnd: Date;
  paymentAmount: number;
  interestExpense: number;
  principalRepayment: number;
  endingCarryingAmount: number;
};

export function computeAmortizationSchedule(
  presentValue: number,
  annualRate: number | null,
  startDate: Date,
  months: number,
): AmortizationRow[] {
  const rows: AmortizationRow[] = [];
  const r = annualRate != null ? Number(annualRate) / 12.0 : 0;
  const pv = Number(presentValue);
  let payment = 0;
  if (r === 0) {
    payment = pv / months;
  } else {
    const pow = Math.pow(1 + r, months);
    payment = (pv * (r * pow)) / (pow - 1);
  }

  let carrying = pv;
  for (let i = 0; i < months; i++) {
    const periodStart = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
    const periodEnd = new Date(startDate.getFullYear(), startDate.getMonth() + i + 1, 0);
    const interestExpense = carrying * r;
    const principalRepayment = payment - interestExpense;
    const endingCarryingAmount = Math.max(0, carrying - principalRepayment);

    rows.push({
      periodStart,
      periodEnd,
      paymentAmount: payment,
      interestExpense,
      principalRepayment,
      endingCarryingAmount,
    });

    carrying = endingCarryingAmount;
  }
  return rows;
}

@Injectable()
export class LeaseAccountingService {
  constructor(private readonly events: EventEmitter2) {}

  async getLeases(
    tenantId: string,
    params: { page?: number; limit?: number; search?: string; leaseType?: string; status?: string; sortBy?: string; sortOrder?: string },
  ) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const skip = (page - 1) * limit;
    const where: Prisma.FinanceLeaseWhereInput = {
      tenantId,
      ...(params.search
        ? { OR: [{ leaseRef: { contains: params.search, mode: 'insensitive' } }, { description: { contains: params.search, mode: 'insensitive' } }] }
        : {}),
      ...(params.leaseType ? { leaseType: params.leaseType } : {}),
      ...(params.status ? { status: params.status } : {}),
    };
    const orderBy: Prisma.FinanceLeaseOrderByWithRelationInput =
      params.sortBy === 'startDate'
        ? { startDate: (params.sortOrder as any) ?? 'desc' }
        : params.sortBy === 'endDate'
          ? { endDate: (params.sortOrder as any) ?? 'asc' }
          : params.sortBy === 'presentValue'
            ? { presentValue: (params.sortOrder as any) ?? 'desc' }
            : { createdAt: 'desc' };

    const [data, total] = await Promise.all([
      prisma.financeLease.findMany({ where, skip, take: limit, orderBy }),
      prisma.financeLease.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getLeaseSummary(tenantId: string) {
    const leases = await prisma.financeLease.findMany({ where: { tenantId, status: 'ACTIVE' } });
    const totalROU = leases.reduce((s, l) => s + Number(l.carryingAmount ?? 0), 0);
    const totalLiability = leases.reduce((s, l) => s + Number(l.carryingAmount ?? 0), 0);
    const financeCount = leases.filter((l) => l.leaseType === 'FINANCE').length;
    const operatingCount = leases.filter((l) => l.leaseType === 'OPERATING').length;
    return { totalROU, totalLiability, activeLeases: leases.length, financeCount, operatingCount };
  }

  async getUpcomingPayments(tenantId: string, days = 30) {
    const now = new Date();
    const until = new Date(now.getTime() + days * 86400000);
    const schedules = await prisma.leaseSchedule.findMany({
      where: { tenantId, journalPosted: false, periodStart: { gte: now, lte: until } },
      include: { financeLease: true },
      orderBy: { periodStart: 'asc' },
    });
    return schedules;
  }

  async getExpiringSoon(tenantId: string, days = 90) {
    const now = new Date();
    const until = new Date(now.getTime() + days * 86400000);
    return prisma.financeLease.findMany({
      where: { tenantId, status: 'ACTIVE', endDate: { gte: now, lte: until } },
      orderBy: { endDate: 'asc' },
    });
  }

  async getLeaseAnalytics(tenantId: string) {
    const all = await prisma.financeLease.findMany({ where: { tenantId } });
    const byType = { FINANCE: 0, OPERATING: 0 };
    const byStatus: Record<string, number> = {};
    const maturity = { lt1y: 0, '1to3y': 0, '3to5y': 0, gt5y: 0 };
    const now = new Date();
    for (const l of all) {
      byType[l.leaseType as keyof typeof byType] = (byType[l.leaseType as keyof typeof byType] ?? 0) + 1;
      byStatus[l.status] = (byStatus[l.status] ?? 0) + 1;
      const months = (l.endDate.getFullYear() - now.getFullYear()) * 12 + l.endDate.getMonth() - now.getMonth();
      if (months < 12) maturity.lt1y++;
      else if (months < 36) maturity['1to3y']++;
      else if (months < 60) maturity['3to5y']++;
      else maturity.gt5y++;
    }
    return { total: all.length, byType, byStatus, maturityDistribution: maturity };
  }

  async getLeaseById(tenantId: string, id: string) {
    const lease = await prisma.financeLease.findFirst({
      where: { id, tenantId },
      include: { schedules: { orderBy: { periodStart: 'asc' } } },
    });
    if (!lease) throw new NotFoundException('Lease not found');
    return lease;
  }

  async getLeaseSchedule(tenantId: string, id: string) {
    await this.getLeaseById(tenantId, id);
    return prisma.leaseSchedule.findMany({
      where: { financeLeaseId: id, tenantId },
      orderBy: { periodStart: 'asc' },
    });
  }

  async getLeaseJournalEntries(tenantId: string, id: string) {
    const schedules = await prisma.leaseSchedule.findMany({
      where: { financeLeaseId: id, tenantId, journalPosted: true },
      orderBy: { periodStart: 'asc' },
    });
    return schedules;
  }

  async createLease(
    tenantId: string,
    orgId: string,
    payload: {
      leaseRef?: string;
      description?: string;
      startDate: string;
      endDate: string;
      leaseType?: string;
      presentValue?: number;
      interestRate?: number;
    },
  ) {
    const start = new Date(payload.startDate);
    const end = new Date(payload.endDate);
    const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1;
    if (months <= 0) throw new BadRequestException('endDate must be after startDate');

    const lease = await prisma.financeLease.create({
      data: {
        tenantId,
        orgId,
        leaseRef: payload.leaseRef ?? null,
        description: payload.description ?? null,
        startDate: start,
        endDate: end,
        leaseType: payload.leaseType ?? 'OPERATING',
        presentValue: payload.presentValue != null ? new Prisma.Decimal(payload.presentValue) : null,
        interestRate: payload.interestRate != null ? new Prisma.Decimal(payload.interestRate) : null,
        initialRecognition: payload.presentValue != null ? new Prisma.Decimal(payload.presentValue) : null,
        carryingAmount: payload.presentValue != null ? new Prisma.Decimal(payload.presentValue) : null,
        status: 'ACTIVE',
      },
    });

    if (months > 0 && payload.presentValue) {
      const rows = computeAmortizationSchedule(payload.presentValue, payload.interestRate ?? null, start, months);
      await prisma.leaseSchedule.createMany({
        data: rows.map((r) => ({
          tenantId,
          financeLeaseId: lease.id,
          periodStart: r.periodStart,
          periodEnd: r.periodEnd,
          paymentAmount: new Prisma.Decimal(r.paymentAmount),
          interestExpense: new Prisma.Decimal(r.interestExpense),
          principalRepayment: new Prisma.Decimal(r.principalRepayment),
          rouAmortization: new Prisma.Decimal(r.principalRepayment),
        })),
      });
    }

    this.events.emit('finance.lease.created', { tenantId, leaseId: lease.id });
    return lease;
  }

  async updateLease(
    tenantId: string,
    id: string,
    payload: { leaseRef?: string; description?: string; leaseType?: string },
  ) {
    await this.getLeaseById(tenantId, id);
    return prisma.financeLease.update({
      where: { id },
      data: {
        ...(payload.leaseRef !== undefined ? { leaseRef: payload.leaseRef } : {}),
        ...(payload.description !== undefined ? { description: payload.description } : {}),
        ...(payload.leaseType !== undefined ? { leaseType: payload.leaseType } : {}),
      },
    });
  }

  async setLeaseStatus(tenantId: string, id: string, status: string) {
    await this.getLeaseById(tenantId, id);
    const allowed = ['ACTIVE', 'INACTIVE', 'EXPIRED', 'TERMINATED'];
    if (!allowed.includes(status)) throw new BadRequestException(`Invalid status: ${status}`);
    return prisma.financeLease.update({ where: { id }, data: { status } });
  }

  async deleteLease(tenantId: string, id: string) {
    const lease = await this.getLeaseById(tenantId, id);
    if (lease.status !== 'INACTIVE') throw new BadRequestException('Only INACTIVE leases can be deleted');
    await prisma.leaseSchedule.deleteMany({ where: { financeLeaseId: id } });
    await prisma.financeLease.delete({ where: { id } });
    return { success: true };
  }

  async postMonthlyEntry(tenantId: string, leaseId: string, period: string) {
    const lease = await this.getLeaseById(tenantId, leaseId);
    const parts = period.split('-');
    const year = parseInt(parts[0]!, 10);
    const month = parseInt(parts[1]!, 10);
    const schedule = await prisma.leaseSchedule.findFirst({
      where: {
        tenantId,
        financeLeaseId: leaseId,
        journalPosted: false,
        periodStart: { gte: new Date(year, month - 1, 1), lte: new Date(year, month - 1, 28) },
      },
    });
    if (!schedule) throw new NotFoundException(`No unposted schedule entry found for ${period}`);

    const entryNumber = `LEASE-${lease.leaseRef ?? leaseId}-${period}`;
    const journal = await prisma.journal.create({
      data: {
        tenantId,
        orgId: lease.orgId,
        entryNumber,
        date: schedule.periodEnd,
        status: 'POSTED',
        notes: `Lease payment — ${lease.description ?? lease.leaseRef ?? leaseId} (${period})`,
        entries: {
          create: [
            {
              tenantId,
              accountId: 'lease-liability-account',
              description: 'Principal repayment — lease liability reduction',
              debit: new Prisma.Decimal(Number(schedule.principalRepayment ?? 0)),
              credit: new Prisma.Decimal(0),
            },
            {
              tenantId,
              accountId: 'interest-expense-account',
              description: 'Interest expense on lease liability',
              debit: new Prisma.Decimal(Number(schedule.interestExpense ?? 0)),
              credit: new Prisma.Decimal(0),
            },
            {
              tenantId,
              accountId: 'cash-account',
              description: 'Cash payment for lease',
              debit: new Prisma.Decimal(0),
              credit: new Prisma.Decimal(Number(schedule.paymentAmount)),
            },
          ],
        },
      },
    });

    await prisma.leaseSchedule.update({
      where: { id: schedule.id },
      data: { journalPosted: true, journalEntryId: journal.id },
    });

    const newCarrying = Math.max(0, Number(lease.carryingAmount ?? 0) - Number(schedule.principalRepayment ?? 0));
    await prisma.financeLease.update({ where: { id: leaseId }, data: { carryingAmount: new Prisma.Decimal(newCarrying) } });

    this.events.emit('finance.lease.entry_posted', { tenantId, leaseId, period, journalId: journal.id });
    return { schedule, journalEntry: journal };
  }

  async bulkPostMonth(tenantId: string, period: string) {
    const parts = period.split('-');
    const year = parseInt(parts[0]!, 10);
    const month = parseInt(parts[1]!, 10);
    const schedules = await prisma.leaseSchedule.findMany({
      where: {
        tenantId,
        journalPosted: false,
        periodStart: { gte: new Date(year, month - 1, 1), lte: new Date(year, month - 1, 28) },
      },
    });
    const results = [];
    for (const s of schedules) {
      try {
        const result = await this.postMonthlyEntry(tenantId, s.financeLeaseId, period);
        results.push({ leaseId: s.financeLeaseId, status: 'posted', journalEntryId: result.journalEntry.id });
      } catch {
        results.push({ leaseId: s.financeLeaseId, status: 'error' });
      }
    }
    return { period, processed: schedules.length, results };
  }

  async terminateLease(tenantId: string, id: string, terminationDate: string) {
    const lease = await this.getLeaseById(tenantId, id);
    if (lease.status !== 'ACTIVE') throw new BadRequestException('Only ACTIVE leases can be terminated');
    const tDate = new Date(terminationDate);
    const remaining = Number(lease.carryingAmount ?? 0);

    if (remaining > 0) {
      await prisma.journal.create({
        data: {
          tenantId,
          orgId: lease.orgId,
          entryNumber: `LEASE-TERM-${lease.leaseRef ?? id}`,
          date: tDate,
          status: 'POSTED',
          notes: `Early lease termination — ${lease.description ?? id}`,
          entries: {
            create: [
              {
                tenantId,
                accountId: 'loss-on-termination-account',
                description: 'Loss on early lease termination',
                debit: new Prisma.Decimal(remaining),
                credit: new Prisma.Decimal(0),
              },
              {
                tenantId,
                accountId: 'lease-liability-account',
                description: 'Write-off remaining lease liability',
                debit: new Prisma.Decimal(0),
                credit: new Prisma.Decimal(remaining),
              },
            ],
          },
        },
      });
    }

    await prisma.leaseSchedule.updateMany({
      where: { financeLeaseId: id, journalPosted: false, periodStart: { gte: tDate } },
      data: { journalPosted: true },
    });

    return prisma.financeLease.update({
      where: { id },
      data: { status: 'TERMINATED', carryingAmount: new Prisma.Decimal(0), endDate: tDate },
    });
  }

  async renewLease(tenantId: string, id: string, newEndDate: string, newPresentValue?: number) {
    const lease = await this.getLeaseById(tenantId, id);
    const extEnd = new Date(newEndDate);
    const extStart = new Date(lease.endDate);
    const months = (extEnd.getFullYear() - extStart.getFullYear()) * 12 + (extEnd.getMonth() - extStart.getMonth()) + 1;
    if (months <= 0) throw new BadRequestException('New end date must be after current end date');

    const pv = newPresentValue ?? Number(lease.carryingAmount ?? lease.presentValue ?? 0);
    if (pv > 0) {
      const rows = computeAmortizationSchedule(pv, Number(lease.interestRate ?? 0) || null, extStart, months);
      await prisma.leaseSchedule.createMany({
        data: rows.map((r) => ({
          tenantId,
          financeLeaseId: id,
          periodStart: r.periodStart,
          periodEnd: r.periodEnd,
          paymentAmount: new Prisma.Decimal(r.paymentAmount),
          interestExpense: new Prisma.Decimal(r.interestExpense),
          principalRepayment: new Prisma.Decimal(r.principalRepayment),
          rouAmortization: new Prisma.Decimal(r.principalRepayment),
        })),
      });
    }

    return prisma.financeLease.update({
      where: { id },
      data: { endDate: extEnd, ...(newPresentValue ? { presentValue: new Prisma.Decimal(newPresentValue) } : {}) },
    });
  }
}
