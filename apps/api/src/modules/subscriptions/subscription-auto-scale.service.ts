import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";
import { Prisma } from "@prisma/client";

@Injectable()
export class SubscriptionAutoScaleService {
  async getRules(tenantId: string, subscriptionId?: string) {
    const where: Record<string, unknown> = { tenantId };
    if (subscriptionId) where.subscriptionId = subscriptionId;
    return prisma.subscriptionAutoScaleRule.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
  }

  async createRule(
    tenantId: string,
    dto: {
      name: string;
      subscriptionId?: string;
      metricName: string;
      thresholdType: string;
      thresholdValue: number;
      scaleAction: string;
      scaleAmount?: number;
      coolDownMinutes?: number;
    },
  ) {
    return prisma.subscriptionAutoScaleRule.create({
      data: {
        tenantId,
        ...dto,
        thresholdValue: new Prisma.Decimal(dto.thresholdValue),
        scaleAmount: dto.scaleAmount || 1,
        coolDownMinutes: dto.coolDownMinutes || 1440,
        isActive: true,
      },
    });
  }

  async updateRule(
    tenantId: string,
    id: string,
    dto: Partial<{
      name: string;
      metricName: string;
      thresholdType: string;
      thresholdValue: number;
      scaleAction: string;
      scaleAmount: number;
      coolDownMinutes: number;
      isActive: boolean;
    }>,
  ) {
    const rule = await prisma.subscriptionAutoScaleRule.findFirst({
      where: { tenantId, id },
    });
    if (!rule) throw new NotFoundException("Auto-scale rule not found");
    const data: Record<string, unknown> = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.metricName !== undefined) data.metricName = dto.metricName;
    if (dto.thresholdType !== undefined) data.thresholdType = dto.thresholdType;
    if (dto.thresholdValue !== undefined)
      data.thresholdValue = new Prisma.Decimal(dto.thresholdValue);
    if (dto.scaleAction !== undefined) data.scaleAction = dto.scaleAction;
    if (dto.scaleAmount !== undefined) data.scaleAmount = dto.scaleAmount;
    if (dto.coolDownMinutes !== undefined)
      data.coolDownMinutes = dto.coolDownMinutes;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    return prisma.subscriptionAutoScaleRule.update({ where: { id }, data });
  }

  async deleteRule(tenantId: string, id: string) {
    const rule = await prisma.subscriptionAutoScaleRule.findFirst({
      where: { tenantId, id },
    });
    if (!rule) throw new NotFoundException("Auto-scale rule not found");
    await prisma.subscriptionAutoScaleRule.delete({ where: { id } });
    return { success: true };
  }
}
