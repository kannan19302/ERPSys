import { z } from 'zod';

/**
 * Local zod schemas for sales endpoints whose bodies are not (yet) modelled in
 * `@unerp/shared`. Pair each with `z.infer<>` so the validated shape and the
 * handler parameter type stay in sync.
 */

export const recordOrderPaymentSchema = z.object({
  amount: z.number().positive(),
  method: z.string().min(1),
});
export type RecordOrderPaymentDto = z.infer<typeof recordOrderPaymentSchema>;

export const updateQuotationStatusSchema = z.object({
  status: z.string().min(1),
});
export type UpdateQuotationStatusDto = z.infer<typeof updateQuotationStatusSchema>;

export const markDeliveryShippedSchema = z.object({
  trackingNumber: z.string().optional(),
  carrier: z.string().optional(),
});
export type MarkDeliveryShippedDto = z.infer<typeof markDeliveryShippedSchema>;

export const processReturnSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT', 'RECEIVE', 'REFUND']),
  notes: z.string().optional(),
});
export type ProcessReturnDto = z.infer<typeof processReturnSchema>;

export const calculatePriceSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().positive(),
  customerId: z.string().optional(),
});
export type CalculatePriceDto = z.infer<typeof calculatePriceSchema>;
