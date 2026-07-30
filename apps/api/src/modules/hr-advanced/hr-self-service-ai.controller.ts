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
import { HrSelfServiceAiService } from "./hr-self-service-ai.service";
import { Request } from "express";

interface AuthReq extends Request {
  user: { tenantId: string; userId: string; roles: string[] };
}

@ApiTags("hr-self-service")
@ApiBearerAuth()
@Controller("hr/self-service")
@UseGuards(JwtAuthGuard, RbacGuard)
export class HrSelfServiceAiController {
  constructor(private readonly svc: HrSelfServiceAiService) {}

  // ── Employee Self-Service ──
  @Get("profile/:employeeId")
  @Permissions("hr.employee.read")
  @ApiOperation({ summary: "Get employee profile" })
  async getProfile(
    @Req() req: AuthReq,
    @Param("employeeId") employeeId: string,
  ) {
    return this.svc.getEmployeeProfile(req.user.tenantId, employeeId);
  }

  @Patch("profile/:employeeId")
  @Permissions("hr.employee.update")
  @ApiOperation({ summary: "Update own profile (limited fields)" })
  async updateProfile(
    @Req() req: AuthReq,
    @Param("employeeId") employeeId: string,
    @Body() dto: any,
  ) {
    return this.svc.updateEmployeeProfile(req.user.tenantId, employeeId, dto);
  }

  @Get("dashboard/:employeeId")
  @Permissions("hr.employee.read")
  @ApiOperation({ summary: "Employee self-service dashboard" })
  async getDashboard(
    @Req() req: AuthReq,
    @Param("employeeId") employeeId: string,
  ) {
    return this.svc.getEmployeeDashboard(req.user.tenantId, employeeId);
  }

  @Get("payslips/:employeeId")
  @Permissions("hr.employee.read")
  @ApiOperation({ summary: "Get my payslips" })
  async getMyPayslips(
    @Req() req: AuthReq,
    @Param("employeeId") employeeId: string,
    @Query("page") page: string,
    @Query("limit") limit: string,
  ) {
    return this.svc.getMyPayslips(
      req.user.tenantId,
      employeeId,
      parseInt(page) || 1,
      parseInt(limit) || 12,
    );
  }

  @Get("team/:managerId")
  @Permissions("hr.employee.read")
  @ApiOperation({ summary: "Get my team members" })
  async getMyTeam(@Req() req: AuthReq, @Param("managerId") managerId: string) {
    return this.svc.getMyTeamMembers(req.user.tenantId, managerId);
  }

  @Get("benefits/:employeeId")
  @Permissions("hr.employee.read")
  @ApiOperation({ summary: "Get my benefits" })
  async getMyBenefits(
    @Req() req: AuthReq,
    @Param("employeeId") employeeId: string,
  ) {
    return this.svc.getMyBenefits(req.user.tenantId, employeeId);
  }

  @Get("documents/:employeeId")
  @Permissions("hr.employee.read")
  @ApiOperation({ summary: "Get my documents" })
  async getMyDocuments(
    @Req() req: AuthReq,
    @Param("employeeId") employeeId: string,
  ) {
    return this.svc.getMyDocuments(req.user.tenantId, employeeId);
  }

  @Post("documents/:employeeId/upload")
  @Permissions("hr.employee.update")
  @ApiOperation({ summary: "Upload document" })
  async uploadDocument(
    @Req() req: AuthReq,
    @Param("employeeId") employeeId: string,
    @Body() dto: any,
  ) {
    return this.svc.uploadDocument(req.user.tenantId, employeeId, dto);
  }

  @Get("org-tree/:employeeId")
  @Permissions("hr.employee.read")
  @ApiOperation({ summary: "Get organization tree for employee" })
  async getOrgTree(
    @Req() req: AuthReq,
    @Param("employeeId") employeeId: string,
  ) {
    return this.svc.getMyOrganizationTree(req.user.tenantId, employeeId);
  }

  @Get("directory")
  @Permissions("hr.employee.read")
  @ApiOperation({ summary: "Company employee directory" })
  async getDirectory(@Req() req: AuthReq, @Query("search") search?: string) {
    return this.svc.getCompanyDirectory(req.user.tenantId, search);
  }

  // ── Leave Types ──
  @Get("leave-types")
  @Permissions("hr.leave.read")
  @ApiOperation({ summary: "List leave types" })
  async getLeaveTypes(@Req() req: AuthReq) {
    return this.svc.getLeaveTypes(req.user.tenantId);
  }

  @Post("leave-types")
  @Permissions("hr.leave.create")
  @ApiOperation({ summary: "Create leave type" })
  async createLeaveType(@Req() req: AuthReq, @Body() dto: any) {
    return this.svc.createLeaveType(req.user.tenantId, dto);
  }

  // ── Leave Balances ──
  @Get("leave-balances")
  @Permissions("hr.leave.read")
  @ApiOperation({ summary: "Get leave balances" })
  async getLeaveBalances(
    @Req() req: AuthReq,
    @Query("employeeId") employeeId?: string,
  ) {
    return this.svc.getLeaveBalances(req.user.tenantId, employeeId);
  }

  @Post("leave-balances/allocate")
  @Permissions("hr.leave.create")
  @ApiOperation({ summary: "Allocate leave balance" })
  async allocateLeave(@Req() req: AuthReq, @Body() dto: any) {
    return this.svc.allocateLeaveBalance(req.user.tenantId, dto);
  }

  @Post("leave-balances/bulk-allocate")
  @Permissions("hr.leave.create")
  @ApiOperation({ summary: "Bulk allocate leave to all active employees" })
  async bulkAllocate(@Req() req: AuthReq, @Body() dto: any) {
    return this.svc.bulkAllocateLeave(req.user.tenantId, dto);
  }

  // ── Leave Requests ──
  @Get("leave-requests")
  @Permissions("hr.leave.read")
  @ApiOperation({ summary: "List leave requests" })
  async getLeaveRequests(@Req() req: AuthReq, @Query() q: any) {
    return this.svc.getLeaveRequests(req.user.tenantId, q);
  }

  @Post("leave-requests")
  @Permissions("hr.leave.create")
  @ApiOperation({ summary: "Apply for leave" })
  async applyForLeave(@Req() req: AuthReq, @Body() dto: any) {
    return this.svc.applyForLeave(req.user.tenantId, dto);
  }

  @Post("leave-requests/:id/approve")
  @Permissions("hr.leave.approve")
  @ApiOperation({ summary: "Approve leave request" })
  async approveLeave(@Req() req: AuthReq, @Param("id") id: string) {
    return this.svc.approveLeaveRequest(req.user.tenantId, id, req.user.userId);
  }

  @Post("leave-requests/:id/reject")
  @Permissions("hr.leave.approve")
  @ApiOperation({ summary: "Reject leave request" })
  async rejectLeave(
    @Req() req: AuthReq,
    @Param("id") id: string,
    @Body() dto: any,
  ) {
    return this.svc.rejectLeaveRequest(req.user.tenantId, id, dto);
  }

  @Post("leave-requests/:id/cancel")
  @Permissions("hr.leave.update")
  @ApiOperation({ summary: "Cancel leave request" })
  async cancelLeave(@Req() req: AuthReq, @Param("id") id: string) {
    return this.svc.cancelLeaveRequest(req.user.tenantId, id);
  }

  @Get("leave-calendar")
  @Permissions("hr.leave.read")
  @ApiOperation({ summary: "Leave calendar" })
  async getLeaveCalendar(
    @Req() req: AuthReq,
    @Query("month") month: string,
    @Query("year") year: string,
    @Query("departmentId") departmentId?: string,
  ) {
    return this.svc.getLeaveCalendar(
      req.user.tenantId,
      parseInt(month) || new Date().getMonth() + 1,
      parseInt(year) || new Date().getFullYear(),
      departmentId,
    );
  }

  @Get("leave-report")
  @Permissions("hr.report.analytics")
  @ApiOperation({ summary: "Leave report by year" })
  async getLeaveReport(@Req() req: AuthReq, @Query("year") year: string) {
    return this.svc.getLeaveReport(
      req.user.tenantId,
      parseInt(year) || new Date().getFullYear(),
    );
  }

  // ── Surveys & Engagement ──
  @Get("surveys")
  @Permissions("hr.survey.read")
  @ApiOperation({ summary: "List surveys" })
  async getSurveys(@Req() req: AuthReq, @Query() q: any) {
    return this.svc.getSurveys(req.user.tenantId, q);
  }

  @Get("surveys/:id")
  @Permissions("hr.survey.read")
  @ApiOperation({ summary: "Get survey details" })
  async getSurveyById(@Req() req: AuthReq, @Param("id") id: string) {
    return this.svc.getSurveyById(req.user.tenantId, id);
  }

  @Post("surveys")
  @Permissions("hr.survey.create")
  @ApiOperation({ summary: "Create survey" })
  async createSurvey(@Req() req: AuthReq, @Body() dto: any) {
    return this.svc.createSurvey(req.user.tenantId, dto);
  }

  @Post("surveys/:id/launch")
  @Permissions("hr.survey.update")
  @ApiOperation({ summary: "Launch survey" })
  async launchSurvey(@Req() req: AuthReq, @Param("id") id: string) {
    return this.svc.launchSurvey(req.user.tenantId, id);
  }

  @Post("surveys/:id/respond")
  @Permissions("hr.survey.read")
  @ApiOperation({ summary: "Submit survey response" })
  async submitResponse(
    @Req() req: AuthReq,
    @Param("id") id: string,
    @Body() dto: any,
  ) {
    return this.svc.submitSurveyResponse(req.user.tenantId, id, dto);
  }

  @Get("surveys/:id/results")
  @Permissions("hr.survey.read")
  @ApiOperation({ summary: "Get survey results" })
  async getResults(@Req() req: AuthReq, @Param("id") id: string) {
    return this.svc.getSurveyResults(req.user.tenantId, id);
  }

  @Get("engagement-score")
  @Permissions("hr.report.analytics")
  @ApiOperation({ summary: "Company engagement score" })
  async getEngagementScore(@Req() req: AuthReq) {
    return this.svc.getEngagementScore(req.user.tenantId);
  }

  @Get("enps")
  @Permissions("hr.report.analytics")
  @ApiOperation({ summary: "Employee NPS (eNPS)" })
  async getENPS(@Req() req: AuthReq) {
    return this.svc.geteNPS(req.user.tenantId);
  }

  // ── HR AI & Intelligence ──
  @Get("ai/recruitment-insights")
  @Permissions("hr.report.analytics")
  @ApiOperation({ summary: "Smart recruitment insights" })
  async getRecruitmentInsights(@Req() req: AuthReq) {
    return this.svc.getSmartRecruitmentInsights(req.user.tenantId);
  }

  @Get("ai/insights-summary")
  @Permissions("hr.report.analytics")
  @ApiOperation({ summary: "HR insights summary" })
  async getInsightsSummary(@Req() req: AuthReq) {
    return this.svc.getHrInsightsSummary(req.user.tenantId);
  }

  @Get("ai/sentiment")
  @Permissions("hr.report.analytics")
  @ApiOperation({ summary: "Workforce sentiment analysis" })
  async getSentiment(@Req() req: AuthReq) {
    return this.svc.getWorkforceSentimentAnalysis(req.user.tenantId);
  }

  @Get("ai/automation-summary")
  @Permissions("hr.report.analytics")
  @ApiOperation({ summary: "HR automation processes summary" })
  async getAutomationSummary(@Req() req: AuthReq) {
    return this.svc.getHrAutomationSummary(req.user.tenantId);
  }

  @Get("ai/recommendations")
  @Permissions("hr.employee.read")
  @ApiOperation({ summary: "AI-powered HR recommendations" })
  async getRecommendations(
    @Req() req: AuthReq,
    @Query("employeeId") employeeId?: string,
  ) {
    return this.svc.getHrAiRecommendations(req.user.tenantId, employeeId);
  }

  @Post("ai/chatbot")
  @Permissions("hr.employee.read")
  @ApiOperation({ summary: "HR chatbot query" })
  async chatbotQuery(@Req() req: AuthReq, @Body() dto: any) {
    return this.svc.getHrChatbotResponse(req.user.tenantId, dto);
  }

  // ── HR Operations Alerts ──
  @Get("probation-tracking")
  @Permissions("hr.employee.read")
  @ApiOperation({ summary: "Employees in probation period" })
  async getProbationTracking(@Req() req: AuthReq) {
    return this.svc.getProbationTracking(req.user.tenantId);
  }

  @Get("contract-expiry-alerts")
  @Permissions("hr.employee.read")
  @ApiOperation({ summary: "Upcoming contract expiry alerts" })
  async getContractExpiryAlerts(
    @Req() req: AuthReq,
    @Query("daysAhead") daysAhead: string,
  ) {
    return this.svc.getContractExpiryAlerts(
      req.user.tenantId,
      parseInt(daysAhead) || 30,
    );
  }

  @Get("work-anniversary-alerts")
  @Permissions("hr.employee.read")
  @ApiOperation({ summary: "Upcoming work anniversaries" })
  async getWorkAnniversaries(
    @Req() req: AuthReq,
    @Query("daysAhead") daysAhead: string,
  ) {
    return this.svc.getWorkAnniversaryAlerts(
      req.user.tenantId,
      parseInt(daysAhead) || 7,
    );
  }
}
