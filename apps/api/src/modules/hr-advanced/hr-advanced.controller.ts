import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  UseGuards,
  Req,
  Query,
} from "@nestjs/common";
import { z } from "zod";
import { ZodBody } from "../../common/decorators/zod-body.decorator";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { HrAdvancedService } from "./hr-advanced.service";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
    orgId?: string;
  };
}

@ApiTags("hr-advanced")
@ApiBearerAuth()
@Controller("hr-advanced")
@UseGuards(JwtAuthGuard, RbacGuard)
export class HrAdvancedController {
  constructor(private readonly hrAdvancedService: HrAdvancedService) {}

  // ══ ENHANCED DASHBOARD & ANALYTICS ══

  @Get("enhanced-dashboard")
  @Permissions("hr.employee.read")
  @ApiOperation({ summary: "Get enhanced HR dashboard" })
  async getEnhancedDashboard(@Req() req: AuthenticatedRequest) {
    return this.hrAdvancedService.getEnhancedDashboard(req.user.tenantId);
  }

  @Get("analytics/headcount")
  @Permissions("hr.report.headcount")
  @ApiOperation({ summary: "Headcount analytics" })
  async getHeadcountAnalytics(@Req() req: AuthenticatedRequest) {
    return this.hrAdvancedService.getHeadcountAnalytics(req.user.tenantId);
  }

  @Get("analytics/payroll")
  @Permissions("hr.report.payroll")
  @ApiOperation({ summary: "Payroll analytics" })
  async getPayrollAnalytics(@Req() req: AuthenticatedRequest) {
    return this.hrAdvancedService.getPayrollAnalytics(req.user.tenantId);
  }

  @Get("analytics/attendance")
  @Permissions("hr.report.attendance")
  @ApiOperation({ summary: "Attendance analytics" })
  async getAttendanceAnalytics(
    @Req() req: AuthenticatedRequest,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
  ) {
    return this.hrAdvancedService.getAttendanceAnalytics(
      req.user.tenantId,
      startDate,
      endDate,
    );
  }

  @Get("analytics/leave")
  @Permissions("hr.report.attendance")
  @ApiOperation({ summary: "Leave analytics" })
  async getLeaveAnalytics(
    @Req() req: AuthenticatedRequest,
    @Query("year") year?: string,
  ) {
    return this.hrAdvancedService.getLeaveAnalytics(
      req.user.tenantId,
      year ? parseInt(year) : undefined,
    );
  }

  @Get("analytics/recruitment")
  @Permissions("hr.report.analytics")
  @ApiOperation({ summary: "Recruitment analytics" })
  async getRecruitmentAnalytics(@Req() req: AuthenticatedRequest) {
    return this.hrAdvancedService.getRecruitmentAnalytics(req.user.tenantId);
  }

  @Get("analytics/training")
  @Permissions("hr.report.analytics")
  @ApiOperation({ summary: "Training analytics" })
  async getTrainingAnalytics(@Req() req: AuthenticatedRequest) {
    return this.hrAdvancedService.getTrainingAnalytics(req.user.tenantId);
  }

  @Get("analytics/turnover")
  @Permissions("hr.report.turnover")
  @ApiOperation({ summary: "Turnover analytics" })
  async getTurnoverAnalytics(
    @Req() req: AuthenticatedRequest,
    @Query("months") months?: string,
  ) {
    return this.hrAdvancedService.getTurnoverAnalytics(
      req.user.tenantId,
      months ? parseInt(months) : 12,
    );
  }

  @Get("analytics/summary")
  @Permissions("hr.report.analytics")
  @ApiOperation({ summary: "HR analytics summary" })
  async getHrAnalyticsSummary(@Req() req: AuthenticatedRequest) {
    return this.hrAdvancedService.getHrAnalyticsSummary(req.user.tenantId);
  }

  @Get("analytics/birthdays")
  @Permissions("hr.employee.read")
  @ApiOperation({ summary: "Birthday report by month" })
  async getBirthdayReport(
    @Req() req: AuthenticatedRequest,
    @Query("month") month?: string,
  ) {
    return this.hrAdvancedService.getBirthdayReport(
      req.user.tenantId,
      month ? parseInt(month) : undefined,
    );
  }

  @Get("analytics/anniversaries")
  @Permissions("hr.employee.read")
  @ApiOperation({ summary: "Work anniversary report by month" })
  async getAnniversaryReport(
    @Req() req: AuthenticatedRequest,
    @Query("month") month?: string,
  ) {
    return this.hrAdvancedService.getAnniversaryReport(
      req.user.tenantId,
      month ? parseInt(month) : undefined,
    );
  }

  @Get("analytics/age-distribution")
  @Permissions("hr.report.analytics")
  @ApiOperation({ summary: "Age distribution analytics" })
  async getAgeDistribution(@Req() req: AuthenticatedRequest) {
    return this.hrAdvancedService.getAgeDistribution(req.user.tenantId);
  }

  @Get("analytics/tenure-distribution")
  @Permissions("hr.report.analytics")
  @ApiOperation({ summary: "Tenure distribution analytics" })
  async getTenureDistribution(@Req() req: AuthenticatedRequest) {
    return this.hrAdvancedService.getTenureDistribution(req.user.tenantId);
  }

  @Get("analytics/department-salary")
  @Permissions("hr.report.payroll")
  @ApiOperation({ summary: "Department salary analytics" })
  async getDepartmentSalaryAnalytics(@Req() req: AuthenticatedRequest) {
    return this.hrAdvancedService.getDepartmentSalaryAnalytics(
      req.user.tenantId,
    );
  }

  @Get("analytics/gender-distribution")
  @Permissions("hr.report.analytics")
  @ApiOperation({ summary: "Gender distribution analytics" })
  async getGenderDistribution(@Req() req: AuthenticatedRequest) {
    return this.hrAdvancedService.getGenderDistribution(req.user.tenantId);
  }

  // ══ BENEFIT SCHEMES ══

  @Get("benefit-schemes")
  @Permissions("hr.benefit.read")
  @ApiOperation({ summary: "List benefit schemes" })
  async getBenefitSchemes(@Req() req: AuthenticatedRequest) {
    return this.hrAdvancedService.getBenefitSchemes(req.user.tenantId);
  }

  @Get("benefit-schemes/:id")
  @Permissions("hr.benefit.read")
  @ApiOperation({ summary: "Get benefit scheme by ID" })
  async getBenefitSchemeById(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.hrAdvancedService.getBenefitSchemeById(req.user.tenantId, id);
  }

  @Post("benefit-schemes")
  @Permissions("hr.benefit.create")
  @ApiOperation({ summary: "Create benefit scheme" })
  async createBenefitScheme(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: any,
  ) {
    return this.hrAdvancedService.createBenefitScheme(req.user.tenantId, dto);
  }

  @Patch("benefit-schemes/:id")
  @Permissions("hr.benefit.update")
  @ApiOperation({ summary: "Update benefit scheme" })
  async updateBenefitScheme(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.any()) dto: any,
  ) {
    return this.hrAdvancedService.updateBenefitScheme(
      req.user.tenantId,
      id,
      dto,
    );
  }

  @Delete("benefit-schemes/:id")
  @Permissions("hr.benefit.delete")
  @ApiOperation({ summary: "Delete benefit scheme" })
  async deleteBenefitScheme(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.hrAdvancedService.deleteBenefitScheme(req.user.tenantId, id);
  }

  @Post("benefit-schemes/:id/enroll")
  @Permissions("hr.benefit.create")
  @ApiOperation({ summary: "Enroll employee in benefit scheme" })
  async enrollInBenefit(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.any()) dto: any,
  ) {
    return this.hrAdvancedService.enrollInBenefit(req.user.tenantId, {
      ...dto,
      schemeId: id,
    });
  }

  @Post("employee-benefits/:id/terminate")
  @Permissions("hr.benefit.update")
  @ApiOperation({ summary: "Terminate employee benefit" })
  async terminateEmployeeBenefit(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.hrAdvancedService.terminateEmployeeBenefit(
      req.user.tenantId,
      id,
    );
  }

  @Get("employee-benefits")
  @Permissions("hr.benefit.read")
  @ApiOperation({ summary: "List employee benefits" })
  async getEmployeeBenefits(
    @Req() req: AuthenticatedRequest,
    @Query("employeeId") employeeId?: string,
  ) {
    return this.hrAdvancedService.getEmployeeBenefits(
      req.user.tenantId,
      employeeId,
    );
  }

  @Get("benefit-costs")
  @Permissions("hr.benefit.read")
  @ApiOperation({ summary: "Benefit enrollment costs summary" })
  async getBenefitEnrollmentCosts(@Req() req: AuthenticatedRequest) {
    return this.hrAdvancedService.getBenefitEnrollmentCosts(req.user.tenantId);
  }

  // ══ ENGAGEMENT SURVEYS ══

  @Get("engagement-surveys")
  @Permissions("hr.survey.read")
  @ApiOperation({ summary: "List engagement surveys" })
  async getEngagementSurveys(@Req() req: AuthenticatedRequest) {
    return this.hrAdvancedService.getEngagementSurveys(req.user.tenantId);
  }

  @Get("engagement-surveys/:id")
  @Permissions("hr.survey.read")
  @ApiOperation({ summary: "Get engagement survey by ID" })
  async getEngagementSurveyById(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.hrAdvancedService.getEngagementSurveyById(
      req.user.tenantId,
      id,
    );
  }

  @Post("engagement-surveys")
  @Permissions("hr.survey.create")
  @ApiOperation({ summary: "Create engagement survey" })
  async createEngagementSurvey(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: any,
  ) {
    return this.hrAdvancedService.createEngagementSurvey(
      req.user.tenantId,
      dto,
    );
  }

  @Patch("engagement-surveys/:id")
  @Permissions("hr.survey.update")
  @ApiOperation({ summary: "Update engagement survey" })
  async updateEngagementSurvey(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.any()) dto: any,
  ) {
    return this.hrAdvancedService.updateEngagementSurvey(
      req.user.tenantId,
      id,
      dto,
    );
  }

  @Post("engagement-surveys/:id/launch")
  @Permissions("hr.survey.update")
  @ApiOperation({ summary: "Launch engagement survey" })
  async launchEngagementSurvey(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.hrAdvancedService.launchEngagementSurvey(req.user.tenantId, id);
  }

  @Post("engagement-surveys/:id/close")
  @Permissions("hr.survey.update")
  @ApiOperation({ summary: "Close engagement survey" })
  async closeEngagementSurvey(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.hrAdvancedService.closeEngagementSurvey(req.user.tenantId, id);
  }

  @Delete("engagement-surveys/:id")
  @Permissions("hr.survey.delete")
  @ApiOperation({ summary: "Delete engagement survey" })
  async deleteEngagementSurvey(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.hrAdvancedService.deleteEngagementSurvey(req.user.tenantId, id);
  }

  @Post("engagement-surveys/:surveyId/responses")
  @Permissions("hr.survey.respond")
  @ApiOperation({ summary: "Submit survey responses" })
  async submitSurveyResponses(
    @Req() req: AuthenticatedRequest,
    @Param("surveyId") surveyId: string,
    @ZodBody(z.any()) dto: any,
  ) {
    return this.hrAdvancedService.submitSurveyResponse(
      req.user.tenantId,
      surveyId,
      dto.employeeId,
      dto.responses,
    );
  }

  @Get("engagement-surveys/:id/analytics")
  @Permissions("hr.survey.read")
  @ApiOperation({ summary: "Get survey analytics" })
  async getSurveyAnalytics(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.hrAdvancedService.getSurveyAnalytics(req.user.tenantId, id);
  }

  // ══ COMPLIANCE CHECKS ══

  @Get("compliance-checks")
  @Permissions("hr.compliance.read")
  @ApiOperation({ summary: "List compliance checks" })
  async getComplianceChecks(
    @Req() req: AuthenticatedRequest,
    @Query("employeeId") employeeId?: string,
  ) {
    return this.hrAdvancedService.getComplianceChecks(
      req.user.tenantId,
      employeeId,
    );
  }

  @Post("compliance-checks")
  @Permissions("hr.compliance.create")
  @ApiOperation({ summary: "Create compliance check" })
  async createComplianceCheck(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: any,
  ) {
    return this.hrAdvancedService.createComplianceCheck(req.user.tenantId, dto);
  }

  @Get("compliance-report")
  @Permissions("hr.compliance.read")
  @ApiOperation({ summary: "Compliance report" })
  async getComplianceReport(@Req() req: AuthenticatedRequest) {
    return this.hrAdvancedService.getComplianceReport(req.user.tenantId);
  }

  // ══ SKILL REQUIREMENTS ══

  @Get("skill-requirements")
  @Permissions("hr.employee.read")
  @ApiOperation({ summary: "List skill requirements" })
  async getSkillRequirements(
    @Req() req: AuthenticatedRequest,
    @Query("designation") designation?: string,
  ) {
    return this.hrAdvancedService.getSkillRequirements(
      req.user.tenantId,
      designation,
    );
  }

  @Post("skill-requirements")
  @Permissions("hr.employee.update")
  @ApiOperation({ summary: "Create skill requirement" })
  async createSkillRequirement(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: any,
  ) {
    return this.hrAdvancedService.createSkillRequirement(
      req.user.tenantId,
      dto,
    );
  }

  @Delete("skill-requirements/:id")
  @Permissions("hr.employee.update")
  @ApiOperation({ summary: "Delete skill requirement" })
  async deleteSkillRequirement(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.hrAdvancedService.deleteSkillRequirement(req.user.tenantId, id);
  }

  @Get("skill-gap/:employeeId")
  @Permissions("hr.employee.read")
  @ApiOperation({ summary: "Get employee skill gap analysis" })
  async getEmployeeSkillGap(
    @Req() req: AuthenticatedRequest,
    @Param("employeeId") employeeId: string,
  ) {
    return this.hrAdvancedService.getEmployeeSkillGap(
      req.user.tenantId,
      employeeId,
    );
  }

  // ══ OFFER LETTERS ══

  @Get("offer-letters")
  @Permissions("hr.offer-letter.read")
  @ApiOperation({ summary: "List offer letters" })
  async getOfferLetters(@Req() req: AuthenticatedRequest) {
    return this.hrAdvancedService.getOfferLetters(req.user.tenantId);
  }

  @Get("offer-letters/:id")
  @Permissions("hr.offer-letter.read")
  @ApiOperation({ summary: "Get offer letter by ID" })
  async getOfferLetterById(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.hrAdvancedService.getOfferLetterById(req.user.tenantId, id);
  }

  @Post("offer-letters")
  @Permissions("hr.offer-letter.create")
  @ApiOperation({ summary: "Create offer letter" })
  async createOfferLetter(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: any,
  ) {
    return this.hrAdvancedService.createOfferLetter(req.user.tenantId, dto);
  }

  @Post("offer-letters/:id/send")
  @Permissions("hr.offer-letter.send")
  @ApiOperation({ summary: "Send offer letter" })
  async sendOfferLetter(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.hrAdvancedService.sendOfferLetter(req.user.tenantId, id);
  }

  @Patch("offer-letters/:id/status")
  @Permissions("hr.offer-letter.manage")
  @ApiOperation({ summary: "Update offer letter status" })
  async updateOfferLetterStatus(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.any()) dto: any,
  ) {
    return this.hrAdvancedService.updateOfferLetterStatus(
      req.user.tenantId,
      id,
      dto.status,
    );
  }

  // ══ HOLIDAYS ══

  @Get("holidays")
  @Permissions("hr.employee.read")
  @ApiOperation({ summary: "List holidays" })
  async getHolidays(
    @Req() req: AuthenticatedRequest,
    @Query("region") region?: string,
  ) {
    return this.hrAdvancedService.getHolidays(req.user.tenantId, region);
  }

  @Post("holidays")
  @Permissions("hr.employee.update")
  @ApiOperation({ summary: "Create holiday" })
  async createHoliday(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: any,
  ) {
    return this.hrAdvancedService.createHoliday(req.user.tenantId, dto);
  }

  @Patch("holidays/:id")
  @Permissions("hr.employee.update")
  @ApiOperation({ summary: "Update holiday" })
  async updateHoliday(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.any()) dto: any,
  ) {
    return this.hrAdvancedService.updateHoliday(req.user.tenantId, id, dto);
  }

  @Delete("holidays/:id")
  @Permissions("hr.employee.update")
  @ApiOperation({ summary: "Delete holiday" })
  async deleteHoliday(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.hrAdvancedService.deleteHoliday(req.user.tenantId, id);
  }

  // ══ EMPLOYEE ACHIEVEMENTS ══

  @Get("achievements")
  @Permissions("hr.achievement.read")
  @ApiOperation({ summary: "List employee achievements" })
  async getEmployeeAchievements(
    @Req() req: AuthenticatedRequest,
    @Query("employeeId") employeeId?: string,
  ) {
    return this.hrAdvancedService.getEmployeeAchievements(
      req.user.tenantId,
      employeeId,
    );
  }

  @Post("achievements")
  @Permissions("hr.achievement.create")
  @ApiOperation({ summary: "Create employee achievement" })
  async createEmployeeAchievement(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: any,
  ) {
    return this.hrAdvancedService.createEmployeeAchievement(
      req.user.tenantId,
      dto,
    );
  }

  @Delete("achievements/:id")
  @Permissions("hr.achievement.delete")
  @ApiOperation({ summary: "Delete employee achievement" })
  async deleteEmployeeAchievement(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.hrAdvancedService.deleteEmployeeAchievement(
      req.user.tenantId,
      id,
    );
  }

  // ══ EMPLOYEE REFERRALS ══

  @Get("referrals")
  @Permissions("hr.referral.read")
  @ApiOperation({ summary: "List employee referrals" })
  async getEmployeeReferrals(@Req() req: AuthenticatedRequest) {
    return this.hrAdvancedService.getEmployeeReferrals(req.user.tenantId);
  }

  @Post("referrals")
  @Permissions("hr.referral.create")
  @ApiOperation({ summary: "Create employee referral" })
  async createEmployeeReferral(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: any,
  ) {
    return this.hrAdvancedService.createEmployeeReferral(
      req.user.tenantId,
      dto,
    );
  }

  @Patch("referrals/:id/status")
  @Permissions("hr.referral.update")
  @ApiOperation({ summary: "Update referral status" })
  async updateEmployeeReferralStatus(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.any()) dto: any,
  ) {
    return this.hrAdvancedService.updateEmployeeReferralStatus(
      req.user.tenantId,
      id,
      dto.status,
      dto.rewardAmount,
    );
  }

  // ══ EMPLOYEE EDUCATION ══

  @Get("education")
  @Permissions("hr.employee.read")
  @ApiOperation({ summary: "List employee education records" })
  async getEmployeeEducation(
    @Req() req: AuthenticatedRequest,
    @Query("employeeId") employeeId?: string,
  ) {
    return this.hrAdvancedService.getEmployeeEducation(
      req.user.tenantId,
      employeeId,
    );
  }

  @Post("education")
  @Permissions("hr.employee.update")
  @ApiOperation({ summary: "Create employee education record" })
  async createEmployeeEducation(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: any,
  ) {
    return this.hrAdvancedService.createEmployeeEducation(
      req.user.tenantId,
      dto,
    );
  }

  @Delete("education/:id")
  @Permissions("hr.employee.update")
  @ApiOperation({ summary: "Delete employee education record" })
  async deleteEmployeeEducation(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.hrAdvancedService.deleteEmployeeEducation(
      req.user.tenantId,
      id,
    );
  }

  // ══ EMPLOYEE DEPENDENTS ══

  @Get("dependents")
  @Permissions("hr.employee.read")
  @ApiOperation({ summary: "List employee dependents" })
  async getEmployeeDependents(
    @Req() req: AuthenticatedRequest,
    @Query("employeeId") employeeId?: string,
  ) {
    return this.hrAdvancedService.getEmployeeDependents(
      req.user.tenantId,
      employeeId,
    );
  }

  @Post("dependents")
  @Permissions("hr.employee.update")
  @ApiOperation({ summary: "Create employee dependent" })
  async createEmployeeDependent(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: any,
  ) {
    return this.hrAdvancedService.createEmployeeDependent(
      req.user.tenantId,
      dto,
    );
  }

  @Delete("dependents/:id")
  @Permissions("hr.employee.update")
  @ApiOperation({ summary: "Delete employee dependent" })
  async deleteEmployeeDependent(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.hrAdvancedService.deleteEmployeeDependent(
      req.user.tenantId,
      id,
    );
  }

  // ══ EMPLOYEE EMERGENCY CONTACTS ══

  @Get("emergency-contacts")
  @Permissions("hr.employee.read")
  @ApiOperation({ summary: "List employee emergency contacts" })
  async getEmergencyContacts(
    @Req() req: AuthenticatedRequest,
    @Query("employeeId") employeeId?: string,
  ) {
    return this.hrAdvancedService.getEmployeeEmergencyContacts(
      req.user.tenantId,
      employeeId,
    );
  }

  @Post("emergency-contacts")
  @Permissions("hr.employee.update")
  @ApiOperation({ summary: "Create employee emergency contact" })
  async createEmergencyContact(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: any,
  ) {
    return this.hrAdvancedService.createEmployeeEmergencyContact(
      req.user.tenantId,
      dto,
    );
  }

  @Delete("emergency-contacts/:id")
  @Permissions("hr.employee.update")
  @ApiOperation({ summary: "Delete employee emergency contact" })
  async deleteEmergencyContact(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.hrAdvancedService.deleteEmployeeEmergencyContact(
      req.user.tenantId,
      id,
    );
  }

  // ══ HR EXPENSE CLAIMS ══

  @Get("expense-claims")
  @Permissions("hr.expense.read")
  @ApiOperation({ summary: "List expense claims" })
  async getExpenseClaims(@Req() req: AuthenticatedRequest, @Query() q: any) {
    return this.hrAdvancedService.getExpenseClaims(req.user.tenantId, q);
  }

  @Get("expense-claims/:id")
  @Permissions("hr.expense.read")
  @ApiOperation({ summary: "Get expense claim by ID" })
  async getExpenseClaimById(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.hrAdvancedService.getExpenseClaimById(req.user.tenantId, id);
  }

  @Post("expense-claims")
  @Permissions("hr.expense.create")
  @ApiOperation({ summary: "Create expense claim" })
  async createExpenseClaim(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: any,
  ) {
    return this.hrAdvancedService.createExpenseClaim(
      req.user.tenantId,
      req.user.orgId || "default",
      dto,
    );
  }

  @Post("expense-claims/:id/submit")
  @Permissions("hr.expense.create")
  @ApiOperation({ summary: "Submit expense claim" })
  async submitExpenseClaim(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.hrAdvancedService.submitExpenseClaim(req.user.tenantId, id);
  }

  @Post("expense-claims/:id/approve")
  @Permissions("hr.expense.approve")
  @ApiOperation({ summary: "Approve expense claim" })
  async approveExpenseClaim(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.hrAdvancedService.approveExpenseClaim(
      req.user.tenantId,
      id,
      req.user.userId,
    );
  }

  @Post("expense-claims/:id/reject")
  @Permissions("hr.expense.approve")
  @ApiOperation({ summary: "Reject expense claim" })
  async rejectExpenseClaim(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.any()) dto: any,
  ) {
    return this.hrAdvancedService.rejectExpenseClaim(
      req.user.tenantId,
      id,
      dto.reason,
    );
  }

  @Post("expense-claims/:id/reimburse")
  @Permissions("hr.expense.approve")
  @ApiOperation({ summary: "Reimburse expense claim" })
  async reimburseExpenseClaim(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.any()) dto: any,
  ) {
    return this.hrAdvancedService.reimburseExpenseClaim(
      req.user.tenantId,
      id,
      dto.paymentMethod,
    );
  }

  // ══ EMPLOYEE PROMOTIONS ══

  @Get("promotions")
  @Permissions("hr.promotion.read")
  @ApiOperation({ summary: "List employee promotions" })
  async getEmployeePromotions(
    @Req() req: AuthenticatedRequest,
    @Query("employeeId") employeeId?: string,
  ) {
    return this.hrAdvancedService.getEmployeePromotions(
      req.user.tenantId,
      employeeId,
    );
  }

  @Post("promotions")
  @Permissions("hr.promotion.create")
  @ApiOperation({ summary: "Create employee promotion" })
  async createEmployeePromotion(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: any,
  ) {
    return this.hrAdvancedService.createEmployeePromotion(
      req.user.tenantId,
      dto,
    );
  }

  // ══ EMPLOYEE SEPARATIONS ══

  @Get("separations")
  @Permissions("hr.separation.read")
  @ApiOperation({ summary: "List employee separations" })
  async getEmployeeSeparations(@Req() req: AuthenticatedRequest) {
    return this.hrAdvancedService.getEmployeeSeparations(req.user.tenantId);
  }

  @Post("separations")
  @Permissions("hr.separation.create")
  @ApiOperation({ summary: "Create employee separation" })
  async createEmployeeSeparation(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: any,
  ) {
    return this.hrAdvancedService.createEmployeeSeparation(
      req.user.tenantId,
      dto,
    );
  }

  // ══ EXIT INTERVIEWS ══

  @Get("exit-interviews")
  @Permissions("hr.exit-interview.read")
  @ApiOperation({ summary: "List exit interviews" })
  async getExitInterviews(@Req() req: AuthenticatedRequest) {
    return this.hrAdvancedService.getExitInterviews(req.user.tenantId);
  }

  @Post("exit-interviews")
  @Permissions("hr.exit-interview.create")
  @ApiOperation({ summary: "Create exit interview" })
  async createExitInterview(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: any,
  ) {
    return this.hrAdvancedService.createExitInterview(req.user.tenantId, dto);
  }

  // ══ EMPLOYEE WARNINGS ══

  @Get("warnings")
  @Permissions("hr.warning.read")
  @ApiOperation({ summary: "List employee warnings" })
  async getEmployeeWarnings(
    @Req() req: AuthenticatedRequest,
    @Query("employeeId") employeeId?: string,
  ) {
    return this.hrAdvancedService.getEmployeeWarnings(
      req.user.tenantId,
      employeeId,
    );
  }

  @Post("warnings")
  @Permissions("hr.warning.create")
  @ApiOperation({ summary: "Create employee warning" })
  async createEmployeeWarning(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: any,
  ) {
    return this.hrAdvancedService.createEmployeeWarning(req.user.tenantId, dto);
  }

  @Post("warnings/:id/resolve")
  @Permissions("hr.warning.create")
  @ApiOperation({ summary: "Resolve employee warning" })
  async resolveEmployeeWarning(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.any()) dto: any,
  ) {
    return this.hrAdvancedService.resolveEmployeeWarning(
      req.user.tenantId,
      id,
      dto.resolution,
    );
  }

  // ══ HR POLICIES ══

  @Get("policies")
  @Permissions("hr.policy.read")
  @ApiOperation({ summary: "List HR policies" })
  async getHrPolicies(@Req() req: AuthenticatedRequest) {
    return this.hrAdvancedService.getHrPolicies(req.user.tenantId);
  }

  @Get("policies/:id")
  @Permissions("hr.policy.read")
  @ApiOperation({ summary: "Get HR policy by ID" })
  async getHrPolicyById(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.hrAdvancedService.getHrPolicyById(req.user.tenantId, id);
  }

  @Post("policies")
  @Permissions("hr.policy.create")
  @ApiOperation({ summary: "Create HR policy" })
  async createHrPolicy(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: any,
  ) {
    return this.hrAdvancedService.createHrPolicy(req.user.tenantId, dto);
  }

  @Patch("policies/:id")
  @Permissions("hr.policy.update")
  @ApiOperation({ summary: "Update HR policy" })
  async updateHrPolicy(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.any()) dto: any,
  ) {
    return this.hrAdvancedService.updateHrPolicy(req.user.tenantId, id, dto);
  }

  @Delete("policies/:id")
  @Permissions("hr.policy.delete")
  @ApiOperation({ summary: "Delete HR policy" })
  async deleteHrPolicy(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.hrAdvancedService.deleteHrPolicy(req.user.tenantId, id);
  }

  @Post("policies/:id/acknowledge")
  @Permissions("hr.policy.read")
  @ApiOperation({ summary: "Acknowledge HR policy" })
  async acknowledgePolicy(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.any()) dto: any,
  ) {
    return this.hrAdvancedService.acknowledgeHrPolicy(
      req.user.tenantId,
      id,
      dto.employeeId,
      dto.signature,
    );
  }

  @Get("policies/:id/acknowledgments")
  @Permissions("hr.policy.read")
  @ApiOperation({ summary: "Get policy acknowledgment status" })
  async getPolicyAcknowledgments(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.hrAdvancedService.getPolicyAcknowledgments(
      req.user.tenantId,
      id,
    );
  }

  // ══ HR ANNOUNCEMENTS ══

  @Get("announcements")
  @Permissions("hr.announcement.read")
  @ApiOperation({ summary: "List HR announcements" })
  async getHrAnnouncements(@Req() req: AuthenticatedRequest) {
    return this.hrAdvancedService.getHrAnnouncements(req.user.tenantId);
  }

  @Post("announcements")
  @Permissions("hr.announcement.create")
  @ApiOperation({ summary: "Create HR announcement" })
  async createHrAnnouncement(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: any,
  ) {
    return this.hrAdvancedService.createHrAnnouncement(req.user.tenantId, dto);
  }

  @Delete("announcements/:id")
  @Permissions("hr.announcement.delete")
  @ApiOperation({ summary: "Delete HR announcement" })
  async deleteHrAnnouncement(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.hrAdvancedService.deleteHrAnnouncement(req.user.tenantId, id);
  }

  // ══ RECRUITMENT AGENCIES ══

  @Get("recruitment-agencies")
  @Permissions("hr.agency.read")
  @ApiOperation({ summary: "List recruitment agencies" })
  async getRecruitmentAgencies(@Req() req: AuthenticatedRequest) {
    return this.hrAdvancedService.getRecruitmentAgencies(req.user.tenantId);
  }

  @Post("recruitment-agencies")
  @Permissions("hr.agency.create")
  @ApiOperation({ summary: "Create recruitment agency" })
  async createRecruitmentAgency(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: any,
  ) {
    return this.hrAdvancedService.createRecruitmentAgency(
      req.user.tenantId,
      dto,
    );
  }

  @Patch("recruitment-agencies/:id")
  @Permissions("hr.agency.update")
  @ApiOperation({ summary: "Update recruitment agency" })
  async updateRecruitmentAgency(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.any()) dto: any,
  ) {
    return this.hrAdvancedService.updateRecruitmentAgency(
      req.user.tenantId,
      id,
      dto,
    );
  }

  @Delete("recruitment-agencies/:id")
  @Permissions("hr.agency.update")
  @ApiOperation({ summary: "Delete recruitment agency" })
  async deleteRecruitmentAgency(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.hrAdvancedService.deleteRecruitmentAgency(
      req.user.tenantId,
      id,
    );
  }

  // ══ OFFER TEMPLATES ══

  @Get("offer-templates")
  @Permissions("hr.offer-template.read")
  @ApiOperation({ summary: "List offer templates" })
  async getOfferTemplates(@Req() req: AuthenticatedRequest) {
    return this.hrAdvancedService.getOfferTemplates(req.user.tenantId);
  }

  @Post("offer-templates")
  @Permissions("hr.offer-template.create")
  @ApiOperation({ summary: "Create offer template" })
  async createOfferTemplate(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: any,
  ) {
    return this.hrAdvancedService.createOfferTemplate(req.user.tenantId, dto);
  }

  @Patch("offer-templates/:id")
  @Permissions("hr.offer-template.create")
  @ApiOperation({ summary: "Update offer template" })
  async updateOfferTemplate(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.any()) dto: any,
  ) {
    return this.hrAdvancedService.updateOfferTemplate(
      req.user.tenantId,
      id,
      dto,
    );
  }

  @Delete("offer-templates/:id")
  @Permissions("hr.offer-template.create")
  @ApiOperation({ summary: "Delete offer template" })
  async deleteOfferTemplate(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.hrAdvancedService.deleteOfferTemplate(req.user.tenantId, id);
  }

  // ══ SALARY REVISIONS ══

  @Get("salary-revisions")
  @Permissions("hr.salary.revision")
  @ApiOperation({ summary: "List salary revisions" })
  async getSalaryRevisions(
    @Req() req: AuthenticatedRequest,
    @Query("employeeId") employeeId?: string,
  ) {
    return this.hrAdvancedService.getSalaryRevisions(
      req.user.tenantId,
      employeeId,
    );
  }

  @Post("salary-revisions")
  @Permissions("hr.salary.revision")
  @ApiOperation({ summary: "Create salary revision" })
  async createSalaryRevision(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: any,
  ) {
    return this.hrAdvancedService.createSalaryRevision(req.user.tenantId, dto);
  }

  // ══ OVERTIME REQUESTS ══

  @Get("overtime-requests")
  @Permissions("hr.overtime.read")
  @ApiOperation({ summary: "List overtime requests" })
  async getOvertimeRequests(
    @Req() req: AuthenticatedRequest,
    @Query("employeeId") employeeId?: string,
  ) {
    return this.hrAdvancedService.getOvertimeRequests(
      req.user.tenantId,
      employeeId,
    );
  }

  @Post("overtime-requests")
  @Permissions("hr.overtime.create")
  @ApiOperation({ summary: "Create overtime request" })
  async createOvertimeRequest(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: any,
  ) {
    return this.hrAdvancedService.createOvertimeRequest(req.user.tenantId, dto);
  }

  @Post("overtime-requests/:id/approve")
  @Permissions("hr.overtime.approve")
  @ApiOperation({ summary: "Approve overtime request" })
  async approveOvertimeRequest(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.hrAdvancedService.approveOvertimeRequest(
      req.user.tenantId,
      id,
      req.user.userId,
    );
  }

  @Post("overtime-requests/:id/reject")
  @Permissions("hr.overtime.approve")
  @ApiOperation({ summary: "Reject overtime request" })
  async rejectOvertimeRequest(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.hrAdvancedService.rejectOvertimeRequest(req.user.tenantId, id);
  }

  // ══ ATTENDANCE ADJUSTMENTS ══

  @Get("attendance-adjustments")
  @Permissions("hr.attendance.read")
  @ApiOperation({ summary: "List attendance adjustments" })
  async getAttendanceAdjustments(
    @Req() req: AuthenticatedRequest,
    @Query("employeeId") employeeId?: string,
  ) {
    return this.hrAdvancedService.getAttendanceAdjustments(
      req.user.tenantId,
      employeeId,
    );
  }

  @Post("attendance-adjustments")
  @Permissions("hr.attendance.read")
  @ApiOperation({ summary: "Create attendance adjustment" })
  async createAttendanceAdjustment(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: any,
  ) {
    return this.hrAdvancedService.createAttendanceAdjustment(
      req.user.tenantId,
      dto,
    );
  }

  @Post("attendance-adjustments/:id/approve")
  @Permissions("hr.attendance.approve")
  @ApiOperation({ summary: "Approve attendance adjustment" })
  async approveAttendanceAdjustment(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.hrAdvancedService.approveAttendanceAdjustment(
      req.user.tenantId,
      id,
      req.user.userId,
    );
  }

  // ══ PAYROLL TAX & CONTRIBUTIONS ══

  @Get("payroll-tax-entries")
  @Permissions("hr.payroll.read")
  @ApiOperation({ summary: "List payroll tax entries" })
  async getPayrollTaxEntries(
    @Req() req: AuthenticatedRequest,
    @Query("payrollRunId") payrollRunId?: string,
  ) {
    return this.hrAdvancedService.getPayrollTaxEntries(
      req.user.tenantId,
      payrollRunId,
    );
  }

  @Get("payroll-contributions")
  @Permissions("hr.payroll.read")
  @ApiOperation({ summary: "List payroll contributions" })
  async getPayrollContributions(
    @Req() req: AuthenticatedRequest,
    @Query("payrollRunId") payrollRunId?: string,
  ) {
    return this.hrAdvancedService.getPayrollContributions(
      req.user.tenantId,
      payrollRunId,
    );
  }

  @Post("payroll-runs/:id/compute-taxes")
  @Permissions("hr.payroll.create")
  @ApiOperation({ summary: "Compute payroll taxes and contributions" })
  async computePayrollTaxes(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.hrAdvancedService.computePayrollTaxes(req.user.tenantId, id);
  }

  // ══ KPI TEMPLATES & EVALUATIONS ══

  @Get("kpi-templates")
  @Permissions("hr.kpi.read")
  @ApiOperation({ summary: "List KPI templates" })
  async getKpiTemplates(@Req() req: AuthenticatedRequest) {
    return this.hrAdvancedService.getKpiTemplates(req.user.tenantId);
  }

  @Post("kpi-templates")
  @Permissions("hr.kpi.create")
  @ApiOperation({ summary: "Create KPI template" })
  async createKpiTemplate(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: any,
  ) {
    return this.hrAdvancedService.createKpiTemplate(req.user.tenantId, dto);
  }

  @Delete("kpi-templates/:id")
  @Permissions("hr.kpi.create")
  @ApiOperation({ summary: "Delete KPI template" })
  async deleteKpiTemplate(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.hrAdvancedService.deleteKpiTemplate(req.user.tenantId, id);
  }

  @Get("kpi-evaluations")
  @Permissions("hr.kpi.read")
  @ApiOperation({ summary: "List KPI evaluations" })
  async getKpiEvaluations(
    @Req() req: AuthenticatedRequest,
    @Query("employeeId") employeeId?: string,
  ) {
    return this.hrAdvancedService.getKpiEvaluations(
      req.user.tenantId,
      employeeId,
    );
  }

  @Post("kpi-evaluations")
  @Permissions("hr.kpi.create")
  @ApiOperation({ summary: "Create KPI evaluation" })
  async createKpiEvaluation(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: any,
  ) {
    return this.hrAdvancedService.createKpiEvaluation(req.user.tenantId, dto);
  }

  @Patch("kpi-evaluations/:id")
  @Permissions("hr.kpi.update")
  @ApiOperation({ summary: "Update KPI evaluation" })
  async updateKpiEvaluation(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.any()) dto: any,
  ) {
    return this.hrAdvancedService.updateKpiEvaluation(
      req.user.tenantId,
      id,
      dto,
    );
  }

  @Post("kpi-evaluations/:id/submit")
  @Permissions("hr.kpi.update")
  @ApiOperation({ summary: "Submit KPI evaluation" })
  async submitKpiEvaluation(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.hrAdvancedService.submitKpiEvaluation(req.user.tenantId, id);
  }
}
