import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseInterceptors,
  Req,
} from "@nestjs/common";
import { CrmExpansionV1Service } from "./crm-expansion-v1.service";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { TrackChanges } from "../../common/decorators/track-changes.decorator";
import { ChangeHistoryInterceptor } from "../../common/interceptors/change-history.interceptor";
import { Request } from "express";

@Controller("crm/expansion-v1")
@UseInterceptors(ChangeHistoryInterceptor)
export class CrmExpansionV1Controller {
  constructor(private readonly service: CrmExpansionV1Service) {}

  private getTenantId(req: Request): string {
    return (
      (req as any).user?.tenantId ||
      (req.headers["x-tenant-id"] as string) ||
      "default-tenant"
    );
  }

  // ═══ 1. SALES PLAYBOOKS & BATTLECARDS ═══

  @Get("playbooks")
  @Permissions("crm.playbooks.read")
  async getPlaybooks(@Req() req: Request) {
    return this.service.getPlaybooks(this.getTenantId(req));
  }

  @Post("playbooks")
  @Permissions("crm.playbooks.create")
  @TrackChanges("CrmSalesPlaybook")
  async createPlaybook(@Req() req: Request, @Body() dto: any) {
    return this.service.createPlaybook(this.getTenantId(req), dto);
  }

  @Get("deal-guidance/:dealId")
  @Permissions("crm.deals.read")
  async getDealGuidance(@Req() req: Request, @Param("dealId") dealId: string) {
    return this.service.getDealGuidance(this.getTenantId(req), dealId);
  }

  @Get("competitor-battlecards")
  @Permissions("crm.battlecards.read")
  async getCompetitorBattlecards(@Req() req: Request) {
    return this.service.getCompetitorBattlecards(this.getTenantId(req));
  }

  @Post("competitor-battlecards")
  @Permissions("crm.battlecards.create")
  @TrackChanges("CrmCompetitorBattlecard")
  async createCompetitorBattlecard(@Req() req: Request, @Body() dto: any) {
    return this.service.createCompetitorBattlecard(this.getTenantId(req), dto);
  }

  // ═══ 2. OMNICHANNEL CAMPAIGNS & MARKETING ═══

  @Get("omnichannel-campaigns")
  @Permissions("crm.campaigns.read")
  async getOmnichannelCampaigns(@Req() req: Request) {
    return this.service.getOmnichannelCampaigns(this.getTenantId(req));
  }

  @Post("omnichannel-campaigns")
  @Permissions("crm.campaigns.create")
  @TrackChanges("CrmOmnichannelCampaign")
  async createOmnichannelCampaign(@Req() req: Request, @Body() dto: any) {
    return this.service.createOmnichannelCampaign(this.getTenantId(req), dto);
  }

  @Get("attribution-summary")
  @Permissions("crm.analytics.read")
  async getAttributionSummary(
    @Req() req: Request,
    @Query("dealId") dealId?: string,
  ) {
    return this.service.getAttributionSummary(this.getTenantId(req), dealId);
  }

  @Get("marketing-assets")
  @Permissions("crm.marketing.read")
  async getMarketingAssets(@Req() req: Request) {
    return this.service.getMarketingAssets(this.getTenantId(req));
  }

  @Post("marketing-assets")
  @Permissions("crm.marketing.create")
  @TrackChanges("CrmMarketingAsset")
  async createMarketingAsset(@Req() req: Request, @Body() dto: any) {
    return this.service.createMarketingAsset(this.getTenantId(req), dto);
  }

  @Get("event-webinars")
  @Permissions("crm.marketing.read")
  async getEventWebinars(@Req() req: Request) {
    return this.service.getEventWebinars(this.getTenantId(req));
  }

  @Post("event-webinars")
  @Permissions("crm.marketing.create")
  @TrackChanges("CrmEventWebinar")
  async createEventWebinar(@Req() req: Request, @Body() dto: any) {
    return this.service.createEventWebinar(this.getTenantId(req), dto);
  }

  // ═══ 3. ACCOUNT-BASED MARKETING (ABM) ═══

  @Get("abm-account-groups")
  @Permissions("crm.abm.read")
  async getAbmAccountGroups(@Req() req: Request) {
    return this.service.getAbmAccountGroups(this.getTenantId(req));
  }

  @Post("abm-account-groups")
  @Permissions("crm.abm.create")
  @TrackChanges("CrmAbmAccountGroup")
  async createAbmAccountGroup(@Req() req: Request, @Body() dto: any) {
    return this.service.createAbmAccountGroup(this.getTenantId(req), dto);
  }

  @Get("intent-signals")
  @Permissions("crm.abm.read")
  async getIntentSignals(
    @Req() req: Request,
    @Query("customerId") customerId?: string,
  ) {
    return this.service.getIntentSignals(this.getTenantId(req), customerId);
  }

  @Post("intent-signals")
  @Permissions("crm.abm.create")
  async logIntentSignal(@Req() req: Request, @Body() dto: any) {
    return this.service.logIntentSignal(this.getTenantId(req), dto);
  }

  @Get("buying-committee/:customerId")
  @Permissions("crm.customers.read")
  async getBuyingCommitteeMembers(
    @Req() req: Request,
    @Param("customerId") customerId: string,
  ) {
    return this.service.getBuyingCommitteeMembers(
      this.getTenantId(req),
      customerId,
    );
  }

  @Post("buying-committee")
  @Permissions("crm.customers.update")
  @TrackChanges("CrmBuyingCommitteeMember")
  async addBuyingCommitteeMember(@Req() req: Request, @Body() dto: any) {
    return this.service.addBuyingCommitteeMember(this.getTenantId(req), dto);
  }

  // ═══ 4. CUSTOMER SUCCESS & HEALTH SCORES ═══

  @Get("account-health/:customerId")
  @Permissions("crm.customers.read")
  async getAccountHealthRecord(
    @Req() req: Request,
    @Param("customerId") customerId: string,
  ) {
    return this.service.getAccountHealthRecord(
      this.getTenantId(req),
      customerId,
    );
  }

  @Get("renewal-pipelines")
  @Permissions("crm.contracts.read")
  async getRenewalPipelines(@Req() req: Request) {
    return this.service.getRenewalPipelines(this.getTenantId(req));
  }

  @Post("renewal-pipelines")
  @Permissions("crm.contracts.create")
  @TrackChanges("CrmRenewalPipeline")
  async createRenewalPipeline(@Req() req: Request, @Body() dto: any) {
    return this.service.createRenewalPipeline(this.getTenantId(req), dto);
  }

  @Get("feedback-surveys")
  @Permissions("crm.surveys.read")
  async getFeedbackSurveys(@Req() req: Request) {
    return this.service.getFeedbackSurveys(this.getTenantId(req));
  }

  @Post("feedback-surveys")
  @Permissions("crm.surveys.create")
  @TrackChanges("CrmCustomerFeedbackSurvey")
  async createFeedbackSurvey(@Req() req: Request, @Body() dto: any) {
    return this.service.createFeedbackSurvey(this.getTenantId(req), dto);
  }

  // ═══ 5. FIELD SALES & ROUTE PLANNING ═══

  @Get("field-visits")
  @Permissions("crm.field.read")
  async getFieldVisitSchedules(
    @Req() req: Request,
    @Query("repId") repId?: string,
  ) {
    return this.service.getFieldVisitSchedules(this.getTenantId(req), repId);
  }

  @Post("field-visits")
  @Permissions("crm.field.create")
  @TrackChanges("CrmFieldVisitSchedule")
  async createFieldVisitSchedule(@Req() req: Request, @Body() dto: any) {
    return this.service.createFieldVisitSchedule(this.getTenantId(req), dto);
  }

  @Get("sales-route-plans")
  @Permissions("crm.field.read")
  async getSalesRoutePlans(
    @Req() req: Request,
    @Query("repId") repId?: string,
  ) {
    return this.service.getSalesRoutePlans(this.getTenantId(req), repId);
  }

  @Post("sales-route-plans")
  @Permissions("crm.field.create")
  @TrackChanges("CrmSalesRoutePlan")
  async createSalesRoutePlan(@Req() req: Request, @Body() dto: any) {
    return this.service.createSalesRoutePlan(this.getTenantId(req), dto);
  }

  // ═══ 6. PRM & CHANNEL PARTNERS ═══

  @Get("partner-tier-benefits")
  @Permissions("crm.partner.read")
  async getPartnerTierBenefits(@Req() req: Request) {
    return this.service.getPartnerTierBenefits(this.getTenantId(req));
  }

  @Post("partner-tier-benefits")
  @Permissions("crm.partner.create")
  @TrackChanges("CrmPartnerTierBenefit")
  async createPartnerTierBenefit(@Req() req: Request, @Body() dto: any) {
    return this.service.createPartnerTierBenefit(this.getTenantId(req), dto);
  }

  @Get("partner-certifications")
  @Permissions("crm.partner.read")
  async getPartnerCertifications(
    @Req() req: Request,
    @Query("partnerId") partnerId?: string,
  ) {
    return this.service.getPartnerCertifications(
      this.getTenantId(req),
      partnerId,
    );
  }

  @Post("partner-certifications")
  @Permissions("crm.partner.create")
  @TrackChanges("CrmPartnerCertification")
  async addPartnerCertification(@Req() req: Request, @Body() dto: any) {
    return this.service.addPartnerCertification(this.getTenantId(req), dto);
  }
}
