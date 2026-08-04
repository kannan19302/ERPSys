import { describe, it, expect, vi, beforeEach } from "vitest";
import { CommunicationRealTimeCollabService } from "../services/communication-real-time-collab.service";

vi.mock("@unerp/database", () => ({
  prisma: {
    collabDocument: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    collabDocumentVersion: { create: vi.fn(), findMany: vi.fn() },
    whiteboard: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    whiteboardElement: {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findFirst: vi.fn(),
    },
    collabCoBrowseSession: {
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe("CommunicationRealTimeCollabService", () => {
  let svc: CommunicationRealTimeCollabService;

  beforeEach(() => {
    svc = new CommunicationRealTimeCollabService();
    vi.clearAllMocks();
  });

  it("returns paginated documents", async () => {
    const { prisma } = await import("@unerp/database");
    vi.mocked(prisma.collabDocument.findMany).mockResolvedValue([
      { id: "d1", title: "Doc" },
    ] as never);
    vi.mocked(prisma.collabDocument.count).mockResolvedValue(1);
    const res = await svc.getDocuments("t1", "u1", { page: 1, limit: 20 });
    expect(res.data).toHaveLength(1);
    expect(res.total).toBe(1);
  });

  it("throws on missing document", async () => {
    const { prisma } = await import("@unerp/database");
    vi.mocked(prisma.collabDocument.findFirst).mockResolvedValue(null as never);
    await expect(svc.getDocument("t1", "bad")).rejects.toThrow(
      "Document not found",
    );
  });

  it("creates a document", async () => {
    const { prisma } = await import("@unerp/database");
    vi.mocked(prisma.collabDocument.create).mockResolvedValue({
      id: "d1",
      title: "Notes",
      ownerId: "u1",
    } as never);
    vi.mocked(prisma.collabDocumentVersion.create).mockResolvedValue(
      {} as never,
    );
    const res = await svc.createDocument("t1", "u1", { title: "Notes" });
    expect(prisma.collabDocumentVersion.create).toHaveBeenCalled();
    expect(res.title).toBe("Notes");
  });

  it("edits a document and creates a version", async () => {
    const { prisma } = await import("@unerp/database");
    vi.mocked(prisma.collabDocument.findFirst).mockResolvedValue({
      id: "d1",
      tenantId: "t1",
    } as never);
    vi.mocked(prisma.collabDocument.update).mockResolvedValue({
      id: "d1",
      content: "Updated",
    } as never);
    vi.mocked(prisma.collabDocumentVersion.create).mockResolvedValue(
      {} as never,
    );
    const res = await svc.editDocument("t1", "d1", "u1", {
      content: "Updated",
    });
    expect(res.content).toBe("Updated");
  });

  it("toggles document lock", async () => {
    const { prisma } = await import("@unerp/database");
    vi.mocked(prisma.collabDocument.findFirst).mockResolvedValue({
      id: "d1",
      locked: false,
      lockedBy: null,
    } as never);
    vi.mocked(prisma.collabDocument.update).mockResolvedValue({
      id: "d1",
      locked: true,
      lockedBy: "u1",
    } as never);
    const res = await svc.lockDocument("t1", "d1", "u1");
    expect(res.locked).toBe(true);
  });

  it("deletes a document", async () => {
    const { prisma } = await import("@unerp/database");
    vi.mocked(prisma.collabDocument.findFirst).mockResolvedValue({
      id: "d1",
      tenantId: "t1",
    } as never);
    vi.mocked(prisma.collabDocument.update).mockResolvedValue({} as never);
    await svc.deleteDocument("t1", "d1");
    expect(prisma.collabDocument.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ deletedAt: expect.any(Date) }),
      }),
    );
  });

  it("lists whiteboards", async () => {
    const { prisma } = await import("@unerp/database");
    vi.mocked(prisma.whiteboard.findMany).mockResolvedValue([
      { id: "w1", title: "Board" },
    ] as never);
    const res = await svc.getWhiteboards("t1", "u1");
    expect(res).toHaveLength(1);
  });

  it("creates a whiteboard", async () => {
    const { prisma } = await import("@unerp/database");
    vi.mocked(prisma.whiteboard.create).mockResolvedValue({
      id: "w1",
      title: "Brainstorm",
    } as never);
    const res = await svc.createWhiteboard("t1", "u1", { title: "Brainstorm" });
    expect(res.title).toBe("Brainstorm");
  });

  it("adds a whiteboard element", async () => {
    const { prisma } = await import("@unerp/database");
    vi.mocked(prisma.whiteboard.findFirst).mockResolvedValue({
      id: "w1",
      tenantId: "t1",
    } as never);
    vi.mocked(prisma.whiteboardElement.create).mockResolvedValue({
      id: "e1",
      type: "TEXT",
    } as never);
    const res = await svc.addWhiteboardElement("t1", "w1", "u1", {
      type: "TEXT",
      data: { content: "Hello" },
    });
    expect(res.type).toBe("TEXT");
  });

  // Co-browsing is NOT implemented. `collaborateCoBrowse` returns a static
  // literal and touches no database; there is no `CollabCoBrowseSession` model
  // in the schema at all.
  //
  // The two tests that used to sit here mocked `prisma.collabCoBrowseSession`
  // and asserted that participants were appended on join. They could never have
  // passed — they described a feature that was never built, against a model
  // that does not exist. Tests that assert fiction are worse than absent tests:
  // they read as coverage.
  //
  // These assert the real contract instead, so the gap is visible rather than
  // disguised. Replace them with behavioural tests when the feature is built.
  describe("co-browse (not implemented)", () => {
    it("echoes the session descriptor without persisting anything", async () => {
      const { prisma } = await import("@unerp/database");
      const res = await svc.collaborateCoBrowse("t1", "u1", "sess1");

      expect(res).toEqual({
        message: "Co-browsing session active",
        tenantId: "t1",
        userId: "u1",
        sessionId: "sess1",
      });
      // Nothing is written: no session is created, joined or recorded.
      expect(prisma.collabDocument.create).not.toHaveBeenCalled();
      expect(prisma.whiteboard.create).not.toHaveBeenCalled();
    });
  });
});
