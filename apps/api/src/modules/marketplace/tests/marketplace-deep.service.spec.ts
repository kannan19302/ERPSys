import { describe, it, expect, vi, beforeEach } from "vitest";
import { MarketplaceDeepService } from "../marketplace-deep.service";

vi.mock("@unerp/database", () => ({
  prisma: {
    appReview: { findMany: vi.fn(), count: vi.fn(), aggregate: vi.fn(), groupBy: vi.fn(), findUnique: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    marketplaceApp: { update: vi.fn() },
    marketplaceAppVersion: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn() },
    marketplaceDeveloperSubmission: { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
    marketplaceAnalytics: { findMany: vi.fn(), aggregate: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
  },
  runWithTenantSession: vi.fn((_ctx, cb) => cb()),
}));

const mockDate = new Date("2026-07-27");
vi.setSystemTime(mockDate);

describe("MarketplaceDeepService", () => {
  let service: MarketplaceDeepService;

  beforeEach(() => {
    service = new MarketplaceDeepService();
    vi.clearAllMocks();
  });

  describe("app reviews", () => {
    it("should get reviews with aggregate stats", async () => {
      const { prisma } = require("@unerp/database");
      prisma.appReview.findMany.mockResolvedValue([]);
      prisma.appReview.count.mockResolvedValue(0);
      prisma.appReview.aggregate.mockResolvedValue({ _avg: { rating: 4.5 }, _count: { rating: 10 } });
      prisma.appReview.groupBy.mockResolvedValue([{ rating: 5, _count: 5 }]);
      const result = await service.getAppReviews("app-1", { page: 1, limit: 20 });
      expect(result.total).toBe(0);
      expect(result.aggregate.avgRating).toBe(4.5);
    });

    it("should create a review", async () => {
      const { prisma } = require("@unerp/database");
      prisma.appReview.findUnique.mockResolvedValue(null);
      prisma.appReview.create.mockResolvedValue({ id: "1", rating: 5, title: "Great", body: "Love it" });
      prisma.marketplaceApp.update.mockResolvedValue({});
      const result = await service.createAppReview("app-1", "u-1", "User", "t-1", { rating: 5, title: "Great", body: "Love it" });
      expect(result.rating).toBe(5);
    });

    it("should reject duplicate reviews", async () => {
      const { prisma } = require("@unerp/database");
      prisma.appReview.findUnique.mockResolvedValue({ id: "existing" });
      await expect(service.createAppReview("app-1", "u-1", "User", "t-1", { rating: 5 })).rejects.toThrow("already reviewed");
    });
  });

  describe("app versions", () => {
    it("should list versions", async () => {
      const { prisma } = require("@unerp/database");
      prisma.marketplaceAppVersion.findMany.mockResolvedValue([{ id: "1", version: "1.0.0" }]);
      const result = await service.getAppVersions("app-1");
      expect(result).toHaveLength(1);
    });
  });

  describe("developer submissions", () => {
    it("should list submissions", async () => {
      const { prisma } = require("@unerp/database");
      prisma.marketplaceDeveloperSubmission.findMany.mockResolvedValue([]);
      const result = await service.listSubmissions("t-1");
      expect(result).toEqual([]);
    });
  });

  describe("analytics", () => {
    it("should get analytics", async () => {
      const { prisma } = require("@unerp/database");
      prisma.marketplaceAnalytics.findMany.mockResolvedValue([]);
      prisma.marketplaceAnalytics.aggregate.mockResolvedValue({ _sum: { installs: 100, uninstalls: 10, revenue: 500 } });
      const result = await service.getAnalytics({ top: 10 });
      expect(result.totals.installs).toBe(100);
    });
  });
});
