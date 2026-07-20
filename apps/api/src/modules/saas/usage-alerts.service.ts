import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class UsageAlertsService {
  async listAlertRules(tenantId: string) {
    return prisma.usageAlertRule.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });
  }

  async createAlertRule(tenantId: string, dto: {
    name: string;
    metric: string;
    condition: string;
    threshold: number;
    unit?: string;
    channel?: string;
    recipients?: string[];
    enabled?: boolean;
    notifyEvery?: number;
    webhookUrl?: string;
  }) {
    const existing = await prisma.usageAlertRule.findUnique({
      where: { tenantId_metric: { tenantId, metric: dto.metric } },
    });
    if (existing) throw new BadRequestException("Alert rule already exists for this metric");

    return prisma.usageAlertRule.create({
      data: {
        tenantId,
        metric: dto.metric,
        thresholdPct: Math.round((dto.threshold / 100) * 100),
        notifyEmail: dto.channel === "email",
        notifyWebhook: dto.channel === "webhook",
        notifyInApp: dto.channel === "in_app",
        webhookUrl: dto.webhookUrl,
        isActive: dto.enabled ?? true,
      },
    });
  }

  async updateAlertRule(tenantId: string, id: string, dto: {
    name?: string;
    metric?: string;
    condition?: string;
    threshold?: number;
    unit?: string;
    channel?: string;
    recipients?: string[];
    enabled?: boolean;
    notifyEvery?: number;
    webhookUrl?: string;
  }) {
    const rule = await prisma.usageAlertRule.findFirst({ where: { id, tenantId } });
    if (!rule) throw new NotFoundException("Alert rule not found");

    const updateData: Record<string, unknown> = {};
    if (dto.enabled !== undefined) updateData.isActive = dto.enabled;
    if (dto.webhookUrl !== undefined) updateData.webhookUrl = dto.webhookUrl;
    if (dto.channel !== undefined) {
      updateData.notifyEmail = dto.channel === "email";
      updateData.notifyWebhook = dto.channel === "webhook";
      updateData.notifyInApp = dto.channel === "in_app";
    }

    return prisma.usageAlertRule.update({ where: { id }, data: updateData });
  }

  async deleteAlertRule(tenantId: string, id: string) {
    const rule = await prisma.usageAlertRule.findFirst({ where: { id, tenantId } });
    if (!rule) throw new NotFoundException("Alert rule not found");
    await prisma.usageAlertLog.updateMany({
      where: { ruleId: id },
      data: { ruleId: null },
    });
    return prisma.usageAlertRule.delete({ where: { id } });
  }

  async evaluateAlerts(tenantId: string) {
    const [rules, usageRecords] = await Promise.all([
      prisma.usageAlertRule.findMany({ where: { tenantId, isActive: true } }),
      prisma.usageRecord.findMany({ where: { tenantId } }),
    ]);

    const usageMap = new Map(usageRecords.map((r) => [r.metric, r]));
    const triggered: Array<{
      rule: typeof rules[0];
      usage: typeof usageRecords[0];
      level: string;
    }> = [];

    for (const rule of rules) {
      const usage = usageMap.get(rule.metric);
      if (!usage || usage.limitValue <= 0) continue;

      const pct = Math.round((usage.currentValue / usage.limitValue) * 100);
      if (pct >= rule.thresholdPct) {
        const level = pct >= 95 ? "CRITICAL" : pct >= 90 ? "WARNING" : "INFO";
        triggered.push({ rule, usage, level });
      }
    }

    const logs = [];
    for (const t of triggered) {
      const log = await prisma.usageAlertLog.create({
        data: {
          tenantId,
          ruleId: t.rule.id,
          metric: t.rule.metric,
          level: t.level,
          message: `Usage for ${t.rule.metric} is at ${Math.round((t.usage.currentValue / t.usage.limitValue) * 100)}% of limit (${t.usage.currentValue}/${t.usage.limitValue})`,
          currentValue: t.usage.currentValue,
          limitValue: t.usage.limitValue,
          sentEmail: t.rule.notifyEmail,
          sentWebhook: t.rule.notifyWebhook,
        },
      });
      logs.push(log);

      await prisma.usageAlertRule.update({
        where: { id: t.rule.id },
        data: { lastTriggeredAt: new Date() },
      });
    }

    return { triggeredCount: triggered.length, logs };
  }

  async getAlertHistory(tenantId: string) {
    const items = await prisma.usageAlertLog.findMany({
      where: { tenantId },
      include: { rule: { select: { metric: true, thresholdPct: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return { items, total: items.length };
  }

  async dismissAlert(tenantId: string, logId: string) {
    const log = await prisma.usageAlertLog.findFirst({ where: { id: logId, tenantId } });
    if (!log) throw new NotFoundException("Alert log not found");
    return prisma.usageAlertLog.delete({ where: { id: logId } });
  }

  async getAlertStats(tenantId: string) {
    const [rules, logs] = await Promise.all([
      prisma.usageAlertRule.findMany({ where: { tenantId } }),
      prisma.usageAlertLog.findMany({ where: { tenantId } }),
    ]);

    return {
      totalRules: rules.length,
      activeRules: rules.filter((r) => r.isActive).length,
      totalAlerts: logs.length,
      criticalAlerts: logs.filter((l) => l.level === "CRITICAL").length,
      warningAlerts: logs.filter((l) => l.level === "WARNING").length,
      infoAlerts: logs.filter((l) => l.level === "INFO").length,
      lastAlert: logs.length > 0 ? logs[0] : null,
    };
  }

  async bulkUpdateRules(tenantId: string, body: {
    ruleIds: string[];
    data: {
      enabled?: boolean;
      channel?: string;
      threshold?: number;
      notifyEvery?: number;
    };
  }) {
    const results = [];
    for (const ruleId of body.ruleIds) {
      const existing = await prisma.usageAlertRule.findFirst({ where: { id: ruleId, tenantId } });
      if (!existing) continue;

      const updateData: Record<string, unknown> = {};
      if (body.data.enabled !== undefined) updateData.isActive = body.data.enabled;
      if (body.data.channel !== undefined) {
        updateData.notifyEmail = body.data.channel === "email";
        updateData.notifyWebhook = body.data.channel === "webhook";
        updateData.notifyInApp = body.data.channel === "in_app";
      }

      const updated = await prisma.usageAlertRule.update({
        where: { id: ruleId },
        data: updateData,
      });
      results.push(updated);
    }
    return results;
  }
}
