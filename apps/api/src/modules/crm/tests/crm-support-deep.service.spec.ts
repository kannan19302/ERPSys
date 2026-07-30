// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from "vitest";
import { CrmSupportDeepService } from "../crm-support-deep.service";
import { NotFoundException, BadRequestException } from "@nestjs/common";

vi.mock("@unerp/database", () => ({
  prisma: {
    helpCenterCategory: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    helpCenterArticle: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    ticketMacro: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    caseEscalation: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    csatSurvey: { findMany: vi.fn(), create: vi.fn(), count: vi.fn() },
    liveChatSession: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    agentPerformance: { findMany: vi.fn() },
    case: { findFirst: vi.fn(), update: vi.fn(), count: vi.fn() },
    caseComment: { create: vi.fn() },
    user: { findFirst: vi.fn(), findMany: vi.fn() },
  },
}));

import { prisma } from "@unerp/database";

const TENANT = "tenant-1";

describe("CrmSupportDeepService", () => {
  let service: CrmSupportDeepService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CrmSupportDeepService();
  });

  describe("HelpCenter Categories", () => {
    it("getHelpCenterCategories returns categories sorted by sortOrder", async () => {
      (prisma.helpCenterCategory.findMany as any).mockResolvedValue([
        { id: "cat-1", name: "Billing", sortOrder: 0, _count: { articles: 3 } },
      ]);
      const results = await service.getHelpCenterCategories(TENANT);
      expect(prisma.helpCenterCategory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { tenantId: TENANT } }),
      );
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe("Billing");
    });

    it("createCategory creates a new category", async () => {
      const dto = { name: "FAQ", slug: "faq", description: "Freq asked" };
      (prisma.helpCenterCategory.create as any).mockResolvedValue({
        id: "cat-new",
        ...dto,
      });
      const result = await service.createCategory(TENANT, dto);
      expect(prisma.helpCenterCategory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ tenantId: TENANT, name: "FAQ" }),
        }),
      );
      expect(result.id).toBe("cat-new");
    });

    it("updateCategory throws NotFoundException when missing", async () => {
      (prisma.helpCenterCategory.findFirst as any).mockResolvedValue(null);
      await expect(
        service.updateCategory(TENANT, "x", { name: "New" }),
      ).rejects.toThrow(NotFoundException);
    });

    it("deleteCategory throws when it has articles", async () => {
      (prisma.helpCenterCategory.findFirst as any).mockResolvedValue({
        id: "cat-1",
      });
      (prisma.helpCenterArticle.count as any).mockResolvedValue(2);
      await expect(service.deleteCategory(TENANT, "cat-1")).rejects.toThrow(
        BadRequestException,
      );
    });

    it("deleteCategory deletes when no articles", async () => {
      (prisma.helpCenterCategory.findFirst as any).mockResolvedValue({
        id: "cat-1",
      });
      (prisma.helpCenterArticle.count as any).mockResolvedValue(0);
      (prisma.helpCenterCategory.delete as any).mockResolvedValue({
        id: "cat-1",
      });
      const result = await service.deleteCategory(TENANT, "cat-1");
      expect(result.id).toBe("cat-1");
    });
  });

  describe("HelpCenter Articles", () => {
    it("getHelpCenterArticles returns paginated results", async () => {
      (prisma.helpCenterArticle.findMany as any).mockResolvedValue([
        {
          id: "art-1",
          title: "Guide",
          category: { id: "cat-1", name: "Guide", slug: "guide" },
        },
      ]);
      (prisma.helpCenterArticle.count as any).mockResolvedValue(1);
      const result = await service.getHelpCenterArticles(TENANT, {
        page: 1,
        limit: 10,
      });
      expect(result.data).toHaveLength(1);
      expect(result.totalCount).toBe(1);
    });

    it("createArticle sets publishedAt for PUBLISHED status", async () => {
      const dto = {
        title: "New",
        slug: "new",
        content: "Body",
        status: "PUBLISHED",
      };
      (prisma.helpCenterArticle.create as any).mockResolvedValue({
        id: "art-1",
        ...dto,
        category: null,
      });
      const result = await service.createArticle(TENANT, dto);
      expect(prisma.helpCenterArticle.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ publishedAt: expect.any(Date) }),
        }),
      );
      expect(result.id).toBe("art-1");
    });

    it("getHelpCenterArticleBySlug returns published article", async () => {
      (prisma.helpCenterArticle.findFirst as any).mockResolvedValue({
        id: "art-1",
        title: "Guide",
        slug: "guide",
      });
      const result = await service.getHelpCenterArticleBySlug("guide");
      expect(result.title).toBe("Guide");
    });

    it("recordArticleView increments view count", async () => {
      (prisma.helpCenterArticle.update as any).mockResolvedValue({});
      await service.recordArticleView("art-1");
      expect(prisma.helpCenterArticle.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { viewCount: { increment: 1 } } }),
      );
    });
  });

  describe("Knowledge Base Search", () => {
    it("searches published articles", async () => {
      (prisma.helpCenterArticle.findMany as any).mockResolvedValue([]);
      await service.searchKnowledgeBase(TENANT, "billing");
      expect(prisma.helpCenterArticle.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: "PUBLISHED" }),
        }),
      );
    });
  });

  describe("Ticket Macros", () => {
    it("getTicketMacros returns all for tenant", async () => {
      (prisma.ticketMacro.findMany as any).mockResolvedValue([
        { id: "m-1", name: "Resolve" },
      ]);
      const results = await service.getTicketMacros(TENANT);
      expect(results).toHaveLength(1);
    });

    it("executeMacro performs actions on a case", async () => {
      (prisma.case.findFirst as any).mockResolvedValue({ id: "case-1" });
      (prisma.ticketMacro.findFirst as any).mockResolvedValue({
        id: "m-1",
        name: "Resolve",
        actions: [
          { type: "set_status", value: "RESOLVED" },
          { type: "add_note", value: "Done" },
        ],
      });
      (prisma.case.update as any).mockResolvedValue({});
      (prisma.caseComment.create as any).mockResolvedValue({});
      (prisma.ticketMacro.update as any).mockResolvedValue({});
      const result = await service.executeMacro(TENANT, "case-1", "m-1");
      expect(result.executed).toBe(true);
      expect(result.actions).toHaveLength(2);
    });
  });

  describe("Case Escalations", () => {
    it("getCaseEscalations returns escalations for a case", async () => {
      (prisma.caseEscalation.findMany as any).mockResolvedValue([
        { id: "esc-1", reason: "Urgent" },
      ]);
      const results = await service.getCaseEscalations(TENANT, "case-1");
      expect(results).toHaveLength(1);
    });

    it("createEscalation throws when case not found", async () => {
      (prisma.case.findFirst as any).mockResolvedValue(null);
      await expect(
        service.createEscalation(TENANT, {
          caseId: "x",
          escalatedBy: "u1",
          escalatedTo: "u2",
          reason: "Urgent",
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("CSAT Surveys", () => {
    it("getCsatSummary returns empty stats when no surveys", async () => {
      (prisma.csatSurvey.findMany as any).mockResolvedValue([]);
      const summary = await service.getCsatSummary(TENANT);
      expect(summary.totalResponses).toBe(0);
    });

    it("getCsatSummary computes averages", async () => {
      (prisma.csatSurvey.findMany as any).mockResolvedValue([
        { score: 5 },
        { score: 4 },
        { score: 3 },
      ]);
      const summary = await service.getCsatSummary(TENANT);
      expect(summary.totalResponses).toBe(3);
      expect(summary.averageScore).toBe(4);
    });
  });

  describe("Live Chat", () => {
    it("getLiveChatSessions filters by status", async () => {
      (prisma.liveChatSession.findMany as any).mockResolvedValue([]);
      await service.getLiveChatSessions(TENANT, "ACTIVE");
      expect(prisma.liveChatSession.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId: TENANT, status: "ACTIVE" },
        }),
      );
    });

    it("endLiveChatSession sets status to CLOSED", async () => {
      (prisma.liveChatSession.findFirst as any).mockResolvedValue({
        id: "chat-1",
        startedAt: new Date(),
      });
      (prisma.liveChatSession.update as any).mockResolvedValue({
        status: "CLOSED",
      });
      const result = await service.endLiveChatSession(TENANT, "chat-1");
      expect(prisma.liveChatSession.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: "CLOSED" }),
        }),
      );
    });
  });

  describe("Agent Performance", () => {
    it("getSupportDashboard returns KPIs", async () => {
      const caseCountMock = prisma.case.count as any;
      caseCountMock.mockResolvedValueOnce(10).mockResolvedValueOnce(20);
      (prisma.caseEscalation.count as any).mockResolvedValue(2);
      (prisma.liveChatSession.count as any).mockResolvedValue(3);
      (prisma.csatSurvey.findMany as any).mockResolvedValue([]);
      const dashboard = await service.getSupportDashboard(TENANT);
      expect(dashboard.openCases).toBe(10);
    });
  });
});
