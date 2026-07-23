import { z } from 'zod';

export const CreatePosShiftSchema = z.object({
  registerId: z.string(),
  employeeId: z.string(),
  openingCash: z.number().min(0),
  notes: z.string().optional(),
});
export type CreatePosShiftDto = z.infer<typeof CreatePosShiftSchema>;

export const ClosePosShiftSchema = z.object({
  closingCash: z.number().min(0),
  declaredCash: z.number().min(0),
  notes: z.string().optional(),
});
export type ClosePosShiftDto = z.infer<typeof ClosePosShiftSchema>;

export const CreatePosRegisterSchema = z.object({
  terminalId: z.string(),
  startingCash: z.number().min(0),
});
export type CreatePosRegisterDto = z.infer<typeof CreatePosRegisterSchema>;

export const ClosePosRegisterSchema = z.object({
  endingCash: z.number().min(0),
  actualCash: z.number().min(0),
});
export type ClosePosRegisterDto = z.infer<typeof ClosePosRegisterSchema>;

export const CreatePosPaymentMethodSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  type: z.enum(['CASH', 'CARD', 'MOBILE', 'GIFT_CARD', 'CREDIT', 'OTHER']),
  sortOrder: z.number().int().optional(),
  requiresRef: z.boolean().optional(),
  icon: z.string().optional(),
});
export type CreatePosPaymentMethodDto = z.infer<typeof CreatePosPaymentMethodSchema>;

export const UpdatePosPaymentMethodSchema = CreatePosPaymentMethodSchema.partial().extend({ isActive: z.boolean().optional() });
export type UpdatePosPaymentMethodDto = z.infer<typeof UpdatePosPaymentMethodSchema>;

export const CreatePosRefundSchema = z.object({
  originalOrderId: z.string(),
  type: z.enum(['REFUND', 'EXCHANGE']).default('REFUND'),
  reason: z.string().optional(),
  refundMethod: z.string().optional(),
  items: z.array(z.object({
    orderItemId: z.string(),
    qty: z.number().min(1),
    refundAmount: z.number().min(0),
    restock: z.boolean().default(true),
    reason: z.string().optional(),
  })),
  exchangeOrderId: z.string().optional(),
  notes: z.string().optional(),
});
export type CreatePosRefundDto = z.infer<typeof CreatePosRefundSchema>;

export const ApprovePosRefundSchema = z.object({
  approved: z.boolean(),
  notes: z.string().optional(),
});
export type ApprovePosRefundDto = z.infer<typeof ApprovePosRefundSchema>;

export const IssuePosGiftCardSchema = z.object({
  code: z.string().min(1),
  initialBalance: z.number().min(0),
  currency: z.string().default('USD'),
  issuedTo: z.string().optional(),
  expiresAt: z.string().optional(),
});
export type IssuePosGiftCardDto = z.infer<typeof IssuePosGiftCardSchema>;

export const TopUpPosGiftCardSchema = z.object({
  amount: z.number().min(1),
  notes: z.string().optional(),
});
export type TopUpPosGiftCardDto = z.infer<typeof TopUpPosGiftCardSchema>;

export const CreatePosOrderTypeSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  description: z.string().optional(),
  isDefault: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});
export type CreatePosOrderTypeDto = z.infer<typeof CreatePosOrderTypeSchema>;

export const CreatePosDiscountRuleSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(['PERCENTAGE', 'FIXED', 'BUY_X_GET_Y', 'COMBO']),
  value: z.number().min(0),
  appliesTo: z.enum(['ORDER', 'CATEGORY', 'PRODUCT', 'CUSTOMER_GROUP']).default('ORDER'),
  categoryId: z.string().optional(),
  productId: z.string().optional(),
  customerGroupId: z.string().optional(),
  minPurchase: z.number().optional(),
  maxDiscount: z.number().optional(),
  minQty: z.number().int().optional(),
  maxQty: z.number().int().optional(),
  validFrom: z.string().optional(),
  validTo: z.string().optional(),
  usageLimit: z.number().int().optional(),
  priority: z.number().int().default(10),
  stackable: z.boolean().default(false),
});
export type CreatePosDiscountRuleDto = z.infer<typeof CreatePosDiscountRuleSchema>;

export const CreatePosTaxRuleSchema = z.object({
  name: z.string().min(1),
  rate: z.number().min(0),
  type: z.enum(['INCLUSIVE', 'EXCLUSIVE']).default('INCLUSIVE'),
  appliesTo: z.enum(['ALL', 'CATEGORY', 'PRODUCT']).default('ALL'),
  categoryId: z.string().optional(),
  productId: z.string().optional(),
  validFrom: z.string().optional(),
  validTo: z.string().optional(),
  isDefault: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});
export type CreatePosTaxRuleDto = z.infer<typeof CreatePosTaxRuleSchema>;

export const CreatePosKitchenDisplaySchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  terminalIds: z.array(z.string()).default([]),
});
export type CreatePosKitchenDisplayDto = z.infer<typeof CreatePosKitchenDisplaySchema>;

export const UpdatePosKitchenOrderStatusSchema = z.object({
  status: z.enum(['PENDING', 'PREPARING', 'READY', 'SERVED', 'CANCELLED']),
  preparedBy: z.string().optional(),
  note: z.string().optional(),
});
export type UpdatePosKitchenOrderStatusDto = z.infer<typeof UpdatePosKitchenOrderStatusSchema>;

export const CreatePosSplitPaymentSchema = z.object({
  orderId: z.string(),
  splits: z.array(z.object({
    method: z.string(),
    amount: z.number().min(0),
    reference: z.string().optional(),
    cardLast4: z.string().optional(),
    authCode: z.string().optional(),
    giftCardId: z.string().optional(),
  })),
});
export type CreatePosSplitPaymentDto = z.infer<typeof CreatePosSplitPaymentSchema>;
