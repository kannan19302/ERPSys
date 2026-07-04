import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { Prisma } from '@prisma/client';
import {
  CreateOpportunityInput, UpdateOpportunityInput, CreateSalesPipelineInput,
  CreateOpportunityLineItemInput, UpdateOpportunityLineItemInput,
  CreatePriceBookInput, UpdatePriceBookInput, CreatePriceBookEntryInput,
  CreatePlaybookInput, UpdatePlaybookInput, CreateBattlecardInput, UpdateBattlecardInput,
} from '@unerp/shared';
import { resolveOrgId } from './crm-shared';

/**
 * Deals bounded context: sales pipelines, opportunities and their line items,
 * price books/products, pipeline & revenue analytics, and the sales
 * methodology layer (playbooks, battlecards, stage-gate checklists).
 */
@Injectable()
export class CrmDealsService {
  // ── PIPELINES ─────────────────────────────────

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

  // ── OPPORTUNITIES ─────────────────────────────

  async getOpportunities(tenantId: string, query?: { pipelineId?: string; stage?: string; page?: number; limit?: number; search?: string; sortBy?: string; sortOrder?: 'asc' | 'desc' }) {
    const where: Prisma.OpportunityWhereInput = { tenantId, deletedAt: null };
    if (query?.pipelineId) where.pipelineId = query.pipelineId;
    if (query?.stage) where.stage = query.stage;
    if (query?.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    const page = query?.page || 1;
    const limit = query?.limit || 20;
    const skip = (page - 1) * limit;
    const orderBy: Prisma.OpportunityOrderByWithRelationInput = {};
    if (query?.sortBy === 'amount') orderBy.amount = query.sortOrder || 'desc';
    else if (query?.sortBy === 'createdAt') orderBy.createdAt = query.sortOrder || 'desc';
    else if (query?.sortBy === 'name') orderBy.name = query.sortOrder || 'asc';
    else orderBy.createdAt = 'desc';
    const [data, totalCount] = await Promise.all([
      prisma.opportunity.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          customer: { select: { id: true, name: true } },
          pipeline: { select: { id: true, name: true } },
          _count: { select: { activities: true } },
        },
      }),
      prisma.opportunity.count({ where }),
    ]);
    return { data, totalCount, page, limit, totalPages: Math.ceil(totalCount / limit) };
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

  /**
   * Opportunity 360 view: the opportunity, its line items and activity
   * timeline, plus computed metrics (days in current stage, weighted pipeline
   * value, aging bucket). Mirrors CrmCustomersService.getCustomerSummary()
   * and reuses the day-in-stage math from getDealAging()/getPipelineHealth().
   */
  async getOpportunitySummary(tenantId: string, id: string) {
    const opp = await prisma.opportunity.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        customer: { select: { id: true, name: true } },
        lead: { select: { id: true, firstName: true, lastName: true, company: true } },
        pipeline: { select: { id: true, name: true, stages: true } },
        activities: { orderBy: { createdAt: 'desc' } },
        lineItems: {
          include: { product: { select: { id: true, name: true, sku: true } } },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
    if (!opp) throw new NotFoundException('Opportunity not found');

    const now = new Date();
    const isClosed = ['CLOSED_WON', 'CLOSED_LOST'].includes(opp.stage);
    const stageEnteredRef = opp.stageEnteredAt || opp.updatedAt;
    const daysInCurrentStage = Math.floor((now.getTime() - stageEnteredRef.getTime()) / (1000 * 60 * 60 * 24));
    const daysSinceCreation = Math.floor((now.getTime() - opp.createdAt.getTime()) / (1000 * 60 * 60 * 24));

    const amount = Number(opp.amount || 0);
    const weightedPipelineValue = amount * (opp.probability / 100);

    let agingBucket: 'fresh' | 'aging' | 'stale' | 'rotting' | 'closed';
    if (isClosed) agingBucket = 'closed';
    else if (daysInCurrentStage <= 7) agingBucket = 'fresh';
    else if (daysInCurrentStage <= 30) agingBucket = 'aging';
    else if (daysInCurrentStage <= 60) agingBucket = 'stale';
    else agingBucket = 'rotting';

    const lineItemsTotal = opp.lineItems.reduce((sum, li) => sum + Number(li.totalAmount), 0);

    return {
      opportunity: opp,
      lineItems: opp.lineItems,
      recentActivities: opp.activities.slice(0, 10),
      metrics: {
        daysInCurrentStage,
        daysSinceCreation,
        weightedPipelineValue,
        agingBucket,
        isRotting: !isClosed && daysInCurrentStage > 30,
        lineItemsTotal,
        lineItemsCount: opp.lineItems.length,
        totalActivities: opp.activities.length,
        isClosed,
        isWon: opp.stage === 'CLOSED_WON',
      },
    };
  }

  // ── OPPORTUNITY LINE ITEMS ────────────────────

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

  // ── PRICE BOOKS & PRODUCTS ────────────────────

  async getPriceBooks(tenantId: string, query?: { isActive?: boolean; page?: number; limit?: number; search?: string; sortBy?: string; sortOrder?: 'asc' | 'desc' }) {
    const where: Prisma.PriceBookWhereInput = { tenantId, deletedAt: null };
    if (query?.isActive !== undefined) where.isDefault = query.isActive;
    if (query?.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    const page = query?.page || 1;
    const limit = query?.limit || 20;
    const skip = (page - 1) * limit;
    const orderBy: Prisma.PriceBookOrderByWithRelationInput = {};
    if (query?.sortBy === 'name') orderBy.name = query.sortOrder || 'asc';
    else if (query?.sortBy === 'createdAt') orderBy.createdAt = query.sortOrder || 'desc';
    else orderBy.name = 'asc';
    const [data, totalCount] = await Promise.all([
      prisma.priceBook.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: { _count: { select: { entries: true } } },
      }),
      prisma.priceBook.count({ where }),
    ]);
    return { data, totalCount, page, limit, totalPages: Math.ceil(totalCount / limit) };
  }

  async createPriceBook(tenantId: string, orgId: string, dto: CreatePriceBookInput) {
    const resolvedOrgId = await resolveOrgId(tenantId, orgId);
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

  async getCrmProducts(tenantId: string, query?: { categoryId?: string; page?: number; limit?: number; search?: string; sortBy?: string; sortOrder?: 'asc' | 'desc' }) {
    const where: Prisma.ProductWhereInput = { tenantId, isActive: true, deletedAt: null };
    if (query?.categoryId) where.categoryId = query.categoryId;
    if (query?.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { sku: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    const page = query?.page || 1;
    const limit = query?.limit || 20;
    const skip = (page - 1) * limit;
    const orderBy: Prisma.ProductOrderByWithRelationInput = {};
    if (query?.sortBy === 'name') orderBy.name = query.sortOrder || 'asc';
    else if (query?.sortBy === 'sellPrice') orderBy.sellPrice = query.sortOrder || 'asc';
    else orderBy.name = 'asc';
    const [data, totalCount] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: { id: true, name: true, sku: true, sellPrice: true, category: true, type: true, unit: true },
      }),
      prisma.product.count({ where }),
    ]);
    return { data, totalCount, page, limit, totalPages: Math.ceil(totalCount / limit) };
  }

  // ── PIPELINE & REVENUE ANALYTICS ──────────────

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

  // ── PLAYBOOKS & BATTLECARDS ───────────────────

  async getPlaybooks(tenantId: string) {
    return prisma.salesPlaybook.findMany({
      where: { tenantId, deletedAt: null },
      include: { _count: { select: { stages: true, battlecards: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createPlaybook(tenantId: string, orgId: string, dto: CreatePlaybookInput, createdBy: string) {
    const resolvedOrgId = await resolveOrgId(tenantId, orgId);
    return prisma.salesPlaybook.create({
      data: {
        tenantId, orgId: resolvedOrgId,
        name: dto.name, description: dto.description || null,
        pipelineId: dto.pipelineId || null,
        createdBy,
      },
    });
  }

  async updatePlaybook(tenantId: string, id: string, dto: UpdatePlaybookInput) {
    const existing = await prisma.salesPlaybook.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!existing) throw new NotFoundException('Playbook not found');
    return prisma.salesPlaybook.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.pipelineId !== undefined && { pipelineId: dto.pipelineId }),
      },
    });
  }

  async deletePlaybook(tenantId: string, id: string) {
    const existing = await prisma.salesPlaybook.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Playbook not found');
    return prisma.salesPlaybook.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async getPlaybookStages(tenantId: string, playbookId: string) {
    return prisma.playbookStage.findMany({
      where: { playbookId, playbook: { tenantId } },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async upsertPlaybookStages(
    tenantId: string,
    playbookId: string,
    stages: Array<{
      stageName: string;
      guidanceNotes?: string;
      checklist?: unknown[];
      requiredFields?: string[];
      talkingPoints?: string[];
      exitCriteria?: unknown[];
      sortOrder?: number;
    }>
  ) {
    const playbook = await prisma.salesPlaybook.findFirst({ where: { id: playbookId, tenantId, deletedAt: null } });
    if (!playbook) throw new NotFoundException('Playbook not found');
    return prisma.$transaction(async (tx) => {
      await tx.playbookStage.deleteMany({ where: { playbookId } });
      return tx.playbookStage.createMany({
        data: stages.map((s, idx) => ({
          tenantId,
          playbookId,
          stageName: s.stageName,
          guidanceNotes: s.guidanceNotes || null,
          requiredFields: (s.requiredFields || []) as unknown as Prisma.InputJsonValue,
          checklist: (s.checklist || []) as unknown as Prisma.InputJsonValue,
          talkingPoints: (s.talkingPoints || []) as unknown as Prisma.InputJsonValue,
          exitCriteria: (s.exitCriteria || []) as unknown as Prisma.InputJsonValue,
          sortOrder: s.sortOrder !== undefined ? s.sortOrder : idx,
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
        objections: dto.objections as Prisma.InputJsonValue,
        winStrategy: dto.winStrategy || null,
        loseReasons: dto.loseReasons as Prisma.InputJsonValue,
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
        ...(dto.objections !== undefined && { objections: dto.objections as Prisma.InputJsonValue }),
        ...(dto.winStrategy !== undefined && { winStrategy: dto.winStrategy }),
        ...(dto.loseReasons !== undefined && { loseReasons: dto.loseReasons as Prisma.InputJsonValue }),
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

  // ── STAGE-GATE CHECKLISTS ─────────────────────

  async getOpportunityChecklist(tenantId: string, opportunityId: string) {
    return prisma.opportunityChecklist.findMany({
      where: { opportunityId, tenantId },
    });
  }

  async toggleChecklistItem(tenantId: string, opportunityId: string, itemId: string, userId: string) {
    const existing = await prisma.opportunityChecklist.findFirst({
      where: { id: itemId, opportunityId, tenantId },
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
    const playbook = await prisma.salesPlaybook.findFirst({
      where: { tenantId, pipelineId: opp.pipelineId, isActive: true, deletedAt: null },
      include: { stages: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!playbook) return { canAdvance: true, blockers: [] };
    const stageConfig = playbook.stages.find((s: { stageName: string }) => s.stageName === targetStage);
    if (!stageConfig) return { canAdvance: true, blockers: [] };
    const requiredFields = stageConfig.requiredFields as string[] | null;
    if (requiredFields && requiredFields.length > 0) {
      for (const field of requiredFields) {
        if (!(opp as Record<string, unknown>)[field]) {
          blockers.push(`Required field "${field}" is missing`);
        }
      }
    }
    const requiredChecklist = stageConfig.checklist as string[] | null;
    if (requiredChecklist && requiredChecklist.length > 0) {
      const checklistItems = await prisma.opportunityChecklist.findMany({
        where: { opportunityId, stageChecklistId: { in: requiredChecklist } },
      });
      for (const label of requiredChecklist) {
        const item = checklistItems.find((c) => c.stageChecklistId === label);
        if (!item || !item.isCompleted) {
          blockers.push(`Required checklist item "${label}" is not completed`);
        }
      }
    }
    return { canAdvance: blockers.length === 0, blockers };
  }

  // ── OPPORTUNITY EXPORT & BULK ACTIONS ──────────

  async exportOpportunities(tenantId: string, query?: { pipelineId?: string; stage?: string; search?: string }) {
    const where: Prisma.OpportunityWhereInput = { tenantId, deletedAt: null };
    if (query?.pipelineId) where.pipelineId = query.pipelineId;
    if (query?.stage) where.stage = query.stage;
    if (query?.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    return prisma.opportunity.findMany({
      where,
      orderBy: { name: 'asc' },
      select: {
        id: true, name: true, amount: true, stage: true, pipelineId: true,
        expectedCloseDate: true, actualCloseDate: true, probability: true,
        createdAt: true, updatedAt: true,
      },
    });
  }

  async bulkUpdateOpportunityStage(tenantId: string, ids: string[], stage: string) {
    if (!ids || ids.length === 0) {
      throw new BadRequestException('At least one opportunity ID is required');
    }
    // Validate that the stage is a non-empty string
    if (!stage || typeof stage !== 'string' || stage.trim().length === 0) {
      throw new BadRequestException('Stage must be a non-empty string');
    }
    // Note: Bulk updates bypass the single-opportunity stage validation (checklist/required fields).
    // This is intentional for performance: use single updateOpportunityStage for full validation.
    const result = await prisma.opportunity.updateMany({
      where: { id: { in: ids }, tenantId, deletedAt: null },
      data: { stage, stageEnteredAt: new Date() },
    });
    return { updated: result.count, stage };
  }
}
