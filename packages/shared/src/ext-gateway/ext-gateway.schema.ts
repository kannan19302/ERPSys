import { z } from "zod";

export const AuthTypeEnum = z.enum([
  "API_KEY",
  "OAUTH2",
  "BASIC",
  "BEARER",
  "MUTUAL_TLS",
]);
export const ConnectionTypeEnum = z.enum([
  "INBOUND",
  "OUTBOUND",
  "BIDIRECTIONAL",
]);
export const ConnectionStatusEnum = z.enum([
  "ACTIVE",
  "INACTIVE",
  "ERROR",
  "EXPIRED",
]);
export const RetryPolicyEnum = z.enum(["FIXED", "EXPONENTIAL", "NONE"]);
export const RateLimitStrategyEnum = z.enum([
  "TOKEN_BUCKET",
  "LEAKY_BUCKET",
  "FIXED_WINDOW",
  "SLIDING_WINDOW",
]);

export const CreateConnectionSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(100),
  provider: z.string().min(1),
  type: ConnectionTypeEnum.optional().default("OUTBOUND"),
  baseUrl: z.string().url().optional(),
  authType: AuthTypeEnum.optional().default("API_KEY"),
  authConfig: z.record(z.unknown()).optional(),
  rateLimitPerMin: z.number().int().positive().optional().default(60),
  timeout: z.number().int().positive().optional().default(30000),
  retryCount: z.number().int().min(0).optional().default(3),
  retryBackoffMs: z.number().int().positive().optional().default(1000),
  webhookEnabled: z.boolean().optional().default(false),
  webhookUrl: z.string().url().optional(),
  healthEndpoint: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const UpdateConnectionSchema = CreateConnectionSchema.partial().extend({
  status: ConnectionStatusEnum.optional(),
});

export const CreateWebhookConfigSchema = z.object({
  connectionId: z.string().min(1),
  name: z.string().min(1).max(200),
  url: z.string().url(),
  eventTypes: z.array(z.string()).min(1),
  format: z.enum(["JSON", "XML", "FORM_DATA"]).optional().default("JSON"),
  headers: z.record(z.string()).optional(),
  retryPolicy: RetryPolicyEnum.optional().default("EXPONENTIAL"),
  maxRetries: z.number().int().min(0).optional().default(5),
  retryIntervalMs: z.number().int().positive().optional().default(60000),
  timeout: z.number().int().positive().optional().default(30000),
  circuitBreakerEnabled: z.boolean().optional().default(true),
  circuitBreakerThreshold: z.number().int().positive().optional().default(5),
  circuitBreakerResetMs: z.number().int().positive().optional().default(300000),
});

export const UpdateWebhookConfigSchema =
  CreateWebhookConfigSchema.partial().extend({
    active: z.boolean().optional(),
  });

export const CreateRateLimitConfigSchema = z.object({
  connectionId: z.string().min(1),
  name: z.string().min(1).max(200),
  strategy: RateLimitStrategyEnum.optional().default("TOKEN_BUCKET"),
  maxRequests: z.number().int().positive(),
  windowMs: z.number().int().positive(),
  maxBurst: z.number().int().min(0).optional().default(0),
  refillRate: z.number().int().positive().optional(),
  refillIntervalMs: z.number().int().positive().optional(),
});

export const UpdateRateLimitConfigSchema =
  CreateRateLimitConfigSchema.partial().extend({
    isActive: z.boolean().optional(),
  });

export const CreateIntegrationTemplateSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(100),
  provider: z.string().min(1),
  description: z.string().optional(),
  icon: z.string().optional(),
  category: z
    .enum([
      "GENERAL",
      "CRM",
      "FINANCE",
      "ECOMMERCE",
      "COMMUNICATION",
      "PAYMENT",
      "SHIPPING",
    ])
    .optional()
    .default("GENERAL"),
  configTemplate: z.record(z.unknown()),
  authTypes: z.array(z.string()).optional(),
  webhookEvents: z.array(z.string()).optional(),
  documentationUrl: z.string().url().optional(),
});

export const UpdateIntegrationTemplateSchema =
  CreateIntegrationTemplateSchema.partial();

export type CreateConnectionDto = z.infer<typeof CreateConnectionSchema>;
export type UpdateConnectionDto = z.infer<typeof UpdateConnectionSchema>;
export type CreateWebhookConfigDto = z.infer<typeof CreateWebhookConfigSchema>;
export type UpdateWebhookConfigDto = z.infer<typeof UpdateWebhookConfigSchema>;
export type CreateRateLimitConfigDto = z.infer<
  typeof CreateRateLimitConfigSchema
>;
export type UpdateRateLimitConfigDto = z.infer<
  typeof UpdateRateLimitConfigSchema
>;
export type CreateIntegrationTemplateDto = z.infer<
  typeof CreateIntegrationTemplateSchema
>;
export type UpdateIntegrationTemplateDto = z.infer<
  typeof UpdateIntegrationTemplateSchema
>;
