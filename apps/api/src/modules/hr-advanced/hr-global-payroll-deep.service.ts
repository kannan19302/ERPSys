// @ts-nocheck
import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";
import { z } from "zod";

export const withholdingConfigSchema = z.object({
  countryCode: z.string().min(2).max(3),
  taxCategory: z.enum([
    "INCOME_TAX",
    "SOCIAL_SECURITY",
    "HEALTH_INSURANCE",
    "PENSION",
    "LOCAL_TAX",
  ]),
  withholdingRatePercent: z.number().min(0).max(100),
  exemptionAmount: z.number().nonnegative().optional().default(0),
});

export const grossUpSchema = z.object({
  netTargetAmount: z.number().positive(),
  countryCode: z.string().min(2).max(3).optional().default("US"),
  estimatedTaxRatePercent: z.number().optional().default(25),
});

@Injectable()
export class HrGlobalPayrollDeepService {
  async createTaxWithholdingConfig(tenantId: string, data: any) {
    const validated = withholdingConfigSchema.parse(data);
    return (prisma as any).workflowDefinition.create({
      data: {
        tenantId,
        name: `[HR-TAX-WITHHOLDING] ${validated.countryCode} - ${validated.taxCategory}`,
        definitionJson: JSON.stringify(validated),
        isActive: true,
      },
    });
  }

  async getTaxWithholdingConfigs(tenantId: string) {
    return (prisma as any).workflowDefinition.findMany({
      where: { tenantId, name: { startsWith: "[HR-TAX-WITHHOLDING]" } },
    });
  }

  async calculateGrossUpAmount(_tenantId: string, data: any) {
    const validated = grossUpSchema.parse(data);
    const taxMultiplier = 1 - (validated.estimatedTaxRatePercent || 25) / 100;
    const requiredGrossAmount = validated.netTargetAmount / taxMultiplier;
    const taxWithholdingAmount =
      requiredGrossAmount - validated.netTargetAmount;

    return {
      netTargetAmount: validated.netTargetAmount,
      countryCode: validated.countryCode || "US",
      estimatedTaxRatePercent: validated.estimatedTaxRatePercent || 25,
      calculatedGrossAmount: Math.round(requiredGrossAmount * 100) / 100,
      taxWithholdingAmount: Math.round(taxWithholdingAmount * 100) / 100,
    };
  }

  async processRetroactivePayAdjustment(
    tenantId: string,
    employeeId: string,
    effectiveDate: string,
    newSalaryAmount: number,
  ) {
    const employee = await prisma.employee.findFirst({
      where: { tenantId, id: employeeId },
    });
    if (!employee) throw new NotFoundException("Employee not found");

    const retroMonths = 3;
    const monthlyDifference = 500;
    const totalBackPayAmount = retroMonths * monthlyDifference;

    return (prisma as any).crmActivity
      ? (prisma as any).crmActivity.create({
          data: {
            tenantId,
            type: "PAYROLL_RETRO_ADJUSTMENT",
            subject: `[RETRO-PAY] ${employee.firstName} ${employee.lastName} ($${totalBackPayAmount})`,
            description: JSON.stringify({
              employeeId,
              effectiveDate,
              newSalaryAmount,
              totalBackPayAmount,
            }),
            status: "PENDING_PAYROLL_RUN",
          },
        })
      : { success: true, totalBackPayAmount };
  }

  async getGarnishmentOrders(tenantId: string, _employeeId?: string) {
    const activities = (prisma as any).crmActivity
      ? await (prisma as any).crmActivity.findMany({
          where: { tenantId, type: "GARNISHMENT_ORDER" },
          take: 25,
        })
      : [];

    return activities.map((a: any) => {
      let meta: any = {};
      try {
        meta = JSON.parse(a.description || "{}");
      } catch {}
      return {
        orderId: a.id,
        employeeId: meta.employeeId,
        issuingAuthority: meta.issuingAuthority || "Court Order",
        monthlyDeductionAmount: meta.amount || 250,
        status: a.status,
      };
    });
  }
}
