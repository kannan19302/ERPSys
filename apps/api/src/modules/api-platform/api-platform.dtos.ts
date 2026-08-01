import { z } from "zod";

export const createRateLimitRuleSchema = z.object({
  name: z.string().min(1).max(200),
  endpointPath: z.string().min(1),
  limitPerMinute: z.number().int().positive().default(60),
  burstLimit: z.number().int().positive().default(100),
  clientTier: z.enum(["STANDARD", "PREMIUM", "ENTERPRISE"]).default("STANDARD"),
});

export const createApiKeySchema = z.object({
  name: z.string().min(1).max(200),
  rateLimit: z.number().int().positive().default(60),
  scopes: z.array(z.string()).default(["read:all"]),
  ipWhitelist: z.array(z.string()).optional(),
  expiresInDays: z.number().int().positive().optional(),
});

export const updateApiKeyScopesSchema = z.object({
  scopes: z.array(z.string()).min(1),
  ipWhitelist: z.array(z.string()).optional(),
  rateLimit: z.number().int().positive().optional(),
});

export const createWebhookSchema = z.object({
  name: z.string().min(1).max(200),
  targetUrl: z.string().url(),
  events: z.array(z.string()).min(1),
  secret: z.string().min(8),
  maxRetries: z.number().int().positive().default(3),
});

export const updateWebhookSchema = createWebhookSchema.partial();

export const registerEndpointSchema = z.object({
  path: z.string().min(1),
  method: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH"]),
  module: z.string().min(1),
  description: z.string().optional(),
  authRequired: z.boolean().default(true),
  rateLimit: z.number().int().positive().optional(),
});

export interface CreateApiKeyInput {
  name: string;
  rateLimit?: number;
  scopes?: string[];
  ipWhitelist?: string[];
  expiresInDays?: number;
}
export interface UpdateApiKeyScopesInput {
  scopes: string[];
  ipWhitelist?: string[];
  rateLimit?: number;
}
export interface CreateWebhookInput {
  name: string;
  targetUrl: string;
  events: string[];
  secret: string;
  maxRetries?: number;
}
export interface UpdateWebhookInput {
  name?: string;
  targetUrl?: string;
  events?: string[];
  secret?: string;
  maxRetries?: number;
}
export interface RegisterEndpointInput {
  path: string;
  method: string;
  module: string;
  description?: string;
  authRequired?: boolean;
  rateLimit?: number;
}
