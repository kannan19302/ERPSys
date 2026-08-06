import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";
import { z } from "zod";

export const openEnrollmentCycleSchema = z.object({
  name: z.string().min(1),
  planYear: z.number().int().min(2025),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  hsaMaxContributionIndividual: z.number().default(4150),
  hsaMaxContributionFamily: z.number().default(8300),
  fsaMaxContribution: z.number().default(3200),
});

export const benefitEnrollmentSchema = z.object({
  employeeId: z.string().min(1),
  planId: z.string().min(1),
  coverageTier: z.enum([
    "EMPLOYEE_ONLY",
    "EMPLOYEE_SPOUSE",
    "EMPLOYEE_CHILDREN",
    "FAMILY",
  ]),
  employeeContributionMonthly: z.number().nonnegative(),
  employerContributionMonthly: z.number().nonnegative(),
});

@Injectable()
export class HrBenefitsAdministrationDeepService {
  async createOpenEnrollmentCycle(
    tenantId: string,
    data: z.infer<typeof openEnrollmentCycleSchema>,
  ) {
    const validated = openEnrollmentCycleSchema.parse(data);
    return (prisma as any).workflowDefinition.create({
      data: {
        tenantId,
        name: `[HR-OPEN-ENROLLMENT] ${validated.name} (${validated.planYear})`,
        definitionJson: JSON.stringify(validated),
        isActive: true,
      },
    });
  }

  async getOpenEnrollmentCycles(tenantId: string) {
    return (prisma as any).workflowDefinition.findMany({
      where: { tenantId, name: { startsWith: "[HR-OPEN-ENROLLMENT]" } },
    });
  }

  async submitBenefitEnrollment(
    tenantId: string,
    data: z.infer<typeof benefitEnrollmentSchema>,
  ) {
    const validated = benefitEnrollmentSchema.parse(data);
    const employee = await prisma.employee.findFirst({
      where: { tenantId, id: validated.employeeId },
    });
    if (!employee) throw new NotFoundException("Employee not found");

    return (prisma as any).activity
      ? (prisma as any).activity.create({
          data: {
            tenantId,
            type: "BENEFIT_ENROLLMENT",
            subject: `[BENEFIT-ENROLL] ${employee.firstName} ${employee.lastName} (${validated.coverageTier})`,
            description: JSON.stringify({ ...validated, status: "CONFIRMED" }),
            status: "ENROLLED",
          },
        })
      : {
          success: true,
          employeeId: validated.employeeId,
          status: "CONFIRMED",
        };
  }

  async generateCobraContinuationNotice(
    tenantId: string,
    employeeId: string,
    qualifyingEvent: string,
  ) {
    const employee = await prisma.employee.findFirst({
      where: { tenantId, id: employeeId },
    });
    if (!employee) throw new NotFoundException("Employee not found");

    return {
      employeeId,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      qualifyingEvent,
      cobraNoticeId: `COBRA-${Date.now()}`,
      continuationPeriodMonths: 18,
      premiumPaymentDeadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      status: "NOTICE_ISSUED",
    };
  }

  async calculate401kCompanyMatch(
    _tenantId: string,
    employeeId: string,
    annualSalary: number,
    employeeContributionPercent: number,
  ) {
    const matchCapPercent = 6;
    const matchRatePercent = 50; // 50% match up to 6%

    const eligibleMatchPercentage = Math.min(
      employeeContributionPercent,
      matchCapPercent,
    );
    const annualCompanyMatchAmount =
      annualSalary * (eligibleMatchPercentage / 100) * (matchRatePercent / 100);

    return {
      employeeId,
      annualSalary,
      employeeContributionPercent,
      eligibleMatchPercentage,
      annualCompanyMatchAmount,
      payPeriodMatchAmount:
        Math.round((annualCompanyMatchAmount / 24) * 100) / 100,
    };
  }
}
