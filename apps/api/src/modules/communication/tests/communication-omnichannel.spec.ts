// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from "vitest";
import { CommunicationOmnichannelService } from "../services/communication-omnichannel.service";

vi.mock("@unerp/database", () => ({
  prisma: {
    omnichannelConversation: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
      groupBy: vi.fn(),
    },
    conversationMessage: { create: vi.fn(), count: vi.fn() },
    channelIntegration: {
      findMany: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    routingRule: { findMany: vi.fn(), create: vi.fn() },
  },
}));

describe("CommunicationOmnichannelService", () => {
  let svc: CommunicationOmnichannelService;

  beforeEach(() => {
    svc = new CommunicationOmnichannelService();
    vi.clearAllMocks();
  });

  it("returns paginated unified inbox", async () => {
    const { prisma } = await import("@unerp/database");
    vi.mocked(prisma.omnichannelConversation.findMany).mockResolvedValue([
      { id: "c1", messages: [] },
    ] as never);
    vi.mocked(prisma.omnichannelConversation.count).mockResolvedValue(1);
    const res = await svc.getUnifiedInbox("t1", "u1", { page: 1, limit: 20 });
    expect(res.data).toHaveLength(1);
    expect(res.total).toBe(1);
    expect(res.page).toBe(1);
  });

  it("throws on missing conversation", async () => {
    const { prisma } = await import("@unerp/database");
    vi.mocked(prisma.omnichannelConversation.findFirst).mockResolvedValue(
      null as never,
    );
    await expect(svc.getConversation("t1", "bad-id")).rejects.toThrow(
      "Conversation not found",
    );
  });

  it("sends a message and updates lastMessageAt", async () => {
    const { prisma } = await import("@unerp/database");
    vi.mocked(prisma.omnichannelConversation.findFirst).mockResolvedValue({
      id: "c1",
      tenantId: "t1",
    } as never);
    vi.mocked(prisma.conversationMessage.create).mockResolvedValue({
      id: "msg1",
      content: "Hi",
    } as never);
    vi.mocked(prisma.omnichannelConversation.update).mockResolvedValue(
      {} as never,
    );
    const res = await svc.sendMessage("t1", "c1", {
      content: "Hi",
      authorId: "u1",
    });
    expect(prisma.omnichannelConversation.update).toHaveBeenCalledWith({
      where: { id: "c1" },
      data: { lastMessageAt: expect.any(Date) },
    });
    expect(res.content).toBe("Hi");
  });

  it("assigns a conversation", async () => {
    const { prisma } = await import("@unerp/database");
    vi.mocked(prisma.omnichannelConversation.findFirst).mockResolvedValue({
      id: "c1",
      tenantId: "t1",
    } as never);
    vi.mocked(prisma.omnichannelConversation.update).mockResolvedValue({
      id: "c1",
      assignedTo: "agent1",
    } as never);
    const res = await svc.assignConversation("t1", "c1", "agent1");
    expect(res.assignedTo).toBe("agent1");
  });

  it("closes a conversation", async () => {
    const { prisma } = await import("@unerp/database");
    vi.mocked(prisma.omnichannelConversation.findFirst).mockResolvedValue({
      id: "c1",
      tenantId: "t1",
    } as never);
    vi.mocked(prisma.omnichannelConversation.update).mockResolvedValue({
      id: "c1",
      status: "CLOSED",
    } as never);
    const res = await svc.closeConversation("t1", "c1");
    expect(res.status).toBe("CLOSED");
  });

  it("merges tags on smart tag", async () => {
    const { prisma } = await import("@unerp/database");
    vi.mocked(prisma.omnichannelConversation.findFirst).mockResolvedValue({
      id: "c1",
      tags: ["bug"],
      tenantId: "t1",
    } as never);
    vi.mocked(prisma.omnichannelConversation.update).mockResolvedValue(
      {} as never,
    );
    await svc.smartTagMessage("t1", "c1", ["urgent", "bug"]);
    expect(prisma.omnichannelConversation.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ tags: ["bug", "urgent"] }),
      }),
    );
  });

  it("auto-routes using the highest-priority matching rule", async () => {
    const { prisma } = await import("@unerp/database");
    vi.mocked(prisma.omnichannelConversation.findFirst).mockResolvedValue({
      id: "c1",
      tenantId: "t1",
      platform: "email",
      assignedTo: null,
    } as never);
    vi.mocked(prisma.routingRule.findMany).mockResolvedValue([
      {
        id: "r1",
        priority: 1,
        conditions: [{ field: "platform", operator: "equals", value: "email" }],
        action: { type: "ASSIGN_TO_AGENT", value: "bot1" },
      },
    ] as never);
    vi.mocked(prisma.omnichannelConversation.update).mockResolvedValue(
      {} as never,
    );
    await svc.autoRouteMessage("t1", "c1");
    expect(prisma.omnichannelConversation.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ assignedTo: "bot1" }),
      }),
    );
  });

  it("returns integrations", async () => {
    const { prisma } = await import("@unerp/database");
    vi.mocked(prisma.channelIntegration.findMany).mockResolvedValue([
      { id: "i1", platform: "slack" },
    ] as never);
    const res = await svc.getIntegrations("t1");
    expect(res).toHaveLength(1);
  });

  it("returns routing rules sorted by priority", async () => {
    const { prisma } = await import("@unerp/database");
    vi.mocked(prisma.routingRule.findMany).mockResolvedValue([
      { id: "r1", priority: 1 },
    ] as never);
    const res = await svc.getRoutingRules("t1");
    expect(res).toHaveLength(1);
  });

  it("returns omnichannel dashboard metrics", async () => {
    const { prisma } = await import("@unerp/database");
    vi.mocked(prisma.omnichannelConversation.count).mockResolvedValue(5);
    vi.mocked(prisma.conversationMessage.count).mockResolvedValue(100);
    vi.mocked(prisma.omnichannelConversation.groupBy).mockResolvedValue([
      { platform: "email", _count: 3 },
    ] as never);
    const res = await svc.getOmnichannelDashboard("t1");
    expect(res.activeConversations).toBe(5);
    expect(res.totalMessages).toBe(100);
    expect(res.conversationsByPlatform).toEqual([
      { platform: "email", _count: 3 },
    ]);
  });
});
