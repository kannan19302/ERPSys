import { Controller, Get, Post, Body, Param, Put, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CommunicationService } from './communication.service';

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
    orgId?: string;
  };
}

@Controller('communication')
@UseGuards(JwtAuthGuard, RbacGuard)
export class CommunicationController {
  constructor(private readonly communicationService: CommunicationService) {}

  @Get('channels')
  @Permissions('communication.channel.read')
  async getChannels(@Req() req: AuthenticatedRequest) {
    return this.communicationService.getChannels(req.user.tenantId);
  }

  @Post('channels')
  @Permissions('communication.channel.create')
  async createChannel(
    @Req() req: AuthenticatedRequest,
    @Body() dto: { name: string; description?: string; type?: string }
  ) {
    const orgId = req.user.orgId || 'org-system-default';
    return this.communicationService.createChannel(req.user.tenantId, orgId, dto, req.user.userId || 'system');
  }

  @Get('channels/:channelId/messages')
  @Permissions('communication.message.read')
  async getMessages(@Req() req: AuthenticatedRequest, @Param('channelId') channelId: string) {
    return this.communicationService.getMessages(req.user.tenantId, channelId);
  }

  @Post('channels/:channelId/messages')
  @Permissions('communication.message.create')
  async createMessage(
    @Req() req: AuthenticatedRequest,
    @Param('channelId') channelId: string,
    @Body() dto: { content: string }
  ) {
    return this.communicationService.createMessage(req.user.tenantId, channelId, dto, req.user.userId || 'system');
  }

  @Get('notifications')
  @Permissions('communication.notification.read')
  async getNotifications(@Req() req: AuthenticatedRequest) {
    return this.communicationService.getNotifications(req.user.tenantId, req.user.userId || 'system');
  }

  @Post('notifications')
  @Permissions('communication.notification.create')
  async createNotification(
    @Req() req: AuthenticatedRequest,
    @Body() dto: { userId: string; title: string; content: string; type?: string; link?: string }
  ) {
    return this.communicationService.createNotification(req.user.tenantId, dto.userId, dto);
  }

  @Put('notifications/:id/status')
  @Permissions('communication.notification.update')
  async updateNotificationStatus(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: { status: 'READ' | 'ARCHIVED' }
  ) {
    return this.communicationService.updateNotificationStatus(req.user.tenantId, id, req.user.userId || 'system', dto.status);
  }

  @Get('email-templates')
  @Permissions('communication.email-template.read')
  async getEmailTemplates(@Req() req: AuthenticatedRequest) {
    return this.communicationService.getEmailTemplates(req.user.tenantId);
  }

  @Post('email-templates')
  @Permissions('communication.email-template.create')
  async createEmailTemplate(
    @Req() req: AuthenticatedRequest,
    @Body() dto: { name: string; subject: string; bodyHtml: string; bodyText?: string }
  ) {
    return this.communicationService.createEmailTemplate(req.user.tenantId, dto, req.user.userId || 'system');
  }
}
