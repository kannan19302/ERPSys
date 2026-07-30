// @ts-nocheck
import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class SalesCustomerSuccessService {
  async getPlans(tenantId: string, status?: string) {
    const where: any = { tenantId };
    if (status) where.status = status;

    return prisma.customerSuccessPlan.findMany({
      where,
      include: { milestones: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async getPlanById(tenantId: string, id: string) {
    const plan = await prisma.customerSuccessPlan.findFirst({
      where: { id, tenantId },
      include: { milestones: { orderBy: { createdAt: "asc" } } },
    });
    if (!plan) throw new NotFoundException("Customer Success Plan not found");
    return plan;
  }

  async createPlan(tenantId: string, dto: any) {
    return prisma.customerSuccessPlan.create({
      data: {
        tenantId,
        customerId: dto.customerId,
        name: dto.name,
        status: dto.status || "ACTIVE",
        healthScore: dto.healthScore ?? 100,
        arr: dto.arr || 0,
        nrrTarget: dto.nrrTarget || 100,
        churnRiskLevel: dto.churnRiskLevel || "LOW",
        ownerId: dto.ownerId,
        targetDate: dto.targetDate ? new Date(dto.targetDate) : null,
        goals: dto.goals || null,
        notes: dto.notes || null,
        milestones: dto.milestones?.length
          ? {
              create: dto.milestones.map((m: any) => ({
                tenantId,
                title: m.title,
                description: m.description || null,
                status: m.status || "PENDING",
                dueDate: m.dueDate ? new Date(m.dueDate) : null,
                ownerId: m.ownerId || null,
              })),
            }
          : undefined,
      },
      include: { milestones: true },
    });
  }

  async updatePlan(tenantId: string, id: string, dto: any) {
    await this.getPlanById(tenantId, id);

    return prisma.customerSuccessPlan.update({
      where: { id },
      data: {
        name: dto.name,
        status: dto.status,
        healthScore: dto.healthScore,
        arr: dto.arr,
        nrrTarget: dto.nrrTarget,
        churnRiskLevel: dto.churnRiskLevel,
        ownerId: dto.ownerId,
        targetDate: dto.targetDate ? new Date(dto.targetDate) : null,
        goals: dto.goals,
        notes: dto.notes,
      },
      include: { milestones: true },
    });
  }

  async addMilestone(tenantId: string, planId: string, dto: any) {
    await this.getPlanById(tenantId, planId);

    return prisma.customerSuccessMilestone.create({
      data: {
        tenantId,
        planId,
        title: dto.title,
        description: dto.description || null,
        status: dto.status || "PENDING",
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        ownerId: dto.ownerId || null,
      },
    });
  }

  async updateMilestone(tenantId: string, milestoneId: string, dto: any) {
    const milestone = await prisma.customerSuccessMilestone.findFirst({
      where: { id: milestoneId, tenantId },
    });
    if (!milestone) throw new NotFoundException("Milestone not found");

    return prisma.customerSuccessMilestone.update({
      where: { id: milestoneId },
      data: {
        title: dto.title,
        description: dto.description,
        status: dto.status,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        completionDate:
          dto.status === "COMPLETED" ? new Date() : dto.completionDate,
        ownerId: dto.ownerId,
      },
    });
  }

  async getMetrics(tenantId: string) {
    const plans = await prisma.customerSuccessPlan.findMany({
      where: { tenantId },
    });

    const totalPlans = plans.length;
    const activePlans = plans.filter((p) => p.status === "ACTIVE").length;
    const atRiskPlans = plans.filter(
      (p) => p.churnRiskLevel === "HIGH" || p.churnRiskLevel === "CRITICAL",
    ).length;
    const avgHealthScore =
      totalPlans > 0
        ? Math.round(
            plans.reduce((acc, p) => acc + p.healthScore, 0) / totalPlans,
          )
        : 100;
    const totalArr = plans.reduce((acc, p) => acc + Number(p.arr || 0), 0);

    return {
      totalPlans,
      activePlans,
      atRiskPlans,
      avgHealthScore,
      totalArr,
    };
  }
}
