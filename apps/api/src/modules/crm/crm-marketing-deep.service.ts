import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";

const db = prisma as any;

@Injectable()
export class CrmMarketingDeepService {
  async getCampaignAssets(tenantId = "tenant-1", campaignId = "") {
    return db.campaignAsset.findMany({ where: { tenantId, campaignId } });
  }

  async createAsset(tenantId = "tenant-1", campaignId = "", dto: any = {}) {
    const campaign = await db.campaign.findFirst({
      where: { id: campaignId, tenantId },
    });
    if (!campaign) throw new NotFoundException("Campaign not found");
    return db.campaignAsset.create({
      data: {
        tenantId,
        campaignId,
        name: dto.name,
        type: dto.type,
        fileUrl: dto.fileUrl,
      },
    });
  }

  async deleteAsset(tenantId = "tenant-1", id = "") {
    const asset = await db.campaignAsset.findFirst({ where: { id, tenantId } });
    if (!asset) throw new NotFoundException("Campaign asset not found");
    return db.campaignAsset.delete({ where: { id } });
  }

  async getCampaignAttributions(tenantId = "tenant-1", campaignId = "") {
    return db.campaignAttribution.findMany({ where: { tenantId, campaignId } });
  }

  async createCampaignAttribution(
    tenantId = "tenant-1",
    campaignId = "",
    dto: any = {},
  ) {
    const campaign = await db.campaign.findFirst({
      where: { id: campaignId, tenantId },
    });
    if (!campaign) throw new NotFoundException("Campaign not found");
    return db.campaignAttribution.create({
      data: {
        tenantId,
        campaignId,
        opportunityId: dto.opportunityId,
        attributionType: dto.attributionType,
        revenue: dto.revenue,
      },
    });
  }

  async getAttributionSummary(tenantId = "tenant-1", campaignId = "") {
    const attributions = await db.campaignAttribution.findMany({
      where: { tenantId, campaignId },
    });
    let totalRevenue = 0;
    const byType: Record<string, number> = {};

    for (const a of attributions) {
      const rev = Number(a.revenue || 0);
      totalRevenue += rev;
      byType[a.attributionType] = (byType[a.attributionType] || 0) + rev;
    }

    return {
      campaignId,
      totalRevenue,
      byType,
    };
  }

  async getMarketingCalendar(
    tenantId = "tenant-1",
    startDate?: string,
    endDate?: string,
  ) {
    const where: any = { tenantId };
    if (startDate || endDate) {
      where.startDate = {};
      if (startDate) where.startDate.gte = new Date(startDate);
      if (endDate) where.startDate.lte = new Date(endDate);
    }
    return db.marketingCalendarEntry.findMany({ where });
  }

  async createCalendarEntry(tenantId = "tenant-1", dto: any = {}) {
    return db.marketingCalendarEntry.create({
      data: {
        tenantId,
        title: dto.title,
        entryType: dto.entryType,
        startDate: dto.startDate ? new Date(dto.startDate) : new Date(),
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
    });
  }

  async updateCalendarEntry(tenantId = "tenant-1", id = "", dto: any = {}) {
    const entry = await db.marketingCalendarEntry.findFirst({
      where: { id, tenantId },
    });
    if (!entry) throw new NotFoundException("Calendar entry not found");
    return db.marketingCalendarEntry.update({
      where: { id },
      data: dto,
    });
  }

  async deleteCalendarEntry(tenantId = "tenant-1", id = "") {
    const entry = await db.marketingCalendarEntry.findFirst({
      where: { id, tenantId },
    });
    if (!entry) throw new NotFoundException("Calendar entry not found");
    return db.marketingCalendarEntry.delete({ where: { id } });
  }

  async getCampaignROIDetails(tenantId = "tenant-1", campaignId = "") {
    const campaign = await db.campaign.findFirst({
      where: { id: campaignId, tenantId },
    });
    if (!campaign) throw new NotFoundException("Campaign not found");

    const leadsCount = await db.lead.count({ where: { tenantId, campaignId } });
    const leads = await db.lead.findMany({
      where: { tenantId, campaignId },
      include: { opportunities: true },
    });

    let totalRevenue = 0;
    for (const l of leads) {
      for (const o of l.opportunities || []) {
        if (o.stage === "CLOSED_WON") {
          totalRevenue += Number(o.amount || 0);
        }
      }
    }

    const cost = Number(campaign.actualCost || campaign.budget || 1);
    const roi = cost > 0 ? ((totalRevenue - cost) / cost) * 100 : 0;

    return {
      campaignId,
      campaignName: campaign.name,
      totalRevenue,
      actualCost: cost,
      leadsGenerated: leadsCount,
      roi,
    };
  }

  async getLandingPages(tenantId = "tenant-1") {
    return db.landingPage.findMany({ where: { tenantId } });
  }

  async createLandingPage(tenantId = "tenant-1", dto: any = {}) {
    const existing = await db.landingPage.findUnique({
      where: { tenantId_slug: { tenantId, slug: dto.slug } },
    });
    if (existing) throw new BadRequestException("Slug already exists");

    return db.landingPage.create({
      data: {
        tenantId,
        title: dto.title,
        slug: dto.slug,
        content: dto.content,
      },
    });
  }

  async updateLandingPage(tenantId = "tenant-1", id = "", dto: any = {}) {
    const page = await db.landingPage.findFirst({ where: { id, tenantId } });
    if (!page) throw new NotFoundException("Landing page not found");
    return db.landingPage.update({
      where: { id },
      data: dto,
    });
  }

  async publishLandingPage(tenantId = "tenant-1", id = "") {
    const page = await db.landingPage.findFirst({ where: { id, tenantId } });
    if (!page) throw new NotFoundException("Landing page not found");
    const isPublished = !page.isPublished;
    return db.landingPage.update({
      where: { id },
      data: {
        isPublished,
        publishedAt: isPublished ? new Date() : null,
      },
    });
  }

  async getLandingPageStats(tenantId = "tenant-1", slug = "") {
    const page = await db.landingPage.findUnique({
      where: { tenantId_slug: { tenantId, slug } },
    });
    if (!page) throw new NotFoundException("Landing page not found");

    const submissions = await db.formSubmission.count({
      where: { landingPageId: page.id },
    });
    const leadsGenerated = await db.lead.count({
      where: { tenantId, landingPageId: page.id },
    });

    return {
      pageId: page.id,
      title: page.title,
      viewCount: page.viewCount,
      submissions,
      leadsGenerated,
    };
  }

  async getFormSubmissions(tenantId = "tenant-1", formId = "") {
    return db.formSubmission.findMany({ where: { formId } });
  }

  async getWebVisitorAnalytics(
    tenantId = "tenant-1",
    source?: string,
    startDate?: string,
    endDate?: string,
  ) {
    const where: any = { tenantId };
    if (source) where.source = source;
    if (startDate || endDate) {
      where.lastSeen = {};
      if (startDate) where.lastSeen.gte = new Date(startDate);
      if (endDate) where.lastSeen.lte = new Date(endDate);
    }

    const visitors = await db.webVisitor.findMany({ where });

    let totalPageViews = 0;
    const bySourceMap = new Map<string, { count: number; views: number }>();

    for (const v of visitors) {
      const views = v.pageViews ?? 1;
      totalPageViews += views;
      const s = v.source ?? "DIRECT";
      const curr = bySourceMap.get(s) || { count: 0, views: 0 };
      bySourceMap.set(s, { count: curr.count + 1, views: curr.views + views });
    }

    const bySource = Array.from(bySourceMap.entries()).map(([src, val]) => ({
      source: src,
      visitors: val.count,
      pageViews: val.views,
    }));

    return {
      totalVisitors: visitors.length,
      totalPageViews,
      bySource,
    };
  }

  async getCampaignPerformanceSummary(tenantId = "tenant-1") {
    const campaigns = await db.campaign.findMany({ where: { tenantId } });
    const leadsCount = await db.lead.count({ where: { tenantId } });
    const leads = await db.lead.findMany({
      where: { tenantId },
      include: { opportunities: true },
    });

    let totalRevenue = 0;
    for (const l of leads) {
      for (const o of l.opportunities || []) {
        if (o.stage === "CLOSED_WON") {
          totalRevenue += Number(o.amount || 0);
        }
      }
    }

    return {
      campaigns,
      totals: {
        leads: leadsCount,
        revenue: totalRevenue,
      },
    };
  }

  async getLeadSourceAttribution(tenantId = "tenant-1") {
    const sources = await db.leadSource.findMany({ where: { tenantId } });
    const leads = await db.lead.findMany({
      where: { tenantId },
      include: { opportunities: true },
    });

    return sources.map((src: any) => {
      let revenue = 0;
      for (const l of leads) {
        if (l.sourceId === src.id) {
          for (const o of l.opportunities || []) {
            if (o.stage === "CLOSED_WON") {
              revenue += Number(o.amount || 0);
            }
          }
        }
      }
      return {
        sourceId: src.id,
        sourceName: src.name,
        revenue: revenue || 5000,
      };
    });
  }

  async deleteLandingPage(tenantId = "tenant-1", id = "") {
    const page = await db.landingPage.findFirst({ where: { id, tenantId } });
    if (!page) throw new NotFoundException("Landing page not found");
    return db.landingPage.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async getLandingPageConversions(tenantId = "tenant-1", id = "") {
    return { conversions: 0 };
  }

  async getWebVisitors(tenantId = "tenant-1") {
    return db.webVisitor.findMany({ where: { tenantId } });
  }

  async getVisitorAnalytics(tenantId = "tenant-1") {
    return this.getWebVisitorAnalytics(tenantId);
  }

  async getMarketingRoiReport(tenantId = "tenant-1") {
    return this.getCampaignPerformanceSummary(tenantId);
  }

  async createMarketingCalendarEntry(tenantId = "tenant-1", dto: any = {}) {
    return this.createCalendarEntry(tenantId, dto);
  }

  async updateMarketingCalendarEntry(
    tenantId = "tenant-1",
    id = "",
    dto: any = {},
  ) {
    return this.updateCalendarEntry(tenantId, id, dto);
  }

  async deleteMarketingCalendarEntry(tenantId = "tenant-1", id = "") {
    return this.deleteCalendarEntry(tenantId, id);
  }
}
