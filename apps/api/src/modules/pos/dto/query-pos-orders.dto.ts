import { z } from 'zod';

export const QueryPosOrdersSchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    terminalId: z.string().optional(),
    cashierId: z.string().optional(),
    customerId: z.string().optional(),
    status: z.string().optional(),
    type: z.enum(['SALE', 'RETURN', 'EXCHANGE']).optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    search: z.string().optional(),
    sortBy: z.string().default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type QueryPosOrdersDto = z.infer<typeof QueryPosOrdersSchema>;