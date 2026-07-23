import { z } from 'zod';

export const ReportFilterSchema = z.object({
  reportId: z.string(),
  field: z.string().min(1),
  operator: z.enum(['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'contains', 'in', 'between']),
  value: z.string(),
});

export const DashboardWidgetSchema = z.object({
  dashboardId: z.string(),
  widgetType: z.enum(['CHART', 'TABLE', 'KPI', 'METRIC', 'TEXT']),
  title: z.string().min(1),
  config: z.any().default({}),
  position: z.any().default({}),
  width: z.number().int().min(1).max(12).default(4),
  height: z.number().int().min(1).max(12).default(3),
});

export const KpiValueSchema = z.object({
  kpiId: z.string(),
  value: z.number(),
  periodStart: z.string(),
  periodEnd: z.string(),
  metadata: z.any().optional(),
});

export const ScheduledExportSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  dataset: z.string().min(1),
  format: z.enum(['CSV', 'XLSX', 'JSON', 'PDF']).default('CSV'),
  schedule: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY']).default('DAILY'),
  recipients: z.array(z.string().email()).default([]),
  filters: z.any().optional(),
});

export type ReportFilterDto = z.infer<typeof ReportFilterSchema>;
export type DashboardWidgetDto = z.infer<typeof DashboardWidgetSchema>;
export type KpiValueDto = z.infer<typeof KpiValueSchema>;
export type ScheduledExportDto = z.infer<typeof ScheduledExportSchema>;
