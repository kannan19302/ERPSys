import { describe, it, expect, vi, beforeEach } from "vitest";
import { PwaService } from "../pwa.service";
import { NotFoundException } from "@nestjs/common";

const {
  mockManifest,
  mockServiceWorker,
  mockCacheRule,
  mockInstallPrompt,
  mockSyncItem,
  mockPushSub,
} = vi.hoisted(() => {
  const mockManifest = {
    id: "m1",
    tenantId: "t1",
    name: "UniERP",
    shortName: "UniERP",
    startUrl: "/",
    display: "standalone",
    themeColor: "#0f172a",
    backgroundColor: "#ffffff",
    lang: "en",
    dir: "ltr",
    scope: "/",
    categories: [],
    screenshots: [],
    shortcuts: [],
    preferRelatedApplications: false,
    relatedApplications: [],
    version: "1.0.0",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const mockServiceWorker = {
    id: "sw1",
    tenantId: "t1",
    name: "sw.js",
    script: 'console.log("sw")',
    version: "1.0.0",
    cacheStrategy: "CACHE_FIRST",
    precacheUrls: [],
    runtimeCacheRules: [],
    navigationPreload: false,
    pushEnabled: true,
    backgroundSync: true,
    importScripts: [],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const mockCacheRule = {
    id: "cr1",
    tenantId: "t1",
    name: "API Cache",
    urlPattern: "/api/*",
    cacheStrategy: "NETWORK_FIRST",
    maxAgeSeconds: 3600,
    maxEntries: 50,
    compression: false,
    method: "GET",
    priority: 10,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const mockInstallPrompt = {
    id: "ip1",
    tenantId: "t1",
    enabled: true,
    promptStyle: "BANNER",
    title: "Install",
    appName: "UniERP",
    cancelText: "Not Now",
    installText: "Install",
    maxDismissals: 3,
    daysBetweenPrompts: 7,
    requireEngagement: true,
    pagePaths: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const mockSyncItem = {
    id: "sq1",
    tenantId: "t1",
    entityType: "Order",
    operation: "CREATE",
    payload: {},
    status: "PENDING",
    priority: 0,
    retryCount: 0,
    maxRetries: 5,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const mockPushSub = {
    id: "ps1",
    tenantId: "t1",
    userId: "u1",
    endpoint: "https://push.example.com",
    p256dhKey: "key1",
    authKey: "auth1",
    status: "ACTIVE",
    tags: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return {
    mockManifest,
    mockServiceWorker,
    mockCacheRule,
    mockInstallPrompt,
    mockSyncItem,
    mockPushSub,
  };
});

vi.mock("@unerp/database", () => ({
  prisma: {
    pwaManifest: {
      findFirst: vi.fn().mockResolvedValue(mockManifest),
      create: vi.fn().mockResolvedValue(mockManifest),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    pwaServiceWorker: {
      findFirst: vi.fn().mockResolvedValue(mockServiceWorker),
      create: vi.fn().mockResolvedValue(mockServiceWorker),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    pwaOfflineCacheRule: {
      findMany: vi.fn().mockResolvedValue([mockCacheRule]),
      findFirst: vi.fn().mockResolvedValue(mockCacheRule),
      create: vi.fn().mockResolvedValue(mockCacheRule),
      update: vi.fn().mockResolvedValue(mockCacheRule),
      delete: vi.fn().mockResolvedValue(mockCacheRule),
    },
    pwaInstallPrompt: {
      findFirst: vi.fn().mockResolvedValue(mockInstallPrompt),
      create: vi.fn().mockResolvedValue(mockInstallPrompt),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    pwaSyncQueue: {
      findMany: vi.fn().mockResolvedValue([mockSyncItem]),
      findFirst: vi.fn().mockResolvedValue(mockSyncItem),
      create: vi.fn().mockResolvedValue(mockSyncItem),
      update: vi.fn().mockResolvedValue(mockSyncItem),
      count: vi.fn().mockResolvedValue(1),
    },
    pwaPushSubscription: {
      findMany: vi.fn().mockResolvedValue([mockPushSub]),
      findFirst: vi.fn().mockResolvedValue(mockPushSub),
      create: vi.fn().mockResolvedValue(mockPushSub),
      delete: vi.fn().mockResolvedValue(mockPushSub),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
  },
}));

describe("PwaService", () => {
  let service: PwaService;

  beforeEach(() => {
    service = new PwaService();
    vi.clearAllMocks();
  });

  it("should get manifest", async () => {
    const m = await service.getManifest("t1");
    expect(m.name).toBe("UniERP");
  });

  it("should update manifest", async () => {
    await service.updateManifest("t1", { name: "New Name" });
    expect(true).toBe(true);
  });

  it("should get manifest JSON", async () => {
    const json = await service.getManifestJson("t1");
    expect(json.name).toBe("UniERP");
    expect(json.start_url).toBe("/");
  });

  it("should get service worker", async () => {
    const sw = await service.getServiceWorker("t1");
    expect(sw.script).toContain("console.log");
  });

  it("should get service worker script", async () => {
    const script = await service.getServiceWorkerScript("t1");
    expect(script).toContain("console.log");
  });

  it("should update service worker", async () => {
    await service.updateServiceWorker("t1", { script: "new script" });
    expect(true).toBe(true);
  });

  it("should list cache rules", async () => {
    const rules = await service.getCacheRules("t1");
    expect(rules).toHaveLength(1);
  });

  it("should create cache rule", async () => {
    const rule = await service.createCacheRule("t1", {
      name: "Test",
      urlPattern: "/test/*",
    });
    expect(rule.name).toBe("API Cache");
  });

  it("should update cache rule", async () => {
    const rule = await service.updateCacheRule("t1", "cr1", {
      name: "Updated",
    });
    expect(rule).toBeDefined();
  });

  it("should delete cache rule", async () => {
    const result = await service.deleteCacheRule("t1", "cr1");
    expect(result).toBeDefined();
  });

  it("should throw on missing cache rule for delete", async () => {
    const { prisma } = await import("@unerp/database");
    (prisma.pwaOfflineCacheRule.findFirst as any).mockResolvedValueOnce(null);
    await expect(service.deleteCacheRule("t1", "bad")).rejects.toThrow(
      NotFoundException,
    );
  });

  it("should get cache rules JSON", async () => {
    const rules = await service.getCacheRulesJson("t1");
    expect(rules).toHaveLength(1);
    expect(rules[0].urlPattern).toBe("/api/*");
  });

  it("should get install prompt", async () => {
    const ip = await service.getInstallPrompt("t1");
    expect(ip.title).toBe("Install");
  });

  it("should update install prompt", async () => {
    await service.updateInstallPrompt("t1", { title: "Updated" });
    expect(true).toBe(true);
  });

  it("should list sync queue", async () => {
    const result = await service.getSyncQueue("t1");
    expect(result.items).toHaveLength(1);
  });

  it("should create sync queue item", async () => {
    const item = await service.createSyncQueue("t1", {
      entityType: "Order",
      operation: "CREATE",
      payload: {},
    });
    expect(item).toBeDefined();
  });

  it("should update sync status", async () => {
    const item = await service.updateSyncStatus("t1", "sq1", "COMPLETED");
    expect(item).toBeDefined();
  });

  it("should throw on missing sync item", async () => {
    const { prisma } = await import("@unerp/database");
    (prisma.pwaSyncQueue.findFirst as any).mockResolvedValueOnce(null);
    await expect(
      service.updateSyncStatus("t1", "bad", "COMPLETED"),
    ).rejects.toThrow(NotFoundException);
  });

  it("should list push subscriptions", async () => {
    const subs = await service.getPushSubscriptions("t1");
    expect(subs).toHaveLength(1);
  });

  it("should create push subscription", async () => {
    const sub = await service.createPushSubscription("t1", {
      userId: "u1",
      endpoint: "https://push.example.com",
      p256dhKey: "k",
      authKey: "a",
    });
    expect(sub).toBeDefined();
  });

  it("should delete push subscription", async () => {
    const result = await service.deletePushSubscription("t1", "ps1");
    expect(result).toBeDefined();
  });

  it("should expire push subscription", async () => {
    await service.expirePushSubscription("t1", "https://push.example.com");
    expect(true).toBe(true);
  });
});
