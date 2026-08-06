import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";
import { Prisma } from "@prisma/client";

@Injectable()
export class ReportingAlertRulesService {
  async getRules(tenantId: string, reportId?: string) {
    const where: Prisma.ReportAlertRuleWhereInput = { tenantId };
    if (reportId) where.reportId = reportId;
    return prisma.reportAlertRule.findMany({ where, orderBy: { name: "asc" } });
  }

  async createRule(
    tenantId: string,
    dto: {
      reportId: string;
      name: string;
      condition: Record<string, unknown>;
      channel?: string;
      recipientIds?: string[];
    },
  ) {
    return prisma.reportAlertRule.create({
      data: {
        tenantId,
        reportId: dto.reportId,
        name: dto.name,
        condition: dto.condition as Prisma.InputJsonValue,
        channel: dto.channel || "IN_APP",
        recipientIds: dto.recipientIds || [],
      },
    });
  }

  async updateRule(
    tenantId: string,
    id: string,
    dto: Partial<{
      name: string;
      condition: Record<string, unknown>;
      channel: string;
      recipientIds: string[];
      isActive: boolean;
    }>,
  ) {
    const rule = await prisma.reportAlertRule.findFirst({
      where: { tenantId, id },
    });
    if (!rule) throw new NotFoundException("Alert rule not found");
    return prisma.reportAlertRule.update({
      where: { id },
      data: {
        ...dto,
        condition: dto.condition as Prisma.InputJsonValue | undefined,
      },
    });
  }

  async deleteRule(tenantId: string, id: string) {
    const rule = await prisma.reportAlertRule.findFirst({
      where: { tenantId, id },
    });
    if (!rule) throw new NotFoundException("Alert rule not found");
    await prisma.reportAlertRule.delete({ where: { id } });
    return { success: true };
  }

  async createRuleSimple(tenantId: string, body: any) {
    return prisma.reportAlertRule.create({
      data: { ...body, tenantId } as any,
    });
  }

  async updateRuleById(id: string, body: any) {
    return prisma.reportAlertRule.update({ where: { id }, data: body as any });
  }

  async deleteRuleById(id: string) {
    return prisma.reportAlertRule.delete({ where: { id } });
  }
}
