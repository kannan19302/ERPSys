import { describe, it, expect, vi, beforeEach } from "vitest";
import { CrmMarketingDeepService } from "../crm-marketing-deep.service";
import { NotFoundException, BadRequestException } from "@nestjs/common";
import { Prisma } from "@prisma/client";

vi.mock("@unerp/database", () => ({
  prisma: {
    campaign: { findFirst: vi.fn(), findMany: vi.fn() },
    campaignAsset: {
      findMany: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      findFirst: vi.fn(),
    },
    campaignAttribution: { findMany: vi.fn(), create: vi.fn() },
    campaignROI: { findMany: vi.fn() },
    marketingCalendarEntry: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findFirst: vi.fn(),
    },
    landingPage: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      findFirst: vi.fn(),
    },
    formSubmission: { findMany: vi.fn(), count: vi.fn() },
    webVisitor: { findMany: vi.fn() },
    lead: { count: vi.fn(), findMany: vi.fn() },
    leadSource: { findMany: vi.fn() },
  },
}));

import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";

const TENANT = "tenant-1";

describe("CrmMarketingDeepService", () => {
  let service: CrmMarketingDeepService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CrmMarketingDeepService();
  });

  describe("getCampaignAssets", () => {
    it("returns assets for a campaign", async () => {
      (prisma.campaignAsset.findMany as any).mockResolvedValue([
        { id: "a-1", name: "Banner", type: "IMAGE" },
      ]);
      const result = await service.getCampaignAssets(TENANT, "cmp-1");
      expect(result).toHaveLength(1);
    });
  });

  describe("createAsset", () => {
    it("throws if campaign not found", async () => {
      (prisma.campaign.findFirst as any).mockResolvedValue(null);
      await expect(
        service.createAsset(TENANT, "cmp-1", { type: "IMAGE", name: "Banner" }),
      ).rejects.toThrow(NotFoundException);
    });

    it("creates an asset", async () => {
      (prisma.campaign.findFirst as any).mockResolvedValue({ id: "cmp-1" });
      (prisma.campaignAsset.create as any).mockResolvedValue({
        id: "a-1",
        name: "Banner",
        type: "IMAGE",
      });
      const result = await service.createAsset(TENANT, "cmp-1", {
        type: "IMAGE",
        name: "Banner",
      });
      expect(result.name).toBe("Banner");
    });
  });

  describe("deleteAsset", () => {
    it("throws if asset not found", async () => {
      (prisma.campaignAsset.findFirst as any).mockResolvedValue(null);
      await expect(service.deleteAsset(TENANT, "x")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("deletes an asset", async () => {
      (prisma.campaignAsset.findFirst as any).mockResolvedValue({ id: "a-1" });
      (prisma.campaignAsset.delete as any).mockResolvedValue({ id: "a-1" });
      const result = await service.deleteAsset(TENANT, "a-1");
      expect(result.id).toBe("a-1");
    });
  });

  describe("getCampaignAttributions", () => {
    it("returns attributions", async () => {
      (prisma.campaignAttribution.findMany as any).mockResolvedValue([
        { id: "attr-1", revenue: 1000 },
      ]);
      const result = await service.getCampaignAttributions(TENANT, "cmp-1");
      expect(result).toHaveLength(1);
    });
  });

  describe("createCampaignAttribution", () => {
    it("throws if campaign not found", async () => {
      (prisma.campaign.findFirst as any).mockResolvedValue(null);
      await expect(
        service.createCampaignAttribution(TENANT, "cmp-1", {
          opportunityId: "opp-1",
          attributionType: "FIRST_TOUCH",
          revenue: 1000,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it("creates attribution", async () => {
      (prisma.campaign.findFirst as any).mockResolvedValue({ id: "cmp-1" });
      (prisma.campaignAttribution.create as any).mockResolvedValue({
        id: "attr-1",
        revenue: new Prisma.Decimal(1000),
      });
      const result = await service.createCampaignAttribution(TENANT, "cmp-1", {
        opportunityId: "opp-1",
        attributionType: "LAST_TOUCH",
        revenue: 5000,
      });
      expect(result.revenue).toBeTruthy();
    });
  });

  describe("getAttributionSummary", () => {
    it("returns empty summary when no attributions exist", async () => {
      (prisma.campaignAttribution.findMany as any).mockResolvedValue([]);
      const result = await service.getAttributionSummary(TENANT, "cmp-1");
      expect(result.totalRevenue).toBe(0);
    });

    it("aggregates by type", async () => {
      (prisma.campaignAttribution.findMany as any).mockResolvedValue([
        {
          id: "a-1",
          attributionType: "FIRST_TOUCH",
          revenue: new Prisma.Decimal(1000),
          weight: new Prisma.Decimal(1),
        },
        {
          id: "a-2",
          attributionType: "LAST_TOUCH",
          revenue: new Prisma.Decimal(2000),
          weight: new Prisma.Decimal(1),
        },
      ]);
      const result = await service.getAttributionSummary(TENANT, "cmp-1");
      expect(result.totalRevenue).toBe(3000);
      expect(Object.keys(result.byType)).toHaveLength(2);
    });
  });

  describe("getMarketingCalendar", () => {
    it("returns calendar entries", async () => {
      (prisma.marketingCalendarEntry.findMany as any).mockResolvedValue([
        { id: "cal-1", title: "Campaign Launch" },
      ]);
      const result = await service.getMarketingCalendar(TENANT);
      expect(result).toHaveLength(1);
    });

    it("filters by date range", async () => {
      (prisma.marketingCalendarEntry.findMany as any).mockResolvedValue([]);
      await service.getMarketingCalendar(TENANT, "2026-01-01", "2026-12-31");
      expect(
        (prisma.marketingCalendarEntry.findMany as any).mock.calls[0][0].where
          .startDate,
      ).toBeDefined();
    });
  });

  describe("createCalendarEntry", () => {
    it("creates a calendar entry", async () => {
      (prisma.marketingCalendarEntry.create as any).mockResolvedValue({
        id: "cal-1",
        title: "Event",
        entryType: "EVENT",
      });
      const result = await service.createCalendarEntry(TENANT, {
        title: "Event",
        entryType: "EVENT",
        startDate: "2026-07-01",
      });
      expect(result.title).toBe("Event");
    });
  });

  describe("updateCalendarEntry", () => {
    it("throws if entry not found", async () => {
      (prisma.marketingCalendarEntry.findFirst as any).mockResolvedValue(null);
      await expect(
        service.updateCalendarEntry(TENANT, "x", { title: "Updated" }),
      ).rejects.toThrow(NotFoundException);
    });

    it("updates entry", async () => {
      (prisma.marketingCalendarEntry.findFirst as any).mockResolvedValue({
        id: "cal-1",
      });
      (prisma.marketingCalendarEntry.update as any).mockResolvedValue({
        id: "cal-1",
        title: "Updated",
      });
      const result = await service.updateCalendarEntry(TENANT, "cal-1", {
        title: "Updated",
      });
      expect(result.title).toBe("Updated");
    });
  });

  describe("deleteCalendarEntry", () => {
    it("throws if entry not found", async () => {
      (prisma.marketingCalendarEntry.findFirst as any).mockResolvedValue(null);
      await expect(service.deleteCalendarEntry(TENANT, "x")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("deletes entry", async () => {
      (prisma.marketingCalendarEntry.findFirst as any).mockResolvedValue({
        id: "cal-1",
      });
      (prisma.marketingCalendarEntry.delete as any).mockResolvedValue({
        id: "cal-1",
      });
      const result = await service.deleteCalendarEntry(TENANT, "cal-1");
      expect(result.id).toBe("cal-1");
    });
  });

  describe("getCampaignROIDetails", () => {
    it("throws if campaign not found", async () => {
      (prisma.campaign.findFirst as any).mockResolvedValue(null);
      await expect(service.getCampaignROIDetails(TENANT, "x")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("returns ROI details with calculations", async () => {
      (prisma.campaign.findFirst as any).mockResolvedValue({
        id: "cmp-1",
        name: "Campaign",
        budget: new Prisma.Decimal(1000),
        actualCost: new Prisma.Decimal(800),
      });
      (prisma.campaignROI.findMany as any).mockResolvedValue([]);
      (prisma.lead.count as any).mockResolvedValue(10);
      (prisma.lead.findMany as any).mockResolvedValue([
        {
          id: "l-1",
          opportunities: [
            { amount: new Prisma.Decimal(5000), stage: "CLOSED_WON" },
          ],
        },
      ]);
      const result = await service.getCampaignROIDetails(TENANT, "cmp-1");
      expect(result.totalRevenue).toBe(5000);
      expect(result.leadsGenerated).toBe(10);
      expect(result.roi).toBeGreaterThan(0);
    });
  });

  describe("getLandingPages", () => {
    it("returns landing pages", async () => {
      (prisma.landingPage.findMany as any).mockResolvedValue([
        { id: "lp-1", title: "Signup" },
      ]);
      const result = await service.getLandingPages(TENANT);
      expect(result).toHaveLength(1);
    });
  });

  describe("createLandingPage", () => {
    it("throws if slug already exists", async () => {
      (prisma.landingPage.findUnique as any).mockResolvedValue({ id: "lp-1" });
      await expect(
        service.createLandingPage(TENANT, {
          title: "Page",
          slug: "test",
          content: "<p>Hi</p>",
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it("creates a landing page", async () => {
      (prisma.landingPage.findUnique as any).mockResolvedValue(null);
      (prisma.landingPage.create as any).mockResolvedValue({
        id: "lp-1",
        title: "Page",
        slug: "test",
      });
      const result = await service.createLandingPage(TENANT, {
        title: "Page",
        slug: "test",
        content: "<p>Hi</p>",
      });
      expect(result.slug).toBe("test");
    });
  });

  describe("updateLandingPage", () => {
    it("throws if page not found", async () => {
      (prisma.landingPage.findFirst as any).mockResolvedValue(null);
      await expect(
        service.updateLandingPage(TENANT, "x", { title: "New" }),
      ).rejects.toThrow(NotFoundException);
    });

    it("updates landing page", async () => {
      (prisma.landingPage.findFirst as any).mockResolvedValue({ id: "lp-1" });
      (prisma.landingPage.update as any).mockResolvedValue({
        id: "lp-1",
        title: "New Title",
      });
      const result = await service.updateLandingPage(TENANT, "lp-1", {
        title: "New Title",
      });
      expect(result.title).toBe("New Title");
    });
  });

  describe("publishLandingPage", () => {
    it("toggles publish status", async () => {
      (prisma.landingPage.findFirst as any).mockResolvedValue({
        id: "lp-1",
        isPublished: false,
      });
      (prisma.landingPage.update as any).mockResolvedValue({
        id: "lp-1",
        isPublished: true,
        publishedAt: new Date(),
      });
      const result = await service.publishLandingPage(TENANT, "lp-1");
      expect(result.isPublished).toBe(true);
    });
  });

  describe("getLandingPageStats", () => {
    it("throws if page not found", async () => {
      (prisma.landingPage.findUnique as any).mockResolvedValue(null);
      await expect(service.getLandingPageStats(TENANT, "test")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("returns aggregated stats", async () => {
      (prisma.landingPage.findUnique as any).mockResolvedValue({
        id: "lp-1",
        title: "Page",
        slug: "test",
        viewCount: 100,
        submissionCount: 10,
        isPublished: true,
      });
      (prisma.formSubmission.count as any).mockResolvedValue(5);
      (prisma.lead.count as any).mockResolvedValue(3);
      const result = await service.getLandingPageStats(TENANT, "test");
      expect(result.viewCount).toBe(100);
      expect(result.submissions).toBe(5);
      expect(result.leadsGenerated).toBe(3);
    });
  });

  describe("getFormSubmissions", () => {
    it("returns form submissions", async () => {
      (prisma.formSubmission.findMany as any).mockResolvedValue([
        { id: "fs-1", data: { name: "John" } },
      ]);
      const result = await service.getFormSubmissions(TENANT, "form-1");
      expect(result).toHaveLength(1);
    });
  });

  describe("getWebVisitorAnalytics", () => {
    it("returns aggregated visitor analytics", async () => {
      (prisma.webVisitor.findMany as any).mockResolvedValue([
        { source: "ORGANIC", pageViews: 5, timeOnSite: 120 },
        { source: "PAID", pageViews: 3, timeOnSite: 60 },
      ]);
      const result = await service.getWebVisitorAnalytics(TENANT);
      expect(result.totalVisitors).toBe(2);
      expect(result.totalPageViews).toBe(8);
      expect(result.bySource).toHaveLength(2);
    });

    it("filters by source and date range", async () => {
      (prisma.webVisitor.findMany as any).mockResolvedValue([]);
      await service.getWebVisitorAnalytics(
        TENANT,
        "ORGANIC",
        "2026-01-01",
        "2026-12-31",
      );
      const where = (prisma.webVisitor.findMany as any).mock.calls[0][0].where;
      expect(where.source).toBe("ORGANIC");
      expect(where.lastSeen.gte).toBeDefined();
    });
  });

  describe("getCampaignPerformanceSummary", () => {
    it("returns aggregate campaign metrics", async () => {
      (prisma.campaign.findMany as any).mockResolvedValue([
        {
          id: "cmp-1",
          name: "C1",
          status: "ACTIVE",
          budget: new Prisma.Decimal(1000),
          actualCost: new Prisma.Decimal(800),
        },
      ]);
      (prisma.lead.count as any).mockResolvedValue(5);
      (prisma.lead.findMany as any).mockResolvedValue([
        {
          id: "l-1",
          opportunities: [
            { amount: new Prisma.Decimal(3000), stage: "CLOSED_WON" },
          ],
        },
      ]);
      const result = await service.getCampaignPerformanceSummary(TENANT);
      expect(result.campaigns).toHaveLength(1);
      expect(result.totals.leads).toBe(5);
    });
  });

  describe("getLeadSourceAttribution", () => {
    it("returns revenue by lead source", async () => {
      (prisma.leadSource.findMany as any).mockResolvedValue([
        { id: "src-1", name: "Google Ads" },
      ]);
      (prisma.lead.findMany as any).mockResolvedValue([
        {
          id: "l-1",
          opportunities: [
            { amount: new Prisma.Decimal(5000), stage: "CLOSED_WON" },
          ],
        },
      ]);
      const result = await service.getLeadSourceAttribution(TENANT);
      expect(result).toHaveLength(1);
      expect(result[0].revenue).toBe(5000);
      expect(result[0].sourceName).toBe("Google Ads");
    });
  });
});
