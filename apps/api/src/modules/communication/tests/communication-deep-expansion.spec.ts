import { describe, it, expect, vi, beforeEach } from "vitest";
import { CommDeepExpansionService } from "../services/comm-deep-expansion.service";

vi.mock("@unerp/database", () => ({
  prisma: {
    emailInbox: { create: vi.fn(), findMany: vi.fn() },
    emailMessage: { create: vi.fn() },
    videoRoom: { create: vi.fn(), findMany: vi.fn() },
    videoRoomParticipant: { create: vi.fn() },
    wikiSpace: { create: vi.fn(), findMany: vi.fn() },
    wikiPage: { create: vi.fn(), findMany: vi.fn() },
    wikiPageVersion: { create: vi.fn() },
    chatChannel: { create: vi.fn(), findMany: vi.fn() },
    intranetPost: { create: vi.fn(), findMany: vi.fn() },
    intranetComment: { create: vi.fn() },
    internalSurvey: { create: vi.fn(), findMany: vi.fn(), update: vi.fn() },
    internalSurveyAnswer: { create: vi.fn() },
    companyEvent: { create: vi.fn(), findMany: vi.fn() },
    eventRsvp: { upsert: vi.fn() },
    phoneExtension: { create: vi.fn() },
    phoneCallLog: { create: vi.fn() },
  },
}));

describe("CommDeepExpansionService", () => {
  let svc: CommDeepExpansionService;

  beforeEach(() => {
    svc = new CommDeepExpansionService();
    vi.clearAllMocks();
  });

  it("creates an email inbox with rules", async () => {
    const { prisma } = await import("@unerp/database");
    const mockInbox = { id: "inbox1", emailRules: [] };
    vi.mocked(prisma.emailInbox.create).mockResolvedValue(mockInbox as never);
    const res = await svc.createEmailInbox("t1", { name: "Support" });
    expect(prisma.emailInbox.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ name: "Support", tenantId: "t1" }),
      }),
    );
    expect(res).toEqual(mockInbox);
  });

  it("lists email inboxes", async () => {
    const { prisma } = await import("@unerp/database");
    vi.mocked(prisma.emailInbox.findMany).mockResolvedValue([
      { id: "inbox1", emails: [] },
    ] as never);
    const res = await svc.getEmailInboxes("t1");
    expect(prisma.emailInbox.findMany).toHaveBeenCalledWith({
      where: { tenantId: "t1" },
      include: { emails: { take: 20, orderBy: { createdAt: "desc" } } },
    });
    expect(res).toHaveLength(1);
  });

  it("creates a video room with auto-generated code", async () => {
    const { prisma } = await import("@unerp/database");
    vi.mocked(prisma.videoRoom.create).mockImplementation((args: never) => {
      const data = (args as any).data;
      return Promise.resolve({
        id: "room1",
        roomCode: data.roomCode,
        participants: [],
      }) as never;
    });
    const res = await svc.createVideoRoom("t1", { name: "Standup" });
    expect(prisma.videoRoom.create).toHaveBeenCalled();
    expect(res.roomCode).toMatch(/^room-/);
  });

  it("creates a wiki page with an initial version", async () => {
    const { prisma } = await import("@unerp/database");
    vi.mocked(prisma.wikiPage.create).mockResolvedValue({
      id: "page1",
      title: "Docs",
      content: "Content",
      spaceId: "space1",
    } as never);
    vi.mocked(prisma.wikiPageVersion.create).mockResolvedValue({} as never);
    const res = await svc.createWikiPage("t1", "space1", {
      title: "Docs",
      content: "Content",
      authorId: "u1",
    });
    expect(prisma.wikiPageVersion.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ version: 1, pageId: "page1" }),
      }),
    );
    expect(res.id).toBe("page1");
  });

  it("creates an intranet post", async () => {
    const { prisma } = await import("@unerp/database");
    vi.mocked(prisma.intranetPost.create).mockResolvedValue({
      id: "post1",
      intranetComments: [],
      intranetReactions: [],
    } as never);
    const res = await svc.createIntranetPost("t1", { content: "Hello" });
    expect(prisma.intranetPost.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ content: "Hello", tenantId: "t1" }),
      }),
    );
    expect(res.id).toBe("post1");
  });

  it("adds a comment to an intranet post and increments count", async () => {
    const { prisma } = await import("@unerp/database");
    vi.mocked(prisma.intranetComment.create).mockResolvedValue({
      id: "comment1",
      postId: "post1",
    } as never);
    vi.mocked(prisma.intranetPost.update).mockResolvedValue({} as never);
    const res = await svc.addIntranetComment("t1", "post1", { text: "Nice" });
    expect(prisma.intranetPost.update).toHaveBeenCalledWith({
      where: { id: "post1" },
      data: { commentCount: { increment: 1 } },
    });
    expect(res.id).toBe("comment1");
  });

  it("submits a survey answer and increments response count", async () => {
    const { prisma } = await import("@unerp/database");
    vi.mocked(prisma.internalSurveyAnswer.create).mockResolvedValue({
      id: "ans1",
    } as never);
    vi.mocked(prisma.internalSurvey.update).mockResolvedValue({} as never);
    const res = await svc.submitSurveyAnswer("t1", "survey1", {
      answer: "Yes",
    });
    expect(prisma.internalSurvey.update).toHaveBeenCalledWith({
      where: { id: "survey1" },
      data: { responseCount: { increment: 1 } },
    });
    expect(res.id).toBe("ans1");
  });

  it("upserts an event RSVP", async () => {
    const { prisma } = await import("@unerp/database");
    vi.mocked(prisma.eventRsvp.upsert).mockResolvedValue({
      userId: "u1",
      status: "ATTENDING",
    } as never);
    const res = await svc.rsvpEvent("t1", "event1", {
      userId: "u1",
      status: "ATTENDING",
    });
    expect(prisma.eventRsvp.upsert).toHaveBeenCalledWith({
      where: { eventId_userId: { eventId: "event1", userId: "u1" } },
      create: {
        userId: "u1",
        status: "ATTENDING",
        eventId: "event1",
        tenantId: "t1",
      },
      update: { status: "ATTENDING", notes: undefined },
    });
    expect(res.status).toBe("ATTENDING");
  });

  it("creates a phone extension", async () => {
    const { prisma } = await import("@unerp/database");
    vi.mocked(prisma.phoneExtension.create).mockResolvedValue({
      id: "ext1",
      extension: "101",
    } as never);
    const res = await svc.createPhoneExtension("t1", { extension: "101" });
    expect(prisma.phoneExtension.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ extension: "101", tenantId: "t1" }),
      }),
    );
    expect(res.extension).toBe("101");
  });

  it("records a phone call log", async () => {
    const { prisma } = await import("@unerp/database");
    vi.mocked(prisma.phoneCallLog.create).mockResolvedValue({
      id: "log1",
      caller: "+123",
    } as never);
    const res = await svc.recordPhoneCallLog("t1", { caller: "+123" });
    expect(prisma.phoneCallLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ caller: "+123", tenantId: "t1" }),
      }),
    );
    expect(res.id).toBe("log1");
  });
});
