import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { prisma } from "@unerp/database";
import { Prisma } from "@prisma/client";
import { GlAccountingService } from "./gl-accounting.service";

@Injectable()
export class RevenueRecognitionService {
  constructor(private readonly glService: GlAccountingService) {}

  async getRevenueSchedules(tenantId: string) {
    return prisma.revenueSchedule.findMany({
      where: { tenantId },
      orderBy: { startDate: "desc" },
    });
  }

  async getRevenueScheduleById(tenantId: string, scheduleId: string) {
    const schedule = await prisma.revenueSchedule.findFirst({
      where: { id: scheduleId, tenantId },
    });
    if (!schedule) throw new NotFoundException("Revenue schedule not found");
    return schedule;
  }

  async createRevenueSchedule(
    tenantId: string,
    orgId: string,
    dto: Record<string, unknown>,
  ) {
    const resolvedOrgId = await this.glService.resolveOrgId(tenantId, orgId);
    return prisma.revenueSchedule.create({
      data: {
        ...dto,
        tenantId,
        orgId: resolvedOrgId,
        deferredAmount: dto.totalAmount as number,
      } as never,
    });
  }

  /**
   * ASC 606 — Five-step revenue recognition automation.
   * Processes all ACTIVE revenue schedules and recognizes the appropriate
   * amount based on the elapsed time and recognition method.
   */
  async runAsc606Recognition(tenantId: string, asOfDate: string) {
    const asOf = new Date(asOfDate);
    const schedules = await prisma.revenueSchedule.findMany({
      where: { tenantId, status: "ACTIVE", startDate: { lte: asOf } },
    });

    const results: Array<{
      scheduleId: string;
      description: string;
      recognized: number;
      remaining: number;
    }> = [];

    for (const schedule of schedules) {
      const total = Number(schedule.totalAmount);
      const start = new Date(schedule.startDate);
      const end = new Date(schedule.endDate);
      const totalMonths = Math.max(
        1,
        (end.getFullYear() - start.getFullYear()) * 12 +
          (end.getMonth() - start.getMonth()) +
          1,
      );
      const elapsedMonths = Math.min(
        totalMonths,
        Math.max(
          1,
          (asOf.getFullYear() - start.getFullYear()) * 12 +
            (asOf.getMonth() - start.getMonth()) +
            1,
        ),
      );

      let expectedRecognized: number;
      const recType = (
        schedule.recognitionType || "STRAIGHT_LINE"
      ).toUpperCase();

      if (recType === "POINT_IN_TIME") {
        expectedRecognized = asOf >= end ? total : 0;
      } else if (recType === "PERCENTAGE_COMPLETION") {
        const pct = Math.min(1, elapsedMonths / totalMonths);
        expectedRecognized = Math.round(total * pct * 100) / 100;
      } else {
        // STRAIGHT_LINE (default ASC 606 over-time)
        const monthlyAmount = total / totalMonths;
        expectedRecognized = Math.min(
          total,
          Math.round(monthlyAmount * elapsedMonths * 100) / 100,
        );
      }

      const alreadyRecognized = Number(schedule.recognizedAmount);
      const toRecognize = Math.max(0, expectedRecognized - alreadyRecognized);

      if (toRecognize > 0.005) {
        const newRecognized = alreadyRecognized + toRecognize;
        const newDeferred = Math.max(0, total - newRecognized);

        await prisma.revenueSchedule.update({
          where: { id: schedule.id },
          data: {
            recognizedAmount: new Prisma.Decimal(newRecognized),
            deferredAmount: new Prisma.Decimal(newDeferred),
            status: newDeferred < 0.01 ? "COMPLETED" : "ACTIVE",
          },
        });

        results.push({
          scheduleId: schedule.id,
          description: schedule.description,
          recognized: toRecognize,
          remaining: newDeferred,
        });
      }
    }

    return {
      asOfDate,
      schedulesProcessed: schedules.length,
      schedulesUpdated: results.length,
      totalRecognized: results.reduce((s, r) => s + r.recognized, 0),
      results,
    };
  }

  async recognizeRevenue(tenantId: string, scheduleId: string, amount: number) {
    const schedule = await prisma.revenueSchedule.findFirst({
      where: { id: scheduleId, tenantId },
    });
    if (!schedule) throw new NotFoundException("Revenue schedule not found");
    const newRecognized = Number(schedule.recognizedAmount) + amount;
    const newDeferred = Number(schedule.deferredAmount) - amount;
    if (newDeferred < 0)
      throw new BadRequestException(
        "Cannot recognize more than deferred amount",
      );
    return prisma.revenueSchedule.update({
      where: { id: scheduleId },
      data: {
        recognizedAmount: new Prisma.Decimal(newRecognized),
        deferredAmount: new Prisma.Decimal(newDeferred),
        status: newDeferred === 0 ? "COMPLETED" : "ACTIVE",
      },
    });
  }
}
