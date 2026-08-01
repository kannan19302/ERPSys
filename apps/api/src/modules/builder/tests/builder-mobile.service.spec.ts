import { BuilderMobileService } from "../services/builder-mobile.service";
import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("@unerp/database", () => ({
  prisma: {
    mobileApp: {
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ id: "app-1" }),
      update: vi.fn().mockResolvedValue({ id: "app-1" }),
      delete: vi.fn().mockResolvedValue({ id: "app-1" }),
      count: vi.fn().mockResolvedValue(0),
    },
    mobileScreen: {
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ id: "screen-1" }),
      update: vi.fn().mockResolvedValue({ id: "screen-1" }),
      delete: vi.fn().mockResolvedValue({ id: "screen-1" }),
    },
    mobileNotificationConfig: {
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ id: "push-1" }),
      update: vi.fn().mockResolvedValue({ id: "push-1" }),
    },
    mobileBuild: {
      create: vi.fn().mockResolvedValue({ id: "build-1" }),
      findMany: vi.fn().mockResolvedValue([]),
    },
  },
}));

describe("BuilderMobileService", () => {
  let service: BuilderMobileService;

  beforeEach(() => {
    service = new BuilderMobileService();
    vi.clearAllMocks();
  });

  it("getMobileApps returns list", async () => {
    const result = await service.getMobileApps("t1");
    expect(Array.isArray(result)).toBe(true);
  });

  it("getMobileAppById throws on missing", async () => {
    await expect(service.getMobileAppById("t1", "none")).rejects.toThrow();
  });

  it("createMobileApp succeeds", async () => {
    const { prisma } = await import("@unerp/database");
    (prisma.mobileApp.findFirst as any).mockResolvedValue(null);
    const result = await service.createMobileApp("t1", {
      name: "App",
      slug: "app",
    });
    expect(result).toBeDefined();
  });

  it("createMobileApp rejects duplicate slug", async () => {
    const { prisma } = await import("@unerp/database");
    (prisma.mobileApp.findFirst as any).mockResolvedValue({ id: "app-1" });
    await expect(
      service.createMobileApp("t1", { slug: "dup" }),
    ).rejects.toThrow();
  });

  it("updateMobileApp updates", async () => {
    const { prisma } = await import("@unerp/database");
    (prisma.mobileApp.findFirst as any).mockResolvedValue({ id: "app-1" });
    const result = await service.updateMobileApp("t1", "app-1", { name: "U" });
    expect(result).toBeDefined();
  });

  it("deleteMobileApp deletes", async () => {
    const { prisma } = await import("@unerp/database");
    (prisma.mobileApp.findFirst as any).mockResolvedValue({ id: "app-1" });
    const result = await service.deleteMobileApp("t1", "app-1");
    expect(result).toBeDefined();
  });

  it("addMobileScreen creates screen", async () => {
    const { prisma } = await import("@unerp/database");
    (prisma.mobileApp.findFirst as any).mockResolvedValue({ id: "app-1" });
    const result = await service.addMobileScreen("t1", "app-1", {
      name: "Screen",
    });
    expect(result).toBeDefined();
  });

  it("getMobileScreens returns list", async () => {
    const result = await service.getMobileScreens("t1", "app-1");
    expect(Array.isArray(result)).toBe(true);
  });

  it("updateMobileScreen updates", async () => {
    const { prisma } = await import("@unerp/database");
    (prisma.mobileScreen.findFirst as any).mockResolvedValue({
      id: "screen-1",
    });
    const result = await service.updateMobileScreen("t1", "screen-1", {
      name: "U",
    });
    expect(result).toBeDefined();
  });

  it("deleteMobileScreen deletes", async () => {
    const { prisma } = await import("@unerp/database");
    (prisma.mobileScreen.findFirst as any).mockResolvedValue({
      id: "screen-1",
    });
    const result = await service.deleteMobileScreen("t1", "screen-1");
    expect(result).toBeDefined();
  });

  it("configurePushNotifications creates config", async () => {
    const { prisma } = await import("@unerp/database");
    (prisma.mobileApp.findFirst as any).mockResolvedValue({ id: "app-1" });
    const result = await service.configurePushNotifications("t1", "app-1", {
      provider: "FCM",
    });
    expect(result).toBeDefined();
  });

  it("getPushConfig returns config", async () => {
    const result = await service.getPushConfig("t1", "app-1");
    expect(result).toBeDefined();
  });

  it("previewMobileApp returns preview", async () => {
    const { prisma } = await import("@unerp/database");
    (prisma.mobileApp.findFirst as any).mockResolvedValue({
      id: "app-1",
      name: "App",
      platform: "BOTH",
      capabilities: [],
    });
    const result = await service.previewMobileApp("t1", "app-1");
    expect(result).toHaveProperty("app");
    expect(result).toHaveProperty("preview");
  });

  it("deployMobileBuild creates build", async () => {
    const { prisma } = await import("@unerp/database");
    (prisma.mobileApp.findFirst as any).mockResolvedValue({
      id: "app-1",
      buildNumber: 0,
    });
    const result = await service.deployMobileBuild("t1", "app-1", {
      platform: "IOS",
    });
    expect(result).toBeDefined();
  });

  it("getMobileBuilds returns builds", async () => {
    const result = await service.getMobileBuilds("t1", "app-1");
    expect(Array.isArray(result)).toBe(true);
  });
});
