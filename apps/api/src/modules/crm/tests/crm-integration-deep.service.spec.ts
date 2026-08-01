import { describe, it, expect, vi, beforeEach } from "vitest";
import { CrmIntegrationDeepService } from "../crm-integration-deep.service";
import { NotFoundException, BadRequestException } from "@nestjs/common";

vi.mock("@unerp/database", () => ({
  prisma: {
    crmWebhookConfig: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    crmWebhookDeliveryLog: {
      findMany: vi.fn(),
      create: vi.fn(),
      count: vi.fn(),
    },
    crmCalendarConnection: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    crmSlackConnection: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    crmEventDeliveryLog: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { prisma } from "@unerp/database";
const TENANT = "tenant-1";
const ORG = "org-1";

describe("CrmIntegrationDeepService", () => {
  let service: CrmIntegrationDeepService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CrmIntegrationDeepService();
  });

  describe("getWebhookConfigs", () => {
    it("returns webhook configs", async () => {
      (prisma.crmWebhookConfig.findMany as any).mockResolvedValue([
        { id: "wh-1", name: "Test Webhook", enabled: true },
      ]);
      const r = await service.getWebhookConfigs(TENANT);
      expect(r).toHaveLength(1);
    });
  });

  describe("createWebhookConfig", () => {
    it("creates a webhook config", async () => {
      (prisma.crmWebhookConfig.create as any).mockResolvedValue({
        id: "wh-new",
        name: "New Webhook",
        url: "https://example.com",
        events: ["deal.won"],
        enabled: true,
      });
      const dto = {
        name: "New Webhook",
        url: "https://example.com",
        events: ["deal.won"],
      };
      const r = await service.createWebhookConfig(TENANT, ORG, dto);
      expect(r.id).toBe("wh-new");
    });
  });

  describe("getWebhookConfig", () => {
    it("throws NotFoundException when not found", async () => {
      (prisma.crmWebhookConfig.findFirst as any).mockResolvedValue(null);
      await expect(service.getWebhookConfig(TENANT, "x")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("updateWebhookConfig", () => {
    it("throws NotFound when missing", async () => {
      (prisma.crmWebhookConfig.findFirst as any).mockResolvedValue(null);
      await expect(
        service.updateWebhookConfig(TENANT, "x", { name: "New" }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("deleteWebhookConfig", () => {
    it("soft-deletes", async () => {
      (prisma.crmWebhookConfig.findFirst as any).mockResolvedValue({
        id: "wh-1",
      });
      (prisma.crmWebhookConfig.update as any).mockResolvedValue({
        id: "wh-1",
        deletedAt: new Date(),
      });
      const r = await service.deleteWebhookConfig(TENANT, "wh-1");
      expect(r.deletedAt).toBeDefined();
    });
  });

  describe("getWebhookLogs", () => {
    it("throws NotFound when config missing", async () => {
      (prisma.crmWebhookConfig.findFirst as any).mockResolvedValue(null);
      await expect(service.getWebhookLogs(TENANT, "wh-x")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("returns delivery logs", async () => {
      (prisma.crmWebhookConfig.findFirst as any).mockResolvedValue({
        id: "wh-1",
      });
      (prisma.crmWebhookDeliveryLog.findMany as any).mockResolvedValue([
        { id: "log-1", status: "SUCCESS" },
      ]);
      const r = await service.getWebhookLogs(TENANT, "wh-1");
      expect(r).toHaveLength(1);
    });
  });

  describe("getWebhookDeliveryStats", () => {
    it("returns aggregated stats", async () => {
      (prisma.crmWebhookConfig.findMany as any).mockResolvedValue([
        { id: "wh-1", name: "WH1" },
      ]);
      (prisma.crmWebhookDeliveryLog.count as any)
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(2)
        .mockResolvedValueOnce(1);
      const r = await service.getWebhookDeliveryStats(TENANT);
      expect(r.totalWebhooks).toBe(1);
      expect(r.success).toBe(10);
      expect(r.failed).toBe(2);
      expect(r.pending).toBe(1);
    });
  });

  describe("testWebhook", () => {
    it("queues a test event", async () => {
      (prisma.crmWebhookConfig.findFirst as any).mockResolvedValue({
        id: "wh-1",
        name: "Test",
        url: "https://example.com",
        events: ["test"],
      });
      (prisma.crmWebhookDeliveryLog.create as any).mockResolvedValue({
        id: "log-1",
      });
      const r = await service.testWebhook(TENANT, "wh-1");
      expect(r.logId).toBe("log-1");
      expect(r.payload.message).toContain("test");
    });
  });

  describe("getCalendarConnections", () => {
    it("returns calendar connections", async () => {
      (prisma.crmCalendarConnection.findMany as any).mockResolvedValue([
        { id: "cal-1", provider: "GOOGLE" },
      ]);
      const r = await service.getCalendarConnections(TENANT);
      expect(r).toHaveLength(1);
    });
  });

  describe("createCalendarConnection", () => {
    it("creates a calendar connection", async () => {
      (prisma.crmCalendarConnection.create as any).mockResolvedValue({
        id: "cal-new",
        name: "My Calendar",
        provider: "GOOGLE",
      });
      const dto = { name: "My Calendar", provider: "GOOGLE" as const };
      const r = await service.createCalendarConnection(TENANT, ORG, dto);
      expect(r.id).toBe("cal-new");
    });
  });

  describe("syncCalendar", () => {
    it("triggers sync", async () => {
      (prisma.crmCalendarConnection.findFirst as any).mockResolvedValue({
        id: "cal-1",
        name: "Cal",
      });
      (prisma.crmCalendarConnection.update as any).mockResolvedValue({
        id: "cal-1",
        lastSyncAt: new Date(),
      });
      const r = await service.syncCalendar(TENANT, "cal-1");
      expect(r.lastSyncAt).toBeDefined();
    });
  });

  describe("getSlackConnections", () => {
    it("returns slack connections", async () => {
      (prisma.crmSlackConnection.findMany as any).mockResolvedValue([
        { id: "sl-1", workspaceName: "WS" },
      ]);
      const r = await service.getSlackConnections(TENANT);
      expect(r).toHaveLength(1);
    });
  });

  describe("sendSlackNotification", () => {
    it("queues a notification", async () => {
      (prisma.crmSlackConnection.findFirst as any).mockResolvedValue({
        id: "sl-1",
      });
      (prisma.crmEventDeliveryLog.create as any).mockResolvedValue({
        id: "evt-1",
      });
      const r = await service.sendSlackNotification(
        TENANT,
        "sl-1",
        "#general",
        "Hello",
      );
      expect(r.logId).toBe("evt-1");
    });
  });

  describe("getIntegrationDashboard", () => {
    it("returns aggregated integration status", async () => {
      (prisma.crmWebhookConfig.findMany as any).mockResolvedValue([
        { id: "wh-1", name: "WH", enabled: true },
      ]);
      (prisma.crmCalendarConnection.findMany as any).mockResolvedValue([
        { id: "cal-1", name: "Cal", provider: "GOOGLE", syncEnabled: true },
      ]);
      (prisma.crmSlackConnection.findMany as any).mockResolvedValue([
        { id: "sl-1", name: "Slack", enabled: true },
      ]);
      (prisma.crmWebhookDeliveryLog.count as any).mockResolvedValue(5);
      (prisma.crmEventDeliveryLog.count as any).mockResolvedValue(10);
      const d = await service.getIntegrationDashboard(TENANT);
      expect(d.webhooks.total).toBe(1);
      expect(d.calendar.total).toBe(1);
      expect(d.slack.total).toBe(1);
      expect(d.totalEventLogs).toBe(10);
    });
  });

  describe("getEventDeliveryLogs", () => {
    it("returns event logs", async () => {
      (prisma.crmEventDeliveryLog.findMany as any).mockResolvedValue([
        { id: "evt-1", status: "SENT" },
      ]);
      const r = await service.getEventDeliveryLogs(TENANT);
      expect(r).toHaveLength(1);
    });

    it("filters by eventType and status", async () => {
      (prisma.crmEventDeliveryLog.findMany as any).mockResolvedValue([]);
      await service.getEventDeliveryLogs(
        TENANT,
        "slack.notification",
        "FAILED",
      );
      const args = (prisma.crmEventDeliveryLog.findMany as any).mock
        .calls[0][0];
      expect(args.where.eventType).toBe("slack.notification");
      expect(args.where.status).toBe("FAILED");
    });
  });

  describe("getEventDeliveryStats", () => {
    it("returns counts", async () => {
      (prisma.crmEventDeliveryLog.count as any)
        .mockResolvedValueOnce(20)
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(2);
      const r = await service.getEventDeliveryStats(TENANT);
      expect(r.sent).toBe(20);
      expect(r.failed).toBe(3);
      expect(r.pending).toBe(2);
    });
  });

  describe("retryFailedDelivery", () => {
    it("throws NotFound when log missing", async () => {
      (prisma.crmEventDeliveryLog.findFirst as any).mockResolvedValue(null);
      await expect(service.retryFailedDelivery(TENANT, "x")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("throws when not FAILED", async () => {
      (prisma.crmEventDeliveryLog.findFirst as any).mockResolvedValue({
        id: "evt-1",
        status: "SENT",
        retryCount: 0,
      });
      await expect(
        service.retryFailedDelivery(TENANT, "evt-1"),
      ).rejects.toThrow(BadRequestException);
    });

    it("retries a failed delivery", async () => {
      (prisma.crmEventDeliveryLog.findFirst as any).mockResolvedValue({
        id: "evt-1",
        status: "FAILED",
        retryCount: 0,
      });
      (prisma.crmEventDeliveryLog.update as any).mockResolvedValue({
        id: "evt-1",
        status: "PENDING",
        retryCount: 1,
      });
      const r = await service.retryFailedDelivery(TENANT, "evt-1");
      expect(r.status).toBe("PENDING");
      expect(r.retryCount).toBe(1);
    });
  });
});
