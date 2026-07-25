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
import { HrExperienceService } from "./hr-experience.service";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import {
  createEmployeeRecognitionSchema,
  createWellnessChallengeSchema,
  createENPSurveySchema,
  createPulseSurveySchema,
  submitSurveyResponseSchema,
  createAlumniRecordSchema,
  createAlumniEventSchema,
} from "@unerp/shared";

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
    orgId?: string;
  };
}

@ApiTags("hr-advanced-experience")
@ApiBearerAuth()
@Controller("hr-advanced/experience")
@UseGuards(JwtAuthGuard, RbacGuard)
export class HrExperienceController {
  constructor(private readonly hrExperienceService: HrExperienceService) {}

  // ══ RECOGNITION AWARDS ══

  @Get("recognition-awards")
  @Permissions("hr.recognition.awards.read")
  @ApiOperation({ summary: "List recognition awards, optionally by category" })
  async getRecognitionAwards(
    @Req() req: AuthenticatedRequest,
    @Query("category") category?: string,
  ) {
    return this.hrExperienceService.getRecognitionAwards(
      req.user.tenantId,
      category,
    );
  }

  @Get("recognition-awards/:id")
  @Permissions("hr.recognition.awards.read")
  @ApiOperation({ summary: "Get recognition award by ID" })
  async getRecognitionAwardById(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.hrExperienceService.getRecognitionAwardById(
      req.user.tenantId,
      id,
    );
  }

  @Post("recognition-awards")
  @Permissions("hr.recognition.awards.create")
  @ApiOperation({ summary: "Create recognition award" })
  async createRecognitionAward(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: any,
  ) {
    return this.hrExperienceService.createRecognitionAward(
      req.user.tenantId,
      dto,
    );
  }

  @Patch("recognition-awards/:id")
  @Permissions("hr.recognition.awards.update")
  @ApiOperation({ summary: "Update recognition award" })
  async updateRecognitionAward(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.any()) dto: any,
  ) {
    return this.hrExperienceService.updateRecognitionAward(
      req.user.tenantId,
      id,
      dto,
    );
  }

  @Delete("recognition-awards/:id")
  @Permissions("hr.recognition.awards.delete")
  @ApiOperation({ summary: "Delete recognition award" })
  async deleteRecognitionAward(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.hrExperienceService.deleteRecognitionAward(
      req.user.tenantId,
      id,
    );
  }

  // ══ EMPLOYEE RECOGNITIONS ══

  @Get("recognitions")
  @Permissions("hr.recognition.read")
  @ApiOperation({ summary: "List recognitions with pagination and filters" })
  async getRecognitions(@Req() req: AuthenticatedRequest, @Query() q: any) {
    return this.hrExperienceService.getRecognitions(req.user.tenantId, q);
  }

  @Get("recognitions/feed")
  @Permissions("hr.recognition.read")
  @ApiOperation({ summary: "Get recent public recognition feed" })
  async getRecognitionFeed(@Req() req: AuthenticatedRequest) {
    return this.hrExperienceService.getRecognitionFeed(req.user.tenantId);
  }

  @Get("recognitions/:id")
  @Permissions("hr.recognition.read")
  @ApiOperation({ summary: "Get recognition by ID" })
  async getRecognitionById(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.hrExperienceService.getRecognitionById(req.user.tenantId, id);
  }

  @Post("recognitions")
  @Permissions("hr.recognition.create")
  @ApiOperation({ summary: "Create employee recognition" })
  async createRecognition(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createEmployeeRecognitionSchema) dto: any,
  ) {
    return this.hrExperienceService.createRecognition(req.user.tenantId, dto);
  }

  @Patch("recognitions/:id")
  @Permissions("hr.recognition.update")
  @ApiOperation({ summary: "Update recognition" })
  async updateRecognition(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.any()) dto: any,
  ) {
    return this.hrExperienceService.updateRecognition(
      req.user.tenantId,
      id,
      dto,
    );
  }

  @Delete("recognitions/:id")
  @Permissions("hr.recognition.delete")
  @ApiOperation({ summary: "Delete recognition" })
  async deleteRecognition(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.hrExperienceService.deleteRecognition(req.user.tenantId, id);
  }

  // ══ WELLNESS CHALLENGES ══

  @Get("wellness-challenges")
  @Permissions("hr.wellness-challenges.read")
  @ApiOperation({
    summary: "List wellness challenges by type or active status",
  })
  async getWellnessChallenges(
    @Req() req: AuthenticatedRequest,
    @Query("challengeType") challengeType?: string,
    @Query("isActive") isActive?: string,
  ) {
    return this.hrExperienceService.getWellnessChallenges(
      req.user.tenantId,
      challengeType,
      isActive !== undefined ? isActive === "true" : undefined,
    );
  }

  @Get("wellness-challenges/:id")
  @Permissions("hr.wellness-challenges.read")
  @ApiOperation({ summary: "Get wellness challenge by ID with leaderboard" })
  async getWellnessChallengeById(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.hrExperienceService.getWellnessChallengeById(
      req.user.tenantId,
      id,
    );
  }

  @Post("wellness-challenges")
  @Permissions("hr.wellness-challenges.create")
  @ApiOperation({ summary: "Create wellness challenge" })
  async createWellnessChallenge(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createWellnessChallengeSchema) dto: any,
  ) {
    return this.hrExperienceService.createWellnessChallenge(
      req.user.tenantId,
      dto,
    );
  }

  @Patch("wellness-challenges/:id")
  @Permissions("hr.wellness-challenges.update")
  @ApiOperation({ summary: "Update wellness challenge" })
  async updateWellnessChallenge(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.any()) dto: any,
  ) {
    return this.hrExperienceService.updateWellnessChallenge(
      req.user.tenantId,
      id,
      dto,
    );
  }

  @Delete("wellness-challenges/:id")
  @Permissions("hr.wellness-challenges.delete")
  @ApiOperation({ summary: "Delete wellness challenge" })
  async deleteWellnessChallenge(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.hrExperienceService.deleteWellnessChallenge(
      req.user.tenantId,
      id,
    );
  }

  @Get("wellness-challenges/:id/leaderboard")
  @Permissions("hr.wellness-challenges.read")
  @ApiOperation({ summary: "Get leaderboard for a wellness challenge" })
  async getLeaderboard(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.hrExperienceService.getLeaderboard(req.user.tenantId, id);
  }

  // ══ eNPS SURVEYS ══

  @Get("enps-surveys")
  @Permissions("hr.surveys.enps.read")
  @ApiOperation({ summary: "List eNPS surveys by date range" })
  async getENPSurveys(
    @Req() req: AuthenticatedRequest,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
  ) {
    return this.hrExperienceService.getENPSurveys(
      req.user.tenantId,
      startDate,
      endDate,
    );
  }

  @Get("enps-surveys/dashboard")
  @Permissions("hr.surveys.enps.read")
  @ApiOperation({
    summary: "Get eNPS dashboard with avg score, response rate, breakdown",
  })
  async getENPSDashboard(@Req() req: AuthenticatedRequest) {
    return this.hrExperienceService.getENPSDashboard(req.user.tenantId);
  }

  @Get("enps-surveys/:id")
  @Permissions("hr.surveys.enps.read")
  @ApiOperation({ summary: "Get eNPS survey by ID" })
  async getENPSurveyById(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.hrExperienceService.getENPSurveyById(req.user.tenantId, id);
  }

  @Post("enps-surveys")
  @Permissions("hr.surveys.enps.create")
  @ApiOperation({ summary: "Create eNPS survey" })
  async createENPSurvey(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createENPSurveySchema) dto: any,
  ) {
    return this.hrExperienceService.createENPSurvey(req.user.tenantId, dto);
  }

  @Patch("enps-surveys/:id")
  @Permissions("hr.surveys.enps.update")
  @ApiOperation({ summary: "Update eNPS survey" })
  async updateENPSurvey(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.any()) dto: any,
  ) {
    return this.hrExperienceService.updateENPSurvey(req.user.tenantId, id, dto);
  }

  @Delete("enps-surveys/:id")
  @Permissions("hr.surveys.enps.delete")
  @ApiOperation({ summary: "Delete eNPS survey" })
  async deleteENPSurvey(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.hrExperienceService.deleteENPSurvey(req.user.tenantId, id);
  }

  @Post("enps-surveys/:id/launch")
  @Permissions("hr.surveys.enps.update")
  @ApiOperation({ summary: "Launch eNPS survey" })
  async launchENPSurvey(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.hrExperienceService.launchENPSurvey(req.user.tenantId, id);
  }

  // ══ PULSE SURVEYS ══

  @Get("pulse-surveys")
  @Permissions("hr.surveys.pulse.read")
  @ApiOperation({ summary: "List pulse surveys by frequency or department" })
  async getPulseSurveys(
    @Req() req: AuthenticatedRequest,
    @Query("frequency") frequency?: string,
    @Query("departmentId") departmentId?: string,
  ) {
    return this.hrExperienceService.getPulseSurveys(
      req.user.tenantId,
      frequency,
      departmentId,
    );
  }

  @Get("pulse-surveys/:id")
  @Permissions("hr.surveys.pulse.read")
  @ApiOperation({ summary: "Get pulse survey by ID" })
  async getPulseSurveyById(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.hrExperienceService.getPulseSurveyById(req.user.tenantId, id);
  }

  @Post("pulse-surveys")
  @Permissions("hr.surveys.pulse.create")
  @ApiOperation({ summary: "Create pulse survey" })
  async createPulseSurvey(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createPulseSurveySchema) dto: any,
  ) {
    return this.hrExperienceService.createPulseSurvey(req.user.tenantId, dto);
  }

  @Patch("pulse-surveys/:id")
  @Permissions("hr.surveys.pulse.update")
  @ApiOperation({ summary: "Update pulse survey" })
  async updatePulseSurvey(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.any()) dto: any,
  ) {
    return this.hrExperienceService.updatePulseSurvey(
      req.user.tenantId,
      id,
      dto,
    );
  }

  @Delete("pulse-surveys/:id")
  @Permissions("hr.surveys.pulse.delete")
  @ApiOperation({ summary: "Delete pulse survey" })
  async deletePulseSurvey(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.hrExperienceService.deletePulseSurvey(req.user.tenantId, id);
  }

  @Post("pulse-surveys/:id/send")
  @Permissions("hr.surveys.pulse.update")
  @ApiOperation({ summary: "Send pulse survey" })
  async sendPulseSurvey(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.hrExperienceService.sendPulseSurvey(req.user.tenantId, id);
  }

  // ══ SURVEY RESPONSES ══

  @Post("survey-responses")
  @Permissions("hr.surveys.responses.create")
  @ApiOperation({ summary: "Submit survey response" })
  async submitSurveyResponse(
    @Req() req: AuthenticatedRequest,
    @ZodBody(submitSurveyResponseSchema) dto: any,
  ) {
    return this.hrExperienceService.submitSurveyResponse(
      req.user.tenantId,
      dto,
    );
  }

  @Get("survey-responses/:surveyId")
  @Permissions("hr.surveys.responses.read")
  @ApiOperation({ summary: "List responses for a survey" })
  async getSurveyResponses(
    @Req() req: AuthenticatedRequest,
    @Param("surveyId") surveyId: string,
  ) {
    return this.hrExperienceService.getSurveyResponses(
      req.user.tenantId,
      surveyId,
    );
  }

  @Get("survey-responses/:surveyId/analytics")
  @Permissions("hr.surveys.responses.read")
  @ApiOperation({ summary: "Get response analytics (avg score, distribution)" })
  async getResponseAnalytics(
    @Req() req: AuthenticatedRequest,
    @Param("surveyId") surveyId: string,
  ) {
    return this.hrExperienceService.getResponseAnalytics(
      req.user.tenantId,
      surveyId,
    );
  }

  // ══ EMPLOYEE JOURNEY MILESTONES ══

  @Get("journey-milestones")
  @Permissions("hr.journey.read")
  @ApiOperation({ summary: "List journey milestones by employee or type" })
  async getJourneyMilestones(
    @Req() req: AuthenticatedRequest,
    @Query("employeeId") employeeId?: string,
    @Query("milestoneType") milestoneType?: string,
  ) {
    return this.hrExperienceService.getJourneyMilestones(
      req.user.tenantId,
      employeeId,
      milestoneType,
    );
  }

  @Get("journey-milestones/:id")
  @Permissions("hr.journey.read")
  @ApiOperation({ summary: "Get journey milestone by ID" })
  async getJourneyMilestoneById(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.hrExperienceService.getJourneyMilestoneById(
      req.user.tenantId,
      id,
    );
  }

  @Post("journey-milestones")
  @Permissions("hr.journey.create")
  @ApiOperation({ summary: "Create journey milestone" })
  async createJourneyMilestone(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: any,
  ) {
    return this.hrExperienceService.createJourneyMilestone(
      req.user.tenantId,
      dto,
    );
  }

  @Patch("journey-milestones/:id")
  @Permissions("hr.journey.update")
  @ApiOperation({ summary: "Update journey milestone" })
  async updateJourneyMilestone(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.any()) dto: any,
  ) {
    return this.hrExperienceService.updateJourneyMilestone(
      req.user.tenantId,
      id,
      dto,
    );
  }

  @Delete("journey-milestones/:id")
  @Permissions("hr.journey.delete")
  @ApiOperation({ summary: "Delete journey milestone" })
  async deleteJourneyMilestone(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.hrExperienceService.deleteJourneyMilestone(
      req.user.tenantId,
      id,
    );
  }

  @Post("journey-milestones/:id/complete")
  @Permissions("hr.journey.update")
  @ApiOperation({ summary: "Complete a journey milestone" })
  async completeJourneyMilestone(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.hrExperienceService.completeJourneyMilestone(
      req.user.tenantId,
      id,
    );
  }

  // ══ ALUMNI RECORDS ══

  @Get("alumni")
  @Permissions("hr.alumni.read")
  @ApiOperation({ summary: "List alumni records by active status or search" })
  async getAlumniRecords(
    @Req() req: AuthenticatedRequest,
    @Query("isActiveAlumni") isActiveAlumni?: string,
    @Query("search") search?: string,
  ) {
    return this.hrExperienceService.getAlumniRecords(
      req.user.tenantId,
      isActiveAlumni !== undefined ? isActiveAlumni === "true" : undefined,
      search,
    );
  }

  @Get("alumni/:id")
  @Permissions("hr.alumni.read")
  @ApiOperation({ summary: "Get alumni record by ID" })
  async getAlumniRecordById(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.hrExperienceService.getAlumniRecordById(req.user.tenantId, id);
  }

  @Post("alumni")
  @Permissions("hr.alumni.create")
  @ApiOperation({ summary: "Create alumni record" })
  async createAlumniRecord(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createAlumniRecordSchema) dto: any,
  ) {
    return this.hrExperienceService.createAlumniRecord(req.user.tenantId, dto);
  }

  @Patch("alumni/:id")
  @Permissions("hr.alumni.update")
  @ApiOperation({ summary: "Update alumni record" })
  async updateAlumniRecord(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.any()) dto: any,
  ) {
    return this.hrExperienceService.updateAlumniRecord(
      req.user.tenantId,
      id,
      dto,
    );
  }

  @Delete("alumni/:id")
  @Permissions("hr.alumni.delete")
  @ApiOperation({ summary: "Delete alumni record" })
  async deleteAlumniRecord(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.hrExperienceService.deleteAlumniRecord(req.user.tenantId, id);
  }

  // ══ ALUMNI EVENTS ══

  @Get("alumni-events")
  @Permissions("hr.alumni.events.read")
  @ApiOperation({ summary: "List alumni events by date range" })
  async getAlumniEvents(
    @Req() req: AuthenticatedRequest,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
  ) {
    return this.hrExperienceService.getAlumniEvents(
      req.user.tenantId,
      startDate,
      endDate,
    );
  }

  @Get("alumni-events/:id")
  @Permissions("hr.alumni.events.read")
  @ApiOperation({ summary: "Get alumni event by ID" })
  async getAlumniEventById(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.hrExperienceService.getAlumniEventById(req.user.tenantId, id);
  }

  @Post("alumni-events")
  @Permissions("hr.alumni.events.create")
  @ApiOperation({ summary: "Create alumni event" })
  async createAlumniEvent(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createAlumniEventSchema) dto: any,
  ) {
    return this.hrExperienceService.createAlumniEvent(req.user.tenantId, dto);
  }

  @Patch("alumni-events/:id")
  @Permissions("hr.alumni.events.update")
  @ApiOperation({ summary: "Update alumni event" })
  async updateAlumniEvent(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.any()) dto: any,
  ) {
    return this.hrExperienceService.updateAlumniEvent(
      req.user.tenantId,
      id,
      dto,
    );
  }

  @Delete("alumni-events/:id")
  @Permissions("hr.alumni.events.delete")
  @ApiOperation({ summary: "Delete alumni event" })
  async deleteAlumniEvent(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.hrExperienceService.deleteAlumniEvent(req.user.tenantId, id);
  }

  // ══ ALUMNI EVENT ATTENDANCE ══

  @Get("alumni-events/:eventId/attendees")
  @Permissions("hr.alumni.events.read")
  @ApiOperation({ summary: "List attendees for an alumni event" })
  async getAlumniEventAttendees(
    @Req() req: AuthenticatedRequest,
    @Param("eventId") eventId: string,
  ) {
    return this.hrExperienceService.getAlumniEventAttendees(
      req.user.tenantId,
      eventId,
    );
  }

  @Post("alumni-events/:eventId/rsvp")
  @Permissions("hr.alumni.events.create")
  @ApiOperation({ summary: "RSVP to an alumni event" })
  async rsvpAlumniEvent(
    @Req() req: AuthenticatedRequest,
    @Param("eventId") eventId: string,
    @ZodBody(z.object({ alumniId: z.string().min(1) })) dto: any,
  ) {
    return this.hrExperienceService.rsvpAlumniEvent(
      req.user.tenantId,
      eventId,
      dto.alumniId,
    );
  }

  @Post("alumni-events/:eventId/check-in")
  @Permissions("hr.alumni.events.update")
  @ApiOperation({ summary: "Check in attendee to an alumni event" })
  async checkInAlumniEvent(
    @Req() req: AuthenticatedRequest,
    @Param("eventId") eventId: string,
    @ZodBody(z.object({ alumniId: z.string().min(1) })) dto: any,
  ) {
    return this.hrExperienceService.checkInAlumniEvent(
      req.user.tenantId,
      eventId,
      dto.alumniId,
    );
  }

  // ══ DASHBOARD ══

  @Get("analytics")
  @Permissions("hr.recognition.read")
  @ApiOperation({ summary: "Get experience analytics dashboard" })
  async getExperienceAnalytics(@Req() req: AuthenticatedRequest) {
    return this.hrExperienceService.getExperienceAnalytics(req.user.tenantId);
  }
}
