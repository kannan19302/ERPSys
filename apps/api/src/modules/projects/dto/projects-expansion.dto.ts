import { z } from 'zod';

export const PortfolioMemberSchema = z.object({
  userId: z.string(),
  role: z.enum(['OWNER', 'MANAGER', 'MEMBER', 'VIEWER']).default('MEMBER'),
});

export const RiskMitigationSchema = z.object({
  riskId: z.string(),
  action: z.string().min(1),
  ownerId: z.string().optional(),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
});

export const ResourceAllocationSchema = z.object({
  projectId: z.string(),
  resourceId: z.string(),
  resourceType: z.enum(['EMPLOYEE', 'EQUIPMENT', 'MATERIAL']),
  allocatedHours: z.number().positive(),
  startDate: z.string(),
  endDate: z.string(),
  notes: z.string().optional(),
});

export const BudgetLineSchema = z.object({
  projectId: z.string(),
  category: z.enum(['LABOR', 'MATERIAL', 'EQUIPMENT', 'TRAVEL', 'OVERHEAD', 'OTHER']),
  allocated: z.number().positive(),
  committed: z.number().default(0),
  fiscalYear: z.string().optional(),
  notes: z.string().optional(),
});

export const ProjectDocumentSchema = z.object({
  projectId: z.string(),
  name: z.string().min(1),
  type: z.enum(['FILE', 'LINK', 'NOTE']).default('FILE'),
  fileUrl: z.string().optional(),
  mimeType: z.string().optional(),
  fileSize: z.number().int().optional(),
  description: z.string().optional(),
});

export const ActivityLogSchema = z.object({
  projectId: z.string(),
  action: z.string(),
  description: z.string().optional(),
  metadata: z.any().optional(),
});

export type PortfolioMemberDto = z.infer<typeof PortfolioMemberSchema>;
export type RiskMitigationDto = z.infer<typeof RiskMitigationSchema>;
export type ResourceAllocationDto = z.infer<typeof ResourceAllocationSchema>;
export type BudgetLineDto = z.infer<typeof BudgetLineSchema>;
export type ProjectDocumentDto = z.infer<typeof ProjectDocumentSchema>;
export type ActivityLogDto = z.infer<typeof ActivityLogSchema>;
