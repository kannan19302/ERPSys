// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from "vitest";
import { CommunicationKnowledgeService } from "../services/communication-knowledge.service";

vi.mock("@unerp/database", () => ({
  prisma: {
    knowledgeArticle: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    knowledgeArticleVersion: { findMany: vi.fn(), create: vi.fn() },
    knowledgeCategory: {
      findMany: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
      delete: vi.fn(),
    },
    knowledgeRating: { create: vi.fn(), aggregate: vi.fn() },
  },
}));

describe("CommunicationKnowledgeService", () => {
  let svc: CommunicationKnowledgeService;

  beforeEach(() => {
    svc = new CommunicationKnowledgeService();
    vi.clearAllMocks();
  });

  it("returns paginated articles", async () => {
    const { prisma } = await import("@unerp/database");
    vi.mocked(prisma.knowledgeArticle.findMany).mockResolvedValue([
      { id: "a1", category: null, ratings: [] },
    ] as never);
    vi.mocked(prisma.knowledgeArticle.count).mockResolvedValue(1);
    const res = await svc.getArticles("t1", { page: 1, limit: 20 });
    expect(res.data).toHaveLength(1);
    expect(res.total).toBe(1);
  });

  it("throws on missing article", async () => {
    const { prisma } = await import("@unerp/database");
    vi.mocked(prisma.knowledgeArticle.findFirst).mockResolvedValue(
      null as never,
    );
    await expect(svc.getArticle("t1", "bad")).rejects.toThrow(
      "Article not found",
    );
  });

  it("creates an article with initial version", async () => {
    const { prisma } = await import("@unerp/database");
    vi.mocked(prisma.knowledgeArticle.create).mockResolvedValue({
      id: "a1",
      title: "How-to",
    } as never);
    vi.mocked(prisma.knowledgeArticleVersion.create).mockResolvedValue(
      {} as never,
    );
    const res = await svc.createArticle("t1", "u1", {
      title: "How-to",
      content: "Steps",
      categoryId: "c1",
    });
    expect(prisma.knowledgeArticleVersion.create).toHaveBeenCalled();
    expect(res.title).toBe("How-to");
  });

  it("publishes an article", async () => {
    const { prisma } = await import("@unerp/database");
    vi.mocked(prisma.knowledgeArticle.findFirst).mockResolvedValue({
      id: "a1",
      tenantId: "t1",
    } as never);
    vi.mocked(prisma.knowledgeArticle.update).mockResolvedValue({
      id: "a1",
      status: "PUBLISHED",
    } as never);
    const res = await svc.publishArticle("t1", "a1");
    expect(res.status).toBe("PUBLISHED");
  });

  it("deletes an article", async () => {
    const { prisma } = await import("@unerp/database");
    vi.mocked(prisma.knowledgeArticle.findFirst).mockResolvedValue({
      id: "a1",
      tenantId: "t1",
    } as never);
    vi.mocked(prisma.knowledgeArticle.delete).mockResolvedValue({} as never);
    await svc.deleteArticle("t1", "a1");
    expect(prisma.knowledgeArticle.delete).toHaveBeenCalledWith({
      where: { id: "a1" },
    });
  });

  it("searches articles", async () => {
    const { prisma } = await import("@unerp/database");
    vi.mocked(prisma.knowledgeArticle.findMany).mockResolvedValue([
      { id: "a1", title: "Test", category: null, ratings: [] },
    ] as never);
    vi.mocked(prisma.knowledgeArticle.count).mockResolvedValue(1);
    const res = await svc.searchArticles("t1", "test", { page: 1, limit: 20 });
    expect(res.data).toHaveLength(1);
  });

  it("returns article versions", async () => {
    const { prisma } = await import("@unerp/database");
    vi.mocked(prisma.knowledgeArticleVersion.findMany).mockResolvedValue([
      { version: 1, title: "v1" },
    ] as never);
    const res = await svc.getArticleVersions("t1", "a1");
    expect(res).toHaveLength(1);
  });

  it("rates an article and updates average", async () => {
    const { prisma } = await import("@unerp/database");
    vi.mocked(prisma.knowledgeArticle.findFirst).mockResolvedValue({
      id: "a1",
      tenantId: "t1",
    } as never);
    vi.mocked(prisma.knowledgeRating.create).mockResolvedValue({
      score: 5,
    } as never);
    vi.mocked(prisma.knowledgeRating.aggregate).mockResolvedValue({
      _avg: { score: 4.5 },
    } as never);
    vi.mocked(prisma.knowledgeArticle.update).mockResolvedValue({} as never);
    const res = await svc.rateArticle("t1", "a1", "u1", { score: 5 });
    expect(res.score).toBe(5);
    expect(prisma.knowledgeArticle.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ avgRating: 4.5 }),
      }),
    );
  });

  it("creates a category", async () => {
    const { prisma } = await import("@unerp/database");
    vi.mocked(prisma.knowledgeCategory.create).mockResolvedValue({
      id: "cat1",
      name: "Guides",
    } as never);
    const res = await svc.createCategory("t1", { name: "Guides" });
    expect(res.name).toBe("Guides");
  });

  it("returns knowledge dashboard stats", async () => {
    const { prisma } = await import("@unerp/database");
    vi.mocked(prisma.knowledgeArticle.count).mockResolvedValue(10);
    vi.mocked(prisma.knowledgeCategory.count).mockResolvedValue(3);
    vi.mocked(prisma.knowledgeArticle.findMany).mockResolvedValue([] as never);
    const res = await svc.getKnowledgeDashboard("t1");
    expect(res.totalArticles).toBe(10);
    expect(res.totalCategories).toBe(3);
  });
});
