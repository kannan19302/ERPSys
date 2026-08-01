import { z } from "zod";

export const createAnnotationSchema = z.object({
  documentId: z.string().min(1),
  versionId: z.string().optional(),
  pageNumber: z.number().int().positive().default(1),
  x: z.number().default(0),
  y: z.number().default(0),
  width: z.number().default(0),
  height: z.number().default(0),
  type: z
    .enum([
      "HIGHLIGHT",
      "COMMENT",
      "STRIKETHROUGH",
      "UNDERLINE",
      "DRAWING",
      "STICKY_NOTE",
    ])
    .default("HIGHLIGHT"),
  content: z.string().optional(),
  color: z.string().optional(),
});

export const updateAnnotationSchema = z.object({
  x: z.number().optional(),
  y: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  content: z.string().optional(),
  color: z.string().optional(),
});

export const createCommentSchema = z.object({
  documentId: z.string().min(1),
  parentId: z.string().optional(),
  content: z.string().min(1),
});

export const updateCommentSchema = z.object({
  content: z.string().min(1).optional(),
  resolved: z.boolean().optional(),
});

export const createTagSchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().optional(),
});

export const updateTagSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  color: z.string().optional(),
});

export const assignTagsSchema = z.object({
  tagIds: z.array(z.string().min(1)),
});

export const lockDocumentSchema = z.object({
  reason: z.string().optional(),
});

export const initiateWorkflowSchema = z.object({
  workflowId: z.string().min(1),
});

export const updateWorkflowStatusSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  comment: z.string().optional(),
});

export const exportDocumentSchema = z.object({
  format: z.enum(["PDF", "DOCX", "TXT", "CSV"]).default("PDF"),
});

export const createSmartCollectionSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  query: z.record(z.any()).default({}),
  icon: z.string().optional(),
  color: z.string().optional(),
});

export const updateSmartCollectionSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  query: z.record(z.any()).optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
});

export const watermarkDocumentSchema = z.object({
  text: z.string().min(1),
  opacity: z.number().min(0).max(1).default(0.3),
  position: z
    .enum([
      "CENTER",
      "TOP_LEFT",
      "TOP_RIGHT",
      "BOTTOM_LEFT",
      "BOTTOM_RIGHT",
      "TILED",
    ])
    .default("CENTER"),
  rotation: z.number().default(-45),
  fontSize: z.number().int().positive().default(48),
  color: z.string().default("#000000"),
});

export const mergeDocumentsSchema = z.object({
  documentIds: z.array(z.string().min(1)).min(2),
  outputName: z.string().min(1),
});

export const splitDocumentSchema = z.object({
  pageRanges: z
    .array(
      z.object({
        name: z.string().min(1),
        startPage: z.number().int().positive(),
        endPage: z.number().int().positive(),
      }),
    )
    .min(1),
});

export const batchOperationSchema = z.object({
  documentIds: z.array(z.string().min(1)).min(1),
  operation: z.enum([
    "DELETE",
    "RESTORE",
    "ARCHIVE",
    "EXPORT",
    "TAG",
    "LOCK",
    "UNLOCK",
    "WATERMARK",
  ]),
  params: z.record(z.any()).optional(),
});
