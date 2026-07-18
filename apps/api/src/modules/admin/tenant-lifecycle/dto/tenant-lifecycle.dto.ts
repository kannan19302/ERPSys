import { z } from 'zod';

export const offboardTenantSchema = z.object({
  retentionDays: z.number().int().min(1).max(365).default(90),
});

export const exportTenantSchema = z.object({
  format: z.enum(['json', 'csv']).default('json'),
  includeFiles: z.boolean().default(false),
});

export type OffboardTenantInput = z.infer<typeof offboardTenantSchema>;
export type ExportTenantInput = z.infer<typeof exportTenantSchema>;
