import { Injectable } from "@nestjs/common";
import { prisma } from "@unerp/database";
import { Prisma } from "@prisma/client";

@Injectable()
export class AssetBudgetService {
  async getAllocations(
    tenantId: string,
    fiscalYear?: number,
    assetId?: string,
  ) {
    const where: Prisma.FixedAssetBudgetAllocationWhereInput = { tenantId };
    if (fiscalYear) where.fiscalYear = fiscalYear;
    return prisma.fixedAssetBudgetAllocation.findMany({
      where,
      orderBy: { fiscalYear: "desc" },
    });
  }

  async createAllocation(
    tenantId: string,
    orgId: string,
    dto: {
      fiscalYear: number;
      categoryId?: string;
      allocatedAmount: number;
      notes?: string;
    },
  ) {
    return prisma.fixedAssetBudgetAllocation.create({
      data: {
        tenantId,
        orgId,
        ...dto,
        allocatedAmount: new Prisma.Decimal(dto.allocatedAmount),
      },
    });
  }

  async updateAllocation(
    tenantId: string,
    id: string,
    dto: {
      allocatedAmount?: number;
      spentAmount?: number;
      notes?: string;
    },
  ) {
    const data: Record<string, unknown> = {};
    if (dto.allocatedAmount !== undefined)
      data.allocatedAmount = new Prisma.Decimal(dto.allocatedAmount);
    if (dto.spentAmount !== undefined)
      data.spentAmount = new Prisma.Decimal(dto.spentAmount);
    if (dto.notes !== undefined) data.notes = dto.notes;
    return prisma.fixedAssetBudgetAllocation.update({ where: { id }, data });
  }

  async createAllocationSimple(
    tenantId: string,
    body: {
      assetId: string;
      fiscalYear: string;
      allocatedAmount: number;
      spentAmount?: number;
      description?: string;
    },
  ) {
    return prisma.fixedAssetBudgetAllocation.create({
      data: { ...body, tenantId } as any,
    });
  }

  async updateAllocationById(
    id: string,
    body: { allocatedAmount?: number; spentAmount?: number },
  ) {
    return prisma.fixedAssetBudgetAllocation.update({
      where: { id },
      data: body as any,
    });
  }

  async deleteAllocation(id: string) {
    return prisma.fixedAssetBudgetAllocation.delete({ where: { id } });
  }

  async getBudgetSummary(tenantId: string, fiscalYear?: number) {
    const where: Prisma.FixedAssetBudgetAllocationWhereInput = { tenantId };
    if (fiscalYear) where.fiscalYear = fiscalYear;
    const allocations = await prisma.fixedAssetBudgetAllocation.findMany({
      where,
    });
    const totalAllocated = allocations.reduce(
      (s, a) => s + Number(a.allocatedAmount),
      0,
    );
    const totalSpent = allocations.reduce(
      (s, a) => s + Number(a.spentAmount),
      0,
    );
    return {
      totalAllocated,
      totalSpent,
      remainingBudget: totalAllocated - totalSpent,
      count: allocations.length,
    };
  }
}
