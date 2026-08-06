import { z } from "zod";

export const DlqStatusEnum = z.enum([
  "PENDING_REVIEW",
  "RETRYING",
  "ARCHIVED",
  "DISCARDED",
]);
export const DlqActionEnum = z.enum(["RETRY", "ARCHIVE", "DISCARD", "REQUEUE"]);
export const DispatcherStatusEnum = z.enum([
  "ACTIVE",
  "PAUSED",
  "STOPPED",
  "ERROR",
]);

export const RequeueDlqSchema = z.object({
  ids: z.array(z.string().min(1)).min(1),
});

export const DlqActionSchema = z.object({
  id: z.string().min(1),
  action: DlqActionEnum,
  notes: z.string().optional(),
});

export const DlqBatchActionSchema = z.object({
  ids: z.array(z.string().min(1)).min(1),
  action: DlqActionEnum,
  notes: z.string().optional(),
});

export const UpdateDispatcherSchema = z.object({
  status: DispatcherStatusEnum,
  config: z.record(z.unknown()).optional(),
});

export const DeadLetterActionSchema = z.object({
  id: z.string().min(1),
  action: DlqActionEnum,
  notes: z.string().optional(),
});

export const OutboxAnalyticsQuerySchema = z.object({
  period: z.enum(["24h", "7d", "30d", "90d"]).optional().default("7d"),
});

export type RequeueDlqDto = z.infer<typeof RequeueDlqSchema>;
export type DlqActionDto = z.infer<typeof DlqActionSchema>;
export type DlqBatchActionDto = z.infer<typeof DlqBatchActionSchema>;
export type UpdateDispatcherDto = z.infer<typeof UpdateDispatcherSchema>;
export type DeadLetterActionDto = z.infer<typeof DeadLetterActionSchema>;
export type OutboxAnalyticsQueryDto = z.infer<
  typeof OutboxAnalyticsQuerySchema
>;
