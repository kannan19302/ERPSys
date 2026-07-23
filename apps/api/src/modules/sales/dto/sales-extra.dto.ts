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

// ─── Subscription DTOs ──────────────────────────

export const createSubscriptionSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  customerId: z.string().min(1),
  productId: z.string().optional(),
  currency: z.string().optional(),
  unitAmount: z.number().positive(),
  quantity: z.number().int().positive().optional(),
  billingPeriod: z.enum(["MONTHLY", "QUARTERLY", "SEMI_ANNUAL", "ANNUAL"]).optional(),
  billingCycles: z.number().int().positive().optional(),
  startDate: z.string().min(1),
  trialEndDate: z.string().optional(),
  lines: z.array(z.object({
    productId: z.string().optional(),
    description: z.string().min(1),
    unitAmount: z.number().positive(),
    quantity: z.number().int().positive().optional(),
    taxRate: z.number().min(0).max(100).optional(),
  })).optional(),
});
export type CreateSubscriptionDto = z.infer<typeof createSubscriptionSchema>;

export const updateSubscriptionSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  unitAmount: z.number().positive().optional(),
  quantity: z.number().int().positive().optional(),
  billingPeriod: z.enum(["MONTHLY", "QUARTERLY", "SEMI_ANNUAL", "ANNUAL"]).optional(),
  billingCycles: z.number().int().positive().optional(),
  currentPeriodEnd: z.string().optional(),
});
export type UpdateSubscriptionDto = z.infer<typeof updateSubscriptionSchema>;

export const recordSubscriptionUsageSchema = z.object({
  metricName: z.string().min(1),
  quantity: z.number().int().positive(),
  unitAmount: z.number().positive().optional(),
});
export type RecordSubscriptionUsageDto = z.infer<typeof recordSubscriptionUsageSchema>;

export const sendDunningSchema = z.object({
  invoiceIds: z.array(z.string()).optional(),
});
export type SendDunningDto = z.infer<typeof sendDunningSchema>;

// ─── SPIFF DTOs ─────────────────────────────────

export const createSpiffCampaignSchema = z.object({
  planId: z.string().optional(),
  name: z.string().min(1).max(200),
  criteriaType: z.enum(["DEAL_SIZE_ABOVE", "PRODUCT_LINE", "NEW_LOGO", "ATTAINMENT_ABOVE"]),
  criteriaValue: z.any(),
  bonusType: z.enum(["FLAT", "PERCENTAGE"]),
  bonusAmount: z.number().positive(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  isActive: z.boolean().optional(),
});
export type CreateSpiffCampaignDto = z.infer<typeof createSpiffCampaignSchema>;

export const updateSpiffCampaignSchema = createSpiffCampaignSchema.partial();
export type UpdateSpiffCampaignDto = z.infer<typeof updateSpiffCampaignSchema>;

export const createTeamSplitSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  splitType: z.enum(["PERCENTAGE", "FIXED_AMOUNT", "EQUAL"]),
  members: z.array(z.object({
    userId: z.string().min(1),
    share: z.number().min(0).max(100),
    role: z.string().optional(),
  })).min(1),
});
export type CreateTeamSplitDto = z.infer<typeof createTeamSplitSchema>;

export const updateTeamSplitSchema = createTeamSplitSchema.partial();
export type UpdateTeamSplitDto = z.infer<typeof updateTeamSplitSchema>;

export const processClawbackSchema = z.object({
  payoutId: z.string().min(1),
  amount: z.number().positive(),
  reason: z.string().min(1).max(1000),
});
export type ProcessClawbackDto = z.infer<typeof processClawbackSchema>;

// ─── Advanced Pricing DTOs ──────────────────────

export const createCustomerPriceListSchema = z.object({
  customerId: z.string().min(1),
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  currency: z.string().optional(),
  validFrom: z.string().optional(),
  validTo: z.string().optional(),
  items: z.array(z.object({
    productId: z.string().min(1),
    unitPrice: z.number().positive(),
    minQuantity: z.number().positive().optional(),
  })).optional(),
});
export type CreateCustomerPriceListDto = z.infer<typeof createCustomerPriceListSchema>;

export const updateCustomerPriceListSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  validFrom: z.string().optional(),
  validTo: z.string().optional(),
  isActive: z.boolean().optional(),
});
export type UpdateCustomerPriceListDto = z.infer<typeof updateCustomerPriceListSchema>;

export const addPriceListItemSchema = z.object({
  productId: z.string().min(1),
  unitPrice: z.number().positive(),
  minQuantity: z.number().positive().optional(),
});
export type AddPriceListItemDto = z.infer<typeof addPriceListItemSchema>;

export const createContractPricingSchema = z.object({
  contractId: z.string().min(1),
  productId: z.string().min(1),
  unitPrice: z.number().positive(),
  discountPct: z.number().min(0).max(100).optional(),
  effectiveDate: z.string().min(1),
  expiryDate: z.string().optional(),
});
export type CreateContractPricingDto = z.infer<typeof createContractPricingSchema>;

export const updateContractPricingSchema = z.object({
  unitPrice: z.number().positive().optional(),
  discountPct: z.number().min(0).max(100).optional(),
  expiryDate: z.string().optional(),
  isActive: z.boolean().optional(),
});
export type UpdateContractPricingDto = z.infer<typeof updateContractPricingSchema>;

export const createFloorPriceSchema = z.object({
  productId: z.string().min(1),
  customerId: z.string().optional(),
  floorPrice: z.number().positive(),
  currency: z.string().optional(),
});
export type CreateFloorPriceDto = z.infer<typeof createFloorPriceSchema>;

export const updateFloorPriceSchema = z.object({
  floorPrice: z.number().positive().optional(),
  isActive: z.boolean().optional(),
});
export type UpdateFloorPriceDto = z.infer<typeof updateFloorPriceSchema>;

export const approveFloorPriceSchema = z.object({
  approved: z.boolean(),
});
export type ApproveFloorPriceDto = z.infer<typeof approveFloorPriceSchema>;

export const calculateTieredPriceSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().positive(),
  customerId: z.string().optional(),
  priceListId: z.string().optional(),
});
export type CalculateTieredPriceDto = z.infer<typeof calculateTieredPriceSchema>;

// ─── CPQ Bundle DTOs ────────────────────────────

export const createProductBundleSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  bundlePrice: z.number().positive(),
  currency: z.string().optional(),
  savingsPct: z.number().min(0).max(100).optional(),
  validFrom: z.string().optional(),
  validTo: z.string().optional(),
  items: z.array(z.object({
    productId: z.string().min(1),
    quantity: z.number().int().positive().optional(),
  })).min(1),
});
export type CreateProductBundleDto = z.infer<typeof createProductBundleSchema>;

export const updateProductBundleSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  bundlePrice: z.number().positive().optional(),
  savingsPct: z.number().min(0).max(100).optional(),
  validFrom: z.string().optional(),
  validTo: z.string().optional(),
  isActive: z.boolean().optional(),
});
export type UpdateProductBundleDto = z.infer<typeof updateProductBundleSchema>;

export const createCrossSellRuleSchema = z.object({
  productId: z.string().min(1),
  recommendedProductId: z.string().min(1),
  strength: z.number().int().min(1).max(100).optional(),
});
export type CreateCrossSellRuleDto = z.infer<typeof createCrossSellRuleSchema>;

export const createUpsellRuleSchema = z.object({
  productId: z.string().min(1),
  upgradeProductId: z.string().min(1),
  description: z.string().max(500).optional(),
  priceDelta: z.number().optional(),
});
export type CreateUpsellRuleDto = z.infer<typeof createUpsellRuleSchema>;

export const validateConfigurationSchema = z.object({
  productId: z.string().min(1),
  selectedOptions: z.record(z.string(), z.any()).optional(),
  quantity: z.number().int().positive().optional(),
});
export type ValidateConfigurationDto = z.infer<typeof validateConfigurationSchema>;

// ─── Territory DTOs ─────────────────────────────

export const createTerritorySchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  criteria: z.any().optional(),
  parentId: z.string().optional(),
  managerId: z.string().optional(),
});
export type CreateTerritoryDto = z.infer<typeof createTerritorySchema>;

export const updateTerritorySchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  criteria: z.any().optional(),
  parentId: z.string().optional().nullable(),
  managerId: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});
export type UpdateTerritoryDto = z.infer<typeof updateTerritorySchema>;

export const addTerritoryMemberSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(["REP", "MANAGER", "DIRECTOR", "VP", "ADMIN"]).optional(),
});
export type AddTerritoryMemberDto = z.infer<typeof addTerritoryMemberSchema>;

export const createTerritoryRuleSchema = z.object({
  territoryId: z.string().min(1),
  name: z.string().min(1).max(200),
  ruleType: z.enum(["GEOGRAPHY", "INDUSTRY", "COMPANY_SIZE", "ROUND_ROBIN"]),
  priority: z.number().int().min(0).optional(),
  conditions: z.any().optional(),
});
export type CreateTerritoryRuleDto = z.infer<typeof createTerritoryRuleSchema>;

export const updateTerritoryRuleSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  priority: z.number().int().min(0).optional(),
  conditions: z.any().optional(),
  isActive: z.boolean().optional(),
});
export type UpdateTerritoryRuleDto = z.infer<typeof updateTerritoryRuleSchema>;

export const createTerritoryForecastSchema = z.object({
  territoryId: z.string().min(1),
  period: z.string().min(1),
  pipelineValue: z.number().min(0).optional(),
  expectedValue: z.number().min(0).optional(),
  forecastValue: z.number().min(0).optional(),
  confidence: z.number().min(0).max(100).optional(),
  notes: z.string().max(2000).optional(),
});
export type CreateTerritoryForecastDto = z.infer<typeof createTerritoryForecastSchema>;

export const updateTerritoryForecastSchema = z.object({
  pipelineValue: z.number().min(0).optional(),
  expectedValue: z.number().min(0).optional(),
  forecastValue: z.number().min(0).optional(),
  confidence: z.number().min(0).max(100).optional(),
  notes: z.string().max(2000).optional(),
});
export type UpdateTerritoryForecastDto = z.infer<typeof updateTerritoryForecastSchema>;

export const realignTerritorySchema = z.object({
  territoryId: z.string().min(1),
  newManagerId: z.string().optional(),
  newParentId: z.string().optional(),
  reason: z.string().max(1000).optional(),
});
export type RealignTerritoryDto = z.infer<typeof realignTerritorySchema>;

export const assignEntitySchema = z.object({
  entityType: z.enum(["LEAD", "OPPORTUNITY"]),
  entityIds: z.array(z.string()).min(1),
  territoryId: z.string().min(1),
  userId: z.string().optional(),
  reason: z.string().max(500).optional(),
});
export type AssignEntityDto = z.infer<typeof assignEntitySchema>;

export const getTerritoryAnalyticsSchema = z.object({
  period: z.string().optional(),
});
export type GetTerritoryAnalyticsDto = z.infer<typeof getTerritoryAnalyticsSchema>;

// ─── Coupon management DTOs (re-exports for clarity, already defined above) ──
// (createCouponSchema and applyCouponSchema are already defined in the Coupon section)
