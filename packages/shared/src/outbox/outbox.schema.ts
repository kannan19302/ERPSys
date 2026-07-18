import { z } from 'zod';

export const WriteEventParamsSchema = z.object({
  tenantId: z.string().min(1),
  eventName: z.string().min(1),
  eventVersion: z.number().int().positive(),
  aggregateType: z.string().min(1),
  aggregateId: z.string().min(1),
  payload: z.record(z.unknown()),
  correlationId: z.string().optional(),
  causationId: z.string().optional(),
  eventKey: z.string().optional(),
});

export type WriteEventParams = z.infer<typeof WriteEventParamsSchema>;

export const ReplayDeadLetterParamsSchema = z.object({
  outboxDeliveryId: z.string().min(1),
  tenantId: z.string().min(1),
});

export type ReplayDeadLetterParams = z.infer<typeof ReplayDeadLetterParamsSchema>;

export const OutboxMetricsSchema = z.object({
  pendingCount: z.number().int().nonnegative(),
  leasedCount: z.number().int().nonnegative(),
  completedCount: z.number().int().nonnegative(),
  deadCount: z.number().int().nonnegative(),
  oldestPendingAgeMs: z.number().int().nonnegative(),
  retryCount: z.number().int().nonnegative(),
  terminalFailureCount: z.number().int().nonnegative(),
});
