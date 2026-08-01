import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class SalesReturnsDeepService {
  async getReturns(tenantId: string, status?: string) {
    const where: any = { tenantId };
    if (status) where.status = status;

    return prisma.salesReturnOrderDeep.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
  }

  async getReturnById(tenantId: string, id: string) {
    const ret = await prisma.salesReturnOrderDeep.findFirst({
      where: { id, tenantId },
    });
    if (!ret) throw new NotFoundException("Return order not found");
    return ret;
  }

  async createReturn(tenantId: string, dto: any) {
    const count = await prisma.salesReturnOrderDeep.count({
      where: { tenantId },
    });
    const returnNumber =
      dto.returnNumber ||
      `RET-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

    return prisma.salesReturnOrderDeep.create({
      data: {
        tenantId,
        returnNumber,
        orderId: dto.orderId || null,
        customerId: dto.customerId,
        status: dto.status || "REQUESTED",
        reason: dto.reason || "BUYER_REMORSE",
        totalRefundAmount: dto.totalRefundAmount || 0,
        restockingFee: dto.restockingFee || 0,
        approvedBy: dto.approvedBy || null,
        items: dto.items || null,
        notes: dto.notes || null,
      },
    });
  }

  async updateReturnStatus(
    tenantId: string,
    id: string,
    status: string,
    approvedBy?: string,
  ) {
    await this.getReturnById(tenantId, id);

    return prisma.salesReturnOrderDeep.update({
      where: { id },
      data: {
        status,
        approvedBy: approvedBy || undefined,
      },
    });
  }

  async getReturnAnalytics(tenantId: string) {
    const returns = await prisma.salesReturnOrderDeep.findMany({
      where: { tenantId },
    });

    const totalReturns = returns.length;
    const pendingReturns = returns.filter(
      (r) => r.status === "REQUESTED",
    ).length;
    const totalRefunded = returns
      .filter((r) => r.status === "REFUNDED")
      .reduce((sum, r) => sum + Number(r.totalRefundAmount || 0), 0);

    const reasonBreakdown: Record<string, number> = {};
    returns.forEach((r) => {
      reasonBreakdown[r.reason] = (reasonBreakdown[r.reason] || 0) + 1;
    });

    return {
      totalReturns,
      pendingReturns,
      totalRefunded,
      reasonBreakdown,
    };
  }
}
