import { z } from "zod";

export const technicianDashboardSchema = z.object({
  technicianId: z.string().min(1),
  date: z.string().datetime().optional(),
  totalJobs: z.number().int().min(0).default(0),
  completedJobs: z.number().int().min(0).default(0),
  cancelledJobs: z.number().int().min(0).default(0),
  totalHours: z.number().min(0).default(0),
  travelHours: z.number().min(0).default(0),
  totalRevenue: z.number().min(0).default(0),
  partsCost: z.number().min(0).default(0),
  rating: z.number().min(0).max(5).default(0),
  onTimeRate: z.number().min(0).max(100).default(0),
});

export const technicianDashboardUpdateSchema =
  technicianDashboardSchema.partial();

export const dispatchUpdateStatusSchema = z.object({
  status: z.enum([
    "SCHEDULED",
    "EN_ROUTE",
    "ON_SITE",
    "IN_PROGRESS",
    "COMPLETED",
    "CANCELLED",
    "NO_SHOW",
  ]),
});

export type TechnicianDashboardDto = z.infer<typeof technicianDashboardSchema>;
