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
import { SalesEnterpriseExecutionDeepService } from "./sales-enterprise-execution-deep.service";

@ApiTags("Sales Enterprise Execution")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller("sales/enterprise-execution")
export class SalesEnterpriseExecutionDeepController {
  constructor(
    private readonly executionService: SalesEnterpriseExecutionDeepService,
  ) {}

  // 1. Deal Desk & Approvals
  @Post("deal-desk/requests")
  @ApiOperation({ summary: "Create deal desk request" })
  @Permissions("sales.deal-desk.create")
  async createDealDeskRequest(@CurrentUser() user: any, @Body() data: any) {
    return this.executionService.createDealDeskRequest(user.tenantId, data);
  }

  @Get("deal-desk/requests")
  @ApiOperation({ summary: "List deal desk requests" })
  @Permissions("sales.deal-desk.read")
  async getDealDeskRequests(@CurrentUser() user: any, @Query() query: any) {
    return this.executionService.getDealDeskRequests(user.tenantId, query);
  }

  @Get("deal-desk/requests/:id")
  @ApiOperation({ summary: "Get deal desk request by ID" })
  @Permissions("sales.deal-desk.read")
  async getDealDeskRequestById(
    @CurrentUser() user: any,
    @Param("id") id: string,
  ) {
    return this.executionService.getDealDeskRequestById(user.tenantId, id);
  }

  @Patch("deal-desk/requests/:id")
  @ApiOperation({ summary: "Update deal desk request" })
  @Permissions("sales.deal-desk.update")
  async updateDealDeskRequest(
    @CurrentUser() user: any,
    @Param("id") id: string,
    @Body() data: any,
  ) {
    return this.executionService.updateDealDeskRequest(user.tenantId, id, data);
  }

  @Post("deal-desk/requests/:id/approve")
  @ApiOperation({ summary: "Approve deal desk request" })
  @Permissions("sales.deal-desk.approve")
  async approveDealDeskRequest(
    @CurrentUser() user: any,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.executionService.approveDealDeskRequest(
      user.tenantId,
      id,
      user.userId,
      body?.comments,
    );
  }

  @Post("deal-desk/requests/:id/reject")
  @ApiOperation({ summary: "Reject deal desk request" })
  @Permissions("sales.deal-desk.approve")
  async rejectDealDeskRequest(
    @CurrentUser() user: any,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.executionService.rejectDealDeskRequest(
      user.tenantId,
      id,
      user.userId,
      body?.reason,
    );
  }

  @Post("deal-desk/requests/:id/exception")
  @ApiOperation({ summary: "Submit deal desk exception" })
  @Permissions("sales.deal-desk.update")
  async submitDealDeskException(
    @CurrentUser() user: any,
    @Param("id") id: string,
    @Body() data: any,
  ) {
    return this.executionService.submitDealDeskException(
      user.tenantId,
      id,
      data,
    );
  }

  @Get("deal-desk/requests/:id/approval-chain")
  @ApiOperation({ summary: "Get deal desk approval chain" })
  @Permissions("sales.deal-desk.read")
  async getDealDeskApprovalChain(
    @CurrentUser() user: any,
    @Param("id") id: string,
  ) {
    return this.executionService.getDealDeskApprovalChain(user.tenantId, id);
  }

  @Post("deal-desk/evaluate-margin")
  @ApiOperation({ summary: "Evaluate deal desk margin" })
  @Permissions("sales.deal-desk.read")
  async evaluateDealDeskMargin(
    @CurrentUser() user: any,
    @Body() dealData: any,
  ) {
    return this.executionService.evaluateDealDeskMargin(
      user.tenantId,
      dealData,
    );
  }

  @Get("deal-desk/analytics")
  @ApiOperation({ summary: "Get deal desk analytics" })
  @Permissions("sales.deal-desk.read")
  async getDealDeskAnalytics(
    @CurrentUser() user: any,
    @Query("timeframe") timeframe: string,
  ) {
    return this.executionService.getDealDeskAnalytics(user.tenantId, timeframe);
  }

  @Post("deal-desk/policies")
  @ApiOperation({ summary: "Create deal desk policy" })
  @Permissions("sales.deal-desk.admin")
  async setDealDeskPolicy(@CurrentUser() user: any, @Body() policy: any) {
    return this.executionService.setDealDeskPolicy(user.tenantId, policy);
  }

  @Get("deal-desk/policies")
  @ApiOperation({ summary: "Get deal desk policies" })
  @Permissions("sales.deal-desk.read")
  async getDealDeskPolicies(@CurrentUser() user: any) {
    return this.executionService.getDealDeskPolicies(user.tenantId);
  }

  @Delete("deal-desk/policies/:id")
  @ApiOperation({ summary: "Delete deal desk policy" })
  @Permissions("sales.deal-desk.admin")
  async deleteDealDeskPolicy(
    @CurrentUser() user: any,
    @Param("id") id: string,
  ) {
    return this.executionService.deleteDealDeskPolicy(user.tenantId, id);
  }

  @Post("deal-desk/requests/:id/clone")
  @ApiOperation({ summary: "Clone deal desk request" })
  @Permissions("sales.deal-desk.create")
  async cloneDealDeskRequest(
    @CurrentUser() user: any,
    @Param("id") id: string,
  ) {
    return this.executionService.cloneDealDeskRequest(user.tenantId, id);
  }

  @Get("deal-desk/audit-log/export")
  @ApiOperation({ summary: "Export deal desk audit log" })
  @Permissions("sales.deal-desk.read")
  async exportDealDeskAuditLog(@CurrentUser() user: any, @Query() filter: any) {
    return this.executionService.exportDealDeskAuditLog(user.tenantId, filter);
  }

  @Get("deal-desk/sla-metrics")
  @ApiOperation({ summary: "Get deal desk SLA metrics" })
  @Permissions("sales.deal-desk.read")
  async getDealDeskSlaMetrics(@CurrentUser() user: any) {
    return this.executionService.getDealDeskSlaMetrics(user.tenantId);
  }

  @Post("deal-desk/requests/:id/override")
  @ApiOperation({ summary: "Override deal desk approval" })
  @Permissions("sales.deal-desk.admin")
  async overrideDealDeskApproval(
    @CurrentUser() user: any,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.executionService.overrideDealDeskApproval(
      user.tenantId,
      id,
      body?.reason,
      user.userId,
    );
  }

  @Get("deal-desk/concessions-summary")
  @ApiOperation({ summary: "Get deal desk concessions summary" })
  @Permissions("sales.deal-desk.read")
  async getDealDeskConcessionsSummary(@CurrentUser() user: any) {
    return this.executionService.getDealDeskConcessionsSummary(user.tenantId);
  }

  @Post("deal-desk/requests/:id/comments")
  @ApiOperation({ summary: "Add deal desk comment" })
  @Permissions("sales.deal-desk.update")
  async addDealDeskComment(
    @CurrentUser() user: any,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.executionService.addDealDeskComment(
      user.tenantId,
      id,
      body?.comment,
      user.userId,
    );
  }

  @Get("deal-desk/requests/:id/comments")
  @ApiOperation({ summary: "Get deal desk comments" })
  @Permissions("sales.deal-desk.read")
  async getDealDeskComments(@CurrentUser() user: any, @Param("id") id: string) {
    return this.executionService.getDealDeskComments(user.tenantId, id);
  }

  // 2. Velocity Analytics
  @Get("velocity/metrics")
  @ApiOperation({ summary: "Get sales velocity metrics" })
  @Permissions("sales.analytics.read")
  async getSalesVelocityMetrics(
    @CurrentUser() user: any,
    @Query("period") period: string,
  ) {
    return this.executionService.getSalesVelocityMetrics(user.tenantId, period);
  }

  @Get("velocity/stage-conversions")
  @ApiOperation({ summary: "Get stage conversion rates" })
  @Permissions("sales.analytics.read")
  async getStageConversionRates(@CurrentUser() user: any) {
    return this.executionService.getStageConversionRates(user.tenantId);
  }

  @Get("velocity/bottlenecks")
  @ApiOperation({ summary: "Get pipeline bottlenecks" })
  @Permissions("sales.analytics.read")
  async getPipelineBottlenecks(@CurrentUser() user: any) {
    return this.executionService.getPipelineBottlenecks(user.tenantId);
  }

  @Get("velocity/leaderboard")
  @ApiOperation({ summary: "Get sales rep velocity leaderboard" })
  @Permissions("sales.analytics.read")
  async getSalesRepVelocityLeaderboard(@CurrentUser() user: any) {
    return this.executionService.getSalesRepVelocityLeaderboard(user.tenantId);
  }

  @Get("velocity/by-category")
  @ApiOperation({ summary: "Get velocity by product category" })
  @Permissions("sales.analytics.read")
  async getVelocityByProductCategory(@CurrentUser() user: any) {
    return this.executionService.getVelocityByProductCategory(user.tenantId);
  }

  @Get("velocity/by-territory")
  @ApiOperation({ summary: "Get velocity by territory" })
  @Permissions("sales.analytics.read")
  async getVelocityByTerritory(@CurrentUser() user: any) {
    return this.executionService.getVelocityByTerritory(user.tenantId);
  }

  @Post("velocity/cohort-analysis")
  @ApiOperation({ summary: "Run velocity cohort analysis" })
  @Permissions("sales.analytics.read")
  async runVelocityCohortAnalysis(@CurrentUser() user: any, @Body() body: any) {
    return this.executionService.runVelocityCohortAnalysis(
      user.tenantId,
      body?.cohortType,
    );
  }

  @Get("velocity/duration-histogram")
  @ApiOperation({ summary: "Get sales cycle duration histogram" })
  @Permissions("sales.analytics.read")
  async getSalesCycleDurationHistogram(@CurrentUser() user: any) {
    return this.executionService.getSalesCycleDurationHistogram(user.tenantId);
  }

  @Get("velocity/push-rate")
  @ApiOperation({ summary: "Get push rate analytics" })
  @Permissions("sales.analytics.read")
  async getPushRateAnalytics(@CurrentUser() user: any) {
    return this.executionService.getPushRateAnalytics(user.tenantId);
  }

  @Get("velocity/deal-ageing")
  @ApiOperation({ summary: "Get deal ageing distribution" })
  @Permissions("sales.analytics.read")
  async getDealAgeingDistribution(@CurrentUser() user: any) {
    return this.executionService.getDealAgeingDistribution(user.tenantId);
  }

  @Post("velocity/target-gap")
  @ApiOperation({ summary: "Calculate target velocity gap" })
  @Permissions("sales.analytics.read")
  async calculateTargetVelocityGap(
    @CurrentUser() user: any,
    @Body() body: any,
  ) {
    return this.executionService.calculateTargetVelocityGap(
      user.tenantId,
      body?.targetVelocity,
    );
  }

  @Get("velocity/benchmark")
  @ApiOperation({ summary: "Get velocity benchmark comparison" })
  @Permissions("sales.analytics.read")
  async getVelocityBenchmarkComparison(@CurrentUser() user: any) {
    return this.executionService.getVelocityBenchmarkComparison(user.tenantId);
  }

  @Get("velocity/export")
  @ApiOperation({ summary: "Export velocity report" })
  @Permissions("sales.analytics.read")
  async exportVelocityReport(
    @CurrentUser() user: any,
    @Query("format") format: string,
  ) {
    return this.executionService.exportVelocityReport(user.tenantId, format);
  }

  @Post("velocity/alerts/thresholds")
  @ApiOperation({ summary: "Set velocity alert thresholds" })
  @Permissions("sales.analytics.admin")
  async setVelocityAlertThresholds(
    @CurrentUser() user: any,
    @Body() thresholds: any,
  ) {
    return this.executionService.setVelocityAlertThresholds(
      user.tenantId,
      thresholds,
    );
  }

  @Get("velocity/alerts")
  @ApiOperation({ summary: "Get velocity alerts" })
  @Permissions("sales.analytics.read")
  async getVelocityAlerts(@CurrentUser() user: any) {
    return this.executionService.getVelocityAlerts(user.tenantId);
  }

  @Post("velocity/alerts/:id/acknowledge")
  @ApiOperation({ summary: "Acknowledge velocity alert" })
  @Permissions("sales.analytics.update")
  async acknowledgeVelocityAlert(
    @CurrentUser() user: any,
    @Param("id") id: string,
  ) {
    return this.executionService.acknowledgeVelocityAlert(
      user.tenantId,
      id,
      user.userId,
    );
  }

  @Get("velocity/win-loss-correlation")
  @ApiOperation({ summary: "Get win-loss velocity correlation" })
  @Permissions("sales.analytics.read")
  async getWinLossVelocityCorrelation(@CurrentUser() user: any) {
    return this.executionService.getWinLossVelocityCorrelation(user.tenantId);
  }

  @Get("velocity/multi-touch-impact")
  @ApiOperation({ summary: "Get multi-touch velocity impact" })
  @Permissions("sales.analytics.read")
  async getMultiTouchVelocityImpact(@CurrentUser() user: any) {
    return this.executionService.getMultiTouchVelocityImpact(user.tenantId);
  }

  @Get("velocity/forecast-quarter-end")
  @ApiOperation({ summary: "Forecast quarter-end velocity" })
  @Permissions("sales.analytics.read")
  async forecastQuarterEndVelocity(@CurrentUser() user: any) {
    return this.executionService.forecastQuarterEndVelocity(user.tenantId);
  }

  @Post("velocity/cache/reset")
  @ApiOperation({ summary: "Reset velocity cache" })
  @Permissions("sales.analytics.admin")
  async resetVelocityCache(@CurrentUser() user: any) {
    return this.executionService.resetVelocityCache(user.tenantId);
  }

  // 3. Battlecards & Intelligence
  @Post("battlecards")
  @ApiOperation({ summary: "Create competitor battlecard" })
  @Permissions("sales.battlecard.create")
  async createCompetitorBattlecard(
    @CurrentUser() user: any,
    @Body() data: any,
  ) {
    return this.executionService.createCompetitorBattlecard(
      user.tenantId,
      data,
    );
  }

  @Get("battlecards")
  @ApiOperation({ summary: "Get competitor battlecards" })
  @Permissions("sales.battlecard.read")
  async getCompetitorBattlecards(@CurrentUser() user: any) {
    return this.executionService.getCompetitorBattlecards(user.tenantId);
  }

  @Get("battlecards/:id")
  @ApiOperation({ summary: "Get competitor battlecard by ID" })
  @Permissions("sales.battlecard.read")
  async getCompetitorBattlecardById(
    @CurrentUser() user: any,
    @Param("id") id: string,
  ) {
    return this.executionService.getCompetitorBattlecardById(user.tenantId, id);
  }

  @Patch("battlecards/:id")
  @ApiOperation({ summary: "Update competitor battlecard" })
  @Permissions("sales.battlecard.update")
  async updateCompetitorBattlecard(
    @CurrentUser() user: any,
    @Param("id") id: string,
    @Body() data: any,
  ) {
    return this.executionService.updateCompetitorBattlecard(
      user.tenantId,
      id,
      data,
    );
  }

  @Delete("battlecards/:id")
  @ApiOperation({ summary: "Delete competitor battlecard" })
  @Permissions("sales.battlecard.delete")
  async deleteCompetitorBattlecard(
    @CurrentUser() user: any,
    @Param("id") id: string,
  ) {
    return this.executionService.deleteCompetitorBattlecard(user.tenantId, id);
  }

  @Post("battlecards/:id/objections")
  @ApiOperation({ summary: "Add objection handling" })
  @Permissions("sales.battlecard.update")
  async addObjectionHandling(
    @CurrentUser() user: any,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.executionService.addObjectionHandling(
      user.tenantId,
      id,
      body?.objection,
      body?.response,
    );
  }

  @Get("battlecards/:id/objections")
  @ApiOperation({ summary: "Get objection handlings" })
  @Permissions("sales.battlecard.read")
  async getObjectionHandlings(
    @CurrentUser() user: any,
    @Param("id") id: string,
  ) {
    return this.executionService.getObjectionHandlings(user.tenantId, id);
  }

  @Patch("battlecards/objections/:objId")
  @ApiOperation({ summary: "Update objection handling" })
  @Permissions("sales.battlecard.update")
  async updateObjectionHandling(
    @CurrentUser() user: any,
    @Param("objId") objId: string,
    @Body() data: any,
  ) {
    return this.executionService.updateObjectionHandling(
      user.tenantId,
      objId,
      data,
    );
  }

  @Delete("battlecards/objections/:objId")
  @ApiOperation({ summary: "Delete objection handling" })
  @Permissions("sales.battlecard.delete")
  async deleteObjectionHandling(
    @CurrentUser() user: any,
    @Param("objId") objId: string,
  ) {
    return this.executionService.deleteObjectionHandling(user.tenantId, objId);
  }

  @Post("battlecards/win-loss-records")
  @ApiOperation({ summary: "Record competitor win-loss" })
  @Permissions("sales.battlecard.update")
  async recordCompetitorWinLoss(@CurrentUser() user: any, @Body() data: any) {
    return this.executionService.recordCompetitorWinLoss(user.tenantId, data);
  }

  @Get("battlecards/win-loss-analytics")
  @ApiOperation({ summary: "Get competitor win-loss analytics" })
  @Permissions("sales.battlecard.read")
  async getCompetitorWinLossAnalytics(
    @CurrentUser() user: any,
    @Query("competitorId") competitorId?: string,
  ) {
    return this.executionService.getCompetitorWinLossAnalytics(
      user.tenantId,
      competitorId,
    );
  }

  @Get("battlecards/feature-matrix")
  @ApiOperation({ summary: "Get competitor feature matrix" })
  @Permissions("sales.battlecard.read")
  async getCompetitorFeatureMatrix(@CurrentUser() user: any) {
    return this.executionService.getCompetitorFeatureMatrix(user.tenantId);
  }

  @Post("battlecards/feature-matrix/entry")
  @ApiOperation({ summary: "Update feature matrix entry" })
  @Permissions("sales.battlecard.update")
  async updateFeatureMatrixEntry(@CurrentUser() user: any, @Body() body: any) {
    return this.executionService.updateFeatureMatrixEntry(
      user.tenantId,
      body?.feature,
      body?.competitor,
      body?.supported,
    );
  }

  @Get("battlecards/pricing-intelligence")
  @ApiOperation({ summary: "Get competitor pricing intelligence" })
  @Permissions("sales.battlecard.read")
  async getCompetitorPricingIntelligence(@CurrentUser() user: any) {
    return this.executionService.getCompetitorPricingIntelligence(
      user.tenantId,
    );
  }

  @Post("battlecards/pricing-intelligence")
  @ApiOperation({ summary: "Add competitor pricing insight" })
  @Permissions("sales.battlecard.update")
  async addCompetitorPricingInsight(
    @CurrentUser() user: any,
    @Body() data: any,
  ) {
    return this.executionService.addCompetitorPricingInsight(
      user.tenantId,
      data,
    );
  }

  @Get("battlecards/search")
  @ApiOperation({ summary: "Search battlecards" })
  @Permissions("sales.battlecard.read")
  async searchBattlecards(@CurrentUser() user: any, @Query("q") q: string) {
    return this.executionService.searchBattlecards(user.tenantId, q);
  }

  @Get("battlecards/usage-metrics")
  @ApiOperation({ summary: "Get battlecard usage metrics" })
  @Permissions("sales.battlecard.read")
  async getBattlecardUsageMetrics(@CurrentUser() user: any) {
    return this.executionService.getBattlecardUsageMetrics(user.tenantId);
  }

  @Post("battlecards/:id/rate")
  @ApiOperation({ summary: "Rate battlecard effectiveness" })
  @Permissions("sales.battlecard.update")
  async rateBattlecardEffectiveness(
    @CurrentUser() user: any,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.executionService.rateBattlecardEffectiveness(
      user.tenantId,
      id,
      body?.rating,
      body?.feedback,
    );
  }

  @Get("battlecards/export-pdf")
  @ApiOperation({ summary: "Export battlecards PDF" })
  @Permissions("sales.battlecard.read")
  async exportBattlecardsPdf(@CurrentUser() user: any) {
    return this.executionService.exportBattlecardsPdf(user.tenantId);
  }

  @Post("battlecards/news-alerts/sync")
  @ApiOperation({ summary: "Sync competitor news alerts" })
  @Permissions("sales.battlecard.update")
  async syncCompetitorNewsAlerts(@CurrentUser() user: any, @Body() body: any) {
    return this.executionService.syncCompetitorNewsAlerts(
      user.tenantId,
      body?.competitorName,
    );
  }

  // 4. Lead Scoring & Intent Signals
  @Post("lead-scoring/rules")
  @ApiOperation({ summary: "Set scoring model rules" })
  @Permissions("sales.scoring.admin")
  async setScoringModelRules(@CurrentUser() user: any, @Body() body: any) {
    return this.executionService.setScoringModelRules(
      user.tenantId,
      body?.rules || [],
    );
  }

  @Get("lead-scoring/rules")
  @ApiOperation({ summary: "Get scoring model rules" })
  @Permissions("sales.scoring.read")
  async getScoringModelRules(@CurrentUser() user: any) {
    return this.executionService.getScoringModelRules(user.tenantId);
  }

  @Post("lead-scoring/calculate/:leadId")
  @ApiOperation({ summary: "Calculate lead score" })
  @Permissions("sales.scoring.read")
  async calculateLeadScore(
    @CurrentUser() user: any,
    @Param("leadId") leadId: string,
  ) {
    return this.executionService.calculateLeadScore(user.tenantId, leadId);
  }

  @Post("lead-scoring/batch-rescore")
  @ApiOperation({ summary: "Batch rescore leads" })
  @Permissions("sales.scoring.admin")
  async batchRescoreLeads(@CurrentUser() user: any) {
    return this.executionService.batchRescoreLeads(user.tenantId);
  }

  @Get("lead-scoring/distribution")
  @ApiOperation({ summary: "Get score distribution" })
  @Permissions("sales.scoring.read")
  async getScoreDistribution(@CurrentUser() user: any) {
    return this.executionService.getScoreDistribution(user.tenantId);
  }

  @Get("predictive/churn-risk/:accountId")
  @ApiOperation({ summary: "Get predictive churn risk" })
  @Permissions("sales.predictive.read")
  async getPredictiveChurnRisk(
    @CurrentUser() user: any,
    @Param("accountId") accountId: string,
  ) {
    return this.executionService.getPredictiveChurnRisk(
      user.tenantId,
      accountId,
    );
  }

  @Get("predictive/expansion-score/:accountId")
  @ApiOperation({ summary: "Get account expansion score" })
  @Permissions("sales.predictive.read")
  async getAccountExpansionScore(
    @CurrentUser() user: any,
    @Param("accountId") accountId: string,
  ) {
    return this.executionService.getAccountExpansionScore(
      user.tenantId,
      accountId,
    );
  }

  @Post("predictive/train-model")
  @ApiOperation({ summary: "Train predictive sales model" })
  @Permissions("sales.predictive.admin")
  async trainPredictiveSalesModel(
    @CurrentUser() user: any,
    @Body() params: any,
  ) {
    return this.executionService.trainPredictiveSalesModel(
      user.tenantId,
      params,
    );
  }

  @Get("predictive/model-performance")
  @ApiOperation({ summary: "Get model performance metrics" })
  @Permissions("sales.predictive.read")
  async getModelPerformanceMetrics(@CurrentUser() user: any) {
    return this.executionService.getModelPerformanceMetrics(user.tenantId);
  }

  @Post("intent-data/provider-config")
  @ApiOperation({ summary: "Set intent data provider config" })
  @Permissions("sales.intent.admin")
  async setIntentDataProviderConfig(
    @CurrentUser() user: any,
    @Body() body: any,
  ) {
    return this.executionService.setIntentDataProviderConfig(
      user.tenantId,
      body?.provider,
      body?.config,
    );
  }

  @Get("intent-data/latest-signals")
  @ApiOperation({ summary: "Get latest intent signals" })
  @Permissions("sales.intent.read")
  async getLatestIntentSignals(@CurrentUser() user: any) {
    return this.executionService.getLatestIntentSignals(user.tenantId);
  }

  @Post("intent-data/map-to-lead")
  @ApiOperation({ summary: "Map intent signal to lead" })
  @Permissions("sales.intent.update")
  async mapIntentSignalToLead(@CurrentUser() user: any, @Body() body: any) {
    return this.executionService.mapIntentSignalToLead(
      user.tenantId,
      body?.signalId,
      body?.leadId,
    );
  }

  @Post("auto-routing/rules")
  @ApiOperation({ summary: "Set auto routing rules" })
  @Permissions("sales.routing.admin")
  async setAutoRoutingRules(@CurrentUser() user: any, @Body() rules: any) {
    return this.executionService.setAutoRoutingRules(user.tenantId, rules);
  }

  @Get("auto-routing/rules")
  @ApiOperation({ summary: "Get auto routing rules" })
  @Permissions("sales.routing.read")
  async getAutoRoutingRules(@CurrentUser() user: any) {
    return this.executionService.getAutoRoutingRules(user.tenantId);
  }

  @Post("auto-routing/test")
  @ApiOperation({ summary: "Test auto routing" })
  @Permissions("sales.routing.read")
  async testAutoRouting(@CurrentUser() user: any, @Body() leadData: any) {
    return this.executionService.testAutoRouting(user.tenantId, leadData);
  }

  @Get("lead-scoring/audit-trail/:leadId")
  @ApiOperation({ summary: "Get scoring audit trail" })
  @Permissions("sales.scoring.read")
  async getScoringAuditTrail(
    @CurrentUser() user: any,
    @Param("leadId") leadId: string,
  ) {
    return this.executionService.getScoringAuditTrail(user.tenantId, leadId);
  }

  @Get("lead-scoring/export")
  @ApiOperation({ summary: "Export scoring data" })
  @Permissions("sales.scoring.read")
  async exportScoringData(@CurrentUser() user: any) {
    return this.executionService.exportScoringData(user.tenantId);
  }

  @Get("ai/deal-health/:dealId")
  @ApiOperation({ summary: "Get AI deal health score" })
  @Permissions("sales.ai.read")
  async getAiDealHealthScore(
    @CurrentUser() user: any,
    @Param("dealId") dealId: string,
  ) {
    return this.executionService.getAiDealHealthScore(user.tenantId, dealId);
  }

  @Get("ai/next-best-actions/:dealId")
  @ApiOperation({ summary: "Get AI next best actions" })
  @Permissions("sales.ai.read")
  async getAiNextBestActions(
    @CurrentUser() user: any,
    @Param("dealId") dealId: string,
  ) {
    return this.executionService.getAiNextBestActions(user.tenantId, dealId);
  }

  @Post("ai/next-best-actions/:dealId/dismiss")
  @ApiOperation({ summary: "Dismiss next best action" })
  @Permissions("sales.ai.update")
  async dismissNextBestAction(
    @CurrentUser() user: any,
    @Param("dealId") dealId: string,
    @Body() body: any,
  ) {
    return this.executionService.dismissNextBestAction(
      user.tenantId,
      dealId,
      body?.actionId,
    );
  }

  // 5. Cadence & Engagement Automation
  @Post("cadences")
  @ApiOperation({ summary: "Create sales cadence" })
  @Permissions("sales.cadence.create")
  async createSalesCadence(@CurrentUser() user: any, @Body() data: any) {
    return this.executionService.createSalesCadence(user.tenantId, data);
  }

  @Get("cadences")
  @ApiOperation({ summary: "Get sales cadences" })
  @Permissions("sales.cadence.read")
  async getSalesCadences(@CurrentUser() user: any) {
    return this.executionService.getSalesCadences(user.tenantId);
  }

  @Get("cadences/:id")
  @ApiOperation({ summary: "Get sales cadence by ID" })
  @Permissions("sales.cadence.read")
  async getSalesCadenceById(@CurrentUser() user: any, @Param("id") id: string) {
    return this.executionService.getSalesCadenceById(user.tenantId, id);
  }

  @Patch("cadences/:id")
  @ApiOperation({ summary: "Update sales cadence" })
  @Permissions("sales.cadence.update")
  async updateSalesCadence(
    @CurrentUser() user: any,
    @Param("id") id: string,
    @Body() data: any,
  ) {
    return this.executionService.updateSalesCadence(user.tenantId, id, data);
  }

  @Delete("cadences/:id")
  @ApiOperation({ summary: "Delete sales cadence" })
  @Permissions("sales.cadence.delete")
  async deleteSalesCadence(@CurrentUser() user: any, @Param("id") id: string) {
    return this.executionService.deleteSalesCadence(user.tenantId, id);
  }

  @Post("cadences/:id/steps")
  @ApiOperation({ summary: "Add cadence step" })
  @Permissions("sales.cadence.update")
  async addCadenceStep(
    @CurrentUser() user: any,
    @Param("id") id: string,
    @Body() stepData: any,
  ) {
    return this.executionService.addCadenceStep(user.tenantId, id, stepData);
  }

  @Patch("cadences/steps/:stepId")
  @ApiOperation({ summary: "Update cadence step" })
  @Permissions("sales.cadence.update")
  async updateCadenceStep(
    @CurrentUser() user: any,
    @Param("stepId") stepId: string,
    @Body() stepData: any,
  ) {
    return this.executionService.updateCadenceStep(
      user.tenantId,
      stepId,
      stepData,
    );
  }

  @Delete("cadences/steps/:stepId")
  @ApiOperation({ summary: "Delete cadence step" })
  @Permissions("sales.cadence.delete")
  async deleteCadenceStep(
    @CurrentUser() user: any,
    @Param("stepId") stepId: string,
  ) {
    return this.executionService.deleteCadenceStep(user.tenantId, stepId);
  }

  @Post("cadences/:id/enroll")
  @ApiOperation({ summary: "Enroll prospects in cadence" })
  @Permissions("sales.cadence.update")
  async enrollProspectsInCadence(
    @CurrentUser() user: any,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.executionService.enrollProspectsInCadence(
      user.tenantId,
      id,
      body?.prospectIds || [],
    );
  }

  @Post("cadences/:id/unenroll")
  @ApiOperation({ summary: "Unenroll prospect from cadence" })
  @Permissions("sales.cadence.update")
  async unenrollProspectFromCadence(
    @CurrentUser() user: any,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.executionService.unenrollProspectFromCadence(
      user.tenantId,
      id,
      body?.prospectId,
      body?.reason,
    );
  }

  @Get("cadences/tasks/my-tasks")
  @ApiOperation({ summary: "Get cadence execution tasks" })
  @Permissions("sales.cadence.read")
  async getCadenceExecutionTasks(@CurrentUser() user: any) {
    return this.executionService.getCadenceExecutionTasks(
      user.tenantId,
      user.userId,
    );
  }

  @Post("cadences/tasks/:taskId/complete")
  @ApiOperation({ summary: "Complete cadence task" })
  @Permissions("sales.cadence.update")
  async completeCadenceTask(
    @CurrentUser() user: any,
    @Param("taskId") taskId: string,
    @Body() body: any,
  ) {
    return this.executionService.completeCadenceTask(
      user.tenantId,
      taskId,
      body?.outcome,
      body?.notes,
    );
  }

  @Get("cadences/:id/analytics")
  @ApiOperation({ summary: "Get cadence analytics" })
  @Permissions("sales.cadence.read")
  async getCadenceAnalytics(@CurrentUser() user: any, @Param("id") id: string) {
    return this.executionService.getCadenceAnalytics(user.tenantId, id);
  }

  @Post("cadences/:id/pause")
  @ApiOperation({ summary: "Pause cadence for prospect" })
  @Permissions("sales.cadence.update")
  async pauseCadenceForProspect(
    @CurrentUser() user: any,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.executionService.pauseCadenceForProspect(
      user.tenantId,
      id,
      body?.prospectId,
    );
  }

  @Post("cadences/:id/resume")
  @ApiOperation({ summary: "Resume cadence for prospect" })
  @Permissions("sales.cadence.update")
  async resumeCadenceForProspect(
    @CurrentUser() user: any,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.executionService.resumeCadenceForProspect(
      user.tenantId,
      id,
      body?.prospectId,
    );
  }

  @Post("cadences/:id/clone")
  @ApiOperation({ summary: "Clone cadence" })
  @Permissions("sales.cadence.create")
  async cloneCadence(@CurrentUser() user: any, @Param("id") id: string) {
    return this.executionService.cloneCadence(user.tenantId, id);
  }

  @Post("cadences/daily-limits")
  @ApiOperation({ summary: "Set cadence daily limits" })
  @Permissions("sales.cadence.admin")
  async setCadenceDailyLimits(@CurrentUser() user: any, @Body() limits: any) {
    return this.executionService.setCadenceDailyLimits(user.tenantId, limits);
  }

  @Get("cadences/daily-limits")
  @ApiOperation({ summary: "Get cadence daily limits" })
  @Permissions("sales.cadence.read")
  async getCadenceDailyLimits(@CurrentUser() user: any) {
    return this.executionService.getCadenceDailyLimits(user.tenantId);
  }

  @Get("cadences/activity-log/export")
  @ApiOperation({ summary: "Export cadence activity log" })
  @Permissions("sales.cadence.read")
  async exportCadenceActivityLog(@CurrentUser() user: any) {
    return this.executionService.exportCadenceActivityLog(user.tenantId);
  }

  @Get("cadences/steps/:stepId/ab-test-results")
  @ApiOperation({ summary: "Get A/B test variant results" })
  @Permissions("sales.cadence.read")
  async getAbTestVariantResults(
    @CurrentUser() user: any,
    @Param("stepId") stepId: string,
  ) {
    return this.executionService.getAbTestVariantResults(user.tenantId, stepId);
  }
}
