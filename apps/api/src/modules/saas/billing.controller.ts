import { Controller, Get, Post, Body, UseGuards, UseInterceptors, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantInterceptor } from '../../common/guards/tenant.interceptor';
import { BillingService } from './billing.service';

interface AuthReq extends Request { user: { tenantId: string; userId: string } }

@Controller('billing')
@UseGuards(JwtAuthGuard)
@UseInterceptors(TenantInterceptor)
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('subscription')
  async getCurrentSubscription(@Req() req: AuthReq) {
    return this.billingService.getCurrentSubscription(req.user.tenantId);
  }

  @Post('checkout')
  async createCheckout(@Req() req: AuthReq, @Body() body: { planId: string; successUrl: string }) {
    return this.billingService.createCheckoutSession(req.user.tenantId, body.planId, body.successUrl);
  }

  @Post('change-plan')
  async changePlan(@Req() req: AuthReq, @Body() body: { planId: string }) {
    return this.billingService.changePlan(req.user.tenantId, body.planId);
  }

  @Post('cancel')
  async cancelSubscription(@Req() req: AuthReq) {
    return this.billingService.cancelSubscription(req.user.tenantId);
  }

  @Get('usage')
  async getUsage(@Req() req: AuthReq) {
    return this.billingService.getUsageSummary(req.user.tenantId);
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async stripeWebhook(@Body() body: any) {
    return this.billingService.processStripeWebhook(body);
  }
}
