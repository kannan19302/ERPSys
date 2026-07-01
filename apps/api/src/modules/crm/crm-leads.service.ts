import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { Prisma } from '@prisma/client';
import { CreateLeadInput, UpdateLeadInput } from '@unerp/shared';

/**
 * Leads bounded context: lead sources, the lead lifecycle (create → score →
 * qualify → convert), and lead scoring. `recalculateLeadScore` is intentionally
 * public: activity, web-form, and import flows in other CRM services trigger a
 * rescore when they touch a lead.
 */
@Injectable()
export class CrmLeadsService {
  async getLeadSources(tenantId: string) {
    return prisma.leadSource.findMany({ where: { tenantId }, orderBy: { name: 'asc' } });
  }

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
}
