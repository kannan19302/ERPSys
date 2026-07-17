import { Controller, Get, Post, Put, Delete, Param, UseGuards, Req, Query } from '@nestjs/common';
import { z } from 'zod';
import { ZodBody } from '../../common/decorators/zod-body.decorator';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { AdvancedHrService } from './advanced-hr.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
    orgId?: string;
    firstName?: string;
    lastName?: string;
  };
}

@ApiTags('advanced-hr')
@ApiBearerAuth()
@Controller('advanced-hr')
@UseGuards(JwtAuthGuard, RbacGuard)
export class AdvancedHrController {
  constructor(private readonly hrService: AdvancedHrService) {}

  // ── TIER 1: Salary Structures & Components ──
  @ApiOperation({ summary: 'Get salary structures' })
  @Get('salaries')
  @Permissions('hr.employee.read')
  async getSalaryStructures(@Req() req: AuthenticatedRequest): Promise<unknown> {
    return this.hrService.getSalaryStructures(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create salary structure' })
  @Post('salaries')
  @Permissions('hr.employee.create')
  async createSalaryStructure(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: { employeeId: string; baseSalary: number; allowances?: unknown; deductions?: unknown }
  ): Promise<unknown> {
    return this.hrService.createSalaryStructure(req.user.tenantId, dto);
  }

  // ── TIER 1: Payroll ──
  @ApiOperation({ summary: 'Get payroll runs' })
  @Get('payroll')
  @Permissions('hr.payroll.read')
  async getPayrollRuns(@Req() req: AuthenticatedRequest): Promise<unknown> {
    return this.hrService.getPayrollRuns(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Run payroll' })
  @Post('payroll/run')
  @Permissions('hr.payroll.create')
  async runPayroll(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: { periodStart: string; periodEnd: string }
  ): Promise<unknown> {
    return this.hrService.runPayroll(req.user.tenantId, dto);
  }

  // ── TIER 1: Attendance ──
  @ApiOperation({ summary: 'Get attendance records' })
  @Get('attendance')
  @Permissions('hr.employee.read')
  async getAttendanceRecords(
    @Req() req: AuthenticatedRequest,
    @Query('employeeId') employeeId?: string
  ): Promise<unknown> {
    return this.hrService.getAttendanceRecords(req.user.tenantId, employeeId);
  }

  @ApiOperation({ summary: 'Check in' })
  @Post('attendance/check-in')
  @Permissions('hr.employee.create')
  async checkIn(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: { employeeId: string }
  ): Promise<unknown> {
    return this.hrService.checkIn(req.user.tenantId, dto.employeeId);
  }

  @ApiOperation({ summary: 'Check out' })
  @Post('attendance/check-out')
  @Permissions('hr.employee.create')
  async checkOut(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: { employeeId: string }
  ): Promise<unknown> {
    return this.hrService.checkOut(req.user.tenantId, dto.employeeId);
  }

  // ── TIER 1: Employee Documents ──
  @ApiOperation({ summary: 'Get employee documents' })
  @Get('documents/:employeeId')
  @Permissions('hr.employee.read')
  async getEmployeeDocuments(
    @Req() req: AuthenticatedRequest,
    @Param('employeeId') employeeId: string
  ): Promise<unknown> {
    return this.hrService.getEmployeeDocuments(req.user.tenantId, employeeId);
  }

  @ApiOperation({ summary: 'Create employee document' })
  @Post('documents/:employeeId')
  @Permissions('hr.employee.create')
  async createEmployeeDocument(
    @Req() req: AuthenticatedRequest,
    @Param('employeeId') employeeId: string,
    @ZodBody(z.any()) dto: { name: string; docType: string; fileUrl?: string; fileName?: string; expiryDate?: string }
  ): Promise<unknown> {
    return this.hrService.createEmployeeDocument(req.user.tenantId, employeeId, dto);
  }

  // ── TIER 1: Asset Assignments ──
  @ApiOperation({ summary: 'Get assets' })
  @Get('assets')
  @Permissions('hr.employee.read')
  async getAssets(@Req() req: AuthenticatedRequest): Promise<unknown> {
    return this.hrService.getAssets(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Assign asset' })
  @Post('assets')
  @Permissions('hr.employee.create')
  async assignAsset(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: { employeeId: string; assetType: string; assetName: string; serialNumber?: string }
  ): Promise<unknown> {
    return this.hrService.assignAsset(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: 'Return asset' })
  @Post('assets/:id/return')
  @Permissions('hr.employee.update')
  async returnAsset(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string
  ): Promise<unknown> {
    return this.hrService.returnAsset(req.user.tenantId, id);
  }

  // ── TIER 2: Org Chart ──
  @ApiOperation({ summary: 'Get org chart' })
  @Get('org-chart')
  @Permissions('hr.employee.read')
  async getOrgChart(@Req() req: AuthenticatedRequest): Promise<unknown> {
    const orgId = req.user.orgId || 'org-system-default';
    return this.hrService.getOrgChart(req.user.tenantId, orgId);
  }

  // ── TIER 2: Leave Balances & Policies & Requests ──
  @ApiOperation({ summary: 'Get leave balances' })
  @Get('leaves/balances')
  @Permissions('hr.leave.read')
  async getLeaveBalances(@Req() req: AuthenticatedRequest): Promise<unknown> {
    return this.hrService.getLeaveBalances(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Get leave policies' })
  @Get('leaves/policies')
  @Permissions('hr.leave.read')
  async getLeavePolicies(@Req() req: AuthenticatedRequest) {
    return this.hrService.getLeavePolicies(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create leave policy' })
  @Post('leaves/policies')
  @Permissions('hr.leave.create')
  async createLeavePolicy(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: { name: string; leaveType: string; annualAllocation: number; carryForwardLimit?: number }
  ) {
    return this.hrService.createLeavePolicy(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: 'Get leave requests' })
  @Get('leaves/requests')
  @Permissions('hr.leave.read')
  async getLeaveRequests(@Req() req: AuthenticatedRequest) {
    return this.hrService.getLeaveRequests(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create leave request' })
  @Post('leaves/requests')
  @Permissions('hr.leave.create')
  async createLeaveRequest(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: { employeeId: string; policyId: string; startDate: string; endDate: string; reason?: string }
  ) {
    return this.hrService.createLeaveRequest(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: 'Approve leave request' })
  @Put('leaves/requests/:id/approve')
  @Permissions('hr.leave.create')
  async approveLeaveRequest(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @ZodBody(z.any()) dto: { status: 'APPROVED' | 'REJECTED' }
  ) {
    const approverId = req.user.userId || 'system';
    return this.hrService.approveLeaveRequest(req.user.tenantId, id, dto.status, approverId);
  }

  // ── TIER 2: Onboarding ──
  @ApiOperation({ summary: 'Get onboarding checklists' })
  @Get('onboarding/checklists')
  @Permissions('hr.employee.read')
  async getOnboardingChecklists(@Req() req: AuthenticatedRequest): Promise<unknown> {
    return this.hrService.getOnboardingChecklists(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create onboarding checklist' })
  @Post('onboarding/checklists')
  @Permissions('hr.employee.create')
  async createOnboardingChecklist(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: { employeeId: string; templateName: string; items: Array<{ task: string; category: string; sortOrder: number }> }
  ): Promise<unknown> {
    return this.hrService.createOnboardingChecklist(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: 'Complete onboarding item' })
  @Put('onboarding/items/:itemId/complete')
  @Permissions('hr.employee.update')
  async completeOnboardingItem(
    @Req() req: AuthenticatedRequest,
    @Param('itemId') itemId: string
  ): Promise<unknown> {
    return this.hrService.completeOnboardingItem(req.user.tenantId, itemId);
  }

  @ApiOperation({ summary: 'Update onboarding item' })
  @Put('onboarding/items/:itemId')
  @Permissions('hr.employee.update')
  async updateOnboardingItem(
    @Req() req: AuthenticatedRequest,
    @Param('itemId') itemId: string,
    @ZodBody(z.any()) dto: { task?: string; category?: string; status?: string; comments?: string; isCompleted?: boolean }
  ): Promise<unknown> {
    return this.hrService.updateOnboardingItem(req.user.tenantId, itemId, dto);
  }

  @ApiOperation({ summary: 'Add onboarding item' })
  @Post('onboarding/checklists/:checklistId/items')
  @Permissions('hr.employee.update')
  async addOnboardingItem(
    @Req() req: AuthenticatedRequest,
    @Param('checklistId') checklistId: string,
    @ZodBody(z.any()) dto: { task: string; category?: string }
  ) {
    return this.hrService.addOnboardingItem(req.user.tenantId, checklistId, dto);
  }

  @ApiOperation({ summary: 'Delete onboarding item' })
  @Delete('onboarding/items/:itemId')
  @Permissions('hr.employee.update')
  async deleteOnboardingItem(
    @Req() req: AuthenticatedRequest,
    @Param('itemId') itemId: string
  ) {
    return this.hrService.deleteOnboardingItem(req.user.tenantId, itemId);
  }

  // ── TIER 2: Offboarding ──
  @ApiOperation({ summary: 'Get offboarding checklists' })
  @Get('offboarding/checklists')
  @Permissions('hr.employee.read')
  async getOffboardingChecklists(@Req() req: AuthenticatedRequest): Promise<unknown> {
    return this.hrService.getOffboardingChecklists(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create offboarding checklist' })
  @Post('offboarding/checklists')
  @Permissions('hr.employee.create')
  async createOffboardingChecklist(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: { employeeId: string; exitDate: string; exitReason?: string; items: Array<{ task: string; sortOrder: number }> }
  ): Promise<unknown> {
    return this.hrService.createOffboardingChecklist(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: 'Update offboarding item' })
  @Put('offboarding/items/:itemId')
  @Permissions('hr.employee.update')
  async updateOffboardingItem(
    @Req() req: AuthenticatedRequest,
    @Param('itemId') itemId: string,
    @ZodBody(z.any()) dto: { task?: string; status?: string; comments?: string; isCompleted?: boolean }
  ) {
    return this.hrService.updateOffboardingItem(req.user.tenantId, itemId, dto);
  }

  @ApiOperation({ summary: 'Add offboarding item' })
  @Post('offboarding/checklists/:checklistId/items')
  @Permissions('hr.employee.update')
  async addOffboardingItem(
    @Req() req: AuthenticatedRequest,
    @Param('checklistId') checklistId: string,
    @ZodBody(z.any()) dto: { task: string }
  ) {
    return this.hrService.addOffboardingItem(req.user.tenantId, checklistId, dto);
  }

  @ApiOperation({ summary: 'Delete offboarding item' })
  @Delete('offboarding/items/:itemId')
  @Permissions('hr.employee.update')
  async deleteOffboardingItem(
    @Req() req: AuthenticatedRequest,
    @Param('itemId') itemId: string
  ) {
    return this.hrService.deleteOffboardingItem(req.user.tenantId, itemId);
  }

  // ── TIER 3: Shift Scheduling ──
  @ApiOperation({ summary: 'Get shift schedules' })
  @Get('shifts')
  @Permissions('hr.employee.read')
  async getShiftSchedules(@Req() req: AuthenticatedRequest) {
    return this.hrService.getShiftSchedules(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create shift schedule' })
  @Post('shifts')
  @Permissions('hr.employee.create')
  async createShiftSchedule(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: { employeeId: string; startTime: string; endTime: string; note?: string }
  ) {
    return this.hrService.createShiftSchedule(req.user.tenantId, dto);
  }

  // ── TIER 3: Recruitment ──
  @ApiOperation({ summary: 'Get job postings' })
  @Get('jobs')
  @Permissions('hr.employee.read')
  async getJobPostings(@Req() req: AuthenticatedRequest): Promise<unknown> {
    return this.hrService.getJobPostings(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create job posting' })
  @Post('jobs')
  @Permissions('hr.employee.create')
  async createJobPosting(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: { title: string; departmentId?: string; description: string; requirements?: string; location?: string; employmentType?: string }
  ): Promise<unknown> {
    const orgId = req.user.orgId || 'org-system-default';
    return this.hrService.createJobPosting(req.user.tenantId, orgId, dto);
  }

  @ApiOperation({ summary: 'Get applicants' })
  @Get('applicants')
  @Permissions('hr.employee.read')
  async getApplicants(
    @Req() req: AuthenticatedRequest,
    @Query('jobPostingId') jobPostingId?: string
  ): Promise<unknown> {
    return this.hrService.getApplicants(req.user.tenantId, jobPostingId);
  }

  @ApiOperation({ summary: 'Create applicant' })
  @Post('applicants')
  @Permissions('hr.employee.create')
  async createApplicant(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: { jobPostingId: string; firstName: string; lastName: string; email: string; phone?: string; resumeUrl?: string; coverLetter?: string }
  ): Promise<unknown> {
    return this.hrService.createApplicant(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: 'Advance applicant' })
  @Post('applicants/:id/advance')
  @Permissions('hr.employee.update')
  async advanceApplicant(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @ZodBody(z.any()) dto: { stage: string }
  ): Promise<unknown> {
    return this.hrService.advanceApplicant(req.user.tenantId, id, dto.stage);
  }

  @ApiOperation({ summary: 'Get interviews' })
  @Get('interviews')
  @Permissions('hr.employee.read')
  async getInterviews(@Req() req: AuthenticatedRequest): Promise<unknown> {
    return this.hrService.getInterviews(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create interview' })
  @Post('interviews')
  @Permissions('hr.employee.create')
  async createInterview(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: { applicantId: string; jobPostingId: string; interviewerId: string; scheduledAt: string; round?: string }
  ): Promise<unknown> {
    return this.hrService.createInterview(req.user.tenantId, dto);
  }

  // ── TIER 3: Goals & OKRs ──
  @ApiOperation({ summary: 'Get goals' })
  @Get('goals')
  @Permissions('hr.employee.read')
  async getGoals(
    @Req() req: AuthenticatedRequest,
    @Query('employeeId') employeeId?: string
  ): Promise<unknown> {
    return this.hrService.getGoals(req.user.tenantId, employeeId);
  }

  @ApiOperation({ summary: 'Create goal' })
  @Post('goals')
  @Permissions('hr.employee.create')
  async createGoal(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: { employeeId: string; title: string; description?: string; category?: string; type?: string; startDate: string; endDate: string; weight?: number; keyResults?: Array<{ title: string; target: number; unit?: string }> }
  ): Promise<unknown> {
    return this.hrService.createGoal(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: 'Update key result progress' })
  @Put('key-results/:id')
  @Permissions('hr.employee.update')
  async updateKeyResultProgress(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @ZodBody(z.any()) dto: { current: number }
  ): Promise<unknown> {
    return this.hrService.updateKeyResultProgress(req.user.tenantId, id, dto.current);
  }

  @ApiOperation({ summary: 'Get goal comments' })
  @Get('goals/:goalId/comments')
  @Permissions('hr.employee.read')
  async getGoalComments(
    @Req() req: AuthenticatedRequest,
    @Param('goalId') goalId: string
  ) {
    return this.hrService.getGoalComments(req.user.tenantId, goalId);
  }

  @ApiOperation({ summary: 'Create goal comment' })
  @Post('goals/:goalId/comments')
  @Permissions('hr.employee.create')
  async createGoalComment(
    @Req() req: AuthenticatedRequest,
    @Param('goalId') goalId: string,
    @ZodBody(z.any()) dto: { comment: string; fileUrl?: string; fileName?: string }
  ) {
    const authorName = `${req.user.firstName || 'System'} ${req.user.lastName || 'Admin'}`;
    return this.hrService.createGoalComment(req.user.tenantId, goalId, {
      comment: dto.comment,
      authorName,
      fileUrl: dto.fileUrl,
      fileName: dto.fileName
    });
  }

  // ── TIER 3: 360° Feedback ──
  @ApiOperation({ summary: 'Get feedback360' })
  @Get('feedback')
  @Permissions('hr.employee.read')
  async getFeedback360(
    @Req() req: AuthenticatedRequest,
    @Query('employeeId') employeeId?: string
  ): Promise<unknown> {
    return this.hrService.getFeedback360(req.user.tenantId, employeeId);
  }

  @ApiOperation({ summary: 'Create feedback360' })
  @Post('feedback')
  @Permissions('hr.employee.create')
  async createFeedback360(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: { employeeId: string; reviewerId: string; relationship?: string; period?: string; responses: Array<{ question: string; rating: number; comment?: string; category?: string }> }
  ): Promise<unknown> {
    return this.hrService.createFeedback360(req.user.tenantId, dto);
  }

  // ── TIER 3: Succession Planning ──
  @ApiOperation({ summary: 'Get succession plans' })
  @Get('succession')
  @Permissions('hr.employee.read')
  async getSuccessionPlans(@Req() req: AuthenticatedRequest): Promise<unknown> {
    return this.hrService.getSuccessionPlans(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create succession plan' })
  @Post('succession')
  @Permissions('hr.employee.create')
  async createSuccessionPlan(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: { position: string; currentHolderId?: string; riskLevel?: string; readinessLevel?: string; successorId?: string; developmentPlan?: string }
  ): Promise<unknown> {
    return this.hrService.createSuccessionPlan(req.user.tenantId, dto);
  }

  // ── TIER 3: Skills Matrix ──
  @ApiOperation({ summary: 'Get employee skills' })
  @Get('skills')
  @Permissions('hr.employee.read')
  async getEmployeeSkills(
    @Req() req: AuthenticatedRequest,
    @Query('employeeId') employeeId?: string
  ): Promise<unknown> {
    return this.hrService.getEmployeeSkills(req.user.tenantId, employeeId);
  }

  @ApiOperation({ summary: 'Create employee skill' })
  @Post('skills')
  @Permissions('hr.employee.create')
  async createEmployeeSkill(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: { employeeId: string; skillName: string; proficiency?: number; category?: string; certified?: boolean; certificationUrl?: string }
  ): Promise<unknown> {
    return this.hrService.createEmployeeSkill(req.user.tenantId, dto);
  }

  // ── TIER 3: Appraisals ──
  @ApiOperation({ summary: 'Get appraisals' })
  @Get('appraisals')
  @Permissions('hr.employee.read')
  async getAppraisals(@Req() req: AuthenticatedRequest) {
    return this.hrService.getAppraisals(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create appraisal' })
  @Post('appraisals')
  @Permissions('hr.employee.create')
  async createAppraisal(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: { employeeId: string; reviewerId?: string; appraisalPeriod: string; score: number; feedback?: string }
  ) {
    const reviewerId = dto.reviewerId || req.user.userId || 'system';
    return this.hrService.createAppraisal(req.user.tenantId, {
      employeeId: dto.employeeId,
      reviewerId,
      appraisalPeriod: dto.appraisalPeriod,
      score: dto.score,
      feedback: dto.feedback
    });
  }

  // ── TIER 3: Trainings ──
  @ApiOperation({ summary: 'Get trainings' })
  @Get('trainings')
  @Permissions('hr.employee.read')
  async getTrainings(@Req() req: AuthenticatedRequest) {
    return this.hrService.getTrainings(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create training' })
  @Post('trainings')
  @Permissions('hr.employee.create')
  async createTraining(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: { name: string; description?: string; instructor?: string; startDate: string; endDate: string; capacity?: number; enrollmentDeadline?: string }
  ) {
    return this.hrService.createTraining(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: 'Enroll participant' })
  @Post('trainings/:trainingId/enroll')
  @Permissions('hr.employee.create')
  async enrollParticipant(
    @Req() req: AuthenticatedRequest,
    @Param('trainingId') trainingId: string,
    @ZodBody(z.any()) dto: { employeeId: string }
  ) {
    return this.hrService.enrollParticipant(req.user.tenantId, trainingId, dto.employeeId);
  }

  @ApiOperation({ summary: 'Unenroll participant' })
  @Delete('trainings/:trainingId/enroll/:employeeId')
  @Permissions('hr.employee.delete')
  async unenrollParticipant(
    @Req() req: AuthenticatedRequest,
    @Param('trainingId') trainingId: string,
    @Param('employeeId') employeeId: string
  ) {
    return this.hrService.unenrollParticipant(req.user.tenantId, trainingId, employeeId);
  }

  @ApiOperation({ summary: 'Update enrollment status' })
  @Put('trainings/:trainingId/enroll/:employeeId')
  @Permissions('hr.employee.update')
  async updateEnrollmentStatus(
    @Req() req: AuthenticatedRequest,
    @Param('trainingId') trainingId: string,
    @Param('employeeId') employeeId: string,
    @ZodBody(z.any()) dto: { status: string }
  ) {
    return this.hrService.updateEnrollmentStatus(req.user.tenantId, trainingId, employeeId, dto.status);
  }

  // ── TIER 4: Workforce Analytics ──
  @ApiOperation({ summary: 'Get headcount analytics' })
  @Get('analytics/headcount')
  @Permissions('hr.employee.read')
  async getHeadcountAnalytics(@Req() req: AuthenticatedRequest): Promise<unknown> {
    return this.hrService.getHeadcountAnalytics(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Get compensation analytics' })
  @Get('analytics/compensation')
  @Permissions('hr.employee.read')
  async getCompensationAnalytics(@Req() req: AuthenticatedRequest): Promise<unknown> {
    return this.hrService.getCompensationAnalytics(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Get h r cost analysis' })
  @Get('analytics/cost')
  @Permissions('hr.employee.read')
  async getHRCostAnalysis(@Req() req: AuthenticatedRequest): Promise<unknown> {
    return this.hrService.getHRCostAnalysis(req.user.tenantId);
  }

  // ── TIER 5: HR Helpdesk / Tickets ──
  @ApiOperation({ summary: 'Get h r tickets' })
  @Get('tickets')
  @Permissions('hr.employee.read')
  async getHRTickets(
    @Req() req: AuthenticatedRequest,
    @Query('employeeId') employeeId?: string
  ): Promise<unknown> {
    return this.hrService.getHRTickets(req.user.tenantId, employeeId);
  }

  @ApiOperation({ summary: 'Create h r ticket' })
  @Post('tickets')
  @Permissions('hr.employee.create')
  async createHRTicket(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: { employeeId: string; category: string; title: string; description?: string; priority?: string }
  ): Promise<unknown> {
    return this.hrService.createHRTicket(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: 'Resolve h r ticket' })
  @Put('tickets/:id/resolve')
  @Permissions('hr.employee.update')
  async resolveHRTicket(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @ZodBody(z.any()) dto: { resolution: string }
  ): Promise<unknown> {
    return this.hrService.resolveHRTicket(req.user.tenantId, id, dto.resolution);
  }

  // ── TIER 5: Engagement Surveys ──
  @ApiOperation({ summary: 'Get engagement surveys' })
  @Get('surveys')
  @Permissions('hr.employee.read')
  async getEngagementSurveys(@Req() req: AuthenticatedRequest): Promise<unknown> {
    return this.hrService.getEngagementSurveys(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create engagement survey' })
  @Post('surveys')
  @Permissions('hr.employee.create')
  async createEngagementSurvey(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: { title: string; description?: string; startDate: string; endDate: string; questions: Array<{ question: string; category?: string; sortOrder: number }> }
  ): Promise<unknown> {
    return this.hrService.createEngagementSurvey(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: 'Submit survey response' })
  @Post('surveys/responses')
  @Permissions('hr.employee.create')
  async submitSurveyResponse(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: { questionId: string; employeeId: string; rating: number; comment?: string }
  ): Promise<unknown> {
    return this.hrService.submitSurveyResponse(req.user.tenantId, dto);
  }

  // ── GAPS: Offers ──
  @ApiOperation({ summary: 'Get offers' })
  @Get('offers')
  @Permissions('hr.employee.read')
  async getOffers(@Req() req: AuthenticatedRequest) {
    return this.hrService.getOffers(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create offer' })
  @Post('offers')
  @Permissions('hr.employee.create')
  async createOffer(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: { applicantId: string; salaryOffered: number; expiresAt?: string; notes?: string }
  ) {
    return this.hrService.createOffer(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: 'Update offer status' })
  @Put('offers/:id/status')
  @Permissions('hr.employee.update')
  async updateOfferStatus(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @ZodBody(z.any()) dto: { status: string }
  ) {
    return this.hrService.updateOfferStatus(req.user.tenantId, id, dto.status);
  }

  // ── GAPS: Benefits ──
  @ApiOperation({ summary: 'Get benefit schemes' })
  @Get('benefits/schemes')
  @Permissions('hr.employee.read')
  async getBenefitSchemes(@Req() req: AuthenticatedRequest) {
    return this.hrService.getBenefitSchemes(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create benefit scheme' })
  @Post('benefits/schemes')
  @Permissions('hr.employee.create')
  async createBenefitScheme(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: { name: string; type: string; provider: string; description?: string; employeeCostShare: number; employerCostShare: number }
  ) {
    return this.hrService.createBenefitScheme(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: 'Get employee benefits' })
  @Get('benefits/enrollments')
  @Permissions('hr.employee.read')
  async getEmployeeBenefits(
    @Req() req: AuthenticatedRequest,
    @Query('employeeId') employeeId?: string
  ) {
    return this.hrService.getEmployeeBenefits(req.user.tenantId, employeeId);
  }

  @ApiOperation({ summary: 'Enroll employee benefit' })
  @Post('benefits/enroll')
  @Permissions('hr.employee.create')
  async enrollEmployeeBenefit(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: { employeeId: string; schemeId: string; coverageAmount?: number }
  ) {
    return this.hrService.enrollEmployeeBenefit(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: 'Update employee benefit' })
  @Put('benefits/enrollments/:id')
  @Permissions('hr.employee.update')
  async updateEmployeeBenefit(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @ZodBody(z.any()) dto: { status: string; terminatedAt?: string }
  ) {
    return this.hrService.updateEmployeeBenefit(req.user.tenantId, id, dto);
  }

  // ── GAPS: Skills Requirements & Gap Analysis ──
  @ApiOperation({ summary: 'Get skill requirements' })
  @Get('skills/requirements')
  @Permissions('hr.employee.read')
  async getSkillRequirements(@Req() req: AuthenticatedRequest) {
    return this.hrService.getSkillRequirements(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Upsert skill requirement' })
  @Post('skills/requirements')
  @Permissions('hr.employee.create')
  async upsertSkillRequirement(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: { designation: string; skillName: string; requiredLevel: number }
  ) {
    return this.hrService.upsertSkillRequirement(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: 'Get skill gap analysis' })
  @Get('skills/gap-analysis')
  @Permissions('hr.employee.read')
  async getSkillGapAnalysis(@Req() req: AuthenticatedRequest) {
    return this.hrService.getSkillGapAnalysis(req.user.tenantId);
  }

  // ── GAPS: Positions Control ──
  @ApiOperation({ summary: 'Get positions' })
  @Get('positions')
  @Permissions('hr.employee.read')
  async getPositions(@Req() req: AuthenticatedRequest) {
    return this.hrService.getPositions(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create position' })
  @Post('positions')
  @Permissions('hr.employee.create')
  async createPosition(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: { departmentId: string; title: string; code: string; budgetedSalary: number }
  ) {
    return this.hrService.createPosition(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: 'Update position' })
  @Put('positions/:id')
  @Permissions('hr.employee.update')
  async updatePosition(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @ZodBody(z.any()) dto: { status: string; employeeId?: string }
  ) {
    return this.hrService.updatePosition(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Get position budget variance' })
  @Get('positions/budget-variance')
  @Permissions('hr.employee.read')
  async getPositionBudgetVariance(@Req() req: AuthenticatedRequest) {
    return this.hrService.getPositionBudgetVariance(req.user.tenantId);
  }

  // ── GAPS: Compliance Checks ──
  @ApiOperation({ summary: 'Get compliance checks' })
  @Get('compliance/checks')
  @Permissions('hr.employee.read')
  async getComplianceChecks(@Req() req: AuthenticatedRequest) {
    return this.hrService.getComplianceChecks(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Run compliance checks' })
  @Post('compliance/run-checks')
  @Permissions('hr.employee.create')
  async runComplianceChecks(@Req() req: AuthenticatedRequest) {
    return this.hrService.runComplianceChecks(req.user.tenantId);
  }

  // ── GAPS: Tax Tables ──
  @ApiOperation({ summary: 'Get tax tables' })
  @Get('tax-tables')
  @Permissions('hr.employee.read')
  async getTaxTables(@Req() req: AuthenticatedRequest) {
    return this.hrService.getTaxTables(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create tax table' })
  @Post('tax-tables')
  @Permissions('hr.employee.create')
  async createTaxTable(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: { country: string; state?: string; incomeBracketMin: number; incomeBracketMax?: number; taxRate: number; allowanceAmount?: number }
  ) {
    return this.hrService.createTaxTable(req.user.tenantId, dto);
  }

  // ── GAPS: Holidays Calendar ──
  @ApiOperation({ summary: 'Get holidays' })
  @Get('holidays')
  @Permissions('hr.employee.read')
  async getHolidays(@Req() req: AuthenticatedRequest) {
    return this.hrService.getHolidays(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create holiday' })
  @Post('holidays')
  @Permissions('hr.employee.create')
  async createHoliday(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: { name: string; date: string; region?: string }
  ) {
    return this.hrService.createHoliday(req.user.tenantId, dto);
  }

  // ── GAPS: Biometric/RFID simulator endpoint ──
  @ApiOperation({ summary: 'Check in r f i d' })
  @Post('attendance/biometric')
  @Permissions('hr.employee.create')
  async checkInRFID(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: { employeeCode: string; timestamp?: string; actionType?: 'CHECK_IN' | 'CHECK_OUT' }
  ) {
    return this.hrService.checkInRFID(req.user.tenantId, dto.employeeCode, dto.actionType);
  }

  // ── GAPS: Self Service Portal ──
  @ApiOperation({ summary: 'Get self service dashboard' })
  @Get('self-service/dashboard')
  @Permissions('hr.employee.read')
  async getSelfServiceDashboard(@Req() req: AuthenticatedRequest) {
    return this.hrService.getEmployeeDashboardByUserId(req.user.tenantId, req.user.userId);
  }

  @ApiOperation({ summary: 'Update self service profile' })
  @Put('self-service/profile')
  @Permissions('hr.employee.update')
  async updateSelfServiceProfile(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: { phone?: string; address?: any; bankDetails?: any }
  ) {
    return this.hrService.updateEmployeeSelfDetails(req.user.tenantId, req.user.userId, dto);
  }
}

