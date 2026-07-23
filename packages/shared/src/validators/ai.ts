import { z } from 'zod';

// ── AI Models ──
export const createAiModelSchema = z.object({
  name: z.string().min(1),
  provider: z.string().optional(),
  modelId: z.string().min(1),
  version: z.string().optional(),
  description: z.string().optional(),
  capabilities: z.array(z.string()).optional(),
  config: z.record(z.unknown()).optional(),
  status: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});
export type CreateAiModelInput = z.infer<typeof createAiModelSchema>;

export const updateAiModelSchema = createAiModelSchema.partial();
export type UpdateAiModelInput = z.infer<typeof updateAiModelSchema>;

// ── AI Deployments ──
export const createAiDeploymentSchema = z.object({
  modelId: z.string().min(1),
  endpoint: z.string().optional(),
  apiKey: z.string().optional(),
  config: z.record(z.unknown()).optional(),
});
export type CreateAiDeploymentInput = z.infer<typeof createAiDeploymentSchema>;

// ── AI Prompts ──
export const createAiPromptSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  category: z.string().optional(),
  prompt: z.string().min(1),
  variables: z.array(z.string()).optional(),
  config: z.record(z.unknown()).optional(),
  tags: z.array(z.string()).optional(),
});
export type CreateAiPromptInput = z.infer<typeof createAiPromptSchema>;

export const updateAiPromptSchema = createAiPromptSchema.partial();
export type UpdateAiPromptInput = z.infer<typeof updateAiPromptSchema>;

// ── AI Conversations ──
export const createAiConversationSchema = z.object({
  title: z.string().optional(),
  context: z.record(z.unknown()).optional(),
  metadata: z.record(z.unknown()).optional(),
});
export type CreateAiConversationInput = z.infer<typeof createAiConversationSchema>;

export const sendAiMessageSchema = z.object({
  conversationId: z.string().min(1),
  content: z.string().min(1),
  metadata: z.record(z.unknown()).optional(),
});
export type SendAiMessageInput = z.infer<typeof sendAiMessageSchema>;

// ── AI Documents ──
export const createAiDocumentSchema = z.object({
  name: z.string().min(1),
  contentType: z.string().min(1),
  content: z.string().optional(),
  source: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});
export type CreateAiDocumentInput = z.infer<typeof createAiDocumentSchema>;

// ── AI Agents ──
export const createAiAgentSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  systemPrompt: z.string().optional(),
  modelId: z.string().optional(),
  config: z.record(z.unknown()).optional(),
  metadata: z.record(z.unknown()).optional(),
});
export type CreateAiAgentInput = z.infer<typeof createAiAgentSchema>;

export const updateAiAgentSchema = createAiAgentSchema.partial();
export type UpdateAiAgentInput = z.infer<typeof updateAiAgentSchema>;

// ── AI Training Jobs ──
export const createAiTrainingJobSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  modelId: z.string().optional(),
  dataset: z.unknown().optional(),
  config: z.record(z.unknown()).optional(),
});
export type CreateAiTrainingJobInput = z.infer<typeof createAiTrainingJobSchema>;
