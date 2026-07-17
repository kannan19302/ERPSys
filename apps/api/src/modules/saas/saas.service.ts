import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';

@Injectable()
export class SaasService {
  async getPlans() {
    return prisma.saaSPlan.findMany({
      orderBy: { maxUsers: 'asc' },
    });
  }

  async getSubscription(tenantId: string) {
    const sub = await prisma.tenantSubscription.findFirst({
      where: { tenantId },
      include: { plan: true },
    });
    if (!sub) throw new NotFoundException('No active subscription found');
    return sub;
  }

  async getUsageRecords(tenantId: string) {
    return prisma.usageRecord.findMany({
      where: { tenantId },
      orderBy: { metric: 'asc' },
    });
  }

  async updateUsage(tenantId: string, metric: string, value: number, limit: number) {
    const existing = await prisma.usageRecord.findUnique({
      where: { tenantId_metric: { tenantId, metric } },
    });

    if (existing) {
      return prisma.usageRecord.update({
        where: { id: existing.id },
        data: { currentValue: value, limitValue: limit },
      });
    }

    return prisma.usageRecord.create({
      data: {
        tenantId,
        metric,
        currentValue: value,
        limitValue: limit,
      },
    });
  }

  async handleStripeWebhook(event: { type: string; data: { object: unknown } }) {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const tenantId = (session as Record<string, unknown>).client_reference_id as string;
      const stripePriceId = ((session as Record<string, unknown>).metadata as Record<string, unknown>)?.stripePriceId as string;

      if (!tenantId || !stripePriceId) {
        throw new BadRequestException('Missing tenantId or stripePriceId metadata');
      }

      const plan = await prisma.saaSPlan.findUnique({
        where: { stripePriceId },
      });

      if (!plan) throw new NotFoundException('Matching SaaS plan not found');

      // Create or update subscription
      const existingSub = await prisma.tenantSubscription.findFirst({
        where: { tenantId },
      });

      if (existingSub) {
        await prisma.tenantSubscription.update({
          where: { id: existingSub.id },
          data: {
            planId: plan.id,
            status: 'ACTIVE',
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        });
      } else {
        await prisma.tenantSubscription.create({
          data: {
            tenantId,
            planId: plan.id,
            status: 'ACTIVE',
            startDate: new Date(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        });
      }

      // Also reset usage records
      await this.updateUsage(tenantId, 'USERS_COUNT', 1, plan.maxUsers);
      await this.updateUsage(tenantId, 'STORAGE_MB', 0, plan.maxStorage);
      await this.updateUsage(tenantId, 'API_CALLS_COUNT', 0, 10000);

      return { success: true, message: 'Subscription successfully upgraded via webhook' };
    }

    return { received: true };
  }

  async getInstalledApps(tenantId: string) {
    const installed = await prisma.installedApp.findMany({
      where: { tenantId },
      select: { appId: true, appSlug: true },
    });
    const list = new Set<string>();
    for (const i of installed) {
      if (i.appId) list.add(i.appId);
      if (i.appSlug) list.add(i.appSlug);
    }
    return Array.from(list);
  }

  async installApp(tenantId: string, appId: string) {
    return prisma.installedApp.upsert({
      where: {
        tenantId_appId: { tenantId, appId },
      },
      update: {},
      create: {
        tenantId,
        appId,
      },
    });
  }

  async uninstallApp(tenantId: string, appId: string) {
    return prisma.installedApp.deleteMany({
      where: { tenantId, appId },
    });
  }
}
