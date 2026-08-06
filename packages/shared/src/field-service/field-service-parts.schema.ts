import { z } from "zod";

export const partRequestSchema = z.object({
  ticketId: z.string().optional().nullable(),
  technicianId: z.string().min(1),
  itemId: z.string().min(1),
  itemName: z.string().min(1),
  partNumber: z.string().optional().nullable(),
  quantityRequested: z.number().int().min(1).default(1),
  quantityApproved: z.number().int().optional().nullable(),
  quantityFulfilled: z.number().int().optional().nullable(),
  source: z
    .enum(["WAREHOUSE", "VAN", "VENDOR", "CUSTOMER"])
    .default("WAREHOUSE"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  status: z.string().default("PENDING"),
  unitPrice: z.number().min(0).default(0),
  totalPrice: z.number().min(0).default(0),
  requestedBy: z.string().optional().nullable(),
  approvedBy: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const partRequestUpdateSchema = partRequestSchema.partial();

export const vanStockSchema = z.object({
  technicianId: z.string().min(1),
  itemId: z.string().min(1),
  itemName: z.string().min(1),
  quantityOnVan: z.number().int().min(0).default(0),
  minStockLevel: z.number().int().min(0).default(5),
  maxStockLevel: z.number().int().min(0).default(20),
  reorderPoint: z.number().int().min(0).default(5),
  lastRestocked: z.string().datetime().optional().nullable(),
  lastCounted: z.string().datetime().optional().nullable(),
  location: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const vanStockUpdateSchema = vanStockSchema.partial();
export const vanStockQuantitySchema = z.object({
  quantityOnVan: z.number().int().min(0),
});

export type PartRequestDto = z.infer<typeof partRequestSchema>;
export type VanStockDto = z.infer<typeof vanStockSchema>;
