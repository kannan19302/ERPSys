import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { Prisma } from '@prisma/client';
import {
  CreateCampaignInput,
  CreateCrmWorkflowRuleInput, UpdateCrmWorkflowRuleInput,
  CreateEmailSequenceInput, EnrollSequenceInput,
  CreateWebToLeadFormInput, UpdateWebToLeadFormInput, SubmitWebFormInput,
  CreateSavedReportInput,
} from '@unerp/shared';
import { resolveOrgId } from './crm-shared';
import { CrmLeadsService } from './crm-leads.service';

/**
 * Marketing & automation: campaigns, workflow rules, email sequences,
 * web-to-lead forms, and saved-report definitions. Web-form submissions create
 * a lead and rescore it, hence the CrmLeadsService dependency.
 */
@Injectable()
export class CrmMarketingService {
  constructor(
    @Inject(CrmLeadsService)
    private readonly leadsService: CrmLeadsService,
  ) {}

  // ── CAMPAIGNS ─────────────────────────────────

  async getCampaigns(tenantId: string) {
    const campaigns = await prisma.campaign.findMany({
      where: { tenantId, deletedAt: null },
      include: {
        leads: {
          select: {
            id: true,
            status: true,
            opportunities: {
              select: {
                id: true,
                stage: true,
                amount: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return campaigns.map((c) => {
      const leads = c.leads;
      const leadCount = leads.length;

      const opps = leads.flatMap((l) => l.opportunities);
      const opportunityCount = opps.length;

      const wonOpps = opps.filter((o) => o.stage === 'CLOSED_WON');
      const wonCount = wonOpps.length;

      const conversionRate = leadCount > 0 ? (wonCount / leadCount) * 100 : 0;
      const actualCost = Number(c.actualCost);
      const budget = Number(c.budget);

      return {
        id: c.id,
        name: c.name,
        status: c.status,
        type: c.type,
        budget,
        actualCost,
        notes: c.notes,
        leadCount,
        opportunityCount,
        wonCount,
        conversionRate: Number(conversionRate.toFixed(2)),
        createdAt: c.createdAt,
      };
    });
  }

  async createCampaign(tenantId: string, orgId: string, dto: CreateCampaignInput, createdBy: string) {
    let resolvedOrgId = orgId;
    if (!orgId || orgId === 'org-system-default') {
      const org = await prisma.organization.findFirst({ where: { tenantId } });
      if (!org) throw new BadRequestException('No Organization registered');
      resolvedOrgId = org.id;
    }

    const existing = await prisma.campaign.findFirst({
      where: { tenantId, orgId: resolvedOrgId, name: dto.name, deletedAt: null },
    });
    if (existing) throw new BadRequestException(`Campaign with name "${dto.name}" already exists.`);

    return prisma.campaign.create({
      data: {
        tenantId,
        orgId: resolvedOrgId,
        name: dto.name,
        status: dto.status,
        type: dto.type,
        budget: new Prisma.Decimal(dto.budget || 0),
        actualCost: new Prisma.Decimal(dto.actualCost || 0),
        notes: dto.notes || null,
        createdBy,
      },
    });
  }

  // ── WORKFLOW RULES ────────────────────────────

  async getWorkflowRules(tenantId: string) {
    return prisma.crmWorkflowRule.findMany({ where: { tenantId, deletedAt: null }, orderBy: { createdAt: 'desc' } });
  }

  async createWorkflowRule(tenantId: string, orgId: string, dto: CreateCrmWorkflowRuleInput, createdBy: string) {
    const resolvedOrgId = await resolveOrgId(tenantId, orgId);
    return prisma.crmWorkflowRule.create({
      data: {
        tenantId, orgId: resolvedOrgId, name: dto.name,
        entity: dto.entity, trigger: dto.trigger,
        conditions: dto.conditions as Prisma.InputJsonValue,
        actions: dto.actions as Prisma.InputJsonValue,
        isActive: dto.isActive ?? true, createdBy,
      },
    });
  }

  async updateWorkflowRule(tenantId: string, id: string, dto: UpdateCrmWorkflowRuleInput) {
    const existing = await prisma.crmWorkflowRule.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!existing) throw new NotFoundException('Workflow rule not found');
    return prisma.crmWorkflowRule.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.entity !== undefined && { entity: dto.entity }),
        ...(dto.trigger !== undefined && { trigger: dto.trigger }),
        ...(dto.conditions !== undefined && { conditions: dto.conditions as Prisma.InputJsonValue }),
        ...(dto.actions !== undefined && { actions: dto.actions as Prisma.InputJsonValue }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  async toggleWorkflowRule(tenantId: string, id: string) {
    const existing = await prisma.crmWorkflowRule.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!existing) throw new NotFoundException('Workflow rule not found');
    return prisma.crmWorkflowRule.update({ where: { id }, data: { isActive: !existing.isActive } });
  }

  async deleteWorkflowRule(tenantId: string, id: string) {
    const existing = await prisma.crmWorkflowRule.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Workflow rule not found');
    return prisma.crmWorkflowRule.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  // ── EMAIL SEQUENCES ───────────────────────────

  async getEmailSequences(tenantId: string) {
    return prisma.emailSequence.findMany({
      where: { tenantId, deletedAt: null },
      include: { _count: { select: { steps: true, enrollments: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createEmailSequence(tenantId: string, orgId: string, dto: CreateEmailSequenceInput, createdBy: string) {
    const resolvedOrgId = await resolveOrgId(tenantId, orgId);
    return prisma.emailSequence.create({
      data: {
        tenantId, orgId: resolvedOrgId, name: dto.name,
        description: dto.description || null, createdBy,
        steps: { create: dto.steps.map((s, i) => ({ templateId: s.templateId, delayDays: s.delayDays || 1, sortOrder: s.sortOrder ?? i })) },
      },
      include: { steps: { orderBy: { sortOrder: 'asc' } } },
    });
  }

  async enrollInSequence(tenantId: string, sequenceId: string, dto: EnrollSequenceInput) {
    const seq = await prisma.emailSequence.findFirst({ where: { id: sequenceId, tenantId, deletedAt: null, isActive: true } });
    if (!seq) throw new NotFoundException('Sequence not found or inactive');
    if (!dto.contactId && !dto.leadId) throw new BadRequestException('Must provide contactId or leadId');
    const firstStep = await prisma.emailSequenceStep.findFirst({ where: { sequenceId }, orderBy: { sortOrder: 'asc' } });
    const nextSendAt = new Date();
    if (firstStep) nextSendAt.setDate(nextSendAt.getDate() + firstStep.delayDays);
    return prisma.emailSequenceEnrollment.create({
      data: { tenantId, sequenceId, contactId: dto.contactId || null, leadId: dto.leadId || null, nextSendAt },
    });
  }

  async pauseEnrollment(tenantId: string, enrollmentId: string) {
    const enrollment = await prisma.emailSequenceEnrollment.findFirst({ where: { id: enrollmentId, tenantId } });
    if (!enrollment) throw new NotFoundException('Enrollment not found');
    const newStatus = enrollment.status === 'PAUSED' ? 'ACTIVE' : 'PAUSED';
    return prisma.emailSequenceEnrollment.update({ where: { id: enrollmentId }, data: { status: newStatus } });
  }

  async deleteEmailSequence(tenantId: string, id: string) {
    const existing = await prisma.emailSequence.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Sequence not found');
    return prisma.emailSequence.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  // ── WEB-TO-LEAD FORMS ─────────────────────────

  async getWebForms(tenantId: string) {
    return prisma.webToLeadForm.findMany({ where: { tenantId, deletedAt: null }, orderBy: { createdAt: 'desc' } });
  }

  async createWebForm(tenantId: string, orgId: string, dto: CreateWebToLeadFormInput) {
    const resolvedOrgId = await resolveOrgId(tenantId, orgId);
    const form = await prisma.webToLeadForm.create({
      data: {
        tenantId, orgId: resolvedOrgId, name: dto.name,
        fields: dto.fields as Prisma.InputJsonValue,
        settings: dto.settings as Prisma.InputJsonValue,
      },
    });
    const embedCode = `<form action="/api/v1/crm/forms/${form.id}/submit" method="POST">${(dto.fields as Array<{ name: string; label: string; type: string; required: boolean }>).map((f) => `<label>${f.label}<input name="${f.name}" type="${f.type === 'EMAIL' ? 'email' : f.type === 'PHONE' ? 'tel' : 'text'}" ${f.required ? 'required' : ''}/></label>`).join('')}<button type="submit">Submit</button></form>`;
    return prisma.webToLeadForm.update({ where: { id: form.id }, data: { embedCode } });
  }

  async updateWebForm(tenantId: string, id: string, dto: UpdateWebToLeadFormInput) {
    const existing = await prisma.webToLeadForm.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!existing) throw new NotFoundException('Form not found');
    return prisma.webToLeadForm.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.fields !== undefined && { fields: dto.fields as Prisma.InputJsonValue }),
        ...(dto.settings !== undefined && { settings: dto.settings as Prisma.InputJsonValue }),
      },
    });
  }

  async deleteWebForm(tenantId: string, id: string) {
    const existing = await prisma.webToLeadForm.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Form not found');
    return prisma.webToLeadForm.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async submitWebForm(formId: string, dto: SubmitWebFormInput) {
    const form = await prisma.webToLeadForm.findFirst({ where: { id: formId, isActive: true, deletedAt: null } });
    if (!form) throw new NotFoundException('Form not found or inactive');
    const settings = form.settings as { assignToId?: string; sourceId?: string; campaignId?: string };
    const data = dto.data;
    const lead = await prisma.lead.create({
      data: {
        tenantId: form.tenantId, orgId: form.orgId,
        firstName: data.firstName || data.first_name || 'Unknown',
        lastName: data.lastName || data.last_name || 'Unknown',
        email: data.email || null, phone: data.phone || null,
        company: data.company || null,
        sourceId: settings.sourceId || null,
        campaignId: settings.campaignId || null,
        assignedToId: settings.assignToId || null,
        notes: `Web form submission: ${form.name}`,
      },
    });
    await prisma.webToLeadForm.update({ where: { id: formId }, data: { submissions: { increment: 1 } } });
    await this.leadsService.recalculateLeadScore(form.tenantId, lead.id);
    return lead;
  }

  async getWebFormEmbed(tenantId: string, id: string) {
    const form = await prisma.webToLeadForm.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!form) throw new NotFoundException('Form not found');
    return { embedCode: form.embedCode, fields: form.fields, settings: form.settings };
  }

  // ── SAVED REPORTS (definitions) ───────────────

  async getSavedReports(tenantId: string) {
    return prisma.savedReport.findMany({ where: { tenantId, deletedAt: null }, orderBy: { createdAt: 'desc' } });
  }

  async createSavedReport(tenantId: string, dto: CreateSavedReportInput, createdBy: string) {
    return prisma.savedReport.create({
      data: {
        tenantId, name: dto.name, type: dto.type,
        filters: dto.filters as Prisma.InputJsonValue,
        columns: dto.columns as Prisma.InputJsonValue,
        chartType: dto.chartType || null,
        isShared: dto.isShared || false,
        schedule: dto.schedule || null,
        createdBy,
      },
    });
  }

  async deleteSavedReport(tenantId: string, id: string) {
    const existing = await prisma.savedReport.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Report not found');
    return prisma.savedReport.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async getSavedReportById(tenantId: string, id: string) {
    const report = await prisma.savedReport.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!report) throw new NotFoundException('Report not found');
    return report;
  }
}
