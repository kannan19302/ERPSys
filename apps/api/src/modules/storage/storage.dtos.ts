// @ts-nocheck
import { z } from "zod";

export const createFolderSchema = z.object({
  name: z.string().min(1).max(255),
  parentId: z.string().optional(),
});

export const updateFolderSchema = z.object({
  name: z.string().min(1).max(255).optional(),
});

export const registerFileSchema = z.object({
  name: z.string().min(1).max(255),
  folderId: z.string().optional(),
  bucket: z.string().min(1),
  fileKey: z.string().min(1),
  size: z.number().int().nonnegative(),
  mimeType: z.string().min(1),
});

export const createShareLinkSchema = z.object({
  fileId: z.string().min(1),
  permission: z.enum(["VIEW", "EDIT"]).default("VIEW"),
  expiresInHours: z.number().int().positive().optional(),
  maxDownloads: z.number().int().positive().optional(),
});

export const updateQuotaSchema = z.object({
  storageLimit: z.number().int().positive().optional(),
});

export const generateDocumentSchema = z.object({
  documentId: z.string().min(1),
  templateId: z.string().min(1),
  format: z.string().default("PDF"),
});

export const lifecyclePolicySchema = z.object({
  glacierAfterDays: z.number().int().nonnegative(),
  purgeAfterDays: z.number().int().nonnegative(),
});

export interface CreateFolderInput {
  name: string;
  parentId?: string;
}
export interface UpdateFolderInput {
  name?: string;
}
export interface RegisterFileInput {
  name: string;
  folderId?: string;
  bucket: string;
  fileKey: string;
  size: number;
  mimeType: string;
}
export interface CreateShareLinkInput {
  fileId: string;
  permission?: "VIEW" | "EDIT";
  expiresInHours?: number;
  maxDownloads?: number;
}
export interface UpdateQuotaInput {
  storageLimit?: number;
}
export interface GenerateDocumentInput {
  documentId: string;
  templateId: string;
  format?: string;
}
export interface LifecyclePolicyInput {
  glacierAfterDays: number;
  purgeAfterDays: number;
}
