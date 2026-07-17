import { Controller, Get, Param, Query, UseGuards, Req, Post, Body, Delete, Put } from '@nestjs/common';
import { Request } from 'express';
import { z } from 'zod';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ZodBody } from '../../common/decorators/zod-body.decorator';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

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

const createForecastSnapshotSchema = z.object({
  name: z.string().min(1),
  periodStart: z.coerce.date(),
  periodEnd: z.coerce.date(),
  quotaAmount: z.number(),
  pipelineAmount: z.number(),
  wonAmount: z.number(),
  forecastAmount: z.number(),
});
const createQuotaSchema = z.object({
  userId: z.string(),
  period: z.string().min(1),
  amount: z.number(),
});
const addDealTeamMemberSchema = z.object({
  userId: z.string(),
  role: z.string(),
  accessLevel: z.string().optional(),
});
const createAccountPlanSchema = z.object({
  customerId: z.string(),
  name: z.string().min(1),
  objectives: z.string().optional(),
});
const assignContactRoleSchema = z.object({
  contactId: z.string(),
  role: z.string(),
});
const logCustomerHealthSchema = z.object({
  score: z.number(),
  status: z.string(),
  reason: z.string().optional(),
});
const mergeAccountsSchema = z.object({
  sourceCustomerId: z.string(),
  targetCustomerId: z.string(),
});
type CreateForecastSnapshotInput = z.infer<typeof createForecastSnapshotSchema>;
type CreateQuotaInput = z.infer<typeof createQuotaSchema>;
type AddDealTeamMemberInput = z.infer<typeof addDealTeamMemberSchema>;
type CreateAccountPlanInput = z.infer<typeof createAccountPlanSchema>;
type AssignContactRoleInput = z.infer<typeof assignContactRoleSchema>;
type LogCustomerHealthInput = z.infer<typeof logCustomerHealthSchema>;
type MergeAccountsInput = z.infer<typeof mergeAccountsSchema>;

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
  @ApiOperation({ summary: 'Get Deal Score' })
  @Get('deal-score/:id')
  @Permissions('crm.opportunity.read')
  async getDealScore(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.forecastingService.calculateDealScore(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Get Rotting Deals' })
  @Get('rotting-deals')
  @Permissions('crm.opportunity.read')
  async getRottingDeals(@Req() req: AuthenticatedRequest, @Query('days') days?: string) {
    return this.forecastingService.getRottingDeals(req.user.tenantId, days ? Number(days) : 14);
  }

  @ApiOperation({ summary: 'Get Deal Velocity' })
  @Get('deal-velocity')
  @Permissions('crm.opportunity.read')
  async getDealVelocity(@Req() req: AuthenticatedRequest) {
    return this.forecastingService.getDealVelocity(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Get Revenue Waterfall' })
  @Get('revenue-waterfall')
  @Permissions('crm.opportunity.read')
  async getRevenueWaterfall(@Req() req: AuthenticatedRequest) {
    return this.forecastingService.getRevenueWaterfall(req.user.tenantId);
  }

  // ── GROUP 2: CONTACT & ACCOUNT ───────────────────────
  @ApiOperation({ summary: 'Get Influence Map' })
  @Get('influence-map/:customerId')
  @Permissions('crm.contact.read')
  async getInfluenceMap(@Req() req: AuthenticatedRequest, @Param('customerId') customerId: string) {
    return this.accountService.getInfluenceMap(req.user.tenantId, customerId);
  }

  @ApiOperation({ summary: 'Get Health Score' })
  @Get('health-score/:customerId')
  @Permissions('crm.customer.read')
  async getHealthScore(@Req() req: AuthenticatedRequest, @Param('customerId') customerId: string) {
    return this.accountService.getCustomerHealthScore(req.user.tenantId, customerId);
  }

  @ApiOperation({ summary: 'Get Risk Alerts' })
  @Get('risk-alerts')
  @Permissions('crm.customer.read')
  async getRiskAlerts(@Req() req: AuthenticatedRequest) {
    return this.accountService.getCustomerRiskAlerts(req.user.tenantId);
  }

  // ── GROUP 3: CAMPAIGNS ──────────────────────────────
  @ApiOperation({ summary: 'Get Marketing Funnel' })
  @Get('marketing-funnel')
  @Permissions('crm.campaign.read')
  async getMarketingFunnel(@Req() req: AuthenticatedRequest) {
    return this.campaignService.getMarketingFunnel(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Get Marketing Dashboard' })
  @Get('marketing-dashboard')
  @Permissions('crm.campaign.read')
  async getMarketingDashboard(@Req() req: AuthenticatedRequest) {
    return this.campaignService.getMarketingDashboardKPIs(req.user.tenantId);
  }

  // ── GROUP 6: SUPPORT ────────────────────────────────
  @ApiOperation({ summary: 'Get Sla Calendar' })
  @Get('sla-calendar')
  @Permissions('crm.case.read')
  async getSlaCalendar(@Req() req: AuthenticatedRequest) {
    return this.supportService.getSlaCalendar(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Get Ticket Analytics' })
  @Get('ticket-analytics')
  @Permissions('crm.case.read')
  async getTicketAnalytics(@Req() req: AuthenticatedRequest) {
    return this.supportService.getTicketAnalytics(req.user.tenantId);
  }

  // ── GROUP 7: ENABLEMENT ─────────────────────────────
  @ApiOperation({ summary: 'Get Objections' })
  @Get('objection-database')
  @Permissions('crm.playbook.read')
  async getObjections(@Req() req: AuthenticatedRequest, @Query('q') q?: string) {
    return this.enablementService.getObjections(req.user.tenantId, q);
  }

  @ApiOperation({ summary: 'Get Leaderboard' })
  @Get('gamification-leaderboard')
  @Permissions('crm.sales-target.read')
  async getLeaderboard(@Req() req: AuthenticatedRequest) {
    return this.enablementService.getLeaderboard(req.user.tenantId);
  }

  // ── GROUP 8: REVOPS ─────────────────────────────────
  @ApiOperation({ summary: 'Get Rev Ops Metrics' })
  @Get('revops-metrics')
  @Permissions('crm.sales-target.read')
  async getRevOpsMetrics(@Req() req: AuthenticatedRequest) {
    return this.revOpsService.getRevOpsMetrics(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Get Commissions' })
  @Get('commissions')
  @Permissions('crm.commission.read')
  async getCommissions(@Req() req: AuthenticatedRequest) {
    return this.revOpsService.getCommissions(req.user.tenantId);
  }

  // ── GROUP 9: PARTNERS ───────────────────────────────
  @ApiOperation({ summary: 'Get Partners' })
  @Get('partners')
  @Permissions('crm.partner.read')
  async getPartners(@Req() req: AuthenticatedRequest) {
    return this.partnersService.getPartners(req.user.tenantId);
  }

  // ── GROUP 10: AUTOMATION ────────────────────────────
  @ApiOperation({ summary: 'Get Workflows' })
  @Get('workflows')
  @Permissions('crm.workflow.read')
  async getWorkflows(@Req() req: AuthenticatedRequest) {
    return this.automationService.getWorkflows(req.user.tenantId);
  }

  // ── Batch 1 Extra Endpoints ──────────────────────────

  // ForecastSnapshot
  @ApiOperation({ summary: 'Create Forecast Snapshot' })
  @Post('forecast-snapshots')
  @Permissions('crm.opportunity.update')
  async createForecastSnapshot(@Req() req: AuthenticatedRequest, @ZodBody(createForecastSnapshotSchema) body: CreateForecastSnapshotInput) {
    const orgId = req.user.orgId || 'default-org';
    return this.forecastingService.createForecastSnapshot(req.user.tenantId, orgId, body);
  }

  @ApiOperation({ summary: 'Get Forecast Snapshots' })
  @Get('forecast-snapshots')
  @Permissions('crm.opportunity.read')
  async getForecastSnapshots(@Req() req: AuthenticatedRequest) {
    const orgId = req.user.orgId || 'default-org';
    return this.forecastingService.getForecastSnapshotsList(req.user.tenantId, orgId);
  }

  @ApiOperation({ summary: 'Freeze Forecast Snapshot' })
  @Put('forecast-snapshots/:id/freeze')
  @Permissions('crm.opportunity.update')
  async freezeForecastSnapshot(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.forecastingService.freezeForecastSnapshot(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Adjust Forecast' })
  @Put('forecast-snapshots/:id/adjust')
  @Permissions('crm.opportunity.update')
  async adjustForecast(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body('amount') amount: number) {
    return this.forecastingService.adjustForecast(req.user.tenantId, id, amount);
  }

  // Quota
  @ApiOperation({ summary: 'Create Quota' })
  @Post('quotas')
  @Permissions('crm.sales-target.update')
  async createQuota(@Req() req: AuthenticatedRequest, @ZodBody(createQuotaSchema) body: CreateQuotaInput) {
    const orgId = req.user.orgId || 'default-org';
    return this.forecastingService.createQuota(req.user.tenantId, orgId, body);
  }

  @ApiOperation({ summary: 'Get Quotas' })
  @Get('quotas')
  @Permissions('crm.sales-target.read')
  async getQuotas(@Req() req: AuthenticatedRequest) {
    const orgId = req.user.orgId || 'default-org';
    return this.forecastingService.getQuotasList(req.user.tenantId, orgId);
  }

  // DealTag
  @ApiOperation({ summary: 'Add Deal Tag' })
  @Post('opportunities/:id/tags')
  @Permissions('crm.opportunity.update')
  async addDealTag(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body('tag') tag: string) {
    return this.forecastingService.addDealTag(req.user.tenantId, id, tag);
  }

  @ApiOperation({ summary: 'Remove Deal Tag' })
  @Delete('opportunities/:id/tags/:tag')
  @Permissions('crm.opportunity.update')
  async removeDealTag(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Param('tag') tag: string) {
    return this.forecastingService.removeDealTag(req.user.tenantId, id, tag);
  }

  // DealTeamMember
  @ApiOperation({ summary: 'Add Deal Team Member' })
  @Post('opportunities/:id/team')
  @Permissions('crm.opportunity.update')
  async addDealTeamMember(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(addDealTeamMemberSchema) body: AddDealTeamMemberInput) {
    return this.forecastingService.addDealTeamMember(req.user.tenantId, id, body.userId, body.role, body.accessLevel);
  }

  @ApiOperation({ summary: 'Remove Deal Team Member' })
  @Delete('opportunities/:id/team/:userId')
  @Permissions('crm.opportunity.update')
  async removeDealTeamMember(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Param('userId') userId: string) {
    return this.forecastingService.removeDealTeamMember(req.user.tenantId, id, userId);
  }

  // AccountPlan
  @ApiOperation({ summary: 'Create Account Plan' })
  @Post('account-plans')
  @Permissions('crm.customer.update')
  async createAccountPlan(@Req() req: AuthenticatedRequest, @ZodBody(createAccountPlanSchema) body: CreateAccountPlanInput) {
    const orgId = req.user.orgId || 'default-org';
    return this.accountService.createAccountPlan(req.user.tenantId, orgId, body);
  }

  @ApiOperation({ summary: 'Get Account Plans' })
  @Get('account-plans')
  @Permissions('crm.customer.read')
  async getAccountPlans(@Req() req: AuthenticatedRequest) {
    const orgId = req.user.orgId || 'default-org';
    return this.accountService.getAccountPlans(req.user.tenantId, orgId);
  }

  // ContactRole
  @ApiOperation({ summary: 'Assign Contact Role' })
  @Post('opportunities/:id/contact-roles')
  @Permissions('crm.opportunity.update')
  async assignContactRole(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(assignContactRoleSchema) body: AssignContactRoleInput) {
    return this.accountService.assignContactRole(req.user.tenantId, id, body.contactId, body.role);
  }

  @ApiOperation({ summary: 'Remove Contact Role' })
  @Delete('opportunities/:id/contact-roles/:contactId')
  @Permissions('crm.opportunity.update')
  async removeContactRole(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Param('contactId') contactId: string) {
    return this.accountService.removeContactRole(req.user.tenantId, id, contactId);
  }

  // CustomerHealthLog
  @ApiOperation({ summary: 'Log Customer Health' })
  @Post('customers/:id/health')
  @Permissions('crm.customer.update')
  async logCustomerHealth(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(logCustomerHealthSchema) body: LogCustomerHealthInput) {
    return this.accountService.logCustomerHealth(req.user.tenantId, id, body.score, body.status, body.reason, req.user.userId);
  }

  @ApiOperation({ summary: 'Get Customer Health Logs' })
  @Get('customers/:id/health')
  @Permissions('crm.customer.read')
  async getCustomerHealthLogs(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.accountService.getCustomerHealthLogs(req.user.tenantId, id);
  }

  // Account Merge
  @ApiOperation({ summary: 'Merge Accounts' })
  @Post('customers/merge')
  @Permissions('crm.customer.update')
  async mergeAccounts(@Req() req: AuthenticatedRequest, @ZodBody(mergeAccountsSchema) body: MergeAccountsInput) {
    return this.accountService.mergeAccounts(req.user.tenantId, body.sourceCustomerId, body.targetCustomerId);
  }

  // ── Account hierarchy & rollups (Up Next item 49) ────
  @ApiOperation({ summary: 'Get Account Hierarchy Real' })
  @Get('customers/:customerId/hierarchy')
  @Permissions('crm.customer.read')
  async getAccountHierarchyReal(@Req() req: AuthenticatedRequest, @Param('customerId') customerId: string) {
    return this.accountService.getAccountHierarchy(req.user.tenantId, customerId);
  }

  @ApiOperation({ summary: 'Set Parent Account' })
  @Put('customers/:customerId/parent')
  @Permissions('crm.customer.update')
  async setParentAccount(@Req() req: AuthenticatedRequest, @Param('customerId') customerId: string, @Body('parentCustomerId') parentCustomerId: string | null) {
    return this.accountService.setParentAccount(req.user.tenantId, customerId, parentCustomerId ?? null);
  }

  @ApiOperation({ summary: 'Get Hierarchy Tree' })
  @Get('customers/:customerId/hierarchy-tree')
  @Permissions('crm.customer.read')
  async getHierarchyTree(@Req() req: AuthenticatedRequest, @Param('customerId') customerId: string) {
    return this.accountService.getHierarchyTree(req.user.tenantId, customerId);
  }

  @ApiOperation({ summary: 'Get Hierarchy Rollup' })
  @Get('customers/:customerId/hierarchy-rollup')
  @Permissions('crm.customer.read')
  async getHierarchyRollup(@Req() req: AuthenticatedRequest, @Param('customerId') customerId: string) {
    return this.accountService.getHierarchyRollup(req.user.tenantId, customerId);
  }
}
