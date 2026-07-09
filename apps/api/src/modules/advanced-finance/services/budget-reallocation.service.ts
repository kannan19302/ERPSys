import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { Prisma } from '@prisma/client';

@Injectable()
export class BudgetReallocationService {
  async getReallocations(tenantId: string) {
    return prisma.budgetReallocation.findMany({
      where: { tenantId },
      include: {
        lines: {
          include: {
            budget: {
              include: { account: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getReallocationById(tenantId: string, id: string) {
    const reallocation = await prisma.budgetReallocation.findFirst({
      where: { id, tenantId },
      include: {
        lines: {
          include: {
            budget: {
              include: { account: true },
            },
          },
        },
      },
    });
    if (!reallocation) throw new NotFoundException('Budget reallocation not found');
    return reallocation;
  }

  async createReallocation(
    tenantId: string,
    orgId: string,
    dto: {
      description?: string;
      lines: Array<{
        budgetId: string;
        type: 'SOURCE' | 'DESTINATION';
        amount: number;
      }>;
    },
    requestedBy: string,
  ) {
    // Generate a unique number
    const count = await prisma.budgetReallocation.count({ where: { tenantId } });
    const year = new Date().getFullYear();
    const sequence = String(count + 1).padStart(4, '0');
    const number = `BR-${year}-${sequence}`;

    // Validate lines sum
    // Total source amount must equal total destination amount
    let sourceSum = 0;
    let destSum = 0;

    for (const line of dto.lines) {
      if (line.type === 'SOURCE') sourceSum += line.amount;
      if (line.type === 'DESTINATION') destSum += line.amount;

      // Verify budget exists
      const budget = await prisma.budget.findFirst({
        where: { id: line.budgetId, tenantId },
      });
      if (!budget) {
        throw new NotFoundException(`Budget ${line.budgetId} not found`);
      }

      // Source budget must have sufficient funds
      if (line.type === 'SOURCE' && Number(budget.amount) < line.amount) {
        throw new BadRequestException(`Insufficient funds in source budget ${line.budgetId}. Available: ${budget.amount}`);
      }
    }

    if (Math.abs(sourceSum - destSum) > 0.01) {
      throw new BadRequestException(`Source reallocation sum (${sourceSum}) must equal destination sum (${destSum})`);
    }

    return prisma.budgetReallocation.create({
      data: {
        tenantId,
        orgId,
        number,
        description: dto.description || null,
        status: 'DRAFT',
        requestedBy,
        lines: {
          create: dto.lines.map((l) => ({
            tenantId,
            budgetId: l.budgetId,
            type: l.type,
            amount: new Prisma.Decimal(l.amount),
          })),
        },
      },
      include: {
        lines: true,
      },
    });
  }

  async submitReallocation(tenantId: string, id: string) {
    const reallocation = await prisma.budgetReallocation.findFirst({
      where: { id, tenantId },
    });
    if (!reallocation) throw new NotFoundException('Budget reallocation not found');
    if (reallocation.status !== 'DRAFT') {
      throw new BadRequestException('Only DRAFT reallocations can be submitted.');
    }

    return prisma.budgetReallocation.update({
      where: { id },
      data: { status: 'SUBMITTED' },
    });
  }

  async approveReallocation(tenantId: string, id: string, approvedBy: string) {
    const reallocation = await prisma.budgetReallocation.findFirst({
      where: { id, tenantId },
      include: { lines: true },
    });
    if (!reallocation) throw new NotFoundException('Budget reallocation not found');
    if (reallocation.status !== 'SUBMITTED') {
      throw new BadRequestException('Only SUBMITTED reallocations can be approved.');
    }

    return prisma.$transaction(async (tx) => {
      // Apply budget changes
      for (const line of reallocation.lines) {
        const budget = await tx.budget.findFirst({
          where: { id: line.budgetId, tenantId },
          include: { periodAmounts: true },
        });

        if (!budget) throw new NotFoundException(`Budget ${line.budgetId} not found`);

        const adjustment = Number(line.amount);
        let newAmount = Number(budget.amount);

        if (line.type === 'SOURCE') {
          newAmount -= adjustment;
          if (newAmount < 0) {
            throw new BadRequestException(`Insufficient funds in source budget ${line.budgetId} during final execution.`);
          }
        } else {
          newAmount += adjustment;
        }

        // Update overall budget amount
        await tx.budget.update({
          where: { id: budget.id },
          data: { amount: new Prisma.Decimal(newAmount) },
        });

        // Update monthly period amounts proportionally if they exist
        if (budget.periodAmounts.length > 0) {
          const ratio = newAmount / Number(budget.amount);
          for (const pa of budget.periodAmounts) {
            const newPaAmount = Number(pa.amount) * ratio;
            await tx.budgetPeriodAmount.update({
              where: { id: pa.id },
              data: { amount: new Prisma.Decimal(newPaAmount) },
            });
          }
        }
      }

      return tx.budgetReallocation.update({
        where: { id },
        data: {
          status: 'APPROVED',
          approvedBy,
          approvedAt: new Date(),
        },
      });
    });
  }

  async rejectReallocation(tenantId: string, id: string, notes: string, approvedBy: string) {
    const reallocation = await prisma.budgetReallocation.findFirst({
      where: { id, tenantId },
    });
    if (!reallocation) throw new NotFoundException('Budget reallocation not found');
    if (reallocation.status !== 'SUBMITTED') {
      throw new BadRequestException('Only SUBMITTED reallocations can be rejected.');
    }

    return prisma.budgetReallocation.update({
      where: { id },
      data: {
        status: 'REJECTED',
        approvedBy,
        approvedAt: new Date(),
        notes: notes || null,
      },
    });
  }
}
