import { Controller, Get, Post, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ApiPlatformService } from './api-platform.service';

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
  };
}

@Controller('admin/api-platform')
@UseGuards(JwtAuthGuard, RbacGuard)
export class ApiPlatformController {
  constructor(private readonly apiPlatformService: ApiPlatformService) {}

  @Get('keys')
  @Permissions('admin.api-keys.read')
  async getApiKeys(@Req() req: AuthenticatedRequest) {
    return this.apiPlatformService.getApiKeys(req.user.tenantId);
  }

  @Post('keys')
  @Permissions('admin.api-keys.create')
  async createApiKey(
    @Req() req: AuthenticatedRequest,
    @Body() dto: { name: string; rateLimit?: number; apiScopes?: string[]; ipWhitelist?: string[] }
  ) {
    return this.apiPlatformService.createApiKey(req.user.tenantId, dto);
  }

  @Delete('keys/:id')
  @Permissions('admin.api-keys.delete')
  async revokeApiKey(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.apiPlatformService.revokeApiKey(req.user.tenantId, id);
  }

  @Get('webhooks')
  @Permissions('admin.webhooks.read')
  async getWebhookSubscriptions(@Req() req: AuthenticatedRequest) {
    return this.apiPlatformService.getWebhookSubscriptions(req.user.tenantId);
  }

  @Post('webhooks')
  @Permissions('admin.webhooks.create')
  async createWebhookSubscription(
    @Req() req: AuthenticatedRequest,
    @Body() dto: { name: string; targetUrl: string; events: string[]; secret: string }
  ) {
    return this.apiPlatformService.createWebhookSubscription(req.user.tenantId, dto);
  }

  @Delete('webhooks/:id')
  @Permissions('admin.webhooks.delete')
  async deleteWebhookSubscription(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.apiPlatformService.deleteWebhookSubscription(req.user.tenantId, id);
  }

  @Get('webhooks/logs')
  @Permissions('admin.webhooks.read')
  async getWebhookDeliveryLogs(@Req() req: AuthenticatedRequest) {
    return this.apiPlatformService.getWebhookDeliveryLogs(req.user.tenantId);
  }

  @Post('keys/:id/scopes')
  @Permissions('admin.api-keys.create')
  async updateApiKeyScopes(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: { apiScopes: string[]; ipWhitelist?: string[] }
  ) {
    return this.apiPlatformService.updateApiKeyScopes(req.user.tenantId, id, dto);
  }

  @Post('webhooks/logs/:id/retry')
  @Permissions('admin.webhooks.create')
  async retryWebhookDelivery(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.apiPlatformService.retryWebhookDelivery(req.user.tenantId, id);
  }
}
