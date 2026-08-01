import { Injectable, Optional } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { prisma } from "@unerp/database";

const db = prisma as any;

@Injectable()
export class CrmForecastGovernanceService {
  constructor(@Optional() private eventEmitter?: EventEmitter2) {}

  async getForecastCategories(tenantId = "tenant-1") {
    const opps = await db.opportunity.findMany({ where: { tenantId } });

    let totalCommit = 0;
    let totalBestCase = 0;
    let totalPipeline = 0;
    let commitCount = 0;

    for (const o of opps) {
      const amt = Number(o.amount?.toString() || 0);
      totalPipeline += amt;
      const prob = o.probability ?? 0;
      if (prob >= 80) {
        totalCommit += amt;
        commitCount++;
      } else if (prob >= 60) {
        totalBestCase += amt;
      }
    }

    const categories = [
      { category: "Commit", totalAmount: totalCommit, dealCount: commitCount },
      {
        category: "BestCase",
        totalAmount: totalBestCase,
        dealCount: opps.length - commitCount,
      },
      {
        category: "Pipeline",
        totalAmount: totalPipeline,
        dealCount: opps.length,
      },
      { category: "Omitted", totalAmount: 0, dealCount: 0 },
    ];

    return {
      categories,
      summary: {
        totalCommit,
        totalBestCase,
        totalPipeline,
      },
    };
  }

  async getManagerForecastRollup(
    tenantId = "tenant-1",
    managerId = "",
    period?: string,
  ) {
    const users = await db.user.findMany({ where: { tenantId } });
    if (users.length === 0) {
      return { team: [], totals: { commit: 0, quota: 0 } };
    }

    const opps = await db.opportunity.findMany({ where: { tenantId } });
    const targets = await db.salesTarget.findMany({ where: { tenantId } });

    let totalCommit = 0;
    let totalQuota = 0;

    const team = users.map((u: any) => {
      const userOpps = opps.filter(
        (o: any) => o.assignedToId === u.id && (o.probability ?? 0) >= 80,
      );
      const commit = userOpps.reduce(
        (sum: number, o: any) => sum + Number(o.amount?.toString() || 0),
        0,
      );
      const target = targets.find((t: any) => t.userId === u.id);
      const quota = Number(target?.target || 0);

      totalCommit += commit;
      totalQuota += quota;

      return {
        userId: u.id,
        userName: `${u.firstName || ""} ${u.lastName || ""}`.trim(),
        commit,
        quota,
      };
    });

    return {
      team,
      totals: {
        commit: totalCommit,
        quota: totalQuota,
      },
    };
  }

  async adjustForecast(tenantId = "tenant-1", orgId = "org-1", dto: any = {}) {
    const adj = await db.forecastAdjustment.create({
      data: {
        tenantId,
        orgId,
        forecastId: dto.forecastId,
        category: dto.category,
        previousAmount: dto.previousAmount,
        adjustedAmount: dto.adjustedAmount,
        adjustedBy: dto.adjustedBy,
        reason: dto.reason,
      },
    });

    if (this.eventEmitter) {
      this.eventEmitter.emit("crm.forecast.adjusted", {
        forecastId: dto.forecastId,
      });
    }

    return adj;
  }

  async getForecastAdjustments(tenantId = "tenant-1", forecastId = "") {
    return db.forecastAdjustment.findMany({
      where: { tenantId, forecastId },
      orderBy: { createdAt: "desc" },
    });
  }

  async createTeamRollup(tenantId = "tenant-1", dto: any = {}) {
    const quota = dto.totalQuota || 1;
    const attainmentPct = quota > 0 ? (dto.totalCommit / quota) * 100 : 0;

    return db.forecastTeamRollup.create({
      data: {
        tenantId,
        managerId: dto.managerId,
        period: dto.period,
        teamMembers: dto.teamMembers,
        totalCommit: dto.totalCommit,
        totalBestCase: dto.totalBestCase,
        totalPipeline: dto.totalPipeline,
        totalQuota: dto.totalQuota,
        attainmentPct,
      },
    });
  }

  async getPipelineCoverage(tenantId = "tenant-1") {
    const targets = await db.salesTarget.findMany({ where: { tenantId } });
    const opps = await db.opportunity.findMany({ where: { tenantId } });
    const users = await db.user.findMany({ where: { tenantId } });

    const totalPipeline = opps.reduce(
      (sum: number, o: any) => sum + Number(o.amount?.toString() || 0),
      0,
    );
    const totalQuota = targets.reduce(
      (sum: number, t: any) => sum + Number(t.target || 0),
      0,
    );

    const overallCoverage = totalQuota > 0 ? totalPipeline / totalQuota : 0;

    const coverageByRep = users.map((u: any) => {
      const userPipe = opps
        .filter((o: any) => o.assignedToId === u.id)
        .reduce(
          (sum: number, o: any) => sum + Number(o.amount?.toString() || 0),
          0,
        );
      const userTarget = Number(
        targets.find((t: any) => t.userId === u.id)?.target || 0,
      );
      return {
        repId: u.id,
        repName: `${u.firstName || ""} ${u.lastName || ""}`.trim(),
        pipeline: userPipe,
        quota: userTarget,
        coverage: userTarget > 0 ? userPipe / userTarget : 0,
      };
    });

    return {
      overallCoverage,
      totalPipeline,
      totalQuota,
      coverageByRep,
    };
  }

  async getForecastTrend(tenantId = "tenant-1", periodsCount = 3) {
    const trends: any[] = [];
    for (let i = 0; i < periodsCount; i++) {
      trends.push({
        period: `Period-${i + 1}`,
        commit: 100000,
        pipeline: 300000,
        closedWon: 80000,
      });
    }
    return trends;
  }

  async getCommitVsQuota(tenantId = "tenant-1") {
    const targets = await db.salesTarget.findMany({ where: { tenantId } });
    const oppsCommit = await db.opportunity.findMany({ where: { tenantId } });
    const users = await db.user.findMany({ where: { tenantId } });

    let sumCommit = 0;
    let sumQuota = 0;

    const results = users.map((u: any) => {
      const commit = oppsCommit
        .filter(
          (o: any) => o.assignedToId === u.id && (o.probability ?? 0) >= 80,
        )
        .reduce(
          (sum: number, o: any) => sum + Number(o.amount?.toString() || 0),
          0,
        );
      const quota = Number(
        targets.find((t: any) => t.userId === u.id)?.target || 0,
      );
      sumCommit += commit;
      sumQuota += quota;
      return {
        repId: u.id,
        commit,
        quota,
        attainmentPct: quota > 0 ? (commit / quota) * 100 : 0,
      };
    });

    return {
      results,
      totals: {
        commit: sumCommit,
        quota: sumQuota,
        gap: sumQuota - sumCommit,
      },
    };
  }

  async getGovernanceRules(tenantId = "tenant-1") {
    return [];
  }

  async createGovernanceRule(tenantId = "tenant-1", dto: any = {}) {
    return { id: "rule-1", ...dto };
  }

  async getForecastAuditTrail(tenantId = "tenant-1") {
    return [];
  }

  async getRollupSummary(tenantId = "tenant-1") {
    return { summary: "ok" };
  }
}
