import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { z } from 'zod';

export const snoozeAlertSchema = z.object({
  days: z.number().int().min(1).max(90).default(7),
});
export type SnoozeAlertInput = z.infer<typeof snoozeAlertSchema>;

const CLOSED_STAGES = ['CLOSED_WON', 'CLOSED_LOST', 'CLOSED WON', 'CLOSED LOST'];

// Stage-specific stall thresholds (days) — later stages are expected to move
// faster, so the "stuck" bar is lower the further along the deal is.
const STAGE_STALL_THRESHOLDS: Record<string, number> = {
  PROSPECTING: 21,
  QUALIFICATION: 14,
  PROPOSAL: 10,
  NEGOTIATION: 7,
};

/**
 * CRM Pipeline Inspection / stage-change risk alerts (Up Next item 38).
 *
 * Distinct from the pre-existing `CrmForecastingService.getRottingDeals` /
 * `getDealRiskIndicators`, which compute risk on demand for a single deal or
 * a point-in-time list. This service PERSISTS a `PipelineRiskAlert` row per
 * at-risk opportunity so risk state survives across requests, can be
 * acknowledged/snoozed by a rep, and drives a `pipeline.deal.at_risk` domain
 * event for downstream notification consumers — the "Einstein Pipeline
 * Inspection" / "HubSpot Breeze forecast-confidence" pattern called out in
 * 2026 market discovery.
 *
 * Risk types detected on each recompute pass:
 *  - STAGE_STALL: deal has sat in its current stage longer than that stage's
 *    expected threshold (stage-specific, not a single flat "14 days" rule).
 *  - CLOSE_DATE_SLIPPED: `expectedCloseDate` is in the past but the deal is
 *    still open.
 *  - LOW_CONFIDENCE: probability is low (<30) yet the deal is in a late
 *    stage (PROPOSAL/NEGOTIATION) — a forecast-confidence mismatch.
 *  - NO_ACTIVITY: no `Activity` logged against the deal in the last 14 days.
 */
@Injectable()
export class CrmPipelineRiskService {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  /** Recompute risk alerts for every open opportunity in the tenant. */
  async recomputeAlerts(tenantId: string): Promise<{
    scanned: number; created: number; updated: number; resolved: number;
  }> {
    const opportunities = await prisma.opportunity.findMany({
      where: { tenantId, deletedAt: null, stage: { notIn: CLOSED_STAGES } },
      select: {
        id: true, orgId: true, name: true, stage: true, probability: true,
        expectedCloseDate: true, stageEnteredAt: true, createdAt: true,
      },
    });

    let created = 0;
    let updated = 0;
    let resolved = 0;
    const now = Date.now();
    const seenAlertKeys = new Set<string>();

    for (const opp of opportunities) {
      const stageKey = opp.stage.toUpperCase().replace(/\s+/g, '_');
      const stageSince = opp.stageEnteredAt ?? opp.createdAt;
      const daysInStage = Math.floor((now - stageSince.getTime()) / 86_400_000);
      const threshold = STAGE_STALL_THRESHOLDS[stageKey] ?? 21;

      const recentActivity = await prisma.activity.findFirst({
        where: { tenantId, opportunityId: opp.id, createdAt: { gte: new Date(now - 14 * 86_400_000) } },
        select: { id: true },
      });

      const candidates: Array<{ type: string; riskLevel: string; message: string; daysInStage?: number }> = [];

      if (daysInStage > threshold) {
        const riskLevel = daysInStage > threshold * 2 ? 'CRITICAL' : daysInStage > threshold * 1.5 ? 'HIGH' : 'MEDIUM';
        candidates.push({
          type: 'STAGE_STALL',
          riskLevel,
          daysInStage,
          message: `"${opp.name}" has been in ${opp.stage} for ${daysInStage} days (expected max ${threshold}).`,
        });
      }

      if (opp.expectedCloseDate && opp.expectedCloseDate.getTime() < now) {
        const daysOverdue = Math.floor((now - opp.expectedCloseDate.getTime()) / 86_400_000);
        candidates.push({
          type: 'CLOSE_DATE_SLIPPED',
          riskLevel: daysOverdue > 30 ? 'CRITICAL' : daysOverdue > 14 ? 'HIGH' : 'MEDIUM',
          message: `"${opp.name}" expected close date slipped ${daysOverdue} days ago.`,
        });
      }

      if ((stageKey === 'PROPOSAL' || stageKey === 'NEGOTIATION') && opp.probability < 30) {
        candidates.push({
          type: 'LOW_CONFIDENCE',
          riskLevel: 'HIGH',
          message: `"${opp.name}" is in ${opp.stage} but only ${opp.probability}% probability — forecast confidence mismatch.`,
        });
      }

      if (!recentActivity) {
        candidates.push({
          type: 'NO_ACTIVITY',
          riskLevel: 'MEDIUM',
          message: `"${opp.name}" has had no logged activity in 14+ days.`,
        });
      }

      for (const c of candidates) {
        seenAlertKeys.add(`${opp.id}:${c.type}`);
        const existing = await prisma.pipelineRiskAlert.findFirst({
          where: { tenantId, opportunityId: opp.id, alertType: c.type },
        });
        if (existing) {
          if (existing.status === 'RESOLVED') {
            await prisma.pipelineRiskAlert.update({
              where: { id: existing.id },
              data: { status: 'OPEN', riskLevel: c.riskLevel, message: c.message, daysInStage: c.daysInStage ?? null, resolvedAt: null },
            });
            updated++;
          } else if (existing.riskLevel !== c.riskLevel || existing.message !== c.message) {
            await prisma.pipelineRiskAlert.update({
              where: { id: existing.id },
              data: { riskLevel: c.riskLevel, message: c.message, daysInStage: c.daysInStage ?? null },
            });
            updated++;
          }
        } else {
          await prisma.pipelineRiskAlert.create({
            data: {
              tenantId, orgId: opp.orgId, opportunityId: opp.id,
              alertType: c.type, riskLevel: c.riskLevel, message: c.message,
              daysInStage: c.daysInStage ?? null, status: 'OPEN',
            },
          });
          created++;
          this.eventEmitter.emit('pipeline.deal.at_risk', {
            tenantId, opportunityId: opp.id, alertType: c.type, riskLevel: c.riskLevel, message: c.message,
          });
        }
      }
    }

    // Auto-resolve alerts for deals that no longer meet any risk condition
    // (or have since closed) and were left OPEN/ACKNOWLEDGED.
    const openAlerts = await prisma.pipelineRiskAlert.findMany({
      where: { tenantId, status: { in: ['OPEN', 'ACKNOWLEDGED'] } },
      select: { id: true, opportunityId: true, alertType: true },
    });
    for (const alert of openAlerts) {
      if (!seenAlertKeys.has(`${alert.opportunityId}:${alert.alertType}`)) {
        await prisma.pipelineRiskAlert.update({
          where: { id: alert.id },
          data: { status: 'RESOLVED', resolvedAt: new Date() },
        });
        resolved++;
      }
    }

    return { scanned: opportunities.length, created, updated, resolved };
  }

  async listAlerts(tenantId: string, filters?: { status?: string; riskLevel?: string }) {
    const now = new Date();
    // Snoozed alerts whose snooze window elapsed become OPEN again on read.
    await prisma.pipelineRiskAlert.updateMany({
      where: { tenantId, status: 'SNOOZED', snoozedUntil: { lte: now } },
      data: { status: 'OPEN', snoozedUntil: null },
    });

    return prisma.pipelineRiskAlert.findMany({
      where: {
        tenantId,
        status: filters?.status ?? { in: ['OPEN', 'ACKNOWLEDGED', 'SNOOZED'] },
        ...(filters?.riskLevel ? { riskLevel: filters.riskLevel } : {}),
      },
      include: {
        opportunity: { select: { id: true, name: true, stage: true, amount: true, probability: true, assignedToId: true } },
      },
      orderBy: [{ riskLevel: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async getSummary(tenantId: string) {
    const alerts = await prisma.pipelineRiskAlert.findMany({
      where: { tenantId, status: { in: ['OPEN', 'ACKNOWLEDGED'] } },
      select: { riskLevel: true, alertType: true },
    });
    const byRiskLevel: Record<string, number> = {};
    const byType: Record<string, number> = {};
    for (const a of alerts) {
      byRiskLevel[a.riskLevel] = (byRiskLevel[a.riskLevel] ?? 0) + 1;
      byType[a.alertType] = (byType[a.alertType] ?? 0) + 1;
    }
    return { totalOpen: alerts.length, byRiskLevel, byType };
  }

  async acknowledgeAlert(tenantId: string, alertId: string, userId: string) {
    const alert = await prisma.pipelineRiskAlert.findFirst({ where: { id: alertId, tenantId } });
    if (!alert) throw new NotFoundException('Alert not found');
    if (alert.status === 'RESOLVED') throw new BadRequestException('Cannot acknowledge a resolved alert');
    return prisma.pipelineRiskAlert.update({
      where: { id: alertId },
      data: { status: 'ACKNOWLEDGED', acknowledgedBy: userId, acknowledgedAt: new Date() },
    });
  }

  async snoozeAlert(tenantId: string, alertId: string, dto: SnoozeAlertInput) {
    const alert = await prisma.pipelineRiskAlert.findFirst({ where: { id: alertId, tenantId } });
    if (!alert) throw new NotFoundException('Alert not found');
    if (alert.status === 'RESOLVED') throw new BadRequestException('Cannot snooze a resolved alert');
    return prisma.pipelineRiskAlert.update({
      where: { id: alertId },
      data: { status: 'SNOOZED', snoozedUntil: new Date(Date.now() + dto.days * 86_400_000) },
    });
  }

  async resolveAlert(tenantId: string, alertId: string) {
    const alert = await prisma.pipelineRiskAlert.findFirst({ where: { id: alertId, tenantId } });
    if (!alert) throw new NotFoundException('Alert not found');
    return prisma.pipelineRiskAlert.update({
      where: { id: alertId },
      data: { status: 'RESOLVED', resolvedAt: new Date() },
    });
  }

  async getAlertsForOpportunity(tenantId: string, opportunityId: string) {
    return prisma.pipelineRiskAlert.findMany({
      where: { tenantId, opportunityId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
