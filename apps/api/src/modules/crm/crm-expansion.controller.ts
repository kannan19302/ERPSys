import { Controller, Get, Param, Query, UseGuards, Req, Post, Body, Delete, Put } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

import { CrmForecastingService } from './crm-forecasting.service';
import { CrmAccountManagementService } from './crm-account-management.service';
import { CrmCampaignManagementService } from './crm-campaign-management.service';
import { CrmSupportService } from './crm-support.service';
import { CrmEnablementService } from './crm-enablement.service';
import { CrmRevOpsService } from './crm-revops.service';
import { CrmPartnersService } from './crm-partners.service';
import { CrmAutomationService } from './crm-automation.service';

interface AuthenticatedRequest extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[]; orgId?: string };
}

@ApiTags('crm-expansion')
@ApiBearerAuth()
@Controller('crm/expansion')
@UseGuards(JwtAuthGuard, RbacGuard)
export class CrmExpansionController {
  constructor(
    private readonly forecastingService: CrmForecastingService,
    private readonly accountService: CrmAccountManagementService,
    private readonly campaignService: CrmCampaignManagementService,
    private readonly supportService: CrmSupportService,
    private readonly enablementService: CrmEnablementService,
    private readonly revOpsService: CrmRevOpsService,
    private readonly partnersService: CrmPartnersService,
    private readonly automationService: CrmAutomationService,
  ) {}

  // ── GROUP 1: FORECASTING & PIPELINE ──────────────────
  @Get('deal-score/:id')
  @Permissions('crm.opportunity.read')
  async getDealScore(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.forecastingService.calculateDealScore(req.user.tenantId, id);
  }

  @Get('rotting-deals')
  @Permissions('crm.opportunity.read')
  async getRottingDeals(@Req() req: AuthenticatedRequest, @Query('days') days?: string) {
    return this.forecastingService.getRottingDeals(req.user.tenantId, days ? Number(days) : 14);
  }

  @Get('deal-velocity')
  @Permissions('crm.opportunity.read')
  async getDealVelocity(@Req() req: AuthenticatedRequest) {
    return this.forecastingService.getDealVelocity(req.user.tenantId);
  }

  @Get('revenue-waterfall')
  @Permissions('crm.opportunity.read')
  async getRevenueWaterfall(@Req() req: AuthenticatedRequest) {
    return this.forecastingService.getRevenueWaterfall(req.user.tenantId);
  }

  // ── GROUP 2: CONTACT & ACCOUNT ───────────────────────
  @Get('influence-map/:customerId')
  @Permissions('crm.contact.read')
  async getInfluenceMap(@Req() req: AuthenticatedRequest, @Param('customerId') customerId: string) {
    return this.accountService.getInfluenceMap(req.user.tenantId, customerId);
  }

  @Get('health-score/:customerId')
  @Permissions('crm.customer.read')
  async getHealthScore(@Req() req: AuthenticatedRequest, @Param('customerId') customerId: string) {
    return this.accountService.getCustomerHealthScore(req.user.tenantId, customerId);
  }

  @Get('risk-alerts')
  @Permissions('crm.customer.read')
  async getRiskAlerts(@Req() req: AuthenticatedRequest) {
    return this.accountService.getCustomerRiskAlerts(req.user.tenantId);
  }

  // ── GROUP 3: CAMPAIGNS ──────────────────────────────
  @Get('marketing-funnel')
  @Permissions('crm.campaign.read')
  async getMarketingFunnel(@Req() req: AuthenticatedRequest) {
    return this.campaignService.getMarketingFunnel(req.user.tenantId);
  }

  @Get('marketing-dashboard')
  @Permissions('crm.campaign.read')
  async getMarketingDashboard(@Req() req: AuthenticatedRequest) {
    return this.campaignService.getMarketingDashboardKPIs(req.user.tenantId);
  }

  // ── GROUP 6: SUPPORT ────────────────────────────────
  @Get('sla-calendar')
  @Permissions('crm.case.read')
  async getSlaCalendar(@Req() req: AuthenticatedRequest) {
    return this.supportService.getSlaCalendar(req.user.tenantId);
  }

  @Get('ticket-analytics')
  @Permissions('crm.case.read')
  async getTicketAnalytics(@Req() req: AuthenticatedRequest) {
    return this.supportService.getTicketAnalytics(req.user.tenantId);
  }

  // ── GROUP 7: ENABLEMENT ─────────────────────────────
  @Get('objection-database')
  @Permissions('crm.playbook.read')
  async getObjections(@Req() req: AuthenticatedRequest, @Query('q') q?: string) {
    return this.enablementService.getObjections(req.user.tenantId, q);
  }

  @Get('gamification-leaderboard')
  @Permissions('crm.sales-target.read')
  async getLeaderboard(@Req() req: AuthenticatedRequest) {
    return this.enablementService.getLeaderboard(req.user.tenantId);
  }

  // ── GROUP 8: REVOPS ─────────────────────────────────
  @Get('revops-metrics')
  @Permissions('crm.sales-target.read')
  async getRevOpsMetrics(@Req() req: AuthenticatedRequest) {
    return this.revOpsService.getRevOpsMetrics(req.user.tenantId);
  }

  @Get('commissions')
  @Permissions('crm.commission.read')
  async getCommissions(@Req() req: AuthenticatedRequest) {
    return this.revOpsService.getCommissions(req.user.tenantId);
  }

  // ── GROUP 9: PARTNERS ───────────────────────────────
  @Get('partners')
  @Permissions('crm.partner.read')
  async getPartners(@Req() req: AuthenticatedRequest) {
    return this.partnersService.getPartners(req.user.tenantId);
  }

  // ── GROUP 10: AUTOMATION ────────────────────────────
  @Get('workflows')
  @Permissions('crm.workflow.read')
  async getWorkflows(@Req() req: AuthenticatedRequest) {
    return this.automationService.getWorkflows(req.user.tenantId);
  }

  // ── Batch 1 Extra Endpoints ──────────────────────────

  // ForecastSnapshot
  @Post('forecast-snapshots')
  @Permissions('crm.opportunity.update')
  async createForecastSnapshot(@Req() req: AuthenticatedRequest, @Body() body: any) {
    const orgId = req.user.orgId || 'default-org';
    return this.forecastingService.createForecastSnapshot(req.user.tenantId, orgId, body);
  }

  @Get('forecast-snapshots')
  @Permissions('crm.opportunity.read')
  async getForecastSnapshots(@Req() req: AuthenticatedRequest) {
    const orgId = req.user.orgId || 'default-org';
    return this.forecastingService.getForecastSnapshotsList(req.user.tenantId, orgId);
  }

  @Put('forecast-snapshots/:id/freeze')
  @Permissions('crm.opportunity.update')
  async freezeForecastSnapshot(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.forecastingService.freezeForecastSnapshot(req.user.tenantId, id);
  }

  @Put('forecast-snapshots/:id/adjust')
  @Permissions('crm.opportunity.update')
  async adjustForecast(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body('amount') amount: number) {
    return this.forecastingService.adjustForecast(req.user.tenantId, id, amount);
  }

  // Quota
  @Post('quotas')
  @Permissions('crm.sales-target.update')
  async createQuota(@Req() req: AuthenticatedRequest, @Body() body: any) {
    const orgId = req.user.orgId || 'default-org';
    return this.forecastingService.createQuota(req.user.tenantId, orgId, body);
  }

  @Get('quotas')
  @Permissions('crm.sales-target.read')
  async getQuotas(@Req() req: AuthenticatedRequest) {
    const orgId = req.user.orgId || 'default-org';
    return this.forecastingService.getQuotasList(req.user.tenantId, orgId);
  }

  // DealTag
  @Post('opportunities/:id/tags')
  @Permissions('crm.opportunity.update')
  async addDealTag(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body('tag') tag: string) {
    return this.forecastingService.addDealTag(req.user.tenantId, id, tag);
  }

  @Delete('opportunities/:id/tags/:tag')
  @Permissions('crm.opportunity.update')
  async removeDealTag(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Param('tag') tag: string) {
    return this.forecastingService.removeDealTag(req.user.tenantId, id, tag);
  }

  // DealTeamMember
  @Post('opportunities/:id/team')
  @Permissions('crm.opportunity.update')
  async addDealTeamMember(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() body: any) {
    return this.forecastingService.addDealTeamMember(req.user.tenantId, id, body.userId, body.role, body.accessLevel);
  }

  @Delete('opportunities/:id/team/:userId')
  @Permissions('crm.opportunity.update')
  async removeDealTeamMember(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Param('userId') userId: string) {
    return this.forecastingService.removeDealTeamMember(req.user.tenantId, id, userId);
  }

  // AccountPlan
  @Post('account-plans')
  @Permissions('crm.customer.update')
  async createAccountPlan(@Req() req: AuthenticatedRequest, @Body() body: any) {
    const orgId = req.user.orgId || 'default-org';
    return this.accountService.createAccountPlan(req.user.tenantId, orgId, body);
  }

  @Get('account-plans')
  @Permissions('crm.customer.read')
  async getAccountPlans(@Req() req: AuthenticatedRequest) {
    const orgId = req.user.orgId || 'default-org';
    return this.accountService.getAccountPlans(req.user.tenantId, orgId);
  }

  // ContactRole
  @Post('opportunities/:id/contact-roles')
  @Permissions('crm.opportunity.update')
  async assignContactRole(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() body: any) {
    return this.accountService.assignContactRole(req.user.tenantId, id, body.contactId, body.role);
  }

  @Delete('opportunities/:id/contact-roles/:contactId')
  @Permissions('crm.opportunity.update')
  async removeContactRole(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Param('contactId') contactId: string) {
    return this.accountService.removeContactRole(req.user.tenantId, id, contactId);
  }

  // CustomerHealthLog
  @Post('customers/:id/health')
  @Permissions('crm.customer.update')
  async logCustomerHealth(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() body: any) {
    return this.accountService.logCustomerHealth(req.user.tenantId, id, body.score, body.status, body.reason, req.user.userId);
  }

  @Get('customers/:id/health')
  @Permissions('crm.customer.read')
  async getCustomerHealthLogs(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.accountService.getCustomerHealthLogs(req.user.tenantId, id);
  }

  // Account Merge
  @Post('customers/merge')
  @Permissions('crm.customer.update')
  async mergeAccounts(@Req() req: AuthenticatedRequest, @Body() body: any) {
    return this.accountService.mergeAccounts(req.user.tenantId, body.sourceCustomerId, body.targetCustomerId);
  }
}
