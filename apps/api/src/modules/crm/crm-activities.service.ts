import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { Prisma } from '@prisma/client';
import { CreateActivityInput, CreateEmailTemplateInput, UpdateEmailTemplateInput } from '@unerp/shared';
import { CrmLeadsService } from './crm-leads.service';

/**
 * Activities & email templates. Touching a lead-linked activity triggers a
 * lead rescore, so this service depends on the leaf CrmLeadsService.
 */
@Injectable()
export class CrmActivitiesService {
  constructor(
    @Inject(CrmLeadsService)
    private readonly leadsService: CrmLeadsService,
  ) {}

  async getActivities(tenantId: string, leadId?: string, opportunityId?: string, customerId?: string) {
    const where: Prisma.ActivityWhereInput = { tenantId };
    if (leadId) where.leadId = leadId;
    if (opportunityId) where.opportunityId = opportunityId;
    if (customerId) where.customerId = customerId;
    return prisma.activity.findMany({
      where,
      include: { lead: { select: { id: true, firstName: true, lastName: true } }, contact: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createActivity(tenantId: string, orgId: string, dto: CreateActivityInput) {
    let resolvedOrgId = orgId;
    if (!orgId || orgId === 'org-system-default') {
      const org = await prisma.organization.findFirst({ where: { tenantId } });
      if (!org) throw new BadRequestException('No Organization registered');
      resolvedOrgId = org.id;
    }
    const act = await prisma.activity.create({
      data: {
        tenantId, orgId: resolvedOrgId,
        type: dto.type, subject: dto.subject,
        description: dto.description || null,
        leadId: dto.leadId || null,
        opportunityId: dto.opportunityId || null,
        customerId: dto.customerId || null,
        contactId: dto.contactId || null,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        assignedToId: dto.assignedToId || null,
      },
    });
    if (dto.leadId) {
      await this.leadsService.recalculateLeadScore(tenantId, dto.leadId);
    }
    return act;
  }

  async completeActivity(tenantId: string, id: string) {
    const existing = await prisma.activity.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Activity not found');
    const updated = await prisma.activity.update({
      where: { id },
      data: { completedAt: new Date() },
    });
    if (existing.leadId) {
      await this.leadsService.recalculateLeadScore(tenantId, existing.leadId);
    }
    return updated;
  }

  async getEmailTemplates(tenantId: string) {
    return prisma.emailTemplate.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });
  }

  async createEmailTemplate(tenantId: string, dto: CreateEmailTemplateInput) {
    return prisma.emailTemplate.create({
      data: {
        tenantId,
        name: dto.name,
        category: dto.category || 'GENERAL',
        subject: dto.subject,
        body: dto.body,
        variables: dto.variables as Prisma.InputJsonValue || [],
      },
    });
  }

  async updateEmailTemplate(tenantId: string, id: string, dto: UpdateEmailTemplateInput) {
    const existing = await prisma.emailTemplate.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Email template not found');
    return prisma.emailTemplate.update({ where: { id }, data: dto as Prisma.EmailTemplateUpdateInput });
  }

  async deleteEmailTemplate(tenantId: string, id: string) {
    const existing = await prisma.emailTemplate.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Email template not found');
    return prisma.emailTemplate.delete({ where: { id } });
  }
}
