import { Controller, Get, Post, Param, Query, Req, UseGuards, Body } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CrmIntelligenceService } from './crm-intelligence.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
    user: { tenantId: string; userId: string; email: string; roles: string[]; orgId?: string };
}

@ApiTags('crm-intelligence')
@ApiBearerAuth()
@Controller('crm')
@UseGuards(JwtAuthGuard, RbacGuard)
export class CrmIntelligenceController {
    constructor(private readonly intelligenceService: CrmIntelligenceService) { }

    // ── FEATURE F: PREDICTIVE LEAD SCORING ───────────────

    @ApiOperation({ summary: 'Get ML models' })
    @Get('ml-models')
    @Permissions('crm.lead-scoring.read')
    async getMlModels(@Req() req: AuthenticatedRequest) {
        return { data: await this.intelligenceService.getMlModels(req.user.tenantId) };
    }

    @ApiOperation({ summary: 'Train lead scoring ML model' })
    @Post('ml-models/train')
    @Permissions('crm.lead-scoring.create')
    async trainLeadScoringModel(@Req() req: AuthenticatedRequest) {
        return { data: await this.intelligenceService.trainLeadScoringModel(req.user.tenantId, req.user.userId) };
    }

    @ApiOperation({ summary: 'Get lead scoring factors (top-3)' })
    @Get('leads/:id/scoring-factors')
    @Permissions('crm.lead.read')
    async getLeadScoringFactors(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
        return { data: await this.intelligenceService.getLeadScoringFactors(req.user.tenantId, id) };
    }

    // ── FEATURE G: CUSTOMER JOURNEY MAPPING ─────────────

    @ApiOperation({ summary: 'Get journey timeline for entity' })
    @Get('journey/:entityType/:entityId')
    @Permissions('crm.contact.read')
    async getJourneyTimeline(
        @Req() req: AuthenticatedRequest,
        @Param('entityType') entityType: string,
        @Param('entityId') entityId: string,
    ) {
        return { data: await this.intelligenceService.getJourneyTimeline(req.user.tenantId, entityType, entityId) };
    }

    @ApiOperation({ summary: 'Calculate attribution for opportunity' })
    @Get('opportunities/:id/attribution')
    @Permissions('crm.opportunity.read')
    async calculateAttribution(
        @Req() req: AuthenticatedRequest,
        @Param('id') id: string,
        @Query('model') model: 'first_touch' | 'last_touch' | 'linear' | 'time_decay' | 'u_shaped' = 'linear',
    ) {
        return { data: await this.intelligenceService.calculateAttribution(req.user.tenantId, id, model) };
    }

    // ── FEATURE H: CONVERSATION INTELLIGENCE ────────────

    @ApiOperation({ summary: 'Analyze sentiment for entity' })
    @Get('sentiment/:entityType/:entityId')
    @Permissions('crm.contact.read')
    async analyzeSentiment(
        @Req() req: AuthenticatedRequest,
        @Param('entityType') entityType: string,
        @Param('entityId') entityId: string,
    ) {
        return { data: await this.intelligenceService.analyzeSentiment(req.user.tenantId, entityType, entityId) };
    }

    @ApiOperation({ summary: 'Get deal health indicator' })
    @Get('opportunities/:id/deal-health')
    @Permissions('crm.opportunity.read')
    async getDealHealth(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
        return { data: await this.intelligenceService.getDealHealth(req.user.tenantId, id) };
    }

    // ── FEATURE I: CUSTOMER HEALTH & CHURN ──────────────

    @ApiOperation({ summary: 'Get customer health score' })
    @Get('customers/:id/health')
    @Permissions('crm.contact.read')
    async getCustomerHealth(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
        return { data: await this.intelligenceService.getCustomerHealth(req.user.tenantId, id) };
    }

    @ApiOperation({ summary: 'Get at-risk customers dashboard' })
    @Get('customers/at-risk')
    @Permissions('crm.contact.read')
    async getAtRiskCustomers(@Req() req: AuthenticatedRequest, @Query('threshold') threshold?: string) {
        return { data: await this.intelligenceService.getAtRiskCustomers(req.user.tenantId, threshold ? Number(threshold) : undefined) };
    }

    // ── FEATURE J: ADVANCED DEAL INTELLIGENCE ───────────

    @ApiOperation({ summary: 'Get deal velocity analysis' })
    @Get('analytics/deal-velocity')
    @Permissions('crm.report.read')
    async getDealVelocityAnalysis(@Req() req: AuthenticatedRequest) {
        return { data: await this.intelligenceService.getDealVelocityAnalysis(req.user.tenantId) };
    }

    // ── FEATURE M: CUSTOMER LIFETIME VALUE ──────────────

    @ApiOperation({ summary: 'Get customer lifetime value' })
    @Get('customers/:id/clv')
    @Permissions('crm.contact.read')
    async getCustomerLifetimeValue(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
        return { data: await this.intelligenceService.getCustomerLifetimeValue(req.user.tenantId, id) };
    }

    // ── FEATURE N: SOCIAL CRM & WEB INTELLIGENCE ────────

    @ApiOperation({ summary: 'Enrich social profile for entity' })
    @Post('social-enrich/:entityType/:entityId')
    @Permissions('crm.contact.create')
    async enrichSocialProfile(
        @Req() req: AuthenticatedRequest,
        @Param('entityType') entityType: string,
        @Param('entityId') entityId: string,
    ) {
        return { data: await this.intelligenceService.enrichSocialProfile(req.user.tenantId, entityType, entityId) };
    }

    @ApiOperation({ summary: 'Get intent signals for account' })
    @Get('customers/:id/intent-signals')
    @Permissions('crm.contact.read')
    async getIntentSignals(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
        return { data: await this.intelligenceService.getIntentSignals(req.user.tenantId, id) };
    }

    // ── FEATURE K: PARTNER RELATIONSHIP MANAGEMENT ──────

    @ApiOperation({ summary: 'Get partner performance' })
    @Get('partners/performance')
    @Permissions('crm.contact.read')
    async getPartnerPerformance(@Req() req: AuthenticatedRequest, @Query('partnerId') partnerId?: string) {
        return { data: await this.intelligenceService.getPartnerPerformance(req.user.tenantId, partnerId) };
    }

    @ApiOperation({ summary: 'Register partner lead' })
    @Post('partners/lead')
    @Permissions('crm.lead.create')
    async registerPartnerLead(
        @Req() req: AuthenticatedRequest,
        @Body() body: { partnerId: string; firstName: string; lastName: string; company: string; email: string; phone?: string; notes?: string }
    ) {
        return { data: await this.intelligenceService.registerPartnerLead(req.user.tenantId, req.user.orgId || 'org-system-default', body) };
    }

    @ApiOperation({ summary: 'Get partner MDF summary' })
    @Get('partners/:id/mdf')
    @Permissions('crm.contact.read')
    async getPartnerMdfSummary(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
        return { data: await this.intelligenceService.getPartnerMdfSummary(req.user.tenantId, id) };
    }

    // ── FEATURE L: EMAIL CAMPAIGN INTELLIGENCE ──────────

    @ApiOperation({ summary: 'Get campaign intelligence analytics' })
    @Get('campaigns-analytics')
    @Permissions('crm.report.read')
    async getEmailCampaignAnalytics(@Req() req: AuthenticatedRequest, @Query('campaignId') campaignId?: string) {
        return { data: await this.intelligenceService.getEmailCampaignAnalytics(req.user.tenantId, campaignId) };
    }

    @ApiOperation({ summary: 'Get send time optimization' })
    @Get('campaigns-analytics/send-time')
    @Permissions('crm.report.read')
    async getSendTimeOptimization() {
        return { data: await this.intelligenceService.getSendTimeOptimization() };
    }

    @ApiOperation({ summary: 'Get email A/B test results' })
    @Get('campaigns-analytics/:id/ab-test')
    @Permissions('crm.report.read')
    async getEmailAbTestResults(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
        return { data: await this.intelligenceService.getEmailAbTestResults(req.user.tenantId, id) };
    }
}