import { z } from "zod";

export const createTemplateSchema = z.object({
  name: z.string().min(1),
  category: z.string().optional(),
  content: z.string().min(1),
  variables: z.array(z.object({
    key: z.string(),
    label: z.string(),
    type: z.enum(["text", "number", "date", "select"]).default("text"),
    options: z.array(z.string()).optional(),
  })).optional(),
});

export const updateTemplateSchema = createTemplateSchema.partial();

export const renderTemplateSchema = z.object({
  templateId: z.string().min(1),
  values: z.record(z.string()),
});

export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;
export type RenderTemplateInput = z.infer<typeof renderTemplateSchema>;

export const createCategorySchema = z.object({
  name: z.string().min(1),
  parentId: z.string().optional(),
  sortOrder: z.number().int().optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

export const bulkUploadSchema = z.object({
  files: z.array(z.object({
    name: z.string().min(1),
    folderId: z.string().optional(),
    content: z.string().optional(),
  })),
});

export type BulkUploadInput = z.infer<typeof bulkUploadSchema>;

export const submitApprovalSchema = z.object({
  approverId: z.string().min(1),
});

export const reviewApprovalSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  comment: z.string().optional(),
});

export type SubmitApprovalInput = z.infer<typeof submitApprovalSchema>;
export type ReviewApprovalInput = z.infer<typeof reviewApprovalSchema>;
