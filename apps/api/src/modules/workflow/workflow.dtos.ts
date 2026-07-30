// @ts-nocheck
import { z } from "zod";

export const createDefinitionSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(200),
  description: z.string().optional(),
  category: z.string().optional(),
  trigger: z.string().default("MANUAL"),
  nodes: z
    .array(
      z.object({
        id: z.string(),
        type: z.string(),
        label: z.string(),
        config: z.any().optional(),
        position: z.object({ x: z.number(), y: z.number() }).optional(),
      }),
    )
    .default([]),
  edges: z
    .array(
      z.object({
        id: z.string(),
        source: z.string(),
        target: z.string(),
        label: z.string().optional(),
        condition: z.any().optional(),
      }),
    )
    .default([]),
});

export const updateDefinitionSchema = createDefinitionSchema
  .partial()
  .omit({ slug: true });

export const createSlaRuleSchema = z.object({
  definitionId: z.string().min(1),
  nodeId: z.string().min(1),
  slaLimitHours: z.number().int().positive(),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
  notifyRoles: z.string().optional(),
});

export const createEscalationSchema = z.object({
  slaRuleId: z.string().min(1),
  escalateAfterMinutes: z.number().int().positive(),
  escalateToRole: z.string().min(1),
  escalateToUser: z.string().optional(),
  notifyChannel: z.enum(["EMAIL", "IN_APP", "SMS"]).default("EMAIL"),
});

export const executeDefinitionSchema = z.object({
  definitionId: z.string().min(1),
  trigger: z.string().optional(),
  input: z.any().optional(),
});

export const createStepSchema = z.object({
  definitionId: z.string().min(1),
  name: z.string().min(1).max(200),
  type: z.string().default("TASK"),
  config: z.any().optional(),
  sortOrder: z.number().int().default(0),
});

export const completeTaskSchema = z.object({
  status: z.enum(["COMPLETED", "SKIPPED", "FAILED"]),
  comments: z.string().optional(),
});

export interface CreateDefinitionInput {
  name: string;
  slug: string;
  description?: string;
  category?: string;
  trigger?: string;
  nodes?: any[];
  edges?: any[];
}
export interface UpdateDefinitionInput {
  name?: string;
  description?: string;
  category?: string;
  trigger?: string;
  nodes?: any[];
  edges?: any[];
}
export interface CreateSlaRuleInput {
  definitionId: string;
  nodeId: string;
  slaLimitHours: number;
  severity?: string;
  notifyRoles?: string;
}
export interface CreateEscalationInput {
  slaRuleId: string;
  escalateAfterMinutes: number;
  escalateToRole: string;
  escalateToUser?: string;
  notifyChannel?: string;
}
export interface ExecuteDefinitionInput {
  definitionId: string;
  trigger?: string;
  input?: any;
}
export interface CreateStepInput {
  definitionId: string;
  name: string;
  type?: string;
  config?: any;
  sortOrder?: number;
}
export interface CompleteTaskInput {
  status: "COMPLETED" | "SKIPPED" | "FAILED";
  comments?: string;
}
