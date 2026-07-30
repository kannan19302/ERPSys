// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  CrmContentManagementService,
  createContentCategorySchema,
  createContentItemSchema,
} from "../crm-content-management.service";
import { NotFoundException, BadRequestException } from "@nestjs/common";

vi.mock("@unerp/database", () => ({
  prisma: {
    contentCategory: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    contentItem: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    contentAnalytics: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
      aggregate: vi.fn(),
    },
    lead: { findFirst: vi.fn() },
    opportunity: { findFirst: vi.fn() },
  },
}));

import { prisma } from "@unerp/database";

const TENANT = "tenant-1";
const USER = "user-1";

describe("CrmContentManagementService", () => {
  let service: CrmContentManagementService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CrmContentManagementService();
  });

  describe("getContentCategories", () => {
    it("returns categories sorted by sortOrder", async () => {
      (prisma.contentCategory.findMany as any).mockResolvedValue([
        {
          id: "cat-1",
          name: "Sales Decks",
          sortOrder: 0,
          _count: { items: 3 },
        },
      ]);
      const results = await service.getContentCategories(TENANT);
      expect(prisma.contentCategory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { tenantId: TENANT } }),
      );
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe("Sales Decks");
    });
  });

  describe("createCategory", () => {
    it("creates a category", async () => {
      const dto = {
        name: "Case Studies",
        description: "Customer success stories",
        sortOrder: 1,
      };
      (prisma.contentCategory.create as any).mockResolvedValue({
        id: "cat-new",
        ...dto,
        tenantId: TENANT,
      });
      const result = await service.createCategory(TENANT, dto);
      expect(prisma.contentCategory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: "Case Studies",
            tenantId: TENANT,
          }),
        }),
      );
      expect(result.id).toBe("cat-new");
    });
  });

  describe("updateCategory", () => {
    it("throws NotFoundException when category not found", async () => {
      (prisma.contentCategory.findFirst as any).mockResolvedValue(null);
      await expect(
        service.updateCategory(TENANT, "x", { name: "New" }),
      ).rejects.toThrow(NotFoundException);
    });

    it("updates and returns the category", async () => {
      (prisma.contentCategory.findFirst as any).mockResolvedValue({
        id: "cat-1",
        name: "Old",
      });
      (prisma.contentCategory.update as any).mockResolvedValue({
        id: "cat-1",
        name: "New",
      });
      const result = await service.updateCategory(TENANT, "cat-1", {
        name: "New",
      });
      expect(result.name).toBe("New");
    });
  });

  describe("deleteCategory", () => {
    it("throws BadRequestException when category has items", async () => {
      (prisma.contentCategory.findFirst as any).mockResolvedValue({
        id: "cat-1",
      });
      (prisma.contentItem.count as any).mockResolvedValue(3);
      await expect(service.deleteCategory(TENANT, "cat-1")).rejects.toThrow(
        BadRequestException,
      );
    });

    it("deletes category with no items", async () => {
      (prisma.contentCategory.findFirst as any).mockResolvedValue({
        id: "cat-1",
      });
      (prisma.contentItem.count as any).mockResolvedValue(0);
      (prisma.contentCategory.delete as any).mockResolvedValue({ id: "cat-1" });
      const result = await service.deleteCategory(TENANT, "cat-1");
      expect(prisma.contentCategory.delete).toHaveBeenCalledWith({
        where: { id: "cat-1" },
      });
      expect(result.id).toBe("cat-1");
    });
  });

  describe("getContentItems", () => {
    it("returns paginated content items", async () => {
      (prisma.contentItem.findMany as any).mockResolvedValue([
        { id: "item-1", title: "Deck A", category: null },
      ]);
      (prisma.contentItem.count as any).mockResolvedValue(1);
      const result = await service.getContentItems(TENANT, {
        page: 1,
        limit: 20,
      });
      expect(result.data).toHaveLength(1);
      expect(result.totalCount).toBe(1);
    });

    it("filters by type, category, status, and search", async () => {
      (prisma.contentItem.findMany as any).mockResolvedValue([]);
      (prisma.contentItem.count as any).mockResolvedValue(0);
      await service.getContentItems(TENANT, {
        type: "VIDEO",
        category: "cat-1",
        status: "PUBLISHED",
        search: "demo",
      });
      const callArgs = (prisma.contentItem.findMany as any).mock.calls[0][0];
      expect(callArgs.where.type).toBe("VIDEO");
      expect(callArgs.where.categoryId).toBe("cat-1");
      expect(callArgs.where.status).toBe("PUBLISHED");
      expect(callArgs.where.OR).toBeDefined();
    });
  });

  describe("createContentItem", () => {
    it("creates content item with analytics record", async () => {
      const dto = {
        title: "Demo Video",
        type: "VIDEO" as const,
        tags: ["demo"],
      };
      (prisma.contentItem.create as any).mockResolvedValue({ id: "item-new" });
      (prisma.contentAnalytics.create as any).mockResolvedValue({});
      (prisma.contentItem.findUnique as any).mockResolvedValue({
        id: "item-new",
        title: "Demo Video",
        category: null,
      });
      const result = await service.createContentItem(TENANT, USER, dto as any);
      expect(prisma.contentAnalytics.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ contentId: "item-new" }),
        }),
      );
      expect(result.title).toBe("Demo Video");
    });
  });

  describe("updateContentItem", () => {
    it("throws NotFoundException when item not found", async () => {
      (prisma.contentItem.findFirst as any).mockResolvedValue(null);
      await expect(
        service.updateContentItem(TENANT, "x", { title: "New" }),
      ).rejects.toThrow(NotFoundException);
    });

    it("updates and increments version", async () => {
      (prisma.contentItem.findFirst as any).mockResolvedValue({
        id: "item-1",
        title: "Old",
        tags: [],
      });
      (prisma.contentItem.update as any).mockResolvedValue({
        id: "item-1",
        title: "New",
        category: null,
      });
      const result = await service.updateContentItem(TENANT, "item-1", {
        title: "New",
      });
      expect(result.title).toBe("New");
      expect(prisma.contentItem.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ version: { increment: 1 } }),
        }),
      );
    });
  });

  describe("deleteContentItem", () => {
    it("deletes item and associated analytics", async () => {
      (prisma.contentItem.findFirst as any).mockResolvedValue({ id: "item-1" });
      (prisma.contentAnalytics.deleteMany as any).mockResolvedValue({
        count: 1,
      });
      (prisma.contentItem.delete as any).mockResolvedValue({ id: "item-1" });
      await service.deleteContentItem(TENANT, "item-1");
      expect(prisma.contentAnalytics.deleteMany).toHaveBeenCalledWith({
        where: { contentId: "item-1" },
      });
      expect(prisma.contentItem.delete).toHaveBeenCalledWith({
        where: { id: "item-1" },
      });
    });
  });

  describe("getContentItemById", () => {
    it("throws NotFoundException when item not found", async () => {
      (prisma.contentItem.findFirst as any).mockResolvedValue(null);
      await expect(service.getContentItemById(TENANT, "x")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("returns item with category", async () => {
      (prisma.contentItem.findFirst as any).mockResolvedValue({
        id: "item-1",
        title: "Test",
        category: { id: "cat-1", name: "Docs" },
      });
      const item = await service.getContentItemById(TENANT, "item-1");
      expect(item.title).toBe("Test");
    });
  });

  describe("recordContentView / recordContentDownload / recordContentShare", () => {
    it("increments view count", async () => {
      (prisma.contentItem.findFirst as any).mockResolvedValue({ id: "item-1" });
      (prisma.contentAnalytics.findFirst as any).mockResolvedValue({
        id: "analytics-1",
        contentId: "item-1",
      });
      (prisma.contentAnalytics.update as any).mockResolvedValue({
        viewCount: 1,
      });
      await service.recordContentView(TENANT, "item-1");
      expect(prisma.contentAnalytics.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            viewCount: { increment: 1 },
            lastAccessedAt: expect.any(Date),
          },
        }),
      );
    });

    it("increments download count", async () => {
      (prisma.contentItem.findFirst as any).mockResolvedValue({ id: "item-1" });
      (prisma.contentAnalytics.findFirst as any).mockResolvedValue({
        id: "analytics-1",
      });
      (prisma.contentAnalytics.update as any).mockResolvedValue({
        downloadCount: 1,
      });
      await service.recordContentDownload(TENANT, "item-1");
      expect(prisma.contentAnalytics.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ downloadCount: { increment: 1 } }),
        }),
      );
    });

    it("increments share count", async () => {
      (prisma.contentItem.findFirst as any).mockResolvedValue({ id: "item-1" });
      (prisma.contentAnalytics.findFirst as any).mockResolvedValue({
        id: "analytics-1",
      });
      (prisma.contentAnalytics.update as any).mockResolvedValue({
        shareCount: 1,
      });
      await service.recordContentShare(TENANT, "item-1");
      expect(prisma.contentAnalytics.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ shareCount: { increment: 1 } }),
        }),
      );
    });
  });

  describe("getContentAnalytics", () => {
    it("throws NotFoundException when analytics not found", async () => {
      (prisma.contentAnalytics.findFirst as any).mockResolvedValue(null);
      await expect(service.getContentAnalytics("x")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("getContentDashboard", () => {
    it("returns aggregated dashboard stats", async () => {
      (prisma.contentItem.count as any)
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(8);
      (prisma.contentAnalytics.aggregate as any).mockResolvedValue({
        _sum: { viewCount: 100, downloadCount: 50, shareCount: 20 },
      });
      (prisma.contentItem.findMany as any).mockResolvedValue([]);
      const dash = await service.getContentDashboard(TENANT);
      expect(dash.totalItems).toBe(10);
      expect(dash.publishedItems).toBe(8);
      expect(dash.totalViews).toBe(100);
      expect(dash.totalDownloads).toBe(50);
      expect(dash.totalShares).toBe(20);
    });
  });

  describe("searchContent", () => {
    it("searches published items by title or description", async () => {
      (prisma.contentItem.findMany as any).mockResolvedValue([]);
      await service.searchContent(TENANT, "sales deck");
      expect(prisma.contentItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: TENANT,
            status: "PUBLISHED",
            OR: expect.arrayContaining([
              { title: { contains: "sales deck", mode: "insensitive" } },
            ]),
          }),
        }),
      );
    });
  });

  describe("getContentRecommendations", () => {
    it("returns top content for leads based on industry tags", async () => {
      (prisma.lead.findFirst as any).mockResolvedValue({
        id: "lead-1",
        industry: "Tech",
        tags: ["SaaS"],
      });
      (prisma.contentItem.findMany as any).mockResolvedValue([
        {
          id: "item-1",
          title: "Tech Deck",
          tags: ["Tech", "SaaS"],
          category: null,
          relevanceScore: 2,
        },
        {
          id: "item-2",
          title: "General",
          tags: ["Other"],
          category: null,
          relevanceScore: 0,
        },
      ]);
      const items = await service.getContentRecommendations(
        TENANT,
        "lead",
        "lead-1",
      );
      expect(items).toHaveLength(2);
    });
  });
});
