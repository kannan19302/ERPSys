import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { SaasService } from './saas.service';

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
  };
}

@Controller('saas')
export class SaasController {
  constructor(private readonly saasService: SaasService) {}

  @Get('plans')
  async getPlans() {
    return this.saasService.getPlans();
  }

  @Get('subscription')
  @UseGuards(JwtAuthGuard, RbacGuard)
  @Permissions('finance.invoice.read') // Mapping to base billing permissions
  async getSubscription(@Req() req: AuthenticatedRequest) {
    return this.saasService.getSubscription(req.user.tenantId);
  }

  @Get('usage')
  @UseGuards(JwtAuthGuard, RbacGuard)
  @Permissions('finance.invoice.read')
  async getUsage(@Req() req: AuthenticatedRequest) {
    return this.saasService.getUsageRecords(req.user.tenantId);
  }

  @Post('webhooks/stripe')
  async stripeWebhook(@Body() event: any) {
    return this.saasService.handleStripeWebhook(event);
  }
}
