import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';

export type AmortizationRow = {
  periodStart: Date;
  periodEnd: Date;
  paymentAmount: number;
  interestExpense: number;
  principalRepayment: number;
  endingCarryingAmount: number;
};

/**
 * Compute an amortization schedule using the effective-interest (annuity) method.
 * Returns an array of rows (one per month).
 */
export function computeAmortizationSchedule(presentValue: number, annualRate: number | null, startDate: Date, months: number): AmortizationRow[] {
  const rows: AmortizationRow[] = [];
  const r = annualRate != null ? Number(annualRate) / 12.0 : 0;
  let payment = 0;
  const pv = Number(presentValue);
  if (r === 0) {
    payment = pv / months;
  } else {
    // annuity payment formula
    const pow = Math.pow(1 + r, months);
    payment = pv * (r * pow) / (pow - 1);
  }

  let carrying = pv;
  for (let i = 0; i < months; i++) {
    const periodStart = new Date(startDate.getFullYear(), startDate.getMonth() + i, startDate.getDate());
    const periodEnd = new Date(startDate.getFullYear(), startDate.getMonth() + i, startDate.getDate());
    const interestExpense = Number((carrying * r));
    const principalRepayment = Number(payment - interestExpense);
    const endingCarryingAmount = Number(Math.max(0, carrying - principalRepayment));

    rows.push({ periodStart, periodEnd, paymentAmount: Number(payment), interestExpense, principalRepayment, endingCarryingAmount });

    carrying = endingCarryingAmount;
  }

  return rows;
}

@Injectable()
export class LeaseAccountingService {
  async getLeases(tenantId: string) {
    return prisma.financeLease.findMany({ where: { tenantId } });
  }

  async getLeaseById(tenantId: string, id: string) {
    const lease = await prisma.financeLease.findFirst({ where: { id, tenantId } });
    if (!lease) throw new NotFoundException('Lease not found');
    return lease;
  }

  async createLease(tenantId: string, orgId: string, payload: { leaseRef?: string; description?: string; startDate: string; endDate: string; leaseType?: string; presentValue?: number; interestRate?: number }) {
    const data: any = {
      tenantId,
      orgId,
      leaseRef: payload.leaseRef || null,
      description: payload.description || null,
      startDate: new Date(payload.startDate),
      endDate: new Date(payload.endDate),
      leaseType: payload.leaseType || 'OPERATING',
      presentValue: payload.presentValue != null ? new Prisma.Decimal(payload.presentValue) : null,
      interestRate: payload.interestRate != null ? new Prisma.Decimal(payload.interestRate) : null,
    };

    const lease = await prisma.financeLease.create({ data });

    // Generate amortization schedule using effective-interest method (monthly periods)
    const schedules: Array<any> = [];
    const start = new Date(payload.startDate);
    const end = new Date(payload.endDate);
    const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1;
    if (months > 0 && payload.presentValue) {
      const rows = computeAmortizationSchedule(Number(payload.presentValue), payload.interestRate ?? null, start, months);

      rows.forEach((r) => {
        schedules.push({
          tenantId,
          financeLeaseId: lease.id,
          periodStart: r.periodStart,
          periodEnd: r.periodEnd,
          paymentAmount: new Prisma.Decimal(r.paymentAmount),
          interestExpense: new Prisma.Decimal(r.interestExpense),
          principalRepayment: new Prisma.Decimal(r.principalRepayment),
          rouAmortization: new Prisma.Decimal(r.principalRepayment),
        });
      });

      await prisma.leaseSchedule.createMany({ data: schedules });

      // update carrying amount and initial recognition on lease
      await prisma.financeLease.update({ where: { id: lease.id }, data: { initialRecognition: new Prisma.Decimal(payload.presentValue!), carryingAmount: new Prisma.Decimal(payload.presentValue!) } });
    }

    return lease;
  }
}
