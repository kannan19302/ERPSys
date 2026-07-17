import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { Prisma } from '@prisma/client';

@Injectable()
export class CashPoolingService {
  private async getPool(tenantId: string, id: string) {
    const pool = await prisma.cashPool.findFirst({
      where: { id, tenantId },
      include: { runs: true },
    });
    if (!pool) throw new NotFoundException('Cash pool not found');
    return pool;
  }

  async createCashPool(tenantId: string, dto: {
    orgId: string; name: string; poolType?: string;
    headerAccountId: string; participantAccountIds: string[]; targetBalance?: number;
  }) {
    return prisma.cashPool.create({
      data: {
        tenantId,
        orgId: dto.orgId,
        name: dto.name,
        poolType: dto.poolType ?? 'PHYSICAL',
        headerAccountId: dto.headerAccountId,
        participantAccountIds: dto.participantAccountIds as never,
        targetBalance: dto.targetBalance ?? 0,
        isActive: true,
      },
    });
  }

  async getCashPool(tenantId: string, id: string) {
    return this.getPool(tenantId, id);
  }

  async listCashPools(tenantId: string) {
    return prisma.cashPool.findMany({
      where: { tenantId, isActive: true },
    });
  }

  async poolConcentrationRun(tenantId: string, poolId: string) {
    const pool = await this.getPool(tenantId, poolId);
    if (!pool.isActive) throw new BadRequestException('Cash pool is not active');

    const participantIds = pool.participantAccountIds as string[];
    let totalSwept = 0;
    const details = [];

    // Sweep all balances exceeding targetBalance to concentration header account
    for (const acctId of participantIds) {
      const acct = await prisma.bankAccount.findFirst({ where: { id: acctId, tenantId } });
      if (!acct) continue;
      // In a real system, we look up the bank account balance. Since we don't have transaction aggregation details, we mock:
      const balance = 150000; // Mock participant balance
      const excess = balance - Number(pool.targetBalance);
      if (excess > 0) {
        totalSwept += excess;
        details.push({ bankAccountId: acctId, sweptAmount: excess });
      }
    }

    const run = await prisma.cashPoolRun.create({
      data: {
        tenantId,
        cashPoolId: poolId,
        runType: 'SWEEP',
        totalSwept,
        details: details as never,
      },
    });

    // Post GL swept journal
    if (totalSwept > 0) {
      const journal = await prisma.journal.create({
        data: {
          tenantId,
          orgId: pool.orgId,
          entryNumber: `JRN-SWP-${Date.now()}`,
          date: new Date(),
          status: 'POSTED',
          notes: `GL Sweep Concentration for pool: ${pool.name}`,
        },
      });
      // Debit Concentration Header account, Credit Participant accounts (simulated)
      await prisma.journalEntry.createMany({
        data: [
          {
            tenantId,
            journalId: journal.id,
            accountId: pool.headerAccountId,
            debit: new Prisma.Decimal(totalSwept),
            credit: new Prisma.Decimal(0),
            description: `Sweep Concentration debit header account ${pool.headerAccountId}`,
          },
          {
            tenantId,
            journalId: journal.id,
            accountId: 'acc-participant-pool-clearing',
            debit: new Prisma.Decimal(0),
            credit: new Prisma.Decimal(totalSwept),
            description: `Sweep Concentration credit participant account clearing`,
          },
        ],
      });
      await prisma.cashPoolRun.update({
        where: { id: run.id },
        data: { glJournalId: journal.id },
      });
    }

    return run;
  }

  async poolRedistributionRun(tenantId: string, poolId: string) {
    const pool = await this.getPool(tenantId, poolId);
    if (!pool.isActive) throw new BadRequestException('Cash pool is not active');

    const participantIds = pool.participantAccountIds as string[];
    let totalFunded = 0;
    const details = [];

    // Fund participant accounts that fall below the targetBalance from Concentration header account
    for (const acctId of participantIds) {
      const acct = await prisma.bankAccount.findFirst({ where: { id: acctId, tenantId } });
      if (!acct) continue;
      const balance = 20000; // Mock participant balance below target
      const target = Number(pool.targetBalance) || 50000;
      const deficit = target - balance;
      if (deficit > 0) {
        totalFunded += deficit;
        details.push({ bankAccountId: acctId, sweptAmount: -deficit });
      }
    }

    const run = await prisma.cashPoolRun.create({
      data: {
        tenantId,
        cashPoolId: poolId,
        runType: 'FUNDING',
        totalSwept: -totalFunded,
        details: details as never,
      },
    });

    return run;
  }

  async listPoolRuns(tenantId: string, poolId: string) {
    return prisma.cashPoolRun.findMany({
      where: { tenantId, cashPoolId: poolId },
      orderBy: { runDate: 'desc' },
    });
  }

  // ── VARIANCE ALERT CONFIGS ─────────────────────────────

  async createVarianceAlertConfig(tenantId: string, dto: {
    accountId: string; thresholdPct: number; ownerId: string;
  }) {
    return prisma.varianceAlertConfig.upsert({
      where: { tenantId_accountId: { tenantId, accountId: dto.accountId } },
      create: { tenantId, accountId: dto.accountId, thresholdPct: dto.thresholdPct, ownerId: dto.ownerId, isActive: true },
      update: { thresholdPct: dto.thresholdPct, ownerId: dto.ownerId },
    });
  }

  async getBudgetVarianceAlerts(tenantId: string) {
    const configs = await prisma.varianceAlertConfig.findMany({ where: { tenantId, isActive: true } });
    const alerts = [];

    for (const config of configs) {
      // Mock calculation for PNL vs Budget comparison
      const actual = 120000;
      const budget = 100000;
      const pct = ((actual - budget) / budget) * 100;
      if (pct > Number(config.thresholdPct)) {
        alerts.push({
          accountId: config.accountId,
          actual,
          budget,
          variancePct: pct.toFixed(2),
          thresholdPct: config.thresholdPct,
          ownerId: config.ownerId,
          severity: pct > Number(config.thresholdPct) * 1.5 ? 'CRITICAL' : 'WARNING',
        });
      }
    }

    return { alertCount: alerts.length, alerts };
  }
}
