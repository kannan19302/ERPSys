import { z } from "zod";

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
  components: z.array(z.object({ name: z.string(), type: z.string(), amount: z.number() })).optional(),
  allowances: z.any().optional(),
  deductions: z.any().optional(),
});
export type CreateSalaryStructureInput = z.infer<typeof createSalaryStructureSchema>;

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
export type CreatePerformanceReviewInput = z.infer<typeof createPerformanceReviewSchema>;

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
export type CreateTrainingCourseInput = z.infer<typeof createTrainingCourseSchema>;

export const createTrainingSessionSchema = z.object({
  courseId: z.string().min(1),
  title: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().optional(),
  location: z.string().optional(),
  instructor: z.string().optional(),
  status: z.string().optional(),
});
export type CreateTrainingSessionInput = z.infer<typeof createTrainingSessionSchema>;

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
export type CreateEmployeeDocumentInput = z.infer<typeof createEmployeeDocumentSchema>;

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
export type CreateTimesheetEntryInput = z.infer<typeof createTimesheetEntrySchema>;

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
