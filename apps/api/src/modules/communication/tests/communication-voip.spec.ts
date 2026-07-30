// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from "vitest";
import { CommunicationVoipService } from "../services/communication-voip.service";

vi.mock("@unerp/database", () => ({
  prisma: {
    voipCall: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    voipCallAnalytics: { findMany: vi.fn(), create: vi.fn() },
    voipVoicemail: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    voipIvrMenu: { findMany: vi.fn(), create: vi.fn() },
    voipIvrOption: { create: vi.fn() },
  },
}));

describe("CommunicationVoipService", () => {
  let svc: CommunicationVoipService;

  beforeEach(() => {
    svc = new CommunicationVoipService();
    vi.clearAllMocks();
  });

  it("returns paginated calls", async () => {
    const { prisma } = await import("@unerp/database");
    vi.mocked(prisma.voipCall.findMany).mockResolvedValue([
      { id: "call1", callerNumber: "+123" },
    ] as never);
    vi.mocked(prisma.voipCall.count).mockResolvedValue(1);
    const res = await svc.getCalls("t1", { page: 1, limit: 20 });
    expect(res.data).toHaveLength(1);
    expect(res.total).toBe(1);
  });

  it("throws on missing call", async () => {
    const { prisma } = await import("@unerp/database");
    vi.mocked(prisma.voipCall.findFirst).mockResolvedValue(null as never);
    await expect(svc.getCall("t1", "bad")).rejects.toThrow("Call not found");
  });

  it("initiates a call", async () => {
    const { prisma } = await import("@unerp/database");
    vi.mocked(prisma.voipCall.create).mockResolvedValue({
      id: "call1",
      callerNumber: "+123",
      status: "RINGING",
    } as never);
    const res = await svc.initiateCall("t1", "u1", {
      callerNumber: "+123",
      calleeNumber: "+456",
    });
    expect(res.status).toBe("RINGING");
  });

  it("updates call status", async () => {
    const { prisma } = await import("@unerp/database");
    vi.mocked(prisma.voipCall.findFirst).mockResolvedValue({
      id: "call1",
      tenantId: "t1",
      startedAt: new Date(),
    } as never);
    vi.mocked(prisma.voipCall.update).mockResolvedValue({
      id: "call1",
      status: "COMPLETED",
    } as never);
    vi.mocked(prisma.voipCallAnalytics.findMany).mockResolvedValue([] as never);
    vi.mocked(prisma.voipCallAnalytics.create).mockResolvedValue({} as never);
    const res = await svc.updateCallStatus("t1", "call1", {
      status: "COMPLETED",
      duration: 120,
    });
    expect(res.status).toBe("COMPLETED");
  });

  it("routes an incoming call", async () => {
    const { prisma } = await import("@unerp/database");
    vi.mocked(prisma.voipCall.create).mockResolvedValue({
      id: "call1",
      direction: "INBOUND",
    } as never);
    const res = await svc.routeIncomingCall("t1", {
      callerNumber: "+123",
      calleeNumber: "+456",
    });
    expect(res.direction).toBe("INBOUND");
  });

  it("returns voicemail list", async () => {
    const { prisma } = await import("@unerp/database");
    vi.mocked(prisma.voipVoicemail.findMany).mockResolvedValue([
      { id: "vm1", callerNumber: "+123" },
    ] as never);
    vi.mocked(prisma.voipVoicemail.count).mockResolvedValue(1);
    const res = await svc.getVoicemail("t1", { page: 1, limit: 20 });
    expect(res.data).toHaveLength(1);
    expect(res.total).toBe(1);
  });

  it("marks voicemail as read", async () => {
    const { prisma } = await import("@unerp/database");
    vi.mocked(prisma.voipVoicemail.findFirst).mockResolvedValue({
      id: "vm1",
      tenantId: "t1",
    } as never);
    vi.mocked(prisma.voipVoicemail.update).mockResolvedValue({
      id: "vm1",
      isRead: true,
    } as never);
    const res = await svc.markVoicemailRead("t1", "vm1");
    expect(res.isRead).toBe(true);
  });

  it("lists IVR menus", async () => {
    const { prisma } = await import("@unerp/database");
    vi.mocked(prisma.voipIvrMenu.findMany).mockResolvedValue([
      { id: "ivr1", name: "Main Menu" },
    ] as never);
    const res = await svc.getIvrMenus("t1");
    expect(res).toHaveLength(1);
  });

  it("creates an IVR menu", async () => {
    const { prisma } = await import("@unerp/database");
    vi.mocked(prisma.voipIvrMenu.create).mockResolvedValue({
      id: "ivr1",
      name: "Sales",
    } as never);
    const res = await svc.createIvrMenu("t1", {
      name: "Sales",
      greeting: "Welcome",
    });
    expect(res.name).toBe("Sales");
  });

  it("creates an IVR option", async () => {
    const { prisma } = await import("@unerp/database");
    vi.mocked(prisma.voipIvrOption.create).mockResolvedValue({
      id: "opt1",
      digit: "1",
      label: "Support",
    } as never);
    const res = await svc.createIvrOption("t1", "ivr1", {
      digit: "1",
      label: "Support",
    });
    expect(res.digit).toBe("1");
  });

  it("returns call analytics", async () => {
    const { prisma } = await import("@unerp/database");
    vi.mocked(prisma.voipCall.count).mockResolvedValue(10);
    vi.mocked(prisma.voipCallAnalytics.findMany).mockResolvedValue([
      { avgDuration: 300 },
    ] as never);
    const res = await svc.getCallAnalytics("t1");
    expect(res.totalCalls).toBe(10);
  });

  it("returns VoIP dashboard", async () => {
    const { prisma } = await import("@unerp/database");
    vi.mocked(prisma.voipCall.count).mockResolvedValue(5);
    vi.mocked(prisma.voipVoicemail.count).mockResolvedValue(3);
    vi.mocked(prisma.voipCallAnalytics.findMany).mockResolvedValue([
      { avgDuration: 240 },
    ] as never);
    const res = await svc.getVoipDashboard("t1");
    expect(res.activeCalls).toBe(5);
    expect(res.unreadVoicemail).toBe(3);
    expect(res.avgDuration).toBe(240);
  });
});
