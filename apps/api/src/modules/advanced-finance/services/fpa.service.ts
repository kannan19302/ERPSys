import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { Prisma } from '@prisma/client';

@Injectable()
export class FpaService {
  // ── Close Tasks ─────────────────────────────────────────────────────────────

  async listCloseTasks(tenantId: string, periodId: string, status?: string) {
    return prisma.closeTask.findMany({
      where: {
        tenantId,
        financialPeriodId: periodId,
        ...(status ? { status } : {}),
      },
      orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
    });
  }

  async getCloseTask(tenantId: string, id: string) {
    const task = await prisma.closeTask.findFirst({ where: { id, tenantId } });
    if (!task) throw new NotFoundException('Close task not found');
    return task;
  }

  async createCloseTask(
    tenantId: string,
    userId: string,
    dto: {
      financialPeriodId: string;
      name: string;
      description?: string;
      category?: string;
      assigneeId?: string;
      dueDate?: string;
      priority?: string;
      notes?: string;
    },
  ) {
    // Validate the period exists for this tenant
    const period = await prisma.financialPeriod.findFirst({
      where: { id: dto.financialPeriodId, tenantId },
    });
    if (!period) throw new NotFoundException('Financial period not found');

    return prisma.closeTask.create({
      data: {
        tenantId,
        financialPeriodId: dto.financialPeriodId,
        name: dto.name,
        description: dto.description || null,
        category: dto.category || 'RECONCILIATION',
        assigneeId: dto.assigneeId || null,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        priority: dto.priority || 'MEDIUM',
        notes: dto.notes || null,
        status: 'OPEN',
        isTemplate: false,
        createdBy: userId,
        updatedBy: userId,
      },
    });
  }

  async updateCloseTask(
    tenantId: string,
    id: string,
    userId: string,
    dto: {
      status?: string;
      assigneeId?: string;
      dueDate?: string;
      priority?: string;
      notes?: string;
    },
  ) {
    const task = await this.getCloseTask(tenantId, id);

    const completedAt =
      dto.status === 'DONE' && task.status !== 'DONE' ? new Date() : task.completedAt;
    const completedBy =
      dto.status === 'DONE' && task.status !== 'DONE' ? userId : task.completedBy;

    return prisma.closeTask.update({
      where: { id },
      data: {
        ...(dto.status ? { status: dto.status } : {}),
        ...(dto.assigneeId !== undefined ? { assigneeId: dto.assigneeId } : {}),
        ...(dto.dueDate ? { dueDate: new Date(dto.dueDate) } : {}),
        ...(dto.priority ? { priority: dto.priority } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
        completedAt,
        completedBy,
        updatedBy: userId,
      },
    });
  }

  async deleteCloseTask(tenantId: string, id: string) {
    await this.getCloseTask(tenantId, id);
    return prisma.closeTask.delete({ where: { id } });
  }

  /** Auto-generate standard close tasks from a template set for a given period. */
  async generateCloseTasksFromTemplate(
    tenantId: string,
    userId: string,
    periodId: string,
  ) {
    const period = await prisma.financialPeriod.findFirst({
      where: { id: periodId, tenantId },
    });
    if (!period) throw new NotFoundException('Financial period not found');

    // Standard industry close-task templates
    const templates = [
      { name: 'Reconcile Accounts Payable Subledger', category: 'RECONCILIATION', priority: 'HIGH' },
      { name: 'Reconcile Accounts Receivable Subledger', category: 'RECONCILIATION', priority: 'HIGH' },
      { name: 'Reconcile Fixed Asset Register', category: 'RECONCILIATION', priority: 'MEDIUM' },
      { name: 'Post Accruals and Prepayments', category: 'ACCRUALS', priority: 'HIGH' },
      { name: 'Post Payroll Accrual', category: 'ACCRUALS', priority: 'CRITICAL' },
      { name: 'Revalue Foreign Currency Balances', category: 'ACCRUALS', priority: 'MEDIUM' },
      { name: 'Review and Post Depreciation', category: 'ACCRUALS', priority: 'MEDIUM' },
      { name: 'Bank Reconciliation — All Accounts', category: 'RECONCILIATION', priority: 'HIGH' },
      { name: 'Intercompany Eliminations', category: 'REPORTING', priority: 'MEDIUM' },
      { name: 'Review Trial Balance Exceptions', category: 'REPORTING', priority: 'HIGH' },
      { name: 'Prepare Variance Analysis Report', category: 'REPORTING', priority: 'HIGH' },
      { name: 'CFO Sign-off on P&L', category: 'APPROVAL', priority: 'CRITICAL' },
      { name: 'Close Financial Period', category: 'APPROVAL', priority: 'CRITICAL' },
    ];

    const closeDate = new Date(period.endDate);
    // Due dates: set 5 business days after period end for critical, 3 for others
    closeDate.setDate(closeDate.getDate() + 5);

    const created = await prisma.closeTask.createMany({
      data: templates.map((t) => ({
        tenantId,
        financialPeriodId: periodId,
        name: t.name,
        category: t.category,
        priority: t.priority,
        status: 'OPEN',
        dueDate: closeDate,
        isTemplate: false,
        createdBy: userId,
        updatedBy: userId,
      })),
      skipDuplicates: true,
    });

    return { created: created.count, periodId };
  }

  /** Dashboard stats for a period's close progress. */
  async getCloseDashboard(tenantId: string, periodId: string) {
    const [tasks, flags] = await Promise.all([
      prisma.closeTask.findMany({ where: { tenantId, financialPeriodId: periodId } }),
      prisma.varianceFlag.findMany({
        where: { tenantId, financialPeriodId: periodId },
        take: 20,
        orderBy: { variancePercent: 'desc' },
      }),
    ]);

    const byStatus = tasks.reduce<Record<string, number>>((acc, t) => {
      acc[t.status] = (acc[t.status] || 0) + 1;
      return acc;
    }, {});

    const byPriority = tasks.reduce<Record<string, number>>((acc, t) => {
      acc[t.priority] = (acc[t.priority] || 0) + 1;
      return acc;
    }, {});

    const completionPct =
      tasks.length > 0
        ? Math.round(((byStatus['DONE'] || 0) / tasks.length) * 100)
        : 0;

    const overdueTasks = tasks.filter(
      (t) => t.dueDate && t.status !== 'DONE' && t.dueDate < new Date(),
    ).length;

    return {
      periodId,
      totalTasks: tasks.length,
      completionPercent: completionPct,
      byStatus,
      byPriority,
      overdueTasks,
      openVarianceFlags: flags.filter((f) => f.status === 'OPEN').length,
      criticalFlags: flags.filter((f) => f.severity === 'CRITICAL' && f.status === 'OPEN').length,
      topFlags: flags.slice(0, 5),
    };
  }

  // ── Variance Flag Engine ────────────────────────────────────────────────────

  /**
   * Scan all accounts in the current period vs the prior period.
   * Create variance flags for any account where |ΔAmt / priorAmt| > thresholdPercent.
   */
  async runVarianceFlagEngine(
    tenantId: string,
    periodId: string,
    thresholdPercent = 10,
  ) {
    const currentPeriod = await prisma.financialPeriod.findFirst({
      where: { id: periodId, tenantId },
    });
    if (!currentPeriod) throw new NotFoundException('Financial period not found');

    // Find prior period (most recent period ending before current period start)
    const priorPeriod = await prisma.financialPeriod.findFirst({
      where: {
        tenantId,
        orgId: currentPeriod.orgId,
        endDate: { lt: currentPeriod.startDate },
      },
      orderBy: { endDate: 'desc' },
    });

    if (!priorPeriod) {
      return { flagsCreated: 0, message: 'No prior period found for comparison' };
    }

    // Aggregate current period GL entries by account
    const currentBalances = await prisma.journalEntry.groupBy({
      by: ['accountId'],
      where: {
        tenantId,
        journal: {
          tenantId,
          status: 'POSTED',
          date: { gte: currentPeriod.startDate, lte: currentPeriod.endDate },
        },
      },
      _sum: { debit: true, credit: true },
    });

    // Aggregate prior period GL entries by account
    const priorBalances = await prisma.journalEntry.groupBy({
      by: ['accountId'],
      where: {
        tenantId,
        journal: {
          tenantId,
          status: 'POSTED',
          date: { gte: priorPeriod.startDate, lte: priorPeriod.endDate },
        },
      },
      _sum: { debit: true, credit: true },
    });

    const priorMap = new Map(
      priorBalances.map((b) => [
        b.accountId,
        (Number(b._sum.debit || 0) - Number(b._sum.credit || 0)),
      ]),
    );

    const flagsToCreate: Prisma.VarianceFlagCreateManyInput[] = [];
    const threshold = new Prisma.Decimal(thresholdPercent);

    for (const bal of currentBalances) {
      const currentNet = Number(bal._sum.debit || 0) - Number(bal._sum.credit || 0);
      const priorNet = priorMap.get(bal.accountId) ?? 0;

      if (priorNet === 0) continue; // Avoid division by zero

      const varianceAmt = currentNet - priorNet;
      const variancePct = Math.abs(varianceAmt / priorNet) * 100;

      if (variancePct > thresholdPercent) {
        const severity =
          variancePct > 50 ? 'CRITICAL' : variancePct > 25 ? 'HIGH' : 'MEDIUM';

        flagsToCreate.push({
          tenantId,
          financialPeriodId: periodId,
          accountId: bal.accountId,
          currentAmount: new Prisma.Decimal(currentNet.toFixed(2)),
          priorAmount: new Prisma.Decimal(priorNet.toFixed(2)),
          varianceAmount: new Prisma.Decimal(varianceAmt.toFixed(2)),
          variancePercent: new Prisma.Decimal(variancePct.toFixed(2)),
          thresholdPercent: threshold,
          severity,
          status: 'OPEN',
          updatedAt: new Date(),
        });
      }
    }

    if (flagsToCreate.length > 0) {
      await prisma.varianceFlag.createMany({ data: flagsToCreate, skipDuplicates: true });
    }

    return {
      periodId,
      priorPeriodId: priorPeriod.id,
      thresholdPercent,
      flagsCreated: flagsToCreate.length,
      accountsScanned: currentBalances.length,
    };
  }

  async listVarianceFlags(tenantId: string, periodId: string, status?: string) {
    return prisma.varianceFlag.findMany({
      where: {
        tenantId,
        financialPeriodId: periodId,
        ...(status ? { status } : {}),
      },
      orderBy: { variancePercent: 'desc' },
    });
  }

  async acknowledgeVarianceFlag(
    tenantId: string,
    id: string,
    _userId: string,
    notes?: string,
  ) {
    const flag = await prisma.varianceFlag.findFirst({ where: { id, tenantId } });
    if (!flag) throw new NotFoundException('Variance flag not found');
    if (flag.status !== 'OPEN') {
      throw new BadRequestException('Variance flag is not in OPEN status');
    }
    return prisma.varianceFlag.update({
      where: { id },
      data: { status: 'ACKNOWLEDGED', notes: notes || flag.notes, updatedAt: new Date() },
    });
  }

  async resolveVarianceFlag(
    tenantId: string,
    id: string,
    userId: string,
    notes?: string,
  ) {
    const flag = await prisma.varianceFlag.findFirst({ where: { id, tenantId } });
    if (!flag) throw new NotFoundException('Variance flag not found');
    return prisma.varianceFlag.update({
      where: { id },
      data: {
        status: 'RESOLVED',
        resolvedBy: userId,
        resolvedAt: new Date(),
        notes: notes || flag.notes,
        updatedAt: new Date(),
      },
    });
  }

  // ── Budget Scenarios ────────────────────────────────────────────────────────

  async listScenarios(tenantId: string, fiscalYear?: number) {
    return prisma.budgetScenario.findMany({
      where: {
        tenantId,
        status: { not: 'ARCHIVED' },
        ...(fiscalYear ? { fiscalYear } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { lines: true } },
      },
    });
  }

  async getScenario(tenantId: string, id: string) {
    const scenario = await prisma.budgetScenario.findFirst({
      where: { id, tenantId },
      include: { lines: { orderBy: [{ month: 'asc' }] }, _count: { select: { lines: true } } },
    });
    if (!scenario) throw new NotFoundException('Budget scenario not found');
    return scenario;
  }

  async createScenario(
    tenantId: string,
    userId: string,
    dto: {
      orgId: string;
      name: string;
      description?: string;
      type?: string;
      fiscalYear: number;
    },
  ) {
    return prisma.budgetScenario.create({
      data: {
        tenantId,
        orgId: dto.orgId,
        name: dto.name,
        description: dto.description || null,
        type: dto.type || 'BASE',
        fiscalYear: dto.fiscalYear,
        status: 'DRAFT',
        isLocked: false,
        isDefault: false,
        createdBy: userId,
        updatedBy: userId,
      },
    });
  }

  async updateScenario(
    tenantId: string,
    id: string,
    userId: string,
    dto: { name?: string; description?: string; status?: string },
  ) {
    const scenario = await this.getScenario(tenantId, id);
    if (scenario.isLocked) throw new BadRequestException('Scenario is locked — unlock first');
    return prisma.budgetScenario.update({
      where: { id },
      data: { ...dto, updatedBy: userId },
    });
  }

  async lockScenario(tenantId: string, id: string, userId: string) {
    const scenario = await this.getScenario(tenantId, id);
    if (scenario.isLocked) throw new BadRequestException('Scenario is already locked');
    return prisma.budgetScenario.update({
      where: { id },
      data: { isLocked: true, status: 'APPROVED', updatedBy: userId },
    });
  }

  async unlockScenario(tenantId: string, id: string, userId: string) {
    const scenario = await this.getScenario(tenantId, id);
    if (!scenario.isLocked) throw new BadRequestException('Scenario is not locked');
    return prisma.budgetScenario.update({
      where: { id },
      data: { isLocked: false, updatedBy: userId },
    });
  }

  /** Clone a scenario — duplicates all budget lines into a new scenario. */
  async cloneScenario(
    tenantId: string,
    sourceId: string,
    userId: string,
    dto: { name: string; type?: string },
  ) {
    const source = await this.getScenario(tenantId, sourceId);

    const clone = await prisma.budgetScenario.create({
      data: {
        tenantId,
        orgId: source.orgId,
        name: dto.name,
        description: `Cloned from: ${source.name}`,
        type: dto.type || source.type,
        fiscalYear: source.fiscalYear,
        isLocked: false,
        isDefault: false,
        clonedFromId: sourceId,
        status: 'DRAFT',
        createdBy: userId,
        updatedBy: userId,
      },
    });

    if (source.lines.length > 0) {
      await prisma.budgetScenarioLine.createMany({
        data: source.lines.map(
          (l: {
            accountId: string;
            costCenterId: string | null;
            month: number;
            amount: Prisma.Decimal | number | string;
            driverType: string | null;
            driverValue: Prisma.Decimal | number | string | null;
            driverRate: Prisma.Decimal | number | string | null;
            notes: string | null;
          }) => ({
            tenantId,
            scenarioId: clone.id,
            accountId: l.accountId,
            costCenterId: l.costCenterId,
            month: l.month,
            amount: l.amount as any,
            driverType: l.driverType,
            driverValue: l.driverValue as any,
            driverRate: l.driverRate as any,
            notes: l.notes,
            updatedAt: new Date(),
          }),
        ),
      });
    }

    return { clone, linesCloned: source.lines.length };
  }

  /** Apply a driver to generate budget lines in bulk (headcount × salary, units × price, etc.) */
  async applyDriver(
    tenantId: string,
    scenarioId: string,
    _userId: string,
    dto: {
      accountId: string;
      driverType: 'HEADCOUNT' | 'UNITS' | 'PERCENTAGE';
      driverValue: number;
      driverRate: number;
      months?: number[]; // default 1-12
      costCenterId?: string;
    },
  ) {
    const scenario = await this.getScenario(tenantId, scenarioId);
    if (scenario.isLocked) throw new BadRequestException('Scenario is locked');

    const months = dto.months?.length ? dto.months : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    const computedAmount = new Prisma.Decimal((dto.driverValue * dto.driverRate).toFixed(2));

    await Promise.all(
      months.map((month) =>
        prisma.budgetScenarioLine.upsert({
          where: {
            tenantId_scenarioId_accountId_month: {
              tenantId,
              scenarioId,
              accountId: dto.accountId,
              month,
            },
          },
          create: {
            tenantId,
            scenarioId,
            accountId: dto.accountId,
            costCenterId: dto.costCenterId || null,
            month,
            amount: computedAmount,
            driverType: dto.driverType,
            driverValue: new Prisma.Decimal(dto.driverValue),
            driverRate: new Prisma.Decimal(dto.driverRate),
            updatedAt: new Date(),
          },
          update: {
            amount: computedAmount,
            driverType: dto.driverType,
            driverValue: new Prisma.Decimal(dto.driverValue),
            driverRate: new Prisma.Decimal(dto.driverRate),
            costCenterId: dto.costCenterId || null,
            updatedAt: new Date(),
          },
        }),
      ),
    );

    return {
      scenarioId,
      accountId: dto.accountId,
      driverType: dto.driverType,
      monthsUpdated: months.length,
      amountPerMonth: computedAmount,
      totalBudgeted: new Prisma.Decimal((Number(computedAmount) * months.length).toFixed(2)),
    };
  }

  /** Compare two scenarios or a scenario vs actual GL balances. */
  async compareScenarios(
    tenantId: string,
    scenarioAId: string,
    scenarioBId: string | 'actuals',
    fiscalYear: number,
  ) {
    const scenarioA = await this.getScenario(tenantId, scenarioAId);

    // Build a map of accountId → month → amount for scenario A
    const aMap = new Map<string, Map<number, number>>();
    for (const line of scenarioA.lines) {
      if (!aMap.has(line.accountId)) aMap.set(line.accountId, new Map());
      aMap.get(line.accountId)!.set(line.month, Number(line.amount));
    }

    let bLabel: string;
    const bMap = new Map<string, Map<number, number>>();

    if (scenarioBId === 'actuals') {
      bLabel = `Actuals FY${fiscalYear}`;
      // Pull actual GL balances for the fiscal year
      const actuals = await prisma.journalEntry.groupBy({
        by: ['accountId'],
        where: {
          tenantId,
          journal: {
            tenantId,
            status: 'POSTED',
            date: {
              gte: new Date(`${fiscalYear}-01-01`),
              lte: new Date(`${fiscalYear}-12-31`),
            },
          },
        },
        _sum: { debit: true, credit: true },
      });

      for (const a of actuals) {
        const net = Number(a._sum.debit || 0) - Number(a._sum.credit || 0);
        // Spread evenly across 12 months (simplified)
        if (!bMap.has(a.accountId)) bMap.set(a.accountId, new Map());
        for (let m = 1; m <= 12; m++) {
          bMap.get(a.accountId)!.set(m, net / 12);
        }
      }
    } else {
      const scenarioB = await this.getScenario(tenantId, scenarioBId);
      bLabel = scenarioB.name;
      for (const line of scenarioB.lines) {
        if (!bMap.has(line.accountId)) bMap.set(line.accountId, new Map());
        bMap.get(line.accountId)!.set(line.month, Number(line.amount));
      }
    }

    // Build comparison rows
    const allAccountIds = new Set([...aMap.keys(), ...bMap.keys()]);
    const rows = [];

    for (const accountId of allAccountIds) {
      const aTotal = Array.from(aMap.get(accountId)?.values() ?? []).reduce((s, v) => s + v, 0);
      const bTotal = Array.from(bMap.get(accountId)?.values() ?? []).reduce((s, v) => s + v, 0);
      const varianceAmt = aTotal - bTotal;
      const variancePct = bTotal !== 0 ? ((varianceAmt / Math.abs(bTotal)) * 100) : null;

      rows.push({
        accountId,
        scenarioATotal: aTotal.toFixed(2),
        scenarioBTotal: bTotal.toFixed(2),
        varianceAmount: varianceAmt.toFixed(2),
        variancePercent: variancePct !== null ? variancePct.toFixed(1) : null,
      });
    }

    rows.sort((a, b) =>
      Math.abs(Number(b.varianceAmount)) - Math.abs(Number(a.varianceAmount)),
    );

    return {
      scenarioA: { id: scenarioAId, name: scenarioA.name },
      scenarioB: { id: scenarioBId, name: bLabel! },
      fiscalYear,
      rows,
      summary: {
        totalA: rows.reduce((s, r) => s + Number(r.scenarioATotal), 0).toFixed(2),
        totalB: rows.reduce((s, r) => s + Number(r.scenarioBTotal), 0).toFixed(2),
        netVariance: rows.reduce((s, r) => s + Number(r.varianceAmount), 0).toFixed(2),
      },
    };
  }

  async deleteScenario(tenantId: string, id: string, userId: string) {
    const scenario = await this.getScenario(tenantId, id);
    if (scenario.isLocked) throw new BadRequestException('Cannot delete a locked scenario');
    return prisma.budgetScenario.update({
      where: { id },
      data: { status: 'ARCHIVED', updatedBy: userId },
    });
  }

  /** Upsert a single budget line in a scenario. */
  async upsertScenarioLine(
    tenantId: string,
    scenarioId: string,
    dto: {
      accountId: string;
      month: number;
      amount: number;
      driverType?: string;
      driverValue?: number;
      driverRate?: number;
      costCenterId?: string;
      notes?: string;
    },
  ) {
    const scenario = await this.getScenario(tenantId, scenarioId);
    if (scenario.isLocked) throw new BadRequestException('Scenario is locked');

    return prisma.budgetScenarioLine.upsert({
      where: {
        tenantId_scenarioId_accountId_month: {
          tenantId,
          scenarioId,
          accountId: dto.accountId,
          month: dto.month,
        },
      },
      create: {
        tenantId,
        scenarioId,
        accountId: dto.accountId,
        costCenterId: dto.costCenterId || null,
        month: dto.month,
        amount: new Prisma.Decimal(dto.amount),
        driverType: dto.driverType || null,
        driverValue: dto.driverValue != null ? new Prisma.Decimal(dto.driverValue) : null,
        driverRate: dto.driverRate != null ? new Prisma.Decimal(dto.driverRate) : null,
        notes: dto.notes || null,
        updatedAt: new Date(),
      },
      update: {
        amount: new Prisma.Decimal(dto.amount),
        driverType: dto.driverType || null,
        driverValue: dto.driverValue != null ? new Prisma.Decimal(dto.driverValue) : null,
        driverRate: dto.driverRate != null ? new Prisma.Decimal(dto.driverRate) : null,
        notes: dto.notes || null,
        updatedAt: new Date(),
      },
    });
  }
}
