import { z } from 'zod';

// ── Builder Field ──
export const builderFieldSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  label: z.string().optional(),
  type: z.string(),
  required: z.boolean().optional(),
  options: z.string().optional(),
  inListView: z.boolean().optional(),
  regexPattern: z.string().optional(),
  readOnly: z.boolean().optional(),
  readRoles: z.string().optional(),
  writeRoles: z.string().optional(),
  defaultValue: z.unknown().optional(),
  formula: z.string().optional(),
});
export type BuilderFieldInput = z.infer<typeof builderFieldSchema>;

// ── AI Generate ──
export const builderAiGenerateSchema = z.object({
  prompt: z.string().min(1),
});
export type BuilderAiGenerateInput = z.infer<typeof builderAiGenerateSchema>;

// ── Analytics Event ──
export const builderAnalyticsEventSchema = z.object({
  event: z.string().min(1),
  entityId: z.string().optional(),
  entityType: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});
export type BuilderAnalyticsEventInput = z.infer<typeof builderAnalyticsEventSchema>;

// ── Builder Form ──
export const createBuilderFormSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  icon: z.string().optional(),
  module: z.string().optional(),
  status: z.string().optional(),
  fields: z.array(builderFieldSchema).optional(),
  settings: z.record(z.unknown()).optional(),
});
export type CreateBuilderFormInput = z.infer<typeof createBuilderFormSchema>;

export const updateBuilderFormSchema = createBuilderFormSchema.partial();
export type UpdateBuilderFormInput = z.infer<typeof updateBuilderFormSchema>;

// ── Schema Registry ──
export const createSchemaRegistrySchema = z.object({
  module: z.string().min(1),
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  fields: z.array(z.unknown()).default([]),
  settings: z.record(z.unknown()).optional(),
  status: z.string().optional(),
});
export type CreateSchemaRegistryInput = z.infer<typeof createSchemaRegistrySchema>;

export const updateSchemaRegistrySchema = createSchemaRegistrySchema.partial();
export type UpdateSchemaRegistryInput = z.infer<typeof updateSchemaRegistrySchema>;

// ── Page Registry ──
export const createPageRegistrySchema = z.object({
  schemaId: z.string().optional(),
  module: z.string().min(1),
  slug: z.string().min(1),
  title: z.string().min(1),
  type: z.string().optional(),
  layout: z.unknown().optional(),
  status: z.string().optional(),
  submodule: z.string().optional(),
  navIcon: z.string().optional(),
  sortOrder: z.number().optional(),
  isCustom: z.boolean().optional(),
});
export type CreatePageRegistryInput = z.infer<typeof createPageRegistrySchema>;

export const updatePageRegistrySchema = createPageRegistrySchema.partial();
export type UpdatePageRegistryInput = z.infer<typeof updatePageRegistrySchema>;

export const restorePageRegistryHistorySchema = z.object({
  historyIndex: z.number().int().nonnegative(),
});
export type RestorePageRegistryHistoryInput = z.infer<typeof restorePageRegistryHistorySchema>;

// ── Data Import ──
export const createDataImportSchema = z.object({
  name: z.string().min(1),
  targetModel: z.enum(['customer', 'vendor', 'product', 'employee', 'warehouse']),
  fileName: z.string().min(1),
  fileSize: z.number().nonnegative(),
  totalRows: z.number().int().nonnegative(),
  columnMapping: z.record(z.string()).optional(),
});
export type CreateDataImportInput = z.infer<typeof createDataImportSchema>;

export const executeDataImportSchema = z.object({
  rows: z.array(z.record(z.unknown())).default([]),
});
export type ExecuteDataImportInput = z.infer<typeof executeDataImportSchema>;

// ── Custom Record Data ──
export const customRecordDataSchema = z.record(z.unknown());
export type CustomRecordDataInput = z.infer<typeof customRecordDataSchema>;

// ── Web Collection ──
export const createWebCollectionSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  singular: z.string().optional(),
  description: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  kind: z.string().optional(),
  fields: z.array(z.unknown()).optional(),
  settings: z.record(z.unknown()).optional(),
  status: z.string().optional(),
});
export type CreateWebCollectionInput = z.infer<typeof createWebCollectionSchema>;

export const updateWebCollectionSchema = createWebCollectionSchema.partial();
export type UpdateWebCollectionInput = z.infer<typeof updateWebCollectionSchema>;

// ── Web Collection Item ──
export const createWebCollectionItemSchema = z.object({
  slug: z.string().optional(),
  data: z.record(z.unknown()).optional(),
  status: z.string().optional(),
  featured: z.boolean().optional(),
  sortOrder: z.number().optional(),
});
export type CreateWebCollectionItemInput = z.infer<typeof createWebCollectionItemSchema>;

export const updateWebCollectionItemSchema = createWebCollectionItemSchema.partial();
export type UpdateWebCollectionItemInput = z.infer<typeof updateWebCollectionItemSchema>;

export const seedWebCollectionSchema = z.object({
  preset: z.string().min(1),
});
export type SeedWebCollectionInput = z.infer<typeof seedWebCollectionSchema>;

// ── Web Form Submission ──
export const createWebFormSubmissionSchema = z.object({
  formName: z.string().min(1),
  pageSlug: z.string().optional(),
  data: z.record(z.unknown()).default({}),
  meta: z.record(z.unknown()).optional(),
});
export type CreateWebFormSubmissionInput = z.infer<typeof createWebFormSubmissionSchema>;

// ── Web Checkout ──
export const webCheckoutSchema = z.object({
  items: z.array(z.object({
    price: z.number().nonnegative(),
    qty: z.number().int().positive(),
    name: z.string().optional(),
    sku: z.string().optional(),
  })).optional(),
  customer: z.record(z.unknown()),
  currency: z.string().optional(),
  notes: z.string().optional(),
});
export type WebCheckoutInput = z.infer<typeof webCheckoutSchema>;

// ── App Component / Page / Data Model (Custom App Builder) ──
export const addAppComponentSchema = z.object({
  type: z.string().min(1),
  refId: z.string().min(1),
  name: z.string().min(1),
});
export type AddAppComponentInput = z.infer<typeof addAppComponentSchema>;

export const addAppPageSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  type: z.string().min(1),
  formId: z.string().nullable().optional(),
  dashboardId: z.string().nullable().optional(),
  layout: z.array(z.unknown()).optional(),
});
export type AddAppPageInput = z.infer<typeof addAppPageSchema>;

export const updateAppPageSchema = addAppPageSchema.partial();
export type UpdateAppPageInput = z.infer<typeof updateAppPageSchema>;

export const addAppDataModelSchema = z.object({
  name: z.string().min(1),
  fields: z.array(z.unknown()).default([]),
  relationships: z.array(z.unknown()).optional(),
});
export type AddAppDataModelInput = z.infer<typeof addAppDataModelSchema>;

// ── Module Publish / Rollback / Install ──
export const publishModuleSchema = z.object({
  scope: z.string().min(1),
  version: z.string().optional(),
  bump: z.enum(['major', 'minor', 'patch']).optional(),
  changelog: z.string().optional(),
  category: z.string().optional(),
  longDescription: z.string().optional(),
  publisher: z.string().optional(),
  screenshots: z.array(z.string()).optional(),
});
export type PublishModuleInput = z.infer<typeof publishModuleSchema>;

export const rollbackModuleSchema = z.object({
  releaseId: z.string().min(1),
});
export type RollbackModuleInput = z.infer<typeof rollbackModuleSchema>;

export const installBuilderAppSchema = z.object({
  moduleId: z.string().min(1),
  releaseId: z.string().optional(),
});
export type InstallBuilderAppInput = z.infer<typeof installBuilderAppSchema>;

// ── Builder Workflow ──
export const createBuilderWorkflowSchema = z.object({
  name: z.string().min(1),
  trigger: z.string().optional(),
  nodes: z.array(z.unknown()).optional(),
  edges: z.array(z.unknown()).optional(),
  settings: z.record(z.unknown()).optional(),
  status: z.string().optional(),
});
export type CreateBuilderWorkflowInput = z.infer<typeof createBuilderWorkflowSchema>;

export const updateBuilderWorkflowSchema = createBuilderWorkflowSchema.partial();
export type UpdateBuilderWorkflowInput = z.infer<typeof updateBuilderWorkflowSchema>;

// ── Builder Dashboard ──
export const createBuilderDashboardSchema = z.object({
  name: z.string().min(1),
  widgets: z.array(z.unknown()).optional(),
  layout: z.unknown().optional(),
  refreshRate: z.number().optional(),
  status: z.string().optional(),
});
export type CreateBuilderDashboardInput = z.infer<typeof createBuilderDashboardSchema>;

export const updateBuilderDashboardSchema = createBuilderDashboardSchema.partial();
export type UpdateBuilderDashboardInput = z.infer<typeof updateBuilderDashboardSchema>;

// ── Builder Module ──
export const createBuilderModuleSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  scope: z.string().optional(),
});
export type CreateBuilderModuleInput = z.infer<typeof createBuilderModuleSchema>;

export const updateBuilderModuleSchema = createBuilderModuleSchema.partial();
export type UpdateBuilderModuleInput = z.infer<typeof updateBuilderModuleSchema>;

// ── Automation Rule ──
export const createAutomationRuleSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  trigger: z.string().min(1),
  triggerConfig: z.unknown().optional(),
  conditions: z.array(z.unknown()).optional(),
  actions: z.array(z.unknown()).optional(),
  settings: z.record(z.unknown()).optional(),
});
export type CreateAutomationRuleInput = z.infer<typeof createAutomationRuleSchema>;

export const updateAutomationRuleSchema = createAutomationRuleSchema.partial();
export type UpdateAutomationRuleInput = z.infer<typeof updateAutomationRuleSchema>;

// ── Web Page ──
export const createWebPageSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  type: z.string().optional(),
  content: z.unknown().optional(),
  status: z.string().optional(),
  seo: z.record(z.unknown()).optional(),
});
export type CreateWebPageInput = z.infer<typeof createWebPageSchema>;

export const updateWebPageSchema = createWebPageSchema.partial();
export type UpdateWebPageInput = z.infer<typeof updateWebPageSchema>;

// ── Blog Post ──
export const createBlogPostSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  content: z.unknown().optional(),
  excerpt: z.string().optional(),
  author: z.string().optional(),
  status: z.string().optional(),
  tags: z.array(z.string()).optional(),
  featuredImage: z.string().optional(),
});
export type CreateBlogPostInput = z.infer<typeof createBlogPostSchema>;

export const updateBlogPostSchema = createBlogPostSchema.partial();
export type UpdateBlogPostInput = z.infer<typeof updateBlogPostSchema>;

// ── Web Asset ──
export const createWebAssetSchema = z.object({
  name: z.string().min(1),
  fileUrl: z.string().min(1),
  type: z.string().optional(),
  size: z.number().optional(),
  status: z.string().optional(),
});
export type CreateWebAssetInput = z.infer<typeof createWebAssetSchema>;

export const updateWebAssetSchema = createWebAssetSchema.partial();
export type UpdateWebAssetInput = z.infer<typeof updateWebAssetSchema>;

// ── Web Template ──
export const createWebTemplateSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  content: z.unknown().optional(),
  type: z.string().optional(),
  status: z.string().optional(),
});
export type CreateWebTemplateInput = z.infer<typeof createWebTemplateSchema>;

export const updateWebTemplateSchema = createWebTemplateSchema.partial();
export type UpdateWebTemplateInput = z.infer<typeof updateWebTemplateSchema>;

// ── Web Menu ──
export const createWebMenuSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  items: z.array(z.unknown()).optional(),
  location: z.string().optional(),
  status: z.string().optional(),
});
export type CreateWebMenuInput = z.infer<typeof createWebMenuSchema>;

export const updateWebMenuSchema = createWebMenuSchema.partial();
export type UpdateWebMenuInput = z.infer<typeof updateWebMenuSchema>;

// ── Web SEO ──
export const createWebSeoSchema = z.object({
  pageSlug: z.string().min(1),
  title: z.string().optional(),
  description: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  ogImage: z.string().optional(),
  status: z.string().optional(),
});
export type CreateWebSeoInput = z.infer<typeof createWebSeoSchema>;

export const updateWebSeoSchema = createWebSeoSchema.partial();
export type UpdateWebSeoInput = z.infer<typeof updateWebSeoSchema>;
