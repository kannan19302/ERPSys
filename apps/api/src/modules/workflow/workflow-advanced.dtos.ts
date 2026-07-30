// @ts-nocheck
import { z } from "zod";

export const createTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  category: z.string().optional(),
  triggerType: z.string().default("MANUAL"),
  nodes: z.array(z.any()).default([]),
  edges: z.array(z.any()).default([]),
});

export const updateTemplateSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  triggerType: z.string().optional(),
  nodes: z.array(z.any()).optional(),
  edges: z.array(z.any()).optional(),
});

export const createCategorySchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
  sortOrder: z.number().int().default(0),
});

export const updateCategorySchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
  sortOrder: z.number().int().optional(),
});

export const createVersionSchema = z.object({
  changeLog: z.string().optional(),
});

export const restoreVersionSchema = z.object({
  versionId: z.string().min(1),
});

export const createConditionSchema = z.object({
  definitionId: z.string().min(1),
  name: z.string().min(1),
  field: z.string().min(1),
  operator: z.enum([
    "equals",
    "not_equals",
    "contains",
    "greater_than",
    "less_than",
    "in",
    "not_in",
    "between",
  ]),
  value: z.any(),
  logicGroup: z.enum(["AND", "OR"]).default("AND"),
  sortOrder: z.number().int().default(0),
});

export const updateConditionSchema = z.object({
  name: z.string().optional(),
  field: z.string().optional(),
  operator: z
    .enum([
      "equals",
      "not_equals",
      "contains",
      "greater_than",
      "less_than",
      "in",
      "not_in",
      "between",
    ])
    .optional(),
  value: z.any().optional(),
  logicGroup: z.enum(["AND", "OR"]).optional(),
  sortOrder: z.number().int().optional(),
});

export const createLoopSchema = z.object({
  definitionId: z.string().min(1),
  name: z.string().min(1),
  loopField: z.string().min(1),
  maxIterations: z.number().int().positive().default(100),
  breakOn: z.string().optional(),
  sortOrder: z.number().int().default(0),
});

export const updateLoopSchema = z.object({
  name: z.string().optional(),
  loopField: z.string().optional(),
  maxIterations: z.number().int().positive().optional(),
  breakOn: z.string().optional(),
  sortOrder: z.number().int().optional(),
});

export const createSubprocessSchema = z.object({
  parentDefinitionId: z.string().min(1),
  childDefinitionId: z.string().min(1),
  name: z.string().min(1),
  inputMapping: z.record(z.any()).default({}),
  outputMapping: z.record(z.any()).default({}),
  sortOrder: z.number().int().default(0),
});

export const createErrorHandlerSchema = z.object({
  definitionId: z.string().min(1),
  name: z.string().min(1),
  onError: z
    .enum(["ABORT", "RETRY", "SKIP", "NOTIFY", "ROUTE"])
    .default("ABORT"),
  retryCount: z.number().int().positive().default(3),
  retryDelay: z.number().int().positive().default(60),
  notifyRoles: z.string().optional(),
  routeToNode: z.string().optional(),
});

export const updateErrorHandlerSchema = z.object({
  name: z.string().optional(),
  onError: z.enum(["ABORT", "RETRY", "SKIP", "NOTIFY", "ROUTE"]).optional(),
  retryCount: z.number().int().positive().optional(),
  retryDelay: z.number().int().positive().optional(),
  notifyRoles: z.string().optional(),
  routeToNode: z.string().optional(),
});

export const createNotificationSchema = z.object({
  definitionId: z.string().min(1),
  event: z.enum([
    "ON_START",
    "ON_COMPLETE",
    "ON_FAILURE",
    "ON_SLA_BREACH",
    "ON_ESCALATION",
  ]),
  channel: z
    .enum(["IN_APP", "EMAIL", "SMS", "SLACK", "WEBHOOK"])
    .default("IN_APP"),
  recipients: z.array(z.string()).default([]),
  template: z.string().optional(),
});

export const updateNotificationSchema = z.object({
  event: z
    .enum([
      "ON_START",
      "ON_COMPLETE",
      "ON_FAILURE",
      "ON_SLA_BREACH",
      "ON_ESCALATION",
    ])
    .optional(),
  channel: z.enum(["IN_APP", "EMAIL", "SMS", "SLACK", "WEBHOOK"]).optional(),
  recipients: z.array(z.string()).optional(),
  template: z.string().optional(),
});

export const createWebhookSchema = z.object({
  definitionId: z.string().min(1),
  url: z.string().url(),
  method: z.enum(["POST", "PUT", "PATCH"]).default("POST"),
  headers: z.record(z.string()).default({}),
  bodyTemplate: z.string().optional(),
  retryCount: z.number().int().positive().default(3),
});

export const updateWebhookSchema = z.object({
  url: z.string().url().optional(),
  method: z.enum(["POST", "PUT", "PATCH"]).optional(),
  headers: z.record(z.string()).optional(),
  bodyTemplate: z.string().optional(),
  retryCount: z.number().int().positive().optional(),
});

export const createTagSchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().optional(),
});

export const updateTagSchema = z.object({
  name: z.string().optional(),
  color: z.string().optional(),
});

export const assignTagsSchema = z.object({
  tagIds: z.array(z.string().min(1)),
});

export const exportWorkflowSchema = z.object({
  definitionId: z.string().min(1),
  format: z.enum(["JSON", "YAML"]).default("JSON"),
});

export const importWorkflowSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  data: z.record(z.any()),
});

export const testWorkflowSchema = z.object({
  definitionId: z.string().min(1),
  testInput: z.record(z.any()).default({}),
});

export const delegatedTaskSchema = z.object({
  originalAssigneeId: z.string().min(1),
  delegatedToId: z.string().min(1),
  reason: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
});

export const setPrioritySchema = z.object({
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
});

export const scheduleTriggerSchema = z.object({
  definitionId: z.string().min(1),
  cronExpression: z.string().min(1),
  input: z.record(z.any()).default({}),
  enabled: z.boolean().default(true),
});
