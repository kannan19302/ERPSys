import { z } from 'zod';

// ── Drive Folders ──
export const createDriveFolderSchema = z.object({
  name: z.string().min(1).max(255),
  parentId: z.string().optional(),
  description: z.string().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
});
export type CreateDriveFolderInput = z.infer<typeof createDriveFolderSchema>;

export const updateDriveFolderSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
});
export type UpdateDriveFolderInput = z.infer<typeof updateDriveFolderSchema>;

// ── Drive Files ──
export const createDriveFileSchema = z.object({
  folderId: z.string().optional(),
  name: z.string().min(1),
  mimeType: z.string().min(1),
  size: z.number().int().positive(),
  description: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});
export type CreateDriveFileInput = z.infer<typeof createDriveFileSchema>;

export const updateDriveFileSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  isStarred: z.boolean().optional(),
  metadata: z.record(z.unknown()).optional(),
});
export type UpdateDriveFileInput = z.infer<typeof updateDriveFileSchema>;

// ── Drive File Comments ──
export const createDriveCommentSchema = z.object({
  fileId: z.string().min(1),
  content: z.string().min(1),
  parentId: z.string().optional(),
});
export type CreateDriveCommentInput = z.infer<typeof createDriveCommentSchema>;

export const updateDriveCommentSchema = z.object({
  content: z.string().min(1).optional(),
  resolved: z.boolean().optional(),
});

// ── Drive Share Links ──
export const createDriveShareLinkSchema = z.object({
  fileId: z.string().min(1),
  permission: z.enum(['VIEW', 'EDIT']).optional(),
  password: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
  maxDownloads: z.number().int().positive().optional(),
});
export type CreateDriveShareLinkInput = z.infer<typeof createDriveShareLinkSchema>;

// ── Drive Search ──
export const driveSearchSchema = z.object({
  q: z.string().min(1),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});
export type DriveSearchInput = z.infer<typeof driveSearchSchema>;
