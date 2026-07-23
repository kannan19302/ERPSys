import { z } from 'zod';

export const CreateSaasAppSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  shortDescription: z.string().optional(),
  icon: z.string().optional(),
  banner: z.string().optional(),
  category: z.string().optional(),
  publisher: z.string().optional(),
  website: z.string().optional(),
  docsUrl: z.string().optional(),
  supportUrl: z.string().optional(),
  pricingUrl: z.string().optional(),
  isPublished: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  isFree: z.boolean().default(false),
  price: z.number().default(0),
  setupFee: z.number().default(0),
  billingMode: z.enum(['ONE_TIME', 'MONTHLY', 'YEARLY', 'FREE']).default('ONE_TIME'),
  trialDays: z.number().int().default(0),
  permissions: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  screenshots: z.array(z.object({ url: z.string(), caption: z.string().optional() })).optional(),
});
export type CreateSaasAppDto = z.infer<typeof CreateSaasAppSchema>;

export const CreateSaasAppVersionSchema = z.object({
  appId: z.string(),
  version: z.string(),
  changelog: z.string().optional(),
  minApiVersion: z.string().optional(),
  maxApiVersion: z.string().optional(),
  isPublished: z.boolean().default(false),
  releaseDate: z.string().optional(),
  downloadUrl: z.string().optional(),
  fileSize: z.number().int().optional(),
  checksum: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});
export type CreateSaasAppVersionDto = z.infer<typeof CreateSaasAppVersionSchema>;

export const CreateSaasSubscriptionPlanSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  billingInterval: z.enum(['MONTHLY', 'YEARLY', 'QUARTERLY']).default('MONTHLY'),
  price: z.number(),
  currency: z.string().default('USD'),
  trialDays: z.number().int().default(0),
  sortOrder: z.number().int().default(0),
  isPublic: z.boolean().default(true),
  features: z.record(z.any()).default({}),
  metadata: z.record(z.any()).default({}),
  maxUsers: z.number().int().optional(),
  maxStorage: z.number().int().optional(),
  maxApiCalls: z.number().int().optional(),
});
export type CreateSaasSubscriptionPlanDto = z.infer<typeof CreateSaasSubscriptionPlanSchema>;

export const CreateSaasSubscriptionSchema = z.object({
  planId: z.string(),
  subscribingTenantId: z.string(),
  quantity: z.number().int().default(1),
  billingInterval: z.enum(['MONTHLY', 'YEARLY', 'QUARTERLY']).default('MONTHLY'),
  trialDays: z.number().int().optional(),
  metadata: z.record(z.any()).optional(),
  couponCode: z.string().optional(),
});
export type CreateSaasSubscriptionDto = z.infer<typeof CreateSaasSubscriptionSchema>;

export const CreateSaasUsageMeterSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  unit: z.enum(['COUNT', 'BYTES', 'SECONDS', 'REQUESTS']),
  aggregationType: z.enum(['SUM', 'MAX', 'LAST', 'COUNT']).default('SUM'),
  resetPeriod: z.enum(['MONTHLY', 'YEARLY', 'NEVER']).default('MONTHLY'),
});
export type CreateSaasUsageMeterDto = z.infer<typeof CreateSaasUsageMeterSchema>;

export const RecordSaasUsageSchema = z.object({
  subscriptionId: z.string(),
  meterId: z.string(),
  usage: z.number(),
  metadata: z.record(z.any()).optional(),
});
export type RecordSaasUsageDto = z.infer<typeof RecordSaasUsageSchema>;

export const CreateSaasInvoiceSchema = z.object({
  subscriptionId: z.string().optional(),
  billingTenantId: z.string(),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
  lineItems: z.array(z.object({
    description: z.string(),
    type: z.enum(['SUBSCRIPTION', 'ADD_ON', 'USAGE', 'CREDIT', 'TAX', 'SHIPPING']).default('SUBSCRIPTION'),
    quantity: z.number().int().default(1),
    unitPrice: z.number(),
  })),
  couponCode: z.string().optional(),
});
export type CreateSaasInvoiceDto = z.infer<typeof CreateSaasInvoiceSchema>;

export const CreateSaasPaymentSchema = z.object({
  invoiceId: z.string(),
  subscriptionId: z.string().optional(),
  amount: z.number(),
  method: z.string().default('CARD'),
  gateway: z.string().optional(),
  gatewayTransactionId: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});
export type CreateSaasPaymentDto = z.infer<typeof CreateSaasPaymentSchema>;

export const CreateSaasFeatureFlagSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  isEnabled: z.boolean().default(false),
  isGlobal: z.boolean().default(false),
  conditions: z.record(z.any()).default({}),
});
export type CreateSaasFeatureFlagDto = z.infer<typeof CreateSaasFeatureFlagSchema>;

export const CreateSaasTenantSettingSchema = z.object({
  category: z.string().default('general'),
  key: z.string().min(1),
  value: z.any(),
});
export type CreateSaasTenantSettingDto = z.infer<typeof CreateSaasTenantSettingSchema>;

export const CreateSaasDomainSchema = z.object({
  domain: z.string().min(1),
  isPrimary: z.boolean().default(false),
});
export type CreateSaasDomainDto = z.infer<typeof CreateSaasDomainSchema>;

export const CreateSaasWebhookEndpointSchema = z.object({
  url: z.string().url(),
  description: z.string().optional(),
  events: z.array(z.string()).default([]),
  retryCount: z.number().int().default(3),
  timeoutMs: z.number().int().default(5000),
});
export type CreateSaasWebhookEndpointDto = z.infer<typeof CreateSaasWebhookEndpointSchema>;

export const CreateSaasApiKeySchema = z.object({
  name: z.string().min(1),
  scopes: z.array(z.string()).default([]),
  expiresAt: z.string().optional(),
});
export type CreateSaasApiKeyDto = z.infer<typeof CreateSaasApiKeySchema>;

export const CreateSaasSupportTicketSchema = z.object({
  subject: z.string().min(1),
  description: z.string().optional(),
  category: z.string().optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).default('NORMAL'),
  metadata: z.record(z.any()).optional(),
});
export type CreateSaasSupportTicketDto = z.infer<typeof CreateSaasSupportTicketSchema>;

export const CreateSaasSupportTicketMessageSchema = z.object({
  ticketId: z.string(),
  body: z.string().min(1),
  isInternal: z.boolean().default(false),
  authorType: z.enum(['USER', 'AGENT', 'SYSTEM']).default('USER'),
  attachments: z.array(z.object({ fileName: z.string(), fileUrl: z.string(), fileSize: z.number().int().optional(), mimeType: z.string().optional() })).optional(),
});
export type CreateSaasSupportTicketMessageDto = z.infer<typeof CreateSaasSupportTicketMessageSchema>;

export const CreateSaasAnnouncementSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  type: z.enum(['INFO', 'WARNING', 'CRITICAL', 'MAINTENANCE']).default('INFO'),
  severity: z.enum(['LOW', 'NORMAL', 'HIGH']).default('NORMAL'),
  startsAt: z.string(),
  expiresAt: z.string().optional(),
});
export type CreateSaasAnnouncementDto = z.infer<typeof CreateSaasAnnouncementSchema>;

export const CreateSaasMaintenanceWindowSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  scheduledStart: z.string(),
  scheduledEnd: z.string(),
  affectedServices: z.array(z.string()).default([]),
  notifyTenants: z.boolean().default(true),
});
export type CreateSaasMaintenanceWindowDto = z.infer<typeof CreateSaasMaintenanceWindowSchema>;
