import { Injectable, ForbiddenException } from "@nestjs/common";
import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";
import { Prisma } from "@prisma/client";

@Injectable()
export class AnalyticsEnterpriseService {
  async getMultiSourceReport(
    tenantId: string,
    entities: string[],
    dimensions: string[],
    measures: string[],
  ) {
    const results: Record<string, any> = {};
    for (const entity of entities) {
      switch (entity) {
        case "projects":
          results.projects = await this.queryProjectMetrics(
            tenantId,
            dimensions,
            measures,
          );
          break;
        case "finance":
          results.finance = await this.queryFinanceMetrics(
            tenantId,
            dimensions,
            measures,
          );
          break;
        case "inventory":
          results.inventory = await this.queryInventoryMetrics(
            tenantId,
            dimensions,
            measures,
          );
          break;
        case "hr":
          results.hr = await this.queryHrMetrics(
            tenantId,
            dimensions,
            measures,
          );
          break;
        case "sales":
          results.sales = await this.querySalesMetrics(
            tenantId,
            dimensions,
            measures,
          );
          break;
        case "manufacturing":
          results.manufacturing = await this.queryManufacturingMetrics(
            tenantId,
            dimensions,
            measures,
          );
          break;
        default:
          results[entity] = { error: `Unknown entity: ${entity}` };
      }
    }
    return {
      entities,
      dimensions,
      measures,
      results,
      generatedAt: new Date().toISOString(),
    };
  }

  private async queryProjectMetrics(
    tenantId: string,
    _dimensions: string[],
    _measures: string[],
  ) {
    const projects = await prisma.project.findMany({
      where: { tenantId, deletedAt: null },
    });
    const totalBudget = projects.reduce((s, p) => s + Number(p.budget || 0), 0);
    const totalCost = projects.reduce(
      (s, p) => s + Number(p.estimatedCost || 0),
      0,
    );
    const activePct =
      projects.length > 0
        ? Number(
            (
              (projects.filter((p) => p.status === "ACTIVE").length /
                projects.length) *
              100
            ).toFixed(1),
          )
        : 0;
    return {
      totalProjects: projects.length,
      totalBudget: Number(totalBudget.toFixed(2)),
      totalCost: Number(totalCost.toFixed(2)),
      activePct,
      budgetUtilization:
        totalBudget > 0
          ? Number(((totalCost / totalBudget) * 100).toFixed(1))
          : 0,
    };
  }

  private async queryFinanceMetrics(
    tenantId: string,
    _dimensions: string[],
    _measures: string[],
  ) {
    const invoices = await prisma.invoice.findMany({ where: { tenantId } });
    const totalRevenue = invoices.reduce(
      (s, i) => s + Number(i.totalAmount),
      0,
    );
    const paidInvoices = invoices.filter((i) => i.status === "PAID");
    const totalPaid = paidInvoices.reduce(
      (s, i) => s + Number(i.totalAmount),
      0,
    );
    return {
      totalInvoices: invoices.length,
      totalRevenue: Number(totalRevenue.toFixed(2)),
      totalCollected: Number(totalPaid.toFixed(2)),
      collectionRate:
        totalRevenue > 0
          ? Number(((totalPaid / totalRevenue) * 100).toFixed(1))
          : 0,
    };
  }

  private async queryInventoryMetrics(
    tenantId: string,
    _dimensions: string[],
    _measures: string[],
  ) {
    const products = await prisma.product.findMany({
      where: { tenantId, deletedAt: null },
    });
    const items = await prisma.inventoryItem.findMany({ where: { tenantId } });
    const totalStock = items.reduce((s, i) => s + Number(i.quantity), 0);
    const totalValue = items.reduce(
      (s, i) => s + Number(i.quantity) * Number(i.valuationRate || 0),
      0,
    );
    return {
      totalProducts: products.length,
      totalStockItems: items.length,
      totalStockQty: Number(totalStock.toFixed(2)),
      totalStockValue: Number(totalValue.toFixed(2)),
    };
  }

  private async queryHrMetrics(
    tenantId: string,
    _dimensions: string[],
    _measures: string[],
  ) {
    const employees = await prisma.employee.findMany({
      where: { tenantId, deletedAt: null },
    });
    const active = employees.filter((e) => e.status === "ACTIVE").length;
    return {
      totalEmployees: employees.length,
      activeEmployees: active,
      inactiveCount: employees.length - active,
    };
  }

  private async querySalesMetrics(
    tenantId: string,
    _dimensions: string[],
    _measures: string[],
  ) {
    const orders = await prisma.salesOrder.findMany({ where: { tenantId } });
    const totalValue = orders.reduce(
      (s, o) => s + Number(o.totalAmount || 0),
      0,
    );
    const orderCount = orders.length;
    const avgOrderValue = orderCount > 0 ? totalValue / orderCount : 0;
    return {
      totalOrders: orderCount,
      totalValue: Number(totalValue.toFixed(2)),
      avgOrderValue: Number(avgOrderValue.toFixed(2)),
    };
  }

  private async queryManufacturingMetrics(
    tenantId: string,
    _dimensions: string[],
    _measures: string[],
  ) {
    const workOrders = await prisma.workOrder.findMany({ where: { tenantId } });
    const completedOrders = workOrders.filter(
      (wo) => wo.status === "COMPLETED",
    ).length;
    const totalQty = workOrders.reduce((s, wo) => s + Number(wo.quantity), 0);
    return {
      totalWorkOrders: workOrders.length,
      completedOrders,
      completionRate:
        workOrders.length > 0
          ? Number(((completedOrders / workOrders.length) * 100).toFixed(1))
          : 0,
      totalQuantity: Number(totalQty.toFixed(2)),
    };
  }

  async getDrillDownAnalysis(tenantId: string, reportId: string, path: string) {
    const report = await prisma.report.findFirst({
      where: { id: reportId, tenantId },
    });
    if (!report) return null;
    const segments = path.split("/").filter(Boolean);
    const breadcrumb = segments.map((seg, idx) => ({
      level: idx + 1,
      name: seg,
      path: segments.slice(0, idx + 1).join("/"),
    }));
    let data: any = null;
    if (segments[0] === "projects") {
      data = await this.drillProjects(tenantId, segments.slice(1));
    } else if (segments[0] === "finance") {
      data = await this.drillFinance(tenantId, segments.slice(1));
    } else if (segments[0] === "inventory") {
      data = await this.drillInventory(tenantId, segments.slice(1));
    } else if (segments[0] === "manufacturing") {
      data = await this.drillManufacturing(tenantId, segments.slice(1));
    } else if (segments[0] === "sales") {
      data = await this.drillSales(tenantId, segments.slice(1));
    } else {
      data = { message: `No drill-down available for path: ${path}` };
    }
    return {
      reportId,
      reportName: report.name,
      drillPath: path,
      breadcrumb,
      data,
      drillDownOptions: this.getDrillDownOptions(segments[0] || ""),
    };
  }

  private async drillProjects(tenantId: string, subPath: string[]) {
    if (subPath.length === 0) {
      const projects = await prisma.project.findMany({
        where: { tenantId, deletedAt: null },
        take: 50,
      });
      return {
        level: "ALL_PROJECTS",
        count: projects.length,
        projects: projects.map((p) => ({
          id: p.id,
          name: p.name,
          status: p.status,
          budget: Number(p.budget || 0),
          estimatedCost: Number(p.estimatedCost || 0),
        })),
      };
    }
    if (subPath.length === 1 && subPath[0]) {
      const status = subPath[0];
      const projects = await prisma.project.findMany({
        where: { tenantId, deletedAt: null, status: status.toUpperCase() },
        take: 50,
      });
      return { level: `STATUS:${status}`, count: projects.length, projects };
    }
    return { level: "DETAIL", message: "Deep drill not available" };
  }

  private async drillFinance(tenantId: string, subPath: string[]) {
    if (subPath.length === 0) {
      const invoices = await prisma.invoice.findMany({
        where: { tenantId },
        take: 50,
        orderBy: { createdAt: "desc" },
      });
      return { level: "ALL_INVOICES", count: invoices.length, invoices };
    }
    return { level: "DETAIL", message: "Deep drill not available" };
  }

  private async drillInventory(tenantId: string, subPath: string[]) {
    if (subPath.length === 0) {
      const products = await prisma.product.findMany({
        where: { tenantId, deletedAt: null },
        take: 50,
      });
      return { level: "ALL_PRODUCTS", count: products.length, products };
    }
    return { level: "DETAIL", message: "Deep drill not available" };
  }

  private async drillManufacturing(tenantId: string, subPath: string[]) {
    if (subPath.length === 0) {
      const orders = await prisma.workOrder.findMany({
        where: { tenantId },
        take: 50,
        orderBy: { createdAt: "desc" },
      });
      return {
        level: "ALL_WORK_ORDERS",
        count: orders.length,
        workOrders: orders,
      };
    }
    return { level: "DETAIL", message: "Deep drill not available" };
  }

  private async drillSales(tenantId: string, subPath: string[]) {
    if (subPath.length === 0) {
      const orders = await prisma.salesOrder.findMany({
        where: { tenantId },
        take: 50,
        orderBy: { createdAt: "desc" },
      });
      return { level: "ALL_SALES_ORDERS", count: orders.length, orders };
    }
    return { level: "DETAIL", message: "Deep drill not available" };
  }

  private getDrillDownOptions(entity: string) {
    const options: Record<string, string[]> = {
      projects: [
        "ALL_PROJECTS",
        "STATUS:ACTIVE",
        "STATUS:COMPLETED",
        "STATUS:PLANNED",
      ],
      finance: ["ALL_INVOICES", "STATUS:PAID", "STATUS:PENDING"],
      inventory: ["ALL_PRODUCTS", "BY_CATEGORY"],
      manufacturing: [
        "ALL_WORK_ORDERS",
        "STATUS:IN_PROGRESS",
        "STATUS:COMPLETED",
      ],
      sales: ["ALL_ORDERS", "STATUS:CONFIRMED", "STATUS:DRAFT"],
    };
    return options[entity] || [];
  }

  async getWhatIfAnalysis(
    tenantId: string,
    modelId: string,
    scenarios: { name: string; adjustments: Record<string, number> }[],
  ) {
    const model = await prisma.analyticsPredictiveModel.findFirst({
      where: { id: modelId, tenantId },
    });
    const baseData: {
      revenue: number;
      costs: number;
      headcount: number;
      salesVolume: number;
      avgOrderValue: number;
      customerCount: number;
      [key: string]: number;
    } = {
      revenue: 1000000,
      costs: 750000,
      headcount: 50,
      salesVolume: 10000,
      avgOrderValue: 100,
      customerCount: 500,
    };
    const results = scenarios.map((scenario) => {
      const adjusted = { ...baseData };
      for (const [key, factor] of Object.entries(scenario.adjustments)) {
        if (adjusted[key] !== undefined) {
          adjusted[key] = adjusted[key] * (1 + factor / 100);
        }
      }
      const projectedRevenue = adjusted.revenue;
      const projectedCosts = adjusted.costs;
      const projectedProfit = projectedRevenue - projectedCosts;
      const profitMargin =
        projectedRevenue > 0
          ? Number(((projectedProfit / projectedRevenue) * 100).toFixed(1))
          : 0;
      return {
        scenarioName: scenario.name,
        adjustments: scenario.adjustments,
        projectedMetrics: {
          revenue: Number(projectedRevenue.toFixed(2)),
          costs: Number(projectedCosts.toFixed(2)),
          profit: Number(projectedProfit.toFixed(2)),
          profitMargin,
        },
        variance: {
          revenueDelta: Number(
            (
              ((projectedRevenue - baseData.revenue) / baseData.revenue) *
              100
            ).toFixed(1),
          ),
          costDelta: Number(
            (
              ((projectedCosts - baseData.costs) / baseData.costs) *
              100
            ).toFixed(1),
          ),
        },
      };
    });
    const baseline = {
      name: "BASELINE",
      revenue: baseData.revenue,
      costs: baseData.costs,
      profit: baseData.revenue - baseData.costs,
      profitMargin:
        baseData.revenue > 0
          ? Number(
              (
                ((baseData.revenue - baseData.costs) / baseData.revenue) *
                100
              ).toFixed(1),
            )
          : 0,
    };
    return {
      modelId,
      modelName: model?.modelName || "Default Scenario Model",
      targetMetric: model?.targetMetric || "profit",
      baseline,
      scenarios: results,
      recommendation: results.reduce((best, curr) =>
        curr.projectedMetrics.profit > best.projectedMetrics.profit
          ? curr
          : best,
      ),
    };
  }

  async getForecastModel(
    tenantId: string,
    metric: string,
    horizon: string,
    method: string = "linear",
  ) {
    const now = new Date();
    const periods =
      horizon === "WEEKLY"
        ? 12
        : horizon === "MONTHLY"
          ? 12
          : horizon === "QUARTERLY"
            ? 4
            : 12;
    const historicalData = await this.getHistoricalMetricData(
      tenantId,
      metric,
      periods,
    );
    const values = historicalData.map((d) => d.value);
    const n = values.length;
    const mean = values.reduce((s, v) => s + v, 0) / Math.max(1, n);
    const variance =
      n > 1 ? values.reduce((s, v) => s + (v - mean) ** 2, 0) / (n - 1) : 0;
    const stdDev = Math.sqrt(variance);
    let forecastedValues: number[];
    if (method === "linear") {
      const xMean = (n - 1) / 2;
      const yMean = mean;
      let num = 0;
      let den = 0;
      for (let i = 0; i < n; i++) {
        num += (i - xMean) * ((values[i] ?? 0) - yMean);
        den += (i - xMean) ** 2;
      }
      const slope = den > 0 ? num / den : 0;
      const intercept = yMean - slope * xMean;
      forecastedValues = Array.from({ length: periods }, (_, i) =>
        Number((intercept + slope * (n + i)).toFixed(2)),
      );
    } else {
      forecastedValues = Array.from({ length: periods }, () =>
        Number((mean + (Math.random() - 0.5) * stdDev).toFixed(2)),
      );
    }
    const confidenceInterval = 1.96 * (stdDev / Math.sqrt(n || 1));
    const lowerBound = forecastedValues.map((v) =>
      Number((v - confidenceInterval).toFixed(2)),
    );
    const upperBound = forecastedValues.map((v) =>
      Number((v + confidenceInterval).toFixed(2)),
    );
    return {
      metric,
      method,
      horizon,
      periods,
      confidence: 95,
      historicalData,
      forecast: forecastedValues.map((value, i) => ({
        period: i + 1,
        forecastedValue: value,
        lowerBound: lowerBound[i],
        upperBound: upperBound[i],
      })),
      summary: {
        historicalMean: Number(mean.toFixed(2)),
        historicalStdDev: Number(stdDev.toFixed(2)),
        forecastMean: Number(
          (forecastedValues.reduce((s, v) => s + v, 0) / periods).toFixed(2),
        ),
        trend:
          (forecastedValues[forecastedValues.length - 1] ?? 0) >
          (forecastedValues[0] ?? 0)
            ? "UP"
            : "DOWN",
      },
    };
  }

  private async getHistoricalMetricData(
    tenantId: string,
    metric: string,
    periods: number,
  ): Promise<{ period: string; value: number }[]> {
    const kpiDef = await prisma.analyticsKpiDefinition.findFirst({
      where: { tenantId, code: metric },
    });
    if (kpiDef) {
      const trends = await prisma.analyticsTrendResult.findMany({
        where: { kpiDefinitionId: kpiDef.id },
        orderBy: { periodStart: "desc" },
        take: periods,
      });
      return trends.reverse().map((t) => ({
        period: `${t.periodStart.toISOString().split("T")[0]}`,
        value: t.value,
      }));
    }
    const dummyData: Record<string, number[]> = {
      revenue: [
        850000, 920000, 880000, 950000, 1020000, 980000, 1050000, 1100000,
        1080000, 1150000, 1120000, 1200000,
      ],
      costs: [
        600000, 650000, 620000, 670000, 710000, 690000, 730000, 760000, 740000,
        790000, 770000, 820000,
      ],
      headcount: [42, 44, 45, 45, 47, 48, 48, 50, 51, 52, 52, 54],
      orders: [800, 850, 820, 900, 950, 920, 980, 1020, 1000, 1060, 1040, 1100],
    };
    const data =
      dummyData[metric] ||
      Array.from({ length: periods }, () => Math.round(Math.random() * 1000));
    return data.slice(0, periods).map((v, i) => ({
      period: `Period ${i + 1}`,
      value: v,
    }));
  }

  async getAdHocQuery(tenantId: string, query: string) {
    const sanitized = query.toLowerCase();
    const blocked = [
      "drop ",
      "truncate ",
      "delete ",
      "insert ",
      "update ",
      "alter ",
      "create ",
      "grant ",
      "exec ",
    ];
    for (const keyword of blocked) {
      if (sanitized.includes(keyword)) {
        throw new ForbiddenException(
          `Query blocked: '${keyword.trim()}' operations are not allowed`,
        );
      }
    }
    const allowedTables = [
      "projects",
      "tasks",
      "timesheets",
      "work_orders",
      "invoices",
      "products",
      "employees",
      "customers",
      "vendors",
      "sales_orders",
      "purchase_orders",
      "inventory_items",
      "milestones",
    ];
    const tableMatch = sanitized.match(/from\s+(\w+)/);
    if (tableMatch) {
      const table = tableMatch[1];
      if (!table || !allowedTables.includes(table)) {
        throw new ForbiddenException(
          `Table '${table}' is not in the allowed list`,
        );
      }
    }
    if (!sanitized.startsWith("select")) {
      throw new ForbiddenException("Only SELECT queries are allowed");
    }
    const countQuery = query.toLowerCase().includes("count(");
    const limitMatch = query.match(/limit\s+(\d+)/i);
    const limit = limitMatch?.[1] ? parseInt(limitMatch[1], 10) : 100;
    if (limit > 1000) {
      throw new ForbiddenException("LIMIT cannot exceed 1000 rows");
    }
    // This endpoint executes admin-supplied dynamic SQL text by design (the "ad-hoc query"
    // feature), so $queryRawUnsafe cannot be eliminated here the way it can elsewhere.
    // What CAN be eliminated is trusting tenant isolation instead of proving it: verify
    // RLS is actually enabled+forced on the target table before running the query, so a
    // misconfiguration fails closed instead of silently returning cross-tenant rows.
    // docs/ai/ARCHITECTURE_REVIEW.md § F12.
    if (tableMatch?.[1]) {
      const [rlsState] = await prisma.$queryRaw<
        Array<{ enabled: boolean; forced: boolean }>
      >`
        SELECT relrowsecurity AS enabled, relforcerowsecurity AS forced
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relname = ${tableMatch[1]}
      `;
      if (!rlsState?.enabled || !rlsState?.forced) {
        throw new ForbiddenException(
          `Table '${tableMatch[1]}' does not have RLS enabled and forced — refusing to run an ad-hoc query against it.`,
        );
      }
    }
    try {
      const result = await prisma.$queryRawUnsafe(query);
      return {
        executed: true,
        rowCount: Array.isArray(result) ? result.length : 0,
        truncated: Array.isArray(result) && result.length > limit,
        data: result,
        executionTime: new Date().toISOString(),
      };
    } catch (err: any) {
      throw new ForbiddenException(`Query execution failed: ${err.message}`);
    }
  }

  async getDashboardExport(
    tenantId: string,
    dashboardId: string,
    format: string = "pdf",
  ) {
    const dashboard = await prisma.dashboard.findFirst({
      where: { id: dashboardId, tenantId },
      include: { analyticsWidgets: true },
    });
    if (!dashboard) return null;
    const widgets = dashboard.analyticsWidgets.map((w) => ({
      id: w.id,
      title: w.title,
      widgetType: w.widgetType,
      config: w.config,
      position: w.position,
    }));
    return {
      dashboardId,
      dashboardName: dashboard.name,
      format,
      exportUrl: `/exports/dashboards/${dashboardId}.${format}`,
      generatedAt: new Date().toISOString(),
      pageCount: Math.ceil(widgets.length / 4),
      content: {
        title: dashboard.name,
        description: dashboard.description,
        widgets,
      },
    };
  }

  async getAutomatedInsights(tenantId: string, dateRange: string) {
    const now = new Date();
    let startDate: Date;
    if (dateRange === "WEEKLY") {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
    } else if (dateRange === "MONTHLY") {
      startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 1);
    } else if (dateRange === "QUARTERLY") {
      startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 3);
    } else {
      startDate = new Date(now);
      startDate.setFullYear(startDate.getFullYear() - 1);
    }
    const projects = await prisma.project.findMany({
      where: { tenantId, deletedAt: null, createdAt: { gte: startDate } },
    });
    const tasks = await prisma.task.findMany({
      where: { tenantId, createdAt: { gte: startDate } },
    });
    const completedTasks = tasks.filter((t) => t.status === "DONE").length;
    const overdueTasks = tasks.filter(
      (t) => t.dueDate && t.dueDate < now && t.status !== "DONE",
    ).length;
    const invoices = await prisma.invoice.findMany({
      where: { tenantId, createdAt: { gte: startDate } },
    });
    const totalRevenue = invoices.reduce(
      (s, i) => s + Number(i.totalAmount),
      0,
    );
    const paidInvoices = invoices.filter((i) => i.status === "PAID");
    const collectionRate =
      invoices.length > 0
        ? Number(((paidInvoices.length / invoices.length) * 100).toFixed(1))
        : 0;
    const insights: string[] = [];
    if (projects.length > 5) {
      insights.push(
        `📈 Strong project growth: ${projects.length} new projects started in this period`,
      );
    } else if (projects.length === 0) {
      insights.push(
        `⚠️ No new projects started in this period - consider reviewing your sales pipeline`,
      );
    }
    const taskCompletionRate =
      tasks.length > 0
        ? Number(((completedTasks / tasks.length) * 100).toFixed(1))
        : 0;
    if (taskCompletionRate < 50) {
      insights.push(
        `⚠️ Task completion rate is low at ${taskCompletionRate}% - investigate potential blockers`,
      );
    } else if (taskCompletionRate > 80) {
      insights.push(
        `✅ Excellent task completion rate of ${taskCompletionRate}% - team productivity is high`,
      );
    }
    if (overdueTasks > 5) {
      insights.push(
        `⚠️ ${overdueTasks} tasks are overdue - review task assignments and deadlines`,
      );
    }
    if (collectionRate < 70) {
      insights.push(
        `⚠️ Invoice collection rate is ${collectionRate}% - consider sending payment reminders`,
      );
    } else if (collectionRate > 90) {
      insights.push(
        `✅ Strong cash flow: ${collectionRate}% invoice collection rate`,
      );
    }
    if (totalRevenue > 500000) {
      insights.push(
        `💰 Revenue exceeded $500K ($${Number(totalRevenue / 1000).toFixed(0)}K) - strong financial performance`,
      );
    }
    return {
      dateRange,
      generatedAt: now.toISOString(),
      summary: {
        totalProjects: projects.length,
        totalTasks: tasks.length,
        taskCompletionRate,
        overdueTasks,
        totalRevenue: Number(totalRevenue.toFixed(2)),
        collectionRate,
      },
      insights,
      highlights: {
        topPerformer: taskCompletionRate > 80 ? "Task Management" : null,
        needsAttention:
          overdueTasks > 5
            ? "Overdue Tasks"
            : collectionRate < 70
              ? "Collections"
              : null,
        revenueStatus: totalRevenue > 500000 ? "STRONG" : "MODERATE",
      },
    };
  }

  async getDataQualityDashboard(tenantId: string) {
    const checkTable = async (
      table: string,
      requiredFields: string[],
    ): Promise<{
      total: number;
      complete: number;
      completeness: number;
      issues: string[];
    }> => {
      try {
        // `table` and `requiredFields` are hardcoded by the caller (see the `tables` array
        // below), never user input — but this still used to build SQL by string
        // interpolation, which is the exact shape that becomes exploitable the moment
        // someone reuses this helper with a dynamic value. Rewritten with Prisma.sql +
        // Prisma.raw for identifiers, so a future caller gets the same parameterisation
        // safety Prisma gives everywhere else, and the raw-SQL policy gate can retire
        // this pattern from its findings for good rather than re-flagging it every scan.
        const tableIdent = Prisma.raw(
          `"${table.replace(/[^a-zA-Z0-9_]/g, "")}"`,
        );
        const rows = await prisma.$queryRaw<Array<{ cnt: bigint }>>(
          Prisma.sql`SELECT COUNT(*) as cnt FROM ${tableIdent} WHERE "tenant_id" = ${tenantId}`,
        );
        const total = Number(rows[0]?.cnt || 0);
        if (total === 0)
          return { total: 0, complete: 0, completeness: 100, issues: [] };
        const nullChecks = Prisma.raw(
          requiredFields
            .map((f) => `"${f.replace(/[^a-zA-Z0-9_]/g, "")}" IS NOT NULL`)
            .join(" AND "),
        );
        const completeResult = await prisma.$queryRaw<Array<{ cnt: bigint }>>(
          Prisma.sql`SELECT COUNT(*) as cnt FROM ${tableIdent} WHERE "tenant_id" = ${tenantId} AND ${nullChecks}`,
        );
        const complete = Number(completeResult[0]?.cnt || 0);
        const completeness = Number(((complete / total) * 100).toFixed(1));
        const issues: string[] = [];
        if (completeness < 80)
          issues.push(`Data completeness below 80% for ${table}`);
        return { total, complete, completeness, issues };
      } catch {
        return {
          total: 0,
          complete: 0,
          completeness: 0,
          issues: [`Could not check table ${table}`],
        };
      }
    };
    const tables = [
      { name: "projects", fields: ["name", "status", "org_id"] },
      { name: "tasks", fields: ["name", "project_id", "status"] },
      { name: "invoices", fields: ["total", "status", "customer_id"] },
      { name: "products", fields: ["sku", "name", "type"] },
      {
        name: "work_orders",
        fields: ["work_order_number", "status", "bom_id"],
      },
      { name: "employees", fields: ["employee_code", "first_name", "email"] },
      { name: "customers", fields: ["name", "type"] },
      {
        name: "timesheets",
        fields: ["task_id", "employee_id", "date", "hours"],
      },
    ];
    const results = await Promise.all(
      tables.map((t) =>
        checkTable(t.name, t.fields).then((r) => ({ table: t.name, ...r })),
      ),
    );
    const overallCompleteness =
      results.length > 0
        ? Number(
            (
              results.reduce((s, r) => s + r.completeness, 0) / results.length
            ).toFixed(1),
          )
        : 0;
    const allIssues = results.flatMap((r) => r.issues);
    return {
      generatedAt: new Date().toISOString(),
      overallCompleteness,
      totalTables: results.length,
      tablesWithIssues: results.filter((r) => r.issues.length > 0).length,
      totalIssues: allIssues.length,
      tables: results,
      recommendations:
        allIssues.length > 0
          ? [
              "Set up mandatory field validation at the application layer",
              "Run data cleanup scripts for incomplete records",
              "Configure field-level validation rules in Prisma schema",
            ]
          : ["All tables have good data quality - no action required"],
    };
  }

  async getAnomalyAlertConfig(tenantId: string) {
    const thresholds = {
      revenueDrop: {
        enabled: true,
        sensitivity: "MEDIUM",
        threshold: 20,
        channels: ["EMAIL", "IN_APP"],
      },
      costOverrun: {
        enabled: true,
        sensitivity: "HIGH",
        threshold: 15,
        channels: ["EMAIL", "IN_APP", "SLACK"],
      },
      projectDelay: {
        enabled: true,
        sensitivity: "MEDIUM",
        threshold: 7,
        unit: "days",
        channels: ["IN_APP"],
      },
      defectRate: {
        enabled: true,
        sensitivity: "HIGH",
        threshold: 5,
        unit: "pct",
        channels: ["EMAIL", "IN_APP"],
      },
      inventoryShortage: {
        enabled: true,
        sensitivity: "MEDIUM",
        threshold: 10,
        channels: ["IN_APP"],
      },
      overtimeExcess: {
        enabled: true,
        sensitivity: "LOW",
        threshold: 20,
        unit: "hours",
        channels: ["IN_APP"],
      },
    };
    const activeRules = Object.entries(thresholds).filter(
      ([, v]) => v.enabled,
    ).length;
    return {
      tenantId,
      totalRules: Object.keys(thresholds).length,
      activeRules,
      notificationChannels: ["EMAIL", "IN_APP", "SLACK"],
      defaultSensitivity: "MEDIUM",
      thresholds,
      anomalyDefinitions: [
        {
          id: "rev-drop",
          name: "Revenue Drop",
          metric: "revenue",
          condition: "WEEKLY_DROP > threshold%",
          severity: "HIGH",
        },
        {
          id: "cost-overrun",
          name: "Cost Overrun",
          metric: "costs",
          condition: "COST_VARIANCE > threshold%",
          severity: "HIGH",
        },
        {
          id: "project-delay",
          name: "Project Schedule Delay",
          metric: "schedule_variance",
          condition: "DELAY > threshold days",
          severity: "MEDIUM",
        },
        {
          id: "defect-spike",
          name: "Defect Rate Spike",
          metric: "defect_rate",
          condition: "DEFECT_RATE > threshold%",
          severity: "HIGH",
        },
        {
          id: "stockout",
          name: "Inventory Stockout Risk",
          metric: "stock_level",
          condition: "STOCK < reorder_point",
          severity: "MEDIUM",
        },
      ],
    };
  }

  async getBenchmarkComparison(
    tenantId: string,
    metric: string,
    industry: string,
  ) {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    let currentValue = 0;
    let description = "";
    const industryBenchmarks: Record<
      string,
      Record<string, { p25: number; p50: number; p75: number }>
    > = {
      manufacturing: {
        oee: { p25: 65, p50: 75, p75: 85 },
        defectRate: { p25: 0.5, p50: 1.5, p75: 3.0 },
        yieldPct: { p25: 92, p50: 95, p75: 98 },
        capacityUtilization: { p25: 60, p50: 75, p75: 85 },
      },
      technology: {
        revenueGrowth: { p25: 10, p50: 20, p75: 35 },
        profitMargin: { p25: 10, p50: 20, p75: 30 },
      },
      healthcare: {
        patientSatisfaction: { p25: 75, p50: 85, p75: 95 },
        bedOccupancy: { p25: 60, p50: 75, p75: 85 },
      },
      retail: {
        inventoryTurnover: { p25: 4, p50: 6, p75: 10 },
        avgOrderValue: { p25: 45, p50: 75, p75: 120 },
      },
    };
    const benchmarks =
      industryBenchmarks[industry] || industryBenchmarks.manufacturing!;
    if (metric === "oee") {
      const oeeRecs = await prisma.machineOeeRecord.findMany({
        where: { tenantId, recordDate: { gte: monthStart } },
      });
      currentValue =
        oeeRecs.length > 0
          ? Number(
              (
                oeeRecs.reduce((s, r) => s + Number(r.oee || 0), 0) /
                oeeRecs.length
              ).toFixed(2),
            ) * 100
          : 0;
      description = "Overall Equipment Effectiveness";
    } else if (metric === "defectRate") {
      const qc = await prisma.manufacturingQualityCheck.findMany({
        where: { tenantId, checkedAt: { gte: monthStart } },
      });
      const total = qc.reduce((s, r) => s + Number(r.checkedQty), 0);
      const failed = qc.reduce((s, r) => s + Number(r.failedQty), 0);
      currentValue =
        total > 0 ? Number(((failed / total) * 100).toFixed(2)) : 0;
      description = "Defect Rate (%)";
    } else if (metric === "yieldPct") {
      const wo = await prisma.workOrder.findMany({
        where: { tenantId, createdAt: { gte: monthStart } },
      });
      const totalQty = wo.reduce((s, w) => s + Number(w.quantity), 0);
      const scrap = wo.reduce((s, w) => s + Number(w.scrapQuantity || 0), 0);
      currentValue =
        totalQty > 0
          ? Number((((totalQty - scrap) / totalQty) * 100).toFixed(1))
          : 0;
      description = "Production Yield (%)";
    } else if (metric === "revenueGrowth") {
      const lastMonthInvoices = await prisma.invoice.findMany({
        where: { tenantId, createdAt: { gte: monthStart } },
      });
      const prevMonthStart = new Date(monthStart);
      prevMonthStart.setMonth(prevMonthStart.getMonth() - 1);
      const prevInvoices = await prisma.invoice.findMany({
        where: { tenantId, createdAt: { gte: prevMonthStart, lt: monthStart } },
      });
      const curr = lastMonthInvoices.reduce(
        (s, i) => s + Number(i.totalAmount),
        0,
      );
      const prev = prevInvoices.reduce((s, i) => s + Number(i.totalAmount), 0);
      currentValue =
        prev > 0 ? Number((((curr - prev) / prev) * 100).toFixed(1)) : 0;
      description = "Revenue Growth (%)";
    } else {
      currentValue = 75;
      description = `${metric} (generic metric)`;
    }
    const benchmark = benchmarks[metric] || { p25: 50, p50: 65, p75: 80 };
    const percentile =
      currentValue < benchmark.p25
        ? "BELOW_25TH"
        : currentValue < benchmark.p50
          ? "25TH_50TH"
          : currentValue < benchmark.p75
            ? "50TH_75TH"
            : "ABOVE_75TH";
    const gapToMedian = Number((benchmark.p50 - currentValue).toFixed(1));
    return {
      metric,
      description,
      industry,
      currentValue,
      benchmark,
      percentile,
      gapToMedian,
      interpretation:
        gapToMedian > 0
          ? `Your ${metric} (${currentValue}) is ${gapToMedian} points below the industry median (${benchmark.p50})`
          : gapToMedian < 0
            ? `Your ${metric} (${currentValue}) is ${Math.abs(gapToMedian)} points above the industry median (${benchmark.p50})`
            : `Your ${metric} is at the industry median (${benchmark.p50})`,
      recommendation:
        gapToMedian > 0
          ? `Focus on improving ${metric} to reach the industry median of ${benchmark.p50}`
          : `Maintain your ${metric} advantage over the industry median`,
    };
  }
}
