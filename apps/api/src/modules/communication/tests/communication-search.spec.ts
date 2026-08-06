import { describe, it, expect, vi, beforeEach } from "vitest";
import { CommunicationSearchService } from "../services/communication-search.service";

vi.mock("@unerp/database", () => ({
  prisma: {
    helpdeskTicket: { findMany: vi.fn().mockResolvedValue([]) },
    channel: { findMany: vi.fn().mockResolvedValue([]) },
    synonymDictionary: {
      findMany: vi.fn().mockResolvedValue([]),
      create: vi.fn(),
    },
    message: { findMany: vi.fn().mockResolvedValue([]) },
    knowledgeArticle: {
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
    },
    document: { findMany: vi.fn().mockResolvedValue([]) },
    savedSearch: {
      create: vi.fn(),
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn().mockResolvedValue(null),
      delete: vi.fn(),
    },
    searchHistory: {
      create: vi.fn(),
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
      groupBy: vi.fn().mockResolvedValue([]),
    },
    synonymDictionary: {
      findMany: vi.fn().mockResolvedValue([]),
      create: vi.fn(),
    },
  },
}));

describe("CommunicationSearchService", () => {
  let svc: CommunicationSearchService;

  beforeEach(() => {
    svc = new CommunicationSearchService();
    vi.clearAllMocks();
  });

  it("performs full-text search across messages", async () => {
    const { prisma } = await import("@unerp/database");
    vi.mocked(prisma.message.findMany).mockResolvedValue([
      {
        id: "m1",
        content: "test result",
        channel: { name: "general" },
        createdAt: new Date(),
      },
    ] as never);
    vi.mocked(prisma.knowledgeArticle.findMany).mockResolvedValue([] as never);
    vi.mocked(prisma.document.findMany).mockResolvedValue([] as never);
    const res = await svc.fullTextSearch("t1", "u1", "test", {
      scope: "MESSAGES",
      page: 1,
      limit: 20,
    });
    // fullTextSearch returns a paginated envelope, not a bare array.
    expect(res.data).toHaveLength(1);
    expect(res.total).toBe(1);
    expect(res.data[0].type).toBe("message");
  });

  it("saves a search query", async () => {
    const { prisma } = await import("@unerp/database");
    vi.mocked(prisma.savedSearch.create).mockResolvedValue({
      id: "s1",
      name: "Test Search",
    } as never);
    const res = await svc.saveSearchQuery("t1", "u1", {
      name: "Test Search",
      query: "test",
    });
    expect(res.name).toBe("Test Search");
  });

  it("lists saved searches", async () => {
    const { prisma } = await import("@unerp/database");
    vi.mocked(prisma.savedSearch.findMany).mockResolvedValue([
      { id: "s1", name: "Saved" },
    ] as never);
    const res = await svc.getSavedSearches("t1", "u1");
    expect(res).toHaveLength(1);
  });

  it("deletes a saved search with ownership check", async () => {
    const { prisma } = await import("@unerp/database");
    vi.mocked(prisma.savedSearch.findFirst).mockResolvedValue({
      id: "s1",
      userId: "u1",
    } as never);
    vi.mocked(prisma.savedSearch.delete).mockResolvedValue({} as never);
    await svc.deleteSavedSearch("t1", "u1", "s1");
    expect(prisma.savedSearch.delete).toHaveBeenCalledWith({
      where: { id: "s1" },
    });
  });

  it("rejects delete of another user saved search", async () => {
    const { prisma } = await import("@unerp/database");
    vi.mocked(prisma.savedSearch.findFirst).mockResolvedValue({
      id: "s1",
      userId: "other",
    } as never);
    await expect(svc.deleteSavedSearch("t1", "u1", "s1")).rejects.toThrow(
      "Saved search not found",
    );
  });

  it("gets search history", async () => {
    const { prisma } = await import("@unerp/database");
    vi.mocked(prisma.searchHistory.findMany).mockResolvedValue([
      { query: "test", createdAt: new Date() },
    ] as never);
    const res = await svc.getSearchHistory("t1", "u1", 10);
    expect(res).toHaveLength(1);
  });

  it("returns search analytics", async () => {
    const { prisma } = await import("@unerp/database");
    vi.mocked(prisma.searchHistory.findMany).mockResolvedValue([] as never);
    const res = await svc.getSearchAnalytics("t1");
    expect(res.totalSearches).toBe(0);
  });

  it("lists synonyms", async () => {
    const { prisma } = await import("@unerp/database");
    vi.mocked(prisma.synonymDictionary.findMany).mockResolvedValue([
      { term: "bug", synonyms: ["issue", "defect"] },
    ] as never);
    const res = await svc.getSynonyms("t1");
    expect(res).toHaveLength(1);
  });

  it("creates a synonym", async () => {
    const { prisma } = await import("@unerp/database");
    vi.mocked(prisma.synonymDictionary.create).mockResolvedValue({
      id: "syn1",
      term: "bug",
      synonyms: ["issue"],
    } as never);
    const res = await svc.createSynonym("t1", {
      term: "bug",
      synonyms: ["issue"],
    });
    expect(res.term).toBe("bug");
  });
});
