import { describe, it, expect, vi, beforeEach } from "vitest";
import { CommunicationAdminService } from "../communication-admin.service";
import { CommunicationBotsService } from "../communication-bots.service";
import { CommunicationEnterpriseService } from "../communication-enterprise.service";

/* ── CommunicationAdminService ── */
vi.mock("@unerp/database", () => ({
  prisma: {
    channelModeration: { findFirst: vi.fn(), upsert: vi.fn() },
    channelMember: { findFirst: vi.fn() },
    channelTab: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      findFirst: vi.fn(),
      delete: vi.fn(),
    },
    channel: { findMany: vi.fn(), findFirst: vi.fn() },
    message: { findMany: vi.fn(), findFirst: vi.fn(), count: vi.fn() },
    messageReaction: { findMany: vi.fn() },
    messageEditHistory: { findMany: vi.fn() },
    user: { findMany: vi.fn() },
    userPresence: { findMany: vi.fn() },
    connectBot: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      upsert: vi.fn(),
    },
    connectMeeting: { findMany: vi.fn(), count: vi.fn(), aggregate: vi.fn() },
    notification: { count: vi.fn() },
    emailTemplate: { findMany: vi.fn() },
  },
}));

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

  it("returns channel analytics", async () => {
    const { prisma } = await import("@unerp/database");
    vi.mocked(prisma.message.count).mockResolvedValue(10);
    vi.mocked(prisma.message.findMany).mockResolvedValue([] as never);
    vi.mocked(prisma.channelMember.findMany).mockResolvedValue([] as never);
    const res = await svc.getChannelAnalytics("t1", "c1", 30);
    expect(res.messageCount).toBe(10);
  });
});

/* ── CommunicationBotsService ── */

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

/* ── CommunicationEnterpriseService ── */

describe("CommunicationEnterpriseService", () => {
  let svc: CommunicationEnterpriseService;

  beforeEach(() => {
    svc = new CommunicationEnterpriseService();
    vi.clearAllMocks();
  });

  it("returns unified inbox", async () => {
    const { prisma } = await import("@unerp/database");
    vi.mocked(prisma.notification.findMany).mockResolvedValue([
      { id: "n1" },
    ] as never);
    vi.mocked(prisma.message.findMany).mockResolvedValue([] as never);
    vi.mocked(prisma.connectMeeting.findMany).mockResolvedValue([] as never);
    const res = await svc.getUnifiedInbox("t1", "u1", { limit: 50, offset: 0 });
    expect(res.notifications).toHaveLength(1);
  });

  it("returns message analytics", async () => {
    const { prisma } = await import("@unerp/database");
    vi.mocked(prisma.message.count).mockResolvedValue(100);
    vi.mocked(prisma.user.findMany).mockResolvedValue([] as never);
    vi.mocked(prisma.channel.findMany).mockResolvedValue([] as never);
    const res = await svc.getMessageAnalytics("t1", "MONTHLY");
    expect(res.totalMessages).toBe(100);
  });

  it("returns collaboration dashboard KPIs", async () => {
    const { prisma } = await import("@unerp/database");
    vi.mocked(prisma.message.count).mockResolvedValue(500);
    vi.mocked(prisma.channel.count).mockResolvedValue(10);
    vi.mocked(prisma.connectMeeting.count).mockResolvedValue(20);
    vi.mocked(prisma.notification.count).mockResolvedValue(50);
    vi.mocked(prisma.connectBot.count).mockResolvedValue(5);
    vi.mocked(prisma.emailTemplate.count).mockResolvedValue(3);
    const res = await svc.getCollaborationDashboardKpis("t1");
    expect(res.totalMessages).toBe(500);
    expect(res.totalChannels).toBe(10);
    expect(res.totalMeetings).toBe(20);
    expect(res.unreadNotifications).toBe(50);
  });
});
