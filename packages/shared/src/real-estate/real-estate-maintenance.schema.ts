import { z } from "zod";

export const maintenanceRequestSchema = z.object({
  propertyId: z.string().min(1),
  unitId: z.string().optional().nullable(),
  leaseId: z.string().optional().nullable(),
  requestedBy: z.string().optional().nullable(),
  requestedName: z.string().optional().nullable(),
  requestedEmail: z.string().email().optional().nullable(),
  requestedPhone: z.string().optional().nullable(),
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  category: z
    .enum([
      "PLUMBING",
      "ELECTRICAL",
      "HVAC",
      "APPLIANCE",
      "STRUCTURAL",
      "PEST",
      "GENERAL",
      "OTHER",
    ])
    .default("GENERAL"),
  priority: z
    .enum(["LOW", "MEDIUM", "HIGH", "URGENT", "EMERGENCY"])
    .default("MEDIUM"),
  status: z.string().default("OPEN"),
  vendorId: z.string().optional().nullable(),
  assignedTo: z.string().optional().nullable(),
  estimatedCost: z.number().min(0).optional().nullable(),
  actualCost: z.number().min(0).default(0),
  scheduledDate: z.string().datetime().optional().nullable(),
  completedDate: z.string().datetime().optional().nullable(),
  partsUsed: z.array(z.any()).default([]),
  images: z.array(z.string()).default([]),
  notes: z.string().optional().nullable(),
  resolution: z.string().optional().nullable(),
  isBillable: z.boolean().default(true),
});

export const maintenanceRequestUpdateSchema =
  maintenanceRequestSchema.partial();

export const maintenanceVendorSchema = z.object({
  name: z.string().min(1),
  contactName: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  specialties: z.array(z.string()).default([]),
  rating: z.number().min(0).max(5).default(0),
  licenseNumber: z.string().optional().nullable(),
  insuranceInfo: z.string().optional().nullable(),
  hourlyRate: z.number().min(0).optional().nullable(),
  responseTime: z.number().int().optional().nullable(),
  isPreferred: z.boolean().default(false),
  status: z.string().default("ACTIVE"),
  notes: z.string().optional().nullable(),
});

export const maintenanceVendorUpdateSchema = maintenanceVendorSchema.partial();

export type MaintenanceRequestDto = z.infer<typeof maintenanceRequestSchema>;
export type MaintenanceVendorDto = z.infer<typeof maintenanceVendorSchema>;
