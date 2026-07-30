// @ts-nocheck
import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class SubscriptionUsageService {
  async getUsageRecords(tenantId: string, query: any = {}) {
    const where: any = { tenantId };
    if (query.subscriptionId) where.subscriptionId = query.subscriptionId;
    if (query.billingPeriod) where.billingPeriod = query.billingPeriod;
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 50;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.subscriptionUsageBilling.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.subscriptionUsageBilling.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async recordUsage(tenantId: string, data: any) {
    return prisma.subscriptionUsageBilling.create({
      data: {
        ...data,
        tenantId,
      },
    });
  }

  async getUsageGroupByMetric(tenantId: string) {
    return prisma.subscriptionUsage.groupBy({
      by: ["metricName"],
      where: { tenantId },
      _sum: { quantity: true },
    });
  }
}
