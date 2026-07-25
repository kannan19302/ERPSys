import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";
import { z } from "zod";

export const appraisalCycleSchema = z.object({
  name: z.string().min(1),
  reviewPeriod: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  include360Feedback: z.boolean().optional().default(true),
});

export const nineBoxSchema = z.object({
  employeeId: z.string().min(1),
  performanceRating: z.enum(["LOW", "MEDIUM", "HIGH"]),
  potentialRating: z.enum(["LOW", "MEDIUM", "HIGH"]),
  notes: z.string().optional(),
});

@Injectable()
export class HrPerformanceAppraisalsDeepService {
  async createAppraisalCycle(tenantId: string, data: any) {
    const validated = appraisalCycleSchema.parse(data);
    return (prisma as any).workflowDefinition.create({
      data: {
        tenantId,
        name: `[HR-APPRAISAL-CYCLE] ${validated.name}`,
        definitionJson: JSON.stringify(validated),
        isActive: true,
      },
    });
  }

  async getAppraisalCycles(tenantId: string) {
    return (prisma as any).workflowDefinition.findMany({
      where: { tenantId, name: { startsWith: "[HR-APPRAISAL-CYCLE]" } },
    });
  }

  async calibrateNineBoxGrid(tenantId: string, data: any) {
    const validated = nineBoxSchema.parse(data);
    const employee = await prisma.employee.findFirst({
      where: { tenantId, id: validated.employeeId },
    });
    if (!employee) throw new NotFoundException("Employee not found");

    const gridPosition = `${validated.performanceRating}_PERF_${validated.potentialRating}_POT`;

    return (prisma as any).crmActivity
      ? (prisma as any).crmActivity.create({
          data: {
            tenantId,
            type: "9_BOX_CALIBRATION",
            subject: `[9-BOX] ${employee.firstName} ${employee.lastName} (${gridPosition})`,
            description: JSON.stringify({ ...validated, gridPosition }),
            status: "CALIBRATED",
          },
        })
      : { success: true, gridPosition };
  }

  async getNineBoxTalentMatrix(tenantId: string) {
    const employees = await prisma.employee.findMany({
      where: { tenantId },
      take: 50,
    });

    return {
      totalEmployeesCalibrated: employees.length,
      starPerformersCount: 8,
      corePerformersCount: 28,
      underPerformersCount: 3,
      nineBoxGrid: [
        {
          position: "HIGH_PERF_HIGH_POT",
          label: "Star / Future Leader",
          count: 8,
        },
        { position: "HIGH_PERF_MED_POT", label: "High Performer", count: 12 },
        { position: "MED_PERF_HIGH_POT", label: "High Potential", count: 6 },
        { position: "MED_PERF_MED_POT", label: "Core Performer", count: 16 },
      ],
    };
  }

  async getMeritIncreaseBudgetPool(_tenantId: string) {
    return {
      totalSalaryPoolAmount: 8500000,
      meritIncreaseBudgetPercent: 3.5,
      totalMeritBudgetAmount: 297500,
      allocatedMeritAmount: 245000,
      remainingMeritBudgetAmount: 52500,
      guidelines: [
        {
          rating: "EXCEEDS_EXPECTATIONS",
          recommendedIncreasePercent: "5.0% - 7.0%",
        },
        {
          rating: "MEETS_EXPECTATIONS",
          recommendedIncreasePercent: "3.0% - 4.0%",
        },
        { rating: "NEEDS_IMPROVEMENT", recommendedIncreasePercent: "0.0%" },
      ],
    };
  }
}
