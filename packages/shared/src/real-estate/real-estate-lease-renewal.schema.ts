import { z } from "zod";

export const leaseRenewalSchema = z.object({
  leaseId: z.string().min(1),
  propertyId: z.string().min(1),
  unitId: z.string().optional().nullable(),
  tenantName: z.string().min(1),
  tenantEmail: z.string().email().optional().nullable(),
  currentRent: z.number().min(0),
  proposedRent: z.number().min(0),
  rentChangePercent: z.number().default(0),
  renewalTermMonths: z.number().int().min(1).default(12),
  currentEndDate: z.string().datetime(),
  proposedStartDate: z.string().datetime(),
  proposedEndDate: z.string().datetime(),
  escalationRate: z.number().min(0).default(0),
  concessionAmount: z.number().min(0).default(0),
  status: z.string().default("DRAFT"),
  approvedBy: z.string().optional().nullable(),
  approvedAt: z.string().datetime().optional().nullable(),
  executedAt: z.string().datetime().optional().nullable(),
  documents: z.array(z.any()).default([]),
  notes: z.string().optional().nullable(),
});

export const leaseRenewalUpdateSchema = leaseRenewalSchema.partial();

export const rentEscalationSchema = z.object({
  leaseId: z.string().min(1),
  propertyId: z.string().min(1),
  unitId: z.string().optional().nullable(),
  scheduleName: z.string().min(1),
  escalationType: z
    .enum([
      "PERCENTAGE",
      "FIXED_AMOUNT",
      "CPI_INDEX",
      "MARKET_REVIEW",
      "STEPPED",
    ])
    .default("PERCENTAGE"),
  escalationRate: z.number().min(0).default(0),
  frequencyMonths: z.number().int().min(1).default(12),
  nextEscalationDate: z.string().datetime().optional().nullable(),
  lastEscalationDate: z.string().datetime().optional().nullable(),
  capRate: z.number().optional().nullable(),
  floorRate: z.number().optional().nullable(),
  baseRent: z.number().min(0),
  currentRent: z.number().min(0),
  cpiIndexName: z.string().optional().nullable(),
  cpiCurrentValue: z.number().optional().nullable(),
  notes: z.string().optional().nullable(),
  status: z.string().default("ACTIVE"),
});

export const rentEscalationUpdateSchema = rentEscalationSchema.partial();

export type LeaseRenewalDto = z.infer<typeof leaseRenewalSchema>;
export type RentEscalationDto = z.infer<typeof rentEscalationSchema>;
