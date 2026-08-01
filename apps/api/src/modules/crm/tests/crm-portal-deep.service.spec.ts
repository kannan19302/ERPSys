import { describe, it, expect, vi, beforeEach } from "vitest";
import { CrmPortalDeepService } from "../crm-portal-deep.service";
import { NotFoundException } from "@nestjs/common";

vi.mock("@unerp/database", () => ({
  prisma: {
    portalCustomization: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    portalDocument: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    portalNotification: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    portalForumTopic: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    portalForumReply: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    case: { count: vi.fn() },
    invoice: { count: vi.fn() },
    customer: { count: vi.fn() },
  },
}));

import { prisma } from "@unerp/database";

const TENANT = "tenant-1";
const CUSTOMER = "cust-1";
const USER = "user-1";

describe("CrmPortalDeepService", () => {
  let service: CrmPortalDeepService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CrmPortalDeepService();
  });

  describe("Portal Customization", () => {
    it("getPortalCustomization returns defaults when none exists", async () => {
      (prisma.portalCustomization.findFirst as any).mockResolvedValue(null);
      const result = await service.getPortalCustomization(TENANT);
      expect(result.primaryColor).toBe("#2563eb");
      expect(result.headerTitle).toBe("Customer Portal");
    });

    it("getPortalCustomization returns existing customization", async () => {
      (prisma.portalCustomization.findFirst as any).mockResolvedValue({
        id: "pc-1",
        tenantId: TENANT,
        headerTitle: "My Portal",
      });
      const result = await service.getPortalCustomization(TENANT);
      expect(result.headerTitle).toBe("My Portal");
    });

    it("updatePortalCustomization creates if none exists", async () => {
      (prisma.portalCustomization.findFirst as any).mockResolvedValue(null);
      (prisma.portalCustomization.create as any).mockResolvedValue({
        id: "pc-new",
        headerTitle: "Portal",
      });
      const result = await service.updatePortalCustomization(TENANT, {
        headerTitle: "Portal",
      });
      expect(prisma.portalCustomization.create).toHaveBeenCalled();
      expect(result.id).toBe("pc-new");
    });

    it("updatePortalCustomization updates existing", async () => {
      (prisma.portalCustomization.findFirst as any).mockResolvedValue({
        id: "pc-1",
      });
      (prisma.portalCustomization.update as any).mockResolvedValue({
        id: "pc-1",
        headerTitle: "Updated",
      });
      const result = await service.updatePortalCustomization(TENANT, {
        headerTitle: "Updated",
      });
      expect(prisma.portalCustomization.update).toHaveBeenCalled();
      expect(result.headerTitle).toBe("Updated");
    });
  });

  describe("Portal Documents", () => {
    it("getPortalDocuments lists documents for customer", async () => {
      (prisma.portalDocument.findMany as any).mockResolvedValue([
        { id: "doc-1", name: "Invoice.pdf" },
      ]);
      const results = await service.getPortalDocuments(TENANT, CUSTOMER);
      expect(results).toHaveLength(1);
    });

    it("deletePortalDocument throws when not found", async () => {
      (prisma.portalDocument.findFirst as any).mockResolvedValue(null);
      await expect(service.deletePortalDocument(TENANT, "x")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("Portal Notifications", () => {
    it("getPortalNotifications returns notifications for customer", async () => {
      (prisma.portalNotification.findMany as any).mockResolvedValue([
        { id: "n-1", title: "Update" },
      ]);
      const results = await service.getPortalNotifications(TENANT, CUSTOMER);
      expect(results).toHaveLength(1);
    });

    it("markNotificationAsRead throws when not found", async () => {
      (prisma.portalNotification.findFirst as any).mockResolvedValue(null);
      await expect(service.markNotificationAsRead(TENANT, "x")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("markNotificationAsRead sets readAt", async () => {
      (prisma.portalNotification.findFirst as any).mockResolvedValue({
        id: "n-1",
      });
      (prisma.portalNotification.update as any).mockResolvedValue({
        id: "n-1",
        readAt: new Date(),
      });
      const result = await service.markNotificationAsRead(TENANT, "n-1");
      expect(prisma.portalNotification.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ readAt: expect.any(Date) }),
        }),
      );
    });
  });

  describe("Forum Topics", () => {
    it("getForumTopics returns paginated topics", async () => {
      (prisma.portalForumTopic.findMany as any).mockResolvedValue([
        { id: "t-1", title: "How to?", _count: { replies: 2 } },
      ]);
      (prisma.portalForumTopic.count as any).mockResolvedValue(1);
      const result = await service.getForumTopics(TENANT, {
        page: 1,
        limit: 20,
      });
      expect(result.data).toHaveLength(1);
      expect(result.totalCount).toBe(1);
    });

    it("closeForumTopic throws when not found", async () => {
      (prisma.portalForumTopic.findFirst as any).mockResolvedValue(null);
      await expect(service.closeForumTopic(TENANT, "x")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("closeForumTopic sets status to CLOSED", async () => {
      (prisma.portalForumTopic.findFirst as any).mockResolvedValue({
        id: "t-1",
      });
      (prisma.portalForumTopic.update as any).mockResolvedValue({
        id: "t-1",
        status: "CLOSED",
      });
      const result = await service.closeForumTopic(TENANT, "t-1");
      expect(result.status).toBe("CLOSED");
    });
  });

  describe("Forum Replies", () => {
    it("getForumReplies returns replies ordered by createdAt", async () => {
      (prisma.portalForumTopic.findFirst as any).mockResolvedValue({
        id: "t-1",
      });
      (prisma.portalForumReply.findMany as any).mockResolvedValue([
        { id: "r-1", content: "Reply" },
      ]);
      const results = await service.getForumReplies(TENANT, "t-1");
      expect(results).toHaveLength(1);
    });

    it("markReplyAsAnswer sets isAnswer and updates topic status", async () => {
      (prisma.portalForumReply.findFirst as any).mockResolvedValue({
        id: "r-1",
        topicId: "t-1",
      });
      (prisma.portalForumReply.updateMany as any).mockResolvedValue({});
      (prisma.portalForumReply.update as any).mockResolvedValue({
        id: "r-1",
        isAnswer: true,
      });
      (prisma.portalForumTopic.update as any).mockResolvedValue({});
      (prisma.portalForumReply.findFirst as any).mockResolvedValue({
        id: "r-1",
        isAnswer: true,
      });
      const result = await service.markReplyAsAnswer(TENANT, "r-1");
      expect(result.isAnswer).toBe(true);
    });
  });

  describe("Portal Analytics", () => {
    it("getPortalAnalytics returns aggregated stats", async () => {
      (prisma.customer.count as any).mockResolvedValue(10);
      (prisma.portalDocument.count as any).mockResolvedValue(25);
      (prisma.portalForumTopic.count as any).mockResolvedValue(8);
      (prisma.portalForumReply.count as any).mockResolvedValue(30);
      (prisma.portalNotification.count as any).mockResolvedValue(50);
      (prisma.portalForumTopic.findMany as any).mockResolvedValue([]);
      const analytics = await service.getPortalAnalytics(TENANT);
      expect(analytics.totalCustomers).toBe(10);
      expect(analytics.totalDocuments).toBe(25);
      expect(analytics.totalForumTopics).toBe(8);
      expect(analytics.totalNotifications).toBe(50);
    });
  });

  describe("Quick Links", () => {
    it("getPortalQuickLinks returns dashboard summary", async () => {
      (prisma.case.count as any).mockResolvedValue(3);
      (prisma.portalDocument.findMany as any).mockResolvedValue([
        { id: "doc-1", name: "Report" },
      ]);
      (prisma.portalForumTopic.findMany as any).mockResolvedValue([
        { id: "t-1", title: "Q" },
      ]);
      (prisma.invoice.count as any).mockResolvedValue(2);
      const links = await service.getPortalQuickLinks(TENANT, CUSTOMER);
      expect(links.openCases).toBe(3);
      expect(links.recentDocs).toHaveLength(1);
      expect(links.unpaidInvoices).toBe(2);
    });
  });
});
