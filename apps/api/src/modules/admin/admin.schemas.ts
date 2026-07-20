import { z } from 'zod';

export const createAccessPackageSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().max(2000).optional(),
  permissions: z.array(z.string()).default([]),
  fieldAccess: z.record(z.record(z.enum(['hidden', 'readonly', 'editable']))).optional(),
  recordFilter: z.record(z.record(z.any())).optional(),
});

export const updateAccessPackageSchema = createAccessPackageSchema.partial();

export type CreateAccessPackageInput = z.infer<typeof createAccessPackageSchema>;
export type UpdateAccessPackageInput = z.infer<typeof updateAccessPackageSchema>;
