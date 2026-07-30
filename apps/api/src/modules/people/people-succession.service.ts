// @ts-nocheck
import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class PeopleSuccessionService {
  async getSuccessionPlans(tenantId: string, query: any = {}) {
    const where: any = { tenantId, isActive: true };
    if (query.readinessRating) where.readinessRating = query.readinessRating;
    if (query.riskOfLoss) where.riskOfLoss = query.riskOfLoss;
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 50;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.peopleSuccessionPlan.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.peopleSuccessionPlan.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getSuccessionPlanById(tenantId: string, id: string) {
    const plan = await prisma.peopleSuccessionPlan.findFirst({
      where: { tenantId, id },
    });
    if (!plan) throw new NotFoundException("Succession plan not found");
    return plan;
  }

  async createSuccessionPlan(tenantId: string, data: any) {
    return prisma.peopleSuccessionPlan.create({
      data: {
        ...data,
        tenantId,
        successors: data.successors || [],
      },
    });
  }

  async updateSuccessionPlan(tenantId: string, id: string, data: any) {
    const existing = await prisma.peopleSuccessionPlan.findFirst({
      where: { tenantId, id },
    });
    if (!existing) throw new NotFoundException("Succession plan not found");
    return prisma.peopleSuccessionPlan.update({
      where: { id },
      data,
    });
  }
}
