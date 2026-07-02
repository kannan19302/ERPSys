import { Controller, Get, Post, UseGuards, Req } from '@nestjs/common';
import { z } from 'zod';
import { ZodBody } from '../../common/decorators/zod-body.decorator';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { SaasService } from './saas.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
  };
}

@ApiTags('saas')
@ApiBearerAuth()
@Controller('saas')
export class SaasController {
  constructor(private readonly saasService: SaasService) {}

  @ApiOperation({ summary: 'Get plans' })
  @Permissions('saas.read')
  @Get('plans')
  async getPlans() {
    return this.saasService.getPlans();
  }

  @ApiOperation({ summary: 'Get subscription' })
  @Get('subscription')
  @UseGuards(JwtAuthGuard, RbacGuard)
  @Permissions('finance.invoice.read') // Mapping to base billing permissions
  async getSubscription(@Req() req: AuthenticatedRequest) {
    return this.saasService.getSubscription(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Get usage' })
  @Get('usage')
  @UseGuards(JwtAuthGuard, RbacGuard)
  @Permissions('finance.invoice.read')
  async getUsage(@Req() req: AuthenticatedRequest) {
    return this.saasService.getUsageRecords(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Stripe webhook' })
  @Permissions('saas.create')
  @Post('webhooks/stripe')
  async stripeWebhook(@ZodBody(z.any()) event: unknown) {
    return this.saasService.handleStripeWebhook(event as never);
  }

  @ApiOperation({ summary: 'Get installed apps' })
  @Permissions('saas.read')
  @Get('installed-apps')
  @UseGuards(JwtAuthGuard)
  async getInstalledApps(@Req() req: AuthenticatedRequest) {
    return this.saasService.getInstalledApps(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Install app' })
  @Permissions('saas.create')
  @Post('install')
  @UseGuards(JwtAuthGuard)
  async installApp(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) body: { appId: string }) {
    return this.saasService.installApp(req.user.tenantId, body.appId);
  }

  @ApiOperation({ summary: 'Uninstall app' })
  @Permissions('saas.create')
  @Post('uninstall')
  @UseGuards(JwtAuthGuard)
  async uninstallApp(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) body: { appId: string }) {
    return this.saasService.uninstallApp(req.user.tenantId, body.appId);
  }
}
