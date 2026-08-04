import { Injectable } from "@nestjs/common";
import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";
import { Prisma } from "@prisma/client";

@Injectable()
export class ProjectsEnterpriseService {
  async getPortfolioHealth(tenantId: string, portfolioId: string) {
    const portfolio = await prisma.projectPortfolio.findFirst({
      where: { id: portfolioId, tenantId },
      include: { projects: { where: { deletedAt: null } } },
    });
    if (!portfolio) return null;
    const projects = portfolio.projects;
    const totalBudget = projects.reduce((s, p) => s + Number(p.budget || 0), 0);
    const totalCost = projects.reduce(
      (s, p) => s + Number(p.estimatedCost || 0),
      0,
    );
    const completed = projects.filter((p) => p.status === "COMPLETED").length;
    const active = projects.filter((p) => p.status === "ACTIVE").length;
    const onHold = projects.filter((p) => p.status === "ON_HOLD").length;
    const atRisk = projects.filter(
      (p) => p.overallHealth === "AT_RISK" || p.overallHealth === "CRITICAL",
    ).length;
    const scheduleScore =
      projects.length > 0
        ? Math.round(
            (completed / projects.length) * 40 +
              (1 - atRisk / projects.length) * 60,
          )
        : 100;
    const budgetScore =
      totalBudget > 0
        ? Math.round(Math.max(0, 100 - (totalCost / totalBudget - 1) * 100))
        : 100;
    const resourceAllocations = await prisma.projectResourceAllocation.findMany(
      {
        where: {
          tenantId,
          projectId: { in: projects.map((p) => p.id) },
        },
      },
    );
    const allocated = resourceAllocations.length;
    const resourceScore = Math.round(
      projects.length > 0
        ? Math.min(100, (allocated / projects.length) * 20)
        : 100,
    );
    const risks = await prisma.projectRisk.findMany({
      where: {
        tenantId,
        projectId: { in: projects.map((p) => p.id) },
        status: "OPEN",
      },
    });
    const riskScore = Math.round(
      projects.length > 0
        ? Math.max(0, 100 - (risks.length / projects.length) * 25)
        : 100,
    );
    const overallHealth = Math.round(
      (scheduleScore + budgetScore + resourceScore + riskScore) / 4,
    );
    return {
      portfolioId,
      portfolioName: portfolio.name,
      totalProjects: projects.length,
      budgetUtilization: {
        totalBudget: Number(totalBudget.toFixed(2)),
        totalCost: Number(totalCost.toFixed(2)),
        variance: Number((totalBudget - totalCost).toFixed(2)),
        budgetScore,
      },
      scheduleSummary: { completed, active, onHold, scheduleScore },
      resourceSummary: {
        totalAllocations: allocated,
        allocationRate:
          projects.length > 0
            ? Number(((allocated / (projects.length * 3)) * 100).toFixed(1))
            : 0,
        resourceScore,
      },
      riskSummary: {
        openRisks: risks.length,
        severityDistribution: {
          high: risks.filter((r) => r.probability === "HIGH").length,
          medium: risks.filter((r) => r.probability === "MEDIUM").length,
          low: risks.filter((r) => r.probability === "LOW").length,
        },
        riskScore,
      },
      healthScores: {
        schedule: scheduleScore,
        budget: budgetScore,
        resource: resourceScore,
        risk: riskScore,
        overall: overallHealth,
      },
      statusBreakdown: {
        completed,
        active,
        onHold,
        planned: projects.filter((p) => p.status === "PLANNED").length,
        cancelled: projects.filter((p) => p.status === "CANCELLED").length,
      },
    };
  }

  async getResourceCapacityPlanning(
    tenantId: string,
    periodStart: string,
    periodEnd: string,
  ) {
    const start = new Date(periodStart);
    const end = new Date(periodEnd);
    const allocations = await prisma.projectResourceAllocation.findMany({
      where: {
        tenantId,
        startDate: { lte: end },
        endDate: { gte: start },
      },
    });
    const totalAllocatedHours = allocations.reduce(
      (s, a) => s + Number(a.allocatedHours || 0),
      0,
    );
    const timesheets = await prisma.timesheet.findMany({
      where: {
        tenantId,
        date: { gte: start, lte: end },
      },
    });
    const totalActualHours = timesheets.reduce(
      (s, t) => s + Number(t.hours || 0),
      0,
    );
    const uniqueResources = [
      ...new Set([
        ...allocations.map((a) => a.resourceId),
        ...timesheets.map((t) => t.employeeId),
      ]),
    ];
    const resourceDetails = await Promise.all(
      uniqueResources.slice(0, 100).map(async (resId) => {
        const resAllocs = allocations.filter((a) => a.resourceId === resId);
        const resHours = resAllocs.reduce(
          (s, a) => s + Number(a.allocatedHours || 0),
          0,
        );
        const resActual = timesheets
          .filter((t) => t.employeeId === resId)
          .reduce((s, t) => s + Number(t.hours || 0), 0);
        const maxHours = [...Array(12)].reduce((s) => s + 160, 0);
        const allocationPct =
          maxHours > 0 ? Number(((resHours / maxHours) * 100).toFixed(1)) : 0;
        return {
          resourceId: resId,
          allocatedHours: Number(resHours.toFixed(2)),
          actualHours: Number(resActual.toFixed(2)),
          availableHours: maxHours,
          allocationPct,
          isOverallocated: allocationPct > 100,
          projects: resAllocs.map((a) => ({
            projectId: a.projectId,
            hours: Number(a.allocatedHours || 0),
          })),
        };
      }),
    );
    const overallocatedResources = resourceDetails.filter(
      (r) => r.isOverallocated,
    );
    return {
      period: { start: periodStart, end: periodEnd },
      summary: {
        totalResources: uniqueResources.length,
        totalAllocatedHours: Number(totalAllocatedHours.toFixed(2)),
        totalActualHours: Number(totalActualHours.toFixed(2)),
        averageAllocationPct:
          resourceDetails.length > 0
            ? Number(
                (
                  resourceDetails.reduce((s, r) => s + r.allocationPct, 0) /
                  resourceDetails.length
                ).toFixed(1),
              )
            : 0,
        overallocatedCount: overallocatedResources.length,
      },
      resources: resourceDetails,
      overallocationAlerts: overallocatedResources.map((r) => ({
        resourceId: r.resourceId,
        allocationPct: r.allocationPct,
        message: `Resource ${r.resourceId} is ${r.allocationPct}% allocated (exceeds 100%)`,
        totalProjects: r.projects.length,
      })),
    };
  }

  async getEarnedValueAnalysis(
    tenantId: string,
    projectId: string,
    asOf: string,
  ) {
    const baseline = await prisma.evmBaseline.findFirst({
      where: { tenantId, projectId, baselineType: "ORIGINAL" },
      orderBy: { createdAt: "desc" },
    });
    const asOfDate = new Date(asOf);
    const latestMeasurement = baseline
      ? await prisma.evmMeasurement.findFirst({
          where: {
            baselineId: baseline.id,
            measurementDate: { lte: asOfDate },
          },
          orderBy: { measurementDate: "desc" },
        })
      : null;
    // EVM operates on money, so every currency term stays a Decimal end to end.
    // Only the dimensionless indices (SPI, CPI, TCPI, % complete) become numbers,
    // and only at the point they are reported.
    const dec = (v: Prisma.Decimal | number | null | undefined) =>
      new Prisma.Decimal(v ?? 0);

    const totalBudget = dec(baseline?.budgetAtCompletion);
    const project = await prisma.project.findFirst({
      where: { id: projectId, tenantId },
    });
    const totalCostEntries = await prisma.projectCostEntry.findMany({
      where: { tenantId, projectId, date: { lte: asOfDate } },
    });
    const actualCost = totalCostEntries.reduce(
      (s, e) => s.plus(dec(e.amount)),
      new Prisma.Decimal(0),
    );
    const pv = dec(latestMeasurement?.plannedValue);
    const ev = dec(latestMeasurement?.earnedValue);
    const ac =
      latestMeasurement?.actualCost != null
        ? dec(latestMeasurement.actualCost)
        : actualCost;
    const spi = pv.gt(0) ? Number(ev.div(pv).toFixed(4)) : null;
    const cpi = ac.gt(0) ? Number(ev.div(ac).toFixed(4)) : null;
    const eac = cpi && cpi > 0 ? totalBudget.div(cpi) : totalBudget;
    const etc = eac.minus(ac);
    const workRemaining = totalBudget.minus(ev);
    const fundsRemaining = totalBudget.minus(ac);
    // Guard the denominator: at BAC == AC the original expression divided by zero
    // and produced Infinity, which then serialised into the API response.
    const tcpi =
      workRemaining.gt(0) && !fundsRemaining.isZero()
        ? Number(workRemaining.div(fundsRemaining).toFixed(4))
        : null;
    const vac = totalBudget.minus(eac);
    const scheduleVariance = ev.minus(pv);
    const costVariance = ev.minus(ac);
    const percentComplete = totalBudget.gt(0)
      ? Number(ev.div(totalBudget).times(100).toFixed(1))
      : 0;
    return {
      projectId,
      asOf: asOfDate,
      baseline: baseline
        ? {
            id: baseline.id,
            budgetAtCompletion: baseline.budgetAtCompletion,
            scheduleBaselineStart: baseline.scheduleBaselineStart,
            scheduleBaselineEnd: baseline.scheduleBaselineEnd,
          }
        : null,
      evmMetrics: {
        plannedValue: Number(pv.toFixed(2)),
        earnedValue: Number(ev.toFixed(2)),
        actualCost: Number(ac.toFixed(2)),
        scheduleVariance: Number(scheduleVariance.toFixed(2)),
        costVariance: Number(costVariance.toFixed(2)),
        spi,
        cpi,
        eac: Number(eac.toFixed(2)),
        etc: Number(etc.toFixed(2)),
        tcpi,
        vac: Number(vac.toFixed(2)),
        percentComplete,
      },
      interpretation: {
        scheduleStatus:
          spi !== null
            ? spi >= 1
              ? "AHEAD"
              : spi >= 0.9
                ? "ON_TRACK"
                : "BEHIND"
            : "NODATA",
        costStatus:
          cpi !== null
            ? cpi >= 1
              ? "UNDER_BUDGET"
              : cpi >= 0.9
                ? "ON_BUDGET"
                : "OVER_BUDGET"
            : "NODATA",
        estimatedCompletionCost: Number(eac.toFixed(2)),
        varianceAtCompletion: Number(vac.toFixed(2)),
      },
      measurementHistory: baseline
        ? await prisma.evmMeasurement.findMany({
            where: {
              baselineId: baseline.id,
              measurementDate: { lte: asOfDate },
            },
            orderBy: { measurementDate: "asc" },
            take: 50,
          })
        : [],
    };
  }

  async getProjectProfitability(tenantId: string, projectId: string) {
    const project = await prisma.project.findFirst({
      where: { id: projectId, tenantId, deletedAt: null },
    });
    if (!project) return null;
    const costEntries = await prisma.projectCostEntry.findMany({
      where: { tenantId, projectId },
    });
    const budgets = await prisma.projectBudget.findMany({
      where: { tenantId, projectId },
    });
    const invoices = await prisma.invoice.findMany({
      where: { projectId, tenantId },
      select: { totalAmount: true, status: true },
    });
    const revenue = invoices
      .filter((i) => i.status === "PAID" || i.status === "SENT")
      .reduce((s, i) => s + Number(i.totalAmount), 0);
    const costByType: Record<string, number> = {};
    for (const entry of costEntries) {
      const t = entry.type;
      costByType[t] = (costByType[t] || 0) + Number(entry.amount);
    }
    const totalCost = costEntries.reduce((s, e) => s + Number(e.amount), 0);
    const totalBudget = budgets.reduce((s, b) => s + Number(b.allocated), 0);
    const margin = revenue - totalCost;
    const marginPct =
      revenue > 0 ? Number(((margin / revenue) * 100).toFixed(1)) : 0;
    const budgetUtilization =
      totalBudget > 0
        ? Number(((totalCost / totalBudget) * 100).toFixed(1))
        : 0;
    const costBreakdown = Object.entries(costByType).map(([type, amount]) => ({
      type,
      amount: Number(amount.toFixed(2)),
      pctOfTotal:
        totalCost > 0 ? Number(((amount / totalCost) * 100).toFixed(1)) : 0,
    }));
    return {
      projectId,
      projectName: project.name,
      revenue: Number(revenue.toFixed(2)),
      totalCost: Number(totalCost.toFixed(2)),
      grossMargin: Number(margin.toFixed(2)),
      grossMarginPct: marginPct,
      budgetUtilization,
      totalBudget: Number(totalBudget.toFixed(2)),
      costBreakdown,
      status: project.status,
      profitabilityIndex:
        totalCost > 0 ? Number((revenue / totalCost).toFixed(3)) : 0,
      roi: totalCost > 0 ? Number(((margin / totalCost) * 100).toFixed(1)) : 0,
    };
  }

  async getScheduleRiskAssessment(tenantId: string, projectId: string) {
    const project = await prisma.project.findFirst({
      where: { id: projectId, tenantId, deletedAt: null },
    });
    if (!project) return null;
    const tasks = await prisma.task.findMany({
      where: { tenantId, projectId },
    });
    const milestones = await prisma.milestone.findMany({
      where: { tenantId, projectId },
    });
    const changeRequests = await prisma.changeRequest.findMany({
      where: { tenantId, projectId },
    });
    const risks = await prisma.projectRisk.findMany({
      where: { tenantId, projectId },
    });
    const now = new Date();
    const overdueTasks = tasks.filter(
      (t) => t.dueDate && t.dueDate < now && t.status !== "DONE",
    );
    const overdueMilestones = milestones.filter(
      (m) => m.dueDate < now && !m.isCompleted,
    );
    const totalPlannedDuration =
      project.startDate && project.endDate
        ? Math.round(
            (project.endDate.getTime() - project.startDate.getTime()) /
              (1000 * 60 * 60 * 24),
          )
        : 0;
    const elapsedDuration =
      project.startDate && project.startDate < now
        ? Math.round(
            (now.getTime() - project.startDate.getTime()) /
              (1000 * 60 * 60 * 24),
          )
        : 0;
    const scheduleVariance = project.endDate
      ? Math.round(
          (now.getTime() - project.endDate.getTime()) / (1000 * 60 * 60 * 24),
        )
      : 0;
    const completionPct =
      totalPlannedDuration > 0
        ? Math.min(
            100,
            Math.round((elapsedDuration / totalPlannedDuration) * 100),
          )
        : 0;
    const riskExposure = risks
      .filter((r) => r.status === "OPEN")
      .reduce((score, r) => {
        const p =
          r.probability === "HIGH"
            ? 0.8
            : r.probability === "MEDIUM"
              ? 0.5
              : 0.2;
        const i = r.impact === "HIGH" ? 0.9 : r.impact === "MEDIUM" ? 0.5 : 0.1;
        return score + p * i * 100;
      }, 0);
    const scheduleRiskScore = Math.min(
      100,
      Math.round(
        (overdueTasks.length > 0 ? 25 : 0) +
          (overdueMilestones.length > 0 ? 25 : 0) +
          (scheduleVariance > 0 ? Math.min(30, scheduleVariance) : 0) +
          (changeRequests.filter((c) => c.status === "PENDING").length > 3
            ? 20
            : 0),
      ),
    );
    const monteCarloProbability = Math.max(
      5,
      Math.round(100 - scheduleRiskScore * 0.8),
    );
    return {
      projectId,
      projectName: project.name,
      scheduleSummary: {
        startDate: project.startDate,
        endDate: project.endDate,
        totalPlannedDays: totalPlannedDuration,
        elapsedDays: elapsedDuration,
        remainingDays: Math.max(0, totalPlannedDuration - elapsedDuration),
        completionPct,
        scheduleVarianceDays: scheduleVariance,
      },
      taskHealth: {
        total: tasks.length,
        completed: tasks.filter((t) => t.status === "DONE").length,
        overdue: overdueTasks.length,
        inProgress: tasks.filter((t) => t.status === "IN_PROGRESS").length,
        completionRate:
          tasks.length > 0
            ? Number(
                (
                  (tasks.filter((t) => t.status === "DONE").length /
                    tasks.length) *
                  100
                ).toFixed(1),
              )
            : 0,
      },
      milestoneHealth: {
        total: milestones.length,
        completed: milestones.filter((m) => m.isCompleted).length,
        overdue: overdueMilestones.length,
        onTimePct:
          milestones.length > 0
            ? Number(
                (
                  (milestones.filter((m) => m.isCompleted).length /
                    milestones.length) *
                  100
                ).toFixed(1),
              )
            : 0,
      },
      riskExposure: Number(riskExposure.toFixed(2)),
      scheduleRiskScore,
      monteCarloSimulation: {
        onTimeProbability: monteCarloProbability,
        delayProbability: 100 - monteCarloProbability,
        confidenceLevel:
          monteCarloProbability >= 80
            ? "HIGH"
            : monteCarloProbability >= 50
              ? "MEDIUM"
              : "LOW",
        simulatedOutcomes: {
          optimistic: Math.round(monteCarloProbability * 0.3),
          mostLikely: monteCarloProbability,
          pessimistic: Math.round(monteCarloProbability * 0.1),
        },
      },
      changeRequestImpact: {
        total: changeRequests.length,
        pending: changeRequests.filter((c) => c.status === "PENDING").length,
        approved: changeRequests.filter((c) => c.status === "APPROVED").length,
        totalScheduleImpact: changeRequests.reduce(
          (s, c) => s + (c.requestedScheduleDays || 0),
          0,
        ),
        totalCostImpact: Number(
          changeRequests
            .reduce((s, c) => s + Number(c.requestedAmount || 0), 0)
            .toFixed(2),
        ),
      },
      criticalPath: project.criticalPath
        ? JSON.parse(project.criticalPath)
        : null,
    };
  }

  async getResourceUtilization(
    tenantId: string,
    periodStart: string,
    periodEnd: string,
    groupBy: string = "resource",
  ) {
    const start = new Date(periodStart);
    const end = new Date(periodEnd);
    const timesheets = await prisma.timesheet.findMany({
      where: { tenantId, date: { gte: start, lte: end } },
      include: { task: { select: { projectId: true, name: true } } },
    });
    const allocations = await prisma.projectResourceAllocation.findMany({
      where: {
        tenantId,
        startDate: { lte: end },
        endDate: { gte: start },
      },
    });
    const totalHours = timesheets.reduce((s, t) => s + Number(t.hours), 0);
    const totalAllocated = allocations.reduce(
      (s, a) => s + Number(a.allocatedHours || 0),
      0,
    );
    if (groupBy === "project") {
      const byProject: Record<
        string,
        { hours: number; allocated: number; count: number }
      > = {};
      for (const ts of timesheets) {
        const pid = ts.task.projectId;
        if (!byProject[pid])
          byProject[pid] = { hours: 0, allocated: 0, count: 0 };
        byProject[pid].hours += Number(ts.hours);
        byProject[pid].count++;
      }
      for (const a of allocations) {
        if (!byProject[a.projectId])
          byProject[a.projectId] = { hours: 0, allocated: 0, count: 0 };
        byProject[a.projectId]!.allocated += Number(a.allocatedHours || 0);
      }
      return {
        period: { start: periodStart, end: periodEnd },
        groupBy: "project",
        data: Object.entries(byProject).map(([projectId, d]) => ({
          projectId,
          actualHours: Number(d.hours.toFixed(2)),
          allocatedHours: Number(d.allocated.toFixed(2)),
          utilizationPct:
            d.allocated > 0
              ? Number(((d.hours / d.allocated) * 100).toFixed(1))
              : 0,
          entryCount: d.count,
        })),
      };
    }
    const byResource: Record<
      string,
      { hours: number; allocated: number; count: number }
    > = {};
    for (const ts of timesheets) {
      const eid = ts.employeeId;
      if (!byResource[eid])
        byResource[eid] = { hours: 0, allocated: 0, count: 0 };
      byResource[eid].hours += Number(ts.hours);
      byResource[eid].count++;
    }
    for (const a of allocations) {
      if (!byResource[a.resourceId])
        byResource[a.resourceId] = { hours: 0, allocated: 0, count: 0 };
      byResource[a.resourceId]!.allocated += Number(a.allocatedHours || 0);
    }
    return {
      period: { start: periodStart, end: periodEnd },
      groupBy: "resource",
      summary: {
        totalActualHours: Number(totalHours.toFixed(2)),
        totalAllocatedHours: Number(totalAllocated.toFixed(2)),
        overallUtilizationPct:
          totalAllocated > 0
            ? Number(((totalHours / totalAllocated) * 100).toFixed(1))
            : 0,
      },
      data: Object.entries(byResource).map(([resourceId, d]) => ({
        resourceId,
        actualHours: Number(d.hours.toFixed(2)),
        allocatedHours: Number(d.allocated.toFixed(2)),
        utilizationPct:
          d.allocated > 0
            ? Number(((d.hours / d.allocated) * 100).toFixed(1))
            : 0,
        entryCount: d.count,
      })),
    };
  }

  async getProjectPortfolioOptimization(
    tenantId: string,
    constraint: string = "resource",
  ) {
    const portfolios = await prisma.projectPortfolio.findMany({
      where: { tenantId },
      include: {
        projects: {
          where: { deletedAt: null },
          include: {
            risks: { where: { status: "OPEN" } },
            resourceAllocations: true,
          },
        },
      },
    });
    const results = await Promise.all(
      portfolios.map(async (pf) => {
        const projects = pf.projects;
        const totalBudget = projects.reduce(
          (s, p) => s + Number(p.budget || 0),
          0,
        );
        const totalCost = projects.reduce(
          (s, p) => s + Number(p.estimatedCost || 0),
          0,
        );
        const totalAllocated = projects.reduce(
          (s, p) =>
            s +
            p.resourceAllocations.reduce(
              (s2, a) => s2 + Number(a.allocatedHours || 0),
              0,
            ),
          0,
        );
        const riskCount = projects.reduce((s, p) => s + p.risks.length, 0);
        const optimizationScore =
          totalBudget > 0
            ? Math.round(
                Math.max(
                  0,
                  (1 - totalCost / totalBudget) * 50 +
                    (1 - riskCount / Math.max(1, projects.length)) * 30 +
                    (totalAllocated > 0 ? 20 : 0),
                ),
              )
            : 50;
        const recommendedActions: string[] = [];
        if (totalCost > totalBudget)
          recommendedActions.push(
            "Reduce cost overrun - review project budgets",
          );
        if (riskCount > projects.length)
          recommendedActions.push(
            `Mitigate ${riskCount - projects.length} excess risks`,
          );
        if (constraint === "budget" && totalCost > totalBudget * 0.8)
          recommendedActions.push(
            "Budget constraint binding - prioritize high-value projects",
          );
        return {
          portfolioId: pf.id,
          portfolioName: pf.name,
          projectCount: projects.length,
          totalBudget: Number(totalBudget.toFixed(2)),
          totalCost: Number(totalCost.toFixed(2)),
          totalAllocatedHours: Number(totalAllocated.toFixed(2)),
          openRisks: riskCount,
          optimizationScore,
          constraint,
          recommendedActions,
          projects: projects.map((p) => ({
            id: p.id,
            name: p.name,
            status: p.status,
            budget: Number(p.budget || 0),
            estimatedCost: Number(p.estimatedCost || 0),
            healthScore: p.overallHealth,
            riskCount: p.risks.length,
          })),
        };
      }),
    );
    return {
      constraint,
      totalPortfolios: portfolios.length,
      totalProjects: results.reduce((s, r) => s + r.projectCount, 0),
      averageOptimizationScore:
        results.length > 0
          ? Math.round(
              results.reduce((s, r) => s + r.optimizationScore, 0) /
                results.length,
            )
          : 0,
      recommendations: results.flatMap((r) => r.recommendedActions),
      portfolios: results,
    };
  }

  async getMilestoneTrending(tenantId: string, projectId: string) {
    const milestones = await prisma.milestone.findMany({
      where: { tenantId, projectId },
      orderBy: { dueDate: "asc" },
    });
    const now = new Date();
    const total = milestones.length;
    const completed = milestones.filter((m) => m.isCompleted).length;
    const overdue = milestones.filter(
      (m) => !m.isCompleted && m.dueDate < now,
    ).length;
    const upcoming = milestones.filter(
      (m) => !m.isCompleted && m.dueDate >= now,
    ).length;
    const onTimePct =
      total > 0 ? Number(((completed / total) * 100).toFixed(1)) : 0;
    const avgSlippageDays =
      milestones.length > 0
        ? milestones
            .filter((m) => m.isCompleted)
            .reduce((s, m) => {
              const slip = Math.round(
                (m.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
              );
              return s + Math.max(0, slip);
            }, 0) / Math.max(1, completed)
        : 0;
    return {
      projectId,
      summary: {
        total,
        completed,
        overdue,
        upcoming,
        onTimePct,
        avgSlippageDays: Number(avgSlippageDays.toFixed(1)),
      },
      milestones: milestones.map((m) => ({
        id: m.id,
        name: m.name,
        dueDate: m.dueDate,
        isCompleted: m.isCompleted,
        status: m.isCompleted
          ? "COMPLETED"
          : m.dueDate < now
            ? "OVERDUE"
            : "UPCOMING",
        slippageDays: m.isCompleted
          ? Math.max(
              0,
              Math.round(
                (m.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
              ),
            )
          : 0,
      })),
      trend: {
        completedOverTime: milestones
          .filter((m) => m.isCompleted)
          .map((m) => ({
            date: m.dueDate.toISOString().split("T")[0],
            name: m.name,
          })),
        overdueTrend: overdue > 0 ? "WORSENING" : "STABLE",
      },
    };
  }

  async getTimesheetCompliance(
    tenantId: string,
    projectId: string,
    period: string,
  ) {
    const now = new Date();
    let startDate: Date;
    if (period === "WEEKLY") {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === "MONTHLY") {
      startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 1);
    } else if (period === "QUARTERLY") {
      startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 3);
    } else {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 30);
    }
    const tasks = await prisma.task.findMany({
      where: { tenantId, projectId },
      include: {
        timesheets: {
          where: { date: { gte: startDate, lte: now } },
        },
      },
    });
    const totalTimesheets = tasks.reduce((s, t) => s + t.timesheets.length, 0);
    const totalHours = tasks.reduce(
      (s, t) => s + t.timesheets.reduce((s2, ts) => s2 + Number(ts.hours), 0),
      0,
    );
    const taskCount = tasks.length;
    const submittedTasks = tasks.filter((t) => t.timesheets.length > 0).length;
    const submissionRate =
      taskCount > 0
        ? Number(((submittedTasks / taskCount) * 100).toFixed(1))
        : 0;
    const missingTasks = tasks
      .filter((t) => t.timesheets.length === 0)
      .map((t) => ({ id: t.id, name: t.name }));
    return {
      projectId,
      period,
      dateRange: {
        start: startDate.toISOString().split("T")[0],
        end: now.toISOString().split("T")[0],
      },
      summary: {
        totalTasks: taskCount,
        totalTimesheets,
        totalHours: Number(totalHours.toFixed(2)),
        submittedTasks,
        submissionRate,
        avgHoursPerTask:
          taskCount > 0 ? Number((totalHours / taskCount).toFixed(2)) : 0,
      },
      missingEntries: {
        count: missingTasks.length,
        tasks: missingTasks,
      },
      complianceStatus:
        submissionRate >= 90
          ? "EXCELLENT"
          : submissionRate >= 75
            ? "GOOD"
            : submissionRate >= 50
              ? "NEEDS_IMPROVEMENT"
              : "POOR",
    };
  }

  async getProjectFinancialForecast(tenantId: string, projectId: string) {
    const project = await prisma.project.findFirst({
      where: { id: projectId, tenantId, deletedAt: null },
    });
    if (!project) return null;
    const costEntries = await prisma.projectCostEntry.findMany({
      where: { tenantId, projectId },
      orderBy: { date: "asc" },
    });
    const budgets = await prisma.projectBudget.findMany({
      where: { tenantId, projectId },
    });
    const invoices = await prisma.invoice.findMany({
      where: { projectId, tenantId },
    });
    const totalBudget = budgets.reduce((s, b) => s + Number(b.allocated), 0);
    const totalCost = costEntries.reduce((s, e) => s + Number(e.amount), 0);
    const totalRevenue = invoices.reduce(
      (s, i) => s + Number(i.totalAmount),
      0,
    );
    const actualCostMonthly: Record<string, number> = {};
    for (const entry of costEntries) {
      const key = `${entry.date.getFullYear()}-${String(entry.date.getMonth() + 1).padStart(2, "0")}`;
      actualCostMonthly[key] =
        (actualCostMonthly[key] || 0) + Number(entry.amount);
    }
    const monthlyCosts = Object.entries(actualCostMonthly).map(
      ([month, amount]) => ({ month, amount: Number(amount.toFixed(2)) }),
    );
    const avgMonthlyCost =
      monthlyCosts.length > 0 ? totalCost / monthlyCosts.length : 0;
    const remainingBudget = Math.max(0, totalBudget - totalCost);
    const monthsRemaining = project.endDate
      ? Math.max(
          1,
          Math.round(
            (project.endDate.getTime() - Date.now()) /
              (1000 * 60 * 60 * 24 * 30),
          ),
        )
      : 12;
    const eac = Number(
      (totalCost + avgMonthlyCost * monthsRemaining).toFixed(2),
    );
    const etc = Number((eac - totalCost).toFixed(2));
    const estimatedRevenueRemaining = project.contractValue
      ? Math.max(0, Number(project.contractValue) - totalRevenue)
      : 0;
    const estimatedTotalRevenue = Number(
      (totalRevenue + estimatedRevenueRemaining * 0.7).toFixed(2),
    );
    const forecastMargin = Number((estimatedTotalRevenue - eac).toFixed(2));
    return {
      projectId,
      projectName: project.name,
      currentStatus: {
        totalBudget: Number(totalBudget.toFixed(2)),
        totalActualCost: Number(totalCost.toFixed(2)),
        totalRevenue: Number(totalRevenue.toFixed(2)),
        remainingBudget,
      },
      forecast: {
        eac,
        etc,
        estimatedTotalRevenue,
        forecastMargin,
        forecastMarginPct:
          estimatedTotalRevenue > 0
            ? Number(
                ((forecastMargin / estimatedTotalRevenue) * 100).toFixed(1),
              )
            : 0,
        monthsRemaining,
        avgMonthlyCost: Number(avgMonthlyCost.toFixed(2)),
        projectedOverUnder: eac > totalBudget ? "OVER_BUDGET" : "UNDER_BUDGET",
        varianceAtCompletion: Number((totalBudget - eac).toFixed(2)),
      },
      monthlyCostTrend: monthlyCosts,
      revenueForecast: {
        currentRevenue: Number(totalRevenue.toFixed(2)),
        expectedRemainingRevenue: Number(estimatedRevenueRemaining.toFixed(2)),
        projectedTotalRevenue: estimatedTotalRevenue,
      },
    };
  }

  async getProjectDashboardKpis(tenantId: string) {
    const projects = await prisma.project.findMany({
      where: { tenantId, deletedAt: null },
    });
    const totalProjects = projects.length;
    const activeProjects = projects.filter((p) => p.status === "ACTIVE").length;
    const completedProjects = projects.filter(
      (p) => p.status === "COMPLETED",
    ).length;
    const onHold = projects.filter((p) => p.status === "ON_HOLD").length;
    const atRisk = projects.filter(
      (p) => p.overallHealth === "AT_RISK" || p.overallHealth === "CRITICAL",
    ).length;
    const totalBudget = projects.reduce((s, p) => s + Number(p.budget || 0), 0);
    const totalCost = projects.reduce(
      (s, p) => s + Number(p.estimatedCost || 0),
      0,
    );
    const projectIds = projects.map((p) => p.id);
    const [allTasks, allMilestones, allRisks, allTimesheets] =
      await Promise.all([
        prisma.task.findMany({
          where: { tenantId, projectId: { in: projectIds } },
        }),
        prisma.milestone.findMany({
          where: { tenantId, projectId: { in: projectIds } },
        }),
        prisma.projectRisk.findMany({
          where: { tenantId, projectId: { in: projectIds } },
        }),
        prisma.timesheet.findMany({
          where: { tenantId, task: { projectId: { in: projectIds } } },
        }),
      ]);
    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter((t) => t.status === "DONE").length;
    const overdueMilestones = allMilestones.filter(
      (m) => !m.isCompleted && m.dueDate < new Date(),
    ).length;
    const totalHours = allTimesheets.reduce((s, t) => s + Number(t.hours), 0);
    return {
      totalProjects,
      activeProjects,
      completedProjects,
      onHold,
      atRisk,
      projectCompletionRate:
        totalProjects > 0
          ? Number(((completedProjects / totalProjects) * 100).toFixed(1))
          : 0,
      financials: {
        totalBudget: Number(totalBudget.toFixed(2)),
        totalCost: Number(totalCost.toFixed(2)),
        budgetUtilization:
          totalBudget > 0
            ? Number(((totalCost / totalBudget) * 100).toFixed(1))
            : 0,
      },
      taskMetrics: {
        total: totalTasks,
        completed: completedTasks,
        completionRate:
          totalTasks > 0
            ? Number(((completedTasks / totalTasks) * 100).toFixed(1))
            : 0,
      },
      milestoneHealth: {
        total: allMilestones.length,
        overdue: overdueMilestones,
        onTimePct:
          allMilestones.length > 0
            ? Number(
                (
                  ((allMilestones.length - overdueMilestones) /
                    allMilestones.length) *
                  100
                ).toFixed(1),
              )
            : 0,
      },
      riskSummary: {
        total: allRisks.length,
        open: allRisks.filter((r) => r.status === "OPEN").length,
        critical: allRisks.filter(
          (r) => r.probability === "HIGH" && r.status === "OPEN",
        ).length,
      },
      resourceMetrics: {
        totalTimesheetEntries: allTimesheets.length,
        totalHoursLogged: Number(totalHours.toFixed(2)),
      },
    };
  }

  async getDependencyNetwork(tenantId: string, projectId: string) {
    const tasks = await prisma.task.findMany({
      where: { tenantId, projectId },
      orderBy: { createdAt: "asc" },
    });
    const milestones = await prisma.milestone.findMany({
      where: { tenantId, projectId },
    });
    const changeRequests = await prisma.changeRequest.findMany({
      where: { tenantId, projectId, status: "APPROVED" },
    });
    const networkNodes = tasks.map((t) => ({
      id: t.id,
      name: t.name,
      type: "TASK" as const,
      status: t.status,
      dueDate: t.dueDate,
      priority: t.priority,
    }));
    const milestoneNodes = milestones.map((m) => ({
      id: m.id,
      name: m.name,
      type: "MILESTONE" as const,
      status: m.isCompleted
        ? "COMPLETED"
        : m.dueDate < new Date()
          ? "OVERDUE"
          : "PENDING",
      dueDate: m.dueDate,
    }));
    const allNodes = [...networkNodes, ...milestoneNodes];
    const completedNodes = allNodes.filter(
      (n) => n.status === "DONE" || n.status === "COMPLETED",
    ).length;
    const delayedNodes = allNodes.filter(
      (n) => n.status === "OVERDUE" || (n.status as string) === "OVERDUE",
    ).length;
    const criticalChain = allNodes
      .filter(
        (n) =>
          n.type === "TASK" &&
          n.dueDate &&
          n.dueDate <= new Date() &&
          n.status !== "DONE",
      )
      .map((n) => ({
        id: n.id,
        name: n.name,
        delayDays: Math.round(
          (new Date().getTime() - (n.dueDate?.getTime() || 0)) /
            (1000 * 60 * 60 * 24),
        ),
      }))
      .filter((n) => n.delayDays > 0)
      .slice(0, 20);
    const riskImpacts = changeRequests.map((cr) => ({
      changeRequestId: cr.id,
      title: cr.title,
      scheduleImpactDays: cr.requestedScheduleDays,
      costImpact: Number(cr.requestedAmount),
    }));
    return {
      projectId,
      summary: {
        totalNodes: allNodes.length,
        completedNodes,
        delayedNodes,
        pendingNodes: allNodes.length - completedNodes,
        completionPct:
          allNodes.length > 0
            ? Number(((completedNodes / allNodes.length) * 100).toFixed(1))
            : 0,
      },
      nodes: allNodes,
      criticalChain: {
        items: criticalChain,
        criticalPathLength: criticalChain.length,
        totalDelayDays: criticalChain.reduce((s, n) => s + n.delayDays, 0),
      },
      riskImpacts,
      criticalChainAnalysis: {
        hasCriticalDelay: criticalChain.length > 0,
        bottleneckCount: criticalChain.length,
        recommendedActions:
          criticalChain.length > 0
            ? [
                "Expedite critical chain tasks with additional resources",
                "Review milestone dependencies for parallel execution opportunities",
                "Consider fast-tracking or crashing the critical path",
              ]
            : ["Project is on track - no critical chain bottlenecks"],
      },
    };
  }
}
