import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NotificationDeliveryService } from "../notification-delivery.service";

vi.mock("@unerp/database", () => {
  // Identity models (user, role, userSession, ...) are read through
  // `idpPrisma`, not `prisma` — this spec predates that split and stubs
  // them under `prisma`. Exporting the same stub object under both names
  // keeps every `vi.mocked(prisma.user.*)` setup pointing at exactly the
  // function the service calls.
  const mocked = {
    prisma: {
      notification: { create: vi.fn() },
      userPresence: { findFirst: vi.fn() },
      user: { findFirst: vi.fn() },
      // Push delivery looks up the user's registered devices; without this the
      // service hit `undefined.findMany` and the whole delivery path threw.
      pushDeviceToken: { findMany: vi.fn().mockResolvedValue([]) },
    },
  };
  return { ...mocked, idpPrisma: mocked.prisma };
});

describe("NotificationDeliveryService — DND notification suppression (US-B6)", () => {
  let service: NotificationDeliveryService;

  beforeEach(() => {
    service = new NotificationDeliveryService();
    vi.clearAllMocks();
  });

  it("delivers both inApp and Email when user presence is active/non-DND", async () => {
    const { prisma } = await import("@unerp/database");
    vi.mocked(idpPrisma.userPresence.findFirst).mockResolvedValue({
      presence: "ACTIVE",
    } as never);
    vi.mocked(idpPrisma.user.findFirst).mockResolvedValue({
      email: "bob@example.com",
    } as never);
    vi.mocked(prisma.notification.create).mockResolvedValue({} as never);

    const spyEmail = vi.spyOn(service as any, "deliverEmail");

    await service.handleNotification({
      tenantId: "t1",
      userId: "u1",
      type: "CHAT",
      title: "Bob mentioned you",
      channel: "ALL",
    });

    expect(prisma.notification.create).toHaveBeenCalledTimes(1);
    expect(spyEmail).toHaveBeenCalledTimes(1);
  });

  it("suppresses Email delivery when user presence is DND, but keeps inApp", async () => {
    const { prisma } = await import("@unerp/database");
    vi.mocked(idpPrisma.userPresence.findFirst).mockResolvedValue({
      presence: "DND",
    } as never);
    vi.mocked(prisma.notification.create).mockResolvedValue({} as never);

    const spyEmail = vi.spyOn(service as any, "deliverEmail");

    await service.handleNotification({
      tenantId: "t1",
      userId: "u1",
      type: "CHAT",
      title: "Bob mentioned you",
      channel: "ALL",
    });

    expect(prisma.notification.create).toHaveBeenCalledTimes(1); // inApp still created
    expect(spyEmail).not.toHaveBeenCalled(); // Email suppressed
  });
});
