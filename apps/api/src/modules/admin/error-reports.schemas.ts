import { z } from 'zod';

export const errorReportSchema = z.object({
  message: z.string().min(1, 'Error message is required').max(5000),
  stack: z.string().max(10000).optional(),
  url: z.string().max(2000).optional(),
  userAgent: z.string().max(500).optional(),
  description: z.string().max(5000).optional(),
  requestId: z.string().max(100).optional(),
  userEmail: z.string().email().optional(),
  userName: z.string().max(200).optional(),
  tenantId: z.string().optional(),
});

export type ErrorReportInput = z.infer<typeof errorReportSchema>;
