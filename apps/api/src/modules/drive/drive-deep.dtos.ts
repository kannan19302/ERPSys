// @ts-nocheck
import { z } from "zod";

export const shareFolderSchema = z.object({
  sharedWithUserId: z.string().min(1),
  permission: z.enum(["VIEW", "EDIT"]).default("VIEW"),
});

export type ShareFolderInput = z.infer<typeof shareFolderSchema>;

export const createTagSchema = z.object({
  name: z.string().min(1),
  color: z.string().default("#6366f1"),
});

export const updateTagSchema = createTagSchema.partial();

export type CreateTagInput = z.infer<typeof createTagSchema>;
export type UpdateTagInput = z.infer<typeof updateTagSchema>;

export const assignTagsSchema = z.object({
  tagIds: z.array(z.string().min(1)),
});

export type AssignTagsInput = z.infer<typeof assignTagsSchema>;

export const generateDownloadLinkSchema = z.object({
  expiresInHours: z.number().int().positive().default(24),
});

export type GenerateDownloadLinkInput = z.infer<typeof generateDownloadLinkSchema>;
