import { Controller, Get, Post, Put, Patch, Delete, Param, Query, UseGuards, Req } from '@nestjs/common';
import { z } from 'zod';
import { ZodBody } from '../../common/decorators/zod-body.decorator';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { SaasExpansionService } from './saas-expansion.service';
import {
  CreateSaasAppSchema, CreateSaasAppVersionSchema, CreateSaasSubscriptionPlanSchema, CreateSaasSubscriptionSchema,
  CreateSaasUsageMeterSchema, RecordSaasUsageSchema, CreateSaasInvoiceSchema, CreateSaasPaymentSchema,
  CreateSaasFeatureFlagSchema, CreateSaasTenantSettingSchema, CreateSaasDomainSchema,
  CreateSaasWebhookEndpointSchema, CreateSaasApiKeySchema, CreateSaasSupportTicketSchema,
  CreateSaasSupportTicketMessageSchema, CreateSaasAnnouncementSchema, CreateSaasMaintenanceWindowSchema,
} from './dto/saas-expansion.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

interface AuthenticatedRequest extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[]; orgId?: string };
}

@ApiTags('saas')
@ApiBearerAuth()
@Controller('saas')
@UseGuards(JwtAuthGuard, RbacGuard)
export class SaasExpansionController {
  constructor(private readonly saasExpansionService: SaasExpansionService) {}

  // ═══ APP MARKETPLACE ═══

  @Get('exp/apps')
  @Permissions('saas.app.read')
  @ApiOperation({ summary: 'List marketplace apps' })
  async getApps(@Req() req: AuthenticatedRequest, @Query() query: any) {
    return this.saasExpansionService.getApps(req.user.tenantId, query);
  }

  @Get('exp/apps/:id')
  @Permissions('saas.app.read')
  @ApiOperation({ summary: 'Get app details' })
  async getAppById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.saasExpansionService.getAppById(req.user.tenantId, id);
  }

  @Post('exp/apps')
  @Permissions('saas.app.create')
  @ApiOperation({ summary: 'Create marketplace app' })
  async createApp(@Req() req: AuthenticatedRequest, @ZodBody(CreateSaasAppSchema) dto: any) {
    return this.saasExpansionService.createApp(req.user.tenantId, dto);
  }

  @Put('exp/apps/:id')
  @Permissions('saas.app.update')
  @ApiOperation({ summary: 'Update marketplace app' })
  async updateApp(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(CreateSaasAppSchema.partial()) dto: any) {
    return this.saasExpansionService.updateApp(req.user.tenantId, id, dto);
  }

  @Delete('exp/apps/:id')
  @Permissions('saas.app.delete')
  @ApiOperation({ summary: 'Unpublish app' })
  async deleteApp(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.saasExpansionService.deleteApp(req.user.tenantId, id);
  }

  @Post('exp/app-versions')
  @Permissions('saas.app.create')
  @ApiOperation({ summary: 'Create app version' })
  async createAppVersion(@Req() req: AuthenticatedRequest, @ZodBody(CreateSaasAppVersionSchema) dto: any) {
    return this.saasExpansionService.createAppVersion(req.user.tenantId, dto);
  }

  @Post('exp/apps/:appId/install')
  @Permissions('saas.app.install')
  @ApiOperation({ summary: 'Install app for tenant' })
  async installApp(@Req() req: AuthenticatedRequest, @Param('appId') appId: string, @ZodBody(z.object({ installingTenantId: z.string() })) dto: any) {
    return this.saasExpansionService.installApp(req.user.tenantId, appId, dto.installingTenantId, req.user.userId);
  }

  @Post('exp/installations/:id/uninstall')
  @Permissions('saas.app.uninstall')
  @ApiOperation({ summary: 'Uninstall app' })
  async uninstallApp(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.saasExpansionService.uninstallApp(req.user.tenantId, id);
  }

  // ═══ SUBSCRIPTION PLANS ═══

  @Get('exp/plans')
  @Permissions('saas.plan.read')
  @ApiOperation({ summary: 'List subscription plans' })
  async getSubscriptionPlans(@Req() req: AuthenticatedRequest) {
    return this.saasExpansionService.getSubscriptionPlans(req.user.tenantId);
  }

  @Post('exp/plans')
  @Permissions('saas.plan.create')
  @ApiOperation({ summary: 'Create subscription plan' })
  async createSubscriptionPlan(@Req() req: AuthenticatedRequest, @ZodBody(CreateSaasSubscriptionPlanSchema) dto: any) {
    return this.saasExpansionService.createSubscriptionPlan(req.user.tenantId, dto);
  }

  @Put('exp/plans/:id')
  @Permissions('saas.plan.update')
  @ApiOperation({ summary: 'Update subscription plan' })
  async updateSubscriptionPlan(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(CreateSaasSubscriptionPlanSchema.partial()) dto: any) {
    return this.saasExpansionService.updateSubscriptionPlan(req.user.tenantId, id, dto);
  }

  @Delete('exp/plans/:id')
  @Permissions('saas.plan.delete')
  @ApiOperation({ summary: 'Deactivate subscription plan' })
  async deleteSubscriptionPlan(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.saasExpansionService.deleteSubscriptionPlan(req.user.tenantId, id);
  }

  // ═══ SUBSCRIPTIONS ═══

  @Get('exp/subscriptions')
  @Permissions('saas.subscription.read')
  @ApiOperation({ summary: 'List subscriptions' })
  async getSubscriptions(@Req() req: AuthenticatedRequest, @Query() query: any) {
    return this.saasExpansionService.getSubscriptions(req.user.tenantId, query);
  }

  @Post('exp/subscriptions')
  @Permissions('saas.subscription.create')
  @ApiOperation({ summary: 'Create subscription' })
  async createSubscription(@Req() req: AuthenticatedRequest, @ZodBody(CreateSaasSubscriptionSchema) dto: any) {
    return this.saasExpansionService.createSubscription(req.user.tenantId, dto);
  }

  @Patch('exp/subscriptions/:id/status')
  @Permissions('saas.subscription.update')
  @ApiOperation({ summary: 'Update subscription status' })
  async updateSubscriptionStatus(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.object({ status: z.string(), reason: z.string().optional() })) dto: any) {
    return this.saasExpansionService.updateSubscriptionStatus(req.user.tenantId, id, dto.status, dto.reason);
  }

  // ═══ USAGE METERING ═══

  @Get('exp/usage-meters')
  @Permissions('saas.usage.read')
  @ApiOperation({ summary: 'List usage meters' })
  async getUsageMeters(@Req() req: AuthenticatedRequest) {
    return this.saasExpansionService.getUsageMeters(req.user.tenantId);
  }

  @Post('exp/usage-meters')
  @Permissions('saas.usage.create')
  @ApiOperation({ summary: 'Create usage meter' })
  async createUsageMeter(@Req() req: AuthenticatedRequest, @ZodBody(CreateSaasUsageMeterSchema) dto: any) {
    return this.saasExpansionService.createUsageMeter(req.user.tenantId, dto);
  }

  @Post('exp/usage/record')
  @Permissions('saas.usage.create')
  @ApiOperation({ summary: 'Record usage' })
  async recordUsage(@Req() req: AuthenticatedRequest, @ZodBody(RecordSaasUsageSchema) dto: any) {
    return this.saasExpansionService.recordUsage(req.user.tenantId, dto);
  }

  @Get('exp/subscriptions/:subscriptionId/usage')
  @Permissions('saas.usage.read')
  @ApiOperation({ summary: 'Get usage records for subscription' })
  async getUsageRecords(@Req() req: AuthenticatedRequest, @Param('subscriptionId') subscriptionId: string, @Query('meterId') meterId?: string) {
    return this.saasExpansionService.getUsageRecords(req.user.tenantId, subscriptionId, meterId);
  }

  // ═══ INVOICES & PAYMENTS ═══

  @Get('exp/invoices')
  @Permissions('saas.invoice.read')
  @ApiOperation({ summary: 'List invoices' })
  async getInvoices(@Req() req: AuthenticatedRequest, @Query() query: any) {
    return this.saasExpansionService.getInvoices(req.user.tenantId, query);
  }

  @Post('exp/invoices')
  @Permissions('saas.invoice.create')
  @ApiOperation({ summary: 'Create invoice' })
  async createInvoice(@Req() req: AuthenticatedRequest, @ZodBody(CreateSaasInvoiceSchema) dto: any) {
    return this.saasExpansionService.createInvoice(req.user.tenantId, dto);
  }

  @Post('exp/payments')
  @Permissions('saas.payment.create')
  @ApiOperation({ summary: 'Record payment' })
  async recordPayment(@Req() req: AuthenticatedRequest, @ZodBody(CreateSaasPaymentSchema) dto: any) {
    return this.saasExpansionService.recordPayment(req.user.tenantId, dto);
  }

  @Get('exp/saas-coupons')
  @Permissions('saas.coupon.read')
  @ApiOperation({ summary: 'List SaaS coupons' })
  async getCoupons(@Req() req: AuthenticatedRequest) {
    return this.saasExpansionService.getCoupons(req.user.tenantId);
  }

  @Post('exp/saas-coupons')
  @Permissions('saas.coupon.create')
  @ApiOperation({ summary: 'Create SaaS coupon' })
  async createCoupon(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ code: z.string(), description: z.string().optional(), type: z.enum(['PERCENTAGE', 'FIXED', 'FREE_MONTH']), value: z.number(), maxRedemptions: z.number().int().optional(), appliesTo: z.string().default('ALL'), validFrom: z.string().optional(), validTo: z.string().optional() })) dto: any) {
    return this.saasExpansionService.createCoupon(req.user.tenantId, dto);
  }

  // ═══ FEATURE FLAGS ═══

  @Get('exp/feature-flags')
  @Permissions('saas.feature-flag.read')
  @ApiOperation({ summary: 'List feature flags' })
  async getFeatureFlags(@Req() req: AuthenticatedRequest) {
    return this.saasExpansionService.getFeatureFlags(req.user.tenantId);
  }

  @Post('exp/feature-flags')
  @Permissions('saas.feature-flag.create')
  @ApiOperation({ summary: 'Create feature flag' })
  async createFeatureFlag(@Req() req: AuthenticatedRequest, @ZodBody(CreateSaasFeatureFlagSchema) dto: any) {
    return this.saasExpansionService.createFeatureFlag(req.user.tenantId, dto);
  }

  @Patch('exp/feature-flags/:id/toggle')
  @Permissions('saas.feature-flag.update')
  @ApiOperation({ summary: 'Toggle feature flag' })
  async toggleFeatureFlag(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.object({ isEnabled: z.boolean() })) dto: any) {
    return this.saasExpansionService.toggleFeatureFlag(req.user.tenantId, id, dto.isEnabled);
  }

  // ═══ TENANT SETTINGS ═══

  @Get('exp/tenant-settings')
  @Permissions('saas.tenant-settings.read')
  @ApiOperation({ summary: 'Get tenant settings' })
  async getTenantSettings(@Req() req: AuthenticatedRequest, @Query('category') category?: string) {
    return this.saasExpansionService.getTenantSettings(req.user.tenantId, category);
  }

  @Post('exp/tenant-settings')
  @Permissions('saas.tenant-settings.update')
  @ApiOperation({ summary: 'Upsert tenant setting' })
  async upsertTenantSetting(@Req() req: AuthenticatedRequest, @ZodBody(CreateSaasTenantSettingSchema) dto: any) {
    return this.saasExpansionService.upsertTenantSetting(req.user.tenantId, dto);
  }

  @Delete('exp/tenant-settings/:category/:key')
  @Permissions('saas.tenant-settings.update')
  @ApiOperation({ summary: 'Delete tenant setting' })
  async deleteTenantSetting(@Req() req: AuthenticatedRequest, @Param('category') category: string, @Param('key') key: string) {
    return this.saasExpansionService.deleteTenantSetting(req.user.tenantId, category, key);
  }

  // ═══ DOMAINS ═══

  @Get('exp/domains')
  @Permissions('saas.domain.read')
  @ApiOperation({ summary: 'List tenant domains' })
  async getDomains(@Req() req: AuthenticatedRequest) {
    return this.saasExpansionService.getDomains(req.user.tenantId);
  }

  @Post('exp/domains')
  @Permissions('saas.domain.create')
  @ApiOperation({ summary: 'Add domain' })
  async addDomain(@Req() req: AuthenticatedRequest, @ZodBody(CreateSaasDomainSchema) dto: any) {
    return this.saasExpansionService.addDomain(req.user.tenantId, dto);
  }

  @Post('exp/domains/:id/verify')
  @Permissions('saas.domain.update')
  @ApiOperation({ summary: 'Verify domain' })
  async verifyDomain(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.saasExpansionService.verifyDomain(req.user.tenantId, id);
  }

  @Delete('exp/domains/:id')
  @Permissions('saas.domain.delete')
  @ApiOperation({ summary: 'Delete domain' })
  async deleteDomain(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.saasExpansionService.deleteDomain(req.user.tenantId, id);
  }

  // ═══ AUDIT LOG ═══

  @Get('exp/audit-logs')
  @Permissions('saas.audit-log.read')
  @ApiOperation({ summary: 'Query audit logs' })
  async getAuditLogs(@Req() req: AuthenticatedRequest, @Query() query: any) {
    return this.saasExpansionService.getAuditLogs(req.user.tenantId, query);
  }

  // ═══ WEBHOOKS ═══

  @Get('exp/webhook-endpoints')
  @Permissions('saas.webhook.read')
  @ApiOperation({ summary: 'List webhook endpoints' })
  async getWebhookEndpoints(@Req() req: AuthenticatedRequest) {
    return this.saasExpansionService.getWebhookEndpoints(req.user.tenantId);
  }

  @Post('exp/webhook-endpoints')
  @Permissions('saas.webhook.create')
  @ApiOperation({ summary: 'Create webhook endpoint' })
  async createWebhookEndpoint(@Req() req: AuthenticatedRequest, @ZodBody(CreateSaasWebhookEndpointSchema) dto: any) {
    return this.saasExpansionService.createWebhookEndpoint(req.user.tenantId, dto);
  }

  @Put('exp/webhook-endpoints/:id')
  @Permissions('saas.webhook.update')
  @ApiOperation({ summary: 'Update webhook endpoint' })
  async updateWebhookEndpoint(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(CreateSaasWebhookEndpointSchema.partial()) dto: any) {
    return this.saasExpansionService.updateWebhookEndpoint(req.user.tenantId, id, dto);
  }

  @Delete('exp/webhook-endpoints/:id')
  @Permissions('saas.webhook.delete')
  @ApiOperation({ summary: 'Delete webhook endpoint' })
  async deleteWebhookEndpoint(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.saasExpansionService.deleteWebhookEndpoint(req.user.tenantId, id);
  }

  @Get('exp/webhook-endpoints/:id/deliveries')
  @Permissions('saas.webhook.read')
  @ApiOperation({ summary: 'Get webhook deliveries' })
  async getWebhookDeliveries(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Query() query: any) {
    return this.saasExpansionService.getWebhookDeliveries(req.user.tenantId, id, query);
  }

  // ═══ API KEYS ═══

  @Get('exp/api-keys')
  @Permissions('saas.api-key.read')
  @ApiOperation({ summary: 'List API keys' })
  async getApiKeys(@Req() req: AuthenticatedRequest) {
    return this.saasExpansionService.getApiKeys(req.user.tenantId);
  }

  @Post('exp/api-keys')
  @Permissions('saas.api-key.create')
  @ApiOperation({ summary: 'Create API key' })
  async createApiKey(@Req() req: AuthenticatedRequest, @ZodBody(CreateSaasApiKeySchema) dto: any) {
    return this.saasExpansionService.createApiKey(req.user.tenantId, dto, req.user.userId);
  }

  @Post('exp/api-keys/:id/revoke')
  @Permissions('saas.api-key.revoke')
  @ApiOperation({ summary: 'Revoke API key' })
  async revokeApiKey(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.saasExpansionService.revokeApiKey(req.user.tenantId, id);
  }

  // ═══ SUPPORT TICKETS ═══

  @Get('exp/support-tickets')
  @Permissions('saas.support-ticket.read')
  @ApiOperation({ summary: 'List support tickets' })
  async getSupportTickets(@Req() req: AuthenticatedRequest, @Query() query: any) {
    return this.saasExpansionService.getSupportTickets(req.user.tenantId, query);
  }

  @Get('exp/support-tickets/:id')
  @Permissions('saas.support-ticket.read')
  @ApiOperation({ summary: 'Get support ticket' })
  async getSupportTicketById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.saasExpansionService.getSupportTicketById(req.user.tenantId, id);
  }

  @Post('exp/support-tickets')
  @Permissions('saas.support-ticket.create')
  @ApiOperation({ summary: 'Create support ticket' })
  async createSupportTicket(@Req() req: AuthenticatedRequest, @ZodBody(CreateSaasSupportTicketSchema) dto: any) {
    return this.saasExpansionService.createSupportTicket(req.user.tenantId, dto, req.user.userId);
  }

  @Patch('exp/support-tickets/:id/status')
  @Permissions('saas.support-ticket.update')
  @ApiOperation({ summary: 'Update ticket status' })
  async updateSupportTicketStatus(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.object({ status: z.string() })) dto: any) {
    return this.saasExpansionService.updateSupportTicketStatus(req.user.tenantId, id, dto.status, req.user.userId);
  }

  @Post('exp/support-tickets/messages')
  @Permissions('saas.support-ticket.create')
  @ApiOperation({ summary: 'Add message to ticket' })
  async addTicketMessage(@Req() req: AuthenticatedRequest, @ZodBody(CreateSaasSupportTicketMessageSchema) dto: any) {
    return this.saasExpansionService.addTicketMessage(req.user.tenantId, dto, req.user.userId);
  }

  // ═══ ANNOUNCEMENTS ═══

  @Get('exp/announcements')
  @Permissions('saas.announcement.read')
  @ApiOperation({ summary: 'List active announcements' })
  async getAnnouncements(@Req() req: AuthenticatedRequest) {
    return this.saasExpansionService.getAnnouncements(req.user.tenantId);
  }

  @Post('exp/announcements')
  @Permissions('saas.announcement.create')
  @ApiOperation({ summary: 'Create announcement' })
  async createAnnouncement(@Req() req: AuthenticatedRequest, @ZodBody(CreateSaasAnnouncementSchema) dto: any) {
    return this.saasExpansionService.createAnnouncement(req.user.tenantId, dto, req.user.userId);
  }

  @Delete('exp/announcements/:id')
  @Permissions('saas.announcement.delete')
  @ApiOperation({ summary: 'Delete announcement' })
  async deleteAnnouncement(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.saasExpansionService.deleteAnnouncement(req.user.tenantId, id);
  }

  // ═══ MAINTENANCE WINDOWS ═══

  @Get('exp/maintenance-windows')
  @Permissions('saas.maintenance.read')
  @ApiOperation({ summary: 'List maintenance windows' })
  async getMaintenanceWindows(@Req() req: AuthenticatedRequest) {
    return this.saasExpansionService.getMaintenanceWindows(req.user.tenantId);
  }

  @Post('exp/maintenance-windows')
  @Permissions('saas.maintenance.create')
  @ApiOperation({ summary: 'Schedule maintenance window' })
  async createMaintenanceWindow(@Req() req: AuthenticatedRequest, @ZodBody(CreateSaasMaintenanceWindowSchema) dto: any) {
    return this.saasExpansionService.createMaintenanceWindow(req.user.tenantId, dto, req.user.userId);
  }

  @Patch('exp/maintenance-windows/:id/status')
  @Permissions('saas.maintenance.update')
  @ApiOperation({ summary: 'Update maintenance window status' })
  async updateMaintenanceWindowStatus(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.object({ status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']) })) dto: any) {
    return this.saasExpansionService.updateMaintenanceWindowStatus(req.user.tenantId, id, dto.status);
  }

  // ═══ AUDIT LOG HELPER ═══

  @Post('exp/audit-log')
  @Permissions('saas.audit-log.read')
  @ApiOperation({ summary: 'Log an audit event' })
  async logAudit(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ action: z.string(), resource: z.string().optional(), resourceId: z.string().optional(), details: z.any().optional() })) dto: any) {
    return this.saasExpansionService.logAudit(req.user.tenantId, req.user.userId, dto.action, dto.resource, dto.resourceId, dto.details, req.ip, req.headers['user-agent']);
  }
}
