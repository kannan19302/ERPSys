import { z } from "zod";

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
export type UpdateQuotationStatusDto = z.infer<
  typeof updateQuotationStatusSchema
>;

export const markDeliveryShippedSchema = z.object({
  trackingNumber: z.string().optional(),
  carrier: z.string().optional(),
});
export type MarkDeliveryShippedDto = z.infer<typeof markDeliveryShippedSchema>;

export const processReturnSchema = z.object({
  action: z.enum(["APPROVE", "REJECT", "RECEIVE", "REFUND"]),
  notes: z.string().optional(),
});
export type ProcessReturnDto = z.infer<typeof processReturnSchema>;

export const calculatePriceSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().positive(),
  customerId: z.string().optional(),
});
export type CalculatePriceDto = z.infer<typeof calculatePriceSchema>;

// ─── Promotion DTOs ───────────────────────────────

export const createPromotionSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  type: z.enum(["PERCENTAGE", "FIXED_AMOUNT", "BOGO", "FREE_SHIPPING"]),
  value: z.number().positive(),
  minOrderAmount: z.number().min(0).optional(),
  startDate: z.string().min(1),
  endDate: z.string().optional(),
  isActive: z.boolean().optional(),
  maxUsageCount: z.number().int().positive().optional(),
  appliesToAll: z.boolean().optional(),
  productIds: z.array(z.string()).optional(),
  customerIds: z.array(z.string()).optional(),
});
export type CreatePromotionDto = z.infer<typeof createPromotionSchema>;

export const updatePromotionSchema = createPromotionSchema.partial();
export type UpdatePromotionDto = z.infer<typeof updatePromotionSchema>;

export const createCouponSchema = z.object({
  promotionId: z.string().min(1),
  code: z.string().min(1).max(50),
  usageLimit: z.number().int().positive().optional(),
  isActive: z.boolean().optional(),
  maxRedemptionsPerCustomer: z.number().int().positive().optional(),
});
export type CreateCouponDto = z.infer<typeof createCouponSchema>;

export const applyCouponSchema = z.object({
  code: z.string().min(1),
  orderSubtotal: z.number().positive(),
  customerId: z.string().optional(),
  productIds: z.array(z.string()).optional(),
});
export type ApplyCouponDto = z.infer<typeof applyCouponSchema>;

// ─── Partner DTOs ─────────────────────────────────

export const createPartnerSchema = z.object({
  tierId: z.string().optional(),
  name: z.string().min(1).max(200),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(50).optional(),
  website: z.string().max(200).optional(),
  address: z.any().optional(),
  commissionRate: z.number().min(0).max(100).optional(),
  referralCode: z.string().max(50).optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]).optional(),
  type: z.enum(["RESELLER", "AFFILIATE", "DISTRIBUTOR", "REFERRAL"]).optional(),
  notes: z.string().max(5000).optional(),
});
export type CreatePartnerDto = z.infer<typeof createPartnerSchema>;

export const updatePartnerSchema = createPartnerSchema.partial();
export type UpdatePartnerDto = z.infer<typeof updatePartnerSchema>;

export const createPartnerTierSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
  commissionRate: z.number().min(0).max(100),
  minRevenue: z.number().min(0).optional(),
  benefits: z.any().optional(),
  sortOrder: z.number().int().min(0).optional(),
});
export type CreatePartnerTierDto = z.infer<typeof createPartnerTierSchema>;

export const updatePartnerTierSchema = createPartnerTierSchema.partial();
export type UpdatePartnerTierDto = z.infer<typeof updatePartnerTierSchema>;

// ─── Contract DTOs ────────────────────────────────

export const createSalesContractSchema = z.object({
  contractNumber: z.string().min(1).max(50),
  title: z.string().min(1).max(200),
  customerId: z.string().min(1),
  type: z.string().optional(),
  value: z.number().min(0),
  currency: z.string().optional(),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  autoRenew: z.boolean().optional(),
  renewalTermMonths: z.number().int().positive().optional(),
  terms: z.string().max(10000).optional(),
  ownerId: z.string().optional(),
});
export type CreateSalesContractDto = z.infer<typeof createSalesContractSchema>;

export const updateSalesContractStatusSchema = z.object({
  status: z.enum([
    "DRAFT",
    "ACTIVE",
    "EXPIRING_SOON",
    "EXPIRED",
    "TERMINATED",
    "RENEWED",
  ]),
});
export type UpdateSalesContractStatusDto = z.infer<
  typeof updateSalesContractStatusSchema
>;

// ─── Commission DTOs ──────────────────────────────

export const createCommissionPayoutApprovalSchema = z.object({
  payoutId: z.string().min(1),
  approved: z.boolean(),
  notes: z.string().max(1000).optional(),
});
export type CreateCommissionPayoutApprovalDto = z.infer<
  typeof createCommissionPayoutApprovalSchema
>;

// ─── Analytics DTOs ───────────────────────────────

export const salesAnalyticsFilterSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  groupBy: z.enum(["day", "week", "month", "quarter", "year"]).optional(),
  channel: z.string().optional(),
  customerId: z.string().optional(),
});
export type SalesAnalyticsFilterDto = z.infer<
  typeof salesAnalyticsFilterSchema
>;

// ─── Forecasting DTOs ─────────────────────────────

export const createForecastSchema = z.object({
  name: z.string().min(1).max(200),
  period: z.string().min(1),
  pipelineValue: z.number().min(0).optional(),
  expectedValue: z.number().min(0).optional(),
  confidence: z.number().min(0).max(100).optional(),
  notes: z.string().max(2000).optional(),
});
export type CreateForecastDto = z.infer<typeof createForecastSchema>;
