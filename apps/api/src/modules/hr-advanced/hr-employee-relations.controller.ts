// @ts-nocheck
import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Req,
  UseGuards,
  Body,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { HrEmployeeRelationsService } from "./hr-employee-relations.service";
import { Request } from "express";

interface AuthReq extends Request {
  user: { tenantId: string; userId: string; roles: string[] };
}

@ApiTags("hr-employee-relations")
@ApiBearerAuth()
@Controller("hr/employee-relations")
@UseGuards(JwtAuthGuard, RbacGuard)
export class HrEmployeeRelationsController {
  constructor(private readonly svc: HrEmployeeRelationsService) {}

  // ── Performance Management ──
  @Get("performance/dashboard")
  @Permissions("hr.performance.read")
  @ApiOperation({ summary: "Performance management dashboard" })
  async getPerfDashboard(@Req() req: AuthReq) {
    return this.svc.getPerformanceDashboard(req.user.tenantId);
  }

  @Get("performance/reviews")
  @Permissions("hr.performance.read")
  @ApiOperation({ summary: "List performance reviews" })
  async getReviews(@Req() req: AuthReq, @Query() q: any) {
    return this.svc.getPerformanceReviews(req.user.tenantId, q);
  }

  @Post("performance/reviews")
  @Permissions("hr.performance.create")
  @ApiOperation({ summary: "Create performance review" })
  async createReview(@Req() req: AuthReq, @Body() dto: any) {
    return this.svc.createPerformanceReview(req.user.tenantId, dto);
  }

  @Post("performance/reviews/:id/submit")
  @Permissions("hr.performance.update")
  @ApiOperation({ summary: "Submit performance review" })
  async submitReview(
    @Req() req: AuthReq,
    @Param("id") id: string,
    @Body() dto: any,
  ) {
    return this.svc.submitReview(req.user.tenantId, id, dto);
  }

  @Post("performance/reviews/:id/approve")
  @Permissions("hr.performance.approve")
  @ApiOperation({ summary: "Approve performance review" })
  async approveReview(@Req() req: AuthReq, @Param("id") id: string) {
    return this.svc.approveReview(req.user.tenantId, id, req.user.userId);
  }

  @Get("performance/cycles")
  @Permissions("hr.performance.read")
  @ApiOperation({ summary: "List review cycles" })
  async getReviewCycles(@Req() req: AuthReq) {
    return this.svc.getReviewCycles(req.user.tenantId);
  }

  @Post("performance/cycles")
  @Permissions("hr.performance.create")
  @ApiOperation({ summary: "Create review cycle" })
  async createReviewCycle(@Req() req: AuthReq, @Body() dto: any) {
    return this.svc.createReviewCycle(req.user.tenantId, dto);
  }

  @Post("performance/cycles/:id/launch")
  @Permissions("hr.performance.create")
  @ApiOperation({ summary: "Launch review cycle (auto-create reviews)" })
  async launchReviewCycle(@Req() req: AuthReq, @Param("id") id: string) {
    return this.svc.launchReviewCycle(req.user.tenantId, id);
  }

  // ── 360-Degree Feedback ──
  @Get("performance/360-feedback")
  @Permissions("hr.performance.read")
  @ApiOperation({ summary: "List 360 feedback requests" })
  async get360Feedback(
    @Req() req: AuthReq,
    @Query("employeeId") employeeId?: string,
  ) {
    return this.svc.get360FeedbackRequests(req.user.tenantId, employeeId);
  }

  @Post("performance/360-feedback")
  @Permissions("hr.performance.create")
  @ApiOperation({ summary: "Create 360 feedback request" })
  async create360Feedback(@Req() req: AuthReq, @Body() dto: any) {
    return this.svc.create360FeedbackRequest(req.user.tenantId, dto);
  }

  @Post("performance/360-feedback/:id/submit")
  @Permissions("hr.performance.update")
  @ApiOperation({ summary: "Submit 360 feedback response" })
  async submit360(
    @Req() req: AuthReq,
    @Param("id") id: string,
    @Body() dto: any,
  ) {
    return this.svc.submit360Feedback(req.user.tenantId, id, dto);
  }

  // ── Goals & OKRs ──
  @Get("performance/goals")
  @Permissions("hr.performance.read")
  @ApiOperation({ summary: "List employee goals" })
  async getGoals(@Req() req: AuthReq, @Query() q: any) {
    return this.svc.getGoals(req.user.tenantId, q);
  }

  @Post("performance/goals")
  @Permissions("hr.performance.create")
  @ApiOperation({ summary: "Create employee goal" })
  async createGoal(@Req() req: AuthReq, @Body() dto: any) {
    return this.svc.createGoal(req.user.tenantId, dto);
  }

  @Patch("performance/goals/:id/progress")
  @Permissions("hr.performance.update")
  @ApiOperation({ summary: "Update goal progress" })
  async updateGoalProgress(
    @Req() req: AuthReq,
    @Param("id") id: string,
    @Body() dto: any,
  ) {
    return this.svc.updateGoalProgress(req.user.tenantId, id, dto);
  }

  @Patch("performance/goals/:goalId/align")
  @Permissions("hr.performance.update")
  @ApiOperation({ summary: "Align goal to department/company objective" })
  async alignGoal(
    @Req() req: AuthReq,
    @Param("goalId") goalId: string,
    @Body() dto: any,
  ) {
    return this.svc.alignGoalToDepartment(req.user.tenantId, goalId, dto);
  }

  // ── Grievances ──
  @Get("grievances")
  @Permissions("hr.employee.read")
  @ApiOperation({ summary: "List grievances" })
  async getGrievances(@Req() req: AuthReq, @Query() q: any) {
    return this.svc.getGrievances(req.user.tenantId, q);
  }

  @Post("grievances")
  @Permissions("hr.employee.create")
  @ApiOperation({ summary: "File a grievance" })
  async createGrievance(@Req() req: AuthReq, @Body() dto: any) {
    return this.svc.createGrievance(req.user.tenantId, dto);
  }

  @Patch("grievances/:id")
  @Permissions("hr.employee.update")
  @ApiOperation({ summary: "Update grievance" })
  async updateGrievance(
    @Req() req: AuthReq,
    @Param("id") id: string,
    @Body() dto: any,
  ) {
    return this.svc.updateGrievance(req.user.tenantId, id, dto);
  }

  // ── Disciplinary Actions ──
  @Get("disciplinary")
  @Permissions("hr.employee.read")
  @ApiOperation({ summary: "List disciplinary actions" })
  async getDisciplinary(@Req() req: AuthReq, @Query() q: any) {
    return this.svc.getDisciplinaryActions(req.user.tenantId, q);
  }

  @Post("disciplinary")
  @Permissions("hr.employee.create")
  @ApiOperation({ summary: "Create disciplinary action" })
  async createDisciplinary(@Req() req: AuthReq, @Body() dto: any) {
    return this.svc.createDisciplinaryAction(req.user.tenantId, dto);
  }

  // ── Warnings ──
  @Get("employees/:employeeId/warnings")
  @Permissions("hr.employee.read")
  @ApiOperation({ summary: "Get employee's warnings" })
  async getWarnings(
    @Req() req: AuthReq,
    @Param("employeeId") employeeId: string,
  ) {
    return this.svc.getEmployeeWarnings(req.user.tenantId, employeeId);
  }

  @Post("warnings")
  @Permissions("hr.employee.create")
  @ApiOperation({ summary: "Issue a warning" })
  async issueWarning(@Req() req: AuthReq, @Body() dto: any) {
    return this.svc.issueWarning(req.user.tenantId, dto);
  }

  @Post("warnings/:id/acknowledge")
  @Permissions("hr.employee.update")
  @ApiOperation({ summary: "Acknowledge a warning" })
  async acknowledgeWarning(
    @Req() req: AuthReq,
    @Param("id") id: string,
    @Body() dto: any,
  ) {
    return this.svc.acknowledgeWarning(req.user.tenantId, id, dto);
  }

  // ── Exit Management ──
  @Get("separations")
  @Permissions("hr.employee.read")
  @ApiOperation({ summary: "List employee separations" })
  async getSeparations(@Req() req: AuthReq, @Query() q: any) {
    return this.svc.getSeparations(req.user.tenantId, q);
  }

  @Post("separations")
  @Permissions("hr.employee.create")
  @ApiOperation({ summary: "Initiate employee separation" })
  async createSeparation(@Req() req: AuthReq, @Body() dto: any) {
    return this.svc.createSeparation(req.user.tenantId, dto);
  }

  @Post("separations/:id/process")
  @Permissions("hr.employee.update")
  @ApiOperation({ summary: "Process separation (terminate employee)" })
  async processSeparation(
    @Req() req: AuthReq,
    @Param("id") id: string,
    @Body() dto: any,
  ) {
    return this.svc.processSeparation(req.user.tenantId, id, dto);
  }

  @Get("exit-interviews")
  @Permissions("hr.employee.read")
  @ApiOperation({ summary: "List exit interviews" })
  async getExitInterviews(@Req() req: AuthReq) {
    return this.svc.getExitInterviews(req.user.tenantId);
  }

  @Post("exit-interviews")
  @Permissions("hr.employee.create")
  @ApiOperation({ summary: "Schedule exit interview" })
  async scheduleExitInterview(@Req() req: AuthReq, @Body() dto: any) {
    return this.svc.scheduleExitInterview(req.user.tenantId, dto);
  }

  @Post("exit-interviews/:id/record")
  @Permissions("hr.employee.update")
  @ApiOperation({ summary: "Record exit interview feedback" })
  async recordExitInterview(
    @Req() req: AuthReq,
    @Param("id") id: string,
    @Body() dto: any,
  ) {
    return this.svc.recordExitInterview(req.user.tenantId, id, dto);
  }

  @Get("offboarding-checklists")
  @Permissions("hr.employee.read")
  @ApiOperation({ summary: "List offboarding checklists" })
  async getOffboardingChecklists(
    @Req() req: AuthReq,
    @Query("employeeId") employeeId?: string,
  ) {
    return this.svc.getOffboardingChecklists(req.user.tenantId, employeeId);
  }

  @Post("offboarding-checklists")
  @Permissions("hr.employee.create")
  @ApiOperation({ summary: "Create offboarding checklist" })
  async createOffboarding(@Req() req: AuthReq, @Body() dto: any) {
    return this.svc.createOffboardingChecklist(req.user.tenantId, dto);
  }

  // ── Health & Safety ──
  @Get("safety/incidents")
  @Permissions("hr.employee.read")
  @ApiOperation({ summary: "List safety incidents" })
  async getIncidents(@Req() req: AuthReq, @Query() q: any) {
    return this.svc.getIncidents(req.user.tenantId, q);
  }

  @Post("safety/incidents")
  @Permissions("hr.employee.create")
  @ApiOperation({ summary: "Report safety incident" })
  async reportIncident(@Req() req: AuthReq, @Body() dto: any) {
    return this.svc.reportIncident(req.user.tenantId, dto);
  }

  @Patch("safety/incidents/:id")
  @Permissions("hr.employee.update")
  @ApiOperation({ summary: "Update safety incident" })
  async updateIncident(
    @Req() req: AuthReq,
    @Param("id") id: string,
    @Body() dto: any,
  ) {
    return this.svc.updateIncident(req.user.tenantId, id, dto);
  }

  // ── Wellbeing ──
  @Get("wellbeing/programs")
  @Permissions("hr.employee.read")
  @ApiOperation({ summary: "List wellbeing programs" })
  async getWellbeingPrograms(@Req() req: AuthReq) {
    return this.svc.getWellbeingPrograms(req.user.tenantId);
  }

  @Post("wellbeing/programs")
  @Permissions("hr.employee.create")
  @ApiOperation({ summary: "Create wellbeing program" })
  async createWellbeingProgram(@Req() req: AuthReq, @Body() dto: any) {
    return this.svc.createWellbeingProgram(req.user.tenantId, dto);
  }

  @Get("wellbeing/enrollments")
  @Permissions("hr.employee.read")
  @ApiOperation({ summary: "List wellbeing enrollments" })
  async getWellbeingEnrollments(
    @Req() req: AuthReq,
    @Query("programId") programId?: string,
  ) {
    return this.svc.getWellbeingEnrollments(req.user.tenantId, programId);
  }

  @Post("wellbeing/enroll")
  @Permissions("hr.employee.create")
  @ApiOperation({ summary: "Enroll employee in wellbeing program" })
  async enrollWellbeing(@Req() req: AuthReq, @Body() dto: any) {
    return this.svc.enrollInWellbeingProgram(req.user.tenantId, dto);
  }

  @Get("wellbeing/eap")
  @Permissions("hr.employee.read")
  @ApiOperation({ summary: "List Employee Assistance Program records" })
  async getEapRecords(@Req() req: AuthReq) {
    return this.svc.getEmployeeAssistancePrograms(req.user.tenantId);
  }

  @Post("wellbeing/eap")
  @Permissions("hr.employee.create")
  @ApiOperation({ summary: "Create EAP record" })
  async createEapRecord(@Req() req: AuthReq, @Body() dto: any) {
    return this.svc.createEapRecord(req.user.tenantId, dto);
  }

  // ── Reports ──
  @Get("reports/overview")
  @Permissions("hr.report.analytics")
  @ApiOperation({ summary: "Employee relations overview report" })
  async getRelationsReport(@Req() req: AuthReq) {
    return this.svc.getRelationsReport(req.user.tenantId);
  }

  @Get("reports/safety-compliance")
  @Permissions("hr.report.analytics")
  @ApiOperation({ summary: "Safety compliance report" })
  async getSafetyCompliance(@Req() req: AuthReq) {
    return this.svc.getSafetyComplianceReport(req.user.tenantId);
  }

  @Get("reports/performance-distribution")
  @Permissions("hr.report.analytics")
  @ApiOperation({ summary: "Performance rating distribution" })
  async getPerfDistribution(
    @Req() req: AuthReq,
    @Query("reviewCycleId") reviewCycleId?: string,
  ) {
    return this.svc.getPerformanceDistribution(
      req.user.tenantId,
      reviewCycleId,
    );
  }

  @Get("reports/turnover-by-reason")
  @Permissions("hr.report.analytics")
  @ApiOperation({ summary: "Turnover analysis by reason" })
  async getTurnoverByReason(@Req() req: AuthReq) {
    return this.svc.getTurnoverAnalysisByReason(req.user.tenantId);
  }
}
