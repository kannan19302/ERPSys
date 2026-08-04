import { describe, it, expect, vi, beforeEach } from "vitest";
import { CommunicationHelpdeskService } from "../services/communication-helpdesk.service";

vi.mock("@unerp/database", () => ({
  prisma: {
    ticketSla: {
      aggregate: vi
        .fn()
        .mockResolvedValue({
          _avg: {},
          _sum: {},
          _count: 0,
          _min: {},
          _max: {},
        }),
      create: vi.fn(),
      aggregate: vi
        .fn()
        .mockResolvedValue({
          _avg: {},
          _sum: {},
          _count: 0,
          _min: {},
          _max: {},
        }),
    },
    ticketComment: { create: vi.fn() },
    customerSatisfaction: {
      findFirst: vi.fn().mockResolvedValue(null),
      update: vi.fn(),
      create: vi.fn(),
    },
    helpdeskTicket: {
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn().mockResolvedValue(0),
      groupBy: vi.fn().mockResolvedValue([]),
    },
    ticketComment: { create: vi.fn(), findMany: vi.fn().mockResolvedValue([]) },
    ticketSla: {
      aggregate: vi
        .fn()
        .mockResolvedValue({
          _avg: {},
          _sum: {},
          _count: 0,
          _min: {},
          _max: {},
        }),
      findMany: vi.fn().mockResolvedValue([]),
      create: vi.fn(),
    },
    helpdeskEscalation: { create: vi.fn() },
    cannedResponse: {
      findMany: vi.fn().mockResolvedValue([]),
      create: vi.fn(),
      findFirst: vi.fn().mockResolvedValue(null),
    },
    customerSatisfaction: { create: vi.fn() },
  },
}));

describe("CommunicationHelpdeskService", () => {
  let svc: CommunicationHelpdeskService;

  beforeEach(() => {
    svc = new CommunicationHelpdeskService();
    vi.clearAllMocks();
  });

  it("returns paginated tickets", async () => {
    const { prisma } = await import("@unerp/database");
    vi.mocked(prisma.helpdeskTicket.findMany).mockResolvedValue([
      { id: "t1", sla: null, satisfaction: null, comments: [] },
    ] as never);
    vi.mocked(prisma.helpdeskTicket.count).mockResolvedValue(1);
    const res = await svc.getTickets("t1", { page: 1, limit: 20 });
    expect(res.data).toHaveLength(1);
    expect(res.total).toBe(1);
  });

  it("throws on missing ticket", async () => {
    const { prisma } = await import("@unerp/database");
    vi.mocked(prisma.helpdeskTicket.findFirst).mockResolvedValue(null as never);
    await expect(svc.getTicket("t1", "bad")).rejects.toThrow(
      "Ticket not found",
    );
  });

  it("creates a ticket with SLA", async () => {
    const { prisma } = await import("@unerp/database");
    vi.mocked(prisma.helpdeskTicket.create).mockResolvedValue({
      id: "t1",
      subject: "Bug",
    } as never);
    vi.mocked(prisma.ticketSla.create).mockResolvedValue({} as never);
    const res = await svc.createTicket("t1", "u1", {
      subject: "Bug",
      description: "Crash",
      priority: "HIGH",
    });
    expect(prisma.ticketSla.create).toHaveBeenCalled();
    expect(res.subject).toBe("Bug");
  });

  it("adds a ticket comment", async () => {
    const { prisma } = await import("@unerp/database");
    vi.mocked(prisma.helpdeskTicket.findFirst).mockResolvedValue({
      id: "t1",
      tenantId: "t1",
    } as never);
    vi.mocked(prisma.ticketComment.create).mockResolvedValue({
      id: "c1",
      content: "Fixed",
    } as never);
    vi.mocked(prisma.helpdeskTicket.update).mockResolvedValue({} as never);
    const res = await svc.addTicketComment("t1", "t1", "u1", {
      content: "Fixed",
    });
    expect(res.content).toBe("Fixed");
  });

  it("escalates a ticket", async () => {
    const { prisma } = await import("@unerp/database");
    vi.mocked(prisma.helpdeskTicket.findFirst).mockResolvedValue({
      id: "t1",
      tenantId: "t1",
    } as never);
    vi.mocked(prisma.helpdeskTicket.update).mockResolvedValue({
      id: "t1",
      status: "ESCALATED",
    } as never);
    vi.mocked(prisma.helpdeskEscalation.create).mockResolvedValue({} as never);
    const res = await svc.escalateTicket("t1", "t1", "Needs manager");
    expect(res.status).toBe("ESCALATED");
  });

  it("creates a canned response", async () => {
    const { prisma } = await import("@unerp/database");
    vi.mocked(prisma.cannedResponse.create).mockResolvedValue({
      id: "cr1",
      title: "Greeting",
    } as never);
    const res = await svc.createCannedResponse("t1", "u1", {
      title: "Greeting",
      content: "Hi there",
    });
    expect(res.title).toBe("Greeting");
  });

  it("returns dashboard metrics", async () => {
    const { prisma } = await import("@unerp/database");
    vi.mocked(prisma.helpdeskTicket.count).mockResolvedValue(5);
    vi.mocked(prisma.helpdeskTicket.findMany).mockResolvedValue([] as never);
    const res = await svc.getHelpdeskDashboard("t1");
    // The dashboard returns `openCount`, not `open`.
    expect(res.openCount).toBe(5);
  });
});
