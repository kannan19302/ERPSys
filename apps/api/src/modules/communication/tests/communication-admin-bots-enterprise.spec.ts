import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { CommunicationAdminService } from "../communication-admin.service";
import { CommunicationBotsService } from "../communication-bots.service";
import { CommunicationEnterpriseService } from "../communication-enterprise.service";

/* â”€â”€ CommunicationAdminService â”€â”€ */
vi.mock("@unerp/database", () => {
  // Identity models (user, role, userSession, ...) are read through
  // `idpPrisma`, not `prisma` â€” this spec predates that split and stubs
  // them under `prisma`. Exporting the same stub object under both names
  // keeps every `vi.mocked(prisma.user.*)` setup pointing at exactly the
  // function the service calls.
  const mocked = {
    prisma: {
      channelModeration: { findFirst: vi.fn(), upsert: vi.fn() },
      channelMember: { findFirst: vi.fn(), findMany: vi.fn() },
      channelTab: {
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        findFirst: vi.fn(),
        delete: vi.fn(),
      },
      channel: { findMany: vi.fn(), findFirst: vi.fn(), count: vi.fn() },
      message: { findMany: vi.fn(), findFirst: vi.fn(), count: vi.fn() },
      messageReaction: { findMany: vi.fn() },
      messageEditHistory: { findMany: vi.fn() },
      user: { findMany: vi.fn() },
      userPresence: { findMany: vi.fn() },
      connectBot: {
        findMany: vi.fn(),
        count: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        upsert: vi.fn(),
      },
      connectMeeting: { findMany: vi.fn(), count: vi.fn(), aggregate: vi.fn() },
      notification: { count: vi.fn(), findMany: vi.fn() },
      emailTemplate: { findMany: vi.fn(), count: vi.fn() },
      // CommunicationAdminService folds precomputed daily snapshots.
      channelAnalytics: { findMany: vi.fn(), upsert: vi.fn() },
      // CommunicationEnterpriseService works over the `chat*` family, which is
      // distinct from the `channel`/`message` models the admin service uses.
      chatRoom: { findMany: vi.fn() },
      chatRoomMember: { count: vi.fn() },
      chatMessage: { findMany: vi.fn() },
      chatChannel: { findMany: vi.fn() },
      chatbotDefinition: { findMany: vi.fn() },
      communicationFileShare: { findMany: vi.fn() },
      videoCallRoom: { findMany: vi.fn() },
      announcement: { findMany: vi.fn() },
      task: { findMany: vi.fn() },
    },
  };
  return { ...mocked, idpPrisma: mocked.prisma };
});

describe("CommunicationAdminService", () => {
  let svc: CommunicationAdminService;

  beforeEach(() => {
    svc = new CommunicationAdminService();
    vi.clearAllMocks();
  });

  it("returns default moderation when none exists", async () => {
    const { prisma } = await import("@unerp/database");
    vi.mocked(prisma.channelModeration.findFirst).mockResolvedValue(
      null as never,
    );
    const res = await svc.getModeration("t1", "c1");
    expect(res).toEqual({
      slowModeSecs: 0,
      whoCanPost: "EVERYONE",
      onlyAdminsCanPin: false,
    });
  });

  it("sets slow mode with valid value", async () => {
    const { prisma } = await import("@unerp/database");
    vi.mocked(prisma.channelMember.findFirst).mockResolvedValue({
      role: "OWNER",
    } as never);
    vi.mocked(prisma.channelModeration.upsert).mockResolvedValue({
      slowModeSecs: 30,
    } as never);
    const res = await svc.setSlowMode("t1", "c1", "u1", 30);
    expect(res.slowModeSecs).toBe(30);
  });

  it("rejects invalid slow mode value", async () => {
    await expect(svc.setSlowMode("t1", "c1", "u1", 45)).rejects.toThrow(
      "Invalid slow mode",
    );
  });

  it("lists channel tabs", async () => {
    const { prisma } = await import("@unerp/database");
    vi.mocked(prisma.channelTab.findMany).mockResolvedValue([
      { id: "tab1", label: "Wiki" },
    ] as never);
    const res = await svc.getTabs("t1", "c1");
    expect(res).toHaveLength(1);
  });

  it("returns pinned messages for a channel", async () => {
    const { prisma } = await import("@unerp/database");
    vi.mocked(prisma.channel.findFirst).mockResolvedValue({
      id: "c1",
      tenantId: "t1",
    } as never);
    vi.mocked(prisma.message.findMany).mockResolvedValue([
      { id: "m1", pinned: true, reactions: [] },
    ] as never);
    const res = await svc.getPinnedMessages("t1", "c1");
    expect(res).toHaveLength(1);
  });

  it("aggregates channel analytics from the daily snapshots", async () => {
    const { prisma } = await import("@unerp/database");
    // getChannelAnalytics reads precomputed `channelAnalytics` snapshots and
    // folds them; it does not count messages live. The old stubs
    // (message.count/findMany, channelMember.findMany) were for a different
    // implementation and left the real query unmocked, and it asserted
    // `res.messageCount` — a field the method returns under `totals`.
    vi.mocked(prisma.channelAnalytics.findMany).mockResolvedValue([
      { messageCount: 4, activeUsers: 3, reactions: 1 },
      { messageCount: 6, activeUsers: 5, reactions: 2 },
    ] as never);

    const res = await svc.getChannelAnalytics("t1", "c1", 30);

    expect(res.snapshots).toHaveLength(2);
    // Messages and reactions sum; active users take the daily peak rather than
    // summing, since the same person active on two days is still one user.
    expect(res.totals).toEqual({
      messageCount: 10,
      activeUsers: 5,
      reactions: 3,
    });
  });
});

/* â”€â”€ CommunicationBotsService â”€â”€ */

describe("CommunicationBotsService", () => {
  let svc: CommunicationBotsService;

  beforeEach(() => {
    svc = new CommunicationBotsService();
    vi.clearAllMocks();
  });

  it("lists bots for a channel", async () => {
    const { prisma } = await import("@unerp/database");
    vi.mocked(prisma.connectBot.findMany).mockResolvedValue([
      { id: "bot1", name: "Helper" },
    ] as never);
    const res = await svc.getBots("t1", "c1");
    expect(res).toHaveLength(1);
  });

  it("creates a bot with a token", async () => {
    const { prisma } = await import("@unerp/database");
    vi.mocked(prisma.channelMember.findFirst).mockResolvedValue({
      role: "OWNER",
    } as never);
    vi.mocked(prisma.connectBot.findFirst).mockResolvedValue(null as never);
    vi.mocked(prisma.connectBot.create).mockResolvedValue({
      id: "bot1",
      name: "Bot",
      token: "bot_xxx",
    } as never);
    const res = await svc.createBot("t1", "c1", "u1", { name: "Bot" });
    expect(res.token).toMatch(/^bot_/);
  });

  it("rejects duplicate bot name", async () => {
    const { prisma } = await import("@unerp/database");
    vi.mocked(prisma.channelMember.findFirst).mockResolvedValue({
      role: "OWNER",
    } as never);
    vi.mocked(prisma.connectBot.findFirst).mockResolvedValue({
      id: "bot1",
      name: "Bot",
    } as never);
    await expect(
      svc.createBot("t1", "c1", "u1", { name: "Bot" }),
    ).rejects.toThrow("already exists");
  });

  it("regenerates a bot token", async () => {
    const { prisma } = await import("@unerp/database");
    vi.mocked(prisma.connectBot.findFirst).mockResolvedValue({
      id: "bot1",
      name: "Bot",
    } as never);
    vi.mocked(prisma.connectBot.update).mockResolvedValue({
      id: "bot1",
      token: "bot_yyy",
    } as never);
    const res = await svc.regenerateToken("t1", "bot1", "u1");
    expect(res.token).toMatch(/^bot_/);
  });
});

/* â”€â”€ CommunicationEnterpriseService â”€â”€ */

describe("CommunicationEnterpriseService", () => {
  let svc: CommunicationEnterpriseService;

  beforeEach(() => {
    svc = new CommunicationEnterpriseService();
    vi.clearAllMocks();
  });

  // These three specs were written against models this service does not use
  // (`message`, `notification`, `connectMeeting`, `connectBot`). The enterprise
  // service reads the `chat*` family — chatMessage, chatRoom, chatChannel,
  // announcement, task — so the old stubs never intercepted anything and the
  // assertions checked fields the methods do not return.

  it("merges announcements, messages and tasks into the unified inbox", async () => {
    const { prisma } = await import("@unerp/database");
    vi.mocked(prisma.chatMessage.findMany).mockResolvedValue([
      {
        id: "m1",
        senderId: "u2",
        content: "hi",
        createdAt: new Date(),
        room: { name: "General" },
        readReceipts: [],
        reactions: [],
      },
    ] as never);
    vi.mocked(prisma.task.findMany).mockResolvedValue([] as never);
    vi.mocked(prisma.announcement.findMany).mockResolvedValue([
      { id: "n1", title: "Notice", content: "body", priority: "HIGH" },
    ] as never);

    const res = await svc.getUnifiedInbox("t1", "u1", { limit: 50, offset: 0 });

    expect(res.notifications).toHaveLength(1);
    expect(res.notifications[0].type).toBe("ANNOUNCEMENT");
    // A message from someone else is inbound, not SENT.
    expect(res.messages[0].type).toBe("MESSAGE");
    // totalItems counts across every populated bucket.
    expect(res.totalItems).toBe(2);
  });

  it("derives message analytics by folding rooms and their messages", async () => {
    const { prisma } = await import("@unerp/database");
    vi.mocked(prisma.chatRoom.findMany).mockResolvedValue([
      {
        id: "r1",
        name: "General",
        updatedAt: new Date(),
        members: [{ userId: "u1" }, { userId: "u2" }],
        messages: [
          {
            senderId: "u1",
            contentType: "TEXT",
            createdAt: new Date("2026-07-02T10:00:00Z"),
            reactions: [{ id: "x" }],
          },
          {
            senderId: "u2",
            contentType: "TEXT",
            createdAt: new Date("2026-07-02T11:00:00Z"),
            reactions: [],
          },
        ],
      },
    ] as never);

    const res = await svc.getMessageAnalytics("t1", "MONTHLY");

    // The totals live under `summary`, not at the top level.
    expect(res.summary.totalMessages).toBe(2);
    expect(res.summary.totalRooms).toBe(1);
    expect(res.summary.totalReactions).toBe(1);
    expect(res.summary.uniqueActiveUsers).toBe(2);
  });

  it("returns collaboration dashboard KPIs", async () => {
    const { prisma } = await import("@unerp/database");
    vi.mocked(prisma.chatRoom.findMany).mockResolvedValue([
      { id: "r1" },
    ] as never);
    vi.mocked(prisma.chatMessage.findMany).mockResolvedValue([
      { senderId: "u1" },
      { senderId: "u2" },
      { senderId: "u1" },
    ] as never);
    vi.mocked(prisma.chatChannel.findMany).mockResolvedValue([
      { id: "c1" },
    ] as never);
    vi.mocked(prisma.communicationFileShare.findMany).mockResolvedValue(
      [] as never,
    );
    vi.mocked(prisma.videoCallRoom.findMany).mockResolvedValue([] as never);
    vi.mocked(prisma.chatbotDefinition.findMany).mockResolvedValue([] as never);
    vi.mocked(prisma.chatRoomMember.count).mockResolvedValue(4);

    const res = await svc.getCollaborationDashboardKpis("t1");

    expect(res.totalMessages).toBe(3);
    // Three messages from two distinct senders.
    expect(res.activeUsers).toBe(2);
    expect(res.totalMembers).toBe(4);
    expect(res.totalChannels).toBe(1);
    expect(res.totalMeetings).toBe(0);
    expect(res.activeBots).toBe(0);
  });
});
