import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { Prisma } from '@prisma/client';

@Injectable()
export class CashFlowForecastService {
  async getScenarios(tenantId: string) {
    return prisma.forecastScenario.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createScenario(
    tenantId: string,
    orgId: string,
    dto: {
      name: string;
      description?: string;
      inflowFactor?: number;
      outflowFactor?: number;
      status?: string;
    },
  ) {
    return prisma.forecastScenario.create({
      data: {
        tenantId,
        orgId,
        name: dto.name,
        description: dto.description,
        inflowFactor: dto.inflowFactor ? new Prisma.Decimal(dto.inflowFactor) : new Prisma.Decimal(1.0),
        outflowFactor: dto.outflowFactor ? new Prisma.Decimal(dto.outflowFactor) : new Prisma.Decimal(1.0),
        status: dto.status || 'DRAFT',
      },
    });
  }

  async updateScenario(
    tenantId: string,
    id: string,
    dto: {
      name?: string;
      description?: string;
      inflowFactor?: number;
      outflowFactor?: number;
      status?: string;
    },
  ) {
    const scenario = await prisma.forecastScenario.findFirst({
      where: { id, tenantId },
    });
    if (!scenario) throw new NotFoundException('Scenario not found');

    const updateData: Prisma.ForecastScenarioUpdateInput = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.inflowFactor !== undefined) updateData.inflowFactor = new Prisma.Decimal(dto.inflowFactor);
    if (dto.outflowFactor !== undefined) updateData.outflowFactor = new Prisma.Decimal(dto.outflowFactor);
    if (dto.status !== undefined) updateData.status = dto.status;

    return prisma.forecastScenario.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteScenario(tenantId: string, id: string) {
    const scenario = await prisma.forecastScenario.findFirst({
      where: { id, tenantId },
    });
    if (!scenario) throw new NotFoundException('Scenario not found');

    return prisma.forecastScenario.delete({
      where: { id },
    });
  }

  async saveForecastWeekOverride(
    tenantId: string,
    weekStart: Date,
    dto: { adjustments: number; comments?: string },
  ) {
    const startOfDay = new Date(weekStart);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const existing = await prisma.forecastWeek.findUnique({
      where: {
        tenantId_weekStart: {
          tenantId,
          weekStart: startOfDay,
        },
      },
    });

    // Projected inflow/outflow are recalculated dynamically on retrieval (see
    // getForecast/listForecastWeeks), so we persist zero-valued base amounts
    // here; the override's real effect is the `adjustments` field above.
    if (existing) {
      return prisma.forecastWeek.update({
        where: { id: existing.id },
        data: {
          adjustments: new Prisma.Decimal(dto.adjustments),
          comments: dto.comments,
        },
      });
    } else {
      return prisma.forecastWeek.create({
        data: {
          tenantId,
          weekStart: startOfDay,
          projectedInflow: new Prisma.Decimal(0),
          projectedOutflow: new Prisma.Decimal(0),
          adjustments: new Prisma.Decimal(dto.adjustments),
          net: new Prisma.Decimal(dto.adjustments),
          comments: dto.comments,
        },
      });
    }
  }

  async get13WeekForecast(tenantId: string, scenarioId?: string) {
    // 1. Get scenario factors if requested
    let inflowMultiplier = 1.0;
    let outflowMultiplier = 1.0;
    let scenarioName = 'Baseline';

    if (scenarioId) {
      const scenario = await prisma.forecastScenario.findFirst({
        where: { id: scenarioId, tenantId },
      });
      if (scenario) {
        inflowMultiplier = Number(scenario.inflowFactor || 1.0);
        outflowMultiplier = Number(scenario.outflowFactor || 1.0);
        scenarioName = scenario.name;
      }
    }

    // 2. Determine cash starting position
    // Estimate starting bank account balances (or fallback to seed)
    const bankAccounts = await prisma.bankAccount.findMany({ where: { tenantId } });
    // Let's assume an initial cash pool balance of $150,000 if no bank accounts are defined
    let startCash = 150000;
    // If bank accounts are defined, simulate balances (matching bank-recon logic)
    if (bankAccounts.length > 0) {
      startCash = bankAccounts.length * 45000;
    }

    // 3. Generate 13 weeks starting from current Monday
    const weeksList = [];
    const now = new Date();
    const day = now.getUTCDay();
    const diff = now.getUTCDate() - day + (day === 0 ? -6 : 1); // adjust to Monday
    const currentMonday = new Date(now.setUTCDate(diff));
    currentMonday.setUTCHours(0, 0, 0, 0);

    // Fetch all unpaid invoices & payment schedules within 13 week horizon for aggregation
    const endOf13Weeks = new Date(currentMonday.getTime() + 13 * 7 * 24 * 60 * 60 * 1000);

    const [unpaidInvoices, pendingSchedules, weeklyOverrides] = await Promise.all([
      prisma.invoice.findMany({
        where: {
          tenantId,
          status: { not: 'PAID' },
          dueDate: { gte: currentMonday, lte: endOf13Weeks },
        },
      }),
      prisma.paymentSchedule.findMany({
        where: {
          tenantId,
          status: { not: 'PAID' },
          dueDate: { gte: currentMonday, lte: endOf13Weeks },
        },
      }),
      prisma.forecastWeek.findMany({
        where: {
          tenantId,
          weekStart: { gte: currentMonday, lte: endOf13Weeks },
        },
      }),
    ]);

    let runningCash = startCash;

    for (let i = 0; i < 13; i++) {
      const wStart = new Date(currentMonday.getTime() + i * 7 * 24 * 60 * 60 * 1000);
      const wEnd = new Date(wStart.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);

      // Aggregate baseline inflows (Invoices due this week)
      const weekInvoices = unpaidInvoices.filter(
        inv => inv.dueDate && inv.dueDate >= wStart && inv.dueDate <= wEnd,
      );
      const baselineInflow = weekInvoices.reduce((sum, inv) => sum + Number(inv.totalAmount || 0), 0);

      // Aggregate baseline outflows (Payment schedules due this week)
      const weekSchedules = pendingSchedules.filter(
        sched => sched.dueDate && sched.dueDate >= wStart && sched.dueDate <= wEnd,
      );
      const baselineOutflow = weekSchedules.reduce((sum, s) => sum + Number(s.amount || 0), 0);

      // Fetch overrides
      const override = weeklyOverrides.find(
        o => o.weekStart.getTime() === wStart.getTime(),
      );
      const adjustments = override ? Number(override.adjustments) : 0;
      const comments = override ? override.comments : null;

      // Apply Scenario multipliers
      const projectedInflow = baselineInflow * inflowMultiplier;
      const projectedOutflow = baselineOutflow * outflowMultiplier;
      const net = projectedInflow - projectedOutflow + adjustments;
      runningCash += net;

      weeksList.push({
        weekStart: wStart.toISOString(),
        weekEnd: wEnd.toISOString(),
        projectedInflow,
        projectedOutflow,
        adjustments,
        net,
        cumulativeBalance: runningCash,
        comments,
      });
    }

    return {
      scenarioId: scenarioId || 'baseline',
      scenarioName,
      startingCash: startCash,
      forecast: weeksList,
    };
  }

  async compareForecastScenarios(tenantId: string, scenarioId: string) {
    const [baseline, scenario] = await Promise.all([
      this.get13WeekForecast(tenantId),
      this.get13WeekForecast(tenantId, scenarioId),
    ]);

    return {
      baseline: baseline.forecast,
      scenario: scenario.forecast,
      scenarioName: scenario.scenarioName,
    };
  }

  async exportForecastCsv(tenantId: string) {
    const data = await this.get13WeekForecast(tenantId);
    let csv = 'Week Start,Projected Inflow,Projected Outflow,Manual Adjustments,Net Flow,Cumulative Cash Balance,Comments\n';
    for (const w of data.forecast) {
      const dateStr = new Date(w.weekStart).toLocaleDateString();
      csv += `"${dateStr}",${w.projectedInflow.toFixed(2)},${w.projectedOutflow.toFixed(2)},${w.adjustments.toFixed(2)},${w.net.toFixed(2)},${w.cumulativeBalance.toFixed(2)},"${w.comments || ''}"\n`;
    }
    return csv;
  }
}
