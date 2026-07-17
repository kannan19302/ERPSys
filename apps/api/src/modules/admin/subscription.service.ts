import { Injectable } from '@nestjs/common';
import { prisma } from '@unerp/database';

@Injectable()
export class SubscriptionService {
  async getCurrentPlan(tenantId: string) {
    const subscription = await prisma.tenantSubscription.findUnique({
      where: { tenantId },
      include: { plan: true },
    });

    const userCount = await prisma.user.count({ where: { tenantId, status: 'ACTIVE' } });

    if (!subscription) {
      return {
        plan: { name: 'Free', maxUsers: 5, maxStorage: 1024, price: 0, interval: 'monthly' },
        usage: { users: userCount, maxUsers: 5, storageUsed: 0, maxStorage: 1024 },
        status: 'ACTIVE',
      };
    }

    return {
      plan: subscription.plan || { name: 'Free', maxUsers: 5, maxStorage: 1024, price: 0, interval: 'monthly' },
      usage: {
        users: userCount,
        maxUsers: subscription.plan?.maxUsers || 5,
        storageUsed: 0,
        maxStorage: subscription.plan?.maxStorage || 1024,
      },
      status: subscription.status,
      currentPeriodEnd: subscription.endDate,
    };
  }

  async getAvailablePlans() {
    return prisma.saaSPlan.findMany({
      orderBy: { maxUsers: 'asc' },
    });
  }

  async changePlan(tenantId: string, planId: string) {
    const plan = await prisma.saaSPlan.findUnique({ where: { id: planId } });
    if (!plan) {
      throw new Error('Plan not found');
    }

    const subscription = await prisma.tenantSubscription.update({
      where: { tenantId },
      data: { planId },
      include: { plan: true },
    });

    await prisma.billingEvent.create({
      data: {
        tenantId,
        type: 'PLAN_CHANGE',
        amount: 0,
        description: `Plan changed to ${plan.name}`,
        metadata: { planId, planName: plan.name },
      },
    });

    return subscription;
  }

  async updateSeats(tenantId: string, seats: number) {
    const subscription = await prisma.tenantSubscription.findUnique({
      where: { tenantId },
      include: { plan: true },
    });

    if (!subscription) {
      throw new Error('No active subscription found');
    }

    await prisma.billingEvent.create({
      data: {
        tenantId,
        type: 'SEAT_UPDATE',
        amount: 0,
        description: `Seats updated to ${seats}`,
        metadata: { seats, planId: subscription.planId },
      },
    });

    return { seats, subscription };
  }

  async getBillingHistory(tenantId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [events, total] = await Promise.all([
      prisma.billingEvent.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.billingEvent.count({ where: { tenantId } }),
    ]);

    return {
      data: events,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
