import { z } from 'zod';

// ── Form Templates ──
export const createFormTemplateSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  category: z.string().optional(),
  icon: z.string().optional(),
  status: z.string().optional(),
  fields: z.array(z.unknown()).optional(),
  settings: z.record(z.unknown()).optional(),
});
export type CreateFormTemplateInput = z.infer<typeof createFormTemplateSchema>;

export const updateFormTemplateSchema = createFormTemplateSchema.partial();
export type UpdateFormTemplateInput = z.infer<typeof updateFormTemplateSchema>;

// ── Form Fields ──
export const createFormFieldSchema = z.object({
  templateId: z.string().min(1),
  name: z.string().min(1),
  label: z.string().optional(),
  fieldType: z.string().min(1),
  required: z.boolean().optional(),
  placeholder: z.string().optional(),
  defaultValue: z.unknown().optional(),
  options: z.unknown().optional(),
  validation: z.unknown().optional(),
  uiConfig: z.unknown().optional(),
  sortOrder: z.number().int().optional(),
});
export type CreateFormFieldInput = z.infer<typeof createFormFieldSchema>;

// ── Form Submissions ──
export const createFormSubmissionSchema = z.object({
  templateId: z.string().min(1),
  data: z.record(z.unknown()),
  metadata: z.record(z.unknown()).optional(),
});
export type CreateFormSubmissionInput = z.infer<typeof createFormSubmissionSchema>;

// ── Page Templates ──
export const createPageTemplateSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  category: z.string().optional(),
  layout: z.string().optional(),
  sections: z.array(z.unknown()).optional(),
  themeOverrides: z.record(z.unknown()).optional(),
  seoSettings: z.record(z.unknown()).optional(),
  status: z.string().optional(),
});
export type CreatePageTemplateInput = z.infer<typeof createPageTemplateSchema>;

export const updatePageTemplateSchema = createPageTemplateSchema.partial();
export type UpdatePageTemplateInput = z.infer<typeof updatePageTemplateSchema>;

// ── Workflow Definitions ──
export const createWorkflowDefinitionSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  category: z.string().optional(),
  trigger: z.string().optional(),
  nodes: z.array(z.unknown()).optional(),
  edges: z.array(z.unknown()).optional(),
  settings: z.record(z.unknown()).optional(),
  status: z.string().optional(),
});
export type CreateWorkflowDefinitionInput = z.infer<typeof createWorkflowDefinitionSchema>;

export const updateWorkflowDefinitionSchema = createWorkflowDefinitionSchema.partial();
export type UpdateWorkflowDefinitionInput = z.infer<typeof updateWorkflowDefinitionSchema>;

// ── Workflow Steps ──
export const createWorkflowStepSchema = z.object({
  definitionId: z.string().min(1),
  name: z.string().min(1),
  type: z.string().optional(),
  config: z.unknown().optional(),
  sortOrder: z.number().int().optional(),
});
export type CreateWorkflowStepInput = z.infer<typeof createWorkflowStepSchema>;
