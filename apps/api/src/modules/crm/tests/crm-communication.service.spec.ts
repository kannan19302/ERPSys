import { describe, it, expect, vi, beforeEach } from "vitest";
import { CrmCommunicationService } from "../crm-communication.service";
import { NotFoundException, BadRequestException } from "@nestjs/common";

vi.mock("@unerp/database", () => ({
  prisma: {
    communicationChannel: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    communicationTemplate: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    communicationLog: {
      findMany: vi.fn(),
      create: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
    },
  },
}));

import { prisma } from "@unerp/database";

const TENANT = "tenant-1";
const ORG = "org-1";

describe("CrmCommunicationService", () => {
  let service: CrmCommunicationService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CrmCommunicationService();
  });

  describe("getChannels", () => {
    it("returns active channels", async () => {
      (prisma.communicationChannel.findMany as any).mockResolvedValue([
        { id: "ch-1", name: "Email", channelType: "EMAIL" },
      ]);
      const results = await service.getChannels(TENANT);
      expect(results).toHaveLength(1);
    });
  });

  describe("getChannel", () => {
    it("throws NotFoundException when channel not found", async () => {
      (prisma.communicationChannel.findFirst as any).mockResolvedValue(null);
      await expect(service.getChannel(TENANT, "x")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("returns channel with templates and recent logs", async () => {
      (prisma.communicationChannel.findFirst as any).mockResolvedValue({
        id: "ch-1",
        name: "Email",
        templates: [],
        logs: [],
      });
      const result = await service.getChannel(TENANT, "ch-1");
      expect(result.templates).toBeDefined();
      expect(result.logs).toBeDefined();
    });
  });

  describe("createChannel", () => {
    it("creates a communication channel", async () => {
      const dto = {
        name: "WhatsApp Biz",
        channelType: "WHATSAPP" as const,
        config: {},
        isActive: true,
      };
      (prisma.communicationChannel.create as any).mockResolvedValue({
        id: "ch-new",
        ...dto,
      });
      const result = await service.createChannel(TENANT, ORG, dto);
      expect(result.name).toBe("WhatsApp Biz");
    });
  });

  describe("deleteChannel", () => {
    it("throws BadRequestException when channel has templates", async () => {
      (prisma.communicationChannel.findFirst as any).mockResolvedValue({
        id: "ch-1",
      });
      (prisma.communicationTemplate.count as any).mockResolvedValue(2);
      await expect(service.deleteChannel(TENANT, "ch-1")).rejects.toThrow(
        BadRequestException,
      );
    });

    it("soft-deletes channel with no templates", async () => {
      (prisma.communicationChannel.findFirst as any).mockResolvedValue({
        id: "ch-1",
      });
      (prisma.communicationTemplate.count as any).mockResolvedValue(0);
      (prisma.communicationChannel.update as any).mockResolvedValue({
        id: "ch-1",
        deletedAt: new Date(),
      });
      const result = await service.deleteChannel(TENANT, "ch-1");
      expect(result.deletedAt).toBeDefined();
    });
  });

  describe("getTemplates", () => {
    it("returns templates filtered by channelId and category", async () => {
      (prisma.communicationTemplate.findMany as any).mockResolvedValue([
        {
          id: "t-1",
          name: "Welcome",
          channel: { id: "ch-1", name: "Email", channelType: "EMAIL" },
        },
      ]);
      const results = await service.getTemplates(TENANT, "ch-1", "GENERAL");
      expect(results).toHaveLength(1);
      expect(prisma.communicationTemplate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            channelId: "ch-1",
            category: "GENERAL",
          }),
        }),
      );
    });
  });

  describe("createTemplate", () => {
    it("throws BadRequestException when channel not found", async () => {
      (prisma.communicationChannel.findFirst as any).mockResolvedValue(null);
      const dto = {
        channelId: "ch-x",
        name: "Test",
        body: "Hi",
        variables: [],
        category: "GENERAL" as const,
        isActive: true,
      };
      await expect(service.createTemplate(TENANT, ORG, dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it("creates template when channel exists", async () => {
      (prisma.communicationChannel.findFirst as any).mockResolvedValue({
        id: "ch-1",
      });
      const dto = {
        channelId: "ch-1",
        name: "Welcome Email",
        body: "Hello {{name}}",
        variables: ["name"],
        category: "GENERAL" as const,
        isActive: true,
      };
      (prisma.communicationTemplate.create as any).mockResolvedValue({
        id: "t-new",
        ...dto,
        channel: { id: "ch-1", name: "Email", channelType: "EMAIL" },
      });
      const result = await service.createTemplate(TENANT, ORG, dto);
      expect(result.id).toBe("t-new");
    });
  });

  describe("sendCommunication", () => {
    it("throws BadRequestException when channel is inactive or not found", async () => {
      (prisma.communicationChannel.findFirst as any).mockResolvedValue(null);
      await expect(
        service.sendCommunication(TENANT, ORG, "ch-1", "t-1", "a@b.com"),
      ).rejects.toThrow(BadRequestException);
    });

    it("throws BadRequestException when template is inactive", async () => {
      (prisma.communicationChannel.findFirst as any).mockResolvedValue({
        id: "ch-1",
        isActive: true,
      });
      (prisma.communicationTemplate.findFirst as any).mockResolvedValue(null);
      await expect(
        service.sendCommunication(TENANT, ORG, "ch-1", "t-1", "a@b.com"),
      ).rejects.toThrow(BadRequestException);
    });

    it("creates a communication log entry", async () => {
      (prisma.communicationChannel.findFirst as any).mockResolvedValue({
        id: "ch-1",
        isActive: true,
      });
      (prisma.communicationTemplate.findFirst as any).mockResolvedValue({
        id: "t-1",
        subject: "Welcome",
        body: "Hello!",
      });
      (prisma.communicationLog.create as any).mockResolvedValue({
        id: "log-1",
        status: "SENT",
      });
      const result = await service.sendCommunication(
        TENANT,
        ORG,
        "ch-1",
        "t-1",
        "a@b.com",
        "lead",
        "lead-1",
      );
      expect(prisma.communicationLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            recipient: "a@b.com",
            entityType: "lead",
            entityId: "lead-1",
            status: "SENT",
          }),
        }),
      );
      expect(result.status).toBe("SENT");
    });
  });

  describe("getLogs", () => {
    it("returns logs filtered by channel, entityType, entityId", async () => {
      (prisma.communicationLog.findMany as any).mockResolvedValue([
        {
          id: "log-1",
          channel: { id: "ch-1", name: "E", channelType: "EMAIL" },
        },
      ]);
      const results = await service.getLogs(TENANT, "ch-1", "lead", "lead-1");
      expect(results).toHaveLength(1);
    });
  });

  describe("getChannelStats", () => {
    it("returns channel counts and delivery stats", async () => {
      (prisma.communicationChannel.count as any).mockResolvedValue(3);
      (prisma.communicationLog.count as any).mockResolvedValueOnce(100);
      (prisma.communicationLog.count as any).mockResolvedValueOnce(80);
      (prisma.communicationLog.count as any).mockResolvedValueOnce(10);
      (prisma.communicationLog.groupBy as any).mockResolvedValue([
        { channelId: "ch-1", _count: 60 },
        { channelId: "ch-2", _count: 40 },
      ]);
      const stats = await service.getChannelStats(TENANT);
      expect(stats.channels).toBe(3);
      expect(stats.totalSent).toBe(100);
      expect(stats.totalDelivered).toBe(80);
      expect(stats.totalFailed).toBe(10);
      expect(stats.byChannel).toHaveLength(2);
    });
  });
});
