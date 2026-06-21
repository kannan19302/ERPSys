import { Injectable } from '@nestjs/common';
import { prisma } from '@unerp/database';

@Injectable()
export class DelegationService {

  /* ── List ───────────────────────────────────── */

  async list(tenantId: string) {
    const delegations = await prisma.delegation.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });

    // Enrich with user names
    const userIds = new Set<string>();
    for (const d of delegations) {
      userIds.add(d.delegatorId);
      userIds.add(d.delegateId);
    }

    const users = await prisma.user.findMany({
      where: { id: { in: Array.from(userIds) } },
      select: { id: true, firstName: true, lastName: true, email: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    return delegations.map((d) => ({
      ...d,
      delegator: userMap.get(d.delegatorId) || null,
      delegate: userMap.get(d.delegateId) || null,
    }));
  }

  /* ── Create ─────────────────────────────────── */

  async create(
    tenantId: string,
    data: {
      delegatorId: string;
      delegateId: string;
      type: string;
      workflowId?: string;
      reason?: string;
      startDate: string | Date;
      endDate?: string | Date;
    },
  ) {
    return prisma.delegation.create({
      data: {
        tenantId,
        delegatorId: data.delegatorId,
        delegateId: data.delegateId,
        type: data.type,
        workflowId: data.workflowId,
        reason: data.reason,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        status: 'ACTIVE',
      },
    });
  }

  /* ── Update ─────────────────────────────────── */

  async update(tenantId: string, id: string, data: Record<string, any>) {
    const existing = await prisma.delegation.findFirst({ where: { id, tenantId } });
    if (!existing) throw new Error('Delegation not found');

    const updateData: Record<string, any> = { ...data };
    if (updateData.startDate) updateData.startDate = new Date(updateData.startDate);
    if (updateData.endDate) updateData.endDate = new Date(updateData.endDate);

    return prisma.delegation.update({
      where: { id },
      data: updateData,
    });
  }

  /* ── Revoke ─────────────────────────────────── */

  async revoke(tenantId: string, id: string) {
    const existing = await prisma.delegation.findFirst({ where: { id, tenantId } });
    if (!existing) throw new Error('Delegation not found');

    return prisma.delegation.update({
      where: { id },
      data: { status: 'REVOKED' },
    });
  }

  /* ── Get Active Delegate For User ──────────── */

  async getActiveDelegateFor(tenantId: string, userId: string) {
    const now = new Date();
    const delegation = await prisma.delegation.findFirst({
      where: {
        tenantId,
        delegatorId: userId,
        status: 'ACTIVE',
        startDate: { lte: now },
        OR: [
          { endDate: null },
          { endDate: { gte: now } },
        ],
      },
    });

    if (!delegation) return null;

    const delegate = await prisma.user.findUnique({
      where: { id: delegation.delegateId },
      select: { id: true, firstName: true, lastName: true, email: true },
    });

    return { delegation, delegate };
  }

  /* ── Expire Overdue ─────────────────────────── */

  async expireOverdue(tenantId: string) {
    const now = new Date();
    const result = await prisma.delegation.updateMany({
      where: {
        tenantId,
        status: 'ACTIVE',
        endDate: { lt: now, not: null },
      },
      data: { status: 'EXPIRED' },
    });
    return { expired: result.count };
  }
}
