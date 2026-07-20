import { ForbiddenException, BadRequestException, Injectable } from '@nestjs/common';
import { prisma } from '@unerp/database';

// Roles allowed to create a delegation on someone else's behalf. The Role
// model has no numeric hierarchy/level field (checked packages/database/prisma/schema.prisma),
// so "caller's privilege level relative to what's being delegated" is
// approximated as: the caller is the delegator themselves, or the caller
// holds one of these elevated role names.
const ELEVATED_ROLES = new Set(['SUPER_ADMIN', 'ADMIN']);

/**
 * Delegation rules as consumed from the SaaS Portal home. Consolidates
 * `/admin/delegations` (`modules/admin/delegation.service.ts`) into
 * `/saas-portal/delegations`. Independent implementation against the same
 * `Delegation` Prisma model, not a cross-module delegate — see
 * services/security.service.ts header for the general rationale (module
 * boundary hard-block, no event/port abstraction for this read-heavy admin
 * data yet).
 */
@Injectable()
export class SaasPortalDelegationService {
  async list(tenantId: string) {
    const delegations = await prisma.delegation.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' } });

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

  async create(
    tenantId: string,
    callerUserId: string,
    callerRoles: string[],
    data: { delegatorId: string; delegateId: string; type: string; workflowId?: string; reason?: string; startDate: string | Date; endDate?: string | Date },
  ) {
    // Authorization: only the delegator themselves, or an elevated role, may
    // create a delegation — otherwise any user with admin.delegations.create
    // could hand their own privileges to an arbitrary third party.
    const isSelfDelegating = callerUserId === data.delegatorId;
    const isElevated = callerRoles.some((r) => ELEVATED_ROLES.has(r));
    if (!isSelfDelegating && !isElevated) {
      throw new ForbiddenException('You may only create delegations for yourself unless you hold an elevated role');
    }

    // Both parties must belong to the calling tenant (blocks cross-tenant
    // delegation creation via a spoofed delegatorId/delegateId).
    const [delegator, delegate] = await Promise.all([
      prisma.user.findFirst({ where: { id: data.delegatorId, tenantId }, select: { id: true } }),
      prisma.user.findFirst({ where: { id: data.delegateId, tenantId }, select: { id: true } }),
    ]);
    if (!delegator || !delegate) {
      throw new BadRequestException('delegatorId and delegateId must both belong to your tenant');
    }

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

  async update(
    tenantId: string,
    id: string,
    data: { type?: string; workflowId?: string; reason?: string; startDate?: string | Date; endDate?: string | Date; status?: 'ACTIVE' | 'REVOKED' | 'EXPIRED' },
  ) {
    const existing = await prisma.delegation.findFirst({ where: { id, tenantId } });
    if (!existing) throw new Error('Delegation not found');

    // Whitelist only client-updatable fields — tenantId/delegatorId/delegateId
    // are never taken from the request body (mass-assignment guard).
    const updateData: Record<string, unknown> = {};
    if (data.type !== undefined) updateData.type = data.type;
    if (data.workflowId !== undefined) updateData.workflowId = data.workflowId;
    if (data.reason !== undefined) updateData.reason = data.reason;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.startDate !== undefined) updateData.startDate = new Date(data.startDate);
    if (data.endDate !== undefined) updateData.endDate = new Date(data.endDate);

    return prisma.delegation.update({ where: { id, tenantId }, data: updateData });
  }

  async revoke(tenantId: string, id: string) {
    const existing = await prisma.delegation.findFirst({ where: { id, tenantId } });
    if (!existing) throw new Error('Delegation not found');
    return prisma.delegation.update({ where: { id }, data: { status: 'REVOKED' } });
  }
}
