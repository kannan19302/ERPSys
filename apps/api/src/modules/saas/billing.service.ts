import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { prisma } from '@unerp/database';

@Injectable()
export class BillingService {

  async createCheckoutSession(
    tenantId: string,
    planId: string,
    successUrl: string,
  ) {
    const plan = await prisma.saaSPlan.findUnique({ where: { id: planId } });
    if (!plan) throw new NotFoundException('Plan not found');

    // In production: Stripe.checkout.sessions.create(...)
    const sessionId = `cs_${Date.now()}_${tenantId.slice(0, 8)}`;
    return { url: `${successUrl}?session_id=${sessionId}`, sessionId };
  }

  async getCurrentSubscription(tenantId: string) {
    const sub = await prisma.tenantSubscription.findFirst({
      where: { tenantId },
      include: { plan: true },
    });

    if (!sub) {
      const freePlan = await prisma.saaSPlan.findFirst({ where: { name: 'Free' } });
      return {
        plan: freePlan || { name: 'Free', maxUsers: 5, maxStorage: 1 },
        status: 'ACTIVE',
        startDate: null,
        endDate: null,
      };
    }

    return {
      id: sub.id,
      plan: sub.plan,
      status: sub.status,
      startDate: sub.startDate,
      endDate: sub.endDate,
    };
  }

  async changePlan(tenantId: string, newPlanId: string) {
    const newPlan = await prisma.saaSPlan.findUnique({ where: { id: newPlanId } });
    if (!newPlan) throw new NotFoundException('Plan not found');

    const existingSub = await prisma.tenantSubscription.findFirst({ where: { tenantId } });

    if (existingSub) {
      return prisma.tenantSubscription.update({
        where: { id: existingSub.id },
        data: { planId: newPlanId },
        include: { plan: true },
      });
    }

    return prisma.tenantSubscription.create({
      data: {
        tenantId,
        planId: newPlanId,
        status: 'ACTIVE',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      include: { plan: true },
    });
  }

  async cancelSubscription(tenantId: string) {
    const sub = await prisma.tenantSubscription.findFirst({ where: { tenantId } });
    if (!sub) throw new BadRequestException('No active subscription');

    return prisma.tenantSubscription.update({
      where: { id: sub.id },
      data: { status: 'CANCELLED' },
    });
  }

  async getUsageSummary(tenantId: string) {
    const records = await prisma.usageRecord.findMany({ where: { tenantId } });
    const sub = await prisma.tenantSubscription.findFirst({
      where: { tenantId },
      include: { plan: true },
    });

    const userCount = await prisma.user.count({ where: { tenantId } });

    return {
      plan: sub?.plan?.name || 'Free',
      users: {
        current: userCount,
        limit: sub?.plan?.maxUsers || 5,
        pct: Math.round((userCount / (sub?.plan?.maxUsers || 5)) * 100),
      },
      storage: {
        current: records.find((r) => r.metric === 'storage_gb')?.currentValue || 0,
        limit: records.find((r) => r.metric === 'storage_gb')?.limitValue || sub?.plan?.maxStorage || 1,
      },
      metrics: records.map((r) => ({
        metric: r.metric,
        current: r.currentValue,
        limit: r.limitValue,
        pct: r.limitValue > 0 ? Math.round((r.currentValue / r.limitValue) * 100) : 0,
      })),
    };
  }

  async recordUsage(tenantId: string, metric: string, increment: number) {
    const existing = await prisma.usageRecord.findUnique({
      where: { tenantId_metric: { tenantId, metric } },
    });

    if (existing) {
      return prisma.usageRecord.update({
        where: { id: existing.id },
        data: { currentValue: existing.currentValue + increment },
      });
    }

    return prisma.usageRecord.create({
      data: { tenantId, metric, currentValue: increment, limitValue: 0 },
    });
  }

  async processStripeWebhook(event: { type: string; data: { object: Record<string, unknown> } }) {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const tenantId = session.client_reference_id as string;
      const planId = (session.metadata as Record<string, string>)?.planId;
      if (tenantId && planId) {
        await this.changePlan(tenantId, planId);
      }
    }
    return { received: true };
  }
}
