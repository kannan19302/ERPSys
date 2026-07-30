// @ts-nocheck
import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";
import type {
  UpdateManifestDto,
  UpdateServiceWorkerDto,
  CreateCacheRuleDto,
  UpdateCacheRuleDto,
  UpdateInstallPromptDto,
  CreateSyncQueueDto,
  CreatePushSubscriptionDto,
} from "@unerp/shared";

@Injectable()
export class PwaService {
  // Manifest
  async getManifest(tenantId: string) {
    let manifest = await prisma.pwaManifest.findFirst({ where: { tenantId } });
    if (!manifest) {
      manifest = await prisma.pwaManifest.create({
        data: {
          tenantId,
          name: "UniERP",
          shortName: "UniERP",
          startUrl: "/",
          display: "standalone",
          themeColor: "#0f172a",
          backgroundColor: "#ffffff",
        },
      });
    }
    return manifest;
  }

  async updateManifest(tenantId: string, dto: UpdateManifestDto) {
    await this.getManifest(tenantId);
    return prisma.pwaManifest.updateMany({ where: { tenantId }, data: dto });
  }

  async getManifestJson(tenantId: string) {
    const m = await this.getManifest(tenantId);
    return {
      name: m.name,
      short_name: m.shortName,
      description: m.description,
      start_url: m.startUrl,
      display: m.display,
      orientation: m.orientation,
      theme_color: m.themeColor,
      background_color: m.backgroundColor,
      icons: [
        {
          src: m.iconUrl || "/icons/icon-192.png",
          sizes: "192x192",
          type: "image/png",
        },
        {
          src: m.icon512Url || "/icons/icon-512.png",
          sizes: "512x512",
          type: "image/png",
        },
      ],
      lang: m.lang,
      dir: m.dir,
      scope: m.scope,
      categories: m.categories,
      screenshots: m.screenshots,
      shortcuts: m.shortcuts,
      prefer_related_applications: m.preferRelatedApplications,
      related_applications: m.relatedApplications,
    };
  }

  // Service Worker
  async getServiceWorker(tenantId: string) {
    let sw = await prisma.pwaServiceWorker.findFirst({ where: { tenantId } });
    if (!sw) {
      const defaultScript = `self.addEventListener('install', e => { self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(clients.claim()); });
self.addEventListener('fetch', e => { e.respondWith(fetch(e.request)); });`;
      sw = await prisma.pwaServiceWorker.create({
        data: {
          tenantId,
          name: "sw.js",
          script: defaultScript,
          version: "1.0.0",
        },
      });
    }
    return sw;
  }

  async updateServiceWorker(tenantId: string, dto: UpdateServiceWorkerDto) {
    await this.getServiceWorker(tenantId);
    return prisma.pwaServiceWorker.updateMany({
      where: { tenantId },
      data: dto,
    });
  }

  async getServiceWorkerScript(tenantId: string) {
    const sw = await this.getServiceWorker(tenantId);
    return sw.script;
  }

  // Cache Rules
  async getCacheRules(tenantId: string) {
    return prisma.pwaOfflineCacheRule.findMany({
      where: { tenantId },
      orderBy: { priority: "desc" },
    });
  }

  async createCacheRule(tenantId: string, dto: CreateCacheRuleDto) {
    return prisma.pwaOfflineCacheRule.create({ data: { ...dto, tenantId } });
  }

  async updateCacheRule(tenantId: string, id: string, dto: UpdateCacheRuleDto) {
    const rule = await prisma.pwaOfflineCacheRule.findFirst({
      where: { id, tenantId },
    });
    if (!rule) throw new NotFoundException("Cache rule not found");
    return prisma.pwaOfflineCacheRule.update({ where: { id }, data: dto });
  }

  async deleteCacheRule(tenantId: string, id: string) {
    const rule = await prisma.pwaOfflineCacheRule.findFirst({
      where: { id, tenantId },
    });
    if (!rule) throw new NotFoundException("Cache rule not found");
    return prisma.pwaOfflineCacheRule.delete({ where: { id } });
  }

  async getCacheRulesJson(tenantId: string) {
    const rules = await this.getCacheRules(tenantId);
    return rules
      .filter((r) => r.isActive)
      .map((r) => ({
        urlPattern: r.urlPattern,
        cacheStrategy: r.cacheStrategy,
        maxAgeSeconds: r.maxAgeSeconds,
        maxEntries: r.maxEntries,
        compression: r.compression,
        method: r.method,
      }));
  }

  // Install Prompt
  async getInstallPrompt(tenantId: string) {
    let prompt = await prisma.pwaInstallPrompt.findFirst({
      where: { tenantId },
    });
    if (!prompt) {
      prompt = await prisma.pwaInstallPrompt.create({
        data: {
          tenantId,
          appName: "UniERP",
          title: "Install UniERP",
          description: "Install this app on your device for offline access",
          enabled: true,
          promptStyle: "BANNER",
        },
      });
    }
    return prompt;
  }

  async updateInstallPrompt(tenantId: string, dto: UpdateInstallPromptDto) {
    await this.getInstallPrompt(tenantId);
    return prisma.pwaInstallPrompt.updateMany({
      where: { tenantId },
      data: dto,
    });
  }

  // Sync Queue
  async getSyncQueue(tenantId: string, status?: string, page = 1, limit = 20) {
    const where: any = { tenantId };
    if (status) where.status = status;
    const [items, total] = await Promise.all([
      prisma.pwaSyncQueue.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.pwaSyncQueue.count({ where }),
    ]);
    return { items, total, page, limit };
  }

  async createSyncQueue(tenantId: string, dto: CreateSyncQueueDto) {
    // dto's `payload` is typed as plain Record<string, unknown> in
    // @unerp/shared, which doesn't structurally match Prisma's JSON input
    // type — the shapes agree at runtime, only the JSON typing disagrees.
    return prisma.pwaSyncQueue.create({ data: { ...dto, tenantId } as any });
  }

  async updateSyncStatus(
    tenantId: string,
    id: string,
    status: string,
    errorMessage?: string,
  ) {
    const item = await prisma.pwaSyncQueue.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("Sync item not found");
    const data: any = { status };
    if (status === "COMPLETED" || status === "CONFLICT")
      data.syncedAt = new Date();
    if (errorMessage) data.lastError = errorMessage;
    if (status === "FAILED") data.retryCount = item.retryCount + 1;
    return prisma.pwaSyncQueue.update({ where: { id }, data });
  }

  // Push Subscriptions
  async getPushSubscriptions(tenantId: string, userId?: string) {
    const where: any = { tenantId };
    if (userId) where.userId = userId;
    return prisma.pwaPushSubscription.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
  }

  async createPushSubscription(
    tenantId: string,
    dto: CreatePushSubscriptionDto,
  ) {
    return prisma.pwaPushSubscription.create({ data: { ...dto, tenantId } });
  }

  async deletePushSubscription(tenantId: string, id: string) {
    const sub = await prisma.pwaPushSubscription.findFirst({
      where: { id, tenantId },
    });
    if (!sub) throw new NotFoundException("Push subscription not found");
    return prisma.pwaPushSubscription.delete({ where: { id } });
  }

  async expirePushSubscription(tenantId: string, endpoint: string) {
    return prisma.pwaPushSubscription.updateMany({
      where: { tenantId, endpoint },
      data: { status: "EXPIRED" },
    });
  }
}
