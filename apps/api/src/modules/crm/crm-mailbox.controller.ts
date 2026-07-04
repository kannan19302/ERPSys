import { Controller, Get, Post, Delete, Param, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ZodBody } from '../../common/decorators/zod-body.decorator';
import {
  CrmMailboxService,
  connectMailboxSchema,
  oauthCallbackSchema,
  ConnectMailboxInput,
  OauthCallbackInput,
} from './crm-mailbox.service';

interface AuthenticatedRequest extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[]; orgId?: string };
}

@ApiTags('crm-mailbox')
@ApiBearerAuth()
@Controller('crm/mailbox-connections')
@UseGuards(JwtAuthGuard, RbacGuard)
export class CrmMailboxController {
  constructor(private readonly svc: CrmMailboxService) {}

  @ApiOperation({ summary: 'List mailbox connections for the current user' })
  @Get()
  @Permissions('crm.mailbox.read')
  async list(@Req() req: AuthenticatedRequest) {
    return this.svc.listConnections(req.user.tenantId, req.user.userId);
  }

  @ApiOperation({ summary: 'Begin OAuth consent flow for a mailbox provider' })
  @Post('connect')
  @Permissions('crm.mailbox.create')
  async connect(@Req() req: AuthenticatedRequest, @ZodBody(connectMailboxSchema) dto: ConnectMailboxInput) {
    return this.svc.buildAuthorizationUrl(req.user.tenantId, req.user.userId, dto);
  }

  @ApiOperation({ summary: 'Handle OAuth callback: exchange code for tokens and store the connection' })
  @Post('callback')
  @Permissions('crm.mailbox.create')
  async callback(@Req() req: AuthenticatedRequest, @ZodBody(oauthCallbackSchema) dto: OauthCallbackInput) {
    return this.svc.handleCallback(req.user.tenantId, req.user.userId, dto);
  }

  @ApiOperation({ summary: 'Disconnect a mailbox' })
  @Delete(':id')
  @Permissions('crm.mailbox.delete')
  async disconnect(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.svc.disconnect(req.user.tenantId, req.user.userId, id);
  }

  @ApiOperation({ summary: 'Manually trigger a sync for a connected mailbox' })
  @Post(':id/sync')
  @Permissions('crm.mailbox.update')
  async syncNow(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.svc.syncNow(req.user.tenantId, req.user.userId, id);
  }
}
