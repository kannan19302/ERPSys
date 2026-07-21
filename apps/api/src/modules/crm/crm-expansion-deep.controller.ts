import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import {
  CrmSalesAutomationService,
  AutoAssignmentRuleSchema,
  EscalationRuleSchema,
  LeadScoringModelSchema,
  SalesSequenceSchema,
} from "./crm-sales-automation.service";
import {
  CrmCustomerSuccessService,
  HealthScoreConfigSchema,
  NpsSurveySchema,
  OnboardingChecklistSchema,
  RetentionCampaignSchema,
} from "./crm-customer-success.service";
import {
  CrmMarketingAutomationService,
  DripCampaignSchema,
  LandingPageSchema,
  ABTestSchema,
} from "./crm-marketing-automation.service";
import { Request } from "express";

interface AuthRequest extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[] };
}

@Controller("crm")
@UseGuards(JwtAuthGuard, RbacGuard)
export class CrmExpansionDeepController {
  constructor(
    private readonly salesAutomation: CrmSalesAutomationService,
    private readonly customerSuccess: CrmCustomerSuccessService,
    private readonly marketingAutomation: CrmMarketingAutomationService,
  ) {}

  private tid(req: AuthRequest): string {
    return req.user.tenantId;
  }

  // ── Sales Automation: Auto Assignment Rules (12 endpoints) ──

  @Post("sales-automation/assignment-rules")
  @Permissions("crm.settings.create")
  @HttpCode(HttpStatus.CREATED)
  async createAssignmentRule(@Req() req: AuthRequest, @Body() body: any) {
    const data = AutoAssignmentRuleSchema.parse(body);
    return this.salesAutomation.createAutoAssignmentRule(this.tid(req), data);
  }

  @Get("sales-automation/assignment-rules")
  @Permissions("crm.settings.read")
  async listAssignmentRules(
    @Req() req: AuthRequest,
    @Query("objectType") objectType?: string,
  ) {
    return {
      data: await this.salesAutomation.getAutoAssignmentRules(
        this.tid(req),
        objectType,
      ),
    };
  }

  @Get("sales-automation/assignment-rules/stats")
  @Permissions("crm.settings.read")
  async getAssignmentStats(@Req() req: AuthRequest) {
    return this.salesAutomation.getAssignmentStats(this.tid(req));
  }

  @Get("sales-automation/assignment-rules/:id")
  @Permissions("crm.settings.read")
  async getAssignmentRule(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.salesAutomation.getAutoAssignmentRule(this.tid(req), id);
  }

  @Patch("sales-automation/assignment-rules/:id")
  @Permissions("crm.settings.update")
  async updateAssignmentRule(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.salesAutomation.updateAutoAssignmentRule(
      this.tid(req),
      id,
      body,
    );
  }

  @Delete("sales-automation/assignment-rules/:id")
  @Permissions("crm.settings.delete")
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAssignmentRule(@Req() req: AuthRequest, @Param("id") id: string) {
    await this.salesAutomation.deleteAutoAssignmentRule(this.tid(req), id);
  }

  @Post("sales-automation/assignment-rules/:id/assign")
  @Permissions("crm.lead.update")
  async assignLead(
    @Req() req: AuthRequest,
    @Param("id") _ruleId: string,
    @Body("leadId") leadId: string,
    @Body("userId") userId: string,
  ) {
    return this.salesAutomation.assignLeadToUser(this.tid(req), leadId, userId);
  }

  @Post("sales-automation/assignment-rules/:id/round-robin")
  @Permissions("crm.settings.update")
  async roundRobinAssign(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @Query("objectType") objectType: string,
  ) {
    return this.salesAutomation.roundRobinAssign(this.tid(req), objectType, id);
  }

  // ── Sales Automation: Escalation Rules (6 endpoints) ──

  @Post("sales-automation/escalation-rules")
  @Permissions("crm.settings.create")
  @HttpCode(HttpStatus.CREATED)
  async createEscalationRule(@Req() req: AuthRequest, @Body() body: any) {
    const data = EscalationRuleSchema.parse(body);
    return this.salesAutomation.createEscalationRule(this.tid(req), data);
  }

  @Get("sales-automation/escalation-rules")
  @Permissions("crm.settings.read")
  async listEscalationRules(@Req() req: AuthRequest) {
    return {
      data: await this.salesAutomation.getEscalationRules(this.tid(req)),
    };
  }

  @Get("sales-automation/escalation-rules/stats")
  @Permissions("crm.settings.read")
  async getEscalationStats(@Req() req: AuthRequest) {
    return this.salesAutomation.getEscalationStats(this.tid(req));
  }

  @Get("sales-automation/escalation-rules/:id")
  @Permissions("crm.settings.read")
  async getEscalationRule(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.salesAutomation.getEscalationRule(this.tid(req), id);
  }

  @Patch("sales-automation/escalation-rules/:id")
  @Permissions("crm.settings.update")
  async updateEscalationRule(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.salesAutomation.updateEscalationRule(this.tid(req), id, body);
  }

  @Delete("sales-automation/escalation-rules/:id")
  @Permissions("crm.settings.delete")
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteEscalationRule(@Req() req: AuthRequest, @Param("id") id: string) {
    await this.salesAutomation.deleteEscalationRule(this.tid(req), id);
  }

  // ── Sales Automation: Scoring Models (6 endpoints) ──

  @Post("sales-automation/scoring-models")
  @Permissions("crm.lead-scoring.create")
  @HttpCode(HttpStatus.CREATED)
  async createScoringModel(@Req() req: AuthRequest, @Body() body: any) {
    const data = LeadScoringModelSchema.parse(body);
    return this.salesAutomation.createScoringModel(this.tid(req), data);
  }

  @Get("sales-automation/scoring-models")
  @Permissions("crm.lead-scoring.read")
  async listScoringModels(@Req() req: AuthRequest) {
    return { data: await this.salesAutomation.getScoringModels(this.tid(req)) };
  }

  @Get("sales-automation/scoring-models/:id")
  @Permissions("crm.lead-scoring.read")
  async getScoringModel(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.salesAutomation.getScoringModel(this.tid(req), id);
  }

  @Patch("sales-automation/scoring-models/:id")
  @Permissions("crm.lead-scoring.update")
  async updateScoringModel(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.salesAutomation.updateScoringModel(this.tid(req), id, body);
  }

  @Delete("sales-automation/scoring-models/:id")
  @Permissions("crm.lead-scoring.delete")
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteScoringModel(@Req() req: AuthRequest, @Param("id") id: string) {
    await this.salesAutomation.deleteScoringModel(this.tid(req), id);
  }

  @Post("sales-automation/scoring-models/:id/recalculate")
  @Permissions("crm.lead-scoring.recalculate")
  async recalculateScores(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.salesAutomation.recalculateScores(this.tid(req), id);
  }

  // ── Sales Automation: Sequences (8 endpoints) ──

  @Post("sales-automation/sequences")
  @Permissions("crm.settings.create")
  @HttpCode(HttpStatus.CREATED)
  async createSequence(@Req() req: AuthRequest, @Body() body: any) {
    const data = SalesSequenceSchema.parse(body);
    return this.salesAutomation.createSalesSequence(this.tid(req), data);
  }

  @Get("sales-automation/sequences")
  @Permissions("crm.settings.read")
  async listSequences(@Req() req: AuthRequest) {
    return {
      data: await this.salesAutomation.getSalesSequences(this.tid(req)),
    };
  }

  @Get("sales-automation/sequences/:id")
  @Permissions("crm.settings.read")
  async getSequence(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.salesAutomation.getSalesSequence(this.tid(req), id);
  }

  @Patch("sales-automation/sequences/:id")
  @Permissions("crm.settings.update")
  async updateSequence(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.salesAutomation.updateSalesSequence(this.tid(req), id, body);
  }

  @Delete("sales-automation/sequences/:id")
  @Permissions("crm.settings.delete")
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteSequence(@Req() req: AuthRequest, @Param("id") id: string) {
    await this.salesAutomation.deleteSalesSequence(this.tid(req), id);
  }

  @Post("sales-automation/sequences/:id/enroll")
  @Permissions("crm.lead.update")
  async enrollInSequence(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @Body("objectId") objectId: string,
    @Body("objectType") objectType: string,
  ) {
    return this.salesAutomation.enrollInSequence(
      this.tid(req),
      id,
      objectId,
      objectType,
    );
  }

  @Post("sales-automation/sequences/:id/unenroll")
  @Permissions("crm.lead.update")
  async unenrollFromSequence(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @Body("objectId") objectId: string,
  ) {
    return this.salesAutomation.unenrollFromSequence(
      this.tid(req),
      id,
      objectId,
    );
  }

  @Get("sales-automation/sequences/:id/analytics")
  @Permissions("crm.report.read")
  async getSequenceAnalytics(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.salesAutomation.getSequenceAnalytics(this.tid(req), id);
  }

  // ── Sales Automation: Dashboard (1 endpoint) ──

  @Get("sales-automation/dashboard")
  @Permissions("crm.read")
  async getAutomationDashboard(@Req() req: AuthRequest) {
    return this.salesAutomation.getAutomationDashboard(this.tid(req));
  }

  // ── Customer Success: Health Score (7 endpoints) ──

  @Post("customer-success/health-score-configs")
  @Permissions("crm.settings.create")
  @HttpCode(HttpStatus.CREATED)
  async createHealthScoreConfig(@Req() req: AuthRequest, @Body() body: any) {
    const data = HealthScoreConfigSchema.parse(body);
    return this.customerSuccess.createHealthScoreConfig(this.tid(req), data);
  }

  @Get("customer-success/health-score-configs")
  @Permissions("crm.settings.read")
  async listHealthScoreConfigs(@Req() req: AuthRequest) {
    return {
      data: await this.customerSuccess.getHealthScoreConfigs(this.tid(req)),
    };
  }

  @Get("customer-success/health-score-configs/:id")
  @Permissions("crm.settings.read")
  async getHealthScoreConfig(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.customerSuccess.getHealthScoreConfig(this.tid(req), id);
  }

  @Patch("customer-success/health-score-configs/:id")
  @Permissions("crm.settings.update")
  async updateHealthScoreConfig(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.customerSuccess.updateHealthScoreConfig(
      this.tid(req),
      id,
      body,
    );
  }

  @Delete("customer-success/health-score-configs/:id")
  @Permissions("crm.settings.delete")
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteHealthScoreConfig(
    @Req() req: AuthRequest,
    @Param("id") id: string,
  ) {
    await this.customerSuccess.deleteHealthScoreConfig(this.tid(req), id);
  }

  @Post("customer-success/health-score-configs/:id/compute/:customerId")
  @Permissions("crm.report.read")
  async computeHealth(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @Param("customerId") customerId: string,
  ) {
    return this.customerSuccess.computeCustomerHealth(
      this.tid(req),
      customerId,
      id,
    );
  }

  @Get("customer-success/health-score-configs/:id/history/:customerId")
  @Permissions("crm.report.read")
  async getHealthHistory(
    @Req() req: AuthRequest,
    @Param("customerId") customerId: string,
  ) {
    return {
      data: await this.customerSuccess.getCustomerHealthHistory(
        this.tid(req),
        customerId,
      ),
    };
  }

  // ── Customer Success: NPS Surveys (9 endpoints) ──

  @Post("customer-success/nps-surveys")
  @Permissions("crm.settings.create")
  @HttpCode(HttpStatus.CREATED)
  async createNpsSurvey(@Req() req: AuthRequest, @Body() body: any) {
    const data = NpsSurveySchema.parse(body);
    return this.customerSuccess.createNpsSurvey(this.tid(req), data);
  }

  @Get("customer-success/nps-surveys")
  @Permissions("crm.settings.read")
  async listNpsSurveys(@Req() req: AuthRequest) {
    return { data: await this.customerSuccess.getNpsSurveys(this.tid(req)) };
  }

  @Get("customer-success/nps-surveys/:id")
  @Permissions("crm.settings.read")
  async getNpsSurvey(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.customerSuccess.getNpsSurvey(this.tid(req), id);
  }

  @Patch("customer-success/nps-surveys/:id")
  @Permissions("crm.settings.update")
  async updateNpsSurvey(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.customerSuccess.updateNpsSurvey(this.tid(req), id, body);
  }

  @Delete("customer-success/nps-surveys/:id")
  @Permissions("crm.settings.delete")
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteNpsSurvey(@Req() req: AuthRequest, @Param("id") id: string) {
    await this.customerSuccess.deleteNpsSurvey(this.tid(req), id);
  }

  @Post("customer-success/nps-surveys/:id/send")
  @Permissions("crm.settings.update")
  async sendNpsSurvey(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @Body("customerIds") customerIds: string[],
  ) {
    return this.customerSuccess.sendNpsSurvey(this.tid(req), id, customerIds);
  }

  @Post("customer-success/nps-surveys/:id/launch")
  @Permissions("crm.settings.update")
  async launchNpsSurvey(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.customerSuccess.sendNpsSurvey(this.tid(req), id, []);
  }

  @Get("customer-success/nps-surveys/analytics")
  @Permissions("crm.report.read")
  async getNpsAnalytics(@Req() req: AuthRequest) {
    return this.customerSuccess.getNpsAnalytics(this.tid(req));
  }

  // ── Customer Success: Onboarding Checklists (7 endpoints) ──

  @Post("customer-success/onboarding-checklists")
  @Permissions("crm.settings.create")
  @HttpCode(HttpStatus.CREATED)
  async createOnboardingChecklist(@Req() req: AuthRequest, @Body() body: any) {
    const data = OnboardingChecklistSchema.parse(body);
    return this.customerSuccess.createOnboardingChecklist(this.tid(req), data);
  }

  @Get("customer-success/onboarding-checklists")
  @Permissions("crm.settings.read")
  async listOnboardingChecklists(@Req() req: AuthRequest) {
    return {
      data: await this.customerSuccess.getOnboardingChecklists(this.tid(req)),
    };
  }

  @Get("customer-success/onboarding-checklists/:id")
  @Permissions("crm.settings.read")
  async getOnboardingChecklist(
    @Req() req: AuthRequest,
    @Param("id") id: string,
  ) {
    return this.customerSuccess.getOnboardingChecklist(this.tid(req), id);
  }

  @Patch("customer-success/onboarding-checklists/:id")
  @Permissions("crm.settings.update")
  async updateOnboardingChecklist(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.customerSuccess.updateOnboardingChecklist(
      this.tid(req),
      id,
      body,
    );
  }

  @Delete("customer-success/onboarding-checklists/:id")
  @Permissions("crm.settings.delete")
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteOnboardingChecklist(
    @Req() req: AuthRequest,
    @Param("id") id: string,
  ) {
    await this.customerSuccess.deleteOnboardingChecklist(this.tid(req), id);
  }

  @Get("customer-success/onboarding-checklists/:id/progress/:customerId")
  @Permissions("crm.read")
  async getOnboardingProgress(
    @Req() req: AuthRequest,
    @Param("customerId") customerId: string,
  ) {
    return this.customerSuccess.getOnboardingProgress(
      this.tid(req),
      customerId,
    );
  }

  // ── Customer Success: Retention Campaigns (8 endpoints) ──

  @Post("customer-success/retention-campaigns")
  @Permissions("crm.settings.create")
  @HttpCode(HttpStatus.CREATED)
  async createRetentionCampaign(@Req() req: AuthRequest, @Body() body: any) {
    const data = RetentionCampaignSchema.parse(body);
    return this.customerSuccess.createRetentionCampaign(this.tid(req), data);
  }

  @Get("customer-success/retention-campaigns")
  @Permissions("crm.settings.read")
  async listRetentionCampaigns(@Req() req: AuthRequest) {
    return {
      data: await this.customerSuccess.getRetentionCampaigns(this.tid(req)),
    };
  }

  @Get("customer-success/retention-campaigns/:id")
  @Permissions("crm.settings.read")
  async getRetentionCampaign(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.customerSuccess.getRetentionCampaign(this.tid(req), id);
  }

  @Patch("customer-success/retention-campaigns/:id")
  @Permissions("crm.settings.update")
  async updateRetentionCampaign(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.customerSuccess.updateRetentionCampaign(
      this.tid(req),
      id,
      body,
    );
  }

  @Delete("customer-success/retention-campaigns/:id")
  @Permissions("crm.settings.delete")
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteRetentionCampaign(
    @Req() req: AuthRequest,
    @Param("id") id: string,
  ) {
    await this.customerSuccess.deleteRetentionCampaign(this.tid(req), id);
  }

  @Post("customer-success/retention-campaigns/:id/launch")
  @Permissions("crm.settings.update")
  async launchRetentionCampaign(
    @Req() req: AuthRequest,
    @Param("id") id: string,
  ) {
    return this.customerSuccess.launchRetentionCampaign(this.tid(req), id);
  }

  @Get("customer-success/dashboard")
  @Permissions("crm.report.read")
  async getCustomerSuccessDashboard(@Req() req: AuthRequest) {
    return this.customerSuccess.getCustomerSuccessDashboard(this.tid(req));
  }

  // ── Marketing Automation: Drip Campaigns (10 endpoints) ──

  @Post("marketing-automation/drip-campaigns")
  @Permissions("crm.settings.create")
  @HttpCode(HttpStatus.CREATED)
  async createDripCampaign(@Req() req: AuthRequest, @Body() body: any) {
    const data = DripCampaignSchema.parse(body);
    return this.marketingAutomation.createDripCampaign(this.tid(req), data);
  }

  @Get("marketing-automation/drip-campaigns")
  @Permissions("crm.settings.read")
  async listDripCampaigns(@Req() req: AuthRequest) {
    return {
      data: await this.marketingAutomation.getDripCampaigns(this.tid(req)),
    };
  }

  @Get("marketing-automation/drip-campaigns/:id")
  @Permissions("crm.settings.read")
  async getDripCampaign(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.marketingAutomation.getDripCampaign(this.tid(req), id);
  }

  @Patch("marketing-automation/drip-campaigns/:id")
  @Permissions("crm.settings.update")
  async updateDripCampaign(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.marketingAutomation.updateDripCampaign(this.tid(req), id, body);
  }

  @Delete("marketing-automation/drip-campaigns/:id")
  @Permissions("crm.settings.delete")
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteDripCampaign(@Req() req: AuthRequest, @Param("id") id: string) {
    await this.marketingAutomation.deleteDripCampaign(this.tid(req), id);
  }

  @Post("marketing-automation/drip-campaigns/:id/activate")
  @Permissions("crm.settings.update")
  async activateDripCampaign(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.marketingAutomation.activateDripCampaign(this.tid(req), id);
  }

  @Post("marketing-automation/drip-campaigns/:id/pause")
  @Permissions("crm.settings.update")
  async pauseDripCampaign(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.marketingAutomation.pauseDripCampaign(this.tid(req), id);
  }

  @Get("marketing-automation/drip-campaigns/:id/analytics")
  @Permissions("crm.report.read")
  async getDripEmailAnalytics(
    @Req() req: AuthRequest,
    @Param("id") id: string,
  ) {
    return this.marketingAutomation.getDripEmailAnalytics(this.tid(req), id);
  }

  @Get("marketing-automation/drip-campaigns/:id/stats")
  @Permissions("crm.report.read")
  async getDripCampaignStats(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.marketingAutomation.getDripCampaignStats(this.tid(req), id);
  }

  // ── Marketing Automation: Landing Pages (7 endpoints) ──

  @Post("marketing-automation/landing-pages")
  @Permissions("crm.settings.create")
  @HttpCode(HttpStatus.CREATED)
  async createLandingPage(@Req() req: AuthRequest, @Body() body: any) {
    const data = LandingPageSchema.parse(body);
    return this.marketingAutomation.createLandingPage(this.tid(req), data);
  }

  @Get("marketing-automation/landing-pages")
  @Permissions("crm.settings.read")
  async listLandingPages(@Req() req: AuthRequest) {
    return {
      data: await this.marketingAutomation.getLandingPages(this.tid(req)),
    };
  }

  @Get("marketing-automation/landing-pages/:id")
  @Permissions("crm.settings.read")
  async getLandingPage(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.marketingAutomation.getLandingPage(this.tid(req), id);
  }

  @Patch("marketing-automation/landing-pages/:id")
  @Permissions("crm.settings.update")
  async updateLandingPage(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.marketingAutomation.updateLandingPage(this.tid(req), id, body);
  }

  @Delete("marketing-automation/landing-pages/:id")
  @Permissions("crm.settings.delete")
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteLandingPage(@Req() req: AuthRequest, @Param("id") id: string) {
    await this.marketingAutomation.deleteLandingPage(this.tid(req), id);
  }

  @Post("marketing-automation/landing-pages/:id/publish")
  @Permissions("crm.settings.update")
  async publishLandingPage(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.marketingAutomation.publishLandingPage(this.tid(req), id);
  }

  @Get("marketing-automation/landing-pages/:id/stats")
  @Permissions("crm.report.read")
  async getLandingPageStats(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.marketingAutomation.getLandingPageStats(this.tid(req), id);
  }

  // ── Marketing Automation: A/B Testing (7 endpoints) ──

  @Post("marketing-automation/ab-tests")
  @Permissions("crm.settings.create")
  @HttpCode(HttpStatus.CREATED)
  async createABTest(@Req() req: AuthRequest, @Body() body: any) {
    const data = ABTestSchema.parse(body);
    return this.marketingAutomation.createABTest(this.tid(req), data);
  }

  @Get("marketing-automation/ab-tests")
  @Permissions("crm.settings.read")
  async listABTests(@Req() req: AuthRequest) {
    return { data: await this.marketingAutomation.getABTests(this.tid(req)) };
  }

  @Get("marketing-automation/ab-tests/:id")
  @Permissions("crm.settings.read")
  async getABTest(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.marketingAutomation.getABTest(this.tid(req), id);
  }

  @Patch("marketing-automation/ab-tests/:id")
  @Permissions("crm.settings.update")
  async updateABTest(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.marketingAutomation.updateABTest(this.tid(req), id, body);
  }

  @Delete("marketing-automation/ab-tests/:id")
  @Permissions("crm.settings.delete")
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteABTest(@Req() req: AuthRequest, @Param("id") id: string) {
    await this.marketingAutomation.deleteABTest(this.tid(req), id);
  }

  @Get("marketing-automation/ab-tests/:id/results")
  @Permissions("crm.report.read")
  async getABTestResults(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.marketingAutomation.getABTestResults(this.tid(req), id);
  }

  // ── Marketing Automation: Dashboard & Analytics (3 endpoints) ──

  @Get("marketing-automation/email-analytics")
  @Permissions("crm.report.read")
  async getEmailAnalytics(@Req() req: AuthRequest) {
    return this.marketingAutomation.getEmailAnalyticsDashboard(this.tid(req));
  }

  @Get("marketing-automation/dashboard")
  @Permissions("crm.read")
  async getMarketingDashboard(@Req() req: AuthRequest) {
    return this.marketingAutomation.getMarketingDashboard(this.tid(req));
  }

  // ── CRM Dashboard (1 endpoint) ──

  @Get("dashboard")
  @Permissions("crm.read")
  async getCrmDashboard(@Req() req: AuthRequest) {
    return this.salesAutomation.getCrmDashboard(this.tid(req));
  }
}
