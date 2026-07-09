import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { Prisma } from '@prisma/client';

@Injectable()
export class IntercompanyLoansService {
  private async getLoan(tenantId: string, id: string) {
    const loan = await prisma.intercompanyLoan.findFirst({
      where: { id, tenantId },
      include: { drawdowns: true, repayments: true },
    });
    if (!loan) throw new NotFoundException('Intercompany loan not found');
    return loan;
  }

  async createLoanAgreement(tenantId: string, dto: {
    lenderOrgId: string; borrowerOrgId: string; loanNumber: string;
    principalAmount: number; interestRate: number; startDate: string;
    endDate: string; interestType?: string;
  }) {
    return prisma.intercompanyLoan.create({
      data: {
        tenantId,
        lenderOrgId: dto.lenderOrgId,
        borrowerOrgId: dto.borrowerOrgId,
        loanNumber: dto.loanNumber,
        principalAmount: dto.principalAmount,
        interestRate: dto.interestRate,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        interestType: dto.interestType ?? 'SIMPLE',
        status: 'ACTIVE',
      },
    });
  }

  async getLoanAgreement(tenantId: string, id: string) {
    return this.getLoan(tenantId, id);
  }

  async listLoanAgreements(tenantId: string) {
    return prisma.intercompanyLoan.findMany({
      where: { tenantId },
      orderBy: { startDate: 'desc' },
    });
  }

  async recordLoanDrawdown(tenantId: string, loanId: string, dto: {
    amount: number; drawdownDate: string; reference?: string;
  }) {
    const loan = await this.getLoan(tenantId, loanId);
    if (loan.status !== 'ACTIVE') throw new BadRequestException('Loan is not active');
    return prisma.loanDrawdown.create({
      data: {
        tenantId,
        loanId,
        amount: dto.amount,
        drawdownDate: new Date(dto.drawdownDate),
        reference: dto.reference,
      },
    });
  }

  async recordLoanRepayment(tenantId: string, loanId: string, dto: {
    principal: number; interest: number; repaymentDate: string; reference?: string;
  }) {
    const loan = await this.getLoan(tenantId, loanId);
    if (loan.status !== 'ACTIVE') throw new BadRequestException('Loan is not active');
    return prisma.loanRepayment.create({
      data: {
        tenantId,
        loanId,
        principal: dto.principal,
        interest: dto.interest,
        repaymentDate: new Date(dto.repaymentDate),
        reference: dto.reference,
      },
    });
  }

  async calculateAccruedInterest(tenantId: string, loanId: string, asOfDate: string): Promise<{ accruedInterest: number; days: number }> {
    const loan = await this.getLoan(tenantId, loanId);
    const drawdowns = await prisma.loanDrawdown.findMany({ where: { tenantId, loanId } });
    const repayments = await prisma.loanRepayment.findMany({ where: { tenantId, loanId } });

    const asOf = new Date(asOfDate);
    let accrued = 0;
    const rate = Number(loan.interestRate) / 100;

    // Simple interest calculation per transaction over days
    for (const d of drawdowns) {
      if (d.drawdownDate >= asOf) continue;
      const days = Math.max(0, Math.floor((asOf.getTime() - d.drawdownDate.getTime()) / 86400000));
      accrued += Number(d.amount) * rate * (days / 365);
    }
    for (const r of repayments) {
      if (r.repaymentDate >= asOf) continue;
      const days = Math.max(0, Math.floor((asOf.getTime() - r.repaymentDate.getTime()) / 86400000));
      accrued -= Number(r.principal) * rate * (days / 365);
    }

    return { accruedInterest: Math.max(0, Math.round(accrued * 100) / 100), days: 30 };
  }

  async postAccruedInterestGL(tenantId: string, loanId: string, asOfDate: string) {
    const loan = await this.getLoan(tenantId, loanId);
    const { accruedInterest } = await this.calculateAccruedInterest(tenantId, loanId, asOfDate);

    // Create journal entry to record accrued interest
    const journal = await prisma.journal.create({
      data: {
        tenantId,
        orgId: loan.lenderOrgId,
        entryNumber: `JRN-INT-${Date.now()}`,
        date: new Date(asOfDate),
        status: 'POSTED',
        notes: `Accrued interest for intercompany loan ${loan.loanNumber}`,
      },
    });

    // Debit Interest Receivable (lender), Credit Interest Income (lender)
    await prisma.journalEntry.createMany({
      data: [
        {
          tenantId,
          journalId: journal.id,
          accountId: 'acc-receivable-default',
          debit: new Prisma.Decimal(accruedInterest),
          credit: new Prisma.Decimal(0),
          description: `Debit interest receivable for loan ${loan.loanNumber}`,
        },
        {
          tenantId,
          journalId: journal.id,
          accountId: 'acc-interest-income-default',
          debit: new Prisma.Decimal(0),
          credit: new Prisma.Decimal(accruedInterest),
          description: `Credit interest income for loan ${loan.loanNumber}`,
        },
      ],
    });

    return { journalId: journal.id, accruedInterest };
  }

  async amortizeLoanSchedule(tenantId: string, loanId: string) {
    const loan = await this.getLoan(tenantId, loanId);
    const total = Number(loan.principalAmount);
    const rate = Number(loan.interestRate) / 100;
    const months = Math.max(1, Math.floor((loan.endDate.getTime() - loan.startDate.getTime()) / (30 * 86400000)));

    const schedule = [];
    const monthlyPrincipal = total / months;
    let balance = total;

    for (let i = 1; i <= months; i++) {
      const interest = balance * (rate / 12);
      schedule.push({
        period: i,
        openingBalance: Math.round(balance * 100) / 100,
        principalPaid: Math.round(monthlyPrincipal * 100) / 100,
        interestPaid: Math.round(interest * 100) / 100,
        closingBalance: Math.round(Math.max(0, balance - monthlyPrincipal) * 100) / 100,
      });
      balance -= monthlyPrincipal;
    }

    return { loanId, principal: total, monthlyRate: rate / 12, schedule };
  }

  async getLoanAnalytics(tenantId: string) {
    const loans = await prisma.intercompanyLoan.findMany({ where: { tenantId } });
    let totalLended = 0;
    const byStatus = { ACTIVE: 0, FULLY_REPAID: 0, DRAFT: 0 };

    for (const l of loans) {
      totalLended += Number(l.principalAmount);
      const stat = l.status as keyof typeof byStatus;
      if (byStatus[stat] !== undefined) byStatus[stat]++;
    }

    return { totalLended, activeCount: byStatus.ACTIVE, statusSummary: byStatus };
  }

  async closeLoanAgreement(tenantId: string, id: string) {
    await this.getLoan(tenantId, id);
    return prisma.intercompanyLoan.update({
      where: { id },
      data: { status: 'FULLY_REPAID' },
    });
  }
}
