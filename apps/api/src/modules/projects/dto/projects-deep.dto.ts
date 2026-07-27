import { z } from "zod";

// ── Pack 1: Program Management ──
export const CreateProgramSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  description: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  budget: z.number().positive().optional(),
  strategicAlignment: z.enum(["HIGH", "MEDIUM", "LOW"]).optional(),
  sponsorId: z.string().optional(),
  managerId: z.string().optional(),
});

export const AddProgramProjectSchema = z.object({
  projectId: z.string(),
});

export const TrackProgramBenefitSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  metric: z.enum(["ROI", "NPV", "PAYBACK"]).optional(),
  targetValue: z.number().positive().optional(),
  targetDate: z.string().optional(),
});

// ── Pack 2: Agile/Scrum ──
export const CreateSprintSchema = z.object({
  projectId: z.string(),
  name: z.string().min(1),
  goal: z.string().optional(),
  startDate: z.string(),
  endDate: z.string(),
  capacity: z.number().int().positive().optional(),
});

export const CreateBacklogItemSchema = z.object({
  projectId: z.string(),
  type: z.enum(["EPIC", "STORY", "TASK", "BUG", "SPIKE"]).optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  priority: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]).optional(),
  storyPoints: z.number().int().positive().optional(),
  assigneeId: z.string().optional(),
  epicId: z.string().optional(),
  acceptanceCriteria: z.string().optional(),
  labels: z.string().optional(),
});

export const MoveToSprintSchema = z.object({
  backlogItemIds: z.array(z.string()),
});

// ── Pack 3: Resource Skills ──
export const AddEmployeeSkillSchema = z.object({
  employeeId: z.string(),
  skillId: z.string(),
  proficiency: z
    .enum(["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"])
    .optional(),
  yearsExp: z.number().int().positive().optional(),
  notes: z.string().optional(),
});

export const CreateSkillSchema = z.object({
  name: z.string().min(1),
  category: z
    .enum([
      "TECHNICAL",
      "MANAGEMENT",
      "LANGUAGE",
      "SOFT_SKILL",
      "CERTIFICATION",
    ])
    .optional(),
  description: z.string().optional(),
});

export const TrackCertificationSchema = z.object({
  employeeId: z.string(),
  name: z.string().min(1),
  issuingBody: z.string().optional(),
  credentialId: z.string().optional(),
  issueDate: z.string(),
  expiryDate: z.string().optional(),
  attachmentUrl: z.string().optional(),
  notes: z.string().optional(),
});

// ── Pack 4: Advanced EVM ──
export const CreateEvmForecastSchema = z.object({
  projectId: z.string(),
  eac: z.number(),
  etc: z.number(),
  vac: z.number(),
  tcpi: z.number(),
  bac: z.number(),
  cpi: z.number(),
  spi: z.number(),
  method: z.enum(["FORMULA", "MANUAL", "WEIGHTED"]).optional(),
  notes: z.string().optional(),
});

export const SetEvmKpiTargetSchema = z.object({
  projectId: z.string(),
  kpi: z.enum(["CPI_TARGET", "SPI_TARGET", "TCPI_TARGET", "VAC_LIMIT"]),
  targetMin: z.number().optional(),
  targetMax: z.number().optional(),
  threshold: z.enum(["WARNING", "CRITICAL", "INFO"]).optional(),
});

// ── Pack 5: CAPEX ──
export const CreateCapexProjectSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  description: z.string().optional(),
  justification: z.string().optional(),
  category: z
    .enum([
      "INFRASTRUCTURE",
      "EQUIPMENT",
      "SOFTWARE",
      "FACILITIES",
      "R_D",
      "OTHER",
    ])
    .optional(),
  totalBudget: z.number().positive(),
  requestDate: z.string(),
  expectedLifeYears: z.number().int().positive().optional(),
  residualValue: z.number().optional(),
  depreciationMethod: z
    .enum(["STRAIGHT_LINE", "DECLINING", "SUM_OF_YEARS", "UNITS"])
    .optional(),
  projectId: z.string().optional(),
});

export const AddCapexBudgetLineSchema = z.object({
  capexId: z.string(),
  category: z.enum([
    "EQUIPMENT",
    "LABOR",
    "MATERIAL",
    "CONSULTING",
    "SOFTWARE",
    "OTHER",
  ]),
  description: z.string(),
  requested: z.number().positive(),
  fiscalYear: z.string().optional(),
  notes: z.string().optional(),
});

export const ConductGateReviewSchema = z.object({
  capexId: z.string(),
  gateName: z.string(),
  gateNumber: z.number().int().positive(),
  status: z.enum(["PASSED", "FAILED", "WAIVED"]),
  reviewerId: z.string().optional(),
  comments: z.string().optional(),
  score: z.number().int().min(0).max(100).optional(),
});

// ── Pack 6: Claims ──
export const CreateClaimSchema = z.object({
  projectId: z.string(),
  claimNumber: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  claimType: z
    .enum(["CONTRACTUAL", "EXTRAPRICE", "DELAY", "DAMAGE", "OTHER"])
    .optional(),
  claimedAmount: z.number().positive(),
  assigneeId: z.string().optional(),
  priority: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]).optional(),
});

export const SubmitVariationOrderSchema = z.object({
  projectId: z.string(),
  claimId: z.string().optional(),
  variationNumber: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  changeType: z
    .enum(["SCOPE", "SCHEDULE", "COST", "QUALITY", "OTHER"])
    .optional(),
  costImpact: z.number().optional(),
  scheduleImpact: z.number().int().optional(),
  notes: z.string().optional(),
});

// ── Pack 7: PMO ──
export const CreateScorecardSchema = z.object({
  projectId: z.string(),
  overallScore: z.number().min(0).max(100).optional(),
  healthColor: z.enum(["GREEN", "YELLOW", "RED"]).optional(),
  assessedBy: z.string().optional(),
  notes: z.string().optional(),
  dimensions: z
    .array(
      z.object({
        dimension: z.enum([
          "SCHEDULE",
          "COST",
          "QUALITY",
          "RESOURCE",
          "RISK",
          "STAKEHOLDER",
          "SCOPE",
        ]),
        score: z.number().min(0).max(100).optional(),
        weight: z.number().min(0).max(1).optional(),
        status: z
          .enum(["ON_TRACK", "AT_RISK", "OFF_TRACK", "NOT_APPLICABLE"])
          .optional(),
        comments: z.string().optional(),
      }),
    )
    .optional(),
});

export const AssessStageGateSchema = z.object({
  projectId: z.string(),
  gateName: z.string(),
  gateNumber: z.number().int().positive(),
  status: z.enum(["PASSED", "FAILED", "WAIVED"]),
  reviewerId: z.string().optional(),
  decision: z.enum(["APPROVED", "REJECTED", "CONDITIONAL"]).optional(),
  comments: z.string().optional(),
  score: z.number().int().min(0).max(100).optional(),
  checklist: z
    .array(
      z.object({
        item: z.string(),
        isRequired: z.boolean().optional(),
        isCompleted: z.boolean(),
        notes: z.string().optional(),
      }),
    )
    .optional(),
});

// ── Pack 8: Collaboration ──
export const PostDiscussionSchema = z.object({
  projectId: z.string(),
  title: z.string().min(1),
  content: z.string().min(1),
  tags: z.string().optional(),
});

export const ReplyToDiscussionSchema = z.object({
  content: z.string().min(1),
  parentReplyId: z.string().optional(),
});

export const CreateDocumentReviewSchema = z.object({
  projectId: z.string(),
  documentId: z.string().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  reviewerId: z.string().optional(),
  dueDate: z.string().optional(),
});

export const CreateWikiPageSchema = z.object({
  projectId: z.string(),
  title: z.string().min(1),
  slug: z.string().min(1),
  content: z.string(),
});

export type CreateProgramDto = z.infer<typeof CreateProgramSchema>;
export type AddProgramProjectDto = z.infer<typeof AddProgramProjectSchema>;
export type TrackProgramBenefitDto = z.infer<typeof TrackProgramBenefitSchema>;
export type CreateSprintDto = z.infer<typeof CreateSprintSchema>;
export type CreateBacklogItemDto = z.infer<typeof CreateBacklogItemSchema>;
export type MoveToSprintDto = z.infer<typeof MoveToSprintSchema>;
export type AddEmployeeSkillDto = z.infer<typeof AddEmployeeSkillSchema>;
export type CreateSkillDto = z.infer<typeof CreateSkillSchema>;
export type TrackCertificationDto = z.infer<typeof TrackCertificationSchema>;
export type CreateEvmForecastDto = z.infer<typeof CreateEvmForecastSchema>;
export type SetEvmKpiTargetDto = z.infer<typeof SetEvmKpiTargetSchema>;
export type CreateCapexProjectDto = z.infer<typeof CreateCapexProjectSchema>;
export type AddCapexBudgetLineDto = z.infer<typeof AddCapexBudgetLineSchema>;
export type ConductGateReviewDto = z.infer<typeof ConductGateReviewSchema>;
export type CreateClaimDto = z.infer<typeof CreateClaimSchema>;
export type SubmitVariationOrderDto = z.infer<
  typeof SubmitVariationOrderSchema
>;
export type CreateScorecardDto = z.infer<typeof CreateScorecardSchema>;
export type AssessStageGateDto = z.infer<typeof AssessStageGateSchema>;
export type PostDiscussionDto = z.infer<typeof PostDiscussionSchema>;
export type ReplyToDiscussionDto = z.infer<typeof ReplyToDiscussionSchema>;
export type CreateDocumentReviewDto = z.infer<
  typeof CreateDocumentReviewSchema
>;
export type CreateWikiPageDto = z.infer<typeof CreateWikiPageSchema>;

// ── Inline schemas used by controllers ──
export const AddProgramFinancialSchema = z.object({
  fiscalYear: z.string(),
  category: z.string(),
  amount: z.number(),
  period: z.string().optional(),
  notes: z.string().optional(),
});

export const RetrospectiveSchema = z.object({
  wentWell: z.string().optional(),
  toImprove: z.string().optional(),
  actionItems: z.string().optional(),
  teamMood: z.string().optional(),
});

export const SkillGapSchema = z.object({
  projectId: z.string().optional(),
  skillId: z.string(),
  requiredLevel: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"]),
  currentCoverage: z.number().int().min(0).max(100).optional(),
  recommendations: z.string().optional(),
});

export const ApproveBudgetSchema = z.object({
  approvedBudget: z.number().positive(),
});

export const CapitalizationSchema = z.object({
  assetName: z.string(),
  assetClass: z.string().optional(),
  capitalAmount: z.number().positive(),
  capitalizationDate: z.string(),
  usefulLifeYears: z.number().int().positive(),
  salvageValue: z.number().optional(),
  depreciationMethod: z.string().optional(),
  glAccountId: z.string().optional(),
  notes: z.string().optional(),
});

export const EvaluateClaimSchema = z.object({
  approvedAmount: z.number().optional(),
  status: z.string(),
  notes: z.string().optional(),
});

export const DisputeSchema = z.object({
  method: z.string().optional(),
  resolution: z.string().optional(),
  outcome: z.string().optional(),
  settlementAmount: z.number().optional(),
});

export const ClaimDocSchema = z.object({
  name: z.string(),
  type: z.string().optional(),
  fileUrl: z.string().optional(),
  mimeType: z.string().optional(),
  fileSize: z.number().int().optional(),
  description: z.string().optional(),
});

export const ComplianceSchema = z.object({
  complianceType: z.string(),
  status: z.string(),
  notes: z.string().optional(),
});

export const UpdateReviewSchema = z.object({
  status: z.string().optional(),
  comments: z.string().optional(),
});

export const UpdateWikiSchema = z.object({
  title: z.string().optional(),
  content: z.string().optional(),
});
