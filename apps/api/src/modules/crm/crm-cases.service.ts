import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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

/**
 * Customer service cases (support tickets) with SLA deadline tracking.
 * Cases are optionally linked to a Customer/Contact for full CRM context.
 */
@Injectable()
export class CrmCasesService {
  constructor(private readonly sla: CrmSlaService) {}

  async getCases(tenantId: string, filters: { status?: string; priority?: string; customerId?: string } = {}) {
    const where: Prisma.CaseWhereInput = { tenantId };
    if (filters.status) where.status = filters.status;
    if (filters.priority) where.priority = filters.priority;
    if (filters.customerId) where.customerId = filters.customerId;

    return prisma.case.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true } },
        contact: { select: { id: true, firstName: true, lastName: true } },
        comments: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
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

    const data: Prisma.CaseUpdateInput = { ...dto };
    if (dto.status === 'RESOLVED' || dto.status === 'CLOSED') {
      if (!existing.resolvedAt) data.resolvedAt = new Date();
    }
    return prisma.case.update({ where: { id }, data });
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
}
