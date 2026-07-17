import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { Prisma } from '@prisma/client';
import { CreateLeadInput, UpdateLeadInput } from '@unerp/shared';
import { CrmLeadScoringService } from './crm-lead-scoring.service';

// Lead status lifecycle (schema.prisma `Lead.status` comment): NEW, CONTACTED,
// QUALIFIED, DISQUALIFIED, CONVERTED. DISQUALIFIED and CONVERTED are terminal —
// CONVERTED must only be reached via convertLead() (which also stamps
// convertedCustomerId/convertedOpportunityId), never a bare status PATCH, and
// neither terminal state should silently re-open via updateLeadStatus.
const LEAD_STATUS_TRANSITIONS: Record<string, string[]> = {
  NEW: ['CONTACTED', 'QUALIFIED', 'DISQUALIFIED'],
  CONTACTED: ['NEW', 'QUALIFIED', 'DISQUALIFIED'],
  QUALIFIED: ['CONTACTED', 'DISQUALIFIED', 'CONVERTED'],
  DISQUALIFIED: [],
  CONVERTED: [],
};

/**
 * Leads bounded context: lead sources, the lead lifecycle (create → score →
 * qualify → convert), and lead scoring. `recalculateLeadScore` is intentionally
 * public: activity, web-form, and import flows in other CRM services trigger a
 * rescore when they touch a lead.
 */
@Injectable()
export class CrmLeadsService {
  constructor(@Inject(CrmLeadScoringService) private readonly leadScoring: CrmLeadScoringService) { }

  async getLeadSources(tenantId: string) {
    return prisma.leadSource.findMany({ where: { tenantId }, orderBy: { name: 'asc' } });
  }

  async getLeads(tenantId: string, query?: { status?: string; page?: number; limit?: number; search?: string; sortBy?: string; sortOrder?: 'asc' | 'desc' }) {
    const where: Prisma.LeadWhereInput = { tenantId, deletedAt: null };
    if (query?.status) where.status = query.status;
    if (query?.search) {
      where.OR = [
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
        { company: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    const page = query?.page || 1;
    const limit = query?.limit || 20;
    const skip = (page - 1) * limit;
    const orderBy: Prisma.LeadOrderByWithRelationInput = {};
    if (query?.sortBy === 'score') orderBy.score = query.sortOrder || 'desc';
    else if (query?.sortBy === 'createdAt') orderBy.createdAt = query.sortOrder || 'desc';
    else if (query?.sortBy === 'firstName') orderBy.firstName = query.sortOrder || 'asc';
    else orderBy.createdAt = 'desc';
    const [data, totalCount] = await Promise.all([
      prisma.lead.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: { source: true, _count: { select: { activities: true, opportunities: true } } },
      }),
      prisma.lead.count({ where }),
    ]);
    return { data, totalCount, page, limit, totalPages: Math.ceil(totalCount / limit) };
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
        country: dto.country || null,
        region: dto.region || null,
        notes: dto.notes || null,
        campaignId: dto.campaignId || null,
      },
    });
    await this.recalculateLeadScore(tenantId, lead.id);
    await this.leadScoring.recalculateScore(tenantId, lead.id);
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
    await this.leadScoring.recalculateScore(tenantId, id);
    return updated;
  }

  async updateLeadStatus(tenantId: string, id: string, status: string) {
    const existing = await prisma.lead.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Lead not found');

    if (existing.status !== status) {
      const allowed = LEAD_STATUS_TRANSITIONS[existing.status] ?? [];
      if (!allowed.includes(status)) {
        if (status === 'CONVERTED') {
          throw new BadRequestException(
            'Leads cannot be marked CONVERTED via a status update — use POST /crm/leads/:id/convert, which also creates the linked Customer/Opportunity.',
          );
        }
        throw new BadRequestException(
          `Cannot transition lead from ${existing.status} to ${status}. Allowed transitions from ${existing.status}: ${allowed.length ? allowed.join(', ') : 'none (terminal status)'}.`,
        );
      }
    }

    const updated = await prisma.lead.update({ where: { id }, data: { status } });
    await this.recalculateLeadScore(tenantId, id);
    return updated;
  }

  /**
   * Lead 360 view: the lead record, its activity timeline, any opportunities
   * created from converting it, and computed metrics (age, score trend,
   * conversion-likelihood bucket). Mirrors the pattern in
   * CrmCustomersService.getCustomerSummary().
   */
  async getLeadSummary(tenantId: string, id: string) {
    const lead = await prisma.lead.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        source: true,
        activities: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!lead) throw new NotFoundException('Lead not found');

    const relatedOpportunities = await prisma.opportunity.findMany({
      where: { tenantId, leadId: id, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, name: true, stage: true, amount: true,
        probability: true, expectedCloseDate: true, createdAt: true,
      },
    });

    const now = new Date();
    const daysSinceCreation = Math.floor((now.getTime() - lead.createdAt.getTime()) / (1000 * 60 * 60 * 24));

    // recalculateLeadScore() does not persist a score-history table (only the
    // current `score` field), so a true trend line isn't available yet — we
    // derive a directional signal instead: activities logged after the lead
    // was created generally push score upward (see the scoring rules), so a
    // completed-activity-heavy timeline implies an upward trend.
    const completedActivities = lead.activities.filter((a) => a.completedAt).length;
    const pendingActivities = lead.activities.length - completedActivities;
    const scoreTrend: 'up' | 'down' | 'flat' =
      completedActivities > pendingActivities ? 'up' : lead.activities.length === 0 ? 'flat' : 'down';

    let conversionLikelihood: 'low' | 'medium' | 'high';
    if (lead.score >= 70) conversionLikelihood = 'high';
    else if (lead.score >= 40) conversionLikelihood = 'medium';
    else conversionLikelihood = 'low';

    return {
      lead,
      recentActivities: lead.activities.slice(0, 10),
      relatedOpportunities,
      metrics: {
        daysSinceCreation,
        score: lead.score,
        scoreTrend,
        conversionLikelihood,
        totalActivities: lead.activities.length,
        completedActivities,
        pendingActivities,
        isConverted: lead.status === 'CONVERTED',
      },
    };
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

      const contact = await tx.contact.create({
        data: {
          tenantId,
          orgId: resolvedOrgId,
          customerId: customer.id,
          salutation: lead.salutation,
          firstName: lead.firstName,
          lastName: lead.lastName,
          email: lead.email,
          phone: lead.phone,
          mobile: lead.mobile,
          title: lead.title,
          isPrimary: true,
          isActive: true,
          notes: `Created automatically from Lead conversion.`,
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

      return { customer, contact, opportunity };
    });
  }

  /**
   * Win-back reactivation for a previously DISQUALIFIED lead. DISQUALIFIED is
   * terminal under normal status transitions (see LEAD_STATUS_TRANSITIONS) —
   * this dedicated endpoint is the only sanctioned way back to NEW, mirroring
   * how CONVERTED can only be reached via convertLead().
   */
  async reactivateLead(tenantId: string, id: string, reason?: string) {
    const existing = await prisma.lead.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!existing) throw new NotFoundException('Lead not found');
    if (existing.status !== 'DISQUALIFIED') {
      throw new BadRequestException('Only DISQUALIFIED leads can be reactivated.');
    }
    const notes = reason
      ? `${existing.notes ? existing.notes + '\n' : ''}[Reactivated] ${reason}`
      : existing.notes;
    const updated = await prisma.lead.update({ where: { id }, data: { status: 'NEW', notes } });
    await this.recalculateLeadScore(tenantId, id);
    return updated;
  }

  /**
   * Leads with no activity logged in `staleDays` (default 7) that are still
   * in an open (non-terminal) status — surfaces leads at risk of going cold
   * so reps can prioritize follow-up before they'd otherwise be disqualified.
   */
  async getStalledLeads(tenantId: string, staleDays = 7) {
    const cutoff = new Date(Date.now() - staleDays * 24 * 60 * 60 * 1000);
    const leads = await prisma.lead.findMany({
      where: {
        tenantId,
        deletedAt: null,
        status: { in: ['NEW', 'CONTACTED', 'QUALIFIED'] },
        activities: { none: { createdAt: { gte: cutoff } } },
      },
      include: { source: true, _count: { select: { activities: true } } },
      orderBy: { createdAt: 'asc' },
    });
    return leads.map((l) => ({
      ...l,
      daysSinceCreation: Math.floor((Date.now() - l.createdAt.getTime()) / (1000 * 60 * 60 * 24)),
    }));
  }

  async deleteLead(tenantId: string, id: string) {
    const existing = await prisma.lead.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Lead not found');
    return prisma.lead.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async bulkUpdateLeadStatus(tenantId: string, ids: string[], status: string) {
    const validStatuses = ['NEW', 'CONTACTED', 'QUALIFIED', 'DISQUALIFIED', 'CONVERTED'];
    if (!validStatuses.includes(status)) {
      throw new BadRequestException(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }
    const result = await prisma.lead.updateMany({
      where: { id: { in: ids }, tenantId, deletedAt: null },
      data: { status },
    });
    return { updated: result.count, status };
  }

  async exportLeads(tenantId: string, query?: { search?: string; status?: string }) {
    const where: Prisma.LeadWhereInput = { tenantId, deletedAt: null };
    if (query?.status) where.status = query.status;
    if (query?.search) {
      where.OR = [
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
        { company: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    return prisma.lead.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, firstName: true, lastName: true, company: true, email: true,
        phone: true, mobile: true, status: true, score: true, industry: true,
        annualRevenue: true, employeeCount: true, notes: true, createdAt: true, updatedAt: true,
      },
    });
  }
}
