import { Controller, Get, Post, Param, Query, UseGuards, UseInterceptors, Req } from '@nestjs/common';
import { z } from 'zod';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ZodBody } from '../../../common/decorators/zod-body.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../../common/guards/rbac.guard';
import { TenantInterceptor } from '../../../common/guards/tenant.interceptor';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { TrackChanges } from '../../../common/decorators/track-changes.decorator';
import { ChangeHistoryInterceptor } from '../../../common/interceptors/change-history.interceptor';
import { SaasPortalSubscriptionService } from '../services/subscription.service';

interface AuthenticatedRequest extends Request {
  user: { tenantId: string; userId: string; email: string; firstName: string; lastName: string; roles: string[] };
}

const changePlanSchema = z.object({ planId: z.string().min(1) });
const updateSeatsSchema = z.object({ seats: z.number().int().min(1) });
const generateInvoiceSchema = z.object({
  planId: z.string().min(1),
  amount: z.number().min(0),
  currency: z.string().optional(),
  description: z.string().optional(),
  dueDate: z.string().optional(),
});

/**
 * SaaS Portal home for subscription lifecycle + invoices. Consolidates the
 * read/admin-facing halves of `saas/subscription-lifecycle.controller.ts`,
 * `saas/invoice-engine.controller.ts`, and `admin/subscription.controller.ts`
 * (platform-admin plan/seat assignment) into `/saas-portal/subscription`.
 * See services/subscription.service.ts header for the full
 * delegate-vs-duplicate rationale (webhook signature verification and the
 * realtime gateway are untouched and out of scope). Independent
 * implementation, not a cross-module delegate. Reuses the existing
 * `saas.subscription.*`, `saas.invoice.*`, and `admin.subscription.*`
 * permission codes.
 */
@ApiTags('saas-portal')
@ApiBearerAuth()
@Controller('saas-portal/subscription')
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class SaasPortalSubscriptionController {
  constructor(private readonly subscriptionService: SaasPortalSubscriptionService) {}

  /* ── Subscription ───────────────────────────────── */

  @ApiOperation({ summary: 'Get current subscription' })
  @Permissions('saas.subscription.read')
  @Get()
  async getCurrentSubscription(@Req() req: AuthenticatedRequest) {
    return this.subscriptionService.getCurrentSubscription(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Get current plan + usage' })
  @Permissions('saas.subscription.read')
  @Get('current-plan')
  async getCurrentPlan(@Req() req: AuthenticatedRequest) {
    return this.subscriptionService.getCurrentPlan(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Get available plans' })
  @Permissions('saas.subscription.read')
  @Get('available-plans')
  async getAvailablePlans() {
    return this.subscriptionService.getAvailablePlans();
  }

  @ApiOperation({ summary: 'Change plan' })
  @Permissions('saas.subscription.change')
  @Post('change-plan')
  @TrackChanges('TenantSubscription')
  @UseInterceptors(ChangeHistoryInterceptor)
  async changePlan(@Req() req: AuthenticatedRequest, @ZodBody(changePlanSchema) body: z.infer<typeof changePlanSchema>) {
    return this.subscriptionService.changePlan(req.user.tenantId, body.planId);
  }

  @ApiOperation({ summary: 'Update seats [Admin]' })
  @Permissions('admin.subscription.update')
  @Post('seats')
  @TrackChanges('TenantSubscription')
  @UseInterceptors(ChangeHistoryInterceptor)
  async updateSeats(@Req() req: AuthenticatedRequest, @ZodBody(updateSeatsSchema) body: z.infer<typeof updateSeatsSchema>) {
    return this.subscriptionService.updateSeats(req.user.tenantId, body.seats);
  }

  @ApiOperation({ summary: 'Cancel subscription' })
  @Permissions('saas.subscription.cancel')
  @Post('cancel')
  @TrackChanges('TenantSubscription')
  @UseInterceptors(ChangeHistoryInterceptor)
  async cancelSubscription(@Req() req: AuthenticatedRequest) {
    return this.subscriptionService.cancelSubscription(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Get billing (event) history' })
  @Permissions('saas.subscription.read')
  @Get('billing-history')
  async getBillingHistory(@Req() req: AuthenticatedRequest, @Query('page') page?: string, @Query('limit') limit?: string) {
    return this.subscriptionService.getBillingHistory(req.user.tenantId, page ? parseInt(page, 10) : 1, limit ? parseInt(limit, 10) : 20);
  }

  @ApiOperation({ summary: 'Get trial info' })
  @Permissions('saas.subscription.read')
  @Get('trial')
  async getTrialInfo(@Req() req: AuthenticatedRequest) {
    return this.subscriptionService.getTrialInfo(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Validate subscription access' })
  @Permissions('saas.subscription.read')
  @Post('validate')
  async validateSubscriptionAccess(@Req() req: AuthenticatedRequest) {
    return this.subscriptionService.validateSubscriptionAccess(req.user.tenantId);
  }

  /* ── Invoices ───────────────────────────────────── */

  @ApiOperation({ summary: 'List invoices' })
  @Permissions('saas.invoice.read')
  @Get('invoices')
  async listInvoices(@Req() req: AuthenticatedRequest, @Query('page') page?: string, @Query('limit') limit?: string, @Query('status') status?: string) {
    return this.subscriptionService.listInvoices(req.user.tenantId, page ? parseInt(page, 10) : 1, limit ? parseInt(limit, 10) : 20, status);
  }

  @ApiOperation({ summary: 'Get invoice stats' })
  @Permissions('saas.invoice.read')
  @Get('invoices/stats')
  async getInvoiceStats(@Req() req: AuthenticatedRequest) {
    return this.subscriptionService.getInvoiceStats(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Get upcoming (next bill) invoice preview' })
  @Permissions('saas.subscription.read')
  @Get('invoices/upcoming')
  async getUpcomingInvoices(@Req() req: AuthenticatedRequest) {
    return this.subscriptionService.getUpcomingInvoices(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Get invoice' })
  @Permissions('saas.invoice.read')
  @Get('invoices/:id')
  async getInvoice(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.subscriptionService.getInvoice(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Generate invoice' })
  @Permissions('saas.invoice.create')
  @Post('invoices')
  @TrackChanges('SaaSInvoice')
  @UseInterceptors(ChangeHistoryInterceptor)
  async generateInvoice(@Req() req: AuthenticatedRequest, @ZodBody(generateInvoiceSchema) body: z.infer<typeof generateInvoiceSchema>) {
    return this.subscriptionService.generateInvoice(req.user.tenantId, body);
  }

  @ApiOperation({ summary: 'Pay invoice' })
  @Permissions('saas.invoice.pay')
  @Post('invoices/:id/pay')
  @TrackChanges('SaaSInvoice')
  @UseInterceptors(ChangeHistoryInterceptor)
  async payInvoice(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.subscriptionService.payInvoice(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Refund invoice' })
  @Permissions('saas.invoice.pay')
  @Post('invoices/:id/refund')
  @TrackChanges('SaaSInvoice')
  @UseInterceptors(ChangeHistoryInterceptor)
  async refundInvoice(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.subscriptionService.refundInvoice(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Cancel (draft) invoice' })
  @Permissions('saas.invoice.pay')
  @Post('invoices/:id/cancel')
  @TrackChanges('SaaSInvoice')
  @UseInterceptors(ChangeHistoryInterceptor)
  async cancelInvoice(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.subscriptionService.cancelInvoice(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Download invoice PDF' })
  @Permissions('saas.invoice.download')
  @Get('invoices/:id/pdf')
  async downloadInvoicePdf(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.subscriptionService.downloadInvoicePdf(req.user.tenantId, id);
  }
}
