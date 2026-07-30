// @ts-nocheck
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { prisma } from "@unerp/database";
import { Prisma } from "@prisma/client";

@Injectable()
export class SubscriptionDunningService {
  async getRules(tenantId: string) {
    return prisma.subscriptionDunningRule.findMany({
      where: { tenantId },
      orderBy: { daysOverdue: "asc" },
    });
  }

  async createRule(
    tenantId: string,
    dto: {
      name: string;
      invoiceStatus: string;
      daysOverdue: number;
      action: string;
      lateFeeType?: string;
      lateFeeValue?: number;
      sendEmail?: boolean;
      emailTemplateId?: string;
      sortOrder?: number;
    },
  ) {
    const exists = await prisma.subscriptionDunningRule.findFirst({
      where: { tenantId, name: dto.name },
    });
    if (exists) throw new BadRequestException("Dunning rule already exists");
    return prisma.subscriptionDunningRule.create({
      data: {
        tenantId,
        ...dto,
        lateFeeValue: dto.lateFeeValue
          ? new Prisma.Decimal(dto.lateFeeValue)
          : null,
        isActive: true,
        sortOrder: dto.sortOrder || 0,
      },
    });
  }

  async updateRule(
    tenantId: string,
    id: string,
    dto: Partial<{
      name: string;
      invoiceStatus: string;
      daysOverdue: number;
      action: string;
      lateFeeType: string;
      lateFeeValue: number;
      sendEmail: boolean;
      emailTemplateId: string;
      isActive: boolean;
      sortOrder: number;
    }>,
  ) {
    const rule = await prisma.subscriptionDunningRule.findFirst({
      where: { tenantId, id },
    });
    if (!rule) throw new NotFoundException("Dunning rule not found");
    const data: Record<string, unknown> = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.invoiceStatus !== undefined) data.invoiceStatus = dto.invoiceStatus;
    if (dto.daysOverdue !== undefined) data.daysOverdue = dto.daysOverdue;
    if (dto.action !== undefined) data.action = dto.action;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    if (dto.lateFeeValue !== undefined)
      data.lateFeeValue = new Prisma.Decimal(dto.lateFeeValue);
    return prisma.subscriptionDunningRule.update({ where: { id }, data });
  }

  async deleteRule(tenantId: string, id: string) {
    const rule = await prisma.subscriptionDunningRule.findFirst({
      where: { tenantId, id },
    });
    if (!rule) throw new NotFoundException("Dunning rule not found");
    await prisma.subscriptionDunningRule.delete({ where: { id } });
    return { success: true };
  }

  async getOverdueInvoices(tenantId: string) {
    const now = new Date();
    return prisma.subscriptionInvoice.findMany({
      where: { tenantId, status: "PENDING", invoice: { dueDate: { lt: now } } },
      include: {
        subscription: { select: { name: true, customerId: true } },
        invoice: {
          select: { invoiceNumber: true, dueDate: true, totalAmount: true },
        },
      },
      orderBy: { invoice: { dueDate: "asc" } },
    });
  }
}
