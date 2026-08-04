import { describe, it, expect, vi, beforeEach } from "vitest";
import { CommunicationVideoService } from "../services/communication-video.service";

vi.mock("@unerp/database", () => ({
  prisma: {
    meetingAnalytics: { findUnique: vi.fn().mockResolvedValue(null) },
    connectMeeting: {
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn().mockResolvedValue(0),
    },
    meetingParticipant: {
      create: vi.fn(),
      updateMany: vi.fn(),
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
    },
    meetingRecording: {
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn().mockResolvedValue(0),
    },
    breakoutRoom: {
      create: vi.fn(),
      findMany: vi.fn().mockResolvedValue([]),
      update: vi.fn(),
      findFirst: vi.fn().mockResolvedValue(null),
    },
    meetingSummary: {
      create: vi.fn(),
      findMany: vi.fn().mockResolvedValue([]),
    },
  },
}));

describe("CommunicationVideoService", () => {
  let svc: CommunicationVideoService;

  beforeEach(() => {
    svc = new CommunicationVideoService();
    vi.clearAllMocks();
  });

  it("returns paginated meetings", async () => {
    const { prisma } = await import("@unerp/database");
    vi.mocked(prisma.connectMeeting.findMany).mockResolvedValue([
      { id: "m1", _count: { participants: 3, recordings: 1 } },
    ] as never);
    vi.mocked(prisma.connectMeeting.count).mockResolvedValue(1);
    const res = await svc.getMeetings("t1", { page: 1, limit: 20 });
    expect(res.data).toHaveLength(1);
    expect(res.total).toBe(1);
  });

  it("throws on missing meeting", async () => {
    const { prisma } = await import("@unerp/database");
    vi.mocked(prisma.connectMeeting.findFirst).mockResolvedValue(null as never);
    await expect(svc.getMeeting("t1", "bad")).rejects.toThrow(
      "Meeting not found",
    );
  });

  it("creates a meeting with settings", async () => {
    const { prisma } = await import("@unerp/database");
    vi.mocked(prisma.connectMeeting.create).mockResolvedValue({
      id: "m1",
      title: "Standup",
    } as never);
    vi.mocked(prisma.meetingParticipant.create).mockResolvedValue({} as never);
    const res = await svc.createMeetingWithSettings("t1", "u1", {
      title: "Standup",
      lobby: true,
    });
    expect(res.title).toBe("Standup");
    expect(prisma.meetingParticipant.create).toHaveBeenCalled();
  });

  it("ends a meeting and updates participants", async () => {
    const { prisma } = await import("@unerp/database");
    vi.mocked(prisma.connectMeeting.findFirst).mockResolvedValue({
      id: "m1",
      tenantId: "t1",
    } as never);
    vi.mocked(prisma.meetingParticipant.updateMany).mockResolvedValue({
      count: 1,
    } as never);
    vi.mocked(prisma.connectMeeting.update).mockResolvedValue({
      id: "m1",
      active: false,
    } as never);
    const res = await svc.endMeeting("t1", "m1");
    expect(res.active).toBe(false);
  });

  it("returns meeting recordings", async () => {
    const { prisma } = await import("@unerp/database");
    vi.mocked(prisma.connectMeeting.findFirst).mockResolvedValue({
      id: "m1",
      tenantId: "t1",
    } as never);
    vi.mocked(prisma.meetingRecording.findMany).mockResolvedValue([
      { id: "rec1", url: "https://rec" },
    ] as never);
    const res = await svc.getMeetingRecordings("t1", "m1");
    expect(res).toHaveLength(1);
  });

  it("creates a breakout room", async () => {
    const { prisma } = await import("@unerp/database");
    vi.mocked(prisma.connectMeeting.findFirst).mockResolvedValue({
      id: "m1",
      tenantId: "t1",
    } as never);
    vi.mocked(prisma.breakoutRoom.create).mockResolvedValue({
      id: "br1",
      name: "Group A",
    } as never);
    const res = await svc.createBreakoutRoom("t1", "m1", "u1", {
      name: "Group A",
    });
    expect(res.name).toBe("Group A");
  });

  it("returns meeting analytics", async () => {
    const { prisma } = await import("@unerp/database");
    // getMeetingAnalytics reads the precomputed meetingAnalytics row; it does
    // not derive figures from connectMeeting/meetingParticipant, so mocking
    // those left findUnique returning null and the service threw.
    vi.mocked(prisma.meetingAnalytics.findUnique).mockResolvedValue({
      meetingId: "m1",
      tenantId: "t1",
      totalParticipants: 1,
    } as never);
    const res = await svc.getMeetingAnalytics("t1", "m1");
    expect(res.totalParticipants).toBe(1);
  });

  it("returns video dashboard metrics", async () => {
    const { prisma } = await import("@unerp/database");
    vi.mocked(prisma.connectMeeting.count).mockResolvedValue(5);
    vi.mocked(prisma.connectMeeting.findMany).mockResolvedValue([] as never);
    const res = await svc.getVideoDashboard("t1");
    expect(res.activeMeetings).toBe(5);
    expect(res.totalMeetings).toBe(5);
  });
});
