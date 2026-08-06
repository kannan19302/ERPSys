import { describe, it, expect, vi, beforeEach } from "vitest";
import { CommunicationKnowledgeService } from "../services/communication-knowledge.service";

vi.mock("@unerp/database", () => ({
  prisma: {
    knowledgeArticleRating: {
      findUnique: vi.fn().mockResolvedValue(null),
      update: vi.fn(),
      create: vi.fn(),
      count: vi.fn().mockResolvedValue(0),
      aggregate: vi.fn().mockResolvedValue({
        _avg: {},
        _sum: {},
        _count: 0,
        _min: {},
        _max: {},
      }),
    },
    knowledgeArticle: {
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn().mockResolvedValue(0),
      findUnique: vi.fn().mockResolvedValue(null),
      aggregate: vi.fn().mockResolvedValue({
        _avg: {},
        _sum: {},
        _count: 0,
        _min: {},
        _max: {},
      }),
    },
    knowledgeArticleVersion: {
      findMany: vi.fn().mockResolvedValue([]),
      create: vi.fn(),
      findFirst: vi.fn().mockResolvedValue(null),
      findUnique: vi.fn().mockResolvedValue(null),
    },
    knowledgeCategory: {
      findMany: vi.fn().mockResolvedValue([]),
      create: vi.fn(),
      findFirst: vi.fn().mockResolvedValue(null),
      delete: vi.fn(),
      count: vi.fn().mockResolvedValue(0),
    },
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
      "Knowledge article not found",
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
    vi.mocked(prisma.knowledgeArticleRating.create).mockResolvedValue({
      rating: 5,
    } as never);
    vi.mocked(prisma.knowledgeArticleRating.aggregate).mockResolvedValue({
      _avg: { rating: 4.5 },
    } as never);
    vi.mocked(prisma.knowledgeArticle.update).mockResolvedValue({} as never);
    const res = await svc.rateArticle("t1", "a1", "u1", { rating: 5 });
    expect(res.rating).toBe(5);
    // KnowledgeArticle has no `avgRating` column — the average is derived from
    // the `ratings` relation on read, so nothing is written back to the article.
    expect(prisma.knowledgeArticle.update).not.toHaveBeenCalled();
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
    // The service returns `categoryCount`; `totalCategories` never existed.
    expect(res.categoryCount).toBe(3);
  });
});
