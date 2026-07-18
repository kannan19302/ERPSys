import { z } from 'zod';

export const resetFrequencyEnum = z.enum(['YEARLY', 'MONTHLY', 'NEVER']).nullable();
export type ResetFrequency = z.infer<typeof resetFrequencyEnum>;

export const createSequenceSchema = z.object({
  series: z.string().min(1).max(50),
  description: z.string().max(500).optional(),
  prefix: z.string().max(20).default(''),
  suffix: z.string().max(20).default(''),
  padding: z.number().int().min(1).max(20).default(5),
  nextNumber: z.number().int().min(1).default(1),
  resetFrequency: resetFrequencyEnum.default(null),
  format: z.string().max(100).default('{prefix}{number}{suffix}'),
});
export type CreateSequenceInput = z.infer<typeof createSequenceSchema>;

export const updateSequenceSchema = createSequenceSchema.partial();
export type UpdateSequenceInput = z.infer<typeof updateSequenceSchema>;

export const getNextNumberSchema = z.object({
  series: z.string().min(1).max(50),
  organizationId: z.string().optional(),
});
export type GetNextNumberInput = z.infer<typeof getNextNumberSchema>;

export const resetSequenceSchema = z.object({
  series: z.string().min(1).max(50),
  nextNumber: z.number().int().min(1),
  organizationId: z.string().optional(),
});
export type ResetSequenceInput = z.infer<typeof resetSequenceSchema>;
