import { z } from 'zod';

export const WorkCenterCapacitySchema = z.object({
  workstationId: z.string(),
  date: z.string(),
  availableHours: z.number().positive(),
  overtimeHours: z.number().min(0).default(0),
  notes: z.string().optional(),
});

export const ManufacturingRouteSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  description: z.string().optional(),
  operations: z.array(z.object({
    sequence: z.number().int().positive(),
    name: z.string().min(1),
    workstationCode: z.string().optional(),
    durationMinutes: z.number().int().positive(),
    setupMinutes: z.number().int().min(0).default(0),
    description: z.string().optional(),
  })),
});

export const QualityCheckTemplateSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  description: z.string().optional(),
  category: z.enum(['INSPECTION', 'TEST', 'CERTIFICATION']).default('INSPECTION'),
  checks: z.array(z.object({
    name: z.string(),
    type: z.enum(['PASS_FAIL', 'MEASUREMENT', 'VISUAL', 'RANGE']).default('PASS_FAIL'),
    toleranceMin: z.number().optional(),
    toleranceMax: z.number().optional(),
  })),
});

export const QualityCheckSchema = z.object({
  templateId: z.string(),
  workOrderId: z.string().optional(),
  productId: z.string(),
  inspectorId: z.string().optional(),
  status: z.enum(['PASSED', 'FAILED', 'N_A']),
  checkedQty: z.number().positive(),
  passedQty: z.number().min(0),
  failedQty: z.number().min(0),
  resultJson: z.any().optional(),
  notes: z.string().optional(),
});

export const ScrapRecordSchema = z.object({
  workOrderId: z.string(),
  productId: z.string(),
  scrappedQty: z.number().positive(),
  reason: z.string().min(1),
  reasonDetail: z.string().optional(),
  costImpact: z.number().optional(),
});

export const TimeEntrySchema = z.object({
  workOrderId: z.string(),
  operationId: z.string().optional(),
  employeeId: z.string(),
  startTime: z.string(),
  endTime: z.string().optional(),
  activityType: z.enum(['PRODUCTION', 'SETUP', 'DOWNTIME', 'MAINTENANCE']).default('PRODUCTION'),
  notes: z.string().optional(),
});

export type WorkCenterCapacityDto = z.infer<typeof WorkCenterCapacitySchema>;
export type ManufacturingRouteDto = z.infer<typeof ManufacturingRouteSchema>;
export type QualityCheckTemplateDto = z.infer<typeof QualityCheckTemplateSchema>;
export type QualityCheckDto = z.infer<typeof QualityCheckSchema>;
export type ScrapRecordDto = z.infer<typeof ScrapRecordSchema>;
export type TimeEntryDto = z.infer<typeof TimeEntrySchema>;
