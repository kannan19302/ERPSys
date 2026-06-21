import { z } from 'zod';

export const CreateLoyaltyProgramSchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    pointsPerUnit: z.number().positive().default(1),
    redeemRate: z.number().positive().default(100),
    minRedeemPoints: z.number().int().positive().default(100),
    expiryDays: z.number().int().positive().optional(),
    tiers: z.array(z.object({
        name: z.string(),
        minPoints: z.number().int().min(0),
        color: z.string().optional(),
        benefits: z.array(z.string()).optional(),
    })).default([]),
});

export type CreateLoyaltyProgramDto = z.infer<typeof CreateLoyaltyProgramSchema>;

export const CreateGiftCardSchema = z.object({
    code: z.string().min(1),
    initialBalance: z.number().positive(),
    currency: z.string().default('USD'),
    issuedTo: z.string().optional(),
    expiresAt: z.string().optional(),
});

export type CreateGiftCardDto = z.infer<typeof CreateGiftCardSchema>;

export const CheckGiftCardBalanceSchema = z.object({
    code: z.string().min(1),
});

export type CheckGiftCardBalanceDto = z.infer<typeof CheckGiftCardBalanceSchema>;