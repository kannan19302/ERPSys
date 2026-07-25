import { z } from "zod";

// ── Learning & Development ──
export const createLearningCourseSchema = z.object({
  title: z.string().min(1),
  code: z.string().min(1),
  description: z.string().optional(),
  category: z.string().optional(),
  durationHours: z.number().optional(),
  provider: z.string().optional(),
  deliveryMode: z.string().optional(),
  difficulty: z.string().optional(),
  cost: z.number().optional(),
  maxAttendees: z.number().int().optional(),
  isMandatory: z.boolean().optional(),
});
export type CreateLearningCourseInput = z.infer<
  typeof createLearningCourseSchema
>;

export const createLearningModuleSchema = z.object({
  courseId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  orderIndex: z.number().int().optional(),
  contentType: z.string().optional(),
  contentUrl: z.string().optional(),
  durationMin: z.number().int().optional(),
  isRequired: z.boolean().optional(),
});
export type CreateLearningModuleInput = z.infer<
  typeof createLearningModuleSchema
>;

export const createLearningEnrollmentSchema = z.object({
  courseId: z.string().min(1),
  employeeId: z.string().min(1),
  status: z.string().optional(),
});
export type CreateLearningEnrollmentInput = z.infer<
  typeof createLearningEnrollmentSchema
>;

export const createCertificationSchema = z.object({
  employeeId: z.string().min(1),
  name: z.string().min(1),
  issuingBody: z.string().min(1),
  credentialId: z.string().optional(),
  issueDate: z.string().min(1),
  expiryDate: z.string().optional(),
  neverExpires: z.boolean().optional(),
  documentUrl: z.string().optional(),
});
export type CreateCertificationInput = z.infer<
  typeof createCertificationSchema
>;

export const createSkillMatrixSchema = z.object({
  name: z.string().min(1),
  category: z.string().optional(),
  description: z.string().optional(),
});
export type CreateSkillMatrixInput = z.infer<typeof createSkillMatrixSchema>;

export const createSkillGapAnalysisSchema = z.object({
  employeeId: z.string().min(1),
  skillId: z.string().min(1),
  currentLevel: z.string().min(1),
  requiredLevel: z.string().min(1),
  notes: z.string().optional(),
});
export type CreateSkillGapAnalysisInput = z.infer<
  typeof createSkillGapAnalysisSchema
>;

export const createCareerPathSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  fromPosition: z.string().min(1),
  toPosition: z.string().min(1),
  typicalDurationMonths: z.number().int().optional(),
});
export type CreateCareerPathInput = z.infer<typeof createCareerPathSchema>;

export const createMentoringProgramSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  objectives: z.string().optional(),
  startDate: z.string().min(1),
  endDate: z.string().optional(),
  maxPairs: z.number().int().optional(),
});
export type CreateMentoringProgramInput = z.infer<
  typeof createMentoringProgramSchema
>;

export const createMentoringSessionSchema = z.object({
  programId: z.string().min(1),
  mentorId: z.string().min(1),
  menteeId: z.string().min(1),
  sessionTopic: z.string().optional(),
  goals: z.any().optional(),
});
export type CreateMentoringSessionInput = z.infer<
  typeof createMentoringSessionSchema
>;

// ── Compensation & Benefits ──
export const createBonusPlanSchema = z.object({
  name: z.string().min(1),
  planType: z.string().min(1),
  eligibilityRule: z.string().optional(),
  calculationBasis: z.string().optional(),
  targetAmount: z.number().optional(),
  maxAmount: z.number().optional(),
  payoutFrequency: z.string().optional(),
});
export type CreateBonusPlanInput = z.infer<typeof createBonusPlanSchema>;

export const createBonusPayoutSchema = z.object({
  planId: z.string().min(1),
  employeeId: z.string().min(1),
  amount: z.number().positive(),
  payoutDate: z.string().min(1),
  percentage: z.number().optional(),
  reason: z.string().optional(),
  approvedBy: z.string().optional(),
  notes: z.string().optional(),
});
export type CreateBonusPayoutInput = z.infer<typeof createBonusPayoutSchema>;

export const createEquityGrantSchema = z.object({
  employeeId: z.string().min(1),
  grantType: z.string().min(1),
  totalShares: z.number().positive(),
  sharePrice: z.number().positive(),
  grantDate: z.string().min(1),
  cliffMonths: z.number().int().optional(),
  vestingMonths: z.number().int().optional(),
  vestingSchedule: z.string().optional(),
});
export type CreateEquityGrantInput = z.infer<typeof createEquityGrantSchema>;

export const createBenefitsEligibilityRuleSchema = z.object({
  name: z.string().min(1),
  benefitType: z.string().min(1),
  employmentType: z.string().optional(),
  minTenureMonths: z.number().int().optional(),
  minHoursPerWeek: z.number().optional(),
  jobGrade: z.string().optional(),
  location: z.string().optional(),
});
export type CreateBenefitsEligibilityRuleInput = z.infer<
  typeof createBenefitsEligibilityRuleSchema
>;

export const createFlexibleBenefitCreditSchema = z.object({
  employeeId: z.string().min(1),
  fiscalYear: z.number().int().min(2020),
  totalCredit: z.number().positive(),
});
export type CreateFlexibleBenefitCreditInput = z.infer<
  typeof createFlexibleBenefitCreditSchema
>;

export const createCompensationReviewSchema = z.object({
  employeeId: z.string().min(1),
  reviewCycle: z.string().min(1),
  currentSalary: z.number().positive(),
  recommendedSalary: z.number().optional(),
  effectiveDate: z.string().optional(),
  reviewerId: z.string().optional(),
  notes: z.string().optional(),
});
export type CreateCompensationReviewInput = z.infer<
  typeof createCompensationReviewSchema
>;

export const createCompensationBenchmarkSchema = z.object({
  positionTitle: z.string().min(1),
  marketSource: z.string().min(1),
  p10: z.number().optional(),
  p25: z.number().optional(),
  p50: z.number().optional(),
  p75: z.number().optional(),
  p90: z.number().optional(),
  currency: z.string().optional(),
  geographicArea: z.string().optional(),
  dataYear: z.number().int(),
});
export type CreateCompensationBenchmarkInput = z.infer<
  typeof createCompensationBenchmarkSchema
>;

// ── HR Operations ──
export const createHrTicketSchema = z.object({
  categoryId: z.string().optional(),
  employeeId: z.string().min(1),
  subject: z.string().min(1),
  description: z.string().min(1),
  priority: z.string().optional(),
  source: z.string().optional(),
});
export type CreateHrTicketInput = z.infer<typeof createHrTicketSchema>;

export const createEmployeeGrievanceSchema = z.object({
  employeeId: z.string().min(1),
  grievanceType: z.string().min(1),
  subject: z.string().min(1),
  description: z.string().min(1),
  severity: z.string().optional(),
});
export type CreateEmployeeGrievanceInput = z.infer<
  typeof createEmployeeGrievanceSchema
>;

export const createBackgroundCheckRequestSchema = z.object({
  candidateId: z.string().optional(),
  employeeId: z.string().optional(),
  checkType: z.string().min(1),
  vendorName: z.string().optional(),
  notes: z.string().optional(),
});
export type CreateBackgroundCheckRequestInput = z.infer<
  typeof createBackgroundCheckRequestSchema
>;

export const createVisaRecordSchema = z.object({
  employeeId: z.string().min(1),
  visaType: z.string().min(1),
  visaNumber: z.string().min(1),
  issuingCountry: z.string().min(1),
  issuedDate: z.string().min(1),
  expiryDate: z.string().min(1),
  isSponsored: z.boolean().optional(),
  notes: z.string().optional(),
});
export type CreateVisaRecordInput = z.infer<typeof createVisaRecordSchema>;

export const createEmployeeWellnessProgramSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  programType: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().optional(),
});
export type CreateEmployeeWellnessProgramInput = z.infer<
  typeof createEmployeeWellnessProgramSchema
>;

// ── Workforce Planning & DEI ──
export const createHeadcountPlanSchema = z.object({
  name: z.string().min(1),
  fiscalYear: z.number().int(),
  description: z.string().optional(),
});
export type CreateHeadcountPlanInput = z.infer<
  typeof createHeadcountPlanSchema
>;

export const createHeadcountPlanLineSchema = z.object({
  planId: z.string().min(1),
  departmentId: z.string().optional(),
  positionTitle: z.string().min(1),
  headcountRequested: z.number().int().positive(),
  employmentType: z.string().optional(),
  budgetedSalary: z.number().optional(),
  priority: z.string().optional(),
  justification: z.string().optional(),
});
export type CreateHeadcountPlanLineInput = z.infer<
  typeof createHeadcountPlanLineSchema
>;

export const createSuccessionPlanSchema = z.object({
  positionId: z.string().min(1),
  riskLevel: z.string().optional(),
  readiness: z.string().optional(),
  notes: z.string().optional(),
});
export type CreateSuccessionPlanInput = z.infer<
  typeof createSuccessionPlanSchema
>;

export const createDEIMetricSchema = z.object({
  metricName: z.string().min(1),
  category: z.string().optional(),
  dimension: z.string().min(1),
  value: z.number(),
  unit: z.string().optional(),
  period: z.string().min(1),
  fiscalYear: z.number().int(),
});
export type CreateDEIMetricInput = z.infer<typeof createDEIMetricSchema>;

export const createTurnoverPredictionSchema = z.object({
  employeeId: z.string().min(1),
  predictionScore: z.number().min(0).max(100),
  riskLevel: z.string().min(1),
  topFactors: z.any().optional(),
  predictedDate: z.string().optional(),
  actionNote: z.string().optional(),
});
export type CreateTurnoverPredictionInput = z.infer<
  typeof createTurnoverPredictionSchema
>;

export const createComplianceRequirementSchema = z.object({
  name: z.string().min(1),
  regulation: z.string().min(1),
  description: z.string().optional(),
  jurisdiction: z.string().optional(),
  frequency: z.string().optional(),
});
export type CreateComplianceRequirementInput = z.infer<
  typeof createComplianceRequirementSchema
>;

// ── Employee Experience & Engagement ──
export const createEmployeeRecognitionSchema = z.object({
  employeeId: z.string().min(1),
  awardId: z.string().optional(),
  recognizedBy: z.string().min(1),
  category: z.string().optional(),
  title: z.string().min(1),
  message: z.string().optional(),
  points: z.number().int().optional(),
  isPublic: z.boolean().optional(),
});
export type CreateEmployeeRecognitionInput = z.infer<
  typeof createEmployeeRecognitionSchema
>;

export const createWellnessChallengeSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  challengeType: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  goalMetric: z.string().min(1),
  goalValue: z.number().positive(),
  isTeamBased: z.boolean().optional(),
});
export type CreateWellnessChallengeInput = z.infer<
  typeof createWellnessChallengeSchema
>;

export const createENPSurveySchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
});
export type CreateENPSurveyInput = z.infer<typeof createENPSurveySchema>;

export const createPulseSurveySchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  frequency: z.string().optional(),
  questions: z.any().optional(),
  departmentId: z.string().optional(),
});
export type CreatePulseSurveyInput = z.infer<typeof createPulseSurveySchema>;

export const submitSurveyResponseSchema = z.object({
  surveyId: z.string().min(1),
  surveyType: z.string().min(1),
  employeeId: z.string().min(1),
  responses: z.any(),
  score: z.number().int().optional(),
  comments: z.string().optional(),
  isAnonymous: z.boolean().optional(),
});
export type SubmitSurveyResponseInput = z.infer<
  typeof submitSurveyResponseSchema
>;

export const createAlumniRecordSchema = z.object({
  employeeId: z.string().min(1),
  lastPosition: z.string().min(1),
  lastDepartment: z.string().optional(),
  employmentStart: z.string().min(1),
  employmentEnd: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  linkedInUrl: z.string().optional(),
  notes: z.string().optional(),
});
export type CreateAlumniRecordInput = z.infer<typeof createAlumniRecordSchema>;

export const createAlumniEventSchema = z.object({
  organizerId: z.string().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  eventDate: z.string().min(1),
  location: z.string().optional(),
  eventType: z.string().optional(),
  maxAttendees: z.number().int().optional(),
});
export type CreateAlumniEventInput = z.infer<typeof createAlumniEventSchema>;

// ── Employee ──
export const createEmployeeSchema = z.object({
  employeeCode: z.string().min(1),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  designation: z.string().optional(),
  departmentId: z.string().optional(),
  dateOfBirth: z.string().optional(),
  dateOfJoining: z.string().optional(),
  employmentType: z.string().optional(),
  status: z.string().optional(),
  positionId: z.string().optional(),
  grade: z.string().optional(),
  reportingManagerId: z.string().optional(),
  workLocation: z.string().optional(),
  bankDetails: z.any().optional(),
  address: z.any().optional(),
  emergencyContact: z.any().optional(),
  notes: z.string().optional(),
  orgId: z.string().optional(),
});
export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;

export const updateEmployeeSchema = createEmployeeSchema.partial();
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;

// ── Department ──
export const createDepartmentSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  parentId: z.string().optional(),
  managerId: z.string().optional(),
  description: z.string().optional(),
  costCenterId: z.string().optional(),
});
export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;
export const updateDepartmentSchema = createDepartmentSchema.partial();

// ── Position ──
export const createPositionSchema = z.object({
  title: z.string().min(1),
  code: z.string().min(1),
  departmentId: z.string().optional(),
  jobGrade: z.string().optional(),
  description: z.string().optional(),
  requirements: z.string().optional(),
  minSalary: z.number().optional(),
  maxSalary: z.number().optional(),
});
export type CreatePositionInput = z.infer<typeof createPositionSchema>;
export const updatePositionSchema = createPositionSchema.partial();

// ── Leave ──
export const createLeaveTypeSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  defaultDays: z.number().int().positive(),
  carryForwardDays: z.number().int().optional(),
  carryForwardExpiryMonths: z.number().int().optional(),
  isPaid: z.boolean().optional(),
  requiresApproval: z.boolean().optional(),
  color: z.string().optional(),
});
export type CreateLeaveTypeInput = z.infer<typeof createLeaveTypeSchema>;
export const updateLeaveTypeSchema = createLeaveTypeSchema.partial();

export const createLeaveRequestSchema = z.object({
  leaveTypeId: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  reason: z.string().optional(),
  halfDay: z.boolean().optional(),
  isFirstHalf: z.boolean().optional(),
  contactDuringLeave: z.string().optional(),
});
export type CreateLeaveRequestInput = z.infer<typeof createLeaveRequestSchema>;

export const createLeaveBalanceSchema = z.object({
  employeeId: z.string().min(1),
  leaveTypeId: z.string().min(1),
  totalDays: z.number().positive(),
  usedDays: z.number().optional(),
  pendingDays: z.number().optional(),
  year: z.number().int().optional(),
});
export type CreateLeaveBalanceInput = z.infer<typeof createLeaveBalanceSchema>;

// ── Attendance ──
export const createAttendanceSchema = z.object({
  employeeId: z.string().min(1),
  date: z.string().min(1),
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
  status: z.string().optional(),
  overtimeHours: z.number().optional(),
  shiftId: z.string().optional(),
  notes: z.string().optional(),
});
export type CreateAttendanceInput = z.infer<typeof createAttendanceSchema>;

export const createShiftSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  graceMinutes: z.number().int().optional(),
  lateThresholdMinutes: z.number().int().optional(),
  isNightShift: z.boolean().optional(),
  workingDays: z.array(z.string()).optional(),
});
export type CreateShiftInput = z.infer<typeof createShiftSchema>;

// ── Payroll ──
export const createSalaryStructureSchema = z.object({
  employeeId: z.string().min(1),
  baseSalary: z.number().positive(),
  effectiveFrom: z.string().min(1),
  effectiveTo: z.string().optional(),
  components: z
    .array(z.object({ name: z.string(), type: z.string(), amount: z.number() }))
    .optional(),
  allowances: z.any().optional(),
  deductions: z.any().optional(),
});
export type CreateSalaryStructureInput = z.infer<
  typeof createSalaryStructureSchema
>;

export const createPayRunSchema = z.object({
  name: z.string().min(1),
  periodStart: z.string().min(1),
  periodEnd: z.string().min(1),
  paymentDate: z.string().min(1),
  runType: z.string().optional(),
  notes: z.string().optional(),
});
export type CreatePayRunInput = z.infer<typeof createPayRunSchema>;

export const createPayRunItemSchema = z.object({
  payRunId: z.string().min(1),
  employeeId: z.string().min(1),
  grossPay: z.number().positive(),
  totalDeductions: z.number().optional(),
  netPay: z.number().positive(),
  earnings: z.any().optional(),
  deductions: z.any().optional(),
  employerContributions: z.any().optional(),
});
export type CreatePayRunItemInput = z.infer<typeof createPayRunItemSchema>;

// ── Performance ──
export const createPerformanceReviewSchema = z.object({
  employeeId: z.string().min(1),
  reviewerId: z.string().optional(),
  period: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  reviewType: z.string().optional(),
  overallRating: z.number().optional(),
  status: z.string().optional(),
  notes: z.string().optional(),
});
export type CreatePerformanceReviewInput = z.infer<
  typeof createPerformanceReviewSchema
>;

// ── Training ──
export const createTrainingCourseSchema = z.object({
  title: z.string().min(1),
  code: z.string().min(1),
  description: z.string().optional(),
  category: z.string().optional(),
  durationHours: z.number().positive().optional(),
  provider: z.string().optional(),
  cost: z.number().optional(),
  maxAttendees: z.number().int().optional(),
});
export type CreateTrainingCourseInput = z.infer<
  typeof createTrainingCourseSchema
>;

export const createTrainingSessionSchema = z.object({
  courseId: z.string().min(1),
  title: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().optional(),
  location: z.string().optional(),
  instructor: z.string().optional(),
  status: z.string().optional(),
});
export type CreateTrainingSessionInput = z.infer<
  typeof createTrainingSessionSchema
>;

export const enrollTrainingSchema = z.object({
  sessionId: z.string().min(1),
  employeeId: z.string().min(1),
});
export type EnrollTrainingInput = z.infer<typeof enrollTrainingSchema>;

// ── Employee Document ──
export const createEmployeeDocumentSchema = z.object({
  employeeId: z.string().min(1),
  name: z.string().min(1),
  docType: z.string().min(1),
  fileUrl: z.string().optional(),
  expiryDate: z.string().optional(),
  notes: z.string().optional(),
});
export type CreateEmployeeDocumentInput = z.infer<
  typeof createEmployeeDocumentSchema
>;

// ── Timesheet ──
export const createTimesheetEntrySchema = z.object({
  employeeId: z.string().min(1),
  date: z.string().min(1),
  projectId: z.string().optional(),
  taskId: z.string().optional(),
  hours: z.number().positive(),
  description: z.string().optional(),
  billable: z.boolean().optional(),
});
export type CreateTimesheetEntryInput = z.infer<
  typeof createTimesheetEntrySchema
>;

// ── Expense ──
export const createHrExpenseSchema = z.object({
  employeeId: z.string().min(1),
  category: z.string().min(1),
  amount: z.number().positive(),
  expenseDate: z.string().min(1),
  description: z.string().optional(),
  receiptUrl: z.string().optional(),
  projectId: z.string().optional(),
});
export type CreateHrExpenseInput = z.infer<typeof createHrExpenseSchema>;

// ── Recruitment ──
export const createJobPostingSchema = z.object({
  title: z.string().min(1),
  departmentId: z.string().optional(),
  description: z.string().optional(),
  requirements: z.string().optional(),
  location: z.string().optional(),
  employmentType: z.string().optional(),
  salaryRange: z.any().optional(),
  status: z.string().optional(),
});
export type CreateJobPostingInput = z.infer<typeof createJobPostingSchema>;

export const createApplicantSchema = z.object({
  jobPostingId: z.string().min(1),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  resumeUrl: z.string().optional(),
  coverLetter: z.string().optional(),
  currentStage: z.string().optional(),
  notes: z.string().optional(),
});
export type CreateApplicantInput = z.infer<typeof createApplicantSchema>;

export const createInterviewSchema = z.object({
  applicantId: z.string().min(1),
  jobPostingId: z.string().min(1),
  interviewerId: z.string().optional(),
  scheduledAt: z.string().min(1),
  durationMin: z.number().int().optional(),
  round: z.string().optional(),
  status: z.string().optional(),
  feedback: z.string().optional(),
  rating: z.number().int().optional(),
});
export type CreateInterviewInput = z.infer<typeof createInterviewSchema>;

// ── Goals & OKRs ──
export const createGoalSchema = z.object({
  employeeId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  category: z.string().optional(),
  type: z.string().optional(),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  weight: z.number().int().optional(),
});
export type CreateGoalInput = z.infer<typeof createGoalSchema>;

// ── HR Dashboard ──
export interface HrDashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  newHiresThisMonth: number;
  departuresThisMonth: number;
  pendingLeaveRequests: number;
  openPositions: number;
  attendanceToday: { present: number; absent: number; onLeave: number };
  departmentCount: number;
}

// ── Employee Achievement ──
export const createEmployeeAchievementSchema = z.object({
  employeeId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  awardDate: z.string().min(1),
  awardedBy: z.string().optional(),
  category: z.string().optional(),
});
export type CreateEmployeeAchievementInput = z.infer<
  typeof createEmployeeAchievementSchema
>;

// ── Employee Referral ──
export const createEmployeeReferralSchema = z.object({
  referringEmployeeId: z.string().min(1),
  candidateName: z.string().min(1),
  candidateEmail: z.string().email(),
  candidatePhone: z.string().optional(),
  position: z.string().optional(),
  relationship: z.string().optional(),
  notes: z.string().optional(),
});
export type CreateEmployeeReferralInput = z.infer<
  typeof createEmployeeReferralSchema
>;

// ── Employee Education ──
export const createEmployeeEducationSchema = z.object({
  employeeId: z.string().min(1),
  degree: z.string().min(1),
  institution: z.string().min(1),
  field: z.string().optional(),
  startYear: z.number().int().optional(),
  endYear: z.number().int().optional(),
  grade: z.string().optional(),
  isHighestDegree: z.boolean().optional(),
});
export type CreateEmployeeEducationInput = z.infer<
  typeof createEmployeeEducationSchema
>;

// ── Employee Dependent ──
export const createEmployeeDependentSchema = z.object({
  employeeId: z.string().min(1),
  name: z.string().min(1),
  relationship: z.string().min(1),
  dateOfBirth: z.string().optional(),
  isNominee: z.boolean().optional(),
  nomineePercent: z.number().int().optional(),
});
export type CreateEmployeeDependentInput = z.infer<
  typeof createEmployeeDependentSchema
>;

// ── Employee Emergency Contact ──
export const createEmployeeEmergencyContactSchema = z.object({
  employeeId: z.string().min(1),
  name: z.string().min(1),
  relationship: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().optional(),
  address: z.string().optional(),
  isPrimary: z.boolean().optional(),
});
export type CreateEmployeeEmergencyContactInput = z.infer<
  typeof createEmployeeEmergencyContactSchema
>;

// ── HR Expense Claim ──
export const createHrExpenseClaimSchema = z.object({
  employeeId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  totalAmount: z.number().positive(),
  currency: z.string().optional(),
  items: z
    .array(
      z.object({
        category: z.string().min(1),
        description: z.string().min(1),
        amount: z.number().positive(),
        expenseDate: z.string().min(1),
        receiptUrl: z.string().optional(),
        currency: z.string().optional(),
      }),
    )
    .optional(),
  notes: z.string().optional(),
});
export type CreateHrExpenseClaimInput = z.infer<
  typeof createHrExpenseClaimSchema
>;

// ── Employee Promotion ──
export const createEmployeePromotionSchema = z.object({
  employeeId: z.string().min(1),
  previousTitle: z.string().min(1),
  newTitle: z.string().min(1),
  previousGrade: z.string().optional(),
  newGrade: z.string().optional(),
  previousSalary: z.number().optional(),
  newSalary: z.number().optional(),
  promotionDate: z.string().min(1),
  promotionType: z.string().optional(),
  reason: z.string().optional(),
  approvedBy: z.string().optional(),
});
export type CreateEmployeePromotionInput = z.infer<
  typeof createEmployeePromotionSchema
>;

// ── Employee Separation ──
export const createEmployeeSeparationSchema = z.object({
  employeeId: z.string().min(1),
  separationType: z.string().min(1),
  lastWorkingDay: z.string().min(1),
  reason: z.string().optional(),
  isEligibleForRehire: z.boolean().optional(),
  noticePeriodDays: z.number().int().optional(),
  settlementAmount: z.number().optional(),
  approvedBy: z.string().optional(),
});
export type CreateEmployeeSeparationInput = z.infer<
  typeof createEmployeeSeparationSchema
>;

// ── Exit Interview ──
export const createExitInterviewSchema = z.object({
  employeeId: z.string().min(1),
  separationId: z.string().optional(),
  interviewDate: z.string().min(1),
  interviewer: z.string().optional(),
  reasonForLeaving: z.string().optional(),
  feedback: z.string().optional(),
  suggestions: z.string().optional(),
  wouldReturn: z.boolean().optional(),
  wouldRecommend: z.boolean().optional(),
  satisfactionScore: z.number().int().min(1).max(5).optional(),
});
export type CreateExitInterviewInput = z.infer<
  typeof createExitInterviewSchema
>;

// ── Employee Warning ──
export const createEmployeeWarningSchema = z.object({
  employeeId: z.string().min(1),
  warningType: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  issuedBy: z.string().min(1),
  issuedDate: z.string().min(1),
  expiryDate: z.string().optional(),
  resolution: z.string().optional(),
});
export type CreateEmployeeWarningInput = z.infer<
  typeof createEmployeeWarningSchema
>;

// ── HR Policy ──
export const createHrPolicySchema = z.object({
  title: z.string().min(1),
  category: z.string().min(1),
  content: z.string().min(1),
  version: z.string().optional(),
  effectiveDate: z.string().min(1),
  requiresAcknowledgment: z.boolean().optional(),
  status: z.string().optional(),
});
export type CreateHrPolicyInput = z.infer<typeof createHrPolicySchema>;

// ── HR Announcement ──
export const createHrAnnouncementSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  category: z.string().optional(),
  priority: z.string().optional(),
  startsAt: z.string().min(1),
  expiresAt: z.string().optional(),
  pinned: z.boolean().optional(),
});
export type CreateHrAnnouncementInput = z.infer<
  typeof createHrAnnouncementSchema
>;

// ── Recruitment Agency ──
export const createRecruitmentAgencySchema = z.object({
  name: z.string().min(1),
  contactPerson: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  commissionRate: z.number().optional(),
  agreementUrl: z.string().optional(),
  status: z.string().optional(),
});
export type CreateRecruitmentAgencyInput = z.infer<
  typeof createRecruitmentAgencySchema
>;

// ── Offer Template ──
export const createOfferTemplateSchema = z.object({
  name: z.string().min(1),
  content: z.string().min(1),
  variables: z.array(z.string()).optional(),
});
export type CreateOfferTemplateInput = z.infer<
  typeof createOfferTemplateSchema
>;

// ── Salary Revision ──
export const createSalaryRevisionSchema = z.object({
  employeeId: z.string().min(1),
  previousSalary: z.number().positive(),
  newSalary: z.number().positive(),
  revisionType: z.string().optional(),
  effectiveDate: z.string().min(1),
  reason: z.string().optional(),
  approvedBy: z.string().optional(),
});
export type CreateSalaryRevisionInput = z.infer<
  typeof createSalaryRevisionSchema
>;

// ── Overtime Request ──
export const createOvertimeRequestSchema = z.object({
  employeeId: z.string().min(1),
  date: z.string().min(1),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  totalHours: z.number().positive(),
  rate: z.number().optional(),
  reason: z.string().optional(),
});
export type CreateOvertimeRequestInput = z.infer<
  typeof createOvertimeRequestSchema
>;

// ── Attendance Adjustment ──
export const createAttendanceAdjustmentSchema = z.object({
  employeeId: z.string().min(1),
  attendanceId: z.string().optional(),
  date: z.string().min(1),
  previousCheckIn: z.string().optional(),
  previousCheckOut: z.string().optional(),
  newCheckIn: z.string().optional(),
  newCheckOut: z.string().optional(),
  reason: z.string().min(1),
});
export type CreateAttendanceAdjustmentInput = z.infer<
  typeof createAttendanceAdjustmentSchema
>;

// ── KPI Template ──
export const createKpiTemplateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.string().optional(),
  metricType: z.string().min(1),
  targetValue: z.number().optional(),
  unit: z.string().optional(),
});
export type CreateKpiTemplateInput = z.infer<typeof createKpiTemplateSchema>;

// ── KPI Evaluation ──
export const createKpiEvaluationSchema = z.object({
  employeeId: z.string().min(1),
  kpiTemplateId: z.string().min(1),
  period: z.string().min(1),
  targetValue: z.number().positive(),
  actualValue: z.number().optional(),
  weightage: z.number().int().optional(),
  reviewerId: z.string().optional(),
  notes: z.string().optional(),
});
export type CreateKpiEvaluationInput = z.infer<
  typeof createKpiEvaluationSchema
>;

// ── Enhanced HR Dashboard Stats ──
export interface EnhancedHrDashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  newHiresThisMonth: number;
  departuresThisMonth: number;
  pendingLeaveRequests: number;
  openPositions: number;
  attendanceToday: {
    present: number;
    absent: number;
    onLeave: number;
    late: number;
  };
  departmentCount: number;
  pendingExpenseClaims: number;
  pendingOvertimeRequests: number;
  openTickets: number;
  upcomingEvents: number;
  headcountByDepartment: Array<{
    departmentId: string;
    departmentName: string;
    count: number;
  }>;
  headcountByEmploymentType: Array<{ type: string; count: number }>;
  recentNewHires: Array<{
    id: string;
    firstName: string;
    lastName: string;
    designation: string;
    dateOfJoining: string;
  }>;
  upcomingBirthdays: Array<{
    id: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
  }>;
  upcomingAnniversaries: Array<{
    id: string;
    firstName: string;
    lastName: string;
    yearsOfService: number;
    dateOfJoining: string;
  }>;
}
