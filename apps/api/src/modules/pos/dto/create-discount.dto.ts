import { z } from 'zod';

export const CreateDiscountSchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    type: z.enum(['PERCENTAGE', 'FIXED', 'BOGO', 'BUNDLE']),
    value: z.number().min(0),
    appliesTo: z.enum(['ORDER', 'ITEM', 'CATEGORY']).default('ORDER'),
    categoryId: z.string().optional(),
    productId: z.string().optional(),
    minPurchase: z.number().min(0).optional(),
    maxDiscount: z.number().min(0).optional(),
    validFrom: z.string().optional(),
    validTo: z.string().optional(),
    usageLimit: z.number().int().positive().optional(),
});

export type CreateDiscountDto = z.infer<typeof CreateDiscountSchema>;

export const ValidateCouponSchema = z.object({
    code: z.string().min(1),
    orderAmount: z.number().min(0),
});

export type ValidateCouponDto = z.infer<typeof ValidateCouponSchema>;