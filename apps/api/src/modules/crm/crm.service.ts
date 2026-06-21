import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { Prisma } from '@prisma/client';
import {
  CreateCustomerInput, CreateVendorInput,
  CreateContactInput, CreateLeadInput, CreateOpportunityInput,
  CreateActivityInput, CreateEmailTemplateInput, CreateSalesPipelineInput,
  UpdateCustomerInput, UpdateContactInput, UpdateLeadInput,
  UpdateOpportunityInput, UpdateEmailTemplateInput,
  CreateCampaignInput,
  CreateOpportunityLineItemInput, UpdateOpportunityLineItemInput,
  CreatePriceBookInput, UpdatePriceBookInput, CreatePriceBookEntryInput,
  CreateContactTagInput, MergeContactsInput,
  CreateSalesTargetInput, UpdateSalesTargetInput,
  CreateSavedReportInput,
  CreateCrmWorkflowRuleInput, UpdateCrmWorkflowRuleInput,
  CreateEmailSequenceInput, EnrollSequenceInput,
  CreateSalesTerritoryInput, UpdateSalesTerritoryInput, AddTeamMemberInput,
  CreateCommissionRuleInput, UpdateCommissionRuleInput, CalculateCommissionsInput,
  CreateWebToLeadFormInput, UpdateWebToLeadFormInput, SubmitWebFormInput,
  CreateCrmDocumentInput,
  CreateCustomFieldInput, UpdateCustomFieldInput, CreateRecordTypeInput, UpdateRecordTypeInput,
  CreateApprovalProcessInput, UpdateApprovalProcessInput,
  CreateQuotationTemplateInput, UpdateQuotationTemplateInput,
  CreateCrmCommentInput, CreateCrmNoteInput, UpdateCrmNoteInput,
  CreatePlaybookInput, UpdatePlaybookInput, CreateBattlecardInput, UpdateBattlecardInput,
  CreateCrmDashboardInput, UpdateCrmDashboardInput, CreateDashboardWidgetInput, UpdateDashboardWidgetInput,
} from '@unerp/shared';
import { createId } from '@paralleldrive/cuid2';

@Injectable()
export class CrmService {
  // ════════════════════════════════════════════════
  // CUSTOMERS
  // ════════════════════════════════════════════════

  async getCustomers(tenantId: string) {
    return prisma.customer.findMany({
      where: { tenantId, deletedAt: null },
      include: { _count: { select: { invoices: true, quotations: true, salesOrders: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async getCustomerById(tenantId: string, id: string) {
    const customer = await prisma.customer.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: { _count: { select: { invoices: true, quotations: true, salesOrders: true } } },
    });
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  async createCustomer(tenantId: string, orgId: string, dto: CreateCustomerInput) {
    let resolvedOrgId = orgId;
    if (!orgId || orgId === 'org-system-default') {
      const org = await prisma.organization.findFirst({ where: { tenantId } });
      if (!org) throw new BadRequestException('No Organization registered in this tenant');
      resolvedOrgId = org.id;
    }
    return prisma.customer.create({
      data: {
        tenantId, orgId: resolvedOrgId,
        name: dto.name, type: dto.type,
        email: dto.email || null, phone: dto.phone || null, taxId: dto.taxId || null,
        billingAddress: dto.billingAddress ? (dto.billingAddress as Prisma.InputJsonValue) : Prisma.DbNull,
        shippingAddress: dto.shippingAddress ? (dto.shippingAddress as Prisma.InputJsonValue) : Prisma.DbNull,
        creditLimit: dto.creditLimit || null, paymentTerms: dto.paymentTerms, notes: dto.notes || null,
      },
    });
  }

  async updateCustomer(tenantId: string, id: string, dto: UpdateCustomerInput) {
    const existing = await prisma.customer.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Customer not found');
    return prisma.customer.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.email !== undefined && { email: dto.email }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.taxId !== undefined && { taxId: dto.taxId }),
        ...(dto.creditLimit !== undefined && { creditLimit: dto.creditLimit }),
        ...(dto.paymentTerms !== undefined && { paymentTerms: dto.paymentTerms }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.billingAddress && { billingAddress: dto.billingAddress as Prisma.InputJsonValue }),
        ...(dto.shippingAddress && { shippingAddress: dto.shippingAddress as Prisma.InputJsonValue }),
      },
    });
  }

  async deleteCustomer(tenantId: string, id: string) {
    const existing = await prisma.customer.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Customer not found');
    return prisma.customer.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  // ════════════════════════════════════════════════
  // VENDORS
  // ════════════════════════════════════════════════

  async getVendors(tenantId: string) {
    return prisma.vendor.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { name: 'asc' },
    });
  }

  async createVendor(tenantId: string, orgId: string, dto: CreateVendorInput) {
    let resolvedOrgId = orgId;
    if (!orgId || orgId === 'org-system-default') {
      const org = await prisma.organization.findFirst({ where: { tenantId } });
      if (!org) throw new BadRequestException('No Organization registered in this tenant');
      resolvedOrgId = org.id;
    }
    return prisma.vendor.create({
      data: {
        tenantId, orgId: resolvedOrgId,
        name: dto.name, email: dto.email || null, phone: dto.phone || null,
        taxId: dto.taxId || null, address: Prisma.DbNull,
        paymentTerms: dto.paymentTerms, notes: dto.notes || null,
      },
    });
  }

  // ════════════════════════════════════════════════
  // CONTACTS
  // ════════════════════════════════════════════════

  async getContacts(tenantId: string, customerId?: string) {
    const where: Prisma.ContactWhereInput = { tenantId, deletedAt: null };
    if (customerId) where.customerId = customerId;
    return prisma.contact.findMany({ where, orderBy: { firstName: 'asc' } });
  }

  async createContact(tenantId: string, orgId: string, dto: CreateContactInput) {
    let resolvedOrgId = orgId;
    if (!orgId || orgId === 'org-system-default') {
      const org = await prisma.organization.findFirst({ where: { tenantId } });
      if (!org) throw new BadRequestException('No Organization registered');
      resolvedOrgId = org.id;
    }
    if (dto.customerId) {
      const cust = await prisma.customer.findFirst({ where: { id: dto.customerId, tenantId } });
      if (!cust) throw new BadRequestException('Customer not found');
    }
    return prisma.contact.create({
      data: {
        tenantId, orgId: resolvedOrgId,
        customerId: dto.customerId || null,
        salutation: dto.salutation || null,
        firstName: dto.firstName, lastName: dto.lastName,
        email: dto.email || null, phone: dto.phone || null, mobile: dto.mobile || null,
        title: dto.title || null, department: dto.department || null,
        isPrimary: dto.isPrimary || false, notes: dto.notes || null,
      },
    });
  }

  async updateContact(tenantId: string, id: string, dto: UpdateContactInput) {
    const existing = await prisma.contact.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Contact not found');
    return prisma.contact.update({ where: { id }, data: dto as Prisma.ContactUpdateInput });
  }

  async deleteContact(tenantId: string, id: string) {
    const existing = await prisma.contact.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Contact not found');
    return prisma.contact.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  // ════════════════════════════════════════════════
  // LEAD SOURCES
  // ════════════════════════════════════════════════

  async getLeadSources(tenantId: string) {
    return prisma.leadSource.findMany({ where: { tenantId }, orderBy: { name: 'asc' } });
  }

  // ════════════════════════════════════════════════
  // LEADS
  // ════════════════════════════════════════════════

  async getLeads(tenantId: string, status?: string) {
    const where: Prisma.LeadWhereInput = { tenantId, deletedAt: null };
    if (status) where.status = status;
    return prisma.lead.findMany({
      where,
      include: { source: true, _count: { select: { activities: true, opportunities: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getLeadById(tenantId: string, id: string) {
    const lead = await prisma.lead.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: { source: true, activities: { orderBy: { createdAt: 'desc' } }, opportunities: true },
    });
    if (!lead) throw new NotFoundException('Lead not found');
    return lead;
  }

  async recalculateLeadScore(tenantId: string, leadId: string) {
    const lead = await prisma.lead.findFirst({
      where: { id: leadId, tenantId, deletedAt: null },
      include: { activities: true },
    });
    if (!lead) return;

    let score = 0;
    if (lead.email) score += 15;
    if (lead.phone || lead.mobile) score += 15;
    if (lead.company) score += 10;
    if (lead.website) score += 10;
    if (lead.industry) score += 10;
    if (lead.annualRevenue) {
      const rev = Number(lead.annualRevenue);
      if (rev > 1000000) score += 30;
      else if (rev > 100000) score += 20;
      else score += 10;
    }
    if (lead.employeeCount) {
      if (lead.employeeCount > 100) score += 20;
      else score += 10;
    }

    if (lead.activities && lead.activities.length > 0) {
      lead.activities.forEach((act) => {
        if (act.completedAt) score += 15;
        else score += 5;
      });
    }

    await prisma.lead.update({
      where: { id: leadId },
      data: { score },
    });
  }

  async createLead(tenantId: string, orgId: string, dto: CreateLeadInput) {
    let resolvedOrgId = orgId;
    if (!orgId || orgId === 'org-system-default') {
      const org = await prisma.organization.findFirst({ where: { tenantId } });
      if (!org) throw new BadRequestException('No Organization registered');
      resolvedOrgId = org.id;
    }
    const lead = await prisma.lead.create({
      data: {
        tenantId, orgId: resolvedOrgId,
        salutation: dto.salutation || null,
        firstName: dto.firstName, lastName: dto.lastName,
        company: dto.company || null, title: dto.title || null,
        email: dto.email || null, phone: dto.phone || null, mobile: dto.mobile || null,
        website: dto.website || null, sourceId: dto.sourceId || null,
        industry: dto.industry || null,
        employeeCount: dto.employeeCount || null,
        annualRevenue: dto.annualRevenue != null ? new Prisma.Decimal(dto.annualRevenue) : null,
        notes: dto.notes || null,
        campaignId: dto.campaignId || null,
      },
    });
    await this.recalculateLeadScore(tenantId, lead.id);
    return this.getLeadById(tenantId, lead.id);
  }

  async updateLead(tenantId: string, id: string, dto: UpdateLeadInput) {
    const existing = await prisma.lead.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Lead not found');
    const { campaignId, ...rest } = dto;
    const updated = await prisma.lead.update({
      where: { id },
      data: {
        ...rest,
        annualRevenue: dto.annualRevenue != null ? new Prisma.Decimal(dto.annualRevenue) : undefined,
        ...(campaignId !== undefined && { campaignId: campaignId || null }),
      } as Prisma.LeadUpdateInput
    });
    await this.recalculateLeadScore(tenantId, id);
    return updated;
  }

  async updateLeadStatus(tenantId: string, id: string, status: string) {
    const existing = await prisma.lead.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Lead not found');
    const updated = await prisma.lead.update({ where: { id }, data: { status } });
    await this.recalculateLeadScore(tenantId, id);
    return updated;
  }

  async convertLead(tenantId: string, orgId: string, leadId: string, customerName?: string, opportunityName?: string, opportunityAmount?: number) {
    let resolvedOrgId = orgId;
    if (!orgId || orgId === 'org-system-default') {
      const org = await prisma.organization.findFirst({ where: { tenantId } });
      if (!org) throw new BadRequestException('No Organization registered');
      resolvedOrgId = org.id;
    }

    const lead = await prisma.lead.findFirst({ where: { id: leadId, tenantId } });
    if (!lead) throw new NotFoundException('Lead not found');
    if (lead.status === 'CONVERTED') throw new BadRequestException('Lead is already converted');

    const custName = customerName || lead.company || `${lead.firstName} ${lead.lastName}`;

    return prisma.$transaction(async (tx) => {
      const customer = await tx.customer.create({
        data: {
          tenantId, orgId: resolvedOrgId,
          name: custName,
          email: lead.email, phone: lead.phone,
          type: 'COMPANY', paymentTerms: 30, status: 'ACTIVE',
        },
      });

      const oppName = opportunityName || `Opportunity from ${lead.firstName} ${lead.lastName}`;
      const opportunity = await tx.opportunity.create({
        data: {
          tenantId, orgId: resolvedOrgId,
          name: oppName,
          customerId: customer.id,
          leadId: lead.id,
          stage: 'QUALIFICATION',
          amount: opportunityAmount || null,
          probability: 10,
        },
      });

      await tx.lead.update({
        where: { id: leadId },
        data: {
          status: 'CONVERTED',
          convertedCustomerId: customer.id,
          convertedOpportunityId: opportunity.id,
        },
      });

      return { customer, opportunity };
    });
  }

  async deleteLead(tenantId: string, id: string) {
    const existing = await prisma.lead.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Lead not found');
    return prisma.lead.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  // ════════════════════════════════════════════════
  // SALES PIPELINES
  // ════════════════════════════════════════════════

  async getPipelines(tenantId: string) {
    return prisma.salesPipeline.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });
  }

  async createPipeline(tenantId: string, dto: CreateSalesPipelineInput) {
    if (dto.isDefault) {
      await prisma.salesPipeline.updateMany({
        where: { tenantId },
        data: { isDefault: false },
      });
    }
    return prisma.salesPipeline.create({
      data: {
        tenantId,
        name: dto.name,
        stages: dto.stages as Prisma.InputJsonValue,
        isDefault: dto.isDefault || false,
      },
    });
  }

  // ════════════════════════════════════════════════
  // OPPORTUNITIES
  // ════════════════════════════════════════════════

  async getOpportunities(tenantId: string, pipelineId?: string, stage?: string) {
    const where: Prisma.OpportunityWhereInput = { tenantId, deletedAt: null };
    if (pipelineId) where.pipelineId = pipelineId;
    if (stage) where.stage = stage;
    return prisma.opportunity.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true } },
        pipeline: { select: { id: true, name: true } },
        _count: { select: { activities: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOpportunityById(tenantId: string, id: string) {
    const opp = await prisma.opportunity.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        customer: { select: { id: true, name: true } },
        lead: true,
        pipeline: { select: { id: true, name: true, stages: true } },
        activities: { orderBy: { createdAt: 'desc' } },
        lineItems: { include: { product: { select: { id: true, name: true, sku: true } } }, orderBy: { sortOrder: 'asc' } },
      },
    });
    if (!opp) throw new NotFoundException('Opportunity not found');
    return opp;
  }

  async createOpportunity(tenantId: string, orgId: string, dto: CreateOpportunityInput) {
    let resolvedOrgId = orgId;
    if (!orgId || orgId === 'org-system-default') {
      const org = await prisma.organization.findFirst({ where: { tenantId } });
      if (!org) throw new BadRequestException('No Organization registered');
      resolvedOrgId = org.id;
    }
    if (dto.customerId) {
      const cust = await prisma.customer.findFirst({ where: { id: dto.customerId, tenantId } });
      if (!cust) throw new BadRequestException('Customer not found');
    }
    return prisma.opportunity.create({
      data: {
        tenantId, orgId: resolvedOrgId,
        name: dto.name,
        customerId: dto.customerId || null,
        leadId: dto.leadId || null,
        pipelineId: dto.pipelineId || null,
        stage: dto.stage || 'PROSPECTING',
        amount: dto.amount || null,
        probability: dto.probability || 0,
        expectedCloseDate: dto.expectedCloseDate ? new Date(dto.expectedCloseDate) : null,
        competitor: dto.competitor || null,
        notes: dto.notes || null,
      },
    });
  }

  async updateOpportunity(tenantId: string, id: string, dto: UpdateOpportunityInput) {
    const existing = await prisma.opportunity.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Opportunity not found');
    const data: Prisma.OpportunityUpdateInput = { ...dto };
    if (dto.expectedCloseDate) data.expectedCloseDate = new Date(dto.expectedCloseDate);
    return prisma.opportunity.update({ where: { id }, data });
  }

  async updateOpportunityStage(tenantId: string, id: string, stage: string, probability?: number, actualCloseDate?: string, lossReason?: string) {
    const existing = await prisma.opportunity.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Opportunity not found');
    const data: Prisma.OpportunityUpdateInput = { stage, stageEnteredAt: new Date() };
    if (probability !== undefined) data.probability = probability;
    if (actualCloseDate) data.actualCloseDate = new Date(actualCloseDate);
    if (lossReason !== undefined) data.lossReason = lossReason;
    const prob = probability !== undefined ? probability : existing.probability;
    const amount = Number(existing.amount || 0);
    data.weightedAmount = new Prisma.Decimal(amount * (prob / 100));
    return prisma.opportunity.update({ where: { id }, data });
  }

  async deleteOpportunity(tenantId: string, id: string) {
    const existing = await prisma.opportunity.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Opportunity not found');
    return prisma.opportunity.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  // ════════════════════════════════════════════════
  // ACTIVITIES
  // ════════════════════════════════════════════════

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
      await this.recalculateLeadScore(tenantId, dto.leadId);
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
      await this.recalculateLeadScore(tenantId, existing.leadId);
    }
    return updated;
  }

  // ════════════════════════════════════════════════
  // EMAIL TEMPLATES
  // ════════════════════════════════════════════════

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

  // ════════════════════════════════════════════════
  // CRM ANALYTICS
  // ════════════════════════════════════════════════

  async getPipelineFunnel(tenantId: string) {
    const opportunities = await prisma.opportunity.findMany({
      where: { tenantId, deletedAt: null },
      select: { stage: true, amount: true },
    });
    const stages: Record<string, { count: number; totalAmount: number }> = {};
    for (const opp of opportunities) {
      if (!stages[opp.stage]) stages[opp.stage] = { count: 0, totalAmount: 0 };
      stages[opp.stage]!.count++;
      stages[opp.stage]!.totalAmount += Number(opp.amount || 0);
    }
    return stages;
  }

  async getWinRate(tenantId: string) {
    const won = await prisma.opportunity.count({ where: { tenantId, stage: 'CLOSED_WON', deletedAt: null } });
    const lost = await prisma.opportunity.count({ where: { tenantId, stage: 'CLOSED_LOST', deletedAt: null } });
    const total = won + lost;
    return { won, lost, total, winRate: total > 0 ? Math.round((won / total) * 100) : 0 };
  }

  async getLeadSourceBreakdown(tenantId: string) {
    const raw = await prisma.lead.groupBy({
      by: ['sourceId'],
      where: { tenantId, deletedAt: null },
      _count: { id: true },
    });
    // map names
    const sources = await prisma.leadSource.findMany({ where: { tenantId } });
    return raw.map((r) => {
      const src = sources.find((s) => s.id === r.sourceId);
      return {
        source: src ? src.name : 'Unknown',
        count: r._count.id,
      };
    });
  }

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

  // ════════════════════════════════════════════════
  // PHASE 1: OPPORTUNITY LINE ITEMS
  // ════════════════════════════════════════════════

  async getOpportunityLineItems(tenantId: string, opportunityId: string) {
    await this.getOpportunityById(tenantId, opportunityId);
    return prisma.opportunityLineItem.findMany({
      where: { opportunityId, tenantId },
      include: { product: { select: { id: true, name: true, sku: true } } },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async addOpportunityLineItem(tenantId: string, opportunityId: string, dto: CreateOpportunityLineItemInput) {
    const opp = await prisma.opportunity.findFirst({ where: { id: opportunityId, tenantId, deletedAt: null } });
    if (!opp) throw new NotFoundException('Opportunity not found');
    const totalAmount = dto.quantity * dto.unitPrice * (1 - (dto.discount || 0) / 100);
    const item = await prisma.opportunityLineItem.create({
      data: {
        tenantId, opportunityId,
        productId: dto.productId || null,
        description: dto.description,
        quantity: new Prisma.Decimal(dto.quantity),
        unitPrice: new Prisma.Decimal(dto.unitPrice),
        discount: new Prisma.Decimal(dto.discount || 0),
        totalAmount: new Prisma.Decimal(totalAmount),
        sortOrder: dto.sortOrder || 0,
      },
    });
    await this.recalcOpportunityAmount(opportunityId);
    return item;
  }

  async updateOpportunityLineItem(tenantId: string, opportunityId: string, itemId: string, dto: UpdateOpportunityLineItemInput) {
    const item = await prisma.opportunityLineItem.findFirst({ where: { id: itemId, tenantId, opportunityId } });
    if (!item) throw new NotFoundException('Line item not found');
    const qty = dto.quantity ?? Number(item.quantity);
    const price = dto.unitPrice ?? Number(item.unitPrice);
    const disc = dto.discount ?? Number(item.discount);
    const totalAmount = qty * price * (1 - disc / 100);
    const updated = await prisma.opportunityLineItem.update({
      where: { id: itemId },
      data: {
        ...(dto.productId !== undefined && { productId: dto.productId }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.quantity !== undefined && { quantity: new Prisma.Decimal(dto.quantity) }),
        ...(dto.unitPrice !== undefined && { unitPrice: new Prisma.Decimal(dto.unitPrice) }),
        ...(dto.discount !== undefined && { discount: new Prisma.Decimal(dto.discount) }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
        totalAmount: new Prisma.Decimal(totalAmount),
      },
    });
    await this.recalcOpportunityAmount(opportunityId);
    return updated;
  }

  async deleteOpportunityLineItem(tenantId: string, opportunityId: string, itemId: string) {
    const item = await prisma.opportunityLineItem.findFirst({ where: { id: itemId, tenantId, opportunityId } });
    if (!item) throw new NotFoundException('Line item not found');
    await prisma.opportunityLineItem.delete({ where: { id: itemId } });
    await this.recalcOpportunityAmount(opportunityId);
  }

  private async recalcOpportunityAmount(opportunityId: string) {
    const items = await prisma.opportunityLineItem.findMany({ where: { opportunityId } });
    const total = items.reduce((sum, i) => sum + Number(i.totalAmount), 0);
    const opp = await prisma.opportunity.findUnique({ where: { id: opportunityId } });
    const prob = opp?.probability || 0;
    await prisma.opportunity.update({
      where: { id: opportunityId },
      data: { amount: new Prisma.Decimal(total), weightedAmount: new Prisma.Decimal(total * prob / 100) },
    });
  }

  // ════════════════════════════════════════════════
  // PHASE 1: PRICE BOOKS
  // ════════════════════════════════════════════════

  async getPriceBooks(tenantId: string) {
    return prisma.priceBook.findMany({
      where: { tenantId, deletedAt: null },
      include: { _count: { select: { entries: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async createPriceBook(tenantId: string, orgId: string, dto: CreatePriceBookInput) {
    const resolvedOrgId = await this.resolveOrgId(tenantId, orgId);
    if (dto.isDefault) {
      await prisma.priceBook.updateMany({ where: { tenantId }, data: { isDefault: false } });
    }
    return prisma.priceBook.create({
      data: {
        tenantId, orgId: resolvedOrgId,
        name: dto.name, description: dto.description || null,
        currency: dto.currency || 'USD', isDefault: dto.isDefault || false,
        validFrom: dto.validFrom ? new Date(dto.validFrom) : null,
        validTo: dto.validTo ? new Date(dto.validTo) : null,
      },
    });
  }

  async updatePriceBook(tenantId: string, id: string, dto: UpdatePriceBookInput) {
    const existing = await prisma.priceBook.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!existing) throw new NotFoundException('Price book not found');
    if (dto.isDefault) {
      await prisma.priceBook.updateMany({ where: { tenantId, id: { not: id } }, data: { isDefault: false } });
    }
    return prisma.priceBook.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.currency !== undefined && { currency: dto.currency }),
        ...(dto.isDefault !== undefined && { isDefault: dto.isDefault }),
        ...(dto.validFrom !== undefined && { validFrom: dto.validFrom ? new Date(dto.validFrom) : null }),
        ...(dto.validTo !== undefined && { validTo: dto.validTo ? new Date(dto.validTo) : null }),
      },
    });
  }

  async deletePriceBook(tenantId: string, id: string) {
    const existing = await prisma.priceBook.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Price book not found');
    return prisma.priceBook.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async getPriceBookEntries(tenantId: string, priceBookId: string) {
    return prisma.priceBookEntry.findMany({
      where: { tenantId, priceBookId },
      include: { product: { select: { id: true, name: true, sku: true, sellPrice: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addPriceBookEntry(tenantId: string, priceBookId: string, dto: CreatePriceBookEntryInput) {
    const pb = await prisma.priceBook.findFirst({ where: { id: priceBookId, tenantId, deletedAt: null } });
    if (!pb) throw new NotFoundException('Price book not found');
    return prisma.priceBookEntry.create({
      data: {
        tenantId, priceBookId,
        productId: dto.productId,
        listPrice: new Prisma.Decimal(dto.listPrice),
        minQuantity: new Prisma.Decimal(dto.minQuantity || 1),
      },
    });
  }

  async deletePriceBookEntry(tenantId: string, entryId: string) {
    const entry = await prisma.priceBookEntry.findFirst({ where: { id: entryId, tenantId } });
    if (!entry) throw new NotFoundException('Price book entry not found');
    return prisma.priceBookEntry.delete({ where: { id: entryId } });
  }

  async getCrmProducts(tenantId: string) {
    return prisma.product.findMany({
      where: { tenantId, isActive: true, deletedAt: null },
      select: { id: true, name: true, sku: true, sellPrice: true, category: true, type: true, unit: true },
      orderBy: { name: 'asc' },
    });
  }

  // ════════════════════════════════════════════════
  // PHASE 1: REVENUE ANALYTICS
  // ════════════════════════════════════════════════

  async getRevenueForecast(tenantId: string) {
    const opps = await prisma.opportunity.findMany({
      where: { tenantId, deletedAt: null, stage: { notIn: ['CLOSED_WON', 'CLOSED_LOST'] } },
      select: { amount: true, probability: true, expectedCloseDate: true, weightedAmount: true },
    });
    const byMonth: Record<string, { totalAmount: number; weightedAmount: number; count: number }> = {};
    for (const opp of opps) {
      const month = opp.expectedCloseDate
        ? `${opp.expectedCloseDate.getFullYear()}-${String(opp.expectedCloseDate.getMonth() + 1).padStart(2, '0')}`
        : 'Unscheduled';
      if (!byMonth[month]) byMonth[month] = { totalAmount: 0, weightedAmount: 0, count: 0 };
      byMonth[month].totalAmount += Number(opp.amount || 0);
      byMonth[month].weightedAmount += Number(opp.weightedAmount || 0);
      byMonth[month].count++;
    }
    return Object.entries(byMonth).map(([month, data]) => ({ month, ...data })).sort((a, b) => a.month.localeCompare(b.month));
  }

  async getDealAging(tenantId: string) {
    const opps = await prisma.opportunity.findMany({
      where: { tenantId, deletedAt: null, stage: { notIn: ['CLOSED_WON', 'CLOSED_LOST'] } },
      select: { id: true, name: true, stage: true, amount: true, stageEnteredAt: true, updatedAt: true, customer: { select: { name: true } } },
    });
    const now = new Date();
    return opps.map((opp) => {
      const ref = opp.stageEnteredAt || opp.updatedAt;
      const daysInStage = Math.floor((now.getTime() - ref.getTime()) / (1000 * 60 * 60 * 24));
      return { id: opp.id, name: opp.name, stage: opp.stage, amount: Number(opp.amount || 0), customerName: opp.customer?.name || null, daysInStage, isRotting: daysInStage > 30 };
    }).sort((a, b) => b.daysInStage - a.daysInStage);
  }

  // ════════════════════════════════════════════════
  // PHASE 2: CONTACT TAGS & 360
  // ════════════════════════════════════════════════

  async getContactTags(tenantId: string) {
    return prisma.contactTag.findMany({ where: { tenantId }, orderBy: { name: 'asc' } });
  }

  async createContactTag(tenantId: string, dto: CreateContactTagInput) {
    return prisma.contactTag.create({ data: { tenantId, name: dto.name, color: dto.color || '#3b82f6' } });
  }

  async deleteContactTag(tenantId: string, id: string) {
    const tag = await prisma.contactTag.findFirst({ where: { id, tenantId } });
    if (!tag) throw new NotFoundException('Tag not found');
    return prisma.contactTag.delete({ where: { id } });
  }

  async assignContactTag(tenantId: string, contactId: string, tagId: string) {
    const contact = await prisma.contact.findFirst({ where: { id: contactId, tenantId } });
    if (!contact) throw new NotFoundException('Contact not found');
    return prisma.contactTagLink.create({ data: { contactId, tagId } });
  }

  async removeContactTag(contactId: string, tagId: string) {
    const link = await prisma.contactTagLink.findFirst({ where: { contactId, tagId } });
    if (!link) throw new NotFoundException('Tag assignment not found');
    return prisma.contactTagLink.delete({ where: { id: link.id } });
  }

  async getContactTimeline(tenantId: string, contactId: string) {
    const contact = await prisma.contact.findFirst({
      where: { id: contactId, tenantId, deletedAt: null },
      include: { customer: { select: { id: true, name: true } }, tags: { include: { tag: true } } },
    });
    if (!contact) throw new NotFoundException('Contact not found');
    const activities = await prisma.activity.findMany({
      where: { tenantId, OR: [{ contactId }, ...(contact.customerId ? [{ customerId: contact.customerId }] : [])] },
      orderBy: { createdAt: 'desc' }, take: 50,
    });
    const opportunities = contact.customerId
      ? await prisma.opportunity.findMany({ where: { tenantId, customerId: contact.customerId, deletedAt: null }, orderBy: { createdAt: 'desc' }, take: 20 })
      : [];
    return { contact, activities, opportunities };
  }

  async findDuplicateContacts(tenantId: string) {
    const contacts = await prisma.contact.findMany({ where: { tenantId, deletedAt: null }, select: { id: true, firstName: true, lastName: true, email: true, phone: true } });
    const dupes: Array<{ contactA: typeof contacts[0]; contactB: typeof contacts[0]; reason: string }> = [];
    for (let i = 0; i < contacts.length; i++) {
      for (let j = i + 1; j < contacts.length; j++) {
        const a = contacts[i], b = contacts[j];
        if (a.email && b.email && a.email.toLowerCase() === b.email.toLowerCase()) {
          dupes.push({ contactA: a, contactB: b, reason: 'Same email' });
        } else if (a.firstName.toLowerCase() === b.firstName.toLowerCase() && a.lastName.toLowerCase() === b.lastName.toLowerCase() && a.phone && a.phone === b.phone) {
          dupes.push({ contactA: a, contactB: b, reason: 'Same name and phone' });
        }
      }
    }
    return dupes;
  }

  async mergeContacts(tenantId: string, dto: MergeContactsInput) {
    const primary = await prisma.contact.findFirst({ where: { id: dto.primaryContactId, tenantId } });
    const secondary = await prisma.contact.findFirst({ where: { id: dto.secondaryContactId, tenantId } });
    if (!primary || !secondary) throw new NotFoundException('Contact not found');
    return prisma.$transaction(async (tx) => {
      await tx.activity.updateMany({ where: { contactId: dto.secondaryContactId }, data: { contactId: dto.primaryContactId } });
      const secTags = await tx.contactTagLink.findMany({ where: { contactId: dto.secondaryContactId } });
      for (const t of secTags) {
        const exists = await tx.contactTagLink.findFirst({ where: { contactId: dto.primaryContactId, tagId: t.tagId } });
        if (!exists) await tx.contactTagLink.create({ data: { contactId: dto.primaryContactId, tagId: t.tagId } });
      }
      await tx.contactTagLink.deleteMany({ where: { contactId: dto.secondaryContactId } });
      await tx.contact.update({ where: { id: dto.secondaryContactId }, data: { deletedAt: new Date() } });
      return tx.contact.findFirst({ where: { id: dto.primaryContactId }, include: { tags: { include: { tag: true } } } });
    });
  }

  // ════════════════════════════════════════════════
  // PHASE 2: PIPELINE HEALTH
  // ════════════════════════════════════════════════

  async getStageDuration(tenantId: string) {
    const opps = await prisma.opportunity.findMany({
      where: { tenantId, deletedAt: null, stage: 'CLOSED_WON', stageEnteredAt: { not: null } },
      select: { createdAt: true, actualCloseDate: true },
    });
    if (opps.length === 0) return { avgDaysToClose: 0, totalDeals: 0 };
    const totalDays = opps.reduce((sum, o) => {
      const end = o.actualCloseDate || new Date();
      return sum + (end.getTime() - o.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    }, 0);
    return { avgDaysToClose: Math.round(totalDays / opps.length), totalDeals: opps.length };
  }

  async getPipelineHealth(tenantId: string) {
    const opps = await prisma.opportunity.findMany({
      where: { tenantId, deletedAt: null },
      select: { stage: true, amount: true, probability: true, stageEnteredAt: true, updatedAt: true, createdAt: true, actualCloseDate: true },
    });
    const open = opps.filter((o) => !['CLOSED_WON', 'CLOSED_LOST'].includes(o.stage));
    const won = opps.filter((o) => o.stage === 'CLOSED_WON');
    const lost = opps.filter((o) => o.stage === 'CLOSED_LOST');
    const now = new Date();
    const avgAge = open.length > 0
      ? Math.round(open.reduce((s, o) => s + (now.getTime() - o.createdAt.getTime()) / 86400000, 0) / open.length)
      : 0;
    const velocity = won.length > 0
      ? Math.round(won.reduce((s, o) => s + ((o.actualCloseDate || now).getTime() - o.createdAt.getTime()) / 86400000, 0) / won.length)
      : 0;
    const winRate = (won.length + lost.length) > 0 ? Math.round((won.length / (won.length + lost.length)) * 100) : 0;
    const totalPipeline = open.reduce((s, o) => s + Number(o.amount || 0), 0);
    const weightedPipeline = open.reduce((s, o) => s + Number(o.amount || 0) * (o.probability / 100), 0);
    const rottingCount = open.filter((o) => {
      const ref = o.stageEnteredAt || o.updatedAt;
      return (now.getTime() - ref.getTime()) / 86400000 > 30;
    }).length;
    return { totalPipeline, weightedPipeline, avgAge, velocity, winRate, openDeals: open.length, rottingCount };
  }

  // ════════════════════════════════════════════════
  // PHASE 3: SALES TARGETS
  // ════════════════════════════════════════════════

  async getSalesTargets(tenantId: string) {
    return prisma.salesTarget.findMany({ where: { tenantId }, orderBy: { period: 'desc' } });
  }

  async createSalesTarget(tenantId: string, orgId: string, dto: CreateSalesTargetInput) {
    const resolvedOrgId = await this.resolveOrgId(tenantId, orgId);
    return prisma.salesTarget.create({
      data: { tenantId, orgId: resolvedOrgId, userId: dto.userId || null, period: dto.period, targetType: dto.targetType || 'REVENUE', target: new Prisma.Decimal(dto.target) },
    });
  }

  async updateSalesTarget(tenantId: string, id: string, dto: UpdateSalesTargetInput) {
    const existing = await prisma.salesTarget.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Sales target not found');
    return prisma.salesTarget.update({
      where: { id },
      data: {
        ...(dto.target !== undefined && { target: new Prisma.Decimal(dto.target) }),
        ...(dto.period !== undefined && { period: dto.period }),
        ...(dto.targetType !== undefined && { targetType: dto.targetType }),
        ...(dto.userId !== undefined && { userId: dto.userId }),
      },
    });
  }

  async deleteSalesTarget(tenantId: string, id: string) {
    const existing = await prisma.salesTarget.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Sales target not found');
    return prisma.salesTarget.delete({ where: { id } });
  }

  // ════════════════════════════════════════════════
  // PHASE 3: FORECASTING & ADVANCED ANALYTICS
  // ════════════════════════════════════════════════

  async getForecast(tenantId: string) {
    const opps = await prisma.opportunity.findMany({
      where: { tenantId, deletedAt: null, stage: { notIn: ['CLOSED_WON', 'CLOSED_LOST'] } },
      select: { amount: true, probability: true, expectedCloseDate: true },
    });
    const bestCase = opps.reduce((s, o) => s + Number(o.amount || 0), 0);
    const commit = opps.filter((o) => o.probability >= 70).reduce((s, o) => s + Number(o.amount || 0), 0);
    const worstCase = opps.filter((o) => o.probability >= 90).reduce((s, o) => s + Number(o.amount || 0), 0);
    return { bestCase, commit, worstCase, dealCount: opps.length };
  }

  async getRepPerformance(tenantId: string) {
    const wonOpps = await prisma.opportunity.findMany({
      where: { tenantId, deletedAt: null, stage: 'CLOSED_WON', assignedToId: { not: null } },
      select: { assignedToId: true, amount: true, createdAt: true, actualCloseDate: true },
    });
    const byRep: Record<string, { deals: number; revenue: number; totalDays: number }> = {};
    for (const opp of wonOpps) {
      const rep = opp.assignedToId!;
      if (!byRep[rep]) byRep[rep] = { deals: 0, revenue: 0, totalDays: 0 };
      byRep[rep].deals++;
      byRep[rep].revenue += Number(opp.amount || 0);
      const days = (opp.actualCloseDate || new Date()).getTime() - opp.createdAt.getTime();
      byRep[rep].totalDays += days / 86400000;
    }
    return Object.entries(byRep).map(([userId, d]) => ({
      userId, dealsWon: d.deals, totalRevenue: d.revenue,
      avgDealSize: Math.round(d.revenue / d.deals),
      avgCycleTimeDays: Math.round(d.totalDays / d.deals),
    })).sort((a, b) => b.totalRevenue - a.totalRevenue);
  }

  async getConversionFunnel(tenantId: string) {
    const totalLeads = await prisma.lead.count({ where: { tenantId, deletedAt: null } });
    const convertedLeads = await prisma.lead.count({ where: { tenantId, deletedAt: null, status: 'CONVERTED' } });
    const totalOpps = await prisma.opportunity.count({ where: { tenantId, deletedAt: null } });
    const wonOpps = await prisma.opportunity.count({ where: { tenantId, deletedAt: null, stage: 'CLOSED_WON' } });
    return {
      totalLeads, convertedLeads,
      leadToOppRate: totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0,
      totalOpportunities: totalOpps, wonOpportunities: wonOpps,
      oppToWinRate: totalOpps > 0 ? Math.round((wonOpps / totalOpps) * 100) : 0,
    };
  }

  async getCohortAnalysis(tenantId: string) {
    const leads = await prisma.lead.findMany({
      where: { tenantId, deletedAt: null },
      select: { id: true, status: true, createdAt: true },
    });
    const cohorts: Record<string, { total: number; converted: number; qualified: number; disqualified: number }> = {};
    for (const l of leads) {
      const m = `${l.createdAt.getFullYear()}-${String(l.createdAt.getMonth() + 1).padStart(2, '0')}`;
      if (!cohorts[m]) cohorts[m] = { total: 0, converted: 0, qualified: 0, disqualified: 0 };
      cohorts[m].total++;
      if (l.status === 'CONVERTED') cohorts[m].converted++;
      if (l.status === 'QUALIFIED') cohorts[m].qualified++;
      if (l.status === 'DISQUALIFIED') cohorts[m].disqualified++;
    }
    return Object.entries(cohorts).map(([month, data]) => ({
      month, ...data, conversionRate: data.total > 0 ? Math.round((data.converted / data.total) * 100) : 0,
    })).sort((a, b) => a.month.localeCompare(b.month));
  }

  // ════════════════════════════════════════════════
  // PHASE 3: SAVED REPORTS
  // ════════════════════════════════════════════════

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

  async runSavedReport(tenantId: string, id: string) {
    const report = await prisma.savedReport.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!report) throw new NotFoundException('Report not found');
    switch (report.type) {
      case 'PIPELINE': return this.getPipelineFunnel(tenantId);
      case 'LEADS': return this.getLeadSourceBreakdown(tenantId);
      case 'REVENUE': return this.getRevenueForecast(tenantId);
      case 'CONVERSION': return this.getConversionFunnel(tenantId);
      case 'ACTIVITIES': return this.getActivities(tenantId);
      default: return this.getPipelineFunnel(tenantId);
    }
  }

  // ════════════════════════════════════════════════
  // PHASE 4: WORKFLOW RULES
  // ════════════════════════════════════════════════

  async getWorkflowRules(tenantId: string) {
    return prisma.crmWorkflowRule.findMany({ where: { tenantId, deletedAt: null }, orderBy: { createdAt: 'desc' } });
  }

  async createWorkflowRule(tenantId: string, orgId: string, dto: CreateCrmWorkflowRuleInput, createdBy: string) {
    const resolvedOrgId = await this.resolveOrgId(tenantId, orgId);
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

  // ════════════════════════════════════════════════
  // PHASE 4: EMAIL SEQUENCES
  // ════════════════════════════════════════════════

  async getEmailSequences(tenantId: string) {
    return prisma.emailSequence.findMany({
      where: { tenantId, deletedAt: null },
      include: { _count: { select: { steps: true, enrollments: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createEmailSequence(tenantId: string, orgId: string, dto: CreateEmailSequenceInput, createdBy: string) {
    const resolvedOrgId = await this.resolveOrgId(tenantId, orgId);
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

  // ════════════════════════════════════════════════
  // PHASE 5: TERRITORIES
  // ════════════════════════════════════════════════

  async getTerritories(tenantId: string) {
    return prisma.salesTerritory.findMany({
      where: { tenantId, deletedAt: null },
      include: { members: true, children: { select: { id: true, name: true } }, parent: { select: { id: true, name: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async createTerritory(tenantId: string, orgId: string, dto: CreateSalesTerritoryInput) {
    const resolvedOrgId = await this.resolveOrgId(tenantId, orgId);
    return prisma.salesTerritory.create({
      data: {
        tenantId, orgId: resolvedOrgId, name: dto.name,
        description: dto.description || null,
        criteria: dto.criteria as Prisma.InputJsonValue || {},
        parentId: dto.parentId || null, managerId: dto.managerId || null,
      },
    });
  }

  async updateTerritory(tenantId: string, id: string, dto: UpdateSalesTerritoryInput) {
    const existing = await prisma.salesTerritory.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!existing) throw new NotFoundException('Territory not found');
    return prisma.salesTerritory.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.criteria !== undefined && { criteria: dto.criteria as Prisma.InputJsonValue }),
        ...(dto.parentId !== undefined && { parentId: dto.parentId }),
        ...(dto.managerId !== undefined && { managerId: dto.managerId }),
      },
    });
  }

  async deleteTerritory(tenantId: string, id: string) {
    const existing = await prisma.salesTerritory.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Territory not found');
    return prisma.salesTerritory.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async addTeamMember(tenantId: string, territoryId: string, dto: AddTeamMemberInput) {
    const territory = await prisma.salesTerritory.findFirst({ where: { id: territoryId, tenantId, deletedAt: null } });
    if (!territory) throw new NotFoundException('Territory not found');
    return prisma.salesTeamMember.create({ data: { tenantId, territoryId, userId: dto.userId, role: dto.role || 'REP' } });
  }

  async removeTeamMember(tenantId: string, territoryId: string, userId: string) {
    const member = await prisma.salesTeamMember.findFirst({ where: { territoryId, userId, tenantId } });
    if (!member) throw new NotFoundException('Team member not found');
    return prisma.salesTeamMember.delete({ where: { id: member.id } });
  }

  async getTerritoryPerformance(tenantId: string) {
    const territories = await prisma.salesTerritory.findMany({
      where: { tenantId, deletedAt: null },
      include: { members: true },
    });
    const results = [];
    for (const t of territories) {
      const memberIds = t.members.map((m) => m.userId);
      if (memberIds.length === 0) { results.push({ territoryId: t.id, name: t.name, deals: 0, revenue: 0, members: 0 }); continue; }
      const wonOpps = await prisma.opportunity.findMany({
        where: { tenantId, deletedAt: null, stage: 'CLOSED_WON', assignedToId: { in: memberIds } },
        select: { amount: true },
      });
      results.push({
        territoryId: t.id, name: t.name, members: memberIds.length,
        deals: wonOpps.length, revenue: wonOpps.reduce((s, o) => s + Number(o.amount || 0), 0),
      });
    }
    return results.sort((a, b) => b.revenue - a.revenue);
  }

  // ════════════════════════════════════════════════
  // PHASE 5: COMMISSIONS
  // ════════════════════════════════════════════════

  async getCommissionRules(tenantId: string) {
    return prisma.commissionRule.findMany({ where: { tenantId }, include: { _count: { select: { entries: true } } }, orderBy: { createdAt: 'desc' } });
  }

  async createCommissionRule(tenantId: string, orgId: string, dto: CreateCommissionRuleInput) {
    const resolvedOrgId = await this.resolveOrgId(tenantId, orgId);
    return prisma.commissionRule.create({
      data: {
        tenantId, orgId: resolvedOrgId, name: dto.name, type: dto.type || 'PERCENTAGE',
        rate: new Prisma.Decimal(dto.rate), tiers: dto.tiers as Prisma.InputJsonValue,
        appliesToAll: dto.appliesToAll ?? true, productIds: dto.productIds as Prisma.InputJsonValue,
      },
    });
  }

  async updateCommissionRule(tenantId: string, id: string, dto: UpdateCommissionRuleInput) {
    const existing = await prisma.commissionRule.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Commission rule not found');
    return prisma.commissionRule.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.rate !== undefined && { rate: new Prisma.Decimal(dto.rate) }),
        ...(dto.tiers !== undefined && { tiers: dto.tiers as Prisma.InputJsonValue }),
        ...(dto.appliesToAll !== undefined && { appliesToAll: dto.appliesToAll }),
        ...(dto.productIds !== undefined && { productIds: dto.productIds as Prisma.InputJsonValue }),
      },
    });
  }

  async deleteCommissionRule(tenantId: string, id: string) {
    const existing = await prisma.commissionRule.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Commission rule not found');
    return prisma.commissionRule.delete({ where: { id } });
  }

  async getCommissionEntries(tenantId: string, userId?: string) {
    const where: Prisma.CommissionEntryWhereInput = { tenantId };
    if (userId) where.userId = userId;
    return prisma.commissionEntry.findMany({ where, include: { rule: { select: { name: true, type: true } } }, orderBy: { createdAt: 'desc' } });
  }

  async calculateCommissions(tenantId: string, dto: CalculateCommissionsInput) {
    const start = new Date(dto.periodStart);
    const end = new Date(dto.periodEnd);
    const rules = await prisma.commissionRule.findMany({ where: { tenantId, isActive: true } });
    const wonOpps = await prisma.opportunity.findMany({
      where: { tenantId, deletedAt: null, stage: 'CLOSED_WON', actualCloseDate: { gte: start, lte: end }, assignedToId: { not: null } },
      select: { id: true, amount: true, assignedToId: true },
    });
    const entries = [];
    for (const opp of wonOpps) {
      for (const rule of rules) {
        const amount = Number(opp.amount || 0);
        let commission = 0;
        if (rule.type === 'PERCENTAGE') commission = amount * Number(rule.rate) / 100;
        else if (rule.type === 'FLAT') commission = Number(rule.rate);
        else if (rule.type === 'TIERED') {
          const tiers = rule.tiers as Array<{ min: number; max: number; rate: number }>;
          for (const tier of tiers) { if (amount >= tier.min && amount <= tier.max) { commission = amount * tier.rate / 100; break; } }
        }
        if (commission > 0) {
          entries.push(await prisma.commissionEntry.create({
            data: { tenantId, userId: opp.assignedToId!, opportunityId: opp.id, ruleId: rule.id, amount: new Prisma.Decimal(commission), periodStart: start, periodEnd: end },
          }));
        }
      }
    }
    return { calculated: entries.length, entries };
  }

  // ════════════════════════════════════════════════
  // PHASE 6: WEB-TO-LEAD FORMS
  // ════════════════════════════════════════════════

  async getWebForms(tenantId: string) {
    return prisma.webToLeadForm.findMany({ where: { tenantId, deletedAt: null }, orderBy: { createdAt: 'desc' } });
  }

  async createWebForm(tenantId: string, orgId: string, dto: CreateWebToLeadFormInput) {
    const resolvedOrgId = await this.resolveOrgId(tenantId, orgId);
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
    await this.recalculateLeadScore(form.tenantId, lead.id);
    return lead;
  }

  async getWebFormEmbed(tenantId: string, id: string) {
    const form = await prisma.webToLeadForm.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!form) throw new NotFoundException('Form not found');
    return { embedCode: form.embedCode, fields: form.fields, settings: form.settings };
  }

  // ════════════════════════════════════════════════
  // PHASE 6: DOCUMENTS
  // ════════════════════════════════════════════════

  async getCrmDocuments(tenantId: string, entityType?: string, entityId?: string) {
    const where: Prisma.CrmDocumentWhereInput = { tenantId, deletedAt: null };
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;
    return prisma.crmDocument.findMany({ where, orderBy: { createdAt: 'desc' } });
  }

  async createCrmDocument(tenantId: string, orgId: string, dto: CreateCrmDocumentInput, uploadedBy: string) {
    const resolvedOrgId = await this.resolveOrgId(tenantId, orgId);
    return prisma.crmDocument.create({
      data: {
        tenantId, orgId: resolvedOrgId, name: dto.name, type: dto.type,
        fileUrl: dto.fileUrl, fileSize: dto.fileSize || null, mimeType: dto.mimeType || null,
        entityType: dto.entityType, entityId: dto.entityId, uploadedBy,
      },
    });
  }

  async deleteCrmDocument(tenantId: string, id: string) {
    const doc = await prisma.crmDocument.findFirst({ where: { id, tenantId } });
    if (!doc) throw new NotFoundException('Document not found');
    return prisma.crmDocument.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  // ════════════════════════════════════════════════
  // PHASE 6: IMPORT/EXPORT
  // ════════════════════════════════════════════════

  async importContacts(tenantId: string, orgId: string, rows: Array<Record<string, string>>) {
    const resolvedOrgId = await this.resolveOrgId(tenantId, orgId);
    let success = 0;
    let failed = 0;
    const errors: Array<{ row: number; error: string }> = [];
    for (let i = 0; i < rows.length; i++) {
      try {
        const r = rows[i];
        if (!r.firstName || !r.lastName) { failed++; errors.push({ row: i + 1, error: 'Missing firstName or lastName' }); continue; }
        await prisma.contact.create({
          data: {
            tenantId, orgId: resolvedOrgId,
            firstName: r.firstName, lastName: r.lastName,
            email: r.email || null, phone: r.phone || null, mobile: r.mobile || null,
            title: r.title || null, department: r.department || null,
          },
        });
        success++;
      } catch {
        failed++;
        errors.push({ row: i + 1, error: 'Database error' });
      }
    }
    return { success, failed, errors };
  }

  async exportContacts(tenantId: string) {
    const contacts = await prisma.contact.findMany({
      where: { tenantId, deletedAt: null },
      select: { firstName: true, lastName: true, email: true, phone: true, mobile: true, title: true, department: true, isPrimary: true },
      orderBy: { firstName: 'asc' },
    });
    const headers = ['firstName', 'lastName', 'email', 'phone', 'mobile', 'title', 'department', 'isPrimary'];
    const csvRows = [headers.join(',')];
    for (const c of contacts) {
      csvRows.push(headers.map((h) => `"${String((c as Record<string, unknown>)[h] || '').replace(/"/g, '""')}"`).join(','));
    }
    return csvRows.join('\n');
  }

  async importLeads(tenantId: string, orgId: string, rows: Array<Record<string, string>>) {
    const resolvedOrgId = await this.resolveOrgId(tenantId, orgId);
    let success = 0;
    let failed = 0;
    const errors: Array<{ row: number; error: string }> = [];
    for (let i = 0; i < rows.length; i++) {
      try {
        const r = rows[i];
        if (!r.firstName || !r.lastName) { failed++; errors.push({ row: i + 1, error: 'Missing firstName or lastName' }); continue; }
        const lead = await prisma.lead.create({
          data: {
            tenantId, orgId: resolvedOrgId,
            firstName: r.firstName, lastName: r.lastName,
            email: r.email || null, phone: r.phone || null,
            company: r.company || null, industry: r.industry || null,
          },
        });
        await this.recalculateLeadScore(tenantId, lead.id);
        success++;
      } catch {
        failed++;
        errors.push({ row: i + 1, error: 'Database error' });
      }
    }
    return { success, failed, errors };
  }

  async exportLeads(tenantId: string) {
    const leads = await prisma.lead.findMany({
      where: { tenantId, deletedAt: null },
      select: { firstName: true, lastName: true, email: true, phone: true, company: true, status: true, score: true, industry: true },
      orderBy: { createdAt: 'desc' },
    });
    const headers = ['firstName', 'lastName', 'email', 'phone', 'company', 'status', 'score', 'industry'];
    const csvRows = [headers.join(',')];
    for (const l of leads) {
      csvRows.push(headers.map((h) => `"${String((l as Record<string, unknown>)[h] || '').replace(/"/g, '""')}"`).join(','));
    }
    return csvRows.join('\n');
  }

  // ════════════════════════════════════════════════
  // HELPERS
  // ════════════════════════════════════════════════

  // ════════════════════════════════════════════════
  // PHASE 7: CUSTOM FIELDS
  // ════════════════════════════════════════════════

  async getCustomFields(tenantId: string, entity: string) {
    return prisma.customField.findMany({
      where: { tenantId, entity, deletedAt: null },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async createCustomField(tenantId: string, orgId: string, dto: CreateCustomFieldInput, createdBy: string) {
    const resolvedOrgId = await this.resolveOrgId(tenantId, orgId);
    return prisma.customField.create({
      data: {
        tenantId, orgId: resolvedOrgId,
        entity: dto.entity, name: dto.name, label: dto.label,
        fieldType: dto.fieldType, options: dto.options as Prisma.InputJsonValue,
        isRequired: dto.isRequired || false, sortOrder: dto.sortOrder || 0,
        defaultValue: dto.defaultValue || null, createdBy,
      },
    });
  }

  async updateCustomField(tenantId: string, id: string, dto: UpdateCustomFieldInput) {
    const existing = await prisma.customField.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!existing) throw new NotFoundException('Custom field not found');
    return prisma.customField.update({
      where: { id },
      data: {
        ...(dto.label !== undefined && { label: dto.label }),
        ...(dto.fieldType !== undefined && { fieldType: dto.fieldType }),
        ...(dto.options !== undefined && { options: dto.options as Prisma.InputJsonValue }),
        ...(dto.isRequired !== undefined && { isRequired: dto.isRequired }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
        ...(dto.defaultValue !== undefined && { defaultValue: dto.defaultValue }),
      },
    });
  }

  async deleteCustomField(tenantId: string, id: string) {
    const existing = await prisma.customField.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Custom field not found');
    return prisma.customField.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async getCustomFieldValues(tenantId: string, entityType: string, entityId: string) {
    return prisma.customFieldValue.findMany({
      where: { tenantId, entityType, entityId },
      include: { field: true },
    });
  }

  async upsertCustomFieldValues(tenantId: string, entityType: string, entityId: string, values: Array<{ fieldId: string; value: string }>) {
    const results = [];
    for (const v of values) {
      const result = await prisma.customFieldValue.upsert({
        where: { fieldId_entityId: { fieldId: v.fieldId, entityId } },
        create: { tenantId, fieldId: v.fieldId, entityType, entityId, value: v.value },
        update: { value: v.value },
      });
      results.push(result);
    }
    return results;
  }

  async getRecordTypes(tenantId: string, entity: string) {
    return prisma.recordType.findMany({
      where: { tenantId, entity, deletedAt: null },
      orderBy: { name: 'asc' },
    });
  }

  async createRecordType(tenantId: string, orgId: string, dto: CreateRecordTypeInput) {
    const resolvedOrgId = await this.resolveOrgId(tenantId, orgId);
    if (dto.isDefault) {
      await prisma.recordType.updateMany({ where: { tenantId, entity: dto.entity }, data: { isDefault: false } });
    }
    return prisma.recordType.create({
      data: {
        tenantId, orgId: resolvedOrgId,
        entity: dto.entity, name: dto.name, description: dto.description || null,
        isDefault: dto.isDefault || false,
        fieldLayout: dto.fieldLayout as Prisma.InputJsonValue,
      },
    });
  }

  async updateRecordType(tenantId: string, id: string, dto: UpdateRecordTypeInput) {
    const existing = await prisma.recordType.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!existing) throw new NotFoundException('Record type not found');
    if (dto.isDefault) {
      await prisma.recordType.updateMany({ where: { tenantId, entity: existing.entity, id: { not: id } }, data: { isDefault: false } });
    }
    return prisma.recordType.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.isDefault !== undefined && { isDefault: dto.isDefault }),
        ...(dto.fieldLayout !== undefined && { fieldLayout: dto.fieldLayout as Prisma.InputJsonValue }),
      },
    });
  }

  async deleteRecordType(tenantId: string, id: string) {
    const existing = await prisma.recordType.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Record type not found');
    return prisma.recordType.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  // ════════════════════════════════════════════════
  // PHASE 8: APPROVALS
  // ════════════════════════════════════════════════

  async getApprovalProcesses(tenantId: string) {
    return prisma.approvalProcess.findMany({
      where: { tenantId, deletedAt: null },
      include: { _count: { select: { requests: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createApprovalProcess(tenantId: string, orgId: string, dto: CreateApprovalProcessInput, createdBy: string) {
    const resolvedOrgId = await this.resolveOrgId(tenantId, orgId);
    return prisma.approvalProcess.create({
      data: {
        tenantId, orgId: resolvedOrgId,
        name: dto.name, entity: dto.entity,
        conditions: dto.conditions as Prisma.InputJsonValue,
        steps: dto.steps as Prisma.InputJsonValue,
        isActive: dto.isActive ?? true, createdBy,
      },
    });
  }

  async updateApprovalProcess(tenantId: string, id: string, dto: UpdateApprovalProcessInput) {
    const existing = await prisma.approvalProcess.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!existing) throw new NotFoundException('Approval process not found');
    return prisma.approvalProcess.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.entity !== undefined && { entity: dto.entity }),
        ...(dto.conditions !== undefined && { conditions: dto.conditions as Prisma.InputJsonValue }),
        ...(dto.steps !== undefined && { steps: dto.steps as Prisma.InputJsonValue }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  async deleteApprovalProcess(tenantId: string, id: string) {
    const existing = await prisma.approvalProcess.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Approval process not found');
    return prisma.approvalProcess.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async submitForApproval(tenantId: string, userId: string, entityType: string, entityId: string, processId?: string) {
    let process;
    if (processId) {
      process = await prisma.approvalProcess.findFirst({ where: { id: processId, tenantId, isActive: true, deletedAt: null } });
    } else {
      process = await prisma.approvalProcess.findFirst({ where: { tenantId, entity: entityType, isActive: true, deletedAt: null } });
    }
    if (!process) throw new NotFoundException('No matching approval process found');
    return prisma.approvalRequest.create({
      data: {
        tenantId, processId: process.id,
        entityType, entityId,
        submittedBy: userId, status: 'PENDING', currentStep: 0,
      },
    });
  }

  async getPendingApprovals(tenantId: string, _userId: string) {
    return prisma.approvalRequest.findMany({
      where: { tenantId, status: 'PENDING' },
      include: { process: { select: { id: true, name: true, steps: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approveRequest(tenantId: string, requestId: string, userId: string, comments?: string) {
    const request = await prisma.approvalRequest.findFirst({ where: { id: requestId, tenantId, status: 'PENDING' } });
    if (!request) throw new NotFoundException('Approval request not found or not pending');
    const process = await prisma.approvalProcess.findFirst({ where: { id: request.processId } });
    if (!process) throw new NotFoundException('Approval process not found');
    const steps = process.steps as Array<{ approvers: string[] }>;
    await prisma.approvalAction.create({
      data: { requestId, userId, action: 'APPROVED', comments: comments || null },
    });
    const nextStep = request.currentStep + 1;
    if (nextStep >= steps.length) {
      return prisma.approvalRequest.update({
        where: { id: requestId },
        data: { status: 'APPROVED', currentStep: nextStep, completedAt: new Date() },
      });
    }
    return prisma.approvalRequest.update({
      where: { id: requestId },
      data: { currentStep: nextStep },
    });
  }

  async rejectRequest(tenantId: string, requestId: string, userId: string, comments: string) {
    const request = await prisma.approvalRequest.findFirst({ where: { id: requestId, tenantId, status: 'PENDING' } });
    if (!request) throw new NotFoundException('Approval request not found or not pending');
    await prisma.approvalAction.create({
      data: { requestId, userId, action: 'REJECTED', comments },
    });
    return prisma.approvalRequest.update({
      where: { id: requestId },
      data: { status: 'REJECTED', completedAt: new Date() },
    });
  }

  async recallRequest(tenantId: string, requestId: string, userId: string) {
    const request = await prisma.approvalRequest.findFirst({ where: { id: requestId, tenantId, status: 'PENDING' } });
    if (!request) throw new NotFoundException('Approval request not found or not pending');
    if (request.submittedBy !== userId) throw new BadRequestException('Only the submitter can recall this request');
    return prisma.approvalRequest.update({
      where: { id: requestId },
      data: { status: 'RECALLED' },
    });
  }

  async getApprovalHistory(tenantId: string, entityType: string, entityId: string) {
    return prisma.approvalRequest.findMany({
      where: { tenantId, entityType, entityId },
      include: { actions: { orderBy: { createdAt: 'asc' } }, process: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ════════════════════════════════════════════════
  // PHASE 9: CPQ (CONFIGURE-PRICE-QUOTE)
  // ════════════════════════════════════════════════

  async getQuotationTemplates(tenantId: string) {
    return prisma.quotationTemplate.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createQuotationTemplate(tenantId: string, orgId: string, dto: CreateQuotationTemplateInput) {
    const resolvedOrgId = await this.resolveOrgId(tenantId, orgId);
    if (dto.isDefault) {
      await prisma.quotationTemplate.updateMany({ where: { tenantId }, data: { isDefault: false } });
    }
    return prisma.quotationTemplate.create({
      data: {
        tenantId, orgId: resolvedOrgId,
        name: dto.name, description: dto.description || null,
        headerHtml: dto.headerHtml || null, footerHtml: dto.footerHtml || null,
        bodyTemplate: dto.bodyTemplate || null,
        styles: dto.styles as Prisma.InputJsonValue,
        isDefault: dto.isDefault || false,
      },
    });
  }

  async updateQuotationTemplate(tenantId: string, id: string, dto: UpdateQuotationTemplateInput) {
    const existing = await prisma.quotationTemplate.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!existing) throw new NotFoundException('Quotation template not found');
    if (dto.isDefault) {
      await prisma.quotationTemplate.updateMany({ where: { tenantId, id: { not: id } }, data: { isDefault: false } });
    }
    return prisma.quotationTemplate.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.headerHtml !== undefined && { headerHtml: dto.headerHtml }),
        ...(dto.footerHtml !== undefined && { footerHtml: dto.footerHtml }),
        ...(dto.bodyTemplate !== undefined && { bodyTemplate: dto.bodyTemplate }),
        ...(dto.styles !== undefined && { styles: dto.styles as Prisma.InputJsonValue }),
        ...(dto.isDefault !== undefined && { isDefault: dto.isDefault }),
      },
    });
  }

  async deleteQuotationTemplate(tenantId: string, id: string) {
    const existing = await prisma.quotationTemplate.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Quotation template not found');
    return prisma.quotationTemplate.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async createQuotationVersion(tenantId: string, quotationId: string, userId: string, note?: string) {
    const quotation = await prisma.quotation.findFirst({
      where: { id: quotationId, tenantId },
      include: { lineItems: true },
    });
    if (!quotation) throw new NotFoundException('Quotation not found');
    const lastVersion = await prisma.quotationVersion.findFirst({
      where: { quotationId }, orderBy: { versionNumber: 'desc' },
    });
    const versionNumber = (lastVersion?.versionNumber || 0) + 1;
    return prisma.quotationVersion.create({
      data: {
        tenantId, quotationId, versionNumber,
        snapshot: { quotation, lineItems: quotation.lineItems } as unknown as Prisma.InputJsonValue,
        createdBy: userId, note: note || null,
      },
    });
  }

  async getQuotationVersions(tenantId: string, quotationId: string) {
    return prisma.quotationVersion.findMany({
      where: { tenantId, quotationId },
      orderBy: { versionNumber: 'desc' },
    });
  }

  async cloneQuotation(tenantId: string, quotationId: string, userId: string) {
    const original = await prisma.quotation.findFirst({
      where: { id: quotationId, tenantId },
      include: { lineItems: true },
    });
    if (!original) throw new NotFoundException('Quotation not found');
    const { id: _id, createdAt: _ca, updatedAt: _ua, lineItems, quotationNumber: _qn, ...rest } = original;
    return prisma.quotation.create({
      data: {
        ...rest,
        title: `[COPY] ${original.title}`,
        status: 'DRAFT',
        createdBy: userId,
        lineItems: {
          create: lineItems.map(({ id: _liId, quotationId: _qId, createdAt: _liCa, updatedAt: _liUa, ...liRest }) => liRest),
        },
      },
      include: { lineItems: true },
    });
  }

  async sendForSignature(tenantId: string, quotationId: string, signerName: string, signerEmail: string) {
    const quotation = await prisma.quotation.findFirst({ where: { id: quotationId, tenantId } });
    if (!quotation) throw new NotFoundException('Quotation not found');
    const token = createId();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    return prisma.quotationSignature.create({
      data: {
        tenantId, quotationId, signerName, signerEmail,
        token, expiresAt, status: 'PENDING',
      },
    });
  }

  async getQuotationBySignToken(token: string) {
    const signature = await prisma.quotationSignature.findFirst({
      where: { token },
      include: { quotation: { include: { lineItems: true, customer: { select: { id: true, name: true } } } } },
    });
    if (!signature) throw new NotFoundException('Invalid signature token');
    if (signature.expiresAt < new Date()) throw new BadRequestException('Signature link has expired');
    return signature;
  }

  async submitSignature(token: string, signatureData: string, ipAddress: string) {
    const signature = await prisma.quotationSignature.findFirst({ where: { token, status: 'PENDING' } });
    if (!signature) throw new NotFoundException('Invalid or already used signature token');
    if (signature.expiresAt < new Date()) throw new BadRequestException('Signature link has expired');
    await prisma.quotationSignature.update({
      where: { id: signature.id },
      data: { status: 'SIGNED', signedAt: new Date(), signatureData, ipAddress },
    });
    return prisma.quotation.update({
      where: { id: signature.quotationId },
      data: { status: 'ACCEPTED' },
    });
  }

  // ════════════════════════════════════════════════
  // PHASE 10: COLLABORATION
  // ════════════════════════════════════════════════

  async getComments(tenantId: string, entityType: string, entityId: string) {
    return prisma.crmComment.findMany({
      where: { tenantId, entityType, entityId, deletedAt: null, parentId: null },
      include: { replies: { where: { deletedAt: null }, orderBy: { createdAt: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createComment(tenantId: string, userId: string, entityType: string, entityId: string, dto: CreateCrmCommentInput) {
    return prisma.crmComment.create({
      data: {
        tenantId, entityType, entityId,
        body: dto.body, createdBy: userId,
        parentId: dto.parentId || null,
      },
    });
  }

  async updateComment(tenantId: string, id: string, userId: string, body: string) {
    const comment = await prisma.crmComment.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.createdBy !== userId) throw new BadRequestException('You can only edit your own comments');
    return prisma.crmComment.update({ where: { id }, data: { body } });
  }

  async deleteComment(tenantId: string, id: string, userId: string) {
    const comment = await prisma.crmComment.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.createdBy !== userId) throw new BadRequestException('You can only delete your own comments');
    return prisma.crmComment.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async togglePinComment(tenantId: string, id: string) {
    const comment = await prisma.crmComment.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!comment) throw new NotFoundException('Comment not found');
    return prisma.crmComment.update({ where: { id }, data: { isPinned: !comment.isPinned } });
  }

  async getFollowers(tenantId: string, entityType: string, entityId: string) {
    return prisma.crmFollower.findMany({
      where: { tenantId, entityType, entityId },
    });
  }

  async followRecord(tenantId: string, userId: string, entityType: string, entityId: string) {
    try {
      return await prisma.crmFollower.create({
        data: { tenantId, userId, entityType, entityId },
      });
    } catch (e: unknown) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        return prisma.crmFollower.findFirst({ where: { tenantId, userId, entityType, entityId } });
      }
      throw e;
    }
  }

  async unfollowRecord(tenantId: string, userId: string, entityType: string, entityId: string) {
    const follower = await prisma.crmFollower.findFirst({ where: { tenantId, userId, entityType, entityId } });
    if (!follower) throw new NotFoundException('Not following this record');
    return prisma.crmFollower.delete({ where: { id: follower.id } });
  }

  async getNotes(tenantId: string, entityType: string, entityId: string) {
    return prisma.crmNote.findMany({
      where: { tenantId, entityType, entityId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createNote(tenantId: string, userId: string, entityType: string, entityId: string, dto: CreateCrmNoteInput) {
    return prisma.crmNote.create({
      data: {
        tenantId, entityType, entityId,
        title: dto.title || null, body: dto.body,
        createdBy: userId,
      },
    });
  }

  async updateNote(tenantId: string, id: string, dto: UpdateCrmNoteInput) {
    const existing = await prisma.crmNote.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!existing) throw new NotFoundException('Note not found');
    return prisma.crmNote.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.body !== undefined && { body: dto.body }),
      },
    });
  }

  async deleteNote(tenantId: string, id: string) {
    const existing = await prisma.crmNote.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Note not found');
    return prisma.crmNote.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async togglePinNote(tenantId: string, id: string) {
    const note = await prisma.crmNote.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!note) throw new NotFoundException('Note not found');
    return prisma.crmNote.update({ where: { id }, data: { isPinned: !note.isPinned } });
  }

  async getUnifiedActivityFeed(tenantId: string, entityType: string, entityId: string) {
    const [comments, notes, activities, documents] = await Promise.all([
      prisma.crmComment.findMany({ where: { tenantId, entityType, entityId, deletedAt: null }, orderBy: { createdAt: 'desc' }, take: 50 }),
      prisma.crmNote.findMany({ where: { tenantId, entityType, entityId, deletedAt: null }, orderBy: { createdAt: 'desc' }, take: 50 }),
      prisma.activity.findMany({ where: { tenantId, ...(entityType === 'LEAD' ? { leadId: entityId } : entityType === 'OPPORTUNITY' ? { opportunityId: entityId } : entityType === 'CUSTOMER' ? { customerId: entityId } : {}) }, orderBy: { createdAt: 'desc' }, take: 50 }),
      prisma.crmDocument.findMany({ where: { tenantId, entityType, entityId, deletedAt: null }, orderBy: { createdAt: 'desc' }, take: 50 }),
    ]);
    const feed = [
      ...comments.map((c) => ({ type: 'COMMENT' as const, id: c.id, data: c, createdAt: c.createdAt })),
      ...notes.map((n) => ({ type: 'NOTE' as const, id: n.id, data: n, createdAt: n.createdAt })),
      ...activities.map((a) => ({ type: 'ACTIVITY' as const, id: a.id, data: a, createdAt: a.createdAt })),
      ...documents.map((d) => ({ type: 'DOCUMENT' as const, id: d.id, data: d, createdAt: d.createdAt })),
    ];
    feed.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return feed.slice(0, 50);
  }

  // ════════════════════════════════════════════════
  // PHASE 11: PLAYBOOKS
  // ════════════════════════════════════════════════

  async getPlaybooks(tenantId: string) {
    return prisma.playbook.findMany({
      where: { tenantId, deletedAt: null },
      include: { _count: { select: { stages: true, battlecards: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createPlaybook(tenantId: string, orgId: string, dto: CreatePlaybookInput, createdBy: string) {
    const resolvedOrgId = await this.resolveOrgId(tenantId, orgId);
    return prisma.playbook.create({
      data: {
        tenantId, orgId: resolvedOrgId,
        name: dto.name, description: dto.description || null,
        pipelineId: dto.pipelineId || null, isActive: dto.isActive ?? true,
        createdBy,
      },
    });
  }

  async updatePlaybook(tenantId: string, id: string, dto: UpdatePlaybookInput) {
    const existing = await prisma.playbook.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!existing) throw new NotFoundException('Playbook not found');
    return prisma.playbook.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.pipelineId !== undefined && { pipelineId: dto.pipelineId }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  async deletePlaybook(tenantId: string, id: string) {
    const existing = await prisma.playbook.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Playbook not found');
    return prisma.playbook.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async getPlaybookStages(tenantId: string, playbookId: string) {
    return prisma.playbookStage.findMany({
      where: { playbookId, playbook: { tenantId } },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async upsertPlaybookStages(tenantId: string, playbookId: string, stages: Array<{ stageName: string; requiredFields?: string[]; requiredChecklist?: string[]; sortOrder: number }>) {
    const playbook = await prisma.playbook.findFirst({ where: { id: playbookId, tenantId, deletedAt: null } });
    if (!playbook) throw new NotFoundException('Playbook not found');
    return prisma.$transaction(async (tx) => {
      await tx.playbookStage.deleteMany({ where: { playbookId } });
      return tx.playbookStage.createMany({
        data: stages.map((s) => ({
          playbookId, stageName: s.stageName,
          requiredFields: s.requiredFields as unknown as Prisma.InputJsonValue,
          requiredChecklist: s.requiredChecklist as unknown as Prisma.InputJsonValue,
          sortOrder: s.sortOrder,
        })),
      });
    });
  }

  async getBattlecards(tenantId: string) {
    return prisma.battlecard.findMany({
      where: { tenantId, deletedAt: null },
      include: { playbook: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createBattlecard(tenantId: string, dto: CreateBattlecardInput, createdBy: string) {
    return prisma.battlecard.create({
      data: {
        tenantId, playbookId: dto.playbookId || null,
        competitor: dto.competitor, strengths: dto.strengths as Prisma.InputJsonValue,
        weaknesses: dto.weaknesses as Prisma.InputJsonValue,
        talkingPoints: dto.talkingPoints as Prisma.InputJsonValue,
        objectionHandling: dto.objectionHandling as Prisma.InputJsonValue,
        createdBy,
      },
    });
  }

  async updateBattlecard(tenantId: string, id: string, dto: UpdateBattlecardInput) {
    const existing = await prisma.battlecard.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!existing) throw new NotFoundException('Battlecard not found');
    return prisma.battlecard.update({
      where: { id },
      data: {
        ...(dto.competitor !== undefined && { competitor: dto.competitor }),
        ...(dto.strengths !== undefined && { strengths: dto.strengths as Prisma.InputJsonValue }),
        ...(dto.weaknesses !== undefined && { weaknesses: dto.weaknesses as Prisma.InputJsonValue }),
        ...(dto.talkingPoints !== undefined && { talkingPoints: dto.talkingPoints as Prisma.InputJsonValue }),
        ...(dto.objectionHandling !== undefined && { objectionHandling: dto.objectionHandling as Prisma.InputJsonValue }),
        ...(dto.playbookId !== undefined && { playbookId: dto.playbookId }),
      },
    });
  }

  async deleteBattlecard(tenantId: string, id: string) {
    const existing = await prisma.battlecard.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Battlecard not found');
    return prisma.battlecard.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async getBattlecardByCompetitor(tenantId: string, competitor: string) {
    return prisma.battlecard.findFirst({
      where: { tenantId, competitor, deletedAt: null },
      include: { playbook: { select: { id: true, name: true } } },
    });
  }

  async getOpportunityChecklist(tenantId: string, opportunityId: string) {
    return prisma.opportunityChecklist.findMany({
      where: { opportunityId, opportunity: { tenantId } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async toggleChecklistItem(tenantId: string, opportunityId: string, itemId: string, userId: string) {
    const existing = await prisma.opportunityChecklist.findFirst({
      where: { id: itemId, opportunityId, opportunity: { tenantId } },
    });
    if (!existing) throw new NotFoundException('Checklist item not found');
    return prisma.opportunityChecklist.update({
      where: { id: itemId },
      data: {
        isCompleted: !existing.isCompleted,
        completedBy: !existing.isCompleted ? userId : null,
        completedAt: !existing.isCompleted ? new Date() : null,
      },
    });
  }

  async validateStageAdvance(tenantId: string, opportunityId: string, targetStage: string) {
    const opp = await prisma.opportunity.findFirst({
      where: { id: opportunityId, tenantId, deletedAt: null },
      include: { pipeline: true },
    });
    if (!opp) throw new NotFoundException('Opportunity not found');
    const blockers: string[] = [];
    const playbook = await prisma.playbook.findFirst({
      where: { tenantId, pipelineId: opp.pipelineId, isActive: true, deletedAt: null },
      include: { stages: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!playbook) return { canAdvance: true, blockers: [] };
    const stageConfig = playbook.stages.find((s) => s.stageName === targetStage);
    if (!stageConfig) return { canAdvance: true, blockers: [] };
    const requiredFields = stageConfig.requiredFields as string[] | null;
    if (requiredFields && requiredFields.length > 0) {
      for (const field of requiredFields) {
        if (!(opp as Record<string, unknown>)[field]) {
          blockers.push(`Required field "${field}" is missing`);
        }
      }
    }
    const requiredChecklist = stageConfig.requiredChecklist as string[] | null;
    if (requiredChecklist && requiredChecklist.length > 0) {
      const checklistItems = await prisma.opportunityChecklist.findMany({
        where: { opportunityId, label: { in: requiredChecklist } },
      });
      for (const label of requiredChecklist) {
        const item = checklistItems.find((c) => c.label === label);
        if (!item || !item.isCompleted) {
          blockers.push(`Required checklist item "${label}" is not completed`);
        }
      }
    }
    return { canAdvance: blockers.length === 0, blockers };
  }

  // ════════════════════════════════════════════════
  // PHASE 12: DASHBOARDS
  // ════════════════════════════════════════════════

  async getDashboards(tenantId: string, userId: string) {
    return prisma.crmDashboard.findMany({
      where: { tenantId, deletedAt: null, OR: [{ createdBy: userId }, { isShared: true }] },
      include: { _count: { select: { widgets: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createDashboard(tenantId: string, orgId: string, userId: string, dto: CreateCrmDashboardInput) {
    const resolvedOrgId = await this.resolveOrgId(tenantId, orgId);
    return prisma.crmDashboard.create({
      data: {
        tenantId, orgId: resolvedOrgId,
        name: dto.name, description: dto.description || null,
        layout: dto.layout as Prisma.InputJsonValue,
        isShared: dto.isShared || false, isDefault: dto.isDefault || false,
        createdBy: userId,
      },
    });
  }

  async updateDashboard(tenantId: string, id: string, dto: UpdateCrmDashboardInput) {
    const existing = await prisma.crmDashboard.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!existing) throw new NotFoundException('Dashboard not found');
    return prisma.crmDashboard.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.layout !== undefined && { layout: dto.layout as Prisma.InputJsonValue }),
        ...(dto.isShared !== undefined && { isShared: dto.isShared }),
        ...(dto.isDefault !== undefined && { isDefault: dto.isDefault }),
      },
    });
  }

  async deleteDashboard(tenantId: string, id: string) {
    const existing = await prisma.crmDashboard.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Dashboard not found');
    return prisma.crmDashboard.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async cloneDashboard(tenantId: string, id: string, userId: string) {
    const original = await prisma.crmDashboard.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: { widgets: true },
    });
    if (!original) throw new NotFoundException('Dashboard not found');
    return prisma.crmDashboard.create({
      data: {
        tenantId, orgId: original.orgId,
        name: `[COPY] ${original.name}`, description: original.description,
        layout: original.layout as Prisma.InputJsonValue,
        isShared: false, isDefault: false, createdBy: userId,
        widgets: {
          create: original.widgets.map(({ id: _wid, dashboardId: _did, createdAt: _wca, updatedAt: _wua, ...wRest }) => ({
            ...wRest,
            config: wRest.config as Prisma.InputJsonValue,
          })),
        },
      },
      include: { widgets: true },
    });
  }

  async addWidget(tenantId: string, dashboardId: string, dto: CreateDashboardWidgetInput) {
    const dashboard = await prisma.crmDashboard.findFirst({ where: { id: dashboardId, tenantId, deletedAt: null } });
    if (!dashboard) throw new NotFoundException('Dashboard not found');
    return prisma.dashboardWidget.create({
      data: {
        dashboardId, name: dto.name, widgetType: dto.widgetType,
        dataSource: dto.dataSource, config: dto.config as Prisma.InputJsonValue,
        width: dto.width || 6, height: dto.height || 4,
        posX: dto.posX || 0, posY: dto.posY || 0,
      },
    });
  }

  async updateWidget(tenantId: string, widgetId: string, dto: UpdateDashboardWidgetInput) {
    const widget = await prisma.dashboardWidget.findFirst({
      where: { id: widgetId, dashboard: { tenantId } },
    });
    if (!widget) throw new NotFoundException('Widget not found');
    return prisma.dashboardWidget.update({
      where: { id: widgetId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.widgetType !== undefined && { widgetType: dto.widgetType }),
        ...(dto.dataSource !== undefined && { dataSource: dto.dataSource }),
        ...(dto.config !== undefined && { config: dto.config as Prisma.InputJsonValue }),
        ...(dto.width !== undefined && { width: dto.width }),
        ...(dto.height !== undefined && { height: dto.height }),
        ...(dto.posX !== undefined && { posX: dto.posX }),
        ...(dto.posY !== undefined && { posY: dto.posY }),
      },
    });
  }

  async removeWidget(tenantId: string, widgetId: string) {
    const widget = await prisma.dashboardWidget.findFirst({
      where: { id: widgetId, dashboard: { tenantId } },
    });
    if (!widget) throw new NotFoundException('Widget not found');
    return prisma.dashboardWidget.delete({ where: { id: widgetId } });
  }

  async updateLayout(tenantId: string, dashboardId: string, layout: unknown) {
    const dashboard = await prisma.crmDashboard.findFirst({ where: { id: dashboardId, tenantId, deletedAt: null } });
    if (!dashboard) throw new NotFoundException('Dashboard not found');
    return prisma.crmDashboard.update({
      where: { id: dashboardId },
      data: { layout: layout as Prisma.InputJsonValue },
    });
  }

  async getWidgetData(tenantId: string, widgetId: string) {
    const widget = await prisma.dashboardWidget.findFirst({
      where: { id: widgetId, dashboard: { tenantId } },
    });
    if (!widget) throw new NotFoundException('Widget not found');
    switch (widget.dataSource) {
      case 'PIPELINE_FUNNEL': return this.getPipelineFunnel(tenantId);
      case 'WIN_RATE': return this.getWinRate(tenantId);
      case 'LEAD_SOURCE': return this.getLeadSourceBreakdown(tenantId);
      case 'REVENUE_FORECAST': return this.getRevenueForecast(tenantId);
      case 'REP_PERFORMANCE': return this.getRepPerformance(tenantId);
      case 'DEAL_AGING': return this.getDealAging(tenantId);
      case 'PIPELINE_HEALTH': return this.getPipelineHealth(tenantId);
      case 'CONVERSION_FUNNEL': return this.getConversionFunnel(tenantId);
      case 'FORECAST': return this.getForecast(tenantId);
      case 'COHORT': return this.getCohortAnalysis(tenantId);
      case 'STAGE_DURATION': return this.getStageDuration(tenantId);
      default: return this.getPipelineFunnel(tenantId);
    }
  }

  getAvailableMetrics() {
    return [
      { key: 'PIPELINE_FUNNEL', label: 'Pipeline Funnel' },
      { key: 'WIN_RATE', label: 'Win Rate' },
      { key: 'LEAD_SOURCE', label: 'Lead Source Breakdown' },
      { key: 'REVENUE_FORECAST', label: 'Revenue Forecast' },
      { key: 'REP_PERFORMANCE', label: 'Rep Performance' },
      { key: 'DEAL_AGING', label: 'Deal Aging' },
      { key: 'PIPELINE_HEALTH', label: 'Pipeline Health' },
      { key: 'CONVERSION_FUNNEL', label: 'Conversion Funnel' },
      { key: 'FORECAST', label: 'Sales Forecast' },
      { key: 'COHORT', label: 'Cohort Analysis' },
      { key: 'STAGE_DURATION', label: 'Stage Duration' },
    ];
  }

  // ════════════════════════════════════════════════
  // HELPERS
  // ════════════════════════════════════════════════

  // ════════════════════════════════════════════════
  // PHASE 7: CUSTOM FIELDS & RECORD TYPES
  // ════════════════════════════════════════════════

  async getCustomFields(tenantId: string, entity?: string) {
    const where: Prisma.CrmCustomFieldWhereInput = { tenantId, deletedAt: null };
    if (entity) where.entity = entity;
    return prisma.crmCustomField.findMany({ where, orderBy: { sortOrder: 'asc' } });
  }

  async createCustomField(tenantId: string, orgId: string, dto: CreateCustomFieldInput, createdBy: string) {
    const resolvedOrgId = await this.resolveOrgId(tenantId, orgId);
    return prisma.crmCustomField.create({
      data: {
        tenantId, orgId: resolvedOrgId, entity: dto.entity, fieldName: dto.fieldName, label: dto.label,
        fieldType: dto.fieldType, description: dto.description || null, isRequired: dto.isRequired || false,
        defaultValue: dto.defaultValue || null, options: (dto.options || []) as Prisma.InputJsonValue,
        validation: (dto.validation || {}) as Prisma.InputJsonValue, lookupEntity: dto.lookupEntity || null,
        formulaExpr: dto.formulaExpr || null, sortOrder: dto.sortOrder || 0, section: dto.section || 'Custom Fields', createdBy,
      },
    });
  }

  async updateCustomField(tenantId: string, id: string, dto: UpdateCustomFieldInput) {
    const existing = await prisma.crmCustomField.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!existing) throw new NotFoundException('Custom field not found');
    return prisma.crmCustomField.update({
      where: { id },
      data: {
        ...(dto.label !== undefined && { label: dto.label }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.isRequired !== undefined && { isRequired: dto.isRequired }),
        ...(dto.defaultValue !== undefined && { defaultValue: dto.defaultValue }),
        ...(dto.options !== undefined && { options: dto.options as Prisma.InputJsonValue }),
        ...(dto.validation !== undefined && { validation: dto.validation as Prisma.InputJsonValue }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
        ...(dto.section !== undefined && { section: dto.section }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  async deleteCustomField(tenantId: string, id: string) {
    const existing = await prisma.crmCustomField.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Custom field not found');
    return prisma.crmCustomField.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async getCustomFieldValues(tenantId: string, entityType: string, entityId: string) {
    return prisma.crmCustomFieldValue.findMany({
      where: { tenantId, entityType, entityId },
      include: { field: { select: { fieldName: true, label: true, fieldType: true, options: true, section: true } } },
    });
  }

  async upsertCustomFieldValues(tenantId: string, entityType: string, entityId: string, values: Array<{ fieldId: string; value: string | null }>) {
    for (const v of values) {
      await prisma.crmCustomFieldValue.upsert({
        where: { fieldId_entityId: { fieldId: v.fieldId, entityId } },
        create: { tenantId, fieldId: v.fieldId, entityType, entityId, value: v.value },
        update: { value: v.value },
      });
    }
  }

  async getRecordTypes(tenantId: string, entity?: string) {
    const where: Prisma.CrmRecordTypeWhereInput = { tenantId, deletedAt: null };
    if (entity) where.entity = entity;
    return prisma.crmRecordType.findMany({ where, orderBy: { name: 'asc' } });
  }

  async createRecordType(tenantId: string, orgId: string, dto: CreateRecordTypeInput) {
    const resolvedOrgId = await this.resolveOrgId(tenantId, orgId);
    if (dto.isDefault) {
      await prisma.crmRecordType.updateMany({ where: { tenantId, entity: dto.entity }, data: { isDefault: false } });
    }
    return prisma.crmRecordType.create({
      data: {
        tenantId, orgId: resolvedOrgId, entity: dto.entity, name: dto.name,
        description: dto.description || null, fieldLayout: (dto.fieldLayout || []) as Prisma.InputJsonValue,
        pipelineId: dto.pipelineId || null, isDefault: dto.isDefault || false,
      },
    });
  }

  async updateRecordType(tenantId: string, id: string, dto: UpdateRecordTypeInput) {
    const existing = await prisma.crmRecordType.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!existing) throw new NotFoundException('Record type not found');
    if (dto.isDefault) {
      await prisma.crmRecordType.updateMany({ where: { tenantId, entity: existing.entity, id: { not: id } }, data: { isDefault: false } });
    }
    return prisma.crmRecordType.update({ where: { id }, data: {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.fieldLayout !== undefined && { fieldLayout: dto.fieldLayout as Prisma.InputJsonValue }),
      ...(dto.pipelineId !== undefined && { pipelineId: dto.pipelineId }),
      ...(dto.isDefault !== undefined && { isDefault: dto.isDefault }),
    } });
  }

  async deleteRecordType(tenantId: string, id: string) {
    const existing = await prisma.crmRecordType.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Record type not found');
    return prisma.crmRecordType.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  // ════════════════════════════════════════════════
  // PHASE 8: APPROVAL WORKFLOWS
  // ════════════════════════════════════════════════

  async getApprovalProcesses(tenantId: string) {
    return prisma.approvalProcess.findMany({
      where: { tenantId, deletedAt: null },
      include: { _count: { select: { requests: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createApprovalProcess(tenantId: string, orgId: string, dto: CreateApprovalProcessInput, createdBy: string) {
    const resolvedOrgId = await this.resolveOrgId(tenantId, orgId);
    return prisma.approvalProcess.create({
      data: {
        tenantId, orgId: resolvedOrgId, name: dto.name, entity: dto.entity,
        triggerConditions: dto.triggerConditions as Prisma.InputJsonValue,
        steps: dto.steps as Prisma.InputJsonValue, createdBy,
      },
    });
  }

  async updateApprovalProcess(tenantId: string, id: string, dto: UpdateApprovalProcessInput) {
    const existing = await prisma.approvalProcess.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!existing) throw new NotFoundException('Approval process not found');
    return prisma.approvalProcess.update({ where: { id }, data: {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.triggerConditions !== undefined && { triggerConditions: dto.triggerConditions as Prisma.InputJsonValue }),
      ...(dto.steps !== undefined && { steps: dto.steps as Prisma.InputJsonValue }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
    } });
  }

  async deleteApprovalProcess(tenantId: string, id: string) {
    const existing = await prisma.approvalProcess.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Approval process not found');
    return prisma.approvalProcess.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async submitForApproval(tenantId: string, userId: string, entityType: string, entityId: string, processId?: string) {
    let process;
    if (processId) {
      process = await prisma.approvalProcess.findFirst({ where: { id: processId, tenantId, isActive: true, deletedAt: null } });
    } else {
      process = await prisma.approvalProcess.findFirst({ where: { tenantId, entity: entityType, isActive: true, deletedAt: null } });
    }
    if (!process) throw new NotFoundException('No approval process found');
    return prisma.approvalRequest.create({
      data: { tenantId, processId: process.id, entityType, entityId, submittedBy: userId, metadata: {} },
    });
  }

  async getPendingApprovals(tenantId: string) {
    return prisma.approvalRequest.findMany({
      where: { tenantId, status: 'PENDING' },
      include: { process: { select: { name: true, entity: true } }, actions: true },
      orderBy: { submittedAt: 'desc' },
    });
  }

  async approveRequest(tenantId: string, requestId: string, userId: string, comments?: string) {
    const request = await prisma.approvalRequest.findFirst({ where: { id: requestId, tenantId, status: 'PENDING' } });
    if (!request) throw new NotFoundException('Approval request not found');
    const process = await prisma.approvalProcess.findUnique({ where: { id: request.processId } });
    const steps = (process?.steps || []) as Array<{ order: number }>;
    const isLastStep = request.currentStep >= steps.length - 1;
    return prisma.$transaction(async (tx) => {
      await tx.approvalAction.create({
        data: { tenantId, requestId, step: request.currentStep, action: 'APPROVED', userId, comments: comments || null },
      });
      return tx.approvalRequest.update({
        where: { id: requestId },
        data: {
          currentStep: request.currentStep + 1,
          ...(isLastStep && { status: 'APPROVED', completedAt: new Date() }),
        },
      });
    });
  }

  async rejectRequest(tenantId: string, requestId: string, userId: string, comments: string) {
    const request = await prisma.approvalRequest.findFirst({ where: { id: requestId, tenantId, status: 'PENDING' } });
    if (!request) throw new NotFoundException('Approval request not found');
    return prisma.$transaction(async (tx) => {
      await tx.approvalAction.create({
        data: { tenantId, requestId, step: request.currentStep, action: 'REJECTED', userId, comments },
      });
      return tx.approvalRequest.update({ where: { id: requestId }, data: { status: 'REJECTED', completedAt: new Date() } });
    });
  }

  async recallRequest(tenantId: string, requestId: string, userId: string) {
    const request = await prisma.approvalRequest.findFirst({ where: { id: requestId, tenantId, status: 'PENDING' } });
    if (!request) throw new NotFoundException('Approval request not found');
    if (request.submittedBy !== userId) throw new BadRequestException('Only the submitter can recall');
    return prisma.approvalRequest.update({ where: { id: requestId }, data: { status: 'RECALLED', completedAt: new Date() } });
  }

  async getApprovalHistory(tenantId: string, entityType: string, entityId: string) {
    return prisma.approvalRequest.findMany({
      where: { tenantId, entityType, entityId },
      include: { process: { select: { name: true } }, actions: { orderBy: { actedAt: 'asc' } } },
      orderBy: { submittedAt: 'desc' },
    });
  }

  // ════════════════════════════════════════════════
  // PHASE 9: ADVANCED QUOTATION BUILDER
  // ════════════════════════════════════════════════

  async getQuotationTemplates(tenantId: string) {
    return prisma.quotationTemplate.findMany({ where: { tenantId, deletedAt: null }, orderBy: { name: 'asc' } });
  }

  async createQuotationTemplate(tenantId: string, orgId: string, dto: CreateQuotationTemplateInput) {
    const resolvedOrgId = await this.resolveOrgId(tenantId, orgId);
    if (dto.isDefault) {
      await prisma.quotationTemplate.updateMany({ where: { tenantId }, data: { isDefault: false } });
    }
    return prisma.quotationTemplate.create({
      data: {
        tenantId, orgId: resolvedOrgId, name: dto.name, description: dto.description || null,
        headerHtml: dto.headerHtml || null, footerHtml: dto.footerHtml || null,
        termsTemplate: dto.termsTemplate || null, logoUrl: dto.logoUrl || null,
        colorScheme: (dto.colorScheme || {}) as Prisma.InputJsonValue, isDefault: dto.isDefault || false,
      },
    });
  }

  async updateQuotationTemplate(tenantId: string, id: string, dto: UpdateQuotationTemplateInput) {
    const existing = await prisma.quotationTemplate.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!existing) throw new NotFoundException('Template not found');
    return prisma.quotationTemplate.update({ where: { id }, data: {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.headerHtml !== undefined && { headerHtml: dto.headerHtml }),
      ...(dto.footerHtml !== undefined && { footerHtml: dto.footerHtml }),
      ...(dto.termsTemplate !== undefined && { termsTemplate: dto.termsTemplate }),
      ...(dto.logoUrl !== undefined && { logoUrl: dto.logoUrl }),
      ...(dto.colorScheme !== undefined && { colorScheme: dto.colorScheme as Prisma.InputJsonValue }),
      ...(dto.isDefault !== undefined && { isDefault: dto.isDefault }),
    } });
  }

  async deleteQuotationTemplate(tenantId: string, id: string) {
    const existing = await prisma.quotationTemplate.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Template not found');
    return prisma.quotationTemplate.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async createQuotationVersion(tenantId: string, quotationId: string, userId: string, changeNote?: string) {
    const quotation = await prisma.quotation.findFirst({
      where: { id: quotationId, tenantId, deletedAt: null },
      include: { lineItems: true },
    });
    if (!quotation) throw new NotFoundException('Quotation not found');
    const versionNumber = quotation.version;
    await prisma.quotationVersion.create({
      data: { tenantId, quotationId, versionNumber, snapshot: quotation as unknown as Prisma.InputJsonValue, changedBy: userId, changeNote: changeNote || null },
    });
    return prisma.quotation.update({ where: { id: quotationId }, data: { version: versionNumber + 1 } });
  }

  async getQuotationVersions(tenantId: string, quotationId: string) {
    return prisma.quotationVersion.findMany({ where: { tenantId, quotationId }, orderBy: { versionNumber: 'desc' } });
  }

  async cloneQuotation(tenantId: string, quotationId: string, userId: string) {
    const original = await prisma.quotation.findFirst({ where: { id: quotationId, tenantId, deletedAt: null }, include: { lineItems: true } });
    if (!original) throw new NotFoundException('Quotation not found');
    const clone = await prisma.quotation.create({
      data: {
        tenantId, orgId: original.orgId, customerId: original.customerId,
        quotationNumber: `${original.quotationNumber}-COPY-${Date.now()}`,
        status: 'DRAFT', validUntil: original.validUntil, currency: original.currency,
        notes: original.notes, termsConditions: original.termsConditions, createdBy: userId,
      },
    });
    for (const item of original.lineItems) {
      await prisma.quotationItem.create({
        data: { tenantId, quotationId: clone.id, productId: item.productId, description: item.description, quantity: item.quantity, unitPrice: item.unitPrice, taxRate: item.taxRate, taxAmount: item.taxAmount, totalAmount: item.totalAmount, sortOrder: item.sortOrder },
      });
    }
    return clone;
  }

  async sendForSignature(tenantId: string, quotationId: string, signerName: string, signerEmail: string) {
    const quotation = await prisma.quotation.findFirst({ where: { id: quotationId, tenantId, deletedAt: null } });
    if (!quotation) throw new NotFoundException('Quotation not found');
    const token = createId();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    return prisma.quotationSignature.create({
      data: { tenantId, quotationId, signerName, signerEmail, token, expiresAt },
    });
  }

  async getQuotationBySignToken(token: string) {
    const signature = await prisma.quotationSignature.findUnique({ where: { token } });
    if (!signature) throw new NotFoundException('Invalid signature link');
    if (new Date() > signature.expiresAt) throw new BadRequestException('Signature link expired');
    const quotation = await prisma.quotation.findFirst({
      where: { id: signature.quotationId, deletedAt: null },
      include: { lineItems: true, customer: { select: { name: true } } },
    });
    return { quotation, signature };
  }

  async submitSignature(token: string, signatureData: string, ipAddress: string) {
    const signature = await prisma.quotationSignature.findUnique({ where: { token } });
    if (!signature) throw new NotFoundException('Invalid signature link');
    if (signature.status === 'SIGNED') throw new BadRequestException('Already signed');
    await prisma.quotationSignature.update({
      where: { token },
      data: { status: 'SIGNED', signedAt: new Date(), signatureData, ipAddress },
    });
    await prisma.quotation.update({ where: { id: signature.quotationId }, data: { status: 'ACCEPTED' } });
  }

  // ════════════════════════════════════════════════
  // PHASE 10: COMMENTS & COLLABORATION
  // ════════════════════════════════════════════════

  async getComments(tenantId: string, entityType: string, entityId: string) {
    return prisma.crmComment.findMany({
      where: { tenantId, entityType, entityId, deletedAt: null, parentId: null },
      include: { replies: { where: { deletedAt: null }, orderBy: { createdAt: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createComment(tenantId: string, userId: string, entityType: string, entityId: string, dto: CreateCrmCommentInput) {
    return prisma.crmComment.create({
      data: { tenantId, entityType, entityId, body: dto.body, parentId: dto.parentId || null, mentions: (dto.mentions || []) as Prisma.InputJsonValue, createdBy: userId },
    });
  }

  async updateComment(tenantId: string, id: string, userId: string, body: string) {
    const comment = await prisma.crmComment.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.createdBy !== userId) throw new BadRequestException('Can only edit your own comments');
    return prisma.crmComment.update({ where: { id }, data: { body } });
  }

  async deleteComment(tenantId: string, id: string) {
    return prisma.crmComment.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async togglePinComment(tenantId: string, id: string) {
    const comment = await prisma.crmComment.findFirst({ where: { id, tenantId } });
    if (!comment) throw new NotFoundException('Comment not found');
    return prisma.crmComment.update({ where: { id }, data: { isPinned: !comment.isPinned } });
  }

  async getFollowers(tenantId: string, entityType: string, entityId: string) {
    return prisma.crmFollower.findMany({ where: { tenantId, entityType, entityId } });
  }

  async followRecord(tenantId: string, userId: string, entityType: string, entityId: string) {
    const existing = await prisma.crmFollower.findFirst({ where: { entityType, entityId, userId } });
    if (existing) return existing;
    return prisma.crmFollower.create({ data: { tenantId, entityType, entityId, userId } });
  }

  async unfollowRecord(tenantId: string, userId: string, entityType: string, entityId: string) {
    const follower = await prisma.crmFollower.findFirst({ where: { entityType, entityId, userId, tenantId } });
    if (!follower) throw new NotFoundException('Not following');
    return prisma.crmFollower.delete({ where: { id: follower.id } });
  }

  async getNotes(tenantId: string, entityType: string, entityId: string) {
    return prisma.crmNote.findMany({ where: { tenantId, entityType, entityId, deletedAt: null }, orderBy: { createdAt: 'desc' } });
  }

  async createNote(tenantId: string, userId: string, entityType: string, entityId: string, dto: CreateCrmNoteInput) {
    return prisma.crmNote.create({
      data: { tenantId, entityType, entityId, title: dto.title || null, body: dto.body, noteType: dto.noteType || 'GENERAL', createdBy: userId },
    });
  }

  async updateNote(tenantId: string, id: string, dto: UpdateCrmNoteInput) {
    const existing = await prisma.crmNote.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!existing) throw new NotFoundException('Note not found');
    return prisma.crmNote.update({ where: { id }, data: {
      ...(dto.title !== undefined && { title: dto.title }),
      ...(dto.body !== undefined && { body: dto.body }),
      ...(dto.noteType !== undefined && { noteType: dto.noteType }),
    } });
  }

  async deleteNote(tenantId: string, id: string) {
    return prisma.crmNote.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async togglePinNote(tenantId: string, id: string) {
    const note = await prisma.crmNote.findFirst({ where: { id, tenantId } });
    if (!note) throw new NotFoundException('Note not found');
    return prisma.crmNote.update({ where: { id }, data: { isPinned: !note.isPinned } });
  }

  async getUnifiedActivityFeed(tenantId: string, entityType: string, entityId: string) {
    const [comments, notes, activities, documents] = await Promise.all([
      prisma.crmComment.findMany({ where: { tenantId, entityType, entityId, deletedAt: null }, orderBy: { createdAt: 'desc' }, take: 20 }),
      prisma.crmNote.findMany({ where: { tenantId, entityType, entityId, deletedAt: null }, orderBy: { createdAt: 'desc' }, take: 20 }),
      prisma.activity.findMany({ where: { tenantId, ...(entityType === 'OPPORTUNITY' ? { opportunityId: entityId } : entityType === 'LEAD' ? { leadId: entityId } : entityType === 'CUSTOMER' ? { customerId: entityId } : { contactId: entityId }) }, orderBy: { createdAt: 'desc' }, take: 20 }),
      prisma.crmDocument.findMany({ where: { tenantId, entityType, entityId, deletedAt: null }, orderBy: { createdAt: 'desc' }, take: 10 }),
    ]);
    const feed = [
      ...comments.map((c) => ({ type: 'COMMENT' as const, id: c.id, body: c.body, createdBy: c.createdBy, createdAt: c.createdAt })),
      ...notes.map((n) => ({ type: 'NOTE' as const, id: n.id, body: n.title || n.body.substring(0, 100), createdBy: n.createdBy, createdAt: n.createdAt })),
      ...activities.map((a) => ({ type: 'ACTIVITY' as const, id: a.id, body: `${a.type}: ${a.subject}`, createdBy: a.assignedToId || '', createdAt: a.createdAt })),
      ...documents.map((d) => ({ type: 'DOCUMENT' as const, id: d.id, body: `Uploaded: ${d.name}`, createdBy: d.uploadedBy, createdAt: d.createdAt })),
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 50);
    return feed;
  }

  // ════════════════════════════════════════════════
  // PHASE 11: SALES PLAYBOOKS & GUIDED SELLING
  // ════════════════════════════════════════════════

  async getPlaybooks(tenantId: string) {
    return prisma.salesPlaybook.findMany({
      where: { tenantId, deletedAt: null },
      include: { _count: { select: { stages: true, battlecards: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createPlaybook(tenantId: string, orgId: string, dto: CreatePlaybookInput, createdBy: string) {
    const resolvedOrgId = await this.resolveOrgId(tenantId, orgId);
    return prisma.salesPlaybook.create({
      data: { tenantId, orgId: resolvedOrgId, name: dto.name, description: dto.description || null, pipelineId: dto.pipelineId || null, createdBy },
    });
  }

  async updatePlaybook(tenantId: string, id: string, dto: UpdatePlaybookInput) {
    const existing = await prisma.salesPlaybook.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!existing) throw new NotFoundException('Playbook not found');
    return prisma.salesPlaybook.update({ where: { id }, data: {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.pipelineId !== undefined && { pipelineId: dto.pipelineId }),
    } });
  }

  async deletePlaybook(tenantId: string, id: string) {
    const existing = await prisma.salesPlaybook.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Playbook not found');
    return prisma.salesPlaybook.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async getPlaybookStages(tenantId: string, playbookId: string) {
    return prisma.playbookStage.findMany({ where: { tenantId, playbookId }, orderBy: { sortOrder: 'asc' } });
  }

  async upsertPlaybookStages(tenantId: string, playbookId: string, stages: Array<{ stageName: string; guidanceNotes?: string; checklist?: unknown[]; requiredFields?: string[]; talkingPoints?: string[]; exitCriteria?: unknown[]; sortOrder?: number }>) {
    return prisma.$transaction(async (tx) => {
      await tx.playbookStage.deleteMany({ where: { playbookId } });
      return Promise.all(stages.map((s, i) => tx.playbookStage.create({
        data: {
          tenantId, playbookId, stageName: s.stageName, guidanceNotes: s.guidanceNotes || null,
          checklist: (s.checklist || []) as Prisma.InputJsonValue, requiredFields: (s.requiredFields || []) as Prisma.InputJsonValue,
          talkingPoints: (s.talkingPoints || []) as Prisma.InputJsonValue, exitCriteria: (s.exitCriteria || []) as Prisma.InputJsonValue,
          sortOrder: s.sortOrder ?? i,
        },
      })));
    });
  }

  async getBattlecards(tenantId: string) {
    return prisma.battlecard.findMany({
      where: { tenantId, deletedAt: null },
      include: { playbook: { select: { name: true } } },
      orderBy: { competitor: 'asc' },
    });
  }

  async createBattlecard(tenantId: string, dto: CreateBattlecardInput, createdBy: string) {
    return prisma.battlecard.create({
      data: {
        tenantId, competitor: dto.competitor, playbookId: dto.playbookId || null,
        strengths: (dto.strengths || []) as Prisma.InputJsonValue, weaknesses: (dto.weaknesses || []) as Prisma.InputJsonValue,
        objections: (dto.objections || []) as Prisma.InputJsonValue, winStrategy: dto.winStrategy || null,
        loseReasons: (dto.loseReasons || []) as Prisma.InputJsonValue, createdBy,
      },
    });
  }

  async updateBattlecard(tenantId: string, id: string, dto: UpdateBattlecardInput) {
    const existing = await prisma.battlecard.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!existing) throw new NotFoundException('Battlecard not found');
    return prisma.battlecard.update({ where: { id }, data: {
      ...(dto.competitor !== undefined && { competitor: dto.competitor }),
      ...(dto.strengths !== undefined && { strengths: dto.strengths as Prisma.InputJsonValue }),
      ...(dto.weaknesses !== undefined && { weaknesses: dto.weaknesses as Prisma.InputJsonValue }),
      ...(dto.objections !== undefined && { objections: dto.objections as Prisma.InputJsonValue }),
      ...(dto.winStrategy !== undefined && { winStrategy: dto.winStrategy }),
      ...(dto.loseReasons !== undefined && { loseReasons: dto.loseReasons as Prisma.InputJsonValue }),
    } });
  }

  async deleteBattlecard(tenantId: string, id: string) {
    return prisma.battlecard.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async getBattlecardByCompetitor(tenantId: string, competitor: string) {
    return prisma.battlecard.findFirst({ where: { tenantId, competitor, deletedAt: null } });
  }

  async getOpportunityChecklist(tenantId: string, opportunityId: string) {
    return prisma.opportunityChecklist.findMany({ where: { tenantId, opportunityId } });
  }

  async toggleChecklistItem(tenantId: string, opportunityId: string, itemId: string, userId: string) {
    const existing = await prisma.opportunityChecklist.findFirst({ where: { opportunityId, stageChecklistId: itemId, tenantId } });
    if (existing) {
      return prisma.opportunityChecklist.update({
        where: { id: existing.id },
        data: { isCompleted: !existing.isCompleted, completedBy: !existing.isCompleted ? userId : null, completedAt: !existing.isCompleted ? new Date() : null },
      });
    }
    return prisma.opportunityChecklist.create({
      data: { tenantId, opportunityId, stageChecklistId: itemId, isCompleted: true, completedBy: userId, completedAt: new Date() },
    });
  }

  async validateStageAdvance(tenantId: string, opportunityId: string, targetStage: string) {
    const opp = await prisma.opportunity.findFirst({ where: { id: opportunityId, tenantId }, include: { pipeline: true } });
    if (!opp) throw new NotFoundException('Opportunity not found');
    const blockers: string[] = [];
    if (opp.pipelineId) {
      const playbook = await prisma.salesPlaybook.findFirst({ where: { tenantId, pipelineId: opp.pipelineId, isActive: true, deletedAt: null } });
      if (playbook) {
        const stage = await prisma.playbookStage.findFirst({ where: { playbookId: playbook.id, stageName: opp.stage } });
        if (stage) {
          const requiredChecklist = (stage.checklist as Array<{ item: string; isRequired: boolean }>).filter((c) => c.isRequired);
          const completed = await prisma.opportunityChecklist.findMany({ where: { opportunityId, isCompleted: true } });
          const completedIds = new Set(completed.map((c) => c.stageChecklistId));
          for (const item of requiredChecklist) {
            if (!completedIds.has(item.item)) blockers.push(`Checklist: "${item.item}" not completed`);
          }
        }
      }
    }
    return { canAdvance: blockers.length === 0, blockers };
  }

  // ════════════════════════════════════════════════
  // PHASE 12: DASHBOARD BUILDER
  // ════════════════════════════════════════════════

  async getDashboards(tenantId: string, userId: string) {
    return prisma.crmDashboard.findMany({
      where: { tenantId, deletedAt: null, OR: [{ createdBy: userId }, { isShared: true }] },
      include: { _count: { select: { widgets: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createDashboard(tenantId: string, orgId: string, userId: string, dto: CreateCrmDashboardInput) {
    const resolvedOrgId = await this.resolveOrgId(tenantId, orgId);
    return prisma.crmDashboard.create({
      data: { tenantId, orgId: resolvedOrgId, name: dto.name, description: dto.description || null, isShared: dto.isShared || false, createdBy: userId },
    });
  }

  async updateDashboard(tenantId: string, id: string, dto: UpdateCrmDashboardInput) {
    const existing = await prisma.crmDashboard.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!existing) throw new NotFoundException('Dashboard not found');
    return prisma.crmDashboard.update({ where: { id }, data: {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.isShared !== undefined && { isShared: dto.isShared }),
    } });
  }

  async deleteDashboard(tenantId: string, id: string) {
    return prisma.crmDashboard.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async cloneDashboard(tenantId: string, id: string, userId: string) {
    const original = await prisma.crmDashboard.findFirst({ where: { id, tenantId, deletedAt: null }, include: { widgets: true } });
    if (!original) throw new NotFoundException('Dashboard not found');
    const clone = await prisma.crmDashboard.create({
      data: { tenantId, orgId: original.orgId, name: `${original.name} (Copy)`, description: original.description, layout: original.layout as Prisma.InputJsonValue, isShared: false, createdBy: userId },
    });
    for (const w of original.widgets) {
      await prisma.crmDashboardWidget.create({
        data: { tenantId, dashboardId: clone.id, widgetType: w.widgetType, title: w.title, dataSource: w.dataSource, config: w.config as Prisma.InputJsonValue, refreshInterval: w.refreshInterval },
      });
    }
    return clone;
  }

  async addWidget(tenantId: string, dashboardId: string, dto: CreateDashboardWidgetInput) {
    const dashboard = await prisma.crmDashboard.findFirst({ where: { id: dashboardId, tenantId, deletedAt: null } });
    if (!dashboard) throw new NotFoundException('Dashboard not found');
    return prisma.crmDashboardWidget.create({
      data: { tenantId, dashboardId, widgetType: dto.widgetType, title: dto.title, dataSource: dto.dataSource, config: dto.config as Prisma.InputJsonValue, refreshInterval: dto.refreshInterval || 0 },
    });
  }

  async updateWidget(tenantId: string, widgetId: string, dto: UpdateDashboardWidgetInput) {
    const widget = await prisma.crmDashboardWidget.findFirst({ where: { id: widgetId, tenantId } });
    if (!widget) throw new NotFoundException('Widget not found');
    return prisma.crmDashboardWidget.update({ where: { id: widgetId }, data: {
      ...(dto.title !== undefined && { title: dto.title }),
      ...(dto.widgetType !== undefined && { widgetType: dto.widgetType }),
      ...(dto.dataSource !== undefined && { dataSource: dto.dataSource }),
      ...(dto.config !== undefined && { config: dto.config as Prisma.InputJsonValue }),
      ...(dto.refreshInterval !== undefined && { refreshInterval: dto.refreshInterval }),
    } });
  }

  async removeWidget(tenantId: string, widgetId: string) {
    return prisma.crmDashboardWidget.delete({ where: { id: widgetId } });
  }

  async updateDashboardLayout(tenantId: string, dashboardId: string, layout: Array<{ widgetId: string; x: number; y: number; w: number; h: number }>) {
    return prisma.crmDashboard.update({ where: { id: dashboardId }, data: { layout: layout as Prisma.InputJsonValue } });
  }

  async getWidgetData(tenantId: string, widgetId: string) {
    const widget = await prisma.crmDashboardWidget.findFirst({ where: { id: widgetId, tenantId } });
    if (!widget) throw new NotFoundException('Widget not found');
    switch (widget.dataSource) {
      case 'PIPELINE': return this.getPipelineFunnel(tenantId);
      case 'LEADS': return this.getLeadSourceBreakdown(tenantId);
      case 'REVENUE': return this.getRevenueForecast(tenantId);
      case 'TARGETS': return this.getSalesTargets(tenantId);
      case 'CONVERSIONS': return this.getConversionFunnel(tenantId);
      case 'COMMISSIONS': return this.getCommissionEntries(tenantId);
      case 'ACTIVITIES': return this.getActivities(tenantId);
      default: return this.getPipelineFunnel(tenantId);
    }
  }

  async getAvailableMetrics() {
    return [
      { dataSource: 'PIPELINE', label: 'Pipeline Funnel', metrics: ['count', 'totalAmount'] },
      { dataSource: 'LEADS', label: 'Lead Sources', metrics: ['count'] },
      { dataSource: 'REVENUE', label: 'Revenue Forecast', metrics: ['totalAmount', 'weightedAmount'] },
      { dataSource: 'TARGETS', label: 'Sales Targets', metrics: ['target', 'achieved'] },
      { dataSource: 'CONVERSIONS', label: 'Conversion Funnel', metrics: ['leadToOppRate', 'oppToWinRate'] },
      { dataSource: 'COMMISSIONS', label: 'Commissions', metrics: ['amount'] },
      { dataSource: 'ACTIVITIES', label: 'Activities', metrics: ['count'] },
    ];
  }

  // ════════════════════════════════════════════════
  // HELPERS
  // ════════════════════════════════════════════════

  private async resolveOrgId(tenantId: string, orgId: string): Promise<string> {
    if (orgId && orgId !== 'org-system-default') return orgId;
    const org = await prisma.organization.findFirst({ where: { tenantId } });
    if (!org) throw new BadRequestException('No Organization registered in this tenant');
    return org.id;
  }
}