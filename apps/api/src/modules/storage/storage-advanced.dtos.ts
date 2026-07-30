// @ts-nocheck
import { z } from "zod";

export const encryptFileSchema = z.object({
  fileId: z.string().min(1),
  algorithm: z
    .enum(["AES-256-GCM", "AES-256-CBC", "CHACHA20"])
    .default("AES-256-GCM"),
});

export const decryptFileSchema = z.object({
  fileId: z.string().min(1),
});

export const createReplicationSchema = z.object({
  fileId: z.string().min(1),
  targetBucket: z.string().min(1),
  targetRegion: z.string().optional(),
});

export const createBackupSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(["FULL", "INCREMENTAL", "DIFFERENTIAL"]).default("FULL"),
});

export const restoreBackupSchema = z.object({
  backupId: z.string().min(1),
  targetBucket: z.string().optional(),
});

export const createAlertSchema = z.object({
  name: z.string().min(1),
  metric: z.enum(["storage_used", "file_count", "bandwidth", "error_rate"]),
  condition: z.enum(["gt", "lt", "gte", "lte", "eq"]),
  threshold: z.number(),
  enabled: z.boolean().default(true),
});

export const updateAlertSchema = z.object({
  name: z.string().optional(),
  metric: z
    .enum(["storage_used", "file_count", "bandwidth", "error_rate"])
    .optional(),
  condition: z.enum(["gt", "lt", "gte", "lte", "eq"]).optional(),
  threshold: z.number().optional(),
  enabled: z.boolean().optional(),
});

export const createMigrationSchema = z.object({
  name: z.string().min(1),
  sourceProvider: z.string().min(1),
  targetProvider: z.string().min(1),
});

export const compressFileSchema = z.object({
  fileId: z.string().min(1),
  algorithm: z.enum(["GZIP", "BROTLI", "ZSTD"]).default("GZIP"),
});

export const decompressFileSchema = z.object({
  fileId: z.string().min(1),
});

export const analyzeDeduplicationSchema = z.object({
  fileIds: z.array(z.string().min(1)).optional(),
});

export const createSnapshotSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(["MANUAL", "SCHEDULED", "AUTOMATIC"]).default("MANUAL"),
});

export const restoreSnapshotSchema = z.object({
  snapshotId: z.string().min(1),
});

export const createRetentionPolicySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  retentionDays: z.number().int().positive(),
  action: z.enum(["DELETE", "ARCHIVE", "GLACIER"]).default("DELETE"),
  fileTypes: z.array(z.string()).optional(),
  enabled: z.boolean().default(true),
});

export const updateRetentionPolicySchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  retentionDays: z.number().int().positive().optional(),
  action: z.enum(["DELETE", "ARCHIVE", "GLACIER"]).optional(),
  fileTypes: z.array(z.string()).optional(),
  enabled: z.boolean().optional(),
});

export const createSyncSchema = z.object({
  name: z.string().min(1),
  sourceProvider: z.string().min(1),
  targetProvider: z.string().min(1),
  syncDirection: z
    .enum(["PUSH", "PULL", "BIDIRECTIONAL"])
    .default("BIDIRECTIONAL"),
  schedule: z.string().optional(),
});

export const updateSyncSchema = z.object({
  name: z.string().optional(),
  syncDirection: z.enum(["PUSH", "PULL", "BIDIRECTIONAL"]).optional(),
  schedule: z.string().optional(),
  status: z.enum(["ACTIVE", "PAUSED"]).optional(),
});

export const clearCacheSchema = z.object({
  fileId: z.string().optional(),
  cacheType: z.enum(["THUMBNAIL", "PREVIEW", "METADATA", "CONTENT"]).optional(),
});
