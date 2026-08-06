import { z } from "zod";

export const CacheStrategyEnum = z.enum([
  "CACHE_FIRST",
  "NETWORK_FIRST",
  "STALE_WHILE_REVALIDATE",
  "NETWORK_ONLY",
  "CACHE_ONLY",
]);
export const PrompStyleEnum = z.enum([
  "BANNER",
  "DIALOG",
  "MINI_INFO_BAR",
  "NONE",
]);
export const SyncStatusEnum = z.enum([
  "PENDING",
  "SYNCING",
  "COMPLETED",
  "FAILED",
  "CONFLICT",
]);

export const UpdateManifestSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  shortName: z.string().min(1).max(30).optional(),
  description: z.string().optional(),
  startUrl: z.string().optional(),
  display: z
    .enum(["fullscreen", "standalone", "minimal-ui", "browser"])
    .optional(),
  orientation: z.enum(["any", "natural", "portrait", "landscape"]).optional(),
  themeColor: z.string().optional(),
  backgroundColor: z.string().optional(),
  iconUrl: z.string().url().optional(),
  icon512Url: z.string().url().optional(),
  splashIconUrl: z.string().url().optional(),
  maskableIconUrl: z.string().url().optional(),
  lang: z.string().optional(),
  scope: z.string().optional(),
  categories: z.array(z.string()).optional(),
  screenshots: z
    .array(z.object({ src: z.string(), sizes: z.string(), type: z.string() }))
    .optional(),
  shortcuts: z
    .array(
      z.object({
        name: z.string(),
        url: z.string(),
        description: z.string().optional(),
        icons: z
          .array(z.object({ src: z.string(), sizes: z.string() }))
          .optional(),
      }),
    )
    .optional(),
  version: z.string().optional(),
});

export const UpdateServiceWorkerSchema = z.object({
  name: z.string().optional(),
  script: z.string().optional(),
  version: z.string().optional(),
  cacheStrategy: CacheStrategyEnum.optional(),
  precacheUrls: z.array(z.string()).optional(),
  runtimeCacheRules: z
    .array(
      z.object({
        urlPattern: z.string(),
        strategy: CacheStrategyEnum,
        maxAgeSeconds: z.number().optional(),
        maxEntries: z.number().optional(),
      }),
    )
    .optional(),
  navigationPreload: z.boolean().optional(),
  pushEnabled: z.boolean().optional(),
  backgroundSync: z.boolean().optional(),
  importScripts: z.array(z.string()).optional(),
});

export const CreateCacheRuleSchema = z.object({
  name: z.string().min(1).max(100),
  urlPattern: z.string().min(1),
  cacheStrategy: CacheStrategyEnum.optional().default("CACHE_FIRST"),
  maxAgeSeconds: z.number().int().positive().optional().default(86400),
  maxEntries: z.number().int().positive().optional().default(100),
  compression: z.boolean().optional().default(false),
  method: z.string().optional().default("GET"),
  priority: z.number().int().optional().default(0),
});

export const UpdateCacheRuleSchema = CreateCacheRuleSchema.partial();

export const UpdateInstallPromptSchema = z.object({
  enabled: z.boolean().optional(),
  promptStyle: PrompStyleEnum.optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  appName: z.string().optional(),
  iconUrl: z.string().url().optional(),
  cancelText: z.string().optional(),
  installText: z.string().optional(),
  maxDismissals: z.number().int().positive().optional(),
  daysBetweenPrompts: z.number().int().positive().optional(),
  requireEngagement: z.boolean().optional(),
  pagePaths: z.array(z.string()).optional(),
});

export const CreateSyncQueueSchema = z.object({
  clientId: z.string().optional(),
  entityType: z.string().min(1),
  entityId: z.string().optional(),
  operation: z.enum(["CREATE", "UPDATE", "DELETE"]),
  payload: z.record(z.unknown()),
  priority: z.number().int().optional().default(0),
});

export const CreatePushSubscriptionSchema = z.object({
  userId: z.string().min(1),
  endpoint: z.string().url(),
  p256dhKey: z.string().min(1),
  authKey: z.string().min(1),
  userAgent: z.string().optional(),
  deviceType: z.enum(["mobile", "desktop", "tablet"]).optional(),
  browser: z.string().optional(),
  platform: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export type UpdateManifestDto = z.infer<typeof UpdateManifestSchema>;
export type UpdateServiceWorkerDto = z.infer<typeof UpdateServiceWorkerSchema>;
export type CreateCacheRuleDto = z.infer<typeof CreateCacheRuleSchema>;
export type UpdateCacheRuleDto = z.infer<typeof UpdateCacheRuleSchema>;
export type UpdateInstallPromptDto = z.infer<typeof UpdateInstallPromptSchema>;
export type CreateSyncQueueDto = z.infer<typeof CreateSyncQueueSchema>;
export type CreatePushSubscriptionDto = z.infer<
  typeof CreatePushSubscriptionSchema
>;
