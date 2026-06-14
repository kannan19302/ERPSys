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
} from '@unerp/shared';

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
    const data: Prisma.OpportunityUpdateInput = { stage };
    if (probability !== undefined) data.probability = probability;
    if (actualCloseDate) data.actualCloseDate = new Date(actualCloseDate);
    if (lossReason !== undefined) data.lossReason = lossReason;
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
}