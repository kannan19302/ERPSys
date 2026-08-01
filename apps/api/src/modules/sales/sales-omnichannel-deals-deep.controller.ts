import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { SalesOmnichannelDealsDeepService } from "./sales-omnichannel-deals-deep.service";

@ApiTags("Sales Omnichannel & Complex Deals")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller("sales/omnichannel-deals")
export class SalesOmnichannelDealsDeepController {
  constructor(
    private readonly omnichannelService: SalesOmnichannelDealsDeepService,
  ) {}

  // 1. Omnichannel Channels
  @Post("channels")
  @ApiOperation({ summary: "Register sales channel" })
  @Permissions("sales.channel.admin")
  async registerSalesChannel(@CurrentUser() user: any, @Body() channel: any) {
    return this.omnichannelService.registerSalesChannel(user.tenantId, channel);
  }

  @Get("channels")
  @ApiOperation({ summary: "List sales channels" })
  @Permissions("sales.channel.read")
  async getSalesChannels(@CurrentUser() user: any) {
    return this.omnichannelService.getSalesChannels(user.tenantId);
  }

  @Get("channels/:id")
  @ApiOperation({ summary: "Get sales channel by ID" })
  @Permissions("sales.channel.read")
  async getSalesChannelById(@CurrentUser() user: any, @Param("id") id: string) {
    return this.omnichannelService.getSalesChannelById(user.tenantId, id);
  }

  @Patch("channels/:id")
  @ApiOperation({ summary: "Update sales channel" })
  @Permissions("sales.channel.admin")
  async updateSalesChannel(
    @CurrentUser() user: any,
    @Param("id") id: string,
    @Body() channel: any,
  ) {
    return this.omnichannelService.updateSalesChannel(
      user.tenantId,
      id,
      channel,
    );
  }

  @Delete("channels/:id")
  @ApiOperation({ summary: "Delete sales channel" })
  @Permissions("sales.channel.admin")
  async deleteSalesChannel(@CurrentUser() user: any, @Param("id") id: string) {
    return this.omnichannelService.deleteSalesChannel(user.tenantId, id);
  }

  @Post("deals/:dealId/route-partner")
  @ApiOperation({ summary: "Route deal to partner channel" })
  @Permissions("sales.channel.update")
  async routeDealToPartnerChannel(
    @CurrentUser() user: any,
    @Param("dealId") dealId: string,
    @Body() body: any,
  ) {
    return this.omnichannelService.routeDealToPartnerChannel(
      user.tenantId,
      dealId,
      body?.partnerId,
    );
  }

  @Post("deals/:dealId/accept-partner")
  @ApiOperation({ summary: "Accept routed deal" })
  @Permissions("sales.channel.update")
  async acceptRoutedDeal(
    @CurrentUser() user: any,
    @Param("dealId") dealId: string,
    @Body() body: any,
  ) {
    return this.omnichannelService.acceptRoutedDeal(
      user.tenantId,
      dealId,
      body?.partnerId,
    );
  }

  @Post("deals/:dealId/reject-partner")
  @ApiOperation({ summary: "Reject routed deal" })
  @Permissions("sales.channel.update")
  async rejectRoutedDeal(
    @CurrentUser() user: any,
    @Param("dealId") dealId: string,
    @Body() body: any,
  ) {
    return this.omnichannelService.rejectRoutedDeal(
      user.tenantId,
      dealId,
      body?.partnerId,
      body?.reason,
    );
  }

  @Get("deals/:dealId/channel-splits")
  @ApiOperation({ summary: "Get channel split commissions" })
  @Permissions("sales.channel.read")
  async getChannelSplitCommissions(
    @CurrentUser() user: any,
    @Param("dealId") dealId: string,
  ) {
    return this.omnichannelService.getChannelSplitCommissions(
      user.tenantId,
      dealId,
    );
  }

  @Post("deals/:dealId/channel-splits")
  @ApiOperation({ summary: "Set channel split commissions" })
  @Permissions("sales.channel.admin")
  async setChannelSplitCommissions(
    @CurrentUser() user: any,
    @Param("dealId") dealId: string,
    @Body() body: any,
  ) {
    return this.omnichannelService.setChannelSplitCommissions(
      user.tenantId,
      dealId,
      body?.splits || [],
    );
  }

  @Get("channels/attribution-model")
  @ApiOperation({ summary: "Get channel attribution model" })
  @Permissions("sales.channel.read")
  async getChannelAttributionModel(@CurrentUser() user: any) {
    return this.omnichannelService.getChannelAttributionModel(user.tenantId);
  }

  @Get("channels/:id/roi")
  @ApiOperation({ summary: "Calculate channel ROI" })
  @Permissions("sales.channel.read")
  async calculateChannelRoi(@CurrentUser() user: any, @Param("id") id: string) {
    return this.omnichannelService.calculateChannelRoi(user.tenantId, id);
  }

  @Get("channels/dashboard")
  @ApiOperation({ summary: "Get channel performance dashboard" })
  @Permissions("sales.channel.read")
  async getChannelPerformanceDashboard(@CurrentUser() user: any) {
    return this.omnichannelService.getChannelPerformanceDashboard(
      user.tenantId,
    );
  }

  @Post("channels/disincentives")
  @ApiOperation({ summary: "Set channel disincentive rules" })
  @Permissions("sales.channel.admin")
  async setChannelDisincentiveRules(
    @CurrentUser() user: any,
    @Body() rules: any,
  ) {
    return this.omnichannelService.setChannelDisincentiveRules(
      user.tenantId,
      rules,
    );
  }

  @Get("channels/conflicts/alerts")
  @ApiOperation({ summary: "Get channel conflict alerts" })
  @Permissions("sales.channel.read")
  async getChannelConflictAlerts(@CurrentUser() user: any) {
    return this.omnichannelService.getChannelConflictAlerts(user.tenantId);
  }

  @Post("channels/conflicts/:conflictId/resolve")
  @ApiOperation({ summary: "Resolve channel conflict" })
  @Permissions("sales.channel.admin")
  async resolveChannelConflict(
    @CurrentUser() user: any,
    @Param("conflictId") conflictId: string,
    @Body() resolution: any,
  ) {
    return this.omnichannelService.resolveChannelConflict(
      user.tenantId,
      conflictId,
      resolution,
    );
  }

  @Get("channels/export-report")
  @ApiOperation({ summary: "Export channel performance report" })
  @Permissions("sales.channel.read")
  async exportChannelPerformanceReport(@CurrentUser() user: any) {
    return this.omnichannelService.exportChannelPerformanceReport(
      user.tenantId,
    );
  }

  @Get("partner-tiers/margin-rules")
  @ApiOperation({ summary: "Get partner tier margin rules" })
  @Permissions("sales.channel.read")
  async getPartnerTierMarginRules(@CurrentUser() user: any) {
    return this.omnichannelService.getPartnerTierMarginRules(user.tenantId);
  }

  @Post("partner-tiers/margin-rules")
  @ApiOperation({ summary: "Update partner tier margin rules" })
  @Permissions("sales.channel.admin")
  async updatePartnerTierMarginRules(
    @CurrentUser() user: any,
    @Body() rules: any,
  ) {
    return this.omnichannelService.updatePartnerTierMarginRules(
      user.tenantId,
      rules,
    );
  }

  @Get("omnichannel/fulfillment/:orderId")
  @ApiOperation({ summary: "Get omnichannel fulfillment status" })
  @Permissions("sales.omnichannel.read")
  async getOmnichannelFulfillmentStatus(
    @CurrentUser() user: any,
    @Param("orderId") orderId: string,
  ) {
    return this.omnichannelService.getOmnichannelFulfillmentStatus(
      user.tenantId,
      orderId,
    );
  }

  @Post("channels/:id/quotas")
  @ApiOperation({ summary: "Set channel quota allocations" })
  @Permissions("sales.channel.admin")
  async setChannelQuotaAllocations(
    @CurrentUser() user: any,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.omnichannelService.setChannelQuotaAllocations(
      user.tenantId,
      id,
      body?.quota,
    );
  }

  @Get("channels/quotas/all")
  @ApiOperation({ summary: "Get channel quota allocations" })
  @Permissions("sales.channel.read")
  async getChannelQuotaAllocations(@CurrentUser() user: any) {
    return this.omnichannelService.getChannelQuotaAllocations(user.tenantId);
  }

  @Post("marketplaces/sync-listings")
  @ApiOperation({ summary: "Sync marketplace listings" })
  @Permissions("sales.channel.admin")
  async syncMarketplaceListings(@CurrentUser() user: any, @Body() body: any) {
    return this.omnichannelService.syncMarketplaceListings(
      user.tenantId,
      body?.marketplaceName,
    );
  }

  @Get("marketplaces/cosell-pipeline")
  @ApiOperation({ summary: "Get marketplace co-sell pipeline" })
  @Permissions("sales.channel.read")
  async getMarketplaceCoSellPipeline(@CurrentUser() user: any) {
    return this.omnichannelService.getMarketplaceCoSellPipeline(user.tenantId);
  }

  @Post("marketplaces/webhooks")
  @ApiOperation({ summary: "Set marketplace webhooks" })
  @Permissions("sales.channel.admin")
  async setMarketplaceWebhooks(@CurrentUser() user: any, @Body() body: any) {
    return this.omnichannelService.setMarketplaceWebhooks(
      user.tenantId,
      body?.marketplaceName,
      body?.webhookUrl,
    );
  }

  // 2. Complex Deals
  @Post("complex-structures")
  @ApiOperation({ summary: "Create complex deal structure" })
  @Permissions("sales.deal.create")
  async createComplexDealStructure(
    @CurrentUser() user: any,
    @Body() dealData: any,
  ) {
    return this.omnichannelService.createComplexDealStructure(
      user.tenantId,
      dealData,
    );
  }

  @Get("complex-structures")
  @ApiOperation({ summary: "List complex deal structures" })
  @Permissions("sales.deal.read")
  async getComplexDealStructures(@CurrentUser() user: any) {
    return this.omnichannelService.getComplexDealStructures(user.tenantId);
  }

  @Get("complex-structures/:id")
  @ApiOperation({ summary: "Get complex deal structure by ID" })
  @Permissions("sales.deal.read")
  async getComplexDealStructureById(
    @CurrentUser() user: any,
    @Param("id") id: string,
  ) {
    return this.omnichannelService.getComplexDealStructureById(
      user.tenantId,
      id,
    );
  }

  @Patch("complex-structures/:id")
  @ApiOperation({ summary: "Update complex deal structure" })
  @Permissions("sales.deal.update")
  async updateComplexDealStructure(
    @CurrentUser() user: any,
    @Param("id") id: string,
    @Body() dealData: any,
  ) {
    return this.omnichannelService.updateComplexDealStructure(
      user.tenantId,
      id,
      dealData,
    );
  }

  @Delete("complex-structures/:id")
  @ApiOperation({ summary: "Delete complex deal structure" })
  @Permissions("sales.deal.delete")
  async deleteComplexDealStructure(
    @CurrentUser() user: any,
    @Param("id") id: string,
  ) {
    return this.omnichannelService.deleteComplexDealStructure(
      user.tenantId,
      id,
    );
  }

  @Post("deals/:dealId/sla-commitments")
  @ApiOperation({ summary: "Add SLA commitment to deal" })
  @Permissions("sales.deal.update")
  async addSlaCommitmentToDeal(
    @CurrentUser() user: any,
    @Param("dealId") dealId: string,
    @Body() sla: any,
  ) {
    return this.omnichannelService.addSlaCommitmentToDeal(
      user.tenantId,
      dealId,
      sla,
    );
  }

  @Get("deals/:dealId/sla-commitments")
  @ApiOperation({ summary: "Get SLA commitments for deal" })
  @Permissions("sales.deal.read")
  async getSlaCommitmentsForDeal(
    @CurrentUser() user: any,
    @Param("dealId") dealId: string,
  ) {
    return this.omnichannelService.getSlaCommitmentsForDeal(
      user.tenantId,
      dealId,
    );
  }

  @Patch("deals/sla-commitments/:id")
  @ApiOperation({ summary: "Update SLA commitment" })
  @Permissions("sales.deal.update")
  async updateSlaCommitment(
    @CurrentUser() user: any,
    @Param("id") id: string,
    @Body() sla: any,
  ) {
    return this.omnichannelService.updateSlaCommitment(user.tenantId, id, sla);
  }

  @Delete("deals/sla-commitments/:id")
  @ApiOperation({ summary: "Remove SLA commitment" })
  @Permissions("sales.deal.delete")
  async removeSlaCommitment(@CurrentUser() user: any, @Param("id") id: string) {
    return this.omnichannelService.removeSlaCommitment(user.tenantId, id);
  }

  @Get("deals/:dealId/risk-factors")
  @ApiOperation({ summary: "Evaluate deal risk factors" })
  @Permissions("sales.deal.read")
  async evaluateDealRiskFactors(
    @CurrentUser() user: any,
    @Param("dealId") dealId: string,
  ) {
    return this.omnichannelService.evaluateDealRiskFactors(
      user.tenantId,
      dealId,
    );
  }

  @Get("deals/:dealId/penalties-terms")
  @ApiOperation({ summary: "Get deal penalties terms" })
  @Permissions("sales.deal.read")
  async getDealPenaltiesTerms(
    @CurrentUser() user: any,
    @Param("dealId") dealId: string,
  ) {
    return this.omnichannelService.getDealPenaltiesTerms(user.tenantId, dealId);
  }

  @Post("deals/:dealId/penalties-terms")
  @ApiOperation({ summary: "Set deal penalties terms" })
  @Permissions("sales.deal.update")
  async setDealPenaltiesTerms(
    @CurrentUser() user: any,
    @Param("dealId") dealId: string,
    @Body() body: any,
  ) {
    return this.omnichannelService.setDealPenaltiesTerms(
      user.tenantId,
      dealId,
      body?.penalties || [],
    );
  }

  @Get("deals/:dealId/executive-briefing")
  @ApiOperation({ summary: "Get executive briefing book" })
  @Permissions("sales.deal.read")
  async getExecutiveBriefingBook(
    @CurrentUser() user: any,
    @Param("dealId") dealId: string,
  ) {
    return this.omnichannelService.getExecutiveBriefingBook(
      user.tenantId,
      dealId,
    );
  }

  @Post("deals/:dealId/executive-meetings")
  @ApiOperation({ summary: "Schedule executive sponsor meeting" })
  @Permissions("sales.deal.update")
  async scheduleExecutiveSponsorMeeting(
    @CurrentUser() user: any,
    @Param("dealId") dealId: string,
    @Body() meetingData: any,
  ) {
    return this.omnichannelService.scheduleExecutiveSponsorMeeting(
      user.tenantId,
      dealId,
      meetingData,
    );
  }

  @Get("deals/:dealId/executive-meetings")
  @ApiOperation({ summary: "Get executive sponsor meetings" })
  @Permissions("sales.deal.read")
  async getExecutiveSponsorMeetings(
    @CurrentUser() user: any,
    @Param("dealId") dealId: string,
  ) {
    return this.omnichannelService.getExecutiveSponsorMeetings(
      user.tenantId,
      dealId,
    );
  }

  @Patch("deals/executive-meetings/:id")
  @ApiOperation({ summary: "Update executive sponsor meeting" })
  @Permissions("sales.deal.update")
  async updateExecutiveSponsorMeeting(
    @CurrentUser() user: any,
    @Param("id") id: string,
    @Body() meetingData: any,
  ) {
    return this.omnichannelService.updateExecutiveSponsorMeeting(
      user.tenantId,
      id,
      meetingData,
    );
  }

  @Delete("deals/executive-meetings/:id")
  @ApiOperation({ summary: "Cancel executive sponsor meeting" })
  @Permissions("sales.deal.delete")
  async cancelExecutiveSponsorMeeting(
    @CurrentUser() user: any,
    @Param("id") id: string,
  ) {
    return this.omnichannelService.cancelExecutiveSponsorMeeting(
      user.tenantId,
      id,
    );
  }

  @Post("deals/:dealId/dealroom/activity")
  @ApiOperation({ summary: "Record deal room activity" })
  @Permissions("sales.deal.update")
  async recordDealRoomActivity(
    @CurrentUser() user: any,
    @Param("dealId") dealId: string,
    @Body() activity: any,
  ) {
    return this.omnichannelService.recordDealRoomActivity(
      user.tenantId,
      dealId,
      activity,
    );
  }

  @Get("deals/:dealId/dealroom/activity")
  @ApiOperation({ summary: "Get deal room activity feed" })
  @Permissions("sales.deal.read")
  async getDealRoomActivityFeed(
    @CurrentUser() user: any,
    @Param("dealId") dealId: string,
  ) {
    return this.omnichannelService.getDealRoomActivityFeed(
      user.tenantId,
      dealId,
    );
  }

  @Post("deals/:dealId/dealroom/access")
  @ApiOperation({ summary: "Set virtual deal room access" })
  @Permissions("sales.deal.admin")
  async setVirtualDealRoomAccess(
    @CurrentUser() user: any,
    @Param("dealId") dealId: string,
    @Body() body: any,
  ) {
    return this.omnichannelService.setVirtualDealRoomAccess(
      user.tenantId,
      dealId,
      body?.userPermissions || [],
    );
  }

  @Get("deals/:dealId/dealroom/access")
  @ApiOperation({ summary: "Get virtual deal room access" })
  @Permissions("sales.deal.read")
  async getVirtualDealRoomAccess(
    @CurrentUser() user: any,
    @Param("dealId") dealId: string,
  ) {
    return this.omnichannelService.getVirtualDealRoomAccess(
      user.tenantId,
      dealId,
    );
  }

  @Delete("deals/:dealId/dealroom/access/:userId")
  @ApiOperation({ summary: "Revoke virtual deal room access" })
  @Permissions("sales.deal.admin")
  async revokeVirtualDealRoomAccess(
    @CurrentUser() user: any,
    @Param("dealId") dealId: string,
    @Param("userId") userId: string,
  ) {
    return this.omnichannelService.revokeVirtualDealRoomAccess(
      user.tenantId,
      dealId,
      userId,
    );
  }

  @Get("deals/:dealId/milestone-checklist")
  @ApiOperation({ summary: "Get deal milestone checklist" })
  @Permissions("sales.deal.read")
  async getDealMilestoneChecklist(
    @CurrentUser() user: any,
    @Param("dealId") dealId: string,
  ) {
    return this.omnichannelService.getDealMilestoneChecklist(
      user.tenantId,
      dealId,
    );
  }

  @Patch("deals/:dealId/milestone-checklist/:milestoneId")
  @ApiOperation({ summary: "Update deal milestone checklist" })
  @Permissions("sales.deal.update")
  async updateDealMilestoneChecklist(
    @CurrentUser() user: any,
    @Param("dealId") dealId: string,
    @Param("milestoneId") milestoneId: string,
    @Body() body: any,
  ) {
    return this.omnichannelService.updateDealMilestoneChecklist(
      user.tenantId,
      dealId,
      milestoneId,
      body?.status,
    );
  }

  @Post("deals/:dealId/archive")
  @ApiOperation({ summary: "Archive complex deal" })
  @Permissions("sales.deal.delete")
  async archiveComplexDeal(
    @CurrentUser() user: any,
    @Param("dealId") dealId: string,
  ) {
    return this.omnichannelService.archiveComplexDeal(user.tenantId, dealId);
  }
}
