import { Controller, Get, Post, Delete, Param, UseGuards, Req } from '@nestjs/common';
import { z } from 'zod';
import { ZodBody } from '../../common/decorators/zod-body.decorator';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ApiPlatformService } from './api-platform.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
  };
}

@ApiTags('api-platform')
@ApiBearerAuth()
@Controller('admin/api-platform')
@UseGuards(JwtAuthGuard, RbacGuard)
export class ApiPlatformController {
  constructor(private readonly apiPlatformService: ApiPlatformService) {}

  @ApiOperation({ summary: 'Get api keys' })
  @Permissions('api_platform.read')
  @Get('keys')
  @Permissions('admin.api-keys.read')
  async getApiKeys(@Req() req: AuthenticatedRequest) {
    return this.apiPlatformService.getApiKeys(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create api key' })
  @Permissions('api_platform.create')
  @Post('keys')
  @Permissions('admin.api-keys.create')
  async createApiKey(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: { name: string; rateLimit?: number; apiScopes?: string[]; ipWhitelist?: string[] }
  ) {
    return this.apiPlatformService.createApiKey(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: 'Revoke api key' })
  @Permissions('api_platform.delete')
  @Delete('keys/:id')
  @Permissions('admin.api-keys.delete')
  async revokeApiKey(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.apiPlatformService.revokeApiKey(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Get webhook subscriptions' })
  @Permissions('api_platform.read')
  @Get('webhooks')
  @Permissions('admin.webhooks.read')
  async getWebhookSubscriptions(@Req() req: AuthenticatedRequest) {
    return this.apiPlatformService.getWebhookSubscriptions(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create webhook subscription' })
  @Permissions('api_platform.create')
  @Post('webhooks')
  @Permissions('admin.webhooks.create')
  async createWebhookSubscription(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: { name: string; targetUrl: string; events: string[]; secret: string }
  ) {
    return this.apiPlatformService.createWebhookSubscription(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: 'Delete webhook subscription' })
  @Permissions('api_platform.delete')
  @Delete('webhooks/:id')
  @Permissions('admin.webhooks.delete')
  async deleteWebhookSubscription(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.apiPlatformService.deleteWebhookSubscription(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Get webhook delivery logs' })
  @Permissions('api_platform.read')
  @Get('webhooks/logs')
  @Permissions('admin.webhooks.read')
  async getWebhookDeliveryLogs(@Req() req: AuthenticatedRequest) {
    return this.apiPlatformService.getWebhookDeliveryLogs(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Update api key scopes' })
  @Permissions('api_platform.create')
  @Post('keys/:id/scopes')
  @Permissions('admin.api-keys.create')
  async updateApiKeyScopes(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @ZodBody(z.any()) dto: { apiScopes: string[]; ipWhitelist?: string[] }
  ) {
    return this.apiPlatformService.updateApiKeyScopes(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Retry webhook delivery' })
  @Permissions('api_platform.create')
  @Post('webhooks/logs/:id/retry')
  @Permissions('admin.webhooks.create')
  async retryWebhookDelivery(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.apiPlatformService.retryWebhookDelivery(req.user.tenantId, id);
  }
}
