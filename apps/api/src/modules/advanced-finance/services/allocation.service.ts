import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { Prisma } from '@prisma/client';
import { GlAccountingService } from './gl-accounting.service';

interface AllocationTargetInput {
  accountId: string;
  costCenterId?: string;
  departmentId?: string;
  percentage?: number; // Used for static percentage
  ratioWeight?: number; // Used for dynamic weight override if any
}

@Injectable()
export class AllocationService {
  constructor(private readonly glService: GlAccountingService) {}

  async getRules(tenantId: string) {
    return prisma.allocationRule.findMany({
      where: { tenantId },
      include: { sourceAccount: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getRuleById(tenantId: string, ruleId: string) {
    const rule = await prisma.allocationRule.findFirst({
      where: { id: ruleId, tenantId },
      include: { sourceAccount: true },
    });
    if (!rule) throw new NotFoundException('Allocation rule not found');
    return rule;
  }

  async createRule(
    tenantId: string,
    dto: {
      name: string;
      description?: string;
      allocationType: string; // STATIC_PCT, DYNAMIC_STAT
      basisType?: string; // HEADCOUNT, SQUARE_FOOTAGE, REVENUE
      sourceAccountId: string;
      targetAllocations: AllocationTargetInput[];
    },
    userId?: string,
  ) {
    // Validate source account
    const account = await prisma.account.findFirst({
      where: { id: dto.sourceAccountId, tenantId },
    });
    if (!account) throw new NotFoundException('Source account not found');

    // Validate target allocations
    if (!dto.targetAllocations || dto.targetAllocations.length === 0) {
      throw new BadRequestException('At least one target allocation is required');
    }

    if (dto.allocationType === 'STATIC_PCT') {
      const totalPct = dto.targetAllocations.reduce((sum, t) => sum + (t.percentage ?? 0), 0);
      if (Math.abs(totalPct - 100) > 0.01) {
        throw new BadRequestException('Total target percentages must sum to 100%');
      }
    }

    const rule = await prisma.allocationRule.create({
      data: {
        tenantId,
        name: dto.name,
        description: dto.description || null,
        allocationType: dto.allocationType,
        basisType: dto.basisType || null,
        sourceAccountId: dto.sourceAccountId,
        targetAllocations: dto.targetAllocations as any,
        createdBy: userId || 'system',
        updatedBy: userId || 'system',
      },
    });

    await this.glService.logAudit(prisma, tenantId, 'AllocationRule', rule.id, 'CREATE', { name: dto.name }, userId || 'system');
    return rule;
  }

  async updateRule(
    tenantId: string,
    ruleId: string,
    dto: {
      name?: string;
      description?: string;
      isActive?: boolean;
      allocationType?: string;
      basisType?: string;
      sourceAccountId?: string;
      targetAllocations?: AllocationTargetInput[];
    },
    userId?: string,
  ) {
    const rule = await this.getRuleById(tenantId, ruleId);

    const data: Record<string, unknown> = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    if (dto.allocationType !== undefined) data.allocationType = dto.allocationType;
    if (dto.basisType !== undefined) data.basisType = dto.basisType;
    if (dto.sourceAccountId !== undefined) {
      const account = await prisma.account.findFirst({ where: { id: dto.sourceAccountId, tenantId } });
      if (!account) throw new NotFoundException('Source account not found');
      data.sourceAccountId = dto.sourceAccountId;
    }
    if (dto.targetAllocations !== undefined) {
      if (dto.targetAllocations.length === 0) {
        throw new BadRequestException('At least one target allocation is required');
      }
      const type = dto.allocationType || rule.allocationType;
      if (type === 'STATIC_PCT') {
        const totalPct = dto.targetAllocations.reduce((sum, t) => sum + (t.percentage ?? 0), 0);
        if (Math.abs(totalPct - 100) > 0.01) {
          throw new BadRequestException('Total target percentages must sum to 100%');
        }
      }
      data.targetAllocations = dto.targetAllocations as any;
    }

    data.updatedBy = userId || 'system';

    const updated = await prisma.allocationRule.update({
      where: { id: ruleId },
      data,
    });

    await this.glService.logAudit(prisma, tenantId, 'AllocationRule', ruleId, 'UPDATE', data, userId || 'system');
    return updated;
  }

  async deleteRule(tenantId: string, ruleId: string, userId?: string) {
    const rule = await this.getRuleById(tenantId, ruleId);
    await prisma.allocationRule.delete({ where: { id: ruleId } });
    await this.glService.logAudit(prisma, tenantId, 'AllocationRule', ruleId, 'DELETE', { name: rule.name }, userId || 'system');
    return { success: true };
  }

  async getRuns(tenantId: string) {
    return prisma.allocationRun.findMany({
      where: { tenantId },
      include: { rule: true, journal: true },
      orderBy: { runDate: 'desc' },
    });
  }

  async executeAllocationRun(
    tenantId: string,
    orgId: string,
    ruleId: string,
    dto: { periodStart: string; periodEnd: string },
    userId?: string,
  ) {
    const resolvedOrgId = await this.glService.resolveOrgId(tenantId, orgId);
    const rule = await this.getRuleById(tenantId, ruleId);
    if (!rule.isActive) throw new BadRequestException('Allocation rule is inactive');

    const start = new Date(dto.periodStart);
    const end = new Date(dto.periodEnd);

    // 1. Calculate pool balance (source account posted balance in the period)
    const journalEntries = await prisma.journalEntry.findMany({
      where: {
        tenantId,
        accountId: rule.sourceAccountId,
        journal: {
          orgId: resolvedOrgId,
          status: 'POSTED',
          date: { gte: start, lte: end },
        },
      },
    });

    let poolBalance = 0;
    for (const entry of journalEntries) {
      const debit = Number(entry.debit);
      const credit = Number(entry.credit);
      if (rule.sourceAccount.type === 'ASSET' || rule.sourceAccount.type === 'EXPENSE') {
        poolBalance += (debit - credit);
      } else {
        poolBalance += (credit - debit);
      }
    }

    if (Math.abs(poolBalance) < 0.01) {
      throw new BadRequestException('Source account has no net balance to allocate for this period.');
    }

    const targets = rule.targetAllocations as unknown as AllocationTargetInput[];
    const entriesToCreate: Array<{
      accountId: string;
      debit: number;
      credit: number;
      description?: string;
      costCenterId?: string;
      departmentId?: string;
    }> = [];

    // 2. Compute allocation amounts
    if (rule.allocationType === 'STATIC_PCT') {
      for (const target of targets) {
        const pct = target.percentage ?? 0;
        const amount = Number((poolBalance * (pct / 100)).toFixed(2));
        if (amount === 0) continue;

        // Debit the target, Credit the source
        entriesToCreate.push({
          accountId: target.accountId,
          debit: amount > 0 ? amount : 0,
          credit: amount < 0 ? -amount : 0,
          description: `Allocation from ${rule.sourceAccount.name} (${pct}%)`,
          costCenterId: target.costCenterId,
          departmentId: target.departmentId,
        });
      }
    } else if (rule.allocationType === 'DYNAMIC_STAT') {
      if (rule.basisType === 'HEADCOUNT') {
        // Query active employee headcount by department
        const employees = await prisma.employee.findMany({
          where: { tenantId, orgId: resolvedOrgId, status: 'ACTIVE' },
        });

        const deptCount: Record<string, number> = {};
        let totalHeadcount = 0;
        for (const emp of employees) {
          if (emp.departmentId) {
            deptCount[emp.departmentId] = (deptCount[emp.departmentId] || 0) + 1;
            totalHeadcount++;
          }
        }

        if (totalHeadcount === 0) {
          throw new BadRequestException('No active employees with departments found for dynamic headcount allocation.');
        }

        // Distribute based on headcount ratio
        for (const target of targets) {
          const deptId = target.departmentId;
          const count = deptId ? (deptCount[deptId] || 0) : 0;
          const ratio = count / totalHeadcount;
          const amount = Number((poolBalance * ratio).toFixed(2));
          if (amount === 0) continue;

          entriesToCreate.push({
            accountId: target.accountId,
            debit: amount > 0 ? amount : 0,
            credit: amount < 0 ? -amount : 0,
            description: `Dynamic Headcount Allocation (${count}/${totalHeadcount} employees)`,
            costCenterId: target.costCenterId,
            departmentId: target.departmentId,
          });
        }
      } else if (rule.basisType === 'REVENUE') {
        // Query target departments' revenue balances
        const targetAccountIds = Array.from(new Set(targets.map((t) => t.accountId)));
        const revEntries = await prisma.journalEntry.findMany({
          where: {
            tenantId,
            accountId: { in: targetAccountIds },
            journal: {
              orgId: resolvedOrgId,
              status: 'POSTED',
              date: { gte: start, lte: end },
            },
          },
          include: { account: true },
        });

        const revMap: Record<string, number> = {};
        let totalRevenue = 0;
        for (const entry of revEntries) {
          if (entry.account.type === 'REVENUE') {
            const val = Number(entry.credit) - Number(entry.debit);
            revMap[entry.accountId] = (revMap[entry.accountId] || 0) + val;
            totalRevenue += val;
          }
        }

        if (totalRevenue <= 0) {
          // If no revenue recorded, fallback to equal distribution
          totalRevenue = targets.length;
          targets.forEach((t) => { revMap[t.accountId] = 1; });
        }

        for (const target of targets) {
          const revVal = revMap[target.accountId] || 0;
          const ratio = revVal / totalRevenue;
          const amount = Number((poolBalance * ratio).toFixed(2));
          if (amount === 0) continue;

          entriesToCreate.push({
            accountId: target.accountId,
            debit: amount > 0 ? amount : 0,
            credit: amount < 0 ? -amount : 0,
            description: `Dynamic Revenue Allocation (${(ratio * 100).toFixed(1)}% of total revenue)`,
            costCenterId: target.costCenterId,
            departmentId: target.departmentId,
          });
        }
      } else {
        // Fallback: SQUARE_FOOTAGE or others with equal split
        const count = targets.length;
        for (const target of targets) {
          const amount = Number((poolBalance / count).toFixed(2));
          if (amount === 0) continue;

          entriesToCreate.push({
            accountId: target.accountId,
            debit: amount > 0 ? amount : 0,
            credit: amount < 0 ? -amount : 0,
            description: `Equal Split Allocation`,
            costCenterId: target.costCenterId,
            departmentId: target.departmentId,
          });
        }
      }
    }

    if (entriesToCreate.length === 0) {
      throw new BadRequestException('Allocation resulted in zero distributed amounts.');
    }

    // Adjust for rounding differences: total debits must equal poolBalance
    const totalAllocated = entriesToCreate.reduce((sum, e) => sum + (e.debit > 0 ? e.debit : -e.credit), 0);
    const roundingDiff = Number((poolBalance - totalAllocated).toFixed(2));
    if (Math.abs(roundingDiff) >= 0.01 && entriesToCreate.length > 0) {
      const last = entriesToCreate[entriesToCreate.length - 1];
      if (last) {
        if (last.debit > 0) last.debit = Number((last.debit + roundingDiff).toFixed(2));
        else last.credit = Number((last.credit - roundingDiff).toFixed(2));
      }
    }

    // Add balancing credit to source account
    entriesToCreate.push({
      accountId: rule.sourceAccountId,
      debit: poolBalance < 0 ? -poolBalance : 0,
      credit: poolBalance > 0 ? poolBalance : 0,
      description: `Allocation source pool clearing for rule: ${rule.name}`,
    });

    // Create journal entry (Draft by default)
    const runNumber = `ALLOC-${Date.now().toString().slice(-6)}`;
    const journal = await this.glService.createJournal(tenantId, resolvedOrgId, {
      entryNumber: runNumber,
      notes: `Allocation Run for rule "${rule.name}" for period ${dto.periodStart} to ${dto.periodEnd}`,
      entries: entriesToCreate,
    });

    const run = await prisma.allocationRun.create({
      data: {
        tenantId,
        ruleId: rule.id,
        periodStart: start,
        periodEnd: end,
        allocatedAmount: new Prisma.Decimal(Math.abs(poolBalance)),
        journalId: journal?.id ?? null,
        status: 'DRAFT',
      },
    });

    await this.glService.logAudit(prisma, tenantId, 'AllocationRun', run.id, 'EXECUTE', { allocatedAmount: poolBalance, journalId: journal?.id }, userId || 'system');

    return {
      runId: run.id,
      ruleName: rule.name,
      allocatedAmount: poolBalance,
      journalId: journal?.id,
      status: 'DRAFT',
      entriesCount: entriesToCreate.length,
    };
  }

  async postAllocationRun(tenantId: string, runId: string, userId?: string) {
    const run = await prisma.allocationRun.findFirst({
      where: { id: runId, tenantId },
      include: { journal: true },
    });
    if (!run) throw new NotFoundException('Allocation run not found');
    if (run.status === 'POSTED') throw new BadRequestException('Allocation run is already posted');
    if (!run.journalId) throw new BadRequestException('No journal entry associated with this run');

    // Post the journal
    await prisma.journal.update({
      where: { id: run.journalId },
      data: { status: 'POSTED' },
    });

    // Update run status
    const updated = await prisma.allocationRun.update({
      where: { id: runId },
      data: { status: 'POSTED' },
    });

    await this.glService.logAudit(prisma, tenantId, 'AllocationRun', runId, 'POST', { status: 'POSTED' }, userId || 'system');
    return updated;
  }
}
