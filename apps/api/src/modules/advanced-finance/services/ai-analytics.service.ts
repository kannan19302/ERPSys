// @ts-nocheck
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { prisma } from "@unerp/database";
import { Prisma } from "@prisma/client";

@Injectable()
export class AiAnalyticsService {
  // ── Forecast Scenarios ───────────────────────────────────────────────────

  async listForecastScenarios(
    tenantId: string,
    scenarioType?: string,
    status?: string,
  ) {
    return prisma.aiForecastScenario.findMany({
      where: {
        tenantId,
        ...(scenarioType ? { scenarioType } : {}),
        ...(status ? { status } : {}),
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getForecastScenario(tenantId: string, id: string) {
    const scenario = await prisma.aiForecastScenario.findFirst({
      where: { id, tenantId },
    });
    if (!scenario) throw new NotFoundException("Forecast scenario not found");
    return scenario;
  }

  async createForecastScenario(
    tenantId: string,
    dto: {
      scenarioName: string;
      scenarioType: string;
      forecastHorizon: string;
      baseCurrency?: string;
      assumptions?: object;
      confidenceLevel?: number;
      createdBy?: string;
    },
  ) {
    return prisma.aiForecastScenario.create({
      data: {
        tenantId,
        scenarioName: dto.scenarioName,
        scenarioType: dto.scenarioType,
        forecastHorizon: dto.forecastHorizon,
        baseCurrency: dto.baseCurrency || "USD",
        assumptions: (dto.assumptions as never) || null,
        confidenceLevel:
          dto.confidenceLevel !== undefined
            ? new Prisma.Decimal(dto.confidenceLevel)
            : null,
        status: "DRAFT",
        createdBy: dto.createdBy || null,
      },
    });
  }

  async updateForecastScenario(
    tenantId: string,
    id: string,
    dto: Partial<{
      scenarioName: string;
      scenarioType: string;
      forecastHorizon: string;
      baseCurrency: string;
      assumptions: object;
      confidenceLevel: number;
      status: string;
    }>,
  ) {
    await this.getForecastScenario(tenantId, id);
    const data: Record<string, unknown> = {};
    if (dto.scenarioName !== undefined) data.scenarioName = dto.scenarioName;
    if (dto.scenarioType !== undefined) data.scenarioType = dto.scenarioType;
    if (dto.forecastHorizon !== undefined)
      data.forecastHorizon = dto.forecastHorizon;
    if (dto.baseCurrency !== undefined) data.baseCurrency = dto.baseCurrency;
    if (dto.assumptions !== undefined)
      data.assumptions = dto.assumptions as never;
    if (dto.confidenceLevel !== undefined)
      data.confidenceLevel = new Prisma.Decimal(dto.confidenceLevel);
    if (dto.status !== undefined) {
      data.status = dto.status;
      if (dto.status === "ACTIVE" || dto.status === "GENERATED")
        data.generatedAt = new Date();
    }
    return prisma.aiForecastScenario.update({ where: { id }, data });
  }

  async activateForecastScenario(tenantId: string, id: string) {
    const scenario = await this.getForecastScenario(tenantId, id);
    if (scenario.status === "ACTIVE")
      throw new BadRequestException("Scenario is already active");

    await prisma.aiForecastScenario.updateMany({
      where: { tenantId, status: "ACTIVE" },
      data: { status: "ARCHIVED" },
    });

    return prisma.aiForecastScenario.update({
      where: { id },
      data: { status: "ACTIVE", generatedAt: new Date() },
    });
  }

  async generateForecastLines(tenantId: string, scenarioId: string) {
    const scenario = await this.getForecastScenario(tenantId, scenarioId);

    const [invoices, purchaseOrders, journals] = await Promise.all([
      prisma.invoice.groupBy({
        by: ["issueDate"],
        where: { tenantId, status: { notIn: ["DRAFT", "VOID"] } },
        _sum: { totalAmount: true },
      }),
      prisma.purchaseOrder.groupBy({
        by: ["orderDate"],
        where: { tenantId, status: { notIn: ["DRAFT", "CANCELLED"] } },
        _sum: { totalAmount: true },
      }),
      prisma.journalEntry.groupBy({
        by: ["journalId"],
        where: { tenantId, journal: { tenantId, status: "POSTED" } },
        _sum: { debit: true, credit: true },
      }),
    ]);

    const revenueTotal = invoices.reduce(
      (s, inv) => s + Number(inv._sum.totalAmount || 0),
      0,
    );
    const expenseTotal = purchaseOrders.reduce(
      (s, po) => s + Number(po._sum.totalAmount || 0),
      0,
    );
    const glTotal = journals.reduce((s, j) => s + Number(j._sum.debit || 0), 0);

    const avgMonthlyRevenue = revenueTotal / 12 || 0;
    const avgMonthlyExpense = expenseTotal / 12 || 0;
    const avgMonthlyGl = glTotal / 12 || 0;

    const horizonMonths =
      scenario.forecastHorizon === "MONTHLY"
        ? 3
        : scenario.forecastHorizon === "QUARTERLY"
          ? 6
          : scenario.forecastHorizon === "YEARLY"
            ? 12
            : 3;

    const lines: {
      periodDate: Date;
      category: string;
      subCategory?: string;
      projectedAmount: number;
      driverVariable?: string;
      driverValue?: number;
    }[] = [];

    const categories = [
      { name: "REVENUE", avg: avgMonthlyRevenue, driver: "invoices" },
      { name: "EXPENSE", avg: avgMonthlyExpense, driver: "purchase_orders" },
      { name: "GL_ACTIVITY", avg: avgMonthlyGl, driver: "journal_entries" },
    ];

    for (let m = 0; m < horizonMonths; m++) {
      const periodDate = new Date();
      periodDate.setMonth(periodDate.getMonth() + m + 1);
      for (const cat of categories) {
        const projected = cat.avg * (1 + m * 0.01);
        lines.push({
          periodDate,
          category: cat.name,
          projectedAmount: Number(projected.toFixed(2)),
          driverVariable: cat.driver,
          driverValue: cat.avg,
        });
      }
    }

    await prisma.aiForecastScenarioLine.deleteMany({
      where: { tenantId, scenarioId },
    });

    await prisma.aiForecastScenarioLine.createMany({
      data: lines.map((l) => ({
        tenantId,
        scenarioId,
        periodDate: l.periodDate,
        category: l.category,
        subCategory: l.subCategory || null,
        projectedAmount: new Prisma.Decimal(l.projectedAmount),
        driverVariable: l.driverVariable || null,
        driverValue:
          l.driverValue !== undefined
            ? new Prisma.Decimal(l.driverValue)
            : null,
      })),
    });

    return prisma.aiForecastScenario.update({
      where: { id: scenarioId },
      data: { status: "GENERATED", generatedAt: new Date() },
    });
  }

  async deleteForecastScenario(tenantId: string, id: string) {
    await this.getForecastScenario(tenantId, id);
    return prisma.aiForecastScenario.delete({ where: { id } });
  }

  // ── Forecast Lines ───────────────────────────────────────────────────────

  async listForecastLines(tenantId: string, scenarioId: string) {
    return prisma.aiForecastScenarioLine.findMany({
      where: { tenantId, scenarioId },
      orderBy: [{ periodDate: "asc" }, { category: "asc" }],
    });
  }

  async getForecastLine(tenantId: string, id: string) {
    const line = await prisma.aiForecastScenarioLine.findFirst({
      where: { id, tenantId },
    });
    if (!line) throw new NotFoundException("Forecast line not found");
    return line;
  }

  async createForecastLine(
    tenantId: string,
    scenarioId: string,
    dto: {
      periodDate: string;
      category: string;
      subCategory?: string;
      projectedAmount: number;
      driverVariable?: string;
      driverValue?: number;
    },
  ) {
    await this.getForecastScenario(tenantId, scenarioId);
    return prisma.aiForecastScenarioLine.create({
      data: {
        tenantId,
        scenarioId,
        periodDate: new Date(dto.periodDate),
        category: dto.category,
        subCategory: dto.subCategory || null,
        projectedAmount: new Prisma.Decimal(dto.projectedAmount),
        driverVariable: dto.driverVariable || null,
        driverValue:
          dto.driverValue !== undefined
            ? new Prisma.Decimal(dto.driverValue)
            : null,
      },
    });
  }

  async updateForecastLine(
    tenantId: string,
    id: string,
    dto: Partial<{
      periodDate: string;
      category: string;
      subCategory: string;
      projectedAmount: number;
      actualAmount: number;
      driverVariable: string;
      driverValue: number;
    }>,
  ) {
    await this.getForecastLine(tenantId, id);
    const data: Record<string, unknown> = {};
    if (dto.periodDate !== undefined)
      data.periodDate = new Date(dto.periodDate);
    if (dto.category !== undefined) data.category = dto.category;
    if (dto.subCategory !== undefined) data.subCategory = dto.subCategory;
    if (dto.projectedAmount !== undefined)
      data.projectedAmount = new Prisma.Decimal(dto.projectedAmount);
    if (dto.actualAmount !== undefined) {
      data.actualAmount = new Prisma.Decimal(dto.actualAmount);
      const line = await prisma.aiForecastScenarioLine.findFirst({
        where: { id, tenantId },
      });
      if (line) {
        const actual = new Prisma.Decimal(dto.actualAmount);
        const projected =
          dto.projectedAmount !== undefined
            ? new Prisma.Decimal(dto.projectedAmount)
            : line.projectedAmount;
        data.varianceAmount = actual.sub(projected);
        data.variancePercent = projected.isZero()
          ? new Prisma.Decimal(0)
          : new Prisma.Decimal(
              Number(actual.sub(projected).div(projected).mul(100)).toFixed(2),
            );
      }
    }
    if (dto.driverVariable !== undefined)
      data.driverVariable = dto.driverVariable;
    if (dto.driverValue !== undefined)
      data.driverValue = new Prisma.Decimal(dto.driverValue);
    return prisma.aiForecastScenarioLine.update({ where: { id }, data });
  }

  async computeForecastLineVariance(tenantId: string, id: string) {
    const line = await this.getForecastLine(tenantId, id);
    if (!line.actualAmount)
      throw new BadRequestException(
        "No actual amount set for this forecast line",
      );

    const varianceAmount = line.actualAmount.sub(line.projectedAmount);
    const variancePercent = line.projectedAmount.isZero()
      ? new Prisma.Decimal(0)
      : new Prisma.Decimal(
          Number(varianceAmount.div(line.projectedAmount).mul(100)).toFixed(2),
        );

    return prisma.aiForecastScenarioLine.update({
      where: { id },
      data: { varianceAmount, variancePercent },
    });
  }

  async updateForecastLineWithActuals(tenantId: string, scenarioId: string) {
    await this.getForecastScenario(tenantId, scenarioId);
    const lines = await prisma.aiForecastScenarioLine.findMany({
      where: { tenantId, scenarioId, actualAmount: null },
    });

    let updatedCount = 0;
    for (const line of lines) {
      const startOfMonth = new Date(
        line.periodDate.getFullYear(),
        line.periodDate.getMonth(),
        1,
      );
      const endOfMonth = new Date(
        line.periodDate.getFullYear(),
        line.periodDate.getMonth() + 1,
        0,
      );

      let actualAmount: number | null = null;
      if (line.category === "REVENUE") {
        const agg = await prisma.invoice.aggregate({
          where: {
            tenantId,
            issueDate: { gte: startOfMonth, lte: endOfMonth },
            status: { notIn: ["DRAFT", "VOID"] },
          },
          _sum: { totalAmount: true },
        });
        actualAmount = Number(agg._sum.totalAmount || 0);
      } else if (line.category === "EXPENSE") {
        const agg = await prisma.purchaseOrder.aggregate({
          where: {
            tenantId,
            orderDate: { gte: startOfMonth, lte: endOfMonth },
            status: { notIn: ["DRAFT", "CANCELLED"] },
          },
          _sum: { totalAmount: true },
        });
        actualAmount = Number(agg._sum.totalAmount || 0);
      }

      if (actualAmount !== null) {
        const actual = new Prisma.Decimal(actualAmount);
        const varianceAmount = actual.sub(line.projectedAmount);
        const variancePercent = line.projectedAmount.isZero()
          ? new Prisma.Decimal(0)
          : new Prisma.Decimal(
              Number(varianceAmount.div(line.projectedAmount).mul(100)).toFixed(
                2,
              ),
            );

        await prisma.aiForecastScenarioLine.update({
          where: { id: line.id },
          data: {
            actualAmount: actual,
            varianceAmount,
            variancePercent,
          },
        });
        updatedCount++;
      }
    }

    return { scenarioId, linesUpdated: updatedCount };
  }

  async deleteForecastLine(tenantId: string, id: string) {
    await this.getForecastLine(tenantId, id);
    return prisma.aiForecastScenarioLine.delete({ where: { id } });
  }

  // ── Anomaly Detection Runs ───────────────────────────────────────────────

  async listAnomalyDetectionRuns(tenantId: string, status?: string) {
    return prisma.anomalyDetectionRun.findMany({
      where: {
        tenantId,
        ...(status ? { status } : {}),
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getAnomalyDetectionRun(tenantId: string, id: string) {
    const run = await prisma.anomalyDetectionRun.findFirst({
      where: { id, tenantId },
    });
    if (!run) throw new NotFoundException("Anomaly detection run not found");
    return run;
  }

  async createAnomalyDetectionRun(
    tenantId: string,
    dto: {
      runName: string;
      detectionScope: string;
      algorithmType: string;
      dateRangeStart: string;
      dateRangeEnd: string;
      sensitivity?: number;
    },
  ) {
    return prisma.anomalyDetectionRun.create({
      data: {
        tenantId,
        runName: dto.runName,
        detectionScope: dto.detectionScope,
        algorithmType: dto.algorithmType,
        dateRangeStart: new Date(dto.dateRangeStart),
        dateRangeEnd: new Date(dto.dateRangeEnd),
        sensitivity:
          dto.sensitivity !== undefined
            ? new Prisma.Decimal(dto.sensitivity)
            : new Prisma.Decimal(2.0),
        status: "PENDING",
      },
    });
  }

  async executeAnomalyScan(tenantId: string, runId: string) {
    const run = await this.getAnomalyDetectionRun(tenantId, runId);
    if (run.status !== "PENDING")
      throw new BadRequestException("Run is not in PENDING status");

    await prisma.anomalyDetectionRun.update({
      where: { id: runId },
      data: { status: "RUNNING", startedAt: new Date() },
    });

    const invoices = await prisma.invoice.findMany({
      where: {
        tenantId,
        issueDate: { gte: run.dateRangeStart, lte: run.dateRangeEnd },
        status: { notIn: ["DRAFT", "VOID"] },
      },
    });

    const totalScanned = invoices.length;
    const anomalies: {
      entityType: string;
      entityId: string;
      anomalyType: string;
      anomalyScore: number;
      description: string;
      severity: string;
      suggestedAction?: string;
    }[] = [];

    const amounts = invoices.map((inv) => Number(inv.totalAmount));
    const mean = amounts.reduce((s, v) => s + v, 0) / (amounts.length || 1);
    const stdDev = Math.sqrt(
      amounts.reduce((s, v) => s + Math.pow(v - mean, 2), 0) /
        (amounts.length || 1),
    );
    const sensitivity = Number(run.sensitivity);

    for (const inv of invoices) {
      const amount = Number(inv.totalAmount);
      const zScore = stdDev > 0 ? Math.abs((amount - mean) / stdDev) : 0;

      if (zScore > sensitivity) {
        anomalies.push({
          entityType: "INVOICE",
          entityId: inv.id,
          anomalyType: "AMOUNT_OUTLIER",
          anomalyScore: Number(zScore.toFixed(2)),
          description: `Invoice #${inv.invoiceNumber} amount $${amount.toFixed(2)} is ${zScore.toFixed(1)}σ from mean $${mean.toFixed(2)}`,
          severity: zScore > sensitivity * 2 ? "HIGH" : "MEDIUM",
          suggestedAction: "Review invoice amount for potential error or fraud",
        });
      }

      if (inv.status === "OVERDUE" && !inv.dueDate) {
        anomalies.push({
          entityType: "INVOICE",
          entityId: inv.id,
          anomalyType: "MISSING_DUE_DATE",
          anomalyScore: 5.0,
          description: `Invoice #${inv.invoiceNumber} is overdue but has no due date`,
          severity: "HIGH",
          suggestedAction: "Set due date and review payment terms",
        });
      }
    }

    const created: any[] = [];
    for (const a of anomalies) {
      const result = await prisma.anomalyDetectionResult.create({
        data: {
          tenantId,
          runId,
          entityType: a.entityType,
          entityId: a.entityId,
          anomalyType: a.anomalyType,
          anomalyScore: new Prisma.Decimal(a.anomalyScore),
          description: a.description,
          severity: a.severity,
          suggestedAction: a.suggestedAction || null,
          status: "OPEN",
        },
      });
      created.push(result);
    }

    return prisma.anomalyDetectionRun.update({
      where: { id: runId },
      data: {
        totalScanned,
        anomaliesFound: created.length,
        status: "COMPLETED",
        completedAt: new Date(),
      },
    });
  }

  async deleteAnomalyDetectionRun(tenantId: string, id: string) {
    await this.getAnomalyDetectionRun(tenantId, id);
    return prisma.anomalyDetectionRun.delete({ where: { id } });
  }

  // ── Anomaly Results ──────────────────────────────────────────────────────

  async listAnomalyResults(tenantId: string, runId: string) {
    return prisma.anomalyDetectionResult.findMany({
      where: { tenantId, runId },
      orderBy: [{ severity: "desc" }, { anomalyScore: "desc" }],
    });
  }

  async getAnomalyResult(tenantId: string, id: string) {
    const result = await prisma.anomalyDetectionResult.findFirst({
      where: { id, tenantId },
    });
    if (!result) throw new NotFoundException("Anomaly result not found");
    return result;
  }

  async reviewAnomalyResult(tenantId: string, id: string, reviewedBy: string) {
    const result = await this.getAnomalyResult(tenantId, id);
    if (result.status !== "OPEN")
      throw new BadRequestException("Anomaly is not in OPEN status");
    return prisma.anomalyDetectionResult.update({
      where: { id },
      data: { status: "REVIEWED", reviewedBy, reviewedAt: new Date() },
    });
  }

  async dismissAnomalyResult(tenantId: string, id: string, reviewedBy: string) {
    await this.getAnomalyResult(tenantId, id);
    return prisma.anomalyDetectionResult.update({
      where: { id },
      data: { status: "DISMISSED", reviewedBy, reviewedAt: new Date() },
    });
  }

  async resolveAnomalyResult(tenantId: string, id: string, reviewedBy: string) {
    await this.getAnomalyResult(tenantId, id);
    return prisma.anomalyDetectionResult.update({
      where: { id },
      data: { status: "RESOLVED", reviewedBy, reviewedAt: new Date() },
    });
  }

  // ── GL Coding Suggestions ────────────────────────────────────────────────

  async createGlCodingSuggestion(
    tenantId: string,
    dto: {
      sourceType: string;
      sourceId?: string;
      description: string;
      suggestedAccountId: string;
      suggestedCostCenter?: string;
      confidenceScore: number;
      reasoning?: string;
    },
  ) {
    return prisma.smartGlCodingSuggestion.create({
      data: {
        tenantId,
        sourceType: dto.sourceType,
        sourceId: dto.sourceId || null,
        description: dto.description,
        suggestedAccountId: dto.suggestedAccountId,
        suggestedCostCenter: dto.suggestedCostCenter || null,
        confidenceScore: new Prisma.Decimal(dto.confidenceScore),
        reasoning: dto.reasoning || null,
      },
    });
  }

  async listGlCodingSuggestions(tenantId: string, sourceType?: string) {
    return prisma.smartGlCodingSuggestion.findMany({
      where: {
        tenantId,
        ...(sourceType ? { sourceType } : {}),
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getGlCodingSuggestion(tenantId: string, id: string) {
    const suggestion = await prisma.smartGlCodingSuggestion.findFirst({
      where: { id, tenantId },
    });
    if (!suggestion)
      throw new NotFoundException("GL coding suggestion not found");
    return suggestion;
  }

  async acceptGlCodingSuggestion(
    tenantId: string,
    id: string,
    acceptedBy: string,
  ) {
    const suggestion = await this.getGlCodingSuggestion(tenantId, id);
    if (suggestion.wasAccepted !== null)
      throw new BadRequestException("Suggestion has already been processed");
    return prisma.smartGlCodingSuggestion.update({
      where: { id },
      data: { wasAccepted: true, acceptedBy, acceptedAt: new Date() },
    });
  }

  async rejectGlCodingSuggestion(tenantId: string, id: string) {
    const suggestion = await this.getGlCodingSuggestion(tenantId, id);
    if (suggestion.wasAccepted !== null)
      throw new BadRequestException("Suggestion has already been processed");
    return prisma.smartGlCodingSuggestion.update({
      where: { id },
      data: { wasAccepted: false, acceptedAt: new Date() },
    });
  }

  // ── NLP Query Logs ──────────────────────────────────────────────────────

  async logNlpQuery(
    tenantId: string,
    dto: {
      queryText: string;
      parsedIntent?: string;
      generatedSql?: string;
      resultSummary?: string;
      executionTimeMs?: number;
      wasSuccessful?: boolean;
      errorMessage?: string;
      userId?: string;
    },
  ) {
    return prisma.financialNlpQueryLog.create({
      data: {
        tenantId,
        queryText: dto.queryText,
        parsedIntent: dto.parsedIntent || null,
        generatedSql: dto.generatedSql || null,
        resultSummary: dto.resultSummary || null,
        executionTimeMs: dto.executionTimeMs || null,
        wasSuccessful: dto.wasSuccessful ?? true,
        errorMessage: dto.errorMessage || null,
        userId: dto.userId || null,
      },
    });
  }

  async listNlpQueryLogs(tenantId: string, parsedIntent?: string) {
    return prisma.financialNlpQueryLog.findMany({
      where: {
        tenantId,
        ...(parsedIntent ? { parsedIntent } : {}),
      },
      orderBy: { queriedAt: "desc" },
      take: 100,
    });
  }

  async getNlpQueryAnalytics(tenantId: string) {
    const logs = await prisma.financialNlpQueryLog.findMany({
      where: { tenantId },
    });

    const totalQueries = logs.length;
    const successfulQueries = logs.filter((l) => l.wasSuccessful).length;
    const failedQueries = logs.filter((l) => !l.wasSuccessful).length;
    const avgExecutionTime =
      totalQueries > 0
        ? logs.reduce((s, l) => s + (l.executionTimeMs || 0), 0) / totalQueries
        : 0;

    const byIntent = logs.reduce<Record<string, number>>((acc, l) => {
      const intent = l.parsedIntent || "UNKNOWN";
      acc[intent] = (acc[intent] || 0) + 1;
      return acc;
    }, {});

    return {
      totalQueries,
      successfulQueries,
      failedQueries,
      successRate:
        totalQueries > 0
          ? Number(((successfulQueries / totalQueries) * 100).toFixed(1))
          : 0,
      avgExecutionTimeMs: Number(avgExecutionTime.toFixed(0)),
      byIntent: Object.entries(byIntent).map(([intent, count]) => ({
        intent,
        count,
      })),
    };
  }

  // ── Dashboard ────────────────────────────────────────────────────────────

  async getAiAnalyticsDashboard(tenantId: string) {
    const [scenarios, lines, runs, results, suggestions, logs] =
      await Promise.all([
        prisma.aiForecastScenario.findMany({ where: { tenantId } }),
        prisma.aiForecastScenarioLine.findMany({ where: { tenantId } }),
        prisma.anomalyDetectionRun.findMany({ where: { tenantId } }),
        prisma.anomalyDetectionResult.findMany({ where: { tenantId } }),
        prisma.smartGlCodingSuggestion.findMany({ where: { tenantId } }),
        prisma.financialNlpQueryLog.findMany({ where: { tenantId } }),
      ]);

    const activeScenarios = scenarios.filter(
      (s) => s.status === "ACTIVE",
    ).length;
    const totalProjectedAmount = lines.reduce(
      (s, l) => s + Number(l.projectedAmount),
      0,
    );
    const totalActualAmount = lines.reduce(
      (s, l) => s + Number(l.actualAmount || 0),
      0,
    );

    const anomalyBySeverity = results.reduce<Record<string, number>>(
      (acc, r) => {
        acc[r.severity] = (acc[r.severity] || 0) + 1;
        return acc;
      },
      {},
    );

    const anomalyByStatus = results.reduce<Record<string, number>>((acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    }, {});

    const acceptedSuggestions = suggestions.filter(
      (s) => s.wasAccepted === true,
    ).length;

    return {
      totalForecastScenarios: scenarios.length,
      activeForecastScenarios: activeScenarios,
      totalForecastLines: lines.length,
      totalProjectedAmount,
      totalActualAmount,
      forecastAccuracy:
        totalProjectedAmount > 0
          ? Number(
              (
                (1 -
                  Math.abs(totalProjectedAmount - totalActualAmount) /
                    totalProjectedAmount) *
                100
              ).toFixed(1),
            )
          : 0,
      anomalyDetectionRuns: runs.length,
      completedAnomalyRuns: runs.filter((r) => r.status === "COMPLETED").length,
      totalAnomalies: results.length,
      anomalyBySeverity,
      anomalyByStatus,
      glCodingSuggestions: suggestions.length,
      acceptedSuggestions,
      acceptanceRate:
        suggestions.length > 0
          ? Number(
              ((acceptedSuggestions / suggestions.length) * 100).toFixed(1),
            )
          : 0,
      nlpQueryLogs: logs.length,
      nlpSuccessRate:
        logs.length > 0
          ? Number(
              (
                (logs.filter((l) => l.wasSuccessful).length / logs.length) *
                100
              ).toFixed(1),
            )
          : 0,
    };
  }
}
