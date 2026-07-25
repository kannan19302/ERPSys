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
import { HrRecruitmentOnboardingService } from "./hr-recruitment-onboarding.service";
import { Request } from "express";

interface AuthReq extends Request {
  user: { tenantId: string; userId: string; roles: string[] };
}

@ApiTags("hr-recruitment")
@ApiBearerAuth()
@Controller("hr/recruitment")
@UseGuards(JwtAuthGuard, RbacGuard)
export class HrRecruitmentOnboardingController {
  constructor(private readonly svc: HrRecruitmentOnboardingService) {}

  // ── Recruitment Dashboard ──
  @Get("dashboard")
  @Permissions("hr.recruitment.read")
  @ApiOperation({ summary: "Recruitment dashboard overview" })
  async getDashboard(@Req() req: AuthReq) {
    return this.svc.getRecruitmentDashboard(req.user.tenantId);
  }

  // ── Job Openings ──
  @Get("job-openings")
  @Permissions("hr.recruitment.read")
  @ApiOperation({ summary: "List job openings" })
  async getJobOpenings(@Req() req: AuthReq, @Query() q: any) {
    return this.svc.getJobOpenings(req.user.tenantId, q);
  }

  @Get("job-openings/:id")
  @Permissions("hr.recruitment.read")
  @ApiOperation({ summary: "Get job opening by ID" })
  async getJobOpeningById(@Req() req: AuthReq, @Param("id") id: string) {
    return this.svc.getJobOpeningById(req.user.tenantId, id);
  }

  @Post("job-openings")
  @Permissions("hr.recruitment.create")
  @ApiOperation({ summary: "Create job opening" })
  async createJobOpening(@Req() req: AuthReq, @Body() dto: any) {
    return this.svc.createJobOpening(req.user.tenantId, dto);
  }

  @Patch("job-openings/:id")
  @Permissions("hr.recruitment.update")
  @ApiOperation({ summary: "Update job opening" })
  async updateJobOpening(
    @Req() req: AuthReq,
    @Param("id") id: string,
    @Body() dto: any,
  ) {
    return this.svc.updateJobOpening(req.user.tenantId, id, dto);
  }

  @Post("job-openings/:id/close")
  @Permissions("hr.recruitment.update")
  @ApiOperation({ summary: "Close job opening" })
  async closeJobOpening(@Req() req: AuthReq, @Param("id") id: string) {
    return this.svc.closeJobOpening(req.user.tenantId, id);
  }

  @Post("job-openings/:id/publish")
  @Permissions("hr.recruitment.update")
  @ApiOperation({ summary: "Publish job opening to channels" })
  async publishJobOpening(
    @Req() req: AuthReq,
    @Param("id") id: string,
    @Body() dto: any,
  ) {
    return this.svc.publishJobOpening(req.user.tenantId, id, dto);
  }

  @Get("job-openings/:id/pipeline")
  @Permissions("hr.recruitment.read")
  @ApiOperation({ summary: "Get recruitment pipeline for job opening" })
  async getPipeline(@Req() req: AuthReq, @Param("id") id: string) {
    return this.svc.getInterviewPipeline(req.user.tenantId, id);
  }

  // ── Candidates ──
  @Get("candidates")
  @Permissions("hr.recruitment.read")
  @ApiOperation({ summary: "List candidates" })
  async getCandidates(@Req() req: AuthReq, @Query() q: any) {
    return this.svc.getCandidates(req.user.tenantId, q);
  }

  @Get("candidates/:id")
  @Permissions("hr.recruitment.read")
  @ApiOperation({ summary: "Get candidate by ID" })
  async getCandidateById(@Req() req: AuthReq, @Param("id") id: string) {
    return this.svc.getCandidateById(req.user.tenantId, id);
  }

  @Post("candidates")
  @Permissions("hr.recruitment.create")
  @ApiOperation({ summary: "Create candidate profile" })
  async createCandidate(@Req() req: AuthReq, @Body() dto: any) {
    return this.svc.createCandidate(req.user.tenantId, dto);
  }

  @Patch("candidates/:id")
  @Permissions("hr.recruitment.update")
  @ApiOperation({ summary: "Update candidate profile" })
  async updateCandidate(
    @Req() req: AuthReq,
    @Param("id") id: string,
    @Body() dto: any,
  ) {
    return this.svc.updateCandidate(req.user.tenantId, id, dto);
  }

  // ── Applications ──
  @Get("applications")
  @Permissions("hr.recruitment.read")
  @ApiOperation({ summary: "List applications" })
  async getApplications(@Req() req: AuthReq, @Query() q: any) {
    return this.svc.getApplications(req.user.tenantId, q);
  }

  @Post("applications")
  @Permissions("hr.recruitment.create")
  @ApiOperation({ summary: "Create application (apply for job)" })
  async applyForJob(@Req() req: AuthReq, @Body() dto: any) {
    return this.svc.applyForJob(req.user.tenantId, dto);
  }

  @Patch("applications/:id/status")
  @Permissions("hr.recruitment.update")
  @ApiOperation({ summary: "Update application status" })
  async updateApplicationStatus(
    @Req() req: AuthReq,
    @Param("id") id: string,
    @Body() dto: any,
  ) {
    return this.svc.updateApplicationStatus(req.user.tenantId, id, dto);
  }

  @Post("applications/:id/hire")
  @Permissions("hr.recruitment.hire")
  @ApiOperation({ summary: "Hire candidate from application" })
  async hireCandidate(
    @Req() req: AuthReq,
    @Param("id") id: string,
    @Body() dto: any,
  ) {
    return this.svc.hireCandidate(req.user.tenantId, id, dto);
  }

  // ── Interviews ──
  @Get("interviews")
  @Permissions("hr.recruitment.read")
  @ApiOperation({ summary: "List interviews" })
  async getInterviews(@Req() req: AuthReq, @Query() q: any) {
    return this.svc.getInterviews(req.user.tenantId, q);
  }

  @Post("interviews")
  @Permissions("hr.recruitment.create")
  @ApiOperation({ summary: "Schedule interview" })
  async scheduleInterview(@Req() req: AuthReq, @Body() dto: any) {
    return this.svc.scheduleInterview(req.user.tenantId, dto);
  }

  @Post("interviews/:id/reschedule")
  @Permissions("hr.recruitment.update")
  @ApiOperation({ summary: "Reschedule interview" })
  async rescheduleInterview(
    @Req() req: AuthReq,
    @Param("id") id: string,
    @Body() dto: any,
  ) {
    return this.svc.rescheduleInterview(req.user.tenantId, id, dto);
  }

  @Post("interviews/:id/cancel")
  @Permissions("hr.recruitment.update")
  @ApiOperation({ summary: "Cancel interview" })
  async cancelInterview(
    @Req() req: AuthReq,
    @Param("id") id: string,
    @Body() dto: any,
  ) {
    return this.svc.cancelInterview(req.user.tenantId, id, dto);
  }

  @Post("interviews/:id/feedback")
  @Permissions("hr.recruitment.update")
  @ApiOperation({ summary: "Submit interview feedback" })
  async submitFeedback(
    @Req() req: AuthReq,
    @Param("id") id: string,
    @Body() dto: any,
  ) {
    return this.svc.submitInterviewFeedback(req.user.tenantId, id, dto);
  }

  @Get("interviews/my-schedule/:interviewerId")
  @Permissions("hr.recruitment.read")
  @ApiOperation({ summary: "Get interviewer's upcoming schedule" })
  async getInterviewerSchedule(
    @Req() req: AuthReq,
    @Param("interviewerId") interviewerId: string,
  ) {
    return this.svc.getInterviewScheduleByInterviewer(
      req.user.tenantId,
      interviewerId,
    );
  }

  // ── Offers ──
  @Get("offers")
  @Permissions("hr.recruitment.read")
  @ApiOperation({ summary: "List job offers" })
  async getOffers(@Req() req: AuthReq, @Query() q: any) {
    return this.svc.getOffers(req.user.tenantId, q);
  }

  @Post("offers")
  @Permissions("hr.recruitment.create")
  @ApiOperation({ summary: "Create job offer" })
  async createOffer(@Req() req: AuthReq, @Body() dto: any) {
    return this.svc.createOffer(req.user.tenantId, dto);
  }

  @Post("offers/:id/respond")
  @Permissions("hr.recruitment.update")
  @ApiOperation({ summary: "Respond to offer (accept/decline)" })
  async respondToOffer(
    @Req() req: AuthReq,
    @Param("id") id: string,
    @Body() dto: any,
  ) {
    return this.svc.respondToOffer(req.user.tenantId, id, dto);
  }

  // ── Onboarding ──
  @Get("onboarding")
  @Permissions("hr.recruitment.read")
  @ApiOperation({ summary: "List onboarding checklists" })
  async getOnboarding(@Req() req: AuthReq, @Query() q: any) {
    return this.svc.getOnboardingChecklists(req.user.tenantId, q);
  }

  @Post("onboarding")
  @Permissions("hr.recruitment.create")
  @ApiOperation({ summary: "Create onboarding checklist" })
  async createOnboarding(@Req() req: AuthReq, @Body() dto: any) {
    return this.svc.createOnboardingChecklist(req.user.tenantId, dto);
  }

  @Patch("onboarding/items/:itemId")
  @Permissions("hr.recruitment.update")
  @ApiOperation({ summary: "Update onboarding checklist item" })
  async updateItem(
    @Req() req: AuthReq,
    @Param("itemId") itemId: string,
    @Body() dto: any,
  ) {
    return this.svc.updateChecklistItem(req.user.tenantId, itemId, dto);
  }

  @Get("onboarding/:employeeId/progress")
  @Permissions("hr.recruitment.read")
  @ApiOperation({ summary: "Get employee's onboarding progress" })
  async getProgress(
    @Req() req: AuthReq,
    @Param("employeeId") employeeId: string,
  ) {
    return this.svc.getOnboardingProgress(req.user.tenantId, employeeId);
  }

  @Get("onboarding/:employeeId/welcome-kit")
  @Permissions("hr.recruitment.read")
  @ApiOperation({ summary: "Get new hire's welcome kit" })
  async getWelcomeKit(
    @Req() req: AuthReq,
    @Param("employeeId") employeeId: string,
  ) {
    return this.svc.getNewHireWelcomeKit(req.user.tenantId, employeeId);
  }

  // ── Recruitment Analytics ──
  @Get("analytics/time-to-hire")
  @Permissions("hr.report.analytics")
  @ApiOperation({ summary: "Time-to-hire metrics" })
  async getTimeToHire(@Req() req: AuthReq) {
    return this.svc.getTimeToHireMetrics(req.user.tenantId);
  }

  @Get("analytics/candidate-sources")
  @Permissions("hr.report.analytics")
  @ApiOperation({ summary: "Candidate source analysis" })
  async getCandidateSources(@Req() req: AuthReq) {
    return this.svc.getCandidateSourceAnalysis(req.user.tenantId);
  }

  @Get("analytics/offer-acceptance-rate")
  @Permissions("hr.report.analytics")
  @ApiOperation({ summary: "Offer acceptance rate" })
  async getOfferRate(@Req() req: AuthReq) {
    return this.svc.getOfferAcceptanceRate(req.user.tenantId);
  }

  @Get("analytics/funnel")
  @Permissions("hr.report.analytics")
  @ApiOperation({ summary: "Recruitment funnel metrics" })
  async getFunnel(
    @Req() req: AuthReq,
    @Query("jobOpeningId") jobOpeningId?: string,
  ) {
    return this.svc.getRecruitmentFunnelMetrics(
      req.user.tenantId,
      jobOpeningId,
    );
  }

  @Get("analytics/cost-per-hire")
  @Permissions("hr.report.analytics")
  @ApiOperation({ summary: "Cost per hire analysis" })
  async getCostPerHire(@Req() req: AuthReq) {
    return this.svc.getCostPerHire(req.user.tenantId);
  }

  @Get("analytics/report")
  @Permissions("hr.report.analytics")
  @ApiOperation({ summary: "Comprehensive recruitment report" })
  async getRecruitmentReport(@Req() req: AuthReq) {
    return this.svc.getRecruitmentReport(req.user.tenantId);
  }

  @Get("analytics/interview-conversion")
  @Permissions("hr.report.analytics")
  @ApiOperation({ summary: "Interview conversion rate" })
  async getInterviewConversion(@Req() req: AuthReq) {
    return this.svc.getInterviewConversionRate(req.user.tenantId);
  }
}
