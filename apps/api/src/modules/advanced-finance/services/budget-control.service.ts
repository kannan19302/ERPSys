import { Injectable, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { Prisma } from '@prisma/client';

@Injectable()
export class BudgetControlService {
  /**
   * Get or create budget control config for a tenant.
   */
  async getControlConfig(tenantId: string) {
    let config = await prisma.budgetControlConfig.findUnique({
      where: { tenantId },
    });

    if (!config) {
      config = await prisma.budgetControlConfig.create({
        data: {
          tenantId,
          enforcementAction: 'WARN',
          checkInvoices: true,
          checkJournals: true,
          checkExpenses: true,
          tolerancePercentage: new Prisma.Decimal(0.0),
        },
      });
    }

    return config;
  }

  /**
   * Update budget control config.
   */
  async updateControlConfig(
    tenantId: string,
    dto: {
      enforcementAction?: string;
      checkInvoices?: boolean;
      checkJournals?: boolean;
      checkExpenses?: boolean;
      tolerancePercentage?: number;
    },
  ) {
    // Ensure config exists
    await this.getControlConfig(tenantId);

    const data: Record<string, any> = {};
    if (dto.enforcementAction !== undefined) data.enforcementAction = dto.enforcementAction;
    if (dto.checkInvoices !== undefined) data.checkInvoices = dto.checkInvoices;
    if (dto.checkJournals !== undefined) data.checkJournals = dto.checkJournals;
    if (dto.checkExpenses !== undefined) data.checkExpenses = dto.checkExpenses;
    if (dto.tolerancePercentage !== undefined) {
      data.tolerancePercentage = new Prisma.Decimal(dto.tolerancePercentage);
    }

    return prisma.budgetControlConfig.update({
      where: { tenantId },
      data,
    });
  }

  /**
   * Checks if a transaction exceeds budget and returns check result.
   */
  async checkBudgetLimit(
    tenantId: string,
    orgId: string,
    accountId: string,
    amount: number,
    date: Date,
    dimensions: { costCenterId?: string | null; projectId?: string | null } = {},
  ): Promise<{
    allowed: boolean;
    action: 'ALLOW' | 'WARN' | 'BLOCK';
    limit: number;
    actual: number;
    proposed: number;
    message?: string;
  }> {
    const config = await this.getControlConfig(tenantId);
    if (config.enforcementAction === 'ALLOW') {
      return { allowed: true, action: 'ALLOW', limit: 0, actual: 0, proposed: amount };
    }

    // Determine period string (YYYY-MM)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const periodStr = `${year}-${month}`;

    // Find active budget
    const budget = await prisma.budget.findFirst({
      where: {
        tenantId,
        orgId,
        accountId,
        costCenterId: dimensions.costCenterId || null,
        projectId: dimensions.projectId || null,
        startDate: { lte: date },
        endDate: { gte: date },
      },
      include: {
        periodAmounts: {
          where: { period: periodStr },
        },
      },
    });

    if (!budget) {
      return { allowed: true, action: 'ALLOW', limit: 0, actual: 0, proposed: amount };
    }

    // Calculate budget limit for this period
    let periodLimit = 0;
    if (budget.periodAmounts.length > 0 && budget.periodAmounts[0]) {
      periodLimit = Number(budget.periodAmounts[0].amount);
    } else {
      // Default to monthly split
      const start = new Date(budget.startDate);
      const end = new Date(budget.endDate);
      const diffMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1;
      const budgetMonths = diffMonths > 0 ? diffMonths : 1;
      periodLimit = Number(budget.amount) / budgetMonths;
    }

    // Calculate actuals for this period
    // Sum posted and submitted journal entry amounts
    const startOfMonth = new Date(year, date.getMonth(), 1);
    const endOfMonth = new Date(year, date.getMonth() + 1, 0, 23, 59, 59, 999);

    const journalEntries = await prisma.journalEntry.findMany({
      where: {
        tenantId,
        accountId,
        journal: {
          orgId,
          date: { gte: startOfMonth, lte: endOfMonth },
          status: { in: ['POSTED', 'SUBMITTED'] },
        },
      },
    });

    // Sum net debits
    const actualSum = journalEntries.reduce((sum, entry) => {
      return sum + Number(entry.debit) - Number(entry.credit);
    }, 0);

    const tolerance = 1 + Number(config.tolerancePercentage) / 100;
    const allowedLimit = periodLimit * tolerance;
    const proposedTotal = actualSum + amount;

    if (proposedTotal > allowedLimit) {
      const enforcementAction = config.enforcementAction as 'WARN' | 'BLOCK';
      const message = `Transaction of ${amount} exceeds the budget limit of ${periodLimit.toFixed(2)} (Current Actuals: ${actualSum.toFixed(2)}, Proposed Total: ${proposedTotal.toFixed(2)})`;

      if (enforcementAction === 'BLOCK') {
        throw new BadRequestException(message);
      }

      return {
        allowed: true,
        action: enforcementAction,
        limit: periodLimit,
        actual: actualSum,
        proposed: amount,
        message,
      };
    }

    return {
      allowed: true,
      action: 'ALLOW',
      limit: periodLimit,
      actual: actualSum,
      proposed: amount,
    };
  }
}
