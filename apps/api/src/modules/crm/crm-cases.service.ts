import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { Prisma } from '@prisma/client';
import { resolveOrgId } from './crm-shared';
import { CrmSlaService } from './crm-sla.service';

export interface CreateCaseInput {
  subject: string;
  description?: string;
  customerId?: string;
  contactId?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  channel?: 'EMAIL' | 'PHONE' | 'CHAT' | 'WEB' | 'API';
  slaHours?: number;
  assignedToId?: string;
}

export interface UpdateCaseInput {
  subject?: string;
  description?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status?: 'OPEN' | 'IN_PROGRESS' | 'WAITING_ON_CUSTOMER' | 'RESOLVED' | 'CLOSED';
  assignedToId?: string;
}

// Default SLA response windows by priority, used when the caller doesn't
// specify an explicit slaHours override.
const DEFAULT_SLA_HOURS: Record<string, number> = {
  URGENT: 4,
  HIGH: 8,
  MEDIUM: 24,
  LOW: 72,
};

// Case status lifecycle (schema.prisma `Case.status` comment): OPEN,
// IN_PROGRESS, WAITING_ON_CUSTOMER, RESOLVED, CLOSED. CLOSED is terminal via
// the ordinary status PATCH — reopening a closed case is treated as a
// distinct business action (it should be explicit, not a silent status flip),
// so CLOSED -> anything is only reachable via reopenCase().
const CASE_STATUS_TRANSITIONS: Record<string, string[]> = {
  OPEN: ['IN_PROGRESS', 'WAITING_ON_CUSTOMER', 'RESOLVED', 'CLOSED'],
  IN_PROGRESS: ['OPEN', 'WAITING_ON_CUSTOMER', 'RESOLVED', 'CLOSED'],
  WAITING_ON_CUSTOMER: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'],
  RESOLVED: ['CLOSED', 'IN_PROGRESS'],
  CLOSED: [],
};

/**
 * Customer service cases (support tickets) with SLA deadline tracking.
 * Cases are optionally linked to a Customer/Contact for full CRM context.
 */
@Injectable()
export class CrmCasesService {
  constructor(@Inject(CrmSlaService) private readonly sla: CrmSlaService) {}

  async getCases(
    tenantId: string,
    filters: {
      status?: string;
      priority?: string;
      customerId?: string;
      page?: number;
      limit?: number;
      search?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    } = {},
  ) {
    const where: Prisma.CaseWhereInput = { tenantId };
    if (filters.status) where.status = filters.status;
    if (filters.priority) where.priority = filters.priority;
    if (filters.customerId) where.customerId = filters.customerId;
    if (filters.search) {
      where.OR = [
        { subject: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { caseNumber: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const validSortFields = ['caseNumber', 'subject', 'priority', 'createdAt', 'slaDeadline'];
    const sortBy = filters.sortBy && validSortFields.includes(filters.sortBy) ? filters.sortBy : 'priority';
    const sortOrder = filters.sortOrder === 'asc' ? 'asc' : 'desc';

    const orderBy: Prisma.CaseOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    if (filters && (filters.page !== undefined || filters.limit !== undefined)) {
      const page = filters.page ? Math.max(1, filters.page) : 1;
      const limit = filters.limit ? Math.max(1, filters.limit) : 20;
      const skip = (page - 1) * limit;

      const [data, totalCount] = await Promise.all([
        prisma.case.findMany({
          where,
          skip,
          take: limit,
          orderBy,
          include: {
            customer: { select: { id: true, name: true } },
            contact: { select: { id: true, firstName: true, lastName: true } },
            comments: { orderBy: { createdAt: 'desc' }, take: 1 },
          },
        }),
        prisma.case.count({ where }),
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      return {
        data,
        totalCount,
        page,
        limit,
        totalPages,
      };
    }

    return prisma.case.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true } },
        contact: { select: { id: true, firstName: true, lastName: true } },
        comments: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: filters.sortBy ? orderBy : [{ priority: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async getCaseById(tenantId: string, id: string) {
    const found = await prisma.case.findFirst({
      where: { id, tenantId },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        contact: { select: { id: true, firstName: true, lastName: true, email: true } },
        comments: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!found) throw new NotFoundException('Case not found');
    return found;
  }

  async createCase(tenantId: string, orgId: string, dto: CreateCaseInput) {
    if (!dto.subject) throw new BadRequestException('subject is required');
    const resolvedOrgId = await resolveOrgId(tenantId, orgId);

    const priority = dto.priority || 'MEDIUM';
    const slaHours = dto.slaHours ?? DEFAULT_SLA_HOURS[priority] ?? 24;
    const slaDeadline = new Date(Date.now() + slaHours * 60 * 60 * 1000);

    const count = await prisma.case.count({ where: { tenantId } });
    const caseNumber = `CASE-${String(count + 1).padStart(5, '0')}`;

    const created = await prisma.case.create({
      data: {
        tenantId,
        orgId: resolvedOrgId,
        caseNumber,
        subject: dto.subject,
        description: dto.description || null,
        customerId: dto.customerId || null,
        contactId: dto.contactId || null,
        priority,
        channel: dto.channel || 'EMAIL',
        slaDeadline,
        assignedToId: dto.assignedToId || null,
      },
    });
    await this.sla.applyToCase(tenantId, created.id);
    return created;
  }

  async updateCase(tenantId: string, id: string, dto: UpdateCaseInput) {
    const existing = await prisma.case.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Case not found');

    if (dto.status && dto.status !== existing.status) {
      const allowed = CASE_STATUS_TRANSITIONS[existing.status] ?? [];
      if (!allowed.includes(dto.status)) {
        if (existing.status === 'CLOSED') {
          throw new BadRequestException(
            'Cannot change the status of a CLOSED case via a plain update — use POST /crm/cases/:id/reopen to explicitly reopen it.',
          );
        }
        throw new BadRequestException(
          `Cannot transition case from ${existing.status} to ${dto.status}. Allowed transitions from ${existing.status}: ${allowed.length ? allowed.join(', ') : 'none (terminal status)'}.`,
        );
      }
    }

    const data: Prisma.CaseUpdateInput = { ...dto };
    if (dto.status === 'RESOLVED' || dto.status === 'CLOSED') {
      if (!existing.resolvedAt) data.resolvedAt = new Date();
    }
    return prisma.case.update({ where: { id }, data });
  }

  /**
   * Explicit reopen action for a CLOSED case — the only path back to OPEN
   * from a terminal state. Clears resolvedAt so SLA/resolution-time metrics
   * reflect the new open period rather than the original (now-invalid) close.
   */
  async reopenCase(tenantId: string, id: string) {
    const existing = await prisma.case.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Case not found');
    if (existing.status !== 'CLOSED') {
      throw new BadRequestException('Only a CLOSED case can be reopened');
    }
    return prisma.case.update({
      where: { id },
      data: { status: 'OPEN', resolvedAt: null },
    });
  }

  async addComment(tenantId: string, caseId: string, dto: { body: string; authorId?: string; isInternal?: boolean }) {
    const existing = await prisma.case.findFirst({ where: { id: caseId, tenantId } });
    if (!existing) throw new NotFoundException('Case not found');
    if (!dto.body) throw new BadRequestException('body is required');

    const comment = await prisma.caseComment.create({
      data: {
        tenantId,
        caseId,
        authorId: dto.authorId || null,
        body: dto.body,
        isInternal: dto.isInternal ?? false,
      },
    });

    // First non-internal comment marks the case's first-response time (an
    // SLA metric distinct from resolution: "did we acknowledge in time?").
    if (!dto.isInternal && !existing.firstResponseAt) {
      await prisma.case.update({ where: { id: caseId }, data: { firstResponseAt: new Date() } });
    }

    return comment;
  }

  /**
   * SLA compliance dashboard: cases whose deadline has passed without
   * resolution ("breached"), and cases still open but within their window.
   */
  async getSlaStatus(tenantId: string) {
    const openCases = await prisma.case.findMany({
      where: { tenantId, status: { notIn: ['RESOLVED', 'CLOSED'] } },
      select: { id: true, caseNumber: true, subject: true, priority: true, status: true, slaDeadline: true, createdAt: true },
    });

    const now = new Date();
    const breached = openCases.filter((c) => c.slaDeadline && c.slaDeadline < now);
    const atRisk = openCases.filter((c) => c.slaDeadline && c.slaDeadline >= now && c.slaDeadline.getTime() - now.getTime() < 2 * 60 * 60 * 1000);
    const onTrack = openCases.filter((c) => !breached.includes(c) && !atRisk.includes(c));

    return {
      totalOpen: openCases.length,
      breached: breached.length,
      atRisk: atRisk.length,
      onTrack: onTrack.length,
      breachedCases: breached,
      atRiskCases: atRisk,
    };
  }

  /**
   * Case 360 view: the case + customer/contact context + comments, merged
   * with SLA rollup metrics (first-response and resolution vs. deadline).
   * Replaces having to separately call getCaseById() + getSlaStatus() to
   * understand a single case's SLA posture.
   */
  async getCaseSummary(tenantId: string, id: string) {
    const found = await prisma.case.findFirst({
      where: { id, tenantId },
      include: {
        customer: { select: { id: true, name: true, email: true, phone: true } },
        contact: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        comments: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!found) throw new NotFoundException('Case not found');

    const now = new Date();
    const isOpen = !['RESOLVED', 'CLOSED'].includes(found.status);

    const firstResponseDeadline = found.slaFirstResponseAt ?? found.slaDeadline;
    const firstResponseMet = found.firstResponseAt && firstResponseDeadline
      ? found.firstResponseAt <= firstResponseDeadline
      : null;
    const timeToFirstResponseMs = found.firstResponseAt
      ? found.firstResponseAt.getTime() - found.createdAt.getTime()
      : null;

    const resolveDeadline = found.slaResolveBy ?? found.slaDeadline;
    const resolutionMet = found.resolvedAt && resolveDeadline
      ? found.resolvedAt <= resolveDeadline
      : null;
    const timeToResolutionMs = found.resolvedAt
      ? found.resolvedAt.getTime() - found.createdAt.getTime()
      : null;

    const isBreached = isOpen && !!found.slaDeadline && found.slaDeadline < now;
    const isAtRisk = isOpen && !isBreached && !!found.slaDeadline
      && found.slaDeadline.getTime() - now.getTime() < 2 * 60 * 60 * 1000;

    return {
      case: found,
      comments: found.comments,
      sla: {
        slaDeadline: found.slaDeadline,
        slaFirstResponseAt: found.slaFirstResponseAt,
        slaResolveBy: found.slaResolveBy,
        slaBreached: found.slaBreached || isBreached,
        isOpen,
        isAtRisk,
        firstResponseAt: found.firstResponseAt,
        firstResponseMet,
        timeToFirstResponseMs,
        resolvedAt: found.resolvedAt,
        resolutionMet,
        timeToResolutionMs,
      },
      metrics: {
        commentCount: found.comments.length,
        internalCommentCount: found.comments.filter((c) => c.isInternal).length,
        daysSinceCreation: Math.floor((now.getTime() - found.createdAt.getTime()) / (1000 * 60 * 60 * 24)),
      },
    };
  }

  async bulkUpdateCaseStatus(tenantId: string, ids: string[], status: string) {
    const validStatuses = ['OPEN', 'IN_PROGRESS', 'WAITING_ON_CUSTOMER', 'RESOLVED', 'CLOSED'];
    if (!validStatuses.includes(status)) {
      throw new BadRequestException(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }
    const result = await prisma.case.updateMany({
      where: { id: { in: ids }, tenantId },
      data: { status },
    });
    return { updated: result.count, status };
  }

  async exportCases(
    tenantId: string,
    query?: { search?: string; status?: string; priority?: string },
  ) {
    const where: Prisma.CaseWhereInput = { tenantId };
    if (query?.status) where.status = query.status;
    if (query?.priority) where.priority = query.priority;
    if (query?.search) {
      where.OR = [
        { subject: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { caseNumber: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    return prisma.case.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, caseNumber: true, subject: true, description: true,
        priority: true, status: true, channel: true, createdAt: true, updatedAt: true,
        slaDeadline: true, resolvedAt: true,
      },
    });
  }
}
