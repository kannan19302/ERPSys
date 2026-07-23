import { describe, it, expect, vi, beforeEach } from "vitest";
import { CrmKnowledgeBaseService } from "../crm-knowledge-base.service";
import { NotFoundException, BadRequestException } from "@nestjs/common";
import { Prisma } from "@prisma/client";

vi.mock("@unerp/database", () => ({
  prisma: {
    knowledgeBaseCategory: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    knowledgeBaseArticle: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
      aggregate: vi.fn(),
    },
    knowledgeBaseArticleVersion: {
      create: vi.fn(),
      findFirst: vi.fn(),
    },
  },
}));

import { prisma } from "@unerp/database";

const TENANT = "tenant-1";
const ORG = "org-1";
const USER = "user-1";

describe("CrmKnowledgeBaseService", () => {
  let service: CrmKnowledgeBaseService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CrmKnowledgeBaseService();
  });

  describe("getCategories", () => {
    it("returns active categories with article counts sorted by sortOrder", async () => {
      (prisma.knowledgeBaseCategory.findMany as any).mockResolvedValue([
        {
          id: "cat-1",
          name: "Getting Started",
          sortOrder: 0,
          _count: { articles: 5 },
        },
      ]);
      const results = await service.getCategories(TENANT);
      expect(prisma.knowledgeBaseCategory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId: TENANT, deletedAt: null },
        }),
      );
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe("Getting Started");
    });
  });

  describe("getCategory", () => {
    it("throws NotFoundException when category does not exist", async () => {
      (prisma.knowledgeBaseCategory.findFirst as any).mockResolvedValue(null);
      await expect(service.getCategory(TENANT, "nonexistent")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("returns category with children and published articles", async () => {
      (prisma.knowledgeBaseCategory.findFirst as any).mockResolvedValue({
        id: "cat-1",
        name: "Guide",
        children: [],
        articles: [],
      });
      const result = await service.getCategory(TENANT, "cat-1");
      expect(result.name).toBe("Guide");
    });
  });

  describe("createCategory", () => {
    it("creates a category with orgId", async () => {
      const dto = { name: "FAQ", slug: "faq", sortOrder: 0, isActive: true };
      (prisma.knowledgeBaseCategory.create as any).mockResolvedValue({
        id: "cat-new",
        ...dto,
      });
      const result = await service.createCategory(TENANT, ORG, dto);
      expect(prisma.knowledgeBaseCategory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tenantId: TENANT,
            orgId: ORG,
            name: "FAQ",
          }),
        }),
      );
      expect(result.id).toBe("cat-new");
    });

    it("defaults orgId to empty string when undefined", async () => {
      const dto = { name: "FAQ", slug: "faq", sortOrder: 0, isActive: true };
      (prisma.knowledgeBaseCategory.create as any).mockResolvedValue({
        id: "cat-new",
      });
      await service.createCategory(TENANT, undefined, dto);
      expect(prisma.knowledgeBaseCategory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ orgId: "" }),
        }),
      );
    });
  });

  describe("updateCategory", () => {
    it("throws NotFoundException when category not found", async () => {
      (prisma.knowledgeBaseCategory.findFirst as any).mockResolvedValue(null);
      await expect(
        service.updateCategory(TENANT, "x", { name: "New" }),
      ).rejects.toThrow(NotFoundException);
    });

    it("updates and returns the category", async () => {
      (prisma.knowledgeBaseCategory.findFirst as any).mockResolvedValue({
        id: "cat-1",
        name: "Old",
      });
      (prisma.knowledgeBaseCategory.update as any).mockResolvedValue({
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
    it("throws BadRequestException when category has articles", async () => {
      (prisma.knowledgeBaseCategory.findFirst as any).mockResolvedValue({
        id: "cat-1",
      });
      (prisma.knowledgeBaseArticle.count as any).mockResolvedValue(3);
      await expect(service.deleteCategory(TENANT, "cat-1")).rejects.toThrow(
        BadRequestException,
      );
    });

    it("soft-deletes a category with no articles", async () => {
      (prisma.knowledgeBaseCategory.findFirst as any).mockResolvedValue({
        id: "cat-1",
      });
      (prisma.knowledgeBaseArticle.count as any).mockResolvedValue(0);
      (prisma.knowledgeBaseCategory.update as any).mockResolvedValue({
        id: "cat-1",
        deletedAt: new Date(),
      });
      const result = await service.deleteCategory(TENANT, "cat-1");
      expect(prisma.knowledgeBaseCategory.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ deletedAt: expect.any(Date) }),
        }),
      );
      expect(result.deletedAt).toBeDefined();
    });
  });

  describe("getArticles", () => {
    it("returns paginated articles with category info", async () => {
      (prisma.knowledgeBaseArticle.findMany as any).mockResolvedValue([
        {
          id: "art-1",
          title: "How to",
          category: { id: "cat-1", name: "Guide", slug: "guide" },
        },
      ]);
      (prisma.knowledgeBaseArticle.count as any).mockResolvedValue(1);
      const result = await service.getArticles(TENANT, { page: 1, limit: 20 });
      expect(result.data).toHaveLength(1);
      expect(result.totalCount).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it("filters by categoryId, status, search", async () => {
      (prisma.knowledgeBaseArticle.findMany as any).mockResolvedValue([]);
      (prisma.knowledgeBaseArticle.count as any).mockResolvedValue(0);
      await service.getArticles(TENANT, {
        categoryId: "cat-1",
        status: "PUBLISHED",
        search: "hello",
      });
      const callArgs = (prisma.knowledgeBaseArticle.findMany as any).mock
        .calls[0][0];
      expect(callArgs.where.categoryId).toBe("cat-1");
      expect(callArgs.where.status).toBe("PUBLISHED");
      expect(callArgs.where.OR).toBeDefined();
    });
  });

  describe("getArticle", () => {
    it("throws NotFoundException when article not found", async () => {
      (prisma.knowledgeBaseArticle.findFirst as any).mockResolvedValue(null);
      await expect(service.getArticle(TENANT, "x")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("increments view count on each read", async () => {
      (prisma.knowledgeBaseArticle.findFirst as any).mockResolvedValue({
        id: "art-1",
        title: "Test",
        versions: [],
        category: { id: "cat-1", name: "Guide", slug: "guide" },
      });
      (prisma.knowledgeBaseArticle.update as any).mockResolvedValue({});
      await service.getArticle(TENANT, "art-1");
      expect(prisma.knowledgeBaseArticle.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { viewCount: { increment: 1 } } }),
      );
    });
  });

  describe("createArticle", () => {
    it("creates article with initial version and sets publishedAt when PUBLISHED", async () => {
      const dto = {
        title: "New Article",
        slug: "new-article",
        content: "Body",
        status: "PUBLISHED" as const,
        tags: [],
        sortOrder: 0,
      };
      (prisma.knowledgeBaseArticle.create as any).mockResolvedValue({
        id: "art-new",
      });
      (prisma.knowledgeBaseArticle.update as any).mockResolvedValue({
        id: "art-new",
        publishedAt: new Date(),
      });
      (prisma.knowledgeBaseArticleVersion.create as any).mockResolvedValue({});
      (prisma.knowledgeBaseArticle.findUnique as any).mockResolvedValue({
        id: "art-new",
        category: null,
      });
      await service.createArticle(TENANT, ORG, USER, dto);
      expect(prisma.knowledgeBaseArticleVersion.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ version: 1 }),
        }),
      );
    });
  });

  describe("updateArticle", () => {
    it("creates a new version when title or content changes", async () => {
      (prisma.knowledgeBaseArticle.findFirst as any).mockResolvedValue({
        id: "art-1",
        title: "Old Title",
        content: "Old",
        status: "DRAFT",
      });
      (prisma.knowledgeBaseArticle.update as any).mockResolvedValue({
        id: "art-1",
        title: "New Title",
      });
      (prisma.knowledgeBaseArticleVersion.findFirst as any).mockResolvedValue({
        version: 2,
      });
      (prisma.knowledgeBaseArticleVersion.create as any).mockResolvedValue({});
      await service.updateArticle(TENANT, "art-1", USER, {
        title: "New Title",
      });
      expect(prisma.knowledgeBaseArticleVersion.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ version: 3 }),
        }),
      );
    });
  });

  describe("deleteArticle", () => {
    it("soft-deletes an article", async () => {
      (prisma.knowledgeBaseArticle.findFirst as any).mockResolvedValue({
        id: "art-1",
      });
      (prisma.knowledgeBaseArticle.update as any).mockResolvedValue({
        id: "art-1",
        deletedAt: new Date(),
      });
      const result = await service.deleteArticle(TENANT, "art-1");
      expect(result.deletedAt).toBeDefined();
    });
  });

  describe("recordFeedback", () => {
    it("increments helpfulCount when helpful is true", async () => {
      (prisma.knowledgeBaseArticle.findFirst as any).mockResolvedValue({
        id: "art-1",
      });
      (prisma.knowledgeBaseArticle.update as any).mockResolvedValue({});
      await service.recordFeedback(TENANT, "art-1", true);
      expect(prisma.knowledgeBaseArticle.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { helpfulCount: { increment: 1 } } }),
      );
    });

    it("increments notHelpfulCount when helpful is false", async () => {
      (prisma.knowledgeBaseArticle.findFirst as any).mockResolvedValue({
        id: "art-1",
      });
      (prisma.knowledgeBaseArticle.update as any).mockResolvedValue({});
      await service.recordFeedback(TENANT, "art-1", false);
      expect(prisma.knowledgeBaseArticle.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { notHelpfulCount: { increment: 1 } },
        }),
      );
    });
  });

  describe("searchArticles", () => {
    it("searches published articles by title, content, or excerpt", async () => {
      (prisma.knowledgeBaseArticle.findMany as any).mockResolvedValue([]);
      await service.searchArticles(TENANT, "guide");
      expect(prisma.knowledgeBaseArticle.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: "PUBLISHED",
            OR: expect.arrayContaining([
              expect.objectContaining({
                title: { contains: "guide", mode: "insensitive" },
              }),
            ]),
          }),
        }),
      );
    });

    it("filters by isInternal when provided", async () => {
      (prisma.knowledgeBaseArticle.findMany as any).mockResolvedValue([]);
      await service.searchArticles(TENANT, "guide", true);
      expect(prisma.knowledgeBaseArticle.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isInternal: true }),
        }),
      );
    });
  });

  describe("getStats", () => {
    it("returns aggregated article statistics", async () => {
      (prisma.knowledgeBaseArticle.count as any)
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(60)
        .mockResolvedValueOnce(30)
        .mockResolvedValueOnce(10);
      (prisma.knowledgeBaseArticle.aggregate as any).mockResolvedValue({
        _sum: { viewCount: 5000, helpfulCount: 200, notHelpfulCount: 50 },
      });

      const stats = await service.getStats(TENANT);
      expect(stats.totalArticles).toBe(100);
      expect(stats.publishedCount).toBe(60);
      expect(stats.totalViews).toBe(5000);
      expect(stats.helpfulRate).toBeCloseTo(80, 0);
    });

    it("returns null helpfulRate when no feedback exists", async () => {
      (prisma.knowledgeBaseArticle.count as any).mockResolvedValue(0);
      (prisma.knowledgeBaseArticle.aggregate as any).mockResolvedValue({
        _sum: { viewCount: 0, helpfulCount: 0, notHelpfulCount: 0 },
      });
      const stats = await service.getStats(TENANT);
      expect(stats.helpfulRate).toBeNull();
    });
  });
});
