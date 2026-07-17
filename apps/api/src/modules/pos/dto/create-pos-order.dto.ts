import { z } from 'zod';

export const CreatePosOrderItemSchema = z.object({
    productId: z.string().optional(),
    productName: z.string().min(1),
    sku: z.string().default(''),
    barcode: z.string().optional(),
    qty: z.number().positive(),
    unitPrice: z.number().min(0),
    discountType: z.enum(['PERCENTAGE', 'FIXED', 'NONE']).optional(),
    discountPercent: z.number().min(0).max(100).default(0),
    discountAmount: z.number().min(0).default(0),
    taxRate: z.number().min(0).default(0),
    taxAmount: z.number().min(0).default(0),
    lineTotal: z.number().min(0),
    serialNumberId: z.string().optional(),
    batchId: z.string().optional(),
    notes: z.string().optional(),
});

export const CreatePosPaymentSchema = z.object({
    method: z.enum(['CASH', 'CARD', 'WALLET', 'GIFT_CARD', 'STORE_CREDIT', 'CHECK', 'CUSTOM']),
    amount: z.number().min(0),
    reference: z.string().optional(),
    cardLast4: z.string().length(4).optional(),
    authCode: z.string().optional(),
    giftCardId: z.string().optional(),
});

export const CreatePosOrderSchema = z.object({
    type: z.enum(['SALE', 'RETURN', 'EXCHANGE']).default('SALE'),
    terminalId: z.string().min(1),
    registerId: z.string().optional(),
    shiftId: z.string().optional(),
    customerId: z.string().optional(),
    customerName: z.string().optional(),
    items: z.array(CreatePosOrderItemSchema).min(1),
    payments: z.array(CreatePosPaymentSchema).min(1),
    discountType: z.enum(['PERCENTAGE', 'FIXED', 'NONE']).optional(),
    discountValue: z.number().min(0).default(0),
    discountAmount: z.number().min(0).default(0),
    taxAmount: z.number().min(0).default(0),
    roundingAmount: z.number().default(0),
    grandTotal: z.number().min(0),
    paidAmount: z.number().min(0),
    changeAmount: z.number().min(0).default(0),
    tipAmount: z.number().min(0).default(0),
    couponCode: z.string().optional(),
    notes: z.string().optional(),
    receiptData: z.any().optional(),
});

export type CreatePosOrderDto = z.infer<typeof CreatePosOrderSchema>;
export type CreatePosOrderItemDto = z.infer<typeof CreatePosOrderItemSchema>;
export type CreatePosPaymentDto = z.infer<typeof CreatePosPaymentSchema>;